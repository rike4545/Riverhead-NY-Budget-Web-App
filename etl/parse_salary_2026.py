#!/usr/bin/env python3
"""Extract the 2026 authorized salary schedule from the January 6, 2026 Town
Board agenda packet, and compute each employee's raise from 2025 to 2026.

The 2025 schedule comes from etl/parse_salary_schedule.py (authorized-2025.json).
Matching 2025 and 2026 by name gives the concrete "who got a raise, and by how
much" picture, and title changes flag likely promotions.

Input:  etl/data/salary/agenda-packet-2026.txt (committed extracted text)
Output: web/public/data/salary/comparison-2025-2026.json
"""

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "etl/data/salary/agenda-packet-2026.txt"
SAL25 = ROOT / "web/public/data/salary/authorized-2025.json"
OUT = ROOT / "web/public/data/salary"

MONEY = re.compile(r"[\d,]+\.\d{2}")
GRADE = re.compile(r"\b(\d{1,2}/[A-Z0-9]{1,3})\b")
COMMA_NAME = re.compile(r"^([A-Z][A-Za-z.'-]+,\s+[A-Z][A-Za-z.'-]+)\s+(.*)$")
DEPT_HDR = re.compile(r"^[A-Z][A-Z '&/.-]{4,40}$")
NOISE = re.compile(r"ANNUAL SALARY|EMPLOYEE|FISCAL IMPACT|THE VOTE|ADOPTED|TOWN OF RIVERHEAD|RESOLUTION|WHEREAS|NOTICE")


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
    """Normalize to 'Last, First'. Some sections print 'First Last'."""
    name = clean(name)
    if "," in name:
        return name
    parts = name.split()
    if len(parts) == 2:
        return f"{parts[1]}, {parts[0]}"
    if len(parts) > 2:
        return f"{parts[-1]}, {parts[0]}"
    return name


def parse_row_2026(line):
    """Handle both 'Last, First [grade] Title $ salary' and 'First Last [grade]
    Title $ salary'. Returns (name, grade, title, annual) or None."""
    nums = MONEY.findall(line)
    if not nums:
        return None
    first = MONEY.search(line)
    pre = line[:first.start()]
    annual = max(float(n.replace(",", "")) for n in nums)
    if annual < 1000 or annual > 400000:
        return None

    g = GRADE.search(pre)
    if g:
        name = normalize_name(pre[:g.start()])
        title = normalize_title(clean(pre[g.end():]))
    else:
        cm = COMMA_NAME.match(pre.strip())
        if cm:
            name, title = clean(cm.group(1)), normalize_title(clean(cm.group(2)))
        else:
            toks = pre.split()
            if len(toks) >= 3 and toks[0][:1].isupper() and toks[1][:1].isupper():
                name, title = normalize_name(" ".join(toks[:2])), normalize_title(clean(" ".join(toks[2:])))
            else:
                return None
    if "," not in name or not title:
        return None
    return name, g.group(1) if g else "", title, round(annual, 2)


def key(name):
    p = name.lower().split(",")
    return (p[0].strip(), p[1].strip().split(" ")[0]) if len(p) == 2 else (p[0].strip(), "")


def enrich_with_actual(records):
    """Attach each employee's most recent actual pay (from the payroll data)."""
    payroll = ROOT / "web/public/data/payroll/records.json"
    if not payroll.exists():
        return
    data = json.loads(payroll.read_text())
    latest = max((r["y"] for r in data["records"]), default=None)
    actual = {key(r["n"]): r for r in data["records"] if r["y"] == latest}
    for rec in records:
        a = actual.get(key(rec["name"]))
        if a:
            rec["actualYear"] = latest
            rec["actualRegular"] = a["r"]
            rec["actualOvertime"] = a["o"]
            rec["actualGross"] = a["g"]


def write_authorized_2026(r26, r25):
    """Emit a standalone 2026 authorized-salary dataset (same shape as 2025)."""
    recs = []
    for name, a in r26.items():
        b = r25.get(key(name))
        recs.append({
            "name": a["name"], "grade": a["grade"], "title": a["title"],
            "department": a["department"], "group": b["group"] if b else "New in 2026",
            "resolution": None, "annual": a["annual2026"], "hourly": None,
            "isStipend": a["title"].lower() == "stipend",
        })
    enrich_with_actual(recs)
    by_group = {}
    for r in recs:
        by_group.setdefault(r["group"], {"headcount": 0, "authorized": 0.0})
        by_group[r["group"]]["headcount"] += 1
        by_group[r["group"]]["authorized"] += r["annual"]
    payload = {
        "source": {"title": "2026 salary schedule (Town Board agenda packet, Jan 6, 2026)",
                   "url": "https://www.townofriverheadny.gov/AgendaCenter"},
        "year": 2026,
        "note": "Board-authorized annual base salaries for 2026, from the January 6, 2026 agenda packet. "
                "This is authorized pay, not actual pay. Sewer/Scavenger and purely seasonal/hourly staff "
                "are not included.",
        "count": len(recs),
        "totalAuthorized": round(sum(r["annual"] for r in recs if not r["isStipend"]), 2),
        "byGroup": [{"group": g, **{k: round(v, 2) for k, v in d.items()}} for g, d in
                    sorted(by_group.items(), key=lambda kv: kv[1]["authorized"], reverse=True)],
        "records": sorted(recs, key=lambda r: r["annual"], reverse=True),
    }
    (OUT / "authorized-2026.json").write_text(json.dumps(payload, separators=(",", ":")))
    return payload["count"], payload["totalAuthorized"]


def parse_2026():
    dept = ""
    rows = {}
    for raw in SRC.read_text(encoding="utf-8", errors="ignore").split("\n"):
        line = raw.strip()
        if not line:
            continue
        if DEPT_HDR.match(line) and not any(c.isdigit() for c in line) and not NOISE.search(line):
            dept = line.title()
            continue
        if NOISE.search(line):
            continue
        parsed = parse_row_2026(line)
        if not parsed:
            continue
        name, grade, title, annual = parsed
        rows[name] = {"name": name, "grade": grade, "title": title, "department": dept, "annual2026": annual}
    return rows


def build():
    r26 = parse_2026()
    sal25 = json.loads(SAL25.read_text())
    r25 = {}
    for rec in sal25["records"]:
        if rec["isStipend"]:
            continue
        r25.setdefault(key(rec["name"]), rec)

    k26 = {key(n): v for n, v in r26.items()}

    records = []
    for k, a in r26.items():
        kk = key(k)
        b = r25.get(kk)
        rec = {
            "name": a["name"],
            "title2026": a["title"],
            "department": a["department"],
            "annual2026": a["annual2026"],
            "annual2025": b["annual"] if b else None,
            "title2025": b["title"] if b else None,
            "group": b["group"] if b else "New in 2026",
        }
        if b:
            rec["raise"] = round(a["annual2026"] - b["annual"], 2)
            rec["raisePct"] = round((a["annual2026"] - b["annual"]) / b["annual"] * 100, 1) if b["annual"] else None
            rec["promoted"] = bool(b["title"]) and b["title"].lower() != a["title"].lower()
        records.append(rec)

    # Only treat a year-over-year change as a comparable raise when the 2025
    # figure is a real full-time salary. A tiny 2025 value means the person was
    # part-time/hourly then, so the "raise" is spurious.
    for r in records:
        r["comparable"] = r["annual2025"] is not None and r["annual2025"] >= 20000
    matched = [r for r in records if r["annual2025"] is not None]
    raised = [r for r in matched if r["comparable"] and (r.get("raise") or 0) > 1]
    promotions = [r for r in raised if r.get("promoted")]
    raises_sorted = sorted(raised, key=lambda r: r["raise"], reverse=True)

    pcts = sorted(r["raisePct"] for r in raised if r["raisePct"] is not None)
    median_pct = pcts[len(pcts) // 2] if pcts else None

    summary = {
        "count2026": len(records),
        "matched": len(matched),
        "raised": len(raised),
        "promotions": len(promotions),
        "totalRaise": round(sum(r["raise"] for r in raised), 2),
        "avgRaise": round(sum(r["raise"] for r in raised) / len(raised), 2) if raised else 0,
        "medianRaisePct": median_pct,
        "topRaises": [{"name": r["name"], "title2026": r["title2026"], "annual2025": r["annual2025"],
                       "annual2026": r["annual2026"], "raise": r["raise"], "raisePct": r["raisePct"],
                       "promoted": r["promoted"]} for r in raises_sorted[:15]],
    }

    OUT.mkdir(parents=True, exist_ok=True)
    payload = {
        "source": {"title": "2026 salary resolutions (Town Board agenda packet, Jan 6, 2026) vs 2025 salary resolutions",
                   "url": "https://www.townofriverheadny.gov/AgendaCenter"},
        "note": "Board-authorized annual base salaries for 2026 compared with 2025. A large jump usually means a "
                "promotion or reclassification (the title changes), not a cost-of-living raise. Sewer/Scavenger and "
                "purely seasonal/hourly staff are not included on either side.",
        "summary": summary,
        "records": sorted(records, key=lambda r: r["annual2026"], reverse=True),
    }
    (OUT / "comparison-2025-2026.json").write_text(json.dumps(payload, separators=(",", ":")))
    n26, tot26 = write_authorized_2026(r26, r25)
    print(f"authorized-2026.json: {n26} positions, ${tot26:,.0f} total base")

    print(f"2026 positions: {len(records)} | matched to 2025: {len(matched)} | raised: {len(raised)} | promotions: {len(promotions)}")
    print(f"avg raise ${summary['avgRaise']:,.0f} | median {summary['medianRaisePct']}% | total ${summary['totalRaise']:,.0f}")
    print("Biggest changes 2025 -> 2026:")
    for r in raises_sorted[:8]:
        tag = " (promotion)" if r["promoted"] else ""
        print(f"  {r['name']:<24} ${r['annual2025']:,.0f} -> ${r['annual2026']:,.0f}  +${r['raise']:,.0f} ({r['raisePct']}%){tag}  {r['title2026'][:30]}")


if __name__ == "__main__":
    build()
