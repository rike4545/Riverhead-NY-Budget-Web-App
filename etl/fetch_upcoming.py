#!/usr/bin/env python3
"""Fetch the current Town Board meeting timeline from official Riverhead sources.

Resident-facing rule: dates and listed items must be explicitly published by the
Town. Regular Town Board dates are reconciled to the Town's annual meeting
schedule. Resolution items come only from the published Resolutions section of
an Agenda / Agenda Packet. Public hearings come only from that agenda section
or the Town's official Public Hearings calendar for the same date.

Writes web/public/data/meetings/upcoming.json. The weekly full ETL and the
lightweight daily meeting sync both refresh this file.
"""

import html
import io
import json
import re
import ssl
import subprocess
import urllib.parse
from datetime import date, datetime, timedelta
from html.parser import HTMLParser
from pathlib import Path
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "web/public/data/meetings"
API = "https://riverheadny.api.civicclerk.com/v1"
SCHEDULE_PAGE = "https://townofriverheadny.gov/282/Town-Board-Meeting-Schedule"
CALENDAR_PAGE = "https://townofriverheadny.gov/calendar.aspx"
NY = ZoneInfo("America/New_York")
RECENT_DAYS = 14

MONTHS = {
    name: number for number, name in enumerate(
        ("January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"),
        start=1,
    )
}


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


def published_regular_meeting_dates():
    """Return regular dates explicitly printed on the Town Board schedule page.

    If the Town page cannot be parsed, return an empty set and let CivicClerk
    remain the fallback rather than deleting meetings because of a scraper error.
    """
    try:
        raw = http_get(SCHEDULE_PAGE).decode("utf-8", errors="ignore")
    except Exception:
        return set()
    text = html.unescape(re.sub(r"<[^>]+>", "\n", raw))
    text = re.sub(r"[\t\r ]+", " ", text)
    match = re.search(r"(20\d{2})\s+Meeting Dates(.*?)(?:Related Documents|$)", text, re.I | re.S)
    if not match:
        return set()
    year = int(match.group(1))
    dates = set()
    for month_name, day_text in re.findall(
        r"\b(" + "|".join(MONTHS) + r")\s+(\d{1,2})\b", match.group(2)
    ):
        try:
            dates.add(date(year, MONTHS[month_name], int(day_text)).isoformat())
        except ValueError:
            continue
    return dates


# CivicClerk returns Riverhead meeting clock times with a trailing Z. The site
# treats those clock values as local Riverhead time rather than shifting 2 PM to
# 10 AM during daylight time.
def event_local_datetime(value):
    try:
        return datetime.fromisoformat(value[:19]).replace(tzinfo=NY)
    except (TypeError, ValueError):
        return None


DOCKET_ITEM = re.compile(r"^\s*(\d+)\.\s*(20\d{2}-\d{3,4})\s*(.*\S)?\s*$")
ROMAN_SECTION = re.compile(r"^\s*[IVXLCDM]+\.\s+(.+?)\s*$", re.I)
FOOTER = re.compile(r"Town of Riverhead|www\.townofriverhead|Page \d+", re.I)


def clean(value):
    return re.sub(r"\s+", " ", value or "").strip()


def section_lines(text, section_name):
    """Return only lines inside one explicitly headed agenda section."""
    lines = text.splitlines()
    start = None
    target = section_name.lower()
    for i, line in enumerate(lines):
        m = ROMAN_SECTION.match(line)
        if m and clean(m.group(1)).lower() == target:
            start = i + 1
            break
    if start is None:
        return []
    out = []
    for line in lines[start:]:
        if ROMAN_SECTION.match(line):
            break
        out.append(line)
    return out


def normalize_hearing_title(value):
    value = clean(value.lstrip("●•-* "))
    value = re.sub(r"^\d{1,2}:\d{2}\s*(?:AM|PM)\s+", "", value, flags=re.I)
    value = re.sub(r"^Public Hearing\s*[-–—:]\s*", "", value, flags=re.I)
    return clean(value)


def extract_from_agenda(text):
    """Extract only explicitly listed Resolutions and Public Hearings sections."""
    docket = []
    cur = None
    for line in section_lines(text, "Resolutions"):
        if FOOTER.search(line):
            continue
        m = DOCKET_ITEM.match(line)
        if m:
            if cur:
                docket.append(cur)
            cur = {
                "seq": int(m.group(1)),
                "number": m.group(2),
                "title": clean(m.group(3) or ""),
            }
        elif cur and line.strip():
            cur["title"] = clean(cur["title"] + " " + line.strip())
    if cur:
        docket.append(cur)

    # Reject malformed/duplicate entries rather than expose ambiguous content.
    clean_docket, seen_numbers = [], set()
    for item in docket:
        if not item["title"] or item["number"] in seen_numbers:
            continue
        seen_numbers.add(item["number"])
        clean_docket.append(item)

    hearings = []
    for line in section_lines(text, "Public Hearings"):
        if "public hearing" not in line.lower():
            continue
        title = normalize_hearing_title(line)
        if title and title.lower() != "public hearings" and title not in hearings:
            hearings.append(title)
    return clean_docket, hearings


class HeadingParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.in_heading = False
        self.parts = []
        self.headings = []

    def handle_starttag(self, tag, attrs):
        if tag.lower() in {"h1", "h2", "h3", "h4", "h5"}:
            self.in_heading = True
            self.parts = []

    def handle_data(self, data):
        if self.in_heading:
            self.parts.append(data)

    def handle_endtag(self, tag):
        if self.in_heading and tag.lower() in {"h1", "h2", "h3", "h4", "h5"}:
            heading = clean(" ".join(self.parts))
            if heading:
                self.headings.append(heading)
            self.in_heading = False
            self.parts = []


def official_calendar_hearings(iso_date):
    """Read only explicitly posted Public Hearing event headings for a date."""
    try:
        d = date.fromisoformat(iso_date)
        url = f"{CALENDAR_PAGE}?day={d.day}&month={d.month}&view=list&year={d.year}"
        parser = HeadingParser()
        parser.feed(http_get(url).decode("utf-8", errors="ignore"))
    except Exception:
        return []
    hearings = []
    for heading in parser.headings:
        if "public hearing" not in heading.lower() or heading.lower() == "public hearings":
            continue
        title = normalize_hearing_title(heading)
        if title and title not in hearings:
            hearings.append(title)
    return hearings


def event_item(e):
    dt = e.get("startDateTime", "")
    files = e.get("publishedFiles") or []
    agenda = next(
        (f for f in files if clean(f.get("type", "")).lower() in {"agenda", "agenda packet"}),
        None,
    )
    docket, agenda_hearings = [], []
    if agenda:
        try:
            import pypdf
            pdf = http_get(f"{API}/Meetings/GetMeetingFileStream(fileId={agenda['fileId']},plainText=false)")
            reader = pypdf.PdfReader(io.BytesIO(pdf))
            text = "\n".join((p.extract_text() or "") for p in reader.pages)
            docket, agenda_hearings = extract_from_agenda(text)
        except Exception:
            docket, agenda_hearings = [], []

    calendar_hearings = official_calendar_hearings(dt[:10]) if dt else []
    hearings = []
    for title in calendar_hearings + agenda_hearings:
        if title and title not in hearings:
            hearings.append(title)

    if docket and calendar_hearings:
        items_source = "published-agenda+official-calendar"
    elif docket or agenda_hearings:
        items_source = "published-agenda"
    elif calendar_hearings:
        items_source = "official-calendar"
    else:
        items_source = None

    return {
        "slug": dt[:10],
        "date": dt[:10],
        "startDateTime": dt,
        "type": e.get("eventName", "Town Board Meeting"),
        "agendaPublished": agenda is not None,
        "itemsSource": items_source,
        "docket": docket,
        "hearings": hearings,
    }


def build():
    OUT.mkdir(parents=True, exist_ok=True)
    now = datetime.now(NY)
    recent, meetings = [], []
    regular_dates = published_regular_meeting_dates()

    for e in list_schedule():
        item = event_item(e)
        # A normal "Town Board Meeting" must appear on the Town's published
        # annual schedule when that schedule can be parsed. Explicitly named
        # special/emergency meetings remain eligible through CivicClerk.
        if regular_dates and clean(item["type"]).lower() == "town board meeting" and item["date"] not in regular_dates:
            continue
        local_dt = event_local_datetime(item["startDateTime"])
        if local_dt and local_dt < now:
            recent.append(item)
        else:
            meetings.append(item)

    recent = list(reversed(recent[-6:]))

    payload = {
        "source": {
            "title": "Town of Riverhead Town Board schedule and published meeting items",
            "url": "https://www.townofriverheadny.gov/129/Agendas-Minutes",
        },
        "scheduleSource": {
            "title": "Town of Riverhead Town Board Meeting Schedule",
            "url": SCHEDULE_PAGE,
        },
        "generatedAt": now.strftime("%Y-%m-%d"),
        "officialScheduleDates": sorted(regular_dates),
        "recent": recent,
        "meetings": meetings,
    }
    (OUT / "upcoming.json").write_text(json.dumps(payload, indent=1))

    with_items = sum(1 for m in recent + meetings if m["docket"] or m["hearings"])
    print(f"meeting timeline: {len(recent)} recent + {len(meetings)} upcoming ({with_items} with published items)")
    for label, rows in (("recent", recent[:3]), ("next", meetings[:4])):
        for m in rows:
            print(
                f"  {label:6} {m['startDateTime'][:16]}  agenda={m['agendaPublished']} "
                f"docket={len(m['docket'])} hearings={len(m['hearings'])} source={m['itemsSource']}"
            )


if __name__ == "__main__":
    build()
