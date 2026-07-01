#!/usr/bin/env python3
"""Extract the Town Board voting record from meeting minutes.

Each meeting's minutes contain a compact summary section listing every item the
Board voted on, with the result, who moved and seconded it, and how each member
voted. We turn that into a structured, searchable record.

Input:  etl/data/meetings/*-minutes.txt  (committed for reproducibility)
Output: web/public/data/meetings/index.json + <slug>.json
"""

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC_DIR = ROOT / "etl/data/meetings"
OUT = ROOT / "web/public/data/meetings"

MEMBERS = [
    ("Hubbard", "Tim Hubbard", "Supervisor"),
    ("Rothwell", "Kenneth Rothwell", "Councilman"),
    ("Kern", "Robert Kern", "Councilman"),
    ("Merrifield", "Denise Merrifield", "Councilwoman"),
    ("Waski", "Joann Waski", "Councilwoman"),
]
LAST_NAMES = [m[0] for m in MEMBERS]

FOOTER = re.compile(r"For more information visit our website|www\.townofriverheadny\.gov")
FIELD = re.compile(r"(RESULT|MOVER|SECONDER|AYES|NAYS|ABSTAIN|ABSENT|ABSTAINED|RECUSED):\s*(.*)")
# Leading indent must be spaces/tabs only — not \s, which would swallow the
# preceding newline and misalign each block.
ITEM_MARK = r"^[ \t]+\d+\.[ \t]"
ITEM = re.compile(r"^[ \t]*(\d+)\.[ \t]+(.*)")
RESNUM = re.compile(r"^(\d{4}-\d+)\s+(.*)")


def clean(s):
    return re.sub(r"\s+", " ", s).strip()


def members_in(text):
    """Return the member last-names mentioned in a vote line."""
    found = []
    for last in LAST_NAMES:
        if re.search(rf"\b{last}\b", text):
            found.append(last)
    return found


def parse_result(text):
    """'ADOPTED [4 TO 1]' -> (adopted, ayes, nays, tag)."""
    up = text.upper()
    adopted = up.startswith("ADOPTED")
    tag = "unanimous" if "UNANIMOUS" in up else ("failed" if not adopted else "split")
    m = re.search(r"\[(\d+)\s+TO\s+(\d+)\]", up)
    ayes = int(m.group(1)) if m else None
    nays = int(m.group(2)) if m else None
    if "UNANIMOUS" in up:
        ayes, nays = ayes if ayes is not None else len(MEMBERS), 0
    return adopted, ayes, nays, tag


def parse_meeting(path):
    raw = path.read_text(encoding="utf-8", errors="ignore")

    # Meeting metadata
    mtype = "Regular Meeting" if "Regular Meeting" in raw else ("Special Meeting" if "Special Meeting" in raw else "Meeting")
    date_m = re.search(r"(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+20\d{2}", raw)
    date = date_m.group(0) if date_m else path.stem
    time_m = re.search(r"called to order at\s+([\d:]+\s*[AP]M)", raw)

    # Isolate the summary voting section: first "RESOLUTIONS" .. first "Open Comments"
    start = raw.find("RESOLUTIONS")
    end = raw.find("Open Comments", start if start >= 0 else 0)
    segment = raw[start:end] if start >= 0 and end > start else raw

    # Drop page footers / blank noise, keep field and item lines intact
    lines = [ln for ln in segment.split("\n") if not FOOTER.search(ln)]
    segment = "\n".join(lines)

    # Split into item blocks on the "<n>. " markers
    resolutions = []
    idxs = [m.start() for m in re.finditer(ITEM_MARK, segment, re.M)]
    idxs.append(len(segment))
    for i in range(len(idxs) - 1):
        block = segment[idxs[i]:idxs[i + 1]]
        first = ITEM.match(block.split("\n", 1)[0] + "")
        if not first:
            continue
        seq = int(first.group(1))

        # Title is everything before the first field label
        fm = FIELD.search(block)
        head = block[:fm.start()] if fm else block
        head = clean(re.sub(r"^\s+\d+\.\s+", "", head))
        rn = RESNUM.match(head)
        res_number, title = (rn.group(1), clean(rn.group(2))) if rn else (None, head)

        # Accumulate fields line by line so wrapped values (e.g. an AYES list that
        # spills onto a second line) are joined rather than truncated.
        fields = {}
        cur = None
        for ln in block.split("\n"):
            fm2 = re.match(r"\s*(RESULT|MOVER|SECONDER|AYES|NAYS|ABSTAIN|ABSENT|ABSTAINED|RECUSED):\s*(.*)", ln)
            if fm2:
                cur = fm2.group(1).upper()
                fields[cur] = fm2.group(2).strip()
            elif cur and ln.strip() and not ITEM.match(ln):
                fields[cur] += " " + ln.strip()
        fields = {k: clean(v) for k, v in fields.items()}
        if "RESULT" not in fields:
            continue

        adopted, ayes, nays, tag = parse_result(fields["RESULT"])
        ayes_m = members_in(fields.get("AYES", ""))
        nays_m = members_in(fields.get("NAYS", ""))
        abstain_m = members_in(fields.get("ABSTAIN", "") + " " + fields.get("ABSTAINED", "") + " " + fields.get("RECUSED", ""))
        absent_m = members_in(fields.get("ABSENT", ""))

        # Per-member vote; unanimous means every member present voted aye
        votes = {}
        for last, _full, _t in MEMBERS:
            if last in nays_m:
                votes[last] = "nay"
            elif last in abstain_m:
                votes[last] = "abstain"
            elif last in absent_m:
                votes[last] = "absent"
            elif last in ayes_m or tag == "unanimous":
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
            "mover": clean(fields.get("MOVER", "").split(",")[0]),
            "seconder": clean(fields.get("SECONDER", "").split(",")[0]),
            "votes": votes,
        })

    return {
        "date": date,
        "type": mtype,
        "calledToOrder": time_m.group(1) if time_m else None,
        "resolutions": resolutions,
    }


def slugify(date):
    months = {m: f"{i+1:02d}" for i, m in enumerate(
        ["January", "February", "March", "April", "May", "June", "July",
         "August", "September", "October", "November", "December"])}
    m = re.match(r"(\w+)\s+(\d{1,2}),\s+(\d{4})", date)
    if m:
        return f"{m.group(3)}-{months[m.group(1)]}-{int(m.group(2)):02d}"
    return re.sub(r"\W+", "-", date.lower())


def build():
    OUT.mkdir(parents=True, exist_ok=True)
    index = []
    for path in sorted(SRC_DIR.glob("*-minutes.txt")):
        meeting = parse_meeting(path)
        slug = slugify(meeting["date"])
        meeting["slug"] = slug
        res = meeting["resolutions"]

        # Meeting-level stats
        unanimous = sum(1 for r in res if r["tag"] == "unanimous")
        contested = sum(1 for r in res if r["tag"] in ("split", "failed") or r["naysCount"])
        failed = sum(1 for r in res if not r["adopted"])
        # Per-member tallies
        tallies = {}
        for last, full, title in MEMBERS:
            v = [r["votes"][last] for r in res]
            tallies[last] = {
                "name": full, "title": title,
                "aye": v.count("aye"), "nay": v.count("nay"),
                "abstain": v.count("abstain"), "absent": v.count("absent"),
                "moved": sum(1 for r in res if r["mover"] and last in r["mover"]),
                "seconded": sum(1 for r in res if r["seconder"] and last in r["seconder"]),
            }
        meeting["stats"] = {
            "total": len(res), "unanimous": unanimous,
            "contested": contested, "failed": failed,
        }
        meeting["memberTallies"] = tallies

        (OUT / f"{slug}.json").write_text(json.dumps(meeting, indent=1))
        index.append({
            "slug": slug, "date": meeting["date"], "type": meeting["type"],
            "total": len(res), "unanimous": unanimous, "contested": contested, "failed": failed,
        })
        print(f"{meeting['date']}: {len(res)} votes | {unanimous} unanimous | {contested} contested | {failed} failed")
        for r in res:
            if r["tag"] != "unanimous":
                print(f"    #{r['seq']} {r['number'] or ''} {r['result']} — {r['title'][:60]}")

    index.sort(key=lambda m: m["slug"], reverse=True)
    (OUT / "index.json").write_text(json.dumps({
        "source": {"title": "Town of Riverhead Town Board Meeting Minutes",
                   "url": "https://www.townofriverheadny.gov/AgendaCenter"},
        "meetings": index,
    }, indent=1))
    print(f"\nWrote {len(index)} meeting(s) to {OUT}")


if __name__ == "__main__":
    build()
