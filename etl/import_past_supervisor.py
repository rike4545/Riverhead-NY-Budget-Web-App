"""Import the 2013, 2015 and 2017 Supervisor races by election district for /election-map/.

The County Board of Elections' final results pages give each race's Town total
but not each district's count. OpenElections (openelections/openelections-data-ny)
transcribes the County's precinct-level returns into CSV files, free to use. This
script takes Riverhead's Supervisor rows from those files and checks them before
writing anything:

  - each candidate's Town total, adding the districts, must equal the County's
    final results page for that year exactly;
  - each year must have Riverhead's 22 districts, 01 to 22;
  - the district lines must be today's. Nothing from the County maps Riverhead's
    districts in those years, so the check uses the Census Bureau's voting-district
    maps for 2010 and 2020: each of today's districts must lie at least 95% inside
    one Census district, and each Census district inside the one or two of today's
    districts it matches. (The Census draws districts 4 and 14 as one; together
    they match it.) Lines that held in 2010 and 2020 held in 2013 to 2017.

Rows OpenElections labels Blank and Void are ballots without a vote for Supervisor
and are left out; Scattering is write-ins. The counts are final and do not change,
so this runs by hand. It writes web/public/data/elections/riverhead-supervisor-past.json,
which build_election_map.py adds to the map's data. It needs pyshp (pip install pyshp).
"""

from __future__ import annotations

import csv
import io
import json
import re
import sys
import zipfile
from collections import Counter, defaultdict
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from build_election_map import FINAL_RESULTS, GEOJSON, OUT_DIR, SourceUnavailable, http_get, main_party, parse_final_page  # noqa: E402

OUT = OUT_DIR / "riverhead-supervisor-past.json"
OE_REPO = "https://github.com/openelections/openelections-data-ny"
OE_RAW = "https://raw.githubusercontent.com/openelections/openelections-data-ny/master"
YEARS = {
    2013: "2013/20131105__ny__general__suffolk__precinct.csv",
    2015: "2015/20151103__ny__general__suffolk__precinct.csv",
    2017: "2017/20171107__ny__general__suffolk__precinct.csv",
}
CENSUS = {
    2010: "https://www2.census.gov/geo/tiger/TIGER2010/VTD/2010/tl_2010_36103_vtd10.zip",
    2020: "https://www2.census.gov/geo/tiger/TIGER2020PL/LAYER/VTD/2020/tl_2020_36103_vtd20.zip",
}
MIN_INSIDE = 0.95
NOT_VOTES = {"Blank", "Void", "Over Votes", "Under Votes"}


def district_of(precinct: str) -> str | None:
    m = re.fullmatch(r"Riverhead #: (\d{1,3})", precinct.strip())
    return m.group(1).zfill(3) if m else None


def contest_from_rows(rows: list[dict]) -> dict:
    """Riverhead's Supervisor rows (one per district, party line and candidate) as a map contest."""
    districts: dict[str, dict] = defaultdict(lambda: {"mapFeatureId": None, "total": 0, "reporting": None, "votes": Counter()})
    lines: dict[str, Counter] = defaultdict(Counter)
    for r in rows:
        ed = district_of(r["precinct"])
        name = r["candidate"].strip()
        if not ed or name in NOT_VOTES:
            continue
        name = "Write-in" if name == "Scattering" else name
        votes = int(float(r["votes"] or 0))
        districts[ed]["votes"][name] += votes
        districts[ed]["total"] += votes
        lines[name]["W/I" if name == "Write-in" else (r["party"] or "").strip()] += votes
    candidates = [
        {"name": n, "party": "" if n == "Write-in" else main_party([a for a in ls if a != "W/I"]), "lines": dict(ls), "votes": sum(ls.values())}
        for n, ls in lines.items()
    ]
    candidates.sort(key=lambda c: (c["name"] == "Write-in", -c["votes"]))
    out = {ed: {**d, "votes": dict(d["votes"])} for ed, d in sorted(districts.items())}
    return {"candidates": candidates, "districts": out, "total": sum(d["total"] for d in out.values())}


def county_totals(year: int) -> dict[str, int]:
    """The County's final Supervisor total for each candidate, keyed by surname in lower case."""
    url = f"{FINAL_RESULTS}/{str(year)[2:]}ge/rvroff.htm"
    contests = parse_final_page(http_get(url, "Suffolk County final results", accept="text/html,*/*").decode("utf-8", "ignore"))
    race = next(c for c in contests if c["title"].startswith("Supervisor, Town of Riverhead"))
    return {c["name"].split(",")[0].strip().lower(): c["votes"] for c in race["candidates"]}


# ── The boundary check ──
def polys(g):
    return [g["coordinates"]] if g["type"] == "Polygon" else g["coordinates"]


def ring_in(pt, ring) -> bool:
    x, y = pt
    c = False
    for i in range(len(ring)):
        x1, y1 = ring[i - 1][:2]
        x2, y2 = ring[i][:2]
        if (y1 > y) != (y2 > y) and x < (x2 - x1) * (y - y1) / (y2 - y1) + x1:
            c = not c
    return c


def inside(pt, g) -> bool:
    return any(ring_in(pt, p[0]) and not any(ring_in(pt, h) for h in p[1:]) for p in polys(g))


def census_match(year: int, url: str) -> float:
    """The lowest share, over today's districts, of a district lying inside one Census district,
    after checking that every Census district lies inside the districts it matches."""
    import shapefile  # imported here: only this hand-run import needs it

    z = zipfile.ZipFile(io.BytesIO(http_get(url, f"Census {year} voting districts", accept="*/*")))
    stem = next(n[:-4] for n in z.namelist() if n.endswith(".shp"))
    reader = shapefile.Reader(shp=io.BytesIO(z.read(stem + ".shp")), dbf=io.BytesIO(z.read(stem + ".dbf")), shx=io.BytesIO(z.read(stem + ".shx")))
    now = json.loads(GEOJSON.read_text(encoding="utf-8"))["features"]
    pts = [p for f in now for poly in polys(f["geometry"]) for p in poly[0]]
    lx, hx, ly, hy = min(p[0] for p in pts), max(p[0] for p in pts), min(p[1] for p in pts), max(p[1] for p in pts)
    vtds = []
    for sr in reader.iterShapeRecords():
        g = sr.shape.__geo_interface__
        if g["type"] not in ("Polygon", "MultiPolygon"):
            continue
        b = [p for poly in polys(g) for p in poly[0]]
        box = (min(p[0] for p in b), min(p[1] for p in b), max(p[0] for p in b), max(p[1] for p in b))
        if box[2] >= lx and box[0] <= hx and box[3] >= ly and box[1] <= hy:
            vtds.append((sr.record[3], g, box))
    n = 150
    grid = [(lx + (hx - lx) * (i + .5) / n, ly + (hy - ly) * (j + .5) / n) for i in range(n) for j in range(n)]
    ed_at, vtd_at = {}, {}
    for p in grid:
        ed = next((f["properties"]["ed"] for f in now if inside(p, f["geometry"])), None)
        if ed:
            ed_at[p] = ed
            vtd_at[p] = next((gid for gid, g, b in vtds if b[0] <= p[0] <= b[2] and b[1] <= p[1] <= b[3] and inside(p, g)), None)
    worst = 1.0
    matched: dict[str, set] = defaultdict(set)
    for f in now:
        ed = f["properties"]["ed"]
        mine = [p for p, e in ed_at.items() if e == ed]
        best, hits = Counter(vtd_at[p] for p in mine).most_common(1)[0]
        matched[best].add(ed)
        worst = min(worst, hits / len(mine))
    for vtd, eds in matched.items():
        own = [p for p, v in vtd_at.items() if v == vtd]
        share = sum(1 for p in own if ed_at[p] in eds) / len(own)
        if share < MIN_INSIDE:
            raise SourceUnavailable(f"Census {year} district {vtd} lies only {share:.1%} inside today's districts {sorted(eds)}")
    return worst


def main() -> int:
    elections = []
    for year, path in YEARS.items():
        text = http_get(f"{OE_RAW}/{path}", "OpenElections", accept="*/*").decode("utf-8")
        rows = [r for r in csv.DictReader(io.StringIO(text)) if r["office"].strip().lower() == "supervisor town of riverhead"]
        contest = contest_from_rows(rows)
        if list(contest["districts"]) != [f"{i:03d}" for i in range(1, 23)]:
            raise SourceUnavailable(f"{year}: OpenElections has districts {list(contest['districts'])}, not 001 to 022")
        official = county_totals(year)
        for c in contest["candidates"]:
            if c["name"] == "Write-in":
                continue
            # The County lists "De Vito, Angela M"; OpenElections "Angela M De Vito".
            match = [v for k, v in official.items() if c["name"].lower().endswith(" " + k)]
            if match != [c["votes"]]:
                raise SourceUnavailable(f"{year}: {c['name']} has {c['votes']} in OpenElections but {match or 'nothing'} on the County's final page")
        elections.append({
            "id": f"GE{year}",
            "label": f"{year} General Election",
            "date": None,
            "official": True,
            "asOf": None,
            "url": f"{FINAL_RESULTS}/{str(year)[2:]}ge/default.htm",
            "districtSource": {"title": "OpenElections, New York precinct-level results", "url": f"{OE_REPO}/blob/master/{path}", "checks": "", "boundaryOverlap": 0},
            "contests": [{"key": f"supervisor-{year}", "name": "Supervisor, Town of Riverhead", "voteFor": 1, "url": f"{FINAL_RESULTS}/{str(year)[2:]}ge/rvroff.htm", **contest}],
        })

    overlap = min(census_match(y, u) for y, u in CENSUS.items())
    if overlap < MIN_INSIDE:
        raise SourceUnavailable(f"a district lies only {overlap:.1%} inside one Census district")
    for e in elections:
        e["districtSource"]["checks"] = "Each candidate's Town total equals the County Board of Elections' final results page exactly."
        e["districtSource"]["boundaryOverlap"] = round(overlap, 3)
        e["districtSource"]["boundaryNote"] = "The Census Bureau's 2010 and 2020 voting-district maps match today's districts; they draw districts 4 and 14 as one."
    OUT.write_text(json.dumps({"elections": elections}, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"  past Supervisor races: {', '.join(str(y) for y in YEARS)}; districts match the Census maps to {overlap:.1%} or better")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except SourceUnavailable as exc:
        print(f"ERROR: {exc} Nothing was written.", file=sys.stderr)
        raise SystemExit(1)
