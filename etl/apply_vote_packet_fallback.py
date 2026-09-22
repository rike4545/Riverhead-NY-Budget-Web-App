#!/usr/bin/env python3
"""Upgrade preliminary meetings from an official vote-bearing Agenda Packet.

Run after ``parse_meetings.py`` and before official-source reconciliation. The
normal minutes parser remains the primary source. This step only acts when that
parser produced a preliminary docket and ``fetch_vote_packets.py`` captured an
official CivicClerk packet containing complete per-resolution THE VOTE blocks.
"""

from __future__ import annotations

import json
from pathlib import Path

from parse_meetings import KNOWN_OFFICE, MEMBER_PARTY, build_member_records
from vote_packet_parser import parse_vote_packet

ROOT = Path(__file__).resolve().parent.parent
ETL = ROOT / "etl/data/meetings"
OUT = ROOT / "web/public/data/meetings"


def compute_stats_and_tallies(meeting: dict) -> None:
    resolutions = meeting.get("resolutions") or []
    unanimous = sum(1 for r in resolutions if r.get("tag") == "unanimous")
    contested = sum(
        1
        for r in resolutions
        if r.get("tag") in ("split", "failed") or (r.get("naysCount") or 0) > 0
    )
    failed = sum(1 for r in resolutions if r.get("tag") == "failed")
    tabled = sum(1 for r in resolutions if r.get("tag") == "tabled")
    tallies: dict[str, dict] = {}

    for member in meeting.get("roster") or []:
        last = member["last"]
        votes = [resolution.get("votes", {}).get(last) for resolution in resolutions]
        tallies[last] = {
            "name": member.get("name", last),
            "title": member.get("title", "Councilmember"),
            "aye": votes.count("aye"),
            "nay": votes.count("nay"),
            "abstain": votes.count("abstain"),
            "absent": votes.count("absent"),
            "moved": sum(
                1
                for resolution in resolutions
                if resolution.get("mover") and last in resolution.get("mover", "")
            ),
            "seconded": sum(
                1
                for resolution in resolutions
                if resolution.get("seconder") and last in resolution.get("seconder", "")
            ),
        }

    meeting["stats"] = {
        "total": len(resolutions),
        "unanimous": unanimous,
        "contested": contested,
        "failed": failed,
        "tabled": tabled,
    }
    meeting["memberTallies"] = tallies


def refresh_curated(meeting: dict) -> bool:
    """Re-apply the curated party and office to a meeting's roster and tallies.

    An upgraded meeting has its docket removed, so every later run skips it --
    which froze its roster at whatever the parser knew that day. A correction to
    MEMBER_PARTY or KNOWN_OFFICE then reached new meetings and never the old
    ones: July 21, 2026 still called the Supervisor a Democrat and a council
    member after both were fixed at the source.

    Touches only those two curated fields. A detected title is kept; only the
    "Councilmember" default gives way to a known office. Returns whether
    anything changed, so an unchanged file is not rewritten.
    """
    changed = False
    tallies = meeting.get("memberTallies") or {}
    for member in meeting.get("roster") or []:
        last = member.get("last")
        party = MEMBER_PARTY.get(last)
        office = KNOWN_OFFICE.get(last)
        rows = [member] + ([tallies[last]] if last in tallies else [])
        for row in rows:
            if party and "party" in row and row["party"] != party:
                row["party"] = party
                changed = True
            if office and row.get("title") in (None, "", "Councilmember") and row.get("title") != office:
                row["title"] = office
                changed = True
    return changed


def main() -> int:
    index_path = OUT / "index.json"
    if not index_path.exists():
        print("No meeting index found; run parse_meetings.py first.")
        return 0

    index = json.loads(index_path.read_text(encoding="utf-8"))
    entries = index.get("meetings") or []
    upgraded = 0

    for entry in entries:
        if not entry.get("preliminary"):
            continue
        slug = entry.get("slug")
        if not slug:
            continue
        meeting_path = OUT / f"{slug}.json"
        packet_path = ETL / f"{slug}-vote-packet.txt"
        if not meeting_path.exists() or not packet_path.exists():
            continue

        meeting = json.loads(meeting_path.read_text(encoding="utf-8"))
        docket = meeting.get("docket") or []
        if not docket:
            continue
        packet_text = packet_path.read_text(encoding="utf-8", errors="ignore")
        parsed = parse_vote_packet(packet_text, docket, MEMBER_PARTY)
        if not parsed.get("complete"):
            print(
                f"{slug}: packet vote fallback incomplete — "
                f"{parsed.get('mappedCount', 0)}/{parsed.get('expectedCount', len(docket))} "
                f"resolutions mapped from {parsed.get('voteBlockCount', 0)} vote blocks"
            )
            continue

        meeting["resolutions"] = parsed["resolutions"]
        meeting["roster"] = parsed["roster"]
        meeting.pop("preliminary", None)
        meeting.pop("docket", None)
        meeting["voteSource"] = "agenda-packet"
        compute_stats_and_tallies(meeting)
        meeting_path.write_text(json.dumps(meeting, indent=1), encoding="utf-8")

        entry.update({
            "total": meeting["stats"]["total"],
            "unanimous": meeting["stats"]["unanimous"],
            "contested": meeting["stats"]["contested"],
            "failed": meeting["stats"]["failed"],
            "tabled": meeting["stats"]["tabled"],
        })
        entry.pop("preliminary", None)
        entry.pop("docketCount", None)
        entry["voteSource"] = "agenda-packet"
        upgraded += 1
        print(
            f"{slug}: upgraded from official Agenda Packet — "
            f"{meeting['stats']['total']} resolution vote blocks parsed"
        )

    # Curated fields reach every meeting file, not only the ones upgraded this
    # run -- and not only indexed ones: a packet-sourced meeting can fall out of
    # the index while its file, and its votes, remain on disk.
    refreshed = 0
    for meeting_path in sorted(OUT.glob("20[0-9][0-9]-[0-9][0-9]-[0-9][0-9]*.json")):
        if meeting_path.stem.endswith(("-fiscal", "-packet")):
            continue
        meeting = json.loads(meeting_path.read_text(encoding="utf-8"))
        if not isinstance(meeting, dict) or "roster" not in meeting:
            continue
        if refresh_curated(meeting):
            meeting_path.write_text(json.dumps(meeting, indent=1), encoding="utf-8")
            refreshed += 1
    if refreshed:
        print(f"curated party/office refreshed on {refreshed} meeting(s)")

    index["totals"] = {
        "meetings": len(entries),
        "votes": sum(int(entry.get("total") or 0) for entry in entries),
        "contested": sum(int(entry.get("contested") or 0) for entry in entries),
        "failed": sum(int(entry.get("failed") or 0) for entry in entries),
        "tabled": sum(int(entry.get("tabled") or 0) for entry in entries),
    }
    entries.sort(key=lambda entry: entry.get("slug", ""), reverse=True)
    index_path.write_text(json.dumps(index, indent=1), encoding="utf-8")

    if upgraded or refreshed:
        build_member_records([entry for entry in entries if not entry.get("preliminary")])
    print(f"Vote-packet fallback: {upgraded} meeting(s) upgraded")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
