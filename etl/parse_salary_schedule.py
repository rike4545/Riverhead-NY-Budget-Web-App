#!/usr/bin/env python3
"""Extract the Board-authorized salary schedules from the January organizational
meeting minutes, for every year the Town has published them here.

Each January the Board adopts a run of resolutions that set salaries for the
year, and the minutes embed the full schedules as attachments: every employee's
name, grade/step, title, and annual salary, grouped by fund (General Fund,
Police, Highway, Water, etc.). This is the Board-*authorized* salary, to compare
against actual pay.

The resolution numbering is NOT stable across years, which is why the group map
is per-year rather than shared. 2022 and 2023 run 1-8 with Boards at 7 and Water
at 8; 2024 runs 1-8 with those two swapped; 2025 starts at 8 and adds three
seasonal/call-in schedules that the earlier years do not publish separately.
Getting this wrong silently mislabels whole funds rather than failing, so each
year's map is written out rather than derived.

Input:  etl/data/meetings/<date>-minutes.txt
Output: web/public/data/salary/authorized-<year>.json
"""

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "web/public/data/salary"

# year -> (minutes file, {resolution suffix: schedule group})
YEARS = {
    2022: ("2022-01-04-minutes.txt", {
        "1": "Elected Officials", "2": "General Fund", "3": "Highway", "4": "Police",
        "5": "Sewer / Scavenger Waste", "6": "Street Lighting", "7": "Boards",
        "8": "Water District",
    }),
    2023: ("2023-01-04-minutes.txt", {
        "1": "Elected Officials", "2": "General Fund", "3": "Highway", "4": "Police",
        "5": "Sewer / Scavenger Waste", "6": "Street Lighting", "7": "Boards",
        "8": "Water District",
    }),
    2024: ("2024-01-03-minutes.txt", {
        "1": "Elected Officials", "2": "General Fund", "3": "Highway", "4": "Police",
        "5": "Sewer / Scavenger Waste", "6": "Street Lighting", "7": "Water District",
        "8": "Boards",
    }),
    2025: ("2025-01-07-minutes.txt", {
        "8": "Elected Officials", "9": "General Fund", "10": "Boards", "11": "Police",
        "12": "Highway", "13": "Sewer / Scavenger Waste", "14": "Street Lighting",
        "15": "Water District", "16": "Recreation (Seasonal)", "17": "Recreation (Call-In)",
        "18": "Call-In Personnel",
    }),
}

SOURCE_DATES = {
    2022: "Jan 4, 2022", 2023: "Jan 4, 2023", 2024: "Jan 3, 2024", 2025: "Jan 7, 2025",
}


# The attachment label sits at the foot of every schedule page and carries the
# resolution it belongs to. The prefix varies ("2023 Sewer Only" but also
# "Copy of 2023 Sewer Only"), so only the parenthesised resolution is matched.
def label_re(year):
    return re.compile(r"Attachment:\s+.+?\((?:%d)-(\d+)" % year)


MONEY = re.compile(r"[\d,]+\.\d{2}")
GRADE = re.compile(r"\b(\d{1,2}/[A-Z0-9]{1,3})\b")
COMMA_NAME = re.compile(r"^\s*([A-Z][A-Za-z.'’-]+,\s+[A-Z][A-Za-z.'’.\- ]+?)\s{2,}(.*)$")
# The September 2026 re-extraction of the minutes collapsed every run of spaces
# to a single space (and moved the "$" to the end of the line), so the column
# padding COMMA_NAME depends on is gone:
#     was:  Hubbard, Timothy          Town Supervisor        $     118,919.00
#     now:  Hubbard, Timothy Town Supervisor 118,919.00$
# Rows carrying a grade still parse — that path splits on the grade, not on
# whitespace — but every grade-less row (Elected Officials, Boards, and the
# stipend/appointed police lines) silently dropped out, taking 168 of 345
# records with them. This fallback recovers them by treating "Last, First" plus
# an optional middle initial as the name and the remainder as the title.
# COMMA_NAME is still tried first so archived, column-aligned copies of the
# minutes keep parsing exactly as before.
COMMA_NAME_TIGHT = re.compile(
    r"^\s*([A-Z][A-Za-z.'’-]+(?:\s+[A-Z][A-Za-z.'’-]+)*,"
    r"\s+[A-Z][A-Za-z.'’-]+(?:\s+[A-Z]\.?)?)"
    r"\s+(\S.*)$"
)
FIRSTLAST = re.compile(r"^\s*([A-Z][A-Za-z.'’-]+)\s{2,}([A-Z][A-Za-z.'’-]+)\s*$")
NOISE = re.compile(r"AYES|NAYS|MOVER|SECONDER|RESULT|ABSTAIN|Packet Pg|ANNUAL SALARY|EMPLOYEE\b|GROUP/STEP")


def clean(s):
    return re.sub(r"\s+", " ", s).strip(" .$")


# Misspellings in the Town's own salary-schedule source documents, confirmed against
# Suffolk County's official Civil Service title list.
TITLE_CORRECTIONS = {
    "Superintendant": "Superintendent",
    "Specialst": "Specialist",
    "Adminstrator": "Administrator",
}


# PDF letter-spacing sometimes splits the last letter off a word, so the 2025
# schedule prints "Town Buildin g & Planning" and "Spanish Speakin g". A lone
# letter that is not a real one-letter word is rejoined to the word before it.
# Only "a" and "I" are real one-letter words, and neither appears mid-title in
# this source. The TRUNCATION in the same title ("Adminstrat") is left alone:
# repairing a split is undoing a rendering artifact, whereas restoring a
# truncated word would be supplying text the document does not contain.
SPLIT_LETTER = re.compile(r"\b([A-Za-z]{3,})\s+([b-hj-z])\b")


def normalize_title(title):
    for wrong, right in TITLE_CORRECTIONS.items():
        title = title.replace(wrong, right)
    return SPLIT_LETTER.sub(r"\1\2", title)


# The Sewer/Scavenger schedule prints a fund-allocation column ("100/", "50/50")
# between the name and the grade, and a couple of General Fund rows carry a bare
# split figure there. Both land on the end of the captured name -- "Berry, Justin
# 100/", "Moore, Tammy 2" -- so a trailing token made only of digits, slashes and
# percent signs is dropped. Real name suffixes ("Seal Jr.", "Baier, Joseph H")
# contain letters and are untouched.
ALLOCATION_TAIL = re.compile(r"\s+[\d/%.]+$")


def normalize_name(name):
    """Normalize to 'Last, First'. Highway/Sewer print 'First Last'."""
    name = ALLOCATION_TAIL.sub("", clean(name))
    if "," in name:
        return name
    parts = name.split()
    if len(parts) == 2:
        return f"{parts[1]}, {parts[0]}"
    return name


def parse_row(line):
    """Return (name, grade, title, annual, hourly) or None."""
    nums = MONEY.findall(line)
    if not nums:
        return None
    first = MONEY.search(line)
    pre = line[:first.start()]
    vals = [float(n.replace(",", "")) for n in nums]
    annual = max(vals)
    if annual < 100:
        return None
    hourly = next((v for v in vals if v < 200), None)

    g = GRADE.search(pre)
    if g:
        name = normalize_name(pre[:g.start()])
        title = normalize_title(clean(pre[g.end():]))
        grade = g.group(1)
    else:
        cm = COMMA_NAME.match(pre) or COMMA_NAME_TIGHT.match(pre)
        if cm:
            name, title, grade = clean(cm.group(1)), normalize_title(clean(cm.group(2))), ""
        else:
            return None
    if "," not in name or not title:
        return None
    # Without column padding to anchor on, the tight fallback can also match a
    # sentence that happens to contain a comma and a dollar figure — e.g.
    # "...RESOLVED, Bergman shall be entitled to a stipend in the sum of $3,000".
    # Real schedule titles always begin with a capital or a digit, and no real
    # surname in this document is all-caps, so those two checks reject the prose
    # without touching any genuine row.
    if not re.match(r"^[A-Z0-9]", title):
        return None
    if name.split(",")[0].strip().isupper():
        return None
    return name, grade, title, round(annual, 2), hourly


def match_key(name):
    """Normalize 'Last, First M' -> ('last', 'first') for cross-dataset matching."""
    n = re.sub(r"\s+", " ", name).strip().lower()
    parts = n.split(",")
    if len(parts) != 2:
        return (n, "")
    last = parts[0].strip()
    first = parts[1].strip().split(" ")[0] if parts[1].strip() else ""
    return (last, first)


def enrich_with_actual(records, year):
    payroll = ROOT / "web/public/data/payroll/records.json"
    if not payroll.exists():
        return
    data = json.loads(payroll.read_text())
    years = {r["y"] for r in data["records"]}
    # Compare a schedule against the pay actually recorded in ITS OWN year. The
    # earlier schedules exist precisely to be read against their own year, and
    # silently pairing a 2022 schedule with 2025 pay would invent raises.
    target = year if year in years else max(years, default=None)
    if target is None:
        return
    actual = {}
    for r in data["records"]:
        if r["y"] == target:
            actual[match_key(r["n"])] = r
    for rec in records:
        a = actual.get(match_key(rec["name"]))
        if a:
            rec["actualYear"] = target
            rec["actualRegular"] = a["r"]
            rec["actualOvertime"] = a["o"]
            rec["actualGross"] = a["g"]


def build(year):
    src_name, group_names = YEARS[year]
    src = ROOT / "etl/data/meetings" / src_name
    if not src.exists():
        print(f"  {year}: source missing ({src_name}) - skipped")
        return None
    LABEL = label_re(year)
    lines = src.read_text(encoding="utf-8", errors="ignore").split("\n")

    # Pre-compute, for each line index, the resolution number of the next
    # attachment label at or below it (labels sit at the bottom of each page).
    next_group = [None] * len(lines)
    cur = None
    for i in range(len(lines) - 1, -1, -1):
        m = LABEL.search(lines[i])
        if m:
            cur = m.group(1)
        next_group[i] = cur

    records = []
    for i, raw in enumerate(lines):
        line = raw.rstrip()
        if not line:
            continue
        if not MONEY.search(line):
            continue
        if NOISE.search(line):
            continue

        parsed = parse_row(line)
        if not parsed:
            continue
        name, grade, title, annual, hourly = parsed

        gnum = next_group[i]
        records.append({
            "name": name,
            "grade": grade,
            "title": title,
            # Deliberately not recovered. The schedules print the department as a
            # left-column label spanning its rows, and the text extraction hoists
            # those labels into a block at the foot of the page, losing which rows
            # each one covered. Reading the nearest all-caps line instead put 169
            # of 2025's 349 records in "Of Proposed Riverhead Town Board
            # Legislation" -- a fiscal impact statement heading -- and filed the
            # Town Attorney under Senior Citizen Programs Nutrition. A page then
            # read that artifact as a fact about how the Town codes its staff.
            # Recovering it properly needs positional extraction, so until then
            # the field is empty rather than confidently wrong.
            "department": None,
            "group": group_names.get(gnum, "Other"),
            "resolution": f"{year}-{gnum}" if gnum else None,
            "annual": annual,
            "hourly": hourly,
            "isStipend": title.lower() == "stipend",
        })

    # De-duplicate exact repeats (same name+title+annual) that can arise from
    # a page-break line being captured twice.
    seen = set()
    uniq = []
    for r in records:
        key = (r["name"], r["title"], r["annual"])
        if key in seen:
            continue
        seen.add(key)
        uniq.append(r)

    # Enrich with the most recent ACTUAL pay per employee (from the payroll
    # dataset) so authorized-vs-actual is available without client-side matching.
    enrich_with_actual(uniq, year)

    by_group = {}
    for r in uniq:
        by_group.setdefault(r["group"], {"headcount": 0, "authorized": 0.0})
        by_group[r["group"]]["headcount"] += 1
        by_group[r["group"]]["authorized"] += r["annual"]

    OUT.mkdir(parents=True, exist_ok=True)
    res_lo, res_hi = min(group_names, key=int), max(group_names, key=int)
    # Name the schedules that actually produced rows, and name the ones that did
    # not. Several schedules are adopted by resolution every year but carry no
    # dollar figures this parser can read -- Sewer/Scavenger lists fund-allocation
    # percentages, and the seasonal and call-in schedules are hourly rate cards.
    # Listing every configured group as though it were present would claim
    # coverage the file does not have.
    present = sorted({r["group"] for r in uniq})
    absent = sorted(set(group_names.values()) - set(present))
    payload = {
        "source": {"title": f"{year} Salary Resolutions (Town Board minutes, {SOURCE_DATES[year]})",
                   "url": "https://www.townofriverheadny.gov/AgendaCenter"},
        "year": year,
        "note": f"Board-authorized annual salaries set by resolutions {year}-{res_lo} through "
                f"{year}-{res_hi}. Schedules carried here: {', '.join(present)}."
                + (f" Adopted but carrying no annual dollar figures this parser reads, so absent"
                   f" from the totals: {', '.join(absent)}." if absent else "")
                + " This is authorized pay, not actual pay, and it is the schedule as adopted in"
                  " January: a mid-year salary resolution changes what a position is paid without"
                  " changing this file.",
        "count": len(uniq),
        "totalAuthorized": round(sum(r["annual"] for r in uniq if not r["isStipend"]), 2),
        "byGroup": [{"group": g, **{k: round(v, 2) for k, v in d.items()}} for g, d in
                    sorted(by_group.items(), key=lambda kv: kv[1]["authorized"], reverse=True)],
        "records": uniq,
    }
    (OUT / f"authorized-{year}.json").write_text(json.dumps(payload, separators=(",", ":")))

    print(f"{year}: {len(uniq)} records  (total base ${payload['totalAuthorized']:,.0f})")
    for g in payload["byGroup"]:
        print(f"  {g['group']:<26} n={g['headcount']:>4}  ${g['authorized']:,.0f}")
    top = sorted([r for r in uniq if not r["isStipend"]], key=lambda r: r["annual"], reverse=True)[:8]
    print("Top authorized salaries:")
    for r in top:
        print(f"    {r['name']:<26} {r['title'][:34]:<34} ${r['annual']:,.0f}  [{r['group']}]")


if __name__ == "__main__":
    wanted = [int(a) for a in sys.argv[1:]] or sorted(YEARS)
    for y in wanted:
        build(y)
