#!/usr/bin/env python3
"""How the police and crime refresh behaves when data.ny.gov misbehaves.

On October 12, 2026 data.ny.gov answered one run with a certificate for another
host, and the whole financial-reports job stopped there. These tests hold the
refresh to what it should do instead: try again, keep the State's figures as
last fetched when the source stays down, and fetch them at most once a week."""

import io
import json
import tempfile
import unittest
from contextlib import redirect_stdout
from datetime import datetime, timedelta, timezone
from pathlib import Path
from unittest import mock

import parse_police_crime as pc

PUBLISHED = {
    "generated": True,
    "agency": pc.AGENCY,
    "crimeCheckedOn": None,
    "sources": [pc.DATASET],
    "crime": [{"year": 2024, "monthsReported": 12, "total": 500, "violent": 50, "property": 450}],
    "spending": [],
    "joined": [],
    "peersLatest": [{"agency": pc.AGENCY, "year": 2024, "total": 500, "isRiverhead": True}],
    "peersHavePopulation": False,
    "policeDistrict": None,
}


def days_ago(n: int) -> str:
    return (datetime.now(timezone.utc).date() - timedelta(days=n)).isoformat()


class RetryTests(unittest.TestCase):
    def test_every_try_failing_raises_source_unavailable(self):
        with mock.patch.object(pc, "_get_once", side_effect=OSError("certificate is not valid for 'data.ny.gov'")) as get, \
                mock.patch.object(pc.time, "sleep") as sleep, \
                mock.patch("sys.stderr", new_callable=io.StringIO):
            with self.assertRaises(pc.SourceUnavailable) as caught:
                pc.http_get("https://data.ny.gov/resource/x.json")
        self.assertEqual(get.call_count, 1 + len(pc.RETRY_WAITS))
        self.assertEqual([c.args[0] for c in sleep.call_args_list], list(pc.RETRY_WAITS))
        self.assertIn("data.ny.gov", str(caught.exception))

    def test_a_blip_then_an_answer_returns_the_answer(self):
        with mock.patch.object(pc, "_get_once", side_effect=[OSError("reset"), b"[]"]), \
                mock.patch.object(pc.time, "sleep"), \
                mock.patch("sys.stderr", new_callable=io.StringIO):
            self.assertEqual(pc.http_get("https://data.ny.gov/resource/x.json"), b"[]")


class RefreshTests(unittest.TestCase):
    def setUp(self):
        self.dir = tempfile.TemporaryDirectory()
        self.out = Path(self.dir.name) / "police-crime.json"
        patcher = mock.patch.object(pc, "OUT", self.out)
        patcher.start()
        self.addCleanup(patcher.stop)
        self.addCleanup(self.dir.cleanup)

    def publish(self, checked_on):
        self.out.write_text(json.dumps({**PUBLISHED, "crimeCheckedOn": checked_on}))

    def test_source_down_keeps_the_published_figures_and_lets_the_job_go_on(self):
        self.publish(days_ago(30))
        down = pc.SourceUnavailable("data.ny.gov could not be reached after 3 tries.")
        with mock.patch.object(pc, "fetch_state", side_effect=down), redirect_stdout(io.StringIO()) as log:
            self.assertEqual(pc.main(), 0)
        self.assertIn("::warning", log.getvalue())
        written = json.loads(self.out.read_text())
        self.assertEqual(written["crime"], PUBLISHED["crime"])
        self.assertEqual(written["crimeCheckedOn"], days_ago(30))
        self.assertTrue(written["spending"], "police spending is still rebuilt from the Town's own budgets")

    def test_source_down_with_nothing_published_fails(self):
        down = pc.SourceUnavailable("data.ny.gov could not be reached after 3 tries.")
        with mock.patch.object(pc, "fetch_state", side_effect=down), self.assertRaises(pc.SourceUnavailable):
            pc.main()
        self.assertFalse(self.out.exists())

    def test_checked_this_week_does_not_fetch(self):
        self.publish(days_ago(2))
        with mock.patch.object(pc, "fetch_state", side_effect=AssertionError("fetched within the week")), \
                redirect_stdout(io.StringIO()):
            self.assertEqual(pc.main(), 0)
        self.assertEqual(json.loads(self.out.read_text())["crimeCheckedOn"], days_ago(2))

    def test_checked_a_week_ago_fetches_again(self):
        self.publish(days_ago(pc.RECHECK_DAYS))
        state = {"crime": PUBLISHED["crime"], "peersLatest": PUBLISHED["peersLatest"],
                 "policeDistrict": None, "populationSource": None}
        with mock.patch.object(pc, "fetch_state", return_value=state) as fetch, redirect_stdout(io.StringIO()):
            self.assertEqual(pc.main(), 0)
        fetch.assert_called_once()
        self.assertEqual(json.loads(self.out.read_text())["crimeCheckedOn"], days_ago(0))


if __name__ == "__main__":
    unittest.main()
