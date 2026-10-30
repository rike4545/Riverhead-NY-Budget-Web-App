"""Tests for etl/fetch_upcoming.py's fallbacks when the Town's site does not answer.

On October 29, 2026 the Town's site reset the connection during a meeting
sync. The run published an empty official schedule, which failed the deploy's
schedule check, and erased the public hearings it reads from the Town's
calendar, among them the November 5 hearing on the proposed 2027 budget.
"""

import json
import sys
import tempfile
import unittest
from pathlib import Path
from unittest import mock

sys.path.insert(0, str(Path(__file__).resolve().parent))
import fetch_upcoming as fu  # noqa: E402

PUBLISHED = {
    "officialScheduleDates": ["2026-11-05", "2026-11-17"],
    "recent": [],
    "meetings": [
        {"date": "2026-11-05", "itemsSource": "official-calendar", "hearings": ["Consideration of Proposed 2027 Budget"]},
        {"date": "2026-11-17", "itemsSource": "published-agenda", "hearings": ["From the agenda, not the calendar"]},
        {"date": "2026-12-01", "itemsSource": None, "hearings": []},
    ],
}


class FallbackTest(unittest.TestCase):
    def setUp(self):
        self.dir = tempfile.TemporaryDirectory()
        self.path = Path(self.dir.name) / "upcoming.json"
        self.path.write_text(json.dumps(PUBLISHED))

    def tearDown(self):
        self.dir.cleanup()

    def test_a_good_read_is_used(self):
        self.assertEqual(fu.schedule_dates_or_last({"2026-12-01"}, self.path), ({"2026-12-01"}, False))

    def test_an_empty_read_keeps_the_published_dates(self):
        self.assertEqual(fu.schedule_dates_or_last(set(), self.path), ({"2026-11-05", "2026-11-17"}, True))

    def test_an_empty_read_with_nothing_published_stays_empty(self):
        self.assertEqual(fu.schedule_dates_or_last(set(), Path(self.dir.name) / "missing.json"), (set(), False))

    def test_only_calendar_hearings_are_kept(self):
        self.assertEqual(fu.last_calendar_hearings(self.path), {"2026-11-05": ["Consideration of Proposed 2027 Budget"]})

    def test_a_calendar_outage_keeps_the_last_hearings(self):
        fu.LAST_CALENDAR_HEARINGS.clear()
        fu.LAST_CALENDAR_HEARINGS.update(fu.last_calendar_hearings(self.path))
        fu.CALENDAR_MISSES.clear()
        event = {"startDateTime": "2026-11-05T14:00:00Z", "eventName": "Town Board Meeting", "publishedFiles": []}
        with mock.patch.object(fu, "official_calendar_hearings", return_value=None):
            item = fu.event_item(event)
        self.assertEqual(item["hearings"], ["Consideration of Proposed 2027 Budget"])
        self.assertEqual(item["itemsSource"], "official-calendar")
        self.assertEqual(fu.CALENDAR_MISSES, ["2026-11-05"])

    def test_a_calendar_with_no_hearings_is_believed(self):
        fu.LAST_CALENDAR_HEARINGS.clear()
        fu.LAST_CALENDAR_HEARINGS.update(fu.last_calendar_hearings(self.path))
        fu.CALENDAR_MISSES.clear()
        event = {"startDateTime": "2026-11-05T14:00:00Z", "eventName": "Town Board Meeting", "publishedFiles": []}
        with mock.patch.object(fu, "official_calendar_hearings", return_value=[]):
            item = fu.event_item(event)
        self.assertEqual(item["hearings"], [])
        self.assertEqual(fu.CALENDAR_MISSES, [])


if __name__ == "__main__":
    unittest.main()
