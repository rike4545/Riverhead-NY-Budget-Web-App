#!/usr/bin/env python3
"""Stamp data-freshness metadata for the site.

Writes web/public/data/meta.json with when the pipeline last ran and headline
counts per dataset, so the site can show residents how current the data is.
Runs last in the parse workflow.
"""

import json
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "web/public/data"


def load(path):
    p = DATA / path
    return json.loads(p.read_text()) if p.exists() else None


def build():
    meetings = load("meetings/index.json") or {}
    sub = load("subaccounts/index.json") or {}
    payroll = load("payroll/summary.json") or {}
    search = load("search/unified.json") or {}

    meta = {
        "generatedAt": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "generatedAtDisplay": datetime.now(timezone.utc).strftime("%B %-d, %Y"),
        "datasets": {
            "meetings": (meetings.get("totals") or {}).get("meetings", 0),
            "votes": (meetings.get("totals") or {}).get("votes", 0),
            "latestMeeting": (meetings.get("meetings") or [{}])[0].get("date"),
            "budgetLineItems": sub.get("totalLineItems", 0),
            "payrollYears": payroll.get("years", []),
            "searchEntries": len(search.get("entries", [])),
        },
    }
    (DATA / "meta.json").write_text(json.dumps(meta, indent=1))
    print(f"meta.json: generated {meta['generatedAt']} | {meta['datasets']}")


if __name__ == "__main__":
    build()
