"""Where each committee's money came from, by ZIP code, for /donation-map/.

Reads the same New York State Board of Elections data as the campaign-finance
cards (data.ny.gov, Campaign Finance Disclosure Reports Data, e9ss-239a) for the
committees in campaign-finance.json, over the page's window. It counts itemized
contributions only, Schedules A, B and C (money from people, corporations and
others): transfers between committees, in-kind gifts and loans are left out, as
the cards' "direct contributions" figure leaves them out. Unitemized
contributions are not in the data.

Donors are grouped by the five-digit ZIP code on the filing and by state, never
by name or street address, so the map shows where the money came from and not
who gave it. Each committee's total here must equal its direct contributions in
campaign-finance-totals.json; scripts/verify-donation-map.mjs checks that.

Writes web/public/data/campaign-donations-by-zip.json. If data.ny.gov cannot be
reached, the file stays as it was and the run prints a warning.
"""

from __future__ import annotations

import json
import re
import sys
import urllib.parse
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from build_campaign_reports import DATASET, SOURCE_PAGE, SourceUnavailable, http_get  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
OFFICIALS = ROOT / "web/public/data/campaign-finance.json"
OUT = ROOT / "web/public/data/campaign-donations-by-zip.json"
CONTRIBUTIONS = ("A", "B", "C")


def query_url(ids: list[str], start: int, end: int) -> str:
    quoted = lambda values: ",".join(f"'{v}'" for v in values)
    params = {
        "$select": "filer_id,election_year,flng_ent_zip,flng_ent_state,flng_ent_city,sum(org_amt) as amount,count(*) as items",
        "$where": f"filer_id in({quoted(ids)}) and election_year in({quoted(str(y) for y in range(start, end + 1))}) "
                  f"and filing_sched_abbrev in({quoted(CONTRIBUTIONS)})",
        "$group": "filer_id,election_year,flng_ent_zip,flng_ent_state,flng_ent_city",
        "$limit": "50000",
    }
    return f"{DATASET}?{urllib.parse.urlencode(params)}"


def zip5(raw: str | None) -> str:
    """The first five digits of a filed ZIP code, or '' when there are none."""
    m = re.match(r"\s*(\d{5})", raw or "")
    return m.group(1) if m else ""


def place_name(raw: str | None) -> str:
    """'RIVERHEAD' or 'riverhead ' to 'Riverhead'."""
    return " ".join(w.capitalize() for w in (raw or "").split())


def aggregate(rows: list[dict], committees: dict[str, list[str]]) -> tuple[dict, dict]:
    """Rows to {official: {year: {zip: [amount, items]}}} and each ZIP's most-filed place name and state."""
    owner = {fid: name for name, fids in committees.items() for fid in fids}
    out: dict[str, dict[str, dict[str, list]]] = {name: defaultdict(dict) for name in committees}
    places: dict[str, dict[str, float]] = defaultdict(lambda: defaultdict(float))
    states: dict[str, dict[str, float]] = defaultdict(lambda: defaultdict(float))
    for r in rows:
        name = owner.get(r["filer_id"])
        if not name:
            continue
        z = zip5(r.get("flng_ent_zip")) or "unknown"
        year = str(r.get("election_year") or "")
        amount, items = float(r.get("amount") or 0), int(r.get("items") or 0)
        cell = out[name][year].setdefault(z, [0.0, 0])
        cell[0] = round(cell[0] + amount, 2)
        cell[1] += items
        places[z][place_name(r.get("flng_ent_city"))] += amount
        states[z][(r.get("flng_ent_state") or "").strip().upper()] += amount
    zips = {
        z: {"place": max(places[z].items(), key=lambda kv: kv[1])[0], "state": max(states[z].items(), key=lambda kv: kv[1])[0]}
        for z in places
    }
    return {name: dict(sorted(years.items())) for name, years in out.items()}, dict(sorted(zips.items()))


def main() -> int:
    data = json.loads(OFFICIALS.read_text(encoding="utf-8"))
    start, end = data["campaignFilingStartYear"], data["campaignFilingEndYear"]
    committees = {o["name"]: [f["filerID"] for f in o["filerIDs"]] for o in data["officials"]}
    ids = sorted({fid for fids in committees.values() for fid in fids}, key=int)
    try:
        rows = json.loads(http_get(query_url(ids, start, end)))
    except SourceUnavailable as exc:
        print(f"WARNING: {exc} The donation map was left as it was.", file=sys.stderr)
        return 0
    if len(rows) >= 50000:
        print("WARNING: data.ny.gov returned the row limit; the donation map was left as it was.", file=sys.stderr)
        return 0
    by_official, zips = aggregate(rows, committees)
    out = {
        "source": {"label": "New York State Board of Elections, Campaign Finance Disclosure Reports Data (data.ny.gov)", "url": SOURCE_PAGE},
        "window": [start, end],
        "schedules": list(CONTRIBUTIONS),
        "committees": by_official,
        "zips": zips,
    }
    previous = json.loads(OUT.read_text(encoding="utf-8")) if OUT.exists() else None
    if previous and {k: v for k, v in previous.items() if k != "fetchedOn"} == out:
        print("  donation map: unchanged")
        return 0
    out["fetchedOn"] = datetime.now(timezone.utc).date().isoformat()
    OUT.write_text(json.dumps(out, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"  donation map: {len(zips)} ZIP codes across {len(by_official)} committees")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
