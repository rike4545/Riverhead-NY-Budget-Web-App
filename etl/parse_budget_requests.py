#!/usr/bin/env python3
"""What each department asked for, against what the budget officer recommended.

Every Budget Supplement carries five columns per account:

    actual (two years back) | adopted (last year) | YTD at June 30 (last year)
    | Department Request (this year) | Tentative (this year)

The last two are the only public record of the negotiation behind a budget:
what a department head submitted under Town Law s.104, and what the budget
officer then put in the Tentative under s.106. parse_budget_supplement.py
already extracts the request column, and no page has ever shown it.

That parser is also pinned to two files -- SOURCES = {2026, 2025} -- and names
its fields after years (request2026, tentative2026), so a new Supplement would
be downloaded and never read. This one reads EVERY Supplement present, labels
columns by their position in the cycle rather than by a year, and treats the
newest as current. When the 2027 Supplement arrives it becomes "latest" with
no code change.

The line rules are the existing parser's, so the two reconcile:
  - the section (expenditure / revenue) comes from each page's own footer,
    read before its lines, since the footer announces the page it sits on
  - a data row carries at least five figures with two decimals; the last five
    are the columns
  - subtotal rows ("... Total") and anything that is not a full
    chart-of-accounts code are skipped, not guessed

Reads the documents parse_all_pdfs.py has already committed, so it downloads
nothing and can run inside every deploy.

Input:  web/public/data/financial-reports/{index.json, documents/*.json}
Output: web/public/data/budget-supplement/requests-by-year.json
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
REPORTS = ROOT / "web/public/data/financial-reports"
OUT = ROOT / "web/public/data/budget-supplement/requests-by-year.json"
STAGES = ROOT / "web/public/data/history/budget-stages.json"  # parse_budget_stages.py runs first

sys.path.insert(0, str(Path(__file__).resolve().parent))
from parse_all_pdfs import category  # noqa: E402

NUM = re.compile(r"-?[\d,]+\.\d{2}")
# PDF letter-spacing can push the last decimal digit away from its figure: the
# 2025 Supplement prints uniformed police salaries -- the single largest line in
# the budget -- as "13,534,000.0 0". With one decimal the figure fails NUM, the
# row shows four columns instead of five, and the whole line was dropped,
# leaving the General Fund $13,534,000 short. Every figure in a Supplement
# carries two decimals, so one decimal followed by a lone digit is always this
# artifact. The lookahead refuses to join a digit that begins another figure.
SPLIT_DECIMAL = re.compile(r"(\.\d)\s(\d)(?![\d,])")
# 2020-2024 Supplements separate words with non-breaking spaces and print
# account codes with Unicode hyphens ("A01\u20101\u20101220..."), so without this
# every line failed the hyphen count and those five years parsed to nothing.
# parse_supplement_history.py normalises the same characters.
NORMALISE = str.maketrans({"\u00a0": " ", "\u2010": "-", "\u2011": "-", "\u2012": "-", "\u2013": "-", "\u2014": "-"})
TOP_N = 25  # lines listed per direction per year; totals always cover every line


def parse_supplement(doc_path: Path):
    """Yield (account, description, [actual, adopted, ytd, request, tentative], section)."""
    doc = json.loads(doc_path.read_text(encoding="utf-8"))
    section = "expenditure"
    for page in doc.get("pages", []):
        text = (page.get("text") or "").translate(NORMALISE)
        low = text.lower()
        if "- revenues" in low:
            section = "revenue"
        elif "- expenditures" in low:
            section = "expenditure"
        for line in text.splitlines():
            if not line.strip() or "Account Number" in line or "Page " in line:
                continue
            line = SPLIT_DECIMAL.sub(r"\1\2", line)
            nums = NUM.findall(line)
            if len(nums) < 5:
                continue
            head = line[: NUM.search(line).start()].strip()
            if "Total" in head:
                continue
            parts = head.split(" ", 1)
            account = parts[0].strip()
            if account.count("-") < 3:
                continue
            desc = parts[1].strip() if len(parts) > 1 else ""
            vals = [float(n.replace(",", "")) for n in nums[-5:]]
            yield account, desc, vals, section


def year_summary(year: int, rows: list) -> dict:
    exp = [r for r in rows if r["section"] == "expenditure"]
    rev = [r for r in rows if r["section"] == "revenue"]

    def side(lines):
        req = sum(r["request"] for r in lines)
        ten = sum(r["tentative"] for r in lines)
        cut = [r for r in lines if r["tentative"] < r["request"]]
        raised = [r for r in lines if r["tentative"] > r["request"]]
        return {
            "lines": len(lines),
            "request": round(req, 2),
            "tentative": round(ten, 2),
            "delta": round(ten - req, 2),
            "cutLines": len(cut),
            "cutAmount": round(sum(r["request"] - r["tentative"] for r in cut), 2),
            "raisedLines": len(raised),
            "raisedAmount": round(sum(r["tentative"] - r["request"] for r in raised), 2),
        }

    by_fund: dict = {}
    for r in exp:
        f = by_fund.setdefault(r["fund"], {"request": 0.0, "tentative": 0.0, "lines": 0})
        f["request"] += r["request"]
        f["tentative"] += r["tentative"]
        f["lines"] += 1
    for f in by_fund.values():
        f["request"] = round(f["request"], 2)
        f["tentative"] = round(f["tentative"], 2)
        f["delta"] = round(f["tentative"] - f["request"], 2)

    slim = lambda r: {k: r[k] for k in ("account", "name", "fund", "request", "tentative", "adopted", "actual")}
    moved = [r for r in exp if r["tentative"] != r["request"]]
    return {
        "year": year,
        # Positions in the cycle, so a reader of any year sees what each figure is.
        "columns": {
            "actual": year - 2, "adopted": year - 1, "ytd": year - 1,
            "request": year, "tentative": year,
        },
        "expenditure": side(exp),
        "revenue": side(rev),
        "byFund": dict(sorted(by_fund.items())),
        "largestCuts": [slim(r) for r in sorted(moved, key=lambda r: r["tentative"] - r["request"])[:TOP_N]
                        if r["tentative"] < r["request"]],
        "largestRaises": [slim(r) for r in sorted(moved, key=lambda r: r["request"] - r["tentative"])[:TOP_N]
                          if r["tentative"] > r["request"]],
    }


def reconcile(year: int, summary: dict, stages: dict) -> dict:
    """Does this Supplement add up to the Tentative it accompanies?

    The Supplement's Tentative column and the Tentative budget's Summary page
    are the same budget printed twice, so their totals must agree. When they
    do, every figure drawn from the Supplement can be trusted as complete.
    When they do not, the Supplement parsed with lines missing and its totals
    are withheld rather than published.

    A year with no published Tentative cannot be checked this way. It is marked
    unverified, not complete: an Adopted budget can differ from its Tentative.
    """
    tentative = (stages.get("years", {}).get(str(year)) or {}).get("tentative")
    if not tentative:
        return {"complete": False, "against": None, "reason": "no published Tentative to reconcile against"}
    expected = tentative["totals"]["appropriations"]
    got = summary["expenditure"]["tentative"]
    gap = round(got - expected, 2)
    funds = []
    for code, f in tentative["funds"].items():
        mine = summary["byFund"].get(code, {}).get("tentative", 0.0)
        if abs(mine - f["appropriations"]) >= 1:
            funds.append({"fund": code, "summary": f["appropriations"], "supplement": round(mine, 2)})
    return {
        "complete": abs(gap) < 1 and not funds,
        "against": tentative["source"]["title"],
        "summaryTotal": expected,
        "supplementTotal": got,
        "gap": gap,
        "fundsOff": funds,
    }


def build() -> dict:
    index = json.loads((REPORTS / "index.json").read_text(encoding="utf-8"))
    docs: dict = {}
    for d in index.get("documents", []):
        if category(d.get("title") or "") != "budget_supplement" or not d.get("year"):
            continue
        path = REPORTS / (d.get("json") or f"documents/{d['slug']}.json")
        if path.exists():
            docs.setdefault(int(d["year"]), (d, path))

    stages = json.loads(STAGES.read_text(encoding="utf-8")) if STAGES.exists() else {"years": {}}
    by_year: dict = {}
    for year, (d, path) in sorted(docs.items()):
        rows = []
        for account, desc, v, section in parse_supplement(path):
            rows.append({
                "account": account, "name": desc, "fund": account.split("-", 1)[0], "section": section,
                "actual": v[0], "adopted": v[1], "ytd": v[2], "request": v[3], "tentative": v[4],
            })
        if not rows:
            continue
        s = year_summary(year, rows)
        s["source"] = {"title": d["title"], "url": d["url"]}
        s["reconciliation"] = reconcile(year, s, stages)
        by_year[str(year)] = s

    years = sorted(int(y) for y in by_year)
    complete = [y for y in years if by_year[str(y)]["reconciliation"]["complete"]]
    return {
        "note": (
            "Department Request against Tentative, from each Budget Supplement the Town has "
            "published. A request is what a department head submitted; the Tentative is what "
            "the budget officer recommended. Neither is the adopted budget. Expenditure totals "
            "sum every line and include interfund items."
        ),
        "years": years,
        "latest": years[-1] if years else None,
        # Only a year whose lines add up to its own Tentative is complete. Some
        # older Supplements extract with whole pages missing, and a total built
        # from part of a document is not a smaller total -- it is a wrong one.
        "completeYears": complete,
        "latestComplete": complete[-1] if complete else None,
        "byYear": by_year,
    }


if __name__ == "__main__":
    payload = build()
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, separators=(",", ":")), encoding="utf-8")
    print(f"budget requests: supplements for {payload['years']} (latest {payload['latest']})")
    print(f"  complete (lines add up to their own Tentative): {payload['completeYears']}")
    for y in payload["years"]:
        e = payload["byYear"][str(y)]["expenditure"]
        rc = payload["byYear"][str(y)]["reconciliation"]
        tag = "complete" if rc["complete"] else (f"gap {rc['gap']:+,.0f}" if rc.get("against") else "unverified")
        print(f"  {y}: {e['lines']:>5} lines  request ${e['request']:>14,.0f}  tentative ${e['tentative']:>14,.0f}"
              f"  net {e['delta']:>+12,.0f}  | cut {e['cutLines']:>3} (${e['cutAmount']:>11,.0f})"
              f"  raised {e['raisedLines']:>3} (${e['raisedAmount']:>11,.0f})  [{tag}]")
