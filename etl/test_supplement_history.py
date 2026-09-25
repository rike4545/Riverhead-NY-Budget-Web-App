"""Tests for parse_supplement_history.py: the column rules, the account shapes,
the revenue categories, and a few figures read back from the committed PDFs.

Run from etl/:  python3 -m unittest -q test_supplement_history
"""

import unittest

import parse_supplement_history as h


class ColumnRules(unittest.TestCase):
    def test_five_columns_by_default(self):
        header = "Account Number Account Description 2025 Actuals 2026 Adopted Budget 2026 YTD as of 6/30/26 2027 Department Request 2027 Tentative Budget"
        self.assertEqual(h.columns_for(2027, header),
                         ["actual2025", "adopted2026", "ytd2026", "request2027", "tentative2027"])

    def test_2021_and_2022_revenue_pages_have_no_request_column(self):
        header = "Account Number Account Description 2019 Actual 2020 Adopted Budget 2020 YTD as of 6/30/2020 2021 Tentative Budget"
        self.assertEqual(h.columns_for(2021, header),
                         ["actual2019", "adopted2020", "ytd2020", "tentative2021"])

    def test_2020_prints_a_preliminary_column(self):
        header = "Account Number Account Description 2018 Actual 2019 Budget 2019 YTD Actual as of 6/30 2020 Dept Request 2020 Tentative Budget 2020 Preliminary Budget"
        self.assertEqual(h.columns_for(2020, header)[-1], "prelim2020")
        self.assertEqual(len(h.columns_for(2020, header)), 6)

    def test_a_page_without_a_header_falls_back_to_the_year(self):
        self.assertEqual(len(h.columns_for(2020)), 6)
        self.assertEqual(len(h.columns_for(2026)), 5)


class AccountShapes(unittest.TestCase):
    def test_one_digit_funds_are_expenditure_accounts(self):
        # Highway, Water and Sewer were missing from the history before this
        for acct in ("DA1-5-5130-240-000-00000", "EW1-8-8320-230-000-00000", "A01-1-1420-433-000-00000"):
            self.assertRegex(acct, h.ACC)

    def test_revenue_accounts(self):
        for acct in ("A01-2401-000-00000-G", "A01-1560-170-00000-3", "V01-5031-A01-00000-K"):
            self.assertRegex(acct, h.REV)
            self.assertNotRegex(acct, h.ACC)


class RevenueCategories(unittest.TestCase):
    def test_uniform_codes(self):
        cases = {
            "1001": "property-tax", "1081": "tax-items", "1116": "non-property-taxes",
            "1120": "non-property-taxes", "1560": "departmental", "2120": "departmental",
            "2401": "money-and-property", "2410": "money-and-property", "2610": "fines",
            "2660": "sales-of-property", "2801": "interfund-revenue", "3005": "state-aid",
            "4772": "federal-aid", "5031": "other-sources", "9999": "fund-balance",
        }
        for code, cat in cases.items():
            self.assertEqual(h.revenue_category(code), cat, code)


class ReadBackFromThePdfs(unittest.TestCase):
    """A handful of figures checked by hand against the printed Supplements."""

    @classmethod
    def setUpClass(cls):
        h.YEARS = sorted(int(p.stem) for p in h.SRC.glob("20[0-9][0-9].pdf"))
        h.LATEST = h.YEARS[-1]
        h.ACTUAL_YEARS = list(range(h.YEARS[0] - 2, h.LATEST - 1))
        cls.panel = {}
        for y in h.YEARS:
            h.read_supplement(y, cls.panel, h.LATEST)

    def test_police_overtime_2024_budget_was_700011(self):
        # the 2025 Supplement's "2024 Adopted Budget" column; $1,000,000 is 2025's
        rec = self.panel["A01-3-3120-111-UNI-00000"]
        self.assertEqual(rec["adopted2024"], 700_011.00)
        self.assertEqual(rec["adopted2025"], 1_000_000.00)
        self.assertEqual(rec["actual2024"], 1_401_354.14)

    def test_outside_legal_services(self):
        rec = self.panel["A01-1-1420-433-000-00000"]
        self.assertEqual([rec[f"actual{y}"] for y in (2023, 2024, 2025)], [710_192.15, 467_133.86, 818_960.74])
        self.assertEqual(rec["tentative2027"], 400_000.00)

    def test_revenue_in_the_years_without_a_request_column(self):
        rec = self.panel["A01-1001-001-00000-A"]
        self.assertEqual(rec["actual2019"], 38_848_800.01)   # 2021 Supplement
        self.assertEqual(rec["adopted2021"], 41_698_400.00)  # 2022 Supplement

    def test_interest_was_budgeted_at_50000(self):
        rec = self.panel["A01-2401-000-00000-G"]
        self.assertEqual([rec[f"adopted{y}"] for y in (2024, 2025, 2026)], [50_000.0] * 3)
        self.assertEqual(rec["actual2025"], 1_491_222.41)

    def test_newest_supplement_is_complete(self):
        lines = [r for r in self.panel.values() if r.get(f"tentative{h.LATEST}") is not None]
        self.assertEqual(len(lines), 2000)


if __name__ == "__main__":
    unittest.main()
