#!/usr/bin/env python3
"""Extract the full Fund -> Department -> Category -> account line-item
hierarchy from the parsed 2026 Adopted Budget JSON.

The Adopted Budget expenditure/revenue pages carry a NYS-style chart of
accounts. Each detail line looks like:

    A01-1-1320-436-000-00000 Auditor - Prof Svcs - Consultants 195,000.0 0 195,000.00 195,000.00 195,000.00 195,000.00

with five trailing money columns:
    Adopted 2025 | Dept Requested 2026 | Tentative 2026 | Preliminary 2026 | Adopted 2026

Header lines (object segment 000 or *-CAPS) name the department / category and
carry no money. Subtotal / "#### Total" lines are roll-ups we recompute.

Output: web/public/data/subaccounts/<FUND>.json plus index.json + meta.json.
"""

import json
import re
from collections import OrderedDict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "web/public/data/financial-reports/documents/2026-2026-adopted-budget.json"
OUT = ROOT / "web/public/data/subaccounts"

SOURCE_DOC = {
    "title": "2026 Adopted Budget",
    "url": "https://www.townofriverheadny.gov/DocumentCenter/View/2967/2026-Adopted-Budget",
}

# Friendly fund names (matches lib/all-funds.ts)
FUND_NAMES = {
    "A01": "General Fund",
    "A04": "Police Athletic League",
    "A06": "Recreation Program Fund",
    "CM1": "Business Improvement District",
    "CM2": "East Creek Docking Facility",
    "CM4": "Community Preservation Fund",
    "DA1": "Highway Fund",
    "ES1": "Riverhead Sewer District",
    "ES3": "Calverton Sewer District",
    "ES5": "Riverhead Scavenger Waste",
    "EW1": "Water District",
    "MS1": "Workers Compensation Fund",
    "MS2": "Risk Retention Fund",
    "SL1": "Street Lighting District",
    "SM1": "Ambulance District",
    "SR1": "Refuse and Garbage District",
    "ST1": "Public Parking District",
    "V01": "Debt Service Fund",
    "Z14": "Calverton Parks Community Development Agency",
}

COLUMNS = ["adopted2025", "deptRequested2026", "tentative2026", "preliminary2026", "adopted2026"]

# Official 2026 appropriations from the Summary page (for reconciliation checks).
OFFICIAL_APPROPRIATIONS_2026 = {
    "A01": 69113159, "A04": 81490, "A06": 504500, "CM1": 144136, "CM2": 288100,
    "CM4": 2979300, "DA1": 7919250, "ES1": 8142722, "ES3": 1488357, "ES5": 2231988,
    "EW1": 11008655, "MS1": 1050000, "MS2": 450000, "SL1": 926533, "SM1": 2388824,
    "SR1": 5254540, "ST1": 207100, "V01": 6888150, "Z14": 44100,
}

# Expenditure account: FUND-1-FUNCTION-OBJECT-SUB-XXXXX
EXP_RE = re.compile(r"^([A-Z]{1,2}\d{1,2})-(\d)-(\d{4})-([A-Z0-9]{3})-([A-Z0-9]{3})-(\w+)\b")
# Revenue account: FUND-CODE-SUB-XXXXX-LETTER  (e.g. A01-1001-001-00000-A)
REV_RE = re.compile(r"^([A-Z]{1,2}\d{1,2})-(\d{3,4})-([A-Z0-9]{3})-(\w+)-([A-Z0-9])\b")


def object_category(obj):
    """Map a NYS object code to a spending category."""
    try:
        hundreds = int(obj) // 100
    except ValueError:
        return "Other"
    return {
        1: "Personal Services",
        2: "Equipment & Capital Outlay",
        4: "Contractual",
        8: "Employee Benefits",
        9: "Interfund / Transfers",
    }.get(hundreds, "Other")


def repair_money(tokens):
    """The OCR sometimes splits a value like 195,000.00 into '195,000.0' + '0'.
    Re-join trailing decimal fragments and parse into floats."""
    fixed = []
    for tok in tokens:
        if fixed and re.fullmatch(r"\d{1,2}", tok) and re.search(r"\.\d$", fixed[-1]):
            fixed[-1] = fixed[-1] + tok
        else:
            fixed.append(tok)
    out = []
    for tok in fixed:
        t = tok.replace(",", "")
        if re.fullmatch(r"-?\d+(\.\d+)?", t):
            out.append(round(float(t), 2))
    return out


def split_line(line):
    """Split an account line into (account, description, [money...])."""
    parts = line.split()
    if not parts:
        return None
    account = parts[0]
    # money tokens look like 1,234.00 / 0.00 / 195,000.0 / bare '0' fragments / '-'
    money_tok = []
    i = len(parts)
    while i > 1:
        tok = parts[i - 1]
        if re.fullmatch(r"-?\$?[\d,]+(\.\d+)?", tok) or tok in ("-", "$"):
            money_tok.insert(0, tok.strip("$"))
            i -= 1
        else:
            break
    desc = " ".join(parts[1:i]).strip(" -")
    money = repair_money(money_tok)
    return account, desc, money


def get_pages(text_type):
    data = json.loads(SRC.read_text())
    for page in data["pages"]:
        lines = [l.rstrip() for l in page["text"].split("\n")]
        header = " ".join(lines[:4]).upper()
        if text_type == "expenditures" and "EXPENDITURES" in header:
            yield page["page"], lines
        if text_type == "revenue" and "REVENUE" in header and "EXPENDITURES" not in header:
            yield page["page"], lines


def parse_expenditures():
    """Return {fund: {departments: [...]}} for expenditure accounts."""
    funds = OrderedDict()
    cur_fund = cur_dept = cur_cat = None

    for page, lines in get_pages("expenditures"):
        for raw in lines:
            line = raw.strip()
            if not line:
                continue
            m = EXP_RE.match(line)
            if not m:
                continue
            fund_code, _ledger, function, obj, sub, _tail = m.groups()
            account, desc, money = split_line(line)

            fund = funds.setdefault(fund_code, OrderedDict())
            depts = fund.setdefault("_depts", OrderedDict())

            # Department header: object 000 sub 000 with NO money -> "Dept - Dept Name".
            # The same 000-000 pattern WITH money is a real line (e.g. interfund
            # transfers / fund-balance contributions), so only treat it as a header
            # when no amounts are present.
            if obj == "000" and sub == "000" and not money:
                cur_fund = fund_code
                cur_dept = function
                dept = depts.setdefault(function, {
                    "code": function,
                    "name": desc.split(" - ")[-1] if " - " in desc else desc,
                    "categories": OrderedDict(),
                    "lineItems": [],
                })
                cur_cat = None
                continue

            if cur_dept != function:
                # detail line without a seen header -> synthesize a department
                cur_dept = function
                cur_cat = None
                depts.setdefault(function, {
                    "code": function,
                    "name": desc.split(" - ")[0] if " - " in desc else f"Function {function}",
                    "categories": OrderedDict(),
                    "lineItems": [],
                })
            dept = depts[function]

            # Category header (e.g. "Police-PERSONAL SVC", "Auditor-CONTRACTUAL"):
            # no money and the trailing segment after the last hyphen is upper-case.
            if not money:
                tail = desc.split("-")[-1].strip()
                if tail and tail.upper() == tail and any(c.isalpha() for c in tail):
                    cur_cat = object_category(obj)
                # header-only / stub line — nothing to record
                continue

            cols = {col: (money[idx] if idx < len(money) else None) for idx, col in enumerate(COLUMNS)}
            item = {
                "account": account,
                "name": desc,
                "category": object_category(obj),
                **cols,
            }
            dept["lineItems"].append(item)

    return funds


def parse_revenue():
    """Return {fund: [revenue line items]}."""
    rev = OrderedDict()
    for page, lines in get_pages("revenue"):
        for raw in lines:
            line = raw.strip()
            m = REV_RE.match(line)
            if not m:
                continue
            fund_code = m.group(1)
            account, desc, money = split_line(line)
            if not money:
                continue
            cols = {col: (money[idx] if idx < len(money) else None) for idx, col in enumerate(COLUMNS)}
            rev.setdefault(fund_code, []).append({"account": account, "name": desc, **cols})
    return rev


def build():
    exp = parse_expenditures()
    rev = parse_revenue()

    OUT.mkdir(parents=True, exist_ok=True)
    index = []

    for fund_code, fund in exp.items():
        departments = []
        for dcode, dept in fund["_depts"].items():
            items = dept["lineItems"]
            if not items:
                continue
            dept_adopted2026 = sum(i["adopted2026"] or 0 for i in items)
            dept_adopted2025 = sum(i["adopted2025"] or 0 for i in items)
            # category rollups
            cat_totals = OrderedDict()
            for i in items:
                cat_totals[i["category"]] = cat_totals.get(i["category"], 0.0) + (i["adopted2026"] or 0)
            departments.append({
                "code": dcode,
                "name": dept["name"],
                "adopted2025": round(dept_adopted2025, 2),
                "adopted2026": round(dept_adopted2026, 2),
                "change": round(dept_adopted2026 - dept_adopted2025, 2),
                "categoryTotals": [{"category": k, "adopted2026": round(v, 2)} for k, v in cat_totals.items()],
                "lineItems": items,
                "lineItemCount": len(items),
            })

        departments.sort(key=lambda d: d["adopted2026"], reverse=True)

        revenues = rev.get(fund_code, [])
        fund_payload = {
            "code": fund_code,
            "name": FUND_NAMES.get(fund_code, fund_code),
            "source": SOURCE_DOC,
            "expenditureTotal2026": round(sum(d["adopted2026"] for d in departments), 2),
            "expenditureTotal2025": round(sum(d["adopted2025"] for d in departments), 2),
            "revenueTotal2026": round(sum(r["adopted2026"] or 0 for r in revenues), 2),
            "departmentCount": len(departments),
            "lineItemCount": sum(d["lineItemCount"] for d in departments) + len(revenues),
            "departments": departments,
            "revenues": revenues,
        }
        official = OFFICIAL_APPROPRIATIONS_2026.get(fund_code)
        variance = round(fund_payload["expenditureTotal2026"] - official, 2) if official else None
        fund_payload["officialAppropriations2026"] = official
        fund_payload["reconciliationVariance2026"] = variance
        fund_payload["reconciled"] = bool(official and abs(variance) < 1)
        (OUT / f"{fund_code}.json").write_text(json.dumps(fund_payload, indent=1))
        index.append({
            "code": fund_code,
            "name": fund_payload["name"],
            "expenditureTotal2026": fund_payload["expenditureTotal2026"],
            "officialAppropriations2026": official,
            "reconciliationVariance2026": variance,
            "reconciled": fund_payload["reconciled"],
            "revenueTotal2026": fund_payload["revenueTotal2026"],
            "departmentCount": fund_payload["departmentCount"],
            "lineItemCount": fund_payload["lineItemCount"],
        })

    index.sort(key=lambda f: f["expenditureTotal2026"], reverse=True)
    (OUT / "index.json").write_text(json.dumps({
        "source": SOURCE_DOC,
        "generatedFrom": SRC.name,
        "fundCount": len(index),
        "totalLineItems": sum(f["lineItemCount"] for f in index),
        "funds": index,
    }, indent=1))

    print(f"Wrote {len(index)} funds to {OUT}")
    for f in index:
        flag = "OK " if f["reconciled"] else f"Δ{f['reconciliationVariance2026']:+,.0f}"
        print(f"  {f['code']:>4}  {f['name']:<42} depts={f['departmentCount']:>3} "
              f"items={f['lineItemCount']:>4}  exp={f['expenditureTotal2026']:>14,.0f}  {flag}")
    reconciled = sum(1 for f in index if f["reconciled"])
    print(f"\nReconciled to official summary: {reconciled}/{len(index)} funds")


if __name__ == "__main__":
    build()
