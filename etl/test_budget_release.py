#!/usr/bin/env python3
"""A new Tentative has to be found and read the day it is posted.

Nothing about a release is written in by hand: the watcher recognises the
document by its title, and the stage and request parsers read it. These check
the two ways that could fail -- a title worded differently from past years,
and a second file posted beside the budget under the same title words.
"""

import json
import tempfile
import unittest
from pathlib import Path

import parse_budget_requests
import parse_budget_stages
import parse_general_fund
from parse_all_pdfs import category

REPORTS = Path(__file__).resolve().parent.parent / "web/public/data/financial-reports"


class TitleTests(unittest.TestCase):
    def test_the_towns_own_titles(self):
        self.assertEqual(category("2027 Tentative Budget (PDF)"), "tentative_budget")
        self.assertEqual(category("2027 Preliminary Budget (PDF)"), "preliminary_budget")
        self.assertEqual(category("2027 Budget Supplement (PDF)"), "budget_supplement")

    def test_a_stage_worded_differently(self):
        for title in ("2027 Tentative Operating Budget", "Tentative Budget 2027", "2027 Budget - Tentative"):
            self.assertEqual(category(title), "tentative_budget", title)
        self.assertEqual(category("2027 Budget, Preliminary"), "preliminary_budget")

    def test_companions_are_not_the_budget(self):
        self.assertEqual(category("2027 Tentative Budget Supplement (PDF)"), "budget_supplement")
        self.assertEqual(category("2020 Proposed Changes to Preliminary Budget (PDF)"), "budget_changes")


class FirstReadableFileTests(unittest.TestCase):
    """Last year's Tentative and Supplement, relabelled 2027, each listed after a decoy."""

    FILES = (
        ("2027 Tentative Budget Message (PDF)", None),
        ("2027 Tentative Budget (PDF)", "2026 Tentative Budget (PDF)"),
        ("2027 Budget Supplement Cover Sheet (PDF)", None),
        ("2027 Budget Supplement (PDF)", "2026 Budget Supplement (PDF)"),
    )

    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        root = Path(self.tmp.name)
        (root / "documents").mkdir()
        real = {d["title"]: d for d in json.loads((REPORTS / "index.json").read_text(encoding="utf-8"))["documents"]}
        docs = []
        for i, (title, source) in enumerate(self.FILES):
            slug = f"2027-file-{i}"
            if source:
                body = (REPORTS / real[source]["json"]).read_text(encoding="utf-8")
            else:
                body = json.dumps({"pages": [{"text": "A letter from the Supervisor presenting the budget."}]})
            (root / "documents" / f"{slug}.json").write_text(body, encoding="utf-8")
            docs.append({"title": title, "year": 2027, "slug": slug, "json": f"documents/{slug}.json",
                         "url": f"https://example.invalid/{slug}", "sha256": slug})
        (root / "index.json").write_text(json.dumps({"documents": docs}), encoding="utf-8")

        self.saved = (parse_budget_stages.REPORTS, parse_budget_requests.REPORTS, parse_budget_requests.STAGES)
        parse_budget_stages.REPORTS = root
        parse_budget_requests.REPORTS = root
        parse_budget_requests.STAGES = root / "budget-stages.json"
        self.stages = parse_budget_stages.build()
        parse_budget_requests.STAGES.write_text(json.dumps(self.stages), encoding="utf-8")

    def tearDown(self):
        parse_budget_stages.REPORTS, parse_budget_requests.REPORTS, parse_budget_requests.STAGES = self.saved
        self.tmp.cleanup()

    def test_the_budget_is_read_not_the_letter(self):
        tentative = self.stages["years"]["2027"]["tentative"]
        self.assertEqual(tentative["source"]["title"], "2027 Tentative Budget (PDF)")
        self.assertEqual(tentative["totals"]["funds"], 19)

    def test_the_supplement_is_read_not_its_cover(self):
        year = parse_budget_requests.build()["byYear"]["2027"]
        self.assertEqual(year["source"]["title"], "2027 Budget Supplement (PDF)")
        self.assertTrue(year["reconciliation"]["complete"])



class TownWideTests(unittest.TestCase):
    """The Summary's own "Total Town Wide" rows, read as printed."""

    def read(self, slug):
        return parse_budget_stages.town_wide(REPORTS / "documents" / f"{slug}.json")

    def test_the_2027_tentative(self):
        self.assertEqual(self.read("2027-2027-tentative-budget-pdf"), {
            "appropriations": 81253214, "priorAppropriations": 77958942,
            "levy": 62882202, "priorLevy": 61178292,
            "rate": 73.224, "priorRate": 71.598,
            "fundRates": {
                "A01": {"rate": 63.347, "priorRate": 61.948},
                "DA1": {"rate": 8.894, "priorRate": 8.695},
                "SL1": {"rate": 0.983, "priorRate": 0.955},
            },
        })

    def test_a_book_that_prints_the_levy_first(self):
        tw = self.read("2005-2005-adopted-budget-pdf")
        self.assertEqual((tw["appropriations"], tw["levy"], tw["rate"]), (36125853, 26613843, 34.984))

    def test_they_are_the_general_fund_highway_and_street_lighting(self):
        index = json.loads((REPORTS / "index.json").read_text(encoding="utf-8"))["documents"]
        checked = 0
        for d in index:
            if category(d.get("title") or "") not in parse_budget_stages.STAGE_OF or (d.get("year") or 0) < 2019:
                continue
            path = REPORTS / d["json"]
            funds, tw = parse_budget_stages.summary(path), parse_budget_stages.town_wide(path)
            if not funds or not tw:
                continue
            three = [funds[c] for c in ("A01", "DA1", "SL1")]
            self.assertEqual(tw["appropriations"], sum(f["appropriations"] for f in three), d["title"])
            self.assertEqual(tw["levy"], sum(f["levy"] for f in three), d["title"])
            self.assertEqual(round(sum(r["rate"] for r in tw["fundRates"].values()), 3), tw["rate"], d["title"])
            checked += 1
        self.assertGreaterEqual(checked, 14)


class GeneralFundHistoryTests(unittest.TestCase):
    """A newly adopted budget joins the General Fund history with no edit, and a
    year where the spreadsheet and the Summary page disagree stops the build."""

    def run_with(self, years):
        with tempfile.TemporaryDirectory() as tmp:
            stages = Path(tmp) / "budget-stages.json"
            stages.write_text(json.dumps({"years": years}), encoding="utf-8")
            saved = parse_general_fund.STAGES
            parse_general_fund.STAGES = stages
            try:
                return parse_general_fund.adopted_from_stages(self.have)
            finally:
                parse_general_fund.STAGES = saved

    def setUp(self):
        self.have = {2025: {"year": 2025, "appropriations": 100, "estimatedRevenues": 10,
                            "appropriatedFundBalance": 5, "taxLevy": 85, "source": "csv", "status": "Adopted"}}

    @staticmethod
    def adopted(title, appropriations, revenues, fund_balance, levy):
        return {"adopted": {"source": {"title": title},
                            "funds": {"A01": {"appropriations": appropriations, "revenues": revenues,
                                              "fundBalance": fund_balance, "levy": levy}}}}

    def test_a_new_adopted_year_is_added(self):
        added, corrected = self.run_with({"2025": self.adopted("2025 Adopted", 100, 10, 5, 85),
                                          "2027": self.adopted("2027 Adopted Budget (PDF)", 120, 12, 3, 105)})
        self.assertEqual([r["year"] for r in added], [2027])
        self.assertEqual(added[0]["taxLevy"], 105)
        self.assertEqual(added[0]["source"], "2027 Adopted Budget (PDF)")
        self.assertEqual(corrected, [])

    def test_a_tentative_is_not_added(self):
        added, _ = self.run_with({"2027": {"tentative": self.adopted("x", 1, 1, 1, 1)["adopted"]}})
        self.assertEqual(added, [])

    def test_an_unexpected_disagreement_stops_the_build(self):
        with self.assertRaises(SystemExit):
            self.run_with({"2025": self.adopted("2025 Adopted", 999, 10, 5, 85)})


if __name__ == "__main__":
    unittest.main()
