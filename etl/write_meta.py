#!/usr/bin/env python3
"""Stamp site-wide and dataset-specific freshness metadata.

Runs after the ETL/search build. The site uses this file for the permanent
freshness strip, the data-quality page, and regression checks.
"""

import json
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "web/public/data"


def load(path):
    p = DATA / path
    return json.loads(p.read_text()) if p.exists() else None


def latest_numeric_json_year(directory: str):
    p = DATA / directory
    if not p.exists():
        return None
    years = [int(f.stem) for f in p.glob("*.json") if f.stem.isdigit()]
    return max(years) if years else None


def build():
    now = datetime.now(timezone.utc)
    meetings = load("meetings/index.json") or {}
    sub = load("subaccounts/index.json") or {}
    payroll = load("payroll/summary.json") or {}
    search_manifest = load("search/manifest.json") or {}
    legacy_search = load("search/unified.json") or {}

    meeting_rows = meetings.get("meetings") or []
    latest_meeting = meeting_rows[0].get("date") if meeting_rows else None
    meeting_totals = meetings.get("totals") or {}
    payroll_years = payroll.get("years", []) or []
    latest_payroll = max(payroll_years) if payroll_years else None
    latest_afr = latest_numeric_json_year("afr")
    search_entries = search_manifest.get("total")
    if search_entries is None:
        search_entries = len(legacy_search.get("entries", []))

    generated_iso = now.strftime("%Y-%m-%dT%H:%M:%SZ")
    generated_display = now.strftime("%B %-d, %Y")

    meta = {
        "generatedAt": generated_iso,
        "generatedAtDisplay": generated_display,
        "datasets": {
            "meetings": meeting_totals.get("meetings", 0),
            "votes": meeting_totals.get("votes", 0),
            "latestMeeting": latest_meeting,
            "budgetLineItems": sub.get("totalLineItems", 0),
            "payrollYears": payroll_years,
            "searchEntries": search_entries or 0,
        },
        "datasetDetails": {
            "budget": {
                "label": "2026 Adopted Budget",
                "asOf": "2026",
                "status": "official",
                "cadence": "Adopted annually; amendments may occur during the year",
                "records": sub.get("totalLineItems", 0),
            },
            "meetings": {
                "label": "Town Board minutes and votes",
                "asOf": latest_meeting,
                "status": "official",
                "cadence": "Checked weekly as the Town publishes minutes",
                "records": meeting_totals.get("votes", 0),
            },
            "payroll": {
                "label": "Actual payroll",
                "asOf": str(latest_payroll) if latest_payroll is not None else None,
                "status": "official",
                "cadence": "Annual published payroll",
                "records": None,
            },
            "annualReport": {
                "label": "Annual Financial Report",
                "asOf": str(latest_afr) if latest_afr is not None else None,
                "status": "official",
                "cadence": "Annual audited / filed financial reporting",
                "records": None,
            },
            "projection": {
                "label": "2027 projection model",
                "asOf": generated_display,
                "status": "projected",
                "cadence": "Regenerated with the ETL pipeline",
                "records": None,
            },
            "search": {
                "label": "Unified search index",
                "asOf": generated_display,
                "status": "calculated",
                "cadence": "Regenerated with source datasets",
                "records": search_entries or 0,
                "format": "sharded" if search_manifest else "legacy",
                "bytes": sum((s or {}).get("bytes", 0) for s in (search_manifest.get("shards") or {}).values()),
            },
        },
    }

    (DATA / "meta.json").write_text(json.dumps(meta, indent=1))
    print(f"meta.json: generated {generated_iso} | {meta['datasets']}")


if __name__ == "__main__":
    build()
