"""Tests for build_grants.py: grouping aid by purpose and keeping general aid out of grant totals."""

import csv
import io
import sys
import unittest
import zipfile
from pathlib import Path
from unittest import mock

sys.path.insert(0, str(Path(__file__).resolve().parent))
import build_grants as g  # noqa: E402

COLS = ["CALENDAR_YEAR", "MUNICIPAL_CODE", "ENTITY_NAME", "CLASS_DESCRIPTION", "COUNTY", "PERIOD_START", "PERIOD_END",
        "ACCOUNT_CODE", "ACCOUNT_CODE_NARRATIVE", "ACCOUNT_CODE_SECTION", "LEVEL_1_CATEGORY", "LEVEL_2_CATEGORY",
        "OBJECT_OF_EXPENDITURE", "AMOUNT", "SNAPSHOT_DATE"]


def fake_zip(rows):
    buf = io.StringIO()
    w = csv.DictWriter(buf, fieldnames=COLS)
    w.writeheader()
    for r in rows:
        w.writerow({c: "" for c in COLS} | r)
    out = io.BytesIO()
    with zipfile.ZipFile(out, "w") as z:
        z.writestr("2025_town.csv", buf.getvalue())
    return out.getvalue()


def row(code, name, level, cat, amount, entity="Town of Riverhead"):
    return {"ENTITY_NAME": entity, "ACCOUNT_CODE": code, "ACCOUNT_CODE_NARRATIVE": name, "ACCOUNT_CODE_SECTION": "REVENUE",
            "LEVEL_1_CATEGORY": level, "LEVEL_2_CATEGORY": cat, "AMOUNT": str(amount), "SNAPSHOT_DATE": "2026-10-30"}


class PurposeTests(unittest.TestCase):
    def test_fund_decides_before_category(self):
        self.assertEqual(g.purpose("EW4989", "Federal Aid - Community Services"), "Water district")
        self.assertEqual(g.purpose("CD4089", "Miscellaneous Federal Aid"), "Community development (CDBG and HOME housing)")
        self.assertEqual(g.purpose("ES3901", "State Aid - Sanitation"), "Sewer district")

    def test_codes(self):
        self.assertEqual(g.purpose("H3591", "State Aid - Transportation"), "Roads and highways")
        self.assertEqual(g.purpose("A4960", "Federal Aid - Public Safety"), "Disaster recovery (FEMA and State)")
        self.assertEqual(g.purpose("A3772", "State Aid - Community Services"), "Senior programs")
        self.assertEqual(g.purpose("A4389", "Federal Aid - Public Safety"), "Police and public safety")


class YearTests(unittest.TestCase):
    def test_general_aid_is_kept_apart_and_other_towns_ignored(self):
        z = fake_zip([
            row("A3005", "State Aid Mortgage Tax", "State Aid", "Mortgage Tax", 1000),
            row("A3001", "State Aid Revenue Sharing", "State Aid", "Unrestricted State Aid", 100),
            row("H3591", "State Aid Highway Capital Projects", "State Aid", "State Aid - Transportation", 500),
            row("A4772", "Federal Aid Programs for Aging", "Federal Aid", "Federal Aid - Community Services", 200),
            row("H3591", "State Aid Highway Capital Projects", "State Aid", "State Aid - Transportation", 9999, entity="Town of Southold"),
        ])
        with mock.patch.object(g, "http_get", return_value=z):
            y = g.osc_year(2025)
        self.assertEqual((y["state"], y["federal"], y["total"], y["generalAid"]), (500, 200, 700, 1100))
        self.assertEqual(y["byPurpose"], {"Roads and highways": 500, "Senior programs": 200})

    def test_year_not_posted(self):
        with mock.patch.object(g, "http_get", side_effect=g.NotPosted("x")):
            self.assertIsNone(g.osc_year(2030))


if __name__ == "__main__":
    unittest.main()
