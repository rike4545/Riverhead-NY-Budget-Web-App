#!/usr/bin/env python3
"""What the Town Board did to each Tentative before adopting it, 2005 onward.

Every adopted budget the Town has posted prints its stages side by side, line by
line, so the Board's changes can be read straight off the page instead of being
inferred from two separate documents:

  2005-2017   report 140-300 (fund recap) and 160-301 (line detail), columns
              ... DEPT REQD | TENTATIVE | PRELIM | ADOPTED
  2019-2026   account-level detail, columns
              prior year | Dept Requested | Tentative | Preliminary | Adopted
              (2020 and 2021 print "Proposed Preliminary"; 2022 prints no
              Preliminary column at all; 2019 calls the last one "Final")

parse_budget_stages.py compares separately published Tentative and Adopted
documents, which exist only from 2022. This reads the stage columns inside the
adopted books themselves, so it reaches back to 2005 and down to single lines.

What a column is labelled is not always what it was. The 2020 "Proposed
Preliminary" column carries amendments the Board later voted down, and the 2006
Preliminary column prints about $2 million of bond payments as zero that its
Adopted column restores. So the printed label of every column is kept, lines
zeroed in a Preliminary and restored at adoption are counted apart, and the
record of what the Board actually voted on lives in web/lib/budget-adoption.ts,
read from the minutes.

A year's lines are trusted only when they add up to the book's own totals: the
fund recap pages for the older layout, the Summary page for the newer one.
Anything that does not reconcile is published with the gap, not smoothed over.

2018 is the one year with no adopted book posted. Its Tentative is compared with
what the 2019 book reports as the 2018 budget for the three town-wide funds.

Reads the documents parse_all_pdfs.py has already committed; downloads nothing.

Input:  web/public/data/financial-reports/{index.json, documents/*.json}
Output: web/public/data/history/budget-adoption.json
"""

from __future__ import annotations

import json
import re
import sys
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
REPORTS = ROOT / "web/public/data/financial-reports"
OUT = ROOT / "web/public/data/history/budget-adoption.json"

sys.path.insert(0, str(Path(__file__).resolve().parent))
from parse_all_pdfs import category  # noqa: E402
from parse_budget_stages import summary as summary_rows  # noqa: E402  the newer Summary page

FIRST_YEAR = 2005
TOP_N = 10
STAGES = ("tentative", "preliminary", "adopted")

# --- 2005-2017: report 140-300 / 160-301 ------------------------------------
# Figures end in a sign ("1,234+", "56-") and drop thousands separators above a
# million ("1373,830+"), so digits are read with every comma removed.
FIG = r"\d[\d,]*[+-]"
FUND_TOTAL = re.compile(r"FUND\s+(\d{3})\s+(.*?)\s+TOTAL\s+((?:" + FIG + r"\s*){4,6})\s*$")
DETAIL = re.compile(r"^\s*(\d{6})\s+(\d{5})\s+(.*?)\s+((?:" + FIG + r"\s+){6}" + FIG + r")\s*$")
FUND_HEADER = re.compile(r"^\s*(\d{3})\s+FUND\s+-\s+(.*)$")
COST_CENTER = re.compile(r"(\d{6})\s+COST CENTER\s+-\s+(.*)$")


def old_figure(tok: str) -> int:
    n = int(tok[:-1].replace(",", ""))
    return -n if tok.endswith("-") else n


def read_old(doc: dict) -> tuple[dict, list]:
    """Fund recap totals and expenditure detail lines, each as dept/tentative/preliminary/adopted."""
    recap: dict = {}
    lines: list = []
    for page in doc.get("pages", []):
        text = page.get("text") or ""
        if "140-300" in text:
            for raw in text.split("\n"):
                m = FUND_TOTAL.search(raw)
                if m and m.group(1) not in recap:
                    figs = [old_figure(x) for x in re.findall(FIG, m.group(3))][-4:]
                    recap[m.group(1)] = {"name": m.group(2).strip(), **dict(zip(("requested", *STAGES), figs))}
        if "160-301" not in text:
            continue
        fund = cc = cc_name = None
        section = "expenditure"
        for raw in text.split("\n"):
            if (m := FUND_HEADER.match(raw)):
                fund = m.group(1)
            if (m := COST_CENTER.search(raw)):
                cc, cc_name = m.group(1), m.group(2).strip()
            if "R E V E N U E" in raw:
                section = "revenue"
            elif "E X P E N D I T U R E" in raw:
                section = "expenditure"
            m = DETAIL.match(raw)
            if not m or section != "expenditure":
                continue
            figs = [old_figure(x) for x in re.findall(FIG, m.group(4))]
            lines.append({
                "fund": fund, "account": f"{fund}.{cc}.{m.group(1)}",
                "name": f"{(cc_name or '').title()} — {m.group(3).strip().title()}",
                **dict(zip(("requested", *STAGES), figs[3:7])),
            })
    return recap, lines


# --- 2019-2026: stage columns by account ------------------------------------
NORMALISE = str.maketrans({" ": " ", "‐": "-", "‑": "-", "‒": "-", "–": "-", "—": "-"})
ACCOUNT = re.compile(r"^([A-Z]{1,2}\d{1,2}-\d-\d{4}-\d{3}-[A-Z0-9]{3}(?:-\d{5})?)\s+(.*)$")
NUMBER = re.compile(r"^\(?\d{1,3}(?:,\d{3})*(?:\.\d{2})?\)?$|^\(?\d+(?:\.\d{2})?\)?$|^-$")
# Letter-spacing splits figures three ways: "13,534,000.0 0" (2025),
# "235,900. 00" and "28, 900.00" (2020). Each lookahead refuses to join a digit
# that begins the next figure.
SPLIT_DECIMAL = re.compile(r"(\.\d)\s(\d)(?![\d,])")
SPLIT_POINT = re.compile(r"(\d)\.\s(\d{2})(?![\d,])")
SPLIT_COMMA = re.compile(r"(\d),\s+(\d{3})(?=[.,\s]|$)")
LABEL = re.compile(
    r"(Current Budget|Adopted Budget|Dept Requested Budget|Tentative Budget|"
    r"Proposed Preliminary Budget|Preliminary Budget|Final Budget)\s+(\d{4})"
)


def stage_of(label: str, year: int) -> str | None:
    kind, y = label.rsplit(" ", 1)
    if int(y) != year:
        return None  # the prior year's column
    if kind.startswith("Dept"):
        return "requested"
    if kind.startswith("Tentative"):
        return "tentative"
    if "Preliminary" in kind:
        return "preliminary"
    return "adopted"  # "Adopted" or, in 2019, "Final"


def split_figures(rest: str, n: int) -> tuple[str, list[int]] | None:
    """The description and the last n figures of an account line, or None when it carries fewer."""
    rest = SPLIT_COMMA.sub(r"\1,\2", SPLIT_POINT.sub(r"\1.\2", SPLIT_DECIMAL.sub(r"\1\2", rest)))
    toks = rest.replace("$", " ").split()
    tail: list[str] = []
    used = 0
    for tok in reversed(toks):
        if not NUMBER.match(tok) or len(tail) >= n:
            break
        used += 1
        # "00000" is five zero-valued columns printed without spaces.
        tail[0:0] = ["0"] * len(tok) if re.fullmatch(r"0{2,}", tok) else [tok]
    if len(tail) < n:
        return None
    vals = [0 if t == "-" else (-1 if t.startswith("(") else 1) * round(float(t.strip("()").replace(",", ""))) for t in tail[-n:]]
    return " ".join(toks[: len(toks) - used]), vals


def read_new(doc: dict, year: int) -> tuple[dict, list]:
    labels: list = []
    for page in doc.get("pages", []):
        flat = re.sub(r"\s+", " ", (page.get("text") or "").translate(NORMALISE))
        m = re.search(r"Account Description(.{0,240}?)(?=[A-Z]{1,2}\d{1,2}-\d-\d{4})", flat)
        if m:
            labels = [f"{a} {b}" for a, b in LABEL.findall(m.group(1))]
            break
    printed = {s: lab for lab in labels if (s := stage_of(lab, year))}
    columns = [stage_of(lab, year) for lab in labels]
    lines: list = []
    seen: set = set()
    for page in doc.get("pages", []):
        for raw in (page.get("text") or "").translate(NORMALISE).split("\n"):
            m = ACCOUNT.match(raw.strip())
            if not m or m.group(1) in seen:
                continue
            got = split_figures(m.group(2), len(columns))
            if got is None:
                continue  # a heading line; it carries no figures
            seen.add(m.group(1))
            desc, vals = got
            row = {"fund": m.group(1).split("-")[0], "account": m.group(1), "name": re.sub(r"\s+", " ", desc).strip()}
            row.update({c: v for c, v in zip(columns, vals) if c})
            lines.append(row)
    return printed, lines


# --- comparisons -------------------------------------------------------------
def transition(lines: list, a: str, b: str) -> dict:
    moved = [ln for ln in lines if ln.get(a, 0) != ln.get(b, 0)]
    up = sum(ln[b] - ln[a] for ln in moved if ln[b] > ln[a])
    down = sum(ln[b] - ln[a] for ln in moved if ln[b] < ln[a])
    top = sorted(moved, key=lambda ln: -abs(ln[b] - ln[a]))[:TOP_N]
    return {
        "from": a, "to": b, "delta": up + down, "linesChanged": len(moved),
        "increase": up, "decrease": down,
        "largest": [{"fund": ln["fund"], "account": ln["account"], "name": ln["name"][:80],
                     "from": ln[a], "to": ln[b], "delta": ln[b] - ln[a]} for ln in top],
    }


def column_totals(lines: list) -> dict:
    return {s: sum(ln[s] for ln in lines if s in ln) if any(s in ln for ln in lines) else None
            for s in ("requested", *STAGES)}


def by_fund(lines: list, stage: str) -> dict:
    out: dict = defaultdict(int)
    for ln in lines:
        if stage in ln:
            out[ln["fund"]] += ln[stage]
    return out


def reconcile_old(recap: dict, lines: list) -> dict:
    off = []
    for stage in STAGES:
        mine = by_fund(lines, stage)
        for code, f in recap.items():
            if code in mine and mine[code] != f[stage]:
                off.append({"fund": code, "stage": stage, "recap": f[stage], "lines": mine[code]})
    return {"against": "the book's fund recap pages (report 140-300)", "complete": not off, "fundsOff": off[:12]}


def reconcile_new(path: Path, lines: list) -> dict:
    funds = summary_rows(path)
    mine = by_fund(lines, "adopted")
    off = [{"fund": code, "summary": f["appropriations"], "lines": mine.get(code, 0)}
           for code, f in funds.items() if abs(mine.get(code, 0) - f["appropriations"]) >= 1]
    return {"against": "the book's Summary page", "summaryTotal": sum(f["appropriations"] for f in funds.values()),
            "complete": bool(funds) and not off, "fundsOff": off[:12]}


# --- 2018: Tentative only ----------------------------------------------------
OLD_SUMMARY_ROW = re.compile(r"^\s*(\d{3})\s+([A-Z][A-Z .&'-]+?)\s+([\d,]+)\s*\$")
TOWN_WIDE = {"001": "A01", "111": "DA1", "116": "SL1"}


def tentative_2018_check(tent_doc: dict, next_doc: dict | None) -> dict | None:
    """The 2018 Tentative's town-wide funds against what the 2019 book reports as 2018."""
    tent: dict = {}
    for page in tent_doc.get("pages", [])[:6]:
        text = page.get("text") or ""
        if "Appropriations" not in text or "Tax Levy" not in text:
            continue
        for raw in text.split("\n"):
            m = OLD_SUMMARY_ROW.match(raw)
            if m and m.group(1) in TOWN_WIDE:
                toks = re.findall(r"[\d,]{2,}|(?<=\s)-(?=\s)", raw[m.start(3):].replace("$", " "))
                vals = [0 if t == "-" else int(t.replace(",", "")) for t in toks]
                if len(vals) >= 4:
                    tent.setdefault(TOWN_WIDE[m.group(1)], {"appropriations": vals[0], "levy": vals[3]})
        if tent:
            break
    if not tent or not next_doc:
        return None
    reported: dict = {}
    for page in next_doc.get("pages", [])[:8]:
        flat = re.sub(r"[ \t]+", " ", (page.get("text") or "").translate(NORMALISE))
        if "2018" not in flat or "Comparison" not in flat:
            continue
        # Two comparison tables follow the Summary: appropriations, then tax levy.
        parts = re.split(r"Tax\s+Levy\s+2018\s+Tax\s+Levy", flat)
        for key, chunk in (("appropriations", parts[0].split("2018\nAppropriations")[-1]), ("levy", parts[1] if len(parts) > 1 else "")):
            for code in TOWN_WIDE.values():
                m = re.search(rf"^{code}\s+[^\n]*?([\d,]{{4,}})\s*\$?\s+([\d,]{{4,}})", chunk, re.M)
                if m:
                    reported.setdefault(code, {})[key] = int(m.group(2).replace(",", ""))
        if reported:
            break
    rows = []
    for code, t in tent.items():
        r = reported.get(code, {})
        rows.append({"fund": code, "tentativeAppropriations": t["appropriations"], "reportedAppropriations": r.get("appropriations"),
                     "tentativeLevy": t["levy"], "reportedLevy": r.get("levy")})
    same = all(x["tentativeAppropriations"] == x["reportedAppropriations"] and x["tentativeLevy"] == x["reportedLevy"] for x in rows)
    return {"rows": rows, "unchanged": bool(rows) and same}


def documents() -> dict:
    index = json.loads((REPORTS / "index.json").read_text(encoding="utf-8"))
    chosen: dict = {}
    for d in index.get("documents", []):
        cat = category(d.get("title") or "")
        year = d.get("year")
        if cat not in ("adopted_budget", "tentative_budget") or not year or int(year) < FIRST_YEAR:
            continue
        path = REPORTS / (d.get("json") or f"documents/{d['slug']}.json")
        if path.exists():
            chosen.setdefault((int(year), cat), (d, path))
    return chosen


def build() -> dict:
    chosen = documents()
    years: dict = {}
    for year in sorted({y for y, _ in chosen}):
        adopted = chosen.get((year, "adopted_budget"))
        if adopted:
            d, path = adopted
            doc = json.loads(path.read_text(encoding="utf-8"))
            source = {"title": d["title"], "url": d["url"], "slug": d["slug"]}
            if any("140-300" in (p.get("text") or "") for p in doc.get("pages", [])[:40]):
                recap, lines = read_old(doc)
                printed = {"requested": "DEPT REQD", "tentative": "TENTATIVE", "preliminary": "PRELIM", "adopted": "ADOPTED"}
                totals = {s: sum(f[s] for f in recap.values()) for s in ("requested", *STAGES)}
                rec = reconcile_old(recap, lines)
                layout = "recap"
            else:
                printed, lines = read_new(doc, year)
                totals = column_totals(lines)
                rec = reconcile_new(path, lines)
                layout = "stage-columns"
            if not lines:
                continue
            have = [s for s in STAGES if any(s in ln for ln in lines)]
            steps = list(zip(have, have[1:]))
            changes = {f"{a}To{b[0].upper()}{b[1:]}": transition(lines, a, b) for a, b in steps}
            if ("tentative", "adopted") not in steps:
                changes["tentativeToAdopted"] = transition(lines, "tentative", "adopted")
            zeroed = [ln for ln in lines if "preliminary" in ln and ln["preliminary"] == 0 and ln["tentative"] == ln["adopted"] != 0]
            years[str(year)] = {
                "year": year, "layout": layout, "source": source, "printed": printed,
                "lines": len(lines), "totals": totals, "reconciliation": rec, "changes": changes,
                # Lines a Preliminary column prints as zero and the Adopted column restores
                # unchanged: a gap in how the column was produced, not a Board decision.
                "zeroedInPreliminary": {"lines": len(zeroed), "amount": sum(ln["adopted"] for ln in zeroed)} if zeroed else None,
            }
        elif (year, "tentative_budget") in chosen:
            d, path = chosen[(year, "tentative_budget")]
            doc = json.loads(path.read_text(encoding="utf-8"))
            recap, _ = read_old(doc)
            nxt = chosen.get((year + 1, "adopted_budget"))
            check = tentative_2018_check(doc, json.loads(nxt[1].read_text(encoding="utf-8")) if nxt else None)
            years[str(year)] = {
                "year": year, "layout": "tentative-only",
                "source": {"title": d["title"], "url": d["url"], "slug": d["slug"]},
                "totals": {"tentative": sum(f["tentative"] for f in recap.values()) if recap else None},
                "priorYearCheck": check and {**check, "against": nxt[0]["title"]},
            }
    return {
        "note": (
            "Stage columns read from each budget book the Town has posted, 2005 onward. Totals are expenditure "
            "appropriations across every fund in the book, including interfund items, so they compare stages "
            "rather than state what the Town spends. What each column is labelled is kept as printed."
        ),
        "firstYear": FIRST_YEAR,
        "years": years,
    }


if __name__ == "__main__":
    payload = build()
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, separators=(",", ":")), encoding="utf-8")
    print(f"budget adoption: {len(payload['years'])} budget years")
    for y, r in payload["years"].items():
        if r["layout"] == "tentative-only":
            c = r.get("priorYearCheck") or {}
            print(f"  {y}  tentative only; town-wide funds unchanged per {c.get('against')}: {c.get('unchanged')}")
            continue
        t = r["totals"]
        steps = "  ".join(f"{k} {v['delta']:+,} ({v['linesChanged']} lines)" for k, v in r["changes"].items())
        ok = "reconciled" if r["reconciliation"]["complete"] else f"NOT reconciled ({len(r['reconciliation']['fundsOff'])} off)"
        z = f"  zeroed-in-P {r['zeroedInPreliminary']['amount']:,}" if r["zeroedInPreliminary"] else ""
        print(f"  {y}  {r['layout']:13} T {t['tentative']:,}  A {t['adopted']:,}  {ok}{z}\n        {steps}")
