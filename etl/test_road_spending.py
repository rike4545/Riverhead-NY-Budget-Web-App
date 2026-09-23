#!/usr/bin/env python3
"""The two halves of the road-spending comparison, parsed from small samples
laid out the way the Comptroller's CSV and the DOT's listing are."""

import unittest

from parse_road_spending import TOWNS, build, check, highways, lhi_town_miles

HEADER = ("CALENDAR_YEAR,MUNICIPAL_CODE,ENTITY_NAME,CLASS_DESCRIPTION,COUNTY,PERIOD_START,PERIOD_END,ACCOUNT_CODE,"
          "ACCOUNT_CODE_NARRATIVE,ACCOUNT_CODE_SECTION,LEVEL_1_CATEGORY,LEVEL_2_CATEGORY,OBJECT_OF_EXPENDITURE,AMOUNT,"
          "SNAPSHOT_DATE\n")


def row(entity, county, section, level2, obj, amount):
    return (f'2025,1,{entity},Town,{county},2025-01-01,2025-12-31,DA51101,"Repairs",{section},Transportation,'
            f'{level2},"{obj}",{amount},2026-08-31\n')


def page(muni, jurisdiction, segments):
    lines = ["New York State Department of Transportation", "Local Roads Listing", "8/26/2025",
             "Municipality:", muni, "Suffolk County", "Jurisdiction:", jurisdiction + "                 ", "DOT ID"]
    for beg, end, length in segments:
        lines += ["236855", "MAIN ST", "DEAD END", f"{beg:.2f}", f"{end:.2f}", f"{length:.2f}", "2", "P"]
    return "\n".join(lines)


class SpendingTests(unittest.TestCase):
    def test_only_suffolk_town_highway_expenditure(self):
        csv_text = HEADER + "".join([
            row("Town of Riverhead", "Suffolk", "EXPENDITURE", "Highways", "Personal Services", 100),
            row("Town of Riverhead", "Suffolk", "EXPENDITURE", "Highways", "Contractual", 50),
            row("Town of Riverhead", "Suffolk", "EXPENDITURE", "Airport", "Contractual", 999),
            row("Town of Riverhead", "Suffolk", "REVENUE", "Highways", "", 999),
            row("Town of Adams", "Jefferson", "EXPENDITURE", "Highways", "Personal Services", 999),
        ])
        totals, mix, snapshot = highways(csv_text)
        self.assertEqual(totals, {"Riverhead": 150})
        self.assertEqual(mix, {"Personal Services": 100, "Contractual": 50})
        self.assertEqual(snapshot, "2026-08-31")


class MileageTests(unittest.TestCase):
    def test_sums_town_roads_and_skips_villages_and_county(self):
        pages = [
            page("Town of Riverhead", "Town", [(0.0, 0.23, 0.23), (0.23, 1.05, 0.82)]),
            page("Town of Riverhead", "County", [(0.0, 5.0, 5.0)]),
            page("Village of Greenport", "Village", [(0.0, 1.0, 1.0)]),
        ]
        miles, rejected = lhi_town_miles(pages)
        self.assertAlmostEqual(miles["Riverhead"], 1.05)
        self.assertNotIn("Greenport", miles)
        self.assertEqual(rejected, 0)

    def test_a_length_that_is_not_end_minus_start_is_rejected(self):
        miles, rejected = lhi_town_miles([page("Town of Riverhead", "Town", [(0.0, 0.50, 0.90)])])
        self.assertEqual(rejected, 1)
        self.assertEqual(miles.get("Riverhead", 0), 0)


class OutputTests(unittest.TestCase):
    def setUp(self):
        self.spend = {t: 1_000_000 + i for i, t in enumerate(TOWNS)}
        self.miles = {t: 100.0 + i for i, t in enumerate(TOWNS)}

    def test_towns_ranked_by_cost_per_mile(self):
        p = build(2025, self.spend, {"Personal Services": 60, "Contractual": 40}, "2026-08-31",
                  2025, "https://example.invalid/x.pdf", "8/26/2025", self.miles)
        per_mile = [t["perMile"] for t in p["towns"]]
        self.assertEqual(per_mile, sorted(per_mile, reverse=True))
        self.assertEqual(p["asOf"], "Fiscal year 2025")
        self.assertIn("dated August 26, 2025", p["mileage"]["detail"])
        self.assertIn("Data snapshot dated August 31, 2026.", p["spending"]["detail"])

    def test_a_large_mileage_jump_is_refused(self):
        p = build(2025, self.spend, {}, None, 2025, "u", None, self.miles)
        before = {"towns": [{"town": "Riverhead", "miles": 50.0}]}
        self.assertTrue(check(p, before))
        self.assertFalse(check(p, {"towns": [{"town": "Riverhead", "miles": self.miles["Riverhead"]}]}))


if __name__ == "__main__":
    unittest.main()
