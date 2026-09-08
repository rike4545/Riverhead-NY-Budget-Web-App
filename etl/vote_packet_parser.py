#!/usr/bin/env python3
"""Parse CivicClerk per-resolution ``THE VOTE`` blocks from an Agenda Packet.

The fallback is deliberately conservative. It only creates a meeting vote record
when every docketed resolution can be paired, in order or by explicit resolution
number, with an official vote block containing ``RESULT:``. A partial packet is
reported but is not promoted to a complete meeting record.
"""

from __future__ import annotations

import re
from collections import Counter, OrderedDict

VOTE_HEADER = re.compile(r"^\s*THE\s+VOTE\s*$", re.I | re.M)
FIELD_RE = re.compile(
    r"^\s*(RESULT|MOVER|SECONDER|AYES|NAYS|ABSTAIN|ABSTAINED|ABSENT|RECUSED)\s*:\s*(.*)$",
    re.I | re.M,
)
RESOLUTION_NUMBER = re.compile(r"\b(20\d{2}-\d{1,4})\b")
TITLE_MENTION = re.compile(
    r"\b(Supervisor|Councilman|Councilwoman|Council member)\s+"
    r"([A-Z][a-z'’-]+(?:\s+[A-Z][a-z'’-]+)?)"
)

NON_NAMES = {
    "None", "All", "N/A", "Na", "Nay", "Aye", "Councilman", "Councilwoman",
    "Councilmember", "Supervisor",
}


def clean(value: str) -> str:
    return re.sub(r"\s+", " ", value or "").strip()


def clean_person(name: str) -> str:
    value = clean(name)
    value = re.sub(
        r"\b(Supervisor|Councilman|Councilwoman|Council member|Councilmember)\b",
        "",
        value,
        flags=re.I,
    )
    value = re.sub(r"\s*,\s*$", "", value)
    value = re.sub(r"\s*,\s*(?:Councilman|Councilwoman|Councilmember|Supervisor)\b.*$", "", value, flags=re.I)
    return clean(value.strip(" ,;"))


def parse_result(text: str) -> tuple[bool, int | None, int | None, str]:
    up = text.upper()
    count = re.search(r"\[(\d+)\s*(?:TO|-|–)\s*(\d+)\]", up)
    ayes = int(count.group(1)) if count else None
    nays = int(count.group(2)) if count else None
    if "UNANIMOUS" in up:
        nays = 0
    if any(word in up for word in ("TABLED", "WITHDRAWN", "POSTPON")):
        return False, ayes, nays, "tabled"
    if any(word in up for word in ("NOT ADOPTED", "DEFEATED", "FAILED")):
        return False, ayes, nays, "failed"
    if "ADOPTED" in up:
        adopted = True
    elif ayes is not None and nays is not None:
        adopted = ayes > nays
    else:
        adopted = "UNANIMOUS" in up
    tag = "unanimous" if "UNANIMOUS" in up else ("split" if adopted else "failed")
    return adopted, ayes, nays, tag


def name_tokens(value: str) -> list[str]:
    # CivicClerk commonly emits either full names or a comma-separated list of
    # surnames. Semicolons are accepted too. Role-only tokens are discarded.
    out: list[str] = []
    for part in re.split(r"[,;]", value or ""):
        person = clean_person(part)
        if not person or person in NON_NAMES or person.lower() in {"none", "n/a"}:
            continue
        words = person.split()
        if 1 <= len(words) <= 4 and all(word[:1].isupper() for word in words if word):
            out.append(person)
    return out


def members_in(value: str, roster: OrderedDict[str, dict]) -> list[str]:
    found = []
    for last in roster:
        if re.search(rf"\b{re.escape(last)}\b", value or "", re.I):
            found.append(last)
    return found


def build_roster(raw: str, fields_list: list[dict], member_party: dict[str, str] | None = None) -> OrderedDict[str, dict]:
    counts: Counter[str] = Counter()
    full_by_last: dict[str, str] = {}
    titles: dict[str, str] = {}
    order: list[str] = []

    for fields in fields_list:
        for key in ("AYES", "NAYS", "ABSTAIN", "ABSTAINED", "ABSENT", "RECUSED"):
            for token in name_tokens(fields.get(key, "")):
                last = token.split()[-1]
                counts[last] += 1
                if len(token.split()) >= 2:
                    full_by_last.setdefault(last, token)
                if last not in order:
                    order.append(last)
        for key in ("MOVER", "SECONDER"):
            raw_name = fields.get(key, "")
            person = clean_person(raw_name)
            if person:
                last = person.split()[-1]
                full_by_last.setdefault(last, person)
                counts[last] += 1
                if last not in order:
                    order.append(last)
                lower = raw_name.lower()
                if "supervisor" in lower:
                    titles[last] = "Supervisor"
                elif "councilwoman" in lower:
                    titles[last] = "Councilwoman"
                elif "council" in lower:
                    titles[last] = "Councilman"

    for match in TITLE_MENTION.finditer(raw):
        title, who = match.group(1), match.group(2)
        last = who.split()[-1]
        full_by_last.setdefault(last, who)
        titles.setdefault(
            last,
            "Supervisor" if title == "Supervisor" else ("Councilwoman" if title == "Councilwoman" else "Councilman"),
        )

    if not counts:
        return OrderedDict()
    threshold = max(2, int(len(fields_list) * 0.2))
    lasts = [last for last in order if counts[last] >= threshold]
    lasts.sort(key=lambda last: (titles.get(last) != "Supervisor", order.index(last)))

    roster: OrderedDict[str, dict] = OrderedDict()
    for last in lasts:
        roster[last] = {
            "name": full_by_last.get(last, last),
            "title": titles.get(last, "Councilmember"),
            "party": (member_party or {}).get(last),
        }
    return roster


def extract_fields(block: str) -> dict[str, str]:
    fields: dict[str, str] = {}
    for match in FIELD_RE.finditer(block):
        key = match.group(1).upper()
        if key not in fields:
            fields[key] = clean(match.group(2))
    return fields


def nearest_docket_number(context: str, known: set[str]) -> str | None:
    matches = [match.group(1) for match in RESOLUTION_NUMBER.finditer(context) if match.group(1) in known]
    return matches[-1] if matches else None


def parse_vote_packet(
    raw: str,
    docket: list[dict],
    member_party: dict[str, str] | None = None,
) -> dict:
    headers = list(VOTE_HEADER.finditer(raw))
    parsed: list[dict] = []
    for idx, header in enumerate(headers):
        next_start = headers[idx + 1].start() if idx + 1 < len(headers) else len(raw)
        # Vote metadata sits immediately after THE VOTE. Cap the scan so fields
        # from a later resolution cannot bleed into this block on malformed PDFs.
        block = raw[header.end(): min(next_start, header.end() + 3500)]
        fields = extract_fields(block)
        if "RESULT" not in fields:
            continue
        context_start = headers[idx - 1].end() if idx else max(0, header.start() - 20_000)
        context = raw[context_start:header.start()]
        parsed.append({
            "fields": fields,
            "explicitNumber": nearest_docket_number(context, {item.get("number") for item in docket if item.get("number")}),
        })

    if not parsed or not docket:
        return {"resolutions": [], "roster": [], "complete": False, "voteBlockCount": len(parsed)}

    docket_by_number = {item.get("number"): item for item in docket if item.get("number")}
    unused = [item for item in sorted(docket, key=lambda item: item.get("seq", 0))]
    assigned: list[tuple[dict, dict]] = []
    used_numbers: set[str] = set()

    if len(parsed) == len(docket):
        # This is the strongest packet invariant: one end-of-resolution vote
        # block for each docket item in the same published order.
        assigned = list(zip(sorted(docket, key=lambda item: item.get("seq", 0)), parsed))
    else:
        for vote in parsed:
            number = vote.get("explicitNumber")
            item = docket_by_number.get(number) if number and number not in used_numbers else None
            if item is None:
                item = next((candidate for candidate in unused if candidate.get("number") not in used_numbers), None)
            if item is None:
                continue
            assigned.append((item, vote))
            if item.get("number"):
                used_numbers.add(item["number"])

    fields_list = [vote["fields"] for _, vote in assigned]
    roster = build_roster(raw, fields_list, member_party)
    resolutions: list[dict] = []

    for item, vote in assigned:
        fields = vote["fields"]
        adopted, ayes, nays, tag = parse_result(fields["RESULT"])
        ayes_m = members_in(fields.get("AYES", ""), roster)
        nays_m = members_in(fields.get("NAYS", ""), roster)
        abstain_m = members_in(
            " ".join(fields.get(key, "") for key in ("ABSTAIN", "ABSTAINED", "RECUSED")),
            roster,
        )
        absent_m = members_in(fields.get("ABSENT", ""), roster)

        if tag == "split" and not nays_m and not abstain_m and not nays:
            tag = "unanimous"

        votes: dict[str, str] = {}
        if not (tag == "tabled" and not (ayes_m or nays_m)):
            for last in roster:
                if last in nays_m:
                    votes[last] = "nay"
                elif last in abstain_m:
                    votes[last] = "abstain"
                elif last in absent_m:
                    votes[last] = "absent"
                elif last in ayes_m:
                    votes[last] = "aye"
                elif tag == "unanimous" and not ayes_m:
                    votes[last] = "aye"
                else:
                    votes[last] = "absent"

        resolutions.append({
            "seq": item.get("seq"),
            "number": item.get("number"),
            "title": item.get("title") or "",
            "result": fields["RESULT"],
            "adopted": adopted,
            "tag": tag,
            "ayesCount": ayes,
            "naysCount": nays,
            "mover": clean_person(fields.get("MOVER", "")),
            "seconder": clean_person(fields.get("SECONDER", "")),
            "votes": votes,
        })

    resolutions.sort(key=lambda item: item.get("seq") or 0)
    expected = [item.get("number") for item in sorted(docket, key=lambda item: item.get("seq", 0))]
    actual = [item.get("number") for item in resolutions]
    complete = len(resolutions) == len(docket) and actual == expected

    return {
        "resolutions": resolutions if complete else [],
        "roster": [{"last": last, **info} for last, info in roster.items()] if complete else [],
        "complete": complete,
        "voteBlockCount": len(parsed),
        "mappedCount": len(resolutions),
        "expectedCount": len(docket),
    }
