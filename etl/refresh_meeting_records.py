#!/usr/bin/env python3
"""Refresh the Town Board meeting records: the one sequence every workflow runs.

The published meeting files in web/public/data/meetings are built from official
CivicClerk sources in a fixed order:

1. fetch_meetings.py              the Minutes (re-checking source hashes, so a
                                  Clerk correction flows back through)
2. fetch_vote_packets.py          the Agenda Packets, whose THE VOTE blocks carry
                                  the roll call that condensed Minutes omit
3. fetch_upcoming.py              the upcoming meeting schedule
4. parse_meetings.py              parse the Minutes; a meeting whose Minutes have
                                  no roll call comes out as a preliminary docket
5. apply_vote_packet_fallback.py  upgrade those dockets from the packet votes
6. reconcile_meeting_sources.py   reconcile against the official sources
7. parse_fiscal_impact.py         rebuild the Fiscal Impact companions, which
                                  depend on the current resolution titles

Stopping after step 4 publishes every packet-sourced meeting as a bare agenda.
In September 2026 the financial-reports workflow did exactly that twice a day,
removing 143 resolutions and their votes from four meetings until the meeting
sync put them back. Both workflows now run this script, so neither can run part
of the sequence, and etl/test_meeting_records.py fails if any workflow calls
these steps on its own.

--offline skips the three fetches and rebuilds from the sources already stored
in etl/data/meetings.
"""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

FETCH_STEPS = ("fetch_meetings.py", "fetch_vote_packets.py", "fetch_upcoming.py")
BUILD_STEPS = (
    "parse_meetings.py",
    "apply_vote_packet_fallback.py",
    "reconcile_meeting_sources.py",
    "parse_fiscal_impact.py",
)


def main(argv: list[str]) -> int:
    steps = (() if "--offline" in argv else FETCH_STEPS) + BUILD_STEPS
    for step in steps:
        print(f"== {step}", flush=True)
        result = subprocess.run([sys.executable, str(ROOT / "etl" / step)], cwd=ROOT)
        if result.returncode != 0:
            print(f"{step} exited with code {result.returncode}; stopping.", file=sys.stderr)
            return result.returncode
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
