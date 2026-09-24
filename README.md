# Riverhead Budget Live

An independent public fiscal intelligence platform for exploring Riverhead Town budgets, audits, annual financial reports, payroll, Town Board decisions, campaign finance, debt, reserves, and long-term financial trends using publicly available Town and New York State records.

## Live Platform

### ▶ **[Open Riverhead Budget Live](https://rike4545.github.io/Riverhead-NY-Budget-Web-App/)**

| Page | Direct link |
| --- | --- |
| 🏠 My Tax Bill | https://rike4545.github.io/Riverhead-NY-Budget-Web-App/tax-bill/ |
| 💰 Payroll Explorer (SeeThroughNY-style) | https://rike4545.github.io/Riverhead-NY-Budget-Web-App/payroll/ |
| 🗳️ Town Board Votes | https://rike4545.github.io/Riverhead-NY-Budget-Web-App/meetings/ |
| 📑 2027 Tentative Budget | https://rike4545.github.io/Riverhead-NY-Budget-Web-App/tentative-2027/ |
| 🔮 2027 Prediction | https://rike4545.github.io/Riverhead-NY-Budget-Web-App/predict-2027/ |
| 🧮 How Budgets Get Adopted (2005–2026) | https://rike4545.github.io/Riverhead-NY-Budget-Web-App/budget-adoption/ |
| ✅ The Supervisor’s Promises | https://rike4545.github.io/Riverhead-NY-Budget-Web-App/supervisor-promises/ |
| 🚪 Open Meetings Law | https://rike4545.github.io/Riverhead-NY-Budget-Web-App/open-meetings/ |
| 🏛️ Funds & Line Items | https://rike4545.github.io/Riverhead-NY-Budget-Web-App/funds/ |
| 📊 Budget Compare (2020–2026) | https://rike4545.github.io/Riverhead-NY-Budget-Web-App/compare/ |
| 🏗️ Capital & Debt | https://rike4545.github.io/Riverhead-NY-Budget-Web-App/capital-debt/ |
| 🧾 Campaign Finance | https://rike4545.github.io/Riverhead-NY-Budget-Web-App/campaign-finance/ |
| 🔎 Search Records | https://rike4545.github.io/Riverhead-NY-Budget-Web-App/search/ |

The site has about 55 pages, grouped in its navigation as **Explore**,
**Government**, **Research** and **Evidence**. See **Every Page** below for
what each one covers.

GitHub Repository:
https://github.com/rike4545/Riverhead-NY-Budget-Web-App

## Also Available

**[Riverhead NY Budget App on the App Store](https://apps.apple.com/us/app/riverhead-ny-budget-app/id6751372951)** —
the native iOS companion app, covering much of the same ground (budget,
taxes, payroll, campaign finance, capital projects) plus resident-facing
civic tools like a hearing toolkit and a Town Board scorecard. Repo:
https://github.com/rike4545/Riverhead-NY-Budget-iOS-App

An Android release is in early development — native Kotlin + Jetpack
Compose port, not yet published. Repo:
https://github.com/rike4545/Riverhead-NY-Budget-Android-App

---

# What's New — September 2026

### 📑 The 2027 budget, as soon as the Town posts it
The Supervisor's 2027 Tentative Budget was presented on September 24: $121.0
million of appropriations and a $67.2 million town-wide levy, up 2.8% from
2026. The site parsed it at 10:07 AM and had it live by 10:29 AM.

When the Tentative is parsed, the pages that forecast 2027 switch to the
Town's own figures on their own, with no hand edits: the prediction
scorecard, the adoption history, the scenario and tax-cap pages, the
candidate pages and the home page.
**[2027 Tentative Budget](https://rike4545.github.io/Riverhead-NY-Budget-Web-App/tentative-2027/)**
sets the Tentative against this site's projection, fund by fund.

Through October 6 a watcher checks the Town's Financial Reports page every
15 minutes. When a new budget document appears, it starts a deploy that
parses it and republishes the site. It runs again every 30 minutes from
November 1 to 21, for the Preliminary and Adopted budgets. GitHub runs
scheduled jobs late or skips them when it is busy, so a posting can take
longer to appear than the schedule suggests.

### 🧮 How Budgets Get Adopted — `/budget-adoption`
Every Riverhead budget since 2005: what the Town Board changed in each
Supervisor's Tentative, whether it did so before or after the public
hearing, and whether it ever voted to adopt the result. Built from the
Town's own budget books.

### ✅ The Supervisor's Promises — `/supervisor-promises`
What Supervisor Jerry Halpin promised, and what he says he has done, checked
against the Town's own votes, budgets and resolutions. Also lists the tests
his 2027 budget will answer.

### 🚪 The Open Meetings Law in Riverhead — `/open-meetings`
What New York's Open Meetings Law requires of the Town Board and the Town's
other boards, and how the Board's own rules compare. It covers notice,
documents posted a day ahead, executive sessions, minutes and remote
attendance, plus what residents can do. It includes what this site's own
meeting records show, such as minutes on file and minutes still outstanding.

### Also this month
- **Search** (`/search`) opens with the page on this site that explains a
  topic, searches the full text of the Town's documents, and reads a
  misspelled name as the nearest one.
- **Payroll** (`/payroll`) tables sort by any column, either way.
- **Every page fits a phone screen**, down to 320 pixels wide, without
  sideways scrolling.
- **General Fund history** (`/general-fund`) now runs through 2026, and
  **Road Spending** (`/road-spending`) uses fiscal 2025 spending and 2025
  road mileage. Both add new years on their own.

### Also added this month
- **Where the Surplus Went** (`/fund-balance-draws`): every 2026 resolution
  that spent fund balance, beyond what the adopted budget appropriated up
  front.
- **Management Pay** (`/management-compensation`): four appointed positions
  moved to fully employer-paid health premiums "in lieu of merit increases",
  and two of them then got raises in the 2026 salary schedule.
- **Police Spending & Crime** (`/police-crime`) and **School Resource
  Officers** (`/school-resource-officers`).
- **Town Square** (`/town-square`): the land, the lease, the pending IDA
  abatement and the construction schedule.
- **A Zero-Percent Year** (`/zero-percent-2027`): what it would take for
  Riverhead to match Suffolk County's no-increase pledge.
- **Resident Answers** (`/answers`), **Where Your Levy Goes**
  (`/taxpayer-impact`), **What Changed** (`/what-changed`) and **Data Quality
  & Freshness** (`/data-quality`).

---

# What Is Riverhead Budget Live?

Riverhead Budget Live transforms Town financial documents and New York
State open data into searchable, source-backed public intelligence.

The platform helps residents, taxpayers, journalists, researchers, and policymakers better understand:

- where public money comes from
- where public money goes
- what a resident's own property tax bill is actually built from
- how each year's budget is proposed, changed and adopted
- what the Town Board decided at each meeting, and how each member voted
- who funds Town Board campaigns, and whether Town employees are among the donors
- how reserves and fund balance are used, and how they compare to peer towns
- how debt and borrowing may impact future budgets
- how departmental spending changes over time, and which changes are worth a second look
- how payroll and overtime pressures evolve
- how adopted budgets compare to financial reports and audits

Rather than forcing residents to manually review hundreds of pages of PDFs and separate state disclosure filings, the platform organizes public financial and campaign-finance records into a modern, searchable civic transparency system.

---

# Every Page

The four links at the front of the site menu:

- **My Taxes** (`/tax-bill`): the Town's portion of your property-tax bill, estimated from assessed value and the Town's published 2026 rate table.
- **Payroll** (`/payroll`): actual employee pay 2018–2025 (base, overtime, gross), Board-authorized salaries for 2025 and 2026, and every raise between them. Separate tabs cover overtime and staffing, separation pay and police pay steps. Every table sorts by any column.
- **Board Votes** (`/meetings`): Town Board meetings as a decision record. Each resolution shows its outcome, each member's vote, whether the official record is on file, and the matching fiscal-impact statement.
- **Search** (`/search`): about 17,200 records: the site's own pages, budget lines, payroll, authorized salaries, Town Board votes, funds and more than 12,500 pages of financial documents. See **Search** below.

## Explore
- **Where Your Levy Goes** (`/taxpayer-impact`): how the 2026 Town tax levy divides among the funds.
- **What Changed** (`/what-changed`): the 2026 adopted budget against 2025.
- **Financial Health** (`/analytics`): levy growth, spending, reserves and other indicators side by side.
- **Budget Overview** (`/funds`): every operating fund, down through department and spending category to 848 account lines, reconciled to the 2026 adopted budget. Each fund has its own page.
- **Program Budget** (`/programs`): the 2026 budget regrouped into the seven services the State's account system says the Town performs, with pension and health costs included and fees earned back.
- **Budget Compare** (`/compare`): adopted appropriations for every fund, 2020–2026, sortable by the biggest movers.
- **General Fund** (`/general-fund`): appropriations, tax levy and revenues year by year since 2005, from the adopted budgets.
- **Annual Report** (`/annual-report`): actual 2025 year-end results against the plan, for all 14 funds.
- **Tax Cap** (`/tax-cap`): how the State's levy limit is calculated, what an override does, and Riverhead's audited record.
- **Reserves & Fund Balance** (`/reserves`): the five GASB fund-balance classes, the Town's own reserve rules, and a one-time deployment plan.
- **Where the Surplus Went** (`/fund-balance-draws`): every 2026 resolution that spent fund balance.
- **Capital & Debt** (`/capital-debt`): every bond and Bond Anticipation Note outstanding at the close of 2025, with the repayment schedule, plus a calculator comparing a bond now with a BAN first.
- **Town Square** (`/town-square`): what the Town is building downtown and what it is spending.
- **Road Spending** (`/road-spending`): highway spending per maintained mile, Riverhead against every Suffolk town.
- **Community Preservation Fund** (`/community-preservation-fund`): the 2% transfer-tax revenue history and what its swings mean.
- **Community Housing Plan** (`/housing-plan`): the one Peconic Bay requirement Riverhead has not met.
- **Community** (`/community`): population, the tax base, the largest taxpayers and assessment disputes.

## Government
- **Resident Answers** (`/answers`): plain answers to the questions residents ask, each with the figure and a link to the page that proves it.
- **Workforce by Title** (`/workforce-by-title`): headcount by civil-service title and department, 2022–2025.
- **Officials & Pensions** (`/officials`): elected officials who also collect a New York State public pension.
- **Management Pay** (`/management-compensation`): the health-premium change for four appointed positions, and the 2026 raises that followed for two of them.
- **2026 Buyout** (`/buyout`): the final CSEA, PBA and SOA retirement-incentive terms, eligibility and likely savings.
- **Police Spending & Crime** (`/police-crime`): police appropriations next to the Index crime the department reports to the State.
- **School Resource Officers** (`/school-resource-officers`): who pays for them, and every funding route proposed.
- **Supervisors & Council History** (`/town-history`): who has held each seat since 2004.
- **Board Elections** (`/board-elections`): the vote counts that elected each current member.
- **Campaign Finance** (`/campaign-finance`): every current and recent member's committee, live from New York State's campaign-finance data, with a Town Employee Donors cross-check.
- **Candidate Watch** (`/candidate-watch`): who is running in November 2026, with links and stated platforms.
- **Candidate Proposals** (`/candidate-cost-benefit`): a cost–benefit look at each stated plank in the 2026 Supervisor race.
- **Supervisor's Promises** (`/supervisor-promises`): commitments checked against the record.
- **Open Meetings Law** (`/open-meetings`): what the law requires, and what the Town's records show.

## Research
- **Start Here** (`/guide`): a plain-English guide to every tool, a budget primer and a glossary.
- **2027 Prediction** (`/predict-2027`): a line-by-line projection with tax-cap scenarios and a scorecard against the Town's budget.
- **2027 Tentative Budget** (`/tentative-2027`): the Town's Tentative against this site's projection, fund by fund.
- **How Budgets Get Adopted** (`/budget-adoption`): what the Board changed in every Tentative since 2005.
- **Scenario Lab** (`/scenarios`): close the gap between projected 2027 spending and the tax cap with your own mix of trims, savings, revenue and reserves.
- **2027 Spending Reduction** (`/spending-reduction-2027`): how the retirement incentive plus sourced line trims could close that gap.
- **A Zero-Percent Year** (`/zero-percent-2027`): what matching Suffolk County's pledge would take.
- **Credit Rating** (`/credit-rating`): Riverhead's Aa2 against Brookhaven's AAA and the other Suffolk towns.
- **Outlier Watch** (`/outliers`): year-over-year swings of at least 20% and $100,000 across all 19 funds.
- **Budget Accuracy** (`/budget-accuracy`): where adopted amounts and actual spending drift apart.
- **Fiscal Impact** (`/fiscal-impact`): each resolution's Fiscal Impact Statement next to a realistic financial read.

## Evidence
- **Source Library** (`/sources`): every parsed Town document, with its fingerprint and a link to the original.
- **Downloads** (`/downloads`): CSV files for budgets, payroll, salaries, votes and annual-report results.
- **Data Quality & Freshness** (`/data-quality`): which figures are official and which are calculated, how current each source is, and what each deploy checks.
- **Standards (GFOA)** (`/gfoa`): this site scored against the GFOA budget-presentation criteria.
- **Election Law Case** (`/election-law-case`): what the Town spent fighting New York's even-year election law.
- **Officials on Social Media** (`/official-social-media`): when an official's account counts as government speech.
- **Know Your Rights (ICE)** (`/know-your-rights`): your rights if immigration agents come, and New York's 2026 protections.

Also on the site: a guided tour of the budget (`/explore`) and a guide to how
the numbers are labeled and sourced (`/evidence`).

---

## Search

The search covers about 17,200 records: the site's own 54 pages, 848 budget
lines, 1,228 employee pay records, 362 authorized salaries, about 2,080 Town
Board votes, 19 funds and more than 12,500 pages of financial documents.

- A topic ("reserves", "tax cap", "buyout") opens with the page on this site
  that explains it, above the records.
- Document pages are searched by their full text, not just their first
  lines.
- A misspelled word that matches nothing is read as the nearest word in the
  index, and the page says so. Plurals match their singular.
- A date ("September 15") finds that meeting's votes. A job title finds the
  people who hold it.
- Votes say who voted no or abstained, and 2026 salaries say who got a raise
  or a promotion.
- `web/scripts/verify-search.mjs` runs these searches on every build, and
  fails if a page in the site menu can't be found as a page.

There is also an optional AI answer mode. The site has no server, so there is
nowhere safe to keep a shared API key. Instead, a reader pastes their own
OpenAI key, which stays in their browser. The answer is built only from the
most relevant search records, and it cites them by number, so every answer
can be traced to a real record.

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

The current focus is the 2027 budget season: the Tentative in late
September, then the Preliminary and the Adopted budget in November.

---

# Data Sources

This project uses publicly available Town records and New York State data, including:

- **Town of Riverhead Financial Reports**, https://www.townofriverheadny.gov/206/Financial-Reports.
  This covers the Tentative, Preliminary and Adopted Budgets, Budget
  Supplements, Annual Financial Reports and audited financial statements.
- **Town Board meeting records** from the Town's CivicClerk portal: minutes,
  agendas and agenda packets, including each resolution's Fiscal Impact
  Statement.
- **New York State Board of Elections** campaign-finance disclosure data (data.ny.gov)
- **Office of the State Comptroller** Financial Data for Local Governments
- **NYSDOT** Local Highway Inventory road mileage
- **NYS Division of Criminal Justice Services** Index crime counts (data.ny.gov)
- **U.S. Census Bureau** population figures
- **NYS Committee on Open Government** text of the Open Meetings Law and its advisory opinions

Pages built from research, such as Town Square, the Supervisor's promises
and credit ratings, cite each source inline.

---

# Important Disclaimer

Riverhead Budget Live is an independent public-information project and is not affiliated with, endorsed by, or operated by the Town of Riverhead.

Financial information is derived from publicly available records and automated parsing systems. While every effort is made to improve transparency and accuracy, users should verify all figures, assumptions, and interpretations against official source documents before relying on them.

Analytics, projections, AI-generated explanations, and scenario modeling are informational tools only and should not be interpreted as official accounting, legal, or financial guidance. The Town Employee Donors and Outlier Watch features surface disclosure context and statistical flags, not accusations of wrongdoing.

---

# Technology

Built using:

- Next.js 15 (static export), React and TypeScript
- GitHub Pages, deployed by GitHub Actions
- A Python ingestion pipeline (PyMuPDF, pypdf, pandas, Beautiful Soup) that parses Town PDFs and reconciles them against the official Summary pages
- Live client-side queries against New York State's open campaign-finance data (data.ny.gov)

---

# Repository Layout

```text
web/                Next.js public dashboard (static export to GitHub Pages)
web/public/data/    Parsed datasets the pages read, regenerated by the pipeline
etl/                Financial document ingestion and normalization pipeline
etl/data/           Committed source inputs (payroll CSVs, salary schedules,
                    AFR and Budget Supplement PDFs, meeting-minutes text)
docs/               Architecture, parser, and intelligence documentation
.github/workflows/  The automated pipeline, release watcher and pull-request checks
```

## The automated data pipeline

The site keeps itself current. Five GitHub Actions workflows do the work
(times are UTC):

| Workflow | When | What it does |
| --- | --- | --- |
| **Deploy GitHub Pages** (`deploy-pages.yml`) | Every push to `main`, and on demand | Re-parses every financial-report PDF, rebuilds the budget-stage, General Fund history, adoption, department-request and CPF datasets, the search index and the freshness stamp, then commits any data that changed. It then typechecks, builds, verifies the output and deploys. |
| **Parse Financial Reports** (`parse-financial-reports.yml`) | Mondays 09:00; daily at 09:00 and 22:00 in September–November | The full pipeline: meetings, financial reports, line items, budget history and stages, General Fund history, AFR actuals, Supplements, votes and fiscal impact, salaries and payroll, the 2027 projection, the buyout, police and crime, road spending, search, CSVs and freshness. Commits the results and redeploys. |
| **Sync Town Board Meetings** (`sync-meetings.yml`) | Twice a day, 12:30 and 23:30 | Re-checks CivicClerk minutes and agenda packets and the upcoming-meeting schedule. Re-parses votes, falls back to the agenda packet when the minutes omit them, and reconciles each meeting against its official sources. Redeploys when anything changed. |
| **Watch for budget releases** (`watch-budget-release.yml`) | Every 15 minutes, Sept 24–Oct 6; every 30 minutes, Nov 1–21 | Checks the Town's Financial Reports page for a budget document the site hasn't parsed yet, and starts a deploy the moment one appears. The check itself downloads nothing. It skips while a deploy is already running and limits how often it can start one. |
| **Quality Gate** (`quality-gate.yml`) | Every pull request | Checks ETL syntax, runs the parser and budget-release tests, rebuilds search and freshness data, and checks every external authority link. Then it typechecks, builds and verifies the output. |

Every page shows when its data was last refreshed.

| Script | Produces |
| --- | --- |
| `run_ingestion_safe.py` / `parse_all_pdfs.py` | Downloads every document on the Financial Reports page and extracts its text |
| `parse_financial_reports.py` | Searchable page records for every Town PDF |
| `watch_budget_release.py` | The release check: has the Town posted a budget document the site hasn't parsed? |
| `parse_subaccounts.py` | Fund → department → category → account line items, with 2020–2026 history |
| `parse_budget_history.py` | Fund appropriations, 2020–2026 |
| `parse_budget_stages.py` | Fund-level figures for every Tentative, Preliminary and Adopted budget the Town has published |
| `parse_budget_adoption.py` | What the Board changed in each Tentative before adopting it, 2005 on |
| `parse_budget_requests.py` | What each department asked for, against what the budget officer recommended |
| `parse_general_fund.py` | The long-run General Fund history, adding each newly adopted year from the budget-stage data |
| `parse_budget_supplement.py` / `parse_supplement_history.py` | Every Budget Supplement line, classified, with its multi-year history |
| `parse_afr.py` | Actual year-end results for all 14 AFR funds |
| `parse_cpf.py` | Peconic Bay Community Preservation Fund results |
| `fetch_meetings.py` / `fetch_upcoming.py` / `fetch_vote_packets.py` | Meeting minutes, the upcoming schedule, and agenda packets when the minutes omit votes |
| `parse_meetings.py` / `apply_vote_packet_fallback.py` / `reconcile_meeting_sources.py` | The voting record, every resolution and vote, checked against its official sources |
| `parse_fiscal_impact.py` | Each meeting's Fiscal Impact Statements and a corrected read |
| `analyze_consent_calendar.py` | The Board's unanimous-vote rate and other voting patterns |
| `parse_salary_schedule.py` / `parse_salary_2026.py` | Board-authorized salaries for 2025 and 2026, and the raise comparison |
| `parse_payroll.py` | Per-employee actual pay 2018–2025 (from slimmed CSVs in `etl/data/`) |
| `build_management_history.py` | Multi-year management salary history |
| `predict_2027.py` | The line-by-line 2027 projection |
| `analyze_buyout.py` | Cost and likely savings of the 2026 retirement incentive |
| `parse_police_crime.py` | Police spending next to reported Index crime |
| `parse_road_spending.py` | Highway spending per maintained mile for the ten Suffolk towns, from State Comptroller filings and NYSDOT's road inventory |
| `build_search_index.py` | The sharded search index |
| `export_csv.py` | The CSV downloads |
| `write_meta.py` | The sitewide data-freshness stamp |

The pipeline keeps its own copies of some inputs under `etl/data/`: payroll
exports, salary schedules, the AFR, Budget Supplements and meeting-minutes
text. Those datasets rebuild from a clean checkout. Budget documents are
downloaded again from the Town's Financial Reports page on each run.

**Not part of the automated pipeline:** Campaign Finance queries data.ny.gov
live in the browser on each page load or refresh, with no build step.
Research pages such as Town Square, the Supervisor's promises, the Open
Meetings Law and credit ratings are written by hand from the sources they
cite. They change when those sources are reviewed again.

---

# Status

Riverhead Budget Live is under active development and expanding rapidly as additional Town financial records, New York State disclosure data, and analytics systems are integrated into the platform.
