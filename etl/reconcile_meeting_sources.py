#!/usr/bin/env python3
"""Attach official-source audit state to parsed Town Board meeting records.

Runs after parse_meetings.py. It does not alter vote interpretation; it joins
that parsed decision record to the CivicClerk source manifest produced by
fetch_meetings.py.

Outputs:
* each <date>.json gains ``officialRecord`` metadata;
* each resolution/docket item gains ``officialDocumentVerified`` and the
  matching CivicClerk resolution-file IDs when a separately published official
  resolution source contains that exact resolution number;
* index.json gains compact official-record status fields;
* official-sources.json exposes a safe aggregate audit view for the website.

``sourceVersionAt`` means the last time the committed CivicClerk source state
changed. The polling workflow itself runs twice daily but does not create a
false new data timestamp when every hash is unchanged.
"""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ETL = ROOT / "etl/data/meetings"
OUT = ROOT / "web/public/data/meetings"
MANIFEST = ETL / "source-manifest.json"


def load_json(path: Path, fallback):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return fallback


def safe_minutes(record: dict | None) -> dict | None:
    if not record:
        return None
    return {
        key: record.get(key)
        for key in (
            "fileId", "type", "name", "fileName", "title", "sha256", "bytes",
            "pages", "changedAt", "hasVoteSummary", "revisionCount", "sourceUrl",
        )
        if record.get(key) is not None
    }


def safe_resolution_source(record: dict) -> dict:
    return {
        key: record.get(key)
        for key in (
            "fileId", "type", "name", "fileName", "title", "sha256", "bytes",
            "pages", "changedAt", "resolutionNumbers", "sourceUrl", "current",
        )
        if record.get(key) is not None
    }


def reconcile() -> None:
    manifest = load_json(MANIFEST, {"version": 1, "generatedAt": None, "meetings": {}})
    source_version_at = manifest.get("generatedAt")
    index_path = OUT / "index.json"
    index = load_json(index_path, {"source": {}, "totals": {}, "meetings": []})
    index_by_slug = {entry.get("slug"): entry for entry in index.get("meetings", [])}
    aggregate = {
        "version": 1,
        "sourceVersionAt": source_version_at,
        "source": "Town of Riverhead CivicClerk published files",
        "meetings": {},
    }

    annotated = verified_total = revised_total = 0

    for slug, source_state in sorted((manifest.get("meetings") or {}).items()):
        meeting_path = OUT / f"{slug}.json"
        if not meeting_path.exists():
            continue
        meeting = load_json(meeting_path, {})
        if not meeting:
            continue

        minutes = source_state.get("minutes") or None
        current_sources = [
            safe_resolution_source(record)
            for record in (source_state.get("resolutionSources") or {}).values()
            if record.get("current", True)
        ]
        verified_map: dict[str, list[dict]] = {}
        for source in current_sources:
            for number in source.get("resolutionNumbers") or []:
                verified_map.setdefault(number, []).append(source)

        items = meeting.get("resolutions") or meeting.get("docket") or []
        verified_here = 0
        for item in items:
            number = item.get("number")
            matches = verified_map.get(number, []) if number else []
            item["officialDocumentVerified"] = bool(matches)
            item["officialDocumentFileIds"] = [
                match.get("fileId") for match in matches if match.get("fileId") is not None
            ]
            if matches:
                verified_here += 1

        if meeting.get("preliminary"):
            status = "minutes-published-votes-pending"
        elif meeting.get("resolutions"):
            status = "vote-record-parsed"
            if verified_here:
                status = "vote-record-parsed-resolution-documents-linked"
        else:
            status = "minutes-published"

        revisions = int((minutes or {}).get("revisionCount") or 0)
        meeting["officialRecord"] = {
            "status": status,
            "sourceVersionAt": source_version_at,
            "minutes": safe_minutes(minutes),
            "minutesRevisionCount": revisions,
            "resolutionSourceCount": len(current_sources),
            "verifiedResolutionCount": verified_here,
            "resolutionSources": current_sources,
        }
        meeting_path.write_text(json.dumps(meeting, indent=1), encoding="utf-8")

        entry = index_by_slug.get(slug)
        if entry is not None:
            entry["officialRecordStatus"] = status
            entry["minutesRevisionCount"] = revisions
            entry["verifiedResolutionCount"] = verified_here
            entry["resolutionSourceCount"] = len(current_sources)

        aggregate["meetings"][slug] = {
            "eventId": source_state.get("eventId"),
            "eventName": source_state.get("eventName"),
            "startDateTime": source_state.get("startDateTime"),
            "officialRecordStatus": status,
            "minutes": safe_minutes(minutes),
            "resolutionSources": current_sources,
            "verifiedResolutionCount": verified_here,
        }
        annotated += 1
        verified_total += verified_here
        revised_total += revisions

    index_path.write_text(json.dumps(index, indent=1), encoding="utf-8")
    (OUT / "official-sources.json").write_text(json.dumps(aggregate, indent=1), encoding="utf-8")
    print(
        f"Official-source reconciliation: {annotated} meetings annotated, "
        f"{verified_total} resolution-document matches, {revised_total} archived minute revisions"
    )


if __name__ == "__main__":
    reconcile()
