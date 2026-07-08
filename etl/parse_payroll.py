#!/usr/bin/env python3
"""Build a SeeThroughNY-style payroll dataset from the Town of Riverhead
"Gross Earnings" reports (actual paid earnings, including overtime, by
employee and year).

All years carry: name, regular earnings, overtime earnings, gross pay, union.
2022+ also carry home department, job function (title), and pay class.

Source CSVs are the original 140-column gross-earnings exports. To keep the
repo self-contained and CI-reproducible, this script writes a slimmed copy of
each year into etl/data/payroll/ and reads from there when the original export
is not available.

Outputs:
  web/public/data/payroll/records.json   compact per-employee rows
  web/public/data/payroll/summary.json   per-year / per-union / per-dept rollups
"""

import csv
import json
import re
from pathlib import Path

try:
    import xlrd  # for the .xls exports (2024, 2025)
except ImportError:
    xlrd = None

ROOT = Path(__file__).resolve().parent.parent
SLIM_DIR = ROOT / "etl/data/payroll"
OUT = ROOT / "web/public/data/payroll"
YEARS = range(2018, 2026)

# Where the original full exports live (developer machine). Optional in CI.
SOURCE_DIRS = [
    Path("/Users/bryan/Desktop/App Development/Riverhead NY Budget App"),
    Path("/Users/bryan/Desktop/App Development/Riverhead NY Budget App/Riverhead NY Budget App"),
    Path("/Users/bryan/Desktop/untitled folder 2"),
    ROOT.parent / "Riverhead NY Budget App",
]

# Buckets that break down the "other pay" beyond base and overtime, keyed on the
# pay-code prefix (the part before " - " or "_"). Anything additive that isn't
# matched here lands in "misc" so the parts always sum back to gross.
CATEGORY_CODES = {
    "longevity": {"LGA", "LGB", "LON", "LGE"},
    "holiday": {"HLN", "HLW", "HOL", "HPD", "N1", "NDN", "NDU", "WIH", "HD"},
    "stipend": {"SR", "S2", "S3", "STA", "K9A", "CCA", "FRF", "VTP", "CSS", "DHR"},
    "buyout": {"B1", "B4", "VT", "BBI", "BBP", "BBS", "BBV", "SBO", "SEV"},
    "retro": {"AJ", "ADJ", "RET", "RIA", "RIQ"},
}
CATEGORY_NAMES = {"Hol Straight Pay": "holiday"}  # columns with no code prefix


def col_code(header):
    return re.split(r"\s+-\s+|_", header.strip(), 1)[0].strip()


def category_of(header):
    if header in CATEGORY_NAMES:
        return CATEGORY_NAMES[header]
    code = col_code(header)
    for cat, codes in CATEGORY_CODES.items():
        if code in codes:
            return cat
    return None


BUCKETS = ["longevity", "holiday", "stipend", "buyout", "retro"]

UNION_LABELS = {
    "PBA": "Police Benevolent Association",
    "SOA": "Superior Officers Association",
    "CSE": "CSEA",
    "CSEA": "CSEA",
    "ELE": "Elected / Appointed",
    "MGT": "Management / Confidential",
    "MGM": "Management / Confidential",
    "HWY": "Highway",
    "TEM": "Temporary / Seasonal",
}

SLIM_COLUMNS = ["year", "name", "department", "title", "pay_class", "union",
                "regular", "overtime", "gross"] + BUCKETS


def money(val):
    if val is None:
        return 0.0
    s = re.sub(r"[^0-9.\-]", "", str(val))
    if s in ("", "-", "."):
        return 0.0
    try:
        return round(float(s), 2)
    except ValueError:
        return 0.0


def find_col(header, *needles):
    for col in header:
        low = col.lower()
        if all(n in low for n in needles):
            return col
    return None


def is_overtime_col(col):
    """True for an overtime pay-code column (O01..O22, FT-Paid OT, OTG, OT-CSEA
    OT, FLSA OT, etc.), but NOT the empty 'Overtime Earnings Total' summary col."""
    low = " " + col.lower().replace("_", " ") + " "
    if "overtime earnings total" in low:
        return False
    return " ot " in low or "overtime" in low or " ot1.5" in low


def source_path(year):
    for d in SOURCE_DIRS:
        for name in (f"Gross Earnings {year}.csv", f"Gross.Earnings.{year}.xls",
                     f"Gross Earnings {year}.xls", f"Gross.Earnings.{year}.csv"):
            p = d / name
            if p.exists():
                return p
    return None


def iter_source(path):
    """Yield (header_list, row_dict) for a .csv or .xls export, uniformly."""
    if path.suffix.lower() == ".xls":
        if not xlrd:
            return
        sh = xlrd.open_workbook(path).sheet_by_index(0)
        header = [str(sh.cell_value(0, c)).strip() for c in range(sh.ncols)]
        for r in range(1, sh.nrows):
            yield header, {header[c]: sh.cell_value(r, c) for c in range(sh.ncols)}
    else:
        with path.open(encoding="utf-8-sig", newline="") as fh:
            reader = csv.DictReader(fh)
            header = reader.fieldnames or []
            for row in reader:
                yield header, row


def parse_source_row(header, r, year, cols, ot_cols, cat_cols):
    name = (str(r.get(cols["name"]) or "")).strip()
    if not name or name.lower() == "payroll name":
        return None
    ot_detail = sum(money(r.get(c)) for c in ot_cols)
    ot = ot_detail if ot_detail > 0 else money(r.get(cols["ot_total"]))
    reg = money(r.get(cols["reg"]))
    gross = money(r.get(cols["gross"]))
    # Named buckets within "other" pay; misc absorbs the remainder so the parts
    # always sum back to gross.
    buckets = {b: 0.0 for b in BUCKETS}
    for cat, colnames in cat_cols.items():
        buckets[cat] = round(sum(money(r.get(c)) for c in colnames), 2)
    return {
        "year": year, "name": name,
        "department": (str(r.get(cols["dept"]) or "")).strip() if cols["dept"] else "",
        "title": (str(r.get(cols["title"]) or "")).strip() if cols["title"] else "",
        "pay_class": (str(r.get(cols["class"]) or "")).strip() if cols["class"] else "",
        "union": (str(r.get(cols["union"]) or "")).strip() if cols["union"] else "",
        "regular": reg, "overtime": round(ot, 2), "gross": gross,
        **buckets,
    }


def read_year(year):
    """Yield normalized rows for a year from the original export or slim copy."""
    src = source_path(year)
    if src:
        first = True
        cols = ot_cols = cat_cols = None
        for header, r in iter_source(src):
            if first:
                cols = {
                    "name": find_col(header, "payroll", "name") or find_col(header, "name"),
                    "dept": find_col(header, "home", "department") or find_col(header, "department", "description"),
                    "title": find_col(header, "job", "function") or find_col(header, "title"),
                    "class": find_col(header, "pay", "class"),
                    "union": find_col(header, "union", "code"),
                    "reg": find_col(header, "regular", "earnings"),
                    "ot_total": find_col(header, "overtime", "earnings", "total"),
                    "gross": find_col(header, "gross", "pay"),
                }
                ot_cols = [c for c in header if is_overtime_col(c)]
                cat_cols = {b: [c for c in header if category_of(c) == b] for b in BUCKETS}
                first = False
            row = parse_source_row(header, r, year, cols, ot_cols, cat_cols)
            if row:
                yield row
        return
    slim = SLIM_DIR / f"gross-earnings-{year}.csv"
    if slim.exists():
        with slim.open(encoding="utf-8", newline="") as fh:
            for r in csv.DictReader(fh):
                name = (r.get("name") or "").strip()
                if not name or name.lower() == "payroll name":
                    continue
                yield {
                    "year": year, "name": name,
                    "department": r.get("department", ""), "title": r.get("title", ""),
                    "pay_class": r.get("pay_class", ""), "union": r.get("union", ""),
                    "regular": money(r.get("regular")), "overtime": money(r.get("overtime")),
                    "gross": money(r.get("gross")),
                    **{b: money(r.get(b)) for b in BUCKETS},
                }


def write_slim(year, rows):
    SLIM_DIR.mkdir(parents=True, exist_ok=True)
    with (SLIM_DIR / f"gross-earnings-{year}.csv").open("w", encoding="utf-8", newline="") as fh:
        w = csv.DictWriter(fh, fieldnames=SLIM_COLUMNS)
        w.writeheader()
        for r in rows:
            w.writerow({k: r[k] for k in SLIM_COLUMNS})


def median(nums):
    s = sorted(nums)
    n = len(s)
    if not n:
        return 0.0
    return s[n // 2] if n % 2 else round((s[n // 2 - 1] + s[n // 2]) / 2, 2)


def build():
    all_rows = []
    per_year = {}
    for year in YEARS:
        rows = list(read_year(year))
        if not rows:
            continue
        write_slim(year, rows)
        all_rows.extend(rows)
        per_year[year] = rows

    # Compact records: short keys keep the payload small for the static site.
    # "k" is the [longevity, holiday, stipend, buyout, retro] breakdown of the
    # pay beyond base and overtime; omitted when the employee has none of it.
    def rec(r):
        d = {
            "y": r["year"], "n": r["name"], "d": r["department"], "t": r["title"],
            "c": r["pay_class"], "u": r["union"],
            "r": r["regular"], "o": r["overtime"], "g": r["gross"],
        }
        k = [round(r.get(b, 0) or 0, 2) for b in BUCKETS]
        if any(k):
            d["k"] = k
        return d
    records = [rec(r) for r in all_rows]

    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "records.json").write_text(json.dumps({
        "source": {"title": "Town of Riverhead Gross Earnings reports", "url": "https://www.townofriverheadny.gov/206/Financial-Reports"},
        "note": "Actual paid earnings (including overtime) by employee and year. Department, title, and pay class are available for 2022 onward.",
        "fields": {"y": "year", "n": "name", "d": "department", "t": "title", "c": "pay class", "u": "union", "r": "regular earnings", "o": "overtime", "g": "gross pay", "k": "[longevity, holiday/differential, stipends, buy-outs, retro] breakdown of other pay"},
        "unionLabels": UNION_LABELS,
        "count": len(records),
        "records": records,
    }, separators=(",", ":")))

    # Per-year summary + leaders.
    years_summary = []
    for year, rows in sorted(per_year.items()):
        gross = [r["gross"] for r in rows]
        ot = [r["overtime"] for r in rows]
        top_gross = sorted(rows, key=lambda r: r["gross"], reverse=True)[:25]
        top_ot = sorted(rows, key=lambda r: r["overtime"], reverse=True)[:25]
        unions = {}
        depts = {}
        for r in rows:
            u = r["union"] or "Unspecified"
            unions.setdefault(u, {"headcount": 0, "gross": 0.0, "overtime": 0.0})
            unions[u]["headcount"] += 1
            unions[u]["gross"] += r["gross"]
            unions[u]["overtime"] += r["overtime"]
            if r["department"]:
                depts.setdefault(r["department"], {"headcount": 0, "gross": 0.0, "overtime": 0.0})
                depts[r["department"]]["headcount"] += 1
                depts[r["department"]]["gross"] += r["gross"]
                depts[r["department"]]["overtime"] += r["overtime"]
        years_summary.append({
            "year": year,
            "headcount": len(rows),
            "totalGross": round(sum(gross), 2),
            "totalRegular": round(sum(r["regular"] for r in rows), 2),
            "totalOvertime": round(sum(ot), 2),
            "avgGross": round(sum(gross) / len(gross), 2),
            "medianGross": median(gross),
            "maxGross": max(gross),
            "hasDepartments": any(r["department"] for r in rows),
            "topEarners": [{"name": r["name"], "title": r["title"], "department": r["department"], "gross": r["gross"], "overtime": r["overtime"]} for r in top_gross],
            "overtimeLeaders": [{"name": r["name"], "title": r["title"], "department": r["department"], "overtime": r["overtime"], "gross": r["gross"]} for r in top_ot],
            "byUnion": [{"union": k, **{kk: round(vv, 2) for kk, vv in v.items()}} for k, v in sorted(unions.items(), key=lambda kv: kv[1]["gross"], reverse=True)],
            "byDepartment": [{"department": k, **{kk: round(vv, 2) for kk, vv in v.items()}} for k, v in sorted(depts.items(), key=lambda kv: kv[1]["gross"], reverse=True)],
        })

    (OUT / "summary.json").write_text(json.dumps({
        "years": [y["year"] for y in years_summary],
        "yearSummaries": years_summary,
    }, separators=(",", ":")))

    print(f"Payroll records: {len(records)} across years {[y['year'] for y in years_summary]}")
    for y in years_summary:
        print(f"  {y['year']}  headcount={y['headcount']:>4}  gross={y['totalGross']:>14,.0f}  "
              f"OT={y['totalOvertime']:>12,.0f}  median={y['medianGross']:>10,.0f}  depts={y['hasDepartments']}")


if __name__ == "__main__":
    build()
