#!/usr/bin/env python3
"""Road spending per maintained mile, Riverhead against the other Suffolk towns.

Both halves come from one statewide source each, applied the same way to every
town, which is what makes the comparison fair:

  Spending  The State Comptroller's Financial Data for Local Governments: the
            account-level file every town's annual report feeds, one CSV per
            class of government per year. Expenditures whose Level 2 category
            is "Highways", summed per town.
  Mileage   NYSDOT's Local Highway Inventory, Local Roads Listing for Suffolk
            County: the length of every segment a town itself maintains
            (listed under "Jurisdiction: Town"). Village and county roads are
            listed separately and left out, as they are on the spending side.

The newest fiscal year the Comptroller has for all ten towns is used, and the
newest inventory the DOT posts. Until September 2026 the mileage came from the
DOT's "Highway Mileage: Beginning 2008" series, which stops at 2020; the 2025
inventory reproduces those 2020 figures within 3% for every town, so it is the
same measure, five years newer.

Nothing is written unless all ten towns are present on both sides, every
mileage segment's length equals its end milepost minus its start, and no town's
mileage moves more than 15% from the file already published. A failed download
or a changed format leaves the published file as it was, and exits 0 so the
other steps of the job still run.

Output: web/public/data/road-spending.json
"""

from __future__ import annotations

import csv
import datetime as dt
import io
import json
import re
import sys
import zipfile
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "web/public/data/road-spending.json"
HEADERS = {"User-Agent": "Mozilla/5.0 RiverheadBudgetLive/1.0 (+public budget transparency parser)"}

TOWNS = ["Babylon", "Brookhaven", "East Hampton", "Huntington", "Islip",
         "Riverhead", "Shelter Island", "Smithtown", "Southampton", "Southold"]

OSC_DATA_PAGE = "https://www.osc.ny.gov/local-government/data"
OSC_ZIP = "https://wwe1.osc.state.ny.us/localgov/findata/level3zip/{year}_all_classes.zip"
LHI_PAGE = "https://www.dot.ny.gov/highway-data-services/lhi-local-roads"
LHI_HOST = "https://www.dot.ny.gov"
MAX_MILEAGE_SHIFT = 0.15

TITLE = "Road spending per mile — Riverhead against the other Suffolk towns"
INTRO = (
    "Every Suffolk County town files the same annual report to the State Comptroller using the same chart of "
    "accounts, so their road spending can be compared line for line. Divide it by the road miles each town "
    "actually maintains and you get a per-mile figure that is fair across towns of very different sizes."
)


def caveats(year: int, inventory: str) -> list[str]:
    return [
        "Low spending is not automatically good. Spending less per mile can mean an efficient operation or it can "
        "mean deferred maintenance, and this data cannot tell the two apart. Only pavement-condition ratings can, "
        "and Riverhead does not publish any.",
        "Centerline miles, not lane miles. A four-lane road counts the same as a two-lane road of equal length, so "
        "towns with wider roads look more expensive per mile than they are.",
        "The Highways category excludes employee benefits and debt service, which the Comptroller reports "
        "separately. The figures here are wages, contractual costs and equipment — not the full cost of running a "
        "highway department. Because every town is measured the same way, the comparison holds even though the "
        "absolute number understates.",
        "Airports, bus service, waterways and transportation facilities are excluded. They sit in the broader "
        "'Transportation' function, and including them would badly distort East Hampton, which runs an airport.",
        "Villages maintain their own streets. Village roads and village spending are filed separately and are "
        "excluded from both sides here.",
        f"The two sources are close in time but not the same: spending is fiscal {year}, and the road inventory is "
        f"dated {inventory}. Road mileage moves slowly, so the match is close but not exact.",
        f"A single year can mislead. A town that repaved heavily in {year} looks expensive; one that deferred looks "
        "thrifty.",
        f"The Comptroller's figures for {year} are a snapshot of what towns filed, and can change as reports are "
        "reviewed or amended. This page is rebuilt from the newest snapshot every week.",
    ]


def pretty(iso: str) -> str:
    d = dt.date.fromisoformat(iso[:10])
    return f"{d.strftime('%B')} {d.day}, {d.year}"


# ── Spending ──────────────────────────────────────────────────────────────────
def highways(town_csv: str):
    """Highways expenditure per Suffolk town, Riverhead's by object, and the snapshot date."""
    totals: Counter = Counter()
    mix: defaultdict = defaultdict(Counter)
    snapshots: set = set()
    for row in csv.DictReader(io.StringIO(town_csv)):
        if (row.get("COUNTY") or "").strip().lower() != "suffolk":
            continue
        if row.get("ACCOUNT_CODE_SECTION") != "EXPENDITURE" or row.get("LEVEL_2_CATEGORY") != "Highways":
            continue
        town = (row.get("ENTITY_NAME") or "").removeprefix("Town of ").strip()
        amount = float(row.get("AMOUNT") or 0)
        totals[town] += amount
        mix[town][(row.get("OBJECT_OF_EXPENDITURE") or "Other").strip() or "Other"] += amount
        if row.get("SNAPSHOT_DATE"):
            snapshots.add(row["SNAPSHOT_DATE"])
    return totals, mix["Riverhead"], max(snapshots) if snapshots else None


def latest_spending(session, today: dt.date):
    """The newest fiscal year the Comptroller has for all ten towns."""
    for year in range(today.year - 1, today.year - 4, -1):
        r = session.get(OSC_ZIP.format(year=year), headers=HEADERS, timeout=180)
        if r.status_code != 200 or not r.content.startswith(b"PK"):
            continue
        with zipfile.ZipFile(io.BytesIO(r.content)) as z:
            name = next((n for n in z.namelist() if n.lower().endswith("_town.csv")), None)
            if not name:
                continue
            text = z.read(name).decode("utf-8-sig", errors="replace")
        totals, mix, snapshot = highways(text)
        if all(totals.get(t, 0) > 0 for t in TOWNS):
            return year, totals, mix, snapshot
        missing = [t for t in TOWNS if totals.get(t, 0) <= 0]
        print(f"road spending: fiscal {year} is missing {', '.join(missing)}; trying the year before")
    raise RuntimeError("no fiscal year in the last three has all ten Suffolk towns")


# ── Mileage ───────────────────────────────────────────────────────────────────
DECIMAL = re.compile(r"^\d+\.\d{2}$")


def lhi_town_miles(pages: list[str]):
    """Town-maintained centerline miles per municipality, from the listing's page text.

    Each page names its municipality and jurisdiction in its header, then lists
    segments whose start milepost, end milepost and length appear as three
    consecutive two-decimal numbers. A triple whose length isn't end minus start
    is counted as rejected, so a change in the layout shows up instead of being
    summed.
    """
    miles: Counter = Counter()
    rejected = 0
    for text in pages:
        lines = [l.strip() for l in text.splitlines()]
        try:
            muni = lines[lines.index("Municipality:") + 1]
            jurisdiction = lines[lines.index("Jurisdiction:") + 1].split()[0]
        except (ValueError, IndexError):
            continue
        if jurisdiction != "Town" or not muni.startswith("Town of "):
            continue
        i = 0
        while i + 2 < len(lines):
            a, b, c = lines[i], lines[i + 1], lines[i + 2]
            if DECIMAL.match(a) and DECIMAL.match(b) and DECIMAL.match(c):
                if abs((float(b) - float(a)) - float(c)) <= 0.011:
                    miles[muni.removeprefix("Town of ")] += float(c)
                else:
                    rejected += 1
                i += 3
            else:
                i += 1
    return miles, rejected


def latest_mileage(session):
    """The newest Suffolk Local Roads Listing the DOT links, summed per town."""
    page = session.get(LHI_PAGE, headers=HEADERS, timeout=60).text
    links = re.findall(r'href="([^"]*NYSDOT_(\d{4})_LHI_Local_Roads_and_Streets_Suffolk_County\.pdf)"', page)
    if not links:
        raise RuntimeError("no Suffolk County listing linked from the Local Highway Inventory page")
    href, year = max(links, key=lambda l: int(l[1]))
    url = href if href.startswith("http") else LHI_HOST + href
    r = session.get(url, headers=HEADERS, timeout=180)
    r.raise_for_status()
    import fitz  # PyMuPDF, already an ETL dependency

    doc = fitz.open(stream=r.content, filetype="pdf")
    pages = [p.get_text() for p in doc]
    dated = next((m.group(1) for p in pages[:3] for m in [re.search(r"\b(\d{1,2}/\d{1,2}/\d{4})\b", p)] if m), None)
    miles, rejected = lhi_town_miles(pages)
    return int(year), url, dated, miles, rejected


# ── Output ────────────────────────────────────────────────────────────────────
def build(year, spend, mix, snapshot, lhi_year, lhi_url, lhi_dated, miles) -> dict:
    inventory = lhi_dated
    if lhi_dated:
        m, d, y = (int(x) for x in lhi_dated.split("/"))
        inventory = f"{dt.date(y, m, d).strftime('%B')} {d}, {y}"
    towns = sorted(
        ({"town": t, "highways": round(spend[t]), "miles": round(miles[t], 1),
          "perMile": round(spend[t] / miles[t])} for t in TOWNS),
        key=lambda r: -r["perMile"],
    )
    return {
        "title": TITLE,
        "asOf": f"Fiscal year {year}",
        "intro": INTRO,
        "spending": {
            "source": "NYS Office of the State Comptroller, Financial Data for Local Governments",
            "detail": f"Annual financial report filings, fiscal year ending December 31, {year}; expenditures where "
                      f"Level 2 category = 'Highways'."
                      + (f" Data snapshot dated {pretty(snapshot)}." if snapshot else ""),
            "url": OSC_DATA_PAGE,
        },
        "mileage": {
            "source": "NYS Department of Transportation, Local Highway Inventory: Local Roads Listing, Suffolk County",
            "detail": f"Centerline miles of the roads each town maintains (listed under “Jurisdiction: Town”), from "
                      f"the {lhi_year} inventory" + (f" dated {inventory}" if inventory else "") + ". Village and "
                      "county roads are listed separately and excluded.",
            "url": lhi_url,
        },
        "towns": towns,
        "riverheadMix": [{"object": k, "amount": round(v)} for k, v in sorted(mix.items(), key=lambda kv: -kv[1])],
        "caveats": caveats(year, inventory or str(lhi_year)),
    }


def check(payload: dict, previous: dict | None) -> list[str]:
    problems = []
    if previous:
        before = {t["town"]: t["miles"] for t in previous.get("towns", [])}
        for t in payload["towns"]:
            old = before.get(t["town"])
            if old and abs(t["miles"] / old - 1) > MAX_MILEAGE_SHIFT:
                problems.append(f"{t['town']} mileage moved from {old} to {t['miles']}")
    return problems


def main() -> int:
    import requests

    previous = json.loads(OUT.read_text(encoding="utf-8")) if OUT.exists() else None
    session = requests.Session()
    try:
        year, spend, mix, snapshot = latest_spending(session, dt.date.today())
        lhi_year, lhi_url, lhi_dated, miles, rejected = latest_mileage(session)
    except Exception as exc:  # network or format: keep what is published
        print(f"road spending: not rebuilt ({exc}); the published file is unchanged")
        return 0
    missing = [t for t in TOWNS if miles.get(t, 0) <= 0]
    if rejected or missing:
        print(f"road spending: mileage not trusted ({rejected} rejected segments, missing {missing}); unchanged")
        return 0
    payload = build(year, spend, mix, snapshot, lhi_year, lhi_url, lhi_dated, miles)
    problems = check(payload, previous)
    if problems:
        print("road spending: not rebuilt, because " + "; ".join(problems))
        return 0
    OUT.write_text(json.dumps(payload, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
    rv = next(t for t in payload["towns"] if t["town"] == "Riverhead")
    rank = [t["town"] for t in payload["towns"]].index("Riverhead") + 1
    print(f"road spending: fiscal {year} (snapshot {snapshot}), inventory {lhi_year} ({lhi_dated})")
    print(f"  Riverhead ${rv['highways']:,} over {rv['miles']} miles = ${rv['perMile']:,}/mile, {rank} of 10")
    return 0


if __name__ == "__main__":
    sys.exit(main())
