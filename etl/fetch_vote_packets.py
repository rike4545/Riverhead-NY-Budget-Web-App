#!/usr/bin/env python3
"""Fetch official CivicClerk agenda packets only when meeting minutes omit votes.

Riverhead's condensed meeting-minutes PDF can list the resolutions without the
per-resolution vote fields. The full CivicClerk Agenda Packet may still carry an
embedded ``THE VOTE`` block at the end of each resolution, with fields such as
``RESULT``, ``MOVER``, ``SECONDER``, ``AYES`` and ``NAYS``.

This script is intentionally narrow:
* it only inspects past Town Board meetings whose tracked Minutes source does not
  already contain a RESULT field;
* it records an Agenda Packet as a vote-bearing source only from the official
  CivicClerk published-file inventory;
* it fingerprints the packet, persists extracted text for reproducibility, and
  records the number of actual THE VOTE/RESULT blocks in source-manifest.json;
* no-op polls preserve timestamps and do not create repository churn.

The parser can then use this packet as an official fallback without treating an
agenda title, fiscal-impact form, or meeting video as proof of a vote.
"""

from __future__ import annotations

import hashlib
import json
import re
from datetime import datetime, timezone
from pathlib import Path

from fetch_meetings import (
    DEST,
    MANIFEST_PATH,
    archived_minutes_path,
    extract_text,
    file_label,
    http_get,
    list_events,
    load_manifest,
    now_iso,
    public_file_metadata,
    stable_json,
    stream_url,
)

ROOT = Path(__file__).resolve().parent.parent
VOTE_PACKET_REVISIONS = DEST / "revisions"
VOTE_BLOCK = re.compile(r"^\s*THE\s+VOTE\s*$", re.I | re.M)
RESULT_FIELD = re.compile(r"^\s*RESULT\s*:\s*", re.I | re.M)
RESOLUTION_NUMBER = re.compile(r"\b20\d{2}-\d{1,4}\b")


def is_agenda_packet(file: dict) -> bool:
    label = " ".join(
        str(file.get(key) or "")
        for key in ("type", "name", "fileName", "title")
    ).strip().lower()
    return "agenda packet" in label


def vote_packet_path(date: str) -> Path:
    return DEST / f"{date}-vote-packet.txt"


def archived_vote_packet_path(date: str, sha: str) -> Path:
    return VOTE_PACKET_REVISIONS / date / f"vote-packet-{sha[:16]}.txt"


def portal_url(event_id: int | str | None, file_id: int | str) -> str | None:
    if event_id is None:
        return None
    return f"https://riverheadny.portal.civicclerk.com/event/{event_id}/files/agenda/{file_id}"


def reconcile_packet(date: str, event: dict, file: dict, meeting_state: dict) -> bool:
    fid = file.get("fileId")
    if fid is None:
        return False

    pdf_bytes = http_get(stream_url(fid))
    sha = hashlib.sha256(pdf_bytes).hexdigest()
    text, pages = extract_text(pdf_bytes)
    vote_headers = len(VOTE_BLOCK.findall(text))
    result_fields = len(RESULT_FIELD.findall(text))
    vote_blocks = min(vote_headers, result_fields) if vote_headers else result_fields
    dest = vote_packet_path(date)

    previous = meeting_state.get("votePacket") or {}
    previous_sha = previous.get("sha256")
    revisions = list(previous.get("revisions") or [])
    event_id = event.get("eventId") or event.get("id")

    observed = {
        **public_file_metadata(file),
        "sha256": sha,
        "bytes": len(pdf_bytes),
        "pages": pages,
        "textPath": str(dest.relative_to(ROOT)),
        "voteBlockCount": vote_blocks,
        "hasVoteBlocks": bool(vote_blocks),
        "resolutionNumbers": sorted(set(RESOLUTION_NUMBER.findall(text))),
        "revisionCount": len(revisions),
        "revisions": revisions,
        "sourceUrl": stream_url(fid),
        "portalUrl": portal_url(event_id, fid),
        "current": True,
    }
    comparable_previous = {key: previous.get(key) for key in observed}
    changed = previous_sha != sha or comparable_previous != observed or not dest.exists()

    if changed and dest.exists() and previous_sha and previous_sha != sha:
        archive = archived_vote_packet_path(date, previous_sha)
        archive.parent.mkdir(parents=True, exist_ok=True)
        if not archive.exists():
            archive.write_text(dest.read_text(encoding="utf-8", errors="ignore"), encoding="utf-8")
        if not any(revision.get("sha256") == previous_sha for revision in revisions):
            revisions.append({
                "sha256": previous_sha,
                "archivedTextPath": str(archive.relative_to(ROOT)),
                "supersededAt": now_iso(),
            })
        observed["revisions"] = revisions
        observed["revisionCount"] = len(revisions)

    if changed:
        dest.write_text(text, encoding="utf-8")
        observed["changedAt"] = now_iso()
        meeting_state["votePacket"] = observed
    else:
        meeting_state["votePacket"] = previous

    verb = "UPDATED" if previous_sha and previous_sha != sha else ("NEW" if not previous_sha else "same")
    print(
        f"  {verb:<7} {date} agenda packet "
        f"({pages} pages, THE VOTE/RESULT blocks={vote_blocks})"
    )
    return changed


def main() -> int:
    events = list_events()
    manifest = load_manifest()
    original = stable_json(manifest)
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    changed_files = 0
    inspected = 0

    for event in events:
        date = event.get("startDateTime", "")[:10]
        if not date or date > today:
            continue
        meeting_state = (manifest.get("meetings") or {}).get(date)
        if not meeting_state:
            continue
        minutes = meeting_state.get("minutes") or {}
        if minutes.get("hasVoteSummary"):
            # Minutes already carry the authoritative vote block; no fallback
            # packet is necessary for vote reconstruction.
            continue

        files = event.get("publishedFiles") or []
        packets = [file for file in files if is_agenda_packet(file)]
        previous_source_version = meeting_state.get("sourceVersionAt")
        meeting_before = stable_json(meeting_state)

        if packets:
            inspected += 1
            changed_files += int(reconcile_packet(date, event, packets[-1], meeting_state))
        elif meeting_state.get("votePacket"):
            # Preserve history but mark a source no longer present in CivicClerk's
            # current published-file inventory as non-current.
            packet = dict(meeting_state["votePacket"])
            if packet.get("current", True):
                packet["current"] = False
                meeting_state["votePacket"] = packet

        meeting_state["sourceVersionAt"] = previous_source_version
        if stable_json(meeting_state) != meeting_before:
            meeting_state["sourceVersionAt"] = now_iso()
        elif previous_source_version is None:
            meeting_state.pop("sourceVersionAt", None)

    candidate = stable_json(manifest)
    if candidate != original or not MANIFEST_PATH.exists():
        manifest["generatedAt"] = now_iso()
        MANIFEST_PATH.write_text(json.dumps(manifest, indent=2, sort_keys=True), encoding="utf-8")
        print("  vote-packet source state changed — repository update required")
    else:
        print("  vote-packet source state unchanged")

    print(f"Done: inspected {inspected} vote-less meetings; {changed_files} agenda-packet changes")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
