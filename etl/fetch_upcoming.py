#!/usr/bin/env python3
"""Fetch the current Town Board meeting timeline from CivicClerk.

The resident view needs both sides of the meeting boundary: what is coming up,
and what just finished but has not yet reached the vote archive. We therefore
retain a short recent-completed window alongside future meetings. When an agenda
or agenda packet is available, we extract the resolution docket and public
hearings without guessing.

Writes web/public/data/meetings/upcoming.json. The weekly full ETL and the
lightweight daily meeting sync both refresh this file.
"""

import io
import json
import re
import ssl
import subprocess
import urllib.parse
from datetime import datetime, timedelta, timezone
from pathlib import Path
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "web/public/data/meetings"
API = "https://riverheadny.api.civicclerk.com/v1"
NY = ZoneInfo("America/New_York")
RECENT_DAYS = 14


def http_get(url):
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


def list_schedule():
    since = (datetime.now(NY) - timedelta(days=RECENT_DAYS)).strftime("%Y-%m-%dT00:00:00Z")
    filt = urllib.parse.quote(f"categoryName eq 'Town Board' and startDateTime ge {since}")
    url = f"{API}/Events?$filter={filt}&$orderby=startDateTime"
    events = []
    for _ in range(20):
        data = json.loads(http_get(url))
        events.extend(data["value"])
        url = data.get("@odata.nextLink")
        if not url:
            break
    return events


# CivicClerk returns Riverhead meeting clock times with a trailing Z. The site
# has historically treated those clock values as local Riverhead time, so do the
# same here rather than shifting 2:00 PM to 10:00 AM during daylight time.
def event_local_datetime(value):
    try:
        return datetime.fromisoformat(value[:19]).replace(tzinfo=NY)
    except (TypeError, ValueError):
        return None


# Resolution docket lines in an agenda / agenda packet, e.g. "1. 2026-686 Title".
DOCKET_ITEM = re.compile(r"^\s*(\d+)\.\s*(20\d{2}-\d{3,4})\s*(.*\S)?\s*$")
HEARING = re.compile(r"public hearing", re.IGNORECASE)


def extract_from_agenda(text):
    """Best-effort docket + public-hearing extraction from an agenda PDF.

    Empty results are preferable to invented content: the UI will say the
    agenda details are not indexed yet rather than infer them.
    """
    docket, cur, hearings = [], None, []
    for ln in text.splitlines():
        if HEARING.search(ln) and len(ln.strip()) < 160:
            h = ln.strip()
            if h not in hearings:
                hearings.append(h)
        m = DOCKET_ITEM.match(ln)
        if m:
            if cur:
                docket.append(cur)
            cur = {"seq": int(m.group(1)), "number": m.group(2), "title": (m.group(3) or "").strip()}
        elif cur and ln.strip() and not ln.strip().lower().startswith(("i.", "ii.", "iii.", "iv.", "v.", "vi.")):
            cur["title"] = (cur["title"] + " " + ln.strip()).strip()
    if cur:
        docket.append(cur)
    return docket, hearings


def event_item(e):
    dt = e.get("startDateTime", "")
    files = e.get("publishedFiles") or []
    agenda = next((f for f in files if f.get("type") in ("Agenda", "Agenda Packet")), None)
    docket, hearings = [], []
    if agenda:
        try:
            import pypdf
            pdf = http_get(f"{API}/Meetings/GetMeetingFileStream(fileId={agenda['fileId']},plainText=false)")
            reader = pypdf.PdfReader(io.BytesIO(pdf))
            text = "\n".join((p.extract_text() or "") for p in reader.pages)
            docket, hearings = extract_from_agenda(text)
        except Exception:
            docket, hearings = [], []
    return {
        "slug": dt[:10],
        "date": dt[:10],
        "startDateTime": dt,
        "type": e.get("eventName", "Town Board Meeting"),
        "agendaPublished": agenda is not None,
        "docket": docket,
        "hearings": hearings,
    }


def build():
    OUT.mkdir(parents=True, exist_ok=True)
    now = datetime.now(NY)
    recent, meetings = [], []

    for e in list_schedule():
        item = event_item(e)
        local_dt = event_local_datetime(item["startDateTime"])
        if local_dt and local_dt < now:
            recent.append(item)
        else:
            meetings.append(item)

    # Newest completed first; future schedule remains chronological.
    recent = list(reversed(recent[-6:]))

    payload = {
        "source": {
            "title": "Town of Riverhead Town Board schedule (CivicClerk)",
            "url": "https://www.townofriverheadny.gov/129/Agendas-Minutes",
        },
        "generatedAt": now.strftime("%Y-%m-%d"),
        "recent": recent,
        "meetings": meetings,
    }
    (OUT / "upcoming.json").write_text(json.dumps(payload, indent=1))

    with_agenda = sum(1 for m in recent + meetings if m["agendaPublished"])
    print(f"meeting timeline: {len(recent)} recent + {len(meetings)} upcoming ({with_agenda} with agenda)")
    for label, rows in (("recent", recent[:3]), ("next", meetings[:4])):
        for m in rows:
            print(f"  {label:6} {m['startDateTime'][:16]}  agenda={m['agendaPublished']}  docket={len(m['docket'])}")


if __name__ == "__main__":
    build()
