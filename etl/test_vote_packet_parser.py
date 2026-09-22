#!/usr/bin/env python3

import unittest

from vote_packet_parser import parse_vote_packet


class VotePacketParserTests(unittest.TestCase):
    def test_complete_the_vote_blocks_upgrade_docket(self):
        docket = [
            {"seq": 1, "number": "2026-765", "title": "Budget Transfer for 2026 Legal Fees"},
            {"seq": 2, "number": "2026-766", "title": "Highway Department Budget Transfer"},
        ]
        packet = """
2026-765 Budget Transfer for 2026 Legal Fees
NOW, THEREFORE, BE IT RESOLVED, that the transfer is authorized.

THE VOTE
RESULT: Adopted [UNANIMOUS]
MOVER: Kenneth Rothwell, Councilman
SECONDER: Joann Waski, Councilwoman
AYES: Halpin, Rothwell, Kern, Merrifield, Waski
NAYS: None

FISCAL IMPACT STATEMENT
OF PROPOSED RIVERHEAD TOWN BOARD LEGISLATION

2026-766 Highway Department Budget Transfer
NOW, THEREFORE, BE IT RESOLVED, that the transfer is authorized.

THE VOTE
RESULT: ADOPTED [4 - 1]
MOVER: Denise Merrifield, Councilwoman
SECONDER: Kenneth Rothwell, Councilman
AYES: Halpin, Rothwell, Merrifield, Waski
NAYS: Kern

FISCAL IMPACT STATEMENT
"""
        parsed = parse_vote_packet(packet, docket, {"Halpin": "Democrat", "Kern": "Republican"})

        self.assertTrue(parsed["complete"])
        self.assertEqual(parsed["voteBlockCount"], 2)
        self.assertEqual(len(parsed["resolutions"]), 2)

        first, second = parsed["resolutions"]
        self.assertEqual(first["number"], "2026-765")
        self.assertTrue(first["adopted"])
        self.assertEqual(first["tag"], "unanimous")
        self.assertEqual(first["mover"], "Kenneth Rothwell")
        self.assertEqual(first["seconder"], "Joann Waski")
        self.assertEqual(first["votes"]["Kern"], "aye")

        self.assertEqual(second["number"], "2026-766")
        self.assertTrue(second["adopted"])
        self.assertEqual(second["tag"], "split")
        self.assertEqual(second["ayesCount"], 4)
        self.assertEqual(second["naysCount"], 1)
        self.assertEqual(second["votes"]["Kern"], "nay")

    def test_partial_packet_is_not_promoted(self):
        docket = [
            {"seq": 1, "number": "2026-765", "title": "One"},
            {"seq": 2, "number": "2026-766", "title": "Two"},
        ]
        packet = """
2026-765 One
THE VOTE
RESULT: ADOPTED [UNANIMOUS]
MOVER: Kenneth Rothwell, Councilman
SECONDER: Joann Waski, Councilwoman
AYES: Halpin, Rothwell, Kern, Merrifield, Waski
NAYS: None
"""
        parsed = parse_vote_packet(packet, docket)
        self.assertFalse(parsed["complete"])
        self.assertEqual(parsed["voteBlockCount"], 1)
        self.assertEqual(parsed["resolutions"], [])


    def test_blank_vote_block_is_not_promoted(self):
        # The July 24, 2025 packet: the Clerk's THE VOTE template was never
        # filled in. parse_result reads the bare "APPROVE:" as a failure, so
        # promoting this would publish a defeat that no vote produced.
        docket = [{"seq": 1, "number": "2025-643", "title": "Authorizes Funding Application (CFA) - Pro Housing"}]
        packet = """
2025-643 Authorizes Funding Application to New York State
THE VOTE
RESULT: APPROVE:
MOVER: Councilman Kenneth Rothwell
SECONDER: Councilman Robert Kern
AYES: None
NAYS: None
"""
        parsed = parse_vote_packet(packet, docket, {"Rothwell": "Republican", "Kern": "Republican"})
        self.assertFalse(parsed["complete"])
        self.assertEqual(parsed["unrecordedCount"], 1)
        self.assertEqual(parsed["resolutions"], [])

    def test_explicit_unanimous_without_names_is_still_recorded(self):
        # The guard above must not over-reach: a result that states its own
        # outcome is a recorded vote even when no AYES are printed.
        docket = [{"seq": 1, "number": "2026-900", "title": "Routine Item"}]
        packet = """
2026-900 Routine Item
THE VOTE
RESULT: ADOPTED [UNANIMOUS]
MOVER: Councilman Kenneth Rothwell
SECONDER: Councilman Robert Kern
AYES: None
NAYS: None
"""
        parsed = parse_vote_packet(packet, docket, {"Rothwell": "Republican", "Kern": "Republican"})
        self.assertTrue(parsed["complete"])
        self.assertEqual(parsed["unrecordedCount"], 0)
        self.assertEqual(parsed["resolutions"][0]["tag"], "unanimous")

if __name__ == "__main__":
    unittest.main()
