#!/usr/bin/env python3
"""Build the long-run General Fund history (appropriations, estimated revenues,
appropriated fund balance, tax levy) from the Town's adopted budgets, 2005-2025.

Source: riverhead_general_fund_2005_2025.csv (one adopted General Fund row per
year). A copy is kept in etl/data/ for reproducible CI builds.

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
        "note": "Adopted General Fund figures by year. Some early years are unavailable; the series shows every year with a parsed adopted budget.",
        "growth": growth,
        "rows": rows,
    }, indent=1))

    print(f"General Fund history: {len(rows)} years {first['year']}-{last['year']}")
    print(f"  appropriations {first['appropriations']:,} -> {last['appropriations']:,} ({growth['appropriationsChangePct']}%)")
    print(f"  tax levy       {first['taxLevy']:,} -> {last['taxLevy']:,} ({growth['taxLevyChangePct']}%)")


if __name__ == "__main__":
    build()
