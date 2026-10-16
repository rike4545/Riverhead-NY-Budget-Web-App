"""pypdf's parsing budget, raised for the Town's own PDFs.

pypdf 6.21 added a budget on how many tokens it will parse in one content
stream: 2,000,000 by default, to protect against malformed or malicious files.
Some of the Town's agenda packets carry scanned site plans as inline images
that need more. Pages 16-19 of the June 10, 2026 packet stopped
etl/refresh_meeting_records.py at fetch_vote_packets.py with "Reached maximum
number of tokens per stream."

Every PDF this pipeline reads comes from the Town's CivicClerk portal or its
website, so the budget is raised for them, to ten times the default. That is
still a bound, and a file that exceeds it still fails loudly. Older pypdf has
no such budget, and the call does nothing there.

Each ETL script that opens a PDF calls raise_town_document_limits() once at
import; etl/test_pdf_limits.py fails if one does not.
"""

from __future__ import annotations

import pypdf

STREAM_PARSING_BUDGET = 20_000_000


def raise_town_document_limits() -> None:
    """Raise the per-stream parsing budget for this process, where pypdf has one."""
    overwrite = getattr(pypdf, "overwrite_configuration", None)
    current = getattr(pypdf, "get_configuration", None)
    if overwrite is None or current is None or not hasattr(current(), "stream_parsing_work_maximum_count"):
        return
    overwrite(stream_parsing_work_maximum_count=STREAM_PARSING_BUDGET)
