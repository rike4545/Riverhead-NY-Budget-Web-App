"""Tests for build_election_map.py: district codes, party lines and contest records."""

import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import build_election_map as m  # noqa: E402


def option(name, abbr, votes, write_in=False):
    return {"name": [{"languageId": "en", "text": name}], "party": {"abbreviation": abbr}, "voteCount": votes, "isWriteIn": write_in}


def row(precinct, total, options):
    return {"precinct": {"name": [{"languageId": "en", "text": precinct}], "mapFeatureId": "x", "reportingStatus": 2}, "voteTotal": total, "ballotOptions": options}


class DistrictCodes(unittest.TestCase):
    def test_results_names_both_years(self):
        self.assertEqual(m.district_code("Riverhead 007"), "007")
        self.assertEqual(m.district_code("Riverhead 7 "), "007")
        self.assertEqual(m.district_code("Riverhead 22"), "022")

    def test_gis_ids(self):
        self.assertEqual(m.district_code("9001"), "001")
        self.assertEqual(m.district_code("9022"), "022")

    def test_other_towns_are_skipped(self):
        self.assertIsNone(m.district_code("Southampton 041"))
        self.assertIsNone(m.district_code("6041"))


class PartyLines(unittest.TestCase):
    def test_prefix_removed_and_lines_combined(self):
        out = m.combine([option("DEM Jerome Halpin", "DEM", 382), option("TPF Jerome Halpin", "TPF", 7), option("REP Kenneth T Rothwell", "REP", 298)])
        self.assertEqual(out["Jerome Halpin"], {"votes": 389, "lines": {"DEM": 382, "TPF": 7}})
        self.assertEqual(out["Kenneth T Rothwell"]["votes"], 298)

    def test_write_ins_grouped(self):
        out = m.combine([option("Write-in", "", 2, True), option("Write-in", "", 1, True)])
        self.assertEqual(out["Write-in"], {"votes": 3, "lines": {"W/I": 3}})

    def test_main_party(self):
        self.assertEqual(m.main_party(["DEM", "TPF"]), "DEM")
        self.assertEqual(m.main_party(["REP", "CON"]), "REP")
        self.assertEqual(m.main_party(["VOP"]), "VOP")
        self.assertEqual(m.main_party(["REP", "DEM"]), "BOTH")


class ContestRecord(unittest.TestCase):
    def test_town_totals_are_the_districts_sum(self):
        item = {
            "name": [{"languageId": "en", "text": "Supervisor, Town of Riverhead"}],
            "voteFor": [{"languageId": "en", "text": "Vote for 1"}],
            "summaryResults": {"ballotOptions": [option("DEM A", "DEM", 0), option("REP B", "REP", 0), option("Write-in", "", 0, True)]},
            "breakdownResults": [
                row("Riverhead 001", 10, [option("DEM A", "DEM", 6), option("REP B", "REP", 4)]),
                row("Riverhead 002", 20, [option("DEM A", "DEM", 5), option("REP B", "REP", 14), option("Write-in", "", 1, True)]),
                row("Southampton 041", 99, [option("DEM A", "DEM", 50), option("REP B", "REP", 49)]),
            ],
        }
        rec = m.contest_record("k", item)
        self.assertEqual(sorted(rec["districts"]), ["001", "002"])
        self.assertEqual(rec["total"], 30)
        self.assertEqual([(c["name"], c["party"], c["votes"]) for c in rec["candidates"]], [("A", "DEM", 11), ("B", "REP", 18), ("Write-in", "", 1)])
        self.assertEqual(rec["voteFor"], 1)


FINAL_PAGE = """<p><a name="0"></a><a href="#1"><img src="x.gif">Supervisor, Town of Riverhead</a><a href="#2"><img src="x.gif">Assessor, Town of Riverhead</a></p>
<table><tr><td colspan="2"><h2><font face="Tahoma">(Elect 1)</font></h2></td></tr>
<tr><td>7,513 Votes cast out of 21,012</td><td>35.76%</td></tr></table>
<table><tr><th>Candidate</th><th>Party</th><th>Votes</th><th>Share</th></tr>
<tr><td rowspan="1">Walter, Sean M</td><td>Conservative</td><td>3,027</td><td>40.29%</td></tr>
<tr><td rowspan="3">Giglio, Jodi A</td><td>Republican</td><td>2,390</td><td>31.81%</td></tr>
<tr><td>Independence</td><td>217</td><td>2.89%</td></tr>
<tr><td>Total</td><td>2,607</td><td>34.70%</td></tr>
<tr><td>Coates, Anthony</td><td>Democratic</td><td>1,879</td><td>25.01%</td></tr></table>
<table><tr><td><h2>Assessor, Town of Riverhead (Elect 1)</h2></td></tr></table>"""


class FinalPages(unittest.TestCase):
    def test_titles_from_contents_and_lines_combined(self):
        contests = m.parse_final_page(FINAL_PAGE)
        self.assertEqual([c["title"] for c in contests], ["Supervisor, Town of Riverhead", "Assessor, Town of Riverhead"])
        sup = contests[0]
        self.assertEqual((sup["votesCast"], sup["registered"]), (7513, 21012))
        self.assertEqual([(c["name"], c["votes"]) for c in sup["candidates"]], [("Walter, Sean M", 3027), ("Giglio, Jodi A", 2607), ("Coates, Anthony", 1879)])
        self.assertEqual(sup["candidates"][1]["lines"], {"Republican": 2390, "Independence": 217})

    def test_lines_that_do_not_add_up_stop_the_run(self):
        bad = FINAL_PAGE.replace("<td>2,607</td>", "<td>2,600</td>")
        with self.assertRaises(m.SourceUnavailable):
            m.parse_final_page(bad)


if __name__ == "__main__":
    unittest.main()
