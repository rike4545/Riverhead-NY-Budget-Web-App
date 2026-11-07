"""Import the ZIP code areas around Riverhead for the donation map (/donation-map/).

The Census Bureau's ZIP Code Tabulation Areas (ZCTAs, 2020 cartographic
boundaries, 1:500,000) are the standard public outline of each ZIP code. This
keeps the ones around Riverhead Town, simplifies their outlines for the web,
and marks each with the share of the Town's land it covers, measured against
the County's election-district boundaries (riverhead-districts.json). ZIP
codes do not follow town lines: Wading River and Calverton, for example, run
into Brookhaven.

The outlines change only with a new census, so this runs by hand. It writes
web/public/data/geo/riverhead-zip-areas.json. It needs pyshp (pip install pyshp).
"""

from __future__ import annotations

import io
import json
import sys
import zipfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from build_election_map import GEOJSON, SourceUnavailable, http_get  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "web/public/data/geo/riverhead-zip-areas.json"
SOURCE = "https://www2.census.gov/geo/tiger/GENZ2020/shp/cb_2020_us_zcta520_500k.zip"
SOURCE_PAGE = "https://www.census.gov/geographies/mapping-files/time-series/geo/cartographic-boundary.2020.html"
# The area drawn: Riverhead Town and the neighbouring parts of Brookhaven, Southampton and Southold.
BOX = (-73.02, 40.80, -72.40, 41.02)
TOLERANCE = 0.0004  # degrees, about 35 metres


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


def simplify(points: list, tol: float) -> list:
    """Douglas-Peucker on one ring, keeping its closing point."""
    if len(points) < 5:
        return points

    def dist(p, a, b):
        (x, y), (x1, y1), (x2, y2) = p, a, b
        dx, dy = x2 - x1, y2 - y1
        if dx == dy == 0:
            return ((x - x1) ** 2 + (y - y1) ** 2) ** 0.5
        t = max(0, min(1, ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy)))
        return ((x - x1 - t * dx) ** 2 + (y - y1 - t * dy) ** 2) ** 0.5

    keep = [False] * len(points)
    keep[0] = keep[-1] = True
    stack = [(0, len(points) - 1)]
    while stack:
        i, j = stack.pop()
        best, k = 0.0, None
        for m in range(i + 1, j):
            d = dist(points[m], points[i], points[j])
            if d > best:
                best, k = d, m
        if k is not None and best > tol:
            keep[k] = True
            stack += [(i, k), (k, j)]
    out = [p for p, kept in zip(points, keep) if kept]
    return out if len(out) >= 4 else points


def main() -> int:
    import shapefile  # imported here: only this hand-run import needs it

    z = zipfile.ZipFile(io.BytesIO(http_get(SOURCE, "Census ZIP code areas", accept="*/*")))
    stem = next(n[:-4] for n in z.namelist() if n.endswith(".shp"))
    reader = shapefile.Reader(shp=io.BytesIO(z.read(stem + ".shp")), dbf=io.BytesIO(z.read(stem + ".dbf")), shx=io.BytesIO(z.read(stem + ".shx")))
    fields = [f[0] for f in reader.fields[1:]]
    town = json.loads(GEOJSON.read_text(encoding="utf-8"))["features"]
    tpts = [p for f in town for poly in polys(f["geometry"]) for p in poly[0]]
    lx, hx, ly, hy = min(p[0] for p in tpts), max(p[0] for p in tpts), min(p[1] for p in tpts), max(p[1] for p in tpts)
    n = 120
    grid = [(lx + (hx - lx) * (i + .5) / n, ly + (hy - ly) * (j + .5) / n) for i in range(n) for j in range(n)]
    in_town = [p for p in grid if any(inside(p, f["geometry"]) for f in town)]

    features = []
    for sr in reader.iterShapeRecords():
        rec = dict(zip(fields, sr.record))
        g = sr.shape.__geo_interface__
        if g["type"] not in ("Polygon", "MultiPolygon"):
            continue
        pts = [p for poly in polys(g) for p in poly[0]]
        if max(p[0] for p in pts) < BOX[0] or min(p[0] for p in pts) > BOX[2] or max(p[1] for p in pts) < BOX[1] or min(p[1] for p in pts) > BOX[3]:
            continue
        zip5 = str(rec.get("ZCTA5CE20"))
        share = sum(1 for p in in_town if inside(p, g)) / len(in_town)
        simple = [[[[round(x, 5), round(y, 5)] for x, y in simplify([tuple(p[:2]) for p in ring], TOLERANCE)] for ring in poly] for poly in polys(g)]
        features.append({"type": "Feature", "properties": {"zip": zip5, "riverheadShare": round(share, 3)}, "geometry": {"type": "MultiPolygon", "coordinates": simple}})
    features.sort(key=lambda f: f["properties"]["zip"])
    covered = sum(f["properties"]["riverheadShare"] for f in features)
    if not 0.97 <= covered <= 1.03:
        raise SourceUnavailable(f"the ZIP code areas cover {covered:.1%} of the Town, not all of it")
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps({"type": "FeatureCollection", "source": {"title": "U.S. Census Bureau, 2020 ZIP Code Tabulation Areas (cartographic boundaries, 1:500,000)", "url": SOURCE_PAGE}, "features": features}, separators=(",", ":")) + "\n", encoding="utf-8")
    print(f"  ZIP code areas: {len(features)} around Riverhead; {sum(1 for f in features if f['properties']['riverheadShare'] > 0)} reach into the Town, covering {covered:.1%} of it")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except SourceUnavailable as exc:
        print(f"ERROR: {exc} Nothing was written.", file=sys.stderr)
        raise SystemExit(1)
