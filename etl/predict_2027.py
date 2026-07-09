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
PAYROLL_SUMMARY = ROOT / "web/public/data/payroll/summary.json"
PAYROLL_RECORDS = ROOT / "web/public/data/payroll/records.json"
OUT_SUMMARY = ROOT / "web/public/data/budget-2027-prediction.json"
OUT_LINES = ROOT / "web/public/data/budget-2027-lines.json"

# CSEA Article 15(2) (Wages), fully executed 2026-2029 CBA: each year is a % step increase
# PLUS a flat, non-recurring dollar amount added to every step — and that dollar amount
# carries forward into the base every later year's % is computed from. A flat $1,000 is a much
# bigger raise for a $45k CSEA base salary than for a $90k one, so the headline "%" alone
# understates the true rate; we convert it to an effective % using the union's actual average
# base pay (compounding the dollar adjustments forward year over year).
CSEA_WAGE_TERMS = {
    2026: {"pctStep": 0.020, "flatAdj": 1500},
    2027: {"pctStep": 0.025, "flatAdj": 1000},
    2028: {"pctStep": 0.030, "flatAdj": 500},
    2029: {"pctStep": 0.035, "flatAdj": 0},
}


def csea_effective_rates():
    """Simulate CSEA's Article 15(2) formula forward from actual average CSEA base pay to
    get each year's true effective raise (step % + flat $ as a % of that year's base)."""
    records = json.loads(PAYROLL_RECORDS.read_text())["records"]
    latest_year = max(r["y"] for r in records if r["u"] == "CSE")
    base_pool = [r["r"] for r in records if r["y"] == latest_year and r["u"] == "CSE" and r["r"] > 0]
    starting_base = sum(base_pool) / len(base_pool)
    effective = {}
    base = starting_base
    for year, terms in sorted(CSEA_WAGE_TERMS.items()):
        new_base = base * (1 + terms["pctStep"]) + terms["flatAdj"]
        effective[year] = new_base / base - 1
        base = new_base
    return effective, latest_year, starting_base


CSEA_EFFECTIVE_RATES, CSEA_PAYROLL_YEAR, CSEA_STARTING_BASE = csea_effective_rates()

# Each Riverhead bargaining unit's actual negotiated raises, by contract. Where the
# contract doesn't cover 2027, "rate2027" is left None and computed as that union's own
# trailing geometric-average annual raise (a placeholder until a successor CBA is public).
UNION_CONTRACTS = {
    "CSE": {
        "label": "CSEA",
        "term": "2026–2029 CBA",
        "rates": CSEA_EFFECTIVE_RATES,
        "known2027": True,
        "source": f"Fully executed 2026–2029 CSEA Agreement, Article 15(2) (Wages), signed 12/6/2025. "
                  f"Each year is a step % PLUS a flat, non-recurring dollar add-on that compounds into "
                  f"later years' base (2%+$1,500 in 2026, 2.5%+$1,000 in 2027, 3%+$500 in 2028, 3.5% in "
                  f"2029) — converted here to an effective % using {CSEA_PAYROLL_YEAR} actual average CSEA "
                  f"base pay (${CSEA_STARTING_BASE:,.0f}), so the flat dollars are properly weighted "
                  f"rather than ignored.",
    },
    "PBA": {
        "label": "PBA",
        "term": "2023–2026 MOA (expires 12/31/2026, no successor yet public)",
        "rates": {2023: 0.060, 2024: 0.025, 2025: 0.025, 2026: 0.025},
        "known2027": False,
        "source": "Signed PBA MOA, Article XXXVII (Salaries), 7/25/2023. Full known PBA history back to "
                  "2016 (2%/2%/1.5%/1.5% in 2017–2020, 2%/2% in the 2021–2022 COVID extension per Town "
                  "Board Resolution 2020-519) confirms the contracts are continuous with no gap — but the "
                  "placeholder below still uses only the most recent 2023–2026 contract, as the closer "
                  "starting point for the next negotiation.",
    },
    "SOA": {
        "label": "SOA",
        "term": "2023–2026 agreement (expires 12/31/2026, no successor yet public)",
        "rates": {2023: 0.060, 2024: 0.020, 2025: 0.040, 2026: 0.060},
        "known2027": False,
        "source": "Signed SOA MOA, Article XXXII (Salaries), 12/12/2023. Full known SOA history back to "
                  "2016 (2%/2%/2%/2%/1.5% in 2016–2020, 2%/2% in the 2021–2022 COVID extension per Town "
                  "Board Resolution 2020-520) confirms the contracts are continuous with no gap — but the "
                  "placeholder below still uses only the most recent 2023–2026 contract, as the closer "
                  "starting point for the next negotiation.",
    },
}
NON_UNION_RATE = 0.03  # no CBA governs these (management/confidential, elected, temp); general trend

def _geometric_avg_rate(rates: dict) -> float:
    product = 1.0
    for r in rates.values():
        product *= 1 + r
    return product ** (1 / len(rates)) - 1


def personal_services_rate():
    """Payroll-weighted blend of each union's actual 2027 contract rate (or, for unions
    between contracts, their own trailing average as a placeholder), weighted by each
    group's share of the latest year's actual Town payroll."""
    payroll = json.loads(PAYROLL_SUMMARY.read_text())
    latest = max(payroll["yearSummaries"], key=lambda y: y["year"])
    shares = {row["union"]: row["gross"] for row in latest["byUnion"]}
    total = sum(shares.values())

    breakdown = []
    blended = 0.0
    for code, c in UNION_CONTRACTS.items():
        rate = c["rates"][2027] if c["known2027"] else _geometric_avg_rate(c["rates"])
        weight = shares.get(code, 0.0) / total
        blended += weight * rate
        breakdown.append({
            "union": c["label"], "payrollSharePct": round(weight * 100, 1),
            "ratePct": round(rate * 100, 2), "known2027": c["known2027"],
            "term": c["term"], "source": c["source"],
        })
    other_weight = sum(g for u, g in shares.items() if u not in UNION_CONTRACTS) / total
    blended += other_weight * NON_UNION_RATE
    breakdown.append({
        "union": "Non-union / other (management-confidential, elected, temporary, unspecified)",
        "payrollSharePct": round(other_weight * 100, 1), "ratePct": round(NON_UNION_RATE * 100, 2),
        "known2027": False, "term": None, "source": "No CBA covers these positions.",
    })
    why = (
        "Payroll-weighted blend of each Riverhead bargaining unit's own 2027 terms: CSEA gets its "
        f"contractual {round(UNION_CONTRACTS['CSE']['rates'][2027] * 100, 1)}% (2026–2029 CBA). PBA and SOA "
        "are between contracts — both 2023–2026 agreements expire 12/31/2026 with no successor yet "
        "public — so each uses its own trailing average annual raise as a placeholder. Non-union staff use "
        f"a general {round(NON_UNION_RATE * 100, 1)}% trend assumption. Weighted by each group's share of "
        f"{latest['year']} actual Town payroll. Full breakdown below."
    )
    return blended, why, breakdown, latest["year"]


PS_RATE, PS_WHY, UNION_BREAKDOWN, PAYROLL_YEAR = personal_services_rate()

# Per-category annual growth applied to every 2026 line. Each rate is a rounded,
# defensible read of the recent trend + known 2027 drivers; the recentTrend is
# the actual 2024->2026 change we measured, shown so readers can judge the rate.
ASSUMPTIONS = {
    "Personal Services": {
        "rate": PS_RATE,
        "recentTrend": "+11.3% over 2024–2026 (~5.5%/yr)",
        "why": PS_WHY,
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

    # Does 2027 pierce the tax cap, and what would it take not to?
    cap_base_pct = 0.02
    allowed_levy = round(LEVY_2026 * (1 + cap_base_pct))
    gap = levy_2027 - allowed_levy
    approp_cut_for_1pct = round(approp_2027 / 100)
    reserve_share = round(gap / 33407251 * 100, 1)  # GF fund balance from the 2025 AFR
    cap_gap = {
        "piercesCap": gap > 0,
        "capBasePct": int(cap_base_pct * 100),
        "allowedLevy": allowed_levy,
        "predictedLevy": levy_2027,
        "gap": gap,
        "predictedLevyPct": levy_increase_pct,
        "summary": f"On current trends the 2027 levy grows about {levy_increase_pct}% — well above the roughly "
                   f"{int(cap_base_pct*100)}% the cap allows — so the budget would pierce the cap by about "
                   f"${gap:,}. To stay under the cap the Town would have to close that ~${gap:,} gap. "
                   f"(The real ceiling is a bit higher than a flat 2% once the tax-base-growth factor and "
                   f"exclusions are added, which would shrink the gap somewhat.)",
        "levers": [
            {"lever": "Refill fewer / lower-cost positions (the retirement buyout)",
             "detail": "Realized salary savings from the 2026 buyout flow straight into Personal Services. Our buyout "
                       "model puts this at roughly $0.7M on the positions with a clear entry step, and up to ~$1.8M if "
                       "the eligible police fully turn over — a large share of the gap on its own."},
            {"lever": "Trim or slow spending",
             "detail": f"Every 1% cut to the ${approp_2027:,} spending plan is about ${approp_cut_for_1pct:,}. Closing the "
                       f"whole gap this way means roughly a {round(gap/approp_2027*100,1)}% cut — e.g. holding posts vacant, "
                       "deferring equipment and capital, or trimming contractual lines."},
            {"lever": "Grow non-property-tax revenue",
             "detail": "State aid, mortgage tax, fees, and interest earnings offset the levy dollar-for-dollar. Every "
                       "extra $1M of non-tax revenue is $1M less that has to come from the cap-busting levy."},
            {"lever": "Use reserves (one-time)",
             "detail": f"Appropriating about ${gap:,} more of the ${33407251:,} General Fund balance would erase the gap "
                       f"outright — but it's roughly {reserve_share}% of the cushion, spends one-time money on recurring "
                       "cost, and can't be repeated forever."},
            {"lever": "Claim the cap's legal exclusions",
             "detail": "The cap formula already excludes pension-contribution growth above two percentage points and "
                       "voter-approved capital. Booking those correctly raises the legal ceiling — the opposite of the "
                       "2018–2022 error, when the ceiling was miscalculated the other way."},
            {"lever": "Or override it — but on purpose",
             "detail": "If the Board decides the services are worth it, it can pierce the cap the right way: adopt the "
                       "override local law first, in public, with the 60% vote on the record — as it did in 2023, 2024, "
                       "and 2026. The cap can be exceeded legally; it just has to be a deliberate, disclosed choice."},
        ],
    }

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
        "capGap": cap_gap,
        "unionBreakdown": {
            "note": f"How the Personal Services rate above ({round(PS_RATE * 100, 2)}%/yr) is built: each "
                    f"bargaining unit's own 2027 rate, weighted by its share of {PAYROLL_YEAR} actual Town payroll.",
            "groups": UNION_BREAKDOWN,
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
