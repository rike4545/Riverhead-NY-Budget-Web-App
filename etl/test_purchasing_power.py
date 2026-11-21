#!/usr/bin/env python3
"""Checks on web/public/data/payroll/purchasing-power.json (etl/build_purchasing_power.py)."""
import json
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DOC = json.loads((ROOT / "web/public/data/payroll/purchasing-power.json").read_text())


class PurchasingPowerTest(unittest.TestCase):
    def test_summary_adds_up(self):
        s = DOC["summary"]
        self.assertEqual(s["ahead"] + s["even"] + s["behind"], s["people"])
        compared = [p for p in DOC["people"] if p["realChangePct"] is not None]
        self.assertEqual(len(compared), s["people"])

    def test_each_person_is_carried_forward_by_ny_cpi(self):
        ny = DOC["cpi"]["ny"]
        for p in DOC["people"]:
            factor = ny["2026"]["value"] / ny[str(p["firstYear"])]["value"]
            self.assertAlmostEqual(p["firstInTodayDollars"], p["firstSalary"] * factor, delta=0.02, msg=p["name"])
            if p["realChangePct"] is not None:
                expect = (p["salary"] / (p["firstSalary"] * factor) - 1) * 100
                self.assertAlmostEqual(p["realChangePct"], expect, delta=0.01, msg=p["name"])
                band = DOC["evenBandPct"]
                want = "ahead" if expect > band else "behind" if expect < -band else "even"
                self.assertEqual(p["status"], want, msg=p["name"])
            self.assertEqual(p["series"][-1]["year"], 2026)
            self.assertEqual(p["series"][-1]["salary"], p["salary"])

    def test_no_stipends_or_board_members(self):
        for p in DOC["people"]:
            self.assertGreaterEqual(p["salary"], 20_000, msg=p["name"])
            self.assertNotEqual(p["group"], "Boards")

    def test_wage_floor_is_the_published_minimum(self):
        w = DOC["wageFloor"]
        self.assertEqual(w["hourly"], 17.00)
        self.assertAlmostEqual(w["annualAt40Hours"], 17.00 * 40 * 52)
        self.assertEqual(w["belowAt40Hours"], sum(p["salary"] < w["annualAt40Hours"] for p in DOC["people"]))


if __name__ == "__main__":
    unittest.main()
