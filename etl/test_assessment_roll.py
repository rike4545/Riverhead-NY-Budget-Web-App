"""Tests for build_assessment_roll.py's reading of an RPS assessment roll."""

import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import build_assessment_roll as b  # noqa: E402

STAR = "*" * 103
HEADER = "COUNTY - Suffolk                                 T A X A B L E SECTION OF THE ROLL - 1                  VALUATION DATE-JUL 01, 2025"
# Two made-up parcels laid out as the roll prints them; the second has an exemption beside its values
# and a total too wide for the column, which pushes it one place right.
ROLL = [
    HEADER,
    f"{STAR} 1.-1-1 *******************",
    "                            1 Example Ln                                                                               18",
    "1.-1-1                         210 1 Family Res                        COUNTY TAXABLE VALUE              89,200",
    "Owner A                        Riverhead Csd # 473002         16,200   TOWN    TAXABLE VALUE             89,200",
    "Address                        Description                    89,200   SCHOOL TAXABLE VALUE              89,200",
    "                               FULL MARKET VALUE            1153,946",
    f"{STAR} 500.-1-355 *****************",
    "",
    "500.-1-355                      861 Elec & gas                       Public Aut 14000               2550,725",
    "Owner B                         Riverhead Csd # 473002               0 COUNTY TAXABLE VALUE",
    "Address                         Public Property               2550,725 TOWN    TAXABLE VALUE",
    "                                FULL MARKET VALUE          32997,736",
]


class ParcelTests(unittest.TestCase):
    def test_reads_class_total_and_market_value(self):
        ps = b.parcels(ROLL)
        self.assertEqual([(p["cls"], p["total"], p["fmv"]) for p in ps], [("210", 89200, 1153946), ("861", 2550725, 32997736)])

    def test_keeps_no_owner_or_address(self):
        for p in b.parcels(ROLL):
            self.assertEqual(set(p) - {"tm", "sec", "cls", "li", "total", "fmv"}, set())

    def test_unreadable_record_stops_the_run(self):
        broken = ROLL[:4] + ["Owner A", "Address"]
        with self.assertRaises(SystemExit):
            b.parcels(broken)

    def test_section_totals_reset_the_section(self):
        lines = ROLL + ["                                                  R O L L     S E C T I O N   T O T A L S", f"{STAR} 9.-9-9 ****"]
        self.assertEqual(len(b.parcels(lines)), 2)


class ExemptionTests(unittest.TestCase):
    PAGE = [
        "                                       ***   E X E M P T I O N      S U M M A R Y   ***",
        "CODE     DESCRIPTION   PARCELS                                           COUNTY                 TOWN                SCHOOL",
        "41834   ENH STAR        1,734                                                                            22020,445",
        "41121   VET WAR- C        841                                          3348,096              3348,096",
        "        T O T A L       2,575                                          3348,096              3348,096            22020,445",
    ]

    def test_assigns_amounts_to_columns_and_groups(self):
        ex = b.exemptions(self.PAGE)
        groups = {g["name"]: g for g in ex["groups"]}
        self.assertEqual(groups["STAR school tax relief"]["school"], 22020445)
        self.assertEqual(groups["STAR school tax relief"]["town"], 0)
        self.assertEqual(groups["Veterans"]["town"], 3348096)

    def test_total_mismatch_stops_the_run(self):
        bad = self.PAGE[:-1] + ["        T O T A L       2,575                                          3348,097              3348,096            22020,445"]
        with self.assertRaises(SystemExit):
            b.exemptions(bad)


if __name__ == "__main__":
    unittest.main()
