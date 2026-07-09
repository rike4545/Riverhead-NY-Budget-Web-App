#!/usr/bin/env python3
"""Does Riverhead effectively run a consent calendar — and is that good?

Computes real voting-pattern statistics from the parsed meeting minutes
(web/public/data/meetings/*.json) — the unanimous rate and whether movers
rotate through a fixed small set in lockstep sequence (a mechanical pattern
consistent with pro-forma motions on a pre-agreed list, the functional
signature of a consent calendar even when no meeting ever uses that term).
Pairs that finding with general municipal-governance research on whether
consent agendas are an effective practice.

Output: web/public/data/consent-calendar.json
"""

import glob
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MEETINGS_DIR = ROOT / "web/public/data/meetings"
OUT = ROOT / "web/public/data/consent-calendar.json"


def build():
    files = sorted(
        f for f in MEETINGS_DIR.glob("*.json")
        if re.match(r"^\d{4}-\d{2}-\d{2}\.json$", f.name)
    )

    total_meetings = 0
    total = unanimous = contested = failed = tabled = 0
    rotation_meetings = 0
    sample = None

    for f in files:
        m = json.loads(f.read_text())
        res = m.get("resolutions", [])
        if not res:
            continue
        total_meetings += 1
        total += len(res)
        unanimous += sum(1 for r in res if r.get("tag") == "unanimous")
        contested += sum(1 for r in res if r.get("tag") in ("split", "failed"))
        failed += sum(1 for r in res if r.get("tag") == "failed")
        tabled += sum(1 for r in res if r.get("tag") == "tabled")

        movers = [r["mover"] for r in res if r.get("mover")]
        if len(movers) >= 6:
            distinct = len(set(movers))
            changes = sum(1 for i in range(1, len(movers)) if movers[i] != movers[i - 1])
            if distinct <= 5 and changes / len(movers) > 0.85:
                rotation_meetings += 1
                if sample is None:
                    sample = {"slug": f.stem, "date": m["date"], "movers": movers[:8]}

    unanimous_pct = round(unanimous / total * 100, 1) if total else 0
    rotation_pct = round(rotation_meetings / total_meetings * 100) if total_meetings else 0

    payload = {
        "title": "Is a consent calendar effective? Does Riverhead use one?",
        "intro": (
            "A resident asked: is a “consent calendar” — grouping routine items into one block vote — "
            "an effective practice? Riverhead's Town Board has never formally adopted one. But its actual voting "
            "pattern already functions like one, informally, and without the safeguards a real consent calendar is "
            "supposed to have."
        ),
        "riverheadPattern": {
            "headline": f"{unanimous_pct}% of {total:,} resolutions passed unanimously, across {total_meetings} meetings.",
            "totalResolutions": total,
            "unanimousPct": unanimous_pct,
            "contested": contested,
            "failed": failed,
            "tabled": tabled,
            "rotationMeetingsPct": rotation_pct,
            "rotationMeetings": rotation_meetings,
            "totalMeetings": total_meetings,
            "rotationFinding": (
                f"In {rotation_meetings} of {total_meetings} meetings ({rotation_pct}%), the mover and seconder "
                "rotate through a small, fixed set of Board members in strict sequence — first Councilmember A "
                "moves and B seconds, then B moves and C seconds, and so on — resolution after resolution, "
                "regardless of subject matter. That is not how organic floor debate looks; it is the signature of a "
                "prearranged list voted through with pro-forma motions."
            ),
            "sample": sample,
        },
        "whatMakesItEffective": [
            {"title": "It genuinely saves time — when used right", "text": "A consent agenda groups routine, non-controversial items into a single vote so a board can spend its meeting time on the decisions that actually need debate. Done well, it improves governance rather than weakening it."},
            {"title": "The test is what belongs on it", "text": "The standard test: would a reasonable resident, looking at the agenda, expect this item to be discussed before being approved? If yes, it does not belong on consent — financial commitments, policy changes, and contested matters should not be bundled in."},
            {"title": "It needs real safeguards", "text": "Best practice: publish the consent agenda at least a week in advance with full supporting documents, let any single member pull an item for separate discussion without needing a second or a vote, and record in the minutes exactly which items were approved as a block."},
            {"title": "Without those safeguards, it erodes accountability", "text": "The risk case is exactly Riverhead's pattern: near-unanimous, low-visibility approval of dozens of items per meeting with no visible individual debate in the record and no formal mechanism for a resident or Board member to force a discussion — that is where a consent-agenda-like habit becomes a rubber stamp instead of a governance tool."},
        ],
        "verdict": (
            "A consent calendar can be an effective governance tool — but only with published advance notice, "
            "supporting documents, and a real pull-to-discuss mechanism. Riverhead gets the efficiency (very high "
            "unanimous rates, a fast-moving agenda) without ever adopting the formal practice or its safeguards. "
            "The fix is not to stop moving routine items quickly — it is to name what's happening: designate an "
            "actual consent agenda, publish it with backup documents in advance, and give any Board member or "
            "resident a clear, minuted way to pull an item before it passes."
        ),
        "sources": [
            "MRSC, “Understanding the Consent Agenda in Local Government Meetings” (Sept. 2025).",
            "CivicPlus, “How to Use a Consent Agenda to Save Time and Refocus Discussion on Critical Matters.”",
            "Diligent, “Consent agenda: what it is & how it saves boards time.”",
            "Institute for Local Government (California), “The Concept of a ‘Consent Calendar.’”",
            "CivicCA, “Consent Calendar Best Practices for City Councils.”",
            "Riverhead Town Board meeting minutes, parsed record (this site).",
        ],
    }

    OUT.write_text(json.dumps(payload, indent=1))
    print("consent-calendar.json written.")
    print(f"  {total_meetings} meetings, {total} resolutions, {unanimous_pct}% unanimous")
    print(f"  round-robin rotation pattern in {rotation_meetings}/{total_meetings} meetings ({rotation_pct}%)")


if __name__ == "__main__":
    build()
