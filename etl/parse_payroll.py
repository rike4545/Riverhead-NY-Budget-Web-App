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
from collections import Counter
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

# Misspellings in the Town's own Gross Earnings source exports, confirmed against
# Suffolk County's official Civil Service title list (e.g. "Superintendant" appears
# nowhere in the county's classified titles; the correct spelling is "Superintendent").
TITLE_CORRECTIONS = {
    "Superintendant": "Superintendent",
    "Specialst": "Specialist",
    "Adminstrator": "Administrator",
}


def normalize_title(title):
    for wrong, right in TITLE_CORRECTIONS.items():
        title = title.replace(wrong, right)
    return title


def name_key(name):
    """Normalized 'Last, First' key for cross-referencing an employee across the
    name-only Gross Earnings exports and the File-Number lookup."""
    return " ".join((name or "").upper().replace(".", "").split())


def load_file_numbers():
    """Map name_key -> File Number from the Town's payroll roster
    (GFZCodeLookup.csv). The Gross Earnings exports carry no employee ID, so this
    is the only way to make the payroll data searchable/cross-referenceable by
    File Number. Committed at etl/data/payroll/gfz-code-lookup.csv for CI."""
    candidates = [SLIM_DIR / "gfz-code-lookup.csv"]
    for base in SOURCE_DIRS:
        candidates.append(base / "GFZCodeLookup.csv")
    for path in candidates:
        if not path.exists():
            continue
        out = {}
        with path.open(encoding="utf-8-sig", newline="") as fh:
            for row in csv.DictReader(fh):
                fn = (row.get("File Number") or "").strip()
                nm = row.get("Payroll Name") or ""
                if fn and nm:
                    out[name_key(nm)] = fn
        if out:
            return out
    return {}


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
                "regular", "overtime", "gross"] + BUCKETS + ["hire_year"]


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


def hire_year(val):
    """Best-effort year from a Hire Date cell: Excel serial (from .xls), a
    MM/DD/YYYY or MM/DD/YY string (from .csv), or anything with a 4-digit year."""
    if val is None or val == "":
        return None
    try:
        f = float(val)
        if f > 20000:  # Excel date serial (days since 1899-12-30)
            from datetime import datetime, timedelta
            return (datetime(1899, 12, 30) + timedelta(days=f)).year
    except (ValueError, TypeError):
        pass
    s = str(val)
    m = re.search(r"\b(19\d{2}|20\d{2})\b", s)
    if m:
        return int(m.group(1))
    m = re.match(r"\s*\d{1,2}[/-]\d{1,2}[/-](\d{2})\b", s)
    if m:
        yy = int(m.group(1))
        return 2000 + yy if yy < 60 else 1900 + yy
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
        "title": normalize_title((str(r.get(cols["title"]) or "")).strip()) if cols["title"] else "",
        "pay_class": (str(r.get(cols["class"]) or "")).strip() if cols["class"] else "",
        "union": (str(r.get(cols["union"]) or "")).strip() if cols["union"] else "",
        "regular": reg, "overtime": round(ot, 2), "gross": gross,
        "hire_year": hire_year(r.get(cols["hire"])) if cols.get("hire") else None,
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
                    "hire": find_col(header, "hire", "date"),
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
                    "department": r.get("department", ""), "title": normalize_title(r.get("title", "")),
                    "pay_class": r.get("pay_class", ""), "union": r.get("union", ""),
                    "regular": money(r.get("regular")), "overtime": money(r.get("overtime")),
                    "gross": money(r.get("gross")),
                    "hire_year": int(r["hire_year"]) if (r.get("hire_year") or "").strip() else None,
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


# Titles whose annual salary must NOT be turned into an hourly rate.
# Elected officials and board members are paid a fixed salary or a per-meeting
# stipend with no defined workweek behind it — dividing a Planning Board
# member's $10,800 by any number of hours invents a wage nobody is paid.
# Sergeants and above are the Superior Officers unit, a separate contract we
# don't hold, so their duty chart's annual days are unknown.
NO_DERIVED_HOURLY = {
    "supervisor", "deputy supervisor", "council member", "town clerk",
    "town justice", "town tax receiver", "superintendent of highways",
    "member of board of assessors", "member of planning board",
    "member of zoning board of appeals", "member of appointed board",
    "police chief iii", "captain police-towns and village",
    "lieutenant police-towns and village", "sergeant police-towns and village",
    "detective sergeant",
}

# The PBA unit — Police Officers and Detectives only (PBA agreement Art. I).
# Art. VIII(A) sets the basic tour at eight hours a day; Art. XIII(B) sets the
# duty chart at 238 work days a year, or 260 for an officer's first 30 months.
PBA_TITLES = {"police officer", "detective"}


# The two regular workweeks in the CSEA agreement (Art. 3(4)(a), Art. 4(2), as
# amended 12/6/25): 35 hours and 40 hours. Riverhead pays both on a 261-workday
# year, so the annual-hours divisors are 261x7 and 261x8.
#
# These are not guesses. The Water District roster is the one department whose
# resolution prints the HOURLY column as well as ANNUAL SALARY, and all 16 of
# its hourly employees divide out to exactly one of these two numbers — the
# clerical titles (Account Clerk, Senior Account Clerk) at 1,827 and the plant,
# meter and crew-leader titles at 2,088.
HOURS_35_WEEK = 1827
HOURS_40_WEEK = 2088

# PBA: 8 hours a day (Art. VIII(A)) across the two duty-chart years in
# Art. XIII(B) — 260 days for an officer's first 30 months, 238 thereafter.
HOURS_PBA_NEW = 2080
HOURS_PBA_REGULAR = 1904

# (more annual hours -> lower rate, so the first of each pair sets hrDerivedMin)
CSEA_BASIS = (HOURS_40_WEEK, "a 40-hour week", HOURS_35_WEEK, "a 35-hour week")
PBA_BASIS = (HOURS_PBA_NEW, "a 260-day year", HOURS_PBA_REGULAR, "a 238-day year")


def _derive_hourly(wage_by_title, reso_source):
    """Bracket an hourly rate for titles whose resolution prints only an annual.

    Every department roster except the Water District leaves the HOURLY column
    blank for full-time staff, and no roster says which workweek or duty chart
    a given title sits on. So rather than pick one and present a single
    fabricated rate, this brackets each title between the two schedules its
    contract allows — the CSEA unit's 35- and 40-hour weeks, or the PBA's
    238- and 260-day duty-chart years.

    Kept in separate hrDerived* fields, never written into hrMin/hrMax: this is
    arithmetic on the annual figure, not a rate the Board authorized, and every
    view labels it that way.
    """
    for tkey, w in wage_by_title.items():
        if w.get("hrMin") or not w.get("annMin") or tkey in NO_DERIVED_HOURLY:
            continue
        lo_hrs, lo_label, hi_hrs, hi_label = PBA_BASIS if tkey in PBA_TITLES else CSEA_BASIS
        w["hrBasisLow"] = lo_hrs
        w["hrBasisHigh"] = hi_hrs
        w["hrLowLabel"] = lo_label
        w["hrHighLabel"] = hi_label
        w["hrDerivedMin"] = round(w["annMin"] / lo_hrs, 4)
        w["hrDerivedMax"] = round((w.get("annMax") or w["annMin"]) / hi_hrs, 4)


# The Town's Gross Earnings export gained Home Department Description, Job
# Function Description and Pay Class in 2022; the 2018-2021 exports simply do
# not contain those columns, so roughly 2,200 records carry no title. Where a
# person held ONE AND ONLY ONE title across every year we can actually observe,
# carrying it back is a defensible inference.
#
# It is still an inference, so two rules apply and neither is negotiable:
#   1. Only fill when the observed values are unanimous. Anyone whose title,
#      department, pay class or union ever changed is skipped for that field —
#      about 8% of staff changed title within the 2022-2025 window alone, and
#      back-filling a promotion would invent a history that never happened.
#   2. Every filled value is flagged in the record's "i" string, so the site can
#      mark it as inferred and any analysis that needs ground truth can drop it.
CARRY_FIELDS = [("department", "d"), ("title", "t"), ("pay_class", "c"), ("union", "u")]


def carry_forward_static_fields(rows, file_numbers):
    """Fill blank department/title/pay_class/union from the same person's other
    years, but only where every observed value agrees. Mutates rows in place,
    setting row["_inferred"] to the short codes filled. Returns a count per field."""
    def identity(row):
        # Prefer the payroll File Number: it survives a name change (three people
        # in this dataset appear under two surnames). Fall back to the normalized
        # name when the lookup has no entry.
        key = name_key(row["name"])
        return file_numbers.get(key) or key

    people = {}
    for row in rows:
        people.setdefault(identity(row), []).append(row)

    counts = {code: 0 for _, code in CARRY_FIELDS}
    skipped = {code: 0 for _, code in CARRY_FIELDS}
    for person_rows in people.values():
        for field, code in CARRY_FIELDS:
            observed = {(r.get(field) or "").strip() for r in person_rows}
            observed.discard("")
            if len(observed) != 1:
                if len(observed) > 1:
                    skipped[code] += 1
                continue
            value = observed.pop()
            for r in person_rows:
                if (r.get(field) or "").strip():
                    continue
                r[field] = value
                r["_inferred"] = r.get("_inferred", "") + code
                counts[code] += 1

    for field, code in CARRY_FIELDS:
        print(f"Carried forward {field}: {counts[code]} records filled, "
              f"{skipped[code]} people skipped (value changed over time)")
    return counts


# A blank union code is the largest remaining hole in the dataset. Pay Class
# often names the bargaining unit outright ("Highway CSEA 8-40", "PBA 8-40"), so
# where a pay class is overwhelmingly associated with one union among the records
# that DO carry a code, that association can fill the blanks.
#
# The mapping is learned from the data rather than hardcoded, so it stays correct
# as the Town's pay classes change. Two thresholds keep it honest, and the mixed
# cases are exactly the ones that must not be guessed: "Police Dept Head" splits
# SOA/NON 12-to-4 and "Elected" splits three ways, so neither qualifies.
PAY_CLASS_UNION_MIN_SAMPLE = 10
PAY_CLASS_UNION_MIN_SHARE = 0.95


def union_from_pay_class(rows):
    """Fill a blank union from the row's own Pay Class, where that pay class maps
    to one union with near-unanimity among labelled records. Mutates rows."""
    observed = {}
    for r in rows:
        pc = (r.get("pay_class") or "").strip()
        u = (r.get("union") or "").strip()
        if pc and u:
            observed.setdefault(pc, Counter())[u] += 1

    mapping = {}
    for pc, dist in observed.items():
        total = sum(dist.values())
        union, n = dist.most_common(1)[0]
        if total >= PAY_CLASS_UNION_MIN_SAMPLE and n / total >= PAY_CLASS_UNION_MIN_SHARE:
            mapping[pc] = (union, n / total, total)

    filled = 0
    for r in rows:
        if (r.get("union") or "").strip():
            continue
        hit = mapping.get((r.get("pay_class") or "").strip())
        if not hit:
            continue
        r["union"] = hit[0]
        if "u" not in r.get("_inferred", ""):
            r["_inferred"] = r.get("_inferred", "") + "u"
        filled += 1

    for pc, (u, share, total) in sorted(mapping.items()):
        print(f"  pay class {pc!r} -> {u} ({share*100:.1f}% of {total} labelled)")
    print(f"Union derived from pay class: {filled} records filled "
          f"({len(observed) - len(mapping)} pay classes too mixed to use)")
    return filled


def build():
    all_rows = []
    per_year = {}
    for year in YEARS:
        raw = list(read_year(year))
        if not raw:
            continue
        write_slim(year, raw)  # keep the full raw export as the committed source
        # Publish only people actually PAID that year. The Gross Earnings report
        # also lists retired, deceased, terminated, and on-leave people who earned
        # $0 during the year — and a rehired name can appear twice (one active row
        # with pay, one retired row at $0). Counting those overstates the workforce
        # and double-counts, so anyone with no earnings for the year is dropped.
        rows = [r for r in raw if (r["gross"] or 0) or (r["regular"] or 0) or (r["overtime"] or 0)]
        all_rows.extend(rows)
        per_year[year] = rows

    # Compact records: short keys keep the payload small for the static site.
    # "k" is the [longevity, holiday, stipend, buyout, retro] breakdown of the
    # pay beyond base and overtime; omitted when the employee has none of it.
    file_numbers = load_file_numbers()

    # Pay-class derivation runs FIRST so the unions it recovers become observed
    # values that carry-forward can then propagate to the person's other years.
    union_from_pay_class(all_rows)
    inferred_counts = carry_forward_static_fields(all_rows, file_numbers)

    def rec(r):
        d = {
            "y": r["year"], "n": r["name"], "d": r["department"], "t": r["title"],
            "c": r["pay_class"], "u": r["union"],
            "r": r["regular"], "o": r["overtime"], "g": r["gross"],
        }
        fn = file_numbers.get(name_key(r["name"]))
        if fn:
            d["f"] = fn
        if r.get("_inferred"):
            d["i"] = r["_inferred"]
        k = [round(r.get(b, 0) or 0, 2) for b in BUCKETS]
        if any(k):
            d["k"] = k
        return d
    records = [rec(r) for r in all_rows]
    matched = sum(1 for x in records if x.get("f"))
    print(f"File Numbers matched: {matched}/{len(records)} records "
          f"({len({x['n'] for x in records if x.get('f')})} distinct employees)")

    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "records.json").write_text(json.dumps({
        "source": {"title": "Town of Riverhead Gross Earnings reports", "url": "https://www.townofriverheadny.gov/206/Financial-Reports"},
        "note": "Actual paid earnings (including overtime) by employee and year. The Town's export only carries department, title, and pay class from 2022 onward; earlier years are blank unless the same person held one unchanging value across every year on record, in which case it is carried back and flagged in \"i\".",
        "fields": {"y": "year", "n": "name", "f": "payroll file number", "d": "department", "t": "title", "c": "pay class", "u": "union", "r": "regular earnings", "o": "overtime", "g": "gross pay", "k": "[longevity, holiday/differential, stipends, buy-outs, retro] breakdown of other pay", "i": "fields carried back from the same person's other years rather than reported for this year (d=department, t=title, c=pay class, u=union)"},
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
        # Turnover vs the prior year: people paid last year but not this year
        # (separations) against last year's paid headcount, and this year's new
        # names (hires). Only when we have the prior year on record.
        prev = per_year.get(year - 1)
        turnover = None
        if prev:
            prev_names = {r["name"] for r in prev}
            cur_names = {r["name"] for r in rows}
            separations = len(prev_names - cur_names)
            turnover = {
                "priorHeadcount": len(prev_names),
                "separations": separations,
                "newHires": len(cur_names - prev_names),
                "ratePct": round(separations / len(prev_names) * 100, 1) if prev_names else None,
            }
        # Average tenure (years) for people whose hire year we know and isn't after
        # the pay year.
        tenures = [year - r["hire_year"] for r in rows if r.get("hire_year") and r["hire_year"] <= year]
        avg_tenure = round(sum(tenures) / len(tenures), 1) if tenures else None

        years_summary.append({
            "year": year,
            "headcount": len(rows),
            "totalGross": round(sum(gross), 2),
            "totalRegular": round(sum(r["regular"] for r in rows), 2),
            "totalOvertime": round(sum(ot), 2),
            "avgGross": round(sum(gross) / len(gross), 2),
            "medianGross": median(gross),
            "maxGross": max(gross),
            "turnover": turnover,
            "avgTenureYears": avg_tenure,
            "tenureKnown": len(tenures),
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

    # Headcount by title and year (for the "Workforce by Title" view — how each
    # job's staffing changes over time). Titles are populated 2022 onward.
    title_years = sorted({r["year"] for r in all_rows if (r["title"] or "").strip()})
    by_title = {}
    for r in all_rows:
        t = (r["title"] or "").strip()
        if not t:
            continue
        by_title.setdefault(t, {}).setdefault(r["year"], set()).add(r["name"])
    titles_out = []
    for t, ym in by_title.items():
        counts = {str(y): len(ym.get(y, set())) for y in title_years}
        nonzero = [counts[str(y)] for y in title_years if counts[str(y)]]
        first, last = (nonzero[0], nonzero[-1]) if nonzero else (0, 0)
        titles_out.append({
            "title": t, "counts": counts,
            "latest": counts[str(title_years[-1])] if title_years else 0,
            "first": first, "last": last, "delta": last - first,
        })
    # Per-title 2026 authorized wage, from the Board's January salary resolutions.
    # The department rosters print an ANNUAL SALARY column and an HOURLY column,
    # but the Town fills the hourly one in only for part-time and per-hour staff
    # — every full-time title in these rosters carries an annual figure and a
    # blank hourly. So this file is annual-only; the hourly rate for those titles
    # is not a published number and must not be invented here.
    # Source: schedule-2026-annual.csv.
    def _tkey(s):
        return " ".join((s or "").lower().split())
    wage_by_title = {}
    sched_path = ROOT / "etl/data/salary/schedule-2026-annual.csv"
    if sched_path.exists():
        raw = {}
        with sched_path.open(encoding="utf-8-sig", newline="") as fh:
            for r in csv.DictReader(fh):
                k = _tkey(r.get("title"))
                if not k:
                    continue
                try:
                    annual = float(r.get("annual") or "")
                except ValueError:
                    annual = None
                raw.setdefault(k, {"h": [], "a": []})
                if annual:
                    raw[k]["a"].append(annual)
        for k, v in raw.items():
            wage_by_title[k] = {
                "n": max(len(v["h"]), len(v["a"])),
                "hrMin": round(min(v["h"]), 4) if v["h"] else None,
                "hrMax": round(max(v["h"]), 4) if v["h"] else None,
                "annMin": round(min(v["a"])) if v["a"] else None,
                "annMax": round(max(v["a"])) if v["a"] else None,
            }
    # Second source: salaries set by separate resolution at the January
    # organizational meeting — elected/appointed officials, seasonal recreation
    # charts, police ranks, and water/sewer titles that aren't in the main
    # salary schedule. This is the actual authorizing resolution, so it TAKES
    # PRECEDENCE over the schedule-derived figures where both exist (e.g. the
    # schedule's $27.00/hr under "Police Officer" is really the P/T rate; the
    # resolution roster gives the full-time officers' authorized salaries).
    def _num(x):
        try:
            return float(x)
        except (TypeError, ValueError):
            return None
    reso_path = ROOT / "etl/data/salary/resolution-salaries-2026.csv"
    reso_source = {}
    if reso_path.exists():
        with reso_path.open(encoding="utf-8-sig", newline="") as fh:
            for r in csv.DictReader(fh):
                k = _tkey(r.get("title"))
                if not k:
                    continue
                hrmin, hrmax = _num(r.get("hr_min")), _num(r.get("hr_max"))
                annmin, annmax = _num(r.get("ann_min")), _num(r.get("ann_max"))
                reso_source[k] = r.get("source") or ""
                wage_by_title[k] = {
                    "n": 0,
                    "hrMin": round(hrmin, 4) if hrmin else None,
                    "hrMax": round(hrmax, 4) if hrmax else None,
                    "annMin": round(annmin) if annmin else None,
                    "annMax": round(annmax) if annmax else None,
                }

    _derive_hourly(wage_by_title, reso_source)

    for t in titles_out:
        w = wage_by_title.get(_tkey(t["title"]))
        if w:
            t["wage2026"] = w
    n_derived = sum(1 for t in titles_out if (t.get("wage2026") or {}).get("hrDerivedMin"))
    print(f"  2026 wages: {sum(1 for t in titles_out if (t.get('wage2026') or {}).get('hrMin'))} "
          f"authorized hourly, {n_derived} derived hourly")

    titles_out.sort(key=lambda x: (-x["latest"], x["title"]))
    (OUT / "titles-by-year.json").write_text(json.dumps({
        "years": title_years,
        "note": "Distinct employees paid under each civil-service title, by year. Titles are available 2022 onward; seasonal and part-time roles (lifeguards, recreation aides, beach attendants) inflate summer headcounts.",
        "source": {"title": "Town of Riverhead Gross Earnings reports", "url": "https://www.townofriverheadny.gov/206/Financial-Reports"},
        "titles": titles_out,
    }, separators=(",", ":")))
    print(f"Titles by year: {len(titles_out)} titles across {title_years}")

    print(f"Payroll records: {len(records)} across years {[y['year'] for y in years_summary]}")
    for y in years_summary:
        print(f"  {y['year']}  headcount={y['headcount']:>4}  gross={y['totalGross']:>14,.0f}  "
              f"OT={y['totalOvertime']:>12,.0f}  median={y['medianGross']:>10,.0f}  depts={y['hasDepartments']}")


if __name__ == "__main__":
    build()
