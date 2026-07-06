#!/usr/bin/env python3
"""Fetch new Town Board meeting minutes from the Town's CivicClerk portal.

Queries the public CivicClerk API for Town Board events, downloads any
published Minutes PDF we don't already have, extracts its text, and saves it
to etl/data/meetings/YYYY-MM-DD-minutes.txt — where parse_meetings.py picks it
up. Idempotent: existing files are never re-fetched, so a meeting's record is
stable once parsed.

Runs in the weekly parse workflow so new meetings appear on the site
automatically once the Town publishes their minutes.
"""

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
API = "https://riverheadny.api.civicclerk.com/v1"
# History starts at the first meeting we track.
SINCE = "2025-01-01T00:00:00Z"


def http_get(url):
    """GET bytes. Falls back to curl when the local Python's OpenSSL is too
    old for the API's TLS policy (macOS system Python); CI uses requests."""
    try:
        import requests
        r = requests.get(url, timeout=60)
        r.raise_for_status()
        return r.content
    except Exception as exc:
        if not isinstance(exc, (ssl.SSLError, OSError)) and "SSL" not in str(exc):
            raise
        out = subprocess.run(["curl", "-sf", url], capture_output=True, check=True)
        return out.stdout


def list_events():
    until = (datetime.now(timezone.utc) + timedelta(days=1)).strftime("%Y-%m-%dT00:00:00Z")
    filt = urllib.parse.quote(
        f"categoryName eq 'Town Board' and startDateTime ge {SINCE} and startDateTime lt {until}"
    )
    url = f"{API}/Events?$filter={filt}&$orderby=startDateTime"
    events = []
    # The API serves small pages regardless of $top — follow @odata.nextLink.
    for _ in range(50):
        data = json.loads(http_get(url))
        events.extend(data["value"])
        url = data.get("@odata.nextLink")
        if not url:
            break
    return events


def fetch():
    DEST.mkdir(parents=True, exist_ok=True)
    events = list_events()
    print(f"Town Board events since {SINCE[:10]}: {len(events)}")
    new = skipped = pending = 0

    for e in events:
        date = e["startDateTime"][:10]
        dest = DEST / f"{date}-minutes.txt"
        minutes = [f for f in (e.get("publishedFiles") or []) if f.get("type") == "Minutes"]
        if not minutes:
            if e["startDateTime"][:10] <= datetime.now(timezone.utc).strftime("%Y-%m-%d"):
                pending += 1
            continue
        if dest.exists():
            skipped += 1
            continue
        fid = minutes[0]["fileId"]
        url = f"{API}/Meetings/GetMeetingFileStream(fileId={fid},plainText=false)"
        pdf_bytes = http_get(url)
        reader = pypdf.PdfReader(io.BytesIO(pdf_bytes))
        text = "\n".join((p.extract_text() or "") for p in reader.pages)
        if not re.search(r"RESULT\s*:", text):
            # Minutes without a voting summary (e.g. executive sessions) are
            # still saved; the parser skips meetings with no recorded votes.
            print(f"  {date}: minutes have no vote summary (saved anyway)")
        dest.write_text(text, encoding="utf-8")
        new += 1
        print(f"  NEW  {date}  ({len(reader.pages)} pages, {len(text):,} chars)  {e['eventName']}")

    print(f"Done: {new} new, {skipped} already saved, {pending} past meetings without published minutes yet")


if __name__ == "__main__":
    fetch()
