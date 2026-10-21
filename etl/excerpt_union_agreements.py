#!/usr/bin/env python3
"""Keep the text of union agreements whose minutes give only a title.

Condensed minutes list "Ratifies the Authorization for the Supervisor to Execute
Stipulation with the CSEA ..." and nothing more. The meeting's CivicClerk agenda
packet has the resolution, and usually the agreement itself attached as a
scanned image. For each union agreement build_personnel_actions.py lists without
text, this downloads that meeting's agenda packet, keeps the resolution as
printed, OCRs the image-only pages attached to it, and records the packet's file
id and checksum in etl/data/meetings/union-agreement-excerpts.json. The packet
PDFs themselves are not kept.

It is run by hand, as the workflow runners have no Tesseract:

    python3 etl/excerpt_union_agreements.py /path/to/an/empty/download/dir

then python3 etl/refresh_meeting_records.py --offline to rebuild.

OCR misreads characters. The page labels the attached text as machine-read.
"""

from __future__ import annotations

import hashlib
import io
import json
import re
import sys
from pathlib import Path

import pypdf

import build_personnel_actions as pa
from fetch_meetings import http_get, list_events, stream_url
from fetch_vote_packets import is_agenda_packet
from ocr_scanned_pdf import ocr

OUT = pa.EXCERPTS
PAGE_NOISE = re.compile(r"\s|Page \d+ of \d+|\d+/\d+/\d+ \S+\.")


def wanted() -> dict[str, set[str]]:
    data = json.loads(pa.OUT.read_text())
    have = json.loads(OUT.read_text()) if OUT.exists() else {}
    out: dict[str, set[str]] = {}
    for a in data.get("unionAgreements", []):
        if a["clauses"] or a["resolution"] in (have.get(a["meeting"]) or {}).get("resolutions", {}):
            continue
        out.setdefault(a["meeting"], set()).add(a["resolution"])
    return out


def main(argv: list[str]) -> int:
    if len(argv) != 2:
        print(__doc__)
        return 2
    downloads = Path(argv[1])
    downloads.mkdir(parents=True, exist_ok=True)
    todo = wanted()
    if not todo:
        print("every union agreement already has its text")
        return 0
    events = {(e.get("startDateTime") or "")[:10]: e for e in list_events()}
    out = json.loads(OUT.read_text()) if OUT.exists() else {}
    for date, numbers in sorted(todo.items()):
        packets = [f for f in (events.get(date) or {}).get("publishedFiles") or [] if is_agenda_packet(f)]
        if not packets:
            print(f"{date}: no agenda packet published; {sorted(numbers)} keep their titles only")
            continue
        fid = packets[-1]["fileId"]
        pdf = downloads / f"{date}-{fid}.pdf"
        if not pdf.exists():
            pdf.write_bytes(http_get(stream_url(fid)))
        raw = pdf.read_bytes()
        reader = pypdf.PdfReader(io.BytesIO(raw))
        pages = [(p.extract_text() or "") for p in reader.pages]
        entry = out.setdefault(date, {"resolutions": {}, "attachments": {}})
        entry.update({
            "fileId": fid,
            "url": stream_url(fid),
            "sha256": hashlib.sha256(raw).hexdigest(),
            "pages": len(pages),
        })
        for r in pa.resolutions("\n".join(pages)):
            if r["number"] in numbers and r["number"] not in entry["resolutions"]:
                entry["resolutions"][r["number"]] = f"TB Resolution {r['number']}\n{r['body'].strip()}\n"
        starts = [i for i, t in enumerate(pages) if re.search(r"TB Resolution\s+20\d\d-\d+", t)]
        for number in entry["resolutions"]:
            if number in entry.get("attachments", {}):
                continue
            mine = re.compile(rf"TB Resolution\s+{re.escape(number)}\b")
            first = next((i for i, t in enumerate(pages) if mine.search(t)), None)
            if first is None:
                continue
            end = next((s for s in starts if s > first and not mine.search(pages[s])), len(pages))
            blank = [i for i in range(first + 1, end) if len(PAGE_NOISE.sub("", pages[i])) < 20]
            text = "\n\n".join(t for t in (ocr(str(pdf), i, 0).strip() for i in blank) if t)
            entry.setdefault("attachments", {})[number] = {"pages": [i + 1 for i in blank], "ocr": text}
        print(f"{date}: packet {fid}, {len(pages)} pages; kept {sorted(entry['resolutions'])}")
    OUT.write_text(json.dumps(out, indent=1, ensure_ascii=False, sort_keys=True) + "\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
