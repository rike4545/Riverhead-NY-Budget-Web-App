#!/usr/bin/env python3
"""Tests for build_personnel_actions.py: which resolutions count as personnel
actions, the sentence it quotes, and the roster match, which must come from
the file number alone."""

import csv
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import build_personnel_actions as pa  # noqa: E402

PACKET = """
TB Resolution 2026-962

POLICE DISCIPLINARY CHARGES

Councilman Rothwell offered the following resolution,
which was seconded by Councilman Kern

          WHEREAS, Chief of Police Edward J. Frost has filed disciplinary charges against
employee #GFZ000347.

THE VOTE

RESULT: Adopted
FISCAL IMPACT STATEMENT
B.     Title of Proposed Legislation: Police Disciplinary Charges
TB Resolution 2026-888

AUTHORIZES THE ATTENDANCE OF ONE POLICE DEPARTMENT EMPLOYEE TO ATTEND A
CONFERENCE

Councilwoman Merrifield offered the following resolution,

          RESOLVED, that the Town Board hereby authorizes employee #GFZ000152 to attend
TB Resolution 2026-827

RATIFIES THE AUTHORIZATION FOR THE SUPERVISOR TO EXECUTE AND AGREEMENT WITH A
TOWN EMPLOYEE

Councilman Kern offered the following resolution,

          WHEREAS, the Town Board has reviewed and considered the terms of an Agreement
concerning the retirement and separation of Town Employee GFZ000397 from Town
employment; and

THE VOTE

RESULT:

"""


class ParseTest(unittest.TestCase):
    def setUp(self):
        self.found = {r["number"]: r for r in pa.resolutions(PACKET)}

    def test_titles_stop_at_the_mover(self):
        self.assertEqual(self.found["2026-962"]["title"], "POLICE DISCIPLINARY CHARGES")
        self.assertEqual(self.found["2026-888"]["title"], "AUTHORIZES THE ATTENDANCE OF ONE POLICE DEPARTMENT EMPLOYEE TO ATTEND A CONFERENCE")

    def test_kinds(self):
        self.assertEqual(pa.kind_of(self.found["2026-962"]["title"]), "discipline")
        self.assertIsNone(pa.kind_of(self.found["2026-888"]["title"]))
        # The agreement's title does not say what it is; its clauses do.
        self.assertIsNone(pa.kind_of(self.found["2026-827"]["title"]))
        self.assertEqual(pa.kind_of(self.found["2026-827"]["body"].split("THE VOTE")[0]), "separation")

    def test_results(self):
        self.assertEqual(self.found["2026-962"]["result"], "Adopted")
        self.assertIsNone(self.found["2026-827"]["result"])

    def test_quote_is_the_resolutions_own_sentence(self):
        self.assertEqual(
            pa.quote(self.found["2026-962"]["body"], "000347"),
            "WHEREAS, Chief of Police Edward J. Frost has filed disciplinary charges against employee #GFZ000347",
        )


UNION_RESOLUTION = """
TB Resolution 2025-353

AUTHORIZES SUPERVISOR TO EXECUTE A STIPULATION WITH LOCAL 1000, AFSCME, AFL-CIO

Councilman Rothwell offered the following resolution,
which was seconded by Councilman Kern

          WHEREAS, Doris Strange has been an employee of the Town of Riverhead since
September 13, 1993 serving in the title of Account Clerk in the Recreation department; and
          NOW, THEREFORE, BE IT
          RESOLVED, that the Town Board approves the attached Stipulation; and be it further,
          RESOLVED, that all Town Hall Departments may review and obtain a copy of this resolution.

THE VOTE
AYES: Hubbard, Kenneth Rothwell, Kern
"""


class UnionTest(unittest.TestCase):
    def test_both_police_unions(self):
        title = "Ratifies Authorization For Supervisor To Execute An Agreement Between The Town Of Riverhead And The Riverhead Police Benevolent Association And Superior Officers Association"
        self.assertEqual(pa.union_of(title), "Police Benevolent Association and Superior Officers Association")
        self.assertEqual(pa.union_of("Stipulation with Local 1000, AFSCME"), "CSEA")

    def test_clauses_drop_fragments_and_filing_boilerplate(self):
        body = next(pa.resolutions(UNION_RESOLUTION))["body"]
        got = pa.clauses(body)
        self.assertEqual(len(got), 2)
        self.assertTrue(got[0].startswith("WHEREAS, Doris Strange has been an employee"))
        self.assertEqual(got[1], "RESOLVED, that the Town Board approves the attached Stipulation")

    def test_named_people_come_from_the_clauses_not_the_vote(self):
        body = next(pa.resolutions(UNION_RESOLUTION))["body"]
        jobs = {"Strange, Doris L": {}, "Rothwell, Kenneth T": {}}
        self.assertEqual(pa.named_people(" ".join(pa.clauses(body, limit=50, length=10_000)), jobs), ["Strange, Doris L"])


class AttachmentTest(unittest.TestCase):
    def test_skips_the_boilerplate_clauses(self):
        ocr = ("AGREEMENT dated July __, 2026 by and between the Town and the PBA. WHEREAS, the Town and the PBA are "
               "parties to a collective bargaining agreement; and WHEREAS, the Town Board is desirous of offering a "
               "program incentive for voluntary retirement; and WHEREAS, the PBA has considered the terms")
        self.assertEqual(pa.attachment_summary(ocr), "WHEREAS, the Town Board is desirous of offering a program incentive for voluntary retirement")

    def test_numbered_terms_when_there_is_no_whereas(self):
        self.assertEqual(pa.attachment_summary("In the Matter of CSEA 1. The Improper Practice Charge will be withdrawn. 2. Other"), "1. The Improper Practice Charge will be withdrawn.")


class OutputTest(unittest.TestCase):
    """The committed output, against the roster it was matched to."""

    def test_every_name_is_the_rosters_for_that_number(self):
        with open(pa.PAYROLL / "gfz-code-lookup.csv", newline="") as f:
            roster = {}
            for r in csv.DictReader(f):
                if r["File Number"].strip().isdigit():
                    roster.setdefault(r["File Number"].strip(), []).append(r["Payroll Name"].strip())
        out = pa.build()
        self.assertTrue(out["actions"], "no personnel actions found")
        for a in out["actions"]:
            self.assertIn(a["kind"], {k for k, _ in pa.KINDS})
            self.assertEqual([p["name"] for p in a["people"]], roster.get(a["fileNumber"], []), a["resolution"])
            source = (pa.ROOT / a["source"]).read_text(errors="replace")
            self.assertIn(a["fileNumber"], source)


if __name__ == "__main__":
    unittest.main()
