#!/usr/bin/env python3
"""Every ETL script that opens a PDF raises pypdf's parsing budget first.

pypdf 6.21 caps the tokens it will parse in one content stream. Scanned site
plans in the Town's agenda packets need more, and a script that opens a PDF
without etl/pdf_limits.py stops the run: on October 16, 2026,
fetch_vote_packets.py stopped etl/refresh_meeting_records.py on pages 16-19 of
the June 10, 2026 packet. These tests fail if a script opens PDFs without the
raised budget, or if the call stops raising it.
"""

import re
import unittest
from pathlib import Path

import pypdf

from pdf_limits import STREAM_PARSING_BUDGET, raise_town_document_limits

ETL = Path(__file__).resolve().parent
OPENS_A_PDF = re.compile(r"\bPdfReader\s*\(")


class PdfLimitsTests(unittest.TestCase):
    def test_every_pdf_reader_raises_the_budget(self):
        missing = [
            path.name
            for path in sorted(ETL.glob("*.py"))
            if not path.name.startswith("test_")
            and path.name != "pdf_limits.py"
            and OPENS_A_PDF.search(path.read_text(encoding="utf-8"))
            and "raise_town_document_limits()" not in path.read_text(encoding="utf-8")
        ]
        self.assertEqual(missing, [], f"these scripts open PDFs without raise_town_document_limits(): {missing}")

    def test_the_budget_is_raised_where_pypdf_has_one(self):
        get_configuration = getattr(pypdf, "get_configuration", None)
        if get_configuration is None or not hasattr(get_configuration(), "stream_parsing_work_maximum_count"):
            self.skipTest(f"pypdf {pypdf.__version__} has no per-stream parsing budget")
        default = type(get_configuration())().stream_parsing_work_maximum_count
        raise_town_document_limits()
        self.assertEqual(get_configuration().stream_parsing_work_maximum_count, STREAM_PARSING_BUDGET)
        self.assertGreater(STREAM_PARSING_BUDGET, default)


if __name__ == "__main__":
    unittest.main()
