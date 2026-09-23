#!/usr/bin/env python3
"""Has the Town posted a budget document this site has not parsed yet?

Discovery reads one page, the Town's Financial Reports index, and every run of
parse_all_pdfs.py downloads and parses everything linked from it. That takes
minutes and runs a few times a day. This asks the cheap question in between:
it fetches the same index page with the same discover(), compares its budget
links with the documents already in index.json, and reports any it has not
seen. It downloads nothing and parses nothing. When it finds one, the workflow
that runs it (.github/workflows/watch-budget-release.yml) starts a deploy,
which parses and publishes the document with the same code as every other run.

Documents are compared by their DocumentCenter file number, not their URL. The
Town links some files twice under two names -- the 2026 Preliminary Budget is
View/2835 as both "2026-Preliminary-Budget" and "2026-Preliminary-Budget-PDF"
-- and index.json keeps one of them, so comparing URLs would report the other
as new on every run.

Output: "new=true|false" and a count, written to $GITHUB_OUTPUT when set.
Exit status is 0 either way; an unreachable Town site reports nothing new.
"""

from __future__ import annotations

import json
import os
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from parse_all_pdfs import OUT, discover  # noqa: E402  one discovery, not two

BUDGET = {"tentative_budget", "preliminary_budget", "adopted_budget", "budget_supplement", "budget_changes"}
FILE_NUMBER = re.compile(r"/DocumentCenter/View/(\d+)", re.I)


def key(url: str) -> str:
    m = FILE_NUMBER.search(url or "")
    return m.group(1) if m else (url or "").split("?")[0].lower()


def known_keys() -> set[str]:
    path = OUT / "index.json"
    if not path.exists():
        return set()
    index = json.loads(path.read_text(encoding="utf-8"))
    # A document that failed to parse is already known: re-reporting it would
    # start a deploy on every run that can only fail the same way.
    rows = index.get("documents", []) + index.get("failures", [])
    return {key(r.get("url", "")) for r in rows if r.get("url")}


def main() -> int:
    known = known_keys()
    new = [l for l in discover() if l.category in BUDGET and key(l.url) not in known]
    for l in new:
        print(f"new budget document: {l.title} ({l.category}, {l.year}) {l.url}")
    if not new:
        print(f"no new budget documents ({len(known)} known)")
    out = os.environ.get("GITHUB_OUTPUT")
    if out:
        with open(out, "a", encoding="utf-8") as fh:
            fh.write(f"new={'true' if new else 'false'}\ncount={len(new)}\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
