#!/usr/bin/env python3
"""Same job title, Riverhead against neighbouring towns, at three points in time.

Writes web/public/data/salary/peer-title-pay.json. For each job title that
Riverhead and at least one neighbour both fill, it gives the median, lowest and
highest annual salary and the head count in each town at a start, middle and
current year, and what the median buys after New York-area inflation.

Years: 2022, 2024 and 2026. Southampton's oldest salary charts still on its
website are for 2022 (the 2018 and 2020 files have been taken down), so 2022 is
the earliest year every town can be compared. Southold's 2022 budget is not on
its website either, so its start point is the 2021 Preliminary Budget, and the
file says so.

Records, all quoted from text kept in etl/data/salary/peers/:

- Riverhead: the Town Board's January salary resolutions
  (web/public/data/salary/authorized-YYYY.json), the same records the
  purchasing-power file uses, with the same exclusions.
- Southampton: the adopted budget's Salary Charts for 2022, 2024 and 2026. Each
  chart lists every budgeted position by title with its salary for the budget
  year (and the year before, which is not used: it is the position's prior
  salary, which can belong to a different person). Elected and administrative
  salaries are in tables at the front. Vacant positions are left out.
- Southold: the "Schedule of Salaries of Elected Officials" in the 2021
  Preliminary and 2024 Adopted budgets, and the 2026 organizational meeting's
  elected officials' salary resolution. Southold publishes no salaries for
  its rank-and-file titles, so it appears only for elected offices.

Salaries only: no benefits, overtime, longevity or stipends.
"""
from __future__ import annotations

import json
import re
import statistics
import sys
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "etl"))
from build_purchasing_power import is_salary  # noqa: E402

PEERS = ROOT / "etl/data/salary/peers"
SALARY = ROOT / "web/public/data/salary"
CPI_FILE = ROOT / "web/public/data/payroll/purchasing-power.json"
OUT = SALARY / "peer-title-pay.json"

POINTS = {"start": 2022, "mid": 2024, "current": 2026}
TOWNS = ["Riverhead", "Southampton", "Southold"]

SOURCES = {
    ("Riverhead", 2022): {"title": "Town of Riverhead, 2022 salary resolutions (January 2022 Town Board)",
                          "file": "web/public/data/salary/authorized-2022.json"},
    ("Riverhead", 2024): {"title": "Town of Riverhead, 2024 salary resolutions (January 2024 Town Board)",
                          "file": "web/public/data/salary/authorized-2024.json"},
    ("Riverhead", 2026): {"title": "Town of Riverhead, 2026 salary resolutions (January 6, 2026 Town Board)",
                          "file": "web/public/data/salary/authorized-2026.json"},
    ("Southampton", 2022): {"title": "Town of Southampton 2022 Budget, Salary Charts (Adopted)",
                            "url": "https://www.southamptontownny.gov/DocumentCenter/View/24741/_09-2022-SalaryCharts",
                            "file": "etl/data/salary/peers/southampton-2022-salary-charts-adopted.txt"},
    ("Southampton", 2024): {"title": "Town of Southampton 2024 Budget, Salary Charts (Adopted)",
                            "url": "https://southamptontownny.gov/DocumentCenter/View/30328/2024-Salary-Charts-Adopted",
                            "file": "etl/data/salary/peers/southampton-2024-salary-charts-adopted.txt"},
    ("Southampton", 2026): {"title": "Town of Southampton 2026 Budget, Salary Charts (Adopted)",
                            "url": "https://www.southamptontownny.gov/DocumentCenter/View/42519/2026-Salary-Charts---Adopted",
                            "file": "etl/data/salary/peers/southampton-2026-salary-charts-adopted.txt"},
    ("Southold", 2021): {"title": "Town of Southold 2021 Preliminary Budget, Schedule of Salaries of Elected Officials",
                         "url": "https://southoldtownny.gov/DocumentCenter/View/8120/2021-Preliminary-Budget--Final-Signed",
                         "file": "etl/data/salary/peers/southold-2021-preliminary-budget-elected-salaries.txt",
                         "note": "Southold's 2022 budget is not on the Town's website; this is the nearest earlier year published."},
    ("Southold", 2024): {"title": "Town of Southold Adopted 2024 Budget, Schedule of Salaries of Elected Officials",
                         "url": "https://southoldtownny.gov/DocumentCenter/View/10113/Adopted-2024_Budget",
                         "file": "etl/data/salary/peers/southold-2024-adopted-budget-elected-salaries-transcription.txt",
                         "note": "A scanned page, transcribed by hand; the page image is kept beside the transcription."},
    ("Southold", 2026): {"title": "Southold Town Board Organizational Meeting agenda, January 2, 2026: 2026 Elected Officials Salaries",
                         "url": "https://southoldtownny.gov/AgendaCenter/ViewFile/Agenda/_01022026-1620",
                         "file": "etl/data/salary/peers/southold-2026-01-02-organizational-meeting-agenda.txt"},
}
SOUTHOLD_YEAR = {"start": 2021, "mid": 2024, "current": 2026}

ELECTED = ["Supervisor", "Town Board member", "Town Justice", "Town Clerk",
           "Superintendent of Highways", "Tax Receiver", "Assessor"]
POLICE = ["Police Officer", "Detective", "Detective Sergeant", "Sergeant", "Lieutenant", "Captain"]


def norm(t: str) -> str:
    t = re.sub(r"\(\d+\)|\*+|@", " ", t.lower())
    t = re.sub(r"[^a-z0-9 ]", " ", t)
    return re.sub(r"\s+", " ", t).strip()


# Titles that are the same job under a different name. Anything else must match exactly.
ALIASES = {
    "town supervisor": "Supervisor", "supervisor": "Supervisor",
    "councilman": "Town Board member", "councilwoman": "Town Board member",
    "town council": "Town Board member", "members of the town board": "Town Board member",
    "town justice": "Town Justice", "town justices": "Town Justice",
    "town clerk": "Town Clerk",
    "superintendent of hwys": "Superintendent of Highways", "superintendent of highways": "Superintendent of Highways",
    "receiver of taxes": "Tax Receiver", "tax receiver": "Tax Receiver",
    "assessor": "Assessor", "assessors": "Assessor",
    "police officer": "Police Officer", "police officer academy": "Police Officer",
    "police officer start": "Police Officer",
    **{f"police officer {i}": "Police Officer" for i in range(1, 7)},
    "detective": "Detective", "detective grade i": "Detective", "detective grade ii": "Detective",
    "detective grade iii": "Detective", "detective sergeant": "Detective Sergeant",
}


def canonical(title: str) -> str:
    n = norm(title)
    return ALIASES.get(n, n)


# ---- Riverhead -------------------------------------------------------------

def riverhead(year: int) -> dict[str, list[float]]:
    out = defaultdict(list)
    doc = json.loads((SALARY / f"authorized-{year}.json").read_text())
    for r in doc["records"]:
        if is_salary(r) or (r.get("group") == "Elected Officials" and (r.get("annual") or 0) >= 20_000):
            out[canonical(r.get("title") or "")].append(float(r["annual"]))
    return out


# ---- Southampton -----------------------------------------------------------

POSITION = re.compile(r"^\s*(\d{4})\s+(\S+)\s+(.+?)\s{2,}-?\$?\s*([\d,]+\.\d\d)\s+-?\$?\s*([\d,]+\.\d\d)\s+")
NUMBER = re.compile(r"\$?\s*([\d,]{4,}(?:\.\d\d)?)")


def southampton(year: int) -> dict[str, list[float]]:
    """Each position's budget-year salary; front tables give one figure per office."""
    out = defaultdict(list)
    for line in (ROOT / SOURCES[("Southampton", year)]["file"]).read_text().splitlines():
        m = POSITION.match(line)
        if m:
            title, salary = m.group(3).strip(), float(m.group(5).replace(",", ""))
            if "vacant" in title.lower() or salary <= 0:
                continue
            out[canonical(title)].append(salary)
            continue
        # Front tables: "Title   salary  benefits  total  (prior years ...)".
        m = re.match(r"^\s*([A-Z][^$\d]*?(?:\(\d+\))?[^$\d]*?)\s{2,}(\$?\s*[\d,]{4,}.*)$", line)
        if not m:
            continue
        nums = [float(x.replace(",", "")) for x in NUMBER.findall(m.group(2))]
        title = m.group(1).strip()
        if len(nums) < 9 or title.lower().startswith("total"):
            continue
        seats = re.search(r"\((\d+)\)", title)
        out[canonical(title)].extend([nums[0]] * (int(seats.group(1)) if seats else 1))
    return out


# ---- Southold --------------------------------------------------------------

def southold(year: int) -> dict[str, list[float]]:
    out = defaultdict(list)
    text = (ROOT / SOURCES[("Southold", year)]["file"]).read_text()
    if year == 2026:
        block = text.split("2026 Elected Officials Salaries", 1)[1].split("AND BE IT FURTHER", 1)[0]
        for line in block.splitlines():
            m = re.match(r"^(Supervisor|Councilwoman|Councilman|Justice|Town Clerk|Superintendent of Highways|"
                         r"Receiver of Taxes|Assessor)\s.*?\s([\d,]+\.\d\d)\s*$", line.strip())
            if not m:
                continue
            office, salary = m.group(1), float(m.group(2).replace(",", ""))
            # The schedule pays the Fishers Island justice, who also sits on the Town Board,
            # a separate, lower salary (2024: $64,547; 2026: $65,838, 2% more). Only the
            # two mainland justices are compared, as in the earlier schedules.
            if office == "Justice" and salary < 70_000:
                continue
            out[canonical({"Justice": "Town Justice"}.get(office, office))].append(salary)
        return out
    for line in text.splitlines():
        m = re.match(r"^(Supervisor|Members of the Town Board \(4\) @|Town Justices \(2\) @|Town Clerk|"
                     r"Superintendent of Highways|Tax Receiver|Assessors \(3\) @)\s+\$\s*([\d,]+)\s*$", line.strip())
        if m:
            seats = re.search(r"\((\d+)\)", m.group(1))
            out[canonical(m.group(1))].extend([float(m.group(2).replace(",", ""))] * (int(seats.group(1)) if seats else 1))
    return out


# ---- Build -----------------------------------------------------------------

def stats(values: list[float]) -> dict:
    return {"count": len(values), "median": round(statistics.median(values), 2),
            "low": round(min(values), 2), "high": round(max(values), 2)}


def group_of(title: str) -> str:
    if title in ELECTED:
        return "Elected"
    if title in POLICE or title.capitalize() in POLICE:
        return "Police"
    return "Civilian"


def label(title: str) -> str:
    if title in ELECTED or title in POLICE:
        return title
    return " ".join(w.upper() if re.fullmatch(r"i{1,3}|iv|v", w) else w.capitalize() for w in title.split())


def build() -> dict:
    cpi = json.loads(CPI_FILE.read_text())["cpi"]["ny"]
    data = {"Riverhead": {}, "Southampton": {}, "Southold": {}}
    for point, year in POINTS.items():
        data["Riverhead"][point] = (year, riverhead(year))
        data["Southampton"][point] = (year, southampton(year))
        data["Southold"][point] = (SOUTHOLD_YEAR[point], southold(SOUTHOLD_YEAR[point]))

    titles = []
    cur = {t: data[t]["current"][1] for t in TOWNS}
    shared = sorted(k for k in cur["Riverhead"] if k and any(k in cur[p] for p in TOWNS[1:]))
    for key in shared:
        row = {"title": label(key), "group": group_of(key), "towns": {}}
        for town in TOWNS:
            points = {}
            for point in POINTS:
                year, table = data[town][point]
                if table.get(key):
                    points[point] = {"year": year, **stats(table[key])}
            if not points:
                continue
            if "start" in points and "current" in points:
                s, c = points["start"], points["current"]
                factor = cpi[str(c["year"])]["value"] / cpi[str(s["year"])]["value"]
                points["nominalChangePct"] = round((c["median"] / s["median"] - 1) * 100, 2)
                points["realChangePct"] = round((c["median"] / (s["median"] * factor) - 1) * 100, 2)
            row["towns"][town] = points
        if len(row["towns"]) < 2:
            continue
        # Riverhead's median against each neighbour's, at each point both have.
        riv = row["towns"].get("Riverhead", {})
        row["riverheadVsPct"] = {
            town: {p: round((riv[p]["median"] / pts[p]["median"] - 1) * 100, 2)
                   for p in POINTS if p in riv and p in pts and riv[p]["year"] == pts[p]["year"]}
            for town, pts in row["towns"].items() if town != "Riverhead"
        }
        titles.append(row)
    order = {"Elected": 0, "Police": 1, "Civilian": 2}
    titles.sort(key=lambda r: (order[r["group"]], r["title"]))

    cmp = [r["riverheadVsPct"]["Southampton"]["current"] for r in titles
           if "current" in r["riverheadVsPct"].get("Southampton", {})]
    return {
        "title": "Same job, Riverhead and neighbouring towns",
        "points": POINTS,
        "southoldYears": SOUTHOLD_YEAR,
        "method": (
            "For each job title Riverhead and a neighbouring town both fill, the median, lowest and highest annual "
            "salary in each town's own salary record, in 2022, 2024 and 2026. Titles are matched by name; a few "
            "offices with different names are paired (Councilman and Town Council, Receiver of Taxes and Tax "
            "Receiver, Riverhead's Detective grades and Southampton's Detective, Southampton's numbered Police "
            "Officer steps). A median reflects who holds the title (how many are new or senior), not only the pay "
            "scale. Salaries only: no benefits, overtime, longevity or stipends. Southampton's vacant positions are "
            "left out. Real change carries the start-year median forward by the New York-area CPI-U."
        ),
        "caveats": [
            "Southampton's 2018 and 2020 salary charts are no longer on its website, so 2022 is the earliest year all three towns can be compared.",
            "Southold's 2022 budget is not on its website; its start point is the 2021 Preliminary Budget.",
            "Southold publishes salaries only for elected and appointed officials, so it appears only for elected offices.",
            "Southampton has one appointed Sole Assessor; Riverhead and Southold elect three assessors. Southampton's Assessor is not compared.",
            "Riverhead's Assessor figures leave out the chairperson, whose salary includes the chair's added pay.",
            "Riverhead's January 2026 salary resolutions list no Town Clerk salary, so Town Clerk is not compared.",
            "A Police Officer median mixes every step from recruit to top step, so it moves with hiring: Southampton's fell from 2022 to 2024 as new officers joined.",
        ],
        "sources": [{"town": t, "year": y, **s} for (t, y), s in sorted(SOURCES.items())],
        "cpi": {str(y): cpi[str(y)] for y in sorted({*POINTS.values(), *SOUTHOLD_YEAR.values()})},
        "summary": {
            "titles": len(titles),
            "comparedWithSouthampton2026": len(cmp),
            "riverheadHigherThanSouthampton2026": sum(v > 0 for v in cmp),
            "medianRiverheadVsSouthampton2026Pct": round(statistics.median(cmp), 2) if cmp else None,
        },
        "titles": titles,
    }


def main() -> None:
    doc = build()
    OUT.write_text(json.dumps(doc, indent=1, ensure_ascii=False) + "\n")
    s = doc["summary"]
    print(f"wrote {OUT.relative_to(ROOT)}: {s['titles']} titles; Riverhead above Southampton in "
          f"{s['riverheadHigherThanSouthampton2026']} of {s['comparedWithSouthampton2026']} (median {s['medianRiverheadVsSouthampton2026Pct']}%)")


if __name__ == "__main__":
    main()
