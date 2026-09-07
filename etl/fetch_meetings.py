#!/usr/bin/env python3
"""Continuously reconcile official Town Board records from CivicClerk.

The old fetcher stopped checking a Minutes PDF once it contained ``RESULT:``.
That was fast, but it could miss a later Clerk correction. This version treats
CivicClerk as a changing official source:

* every published Minutes file is re-checked by SHA-256;
* changed minutes replace the current text and archive the prior text revision;
* published resolution/adopted-resolution files are also fingerprinted and
  retained as official supporting records;
* a machine-readable source manifest records CivicClerk file IDs, hashes,
  revision history and discovered resolution numbers.

parse_meetings.py consumes that manifest so the public JSON can say exactly
which stage of the official record is available without guessing.
"""

from __future__ import annotations

import hashlib
import io
import json
import re
import ssl
import subprocess
import urllib.parse
from datetime import datetime, timedelta, timezone
from pathlib import Path

import pypdf

ROOT = Path(__file__).resolve().parent.parent
DEST = ROOT / "etl/data/meetings"
MANIFEST_PATH = DEST / "source-manifest.json"
REVISIONS = DEST / "revisions"
OFFICIAL = DEST / "official"
API = "https://riverheadny.api.civicclerk.com/v1"
SINCE = "2025-01-01T00:00:00Z"
RESOLUTION_NUMBER = re.compile(r"\b20\d{2}-\d{3,4}\b")


def now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def http_get(url: str) -> bytes:
    """GET bytes, with a curl fallback for older local TLS stacks."""
    try:
        import requests
        r = requests.get(url, timeout=90)
        r.raise_for_status()
        return r.content
    except Exception as exc:
        if not isinstance(exc, (ssl.SSLError, OSError)) and "SSL" not in str(exc):
            raise
        return subprocess.run(["curl", "-sf", url], capture_output=True, check=True).stdout


def list_events() -> list[dict]:
    until = (datetime.now(timezone.utc) + timedelta(days=1)).strftime("%Y-%m-%dT00:00:00Z")
    filt = urllib.parse.quote(
        f"categoryName eq 'Town Board' and startDateTime ge {SINCE} and startDateTime lt {until}"
    )
    url = f"{API}/Events?$filter={filt}&$orderby=startDateTime"
    events: list[dict] = []
    for _ in range(50):
        data = json.loads(http_get(url))
        events.extend(data["value"])
        url = data.get("@odata.nextLink")
        if not url:
            break
    return events


def load_manifest() -> dict:
    if not MANIFEST_PATH.exists():
        return {"version": 1, "generatedAt": None, "meetings": {}}
    try:
        data = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    except Exception:
        data = {"version": 1, "generatedAt": None, "meetings": {}}
    data.setdefault("version", 1)
    data.setdefault("meetings", {})
    return data


def extract_text(pdf_bytes: bytes) -> tuple[str, int]:
    reader = pypdf.PdfReader(io.BytesIO(pdf_bytes))
    text = "\n".join((p.extract_text() or "") for p in reader.pages)
    return text, len(reader.pages)


def file_label(file: dict) -> str:
    return str(file.get("type") or file.get("name") or file.get("fileName") or "Published File")


def is_minutes(file: dict) -> bool:
    return file_label(file).strip().lower() == "minutes"


def is_resolution_source(file: dict) -> bool:
    label = " ".join(
        str(file.get(k) or "") for k in ("type", "name", "fileName", "title")
    ).lower()
    return "resolution" in label and "agenda" not in label


def safe_slug(value: str) -> str:
    value = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return value or "official-record"


def stream_url(file_id: int | str) -> str:
    return f"{API}/Meetings/GetMeetingFileStream(fileId={file_id},plainText=false)"


def archived_minutes_path(date: str, sha: str) -> Path:
    return REVISIONS / date / f"minutes-{sha[:16]}.txt"


def official_text_path(date: str, file: dict, sha: str) -> Path:
    fid = file.get("fileId")
    return OFFICIAL / date / f"{safe_slug(file_label(file))}-{fid}-{sha[:16]}.txt"


def public_file_metadata(file: dict) -> dict:
    # Preserve only stable/useful CivicClerk metadata. Different API revisions
    # expose slightly different names, so optional fields are copied defensively.
    out = {"fileId": file.get("fileId"), "type": file.get("type")}
    for key in ("name", "fileName", "title", "publishedDate", "modifiedDate", "lastModified"):
        if file.get(key) is not None:
            out[key] = file.get(key)
    return out


def reconcile_minutes(date: str, event_name: str, file: dict, meeting_state: dict) -> tuple[bool, bool]:
    """Return (changed, has_vote_summary)."""
    fid = file.get("fileId")
    if fid is None:
        return False, False
    pdf_bytes = http_get(stream_url(fid))
    sha = hashlib.sha256(pdf_bytes).hexdigest()
    text, pages = extract_text(pdf_bytes)
    has_votes = bool(re.search(r"RESULT\s*:", text))
    dest = DEST / f"{date}-minutes.txt"

    previous = meeting_state.get("minutes") or {}
    previous_sha = previous.get("sha256")
    revisions = list(previous.get("revisions") or [])
    changed = previous_sha != sha or not dest.exists()

    if changed and dest.exists() and previous_sha:
        archive = archived_minutes_path(date, previous_sha)
        archive.parent.mkdir(parents=True, exist_ok=True)
        if not archive.exists():
            archive.write_text(dest.read_text(encoding="utf-8", errors="ignore"), encoding="utf-8")
        if not any(r.get("sha256") == previous_sha for r in revisions):
            revisions.append({
                "sha256": previous_sha,
                "archivedTextPath": str(archive.relative_to(ROOT)),
                "supersededAt": now_iso(),
            })

    if changed:
        dest.write_text(text, encoding="utf-8")

    meeting_state["minutes"] = {
        **public_file_metadata(file),
        "sha256": sha,
        "bytes": len(pdf_bytes),
        "pages": pages,
        "fetchedAt": now_iso(),
        "textPath": str(dest.relative_to(ROOT)),
        "hasVoteSummary": has_votes,
        "revisionCount": len(revisions),
        "revisions": revisions,
        "sourceUrl": stream_url(fid),
    }
    verb = "UPDATED" if previous_sha and previous_sha != sha else ("NEW" if changed else "same")
    print(f"  {verb:<7} {date} minutes ({pages} pages, votes={'yes' if has_votes else 'pending'}) {event_name}")
    return changed, has_votes


def reconcile_resolution_source(date: str, file: dict, meeting_state: dict) -> bool:
    fid = file.get("fileId")
    if fid is None:
        return False
    pdf_bytes = http_get(stream_url(fid))
    sha = hashlib.sha256(pdf_bytes).hexdigest()
    text, pages = extract_text(pdf_bytes)
    numbers = sorted(set(RESOLUTION_NUMBER.findall(text)))
    path = official_text_path(date, file, sha)
    path.parent.mkdir(parents=True, exist_ok=True)
    if not path.exists():
        path.write_text(text, encoding="utf-8")

    sources = meeting_state.setdefault("resolutionSources", {})
    key = str(fid)
    previous = sources.get(key) or {}
    changed = previous.get("sha256") != sha
    history = list(previous.get("history") or [])
    if changed and previous.get("sha256") and not any(h.get("sha256") == previous.get("sha256") for h in history):
        history.append({
            "sha256": previous.get("sha256"),
            "textPath": previous.get("textPath"),
            "supersededAt": now_iso(),
        })
    sources[key] = {
        **public_file_metadata(file),
        "sha256": sha,
        "bytes": len(pdf_bytes),
        "pages": pages,
        "fetchedAt": now_iso(),
        "textPath": str(path.relative_to(ROOT)),
        "resolutionNumbers": numbers,
        "history": history,
        "sourceUrl": stream_url(fid),
    }
    print(f"  {'UPDATED' if previous else 'NEW':<7} {date} {file_label(file)} ({len(numbers)} resolution numbers)") if changed else None
    return changed


def fetch() -> None:
    DEST.mkdir(parents=True, exist_ok=True)
    events = list_events()
    manifest = load_manifest()
    print(f"Town Board events since {SINCE[:10]}: {len(events)}")

    changed_files = 0
    pending_minutes = 0
    tracked_resolution_files = 0

    for event in events:
        date = event["startDateTime"][:10]
        files = event.get("publishedFiles") or []
        meeting_state = manifest["meetings"].setdefault(date, {})
        meeting_state.update({
            "eventId": event.get("eventId") or event.get("id"),
            "eventName": event.get("eventName"),
            "startDateTime": event.get("startDateTime"),
        })

        minutes_files = [f for f in files if is_minutes(f)]
        if minutes_files:
            # CivicClerk normally exposes one Minutes file. If there are several,
            # the last published entry is treated as current and its fileId/hash
            # still makes any replacement auditable.
            changed, _ = reconcile_minutes(date, event.get("eventName", "Town Board"), minutes_files[-1], meeting_state)
            changed_files += int(changed)
        elif date <= datetime.now(timezone.utc).strftime("%Y-%m-%d"):
            pending_minutes += 1
            meeting_state["minutesPending"] = True

        resolution_files = [f for f in files if is_resolution_source(f)]
        tracked_resolution_files += len(resolution_files)
        current_ids = set()
        for file in resolution_files:
            fid = file.get("fileId")
            if fid is None:
                continue
            current_ids.add(str(fid))
            changed_files += int(reconcile_resolution_source(date, file, meeting_state))

        # Do not delete old source history when CivicClerk removes/replaces a
        # published file; mark it no longer current so the audit trail remains.
        for fid, source in (meeting_state.get("resolutionSources") or {}).items():
            source["current"] = fid in current_ids

    manifest["generatedAt"] = now_iso()
    MANIFEST_PATH.write_text(json.dumps(manifest, indent=2, sort_keys=True), encoding="utf-8")
    print(
        f"Done: {changed_files} official-file changes, {pending_minutes} past meetings awaiting minutes, "
        f"{tracked_resolution_files} current resolution-source files tracked"
    )


if __name__ == "__main__":
    fetch()
