"""Import Riverhead's 2024 general-election results by election district for /election-map/.

The Suffolk County Board of Elections' final 2024 results pages give county and
district totals but not each election district's count. Benjamin J. Rosenblatt
compiles every New York election district's certified 2024 results, with
@cinyc9, from the State and county boards of elections, and publishes them free
to use with credit. This script takes Riverhead's 22 districts from that file
and checks it against the Board's own figures before writing anything:

  - Suffolk's President total for each candidate, and the 1st Congressional
    District's, must equal the Board's final 2024 results page exactly;
  - each candidate's party lines must add to the candidate's total;
  - Riverhead must have the 22 districts 001 to 022, and each 2024 district
    must cover at least 99% of the County's current district with the same
    number, so the results can be drawn on today's map.

The 2024 count is final and does not change, so this runs by hand, not in the
weekly pipeline. It writes web/public/data/elections/riverhead-2024.json, which
build_election_map.py adds to the map's data.
"""

from __future__ import annotations

import io
import json
import re
import sys
import zipfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from build_election_map import GEOJSON, OUT_DIR, SourceUnavailable, http_get, parse_final_page  # noqa: E402

OUT = OUT_DIR / "riverhead-2024.json"
PAGE = "https://www.benjrosenblatt.com/2024general-live-results"
RESULTS_XLSX = "https://irp.cdn-website.com/fa110e79/files/uploaded/NY_2024StatewideResults-75a75e51.xlsx"
SHAPES_ZIP = "https://irp.cdn-website.com/fa110e79/files/uploaded/NYStatewide_Nov24_ED_Consolidated.zip"
COUNTY = "https://apps2.suffolkcountyny.gov/boe/eleres/24ge"
MIN_OVERLAP = 0.99

# Each contest: the file's columns for each candidate's party lines, keyed by the
# Board's abbreviations, and the Board's page and heading for the check.
CONTESTS = [
    {
        "key": "president-2024",
        "name": "President and Vice President",
        "county": ("usoff.htm", "President and Vice President"),
        "filter": None,
        "candidates": [
            ("Kamala D Harris AND Tim Walz", "Harris/Walz", {"DEM": "Pres_D", "WOR": "Pres_W"}),
            ("Donald J Trump AND JD Vance", "Trump/Vance", {"REP": "Pres_R", "CON": "Pres_C"}),
        ],
        "writeIn": "Pres_WI",
    },
    {
        "key": "congress-2024",
        "name": "Representative in Congress, 1st Congressional District",
        "county": ("cd.htm", "Representative in Congress, 1st Congressional District"),
        "filter": ("Congress", "01"),
        "candidates": [
            ("Nicholas J LaLota", "LaLota, Nicholas J", {"REP": "Congress_R", "CON": "Congress_C"}),
            ("John P Avlon", "Avlon, John P", {"DEM": "Congress_D", "CSS": "Congress_CS"}),
        ],
        "writeIn": "Congress_WI",
    },
]


def county_totals(page: str, title: str) -> dict[str, int]:
    """The Board's final total for each candidate in one contest: {'Harris/Walz': 341812, ...}."""
    contests = parse_final_page(http_get(f"{COUNTY}/{page}", "Suffolk County results", accept="text/html,*/*").decode("utf-8", "ignore"))
    match = next((c for c in contests if c["title"].startswith(title)), None)
    if match is None:
        raise SourceUnavailable(f"{page}: no contest titled {title!r}")
    return {c["name"]: c["votes"] for c in match["candidates"]}


def read_rows() -> tuple[list[str], list[tuple]]:
    import openpyxl  # imported here: only this hand-run import needs it

    wb = openpyxl.load_workbook(io.BytesIO(http_get(RESULTS_XLSX, "2024 results file", accept="*/*")), read_only=True)
    rows = list(wb.worksheets[0].iter_rows(values_only=True))
    return list(rows[0]), rows[1:]


def ring_inside(pt, ring) -> bool:
    x, y = pt
    c = False
    for i in range(len(ring)):
        x1, y1 = ring[i - 1][:2]
        x2, y2 = ring[i][:2]
        if (y1 > y) != (y2 > y) and x < (x2 - x1) * (y - y1) / (y2 - y1) + x1:
            c = not c
    return c


def polygons(g):
    return [g["coordinates"]] if g["type"] == "Polygon" else g["coordinates"]


def inside(pt, g) -> bool:
    return any(ring_inside(pt, poly[0]) and not any(ring_inside(pt, hole) for hole in poly[1:]) for poly in polygons(g))


def boundary_overlap() -> float:
    """For each current district, the share of a fine grid of its points inside the 2024 district of the same number; the lowest."""
    z = zipfile.ZipFile(io.BytesIO(http_get(SHAPES_ZIP, "2024 district shapes", accept="*/*")))
    name = next(n for n in z.namelist() if n.endswith(".geojson"))
    old = json.loads(z.read(name))
    then = {str(f["properties"]["GEOID24"])[-3:]: f["geometry"] for f in old["features"] if str(f["properties"].get("GEOID24", "")).startswith("36103060")}
    now = json.loads(GEOJSON.read_text(encoding="utf-8"))
    pts_all = [p for f in now["features"] for poly in polygons(f["geometry"]) for p in poly[0]]
    lo_x, hi_x = min(p[0] for p in pts_all), max(p[0] for p in pts_all)
    lo_y, hi_y = min(p[1] for p in pts_all), max(p[1] for p in pts_all)
    n = 160
    grid = [(lo_x + (hi_x - lo_x) * (i + .5) / n, lo_y + (hi_y - lo_y) * (j + .5) / n) for i in range(n) for j in range(n)]
    worst = 1.0
    for f in now["features"]:
        ed = f["properties"]["ed"]
        mine = [p for p in grid if inside(p, f["geometry"])]
        if ed not in then or not mine:
            return 0.0
        worst = min(worst, sum(1 for p in mine if inside(p, then[ed])) / len(mine))
    return worst


def main() -> int:
    header, rows = read_rows()
    col = header.index
    contests = []
    for spec in CONTESTS:
        suffolk = [r for r in rows if r[col("CountyName")] == "Suffolk" and (spec["filter"] is None or r[col(spec["filter"][0])] == spec["filter"][1])]
        official = county_totals(*spec["county"])
        for _, county_name, lines in spec["candidates"]:
            mine = sum((r[col(c)] or 0) for r in suffolk for c in lines.values())
            if official.get(county_name) != mine:
                raise SourceUnavailable(f"{spec['name']}: {county_name} totals {mine} in the file but {official.get(county_name)} on the Board's page")
        river = sorted((r for r in rows if r[col("CountyName")] == "Suffolk" and r[col("MuniName")] == "Riverhead"), key=lambda r: r[col("EDID")])
        if [r[col("EDID")] for r in river] != [f"{i:03d}" for i in range(1, 23)]:
            raise SourceUnavailable("Riverhead does not have districts 001 to 022 in the 2024 file")
        districts = {}
        for r in river:
            votes = {name: sum(r[col(c)] or 0 for c in lines.values()) for name, _, lines in spec["candidates"]}
            votes["Write-in"] = r[col(spec["writeIn"])] or 0
            districts[r[col("EDID")]] = {"mapFeatureId": None, "total": sum(votes.values()), "reporting": None, "votes": votes}
        candidates = []
        for name, _, lines in spec["candidates"]:
            line_votes = {abbr: sum(r[col(c)] or 0 for r in river) for abbr, c in lines.items()}
            candidates.append({"name": name, "party": "DEM" if "DEM" in lines else "REP", "lines": line_votes, "votes": sum(line_votes.values())})
        wi = sum(r[col(spec["writeIn"])] or 0 for r in river)
        candidates.append({"name": "Write-in", "party": "", "lines": {"W/I": wi}, "votes": wi})
        candidates.sort(key=lambda c: (c["name"] == "Write-in", -c["votes"]))
        contests.append({
            "key": spec["key"], "name": spec["name"], "voteFor": 1, "candidates": candidates,
            "total": sum(d["total"] for d in districts.values()), "districts": districts, "url": f"{COUNTY}/{spec['county'][0]}",
        })

    overlap = boundary_overlap()
    if overlap < MIN_OVERLAP:
        raise SourceUnavailable(f"a 2024 district covers only {overlap:.1%} of today's district with its number; the results cannot be drawn on today's map")

    out = {
        "id": "GE2024",
        "label": "2024 General Election",
        "date": "2024-11-05",
        "official": True,
        "asOf": None,
        "url": f"{COUNTY}/default.htm",
        "districtSource": {
            "title": "Benjamin J. Rosenblatt and @cinyc9, New York 2024 general election results by election district",
            "url": PAGE,
            "checks": "Suffolk's totals for President and the 1st Congressional District equal the Board of Elections' final results exactly.",
            "boundaryOverlap": round(overlap, 3),
        },
        "contests": contests,
    }
    OUT.write_text(json.dumps(out, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"  2024 results: {len(contests)} contests, 22 districts; boundaries match today's to {overlap:.1%}")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except SourceUnavailable as exc:
        print(f"ERROR: {exc} Nothing was written.", file=sys.stderr)
        raise SystemExit(1)
