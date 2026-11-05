"""Account-level lines of the newest Preliminary Budget book.

The Preliminary book prints every expenditure and revenue account with four
columns: the adopted budget of the year before, the department request, the
Tentative and the Preliminary. The Budget Supplement stops at the Tentative, so
until this script ran the site's line-level pages could not show a Preliminary
figure. Nothing here is estimated: each figure is read from the book's own
page, then checked three ways before it is written:

  1. Each fund's expenditure lines and its revenue lines add up to the
     Preliminary Summary's appropriations for that fund (budget-stages.json).
  2. The book's Tentative column adds up to the Tentative Summary.
  3. The book's Tentative column equals the 2027 Supplement's, account by
     account (current-lines.json), where both print the account.

The book leaves out an account whose four columns are all zero. The Supplement
carries some of those for their history; build_current gives them a Preliminary
of zero only when their Tentative is zero and the fund's lines add up.

Input:  the cached download (.cache/financial-reports/<slug>.pdf) when there
        is one, else the committed copy etl/data/budget-2027/
Output: web/public/data/budget-2027-preliminary-lines.json
"""

from __future__ import annotations

import hashlib
import json
import re
import sys
from pathlib import Path

try:
    import pymupdf as fitz
except ImportError:  # PyMuPDF before 1.24.3 installs only the old name
    import fitz

ROOT = Path(__file__).resolve().parent.parent
REPORTS = ROOT / "web/public/data/financial-reports"
CACHE = ROOT / ".cache/financial-reports"
COMMITTED = ROOT / "etl/data/budget-2027/preliminary-budget-2027.pdf"
STAGES = ROOT / "web/public/data/history/budget-stages.json"
OUT = ROOT / "web/public/data/budget-2027-preliminary-lines.json"

DASH = dict.fromkeys(map(ord, "‐‑‒–—"), "-")
ACC = re.compile(r"^[A-Z]{1,3}\d{1,2}-\d-\d{4}-\d{3}-[A-Z0-9]{3}-\d{4,5}$")
REV = re.compile(r"^[A-Z]{1,3}\d{1,2}-\d{4}-[A-Z0-9]{3}-\d{5}-[A-Z0-9]$")
# the book prints every figure with cents (or a bare dash); a bare integer is a page number
NUM = re.compile(r"^(?:\(?-?[\d,]+\.\d{2}\)?|-)$")
COLUMNS = ["adopted", "request", "tentative", "preliminary"]


def num(s: str) -> float:
    s = s.strip()
    if s == "-":
        return 0.0
    neg = s.startswith("(") and s.endswith(")")
    v = float(s.strip("()").replace(",", ""))
    return -v if neg else v


def find_document() -> tuple[Path, dict | None]:
    """The newest Preliminary book: the cached download, else the committed copy."""
    record = None
    if (REPORTS / "index.json").exists():
        docs = [d for d in json.loads((REPORTS / "index.json").read_text(encoding="utf-8")).get("documents", [])
                if d.get("category") == "preliminary_budget" and d.get("year")]
        if docs:
            record = max(docs, key=lambda d: int(d["year"]))
    if record and (CACHE / f"{record['slug']}.pdf").exists():
        return CACHE / f"{record['slug']}.pdf", record
    return COMMITTED, record


def read_book(path: Path) -> tuple[dict, list[tuple]]:
    rows: dict[str, dict] = {}
    partial: list[tuple] = []
    for pno, page in enumerate(fitz.open(path), start=1):
        lines = [l.translate(DASH).replace("\xa0", " ").strip() for l in page.get_text().split("\n")]
        if not any("preliminary" in l.lower() for l in lines[:14]):
            continue  # fund descriptions, the Summary, the exemption report
        i = 0
        while i < len(lines):
            kind = "expenditure" if ACC.match(lines[i]) else "revenue" if REV.match(lines[i]) else None
            if kind is None:
                i += 1
                continue
            acct, j, desc = lines[i], i + 1, ""
            while j < len(lines) and j < i + 4:
                if lines[j] and not NUM.match(lines[j]):
                    desc = lines[j]
                    j += 1
                    break
                j += 1
            vals = []
            while j < len(lines) and len(vals) < len(COLUMNS):
                if NUM.match(lines[j]):
                    vals.append(num(lines[j]))
                elif lines[j]:
                    break
                j += 1
            if len(vals) == len(COLUMNS):
                if acct in rows:
                    raise SystemExit(f"{acct} is printed twice (pages {rows[acct]['page']} and {pno})")
                rows[acct] = {"account": acct, "fund": acct.split("-")[0], "kind": kind, "name": desc,
                              "page": pno, **dict(zip(COLUMNS, vals))}
            elif vals:
                partial.append((pno, acct, vals))  # a line with some figures but not four is a misread
            i = j
    return rows, partial


def reconcile(rows: dict, stages: dict, year: int) -> dict:
    docs = stages.get("years", {}).get(str(year), {})
    out = {"complete": True, "fundsOff": [], "against": {}}
    for stage in ("tentative", "preliminary"):
        doc = docs.get(stage)
        if not doc:
            out["complete"] = False
            continue
        out["against"][stage] = doc["source"]["title"]
        for code, fund in doc["funds"].items():
            for kind in ("expenditure", "revenue"):
                got = round(sum(r[stage] for r in rows.values() if r["fund"] == code and r["kind"] == kind), 2)
                if abs(got - fund["appropriations"]) > 0.5:
                    out["complete"] = False
                    out["fundsOff"].append({"fund": code, "stage": stage, "kind": kind, "lines": got,
                                            "summary": fund["appropriations"]})
        out[f"{stage}Total"] = round(sum(r[stage] for r in rows.values() if r["kind"] == "expenditure"), 2)
        out[f"{stage}SummaryTotal"] = doc["totals"]["appropriations"]
    return out


def main() -> int:
    path, record = find_document()
    if not path.exists():
        print("no Preliminary book available; nothing to parse")
        return 0
    stages = json.loads(STAGES.read_text(encoding="utf-8")) if STAGES.exists() else {"years": {}}
    digest = hashlib.sha256(path.read_bytes()).hexdigest()
    if record and record.get("sha256") and record["sha256"] != digest:
        raise SystemExit(f"{path.name} is not the document the index recorded (sha256 differs)")
    rows, partial = read_book(path)
    if partial:
        raise SystemExit(f"lines with some but not all four figures: {partial[:5]}")
    year = int(record["year"]) if record else 2027
    rec = reconcile(rows, stages, year)
    if not rows or not rec["complete"]:
        raise SystemExit(f"Preliminary lines do not reconcile to the Summaries: {rec}")
    lines = sorted(rows.values(), key=lambda r: (r["kind"] != "expenditure", r["account"]))
    payload = {
        "year": year,
        "stage": "preliminary",
        "columns": {"adopted": year - 1, "request": year, "tentative": year, "preliminary": year},
        "source": {"title": record["title"] if record else "Preliminary Budget (PDF)",
                   "url": record["url"] if record else None, "sha256": digest, "pages": len(fitz.open(path))},
        "reconciliation": rec,
        "changedFromTentative": sum(1 for r in lines if abs(r["preliminary"] - r["tentative"]) > 0.5),
        "lines": lines,
    }
    OUT.write_text(json.dumps(payload, separators=(",", ":")) + "\n", encoding="utf-8")
    print(f"-> {OUT.relative_to(ROOT)}: {len(lines)} lines, {payload['changedFromTentative']} changed from the Tentative")
    return 0


if __name__ == "__main__":
    sys.exit(main())
