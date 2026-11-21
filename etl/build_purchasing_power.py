#!/usr/bin/env python3
"""Purchasing power of each Town salary against the Consumer Price Index.

Writes web/public/data/payroll/purchasing-power.json from three records:

- the Town Board's January salary resolutions, 2018 to 2026
  (web/public/data/salary/authorized-YYYY.json): each employee's authorized
  annual salary each year;
- the payroll export's hire dates (web/public/data/payroll/records.json);
- the Bureau of Labor Statistics' CPI-U, all items, not seasonally adjusted,
  for the New York-Newark-Jersey City area (CUURA101SA0) and the U.S. city
  average (CUUR0000SA0, FRED id CPIAUCNS), as republished by the St. Louis Fed's
  FRED service (etl/data/cpi/*.csv).

For each employee on the 2026 list it asks one question: does the 2026 salary
buy as much as the first salary the Town's records show for that person did in
its year? "Equilibrium" here means the 2026 salary is within 2% of the first
salary carried forward by New York-area inflation. The first salary on file is a
true starting salary only for people hired in 2018 or later; for earlier hires
it is their 2018 salary, and the file says so.

It also compares, title by title, the median salary for the same job in 2018 and
2026, which separates raises in the pay scale from step and promotion moves.

The wage floor is New York's minimum wage for Long Island and Westchester,
$17.00 an hour in 2026, staying the same on January 1, 2027 (NYS Department of
Labor, dol.ny.gov/minimum-wage-0). New York sets no official living wage, so
none is used.
"""
from __future__ import annotations

import csv
import json
import re
import statistics
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SALARY = ROOT / "web/public/data/salary"
PAYROLL = ROOT / "web/public/data/payroll/records.json"
CPI_DIR = ROOT / "etl/data/cpi"
OUT = ROOT / "web/public/data/payroll/purchasing-power.json"

YEARS = list(range(2018, 2027))
CURRENT = 2026
EVEN_BAND = 0.02  # within 2% of inflation parity counts as "about even"
MIN_ANNUAL = 20_000  # below this a line is a part-time stipend, not a salary
MIN_WAGE = {"rate": 17.00, "region": "Long Island and Westchester", "year": 2026,
            "source": "New York State Department of Labor, Minimum Wage",
            "url": "https://dol.ny.gov/minimum-wage-0",
            "note": "The page says the rate stays $17.00 on January 1, 2027, because an off-ramp in the law was met."}
CPI_SERIES = {
    "ny": {"file": "CUURA101SA0.csv", "bls": "CUURA101SA0",
           "title": "CPI-U, New York-Newark-Jersey City, all items, not seasonally adjusted"},
    "us": {"file": "CPIAUCNS.csv", "bls": "CUUR0000SA0",
           "title": "CPI-U, U.S. city average, all items, not seasonally adjusted"},
}


def load_cpi(name: str) -> dict:
    """Annual averages from monthly values; the current year averages the months published."""
    monthly: dict[str, float] = {}
    with open(CPI_DIR / CPI_SERIES[name]["file"], newline="") as f:
        for row in csv.reader(f):
            if len(row) < 2 or not row[1] or not re.match(r"\d{4}-\d{2}", row[0]):
                continue
            monthly[row[0][:7]] = float(row[1])
    annual = {}
    for y in range(2005, CURRENT + 1):
        vals = [v for k, v in monthly.items() if k.startswith(f"{y}-")]
        if vals:
            annual[y] = {"value": round(sum(vals) / len(vals), 3), "months": len(vals)}
    last = max(monthly)
    return {"annual": annual, "latestMonth": last}


def norm(name: str) -> str:
    """'Smith, John A' -> 'smith, john' so a middle initial does not break a match."""
    last, _, first = name.partition(",")
    first = first.strip().split(" ")[0] if first.strip() else ""
    return f"{last.strip().lower()}, {first.lower()}"


def hire_dates() -> dict[str, str]:
    recs = json.loads(PAYROLL.read_text())["records"]
    out: dict[str, str] = {}
    for r in sorted(recs, key=lambda r: r["y"]):  # newest year wins
        h = r.get("h") or ""
        if h:
            out[r["n"]] = h
            out.setdefault(norm(r["n"]), h)
            out[norm(r["n"])] = h
    return out


def is_salary(rec: dict) -> bool:
    return (not rec.get("isStipend") and rec.get("group") != "Boards"
            and (rec.get("annual") or 0) >= MIN_ANNUAL and not re.search(r"\d", rec["name"]))


def status(real: float) -> str:
    if real > EVEN_BAND:
        return "ahead"
    if real < -EVEN_BAND:
        return "behind"
    return "even"


def build() -> dict:
    cpi = {k: load_cpi(k) for k in CPI_SERIES}
    ny, us = cpi["ny"]["annual"], cpi["us"]["annual"]
    lists = {}
    for y in YEARS:
        doc = json.loads((SALARY / f"authorized-{y}.json").read_text())
        lists[y] = {r["name"]: r for r in doc["records"] if is_salary(r)}
    hires = hire_dates()

    people = []
    for name, rec in sorted(lists[CURRENT].items()):
        on_file = [y for y in YEARS if name in lists[y]]
        first = on_file[0]
        s0, s1 = lists[first][name]["annual"], rec["annual"]
        hire = hires.get(name) or hires.get(norm(name)) or ""
        hire_year = int(hire[:4]) if hire[:4].isdigit() else None
        starting = hire_year is not None and hire_year >= YEARS[0] and first in (hire_year, hire_year + 1)
        f_ny = ny[CURRENT]["value"] / ny[first]["value"]
        f_us = us[CURRENT]["value"] / us[first]["value"]
        real = s1 / (s0 * f_ny) - 1 if first < CURRENT else None
        people.append({
            "name": name,
            "title": rec.get("title") or "",
            "department": rec.get("department") or "",
            "group": rec.get("group") or "",
            "hireDate": hire or None,
            "firstYear": first,
            "firstSalary": s0,
            "firstIsStartingSalary": bool(starting),
            "salary": s1,
            "cumulativeInflationPct": round((f_ny - 1) * 100, 2),
            "cumulativeInflationUsPct": round((f_us - 1) * 100, 2),
            "firstInTodayDollars": round(s0 * f_ny, 2),
            "nominalChangePct": round((s1 / s0 - 1) * 100, 2),
            "realChangePct": round(real * 100, 2) if real is not None else None,
            "status": status(real) if real is not None else "new",
            "series": [
                {"year": y, "salary": lists[y][name]["annual"],
                 "parity": round(s0 * ny[y]["value"] / ny[first]["value"], 2)}
                for y in on_file
            ],
        })

    compared = [p for p in people if p["realChangePct"] is not None]

    def summarize(rows):
        reals = [p["realChangePct"] for p in rows]
        return {
            "people": len(rows),
            "ahead": sum(p["status"] == "ahead" for p in rows),
            "even": sum(p["status"] == "even" for p in rows),
            "behind": sum(p["status"] == "behind" for p in rows),
            "medianRealChangePct": round(statistics.median(reals), 2) if reals else None,
        }

    by_group = defaultdict(list)
    by_first = defaultdict(list)
    for p in compared:
        by_group[p["group"]].append(p)
        by_first[p["firstYear"]].append(p)

    # Same job, 2018 against 2026: the median authorized salary for each title held
    # by at least two people in both years.
    titles = []
    t18, t26 = defaultdict(list), defaultdict(list)
    for r in lists[YEARS[0]].values():
        t18[r.get("title") or ""].append(r["annual"])
    for r in lists[CURRENT].values():
        t26[r.get("title") or ""].append(r["annual"])
    f_all = ny[CURRENT]["value"] / ny[YEARS[0]]["value"]
    for t in sorted(set(t18) & set(t26)):
        if not t or len(t18[t]) < 2 or len(t26[t]) < 2:
            continue
        m18, m26 = statistics.median(t18[t]), statistics.median(t26[t])
        titles.append({
            "title": t, "count2018": len(t18[t]), "count2026": len(t26[t]),
            "median2018": round(m18, 2), "median2026": round(m26, 2),
            "median2018InTodayDollars": round(m18 * f_all, 2),
            "nominalChangePct": round((m26 / m18 - 1) * 100, 2),
            "realChangePct": round((m26 / (m18 * f_all) - 1) * 100, 2),
        })
    titles.sort(key=lambda t: t["realChangePct"])

    floor35 = MIN_WAGE["rate"] * 35 * 52
    floor40 = MIN_WAGE["rate"] * 40 * 52
    lowest = sorted(people, key=lambda p: p["salary"])[:10]

    return {
        "title": "Purchasing power of Town salaries",
        "asOf": cpi["ny"]["latestMonth"],
        "method": (
            "Each 2026 authorized salary is set against the first authorized salary the Town Board's January "
            "resolutions show for the same person (2018 to 2026), carried forward by the New York-area CPI-U. "
            "Annual CPI is the average of the months published; 2026 averages the months through "
            f"{cpi['ny']['latestMonth']}. Within 2% of that carried-forward figure counts as about even "
            "(equilibrium). The first salary on file is a starting salary only for people hired in 2018 or "
            "later; for earlier hires it is their 2018 salary. Authorized salary is base pay, not overtime or "
            "other pay. Names are matched to payroll hire dates by name. Board members and stipends are left out."
        ),
        "sources": {
            "salaries": "Town Board January salary resolutions, 2018 to 2026 (web/public/data/salary/authorized-YYYY.json)",
            "hireDates": "Town payroll export, Hire Date column (web/public/data/payroll/records.json)",
            "cpi": [{"series": v["bls"], "title": v["title"], "publisher": "U.S. Bureau of Labor Statistics",
                     "via": f"https://fred.stlouisfed.org/series/{'CPIAUCNS' if k == 'us' else v['bls']}"}
                    for k, v in CPI_SERIES.items()],
            "minimumWage": MIN_WAGE,
        },
        "cpi": {k: {str(y): v for y, v in cpi[k]["annual"].items() if y >= YEARS[0] - 1} for k in cpi},
        "evenBandPct": EVEN_BAND * 100,
        "summary": summarize(compared),
        "byGroup": {g: summarize(v) for g, v in sorted(by_group.items())},
        "byFirstYear": {str(y): {**summarize(v), "cumulativeInflationPct": round((ny[CURRENT]["value"] / ny[y]["value"] - 1) * 100, 2)}
                        for y, v in sorted(by_first.items())},
        "sameTitle": titles,
        "wageFloor": {
            "hourly": MIN_WAGE["rate"],
            "annualAt35Hours": round(floor35, 2),
            "annualAt40Hours": round(floor40, 2),
            "belowAt35Hours": sum(p["salary"] < floor35 for p in people),
            "belowAt40Hours": sum(p["salary"] < floor40 for p in people),
            "lowestSalaries": [{"name": p["name"], "title": p["title"], "salary": p["salary"],
                                "hourlyAt35": round(p["salary"] / (35 * 52), 2),
                                "hourlyAt40": round(p["salary"] / (40 * 52), 2)} for p in lowest],
        },
        "people": people,
    }


def main() -> None:
    doc = build()
    OUT.write_text(json.dumps(doc, indent=1, ensure_ascii=False) + "\n")
    s = doc["summary"]
    print(f"wrote {OUT.relative_to(ROOT)}: {len(doc['people'])} salaries, {s['people']} compared; "
          f"ahead {s['ahead']}, even {s['even']}, behind {s['behind']}; median real {s['medianRealChangePct']}%")


if __name__ == "__main__":
    main()
