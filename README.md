# Riverhead Budget Live

An independent public fiscal intelligence platform for exploring Riverhead Town budgets, audits, annual financial reports, payroll, campaign finance, debt, reserves, and long-term financial trends using publicly available Town and New York State records.

## Live Platform

### ▶ **[Open Riverhead Budget Live](https://rike4545.github.io/rike4545-riverhead-budget-live/)**

| Page | Direct link |
| --- | --- |
| 💰 Payroll Explorer (SeeThroughNY-style) | https://rike4545.github.io/rike4545-riverhead-budget-live/payroll/ |
| 🧾 Campaign Finance | https://rike4545.github.io/rike4545-riverhead-budget-live/campaign-finance/ |
| 🏠 My Tax Bill | https://rike4545.github.io/rike4545-riverhead-budget-live/tax-bill/ |
| 🏦 Reserves & Fund Balance | https://rike4545.github.io/rike4545-riverhead-budget-live/reserves/ |
| 🏗️ Capital & Debt | https://rike4545.github.io/rike4545-riverhead-budget-live/capital-debt/ |
| 🚩 Outlier Watch | https://rike4545.github.io/rike4545-riverhead-budget-live/outliers/ |
| 🏛️ Funds & Sub-Accounts | https://rike4545.github.io/rike4545-riverhead-budget-live/funds/ |
| 📊 Budget Compare (2020–2026) | https://rike4545.github.io/rike4545-riverhead-budget-live/compare/ |
| 📈 General Fund 20-Year History | https://rike4545.github.io/rike4545-riverhead-budget-live/general-fund/ |
| 🔎 Search Records | https://rike4545.github.io/rike4545-riverhead-budget-live/search/ |

The full page list is in the site's own navigation (grouped as Budget /
People & Pay / Accountability / More) — see **Core Features** below for
what each page covers.

GitHub Repository:
https://github.com/rike4545/rike4545-riverhead-budget-live

## Also Available

**[Riverhead NY Budget App on the App Store](https://apps.apple.com/us/app/riverhead-ny-budget-app/id6751372951)** —
the native iOS companion app, covering much of the same ground (budget,
taxes, payroll, campaign finance, capital projects) plus resident-facing
civic tools like a hearing toolkit and a Town Board scorecard. Repo:
https://github.com/rike4545/Riverhead-NY-Budget-App

An Android release is in early development (native Kotlin + Jetpack
Compose port, `AndroidFork/` in the iOS repo) — not yet published.

---

# What's New

This release adds live campaign-finance disclosure, a personal tax-bill
estimator, and three new accountability tools — Reserves & Fund Balance,
Capital & Debt, and Outlier Watch — plus data-accuracy fixes surfaced while
building them.

### 🧾 Campaign Finance — `/campaign-finance`
Every current and recent Town Board member's campaign committee, live from
New York State's open campaign-finance data (data.ny.gov), covering 2005–2026:

- total raised, direct contributions, and transfers in per committee, with a
  one-tap refresh that pulls the latest filings straight from NY Open Data
- **per-filing history**, grouped into **2026 / 2025 / Prior** — each
  individual filing (e.g. "January Periodic, Original, Itemized,
  State/Local") rather than just an aggregate dollar total, labeling
  Original vs. Amendment and flagging when a committee has more than one
  filer ID
- **Town Employee Donors**: cross-references Town payroll employees against
  individual campaign donors to these committees — disclosure context, not
  an accusation; excludes a candidate donating to their own committee
- a **next filing deadline** banner sourced from NY BOE's official 2026
  filing calendar

### 🏠 My Tax Bill — `/tax-bill`
A personal property-tax estimator built around **assessed value**, not
market value — avoiding a rate-basis error found while building it (the
Town's real rate is per $1,000 of *assessed* value, using a 7.44%
residential assessment ratio, not full market value). Compares your 2025 vs.
2026 bill using the Town's actual published rate table.

### 🏦 Reserves & Fund Balance — `/reserves`
Policy-compliance health status for the General Fund's unassigned fund
balance, an interactive draw-down slider, a 7-item deployment-plan
breakdown, and peer-town benchmarking against Brookhaven, Smithtown, East
Hampton, and Southampton. Wired to the real FY2025 AFR "Unassigned" fund
balance and current General Fund appropriations, not fresh constants.

### 🏗️ Capital & Debt — `/capital-debt`
The Town's actual outstanding debt from its most recent full audit ($41.28M
bonded debt, $22.8M in Bond Anticipation Notes, 3.78% of the constitutional
debt limit used, Aa2 Moody's rating, full 2024–2036 amortization schedule),
plus a calculator comparing the two ways a town finances a capital project —
bond immediately, or borrow short-term with a BAN first. Rate assumptions in
the calculator are clearly labeled as user-set, not quoted Town rates.

### 🚩 Outlier Watch — `/outliers`
Flags year-over-year appropriation swings across all 19 town funds
(2020–2026) large enough in **both** percentage and dollar terms to be
worth a second look — a fund whose budget moved ≥20% *and* ≥$100,000 from
one year's adopted budget to the next. Not an accusation; a starting point
for a question at a Town Board meeting.

### 🩹 Data-accuracy fixes along the way
- Payroll Explorer's "Employees (all years)" was counting employee-*year*
  records (4,444), not distinct people (1,192) — now split into **Current
  Employees** and **Former Employees**, with the record count kept as
  context, not the headline.
- Three job-title misspellings ("Superintendant," "Adminstrator,"
  "Specialst"), present in the Town's own source documents, confirmed
  against Suffolk County's official Civil Service title list and corrected
  at the ETL layer so future parses stay correct.
- The "More" nav dropdown no longer overflows off the right edge of the
  viewport.

---

# What Is Riverhead Budget Live?

Riverhead Budget Live transforms Town financial documents and New York
State open data into searchable, source-backed public intelligence.

The platform helps residents, taxpayers, journalists, researchers, and policymakers better understand:

- where public money comes from
- where public money goes
- who funds Town Board campaigns, and whether Town employees are among the donors
- what a resident's own property tax bill is actually built from
- how reserves and fund balance are used, and how they compare to peer towns
- how debt and borrowing may impact future budgets
- how departmental spending changes over time, and which changes are worth a second look
- how payroll and overtime pressures evolve
- how adopted budgets compare to financial reports and audits

Rather than forcing residents to manually review hundreds of pages of PDFs and separate state disclosure filings, the platform organizes public financial and campaign-finance records into a modern, searchable civic transparency system.

---

# Core Features

## Budget
- **Funds Explorer** (`/funds`) — every operating fund drilled down to department → spending category → individual account line item, extracted from the Adopted Budget; every fund reconciles to the dollar against the official Summary page.
- **Budget Compare** (`/compare`) — adopted appropriations across every fund, 2020–2026, sortable by biggest dollar or percent movers.
- **General Fund 20-Year History** (`/general-fund`) — appropriations, tax levy, and estimated revenues, 2005–2026.
- **2027 Prediction** (`/predict-2027`) — a forward projection of the next adopted budget.
- **Tax Cap** (`/tax-cap`) — the state property-tax cap mechanism and override history.
- **My Tax Bill** (`/tax-bill`) — personal property-tax estimator, assessed-value based.
- **Reserves & Fund Balance** (`/reserves`) — policy compliance, draw-down modeling, peer-town benchmarking.
- **Capital & Debt** (`/capital-debt`) — real outstanding debt profile plus a BAN-vs-bond financing calculator.
- **Annual Report** (`/annual-report`) — the Town's own annual financial report, made searchable.
- **Community** (`/community`) — population and tax-base context (assessed value, assessment ratio, transfer tax).

## People & Pay
- **Payroll Explorer** (`/payroll`) — SeeThroughNY-style actual earnings, 2018–2025, with authorized-salary comparison and 2025→2026 raise tracking; distinguishes current from former employees.
- **2026 Buyout** (`/buyout`) — the ratified early-retirement incentive program: eligibility, realistic backfill savings, and the promotion-chain effect.
- **Officials & Pensions** (`/officials`) — elected and appointed officials, with pension-system context.

## Accountability
- **Town Board Votes** (`/meetings`) — the objective voting record, resolution by resolution.
- **Fiscal Impact** (`/fiscal-impact`) — a corrected, resident-readable read of each meeting's "Fiscal Impact Statement" checkboxes.
- **Campaign Finance** (`/campaign-finance`) — live NY BOE disclosure data, per-filing history, and the Town Employee Donors watch.
- **Outlier Watch** (`/outliers`) — year-over-year fund-swing flagging.

## More
- **Start Here (Guide)** (`/guide`), **Downloads** (`/downloads`), **Standards / GFOA** (`/gfoa`), **Analytics** (`/analytics`), **Source Library** (`/sources`), **Scenario Lab** (`/scenarios`).

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

This project uses publicly available Town financial records and New York State open data, including:

Town of Riverhead Financial Reports:
https://www.townofriverheadny.gov/206/Financial-Reports

New York State Board of Elections campaign-finance disclosure data (data.ny.gov)

Examples include:

- Adopted Budgets
- Annual Financial Reports
- Audited Financial Statements
- Supplemental Financial Documents
- Campaign finance disclosure reports (contributions, filings, loans)

---

# Important Disclaimer

Riverhead Budget Live is an independent public-information project and is not affiliated with, endorsed by, or operated by the Town of Riverhead.

Financial information is derived from publicly available records and automated parsing systems. While every effort is made to improve transparency and accuracy, users should verify all figures, assumptions, and interpretations against official source documents before relying on them.

Analytics, projections, AI-generated explanations, and scenario modeling are informational tools only and should not be interpreted as official accounting, legal, or financial guidance. The Town Employee Donors and Outlier Watch features surface disclosure context and statistical flags, not accusations of wrongdoing.

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
- Live client-side queries against NY State's open campaign-finance data (data.ny.gov)

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

**Not part of the automated pipeline:** Campaign Finance queries data.ny.gov
live in the browser on each page load/refresh (no build-time step). Reserves,
Capital & Debt, and Outlier Watch are built from the pipeline's *existing*
output (AFR, fund-appropriations history) rather than new source documents,
so they update automatically whenever the underlying budget/AFR data does.

---

# Status

Riverhead Budget Live is under active development and expanding rapidly as additional Town financial records, New York State disclosure data, and analytics systems are integrated into the platform.
