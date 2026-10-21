#!/usr/bin/env python3
"""Personnel actions the Town Board takes by payroll file number, with the
person the Town's own roster gives that number to.

Resolutions on discipline, terminations, separations, stipulations, suspensions
and grievances name the employee only as "employee #GFZ000347". The Town's
payroll company-code roster (etl/data/payroll/gfz-code-lookup.csv) pairs each
file number with a name, and the Gross Earnings exports give that name's title
and department. This reads every resolution in the meeting texts this site
keeps (etl/data/meetings/*-minutes.txt and *-vote-packet.txt), keeps the
personnel actions that cite a file number, and writes them with the roster's
name, or with none when the number is not on the roster, to
web/public/data/meetings/personnel-actions.json for /payroll/ and site search.

A resolution is an action, not a finding: charges are allegations until they
are decided. The page says so, and that the match is by roster number.
"""

import csv
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MEETINGS = ROOT / "etl/data/meetings"
PAYROLL = ROOT / "etl/data/payroll"
OUT = ROOT / "web/public/data/meetings/personnel-actions.json"

# The kinds of action, by the words of the resolution's title, most specific first.
KINDS = (
    ("discipline", re.compile(r"disciplin|charges", re.I)),
    ("suspension", re.compile(r"suspen", re.I)),
    ("termination", re.compile(r"terminat", re.I)),
    ("grievance", re.compile(r"grievance", re.I)),
    ("separation", re.compile(r"separation|retirement and separation", re.I)),
    ("stipulation", re.compile(r"stipulation", re.I)),
)
FILE_NUMBER = re.compile(r"GFZ\s*#?\s*(\d{6})")
HEADER = re.compile(r"TB Resolution\s+#?\s*(20\d\d-\d+)")


def kind_of(text):
    for kind, pattern in KINDS:
        if pattern.search(text):
            return kind
    return None


def resolutions(text):
    """Each resolution in a meeting text: its number, title, body and result."""
    heads = list(HEADER.finditer(text))
    for i, h in enumerate(heads):
        end = heads[i + 1].start() if i + 1 < len(heads) else len(text)
        block = text[h.end():end]
        # The body ends at the fiscal impact statement, which repeats the title.
        body = block.split("FISCAL IMPACT STATEMENT")[0]
        lines = [l.strip() for l in body.splitlines()]
        title = []
        for line in lines:
            if not line:
                if title:
                    break
                continue
            if re.search(r"offered the following", line, re.I):
                break
            title.append(line)
        result = re.search(r"RESULT:\s*([^\n]*)", body)
        yield {
            "number": h.group(1),
            "title": re.sub(r"\s+", " ", " ".join(title)).strip(),
            "body": body,
            "result": result.group(1).strip() if result and result.group(1).strip() else None,
        }


def quote(body, number):
    """The resolution's own sentence that names the file number."""
    flat = re.sub(r"\s+([,;])", r"\1", re.sub(r"\s+", " ", body))
    at = re.search(r"GFZ\s*#?\s*" + number, flat)
    if not at:
        return None
    start = max(flat.rfind("WHEREAS", 0, at.start()), flat.rfind("RESOLVED", 0, at.start()))
    stop = flat.find(";", at.end())
    stop2 = flat.find(". ", at.end())
    ends = [s for s in (stop, stop2) if s != -1]
    stop = min(ends) if ends else min(len(flat), at.end() + 200)
    return flat[max(start, 0):stop].strip(" ,;") if start != -1 else None


def load_roster():
    with open(PAYROLL / "gfz-code-lookup.csv", newline="") as f:
        rows = [r for r in csv.DictReader(f) if (r.get("File Number") or "").strip().isdigit()]
    by_number = {}
    for r in rows:
        by_number.setdefault(r["File Number"].strip(), []).append(r["Payroll Name"].strip())
    return by_number


def load_latest_jobs():
    jobs = {}
    for path in sorted(PAYROLL.glob("gross-earnings-*.csv")):
        with open(path, newline="") as f:
            for r in csv.DictReader(f):
                jobs[r["name"]] = {"year": int(r["year"]), "title": r["title"] or None, "department": r["department"] or None}
    return jobs


def meeting_date(path):
    return path.name[:10]


def build():
    roster = load_roster()
    jobs = load_latest_jobs()
    found = {}
    # Minutes first: their result is the record. A packet only fills in what
    # the minutes do not have yet.
    paths = sorted(MEETINGS.glob("*-minutes.txt")) + sorted(MEETINGS.glob("*-vote-packet.txt"))
    for path in paths:
        text = path.read_text(errors="replace")
        for r in resolutions(text):
            kind = kind_of(r["title"])
            # Some titles say only "an agreement with a Town employee"; then
            # the resolution's own clauses say what the agreement is.
            if not kind and re.search(r"employee", r["title"], re.I):
                kind = kind_of(r["body"].split("THE VOTE")[0])
            if not kind:
                continue
            for number in dict.fromkeys(FILE_NUMBER.findall(r["body"])):
                key = (r["number"], number)
                if key in found and (found[key]["result"] or not r["result"]):
                    continue
                names = roster.get(number, [])
                # One number under two names is one person whose name changed;
                # the roster gives no way to say which is current, so show both.
                people = [{"name": n, **(jobs.get(n) or {"year": None, "title": None, "department": None})} for n in names]
                found[key] = {
                    "meeting": meeting_date(path),
                    "resolution": r["number"],
                    "title": r["title"],
                    "kind": kind,
                    "fileNumber": number,
                    "quote": quote(r["body"], number),
                    "result": r["result"],
                    "people": people,
                    "source": path.relative_to(ROOT).as_posix(),
                }
    actions = sorted(found.values(), key=lambda a: (a["meeting"], a["resolution"]), reverse=True)
    highest = max(int(n) for n in roster if int(n) < 900000)
    out = {
        "note": (
            "Town Board resolutions that take a personnel action by payroll file number, with the person the Town's "
            "payroll roster (company code GFZ) gives that number to. The match is by number on a roster that runs "
            f"through file number {highest:06d}; a number above that has no name here. A resolution is an action, "
            "not a finding."
        ),
        "rosterHighest": f"{highest:06d}",
        "actions": actions,
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(out, indent=1, ensure_ascii=False) + "\n")
    named = sum(1 for a in actions if a["people"])
    print(f"personnel actions: {len(actions)} by file number, {named} matched to the roster -> {OUT.relative_to(ROOT)}")
    return out


if __name__ == "__main__":
    build()
