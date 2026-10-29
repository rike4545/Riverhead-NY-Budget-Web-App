"""Tests for etl/build_campaign_reports.py: the query asks for the right
reports and committees, and rows are normalized and ordered the same way on
every run, so an unchanged State dataset leaves the published file unchanged."""

import sys
import unittest
import urllib.parse
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import build_campaign_reports as cr  # noqa: E402


class QueryTest(unittest.TestCase):
    def test_asks_for_the_three_general_election_reports_of_2026(self):
        where = urllib.parse.parse_qs(urllib.parse.urlsplit(cr.query_url(["506796", "154927"])).query)["$where"][0]
        self.assertIn("filer_id in('506796','154927')", where)
        self.assertIn("election_year='2026'", where)
        self.assertIn("filing_desc in('32-Day Pre-General','11-Day Pre-General','27-Day Post-General')", where)

    def test_covers_every_committee_on_the_page(self):
        officials = {"officials": [
            {"filerIDs": [{"filerID": "154927"}, {"filerID": "154926"}]},
            {"filerIDs": [{"filerID": "5418"}, {"filerID": "154927"}]},
        ]}
        self.assertEqual(cr.filer_ids(officials), ["5418", "154926", "154927"])


class NormalizeTest(unittest.TestCase):
    RAW = [
        {"filer_id": "506796", "filing_desc": "11-Day Pre-General", "r_amend": "N", "filing_sched_abbrev": "A",
         "amount": "2855.3", "row_count": "25", "first_date": "2026-10-03T00:00:00.000", "last_date": "2026-10-19T00:00:00.000"},
        {"filer_id": "506796", "filing_desc": "32-Day Pre-General", "r_amend": "Y", "filing_sched_abbrev": "F",
         "amount": "1406.6000000001", "row_count": "5", "first_date": "2026-09-09T00:00:00.000", "last_date": "2026-09-21T00:00:00.000"},
        {"filer_id": "5418", "filing_desc": "11-Day Pre-General", "r_amend": "N", "filing_sched_abbrev": "F",
         "amount": "5000", "row_count": "1", "first_date": "2026-10-05T00:00:00.000", "last_date": "2026-10-05T00:00:00.000"},
        {"filer_id": "5418", "filing_desc": "July Periodic", "filing_sched_abbrev": "A", "amount": "10", "row_count": "1"},
        {"filer_id": "5418", "filing_desc": "11-Day Pre-General", "amount": "10", "row_count": "1"},
    ]

    def test_keeps_only_the_general_election_reports_with_a_schedule(self):
        rows = cr.normalize(self.RAW)
        self.assertEqual(len(rows), 3)
        self.assertTrue(all(r["report"] in cr.REPORTS for r in rows))

    def test_orders_by_committee_then_report_then_schedule(self):
        rows = cr.normalize(list(reversed(self.RAW)))
        self.assertEqual([(r["filerID"], r["report"]) for r in rows],
                         [("5418", "11-Day Pre-General"), ("506796", "32-Day Pre-General"), ("506796", "11-Day Pre-General")])

    def test_rounds_amounts_and_keeps_dates_and_amendments(self):
        rows = {(r["filerID"], r["report"]): r for r in cr.normalize(self.RAW)}
        r = rows[("506796", "32-Day Pre-General")]
        self.assertEqual(r["amount"], 1406.6)
        self.assertTrue(r["amended"])
        self.assertEqual((r["firstDate"], r["lastDate"]), ("2026-09-09", "2026-09-21"))
        self.assertFalse(rows[("506796", "11-Day Pre-General")]["amended"])


if __name__ == "__main__":
    unittest.main()
