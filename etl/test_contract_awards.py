#!/usr/bin/env python3
"""Tests for build_contract_awards.py: which resolutions count, the vendor each
names, the amount a clause states, and the contact details it must drop."""

import json
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import build_contract_awards as ca  # noqa: E402

# Wording from the 2026 agenda packets, trimmed.
BID_AWARD = """
          NOW, THEREFORE, BE IT RESOLVED that the bid for CHEMICALS FOR SEWER
DISTRICT be awarded to the vendors indicated below for items indicated at prices on the
attached page;
Item #1 & 6 to               BULK CHEMICAL COMPANY, INC.
                                      120 RAYNOR AVE
                                       RONKONKOMA, NY 11779
                                       info@bulkchemicalco.com
Items #2, 3, 4, 5 & 7 to GEORGE S. COYNE CHEMICAL CO., INC.
                                       3015 STATE RD
                                       CROYDON, PA 19021
                                       bidadministration@coynechemical.com
     BE IT FURTHER RESOLVED, that the Town Clerk be and is hereby authorized to forward a
copy of this resolution to all vendors listed above
"""

CONTRACTS = """
RIVERHEAD WATER DISTRICT be awarded to the vendors indicated below for prices on the
attached pages;
CONTRACT E – ELECTRICAL CONSTRUCTION
Eldor Contracting Corp.
30 Corporate Dr
Holtsville, NY 11742
estimating@eldor.com
CONTRACT G – GENERAL CONSTRUCTION
Philip Ross Industries Inc.
88 Duryea Road
Page 161 of 269
Suite 204
Melville, NY 11747
BE IT FURTHER RESOLVED, that the Town Clerk
"""

PURCHASE = """
WHEREAS, the Town of Riverhead Highway Department Superintendent is seeking to purchase one (1)
2026 Kenworth Model T480V Tandem Axle Chassis, from Gabrielli Truck Sales, an approved vendor,
under the Town of East Hampton Contract# EHWY23-215; and
NOW, THEREFORE, BE IT RESOLVED, that the Town Board approves the purchase in the amount of $399,625.00; and
"""

CONSULTANT = """
WHEREAS, David Lessard, Contractor, is willing to provide the following services to the Town:
NOW, THEREFORE, BE IT HEREBY RESOLVED, that David Lessard is appointed Administrator;
"""

CAPPED = """
WHEREAS, by Resolution #2025-100 the Town paid $9,000.00 for the same services; and
RESOLVED, that the Town Board hereby authorizes the Supervisor to execute a professional services
agreement with Joan Mottern at an hourly rate of $46.45, not to exceed the sum of $5,000.00 or
continue after March 31, 2026 whichever first occurs; and be it further,
"""

LICENSE = """
NOW, THEREFORE, BE IT RESOLVED that the Board hereby authorizes the Short Term, Revocable License
Agreement in substantially the same form attached between the Town of Riverhead and 3 Little Scoops, Inc.;
"""


class KindTest(unittest.TestCase):
    def test_spending_kinds(self):
        self.assertEqual(ca.kind_of("Awards Bid for Chemicals for Sewer District"), "bid-award")
        self.assertEqual(ca.kind_of("Ratifies Award of Bid for Twin Honda Outboard Motors"), "bid-award")
        self.assertEqual(ca.kind_of("Extends Bid for Dry Hydrated Lime"), "bid-extension")
        self.assertEqual(ca.kind_of("Approves Sewer District Request for Change Order No. 2"), "change-order")
        self.assertEqual(ca.kind_of("Authorizes Purchase of Massey Ferguson Tractor for Highway Department"), "purchase")
        self.assertEqual(ca.kind_of("Ratifies Authorization for the Town Attorney to Execute a Retainer Agreement with Siegel & Sitler, PLLC"), "services")

    def test_no_one_chosen_or_money_coming_in(self):
        for title in [
            "Authorizes the Town Clerk to Publish and Post Notice to Bidders for Charter Buses",
            "Rejects Bid for Charter Buses",
            "Authorizes The Supervisor To Execute A License Agreement With Celtic Quest Inc. 2026",
            "Authorizes the Supervisor to Execute an Intermunicipal Agreement with the Town of Brookhaven",
            "Authorizes Supervisor to Execute an Agreement with the County of Suffolk Office for the Aging",
            "Ratifies the Authorization for the Supervisor to Execute and Agreement with a Town Employee",
        ]:
            self.assertIsNone(ca.kind_of(title), title)


class VendorTest(unittest.TestCase):
    def test_items_and_contact_lines(self):
        got = ca.vendor_block(BID_AWARD)
        self.assertEqual([v["name"] for v in got], ["Bulk Chemical Company, Inc.", "George S. Coyne Chemical Co., Inc."])
        self.assertEqual(got[1]["role"], "Items #2, 3, 4, 5 & 7")
        self.assertNotIn("@", json.dumps(got))

    def test_contracts_across_a_page_break(self):
        got = ca.vendor_block(CONTRACTS)
        self.assertEqual([(v["name"], v["role"]) for v in got], [
            ("Eldor Contracting Corp.", "Contract E: Electrical Construction"),
            ("Philip Ross Industries Inc.", "Contract G: General Construction"),
        ])

    def test_purchase_names_the_dealer(self):
        self.assertEqual(ca.vendors("Authorizes Purchase of Kenworth Tandem Axle Dump Truck", PURCHASE, "purchase"), [{"name": "Gabrielli Truck Sales", "role": None}])

    def test_consultant_form(self):
        self.assertEqual(ca.vendors("Authorizes Supervisor to Execute Agreement with Seed Clam Administrator", CONSULTANT, "agreement")[0]["name"], "David Lessard")

    def test_title_counterparty(self):
        title = "Authorizes the Supervisor to Execute a Professional Services Agreement with P.W. Grosser Consulting Engineer & Hydrogeologist, D.P.C. for the Riverhead Water District"
        self.assertEqual(ca.vendors(title, "", "services")[0]["name"], "P.W. Grosser Consulting Engineer & Hydrogeologist, D.P.C.")

    def test_change_order_names_no_engineer(self):
        body = "WHEREAS, by Resolution #2025-637 the Supervisor executed a professional services agreement with H2M Architects and Engineers; and"
        self.assertEqual(ca.vendors("Approves Change Order No. 1", body, "change-order"), [])

    def test_capitals_set_in_ordinary_case(self):
        self.assertEqual(ca.clean_name("MY GUY AUTO SUPPLY – NAPA"), "My Guy Auto Supply – NAPA")
        self.assertEqual(ca.clean_name("DP ELECTRIC MOTOR SERVICE INC 493-7 JOHNSON AVE"), "DP Electric Motor Service Inc")
        self.assertEqual(ca.clean_name("TAN Productions, Inc."), "TAN Productions, Inc.")


class AmountTest(unittest.TestCase):
    def test_resolved_clause_wins_over_a_recital(self):
        got = ca.amount_of(CAPPED)
        self.assertEqual((got["amount"], got["basis"]), (5000.0, "cap"))
        self.assertTrue(got["quote"].startswith("RESOLVED"))

    def test_attached_pricing_stays_blank(self):
        self.assertEqual(ca.amount_of(BID_AWARD), {"amount": None, "basis": "attached", "quote": None})

    def test_stated(self):
        self.assertEqual(ca.amount_of(PURCHASE)["amount"], 399625.0)


class EntryTest(unittest.TestCase):
    def test_license_is_left_out(self):
        text = "TB Resolution 2026-455\n\nAUTHORIZES SUPERVISOR TO EXECUTE AN AGREEMENT WITH 3 LITTLE SCOOPS, INC.\n\nCouncilwoman Waski offered the following resolution,\n" + LICENSE
        self.assertEqual(ca.entries("2026-06-02", text, None), [])


class OutputTest(unittest.TestCase):
    """The committed output."""

    def test_committed(self):
        out = json.loads(ca.OUT.read_text())
        self.assertNotIn("preview", out, "contract-awards.json was built from cached packet text")
        self.assertTrue(out["awards"])
        for a in out["awards"]:
            self.assertIn(a["kind"], ca.KIND_LABEL)
            self.assertNotRegex(json.dumps(a), r"\S+@\S+\.\w+", a["resolution"])
            if a["amount"]:
                self.assertTrue(a["quote"], a["resolution"])
            self.assertTrue(a["sourceUrl"], a["resolution"])


if __name__ == "__main__":
    unittest.main()
