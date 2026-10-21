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
