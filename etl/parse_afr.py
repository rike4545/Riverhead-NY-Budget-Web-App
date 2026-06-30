#!/usr/bin/env python3
"""Extract actual year-end results from the Town's 2025 Annual Financial Report
(the NYS Annual Update Document / AUD).

Unlike the adopted budget (a plan), the AFR shows what actually happened. Every
total line carries three columns: 2025, 2024, 2023. We capture, per fund:
revenues, expenditures, and ending fund balance; and for the General Fund, the
revenue and expenditure breakdown by OSC functional category plus the
fund-balance classifications.

Output: web/public/data/afr/2025.json
Source PDF committed at etl/data/afr/afr-2025.pdf for reproducibility.
"""

import json
import re
from pathlib import Path

import pypdf

ROOT = Path(__file__).resolve().parent.parent
PDF = ROOT / "etl/data/afr/afr-2025.pdf"
OUT = ROOT / "web/public/data/afr"
YEARS = [2025, 2024, 2023]

FUND_NAMES = {
    "A": "General Fund", "CD": "Special Grant", "CM": "Miscellaneous Special Revenue",
    "DA": "Highway (Town-wide)", "ES": "Enterprise Sewer", "EW": "Enterprise Water",
    "H": "Capital Projects", "MS": "Self Insurance", "SL": "Street Lighting Districts",
    "SM": "Special Districts (Misc.)", "SR": "Refuse and Garbage District",
    "ST": "Public Parking District", "TC": "Custodial", "V": "Debt Service",
}

# OSC top-level categories we surface for the General Fund (avoids sub-line noise).
REVENUE_CATEGORIES = [
    "Property Taxes", "Property Tax Items", "Non-Property Tax Items", "Departmental Income",
    "Intergovernmental Charges", "Use of Money and Property", "Licenses and Permits",
    "Fines and Forfeitures", "Sales of Property and Compensation for Loss", "Other Revenues",
    "State Aid", "Federal Aid",
]
EXPENDITURE_CATEGORIES = [
    "General Government Support", "Public Safety", "Health", "Transportation",
    "Economic Assistance and Opportunity", "Culture and Recreation",
    "Home and Community Services", "Employee Benefits", "Debt Service",
]
FUND_BALANCE_CLASSES = ["Nonspendable", "Restricted", "Committed", "Assigned", "Unassigned"]

MONEY = re.compile(r"-?\$[\d,]+\.\d{2}")
FUND_HDR = re.compile(r"^([A-Z]{1,2}) - [A-Z]")


def amounts(line):
    vals = [float(m.replace("$", "").replace(",", "")) for m in MONEY.findall(line)]
    return vals[:3] if len(vals) >= 3 else None


def cols(vals):
    return {str(y): vals[i] for i, y in enumerate(YEARS)} if vals else None


def build():
    text = "\n".join((p.extract_text() or "") for p in pypdf.PdfReader(str(PDF)).pages)
    lines = text.split("\n")

    funds = {}
    cur = None
    mode = None  # 'rev' | 'exp' | None — which Results-of-Operations subsection

    for raw in lines:
        line = raw.strip()
        if not line or "....." in line:  # skip blanks and table-of-contents leaders
            continue

        m = FUND_HDR.match(line)
        if m and m.group(1) in FUND_NAMES:
            code = m.group(1)
            if code != cur:
                cur = code
                mode = None
            funds.setdefault(code, {"code": code, "name": FUND_NAMES[code],
                                    "revenueCategories": {}, "expenditureCategories": {},
                                    "fundBalanceClasses": {}})
            continue
        if cur is None:
            continue

        low = line.lower()
        if low.startswith("revenues and other sources") or low == "revenues":
            mode = "rev"
        elif low.startswith("expenditures and other uses") or low == "expenditures":
            mode = "exp"

        f = funds[cur]
        vals = amounts(line)
        if not vals:
            continue

        # Fund-level grand totals
        if line.startswith("Total for Revenues and Other Sources"):
            f["revenuesAndSources"] = cols(vals)
        elif line.startswith("Total for Revenues "):
            f.setdefault("revenues", cols(vals))
        elif line.startswith("Total for Expenditures and Other Uses"):
            f["expendituresAndUses"] = cols(vals)
        elif line.startswith("Total for Expenditures "):
            f.setdefault("expenditures", cols(vals))
        elif line.startswith("Total for Fund Balance "):
            f["fundBalance"] = cols(vals)

        # Category detail (General Fund only, to keep the dataset focused)
        if cur == "A":
            mt = re.match(r"^Total for (.+?) \$", line)
            if mt:
                name = mt.group(1).strip()
                if mode == "rev" and name in REVENUE_CATEGORIES:
                    f["revenueCategories"].setdefault(name, cols(vals))
                elif mode == "exp" and name in EXPENDITURE_CATEGORIES:
                    f["expenditureCategories"].setdefault(name, cols(vals))
                for cls in FUND_BALANCE_CLASSES:
                    if name == f"{cls} Fund Balance":
                        f["fundBalanceClasses"].setdefault(cls, cols(vals))

    # Assemble output, computing surplus/deficit per fund.
    fund_list = []
    for code in FUND_NAMES:
        f = funds.get(code)
        if not f:
            continue
        rev = f.get("revenuesAndSources") or f.get("revenues")
        exp = f.get("expendituresAndUses") or f.get("expenditures")
        surplus = None
        if rev and exp:
            surplus = {y: round(rev[y] - exp[y], 2) for y in rev}
        fund_list.append({
            "code": code, "name": f["name"],
            "revenues": rev, "expenditures": exp, "surplus": surplus,
            "fundBalance": f.get("fundBalance"),
            "revenueCategories": [{"category": k, **{"values": v}} for k, v in f["revenueCategories"].items()],
            "expenditureCategories": [{"category": k, **{"values": v}} for k, v in f["expenditureCategories"].items()],
            "fundBalanceClasses": [{"class": k, **{"values": v}} for k, v in f["fundBalanceClasses"].items()],
        })

    OUT.mkdir(parents=True, exist_ok=True)
    payload = {
        "source": {"title": "2025 Annual Financial Report (NYS Annual Update Document)",
                   "url": "https://www.townofriverheadny.gov/206/Financial-Reports"},
        "fiscalYear": 2025,
        "years": YEARS,
        "note": "Actual year-end results filed with the NYS Office of the State Comptroller. "
                "Columns are 2025, 2024, and 2023. 'And Other Sources/Uses' totals include interfund transfers.",
        "funds": fund_list,
    }
    (OUT / "2025.json").write_text(json.dumps(payload, indent=1))

    gf = next(f for f in fund_list if f["code"] == "A")
    print(f"Funds parsed: {len(fund_list)}")
    print(f"General Fund 2025: revenues+sources {gf['revenues']['2025']:,.0f}, "
          f"expenditures+uses {gf['expenditures']['2025']:,.0f}, "
          f"surplus {gf['surplus']['2025']:,.0f}, fund balance {gf['fundBalance']['2025']:,.0f}")
    print(f"  revenue categories: {len(gf['revenueCategories'])}, "
          f"expenditure categories: {len(gf['expenditureCategories'])}, "
          f"fund-balance classes: {len(gf['fundBalanceClasses'])}")
    for f in fund_list:
        fb = f["fundBalance"]["2025"] if f["fundBalance"] else None
        print(f"  {f['code']:>2} {f['name']:<32} rev={_fmt(f['revenues'])} exp={_fmt(f['expenditures'])} fb={fb if fb is None else f'{fb:,.0f}'}")


def _fmt(c):
    return f"{c['2025']:,.0f}" if c else "—"


if __name__ == "__main__":
    build()
