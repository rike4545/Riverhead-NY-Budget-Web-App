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


class AdoptedColumnIsTheModifiedBudget(unittest.TestCase):
    """The book's 2026 column is the 2026 budget as modified; the Supplement's is as first adopted.

    Resolution 2026-156 (February 18, 2026) moved $20,000 from Amb - Vehicles, $30,000 from
    Amb - Prof Services Other and $50,000 from Amb - Rents & Leases into the RVAC contract
    (+$100,000). Those are the only accounts where the two columns differ.
    """

    MOVES = {
        "SM1-4-4540-280-000-00000": -20000.0,
        "SM1-4-4540-436-210-00000": -30000.0,
        "SM1-4-4540-462-000-00000": -50000.0,
        "SM1-4-4540-436-203-00000": 100000.0,
    }

    def test_only_resolution_2026_156_accounts_differ(self):
        book = {l["account"]: l for l in json.loads(OUT.read_text())["lines"] if l["kind"] == "expenditure"}
        supp = {
            l["account"]: l
            for l in json.loads((OUT.parent / "budget-supplement" / "current-lines.json").read_text())["lines"]
            if l["kind"] == "expenditure"
        }
        diffs = {}
        for acct in set(book) | set(supp):
            b = (book.get(acct) or {}).get("adopted") or 0.0
            s = (supp.get(acct) or {}).get("adopted") or 0.0
            if abs(b - s) > 0.5:
                diffs[acct] = b - s
        self.assertEqual(diffs, self.MOVES)

    def test_resolution_matches_the_moves(self):
        fiscal = json.loads((OUT.parent / "meetings" / "2026-02-18-fiscal.json").read_text())
        res = next(r for r in fiscal["resolutions"] if r["number"] == "2026-156")
        for acct, amount in self.MOVES.items():
            text = res["funding"]["sourceText"]
            self.assertIn(acct, text)
            self.assertIn(f"${abs(amount):,.2f}", text)


if __name__ == "__main__":
    unittest.main()
