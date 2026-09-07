#!/usr/bin/env python3
"""Stamp site-wide and dataset-specific freshness metadata.

Runs after the ETL/search build. The site uses this file for the permanent
freshness strip, the data-quality page, and automated regression checks.
"""

import hashlib
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


def parse_source_date(value):
    if not value:
        return None
    for fmt in ("%Y-%m-%d", "%B %d, %Y", "%b %d, %Y"):
        try:
            parsed = datetime.strptime(str(value), fmt)
            return parsed.replace(tzinfo=timezone.utc)
        except ValueError:
            pass
    return None


def freshness_from_date(now, value, current_days, stale_days):
    parsed = parse_source_date(value)
    if not parsed:
        return "unknown", "No parseable source date is available."
    age_days = max(0, (now - parsed).days)
    if age_days <= current_days:
        return "current", f"Source date is {age_days} days old, inside the expected window."
    if age_days <= stale_days:
        return "delayed", f"Source date is {age_days} days old; newer source material may be pending."
    return "stale", f"Source date is {age_days} days old; verify against the publisher before relying on it."


def freshness_from_year(now, year, expected_lag_years, stale_after_lag_years):
    if year is None:
        return "unknown", "No source year is available."
    lag = now.year - int(year)
    if lag <= expected_lag_years:
        return "current", f"{year} is the expected annual release for the current cycle."
    if lag <= stale_after_lag_years:
        return "delayed", f"Latest indexed annual release is {year}; a newer release may now be available."
    return "stale", f"Latest indexed annual release is {year}; this dataset is more than one release cycle behind."


def snapshot_version():
    """Return a stable content fingerprint for resident-facing core datasets.

    generatedAt changes on every build. This fingerprint changes only when the
    underlying indexed data changes, so returning visitors are not told that the
    data changed after an unrelated UI-only deployment.
    """
    files = []
    for directory in ("meetings", "subaccounts", "payroll", "afr", "search"):
        root = DATA / directory
        if root.exists():
            files.extend(root.rglob("*.json"))
    prediction = DATA / "budget-2027-prediction.json"
    if prediction.exists():
        files.append(prediction)

    digest = hashlib.sha256()
    for file in sorted(set(files), key=lambda p: str(p.relative_to(DATA))):
        rel = str(file.relative_to(DATA)).replace("\\", "/")
        digest.update(rel.encode("utf-8"))
        digest.update(b"\0")
        digest.update(file.read_bytes())
        digest.update(b"\0")
    return digest.hexdigest()[:16]


def detail(*, label, as_of, status, cadence, records, freshness, note, policy, source_date=None, **extra):
    value = {
        "label": label,
        "asOf": as_of,
        "status": status,
        "cadence": cadence,
        "records": records,
        "freshness": freshness,
        "freshnessNote": note,
        "freshnessPolicy": policy,
    }
    if source_date:
        value["sourceDate"] = source_date
    value.update(extra)
    return value


def build():
    now = datetime.now(timezone.utc)
    meetings = load("meetings/index.json") or {}
    sub = load("subaccounts/index.json") or {}
    payroll = load("payroll/summary.json") or {}
    search_manifest = load("search/manifest.json") or {}
    legacy_search = load("search/unified.json") or {}

    meeting_rows = meetings.get("meetings") or []
    latest_meeting = meeting_rows[0].get("date") if meeting_rows else None
    latest_meeting_dt = parse_source_date(latest_meeting)
    meeting_totals = meetings.get("totals") or {}

    payroll_years = payroll.get("years", []) or []
    latest_payroll = max(payroll_years) if payroll_years else None
    latest_afr = latest_numeric_json_year("afr")
    budget_years = sub.get("historyYears", []) or []
    latest_budget = max(budget_years) if budget_years else None

    search_entries = search_manifest.get("total")
    if search_entries is None:
        search_entries = len(legacy_search.get("entries", []))

    generated_iso = now.strftime("%Y-%m-%dT%H:%M:%SZ")
    generated_display = now.strftime("%B %-d, %Y")

    budget_fresh, budget_note = freshness_from_year(now, latest_budget, 0, 1)
    meetings_fresh, meetings_note = freshness_from_date(now, latest_meeting, 28, 56)
    payroll_fresh, payroll_note = freshness_from_year(now, latest_payroll, 1, 2)
    afr_fresh, afr_note = freshness_from_year(now, latest_afr, 1, 2)
    pipeline_fresh, pipeline_note = freshness_from_date(now, generated_iso[:10], 7, 14)

    meta = {
        "generatedAt": generated_iso,
        "generatedAtDisplay": generated_display,
        "dataVersion": snapshot_version(),
        "datasets": {
            "meetings": meeting_totals.get("meetings", 0),
            "votes": meeting_totals.get("votes", 0),
            "latestMeeting": latest_meeting,
            "budgetLineItems": sub.get("totalLineItems", 0),
            "payrollYears": payroll_years,
            "searchEntries": search_entries or 0,
        },
        "datasetDetails": {
            "budget": detail(
                label=f"{latest_budget or 'Current'} Adopted Budget",
                as_of=str(latest_budget) if latest_budget is not None else None,
                status="official",
                cadence="Adopted annually; amendments may occur during the year",
                records=sub.get("totalLineItems", 0),
                freshness=budget_fresh,
                note=budget_note,
                policy={"mode": "year", "expectedLagYears": 0, "staleAfterLagYears": 1},
            ),
            "meetings": detail(
                label="Town Board minutes and votes",
                as_of=latest_meeting,
                source_date=latest_meeting_dt.strftime("%Y-%m-%d") if latest_meeting_dt else None,
                status="official",
                cadence="Checked weekly as the Town publishes minutes; meetings are not held every week",
                records=meeting_totals.get("votes", 0),
                freshness=meetings_fresh,
                note=meetings_note,
                policy={"mode": "date", "currentDays": 28, "staleDays": 56},
            ),
            "payroll": detail(
                label="Actual payroll",
                as_of=str(latest_payroll) if latest_payroll is not None else None,
                status="official",
                cadence="Annual published payroll; the prior calendar year is normally the latest complete year",
                records=None,
                freshness=payroll_fresh,
                note=payroll_note,
                policy={"mode": "year", "expectedLagYears": 1, "staleAfterLagYears": 2},
            ),
            "annualReport": detail(
                label="Annual Financial Report",
                as_of=str(latest_afr) if latest_afr is not None else None,
                status="official",
                cadence="Annual audited / filed financial reporting",
                records=None,
                freshness=afr_fresh,
                note=afr_note,
                policy={"mode": "year", "expectedLagYears": 1, "staleAfterLagYears": 2},
            ),
            "projection": detail(
                label="2027 projection model",
                as_of=generated_display,
                source_date=generated_iso[:10],
                status="projected",
                cadence="Regenerated with the ETL pipeline",
                records=None,
                freshness=pipeline_fresh,
                note=pipeline_note,
                policy={"mode": "pipeline", "currentDays": 7, "staleDays": 14},
            ),
            "search": detail(
                label="Unified search index",
                as_of=generated_display,
                source_date=generated_iso[:10],
                status="calculated",
                cadence="Regenerated with source datasets",
                records=search_entries or 0,
                freshness=pipeline_fresh,
                note=pipeline_note,
                policy={"mode": "pipeline", "currentDays": 7, "staleDays": 14},
                format="sharded" if search_manifest else "legacy",
                bytes=sum((s or {}).get("bytes", 0) for s in (search_manifest.get("shards") or {}).values()),
            ),
        },
    }

    (DATA / "meta.json").write_text(json.dumps(meta, indent=1))
    print(f"meta.json: generated {generated_iso} | version {meta['dataVersion']} | {meta['datasets']}")
    print("freshness:", {k: v["freshness"] for k, v in meta["datasetDetails"].items()})


if __name__ == "__main__":
    build()
