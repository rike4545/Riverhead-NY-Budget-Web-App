"""Tests for build_ida.py: an offline build from the kept State data reproduces
the committed web/public/data/ida.json, and a project's sums match its rows."""

import json
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import build_ida as b  # noqa: E402


class BuildIdaTest(unittest.TestCase):
    def test_offline_build_reproduces_committed_data(self):
        committed = b.OUT.read_text()
        with tempfile.TemporaryDirectory() as tmp:
            out = Path(tmp) / "ida.json"
            original = b.OUT
            b.OUT = out
            try:
                b.build()
            finally:
                b.OUT = original
            self.assertEqual(out.read_text(), committed)

    def test_project_sums_match_its_rows(self):
        rows = json.loads(b.RAW.read_text())["rows"]
        data = json.loads(b.OUT.read_text())
        for p in data["projects"]:
            mine = [r for r in rows if r["project_code"] == p["code"]]
            self.assertAlmostEqual(p["net"], sum(b.num(r, "net_exemptions") for r in mine), places=2)
            self.assertEqual(p["firstYear"], min(int(r["fiscal_year_end_date"][:4]) for r in mine))
            self.assertEqual(p["lastYear"], max(int(r["fiscal_year_end_date"][:4]) for r in mine))

    def test_num_reads_blanks_as_zero(self):
        self.assertEqual(b.num({"x": ""}, "x"), 0.0)
        self.assertEqual(b.num({}, "x"), 0.0)
        self.assertEqual(b.num({"x": "12.50"}, "x"), 12.5)


if __name__ == "__main__":
    unittest.main()
