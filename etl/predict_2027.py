#!/usr/bin/env python3
"""Build a transparent, assumption-driven 2027 budget PREDICTION, line by line.

This is a MODEL, not the Town's budget. It starts from the 2026 Adopted Budget
line items (etl-parsed into web/public/data/subaccounts/) and grows each line by
a per-category rate. The rates are calibrated to the actual 2024->2026 trend in
each category and to the Town's own stated cost drivers (contractual raises and,
above all, rising health-insurance and pension costs), then rounded to round,
legible assumptions a resident can second-guess.

Every line's predicted change is therefore explainable: predicted 2027 =
2026 adopted x (1 + the rate for that line's category). We publish the rates,
the recent trend that motivates each one, and the full line-by-line result.

Outputs (committed):
  web/public/data/budget-2027-prediction.json   summary: assumptions, totals,
                                                by category, by fund, top movers
  web/public/data/budget-2027-lines.json        every line item, fetched at runtime
"""

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SUB = ROOT / "web/public/data/subaccounts"
OUT_SUMMARY = ROOT / "web/public/data/budget-2027-prediction.json"
OUT_LINES = ROOT / "web/public/data/budget-2027-lines.json"

# Per-category annual growth applied to every 2026 line. Each rate is a rounded,
# defensible read of the recent trend + known 2027 drivers; the recentTrend is
# the actual 2024->2026 change we measured, shown so readers can judge the rate.
ASSUMPTIONS = {
    "Personal Services": {
        "rate": 0.035,
        "recentTrend": "+11.3% over 2024–2026 (~5.5%/yr)",
        "why": "Contractual raises and step increases across the CSEA, PBA and SOA "
               "contracts, partly offset by the 2026 retirement buyout replacing senior "
               "staff with lower-step hires (or holding posts vacant). We use less than the "
               "recent pace because 2024 was inflated by adding five police officers.",
    },
    "Employee Benefits": {
        "rate": 0.080,
        "recentTrend": "+15.5% over 2024–2026 (~7.5%/yr) — the fastest-growing category",
        "why": "Health-insurance premiums and NYS retirement (ERS/PFRS) contributions keep "
               "climbing; the Town itself named these as the main driver of recent increases. "
               "A wave of buyout retirements also adds lifetime retiree-health (OPEB) cost.",
    },
    "Contractual": {
        "rate": 0.035,
        "recentTrend": "+8.5% over 2024–2026 (~4.2%/yr)",
        "why": "General inflation on services, utilities, fuel, and insurance the Town buys.",
    },
    "Equipment & Capital Outlay": {
        "rate": 0.030,
        "recentTrend": "+7.1% over 2024–2026 (~3.5%/yr)",
        "why": "Vehicle and equipment costs rise with inflation; capital timing is lumpy year to year.",
    },
    "Interfund / Transfers": {
        "rate": 0.030,
        "recentTrend": "+11.5% over 2024–2026 (~5.6%/yr)",
        "why": "Transfers between funds are policy choices; we hold near inflation absent a stated plan.",
    },
    "Other": {
        "rate": 0.000,
        "recentTrend": "−6.6% over 2024–2026",
        "why": "A mix of debt service and contingency that has been flat-to-declining; held flat "
               "without a published 2027 debt schedule.",
    },
}
DEFAULT_RATE = 0.03

# Levy estimate assumption: non-property-tax revenue (state aid, fees, grants,
# reserves) grows modestly and the property-tax levy balances the rest.
NONLEVY_REVENUE_GROWTH = 0.02


def load_lines():
    idx = json.loads((SUB / "index.json").read_text())
    fund_names = {f["code"]: f["name"] for f in idx["funds"]}
    lines = []
    for f in idx["funds"]:
        p = SUB / f"{f['code']}.json"
        if not p.exists():
            continue
        fund = json.loads(p.read_text())
        for dept in fund["departments"]:
            for it in dept["lineItems"]:
                hist = {str(h["year"]): h["value"] for h in it.get("history", [])}
                v2026 = hist.get("2026")
                if v2026 is None:
                    continue
                lines.append({
                    "fundCode": fund["code"],
                    "fund": fund_names.get(fund["code"], fund["code"]),
                    "dept": dept["name"],
                    "account": it["account"],
                    "name": it["name"],
                    "category": it["category"],
                    "v2025": hist.get("2025"),
                    "v2026": v2026,
                })
    return lines


def build():
    lines = load_lines()
    total_2026 = total_2027 = 0.0
    by_cat = {}
    by_fund = {}
    out_lines = []
    for ln in lines:
        cat = ln["category"]
        rate = ASSUMPTIONS.get(cat, {}).get("rate", DEFAULT_RATE)
        v26 = ln["v2026"]
        v27 = round(v26 * (1 + rate))
        delta = v27 - v26
        total_2026 += v26
        total_2027 += v27
        c = by_cat.setdefault(cat, {"v2026": 0.0, "v2027": 0.0, "count": 0})
        c["v2026"] += v26; c["v2027"] += v27; c["count"] += 1
        fk = ln["fundCode"]
        fu = by_fund.setdefault(fk, {"fund": ln["fund"], "v2026": 0.0, "v2027": 0.0})
        fu["v2026"] += v26; fu["v2027"] += v27
        out_lines.append({**ln, "rate": rate, "v2027": v27, "delta": delta,
                          "pct": round((v27 / v26 - 1) * 100, 1) if v26 else None})

    # Levy pressure estimate (2026 town-wide appropriations vs levy from all-funds).
    APPROP_2026 = 121110904
    LEVY_2026 = 65343939
    nonlevy_2026 = APPROP_2026 - LEVY_2026
    approp_2027 = round(total_2027)          # our modeled appropriations
    nonlevy_2027 = round(nonlevy_2026 * (1 + NONLEVY_REVENUE_GROWTH))
    levy_2027 = approp_2027 - nonlevy_2027
    levy_increase_pct = round((levy_2027 / LEVY_2026 - 1) * 100, 1)

    movers = sorted(out_lines, key=lambda x: -x["delta"])[:30]

    summary = {
        "disclaimer": "This is an independent projection, not the Town's budget. It grows the "
                      "2026 Adopted Budget line by line using the per-category assumptions below. "
                      "Real 2027 figures will differ; treat this as a transparent baseline to test, "
                      "not a forecast to bank on.",
        "method": "Predicted 2027 = 2026 Adopted × (1 + the growth rate for that line's category). "
                  "Rates are calibrated to each category's actual 2024–2026 trend and the Town's "
                  "stated cost drivers, then rounded to assumptions you can second-guess.",
        "assumptions": [
            {"category": k, "ratePct": round(v["rate"] * 100, 1), **{kk: v[kk] for kk in ("recentTrend", "why")}}
            for k, v in ASSUMPTIONS.items()
        ],
        "totals": {
            "appropriations2026": round(total_2026),
            "appropriations2027": round(total_2027),
            "delta": round(total_2027 - total_2026),
            "pct": round((total_2027 / total_2026 - 1) * 100, 2),
            "lineItems": len(out_lines),
        },
        "levyEstimate": {
            "note": "Illustrative only. Assumes non-property-tax revenue (state aid, fees, grants, "
                    f"reserves) grows {int(NONLEVY_REVENUE_GROWTH*100)}% and the property-tax levy balances the rest. "
                    "The real levy also depends on revenue and reserve choices the Board makes.",
            "levy2026": LEVY_2026,
            "levy2027": levy_2027,
            "levyIncreasePct": levy_increase_pct,
            "appropriations2027": approp_2027,
            "nonLevyRevenueGrowthPct": int(NONLEVY_REVENUE_GROWTH * 100),
            "recentLevyIncreases": "For context, the town-wide levy rose 4.86% (2024) and 7.74% (2026).",
        },
        "byCategory": [
            {"category": k, "count": v["count"], "v2026": round(v["v2026"]), "v2027": round(v["v2027"]),
             "delta": round(v["v2027"] - v["v2026"]), "pct": round((v["v2027"] / v["v2026"] - 1) * 100, 1)}
            for k, v in sorted(by_cat.items(), key=lambda x: -(x[1]["v2027"] - x[1]["v2026"]))
        ],
        "byFund": [
            {"fundCode": k, "fund": v["fund"], "v2026": round(v["v2026"]), "v2027": round(v["v2027"]),
             "delta": round(v["v2027"] - v["v2026"]), "pct": round((v["v2027"] / v["v2026"] - 1) * 100, 1)}
            for k, v in sorted(by_fund.items(), key=lambda x: -(x[1]["v2027"] - x[1]["v2026"]))
        ],
        "topMovers": [
            {"fund": m["fund"], "dept": m["dept"], "name": m["name"], "category": m["category"],
             "v2026": m["v2026"], "v2027": m["v2027"], "delta": m["delta"], "pct": m["pct"]}
            for m in movers
        ],
        "source": "Built from the Town of Riverhead 2026 Adopted Budget line items (etl/parse_subaccounts.py).",
    }

    OUT_SUMMARY.write_text(json.dumps(summary, indent=1))
    OUT_LINES.write_text(json.dumps({"lines": out_lines}, separators=(",", ":")))
    print("2027 prediction written.")
    print(f"  line items: {len(out_lines)}")
    print(f"  appropriations 2026 ${total_2026:,.0f} -> 2027 ${total_2027:,.0f} "
          f"({summary['totals']['pct']:+.2f}%)")
    print(f"  implied levy 2026 ${LEVY_2026:,} -> 2027 ${levy_2027:,} ({levy_increase_pct:+.1f}%)")
    print(f"  summary {OUT_SUMMARY.stat().st_size/1024:.0f}KB, lines {OUT_LINES.stat().st_size/1024:.0f}KB")


if __name__ == "__main__":
    build()
