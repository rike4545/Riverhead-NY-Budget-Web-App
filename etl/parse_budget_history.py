#!/usr/bin/env python3
"""Build a multi-year fund-level appropriations history from every adopted
budget Summary page we can parse.

Each adopted budget contains a Summary table:

    A01 General Fund 69,113,159 $   14,998,550 $   1,250,000 $   52,864,609 $

i.e. Fund code, name, Appropriations, Estimated Revenues, Appropriated Fund
Balance, Tax Levy. Older budgets (<=2017) use varied layouts and are skipped
automatically when no clean rows are found.

Output: web/public/data/history/fund-appropriations.json
"""

import json
import re
from collections import OrderedDict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DOCS = ROOT / "web/public/data/financial-reports/documents"
OUT = ROOT / "web/public/data/history"

FUND_NAMES = {
    "A01": "General Fund", "A04": "Police Athletic League", "A06": "Recreation Program Fund",
    "CM1": "Business Improvement District", "CM2": "East Creek Docking Facility",
    "CM4": "Community Preservation Fund", "DA1": "Highway Fund", "ES1": "Riverhead Sewer District",
    "ES3": "Calverton Sewer District", "ES5": "Riverhead Scavenger Waste", "EW1": "Water District",
    "MS1": "Workers Compensation Fund", "MS2": "Risk Retention Fund", "SL1": "Street Lighting District",
    "SM1": "Ambulance District", "SR1": "Refuse and Garbage District", "ST1": "Public Parking District",
    "V01": "Debt Service Fund", "Z14": "Calverton Parks Community Development Agency",
}

# Fund code, name, then 1-4 trailing money columns (appropriations first, tax levy last)
ROW_RE = re.compile(r"^([A-Z]{1,2}\d{1,2})\s+([A-Za-z].*?)\s+([\d,]+)\b")
MONEY_RE = re.compile(r"[\d,]+(?:\.\d+)?")


def clean_money(tok):
    try:
        return float(tok.replace(",", ""))
    except ValueError:
        return None


def parse_summary_row(line):
    m = ROW_RE.match(line)
    if not m:
        return None
    code = m.group(1)
    if code not in FUND_NAMES:
        return None
    # collect all money tokens after the name begins
    rest = line[m.end(2):]
    nums = [clean_money(t) for t in MONEY_RE.findall(rest)]
    nums = [n for n in nums if n is not None]
    if not nums:
        return None
    appropriations = nums[0]
    # NOTE: only the first money column (appropriations) is column-stable across
    # funds and years. Funds with a $0 tax levy print "-" instead of a number, so
    # a "last money token" heuristic mis-reads the levy. We therefore publish only
    # appropriations from the Summary page, which reconciles to the town total.
    if appropriations < 1000:
        return None
    return code, appropriations


def parse_file(path):
    data = json.loads(path.read_text())
    year = data.get("year")
    rows = {}
    for page in data["pages"]:
        head = page["text"][:80].upper()
        if "SUMMARY" not in head:
            continue
        for raw in page["text"].split("\n"):
            parsed = parse_summary_row(raw.strip())
            if parsed:
                code, appro = parsed
                # keep the first clean occurrence per fund
                rows.setdefault(code, {"appropriations": appro})
        if rows:
            break
    return year, rows


def build():
    funds = OrderedDict((c, {"code": c, "name": n, "years": {}}) for c, n in FUND_NAMES.items())
    years_seen = set()
    town_totals = {}

    for path in sorted(DOCS.glob("*adopted-budget*.json")):
        year, rows = parse_file(path)
        if not year or not rows:
            continue
        # require a credible number of funds to trust the layout
        if len(rows) < 10:
            continue
        years_seen.add(year)
        appro_total = 0.0
        for code, vals in rows.items():
            funds[code]["years"][str(year)] = vals
            appro_total += vals["appropriations"]
        town_totals[str(year)] = {
            "appropriations": round(appro_total, 2),
            "fundCount": len(rows),
        }

    years = sorted(years_seen)
    # drop funds that never appear
    fund_list = [f for f in funds.values() if f["years"]]
    for f in fund_list:
        present = sorted(int(y) for y in f["years"])
        first, last = str(present[0]), str(present[-1])
        a0 = f["years"][first]["appropriations"]
        a1 = f["years"][last]["appropriations"]
        f["firstYear"] = present[0]
        f["lastYear"] = present[-1]
        f["totalChange"] = round(a1 - a0, 2)
        f["totalChangePct"] = round((a1 - a0) / a0 * 100, 1) if a0 else None

    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "fund-appropriations.json").write_text(json.dumps({
        "source": {"title": "Town of Riverhead Adopted Budgets (Summary pages)",
                   "url": "https://www.townofriverheadny.gov/206/Financial-Reports"},
        "note": "Fund-level appropriations and tax levy extracted from each adopted budget Summary page. "
                "Years with non-standard layouts are omitted.",
        "years": years,
        "townTotals": town_totals,
        "funds": fund_list,
    }, indent=1))

    print(f"Years parsed: {years}")
    for f in fund_list:
        print(f"  {f['code']}  {f['name']:<40} {len(f['years'])} yrs  "
              f"{f['firstYear']}->{f['lastYear']}  {f.get('totalChangePct')}%")


if __name__ == "__main__":
    build()
