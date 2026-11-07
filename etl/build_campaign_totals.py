"""Rebuild the stored totals on each /campaign-finance/ card from the State's open data.

Each committee card, and the summary table above them, shows figures before a
visitor presses Refresh: lifetime contributions and transfers, the latest
contribution, the 2026 cycle, in-kind gifts, refunds, loans received and the
balance still owed. This script computes them from data.ny.gov's Campaign
Finance Disclosure Reports Data (dataset e9ss-239a) and writes them to
web/public/data/campaign-finance-totals.json, apart from the facts typed by
hand in campaign-finance.json (office, term, salary, notes, committees), which
it only reads. It uses the same schedules as the live refresh:

  contributions   Schedules A, B and C (money from people, corporations, others)
  transfers in    Schedule G, apart from money moved between the official's own
                  committees: a card that combines an old and a new committee
                  already counts that money where it was first raised, so it is
                  reported apart (internalTransfers) and not added again
  in-kind gifts   Schedule D, shown on its own: goods and services, not money
  refunded        Schedule M, contributions the committee gave back
  loans received  Schedule I, summed: each row is new money
  owed            Schedule N in the committee's latest report, summed: N repeats
                  the open loans and bills in every report, so it is a balance,
                  and only the latest report's is current
  this cycle      Schedules A to C with the page's last election year

The window is the page's own (campaignFilingStartYear to campaignFilingEndYear).
The bulk data holds one version of each report, the amended one when there is
one, so nothing is counted twice. Unitemized contributions are not in it.

If data.ny.gov cannot be reached, the file stays as it was and the run prints a
warning instead of stopping the job.
"""

from __future__ import annotations

import json
import sys
import urllib.parse
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from build_campaign_reports import DATASET, SOURCE_PAGE, SourceUnavailable, filer_ids, http_get  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
OFFICIALS = ROOT / "web/public/data/campaign-finance.json"
TOTALS = ROOT / "web/public/data/campaign-finance-totals.json"

CONTRIBUTIONS = ("A", "B", "C")
# The reports of one election year in the order they are filed. A report not
# named here (Off Cycle, a special election's) sorts after the July Periodic.
REPORT_ORDER = {name: i for i, name in enumerate((
    "January Periodic", "32-Day Pre-Primary", "11-Day Pre-Primary", "10-Day Post-Primary", "July Periodic",
    "32-Day Pre-General", "11-Day Pre-General", "27-Day Post-General",
))}
UNNAMED_REPORT = REPORT_ORDER["July Periodic"] + 0.5


def query_url(ids: list[str], start: int, end: int) -> str:
    quoted = lambda values: ",".join(f"'{v}'" for v in values)
    params = {
        "$select": "filer_id,election_year,filing_desc,filing_sched_abbrev,sum(org_amt) as amount,count(*) as row_count,"
                   "max(sched_date) as last_date",
        "$where": f"filer_id in({quoted(ids)}) and election_year in({quoted(str(y) for y in range(start, end + 1))})",
        "$group": "filer_id,election_year,filing_desc,filing_sched_abbrev",
        "$limit": "50000",
    }
    return f"{DATASET}?{urllib.parse.urlencode(params)}"


def transfers_url(ids: list[str], start: int, end: int) -> str:
    """Schedule G by who sent it, so transfers between an official's own committees can be told apart."""
    quoted = lambda values: ",".join(f"'{v}'" for v in values)
    params = {
        "$select": "filer_id,flng_ent_name,flng_ent_first_name,flng_ent_last_name,sum(org_amt) as amount",
        "$where": f"filer_id in({quoted(ids)}) and election_year in({quoted(str(y) for y in range(start, end + 1))}) "
                  "and filing_sched_abbrev='G'",
        "$group": "filer_id,flng_ent_name,flng_ent_first_name,flng_ent_last_name",
        "$limit": "50000",
    }
    return f"{DATASET}?{urllib.parse.urlencode(params)}"


def normalize_name(name: str) -> str:
    return "".join(ch for ch in (name or "").lower() if ch.isalnum())


def internal_transfers(transfer_rows: list[dict], own_names: list[str]) -> float:
    """Transfers into these committees from a committee of the same official, matched by its name."""
    own = {normalize_name(n) for n in own_names}
    sender = lambda r: r.get("flng_ent_name") or f"{r.get('flng_ent_first_name') or ''} {r.get('flng_ent_last_name') or ''}"
    return round(sum(float(r.get("amount") or 0) for r in transfer_rows if normalize_name(sender(r)) in own), 2)


def report_key(row: dict) -> tuple:
    return (int(row["election_year"]), REPORT_ORDER.get(row["filing_desc"], UNNAMED_REPORT))


def totals(rows: list[dict], end_year: int, internal: float = 0) -> dict:
    """One committee's (or one official's combined committees') figures from its grouped rows.

    `internal` is the part of Schedule G that came from the official's own other committees.
    """
    amount = lambda rs: round(sum(float(r.get("amount") or 0) for r in rs), 2)
    of = lambda schedules: [r for r in rows if r["filing_sched_abbrev"] in schedules]
    direct = amount(of(CONTRIBUTIONS))
    transfers = round(amount(of(("G",))) - internal, 2)
    dated = [r["last_date"][:10] for r in of(CONTRIBUTIONS + ("G",)) if r.get("last_date")]
    latest = max((report_key(r) for r in rows), default=None)
    latest_rows = [r for r in rows if report_key(r) == latest] if latest else []
    owed = amount([r for r in latest_rows if r["filing_sched_abbrev"] == "N"])
    cycle = [r for r in of(CONTRIBUTIONS) if r["election_year"] == str(end_year)]
    return {
        "raised": round(direct + transfers, 2),
        "directContributions": direct,
        "transfersIn": transfers,
        "internalTransfers": round(internal, 2),
        "inKind": amount(of(("D",))),
        "refunds": amount(of(("M",))),
        "lastContribution": max(dated) if dated else None,
        "loansReceived": amount(of(("I",))),
        "owed": owed,
        "owedReport": f"{latest_rows[0]['election_year']} {latest_rows[0]['filing_desc']}" if latest_rows else None,
        "cycleRaised": amount(cycle),
        "cycleItems": sum(int(r.get("row_count") or 0) for r in cycle),
    }


def main() -> int:
    data = json.loads(OFFICIALS.read_text(encoding="utf-8"))
    start, end = data["campaignFilingStartYear"], data["campaignFilingEndYear"]
    try:
        raw = json.loads(http_get(query_url(filer_ids(data), start, end)))
        transfer_rows = json.loads(http_get(transfers_url(filer_ids(data), start, end)))
    except SourceUnavailable as exc:
        print(f"::warning title=Campaign finance totals not refreshed::{exc} "
              f"{TOTALS.relative_to(ROOT)} keeps its last totals; the next run tries again.")
        return 0
    rows = [r for r in raw if r.get("filing_sched_abbrev") and r.get("filing_desc") and r.get("election_year")]
    if not rows:
        print(f"::warning title=Campaign finance totals not refreshed::data.ny.gov returned no rows for these committees. "
              f"{TOTALS.relative_to(ROOT)} keeps its last totals.")
        return 0
    committees = {}
    for official in data["officials"]:
        ids = [ref["filerID"] for ref in official["filerIDs"]]
        own_names = [ref["committeeName"] for ref in official["filerIDs"]]
        internal = internal_transfers([r for r in transfer_rows if r.get("filer_id") in ids], own_names)
        committees[official["name"]] = {"filerIDs": ids, **totals([r for r in rows if r["filer_id"] in ids], end, internal)}
    published = json.loads(TOTALS.read_text(encoding="utf-8")) if TOTALS.exists() else None
    if published and published.get("committees") == committees and published.get("window") == [start, end]:
        print(f"  {TOTALS.relative_to(ROOT)}: totals unchanged")
        return 0
    out = {
        "source": {
            "label": "New York State Board of Elections, Campaign Finance Disclosure Reports Data (data.ny.gov)",
            "url": SOURCE_PAGE,
        },
        "fetchedOn": datetime.now(timezone.utc).date().isoformat(),
        "window": [start, end],
        "committees": committees,
    }
    TOTALS.write_text(json.dumps(out, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"wrote {TOTALS.relative_to(ROOT)}: " + "; ".join(f"{name}: {c['raised']}" for name, c in committees.items()))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
