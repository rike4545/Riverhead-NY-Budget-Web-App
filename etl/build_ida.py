#!/usr/bin/env python3
"""Build web/public/data/ida.json: the Riverhead Industrial Development Agency's
projects as the agency reports them to the State Authorities Budget Office (ABO).

Source: "Industrial Development Agencies' Project Data" on data.ny.gov
(dataset 9rtk-3fkw), published by the ABO from each IDA's annual PARIS report
under General Municipal Law section 859 and Public Authorities Law section
2800. One row per project per fiscal year; the dataset keeps the last eight
fiscal years.

The rows as downloaded are kept in etl/data/ida/abo-project-data.json, so the
build is reproducible without the network:

    python3 etl/build_ida.py             # download, then build
    python3 etl/build_ida.py --offline   # build from the kept copy

Every figure on the page is the agency's own report, summed. Nothing is
estimated: the jobs are what each company reported to the IDA, which the ABO
publishes as reported, not audited.
"""
import json
import sys
import urllib.parse
import urllib.request
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "etl/data/ida/abo-project-data.json"
OUT = ROOT / "web/public/data/ida.json"

DATASET = "9rtk-3fkw"
AGENCY = "Riverhead Industrial Development Agency"
API = f"https://data.ny.gov/resource/{DATASET}.json"
PAGE = f"https://data.ny.gov/Government-Finance/Industrial-Development-Agencies-Project-Data/{DATASET}"

EXEMPTIONS = [
    ("stateSales", "state_sales_tax_exemption_amount"),
    ("localSales", "local_sales_tax_exemption_amount"),
    ("countyProperty", "county_real_property_tax_exemption_amount"),
    ("localProperty", "local_property_tax_exemption_amount"),
    ("schoolProperty", "school_property_tax_exemption_amount"),
    ("mortgageRecording", "mortgage_recording_tax_exemption_amount"),
]
PILOTS = [
    ("county", "county_pilot_made"),
    ("local", "local_pilot_made"),
    ("school", "school_district_pilot_made"),
]


def num(r, k):
    v = r.get(k)
    return float(v) if v not in (None, "") else 0.0


def download():
    q = urllib.parse.urlencode({"$where": f"authority_name='{AGENCY}'", "$limit": 50000,
                                "$order": "fiscal_year_end_date,project_code"})
    with urllib.request.urlopen(f"{API}?{q}", timeout=120) as resp:
        rows = json.load(resp)
    meta_url = f"https://data.ny.gov/api/views/{DATASET}.json"
    with urllib.request.urlopen(meta_url, timeout=60) as resp:
        meta = json.load(resp)
    if not rows:
        sys.exit(f"build_ida: data.ny.gov returned no rows for {AGENCY}")
    RAW.parent.mkdir(parents=True, exist_ok=True)
    RAW.write_text(json.dumps({
        "dataset": DATASET, "name": meta.get("name"), "publisher": "New York State Authorities Budget Office",
        "rowsUpdatedAt": meta.get("rowsUpdatedAt"), "query": f"authority_name = '{AGENCY}'", "rows": rows,
    }, indent=1) + "\n")
    print(f"build_ida: kept {len(rows)} rows in {RAW.relative_to(ROOT)}")


def build():
    raw = json.loads(RAW.read_text())
    rows = raw["rows"]
    by_project = defaultdict(list)
    years = defaultdict(lambda: defaultdict(float))
    for r in rows:
        y = int(r["fiscal_year_end_date"][:4])
        by_project[r["project_code"]].append(r)
        t = years[y]
        t["projects"] += 1
        for key, col in EXEMPTIONS:
            t[key] += num(r, col)
        for key, col in PILOTS:
            t["pilot_" + key] += num(r, col)
        t["exemptions"] += num(r, "total_exemptions")
        t["pilots"] += num(r, "total_pilot_made")
        t["pilotsDue"] += num(r, "total_pilot_payments_due")
        t["net"] += num(r, "net_exemptions")
        if num(r, "total_exemptions") > 0:
            t["projectsWithBreaks"] += 1
            t["ftesWithBreaks"] += num(r, "current_of_ftes")
            t["ftesBeforeWithBreaks"] += num(r, "of_ftes_before_ida_status")

    projects = []
    for code, rs in by_project.items():
        rs.sort(key=lambda r: r["fiscal_year_end_date"])
        last = rs[-1]
        p = {
            "code": code,
            "name": last["project_name"].strip(),
            "applicant": (last.get("applicant_name") or "").strip(),
            "type": last.get("project_type", ""),
            "purpose": last.get("project_purpose", ""),
            "address": " ".join(x for x in [(last.get("project_address_line_1") or "").strip(), (last.get("project_city") or "").strip().title()] if x),
            "approved": (last.get("date_project_approved") or "")[:10],
            "plannedEnd": int(last["planned_end_year"]) if (last.get("planned_end_year") or "").strip() else None,
            "firstYear": int(rs[0]["fiscal_year_end_date"][:4]),
            "lastYear": int(last["fiscal_year_end_date"][:4]),
            "projectAmount": num(last, "total_project_amount"),
            "bondAmount": num(last, "bond_note_amount"),
            "exemptions": round(sum(num(r, "total_exemptions") for r in rs), 2),
            "pilots": round(sum(num(r, "total_pilot_made") for r in rs), 2),
            "net": round(sum(num(r, "net_exemptions") for r in rs), 2),
            "byType": {key: round(sum(num(r, col) for r in rs), 2) for key, col in EXEMPTIONS},
            "jobsBefore": num(last, "of_ftes_before_ida_status"),
            "jobsPromised": num(last, "original_estimate_of_jobs_to_be_created"),
            "jobsRetainedPromised": num(last, "original_estimate_of_jobs_to_be_retained"),
            "jobsLatest": num(last, "current_of_ftes"),
            "avgSalaryPromised": num(last, "estimated_average_annual_salary_of_jobs_to_be_created") or None,
            "years": {int(r["fiscal_year_end_date"][:4]): {"exemptions": num(r, "total_exemptions"), "pilots": num(r, "total_pilot_made"), "net": num(r, "net_exemptions"), "jobs": num(r, "current_of_ftes")} for r in rs},
        }
        projects.append(p)
    projects.sort(key=lambda p: -p["net"])

    out = {
        "source": {
            "title": "Industrial Development Agencies' Project Data (New York State Authorities Budget Office, data.ny.gov)",
            "url": PAGE, "dataset": DATASET, "rowsUpdatedAt": raw.get("rowsUpdatedAt"),
            "note": "Each IDA reports its projects to the Authorities Budget Office every year. Exemptions are the taxes the agency reports a project did not pay; PILOTs are the payments in lieu of taxes it made; net exemptions are the difference. Jobs are what each company reported, published as reported.",
        },
        "agency": AGENCY,
        "reports": len(rows),
        "years": [{"year": y, **{k: round(v, 2) for k, v in t.items()}} for y, t in sorted(years.items())],
        "projects": projects,
    }
    OUT.write_text(json.dumps(out, indent=1) + "\n")
    print(f"build_ida: {len(projects)} projects, {len(rows)} reports, {min(years)}-{max(years)} -> {OUT}")


if __name__ == "__main__":
    if "--offline" not in sys.argv:
        download()
    build()
