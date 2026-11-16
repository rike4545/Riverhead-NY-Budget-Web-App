#!/usr/bin/env python3
"""Record how the Town Board voted on the resolutions the hand-written pages
depend on.

etl/data/watched-resolutions.json lists them: a meeting date and a phrase from
the agenda title. This looks each one up in that meeting's parsed record
(web/public/data/meetings/<date>-fiscal.json, built from CivicClerk by
refresh_meeting_records.py) and writes web/public/data/watched-resolutions.json
with its status, which the pages read. A vote therefore changes the pages on the
next meeting sync with no one editing them.

Status is only what the official record says:
  pending   the meeting has no parsed record yet, the item is not in it, or it
            has no vote recorded
  adopted   the record shows it adopted (unanimous or split)
  tabled    the record shows it tabled
  failed    the record shows a vote that did not adopt it

Run after refresh_meeting_records.py (sync-meetings.yml does):
    python3 etl/resolve_watched.py
"""
import datetime as dt
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
REGISTRY = ROOT / "etl/data/watched-resolutions.json"
MEETINGS = ROOT / "web/public/data/meetings"
OUT = ROOT / "web/public/data/watched-resolutions.json"
# Minutes usually post within a week or two. Past this, a still-pending item
# more likely means a renamed title or a parser gap than a slow clerk.
OVERDUE_DAYS = 21


def status_of(vote):
    if not vote or vote.get("adopted") is None:
        return "pending"
    if vote.get("adopted"):
        return "adopted"
    return "tabled" if vote.get("tag") == "tabled" else "failed"


def resolve(item, meetings_dir=MEETINGS):
    out = {k: item[k] for k in ("id", "meetingDate", "agendaItem", "match", "pages", "followUps")}
    out.update(status="pending", number=None, title=None, voteTag=None, ayes=None, nays=None, note=None)
    record = meetings_dir / f"{item['meetingDate']}-fiscal.json"
    if not record.exists():
        out["note"] = "The meeting has no parsed record yet."
        return out
    resolutions = json.loads(record.read_text(encoding="utf-8")).get("resolutions", [])
    phrase = item["match"].lower()
    hits = [r for r in resolutions if phrase in (r.get("title") or "").lower()]
    if not hits:
        out["note"] = "The meeting's record has no resolution with this title."
        return out
    if len(hits) > 1:
        # Two resolutions sharing the phrase is ambiguous: say so rather than pick one.
        out["note"] = f"{len(hits)} resolutions match this title; make `match` more specific."
        return out
    r = hits[0]
    vote = r.get("vote") or {}
    out.update(
        status=status_of(vote),
        number=r.get("number"),
        title=r.get("title"),
        voteTag=vote.get("tag"),
        ayes=vote.get("ayes"),
        nays=vote.get("nays"),
    )
    if out["status"] == "pending":
        out["note"] = "On the agenda; no vote recorded yet."
    return out


def days_overdue(item, today=None):
    """Days past the grace period for a decision that should be on record by now,
    or 0. Only pending items can be overdue."""
    if item["status"] != "pending":
        return 0
    today = today or dt.date.today()
    late = (today - dt.date.fromisoformat(item["meetingDate"])).days - OVERDUE_DAYS
    return max(late, 0)


def main():
    registry = json.loads(REGISTRY.read_text(encoding="utf-8"))
    items = [resolve(i) for i in registry["items"]]
    previous = {}
    if OUT.exists():
        previous = {i["id"]: i["status"] for i in json.loads(OUT.read_text(encoding="utf-8")).get("items", [])}
    changed = [i for i in items if previous.get(i["id"]) not in (None, i["status"])]
    OUT.write_text(json.dumps({
        "source": "etl/data/watched-resolutions.json, resolved against web/public/data/meetings by etl/resolve_watched.py",
        "items": items,
    }, indent=1) + "\n", encoding="utf-8")
    for i in items:
        print(f"resolve_watched: {i['id']}: {i['status']}" + (f" ({i['number']})" if i["number"] else "") + (f" - {i['note']}" if i["note"] else ""))
    for i in changed:
        # GitHub Actions shows this as an annotation on the run.
        print(f"::notice title=Watched resolution decided::{i['id']} is now {i['status']}" + (f" ({i['number']})" if i["number"] else ""))
    for i in items:
        if days_overdue(i):
            # Loud on purpose: a page would otherwise keep saying "proposed" with
            # nothing to show that the record it waits on went missing.
            print(f"::warning title=Watched resolution still pending::{i['id']} ({i['agendaItem']}, {i['meetingDate']}) "
                  f"has no recorded vote {OVERDUE_DAYS + days_overdue(i)} days after the meeting: {i['note']} "
                  "Check the minutes, and the match phrase in etl/data/watched-resolutions.json.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
