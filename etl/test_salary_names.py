#!/usr/bin/env python3
"""Salary-schedule names: suffixes, two-word surnames and middle initials.

The 2026 parser read one word on each side of the comma, so "Seal Jr., John"
became "Seal Jr.," the "John Police Officer" and "Perez Avalos, Nelson" became
"Perez Avalos," the "Nelson Police Officer". With the name unmatched, each was
counted "New in 2026" and left out of the raise comparison. The 2022-2025
parser dropped "Anderson, Jr., Richard" from every year. And the 2026 agenda
packet's check register -- fund totals in four columns -- read as fifteen
people, among them "Fund, General" at $63,884 and "Fund, Highway" at $166,755.
"""

import json
import re
import unittest
from pathlib import Path

from parse_salary_2026 import key, parse_row_2026
from parse_salary_schedule import match_key, parse_row

ROOT = Path(__file__).resolve().parent.parent
SALARY = ROOT / "web/public/data/salary"
# A check-register fund code ("5-A01", "X-EW3") or its "All Funds" total line.
FUND_CODE = re.compile(r"\b[0-9X]-[A-Z]{1,3}\d{1,2}\b|All Funds")


class Parse2026(unittest.TestCase):
    def check(self, line, name, title):
        got = parse_row_2026(line)
        self.assertIsNotNone(got, line)
        self.assertEqual((got[0], got[2]), (name, title), line)

    def test_suffix_on_the_surname(self):
        self.check("Seal Jr., John Police Officer $ 152,900.66", "Seal Jr., John", "Police Officer")
        self.check("McCabe Sr., Sean M. Member-Chair $ 1,940.00", "McCabe Sr., Sean M", "Member-Chair")

    def test_suffix_after_the_comma(self):
        self.check("Anderson, Jr., Richard Detective Grade I $ 175,080.43", "Anderson Jr., Richard", "Detective Grade I")

    def test_two_word_surname(self):
        self.check("Perez Avalos, Nelson Police Officer $ 136,733.86", "Perez Avalos, Nelson", "Police Officer")

    def test_middle_initial(self):
        self.check("Baier, Joseph H. Member $ 10,800.00", "Baier, Joseph H", "Member")

    def test_plain_rows_unchanged(self):
        self.check("Anderson, Peter Police Officer $ 152,900.66", "Anderson, Peter", "Police Officer")
        self.check("Harden, Jordan 3/10 Assistant Recreation Program Coordinator 69,765.69",
                   "Harden, Jordan", "Assistant Recreation Program Coordinator")

    def test_fund_totals_are_not_people(self):
        self.assertIsNone(parse_row_2026(
            "Recreation Program Fund               5-A06           3,471.12             0.00             0.00         3,471.12"))
        self.assertIsNone(parse_row_2026(
            "General Fund                          5-A01         764,358.57             0.00         6,812.28       771,170.85"))


class ParseEarlierYears(unittest.TestCase):
    def test_suffix_after_the_comma_is_kept(self):
        got = parse_row("Anderson, Jr., Richard Detective Grade II 164,101.77$")
        self.assertIsNotNone(got)
        self.assertEqual((got[0], got[2]), ("Anderson Jr., Richard", "Detective Grade II"))

    def test_other_names_unchanged(self):
        self.assertEqual(parse_row("Seal Jr., John Police Officer 146,683.57$")[0], "Seal Jr., John")
        self.assertEqual(parse_row("Baier, Joseph H. Member 10,800.00$")[0], "Baier, Joseph H")


class Matching(unittest.TestCase):
    def test_suffix_does_not_block_a_match(self):
        # The schedules print the suffix; the payroll mostly does not.
        for k in (key, match_key):
            self.assertEqual(k("Seal Jr., John"), k("Seal, John W"))
            self.assertEqual(k("DeLong, Angelo"), k("DeLong Jr., Angelo B"))
            self.assertEqual(k("West, John"), k("West II, John R"))
            self.assertNotEqual(k("Seal, Jayme E"), k("Seal, John W"))


class Datasets(unittest.TestCase):
    def test_every_record_is_a_named_person(self):
        for path in sorted(SALARY.glob("authorized-20*.json")):
            for r in json.loads(path.read_text())["records"]:
                where = f"{path.name}: {r['name']!r} / {r['title']!r}"
                self.assertEqual(r["name"].count(","), 1, where)
                self.assertFalse(r["name"].rstrip().endswith(","), where)
                self.assertIsNone(re.match(r"[A-Z]\.? ", r["title"]), where)
                self.assertIsNone(FUND_CODE.search(r["title"]), where)

    def test_2026_matches_the_officers_it_used_to_miss(self):
        comparison = json.loads((SALARY / "comparison-2025-2026.json").read_text())["records"]
        by_name = {r["name"]: r for r in comparison}
        for name in ("Seal Jr., John", "Perez Avalos, Nelson", "Anderson Jr., Richard"):
            self.assertIn(name, by_name)
            self.assertIsNotNone(by_name[name]["annual2025"], f"{name} should match a 2025 salary")


if __name__ == "__main__":
    unittest.main(verbosity=1)
