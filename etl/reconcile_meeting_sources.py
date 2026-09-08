#!/usr/bin/env python3
"""Attach official-source audit state to parsed Town Board meeting records.

Runs after parse_meetings.py and the agenda-packet vote fallback. It does not
invent vote interpretation; it joins the parsed decision record to the
CivicClerk source manifest produced by the fetchers.

Outputs:
* each <date>.json gains ``officialRecord`` metadata;
* each resolution/docket item gains ``officialDocumentVerified`` and the
  matching CivicClerk resolution-file IDs when a separately published official
  resolution source contains that exact resolution number;
* index.json gains compact official-record status fields;
* official-sources.json exposes a safe aggregate audit view for the website.

``sourceVersionAt`` is per meeting: it means the last time that meeting's
committed CivicClerk source state changed. The polling workflow itself runs
twice daily but does not create a false new data timestamp when hashes are
unchanged.
"""

from __future__ import annotations

import json
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ETL = ROOT / "etl/data/meetings"
OUT = ROOT / "web/public/data/meetings"
MANIFEST = ETL / "source-manifest.json"
PENDING_GRACE_DAYS = 7


def load_json(path: Path, fallback):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return fallback


def safe_source(record: dict | None, extra: tuple[str, ...] = ()) -> dict | None:
    if not record:
        return None
    keys = (
        "fileId", "type", "name", "fileName", "title", "sha256", "bytes",
        "pages", "changedAt", "revisionCount", "sourceUrl", "portalUrl",
    ) + extra
    return {key: record.get(key) for key in keys if record.get(key) is not None}


def safe_minutes(record: dict | None) -> dict | None:
    return safe_source(record, ("hasVoteSummary",))


def safe_vote_packet(record: dict | None) -> dict | None:
    return safe_source(
        record,
        ("hasVoteBlocks", "voteBlockCount", "resolutionNumbers", "current"),
    )


def safe_resolution_source(record: dict) -> dict:
    return {
        key: record.get(key)
        for key in (
            "fileId", "type", "name", "fileName", "title", "sha256", "bytes",
            "pages", "changedAt", "resolutionNumbers", "sourceUrl", "portalUrl", "current",
        )
        if record.get(key) is not None
    }


def historical_vote_detail_omitted(slug: str, minutes: dict | None) -> bool:
    if not minutes:
        return False
    try:
        return (date.today() - date.fromisoformat(slug)).days > PENDING_GRACE_DAYS
    except ValueError:
        return False


def reconcile() -> None:
    manifest = load_json(MANIFEST, {"version": 1, "generatedAt": None, "meetings": {}})
    index_path = OUT / "index.json"
    index = load_json(index_path, {"source": {}, "totals": {}, "meetings": []})
    index_by_slug = {entry.get("slug"): entry for entry in index.get("meetings", [])}
    aggregate = {
        "version": 2,
        "sourceVersionAt": manifest.get("generatedAt"),
        "source": "Town of Riverhead CivicClerk published files",
        "meetings": {},
    }

    annotated = verified_total = revised_total = agenda_vote_total = 0

    for slug, source_state in sorted((manifest.get("meetings") or {}).items()):
        meeting_path = OUT / f"{slug}.json"
        if not meeting_path.exists():
            continue
        meeting = load_json(meeting_path, {})
        if not meeting:
            continue

        meeting_source_version = source_state.get("sourceVersionAt") or manifest.get("generatedAt")
        minutes = source_state.get("minutes") or None
        vote_packet = source_state.get("votePacket") or None
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
            status = (
                "minutes-published-vote-detail-omitted"
                if historical_vote_detail_omitted(slug, minutes)
                else "minutes-published-votes-pending"
            )
        elif meeting.get("resolutions"):
            status = "vote-record-parsed"
            if verified_here:
                status = "vote-record-parsed-resolution-documents-linked"
        else:
            status = "minutes-published"

        vote_source_kind = meeting.get("voteSource")
        if not vote_source_kind and meeting.get("resolutions") and (minutes or {}).get("hasVoteSummary"):
            vote_source_kind = "minutes"
        vote_source = None
        if vote_source_kind == "agenda-packet":
            vote_source = safe_vote_packet(vote_packet)
            agenda_vote_total += 1
        elif vote_source_kind == "minutes":
            vote_source = safe_minutes(minutes)

        revisions = int((minutes or {}).get("revisionCount") or 0)
        meeting["officialRecord"] = {
            "status": status,
            "sourceVersionAt": meeting_source_version,
            "minutes": safe_minutes(minutes),
            "votePacket": safe_vote_packet(vote_packet),
            "voteSourceKind": vote_source_kind,
            "voteSource": vote_source,
            "minutesRevisionCount": revisions,
            "resolutionSourceCount": len(current_sources),
            "verifiedResolutionCount": verified_here,
            "resolutionSources": current_sources,
        }
        meeting_path.write_text(json.dumps(meeting, indent=1), encoding="utf-8")

        entry = index_by_slug.get(slug)
        if entry is not None:
            entry["officialRecordStatus"] = status
            entry["voteSource"] = vote_source_kind
            entry["minutesRevisionCount"] = revisions
            entry["verifiedResolutionCount"] = verified_here
            entry["resolutionSourceCount"] = len(current_sources)
            entry["sourceVersionAt"] = meeting_source_version

        aggregate["meetings"][slug] = {
            "eventId": source_state.get("eventId"),
            "eventName": source_state.get("eventName"),
            "startDateTime": source_state.get("startDateTime"),
            "sourceVersionAt": meeting_source_version,
            "officialRecordStatus": status,
            "minutes": safe_minutes(minutes),
            "votePacket": safe_vote_packet(vote_packet),
            "voteSourceKind": vote_source_kind,
            "voteSource": vote_source,
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
        f"{verified_total} resolution-document matches, {revised_total} archived minute revisions, "
        f"{agenda_vote_total} agenda-packet vote source(s)"
    )


if __name__ == "__main__":
    reconcile()
