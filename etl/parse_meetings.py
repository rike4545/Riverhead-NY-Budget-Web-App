#!/usr/bin/env python3
"""Extract the Town Board voting record from meeting minutes.

Each meeting's minutes contain a summary section listing every item the Board
voted on, with the result, who moved and seconded it, and how each member
voted. We turn that into a structured, searchable record.

Handles both minute formats in use:
  2025 (CivicPlus export): "IX. RESOLUTIONS", indented items, "[4 TO 0]"
  2026 (CivicClerk):       "VIII. Resolutions", "[3 - 2]", title-first movers,
                           no attendee roll-call table

The board roster is derived per meeting from the vote lines themselves (with
titles picked up from "Supervisor/Councilman/Councilwoman <Name>" mentions),
so board turnover between years needs no code change.

Input:  etl/data/meetings/*-minutes.txt  (committed for reproducibility)
Output: web/public/data/meetings/index.json + <slug>.json
"""

import json
import re
from collections import Counter, OrderedDict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC_DIR = ROOT / "etl/data/meetings"
OUT = ROOT / "web/public/data/meetings"

FOOTER = re.compile(r"For more information visit our website|www\.townofriverheadn?y?\.gov|Page \d+ of \d+")
FIELD_RE = re.compile(r"^\s*(RESULT|MOVER|SECONDER|AYES|NAYS|ABSTAIN|ABSTAINED|ABSENT|RECUSED)\s*:\s*(.*)$")
ITEM_MARK = r"^[ \t]*\d{1,3}\.[ \t]+\S"
ITEM = re.compile(r"^[ \t]*(\d{1,3})\.[ \t]+(.*)")
RESNUM = re.compile(r"^(\d{4}-\d+)\s+(.*)")
# Section heading like "IX. RESOLUTIONS" / "VIII.  Resolutions" (not "Comments on Resolutions")
RES_HEADING = re.compile(r"^\s*(?:[IVXL]+\.)?\s*Resolutions?\s*$", re.I | re.M)
TITLE_MENTION = re.compile(r"\b(Supervisor|Councilman|Councilwoman|Council member)\s+([A-Z][a-z'’-]+(?:\s+[A-Z][a-z'’-]+)?)")


def clean(s):
    return re.sub(r"\s+", " ", s).strip()


def parse_result(text):
    """Classify a RESULT line -> (adopted, ayes, nays, tag).

    Verdicts seen in the minutes: ADOPTED, NOT ADOPTED, TABLED. Some lines
    carry only the bracket (e.g. 'RESULT: [3 - 2]') because the verdict word
    was lost in PDF text extraction — on a five-member board a majority
    carries, so infer from the counts. Tags: unanimous | split | failed | tabled.
    """
    up = text.upper()
    m = re.search(r"\[(\d+)\s*(?:TO|-|–)\s*(\d+)\]", up)
    ayes = int(m.group(1)) if m else None
    nays = int(m.group(2)) if m else None
    if "UNANIMOUS" in up:
        nays = 0

    if "TABLED" in up or "WITHDRAWN" in up or "POSTPON" in up:
        return False, ayes, nays, "tabled"
    if "NOT ADOPTED" in up or "DEFEATED" in up or "FAILED" in up:
        return False, ayes, nays, "failed"
    if "ADOPTED" in up:
        adopted = True
    elif ayes is not None and nays is not None:
        adopted = ayes > nays
    else:
        adopted = "UNANIMOUS" in up
    tag = "unanimous" if "UNANIMOUS" in up else ("split" if adopted else "failed")
    return adopted, ayes, nays, tag


def clean_person(name):
    """Strip titles: 'Councilman Kenneth Rothwell' / 'Kenneth Rothwell, Councilman' -> 'Kenneth Rothwell'."""
    name = clean(name).split(",")[0]
    return clean(re.sub(r"\b(Supervisor|Councilman|Councilwoman|Council member)\b", "", name))


NON_NAMES = {"None", "All", "N/A", "Na"}


def name_tokens(value):
    """Split a vote-line value into person tokens ('Tim Hubbard' or 'Hubbard')."""
    out = []
    for part in value.split(","):
        part = clean_person(part)
        if not part or part in NON_NAMES:
            continue
        words = part.split()
        if 1 <= len(words) <= 3 and all(w[:1].isupper() for w in words):
            out.append(part)
    return out


def build_roster(raw, resolutions_fields):
    """Derive the board roster (last -> {name, title}) from vote lines + title mentions."""
    counts = Counter()
    full_by_last = {}
    order = []
    for fields in resolutions_fields:
        for key in ("AYES", "NAYS", "ABSTAIN", "ABSTAINED", "ABSENT", "RECUSED"):
            for tok in name_tokens(fields.get(key, "")):
                words = tok.split()
                last = words[-1]
                counts[last] += 1
                if len(words) >= 2:
                    full_by_last.setdefault(last, tok)
                if last not in order:
                    order.append(last)

    if not counts:
        return OrderedDict()
    threshold = max(2, int(len(resolutions_fields) * 0.2))
    lasts = [l for l in order if counts[l] >= threshold]

    titles = {}
    for m in TITLE_MENTION.finditer(raw):
        title, who = m.group(1), m.group(2)
        last = who.split()[-1]
        titles.setdefault(last, "Councilwoman" if title == "Councilwoman" else ("Supervisor" if title == "Supervisor" else "Councilman"))
        if len(who.split()) >= 2:
            full_by_last.setdefault(last, who)

    roster = OrderedDict()
    # Supervisor first, then vote-line order
    lasts.sort(key=lambda l: (titles.get(l) != "Supervisor",))
    for last in lasts:
        roster[last] = {"name": full_by_last.get(last, last), "title": titles.get(last, "Councilmember")}
    return roster


def members_in(text, roster):
    return [last for last in roster if re.search(rf"\b{re.escape(last)}\b", text)]


def parse_meeting(path):
    raw = path.read_text(encoding="utf-8", errors="ignore")

    mtype = "Special Meeting" if re.search(r"Special\s+(Town Board\s+)?Meeting", raw[:600], re.I) else "Regular Meeting"
    date_m = re.search(r"(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+20\d{2}", raw)
    date = date_m.group(0) if date_m else path.stem
    time_m = re.search(r"called to order(?:.{0,60}?)at\s+([\d:]{3,5}\s*[apAP]\.?[mM])", raw)

    # Summary voting section: the standalone "Resolutions" heading .. "Open Comments"
    hm = RES_HEADING.search(raw)
    start = hm.start() if hm else 0
    end = raw.find("Open Comments", start)
    segment = raw[start:end] if end > start else raw[start:]
    segment = "\n".join(ln for ln in segment.split("\n") if not FOOTER.search(ln))

    # Split into item blocks
    idxs = [m.start() for m in re.finditer(ITEM_MARK, segment, re.M)]
    idxs.append(len(segment))
    blocks = []
    for i in range(len(idxs) - 1):
        block = segment[idxs[i]:idxs[i + 1]]
        if "RESULT" in block:
            blocks.append(block)

    # First pass: collect fields per block (with wrapped-line continuation)
    parsed_blocks = []
    for block in blocks:
        first = ITEM.match(block.lstrip("\n").split("\n", 1)[0])
        if not first:
            continue
        seq = int(first.group(1))
        fm = FIELD_RE.search(block)
        head = block[:fm.start()] if fm else block
        head = clean(re.sub(r"^[ \t]*\d{1,3}\.[ \t]+", "", head.strip("\n")))
        rn = RESNUM.match(head)
        res_number, title = (rn.group(1), clean(rn.group(2))) if rn else (None, head)

        fields = {}
        cur = None
        for ln in block.split("\n"):
            fm2 = FIELD_RE.match(ln)
            if fm2:
                cur = fm2.group(1).upper()
                fields[cur] = fm2.group(2).strip()
            elif cur and ln.strip() and not ITEM.match(ln):
                fields[cur] += " " + ln.strip()
        fields = {k: clean(v) for k, v in fields.items()}
        if "RESULT" not in fields:
            continue
        parsed_blocks.append((seq, res_number, title, fields))

    roster = build_roster(raw, [f for _, _, _, f in parsed_blocks])

    resolutions = []
    for seq, res_number, title, fields in parsed_blocks:
        adopted, ayes, nays, tag = parse_result(fields["RESULT"])
        ayes_m = members_in(fields.get("AYES", ""), roster)
        nays_m = members_in(fields.get("NAYS", ""), roster)
        abstain_m = members_in(fields.get("ABSTAIN", "") + " " + fields.get("ABSTAINED", "") + " " + fields.get("RECUSED", ""), roster)
        absent_m = members_in(fields.get("ABSENT", ""), roster)

        # Some minutes write just 'RESULT: ADOPTED' with the roll in AYES/NAYS
        # ('NAYS: None'). With no nays and no abstentions that's a unanimous
        # vote of those present, not a split.
        if tag == "split" and not nays_m and not abstain_m and not nays:
            tag = "unanimous"

        votes = {}
        if tag == "tabled" and not (ayes_m or nays_m):
            pass  # tabled without a roll call — no per-member votes to record
        else:
            for last in roster:
                if last in nays_m:
                    votes[last] = "nay"
                elif last in abstain_m:
                    votes[last] = "abstain"
                elif last in absent_m:
                    votes[last] = "absent"
                elif last in ayes_m:
                    votes[last] = "aye"
                elif tag == "unanimous" and not ayes_m:
                    # unanimous with no explicit roll call recorded
                    votes[last] = "aye"
                else:
                    votes[last] = "absent"

        resolutions.append({
            "seq": seq,
            "number": res_number,
            "title": title,
            "result": fields["RESULT"],
            "adopted": adopted,
            "tag": tag,
            "ayesCount": ayes,
            "naysCount": nays,
            "mover": clean_person(fields.get("MOVER", "")),
            "seconder": clean_person(fields.get("SECONDER", "")),
            "votes": votes,
        })

    return {
        "date": date,
        "type": mtype,
        "calledToOrder": time_m.group(1).upper().replace(".", "") if time_m else None,
        "roster": [{"last": last, **info} for last, info in roster.items()],
        "resolutions": resolutions,
    }


def build():
    OUT.mkdir(parents=True, exist_ok=True)
    index = []
    for path in sorted(SRC_DIR.glob("*-minutes.txt")):
        meeting = parse_meeting(path)
        slug = path.stem.replace("-minutes", "")
        meeting["slug"] = slug
        res = meeting["resolutions"]
        if not res:
            print(f"{slug}: no recorded votes — skipped ({meeting['type']})")
            continue

        unanimous = sum(1 for r in res if r["tag"] == "unanimous")
        contested = sum(1 for r in res if r["tag"] in ("split", "failed") or r["naysCount"])
        failed = sum(1 for r in res if r["tag"] == "failed")
        tabled = sum(1 for r in res if r["tag"] == "tabled")
        tallies = {}
        for member in meeting["roster"]:
            last = member["last"]
            v = [r["votes"].get(last) for r in res]
            tallies[last] = {
                "name": member["name"], "title": member["title"],
                "aye": v.count("aye"), "nay": v.count("nay"),
                "abstain": v.count("abstain"), "absent": v.count("absent"),
                "moved": sum(1 for r in res if r["mover"] and last in r["mover"]),
                "seconded": sum(1 for r in res if r["seconder"] and last in r["seconder"]),
            }
        meeting["stats"] = {"total": len(res), "unanimous": unanimous, "contested": contested, "failed": failed, "tabled": tabled}
        meeting["memberTallies"] = tallies

        (OUT / f"{slug}.json").write_text(json.dumps(meeting, indent=1))
        index.append({
            "slug": slug, "date": meeting["date"], "type": meeting["type"],
            "total": len(res), "unanimous": unanimous, "contested": contested, "failed": failed, "tabled": tabled,
        })
        flags = "; ".join(f"#{r['seq']} {r['result']}" for r in res if r["tag"] != "unanimous")
        print(f"{meeting['date']:<22} {len(res):>3} votes | {contested} contested | {failed} failed | {tabled} tabled {('| ' + flags[:80]) if flags else ''}")

    build_member_records(index)

    index.sort(key=lambda m: m["slug"], reverse=True)
    totals = {
        "meetings": len(index),
        "votes": sum(m["total"] for m in index),
        "contested": sum(m["contested"] for m in index),
        "failed": sum(m["failed"] for m in index),
        "tabled": sum(m["tabled"] for m in index),
    }
    (OUT / "index.json").write_text(json.dumps({
        "source": {"title": "Town of Riverhead Town Board Meeting Minutes",
                   "url": "https://www.townofriverheadny.gov/129/Agendas-Minutes"},
        "totals": totals,
        "meetings": index,
    }, indent=1))
    print(f"\n{totals['meetings']} meetings, {totals['votes']} votes ({totals['contested']} contested, {totals['failed']} failed)")


def build_member_records(index_entries):
    """Aggregate each board member's career voting record across all parsed
    meetings into members.json: tallies by year, every dissent and abstention
    with its resolution, and mover/seconder activity.

    Members are keyed by last name across years (fine for this board; two
    different members sharing a last name would need disambiguation)."""
    members = {}
    for entry in sorted(index_entries, key=lambda m: m["slug"]):
        meeting = json.loads((OUT / f"{entry['slug']}.json").read_text())
        year = entry["slug"][:4]
        for member in meeting["roster"]:
            last = member["last"]
            rec = members.setdefault(last, {
                "key": last, "name": member["name"], "titles": [],
                "years": [], "byYear": {}, "career": Counter(),
                "moved": 0, "seconded": 0, "meetingsVoted": 0,
                "dissents": [], "abstentions": [],
            })
            if len(member["name"].split()) >= 2:
                rec["name"] = member["name"]
            if member["title"] not in rec["titles"]:
                rec["titles"].append(member["title"])
            if year not in rec["years"]:
                rec["years"].append(year)
            yc = rec["byYear"].setdefault(year, Counter())
            tally = meeting["memberTallies"][last]
            rec["moved"] += tally["moved"]
            rec["seconded"] += tally["seconded"]
            voted_here = False
            for r in meeting["resolutions"]:
                v = r["votes"].get(last)
                if not v:
                    continue
                yc[v] += 1
                rec["career"][v] += 1
                if v in ("aye", "nay", "abstain"):
                    voted_here = True
                item = {"slug": entry["slug"], "date": meeting["date"],
                        "number": r["number"], "title": r["title"], "result": r["result"]}
                if v == "nay":
                    rec["dissents"].append(item)
                elif v == "abstain":
                    rec["abstentions"].append(item)
            if voted_here:
                rec["meetingsVoted"] += 1

    TITLE_PRIORITY = ["Supervisor", "Councilwoman", "Councilman", "Councilmember"]
    out = []
    for rec in members.values():
        rec["titles"] = sorted(rec["titles"], key=TITLE_PRIORITY.index)[:1]
        career = rec["career"]
        cast = career["aye"] + career["nay"] + career["abstain"]
        out.append({
            **{k: rec[k] for k in ("key", "name", "titles", "years", "moved", "seconded",
                                    "meetingsVoted", "dissents", "abstentions")},
            "byYear": {y: dict(c) for y, c in rec["byYear"].items()},
            "career": dict(career),
            "ayePct": round(career["aye"] / cast * 100, 1) if cast else None,
        })
    # Current board first (active in the latest year), Supervisor on top.
    latest = max((y for m in out for y in m["years"]), default="")
    out.sort(key=lambda m: (latest not in m["years"], "Supervisor" not in m["titles"], m["name"]))

    (OUT / "members.json").write_text(json.dumps({
        "source": {"title": "Town of Riverhead Town Board Meeting Minutes",
                   "url": "https://www.townofriverheadny.gov/129/Agendas-Minutes"},
        "note": "Career voting records aggregated from every meeting on record. 'Absent' is inferred "
                "when a member appears on no roll-call line of a vote.",
        "latestYear": latest,
        "members": out,
    }, indent=1))
    print(f"members.json: {len(out)} members "
          f"({sum(len(m['dissents']) for m in out)} dissents, {sum(len(m['abstentions']) for m in out)} abstentions)")


if __name__ == "__main__":
    build()
