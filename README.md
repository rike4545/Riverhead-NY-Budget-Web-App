# Riverhead Budget Live

An independent public fiscal intelligence platform for exploring Riverhead Town budgets, audits, annual financial reports, debt activity, reserve usage, and long-term financial trends using publicly available Town records.

## Live Platform

### ▶ **[Open Riverhead Budget Live](https://rike4545.github.io/rike4545-riverhead-budget-live/)**

| Page | Direct link |
| --- | --- |
| 💰 Payroll Explorer (SeeThroughNY-style) | https://rike4545.github.io/rike4545-riverhead-budget-live/payroll/ |
| 🏛️ Funds & Sub-Accounts | https://rike4545.github.io/rike4545-riverhead-budget-live/funds/ |
| 📊 Budget Compare (2020–2026) | https://rike4545.github.io/rike4545-riverhead-budget-live/compare/ |
| 📈 General Fund 20-Year History | https://rike4545.github.io/rike4545-riverhead-budget-live/general-fund/ |
| 🔎 Search Records | https://rike4545.github.io/rike4545-riverhead-budget-live/search/ |

GitHub Repository:
https://github.com/rike4545/rike4545-riverhead-budget-live

---

# What's New

This release brings the platform much closer to a SeeThroughNY-style transparency
tool, with employee-level payroll, account-level budget detail, and multi-year
comparison.

### 💰 Payroll Explorer — `/payroll`
A searchable, sortable record of **actual** Town of Riverhead employee earnings
(2018–2025), modeled on [SeeThroughNY Payrolls](https://www.seethroughny.net/payrolls):

- 4,400+ per-employee records: base pay, **overtime**, and total gross pay
- filter by year, union/bargaining group, and department; sort by gross, overtime, or base pay
- overtime is summed from the detailed overtime pay codes (~$1.3M/year town-wide)
- department, title, and pay class are reported from 2022 onward
- top earners, overtime leaders, and click-through to any employee's multi-year history
- multi-year gross-pay and overtime trend lines

### 🏛️ Funds & Sub-Accounts — `/funds`
Every operating fund now drills down to **department → spending category → individual
account line item**, extracted from the 2026 Adopted Budget:

- 1,000+ account line items across all 19 operating funds
- **every fund reconciles to the dollar** against the official Summary page
- per-line 2024 → 2025 → 2026 trend, category roll-ups, and revenue detail
- full-text search across account numbers and descriptions

### 📊 Budget Compare — `/compare`
Compare adopted appropriations across every fund from **2020 to 2026**:

- pick any two years and sort funds by the biggest dollar or percent movers
- per-fund trend sparklines; town-total appropriations reconcile to the official figure

### 📈 General Fund 20-Year History — `/general-fund`
Two decades of the Town's principal operating fund (**2005–2026**):

- multi-series chart of appropriations, tax levy, and estimated revenues
- year-by-year table with tax-levy year-over-year change
- appropriations have grown **+110%** and the tax levy **+126%** over the period

### 🔍 Deeper account-level trends
Sub-account line items now carry a **2020 → 2026** adopted trend (not just the
prior year). The 2020–2023 budgets use a Unicode-hyphen account format that is
now normalized and parsed, so each account on a fund drilldown page shows a
full 7-year sparkline.

---

# What Is Riverhead Budget Live?

Riverhead Budget Live transforms Town financial documents into searchable, source-backed public intelligence.

The platform helps residents, taxpayers, journalists, researchers, and policymakers better understand:

- where public money comes from
- where public money goes
- how reserves and fund balance are used
- how debt and borrowing may impact future budgets
- how departmental spending changes over time
- how payroll and overtime pressures evolve
- how adopted budgets compare to financial reports and audits

Rather than forcing residents to manually review hundreds of pages of PDFs, the platform organizes public financial records into a modern, searchable civic transparency system.

---

# Core Features

## Financial Document Archive

Browse and analyze publicly available:

- adopted budgets
- tentative budgets
- preliminary budgets
- annual financial reports (AFRs)
- audited financial statements
- budget supplements
- justice court reports
- community preservation fund reports
- debt-related financial schedules

---

## Searchable Fiscal Intelligence

The platform is evolving toward full line-item financial search, including:

- operating funds
- departments
- account codes
- appropriations
- revenues
- debt service
- reserves
- payroll
- overtime
- source citations

---

## Funds and Department Explorer

Review:

- appropriations
- estimated revenues
- levy support
- reserve usage
- projected balances
- operational trends
- future department-level drilldowns

---

## Source-Backed Analytics

The platform is being expanded to support:

- levy trend analysis
- reserve trend analysis
- debt trajectory analysis
- payroll and overtime indicators
- budget reconciliation
- operational comparisons
- cross-year financial analytics

---

## AI-Assisted Financial Explanations

Riverhead Budget Live is being designed to provide resident-friendly explanations for complex municipal financial records while maintaining source traceability and transparency.

Future intelligence layers include:

- page-level citations
- confidence scoring
- reconciliation indicators
- source-linked explanations
- account-level drilldowns

---

# Project Direction

Riverhead Budget Live is moving beyond a traditional dashboard into a continuously updating municipal fiscal intelligence platform.

The long-term goal is to make public financial information:

- easier to understand
- easier to search
- easier to compare
- easier to verify
- more transparent
- more accessible to residents

---

# Data Sources

This project uses publicly available Town financial records, including documents published by:

Town of Riverhead Financial Reports:
https://www.townofriverheadny.gov/206/Financial-Reports

Examples include:

- Adopted Budgets
- Annual Financial Reports
- Audited Financial Statements
- Supplemental Financial Documents

---

# Important Disclaimer

Riverhead Budget Live is an independent public-information project and is not affiliated with, endorsed by, or operated by the Town of Riverhead.

Financial information is derived from publicly available records and automated parsing systems. While every effort is made to improve transparency and accuracy, users should verify all figures, assumptions, and interpretations against official source documents before relying on them.

Analytics, projections, AI-generated explanations, and scenario modeling are informational tools only and should not be interpreted as official accounting, legal, or financial guidance.

---

# Current Development Focus

Active development areas include:

- full PDF ingestion
- AFR normalization
- line-item search
- payroll/overtime analytics
- department intelligence
- operational comparisons
- source citation systems
- budget reconciliation
- cross-year analytics
- resident-focused financial explainability

---

# Technology

Built using:

- Next.js
- TypeScript
- GitHub Pages
- Automated PDF ingestion pipelines
- Structured financial extraction systems
- Municipal analytics modules

---

# Repository Layout

```text
web/        Next.js public dashboard (static export to GitHub Pages)
etl/        Financial document ingestion and normalization pipeline
etl/data/   Slimmed source CSVs committed for reproducible builds (payroll)
docs/       Architecture, parser, and intelligence documentation
.cache/     Cached downloaded source documents
```

## The automated data pipeline

The site keeps itself current. Every Monday (and on demand), a GitHub Action
runs the full pipeline:

1. **Fetch** — new Town Board meeting minutes are pulled from the Town's
   CivicClerk portal (`fetch_meetings.py`); financial-report PDFs are
   re-ingested from the Town website.
2. **Parse & validate** — every dataset below is regenerated from the raw
   documents; budget line items must reconcile to the dollar against the
   official Summary page.
3. **Publish** — the unified search index, CSV downloads, and a data-freshness
   stamp are rebuilt; changes are committed; the site verifies its build and
   redeploys itself. Every page shows "Data last refreshed ⟨date⟩."

| Script | Produces |
| --- | --- |
| `fetch_meetings.py` | New meeting-minutes text from the CivicClerk API (idempotent) |
| `parse_financial_reports.py` | Searchable page records for every Town PDF |
| `parse_subaccounts.py` | Fund → department → category → account line items, with 2020–2026 history |
| `parse_budget_history.py` / `parse_general_fund.py` | Fund appropriations 2020–2026; General Fund 2005–2025 |
| `parse_afr.py` | Actual year-end results (revenues, spending, surplus, fund balance) for all 14 AFR funds |
| `parse_meetings.py` | The voting record — every resolution and vote, plus per-member career records |
| `parse_salary_schedule.py` / `parse_salary_2026.py` | Board-authorized salaries for 2025 and 2026, and the raise comparison |
| `parse_payroll.py` | Per-employee actual pay 2018–2025 (from slimmed CSVs committed in `etl/data/`) |
| `build_search_index.py` | The compact unified search index (16,000+ entries) |
| `export_csv.py` | Ten CSV downloads for journalists and researchers |
| `write_meta.py` | The sitewide data-freshness stamp |

Every input the pipeline needs (minutes text, slimmed payroll CSVs, the AFR
PDF, agenda text) is committed to the repo, so any run is reproducible from a
clean checkout.

---

# Status

Riverhead Budget Live is under active development and expanding rapidly as additional Town financial records and analytics systems are integrated into the platform.
