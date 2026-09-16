#!/usr/bin/env python3
"""Riverhead police spending next to reported Index crime.

Two public series, joined on year:

  SPENDING  The Police department's appropriations in the Town's own adopted
            budgets, summed from the account-level line items in
            web/public/data/subaccounts/A01.json (which carry history back to
            2020 and reconcile to the Summary page appropriations).

  CRIME     New York State DCJS "Index Crimes by County and Agency", the source
            behind the State's public Index Crimes dashboard. Index crime is the
            FBI's seven-offence definition — murder, rape, robbery, aggravated
            assault, burglary, larceny, motor-vehicle theft — reported by the
            agency itself. It is what the State publishes; it is not everything
            a police department does.

WHAT THIS CAN AND CANNOT SHOW. Putting the two lines on one chart invites a
causal reading in either direction, and neither is supported. Spending buys
staffing, equipment and contractual raises; reported crime moves with what
happens AND with what gets reported. The honest question the pair answers is
narrower and still worth asking: what has the Town been paying, what has it been
recording, and how does that compare with the neighbours who publish the same
two numbers.

Peers are the other East End town departments in the same county, which face
comparable summer population swings.

Output: web/public/data/police-crime.json
"""
from __future__ import annotations

import json
import os
import ssl
import subprocess
import sys
import urllib.parse
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "web/public/data/police-crime.json"
SUBACCOUNTS = ROOT / "web/public/data/subaccounts/A01.json"

DCJS = "https://data.ny.gov/resource/ca8h-8gjq.json"
DATASET = {
    "title": 'New York State DCJS, "Index Crimes by County and Agency: Beginning 1990"',
    "url": "https://data.ny.gov/Public-Safety/Index-Crimes-by-County-and-Agency-Beginning-1990/ca8h-8gjq",
    "dashboard": "https://mypublicdashboard.ny.gov/t/OJRP_PUBLIC/views/NYSIndexCrimesbyAgency/LandingPage",
}

AGENCY = "Riverhead Town PD"
# The other East End town departments. Same county, same seasonal swing.
PEERS = [
    "Southampton Town PD",
    "East Hampton Town PD",
    "Southold Town PD",
    "Shelter Island PD",
    "Riverhead Town PD",
]


def http_get(url: str) -> bytes:
    try:
        import requests
        r = requests.get(url, timeout=90)
        r.raise_for_status()
        return r.content
    except Exception as exc:
        if not isinstance(exc, (ssl.SSLError, OSError)) and "SSL" not in str(exc):
            raise
        return subprocess.run(["curl", "-sf", url], capture_output=True, check=True).stdout


def soda(where: str, limit: int = 5000) -> list[dict]:
    q = urllib.parse.urlencode({"$where": where, "$limit": limit, "$order": "year"})
    return json.loads(http_get(f"{DCJS}?{q}"))


# Census county-subdivision codes for the five East End towns, Suffolk County
# (state 36, county 103). Population turns the peer bars from counts into rates,
# which is the only way the comparison means anything: Riverhead is a smaller
# town than Southampton and reports twice the crime, and a chart of raw counts
# cannot tell you whether that is a lot.
#
# The Census API rejects unkeyed requests for this endpoint, so per-capita is
# computed only when CENSUS_API_KEY is in the environment. Without it the page
# shows counts and says so. The key is never written to this repo.
ACS = "https://api.census.gov/data/2023/acs/acs5/profile"
TOWN_BY_AGENCY = {
    "Riverhead Town PD": "Riverhead town",
    "Southampton Town PD": "Southampton town",
    "East Hampton Town PD": "East Hampton town",
    "Southold Town PD": "Southold town",
    "Shelter Island PD": "Shelter Island town",
}


def town_populations() -> tuple[dict[str, int], dict | None]:
    """ACS 5-year population for the East End towns, or ({}, None) with no key."""
    key = os.environ.get("CENSUS_API_KEY")
    if not key:
        print("  CENSUS_API_KEY not set — peer bars stay as counts, not rates", file=sys.stderr)
        return {}, None
    q = urllib.parse.urlencode({
        "get": "NAME,DP05_0001E",
        "for": "county subdivision:*",
        "in": "state:36 county:103",
        "key": key,
    })
    rows = json.loads(http_get(f"{ACS}?{q}"))
    pops: dict[str, int] = {}
    for name, value, *_ in rows[1:]:
        for town in TOWN_BY_AGENCY.values():
            if name.startswith(town):
                try:
                    pops[town] = int(value)
                except (TypeError, ValueError):
                    pass
    return pops, {
        "title": "U.S. Census Bureau, American Community Survey 2023 5-Year Estimates (DP05)",
        "url": "https://data.census.gov/",
        "note": "Town populations, used to turn peer crime counts into rates per 10,000 residents.",
    }


def num(v) -> int | None:
    try:
        return int(float(v))
    except (TypeError, ValueError):
        return None


def police_spending() -> list[dict]:
    """Police appropriations by year, summed from the adopted-budget line items."""
    fund = json.loads(SUBACCOUNTS.read_text())
    dept = next((d for d in fund["departments"] if d["name"].strip().lower() == "police"), None)
    if not dept:
        raise SystemExit("no Police department in A01.json")
    by_year: dict[int, float] = {}
    for item in dept["lineItems"]:
        for h in item.get("history") or []:
            by_year[h["year"]] = by_year.get(h["year"], 0.0) + (h["value"] or 0.0)
    return [
        {"year": y, "appropriation": round(by_year[y], 2)}
        for y in sorted(by_year)
    ]


def main() -> int:
    rows = soda(f"agency = '{AGENCY}'")
    if not rows:
        print("no DCJS rows for", AGENCY, file=sys.stderr)
        return 1

    crime = [
        {
            "year": num(r["year"]),
            "monthsReported": num(r.get("months_reported")),
            "total": num(r.get("total_index_crimes")),
            "violent": num(r.get("violent")),
            "property": num(r.get("property")),
            "burglary": num(r.get("burglary")),
            "larceny": num(r.get("larceny")),
            "motorVehicleTheft": num(r.get("motor_vehicle_theft")),
            "robbery": num(r.get("robbery")),
            "aggravatedAssault": num(r.get("aggravated_assault")),
            "murder": num(r.get("murder")),
            "forcibleRape": num(r.get("forcible_rape")),
        }
        for r in rows
    ]
    crime = [c for c in crime if c["year"] is not None]
    crime.sort(key=lambda c: c["year"])

    spending = police_spending()
    spend_by_year = {s["year"]: s["appropriation"] for s in spending}
    crime_by_year = {c["year"]: c for c in crime}

    # Only the years that have both. Everything derived lives here so the page
    # renders the join rather than recomputing it.
    joined = []
    for y in sorted(set(spend_by_year) & set(crime_by_year)):
        c = crime_by_year[y]
        appropriation = spend_by_year[y]
        joined.append({
            "year": y,
            "appropriation": appropriation,
            "totalIndexCrimes": c["total"],
            "violent": c["violent"],
            "property": c["property"],
            "monthsReported": c["monthsReported"],
            "dollarsPerReportedIndexCrime": round(appropriation / c["total"], 2) if c["total"] else None,
        })

    pops, pop_source = town_populations()

    peers = []
    for agency in PEERS:
        rs = soda(f"agency = '{agency}'")
        latest = max((r for r in rs if num(r.get("total_index_crimes")) is not None),
                     key=lambda r: num(r["year"]), default=None)
        if latest:
            total = num(latest["total_index_crimes"])
            pop = pops.get(TOWN_BY_AGENCY.get(agency, ""))
            peers.append({
                "agency": agency,
                "year": num(latest["year"]),
                "total": total,
                "violent": num(latest.get("violent")),
                "property": num(latest.get("property")),
                "monthsReported": num(latest.get("months_reported")),
                "population": pop,
                "per10k": round(total / pop * 10_000, 1) if (pop and total) else None,
                "isRiverhead": agency == AGENCY,
            })
    peers.sort(key=lambda p: -(p["total"] or 0))

    out = {
        "generated": True,
        "agency": AGENCY,
        "sources": [
            DATASET,
            *( [pop_source] if pop_source else [] ),
            {
                "title": "Town of Riverhead 2026 Adopted Budget, account-level Police appropriations",
                "url": "https://www.townofriverheadny.gov/DocumentCenter/View/2967/2026-Adopted-Budget",
                "note": "Summed from the Police department's line items, which carry adopted history by year.",
            },
        ],
        "method": (
            "Police appropriations come from the Town's own adopted budgets, summed across every "
            "account-level line item in the Police department. Reported crime is the State's Index "
            "Crime count for Riverhead Town PD, self-reported by the department to DCJS. The two are "
            "joined on year and nothing is inferred from the pairing: spending buys staffing, "
            "equipment and contractual raises, and reported crime moves with what happens and with "
            "what gets reported."
        ),
        "crime": crime,
        "spending": spending,
        "joined": joined,
        "peersLatest": peers,
        "peersHavePopulation": any(p.get("population") for p in peers),
        "limits": [
            "Index crime is the FBI's seven-offence definition. It excludes most of what a police "
            "department spends its time on — traffic, quality-of-life calls, mental-health response, "
            "overdoses, domestic incidents that do not reach the aggravated-assault threshold.",
            "The counts are self-reported by the agency. A change in reporting practice moves the "
            "line without anything changing on the street.",
            "Appropriations are adopted budget, not actual spending. Police overtime in particular "
            "routinely runs above the adopted line.",
            "Neither series is adjusted for inflation or for the summer population swing, which is "
            "large on the East End and falls on the same department.",
            "A ratio of dollars to reported crimes is an arithmetic fact, not a productivity "
            "measure. A department that prevents a crime records fewer, not more.",
            "Peer agencies are compared on raw counts unless a Census population is available. "
            "The East End towns differ substantially in size, so a count says how much a "
            "department recorded, not how much risk a resident faces.",
        ],
    }
    OUT.write_text(json.dumps(out, indent=1), encoding="utf-8")
    print(f"wrote {OUT.relative_to(ROOT)}: {len(crime)} crime years, {len(spending)} spending years, "
          f"{len(joined)} joined, {len(peers)} peers")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
