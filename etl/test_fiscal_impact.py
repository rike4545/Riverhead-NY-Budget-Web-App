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
import tempfile
import unittest
from pathlib import Path
from unittest import mock

import parse_fiscal_impact
from parse_fiscal_impact import (
    adopted_draws,
    build_meeting,
    closeout_read,
    closes_project,
    count_summary,
    derived_summary,
    largest_understated_marked_no,
    mark_program_totals,
    merge_hand_curated,
    parse_packet,
    stated_amounts,
    stated_cost,
    statement_below_table,
    table_fund_balance,
)

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

    def test_proceeds_an_earlier_contract_earmarks_are_background(self):
        text = ("WHEREAS, the sale is expected to close with a sales price of $2,625,000.00. Of the gross proceeds, "
                "$660,000.00 is contractually designated to various Town Square projects; and")
        self.assertIn((660000.0, "context"), roles(text))
        self.assertIsNone(stated_cost(stated_amounts(text)))

    def test_a_grant_programs_size_is_not_money_in(self):
        # 2026-773: the program's $54 million, then the Town's $13,045 request.
        text = ("WHEREAS, the Police Department has identified a GTSC grant opportunity that would provide funding "
                "in the amount up to $54,000,000.00 for a public safety education program; and\n"
                "RESOLVED, that the Police Department is authorized to submit an application to the grant program "
                "to apply for funding in the amount of $13,045.00; and")
        self.assertEqual([(a["amount"], a["role"]) for a in mark_program_totals(stated_amounts(text))],
                         [(54000000.0, "program"), (13045.0, "revenue")])
        # 2026-643: a $2,000 gift, of which the Board places $1,000, is still money in.
        gift = ("WHEREAS, the second being a monetary donation in the amount of $2,000 in memory of a resident; and\n"
                "RESOLVED, the Financial Administrator has the authority to accept and place $1,000 in funds into the "
                "Gifts and Donations account")
        self.assertEqual([(a["amount"], a["role"]) for a in mark_program_totals(stated_amounts(gift))],
                         [(2000.0, "revenue"), (1000.0, "revenue")])

    def test_statement_below_its_own_table(self):
        table = [{"amount": 280000.0, "role": "budget-line", "clause": "table", "quote": ""}]
        self.assertEqual(statement_below_table({"amount": 150000.0}, table), {"statement": 150000.0, "table": 280000.0})
        self.assertIsNone(statement_below_table({"amount": 280000.0}, table))
        # Two $1,000 donations on a $2,000 statement: a sum, not a mismatch.
        self.assertIsNone(statement_below_table({"amount": 2000.0}, [{**table[0], "amount": 1000.0}]))
        self.assertIsNone(statement_below_table({"amount": None}, table))

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


CLOSEOUT_PACKET = """TB Resolution 2026-578
CAPITAL PROJECT #72406 PARKING LOT AT VETERAN'S MEMORIAL PARK CLOSURE
WHEREAS, the Town Engineer has determined this project to be complete, with unspent funds of $182.61 that can be returned to the General Fund. Now, therefore be it
RESOLVED, that the Town Board authorizes the Finance Department to close Capital Project #72406; and be it further
THE VOTE
RESULT: Adopted
FISCAL IMPACT STATEMENT
D. Will the Proposed Legislation have a Fiscal Impact: No
B. Title of Proposed Legislation: Capital Project #72406 Parking Lot At Veteran's Memorial Park Closure
C. Purpose of Proposed Legislation: closure
"""


class Closeouts(unittest.TestCase):
    # Closing a finished project and returning what is left commits nothing new;
    # these are the June 16, 2026 closeouts' own words.
    def test_returning_unspent_money_is_a_closeout(self):
        self.assertTrue(closes_project(
            "WHEREAS, Town Board Resolution 2020-400 authorized the issuance of $5,500,000.00 bonds with an "
            "additional $497,855.57 of funding borrowed from the General Fund; and\n"
            "WHEREAS, the unspent funds of $2,144.43 remaining from this project can now be returned to the "
            "General Fund and the project can be closed. Now, therefore be it\n"
            "RESOLVED, that the Town Board authorizes the Finance Department to close Capital Project #12101; and\n"
            "H01-5031-A01-12101-K Transfers from Other Funds-A01 $2,144.43"))
        self.assertTrue(closes_project(
            "WHEREAS, the unspent funds of $17,972.55 can now be returned to the Restricted Fund Balance. Now, therefore be it\n"
            "RESOLVED, that the Town Board authorizes the Finance Department to close Capital Project #52311; and\n"
            "A01-9999-000-00000-0 Assigned Unappropriated Fund Balance – CBF $17,972.55"))
        self.assertTrue(closes_project(
            "RESOLVED, that the Town Board authorize the Finance Department to close Sewer District Capital "
            "Project #82227 and return the unspent funds to the Riverhead Sewer District; and"))

    def test_a_closeout_that_puts_money_in_is_not(self):
        self.assertFalse(closes_project(
            "WHEREAS, the project was completed with a deficit of $12,000.00. Now, therefore be it\n"
            "RESOLVED, that the Town Board authorizes the Finance Department to close Capital Project #12345; and"))
        self.assertFalse(closes_project(
            "RESOLVED, that the Town Board authorizes the Finance Department to close Capital Project #12345; and\n"
            "A01-9999 Appropriated Fund Balance $12,000.00"))
        self.assertFalse(closes_project(
            "RESOLVED, that the Town Board authorizes the Finance Department to close Capital Project #12345 "
            "and transfer the remaining $50,000.00 to Capital Project #12399; and"))

    def test_a_fund_balance_account_is_money_in_whatever_its_label(self):
        # Section G blank, and the table names the account only as "Fund Balance",
        # as 2026-642's statement names CM4-9999-000-00000-0.
        close = "RESOLVED, that the Town Board authorizes the Finance Department to close Capital Project #12345; and\n"
        for line in ("CM4-9999-000-00000-0 Fund Balance $ 7,212,941.00",
                     "EA1-9999-000-00000-0 Ambulance District Fund Balance $25,000.00",
                     "A01-9999-000-00000-0 – Assigned Fund Balance $4,000.00"):
            with self.subTest(line):
                self.assertFalse(closes_project(close + "RESOLVED, the following budget adjustment: FROM TO " + line))
        # An unappropriated balance is a draw too (2026-361) unless the money is
        # said to be returned to it.
        self.assertFalse(closes_project(
            close + "FROM TO A01-9999-000-00000-0 Assigned Unappropriated Fund Balance – CBF $113,613.00"))

    def test_only_table_rows_are_read_as_draws(self):
        close = "RESOLVED, that the Town Board authorizes the Finance Department to close Capital Project #12345; and be it further\n"
        table = "RESOLVED, that the Supervisor is authorized to establish the following budget adjustments;\nFROM TO\n"
        # A recital of how the project was first funded is history.
        self.assertTrue(closes_project(
            "WHEREAS, the project was established using General Fund Balance in the amount of $100,000 under "
            "Resolution 2020-1; and\nWHEREAS, the project is complete and can now be closed. Now, therefore be it\n" + close))
        # A row with no account code keeps its whole label, so a return to an
        # unappropriated balance is still read as one, even as the table's first row.
        self.assertTrue(closes_project(
            "WHEREAS, the remaining $100 can be returned to that balance. Now, therefore be it\n" + close + table +
            "Assigned Unappropriated Fund Balance $100.00\nH01-7-7110-230-000-12345 Parks - Improvements $100.00\n"
            "And be it further"))
        # A bare "Fund Balance" row with no code is still a draw.
        self.assertFalse(closes_project(
            close + table + "Fund Balance $5,000.00\nH01-7-7110-230-000-12345 Parks - Improvements $5,000.00\n"
            "And be it further"))

    def test_only_the_board_closing_a_project_counts(self):
        # 2026-270's recital says the project "can now be closed", but the Board
        # resolves only a budget adjustment.
        self.assertFalse(closes_project(
            "WHEREAS, Capital Project #44038 is considered complete and can now be closed; and\n"
            "RESOLVED, the Supervisor is authorized to establish the following budget adjustment: "
            "H01-6-6497-230-000-44038 Community Development Street Light Install $25,000.00"))
        self.assertFalse(closes_project("RESOLVED, that the Town Board approves the road closure of Main Street; and"))

    def test_the_read_corrects_only_a_category_guess_on_a_no(self):
        guess = {"verdict": "Understated", "reason": "", "flag": "understated", "evidence": "category"}
        self.assertEqual(closeout_read(guess, "No")["flag"], "fair")
        self.assertEqual(closeout_read(guess, "Yes"), guess)
        accounts = {**guess, "evidence": "account-code"}
        self.assertEqual(closeout_read(accounts, "No"), accounts)

    def test_a_closeout_in_a_packet(self):
        meeting = build_meeting("2099-01-01", CLOSEOUT_PACKET)
        r = meeting["resolutions"][0]
        self.assertEqual((r["number"], r["realistic"]["flag"], r["realistic"]["evidence"]), ("2026-578", "fair", "resolution-text"))
        self.assertEqual(meeting["summary"]["understatedMarkedNo"], 0)


# 2026-765 as the August 18, 2026 packet prints it: the adopted table moves
# $280,000 out of fund balance, while section G says $150,000.
LEGAL_FEES_PACKET = """TB Resolution 2026-765
BUDGET TRANSFER FOR 2026 LEGAL FEES
WHEREAS, the Office of the Town Attorney is requesting a budget transfer for legal fees for 2026. Now, therefore be it
RESOLVED, that the Supervisor be, and is hereby authorized to establish the following
budget adjustments;
 FROM          TO
A01-9999-000-00000-0 Appropriated Fund Balance            $280,000
A01-1-1420-433-000-00000 Atty-Prof Svc-Legal                       $280,000
And be it further,
RESOLVED, that the Town Clerk is hereby authorized to forward a copy of this resolution
THE VOTE
RESULT: Adopted
FISCAL IMPACT STATEMENT
B.     Title of Proposed Legislation: Budget Transfer for 2026 Legal Fees
C.     Purpose of Proposed Legislation: Budget Transfer for 2026 Legal Fees
D.     Will the Proposed Legislation have a Fiscal Impact: Yes
 (a)
Detail/Initials:  MB
G.     Proposed Source of Funding:
Appropriation Account to be Charged:
Grant or other Revenue Source: A01-9999-000-00000-0 Appropriated Fund Balance
$150,000
Appropriation Transfer (list account(s) and amount): A01-1-1420-433-000-00000 Atty-Prof Svc-Legal
$150,000
H. Typed Name & Title of Preparer
"""


def g_lines(*lines: tuple[str, float | None], funds: list[str]) -> dict:
    """A section G naming these 9999 lines, drawn on the named funds."""
    return {"accounts": [{"code": c, "kind": "revenue", "fund": c.split("-")[0], "amount": a} for c, a in lines],
            "fundBalanceFunds": funds}


def t_rows(*rows: tuple[str, float]) -> list[dict]:
    return [{"code": c, "fund": c.split("-")[0], "amount": a, "row": f"{c} Appropriated Fund Balance ${a:,.2f}"} for c, a in rows]


class AdoptedTable(unittest.TestCase):
    def test_the_tables_fund_balance_rows(self):
        rows = table_fund_balance(LEGAL_FEES_PACKET.split("THE VOTE")[0])
        self.assertEqual(rows, [{"code": "A01-9999-000-00000-0", "fund": "A01", "name": "Appropriated Fund Balance",
                                 "amount": 280000.0, "row": "A01-9999-000-00000-0 Appropriated Fund Balance $280,000"}])

    def test_wrapped_labels_and_spaced_dollar_signs(self):
        # 2026-361's labels wrap before the figure; 2026-284 prints "$ 399,625.00".
        cbf = table_fund_balance(
            "RESOLVED, the following budget adjustments;\nFROM TO\n"
            "A01-9999-000-00000-0 Assigned Unappropriated Fund Balance \n   – CBF - Nextera Community Health & Wellness      $5,000 \n"
            "A01-9999-000-00000-0 Assigned Unappropriated Fund \n  Balance – CBF - Nextera Easement Phase 1     $108,613 \n"
            "H01-5-5110-250-CBF-52311 Infrastructure $113,613\nAnd be it further")
        self.assertEqual([(r["name"], r["amount"]) for r in cbf], [
            ("Assigned Unappropriated Fund Balance – CBF - Nextera Community Health & Wellness", 5000.0),
            ("Assigned Unappropriated Fund Balance – CBF - Nextera Easement Phase 1", 108613.0)])
        truck = table_fund_balance("RESOLVED that the Supervisor be authorized to establish the following budget adjustments;\n"
                                   "From \nDA1-9999-000-00000-0 - Appropriated Fund Balance    $ 399,625.00 \n \nTo \n"
                                   "  DA1-5-5130-240-000-00000 – Machinery-Equipment   $ 399,625.00;")
        self.assertEqual([(r["fund"], r["name"], r["amount"], r["row"]) for r in truck], [
            ("DA1", "Appropriated Fund Balance", 399625.0, "DA1-9999-000-00000-0 - Appropriated Fund Balance $ 399,625.00")])

    def test_only_the_resolved_clauses_and_only_a_rows_own_figure(self):
        # A recital is history, and an account printed without a figure takes no
        # other row's: the next figure here belongs to the appropriation line.
        self.assertEqual(table_fund_balance(
            "WHEREAS, A01-9999-000-00000-0 Appropriated Fund Balance funded $50,000 in 2025; and\n"
            "RESOLVED, that the Board appropriates A01-9999-000-00000-0 Appropriated Fund Balance\n"
            "A01-1-1420-433-000-00000 Atty-Prof Svc-Legal $10,000"), [])
        self.assertEqual(table_fund_balance("WHEREAS, there is no table. Now, therefore"), [])

    def test_the_table_outranks_section_g_in_the_fund_it_names(self):
        # 2026-765: the vote is the appropriation.
        self.assertEqual(adopted_draws(g_lines(("A01-9999-000-00000-0", 150000.0), funds=["General Fund"]),
                                       t_rows(("A01-9999-000-00000-0", 280000.0))),
                         [{"fund": "General Fund", "statement": 150000.0, "table": 280000.0, "amount": 280000.0,
                           "rows": ["A01-9999-000-00000-0 Appropriated Fund Balance $280,000.00"]}])
        # A table row in a fund section G does not draw on is not counted, and a
        # fund the table does not name keeps section G's figure.
        two = adopted_draws(g_lines(("A01-9999-000-00000-0", 100.0), ("DA1-9999-000-00000-0", 50.0),
                                    funds=["General Fund", "Highway Fund"]),
                            t_rows(("A01-9999-000-00000-0", 120.0), ("ES7-9999-000-00000-0", 650000.0)))
        self.assertEqual([(d["fund"], d["statement"], d["table"], d["amount"]) for d in two],
                         [("General Fund", 100.0, 120.0, 120.0), ("Highway Fund", 50.0, None, 50.0)])
        # No section G draw, nothing counted, whatever the table names.
        self.assertEqual(adopted_draws({}, t_rows(("A01-9999-000-00000-0", 17972.55))), [])
        # Section G names the account without a figure; the table prices it.
        self.assertEqual(adopted_draws(g_lines(("CM5-9999-000-00000-8", None), funds=["Community Preservation — capital"]),
                                       t_rows(("CM5-9999-000-00000-8", 25000.0)))[0]["amount"], 25000.0)

    def test_the_legal_fees_transfer_counts_what_the_board_adopted(self):
        meeting = build_meeting("2099-01-01", LEGAL_FEES_PACKET)
        r = meeting["resolutions"][0]
        self.assertEqual((r["number"], r["funding"]["fundBalanceDraw"], r["amount"]), ("2026-765", 150000.0, 280000.0))
        self.assertEqual(r["statementBelowTable"], {"statement": 150000.0, "table": 280000.0})
        self.assertEqual([t["row"] for t in r["tableFundBalance"]], ["A01-9999-000-00000-0 Appropriated Fund Balance $280,000"])
        self.assertTrue(r["realistic"]["reason"].startswith(
            "The budget table the Board adopted moves $280,000 out of Appropriated Fund Balance in the General Fund; "
            "section G of the statement names $150,000. The vote is the appropriation, so the draw is $280,000."))
        self.assertEqual((meeting["summary"]["fundBalanceDrawTotal"], meeting["summary"]["identifiedDollarsAtStake"]),
                         (280000.0, 280000.0))

    def test_a_matching_table_changes_nothing(self):
        same = LEGAL_FEES_PACKET.replace("$280,000", "$150,000")
        r = build_meeting("2099-01-01", same)["resolutions"][0]
        self.assertEqual((r["amount"], r["statementBelowTable"]), (150000.0, None))
        self.assertTrue(r["realistic"]["reason"].startswith("Section G charges $150,000 to Appropriated Fund Balance in the General Fund."))


class Summaries(unittest.TestCase):
    def test_a_hand_curated_meeting_keeps_its_amounts_and_counts_the_parse(self):
        # 2026-07-07: the hand file's totals were computed from hand amounts,
        # but its statements' account codes and stated costs come from the parse.
        # The stored total is stale, as July 7's was: it is recomputed from the
        # hand amounts on the resolutions read as understated or drawing reserves.
        hand = {
            "summary": {"total": 2, "markedNo": 1, "identifiedDollarsAtStake": 1,
                        "largestUnderstatedMarkedNo": [227683, "2026-634", "Water Capital Project"]},
            "resolutions": [
                {"number": "2026-634", "title": "Water Capital Project", "amount": 227683, "townFiscalImpact": "No",
                 "realistic": {"flag": "understated"}},
                {"number": "2026-641", "title": "Town Square BAN paydown", "amount": 2625000, "townFiscalImpact": "Yes",
                 "realistic": {"flag": "reserve-draw"}},
            ],
        }
        parsed = {"resolutions": [
            {"number": "2026-634", "amount": None, "statedAmounts": [], "statedCost": None, "statementBelowTable": None,
             "funding": {"accounts": [{}], "drawsFundBalance": True, "fundBalanceDraw": 227683.0}},
            {"number": "2026-641", "amount": None, "statedCost": 660000.0, "statementBelowTable": None,
             "statedAmounts": [{"amount": 660000.0, "role": "cost", "clause": "resolved", "quote": "$660,000"}],
             "funding": {"accounts": [{}]}},
        ]}
        with tempfile.TemporaryDirectory() as tmp, mock.patch.object(parse_fiscal_impact, "MEETINGS", Path(tmp)):
            (Path(tmp) / "2026-07-07-fiscal.json").write_text(json.dumps(hand), encoding="utf-8")
            s = merge_hand_curated("2026-07-07", parsed)["summary"]
        self.assertEqual((s["total"], s["markedNo"], s["identifiedDollarsAtStake"]), (2, 1, 2852683))
        self.assertEqual(s["largestUnderstatedMarkedNo"], [227683, "2026-634", "Water Capital Project"])
        self.assertEqual((s["withAccounts"], s["fundBalanceDraws"], s["fundBalanceDrawTotal"]), (2, 1, 227683.0))
        self.assertEqual((s["statedCostResolutions"], s["statedCostMarkedNo"], s["largestStatedCostMarkedNo"]), (1, 0, None))

    def test_largest_amount_marked_no_is_amount_number_and_title(self):
        # The shape /fiscal-impact/ reads for "The clearest example", taken only
        # from resolutions read as understated: July 7's $205,000 letter-of-credit
        # release was answered "No" too, and rightly.
        understated, neutral = {"flag": "understated"}, {"flag": "neutral"}
        rs = [{"number": "2026-1", "title": "A", "amount": 500.0, "townFiscalImpact": "No", "realistic": understated},
              {"number": "2026-2", "title": "B", "amount": 900.0, "townFiscalImpact": "No", "realistic": understated},
              {"number": "2026-3", "title": "C", "amount": 5000.0, "townFiscalImpact": "Yes", "realistic": understated},
              {"number": "2026-4", "title": "D", "amount": 205000.0, "townFiscalImpact": "No", "realistic": neutral}]
        self.assertEqual(largest_understated_marked_no(rs), [900.0, "2026-2", "B"])
        self.assertIsNone(largest_understated_marked_no(rs[2:]))


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

    def test_every_summary_counts_its_own_resolutions(self):
        for path in sorted(MEETINGS.glob("2026-*-fiscal.json")):
            data = json.loads(path.read_text(encoding="utf-8"))
            expected = {**count_summary(data["resolutions"]), **derived_summary(data["resolutions"])}
            with self.subTest(path.name):
                self.assertEqual({k: data["summary"].get(k) for k in expected}, expected)
                lu = data["summary"].get("largestUnderstatedMarkedNo")
                self.assertTrue(lu is None or (isinstance(lu, list) and len(lu) == 3), lu)

    def test_july_7_hand_amounts_follow_the_statements(self):
        # Where the statement's section G names a figure, the hand amount is that
        # figure, or the file says why not.
        for r in json.loads((MEETINGS / "2026-07-07-fiscal.json").read_text(encoding="utf-8"))["resolutions"]:
            g = (r.get("funding") or {}).get("amount")
            if r.get("amount") is not None and g is not None and abs(r["amount"] - g) > 0.5:
                with self.subTest(r["number"]):
                    self.assertTrue(r.get("amountNote"), f"{r['number']}: {r['amount']} against section G's {g}")

    def test_july_7_corrections(self):
        july = self.load("2026-07-07")
        amounts = {n: july[n]["amount"] for n in ("2026-637", "2026-640", "2026-641", "2026-655", "2026-678", "2026-681", "2026-682")}
        self.assertEqual(amounts, {"2026-637": 45322.29, "2026-640": 3575000.0, "2026-641": None, "2026-655": 113497.14,
                                   "2026-678": None, "2026-681": 112000.0, "2026-682": 205000.0})
        # A project closed with its unspent $227,683 returned commits nothing.
        self.assertEqual((july["2026-634"]["amount"], july["2026-634"]["realistic"]["flag"]), (227683, "fair"))
        data = json.loads((MEETINGS / "2026-07-07-fiscal.json").read_text(encoding="utf-8"))
        corrections = [r["amount"] for r in data["resolutions"]
                       if r.get("amount") and r["realistic"]["flag"] in ("understated", "reserve-draw")]
        self.assertEqual(data["summary"]["identifiedDollarsAtStake"], round(sum(corrections), 2))
        self.assertEqual(data["summary"]["largestUnderstatedMarkedNo"][:2], [113497.14, "2026-655"])

    def test_the_town_square_paydown_split(self):
        # July 7's 2026-641 planned the paydown from rent and the sale of 127 East
        # Main Street; August 4's 2026-762 paid it from fund balance until the sale
        # closes. The retired July 7 generator had 2026-641 "Uses fund balance".
        planned = self.load("2026-07-07")["2026-641"]
        self.assertEqual((planned["realistic"]["flag"], planned["funding"]["drawsFundBalance"]), ("neutral", False))
        self.assertIn("net proceeds", planned["note"])
        interim = self.load("2026-08-04")["2026-762"]["funding"]
        self.assertEqual((interim["drawsFundBalance"], interim["fundBalanceDraw"]), (True, 1874218.0))

    def test_every_draw_against_the_adopted_table(self):
        corrected, table_only = {}, set()
        for path in sorted(MEETINGS.glob("2026-*-fiscal.json")):
            for r in json.loads(path.read_text())["resolutions"]:
                draws = adopted_draws(r.get("funding"), r.get("tableFundBalance"))
                for d in draws:
                    if d["table"] is not None and d["table"] != d["statement"]:
                        corrected[r["number"]] = (d["statement"], d["table"])
                drawn = {a["fund"] for a in (r.get("funding") or {}).get("accounts") or []
                         if a.get("kind") == "revenue" and a["code"].split("-")[1:2] == ["9999"]}
                if any(t["fund"] not in drawn for t in r.get("tableFundBalance") or []):
                    table_only.add(r["number"])
        # A new disagreement between a statement and the vote is counted at the
        # table automatically, so read the packet before adding it here.
        self.assertEqual(corrected, {"2026-765": (150000.0, 280000.0)})
        # Rows section G does not confirm as draws, kept but not counted
        # (docs/agent-backlog.md): Highway truck purchases, the ES7 Vactor
        # truck, a Chapter 251 cleanup and two closeouts returning Community
        # Benefit Funds. Later meetings may add more.
        self.assertLessEqual({"2026-284", "2026-285", "2026-286", "2026-471", "2026-569", "2026-577", "2026-767"}, table_only)

    def test_june_16_closeouts_commit_nothing_new(self):
        june = self.load("2026-06-16")
        reads = {(june[f"2026-{n}"]["realistic"]["flag"], june[f"2026-{n}"]["realistic"].get("evidence")) for n in range(566, 598)}
        self.assertEqual(reads, {("fair", "resolution-text")})

    def test_known_reads(self):
        self.assertIsNone(self.load("2026-03-17")["2026-255"]["statedCost"])  # County money in
        self.assertIsNone(self.load("2026-05-20")["2026-471"]["statedCost"])  # an earlier estimate
        legal = self.load("2026-08-18")["2026-765"]
        self.assertEqual(legal["statementBelowTable"], {"statement": 150000.0, "table": 280000.0})
        # Counted at the $280,000 the Board adopted; section G's $150,000 is kept.
        self.assertEqual((legal["amount"], legal["funding"]["fundBalanceDraw"]), (280000.0, 150000.0))
        self.assertEqual([t["row"] for t in legal["tableFundBalance"]], ["A01-9999-000-00000-0 Appropriated Fund Balance $280,000"])
        gtsc = {a["amount"]: a["role"] for a in self.load("2026-08-18")["2026-773"]["statedAmounts"]}
        self.assertEqual((gtsc[54000000.0], gtsc[13045.0]), ("program", "revenue"))
        vactor = self.load("2026-08-18")["2026-767"]
        self.assertEqual((vactor["statedCost"], vactor["townFiscalImpact"]), (650000.0, "No"))


if __name__ == "__main__":
    unittest.main(verbosity=1)
