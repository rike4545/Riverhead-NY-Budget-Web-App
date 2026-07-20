#!/usr/bin/env python3
"""Extract structured Peconic Bay Community Preservation Fund (CPF) data from
the raw per-page text parse_all_pdfs.py already produces for every financial
report on the Town's Financial Reports page.

Reads web/public/data/financial-reports/documents/*.json for any document
titled "... Peconic Bay Community Preservation Fund ... Financial
Statements/Statement" (excluding the separate "Required Communications"
auditor letters, which don't carry the revenue statement), extracts per-year
transfer-tax revenue, interest income, fund balance, lifetime real-estate
purchases, and outstanding debt, and writes web/public/data/cpf/history.json.

A year is skipped (not guessed) when its PDF has no usable extracted text —
either a scanned image with no text layer, or (until the cryptography package
was added to etl/requirements.txt) an AES-encrypted PDF pypdf couldn't open.
"""

from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DOCS = ROOT / "web/public/data/financial-reports/documents"
INDEX = ROOT / "web/public/data/financial-reports/index.json"
OUT = ROOT / "web/public/data/cpf"

# This document's convention writes amounts as "1,234,567$" (number, then a
# trailing currency sign), not "$1,234,567". The $ is optional on the numeric
# branch: multi-line totals (e.g. "beginning of year" balances, mid-schedule
# debt rows) often carry no currency sign at all, only the line's own final
# figure does. "-$" (a zero/none placeholder) requires the $ specifically —
# without it, a bare "-" used as ordinary punctuation (e.g. "Fund balance -
# beginning of year") would be misread as a zero-value match.
MONEY = re.compile(r"(?:-\$)|(\d[\d,]*(?:\.\d{2})?)\$?")
DEBT_ROW = re.compile(
    r"^(Refunding bonds|Serial bonds|Bond Anticipation Notes?)\s+(\d{4})\s+"
    # Trailing $ is inconsistent across rows of a multi-series schedule — only
    # the row(s) a PDF happened to align a floating currency symbol against
    # carry one (e.g. 2019's 3-row schedule: only the first row has a "$").
    r"([\d.]+)%\s*-\s*([\d.]+)%\s+(\d{1,2}/\d{1,2}/\d{2,4})\s+(-|\d[\d,]*)\$?"
)


def money(raw: str) -> float:
    return 0.0 if raw in ("-", "") else float(raw.replace(",", ""))


def find_amounts(line: str) -> list[float]:
    return [money(m) for m in MONEY.findall(line)]


def extract_revenue_statement(text: str) -> dict:
    # Wording/punctuation varies by auditor and year: "Fund Balance, Beginning
    # of Year" (2019, 2025) vs "Fund balance - beginning of year" (2020-2024)
    # — match case-insensitively on the words alone, not exact punctuation.
    result: dict = {}
    for raw in text.split("\n"):
        line = raw.strip()
        low = line.lower()
        if low.startswith("other non-property tax items"):
            vals = find_amounts(line)
            if vals:
                result["transferTaxRevenue"] = vals[0]
        elif low.startswith("interest income"):
            vals = find_amounts(line)
            if vals:
                result["interestIncome"] = vals[0]
        elif low.startswith("fund balance") and "beginning" in low:
            vals = find_amounts(line)
            if vals:
                result["fundBalanceBeginning"] = vals[0]
        elif low.startswith("fund balance") and "end" in low:
            vals = find_amounts(line)
            if vals:
                result["fundBalanceEnd"] = vals[0]
    return result


def extract_real_estate(text: str) -> float | None:
    for raw in text.split("\n"):
        line = raw.strip()
        if line.startswith("Real Estate Purchases"):
            vals = find_amounts(line)
            if len(vals) >= 3:
                return vals[2]  # Beginning, Acquisitions, Ending
            if len(vals) == 1:
                return vals[0]
    return None


def extract_debt(text: str) -> dict | None:
    rows = []
    for raw in text.split("\n"):
        m = DEBT_ROW.match(raw.strip())
        if m:
            rows.append({
                "description": m.group(1),
                "issued": int(m.group(2)),
                "rateLow": float(m.group(3)) / 100,
                "rateHigh": float(m.group(4)) / 100,
                "matures": m.group(5),
                "outstanding": money(m.group(6)),
            })
    if not rows:
        return None
    return {"rows": rows, "totalOutstanding": round(sum(r["outstanding"] for r in rows), 2)}


def year_from_title(title: str) -> int | None:
    m = re.match(r"^(\d{4})", title.strip())
    return int(m.group(1)) if m else None


def is_cpf_financial_statement(title: str) -> bool:
    t = title.lower()
    if "peconic bay community preservation fund" not in t:
        return False
    return "required communications" not in t


def main() -> None:
    index = json.loads(INDEX.read_text(encoding="utf-8"))
    cpf_docs = [d for d in index["documents"] if is_cpf_financial_statement(d["title"])]

    years: dict[int, dict] = {}
    skipped: list[tuple[int | None, str]] = []

    for doc in cpf_docs:
        year = doc.get("year") or year_from_title(doc["title"])
        path = DOCS / f"{doc['slug']}.json"
        if not path.exists():
            skipped.append((year, "missing parsed document file"))
            continue

        data = json.loads(path.read_text(encoding="utf-8"))
        text = "\n".join(p["text"] for p in data.get("pages", []))
        if not text.strip():
            skipped.append((year, "no extracted text (scanned image or decrypt failure)"))
            continue

        revenue = extract_revenue_statement(text)
        if "transferTaxRevenue" not in revenue:
            skipped.append((year, "revenue statement line not found"))
            continue

        entry = {
            "year": year,
            "transferTaxRevenue": revenue.get("transferTaxRevenue"),
            "interestIncome": revenue.get("interestIncome"),
            "fundBalanceBeginning": revenue.get("fundBalanceBeginning"),
            "fundBalanceEnd": revenue.get("fundBalanceEnd"),
            "realEstatePurchasesLifetime": extract_real_estate(text),
            "debt": extract_debt(text),
            "sourceUrl": doc["url"],
            "sourceTitle": doc["title"],
        }
        # A later-processed document for the same year (e.g. a re-issued
        # statement) overwrites an earlier one rather than duplicating it.
        if year is not None:
            years[year] = entry

    history = [years[y] for y in sorted(years)]

    OUT.mkdir(parents=True, exist_ok=True)
    payload = {
        "source": {
            "title": "Town of Riverhead Peconic Bay Community Preservation Fund financial statements",
            "url": "https://www.townofriverheadny.gov/206/Financial-Reports",
        },
        "note": (
            "Transfer-tax revenue, interest income, and fund balance come from the Statement of Revenues, "
            "Expenditures and Changes in Fund Balance; lifetime real-estate purchases from the Schedule of Real "
            "Estate Purchases; outstanding debt from the Schedule of Related Outstanding Debt. Years with no "
            "usable extracted text are omitted rather than guessed."
        ),
        "years": history,
    }
    (OUT / "history.json").write_text(json.dumps(payload, indent=1), encoding="utf-8")

    print(f"CPF years extracted: {len(history)} -> {[y['year'] for y in history]}")
    if skipped:
        print(f"Skipped {len(skipped)}: {skipped}")
    for y in history:
        debt_total = y["debt"]["totalOutstanding"] if y["debt"] else None
        fb = y["fundBalanceEnd"]
        fb_display = f"{fb:,.0f}" if fb is not None else "—"
        print(
            f"  {y['year']}: revenue={y['transferTaxRevenue']:,.0f} "
            f"fundBalanceEnd={fb_display} debt={debt_total}"
        )


if __name__ == "__main__":
    main()
