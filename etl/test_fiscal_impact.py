#!/usr/bin/env python3
"""Fiscal Impact Statements: which resolution each belongs to, and the dollar
figures the resolution itself states.

Matching a statement to its resolution by title put two back-to-back
"Appoints a Call-In Park Attendant" statements on the first of the pair, so it
now follows the "TB Resolution 2026-NNN" header printed above each one. And a
dollar sign in a resolution is not a cost: it can be insurance an applicant
must carry, a fee paid to the Town, County money the Town accepts, a
developer's bond being released or a project that is already finished. Only a
figure that reads as the Town paying out counts toward the stated cost.
"""

import json
import re
import unittest
from pathlib import Path

from parse_fiscal_impact import parse_packet, stated_amounts, stated_cost

ROOT = Path(__file__).resolve().parent.parent
MEETINGS = ROOT / "web/public/data/meetings"


def roles(text: str) -> list[tuple[float, str]]:
    return [(a["amount"], a["role"]) for a in stated_amounts(text)]


class StatedAmounts(unittest.TestCase):
    def test_insurance_limits_are_left_out(self):
        text = ("WHEREAS, a Comprehensive Liability Insurance Policy naming the Town of Riverhead as an additional "
                "insured in the amount of $1,000,000 per occurrence and $2,000,000 general aggregate; and")
        self.assertEqual(roles(text), [])

    def test_application_fee_is_a_fee(self):
        self.assertEqual(roles("WHEREAS, the applicant has paid the requisite Chapter 255 Application fee of $350.00; and"),
                         [(350.0, "fee")])

    def test_accepting_county_funds_is_revenue_not_cost(self):
        # 2026-255 says "not to exceed" and is money coming in.
        text = ("RESOLVED, that the Town Board hereby authorizes the Supervisor to execute the attached Agreement "
                "authorizing the Town of Riverhead to accept funds from Suffolk County Office for the Aging for the "
                "purpose of supplementing the budget of the Town's Nutrition Program for the Elderly in an amount "
                "not to exceed $408,211.00, for calendar year 2026; and")
        self.assertEqual(roles(text), [(408211.0, "revenue")])
        self.assertIsNone(stated_cost(stated_amounts(text)))

    def test_a_contract_ceiling_is_a_cost(self):
        text = "RESOLVED, that the Town Attorney is hereby authorized to order an appraisal at a cost not to exceed $8,500.00; and"
        self.assertEqual(roles(text), [(8500.0, "cost")])
        self.assertEqual(stated_cost(stated_amounts(text)), 8500.0)

    def test_budget_table_lines(self):
        text = ("RESOLVED, that the Supervisor be, and is hereby authorized to establish the following budget adjustments;\n"
                "SM1-9999-000-00000-0 Ambulance District Fund Balance      $45,000.00\n"
                "SM1-4-4540-402-000-00000 Amb – R&M – Buildings          $45,000.00\n")
        self.assertEqual(roles(text), [(45000.0, "budget-line")])

    def test_finished_projects_and_released_bonds_are_not_costs(self):
        self.assertEqual(roles("WHEREAS, per the Highway Department, Capital Project #52413 is hereby considered "
                               "complete at a cost of $127,646.68. Now"), [(127646.68, "context")])
        self.assertEqual(roles("WHEREAS, the sponsor posted a performance bond in the amount of $2,530,000.00 to secure"),
                         [(2530000.0, "security")])

    def test_an_earlier_authorization_is_background(self):
        # 2026-471 recalls the estimate a 2025 resolution authorized; what it
        # orders is the $7,677.64 charged back to the property.
        text = ("WHEREAS, the cost of this rehabilitation was estimated to be $15,000.00 and a budget\n"
                "transfer was authorized to perform this cleanup; and\n"
                "RESOLVED, that the cost and expenses are hereby reported to the Assessor in the sum of $7,677.64 "
                "and shall be levied and assessed against the premises")
        self.assertEqual(roles(text), [(15000.0, "context"), (7677.64, "revenue")])
        self.assertIsNone(stated_cost(stated_amounts(text)))

    def test_thousands_and_millions(self):
        self.assertEqual([a["amount"] for a in stated_amounts("WHEREAS, the request is $549K and $1.545M; and")],
                         [549000.0, 1545000.0])

    def test_resolved_clause_outranks_the_recitals(self):
        text = ("WHEREAS, bids were opened and the cost of the work is $90,000; and\n"
                "RESOLVED, that the bid is awarded to the contractor in the amount of $82,500.00; and")
        self.assertEqual(stated_cost(stated_amounts(text)), 82500.0)


PACKET = """TB Resolution 2026-229
APPOINTS A CALL-IN PARK ATTENDANT TO THE RECREATION DEPARTMENT
RESOLVED, that the Town Board hereby appoints the attendant at an hourly rate of pay of $17.25; and
THE VOTE
RESULT: Adopted
FISCAL IMPACT STATEMENT
D. Will the Proposed Legislation have a Fiscal Impact: No
B. Title of Proposed Legislation: Appoints a Call-In Park Attendant to the Recreation Department
C. Purpose of Proposed Legislation: staffing
TB Resolution 2026-230
APPOINTS A CALL-IN PARK ATTENDANT TO THE RECREATION DEPARTMENT
RESOLVED, that the Town Board hereby appoints a second attendant at an hourly rate of pay of $17.25; and
THE VOTE
RESULT: Adopted
FISCAL IMPACT STATEMENT
D. Will the Proposed Legislation have a Fiscal Impact: No
B. Title of Proposed Legislation: Appoints a Call-In Park Attendant to the Recreation Department
C. Purpose of Proposed Legislation: staffing
FISCAL IMPACT STATEMENT
D. Will the Proposed Legislation have a Fiscal Impact: No
B. Title of Proposed Legislation: Appoints a Call-In Park Attendant to the Recreation Department
C. Purpose of Proposed Legislation: a second sheet for the same resolution
"""


class PrintedNumbers(unittest.TestCase):
    def test_each_statement_takes_the_resolution_printed_above_it(self):
        parsed = parse_packet(PACKET)
        self.assertEqual([p["printedNumber"] for p in parsed], ["2026-229", "2026-230", None])
        self.assertEqual(parsed[0]["statedAmounts"][0]["role"], "rate")


class Datasets(unittest.TestCase):
    def load(self, date: str) -> dict:
        return {r["number"]: r for r in json.loads((MEETINGS / f"{date}-fiscal.json").read_text())["resolutions"]}

    def test_title_twins_get_their_own_numbers(self):
        self.assertIn("2026-230", self.load("2026-03-17"))
        self.assertIn("2026-524", self.load("2026-05-20"))
        self.assertIn("2026-729", self.load("2026-08-04"))

    def test_printed_numbers_are_unique_in_each_meeting(self):
        for path in sorted(MEETINGS.glob("2026-*-fiscal.json")):
            printed = [r["number"] for r in json.loads(path.read_text())["resolutions"] if r.get("numberSource") == "printed"]
            self.assertEqual(len(printed), len(set(printed)), path.name)

    def test_every_quote_carries_its_figure(self):
        for path in sorted(MEETINGS.glob("2026-*-fiscal.json")):
            for r in json.loads(path.read_text())["resolutions"]:
                for a in r.get("statedAmounts") or []:
                    digits = re.sub(r"\D", "", a["quote"])
                    whole = str(int(a["amount"])) if a["amount"] < 1000 else f"{int(a['amount']):,}".split(",")[0]
                    self.assertIn(whole, digits, f"{path.name} {r['number']}: {a}")

    def test_known_reads(self):
        self.assertIsNone(self.load("2026-03-17")["2026-255"]["statedCost"])  # County money in
        self.assertIsNone(self.load("2026-05-20")["2026-471"]["statedCost"])  # an earlier estimate
        vactor = self.load("2026-08-18")["2026-767"]
        self.assertEqual((vactor["statedCost"], vactor["townFiscalImpact"]), (650000.0, "No"))


if __name__ == "__main__":
    unittest.main(verbosity=1)
