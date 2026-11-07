"""Grant money the Town of Riverhead received, 2018 to the latest year filed, for /grants/.

Two official sources:

- The State Comptroller's financial data for local governments (the "level 3"
  file for each year): every revenue account the Town reported in its Annual
  Financial Report. State aid (3000s) and federal aid (4000s) are kept, by
  account. Mortgage tax (3005) and State revenue sharing (3001) are general
  aid every town receives, not grants, so they are kept apart from the grant
  totals.
- The Federal Audit Clearinghouse: the Town's single audit, which lists each
  federal award spent in the year, the program and who passed it through.

Writes web/public/data/grants-received.json. The award-by-award list of
grants the Town Board accepted (grants-awards.json) is hand-curated from the
resolutions and is not written here.

    python3 etl/build_grants.py

If a source cannot be reached, the file stays as it was and the run says so.
"""

from __future__ import annotations

import csv
import io
import json
import os
import sys
import urllib.parse
import urllib.request
import zipfile
from collections import defaultdict
from datetime import date
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from build_election_map import NotPosted, SourceUnavailable, http_get  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "web/public/data/grants-received.json"
FIRST_YEAR = 2018
OSC_PAGE = "https://www.osc.ny.gov/local-government/data"
OSC_ZIP = "https://wwe1.osc.state.ny.us/localgov/findata/level3zip/{year}_all_classes.zip"
ENTITY = "Town of Riverhead"
FAC_API = "https://api.fac.gov"
FAC_SEARCH = "https://app.fac.gov/dissemination/search/"
TOWN_EIN = "116001935"  # from the Town's single audit filing
# Public api.data.gov demonstration key; it is rate-limited, not a secret. A real key can be set in FAC_API_KEY.
FAC_KEY = os.environ.get("FAC_API_KEY", "DEMO_KEY")
GENERAL_AID = {"3001": "State revenue sharing (Aid and Incentives for Municipalities)", "3005": "Mortgage tax"}

def purpose(code: str, category: str) -> str:
    """What the aid paid for, from the fund letters and the State's revenue code.

    The fund says where the money went (water district, sewer district,
    community development, capital projects); the code says what kind of aid.
    """
    fund = "".join(ch for ch in code if ch.isalpha()).upper()
    n = account_digits(code)
    if n in ("3960", "4960"):
        return "Disaster recovery (FEMA and State)"
    if fund == "CD":
        return "Community development (CDBG and HOME housing)"
    if fund.startswith(("EW", "SW")):
        return "Water district"
    if fund.startswith(("ES", "SS", "G")):
        return "Sewer district"
    if n in ("3501", "3591", "3597") or "Transportation" in category:
        return "Roads and highways"
    if n in ("3772", "4772"):
        return "Senior programs"
    if n.startswith(("33", "43")):
        return "Police and public safety"
    if n.startswith(("38", "48")) or "Culture" in category:
        return "Parks, youth and recreation"
    if n.startswith(("37", "47")) or "Economic" in category:
        return "Economic development"
    if fund == "A" and n == "4089":
        return "Other federal aid (in 2025, the ARPA recovery funds)"
    return "Other State and federal aid"



def account_digits(code: str) -> str:
    """'CD4089' -> '4089': the State's revenue code without the fund letters."""
    return "".join(ch for ch in code if ch.isdigit())


def osc_year(year: int) -> dict | None:
    try:
        raw = http_get(OSC_ZIP.format(year=year), f"Comptroller data {year}", accept="application/zip,*/*")
    except NotPosted:
        return None
    with zipfile.ZipFile(io.BytesIO(raw)) as z:
        name = next((n for n in z.namelist() if n.lower().endswith("_town.csv")), None)
        if not name:
            return None
        text = z.read(name).decode("utf-8-sig", errors="replace")
    rows = [r for r in csv.DictReader(io.StringIO(text))
            if (r.get("ENTITY_NAME") or "").strip() == ENTITY and r.get("ACCOUNT_CODE_SECTION") == "REVENUE"
            and r.get("LEVEL_1_CATEGORY") in ("State Aid", "Federal Aid")]
    if not rows:
        return None
    accounts, general = [], []
    for r in rows:
        amount = round(float(r.get("AMOUNT") or 0), 2)
        if not amount:
            continue
        item = {"code": r["ACCOUNT_CODE"], "name": r["ACCOUNT_CODE_NARRATIVE"].strip(), "level": r["LEVEL_1_CATEGORY"],
                "category": r["LEVEL_2_CATEGORY"], "amount": amount}
        if r["LEVEL_1_CATEGORY"] == "State Aid" and account_digits(r["ACCOUNT_CODE"]) in GENERAL_AID:
            general.append(item)
        else:
            item["purpose"] = purpose(r["ACCOUNT_CODE"], r["LEVEL_2_CATEGORY"])
            accounts.append(item)
    state = round(sum(a["amount"] for a in accounts if a["level"] == "State Aid"), 2)
    federal = round(sum(a["amount"] for a in accounts if a["level"] == "Federal Aid"), 2)
    by_purpose: dict[str, float] = defaultdict(float)
    for a in accounts:
        by_purpose[a["purpose"]] += a["amount"]
    return {
        "year": year,
        "state": state,
        "federal": federal,
        "total": round(state + federal, 2),
        "generalAid": round(sum(g["amount"] for g in general), 2),
        "byPurpose": {k: round(v, 2) for k, v in sorted(by_purpose.items(), key=lambda kv: -kv[1])},
        "accounts": sorted(accounts, key=lambda a: -a["amount"]),
        "general": general,
        "snapshot": max((r.get("SNAPSHOT_DATE") or "") for r in rows)[:10],
    }


def fac_get(path: str, params: dict) -> list:
    url = f"{FAC_API}/{path}?{urllib.parse.urlencode(params, safe='.,()*')}"
    req = urllib.request.Request(url, headers={"X-Api-Key": FAC_KEY, "Accept": "application/json", "User-Agent": "RiverheadBudgetLive/1.0"})
    with urllib.request.urlopen(req, timeout=60) as resp:
        return json.loads(resp.read())


def federal_awards() -> list[dict]:
    """Each single audit the Town filed since FIRST_YEAR, with its awards and pass-through entities."""
    audits = fac_get("general", {"auditee_ein": f"eq.{TOWN_EIN}", "audit_year": f"gte.{FIRST_YEAR}",
                                 "select": "report_id,audit_year,total_amount_expended,fac_accepted_date", "order": "audit_year.desc"})
    out = []
    for a in audits:
        rid = a["report_id"]
        awards = fac_get("federal_awards", {"report_id": f"eq.{rid}"})
        passthrough = {p["award_reference"]: p for p in fac_get("passthrough", {"report_id": f"eq.{rid}"})}
        rows = []
        for w in awards:
            pt = passthrough.get(w["award_reference"])
            rows.append({
                "reference": w["award_reference"],
                "listing": f"{w['federal_agency_prefix']}.{w['federal_award_extension']}",
                "program": w["federal_program_name"].strip(),
                "amount": float(w["amount_expended"]),
                "direct": w["is_direct"] == "Y",
                "passThrough": pt["passthrough_name"].strip() if pt else None,
                "passThroughId": pt["passthrough_id"].strip() if pt and pt.get("passthrough_id") else None,
            })
        total = round(sum(r["amount"] for r in rows), 2)
        if abs(total - float(a["total_amount_expended"])) > 1:
            raise SystemExit(f"single audit {rid}: awards add to {total}, the filing says {a['total_amount_expended']}")
        out.append({"year": int(a["audit_year"]), "reportId": rid, "accepted": a["fac_accepted_date"],
                    "total": float(a["total_amount_expended"]), "awards": rows})
    return out


def main() -> int:
    years = []
    try:
        for y in range(FIRST_YEAR, date.today().year):
            d = osc_year(y)
            if d:
                years.append(d)
                print(f"  {y}: State aid {d['state']:,.0f}, federal aid {d['federal']:,.0f}, general aid {d['generalAid']:,.0f}")
        audits = federal_awards()
    except (SourceUnavailable, OSError) as exc:
        print(f"WARNING: a grant source could not be reached; {OUT.name} is unchanged. {exc}", file=sys.stderr)
        return 0
    if len(years) < 7:
        raise SystemExit(f"only {len(years)} years of Comptroller data were read")
    # Where a single audit exists, its federal total must match the federal aid the Town reported to the Comptroller.
    for a in audits:
        y = next((x for x in years if x["year"] == a["year"]), None)
        if y and abs(y["federal"] - a["total"]) > 5:
            raise SystemExit(f"{a['year']}: federal aid in the Comptroller data {y['federal']} differs from the single audit {a['total']}")
    data = {
        "sources": {
            "osc": {"title": "Office of the State Comptroller, Financial Data for Local Governments", "url": OSC_PAGE},
            "fac": {"title": "Federal Audit Clearinghouse, single audit search", "url": FAC_SEARCH},
        },
        "generalAidAccounts": GENERAL_AID,
        "years": years,
        "singleAudits": audits,
    }
    OUT.write_text(json.dumps(data, indent=1) + "\n")
    print(f"Wrote {OUT.relative_to(ROOT)}: {years[0]['year']}–{years[-1]['year']}, {len(audits)} single audit(s).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
