"""Riverhead's preserved farmland, for /preserved-land/.

Reads Suffolk County's GIS layer of farmland whose development rights have been
bought or restricted (FarmlandPDRPolygon), keeping the parcels in the Town of
Riverhead: those whose County tax-map number starts with district 0600. For
each parcel it keeps who holds the rights (the layer's CLASSIFICATION), its
acres, the year its sale closed when the layer records one, and its hamlet. It
leaves out the street address and the tax-map number: the map is about the
land, not its owners.

Outlines are simplified for the web (about 10 metres). Acres are the County's
own figure, not measured from the simplified outline.

Writes web/public/data/geo/riverhead-preserved-farmland.json. If the County's
GIS cannot be reached, the file stays as it was and the run prints a warning.
"""

from __future__ import annotations

import json
import sys
import urllib.parse
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from build_election_map import SourceUnavailable, http_get  # noqa: E402
from import_zip_areas import simplify  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "web/public/data/geo/riverhead-preserved-farmland.json"
LAYER = "https://gis.suffolkcountyny.gov/server/rest/services/LocalGovernmentSQLData/FarmlandPDRPolygon/FeatureServer/0"
TOLERANCE = 0.0001  # degrees, about 10 metres
RIVERHEAD = "0600"  # the Town's district number in the County tax map


def holder_group(classification: str | None) -> str:
    """The County's classification, grouped for the map's colours."""
    c = (classification or "").strip()
    if c == "Town":
        return "Town"
    if c == "County":
        return "County"
    if c == "County and Town":
        return "County and Town"
    if c.startswith("State"):
        return "State"
    return "Other"


def year_of(ms: int | None) -> int | None:
    return datetime.fromtimestamp(ms / 1000, timezone.utc).year if ms else None


def hamlet_name(raw: str | None) -> str | None:
    return " ".join(w.capitalize() for w in raw.split()) if raw and raw.strip() else None


def feature(attrs: dict, geometry: dict) -> dict:
    rings = geometry.get("rings") or []
    simple = [[[round(x, 5), round(y, 5)] for x, y in simplify([tuple(p[:2]) for p in ring], TOLERANCE)] for ring in rings]
    return {
        "type": "Feature",
        "properties": {
            "holder": holder_group(attrs.get("CLASSIFICATION")),
            "classification": attrs.get("CLASSIFICATION"),
            "acres": round(float(attrs.get("ACRES") or 0), 2),
            "year": year_of(attrs.get("CLOSINGDATE")),
            "hamlet": hamlet_name(attrs.get("HAMLET")),
        },
        # Esri rings: outer rings clockwise, holes counter-clockwise. Kept as one ring list; the page draws them with the even-odd rule.
        "geometry": {"type": "Rings", "coordinates": simple},
    }


def main() -> int:
    params = {
        "where": f"PARCELID LIKE '{RIVERHEAD}%'",
        "outFields": "CLASSIFICATION,HAMLET,ACRES,CLOSINGDATE,LASTUPDATE",
        "outSR": "4326",
        "geometryPrecision": "6",
        "f": "json",
    }
    try:
        data = json.loads(http_get(f"{LAYER}/query?{urllib.parse.urlencode(params)}", "Suffolk County GIS"))
    except SourceUnavailable as exc:
        print(f"WARNING: {exc} The preserved-land map was left as it was.", file=sys.stderr)
        return 0
    if data.get("error") or data.get("exceededTransferLimit"):
        print(f"WARNING: the County GIS answered {data.get('error') or 'with a partial result'}; the preserved-land map was left as it was.", file=sys.stderr)
        return 0
    raw = data.get("features", [])
    if not raw:
        print("WARNING: the County GIS returned no Riverhead parcels; the preserved-land map was left as it was.", file=sys.stderr)
        return 0
    features = [feature(f["attributes"], f["geometry"]) for f in raw if f.get("geometry")]
    updated = max((f["attributes"].get("LASTUPDATE") or 0) for f in raw)
    out = {
        "type": "FeatureCollection",
        "source": {"title": "Suffolk County GIS, Farmland Development Rights (FarmlandPDRPolygon)", "url": LAYER},
        "layerUpdated": datetime.fromtimestamp(updated / 1000, timezone.utc).date().isoformat() if updated else None,
        "features": sorted(features, key=lambda f: (-f["properties"]["acres"])),
    }
    previous = json.loads(OUT.read_text(encoding="utf-8")) if OUT.exists() else None
    if previous and {k: v for k, v in previous.items() if k != "fetchedOn"} == out:
        print("  preserved land: unchanged")
        return 0
    out["fetchedOn"] = datetime.now(timezone.utc).date().isoformat()
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(out, separators=(",", ":")) + "\n", encoding="utf-8")
    acres = sum(f["properties"]["acres"] for f in features)
    print(f"  preserved land: {len(features)} parcels, {acres:,.0f} acres")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
