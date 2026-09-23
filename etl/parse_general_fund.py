#!/usr/bin/env python3
"""Build the long-run General Fund history (appropriations, estimated revenues,
appropriated fund balance, tax levy) from the Town's adopted budgets.

2005-2025 come from riverhead_general_fund_2005_2025.csv (one adopted General
Fund row per year; a copy is kept in etl/data/ for reproducible CI builds).
Every adopted year after that comes from the Town's own Summary page, as
parse_budget_stages.py reads it into budget-stages.json, so a new Adopted
Budget joins the history the day it is parsed, with no edit here. Where both
sources cover a year they must agree to the dollar, and a disagreement stops the
build rather than publishing either -- except for a year listed in
CORRECTED_BY_SUMMARY, where the Summary page has been checked and is used.

Output: web/public/data/history/general-fund.json
"""

import csv
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
COMMITTED = ROOT / "etl/data/general_fund_2005_2025.csv"
SOURCE_DIRS = [
    Path("/Users/bryan/Desktop/App Development/Riverhead NY Budget App/Riverhead NY Budget App"),
    ROOT.parent / "Riverhead NY Budget App",
]
OUT = ROOT / "web/public/data/history"
STAGES = ROOT / "web/public/data/history/budget-stages.json"  # parse_budget_stages.py runs first
FIELDS = (("appropriations", "appropriations"), ("estimatedRevenues", "revenues"),
          ("appropriatedFundBalance", "fundBalance"), ("taxLevy", "levy"))
# Years where the spreadsheet disagrees with the Town's own Summary page and the
# Summary is right. 2021: the posted 2021 Adopted Budget (Summary, p. 6) and the
# 2022 Adopted Budget's prior-year column both print General Fund appropriations
# of $51,050,700; the spreadsheet's $52,007,600 appears in no Town document on file.
CORRECTED_BY_SUMMARY = {2021}


def source_csv():
    if COMMITTED.exists():
        return COMMITTED
    for d in SOURCE_DIRS:
        p = d / "riverhead_general_fund_2005_2025.csv"
        if p.exists():
            return p
    raise FileNotFoundError("General Fund CSV not found")


def num(v):
    v = (v or "").strip().replace(",", "").replace("$", "")
    if not v:
        return None
    try:
        return int(round(float(v)))
    except ValueError:
        return None


def adopted_from_stages(have: dict):
    """General Fund rows for adopted years the CSV doesn't carry, from each Summary page.

    Also corrects, in place, a CSV year listed in CORRECTED_BY_SUMMARY. Returns
    the added rows and the corrected years.
    """
    if not STAGES.exists():
        return [], []
    years = json.loads(STAGES.read_text(encoding="utf-8")).get("years", {})
    added, corrected = [], []
    for y in sorted(years, key=int):
        doc = (years[y] or {}).get("adopted")
        gf = (doc or {}).get("funds", {}).get("A01")
        if not gf:
            continue
        row = {k: gf.get(src) for k, src in FIELDS}
        year = int(y)
        if year in have:
            off = {k: (have[year][k], row[k]) for k, _ in FIELDS if row[k] is not None and have[year][k] != row[k]}
            if off and year not in CORRECTED_BY_SUMMARY:
                raise SystemExit(f"General Fund {year}: the CSV and the {doc['source']['title']} Summary disagree: {off}")
            if off:
                have[year].update({**row, "source": doc["source"]["title"]})
                corrected.append(year)
                print(f"General Fund {year}: corrected to the {doc['source']['title']} Summary: {off}")
            continue
        added.append({"year": year, **row, "source": doc["source"]["title"], "status": "Adopted"})
    return added, corrected


def build():
    src = source_csv()
    rows = []
    with src.open(encoding="utf-8-sig", newline="") as fh:
        for r in csv.DictReader(fh):
            year = num(r.get("year"))
            if not year:
                continue
            rows.append({
                "year": year,
                "appropriations": num(r.get("appropriations")),
                "estimatedRevenues": num(r.get("estimated_revenues")),
                "appropriatedFundBalance": num(r.get("appropriated_fund_balance")),
                "taxLevy": num(r.get("tax_levy")),
                "source": (r.get("source_doc") or "").strip(),
                "status": (r.get("status") or "").strip(),
            })
    added, corrected = adopted_from_stages({r["year"]: r for r in rows})
    rows.extend(added)
    rows.sort(key=lambda x: x["year"])

    # Keep a committed copy for reproducibility.
    if src != COMMITTED:
        COMMITTED.parent.mkdir(parents=True, exist_ok=True)
        COMMITTED.write_bytes(src.read_bytes())

    first, last = rows[0], rows[-1]
    growth = {
        "firstYear": first["year"],
        "lastYear": last["year"],
        "appropriationsChangePct": round((last["appropriations"] - first["appropriations"]) / first["appropriations"] * 100, 1) if first["appropriations"] else None,
        "taxLevyChangePct": round((last["taxLevy"] - first["taxLevy"]) / first["taxLevy"] * 100, 1) if first["taxLevy"] else None,
    }

    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "general-fund.json").write_text(json.dumps({
        "source": {"title": "Town of Riverhead Adopted Budgets (General Fund)", "url": "https://www.townofriverheadny.gov/206/Financial-Reports"},
        "note": "Adopted General Fund figures by year. Some early years are unavailable; the series shows every year with a parsed adopted budget, and adds each new one from the Town’s own Summary page when it is adopted."
                + (f" Corrected to the Town’s Summary page, which the following year’s budget repeats: {', '.join(str(y) for y in corrected)}." if corrected else ""),
        "growth": growth,
        "rows": rows,
    }, indent=1))

    print(f"General Fund history: {len(rows)} years {first['year']}-{last['year']}")
    print(f"  appropriations {first['appropriations']:,} -> {last['appropriations']:,} ({growth['appropriationsChangePct']}%)")
    print(f"  tax levy       {first['taxLevy']:,} -> {last['taxLevy']:,} ({growth['taxLevyChangePct']}%)")


if __name__ == "__main__":
    build()
