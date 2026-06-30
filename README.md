# Riverhead Budget Live

An independent public fiscal intelligence platform for exploring Riverhead Town budgets, audits, annual financial reports, debt activity, reserve usage, and long-term financial trends using publicly available Town records.

## Live Platform

### ▶ **[Open Riverhead Budget Live](https://rike4545.github.io/rike4545-riverhead-budget-live/)**

| Page | Direct link |
| --- | --- |
| 💰 Payroll Explorer (SeeThroughNY-style) | https://rike4545.github.io/rike4545-riverhead-budget-live/payroll/ |
| 🏛️ Funds & Sub-Accounts | https://rike4545.github.io/rike4545-riverhead-budget-live/funds/ |
| 📊 Budget Compare (2020–2026) | https://rike4545.github.io/rike4545-riverhead-budget-live/compare/ |
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
(2018–2023), modeled on [SeeThroughNY Payrolls](https://www.seethroughny.net/payrolls):

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

## Data pipeline

| Script | Output | Notes |
| --- | --- | --- |
| `etl/parse_financial_reports.py` | `web/public/data/financial-reports/` | Parses every Town PDF into searchable page records |
| `etl/parse_subaccounts.py` | `web/public/data/subaccounts/` | Fund → department → category → account line items; reconciles to the dollar |
| `etl/parse_budget_history.py` | `web/public/data/history/` | Fund-level adopted appropriations 2020–2026 |
| `etl/parse_payroll.py` | `web/public/data/payroll/` | Per-employee gross/overtime/base pay 2018–2023 |

The weekly **Parse Financial Reports** GitHub Action regenerates all of the
above and commits any changes. Payroll regenerates from the slimmed CSVs in
`etl/data/payroll/`, so it is reproducible in CI without the original
140-column exports.

---

# Status

Riverhead Budget Live is under active development and expanding rapidly as additional Town financial records and analytics systems are integrated into the platform.
