#!/usr/bin/env python3
"""Estimate the cost and potential savings of the Town's 2026 Voluntary
Retirement Incentive Program, grounded in the actual 2025 payroll.

Eligibility (from the executed agreements) is approximated from payroll fields:
  CSEA  — must retire into ERS as a fully vested Tier IV member. The ERS Tier IV
          membership window closed 12/31/2009, so we use CSEA employees hired on
          or before 2009 as the outer-bound eligible pool.
  PBA/SOA — must retire into PFRS with 20 years of NY law-enforcement service, so
          we use police-union employees hired on or before 2006.
These are UPPER bounds: actual eligibility also depends on age / retirement
eligibility, which payroll does not reveal, so the true pool is likely smaller.

Benefit amounts (final language):
  CSEA  — flat $12,500.
  PBA/SOA — $1,000 per year of service, plus a lump sum for up to 30 accrued
          sick days beyond the contract maximum, at the average of 2024-2026
          base salary. We model the 30-day amount as an upper bound (a daily
          rate of base/260); many members will have no excess accrual.

Developer helper (needs xlrd + the source .xls). Output committed as
web/public/data/buyout-analysis.json.

Usage: python etl/analyze_buyout.py "/path/Gross.Earnings.2025.xls"
"""

import json
import sys
from pathlib import Path

import xlrd

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "web/public/data/buyout-analysis.json"
YEAR = 2026


def load(xls_path):
    wb = xlrd.open_workbook(xls_path)
    sh = wb.sheet_by_index(0)
    hdr = [str(sh.cell_value(0, c)).strip() for c in range(sh.ncols)]
    ci = {h: i for i, h in enumerate(hdr)}
    rows = []
    for r in range(1, sh.nrows):
        name = str(sh.cell_value(r, ci["Payroll Name"])).strip()
        if not name or name.lower() == "payroll name":
            continue
        if str(sh.cell_value(r, ci["Position Status"])).strip() != "Active":
            continue
        hv = sh.cell_value(r, ci["Hire Date"])
        try:
            hy = xlrd.xldate.xldate_as_datetime(hv, wb.datemode).year
        except Exception:
            continue
        rows.append({
            "union": str(sh.cell_value(r, ci["Union Code"])).strip(),
            "hire": hy,
            "base": float(sh.cell_value(r, ci["Regular Earnings Total"]) or 0),
        })
    return rows


def build(xls_path):
    active = load(xls_path)
    csea = [e for e in active if e["union"] == "CSE" and e["hire"] <= 2009]
    police = [e for e in active if e["union"] in ("PBA", "SOA") and e["hire"] <= 2006]
    eligible = csea + police

    def avg(g, key="base"):
        return round(sum(e[key] for e in g) / len(g), 2) if g else 0

    csea_inc_each = 12500
    police_service = sum(1000 * (YEAR - e["hire"]) for e in police)
    police_sick_max = sum(30 * (e["base"] / 260) for e in police)
    police_inc_total_max = police_service + police_sick_max
    onetime_max = len(csea) * csea_inc_each + police_inc_total_max

    total_base = sum(e["base"] for e in eligible)
    avg_base = total_base / len(eligible) if eligible else 0

    # Participation x refill scenarios (proportional pool; sick payout at max)
    scenarios = []
    for up in (0.15, 0.30, 0.50, 1.00):
        nc, nppd = round(len(csea) * up), round(len(police) * up)
        cs, po = csea[:nc], police[:nppd]
        onetime = nc * csea_inc_each + sum(1000 * (YEAR - e["hire"]) for e in po) + sum(30 * e["base"] / 260 for e in po)
        base_vac = sum(e["base"] for e in cs + po)
        scenarios.append({
            "uptakePct": int(up * 100),
            "retirees": nc + nppd,
            "oneTimeCost": round(onetime),
            "baseVacatedPerYear": round(base_vac),
            "annualSavings_refillSameCost": 0,
            "annualSavings_refill80": round(base_vac * 0.20),
            "annualSavings_holdVacant": round(base_vac),
        })

    police_inc_each_avg = police_inc_total_max / len(police) if police else 0

    payload = {
        "program": "2026 Voluntary Retirement Incentive Program",
        "basedOn": "Town of Riverhead 2025 Gross Earnings report (active employees, hire dates)",
        "eligibility": {
            "csea": {"count": len(csea), "avgYearsService": round(avg(csea, "hire") and (YEAR - avg(csea, "hire")), 1) if csea else 0,
                     "avgBase": avg(csea), "totalBase": round(sum(e["base"] for e in csea))},
            "police": {"count": len(police), "avgYearsService": round((YEAR - avg(police, "hire")), 1) if police else 0,
                       "avgBase": avg(police), "totalBase": round(sum(e["base"] for e in police))},
            "totalCount": len(eligible),
            "totalAnnualBase": round(total_base),
        },
        "oneTimeCostMax": round(onetime_max),
        "oneTimeBreakdown": {
            "cseaTotal": len(csea) * csea_inc_each,
            "policeServicePay": round(police_service),
            "policeSickDayMax": round(police_sick_max),
        },
        "perRetiree": {
            "cseaIncentive": csea_inc_each,
            "cseaAvgBase": avg(csea),
            "policeAvgIncentive": round(police_inc_each_avg),
            "policeAvgBase": avg(police),
            "avgBaseAllEligible": round(avg_base),
        },
        "breakEvenYears_refill80": {
            "csea": round(csea_inc_each / (avg(csea) * 0.20), 1) if avg(csea) else None,
            "police": round(police_inc_each_avg / (avg(police) * 0.20), 1) if avg(police) else None,
        },
        "scenarios": scenarios,
        "assumptions": [
            "Eligible pool is an upper bound from hire date and union; actual eligibility also requires age / retirement eligibility, so fewer people likely qualify.",
            "Participation is unknown until the September 1, 2026 election deadline; scenarios show 15%, 30%, 50%, and 100% uptake.",
            "Savings use base salary only. Real compensation (benefits ~30%, longevity, overtime) is higher, so salary savings are understated — but retiree health insurance continues, offsetting some of that.",
            "The police sick-day payout is modeled at its 30-day maximum; many members have no excess accrual, so police cost is likely lower.",
            "Accrued leave payouts owed at any separation are not counted as incentive cost (they are owed regardless of the buyout).",
        ],
        "verdict": (
            "Whether the Town saves money depends on what it does with the vacated positions. "
            "The one-time incentive is small next to the salaries: about $12,500 per CSEA retiree and "
            f"~${round(police_inc_each_avg):,} per police retiree, against average base salaries of "
            f"${avg(csea):,.0f} (CSEA) and ${avg(police):,.0f} (police). If positions are refilled at a lower "
            "starting step, the incentive is typically recovered within ~1-2 years and the Town saves every year "
            "after. If positions are held vacant, savings are immediate and large. Only if every position is "
            "refilled at the same cost does the buyout become a pure one-time expense with no salary offset."
        ),
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, indent=1))
    print(f"buyout-analysis.json written.")
    print(f"  Eligible (upper bound): {len(csea)} CSEA + {len(police)} police = {len(eligible)}")
    print(f"  Annual base of eligible: ${total_base:,.0f}")
    print(f"  One-time cost if all participate (max): ${onetime_max:,.0f}")
    print(f"  Break-even @80% refill: CSEA {payload['breakEvenYears_refill80']['csea']}y, police {payload['breakEvenYears_refill80']['police']}y")


if __name__ == "__main__":
    build(sys.argv[1] if len(sys.argv) > 1 else "/Users/bryan/Downloads/Gross.Earnings.2025.xls")
