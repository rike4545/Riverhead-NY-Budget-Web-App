#!/usr/bin/env python3
"""The published meeting records must be what the whole meeting pipeline makes
of the official sources stored in etl/data/meetings.

1. No meeting is published as a preliminary docket when its official Agenda
   Packet carries complete roll-call votes. apply_vote_packet_fallback.py
   upgrades exactly those meetings, with the same parser and the same test; a
   meeting left as a docket means a job ran parse_meetings.py without the rest
   of refresh_meeting_records.py. That is how 143 resolutions and their votes
   disappeared from four meetings in September 2026.
2. No workflow runs a meeting build step on its own: every workflow goes
   through etl/refresh_meeting_records.py.
"""

import json
import re
import unittest
from pathlib import Path

from parse_meetings import MEMBER_PARTY
from refresh_meeting_records import BUILD_STEPS
from vote_packet_parser import parse_vote_packet

ROOT = Path(__file__).resolve().parent.parent
SOURCES = ROOT / "etl/data/meetings"
PUBLISHED = ROOT / "web/public/data/meetings"
WORKFLOWS = ROOT / ".github/workflows"


class PublishedMeetingRecordTests(unittest.TestCase):
    def test_no_meeting_with_packet_votes_is_left_as_a_docket(self):
        index = json.loads((PUBLISHED / "index.json").read_text(encoding="utf-8"))
        left_as_dockets = []
        for entry in index.get("meetings") or []:
            slug = entry.get("slug")
            packet = SOURCES / f"{slug}-vote-packet.txt"
            if not entry.get("preliminary") or not packet.exists():
                continue
            meeting = json.loads((PUBLISHED / f"{slug}.json").read_text(encoding="utf-8"))
            docket = meeting.get("docket") or []
            if not docket:
                continue
            parsed = parse_vote_packet(packet.read_text(encoding="utf-8", errors="ignore"), docket, MEMBER_PARTY)
            if parsed.get("complete"):
                left_as_dockets.append(f"{slug} ({parsed.get('mappedCount', len(docket))} resolutions)")
        self.assertEqual(
            left_as_dockets,
            [],
            "published as preliminary dockets although their Agenda Packets carry complete votes: "
            + ", ".join(left_as_dockets)
            + ". Run etl/refresh_meeting_records.py, not parse_meetings.py alone.",
        )

    def test_workflows_run_the_whole_meeting_sequence(self):
        partial = []
        for workflow in sorted(WORKFLOWS.glob("*.y*ml")):
            text = workflow.read_text(encoding="utf-8")
            for step in BUILD_STEPS:
                if re.search(rf"etl/{re.escape(step)}\b", text):
                    partial.append(f"{workflow.name} runs {step}")
        self.assertEqual(partial, [], "run etl/refresh_meeting_records.py instead: " + "; ".join(partial))


if __name__ == "__main__":
    unittest.main()
