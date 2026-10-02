#!/usr/bin/env python3
"""Tests for finding each resolution's vote in a meeting transcript.

The cases are lines Whisper actually produced from the Town's video of the
September 15, 2026 meeting, plus the ways a resolution's number can be said
that a vote link must survive: cited in public comment, misheard, spelled out,
taken out of agenda order.

Run: python etl/test_transcribe_meetings.py
"""
from __future__ import annotations

import json
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from transcribe_meetings import number_pattern, vote_times  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent

RESOLUTIONS = [
    {"number": "2026-841", "title": "Adopts Sewer District Capital Project #82619 - NYS SECURE Grant Infrastructure Improvements"},
    {"number": "2026-842", "title": "Ambulance District Budget Adjustment for Repairs to the Armory Building"},
    {"number": "2026-843", "title": "Budget Adoption for Capital Project #12620 Restoration of Wading River Duck Ponds"},
    {"number": "2026-844", "title": "Authorizes the Town Clerk to Publish and Post Notice to Bidders for Annual Emergency Maintenance"},
    {"number": "2026-845", "title": "Pays Bills"},
]


def seg(t: float, text: str) -> list:
    return [t, t + 5, text]


class NumberPattern(unittest.TestCase):
    def test_ways_a_number_is_read(self):
        pat = number_pattern("2026-841")
        for said in ("Resolution 841. Adopts", "resolution number 841", "Resolution 2026-841",
                     "Resolution No. 841", "Okay, our first resolution is number one which is 841."):
            self.assertRegex(said, pat)

    def test_other_numbers_do_not_match(self):
        pat = number_pattern("2026-841")
        for said in ("Resolution 8410", "resolution 1841", "Resolution 840. 841 people", "extends bid 2024-841"):
            self.assertNotRegex(said, pat)


class VoteTimes(unittest.TestCase):
    def test_september_15_lines(self):
        segments = [
            seg(1052, "So it's resolution 843. The one that deals with the grants or"),  # public comment
            seg(1146, "us through the resolutions."),
            seg(1149, "Okay, our first resolution is number one which is 841. Adopt Seward District Capital Project"),
            seg(1176, "Resolution is adopted. I'm getting there slowly but surely."),
            seg(1180, "resolution number two eight forty two ambulance district budget adjustment for repairs to"),
            seg(1190, "the armory building. So moved. Second."),
            seg(1232, "That resolution is adopted. Resolution 843. Budget adoption for Capital"),
            seg(1240, "project restoration of Wading River duck ponds. So moved."),
            seg(2225, "resolution is adopted"),
            seg(2242, "how can yes sir resolutions adopted resolution h64 authorizes the town clerk to publish and post"),
            seg(2250, "notice to bidders for annual emergency maintenance"),
            seg(2260, "yes sir resolution is adopted resolution 845 pays bills so moved"),
        ]
        votes = vote_times(segments, RESOLUTIONS)
        self.assertEqual(votes["2026-841"], 1149)  # words between "resolution" and the number
        self.assertEqual(votes["2026-842"], 1180)  # spelled out: found by its title
        self.assertEqual(votes["2026-843"], 1232)  # the reading, not the earlier public comment
        self.assertEqual(votes["2026-844"], 2242)  # misheard "h64": found by its title
        self.assertEqual(votes["2026-845"], 2260)
        self.assertEqual(list(votes), [r["number"] for r in RESOLUTIONS])

    def test_number_split_across_segments_is_timed_where_it_is_said(self):
        segments = [seg(100, "Halpin yes sir. That resolution is adopted resolution"), seg(108, "841. Adopts Sewer District")]
        self.assertEqual(vote_times(segments, RESOLUTIONS[:1]), {"2026-841": 108})

    def test_out_of_order_kept_only_if_read_once(self):
        res = [{"number": "2026-1", "title": "Alpha"}, {"number": "2026-2", "title": "Beta"}, {"number": "2026-3", "title": "Gamma"}]
        once = [seg(10, "resolution 1 alpha"), seg(20, "resolution 3 gamma"), seg(90, "we return to resolution 2 beta")]
        self.assertEqual(vote_times(once, res), {"2026-1": 10, "2026-2": 90, "2026-3": 20})
        twice = once + [seg(400, "as I said about resolution 2 earlier")]
        self.assertNotIn("2026-2", vote_times(twice, res))

    def test_a_later_mention_does_not_drag_the_rest_with_it(self):
        res = [{"number": f"2026-{n}", "title": t} for n, t in ((10, "Alpha"), (11, "Beta"), (12, "Gamma"))]
        segments = [seg(5000, "back in resolution 10 we talked"), seg(100, "resolution 11 beta"), seg(130, "resolution 12 gamma")]
        segments.sort()
        votes = vote_times(segments, res)
        self.assertEqual((votes.get("2026-11"), votes.get("2026-12")), (100, 130))


class Datasets(unittest.TestCase):
    def test_saved_transcripts(self):
        folder = ROOT / "web/public/data/transcripts"
        for path in sorted(folder.glob("*.json")):
            t = json.loads(path.read_text(encoding="utf-8"))
            meeting = json.loads((ROOT / f"web/public/data/meetings/{t['date']}.json").read_text(encoding="utf-8"))
            numbers = [r["number"] for r in meeting.get("resolutions") or meeting.get("docket") or [] if r.get("number")]
            with self.subTest(path.name):
                self.assertTrue(t["video"].startswith("https://"))
                self.assertTrue(set(t["votes"]) <= set(numbers), "every vote time names a resolution of that meeting")
                self.assertTrue(all(0 <= s <= t["durationSec"] for s in t["votes"].values()))
                starts = [s[0] for s in t["segments"]]
                self.assertEqual(starts, sorted(starts))


if __name__ == "__main__":
    unittest.main()
