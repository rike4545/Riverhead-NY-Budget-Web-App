#!/usr/bin/env python3
"""Developer helper: convert an original 'Gross Earnings' .xls export into the
slimmed CSV that parse_payroll.py commits and CI reads.

The town publishes gross-earnings as ~160-column .xls workbooks. We keep only
the nine fields the site uses (etl/data/payroll/gross-earnings-<year>.csv),
computing overtime by summing the detailed OT pay-code columns — the same rule
parse_payroll.py applies to CSV exports. Run locally when new years arrive;
xlrd is not needed in CI because the slim CSVs are committed.

Usage: python etl/xls_to_slim.py 2024 "/path/Gross.Earnings.2024.xls" [...]
"""

import csv
import sys
from pathlib import Path

import xlrd

sys.path.insert(0, str(Path(__file__).resolve().parent))
from parse_payroll import find_col, is_overtime_col, money, SLIM_COLUMNS, SLIM_DIR


def convert(year, xls_path):
    sh = xlrd.open_workbook(xls_path).sheet_by_index(0)
    header = [str(sh.cell_value(0, c)).strip() for c in range(sh.ncols)]

    c_name = find_col(header, "payroll", "name") or find_col(header, "name")
    c_dept = find_col(header, "home", "department") or find_col(header, "department", "description")
    c_title = find_col(header, "job", "function") or find_col(header, "title")
    c_class = find_col(header, "pay", "class")
    c_union = find_col(header, "union", "code")
    c_reg = find_col(header, "regular", "earnings")
    c_ot_total = find_col(header, "overtime", "earnings", "total")
    c_gross = find_col(header, "gross", "pay")
    idx = {h: i for i, h in enumerate(header)}
    ot_cols = [c for c in header if is_overtime_col(c)]

    def cell(row, col):
        return sh.cell_value(row, idx[col]) if col and col in idx else ""

    rows = []
    for r in range(1, sh.nrows):
        name = str(cell(r, c_name)).strip()
        if not name or name.lower() == "payroll name":
            continue
        ot_detail = sum(money(cell(r, c)) for c in ot_cols)
        ot = ot_detail if ot_detail > 0 else money(cell(r, c_ot_total))
        rows.append({
            "year": year,
            "name": name,
            "department": str(cell(r, c_dept)).strip(),
            "title": str(cell(r, c_title)).strip(),
            "pay_class": str(cell(r, c_class)).strip(),
            "union": str(cell(r, c_union)).strip(),
            "regular": money(cell(r, c_reg)),
            "overtime": round(ot, 2),
            "gross": money(cell(r, c_gross)),
        })

    SLIM_DIR.mkdir(parents=True, exist_ok=True)
    out = SLIM_DIR / f"gross-earnings-{year}.csv"
    with out.open("w", encoding="utf-8", newline="") as fh:
        w = csv.DictWriter(fh, fieldnames=SLIM_COLUMNS)
        w.writeheader()
        w.writerows(rows)
    total = sum(r["gross"] for r in rows)
    ot_total = sum(r["overtime"] for r in rows)
    print(f"{year}: {len(rows)} employees -> {out.name}  (gross ${total:,.0f}, overtime ${ot_total:,.0f})")


if __name__ == "__main__":
    args = sys.argv[1:]
    for i in range(0, len(args), 2):
        convert(int(args[i]), args[i + 1])
