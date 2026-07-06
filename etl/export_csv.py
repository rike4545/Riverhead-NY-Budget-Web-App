#!/usr/bin/env python3
"""Export the site's structured datasets as CSV files for download.

Journalists, researchers, and residents shouldn't have to scrape our JSON —
every major dataset gets a flat CSV under web/public/downloads/.
"""

import csv
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "web/public/data"
OUT = ROOT / "web/public/downloads"


def load(path):
    p = DATA / path
    return json.loads(p.read_text()) if p.exists() else None


def write(name, header, rows):
    OUT.mkdir(parents=True, exist_ok=True)
    path = OUT / name
    with path.open("w", encoding="utf-8", newline="") as fh:
        w = csv.writer(fh)
        w.writerow(header)
        w.writerows(rows)
    print(f"  {name:<44} {len(rows):>6,} rows  {path.stat().st_size/1024:,.0f} KB")


def build():
    print("Exporting CSVs:")

    # Payroll (actual pay)
    p = load("payroll/records.json")
    if p:
        write("payroll_actual_2018_2023.csv",
              ["year", "name", "department", "title", "pay_class", "union", "regular", "overtime", "gross"],
              [[r["y"], r["n"], r["d"], r["t"], r["c"], r["u"], r["r"], r["o"], r["g"]] for r in p["records"]])

    # Authorized salaries
    for year in (2025, 2026):
        s = load(f"salary/authorized-{year}.json")
        if s:
            write(f"authorized_salary_{year}.csv",
                  ["name", "grade", "title", "department", "group", "annual_salary", "is_stipend"],
                  [[r["name"], r["grade"], r["title"], r["department"], r["group"], r["annual"], r["isStipend"]] for r in s["records"]])

    # Raises
    c = load("salary/comparison-2025-2026.json")
    if c:
        write("salary_raises_2025_to_2026.csv",
              ["name", "title_2025", "title_2026", "group", "annual_2025", "annual_2026", "raise", "raise_pct", "promoted"],
              [[r["name"], r.get("title2025") or "", r["title2026"], r["group"], r.get("annual2025"),
                r["annual2026"], r.get("raise"), r.get("raisePct"), r.get("promoted")] for r in c["records"]])

    # Town Board votes. Member columns are the UNION across meetings — the
    # board roster changes between years (e.g. Hubbard 2025 -> Halpin 2026),
    # so a per-meeting column list would misalign rows.
    idx = load("meetings/index.json")
    if idx:
        meetings = [m2 for m in idx["meetings"] if (m2 := load(f"meetings/{m['slug']}.json"))]
        members = sorted({last for m in meetings for last in m["memberTallies"]})
        rows = []
        for meeting in meetings:
            for r in meeting["resolutions"]:
                rows.append([meeting["date"], r["seq"], r["number"] or "", r["title"], r["result"],
                             r["adopted"], r["mover"], r["seconder"]] + [r["votes"].get(mm, "") for mm in members])
        if rows:
            write("town_board_votes.csv",
                  ["meeting_date", "item", "resolution", "title", "result", "adopted", "mover", "seconder"] + members,
                  rows)

    # Budget line items (2026 adopted, with history)
    si = load("subaccounts/index.json")
    if si:
        rows = []
        for f in si["funds"]:
            fund = load(f"subaccounts/{f['code']}.json")
            if not fund:
                continue
            for dept in fund["departments"]:
                for it in dept["lineItems"]:
                    hist = {str(h["year"]): h["value"] for h in it.get("history", [])}
                    rows.append([fund["code"], fund["name"], dept["code"], dept["name"], it["account"],
                                 it["name"], it["category"]] +
                                [hist.get(str(y), "") for y in range(2020, 2027)])
        write("budget_line_items_2020_2026.csv",
              ["fund_code", "fund", "dept_code", "department", "account", "description", "category",
               "adopted_2020", "adopted_2021", "adopted_2022", "adopted_2023", "adopted_2024", "adopted_2025", "adopted_2026"],
              rows)

    # Fund appropriations history
    h = load("history/fund-appropriations.json")
    if h:
        years = h["years"]
        write("fund_appropriations_2020_2026.csv",
              ["fund_code", "fund"] + [str(y) for y in years],
              [[f["code"], f["name"]] + [f["years"].get(str(y), {}).get("appropriations", "") for y in years]
               for f in h["funds"]])

    # General Fund long-run history
    g = load("history/general-fund.json")
    if g:
        write("general_fund_2005_2025.csv",
              ["year", "appropriations", "estimated_revenues", "appropriated_fund_balance", "tax_levy", "source"],
              [[r["year"], r["appropriations"], r["estimatedRevenues"], r["appropriatedFundBalance"], r["taxLevy"], r["source"]]
               for r in g["rows"]])

    # AFR 2025 actuals per fund
    a = load("afr/2025.json")
    if a:
        rows = []
        for f in a["funds"]:
            for y in ("2025", "2024", "2023"):
                rows.append([f["code"], f["name"], y,
                             (f["revenues"] or {}).get(y, ""), (f["expenditures"] or {}).get(y, ""),
                             (f["surplus"] or {}).get(y, ""), (f["fundBalance"] or {}).get(y, "")])
        write("afr_actual_results_2023_2025.csv",
              ["fund_code", "fund", "year", "revenues_and_sources", "expenditures_and_uses", "surplus", "ending_fund_balance"],
              rows)


if __name__ == "__main__":
    build()
