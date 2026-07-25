#!/usr/bin/env python3
"""Parse the Town of Riverhead Budget Supplements (line-item expenditure and
revenue detail) into a structured, classified per-account dataset.

The Supplement is the granular ledger behind the adopted budget: every account
with multiple years of actuals, adopted budgets, mid-year YTD, department
request, and tentative. The 2026 Supplement carries
  2024 Actual | 2025 Adopted | 2025 YTD (6/30) | 2026 Request | 2026 Tentative
and the 2025 Supplement carries the same shape one year back
  2023 Actual | 2024 Adopted | 2024 YTD (6/30) | 2025 Request | 2025 Tentative
so merging the two by account gives four years of actuals + budgets at line-item
granularity — the actual-vs-budget data the fund drilldown (built from adopted
budgets only) never had.

Every line is classified so downstream code never treats mandated or timing
variance as "recoverable savings":
  - kind:    "expenditure" | "revenue"
  - control: "mandated" (pension, workers comp, insurance, debt service, payroll
             taxes, PILOTs) | "personnel" (personal services / salaries) |
             "controllable" (contractual, supplies, equipment, prof services)
  - overBudget2026: 2026 Tentative minus the trailing full-year run-rate
             (max of 2024 Actual and annualized 2025 YTD) — only meaningful for
             controllable expenditure lines; that's where the reduction pool and
             the over-budget outliers come from.

Outputs (web/public/data/budget-supplement/):
  lines.json    — every parsed account with all year columns + classification
  summary.json  — fund/section/control rollups and totals
  outliers.json — data-driven, domain-filtered outliers (controllable
                  over-budget, chronic overrun, spending-with-no-budget)

A line is skipped (not guessed) if it doesn't carry the expected 5 trailing
figures. Nothing here attributes a savings number the source doesn't support.
"""

from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CACHE = ROOT / ".cache/financial-reports"
OUT = ROOT / "web/public/data/budget-supplement"

SOURCES = {
    2026: CACHE / "2026-2026-budget-supplement-pdf.pdf",
    2025: CACHE / "2025-2025-budget-supplement-pdf.pdf",
}

NUM = re.compile(r"-?[\d,]+\.\d{2}")

# Mandated / non-discretionary: variance here is legal obligation or timing, not
# waste. Never counted as a recoverable reduction.
MANDATED = [
    "retirement", "pol ret", "ret -", "nys retirement", "workers comp", "wc -",
    "hosp", "health ins", "hosp, den", "dental", "optical", "insurance", "ins -",
    "bond", "interest expense", "serial bond", "principal", "debt", "b.a.n",
    "social security", "medicare", "unemployment", "disability", "mta",
    "pilot", "appropriated fund", "contingenc",
    # Insurance/liability claim payouts are actuarial obligations, not spending
    # the Board can simply cut like a supply line.
    "claim payments", "gen liab", "judgments", "settlements",
]
PERSONNEL = ["personal services", "pers svcs", "personal svc", "pers serv",
             "longevity", "buy back", "buy-back", "overtime", "pers svc"]


def classify_control(desc: str) -> str:
    d = desc.lower()
    if any(k in d for k in MANDATED):
        return "mandated"
    if any(k in d for k in PERSONNEL):
        return "personnel"
    return "controllable"


def fund_of(account: str) -> str:
    return account.split("-", 1)[0].strip()


def parse_pdf(path: Path):
    """Yield (account, description, [5 floats], section) for each data row."""
    from pypdf import PdfReader

    reader = PdfReader(str(path))
    section = "expenditure"
    for page in reader.pages:
        text = page.extract_text() or ""
        # Determine the section from THIS page's footer before processing its
        # lines — the footer prints at the bottom, so reading it line-by-line
        # would mislabel the whole page it announces (off-by-one).
        low_page = text.lower()
        if "- revenues" in low_page:
            section = "revenue"
        elif "- expenditures" in low_page:
            section = "expenditure"
        for line in text.splitlines():
            if not line.strip() or "Account Number" in line or "Page " in line:
                continue
            nums = NUM.findall(line)
            if len(nums) < 5:
                continue
            m = NUM.search(line)
            head = line[: m.start()].strip()
            if "Total" in head:  # subtotal/total rows, not line items
                continue
            parts = head.split(" ", 1)
            account = parts[0].strip()
            if account.count("-") < 3:  # not a full chart-of-accounts code
                continue
            desc = parts[1].strip() if len(parts) > 1 else ""
            vals = [float(n.replace(",", "")) for n in nums[-5:]]
            yield account, desc, vals, section


def build():
    if not all(p.exists() for p in SOURCES.values()):
        missing = [str(p) for p in SOURCES.values() if not p.exists()]
        raise SystemExit("Missing source supplement PDF(s):\n  " + "\n".join(missing))

    # 2026 supplement is the primary (newest columns); 2025 supplement backfills
    # the older actual/budget/ytd for the same account.
    lines: dict[str, dict] = {}

    for acct, desc, v, section in parse_pdf(SOURCES[2026]):
        a24, b25, ytd25, req26, tent26 = v
        lines[acct] = {
            "account": acct,
            "fund": fund_of(acct),
            "name": desc,
            "kind": section,
            "control": "revenue" if section == "revenue" else classify_control(desc),
            "actual2024": a24,
            "budget2025": b25,
            "ytd2025": ytd25,
            "request2026": req26,
            "tentative2026": tent26,
        }

    for acct, desc, v, section in parse_pdf(SOURCES[2025]):
        a23, b24, ytd24, req25, tent25 = v
        row = lines.get(acct)
        if row is None:
            row = {
                "account": acct, "fund": fund_of(acct), "name": desc,
                "kind": section,
                "control": "revenue" if section == "revenue" else classify_control(desc),
                "actual2024": None, "budget2025": None, "ytd2025": None,
                "request2026": None, "tentative2026": None,
            }
            lines[acct] = row
        row["actual2023"] = a23
        row["budget2024"] = b24
        row["ytd2024"] = ytd24
        row["tentative2025"] = tent25

    rows = list(lines.values())

    # Over-budget signal: 2026 Tentative vs trailing full-year run-rate.
    for r in rows:
        tent = r.get("tentative2026")
        a24 = r.get("actual2024")
        ytd = r.get("ytd2025")
        runrate = None
        if a24 is not None or ytd is not None:
            runrate = max(a24 or 0.0, (ytd or 0.0) * 2)
        r["runRate"] = runrate
        r["overBudget2026"] = (
            round(tent - runrate, 2)
            if (tent is not None and runrate is not None) else None
        )

    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "lines.json").write_text(json.dumps({"lines": rows}, separators=(",", ":")))

    # Summary rollups.
    def total(pred, field="tentative2026"):
        return round(sum((r.get(field) or 0.0) for r in rows if pred(r)), 2)

    exp = [r for r in rows if r["kind"] == "expenditure"]
    summary = {
        "lineCount": len(rows),
        "expenditureLineCount": len(exp),
        "revenueLineCount": sum(1 for r in rows if r["kind"] == "revenue"),
        "tentative2026Expenditures": total(lambda r: r["kind"] == "expenditure"),
        "byControl": {
            c: {
                "lineCount": sum(1 for r in exp if r["control"] == c),
                "tentative2026": total(lambda r, c=c: r["kind"] == "expenditure" and r["control"] == c),
            }
            for c in ("mandated", "personnel", "controllable")
        },
        "sources": ["2026 Budget Supplement (PDF)", "2025 Budget Supplement (PDF)"],
    }
    (OUT / "summary.json").write_text(json.dumps(summary, indent=1))

    # Data-driven, domain-filtered outliers.
    def over_budget_outliers():
        out = []
        for r in exp:
            if r["control"] != "controllable":
                continue
            ob = r.get("overBudget2026")
            tent = r.get("tentative2026") or 0
            rr = r.get("runRate") or 0
            if ob and tent >= 5000 and rr > 0 and tent > rr * 1.30 and ob >= 5000:
                out.append({**pub(r), "flag": "over-budget", "excess": round(ob, 2)})
        out.sort(key=lambda x: x["excess"], reverse=True)
        return out

    def chronic_overrun():
        out = []
        for r in exp:
            a24, b25 = r.get("actual2024"), r.get("budget2025")
            if a24 and b25 and b25 > 0 and a24 > b25 * 1.25 and (a24 - b25) >= 10000:
                out.append({**pub(r), "flag": "chronic-overrun",
                            "excess": round(a24 - b25, 2)})
        out.sort(key=lambda x: x["excess"], reverse=True)
        return out

    def spending_no_budget():
        out = []
        for r in exp:
            # Interfund transfers/debt-service moves legitimately vary year to
            # year and aren't "unbudgeted surprises" — exclude them as noise.
            nm = r["name"].lower()
            if "interfund" in nm or "transfers to" in nm or "trf -" in nm or "transfer" in nm:
                continue
            a24, b25, ytd = r.get("actual2024") or 0, r.get("budget2025") or 0, r.get("ytd2025") or 0
            if b25 == 0 and (a24 >= 10000 or ytd >= 10000):
                out.append({**pub(r), "flag": "no-budget",
                            "excess": round(max(a24, ytd * 2), 2)})
        out.sort(key=lambda x: x["excess"], reverse=True)
        return out

    def pub(r):
        return {
            "account": r["account"], "fund": r["fund"], "name": r["name"],
            "control": r["control"],
            "actual2024": r.get("actual2024"), "budget2025": r.get("budget2025"),
            "ytd2025": r.get("ytd2025"), "tentative2026": r.get("tentative2026"),
        }

    ob = over_budget_outliers()
    outliers = {
        "overBudget": ob,
        "chronicOverrun": chronic_overrun(),
        "noBudget": spending_no_budget(),
        "recoverablePoolControllable": round(sum(x["excess"] for x in ob), 2),
        "note": (
            "Over-budget = 2026 Tentative above the trailing full-year run-rate "
            "(max of 2024 Actual and annualized 2025 YTD), restricted to "
            "controllable non-personnel lines. Mandated costs (pension, workers "
            "comp, insurance, debt service, payroll taxes) and revenue lines are "
            "excluded — their variance is obligation or timing, not waste."
        ),
    }
    (OUT / "outliers.json").write_text(json.dumps(outliers, indent=1))

    print(f"lines: {len(rows)} (exp {len(exp)}, rev {summary['revenueLineCount']})")
    print(f"controllable 2026 tentative: ${summary['byControl']['controllable']['tentative2026']:,.0f}")
    print(f"over-budget controllable outliers: {len(ob)}, "
          f"recoverable pool ${outliers['recoverablePoolControllable']:,.0f}")
    print(f"chronic overruns: {len(outliers['chronicOverrun'])}, "
          f"no-budget spending: {len(outliers['noBudget'])}")


if __name__ == "__main__":
    build()
