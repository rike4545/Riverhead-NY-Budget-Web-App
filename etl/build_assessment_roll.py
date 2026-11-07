"""Town-wide totals from Riverhead's 2026 assessment rolls, for /assessment/.

Reads the Assessor's tentative and final assessment rolls (PDFs from the
Assessor's page) and writes only totals: parcels, assessed value and full market
value by property class, the roll's own grand totals by roll section, its school
district summary and its exemption summary, and the spread of one-family home
values. No owner, address, tax-map number or single parcel's value is kept.

The parcel records are added up by property class, and the sums must equal the
roll's own section totals (parcels and assessed value) or the script stops
without writing. The rolls are posted twice a year (tentative by May 1, final by
mid-September), so this is run by hand when a new roll appears:

    python3 etl/build_assessment_roll.py

It needs pdftotext (poppler-utils). Writes web/public/data/assessment-roll-2026.json.
"""

from __future__ import annotations

import json
import re
import shutil
import statistics
import subprocess
import sys
import tempfile
from collections import defaultdict
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from build_election_map import http_get  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "web/public/data/assessment-roll-2026.json"
SITE = "https://www.townofriverheadny.gov"
ROLLS = {
    "tentative": {"title": "2026/27 Tentative Assessment Roll", "url": f"{SITE}/DocumentCenter/View/3510/Tentative-Roll-2026-27-"},
    "final": {"title": "2026/27 Final Assessment Roll, revised 9/17/26", "url": f"{SITE}/DocumentCenter/View/2788/202627-Final-Roll-PDF"},
}
ASSESSOR_PAGE = f"{SITE}/204/Assessor"

# The State's property class codes (first digit), from the Office of Real Property Tax Services.
CLASSES = {
    "1": "Agricultural",
    "2": "Residential",
    "3": "Vacant land",
    "4": "Commercial",
    "5": "Recreation and entertainment",
    "6": "Community services",
    "7": "Industrial",
    "8": "Public services (utilities)",
    "9": "Forest, conservation land and public parks",
}
RESIDENTIAL = {
    "210": "One-family homes",
    "215": "One-family homes with an apartment",
    "220": "Two-family homes",
    "230": "Three-family homes",
    "240": "Rural homes on 10+ acres",
    "250": "Estates",
    "260": "Seasonal homes",
    "270": "Mobile homes",
    "280": "Multiple homes on one parcel",
    "283": "Homes with some commercial use",
}
SECTION_NAMES = {"1": "Taxable", "3": "State-owned land", "5": "Special franchise", "6": "Utilities", "8": "Wholly exempt"}

STAR_LINE = re.compile(r"^\*{20,} (\S+) \*+\s*$")


def money(s: str) -> int:
    return int(s.replace(",", ""))


def roll_text(pdf: bytes) -> list[str]:
    if not shutil.which("pdftotext"):
        raise SystemExit("pdftotext is needed (apt-get install poppler-utils)")
    with tempfile.TemporaryDirectory() as tmp:
        p = Path(tmp) / "roll.pdf"
        p.write_bytes(pdf)
        out = subprocess.run(["pdftotext", "-layout", str(p), "-"], capture_output=True, check=True)
    return out.stdout.decode("utf8", "replace").split("\n")


def parcels(lines: list[str]) -> list[dict]:
    """Each parcel's roll section, class code, assessed total and full market value."""
    sec = None
    cur: dict | None = None
    out: list[dict] = []
    for i, line in enumerate(lines):
        m = re.search(r"SECTION OF THE ROLL - (\d)", line)
        if m:
            sec = m.group(1)
        if "R O L L     S E C T I O N" in line or "S W I S   T O T A L S" in line:
            sec = None
        m = STAR_LINE.match(line)
        if m and sec:
            cur = {"tm": m.group(1), "sec": sec}
            out.append(cur)
            continue
        if cur is None:
            continue
        if "cls" not in cur and line.startswith(cur["tm"] + " "):
            mm = re.match(r"\S+\s+(\d{3}) ", line)
            if mm:
                cur["cls"], cur["li"] = mm.group(1), i
            continue
        # The assessed total is the right-aligned figure ending near column 69, two lines below the class
        # line. Figures too wide for the column (e.g. "2550,725") push one or two columns further right.
        if "li" in cur and i == cur["li"] + 2:
            for nm in re.finditer(r"(?<![\w,.])([\d,]+)(?![\w,.])", line):
                if 62 <= nm.end() <= 71:
                    cur["total"] = money(nm.group(1))
                    break
        m = re.search(r"FULL MARKET VALUE\s+([\d,]+)", line)
        if m and "fmv" not in cur:
            cur["fmv"] = money(m.group(1))
    bad = [p["tm"] for p in out if "cls" not in p or "total" not in p]
    if bad:
        raise SystemExit(f"{len(bad)} parcel records could not be read, e.g. {bad[:3]}")
    return out


def swis_pages(lines: list[str]) -> list[str]:
    """The roll's town-wide (SWIS) summary pages."""
    start = next(i for i, l in enumerate(lines) if "S W I S   T O T A L S" in l)
    return lines[start:]


def grand_totals(summary: list[str]) -> dict:
    i = next(i for i, l in enumerate(summary) if "G R A N D    T O T A L S" in l or "G R A N D   T O T A L S" in l)
    secs = {}
    for line in summary[i:i + 40]:
        m = re.match(r"\s*([1-8])\s+[A-Z][A-Z .&]+?\s{2,}([\d,]+)\s+(.*)$", line)
        if m:
            nums = [money(x) for x in m.group(3).split()]
            secs[m.group(1)] = {"name": SECTION_NAMES[m.group(1)], "parcels": money(m.group(2)), "assessedTotal": nums[1] if m.group(1) != "5" else nums[0]}
        m = re.match(r"\s*\*\*\s+GRAND TOTAL\s+([\d,]+)\s+(.*)$", line)
        if m:
            n = [money(x) for x in m.group(2).split()]
            return {"sections": secs, "parcels": money(m.group(1)), "assessedLand": n[0], "assessedTotal": n[1],
                    "taxableCounty": n[2], "taxableTown": n[3], "taxableSchool": n[4], "starTaxable": n[5]}
    raise SystemExit("grand totals not found")


def school_districts(summary: list[str]) -> list[dict]:
    i = next(i for i, l in enumerate(summary) if "S C H O O L" in l and "S U M M A R Y" in l)
    out = []
    for line in summary[i:i + 30]:
        m = re.match(r"\s*(47\d{4}|472235)\s+(.+?)\s{2,}([\d,]+)\s+([\d,]+)\s+([\d,]+)\s", line)
        if m:
            out.append({"code": m.group(1), "name": m.group(2).strip(), "parcels": money(m.group(3)), "assessedTotal": money(m.group(5))})
        if "T O T A L" in line and out:
            break
    return out


EXEMPTION_GROUPS = [
    ("STAR school tax relief", lambda c: c in (41834, 41854)),
    ("Government-owned", lambda c: 12100 <= c <= 14100 or c in (32301, 33201)),
    ("Industrial Development Agency (IDA)", lambda c: c == 18020),
    ("Religious, nonprofit, hospital, cemetery", lambda c: 21600 <= c <= 27350),
    ("Veterans", lambda c: 41101 <= c <= 41174),
    ("Seniors", lambda c: 41800 <= c <= 41806),
    ("Farm buildings and farmland", lambda c: 41700 <= c <= 41730),
    ("Solar and wind", lambda c: c == 49500),
    ("People with disabilities", lambda c: 41902 <= c <= 41936),
    ("Volunteer firefighters and ambulance workers", lambda c: 41630 <= c <= 41641),
]


def exemptions(summary: list[str]) -> dict:
    """The exemption summary: each code's parcels and its County, Town and School amounts, grouped."""
    rows = []
    cols: list[tuple[str, int]] = []
    start = next(i for i, l in enumerate(summary) if "E X E M P T I O N" in l)
    total = None
    for line in summary[start:]:
        if re.match(r"CODE\s+DESCRIPTION\s+PARCELS", line):
            cols = [(w, m.end()) for w in ("COUNTY", "TOWN", "SCHOOL") for m in [re.search(rf"\b{w}\b", line)]]
            continue
        m = re.match(r"(\d{5})\s+(.{10})\s+([\d,]+)(.*)$", line)
        t = re.match(r"\s+T O T A L\s+([\d,]+)(.*)$", line)
        if not (m or t) or not cols:
            if "G R A N D" in line:
                break
            continue
        tail_start = line.index((m or t).group(4 if m else 2))
        amounts = {"COUNTY": 0, "TOWN": 0, "SCHOOL": 0}
        for nm in re.finditer(r"[\d,]+", line[tail_start:]):
            end = tail_start + nm.end()
            col = min(cols, key=lambda c: abs(c[1] - end))[0]
            amounts[col] = money(nm.group())
        if t:
            total = {"parcels": money(t.group(1)), **{k.lower(): v for k, v in amounts.items()}}
            break
        rows.append({"code": int(m.group(1)), "parcels": money(m.group(3)), **{k.lower(): v for k, v in amounts.items()}})
    if total is None:
        raise SystemExit("exemption summary total not found")
    for k in ("county", "town", "school"):
        if sum(r[k] for r in rows) != total[k]:
            raise SystemExit(f"exemption {k} amounts add to {sum(r[k] for r in rows)}, the roll says {total[k]}")
    groups: dict[str, dict] = {}
    for r in rows:
        name = next((g for g, test in EXEMPTION_GROUPS if test(r["code"])), "Other exemptions")
        g = groups.setdefault(name, {"name": name, "codes": 0, "parcels": 0, "town": 0, "school": 0})
        g["codes"] += 1
        g["parcels"] += r["parcels"]
        g["town"] += r["town"]
        g["school"] += r["school"]
    return {"total": total, "groups": sorted(groups.values(), key=lambda g: -max(g["town"], g["school"]))}


def summarize(kind: str) -> tuple[dict, list[dict]]:
    meta = ROLLS[kind]
    print(f"Reading the {meta['title']}...")
    lines = roll_text(http_get(meta["url"], meta["title"], accept="application/pdf"))
    head = "\n".join(lines[:12])
    pct = re.search(r"UNIFORM PERCENT OF VALUE IS (\d+\.\d+)", head)
    val = re.search(r"VALUATION DATE-(\w+ \d+, \d{4})", head)
    status = re.search(r"TAXABLE STATUS DATE-(\w+ \d+, \d{4})", head)
    ps = parcels(lines)
    summary = swis_pages(lines)
    grand = grand_totals(summary)
    for s, t in grand["sections"].items():
        rs = [p for p in ps if p["sec"] == s]
        got = (len(rs), sum(p["total"] for p in rs))
        if got != (t["parcels"], t["assessedTotal"]):
            raise SystemExit(f"{kind} roll section {s}: parcels add to {got}, the roll says {(t['parcels'], t['assessedTotal'])}")
    by: dict[str, dict] = defaultdict(lambda: {"parcels": 0, "assessedTotal": 0, "marketValue": 0})
    res: dict[str, dict] = defaultdict(lambda: {"parcels": 0, "assessedTotal": 0, "marketValue": 0})
    for p in ps:
        for bucket in [by[p["cls"][0]]] + ([res[p["cls"]]] if p["cls"][0] == "2" else []):
            bucket["parcels"] += 1
            bucket["assessedTotal"] += p["total"]
            bucket["marketValue"] += p.get("fmv", 0)
    roll = {
        "title": meta["title"],
        "url": meta["url"],
        "uniformPercent": float(pct.group(1)) if pct else None,
        "valuationDate": val.group(1) if val else None,
        "taxableStatusDate": status.group(1) if status else None,
        "grandTotals": grand,
        "byClass": [{"code": c, "name": CLASSES[c], **by[c]} for c in sorted(by)],
        "residential": [{"code": c, "name": RESIDENTIAL.get(c, f"Other residential ({c})"), **res[c]}
                        for c in sorted(res, key=lambda c: -res[c]["parcels"])],
    }
    if kind == "final":
        roll["schoolDistricts"] = school_districts(summary)
        roll["exemptions"] = exemptions(summary)
    return roll, ps


def home_values(ps: list[dict]) -> dict:
    """The spread of full market values of one-family homes (class 210) on the taxable roll, in $100,000 bands."""
    vals = sorted(p["fmv"] for p in ps if p["cls"] == "210" and p["sec"] == "1" and p.get("fmv"))
    bands: dict[int, int] = defaultdict(int)
    for v in vals:
        bands[min(v // 100_000, 20)] += 1
    q = statistics.quantiles(vals, n=4)
    return {
        "count": len(vals),
        "median": round(statistics.median(vals)),
        "lowerQuartile": round(q[0]),
        "upperQuartile": round(q[2]),
        "bands": [{"from": b * 100_000, "to": None if b == 20 else (b + 1) * 100_000, "homes": bands[b]} for b in range(0, 21)],
    }


def main() -> int:
    tentative, _ = summarize("tentative")
    final, final_parcels = summarize("final")
    data = {
        "assessorPage": ASSESSOR_PAGE,
        "note": "Totals only. No owner, address, tax-map number or single parcel's value is published here.",
        "tentative": tentative,
        "final": final,
        "oneFamilyHomes": home_values(final_parcels),
    }
    OUT.write_text(json.dumps(data, indent=1) + "\n")
    g = final["grandTotals"]
    print(f"Wrote {OUT.relative_to(ROOT)}: {g['parcels']:,} parcels, ${g['assessedTotal']:,} assessed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
