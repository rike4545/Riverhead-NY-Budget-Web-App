"""Tests for parse_preliminary_lines.py: money parsing and the committed book.

Run from etl/:  python3 -m unittest -q test_preliminary_lines
"""

import json
import unittest
from pathlib import Path

import parse_preliminary_lines as p

OUT = Path(__file__).resolve().parent.parent / "web" / "public" / "data" / "budget-2027-preliminary-lines.json"


class Money(unittest.TestCase):
    def test_cents_required_so_page_numbers_are_not_money(self):
        self.assertIsNone(p.NUM.match("14"))
        self.assertTrue(p.NUM.match("1,234.50"))
        self.assertTrue(p.NUM.match("(1,234.50)"))
        self.assertTrue(p.NUM.match("-"))


class CommittedBook(unittest.TestCase):
    def setUp(self):
        self.d = json.loads(OUT.read_text())

    def test_every_line_has_all_four_columns(self):
        for l in self.d["lines"]:
            for k in ("adopted", "request", "tentative", "preliminary"):
                self.assertIsNotNone(l[k], l["account"])

    def test_no_duplicate_accounts(self):
        accts = [l["account"] for l in self.d["lines"]]
        self.assertEqual(len(accts), len(set(accts)))

    def test_changed_count_matches_lines(self):
        changed = [l for l in self.d["lines"] if l["preliminary"] != l["tentative"]]
        self.assertEqual(len(changed), self.d["changedFromTentative"])


if __name__ == "__main__":
    unittest.main()
