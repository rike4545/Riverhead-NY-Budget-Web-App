#!/usr/bin/env python3
"""Fetch the schedule of UPCOMING Town Board meetings from CivicClerk.

Every other meetings view on the site is retrospective (what already happened).
This one looks forward: it lists the next scheduled meetings so residents can
show up and speak before a vote, not after. When the Town publishes an agenda or
agenda packet for an upcoming meeting (usually a few days out), we also extract
the resolution docket and any scheduled public hearings so residents can see
what will be decided.

Writes web/public/data/meetings/upcoming.json. Runs in the weekly parse
workflow, so the list — and each meeting's docket, once its agenda posts —
refreshes automatically.
"""

import io
import json
import re
import ssl
import subprocess
import urllib.parse
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "web/public/data/meetings"
API = "https://riverheadny.api.civicclerk.com/v1"


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


def list_upcoming():
    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT00:00:00Z")
    filt = urllib.parse.quote(f"categoryName eq 'Town Board' and startDateTime ge {now}")
    url = f"{API}/Events?$filter={filt}&$orderby=startDateTime"
    events = []
    for _ in range(20):
        data = json.loads(http_get(url))
        events.extend(data["value"])
        url = data.get("@odata.nextLink")
        if not url:
            break
    return events


# Resolution docket lines in an agenda / agenda packet, e.g. "1. 2026-686 Title".
DOCKET_ITEM = re.compile(r"^\s*(\d+)\.\s*(20\d{2}-\d{3,4})\s*(.*\S)?\s*$")
HEARING = re.compile(r"public hearing", re.IGNORECASE)


def extract_from_agenda(text):
    """Best-effort docket + public-hearing extraction from an agenda PDF's text.
    Returns ([docket items], [hearing lines]). Empty when the format doesn't
    match — we never guess."""
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


def build():
    OUT.mkdir(parents=True, exist_ok=True)
    meetings = []
    for e in list_upcoming():
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
        meetings.append({
            "slug": dt[:10],
            "date": dt[:10],
            "startDateTime": dt,
            "type": e.get("eventName", "Town Board Meeting"),
            "agendaPublished": agenda is not None,
            "docket": docket,
            "hearings": hearings,
        })

    payload = {
        "source": {"title": "Town of Riverhead Town Board — upcoming meetings (CivicClerk)",
                    "url": "https://www.townofriverheadny.gov/129/Agendas-Minutes"},
        "generatedAt": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        "meetings": meetings,
    }
    (OUT / "upcoming.json").write_text(json.dumps(payload, indent=1))
    withAgenda = sum(1 for m in meetings if m["agendaPublished"])
    print(f"upcoming: {len(meetings)} meetings ({withAgenda} with an agenda posted)")
    for m in meetings[:6]:
        print(f"  {m['startDateTime'][:16]}  agenda={m['agendaPublished']}  docket={len(m['docket'])}")


if __name__ == "__main__":
    build()
