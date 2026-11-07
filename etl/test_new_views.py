"""Tests for build_preserved_land.py and build_vote_agreement.py."""

import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import build_preserved_land as land  # noqa: E402
import build_vote_agreement as votes  # noqa: E402


class PreservedLand(unittest.TestCase):
    def test_holder_groups(self):
        self.assertEqual(land.holder_group("Town"), "Town")
        self.assertEqual(land.holder_group("County and Town"), "County and Town")
        self.assertEqual(land.holder_group("State Easement"), "State")
        self.assertEqual(land.holder_group("Subdivision Reserve"), "Other")
        self.assertEqual(land.holder_group(None), "Other")

    def test_feature_keeps_no_address(self):
        f = land.feature({"CLASSIFICATION": "Town", "ACRES": 12.345, "CLOSINGDATE": 946684800000, "HAMLET": "NORTHVILLE", "ADDRESS": "1 Main St"},
                         {"rings": [[[-72.6, 40.9], [-72.6, 40.91], [-72.59, 40.91], [-72.59, 40.9], [-72.6, 40.9]]]})
        self.assertEqual(f["properties"], {"holder": "Town", "classification": "Town", "acres": 12.35, "year": 2000, "hamlet": "Northville"})
        self.assertNotIn("1 Main St", str(f))


class Contested(unittest.TestCase):
    def test_contested_means_members_differed(self):
        self.assertTrue(votes.contested({"A": "aye", "B": "nay"}))
        self.assertTrue(votes.contested({"A": "aye", "B": "abstain", "C": "absent"}))
        self.assertFalse(votes.contested({"A": "nay", "B": "nay"}))
        self.assertFalse(votes.contested({"A": "aye", "B": "absent"}))


if __name__ == "__main__":
    unittest.main()
