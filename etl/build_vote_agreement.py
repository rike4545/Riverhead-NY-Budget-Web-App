"""How Town Board members voted when they did not all agree, for /board-votes/.

Reads the voting record parse_meetings.py writes (web/public/data/meetings/
<date>.json) for every meeting from FROM_DATE on: the years the site holds
every meeting. Earlier years have one meeting each, too few to compare.

A resolution is contested when the members present did not all cast the same
vote: someone voted no or abstained while others voted yes. A unanimous
rejection is not contested. Absences are not disagreement and are counted apart. For each pair
of members who served together, the file counts the contested resolutions both
voted on and how many times they cast the same vote. It also lists every
contested resolution with each member's vote.

Writes web/public/data/vote-agreement.json. It reads only the site's own files,
so it runs in the meeting pipeline after the voting record is rebuilt.
"""

from __future__ import annotations

import json
from collections import defaultdict
from itertools import combinations
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MEETINGS = ROOT / "web/public/data/meetings"
OUT = ROOT / "web/public/data/vote-agreement.json"
FROM_DATE = "2025-01-01"
CAST = {"aye", "nay", "abstain"}


def contested(votes: dict[str, str]) -> bool:
    """The members present did not all cast the same vote. A 5-0 rejection is not contested."""
    return len({v for v in votes.values() if v in CAST}) > 1


def main() -> int:
    files = sorted(p for p in MEETINGS.glob("20??-??-??.json") if p.stem >= FROM_DATE)
    names: dict[str, str] = {}
    served: dict[str, list[str]] = defaultdict(list)
    tally: dict[str, dict[str, int]] = defaultdict(lambda: {"aye": 0, "nay": 0, "abstain": 0, "absent": 0})
    pairs: dict[tuple[str, str], list[int]] = defaultdict(lambda: [0, 0])  # [both voted, same vote]
    rows = []
    total = 0
    for f in files:
        m = json.loads(f.read_text(encoding="utf-8"))
        for person in m.get("roster", []):
            names[person["last"]] = person["name"]
            served[person["last"]].append(f.stem)
        for r in m.get("resolutions", []):
            votes = r.get("votes") or {}
            if not votes:
                continue
            total += 1
            for who, v in votes.items():
                if v in tally[who]:
                    tally[who][v] += 1
            if not contested(votes):
                continue
            rows.append({"date": f.stem, "number": r.get("number"), "title": r.get("title"), "result": r.get("result"), "adopted": r.get("adopted"), "votes": votes})
            for a, b in combinations(sorted(votes), 2):
                if votes[a] in CAST and votes[b] in CAST:
                    pairs[(a, b)][0] += 1
                    pairs[(a, b)][1] += votes[a] == votes[b]
    members = sorted(names, key=lambda k: (min(served[k]), k))
    out = {
        "from": files[0].stem if files else None,
        "to": files[-1].stem if files else None,
        "meetings": len(files),
        "resolutions": total,
        "members": [{"last": k, "name": names[k], "first": min(served[k]), "last_meeting": max(served[k]), "votes": tally[k]} for k in members],
        "pairs": [{"a": a, "b": b, "both": n, "same": same} for (a, b), (n, same) in sorted(pairs.items())],
        "contested": rows,
    }
    OUT.write_text(json.dumps(out, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"  vote agreement: {len(rows)} contested of {total} resolutions at {len(files)} meetings")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
