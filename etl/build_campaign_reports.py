"""Fetch the 2026 General Election (November 3, 2026) campaign finance reports
for the committees on /campaign-finance/ from the State's open data.

The State Board of Elections requires three reports around a general election:
the 32-Day and 11-Day Pre-General reports and the 27-Day Post-General report.
data.ny.gov publishes every itemized transaction in them (dataset e9ss-239a),
labelled by `filing_desc` ("11-Day Pre-General") and by schedule (A to R). This
groups those transactions by committee, report and schedule, so the page can
show each report's contributions, spending and transfers without the visitor
pressing Refresh.

Writes web/public/data/campaign-finance-2026-general.json. The page sums the
schedules itself (lib/campaign-finance.ts, summarizeElectionReports), so the
live refresh and this file go through the same arithmetic.

The bulk data has no row for a report with nothing itemized ("No Activity"),
and no unitemized totals, so a committee missing from a report here may still
have filed it. The page says so.

If data.ny.gov cannot be reached after three tries, the published file stays as
it was and the run prints a warning instead of stopping the job.
"""

from __future__ import annotations

import json
import ssl
import subprocess
import sys
import time
import urllib.parse
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OFFICIALS = ROOT / "web/public/data/campaign-finance.json"
OUT = ROOT / "web/public/data/campaign-finance-2026-general.json"
DATASET = "https://data.ny.gov/resource/e9ss-239a.json"
SOURCE_PAGE = "https://data.ny.gov/Transparency/Campaign-Finance-Disclosure-Reports-Data-Beginning/e9ss-239a"

ELECTION_YEAR = "2026"
REPORTS = ("32-Day Pre-General", "11-Day Pre-General", "27-Day Post-General")
RETRY_WAITS = (5, 20)


class SourceUnavailable(RuntimeError):
    """data.ny.gov could not be reached after every try."""


def _get_once(url: str) -> bytes:
    try:
        import requests
        r = requests.get(url, timeout=90)
        r.raise_for_status()
        return r.content
    except Exception as exc:
        if not isinstance(exc, (ssl.SSLError, OSError)) and "SSL" not in str(exc):
            raise
        return subprocess.run(["curl", "-sf", url], capture_output=True, check=True).stdout


def http_get(url: str) -> bytes:
    """GET with requests, falling back to curl on a TLS failure, tried three times."""
    last: Exception | None = None
    for attempt, wait in enumerate((0, *RETRY_WAITS), start=1):
        if wait:
            time.sleep(wait)
        try:
            return _get_once(url)
        except Exception as exc:
            last = exc
            print(f"  data.ny.gov: try {attempt} failed: {str(exc)[:200]}", file=sys.stderr)
    raise SourceUnavailable(f"data.ny.gov could not be reached after {1 + len(RETRY_WAITS)} tries ({str(last)[:200]}).")


def filer_ids(officials: dict) -> list[str]:
    return sorted({ref["filerID"] for o in officials["officials"] for ref in o["filerIDs"]}, key=int)


def query_url(ids: list[str]) -> str:
    quoted = lambda values: ",".join(f"'{v}'" for v in values)
    params = {
        "$select": "filer_id,filing_desc,r_amend,filing_sched_abbrev,sum(org_amt) as amount,count(*) as row_count,"
                   "min(sched_date) as first_date,max(sched_date) as last_date",
        "$where": f"filer_id in({quoted(ids)}) and election_year='{ELECTION_YEAR}' and filing_desc in({quoted(REPORTS)})",
        "$group": "filer_id,filing_desc,r_amend,filing_sched_abbrev",
        "$order": "filer_id,filing_desc,filing_sched_abbrev",
        "$limit": "5000",
    }
    return f"{DATASET}?{urllib.parse.urlencode(params)}"


def normalize(raw: list[dict]) -> list[dict]:
    """One row per committee, report and schedule, in a stable order.

    Amounts are rounded to cents. A report the State shows as amended keeps
    that flag; the bulk data carries one version of each report.
    """
    rows = []
    for r in raw:
        if r.get("filing_desc") not in REPORTS or not r.get("filing_sched_abbrev"):
            continue
        rows.append({
            "filerID": r["filer_id"],
            "report": r["filing_desc"],
            "amended": (r.get("r_amend") or "").upper() == "Y",
            "schedule": r["filing_sched_abbrev"],
            "amount": round(float(r.get("amount") or 0), 2),
            "rows": int(r.get("row_count") or 0),
            "firstDate": (r.get("first_date") or "")[:10] or None,
            "lastDate": (r.get("last_date") or "")[:10] or None,
        })
    order = {name: i for i, name in enumerate(REPORTS)}
    rows.sort(key=lambda r: (int(r["filerID"]), order[r["report"]], r["schedule"], r["amended"]))
    return rows


def main() -> int:
    officials = json.loads(OFFICIALS.read_text(encoding="utf-8"))
    ids = filer_ids(officials)
    try:
        raw = json.loads(http_get(query_url(ids)))
    except SourceUnavailable as exc:
        if not OUT.exists():
            raise
        print(f"::warning title=Campaign finance reports not refreshed::{exc} "
              f"{OUT.relative_to(ROOT)} stays as last fetched; the next run tries again.")
        return 0
    rows = normalize(raw)
    published = json.loads(OUT.read_text(encoding="utf-8")) if OUT.exists() else None
    if published and published.get("rows") == rows:
        print(f"  {OUT.relative_to(ROOT)}: no change in the State's data")
        return 0
    out = {
        "election": {"name": "2026 General", "date": "2026-11-03", "electionYear": ELECTION_YEAR},
        "reports": list(REPORTS),
        "source": {"label": "New York State Board of Elections, Campaign Finance Disclosure Reports Data (data.ny.gov)", "url": SOURCE_PAGE},
        "fetchedOn": datetime.now(timezone.utc).date().isoformat(),
        "filerIDs": ids,
        "rows": rows,
    }
    OUT.write_text(json.dumps(out, indent=1) + "\n", encoding="utf-8")
    by_report = {name: len({r["filerID"] for r in rows if r["report"] == name}) for name in REPORTS}
    print(f"wrote {OUT.relative_to(ROOT)}: {len(rows)} rows; committees with itemized activity: {by_report}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
