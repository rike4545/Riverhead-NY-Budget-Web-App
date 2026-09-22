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
        chosen.setdefault((year, stage), (d, path))

    years: dict = {}
    documents = []
    for (year, stage), (d, path) in sorted(chosen.items()):
        funds = summary(path)
        if not funds:
            continue
        years.setdefault(str(year), {})[stage] = {
            "source": {"title": d["title"], "url": d["url"], "slug": d["slug"]},
            "funds": funds,
            "totals": totals(funds),
        }
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
