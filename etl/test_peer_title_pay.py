#!/usr/bin/env python3
"""Checks on web/public/data/salary/peer-title-pay.json (etl/build_peer_title_pay.py)."""
import json
import re
import statistics
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DOC = json.loads((ROOT / "web/public/data/salary/peer-title-pay.json").read_text())
POINTS = ("start", "mid", "current")


def row(title):
    return next(r for r in DOC["titles"] if r["title"] == title)


class PeerTitlePayTest(unittest.TestCase):
    def test_every_title_has_riverhead_and_a_neighbour(self):
        self.assertGreater(len(DOC["titles"]), 20)
        for r in DOC["titles"]:
            self.assertIn("Riverhead", r["towns"], r["title"])
            self.assertIn("current", r["towns"]["Riverhead"], r["title"])
            self.assertGreaterEqual(len(r["towns"]), 2, r["title"])

    def test_stats_are_consistent(self):
        for r in DOC["titles"]:
            for town, pts in r["towns"].items():
                for p in POINTS:
                    if p in pts:
                        s = pts[p]
                        self.assertLessEqual(s["low"], s["median"], (r["title"], town, p))
                        self.assertLessEqual(s["median"], s["high"], (r["title"], town, p))
                        self.assertGreaterEqual(s["count"], 1)

    def test_real_change_uses_ny_cpi(self):
        cpi = DOC["cpi"]
        for r in DOC["titles"]:
            for town, pts in r["towns"].items():
                if "realChangePct" not in pts:
                    continue
                s, c = pts["start"], pts["current"]
                factor = cpi[str(c["year"])]["value"] / cpi[str(s["year"])]["value"]
                self.assertAlmostEqual(pts["realChangePct"], (c["median"] / (s["median"] * factor) - 1) * 100, delta=0.01)

    def test_quoted_figures(self):
        # Southampton 2026 Salary Charts: "Town Council (4) *  $ 84,451"; "Town Justices (4) *  $ 94,038".
        self.assertEqual(row("Town Board member")["towns"]["Southampton"]["current"]["median"], 84_451)
        self.assertEqual(row("Town Justice")["towns"]["Southampton"]["current"]["count"], 4)
        # Southold: 2021 Preliminary "Members of the Town Board (4) @ $ 37,598"; 2024 Adopted "$ 43,500";
        # 2026 organizational meeting "Councilwoman Jill Doherty 44,370.00".
        sd = row("Town Board member")["towns"]["Southold"]
        self.assertEqual((sd["start"]["year"], sd["start"]["median"]), (2021, 37_598))
        self.assertEqual(sd["mid"]["median"], 43_500)
        self.assertEqual(sd["current"]["median"], 44_370)
        # Southold's 2026 mainland justices, not the Fishers Island justice.
        self.assertEqual(row("Town Justice")["towns"]["Southold"]["current"]["low"], 88_434)

    def test_riverhead_matches_its_salary_resolutions(self):
        recs = json.loads((ROOT / "web/public/data/salary/authorized-2026.json").read_text())["records"]
        pay = [r["annual"] for r in recs if r.get("title") == "Public Safety Dispatcher I" and not r.get("isStipend")]
        self.assertEqual(row("Public Safety Dispatcher I")["towns"]["Riverhead"]["current"]["median"],
                         round(statistics.median(pay), 2))

    def test_no_vacant_positions(self):
        text = (ROOT / "etl/data/salary/peers/southampton-2026-salary-charts-adopted.txt").read_text()
        vacant = [float(m.replace(",", "")) for m in re.findall(r"Public Safety Dispatcher I-VACANT\s+\$[\d,.]+\s+\$([\d,.]+)", text)]
        self.assertTrue(vacant)
        disp = row("Public Safety Dispatcher I")["towns"]["Southampton"]["current"]
        self.assertEqual(disp["count"], 19)

    def test_abbreviated_titles_are_counted(self):
        # authorized-2022.json lists 17 Highway "Automotive Equip Operator" rows beside two
        # spelled in full; all are the same title.
        recs = json.loads((ROOT / "web/public/data/salary/authorized-2022.json").read_text())["records"]
        n = sum(r.get("title", "").startswith("Automotive Equip") and r.get("annual", 0) >= 20_000 for r in recs)
        self.assertEqual(row("Automotive Equipment Operator")["towns"]["Riverhead"]["start"]["count"], n)
        self.assertGreater(n, 2)

    def test_comparisons_only_at_the_same_year(self):
        for r in DOC["titles"]:
            riv = r["towns"]["Riverhead"]
            for town, cmp in r["riverheadVsPct"].items():
                for p, pct in cmp.items():
                    self.assertEqual(riv[p]["year"], r["towns"][town][p]["year"])
                    self.assertAlmostEqual(pct, (riv[p]["median"] / r["towns"][town][p]["median"] - 1) * 100, delta=0.01)


if __name__ == "__main__":
    unittest.main()
