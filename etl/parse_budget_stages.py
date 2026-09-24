#!/usr/bin/env python3
"""Fund-level figures for every budget STAGE the Town has published.

New York Town Law makes the Tentative, Preliminary and Adopted budgets three
different documents, not three drafts of one:

  Tentative   (s.106(2))  the budget officer's recommendation; filed by Sept 30
  Preliminary (s.106(4))  the Tentative plus whatever the Board changes; the
                          public hearing is held on this one (s.108), and it
                          becomes the budget by default if the Board fails to
                          adopt by Nov 20 (s.109(3))
  Adopted     (s.109)     the only stage that appropriates anything

parse_budget_history.py reads adopted budgets only, which is right for a
spending history and useless for the question a resident asks on the day the
Tentative is released: how does this compare, and will it change? This reads
all three, keeps them apart, and records how far each one moved from the last.

Every stage prints the same Summary table -- fund code, name, Appropriations,
Estimated Revenues, Appropriated Fund Balance, Tax Levy -- so one extractor
serves all of them. The layout drifts in small ways between years: zeros print
as a hyphen (a Unicode hyphen in 2024), dollar signs sit before, after or
against the figure, and some names carry doubled spaces. A row with only three
figures cannot say which column is missing, so its levy is left unknown rather
than guessed, and it is excluded from levy comparisons on both sides.

Under the fund rows every budget since 2005 also prints three "Total Town Wide"
rows -- appropriations, tax levy and tax rate per $1,000 of assessed value, each
beside the year before. They cover the General Fund, Highway and Street
Lighting, the funds levied on every parcel in town; the special districts are
outside them. They are kept as printed, so a page can say "the town-wide levy"
and mean the Town's own figure rather than a sum of all nineteen funds.

Reads the documents parse_all_pdfs.py has already committed, so it downloads
nothing and is cheap enough to run inside every deploy.

Input:  web/public/data/financial-reports/{index.json, documents/*.json}
Output: web/public/data/history/budget-stages.json
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
REPORTS = ROOT / "web/public/data/financial-reports"
OUT = ROOT / "web/public/data/history/budget-stages.json"

sys.path.insert(0, str(Path(__file__).resolve().parent))
from parse_all_pdfs import category  # noqa: E402  one categoriser, not two

STAGES = ("tentative", "preliminary", "adopted")
STAGE_OF = {"tentative_budget": "tentative", "preliminary_budget": "preliminary", "adopted_budget": "adopted"}

DASHES = "-‐‑‒–—"
TOKEN = re.compile(r"\(?\d{1,3}(?:,\d{3})+\)?|\(?\d+\)?|[" + DASHES + r"]")
FUND_ROW = re.compile(r"^([A-Z]{1,2}\d{1,2})\s+(.*)$")
FIRST_FIGURE = re.compile(r"\d{1,3}(?:,\d{3})+")

# The budget officer's letter that opens a Tentative. Every Tentative since 2022
# carries one, addressed to the Town Clerk and the Board, and it is the only
# place the document explains itself in words -- including where the levy
# stands against the tax cap. Some years it is text; the 2025 and 2026 letters
# are scanned images with no machine-readable text at all. So a page without
# text is reported as unreadable, never as blank, and nothing is inferred from
# it: the site's reading of a scanned letter is recorded by hand, in
# web/lib/tentative-transparency.ts.
MONTHS = "January|February|March|April|May|June|July|August|September|October|November|December"
DATED = re.compile(rf"\b(?:{MONTHS})\s+\d{{1,2}},\s+\d{{4}}\b")
SENTENCE = re.compile(r"(?<=[.!?])\s+(?=[A-Z\u201c\"(])")  # "3.31%" never splits
TAX_CAP = re.compile(r"\btax\s+cap\b", re.I)
LEVY_LIMIT = re.compile(r"\b(?:tax\s+levy\s+limit|levy\s+limit|allowable\s+levy)\b", re.I)
PROSE_WORDS = 60  # a letter page; the contents page and fund tables carry far fewer words of prose

TOWN_WIDE_ROW = re.compile(r"^total\s+town\s+wide\b(.*)$", re.I)
RATE_HEADER = re.compile(r"rate\s*/\s*\$?1,?000", re.I)
MONEY = re.compile(r"\(?\d{1,3}(?:,\d{3})+(?:\.\d{2})?\)?")
RATE = re.compile(r"\(?\d+\.\d{3}\)?")


def value(tok: str) -> int:
    if tok in DASHES:
        return 0
    n = int(tok.strip("()").replace(",", ""))
    return -n if tok.startswith("(") else n


def summary(doc_path: Path) -> dict:
    """The first Summary-table row for each fund in one budget document."""
    doc = json.loads(doc_path.read_text(encoding="utf-8"))
    funds: dict = {}
    for page in doc.get("pages", []):
        for raw in (page.get("text") or "").split("\n"):
            m = FUND_ROW.match(raw.strip())
            if not m or m.group(1) in funds:
                continue
            rest = m.group(2).replace("$", " ")
            if "%" in rest:  # the year-over-year comparison tables below it
                continue
            first = FIRST_FIGURE.search(rest)
            if not first:
                continue
            toks = TOKEN.findall(rest[first.start():])
            if len(toks) < 3:  # a contents-page line carries one page number
                continue
            vals = [value(t) for t in toks[:4]]
            name = re.sub(r"\s+", " ", rest[: first.start()]).strip(" -‐")
            funds[m.group(1)] = {
                "name": name,
                "appropriations": vals[0],
                "revenues": vals[1] if len(vals) == 4 else None,
                "fundBalance": vals[2] if len(vals) == 4 else None,
                "levy": vals[3] if len(vals) == 4 else None,
            }
    return funds


def town_wide(doc_path: Path) -> dict | None:
    """The Summary's three "Total Town Wide" rows, as printed, or None.

    The two dollar rows are appropriations and levy in either order (the 2005-08
    books print the levy first), and a levy can never exceed its appropriations,
    so the larger is appropriations. The rate row is the one in thousandths, and
    the fund rows above it in the same table give each fund's own rate, where the
    fund codes are the current ones (2019 on).
    """
    doc = json.loads(doc_path.read_text(encoding="utf-8"))
    money: list = []
    rates: list = []
    fund_rates: dict = {}
    in_rates = False
    for page in doc.get("pages", []):
        for raw in (page.get("text") or "").split("\n"):
            line = raw.replace("\xa0", " ").strip()
            if RATE_HEADER.search(line):
                in_rates = True
                continue
            m = TOWN_WIDE_ROW.match(line)
            if m:
                rest = m.group(1).replace("$", " ")
                figures = MONEY.findall(rest)
                if len(figures) >= 2:
                    money.append([round(float(f.strip("()").replace(",", ""))) for f in figures[:2]])
                    continue
                figures = RATE.findall(rest)
                if len(figures) >= 2:
                    rates.append([float(f.strip("()")) for f in figures[:2]])
                    in_rates = False
                continue
            row = FUND_ROW.match(line) if in_rates else None
            if row and not MONEY.search(row.group(2)):
                figures = RATE.findall(row.group(2).replace("$", " "))
                if len(figures) >= 2:
                    fund_rates.setdefault(row.group(1), {"rate": float(figures[0].strip("()")), "priorRate": float(figures[1].strip("()"))})
    if len(money) < 2 or not rates:
        return None
    approp, levy = sorted(money[:2], key=lambda row: row[0], reverse=True)
    out = {
        "appropriations": approp[0], "priorAppropriations": approp[1],
        "levy": levy[0], "priorLevy": levy[1],
        "rate": rates[0][0], "priorRate": rates[0][1],
    }
    if fund_rates:
        out["fundRates"] = fund_rates
    return out


def message(doc_path: Path) -> dict:
    """What a Tentative's opening pages say, where they can be read at all."""
    doc = json.loads(doc_path.read_text(encoding="utf-8"))
    pages = doc.get("pages", [])
    opening = []
    for p in pages[1:8]:  # after the cover, up to the table of contents
        if "TABLE OF CONTENTS" in (p.get("text") or "").upper():
            break
        opening.append(p)
    readable = [p for p in opening if len(re.findall(r"[A-Za-z]{3,}", p.get("text") or "")) >= PROSE_WORDS]
    prose = " ".join(re.sub(r"\s+", " ", p["text"]).strip() for p in readable)
    sentences = [x.strip() for x in SENTENCE.split(prose) if TAX_CAP.search(x)]
    dated = DATED.search(prose)
    limit = next((p["page"] for p in pages if LEVY_LIMIT.search(p.get("text") or "")), None)
    return {
        "readablePages": [p["page"] for p in readable],
        "unreadablePages": [p["page"] for p in opening if not (p.get("text") or "").strip()],
        "taxCapSentences": sentences[:3],
        "dated": dated.group(0) if dated else None,
        "levyLimitPage": limit,
    }


def totals(funds: dict) -> dict:
    known = [f for f in funds.values() if f["levy"] is not None]
    return {
        "funds": len(funds),
        "appropriations": sum(f["appropriations"] for f in funds.values()),
        "levy": sum(f["levy"] for f in known),
        "fundBalance": sum(f["fundBalance"] for f in known),
        "fundsWithoutLevyColumn": sorted(k for k, f in funds.items() if f["levy"] is None),
    }


def transition(year: int, a: str, A: dict, b: str, B: dict) -> dict:
    """How far one stage moved from the one before it, fund by fund.

    Only funds present in both are compared, and levy only where both rows
    carry a levy column, so a layout difference never reads as a change.
    """
    common = sorted(set(A) & set(B))
    lev = [f for f in common if A[f]["levy"] is not None and B[f]["levy"] is not None]
    changed = []
    for f in common:
        da = B[f]["appropriations"] - A[f]["appropriations"]
        dl = (B[f]["levy"] - A[f]["levy"]) if f in lev else 0
        if da or dl:
            changed.append({"fund": f, "name": B[f]["name"], "appropriationsDelta": da, "levyDelta": dl})
    ta = sum(A[f]["appropriations"] for f in common)
    tb = sum(B[f]["appropriations"] for f in common)
    la = sum(A[f]["levy"] for f in lev)
    lb = sum(B[f]["levy"] for f in lev)
    return {
        "year": year, "from": a, "to": b,
        "fundsCompared": len(common), "fundsChanged": len(changed),
        "appropriations": {"from": ta, "to": tb, "delta": tb - ta},
        "levy": {"from": la, "to": lb, "delta": lb - la},
        "changed": changed,
    }


def build() -> dict:
    index = json.loads((REPORTS / "index.json").read_text(encoding="utf-8"))
    chosen: dict = {}
    seen_hashes: set = set()
    for d in index.get("documents", []):
        stage = STAGE_OF.get(category(d.get("title") or ""))
        year = d.get("year")
        if not stage or not year:
            continue
        # One file linked twice under two titles is one document.
        if d.get("sha256") in seen_hashes:
            continue
        path = REPORTS / (d.get("json") or f"documents/{d['slug']}.json")
        if not path.exists():
            continue
        seen_hashes.add(d.get("sha256"))
        chosen.setdefault((year, stage), []).append((d, path))

    years: dict = {}
    documents = []
    for (year, stage), found in sorted(chosen.items()):
        # The first file under a stage's title whose Summary page can be read.
        # A budget message or a presentation posted beside the budget carries
        # the same title words and no Summary; taken first, it would leave the
        # budget itself unread.
        for d, path in found:
            funds = summary(path)
            if funds:
                break
        else:
            continue
        entry = {
            # parsed_at is content-addressed: it is set when this exact file is
            # first parsed and moves only if the Town replaces it, so for a new
            # document it bounds when the file became public, to within a run.
            "source": {"title": d["title"], "url": d["url"], "slug": d["slug"], "parsedAt": d.get("parsed_at")},
            "funds": funds,
            "totals": totals(funds),
        }
        tw = town_wide(path)
        if tw:
            entry["townWide"] = tw
        if stage == "tentative":
            entry["message"] = message(path)
        years.setdefault(str(year), {})[stage] = entry
        documents.append({"year": year, "stage": stage, "title": d["title"], "url": d["url"]})

    transitions = []
    for y, stages in sorted(years.items()):
        present = [s for s in STAGES if s in stages]
        pairs = list(zip(present, present[1:]))
        if "tentative" in stages and "adopted" in stages and ("tentative", "adopted") not in pairs:
            pairs.append(("tentative", "adopted"))
        for a, b in pairs:
            transitions.append(transition(int(y), a, stages[a]["funds"], b, stages[b]["funds"]))

    general_fund = [
        {"year": int(y), "stage": s, **{k: v for k, v in st["funds"]["A01"].items() if k != "name"}}
        for y, stages in sorted(years.items()) for s, st in stages.items() if "A01" in st["funds"]
    ]

    ta = [t for t in transitions if t["from"] == "tentative" and t["to"] == "adopted"]
    return {
        "note": (
            "Fund-level Summary-table figures for each budget stage the Town has published, "
            "kept apart by stage. Totals sum the Town's own fund rows and include interfund "
            "items such as debt service and internal service funds, so they compare stages "
            "rather than state what the Town spends."
        ),
        "stages": list(STAGES),
        "documents": documents,
        "years": years,
        "transitions": transitions,
        "generalFund": general_fund,
        "tentativeToAdopted": {
            "years": [t["year"] for t in ta],
            "unchangedYears": [t["year"] for t in ta if t["fundsChanged"] == 0],
        },
    }


if __name__ == "__main__":
    payload = build()
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, separators=(",", ":")), encoding="utf-8")
    stages_by_year = {y: sorted(s) for y, s in payload["years"].items()}
    print(f"budget stages: {len(payload['documents'])} documents across {len(payload['years'])} years")
    for y, s in sorted(stages_by_year.items()):
        print(f"  {y}: {', '.join(s)}")
    for t in payload["transitions"]:
        print(f"  {t['year']} {t['from']:>11} -> {t['to']:<11} funds {t['fundsCompared']:>2} changed {t['fundsChanged']:>2}"
              f"  approp {t['appropriations']['delta']:+,}  levy {t['levy']['delta']:+,}")
