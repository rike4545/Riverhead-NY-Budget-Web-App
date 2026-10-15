"""Read a scanned PDF that has no text layer, page by page, with OCR.

The Town of Brookhaven's 2027 Tentative Operating Budget came to this site as
a scan: every page is an image. This renders each page with PyMuPDF and runs
Tesseract on it three ways (upright, and turned a quarter-turn each way, for
the tables printed sideways), keeping the reading with the most recognizable
words. It writes one JSON file with each page's text and turn, and the PDF's
checksum, so the text can always be traced to the file it came from.

It is run by hand; no workflow runs it, as the runners have no Tesseract:

    python3 etl/ocr_scanned_pdf.py etl/data/brookhaven/2027/brookhaven2027-compressed.pdf \\
        etl/data/brookhaven/2027/ocr-pages.json

OCR misreads characters, most of all in the sideways tables. The text is for
finding and checking words. The figures the site quotes are read from the page
images, and web/scripts/verify-brookhaven.mjs checks them by the tables' own
arithmetic.
"""

from __future__ import annotations

import hashlib
import json
import os
import re
import subprocess
import sys
import tempfile
from multiprocessing import Pool
from pathlib import Path

DPI = 300
PSM = "6"  # a single block of text: keeps a table's rows together
TURNS = (0, 90, 270)

# Words a budget page uses. A page read the wrong way up turns into letters
# that rarely spell any of them, so the turn with the most of them wins.
VOCABULARY = set("""
a all an and are as at be by for from has in is it its of on or our that the
this to was we will with town budget fund funds total district districts tax
taxes levy general highway sewer water ambulance fire park parks refuse garbage
recycling lighting erosion dock open space balance balances appropriated
unappropriated unreserved estimated adopted tentative revised actual expenditures
revenues revenue appropriations property employee employees benefits salaries
services service contractual equipment personal division department office
supervisor council clerk receiver assessor board schedule positions position
mission goals accomplishments transfers interfund debt interest principal capital
outside villages wide village summary rate application surplus non operating
""".split())


def vocabulary_hits(text: str) -> int:
    """How many of the text's words of three letters or more are budget words.

    Shorter ones are left out: a page read the wrong way up is full of stray
    letters, and "a", "of" and "to" turn up in the noise often enough to tip
    the count (the Finance department's first page, PDF p. 55, did).
    """
    return sum(word in VOCABULARY for word in re.findall(r"[a-z]{3,}", text.lower()))


def best_reading(readings: dict[int, str]) -> int:
    """The turn whose reading has the most budget words; upright wins a tie."""
    return max(sorted(readings), key=lambda turn: (vocabulary_hits(readings[turn]), turn == 0))


def ocr(pdf: str, index: int, turn: int) -> str:
    """One page's text, rendered at DPI and turned `turn` degrees first."""
    import pymupdf  # imported here so the tests run without it

    page = pymupdf.open(pdf)[index]
    matrix = pymupdf.Matrix(DPI / 72, DPI / 72)
    if turn:
        matrix = matrix.prerotate(turn)
    pixmap = page.get_pixmap(matrix=matrix, colorspace=pymupdf.csGRAY)
    with tempfile.TemporaryDirectory() as folder:
        image = os.path.join(folder, "page.png")
        pixmap.save(image)
        # One thread per Tesseract: four processes each starting OpenMP's full
        # pool run many times slower than four single-threaded ones.
        result = subprocess.run(
            ["tesseract", image, "stdout", "--psm", PSM, "-c", "preserve_interword_spaces=1"],
            capture_output=True, text=True, check=True, env={**os.environ, "OMP_THREAD_LIMIT": "1"},
        )
    return result.stdout


def read_page(job: tuple[str, int]) -> tuple[int, int, str]:
    pdf, index = job
    readings = {turn: ocr(pdf, index, turn) for turn in TURNS}
    turn = best_reading(readings)
    return index, turn, readings[turn]


def main(argv: list[str]) -> int:
    if len(argv) != 3:
        print(__doc__)
        return 2
    pdf, out = argv[1], Path(argv[2])
    import pymupdf

    pages = len(pymupdf.open(pdf))
    version = subprocess.run(["tesseract", "--version"], capture_output=True, text=True).stdout.split("\n")[0]
    found: dict[str, dict] = {}
    with Pool(4) as pool:
        for done, (index, turn, text) in enumerate(pool.imap_unordered(read_page, [(pdf, i) for i in range(pages)]), 1):
            found[str(index + 1)] = {"turn": turn, "text": text}
            if done % 25 == 0:
                print(f"{done}/{pages} pages", flush=True)
    record = {
        "source": {
            "file": pdf,
            "sha256": hashlib.sha256(Path(pdf).read_bytes()).hexdigest(),
            "pages": pages,
        },
        "method": {
            "renderer": f"PyMuPDF {pymupdf.__version__}, {DPI} dpi, grayscale",
            "ocr": f"{version}, --psm {PSM}, preserve_interword_spaces=1",
            "turns": "each page read upright and turned 90 and 270 degrees; the reading with the most budget words is kept",
        },
        "pages": {str(n): found[str(n)] for n in range(1, pages + 1)},
    }
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(record, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
    turned = sum(1 for p in found.values() if p["turn"])
    print(f"{pages} pages read, {turned} of them turned; wrote {out}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
