"""Tests for build_donation_map.py: ZIP codes, place names and the per-committee totals."""

import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import build_donation_map as m  # noqa: E402


class Zips(unittest.TestCase):
    def test_five_digits(self):
        self.assertEqual(m.zip5("11901"), "11901")
        self.assertEqual(m.zip5("11901-1234"), "11901")
        self.assertEqual(m.zip5(" 08807 "), "08807")

    def test_missing_or_bad(self):
        self.assertEqual(m.zip5(None), "")
        self.assertEqual(m.zip5(""), "")
        self.assertEqual(m.zip5("N/A"), "")

    def test_place_names(self):
        self.assertEqual(m.place_name("RIVERHEAD"), "Riverhead")
        self.assertEqual(m.place_name(" wading  river "), "Wading River")


class Aggregate(unittest.TestCase):
    def test_committees_years_and_zips(self):
        rows = [
            {"filer_id": "1", "election_year": "2025", "flng_ent_zip": "11901", "flng_ent_state": "NY", "flng_ent_city": "RIVERHEAD", "amount": "100.5", "items": "2"},
            {"filer_id": "2", "election_year": "2025", "flng_ent_zip": "11901-0001", "flng_ent_state": "NY", "flng_ent_city": "Riverhead", "amount": "50", "items": "1"},
            {"filer_id": "1", "election_year": "2026", "flng_ent_zip": "", "flng_ent_state": "", "flng_ent_city": "", "amount": "25", "items": "1"},
            {"filer_id": "3", "election_year": "2026", "flng_ent_zip": "89011", "flng_ent_state": "NV", "flng_ent_city": "Henderson", "amount": "999", "items": "1"},
        ]
        by, zips = m.aggregate(rows, {"A": ["1", "2"], "B": ["9"]})
        self.assertEqual(by["A"]["2025"]["11901"], [150.5, 3])
        self.assertEqual(by["A"]["2026"]["unknown"], [25.0, 1])
        self.assertEqual(by["B"], {})
        self.assertNotIn("89011", zips)  # a committee not on the page is ignored
        self.assertEqual(zips["11901"], {"place": "Riverhead", "state": "NY"})


if __name__ == "__main__":
    unittest.main()
