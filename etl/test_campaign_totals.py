"""Tests for etl/build_campaign_totals.py: the stored card totals use the same
schedules as the page's live refresh, and the balance owed is the latest
report's, not a sum or the largest single row."""

import sys
import unittest
import urllib.parse
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import build_campaign_totals as ct  # noqa: E402


def row(year, report, schedule, amount, n=1, last="2026-01-01"):
    return {"election_year": str(year), "filing_desc": report, "filing_sched_abbrev": schedule,
            "amount": str(amount), "row_count": str(n), "last_date": f"{last}T00:00:00.000"}


class TotalsTest(unittest.TestCase):
    ROWS = [
        row(2025, "July Periodic", "A", 1000, 10, "2025-07-01"),
        row(2025, "July Periodic", "N", 5000, 2),
        row(2026, "July Periodic", "B", 2500, 3, "2026-06-30"),
        row(2026, "July Periodic", "G", 150, 1, "2026-05-01"),
        row(2026, "July Periodic", "I", 600, 1),
        row(2026, "July Periodic", "N", 5000, 2),
        row(2026, "32-Day Pre-General", "C", 400, 2, "2026-09-28"),
        row(2026, "11-Day Pre-General", "F", 900, 4, "2026-10-19"),
        row(2026, "11-Day Pre-General", "N", 5600, 3),
    ]

    def test_contributions_and_transfers(self):
        t = ct.totals(self.ROWS, 2026)
        self.assertEqual(t["seedDirectContributions"], 3900)
        self.assertEqual(t["seedTransfersIn"], 150)
        self.assertEqual(t["seedRaised"], 4050)

    def test_last_reported_is_the_latest_contribution_or_transfer(self):
        # Spending and loan rows do not move it.
        self.assertEqual(ct.totals(self.ROWS, 2026)["seedLastReported"], "2026-09-28")

    def test_owed_is_the_latest_reports_balance_not_a_sum(self):
        t = ct.totals(self.ROWS, 2026)
        self.assertEqual(t["seedOwed"], 5600)
        self.assertEqual(t["seedOwedReport"], "2026 11-Day Pre-General")

    def test_owed_is_zero_when_the_latest_report_lists_nothing_owed(self):
        rows = [r for r in self.ROWS if not (r["filing_desc"] == "11-Day Pre-General" and r["filing_sched_abbrev"] == "N")]
        self.assertEqual(ct.totals(rows, 2026)["seedOwed"], 0)

    def test_loans_received_and_this_cycle(self):
        t = ct.totals(self.ROWS, 2026)
        self.assertEqual(t["seedLoansReceived"], 600)
        self.assertEqual(t["seedCycleRaised"], 2900)
        self.assertEqual(t["seedCycleItems"], 5)

    def test_reports_sort_in_filing_order(self):
        keys = [ct.report_key(row(2026, d, "A", 0)) for d in ("January Periodic", "July Periodic", "32-Day Pre-General", "27-Day Post-General")]
        self.assertEqual(keys, sorted(keys))
        self.assertLess(ct.report_key(row(2025, "27-Day Post-General", "A", 0)), ct.report_key(row(2026, "January Periodic", "A", 0)))

    def test_no_rows(self):
        t = ct.totals([], 2026)
        self.assertEqual((t["seedRaised"], t["seedLastReported"], t["seedOwed"], t["seedOwedReport"]), (0, None, 0, None))


class InternalTransfersTest(unittest.TestCase):
    def test_transfers_from_the_officials_own_committees_are_internal(self):
        rows = [
            {"flng_ent_name": "Friends Of Tim Hubbard", "amount": "7686.52"},
            {"flng_ent_name": "Riverhead Republican Committee", "amount": "1500"},
            {"flng_ent_first_name": "Tim", "flng_ent_last_name": "Hubbard", "amount": "50"},
        ]
        self.assertEqual(ct.internal_transfers(rows, ["Tim Hubbard for Supervisor", "Friends of Tim Hubbard"]), 7686.52)

    def test_internal_transfers_are_not_counted_as_raised(self):
        rows = [row(2025, "July Periodic", "A", 1000), row(2025, "July Periodic", "G", 900),
                row(2025, "July Periodic", "D", 75), row(2025, "July Periodic", "M", 40)]
        t = ct.totals(rows, 2026, internal=600)
        self.assertEqual((t["seedTransfersIn"], t["seedInternalTransfers"], t["seedRaised"]), (300, 600, 1300))
        self.assertEqual((t["seedInKind"], t["seedRefunds"]), (75, 40))


class QueryTest(unittest.TestCase):
    def test_asks_for_the_pages_window(self):
        where = urllib.parse.parse_qs(urllib.parse.urlsplit(ct.query_url(["506796"], 2024, 2026)).query)["$where"][0]
        self.assertIn("filer_id in('506796')", where)
        self.assertIn("election_year in('2024','2025','2026')", where)


if __name__ == "__main__":
    unittest.main()
