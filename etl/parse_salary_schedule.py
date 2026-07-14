#!/usr/bin/env python3
"""Extract the 2025 authorized salary schedule from the January 7, 2025 Town
Board minutes.

Resolutions 2025-8 through 2025-18 set salaries for the year, and the minutes
embed the full schedules as attachments: every employee's name, grade/step,
title, and annual salary, grouped by fund (General Fund, Police, Highway, Water,
etc.). This is the Board-*authorized* salary, to compare against actual pay.

Input:  etl/data/meetings/2025-01-07-minutes.txt
Output: web/public/data/salary/authorized-2025.json
"""

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "etl/data/meetings/2025-01-07-minutes.txt"
OUT = ROOT / "web/public/data/salary"

GROUP_NAMES = {
    "8": "Elected Officials", "9": "General Fund", "10": "Boards", "11": "Police",
    "12": "Highway", "13": "Sewer / Scavenger Waste", "14": "Street Lighting",
    "15": "Water District", "16": "Recreation (Seasonal)", "17": "Recreation (Call-In)",
    "18": "Call-In Personnel",
}

LABEL = re.compile(r"Attachment:\s+2025\s+.+?\(2025-(\d+)")
MONEY = re.compile(r"[\d,]+\.\d{2}")
GRADE = re.compile(r"\b(\d{1,2}/[A-Z0-9]{1,3})\b")
COMMA_NAME = re.compile(r"^\s*([A-Z][A-Za-z.'’-]+,\s+[A-Z][A-Za-z.'’.\- ]+?)\s{2,}(.*)$")
FIRSTLAST = re.compile(r"^\s*([A-Z][A-Za-z.'’-]+)\s{2,}([A-Z][A-Za-z.'’-]+)\s*$")
DEPT_HDR = re.compile(r"^\s*([A-Z][A-Z &/’'.-]{3,})\s*$")
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


def normalize_title(title):
    for wrong, right in TITLE_CORRECTIONS.items():
        title = title.replace(wrong, right)
    return title


def normalize_name(name):
    """Normalize to 'Last, First'. Highway/Sewer print 'First Last'."""
    name = clean(name)
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
        cm = COMMA_NAME.match(pre)
        if cm:
            name, title, grade = clean(cm.group(1)), normalize_title(clean(cm.group(2))), ""
        else:
            return None
    if "," not in name or not title:
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


def enrich_with_actual(records):
    payroll = ROOT / "web/public/data/payroll/records.json"
    if not payroll.exists():
        return
    data = json.loads(payroll.read_text())
    latest = max((r["y"] for r in data["records"]), default=None)
    actual = {}
    for r in data["records"]:
        if r["y"] == latest:
            actual[match_key(r["n"])] = r
    for rec in records:
        a = actual.get(match_key(rec["name"]))
        if a:
            rec["actualYear"] = latest
            rec["actualRegular"] = a["r"]
            rec["actualOvertime"] = a["o"]
            rec["actualGross"] = a["g"]


def build():
    lines = SRC.read_text(encoding="utf-8", errors="ignore").split("\n")

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
    dept = ""
    for i, raw in enumerate(lines):
        line = raw.rstrip()
        if not line:
            continue
        if not MONEY.search(line):
            # department subheaders are all-caps lines without digits
            dh = DEPT_HDR.match(line)
            if dh and not any(ch.isdigit() for ch in line) and not NOISE.search(line):
                dept = clean(dh.group(1)).title()
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
            "department": dept,
            "group": GROUP_NAMES.get(gnum, "Other"),
            "resolution": f"2025-{gnum}" if gnum else None,
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
    enrich_with_actual(uniq)

    by_group = {}
    for r in uniq:
        by_group.setdefault(r["group"], {"headcount": 0, "authorized": 0.0})
        by_group[r["group"]]["headcount"] += 1
        by_group[r["group"]]["authorized"] += r["annual"]

    OUT.mkdir(parents=True, exist_ok=True)
    payload = {
        "source": {"title": "2025 Salary Resolutions (Town Board minutes, Jan 7, 2025)",
                   "url": "https://www.townofriverheadny.gov/AgendaCenter"},
        "year": 2025,
        "note": "Board-authorized annual salaries set by resolutions 2025-8 through 2025-18 "
                "(Elected Officials, General Fund, Boards, Police, Highway, Water, Street Lighting). "
                "This is authorized pay, not actual pay. The Sewer/Scavenger schedule lists fund-allocation "
                "percentages rather than dollar amounts, and purely seasonal/hourly call-in staff are not included.",
        "count": len(uniq),
        "totalAuthorized": round(sum(r["annual"] for r in uniq if not r["isStipend"]), 2),
        "byGroup": [{"group": g, **{k: round(v, 2) for k, v in d.items()}} for g, d in
                    sorted(by_group.items(), key=lambda kv: kv[1]["authorized"], reverse=True)],
        "records": uniq,
    }
    (OUT / "authorized-2025.json").write_text(json.dumps(payload, separators=(",", ":")))

    print(f"Authorized salary records: {len(uniq)}  (total base ${payload['totalAuthorized']:,.0f})")
    for g in payload["byGroup"]:
        print(f"  {g['group']:<26} n={g['headcount']:>4}  ${g['authorized']:,.0f}")
    top = sorted([r for r in uniq if not r["isStipend"]], key=lambda r: r["annual"], reverse=True)[:8]
    print("Top authorized salaries:")
    for r in top:
        print(f"    {r['name']:<26} {r['title'][:34]:<34} ${r['annual']:,.0f}  [{r['group']}]")


if __name__ == "__main__":
    build()
