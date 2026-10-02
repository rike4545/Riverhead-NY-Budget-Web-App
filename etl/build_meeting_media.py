#!/usr/bin/env python3
"""Link every Town Board meeting to its video and to a transcript.

Three sources, kept apart because they are not equally official:

  * The Town's own recording. CivicClerk's event record carries
    `mediaStreamPath`, the MP4 the Town's portal plays. That is the official
    video, linked as published. Recordings uploaded before mid-2025 (and a few
    since) give only a path, "RIVERHEADNY/<file>.mp4"; the same file is served
    from the Town's media CDN under "riverheadny/" (checked October 2026: every
    such file is there, and each one CivicClerk records a size for matches it
    byte for byte).
  * riverheadtranscripts.org, a volunteer site that runs OpenAI Whisper over the
    same CivicClerk videos and posts a searchable transcript and a list of
    decisions for each meeting. It says itself that it is "not an official
    record". Its index page is read once per run, only to learn which meetings
    it has a page for; nothing of its content is copied here.
  * This site's own Whisper transcripts (etl/transcribe_meetings.py), from which
    the moment each resolution was voted is carried here so a vote can link
    straight to that point in the Town's video.

A source that cannot be reached leaves the previous run's entries in place
rather than erasing them.

Output: web/public/data/meetings/media.json
"""
from __future__ import annotations

import json
import re
import subprocess
import sys
import urllib.parse
from datetime import datetime, timedelta, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MEETINGS = ROOT / "web/public/data/meetings"
TRANSCRIPTS = ROOT / "web/public/data/transcripts"
OUT = MEETINGS / "media.json"
API = "https://riverheadny.api.civicclerk.com/v1"
PORTAL = "https://riverheadny.portal.civicclerk.com"
TRANSCRIPT_SITE = "https://riverheadtranscripts.org/"
SINCE = "2022-01-01T00:00:00Z"
MEDIA_CDN = "https://cpmedia.azureedge.net/"
TRANSCRIPT_PAGE = re.compile(r'href="(meetings/town-board/(\d{4}-\d{2}-\d{2})_(\d+)\.html)"')


def http_get(url: str) -> bytes:
    return subprocess.run(["curl", "-sf", "--max-time", "60", "-A", "riverhead-budget-web-app", url],
                          capture_output=True, check=True).stdout


def town_board_events() -> list[dict]:
    until = (datetime.now(timezone.utc) + timedelta(days=1)).strftime("%Y-%m-%dT00:00:00Z")
    filt = urllib.parse.quote(f"categoryName eq 'Town Board' and startDateTime ge {SINCE} and startDateTime lt {until}")
    url, events = f"{API}/Events?$filter={filt}&$orderby=startDateTime", []
    while url:
        data = json.loads(http_get(url))
        events += data["value"]
        url = data.get("@odata.nextLink")
    return events


def video_url(path: str | None) -> str | None:
    """A full URL, or "RIVERHEADNY/<file>.mp4" resolved against the media CDN."""
    if not path:
        return None
    if path.startswith(("https://", "http://")):
        return path
    folder, _, name = path.lstrip("/").partition("/")
    return f"{MEDIA_CDN}{folder.lower()}/{name}" if folder and name else None


def transcript_pages() -> dict[str, str]:
    """{CivicClerk event id: page URL} for each Town Board meeting the site has."""
    html = http_get(TRANSCRIPT_SITE).decode("utf-8", "replace")
    return {event_id: TRANSCRIPT_SITE + path for path, _date, event_id in TRANSCRIPT_PAGE.findall(html)}


def our_transcript(date: str) -> dict | None:
    path = TRANSCRIPTS / f"{date}.json"
    if not path.exists():
        return None
    t = json.loads(path.read_text(encoding="utf-8"))
    return {"path": f"/data/transcripts/{date}.json", "model": t.get("model"), "votes": t.get("votes") or {}}


def main() -> int:
    previous = json.loads(OUT.read_text(encoding="utf-8")) if OUT.exists() else {"meetings": {}}
    meetings: dict[str, dict] = {k: dict(v) for k, v in previous.get("meetings", {}).items()}

    try:
        events = town_board_events()
    except Exception as exc:  # keep what the last run found
        print(f"CivicClerk unavailable ({exc}); keeping {len(meetings)} previous entries")
        events = []
    for e in events:
        date = e["startDateTime"][:10]
        entry = meetings.setdefault(date, {})
        entry.update({"eventId": e["id"], "name": e.get("eventName"), "portal": f"{PORTAL}/event/{e['id']}"})
        video = video_url(e.get("mediaStreamPath")) if e.get("hasMedia") else None
        if video:
            entry["video"] = video

    try:
        pages = transcript_pages()
        for entry in meetings.values():
            page = pages.get(str(entry.get("eventId")))
            if page:
                entry["transcript"] = page
            else:
                entry.pop("transcript", None)
        print(f"riverheadtranscripts.org: {len(pages)} Town Board pages")
    except Exception as exc:
        print(f"riverheadtranscripts.org unavailable ({exc}); keeping previous transcript links")

    for date, entry in meetings.items():
        ours = our_transcript(date)
        if ours:
            entry["ours"] = ours
        else:
            entry.pop("ours", None)

    payload = {
        "sources": {
            "video": {
                "title": "Town of Riverhead meeting video (CivicClerk)",
                "url": PORTAL,
                "note": "The Town's own recording, as its CivicClerk portal publishes it.",
            },
            "transcripts": {
                "title": "Riverhead Town Meeting Transcripts",
                "url": TRANSCRIPT_SITE,
                "note": "A volunteer project. Machine transcripts made with OpenAI Whisper from the Town's videos; "
                        "it calls itself not an official record.",
            },
            "ours": {
                "title": "This site's machine transcripts",
                "note": "Made here with OpenAI's open-source Whisper model from the Town's videos. Unofficial: "
                        "names and figures can be misheard. Vote times are where the resolution number is read out.",
            },
        },
        "meetings": dict(sorted(meetings.items(), reverse=True)),
    }
    OUT.write_text(json.dumps(payload, indent=1) + "\n", encoding="utf-8")
    with_video = sum(1 for m in meetings.values() if m.get("video"))
    with_transcript = sum(1 for m in meetings.values() if m.get("transcript"))
    with_ours = sum(1 for m in meetings.values() if m.get("ours"))
    print(f"media.json: {len(meetings)} meetings, {with_video} with video, {with_transcript} with a "
          f"riverheadtranscripts.org page, {with_ours} with this site's transcript")
    return 0


if __name__ == "__main__":
    sys.exit(main())
