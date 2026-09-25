"""Multi-year view of every Budget Supplement line, 2020 to the newest.

Each supplement prints the same five columns shifted one year: the actual from
two years back, the prior year's adopted budget and mid-year YTD, and the
current year's request and tentative. Stacking all of them (2020 through 2027)
gives an actual for 2018-2025 and an adopted for 2019-2026 on the same account.

That span is what makes these visible that a single supplement cannot show:

  • cyclical lines — equipment and vehicles that are bought every few years and
    sit at zero in between, so a one-year comparison reads them as either a
    shocking overrun or a dead line depending on which year you catch;
  • lines budgeted well below what they cost in the years they actually happen;
  • lines that ran over budget in each of the last three years and are budgeted
    below what they cost again (chronicUnderBudget);
  • lines budgeted year after year with nothing ever spent from them (unused);
  • account renumberings, where a line stops and an identically-named sibling
    starts. Without detecting these, the old account looks abandoned and the new
    one looks like spending with no budget. Both readings are wrong.

The same parse also writes:

  revenue-history.json   every revenue account, what was collected against what
                         was estimated, for every year the Supplements cover;
  line-history.json      the same for every expenditure account, so a page can
                         quote any line's budget and actual for any year;
  current-lines.json     the newest Supplement, every line, with the previous
                         Supplement's columns beside it (the year-before actual,
                         adopted budget and mid-year figure);
  current-outliers.json  the checks parse_budget_supplement.py runs, on the
  current-reductions.json  newest Supplement. Columns are named by position in
                         the cycle, not by year, so a new Supplement needs no
                         code change.

parse_budget_supplement.py still writes lines/outliers/reductions.json from the
2026 and 2025 Supplements: the iOS app ships those under shared-data/
manifest.json, and their year-named fields are its contract.

Input:  etl/data/supplements/*.pdf  (committed; a year parse_all_pdfs.py has
        downloaded but nobody has committed is copied in from its cache)
Output: web/public/data/budget-supplement/{history,revenue-history,line-history,
        current-lines,current-outliers,current-reductions}.json
"""

from __future__ import annotations

import collections
import json
import re
import shutil
import statistics
import sys
import unicodedata
from pathlib import Path

try:
    import pymupdf as fitz
except ImportError:  # PyMuPDF before 1.24.3 installs only the old name
    import fitz

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "etl/data/supplements"
CACHE = ROOT / ".cache/financial-reports"
REPORTS = ROOT / "web/public/data/financial-reports"
STAGES = ROOT / "web/public/data/history/budget-stages.json"
OUT_DIR = ROOT / "web/public/data/budget-supplement"
OUT = OUT_DIR / "history.json"

sys.path.insert(0, str(Path(__file__).resolve().parent))
from parse_budget_requests import reconcile  # noqa: E402
from parse_budget_supplement import classify_control, confidence  # noqa: E402

DASH = dict.fromkeys(map(ord, "‐‑‒–—"), "-")
# Expenditure accounts. Fund codes carry one or two digits (A01 but DA1, EW1,
# ES1); requiring two had silently left every one-digit fund, Highway, Water,
# Sewer and the districts, out of the history.
ACC = re.compile(r"^[A-Z]{1,3}\d{1,2}-\d-\d{4}-\d{3}-[A-Z0-9]{3}-\d{4,5}$")
# Revenue accounts: fund, revenue code, detail, and a trailing class letter or
# digit (A01-2401-000-00000-G). The revenue code is New York's uniform code.
REV = re.compile(r"^[A-Z]{1,3}\d{1,2}-\d{4}-[A-Z0-9]{3}-\d{5}-[A-Z0-9]$")
# some years print a bare dash for a zero line instead of 0.00
NUM = re.compile(r"^(?:\(?-?[\d,]+(?:\.\d+)?\)?|-)$")

# excluded from every flag below: their variance is obligation or timing rather
# than discretion, and interfund transfers are bookkeeping, not spending.
SKIP = re.compile(
    r"transfer|escrow|fiscal agent|serial bond|bond anticipation|interfund|"
    r"retirement|pension|social security|fica|workers comp|unemployment|debt service",
    re.I,
)
# Also left out of the three-year under-budget test: health-insurance lines
# carry year-end retiree-health (OPEB) accruals in some funds, a paper charge
# that can dwarf the premiums, and depreciation is not spending at all.
ACCRUAL = re.compile(r"hosp|health ins|dental|optical|depreciation|depr -|\bnpl\b", re.I)
# Budget-only placeholders: a debt payment, a planned addition to fund balance
# or a contingency is not "unused" in the way a staff or supply line is.
PLACEHOLDER = re.compile(
    r"bond|\bban\b|debt|principal|interest exp|fund balance|contingen|reserve|transfer|\btrf\b",
    re.I,
)

FUND_NAMES = {
    "A01": "General Fund", "A04": "Police Athletic League",
    "A06": "Recreation Program Fund", "CM1": "Business Improvement District",
    "CM2": "East Creek Docking Facility", "CM4": "Community Preservation Fund",
    "DA1": "Highway Fund", "ES1": "Riverhead Sewer District",
    "ES3": "Calverton Sewer District", "ES5": "Riverhead Scavenger Waste",
    "EW1": "Water District", "MS1": "Workers Compensation Fund",
    "MS2": "Risk Retention Fund", "SL1": "Street Lighting District",
    "SM1": "Ambulance District", "SR1": "Refuse and Garbage District",
    "ST1": "Public Parking District", "V01": "Debt Service Fund",
    "Z14": "Calverton Parks Community Development Agency",
}

# New York's uniform revenue codes, grouped the way the State Comptroller and
# the Town's auditors report revenue. The second segment of a revenue account
# is the code (A01-2401-... is 2401, interest and earnings).
REVENUE_CATEGORIES = [
    ("property-tax", "Property tax levy", 1001, 1001),
    ("tax-items", "Payments in lieu of taxes and tax penalties", 1002, 1099),
    ("non-property-taxes", "Sales, cannabis and franchise taxes", 1100, 1199),
    ("departmental", "Fees and charges for services", 1200, 2199),
    ("intergovernmental", "Charges to other governments", 2200, 2399),
    ("money-and-property", "Interest and rentals", 2400, 2499),
    ("licenses", "Licenses and permits", 2500, 2599),
    ("fines", "Fines and forfeited bail", 2600, 2649),
    ("sales-of-property", "Sales of property and insurance recoveries", 2650, 2699),
    ("miscellaneous", "Refunds, gifts, county aid and other local sources", 2700, 2799),
    ("interfund-revenue", "Charges between Town funds", 2800, 2899),
    ("state-aid", "State aid", 3000, 3999),
    ("federal-aid", "Federal aid", 4000, 4999),
    ("other-sources", "Transfers between funds and borrowing", 5000, 5999),
    ("fund-balance", "Fund balance used", 9999, 9999),
]


def norm(s: str) -> str:
    return unicodedata.normalize("NFKC", s).translate(DASH).replace("\xa0", " ").strip()


def num(s: str):
    s = s.strip()
    if s == "-":
        return 0.0
    neg = s.startswith("(") and s.endswith(")")
    s = s.strip("()").replace(",", "")
    try:
        v = float(s)
    except ValueError:
        return None
    return -v if neg else v


def columns_for(year: int, header: str = "") -> list[str]:
    """The columns a page prints, read from its own header when it has one.

    Most sections print actual, adopted, mid-year, request and Tentative. The
    2021 and 2022 revenue sections leave out the department request, and 2020
    alone adds a Preliminary column at the end; assuming five columns everywhere
    had dropped every revenue line in those two years.
    """
    h = header.lower()
    known = "tentative" in h
    request = "request" in h if known else True
    prelim = "preliminary" in h if known else year == 2020
    cols = [f"actual{year - 2}", f"adopted{year - 1}", f"ytd{year - 1}"]
    cols += [f"request{year}"] if request else []
    cols += [f"tentative{year}"]
    return cols + [f"prelim{year}"] if prelim else cols


def supplement_index() -> list[dict]:
    """The Budget Supplements parse_all_pdfs.py has recorded, newest first."""
    path = REPORTS / "index.json"
    if not path.exists():
        return []
    index = json.loads(path.read_text(encoding="utf-8"))
    docs = [d for d in index.get("documents", [])
            if d.get("category") == "budget_supplement" and d.get("year")]
    return sorted(docs, key=lambda d: -int(d["year"]))


def adopt_cached_supplements() -> list[int]:
    """Copy a downloaded Supplement no one has committed yet into SRC, so the
    history grows when the Town publishes a new one rather than when someone
    remembers to add the file."""
    added = []
    for d in supplement_index():
        year = int(d["year"])
        target = SRC / f"{year}.pdf"
        cached = CACHE / f"{d['slug']}.pdf"
        if target.exists() or not cached.exists():
            continue
        try:
            pages = fitz.open(cached).page_count
        except Exception:  # noqa: BLE001 - a corrupt download is skipped, not fatal
            continue
        if pages < 40:  # a cover or an excerpt, not the Supplement
            continue
        shutil.copyfile(cached, target)
        added.append(year)
    return added


def read_supplement(year: int, panel: dict, latest: int) -> int:
    path = SRC / f"{year}.pdf"
    if not path.exists():
        return 0
    found = 0
    for pno, page in enumerate(fitz.open(path), start=1):
        lines = [norm(l) for l in page.get_text().split("\n")]
        first = next((k for k, l in enumerate(lines) if ACC.match(l) or REV.match(l)), len(lines))
        cols = columns_for(year, " ".join(lines[:first]))
        i = 0
        while i < len(lines):
            kind = "expenditure" if ACC.match(lines[i]) else "revenue" if REV.match(lines[i]) else None
            if kind is None:
                i += 1
                continue
            acct, j, desc = lines[i], i + 1, ""
            while j < len(lines) and j < i + 4:
                if lines[j] and not NUM.match(lines[j]):
                    desc = lines[j]
                    j += 1
                    break
                j += 1
            vals = []
            while j < len(lines) and len(vals) < len(cols):
                t = lines[j]
                if NUM.match(t):
                    vals.append(num(t))
                elif t:
                    break
                j += 1
            if len(vals) == len(cols):
                rec = panel.setdefault(acct, {"account": acct, "kind": kind, "name": desc})
                if desc and (year == latest or not rec.get("name")):
                    rec["name"] = desc  # the newest Supplement's wording
                if year == latest:
                    rec["page"] = pno
                rec.update(dict(zip(cols, vals)))
                found += 1
            i = j
    return found


YEARS: list[int] = []
LATEST = 0
ACTUAL_YEARS: list[int] = []


def actuals(rec: dict) -> dict[int, float]:
    return {y: rec[f"actual{y}"] for y in ACTUAL_YEARS
            if rec.get(f"actual{y}") is not None}


def expenditure(panel: dict):
    return ((a, r) for a, r in panel.items() if r["kind"] == "expenditure")


def find_renumbered(panel: dict) -> list[dict]:
    """A line stops and an identically-named sibling starts."""
    def stem(a):
        p = a.split("-")
        return "-".join(p[:4] + [p[5]])

    def key(n):
        return re.sub(r"\s+", " ", n or "").strip().lower()

    groups = collections.defaultdict(list)
    for acct, rec in expenditure(panel):
        groups[stem(acct)].append((acct, rec))

    out, seen = [], set()
    for members in groups.values():
        if len(members) < 2:
            continue
        for a1, r1 in members:
            for a2, r2 in members:
                if a1 >= a2 or key(r1.get("name")) != key(r2.get("name")):
                    continue
                s1, s2 = actuals(r1), actuals(r2)
                live1 = [y for y, v in s1.items() if v]
                live2 = [y for y, v in s2.items() if v]
                if not live1 or not live2:
                    continue
                (old_a, old_s), (new_a, new_s) = ((a1, s1), (a2, s2)) \
                    if max(live1) < max(live2) else ((a2, s2), (a1, s1))
                old_live = [y for y, v in old_s.items() if v]
                new_live = [y for y, v in new_s.items() if v]
                # a real renumbering does not overlap: one ends, the other begins
                if max(old_live) >= min(new_live):
                    continue
                peak = max(list(old_s.values()) + list(new_s.values()))
                if peak < 20_000 or (old_a, new_a) in seen:
                    continue
                seen.add((old_a, new_a))
                out.append({
                    "name": panel[old_a].get("name", ""),
                    "oldAccount": old_a, "lastYear": max(old_live),
                    "newAccount": new_a, "firstYear": min(new_live),
                    "peak": round(peak, 2),
                })
    return sorted(out, key=lambda r: -r["peak"])


def budget_now(rec: dict) -> dict:
    """The newest adopted budget and Tentative for a line."""
    return {"adopted": rec.get(f"adopted{LATEST - 1}") or 0,
            "tentative": rec.get(f"tentative{LATEST}") or 0}


def find_cyclical(panel: dict, retired: set[str]) -> list[dict]:
    """Spends real money, goes quiet, and does it on a regular interval."""
    out = []
    for acct, rec in expenditure(panel):
        name = rec.get("name", "")
        if acct in retired or SKIP.search(name):
            continue
        s = actuals(rec)
        if len(s) < 6:
            continue
        ys = sorted(s)
        vals = [s[y] for y in ys]
        if max(vals) < 25_000:
            continue
        med = statistics.median(vals)
        spikes = [y for y in ys if s[y] >= max(2 * med, med + 25_000)]
        if len(spikes) < 2:
            continue
        gaps = [b - a for a, b in zip(spikes, spikes[1:])]
        # consecutive years are a rising line, not a cycle; uneven gaps are noise
        if min(gaps) < 2 or (len(set(gaps)) > 1 and statistics.pstdev(gaps) > 0.5):
            continue
        off = [s[y] for y in ys if y not in spikes]
        spike_avg = statistics.mean([s[y] for y in spikes])
        if off and statistics.mean(off) > 0.5 * spike_avg:
            continue
        period = gaps[0]
        out.append({
            "account": acct, "name": name,
            "series": {str(y): round(s[y], 2) for y in ys},
            "spikeYears": spikes, "periodYears": period,
            "nextDue": spikes[-1] + period,
            "spikeAverage": round(spike_avg, 2),
            **budget_now(rec),
        })
    return sorted(out, key=lambda r: -r["spikeAverage"])


def find_underbudgeted(panel: dict, retired: set[str]) -> list[dict]:
    """Goes quiet some years, costs real money when it happens, budgeted far below that."""
    out = []
    for acct, rec in expenditure(panel):
        name = rec.get("name", "")
        if acct in retired or SKIP.search(name):
            continue
        s = actuals(rec)
        if len(s) < 6:
            continue
        vals = [s[y] for y in sorted(s)]
        if max(vals) < 50_000 or sum(1 for v in vals if v <= 0) < 2:
            continue
        active = [v for v in vals if v > 0]
        if not active:
            continue
        avg_active = statistics.mean(active)
        now = budget_now(rec)
        if now["tentative"] >= 0.5 * avg_active:
            continue
        out.append({
            "account": acct, "name": name,
            "series": {str(y): round(s[y], 2) for y in sorted(s)},
            "quietYears": sum(1 for v in vals if v <= 0),
            "averageWhenActive": round(avg_active, 2),
            "peak": round(max(vals), 2),
            **now,
            "shortfall": round(avg_active - now["tentative"], 2),
        })
    return sorted(out, key=lambda r: -r["averageWhenActive"])


def find_chronic_underbudget(panel: dict, retired: set[str]) -> list[dict]:
    """Over budget in each of the last three years, and budgeted below that again.

    Unlike the lumpy lines above, these cost money every year. When a line runs
    past its budget year after year, the difference is moved to it from other
    lines during the year, so the adopted budget never shows what it costs.
    """
    last3 = ACTUAL_YEARS[-3:]
    out = []
    for acct, rec in expenditure(panel):
        name = rec.get("name", "")
        if acct in retired or SKIP.search(name) or ACCRUAL.search(name):
            continue
        pairs = [(rec.get(f"actual{y}"), rec.get(f"adopted{y}")) for y in last3]
        if any(a is None or b is None or b <= 0 or a <= b for a, b in pairs):
            continue
        avg_actual = statistics.mean(a for a, _ in pairs)
        avg_adopted = statistics.mean(b for _, b in pairs)
        now = budget_now(rec)
        if avg_actual < 1.25 * avg_adopted or avg_actual - avg_adopted < 50_000:
            continue
        if now["tentative"] >= avg_actual:  # the new budget already catches up
            continue
        out.append({
            "account": acct, "name": name, "fund": acct.split("-")[0],
            "page": rec.get("page"),
            "actual": {str(y): round(a, 2) for y, (a, _) in zip(last3, pairs)},
            "adoptedByYear": {str(y): round(b, 2) for y, (_, b) in zip(last3, pairs)},
            "averageActual": round(avg_actual, 2),
            "averageAdopted": round(avg_adopted, 2),
            "ytd": rec.get(f"ytd{LATEST - 1}"),
            **now,
            "gap": round(avg_actual - now["tentative"], 2),
        })
    return sorted(out, key=lambda r: -r["gap"])


def find_unused(panel: dict) -> list[dict]:
    """Budgeted in each of the last two adopted budgets and the Tentative, with
    nothing spent in the last three years or so far this year."""
    last3 = ACTUAL_YEARS[-3:]
    out = []
    for acct, rec in expenditure(panel):
        name = rec.get("name", "")
        if PLACEHOLDER.search(name):
            continue
        now = budget_now(rec)
        if now["tentative"] <= 0:
            continue
        if any((rec.get(f"adopted{y}") or 0) <= 0 for y in (LATEST - 2, LATEST - 1)):
            continue
        # a year the line did not exist is not a year nothing was spent
        if any(rec.get(f"actual{y}") != 0 for y in last3):
            continue
        if rec.get(f"ytd{LATEST - 1}") != 0:
            continue
        out.append({
            "account": acct, "name": name, "fund": acct.split("-")[0],
            "page": rec.get("page"),
            "adoptedPrior": rec.get(f"adopted{LATEST - 2}") or 0,
            **now,
        })
    return sorted(out, key=lambda r: -r["tentative"])


def revenue_category(code: str) -> str:
    try:
        n = int(code)
    except ValueError:
        return "other-sources"
    for cid, _label, lo, hi in REVENUE_CATEGORIES:
        if lo <= n <= hi:
            return cid
    return "miscellaneous"


def build_revenue_history(panel: dict) -> dict:
    accounts = []
    for acct, rec in panel.items():
        if rec["kind"] != "revenue":
            continue
        series = series_of(rec)
        values = [v for k in ("actual", "adopted", "ytd") for v in series[k].values()] + [
            series["request"] or 0, series["tentative"] or 0]
        if not any(values):
            continue
        code = acct.split("-")[1]
        accounts.append({
            "account": acct, "fund": acct.split("-")[0], "code": code,
            "category": revenue_category(code), "name": rec.get("name", ""),
            "page": rec.get("page"), **series,
        })
    accounts.sort(key=lambda r: (r["fund"], r["account"]))

    # Two patterns only a run of years shows. Both skip the levy, fund balance
    # and money moved between Town funds, which are set rather than estimated.
    set_not_estimated = {"property-tax", "fund-balance", "interfund-revenue", "other-sources"}
    last3 = [str(y) for y in ACTUAL_YEARS[-3:]]
    under, uncollected = [], []
    for a in accounts:
        if a["category"] in set_not_estimated:
            continue
        pairs = [(a["actual"].get(y), a["adopted"].get(y)) for y in last3]
        if any(c is None or e is None for c, e in pairs):
            continue
        # estimated in each of the last three years and never collected, at
        # mid-year or year-end (a year-end zero alone can be a reclassification:
        # the wireless leases show rent at June 30 and none at December 31)
        # (a small negative mid-year entry is a reversal, not a collection)
        if all(e > 0 and c <= 0 for c, e in pairs) and not any((a["ytd"].get(y) or 0) > 0 for y in last3):
            uncollected.append({**{k: a[k] for k in ("account", "fund", "name", "category", "page")},
                                "estimated": {y: e for y, (_, e) in zip(last3, pairs)},
                                "tentative": a["tentative"]})
            continue
        # collected at least a quarter more than estimated in each of the last
        # three years, and estimated below that again for the new year
        if not all(e > 0 and c >= 1.25 * e for c, e in pairs):
            continue
        avg_c = statistics.mean(c for c, _ in pairs)
        avg_e = statistics.mean(e for _, e in pairs)
        if avg_c - avg_e < 25_000 or (a["tentative"] or 0) >= avg_c:
            continue
        under.append({**{k: a[k] for k in ("account", "fund", "name", "category", "page")},
                      "collected": {y: c for y, (c, _) in zip(last3, pairs)},
                      "estimated": {y: e for y, (_, e) in zip(last3, pairs)},
                      "averageCollected": round(avg_c, 2), "averageEstimated": round(avg_e, 2),
                      "tentative": a["tentative"], "gap": round(avg_c - (a["tentative"] or 0), 2)})
    under.sort(key=lambda r: -r["gap"])
    uncollected.sort(key=lambda r: -sum(r["estimated"].values()))

    return {
        "supplementYears": YEARS,
        "budgetYear": LATEST,
        "actualYears": ACTUAL_YEARS,
        "adoptedYears": list(range(YEARS[0] - 1, LATEST)),
        "underEstimated": under,
        "neverCollected": uncollected,
        "categories": [{"id": c, "label": l, "codes": f"{lo}" if lo == hi else f"{lo}-{hi}"}
                       for c, l, lo, hi in REVENUE_CATEGORIES],
        "accounts": accounts,
        "note": (
            f"Every revenue account in the Town's Budget Supplements, {YEARS[0]} through {LATEST}. "
            f"Each Supplement prints what was collected two years earlier, the prior year's estimate "
            f"and its collections through June 30, and the new request and Tentative, so together they "
            f"give collections for {ACTUAL_YEARS[0]}-{ACTUAL_YEARS[-1]} beside the estimate for each "
            f"year. Collections are the Town's books before the audit."
        ),
    }


def series_of(rec: dict) -> dict:
    """Every year a line appears in, by column."""
    return {
        "actual": {str(y): rec[f"actual{y}"] for y in ACTUAL_YEARS if rec.get(f"actual{y}") is not None},
        "adopted": {str(y): rec[f"adopted{y}"] for y in range(YEARS[0] - 1, LATEST)
                    if rec.get(f"adopted{y}") is not None},
        "ytd": {str(y): rec[f"ytd{y}"] for y in range(YEARS[0] - 1, LATEST) if rec.get(f"ytd{y}") is not None},
        "request": rec.get(f"request{LATEST}"),
        "tentative": rec.get(f"tentative{LATEST}"),
    }


def build_line_history(panel: dict) -> dict:
    """Every expenditure account's full record, so a page can quote any line's
    budget and actual for any year from the Town's own figures."""
    accounts = []
    for acct, rec in expenditure(panel):
        s = series_of(rec)
        values = [v for k in ("actual", "adopted", "ytd") for v in s[k].values()] + [s["request"] or 0, s["tentative"] or 0]
        if not any(values):
            continue
        accounts.append({"account": acct, "fund": acct.split("-")[0], "name": rec.get("name", ""),
                         "page": rec.get("page"), **s})
    accounts.sort(key=lambda r: r["account"])
    return {"supplementYears": YEARS, "budgetYear": LATEST, "actualYears": ACTUAL_YEARS,
            "adoptedYears": list(range(YEARS[0] - 1, LATEST)), "accounts": accounts}


def build_current(panel: dict, latest_doc: dict | None) -> tuple[dict, dict, dict]:
    """The newest Supplement on its own, with the year before beside it."""
    cols = {"actual": LATEST - 2, "adopted": LATEST - 1, "ytd": LATEST - 1,
            "request": LATEST, "tentative": LATEST,
            "priorActual": LATEST - 3, "priorAdopted": LATEST - 2, "priorYtd": LATEST - 2}
    lines = []
    for acct, rec in panel.items():
        if rec.get(f"tentative{LATEST}") is None:
            continue  # not in the newest Supplement
        row = {
            "account": acct, "fund": acct.split("-")[0], "name": rec.get("name", ""),
            "kind": rec["kind"],
            "control": "revenue" if rec["kind"] == "revenue" else classify_control(rec.get("name", "")),
            "page": rec.get("page"),
            "actual": rec.get(f"actual{LATEST - 2}"),
            "adopted": rec.get(f"adopted{LATEST - 1}"),
            "ytd": rec.get(f"ytd{LATEST - 1}"),
            "request": rec.get(f"request{LATEST}"),
            "tentative": rec.get(f"tentative{LATEST}"),
            "priorActual": rec.get(f"actual{LATEST - 3}"),
            "priorAdopted": rec.get(f"adopted{LATEST - 2}"),
            "priorYtd": rec.get(f"ytd{LATEST - 2}"),
        }
        if not any(row[k] for k in ("actual", "adopted", "ytd", "request", "tentative",
                                     "priorActual", "priorAdopted", "priorYtd")):
            continue  # heading rows print zeros in every column
        lines.append(row)
    lines.sort(key=lambda r: (r["kind"] != "expenditure", r["account"]))

    source = {"title": latest_doc["title"], "url": latest_doc["url"]} if latest_doc else None
    exp = [r for r in lines if r["kind"] == "expenditure"]
    by_fund: dict = {}
    for r in exp:
        by_fund.setdefault(r["fund"], {"tentative": 0.0})["tentative"] += r["tentative"] or 0
    summary = {"expenditure": {"tentative": round(sum(r["tentative"] or 0 for r in exp), 2)},
               "byFund": {f: {"tentative": round(v["tentative"], 2)} for f, v in by_fund.items()}}
    stages = json.loads(STAGES.read_text(encoding="utf-8")) if STAGES.exists() else {"years": {}}
    current = {
        "supplementYear": LATEST,
        "columns": cols,
        "source": source,
        "reconciliation": reconcile(LATEST, summary, stages),
        "lines": lines,
    }

    # The same tests and thresholds parse_budget_supplement.py applies to the
    # 2026 Supplement, on the newest one.
    for r in exp:
        a, ytd = r["actual"], r["ytd"]
        r["runRate"] = max(a or 0.0, (ytd or 0.0) * 2) if (a is not None or ytd is not None) else None

    def pub(r):
        return {k: r[k] for k in ("account", "fund", "name", "control", "page",
                                  "actual", "adopted", "ytd", "tentative")}

    over = []
    for r in exp:
        tent, rr = r["tentative"] or 0, r["runRate"] or 0
        if r["control"] != "controllable" or rr <= 0:
            continue
        excess = tent - rr
        if tent >= 5000 and tent > rr * 1.30 and excess >= 5000:
            over.append({**pub(r), "flag": "over-budget", "excess": round(excess, 2)})
    over.sort(key=lambda x: -x["excess"])

    chronic = []
    for r in exp:
        a, b = r["actual"], r["adopted"]
        if a and b and b > 0 and a > b * 1.25 and (a - b) >= 10000:
            chronic.append({**pub(r), "flag": "chronic-overrun", "excess": round(a - b, 2)})
    chronic.sort(key=lambda x: -x["excess"])

    no_budget = []
    for r in exp:
        nm = r["name"].lower()
        if "interfund" in nm or "transfers to" in nm or "trf -" in nm or "transfer" in nm:
            continue
        a, b, ytd = r["actual"] or 0, r["adopted"] or 0, r["ytd"] or 0
        if b == 0 and (a >= 10000 or ytd >= 10000):
            no_budget.append({**pub(r), "flag": "no-budget", "excess": round(max(a, ytd * 2), 2)})
    no_budget.sort(key=lambda x: -x["excess"])

    a_y, b_y, t_y = cols["actual"], cols["adopted"], cols["tentative"]
    outliers = {
        "supplementYear": LATEST,
        "columns": cols,
        "overBudget": over,
        "chronicOverrun": chronic,
        "noBudget": no_budget,
        "recoverablePoolControllable": round(sum(x["excess"] for x in over), 2),
        "note": (
            f"Over-budget = {t_y} Tentative above the trailing full-year run-rate "
            f"(the larger of the {a_y} actual and twice the spending through June 30, {b_y}), "
            f"restricted to controllable non-personnel lines. Mandated costs (pension, workers "
            f"comp, insurance, debt service, payroll taxes) and revenue lines are excluded — "
            f"their variance is obligation or timing, not waste."
        ),
    }

    items = [{
        "account": x["account"], "name": x["name"], "fund": x["fund"],
        "fundName": FUND_NAMES.get(x["fund"], x["fund"]), "page": x["page"],
        "actual": x["actual"], "ytd": x["ytd"], "tentative": x["tentative"],
        "target": x["excess"], "confidence": confidence(x["name"]),
    } for x in over]
    reductions = {
        "supplementYear": LATEST,
        "columns": cols,
        "total": round(sum(r["target"] for r in items), 2),
        "byConfidence": {c: round(sum(r["target"] for r in items if r["confidence"] == c), 2)
                         for c in ("firm", "moderate", "volatile")},
        "items": items,
        "method": (
            f"Each controllable, non-mandated expenditure line whose {t_y} Tentative sits more than "
            f"30% above its trailing full-year run-rate (the larger of the {a_y} actual and twice the "
            f"spending through June 30, {b_y}). The amount above that run-rate is what trimming the line back to it would save. "
            f"Confidence: firm = operating/professional services; moderate = capital/maintenance "
            f"that fluctuates; volatile = price-driven fuel/energy/utilities. Mandated costs "
            f"(pension, workers comp, insurance, debt, claims) and revenue are excluded."
        ),
    }
    for r in exp:
        r.pop("runRate", None)
    return current, outliers, reductions


def write(name: str, payload: dict, compact: bool = False) -> None:
    text = json.dumps(payload, separators=(",", ":")) if compact else json.dumps(payload, indent=1)
    (OUT_DIR / name).write_text(text + "\n", encoding="utf-8")


def main():
    global YEARS, LATEST, ACTUAL_YEARS
    added = adopt_cached_supplements()
    if added:
        print(f"  copied newly downloaded Supplement(s) into {SRC.relative_to(ROOT)}: {added}")
    YEARS = sorted(int(p.stem) for p in SRC.glob("20[0-9][0-9].pdf"))
    if not YEARS:
        raise SystemExit(f"no Supplements in {SRC}")
    LATEST = YEARS[-1]
    ACTUAL_YEARS = list(range(YEARS[0] - 2, LATEST - 1))

    panel: dict = {}
    parsed = {}
    for y in YEARS:
        parsed[y] = read_supplement(y, panel, LATEST)
        print(f"  {y}: {parsed[y]} account lines")

    renumbered = find_renumbered(panel)
    retired = {r["oldAccount"] for r in renumbered}
    cyclical = find_cyclical(panel, retired)
    underbudgeted = find_underbudgeted(panel, retired)
    chronic = find_chronic_underbudget(panel, retired)
    unused = find_unused(panel)
    due = [c for c in cyclical if c["nextDue"] == LATEST]
    exp_accounts = sum(1 for _ in expenditure(panel))

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    write("history.json", {
        "supplementYears": YEARS,
        "budgetYear": LATEST,
        "adoptedYear": LATEST - 1,
        "actualYears": ACTUAL_YEARS,
        "accountsTracked": exp_accounts,
        "linesParsed": parsed,
        "cyclical": cyclical,
        "dueInBudgetYear": due,
        "underBudgeted": underbudgeted,
        "chronicUnderBudget": chronic,
        "unused": unused,
        "renumbered": renumbered,
        "note": (
            f"Built from the Town's own Budget Supplements, {YEARS[0]} through {LATEST}. Each prints an "
            f"actual from two years back, so together they give an unbroken actual for "
            f"{ACTUAL_YEARS[0]}-{ACTUAL_YEARS[-1]} on the same account, in every fund. Mandated costs, "
            f"debt service and interfund transfers are excluded — their swings are obligation or timing, "
            f"not discretion."
        ),
    })

    write("revenue-history.json", build_revenue_history(panel), compact=True)
    write("line-history.json", build_line_history(panel), compact=True)

    docs = supplement_index()
    latest_doc = next((d for d in docs if int(d["year"]) == LATEST and d["slug"].endswith("-pdf")),
                      next((d for d in docs if int(d["year"]) == LATEST), None))
    current, outliers, reductions = build_current(panel, latest_doc)
    write("current-lines.json", current, compact=True)
    write("current-outliers.json", outliers)
    write("current-reductions.json", reductions)

    rc = current["reconciliation"]
    print(f"\n{exp_accounts} expenditure accounts tracked across {len(YEARS)} supplements")
    print(f"  cyclical lines      : {len(cyclical)}  ({len(due)} due in {LATEST})")
    print(f"  under-budgeted lumpy: {len(underbudgeted)}")
    print(f"  over budget 3 years : {len(chronic)}")
    print(f"  budgeted, unused    : {len(unused)}")
    print(f"  renumbered accounts : {len(renumbered)}")
    print(f"  revenue accounts    : {sum(1 for r in panel.values() if r['kind'] == 'revenue')}")
    print(f"  {LATEST} Supplement : {len(current['lines'])} lines; ties to the Tentative: {rc.get('complete')}"
          + ("" if rc.get("complete") else f" ({rc})"))
    print(f"-> {OUT_DIR.relative_to(ROOT)}/{{history,revenue-history,line-history,current-lines,current-outliers,current-reductions}}.json")


if __name__ == "__main__":
    main()
