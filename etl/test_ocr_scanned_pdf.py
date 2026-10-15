"""Tests for etl/ocr_scanned_pdf.py's choice of page orientation.

These need neither PyMuPDF nor Tesseract: they check the rule that picks a
reading, on text like what Tesseract returns for an upright page and for the
same page read the wrong way up.
"""

import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from ocr_scanned_pdf import best_reading, vocabulary_hits  # noqa: E402

UPRIGHT_TABLE = """2027 ESTIMATED FUND BALANCES
A General Town Wide 61,558,409 154,642,944 154,642,944 - 61,558,409
DA Highway Town Wide 3,740,398 6,589,685 6,589,685 - 3,740,398
SUB-TOTAL MAJOR FUNDS 124,176,151 344,825,326 344,825,326 - 124,176,151"""

SIDEWAYS_GARBAGE = """Wpay iiitii eo Stsneasca go Gevaee
Ww a te = 5 ee, oO UE REE = wee : :
co fee ce bp f 8 eae k of Fis * cer i aie"""


class Orientation(unittest.TestCase):
    def test_budget_words_counted(self):
        self.assertGreater(vocabulary_hits(UPRIGHT_TABLE), 8)
        self.assertLess(vocabulary_hits(SIDEWAYS_GARBAGE), 3)

    def test_the_readable_turn_wins(self):
        # The sideways page reads as garbage upright and as the table once turned.
        self.assertEqual(best_reading({0: SIDEWAYS_GARBAGE, 90: UPRIGHT_TABLE, 270: SIDEWAYS_GARBAGE}), 90)

    def test_stray_letters_do_not_count(self):
        # Noise like this, from PDF p. 55 read sideways, once outscored the upright page.
        noise = "o a q a o a a a of of to to a o S53 a3 a2 oo- Seae R8a88 af em 8Ba2 oD f2 8S"
        self.assertEqual(vocabulary_hits(noise), 0)
        self.assertEqual(best_reading({0: UPRIGHT_TABLE, 90: noise, 270: ""}), 0)

    def test_upright_wins_a_tie(self):
        self.assertEqual(best_reading({0: UPRIGHT_TABLE, 90: UPRIGHT_TABLE, 270: ""}), 0)
        self.assertEqual(best_reading({0: "", 90: "", 270: ""}), 0)


if __name__ == "__main__":
    unittest.main()
