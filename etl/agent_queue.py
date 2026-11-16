#!/usr/bin/env python3
"""List the Board decisions that need a person's judgment on the site, for the
drafting agent (.github/workflows/draft-board-followups.yml).

Two kinds of work:
  watched      a watched resolution (etl/data/watched-resolutions.json) has
               been decided and has follow-ups; its status flip already went
               live through resolve_watched.py, but the follow-ups need edits
  resolution   a new resolution (from a meeting on or after the topics file's
               `since` date) whose title names a topic with hand-written pages
               (etl/data/agent-topics.json)

Anything listed in etl/data/agent-handled.json is skipped; the agent adds to it
in the same pull request as its changes.

    python3 etl/agent_queue.py [--out queue.json]

Prints a summary, writes the queue as JSON, and (in GitHub Actions) sets the
step output has_work=true|false.
"""
import argparse
import json
import os
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
WATCHED = ROOT / "web/public/data/watched-resolutions.json"
TOPICS = ROOT / "etl/data/agent-topics.json"
HANDLED = ROOT / "etl/data/agent-handled.json"
MEETINGS = ROOT / "web/public/data/meetings"


def load(path, default):
    return json.loads(path.read_text(encoding="utf-8")) if path.exists() else default


def build_queue(watched=None, topics=None, handled=None, meetings_dir=MEETINGS):
    watched = watched if watched is not None else load(WATCHED, {"items": []})
    topics = topics if topics is not None else load(TOPICS, {"since": "9999-12-31", "topics": []})
    handled = handled if handled is not None else load(HANDLED, {"watched": [], "resolutions": []})
    done_w, done_r = set(handled.get("watched", [])), set(handled.get("resolutions", []))
    queue = []

    for w in watched.get("items", []):
        if w["status"] != "pending" and w.get("followUps") and w["id"] not in done_w:
            queue.append({
                "kind": "watched", "id": w["id"], "status": w["status"], "number": w.get("number"),
                "meetingDate": w["meetingDate"], "title": w.get("title"), "pages": w["pages"], "followUps": w["followUps"],
            })

    since = topics.get("since", "9999-12-31")
    for f in sorted(meetings_dir.glob("*-fiscal.json")):
        date = f.name[:10]
        if date < since:
            continue
        for r in json.loads(f.read_text(encoding="utf-8")).get("resolutions", []):
            number, title = r.get("number"), (r.get("title") or "")
            if not number or number in done_r:
                continue
            low = title.lower()
            hits = [t for t in topics.get("topics", []) if any(p in low for p in t["phrases"])]
            if hits:
                vote = r.get("vote") or {}
                queue.append({
                    "kind": "resolution", "number": number, "meetingDate": date, "title": title,
                    "adopted": vote.get("adopted"), "voteTag": vote.get("tag"),
                    "topics": [t["id"] for t in hits], "pages": sorted({p for t in hits for p in t["pages"]}),
                })
    return queue


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default=None)
    args = ap.parse_args()
    queue = build_queue()
    if args.out:
        Path(args.out).write_text(json.dumps(queue, indent=1) + "\n", encoding="utf-8")
    print(f"agent_queue: {len(queue)} item(s)")
    for q in queue:
        label = q["id"] if q["kind"] == "watched" else q["number"]
        print(f"  {q['kind']}: {label} {q.get('title') or ''} -> {', '.join(q['pages'])}")
    if os.environ.get("GITHUB_OUTPUT"):
        with open(os.environ["GITHUB_OUTPUT"], "a", encoding="utf-8") as out:
            out.write(f"has_work={'true' if queue else 'false'}\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
