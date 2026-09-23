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


if __name__ == "__main__":
    unittest.main()
