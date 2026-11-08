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
| 🎤 State of the Town Addresses | https://rike4545.github.io/Riverhead-NY-Budget-Web-App/state-of-the-town/ |
| 🚪 Open Meetings Law | https://rike4545.github.io/Riverhead-NY-Budget-Web-App/open-meetings/ |
| 🏛️ Funds & Line Items | https://rike4545.github.io/Riverhead-NY-Budget-Web-App/funds/ |
| 📊 Budget Compare (2020–2026) | https://rike4545.github.io/Riverhead-NY-Budget-Web-App/compare/ |
| 🏗️ Capital & Debt | https://rike4545.github.io/Riverhead-NY-Budget-Web-App/capital-debt/ |
| 🧾 Campaign Finance | https://rike4545.github.io/Riverhead-NY-Budget-Web-App/campaign-finance/ |
| 🔎 Search Records | https://rike4545.github.io/Riverhead-NY-Budget-Web-App/search/ |

The site menu lists 64 pages, grouped as **Explore**, **Government**,
**Research** and **Evidence**, and every fund has a page of its own. See
**Every Page** below for what each one covers.

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

# What's New — November 2026

### 🧾 Campaign Finance, rebuilt and corrected — `/campaign-finance`
The page now reads in order: the November 3 result, then **Every committee
at a glance**, then each committee's card, then the rules and how to read a
filing. The summary table puts every committee side by side, showing what it
raised since 2005 and in 2026, refunds, loans received, what it still owed
at its latest report, and its last contribution. Each card leads with four
figures and folds the rest, the donors, filings and watch lists, under one
heading.

The figures were checked against the State Board of Elections' records and
corrected:
- **Totals are current.** Two cards stopped in June; they now run to each
  committee's latest report, rebuilt from data.ny.gov on every data refresh.
- **Nothing is counted twice.** Money moved between one official's own
  committees is counted once, where it was first raised.
- **Refunds, in-kind gifts and loans are shown.** Each card says what it
  refunded and what in-kind gifts it got. It also shows what it still owed
  at its latest report, rather than "None on file".
- **Limits are the County's own.** The Suffolk County Board of Elections'
  2026 index for Riverhead ($1,219.30 for an individual in the general
  election) replaces 2022 reference figures, and the family-financing panel
  counts as family only the donors a filing names as family.

A new section explains how a filing shows money, in-kind and LLC gifts, and
what to check when a donor's account and the filing differ.

### 🗳️ The November 3 Supervisor result
The County's unofficial count, 6,779 for Jerry Halpin to 6,152 for Ken
Rothwell, is on the election and campaign pages, labelled unofficial until
the County certifies it. Office terms follow New York's move to even-year
elections. The Supervisor elected this month serves two years from January
1, 2027. The council seats up in November 2027 are for a one-time
three-year term.

### 🔎 Account by account
- **Outlier Watch** (`/outliers`) reads the 2027 Preliminary line by line
  and lists the accounts that move most, at least 20% and $100,000 from the
  2026 adopted budget, each with its 2025 actual.
- **Budget Accuracy** (`/budget-accuracy`) adds four year-by-year checks:
  - lines budgeted below what they cost;
  - lines budgeted well above it;
  - lines past their whole 2026 budget by June 30;
  - revenue estimated above what comes in.

### ⚖️ Legal costs — `/legal-costs`
What the Town spends on lawyers and claims, 2018 to the 2027 Preliminary,
from the Budget Supplements' own accounts:
- the Town Attorney's outside-counsel line, budget against cost each year.
  It was budgeted at $400,000 and cost $818,961 in 2025. By June 30, 2026 it
  had spent $405,990, more than the year's budget;
- all legal services in four groups: outside lawyers, other departments'
  outside lawyers, the office's staff pay and its other costs;
- the self-insurance fund's payments on claims;
- the Board's resolutions on special counsel, settlements and claims.

`scripts/verify-legal-costs.mjs` rebuilds the groups from the line history
and checks that every Town Attorney or legal account that spent money is in
one.

### 🏛️ Regional CPF counsel — `/regional-cpf-counsel`
On November 5 the Board tabled, 5–0, a $400-an-hour retainer for a regional
Community Preservation Fund attorney that a 2024 state law (Chapter 666)
requires the five East End towns to share. The page quotes:
- the statute;
- the contract;
- the Town's December 2025 resolution saying the law passed "without
  requirement for Home Rule Message" and that the Board was "compelled" to
  join.

It also explains the home rule rule and shows what Riverhead's share of a
bill could be.

### 🗺️ Election map — `/election-map`
Riverhead's 22 election districts on the County's own boundaries, colored by
how each voted. The map has fifteen contests:
- **2026:** Supervisor, Governor, Congress, State Senate and Assembly.
- **2025:** Supervisor, Town Council, Highway Superintendent, Assessor and
  County Legislator.
- **2024:** President and Congress.
- **2013, 2015 and 2017:** the Supervisor races.

It can show who led, one candidate's share or the votes cast. Every figure
is in a table under the map.

**Compare** sets any candidate against any other, each with a year: for
example, Halpin in 2026 against Jens-Smith in 2017. Each district shows the
gap in their shares of the vote. Ready-made comparisons include Halpin from
2025 to 2026 and Halpin against Hochul and against Harris.

How the earlier years are checked:
- **2024:** from Benjamin J. Rosenblatt's statewide compilation of certified
  results. Its Suffolk totals equal the County's final count exactly.
- **2013 to 2017:** from OpenElections' transcription of the County's
  precinct returns. Each candidate's Town total equals the County's final
  page exactly. The district lines are checked against the Census Bureau's
  2010 and 2020 voting-district maps.
- **2019, 2021 and 2023:** no source publishes these Supervisor races by
  district, so they appear in the table of every race since 2013, not on
  the map.
- **2025:** the County's figures are its election-night count, so the page
  gives the certified totals beside them.

### 🌾 Preserved land — `/preserved-land`
Every Riverhead farm whose development rights have been bought or restricted,
from Suffolk County's GIS: 8,581 acres on 257 parcels, about a fifth of the
Town. The map colors each parcel by who holds the rights (the County holds
5,961 acres, the Town 1,546 and the two jointly 435) or by the decade it was
preserved. A table lists every parcel. Street addresses and tax-map numbers
are left out.

### 🗳️ Board votes — `/board-votes`
How each Town Board member voted when the Board did not agree. That happened
on 39 of 2,029 resolutions since January 2025, the period for which the site
holds every meeting. The page shows:
- a grid of how often each pair voted alike;
- each member's yes, no, abstain and absence counts;
- every contested resolution with each member's vote.

Abstentions can be recusals, and the page says so.

### 🎁 Grants — `/grants`
Grants and State and federal aid the Town received from 2018 to 2025:
$26.83 million, rising from $1.65 million in 2018 to $7.42 million
in 2025. The figures come from the Town's own Annual Financial Reports to the
State Comptroller. Mortgage tax and State revenue sharing are left out as
general aid. The page shows:
- the total received each year, State and federal;
- what the money paid for, by fund and revenue code;
- every grant, State aid allocation and County agreement the Town Board
  accepted since January 2025, with the award, what was received where a
  record says, and the cost share where the resolution states one;
- the federal awards in the Town's 2025 single audit, from the Federal Audit
  Clearinghouse, which match the federal aid the Town reported to the dollar.

### 🏠 Assessment roll — `/assessment`
Graphs from the Assessor's 2026 tentative and final assessment rolls, totals
only: 16,562 parcels assessed at $1,136,208,305, about $14.7 billion of
market value at the Town's 7.73% uniform percentage. The page shows market
value by property class, the spread of one-family home values (median
$598,965), exemptions from the Town tax by kind, what changed between the
tentative and final rolls, and the school districts. Every parcel record is
added up by class, and the sums must equal the roll's own section totals.

### 🔁 Transfer of development rights — `/tdr`
How Riverhead's TDR program trades farmland for building room. It covers:
- which land can sell credits (the Agricultural Protection Zone, one credit an acre);
- where credits can be used and what one buys (3,000 sq. ft. on Route 58 since December 2024);
- what a credit costs (about $80,000, the Town's planners say);
- how many are outstanding (about 43 in 2023), and that there is no TDR bank;
- the Walmart expansion, row by row from its site plan: 46.212 credits
  needed, 44.9 held, 1.312 more to buy, with a public hearing on November 19, 2026.

### 💸 Budget flow — `/budget-flow`
One diagram of the 2027 Preliminary budget. Its $120,854,219 runs from the
kind of revenue, through each fund, to what it pays for. Revenue and spending
are grouped by the State Comptroller's account codes, and every figure is in
tables under the diagram. Money that moves between funds appears on both
sides, and the page says how much.

### 💵 Donation map — `/donation-map`
Where each Town Board candidate's and party committee's itemized contributions
came from, by ZIP code. Pick a committee and a year, or every year since 2005,
and the map shades the ZIP code areas around Riverhead.

- **Breakdown:** money from ZIP codes that reach into the Town, from elsewhere
  in New York and from other states.
- **Table:** the ZIP codes that gave the most.
- **Comparison:** how much of each committee's money came from Riverhead ZIP
  codes.

The figures are grouped by the ZIP code on each filing, never by name or
address. Each committee's total equals the "direct contributions" on its
campaign-finance card. ZIP codes cross town lines (Wading River, Calverton and
Manorville reach into Brookhaven), and the page says so.

### 📈 Turnout — `/election-map#turnout`
Riverhead's turnout in every November election since 2013, from the County
Board of Elections' final results pages. Each year's figure is the votes cast
in the Town-wide race that drew the most votes, out of the Town's registered
voters.
- **Odd years**, with only local offices on the ballot: 32.3% to 41.3%.
- **Presidential years:** 63.8% to 71.6%.
- **2025:** 32.3% (7,879 of 24,429), the lowest since 2013.

There are gaps:
- 2014, 2018 and 2022 had no Town race, so the County has no Riverhead page
  for those years.
- The County has not yet published Riverhead's 2026 registered voters. The
  chart adds 2026 when its final page appears.
- Registered voters are not published by district, so there is no turnout
  map. The page links to New York Focus's 2026 county turnout map for the
  State-wide view.

### Also this month
- **Meeting schedule** (since October 29): when the Town's website does not
  answer, the meeting refresh keeps the last published schedule and hearings
  instead of publishing an empty one.

---

# Earlier — October 2026

### 📑 The 2027 Preliminary Budget is in
The Town's 2027 Preliminary Budget was on its Financial Reports page by the
evening of October 28, and the site parsed it that night. Its town-wide levy (General Fund, Highway and
Street Lighting) is $643,858 lower than the Tentative's, the same as the six
amendments the Town Board voted on October 20. The pages that compare budget
stages now compare the Preliminary.
Its account lines are now read too (996 lines, 32 changed from the Tentative, each
matching a resolution), so the fund, revenue, programs and budget accuracy pages
show the Preliminary line by line. Pages that measure the Tentative as filed say so.
**[2027 Budget Amendments](https://rike4545.github.io/Riverhead-NY-Budget-Web-App/budget-amendments-2027/)**
sets out each amendment line by line, the votes, and how RiverheadLOCAL and
Newsday reported them.

### 🧾 The 2026 General Election reports — `/campaign-finance`
A new section shows each committee's 32-Day and 11-Day Pre-General reports
for the November 3 election, and the 27-Day Post-General report once it is
filed: contributions, transfers, spending and the latest transaction. It is
refreshed from the State's open data twice a day and can be refreshed live
on the page.

### New pages
- **Ambulance Funding** (`/rvac-funding`): the Ambulance District's taxes,
  medical billing, the RVAC contract, and how fees are meant to repay the
  new building's bond.
- **Fringe Benefits** (`/fringe-benefits`): the yearly allowance elected
  officials and a few managers get on top of salary, and why no budget line
  shows it.
- **Contracts & Bids** (`/contracts`): every 2026 resolution that awards a
  bid, buys equipment, changes a construction contract or hires a firm, with
  the vendor and amount in the resolution's own words.
- **Records to Request** (`/records`): records this site could not find
  published, a ready Freedom of Information Law request for each, and the
  deadlines the Town has to meet.
- **The Supervisors' Tax-Cap Letter, Checked** (`/tax-cap-letter`): what
  Suffolk supervisors asked Albany for, and Riverhead's own record.
- **Brookhaven's** and **Southold's 2027 Tentative** (`/brookhaven-2027`,
  `/southold-2027`): each neighbor's budget beside Riverhead's.
- **Zero or 1% for 2027** (`/zero-percent-2027`): what a 1% levy increase,
  or none, would take.

### Also this month
- **Payroll** shows the text of every union agreement and stipulation, what
  is already set for 2027 pay, and police overtime through the 2027
  Tentative.
- **Board Votes** link each vote to the moment it is read out in the
  meeting video, from this site's own transcripts.
- **Security:** every page carries a Content-Security-Policy that lets only
  the site's own scripts and Google Analytics run, so an injected script is
  refused.
- **Accessibility:** the site aims at WCAG 2.2 AA. Every link and button is
  at least 24 pixels square or has room around it, and when live data fails
  to load the page says what happened and offers to try again.

# Earlier — September 2026

### 📑 The 2027 budget, as soon as the Town posts it
The Supervisor's 2027 Tentative Budget was presented on September 24: $121.0
million of appropriations across all 19 funds, and a $62.9 million town-wide
levy (General Fund, Highway and Street Lighting), up 2.79% from 2026. With the
special districts the levy is $67.2 million. The Supervisor's letter in the
budget says every taxing district is within the Town's 2.79% tax cap limit.
The site parsed it at 10:07 AM and had it live by 10:29 AM. Adopted as
proposed, it would be the first budget under the levy limit in the audited
record, which begins in 2018. Every budget from 2018 through 2026 was over
the limit: five with no override law, then four with one.

The letter is a scanned image, so the site records what it says by hand and
checks each figure it can against the budget's Summary: the 2.79% limit
against every district's levy, the $116.9 million "town operating" total and
the General Fund's use of fund balance. The Summary can't show the retirement
incentive, so its $819,000 saving and count of ten retirees are set beside the
Board's own resolutions on the Buyout page instead. At the meeting the
Financial Administrator put the retiree health cost that offsets the saving at
$268,000, the difference in the letter's own figures, and said replacements
for the retirees are budgeted (Riverhead News-Review).

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

### 🔎 The 2025 audit, in place of the Town's own report
The Town Board accepted the independent audit of 2025 on September 1
(Resolution 2026-834). It is not on the Town's Financial Reports page yet;
it is attached to that meeting's agenda packet, and the site now reads it
from there. The audit puts the General Fund's unassigned balance at
$28,829,513, $841,571 below the Town's own unaudited Annual Financial
Report. The report counts less as Assigned: open purchase orders, and money
set aside for the Teen Center, Senior Day Care, Stotzky Park and community
benefits. Every reserve figure now measures the audited balance: 41.7% of
2026 General Fund appropriations, not 42.9%. The
**[2025 Annual Report](https://rike4545.github.io/Riverhead-NY-Budget-Web-App/annual-report/)**
sets the two side by side, tier by tier.

The audit also shows:
- The General Fund added $4,899,127 in 2025 and ended the year at
  $33,303,051. Revenue grew 7.5% and spending 5.6%.
- Retiree health (OPEB) grew $10.3 million to $142.8 million.
- Debt was 5.48% of the legal limit, down from 6.74%.
- The Recreation Program and PAL funds ended 2023, 2024 and 2025 in deficit.
  Each audit said the deficit would be gone the following year; each year
  it grew. Their fund pages show the record.

Every audited figure is typed in by hand, so `verify-audits.mjs` checks each
one against the text of the page it came from, and fails the build if a
reserve page shows the unaudited figure without saying so.

### 🧮 How Budgets Get Adopted — `/budget-adoption`
Every Riverhead budget since 2005: what the Town Board changed in each
Supervisor's Tentative, whether it did so before or after the public
hearing, and whether it ever voted to adopt the result. Built from the
Town's own budget books.

### ✅ The Supervisor's Promises — `/supervisor-promises`
What Supervisor Jerry Halpin promised, and what he says he has done, checked
against the Town's own votes, budgets and resolutions. Also lists the tests
his 2027 budget will answer.

### 🎤 State of the Town and inaugural addresses — `/state-of-the-town`
Why a Supervisor's State of the Town and inaugural addresses matter, what
State law requires (an annual financial report, not a speech), how the custom
moved from the service clubs' dinner to Town Hall in 2018, and what each
Supervisor since 2010 did, year by year. Data: hand-curated
`web/public/data/supervisor-addresses.json`, every source labelled as a Town
record, news, video or machine transcript; checked by
`web/scripts/verify-supervisor-addresses.mjs`.

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
- **Zero or 1% for 2027** (`/zero-percent-2027`): what a 1% increase, or
  none, would take against the 2027 Tentative and its six amendments.
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
- **Board Votes** (`/meetings`): Town Board meetings as a decision record. Each resolution shows its outcome, each member's vote, whether the official record is on file, and the matching fiscal-impact statement. Each meeting links to the Town's video and to the volunteer transcript at riverheadtranscripts.org. Where this site has transcribed the video, each vote links to the moment the resolution is read out, and the transcript can be searched on the page.
- **Search** (`/search`): about 17,400 records: the site's own pages, budget lines, payroll, authorized salaries, Town Board votes, funds and more than 12,500 pages of financial documents. See **Search** below.

## Explore
- **Where Your Levy Goes** (`/taxpayer-impact`): how the 2026 Town tax levy divides among the funds.
- **What Changed** (`/what-changed`): the 2026 adopted budget against 2025.
- **Financial Health** (`/analytics`): levy growth, spending, reserves and other indicators side by side.
- **Budget Overview** (`/funds`): every operating fund, down through department and spending category to 848 account lines, reconciled to the 2026 adopted budget. Each fund has its own page.
- **Program Budget** (`/programs`): every budget from 2023 to the 2027 proposal regrouped into the seven services the State's account system says the Town performs, with pension and health costs included, fees earned back, and the change between any two years. Earlier Supplements do not add up to their budgets' Summary pages, so 2019–2022 are left out, and the page says so.
- **Budget Compare** (`/compare`): adopted appropriations for every fund, 2020–2026, sortable by the biggest movers.
- **General Fund** (`/general-fund`): appropriations, tax levy and revenues year by year since 2005, from the adopted budgets.
- **Annual Report** (`/annual-report`): actual 2025 year-end results against the plan, for all 14 funds.
- **Where Revenue Comes From** (`/revenue`): every revenue stream, 2018 to the 2027 budget, estimate against what came in, in every fund.
- **Tax Cap** (`/tax-cap`): how the State's levy limit is calculated, what an override does, and Riverhead's audited record.
- **Reserves & Fund Balance** (`/reserves`): the five GASB fund-balance classes, the Town's own reserve rules, and a one-time deployment plan.
- **Where the Surplus Went** (`/fund-balance-draws`): every 2026 resolution that spent fund balance.
- **Ambulance Funding** (`/rvac-funding`): the Ambulance District's tax revenue, medical billing, RVAC contract and budget adjustments, and how ambulance fees are expected to repay the new building's bond.
- **Budget Changes, Live** (`/budget-changes`): every resolution the Town Board has adopted in 2026, the year of the adopted budget it compares against, that changes a budget, totalled by where the money came from: savings, borrowing, grants and aid, or fees. It re-reads the data while open and updates itself when a meeting's records arrive.
- **Capital & Debt** (`/capital-debt`): every bond and Bond Anticipation Note outstanding at the close of 2025, with the repayment schedule, plus a calculator comparing a bond now with a BAN first.
- **Town Square** (`/town-square`): what the Town is building downtown and what it is spending.
- **Road Spending** (`/road-spending`): highway spending per maintained mile, Riverhead against every Suffolk town.
- **Community Preservation Fund** (`/community-preservation-fund`): the 2% transfer-tax revenue history and what its swings mean.
- **Community Housing Plan** (`/housing-plan`): the one Peconic Bay requirement Riverhead has not met.
- **Community** (`/community`): population, the tax base, the largest taxpayers and assessment disputes.

## Government
- **Resident Answers** (`/answers`): plain answers to the questions residents ask, each with the figure and a link to the page that proves it.
- **Organization Chart and Workforce by Title** (`/workforce-by-title`): an organization chart of every office and department with the job titles each paid in the latest year, then headcount by civil-service title and department, 2022–2025.
- **Officials & Pensions** (`/officials`): elected officials who also collect a New York State public pension.
- **Management Pay** (`/management-compensation`): the health-premium change for four appointed positions, and the 2026 raises that followed for two of them.
- **Fringe Benefits** (`/fringe-benefits`): the yearly Town-paid allowance every elected official, and a few managers, gets on top of salary: who gets it, how inflation sets it, and why no budget line shows it.
- **2026 Buyout** (`/buyout`): the final CSEA, PBA and SOA retirement-incentive terms, eligibility and likely savings.
- **Police Spending & Crime** (`/police-crime`): police appropriations next to the Index crime the department reports to the State.
- **School Resource Officers** (`/school-resource-officers`): who pays for them, and every funding route proposed.
- **Supervisors & Council History** (`/town-history`): who has held each seat since 2004.
- **Board Elections** (`/board-elections`): the vote counts that elected each current member.
- **Campaign Finance** (`/campaign-finance`): every current and recent member's committee and both town party committees, from New York State's campaign-finance data. It covers:
  - the unofficial November 3 Supervisor result;
  - a summary table comparing what each committee raised, refunded, borrowed and still owed;
  - a card for each committee, with its 2026 General Election reports and a live Refresh;
  - the County's 2026 contribution limits for Riverhead, and a guide to reading a filing;
  - a Town Employee Donors cross-check.
- **Candidate Watch** (`/candidate-watch`): who is running in November 2026, with links and stated platforms.
- **Candidate Proposals** (`/candidate-cost-benefit`): a cost–benefit look at each stated plank in the 2026 Supervisor race.
- **Supervisor's Promises** (`/supervisor-promises`): commitments checked against the record.
- **State of the Town Addresses** (`/state-of-the-town`): what each Supervisor said in their inaugural and yearly addresses, and what the law requires.
- **Open Meetings Law** (`/open-meetings`): what the law requires, and what the Town's records show.

## Research
- **Start Here** (`/guide`): a plain-English guide to every tool, a budget primer and a glossary.
- **2027 Prediction** (`/predict-2027`): a line-by-line projection with tax-cap scenarios and a scorecard against the Town's budget.
- **2027 Tentative Budget** (`/tentative-2027`): the Town's Tentative against this site's projection, fund by fund.
- **The Supervisors' Tax-Cap Letter, Checked** (`/tax-cap-letter`): Suffolk supervisors' October 2026 letter asking Albany to loosen the tax cap: what it asks, where it is strong, what it leaves out, and Riverhead's own record.
- **How Budgets Get Adopted** (`/budget-adoption`): what the Board changed in every Tentative since 2005.
- **Scenario Lab** (`/scenarios`): close the gap between projected 2027 spending and the tax cap with your own mix of trims, savings, revenue and reserves.
- **2027 Spending Reduction** (`/spending-reduction-2027`): how the retirement incentive plus sourced line trims could close that gap.
- **Zero or 1% for 2027** (`/zero-percent-2027`): what a 1% or a zero-percent 2027 town-wide levy would take, priced on the Tentative, its six amendments and the Budget Supplements' revenue history; `scripts/verify-zero-percent-2027.mjs` checks its figures against those records.
- **Credit Rating** (`/credit-rating`): Riverhead's Aa2 against Brookhaven's AAA and the other Suffolk towns.
- **Southold's 2027 Tentative** (`/southold-2027`): Southold's 2027 Tentative Operating Budget beside Riverhead's, with Brookhaven alongside: savings, the tax cap and the State's growth factors, police, revenue estimates, garbage charges, a capital plan and what each budget book tells residents. Southold's copy is a scan from the Town's website (`etl/data/southold/2027/`), read with OCR and from the page images; `scripts/verify-southold.mjs` checks its tables against each other and its quotations and line figures against the OCR text.
- **Brookhaven's 2027 Tentative** (`/brookhaven-2027`): Brookhaven's 2027 Tentative Operating Budget beside Riverhead's: savings used, growth, the levy, reserves, garbage fees and what each budget book tells residents, with ideas Riverhead could borrow. Brookhaven's copy is a scan, read with OCR and from the page images; `scripts/verify-brookhaven.mjs` checks its tables' arithmetic and its quotations. Per-resident figures use the Census Bureau's July 1 town estimates for Suffolk County (`public/data/census-pep.json`; refresh with `node scripts/fetch-population.mjs` when a new vintage is out, no key needed).
- **2027 Budget Amendments** (`/budget-amendments-2027`): the six amendments to the 2027 budget on the Town Board's October 20, 2026 agenda, as the pre-final draft in the October 15 work-session packet prints them, set against the Tentative's Summary and the 2027 Budget Supplement line by line: the levy by fund, the higher revenue estimates beside past collections, the equipment moved to savings, the estimated tax rates and an even-handed reading of how they bear on the supervisor's race. The cited packet pages are kept in `etl/data/budget-2027/amendments-packet-2026-10-15.json`; `scripts/verify-budget-amendments.mjs` checks each resolution balances fund by fund and that every account, amount and quotation is on its packet page. The page shows each vote from the meeting's record (`public/data/meetings/2026-10-20.json`).
- **Outlier Watch** (`/outliers`): year-over-year swings of at least 20% and $100,000 across all 19 funds, each adopted budget against the year before and next year's proposal (now the 2027 Preliminary) against the last adopted budget. A flagged proposal gets its Budget Supplement lines, and the Debt Service Fund's 2027 fall is set beside the two 2026 votes that paid debt down. A second section lists the accounts the 2027 Preliminary moves most, on the same two bars, with each line's 2025 actual. `scripts/verify-outliers.mjs` holds the page to the records.
- **Budget Accuracy** (`/budget-accuracy`): where adopted amounts and actual spending drift apart: researched flags read from the Supplements, lines over budget three years running, lines never used, every outlier in the newest Supplement, and year-by-year checks of each line's budget against its cost for 2023 to 2025 (`scripts/verify-accuracy-screens.mjs`).
- **Contracts & Bids** (`/contracts`): every 2026 Town Board resolution that awards a bid, extends one, buys equipment, changes a construction contract or hires a firm, with the vendor and amount in the resolution's own words.
- **Fiscal Impact** (`/fiscal-impact`): each resolution's Fiscal Impact Statement next to a realistic financial read, and every dollar figure the resolution's own text states, quoted and labelled (a cost, a fee, money coming in, a budget line, borrowing, a developer's security). Each statement is matched to its resolution by the number printed above it.

## Evidence
- **Source Library** (`/sources`): every parsed Town document, with its fingerprint and a link to the original.
- **Records to Request** (`/records`): records this site could not find published, a ready Freedom of Information Law request for each, built in the browser, and the deadlines the Town has to meet.
- **Downloads** (`/downloads`): CSV files for budgets, payroll, salaries, votes and annual-report results.
- **Data Quality & Freshness** (`/data-quality`): which figures are official and which are calculated, how current each source is, and what each deploy checks.
- **Standards (GFOA)** (`/gfoa`): this site scored against the GFOA budget-presentation criteria.
- **Election Law Case** (`/election-law-case`): what the Town spent fighting New York's even-year election law.
- **Legal Costs** (`/legal-costs`): outside lawyers, the Town Attorney's office and claims, 2018 to the 2027 Preliminary, and the Board's votes on counsel and settlements.
- **Regional CPF Counsel** (`/regional-cpf-counsel`): the regional Community Preservation Fund attorney the 2024 state law requires, the contract the Board tabled, and the home rule question.
- **Preserved Land** (`/preserved-land`): every preserved farm parcel, by who holds the rights and when.
- **Board Votes** (`/board-votes`): how each member voted when the Board did not agree, and who votes with whom.
- **Budget Flow** (`/budget-flow`): the 2027 Preliminary budget from revenue, through the funds, to spending.
- **Grants** (`/grants`): grants and State and federal aid received since 2018, and each grant the Board accepted since 2025 with its award and cost share.
- **Assessment Roll** (`/assessment`): market value by property class, exemptions, home values and what changed between the 2026 tentative and final rolls.
- **Transfer of Development Rights** (`/tdr`): sending and receiving districts, what a credit buys and costs, credits outstanding, and the Walmart expansion.
- **Donation Map** (`/donation-map`): where each committee's itemized contributions came from, by ZIP code, with a committee and year picker, from the State Board of Elections' filings.
- **Election Map** (`/election-map`): Riverhead's 22 election districts, colored by who led, a candidate's share or the votes cast, in fifteen contests from 2013 to 2026 (including the 2024 presidential race). Compare sets any two candidates and years against each other, district by district. The page also lists every Supervisor race since 2013 and charts Riverhead's turnout in every November election since 2013.
- **Officials on Social Media** (`/official-social-media`): when an official's account counts as government speech.
- **Know Your Rights (ICE)** (`/know-your-rights`): your rights if immigration agents come, and New York's 2026 protections.

Also on the site: a guided tour of the budget (`/explore`) and a guide to how
the numbers are labeled and sourced (`/evidence`).

---

## Search

The search covers about 17,400 records: the site's own 64 pages, 848 budget
lines, 1,228 employee pay records, 347 authorized salaries, about 2,180 Town
Board votes, 19 funds and about 12,650 pages from 133 financial documents.
The counts grow as the pipeline adds records.

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

The current focus is the 2027 budget season: the Tentative came out on
September 24 and the Preliminary by October 28; the Adopted budget follows
in November.

---

# Data Sources

This project uses publicly available Town records and New York State data, including:

- **Town of Riverhead Financial Reports**, https://www.townofriverheadny.gov/206/Financial-Reports.
  This covers the Tentative, Preliminary and Adopted Budgets, Budget
  Supplements, Annual Financial Reports and audited financial statements.
- **Town Board meeting records** from the Town's CivicClerk portal: minutes,
  agendas and agenda packets, including each resolution's Fiscal Impact
  Statement, and the Town's video of each meeting.
- **Riverhead Town Meeting Transcripts** (https://riverheadtranscripts.org/), a
  volunteer project that transcribes the Town's videos with OpenAI Whisper. The
  site links to its pages and copies nothing from them; it reads the index page
  only to learn which meetings have a page.
- **This site's own transcripts**, made from the Town's videos with the
  open-source Whisper model (faster-whisper, `small.en`). Like the volunteer
  transcripts they are unofficial: names and figures can be misheard.
- **New York State Board of Elections** campaign-finance disclosure data (data.ny.gov)
- **New York State law**, quoted from the State Senate's text where a page cites it (Town Law, General Municipal Law, Public Officers Law, Election Law)
- **Office of the State Comptroller** Financial Data for Local Governments
- **NYSDOT** Local Highway Inventory road mileage
- **NYS Division of Criminal Justice Services** Index crime counts (data.ny.gov)
- **U.S. Census Bureau** population figures: the 2020 Census count (redistricting data, table P1) and the latest July 1 estimates (`public/data/census-pep.json`), which every per-resident figure divides by through `lib/population.ts`
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
- A hash-based Content-Security-Policy on every page, added after the build (`web/scripts/add-csp.mjs`, checked by `verify-csp.mjs`)
- Automated checks on the built site (`web/scripts/verify-*.mjs`) that hold routes, figures, quotations, ETL contracts, shared-data hashes and source freshness to their records; the quality gate also runs Playwright + axe-core against key resident workflows at desktop and 320px widths, and uploads accessibility findings plus desktop/mobile visual-QA screenshots; three topic-specific ZIP research packets are generated with source registers and SHA-256 manifests. A tap-target audit (`web/scripts/audit-targets.mjs`) remains available for focused manual review.

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
.claude/            Agents, skills and reference checklists for Claude Code
CLAUDE.md           Working rules for Claude Code in this repository
DESIGN.md           The design brief: type, colour, layout, access and words
```

## The automated data pipeline

The site keeps itself current. Six GitHub Actions workflows do the work
(times are UTC):

| Workflow | When | What it does |
| --- | --- | --- |
| **Deploy GitHub Pages** (`deploy-pages.yml`) | Every push to `main`, and on demand | Re-parses every financial-report PDF, rebuilds the budget-stage, General Fund history, adoption, department-request and CPF datasets, the search index and the freshness stamp, then commits any data that changed. It then typechecks, builds, adds the Content-Security-Policy, verifies the output and deploys, waits for the new build to go live, and checks that key pages and data files load. A failed check stops the deploy, and the live site keeps its last good build. |
| **Parse Financial Reports** (`parse-financial-reports.yml`) | Mondays 09:00; daily at 09:00 and 22:00 in September–November | The full pipeline: meetings, financial reports, line items, budget history and stages, General Fund history, AFR actuals, Supplements, votes and fiscal impact, salaries and payroll, the 2027 projection, the buyout, police and crime, road spending, the 2026 General Election campaign-finance reports and committee totals, the election-district map, search, CSVs and freshness. Commits the results and redeploys. |
| **Sync Town Board Meetings** (`sync-meetings.yml`) | Twice a day, 12:30 and 23:30 | Re-checks CivicClerk minutes and agenda packets and the upcoming-meeting schedule. Re-parses votes, falls back to the agenda packet when the minutes omit them, and reconciles each meeting against its official sources. Refreshes each meeting's video and transcript links. Redeploys when anything changed. |
| **Transcribe Town Board Meetings** (`transcribe-meetings.yml`) | Daily at 14:07, and on demand | Transcribes up to three meeting videos a run, newest first, with faster-whisper on the runner's CPU (about 15 minutes for a two-hour meeting). It finds the moment each resolution is read out, and finds them again in saved transcripts when a meeting's record changes. It checks the results, commits them and redeploys. |
| **Watch for budget releases** (`watch-budget-release.yml`) | Every 15 minutes, Sept 24–Oct 6; every 30 minutes, Nov 1–21 | Checks the Town's Financial Reports page for a budget document the site hasn't parsed yet, and starts a deploy the moment one appears. The check itself downloads nothing. It skips while a deploy is already running and limits how often it can start one. |
| **Quality Gate** (`quality-gate.yml`) | Every pull request | Checks ETL syntax, runs the parser and budget-release tests, rebuilds search and freshness data, and checks every external authority link. Then it typechecks, builds and verifies the output. |

Every page shows when its data was last refreshed.

| Script | Produces |
| --- | --- |
| `run_ingestion_safe.py` / `parse_all_pdfs.py` | Downloads every document on the Financial Reports page and extracts its text. A download that fails is tried three times; a document that still cannot be fetched keeps its last parse, and the run shows a warning naming it |
| `parse_financial_reports.py` | Searchable page records for every Town PDF |
| `watch_budget_release.py` | The release check: has the Town posted a budget document the site hasn't parsed? |
| `parse_subaccounts.py` | Fund → department → category → account line items, with 2020–2026 history |
| `parse_budget_history.py` | Fund appropriations, 2020–2026 |
| `parse_budget_stages.py` | Fund-level figures for every Tentative, Preliminary and Adopted budget the Town has published |
| `parse_budget_adoption.py` | What the Board changed in each Tentative before adopting it, 2005 on |
| `parse_budget_requests.py` | What each department asked for, against what the budget officer recommended |
| `parse_general_fund.py` | The long-run General Fund history, adding each newly adopted year from the budget-stage data |
| `parse_preliminary_lines.py` | Every expenditure and revenue account in the 2027 Preliminary Budget book (adopted, request, Tentative and Preliminary columns), tied to the Preliminary and Tentative Summary fund by fund. Writes `budget-2027-preliminary-lines.json`; `parse_supplement_history.py` then lays the Preliminary beside each Supplement line, and `verify-budget-amendments.mjs` checks the book against the six October 20 resolutions |
| `parse_budget_supplement.py` / `parse_supplement_history.py` | Every Budget Supplement line, classified, with its multi-year history. The history script reads all eight committed Supplements (2020–2027) for every fund, expenditure and revenue, and writes the newest Supplement's lines, outliers and run-rate trims; `scripts/verify-supplement.mjs` checks its figures against a second reading of the same PDFs. `/legal-costs/` reads the Town Attorney's and every legal-services account from this history; `scripts/verify-legal-costs.mjs` rebuilds its four groups from `line-history.json` and fails if a legal account that spent money is left out |
| `parse_afr.py` | Actual year-end results for all 14 AFR funds |
| `parse_cpf.py` | Peconic Bay Community Preservation Fund results |
| `fetch_meetings.py` / `fetch_upcoming.py` / `fetch_vote_packets.py` | Meeting minutes, the upcoming schedule, and agenda packets when the minutes omit votes |
| `parse_meetings.py` / `apply_vote_packet_fallback.py` / `reconcile_meeting_sources.py` | The voting record, every resolution and vote, checked against its official sources |
| `parse_fiscal_impact.py` | Each meeting's Fiscal Impact Statements and a corrected read, matched to resolutions by printed number, with the dollar figures each resolution states |
| `build_meeting_media.py` | Each meeting's video, its riverheadtranscripts.org page and this site's transcript, with vote times (`media.json`) |
| `transcribe_meetings.py` | This site's Whisper transcript of a meeting video, and the moment each resolution is read out |
| `analyze_consent_calendar.py` | The Board's unanimous-vote rate and other voting patterns |
| `parse_salary_schedule.py` / `parse_salary_2026.py` | Board-authorized salaries for 2025 and 2026, and the raise comparison |
| `parse_payroll.py` | Per-employee actual pay 2018–2025 (from slimmed CSVs in `etl/data/`) |
| `build_management_history.py` | Multi-year management salary history |
| `predict_2027.py` | The line-by-line 2027 projection |
| `analyze_buyout.py` | Cost and likely savings of the 2026 retirement incentive |
| `parse_police_crime.py` | Police spending next to reported Index crime. The State's figures are fetched at most weekly; if data.ny.gov cannot be reached, they stay as last fetched and the run shows a warning |
| `build_campaign_reports.py` | Each committee's 2026 General Election reports from data.ny.gov, by report and schedule. If data.ny.gov cannot be reached, the last copy stays and the run shows a warning |
| `build_campaign_totals.py` | Each committee's stored figures on `/campaign-finance/`: what it raised, refunded and borrowed, its in-kind gifts, and what it owed at its latest report. It writes `campaign-finance-totals.json` and never the hand-typed `campaign-finance.json`. The rules match the page's live Refresh: money moved between one official's own committees is not counted twice. If data.ny.gov cannot be reached, the last figures stay |
| `build_donation_map.py` | Each committee's itemized contributions (Schedules A to C) by ZIP code and year, from the same data.ny.gov dataset, for `/donation-map/` (`campaign-donations-by-zip.json`). No names or addresses are kept. If data.ny.gov cannot be reached, the last file stays |
| `build_preserved_land.py` | Riverhead's preserved-farmland parcels from the County GIS (`geo/riverhead-preserved-farmland.json`), with who holds the rights, acres, year and hamlet, never the address. If the GIS cannot be reached, the last file stays |
| `build_vote_agreement.py` | Each contested resolution since 2025 and how often each pair of Board members voted alike (`vote-agreement.json`), from the site's own voting record; it reruns whenever the meeting records change |
| `build_grants.py` | Grants and State and federal aid the Town received each year since 2018, by revenue account, from the State Comptroller's data, and each single audit's federal awards from the Federal Audit Clearinghouse (`grants-received.json`). It stops if an audit's federal total differs from the Comptroller's. If a source cannot be reached, the last file stays. The award-by-award list (`grants-awards.json`) is hand-curated from Board resolutions |
| `build_assessment_roll.py` | Run by hand when the Assessor posts a roll (tentative by May 1, final in September): town-wide totals from the 2026 tentative and final rolls (`assessment-roll-2026.json`) by property class, roll section, school district and exemption, and the spread of one-family home values. No owner, address or single parcel's value is kept. It writes nothing unless the parcel records add to the roll's own section totals. Needs `pdftotext` |
| `build_election_map.py` | Riverhead's 22 election-district boundaries from the County GIS (`riverhead-districts.json`) and each district's votes in the 2026 and 2025 general elections from the Board of Elections' results site, plus every Supervisor race and each November's turnout since 2013 from the County's final results pages (`riverhead-map.json`), for `/election-map/`. A candidate on several party lines is counted once. If a source cannot be reached, its file stays as it was |
| `import_2024_results.py` | Run by hand: Riverhead's 2024 President and 1st Congressional District results by district, from Benjamin J. Rosenblatt's statewide compilation (`riverhead-2024.json`). It writes nothing unless Suffolk's totals equal the County's final 2024 results exactly and the 2024 districts match today's to 99% |
| `import_past_supervisor.py` | Run by hand: the 2013, 2015 and 2017 Supervisor races by district, from OpenElections' transcription of the County's precinct returns (`riverhead-supervisor-past.json`). It writes nothing unless each candidate's Town total equals the County's final page exactly and the Census Bureau's 2010 and 2020 voting-district maps match today's districts |
| `import_zip_areas.py` | Run by hand: the Census Bureau's 2020 ZIP code areas around Riverhead, simplified for the web, each with the share of the Town it covers (`geo/riverhead-zip-areas.json`) |
| `build_contract_awards.py` | The `/contracts/` list of bid awards and agreements, from freshly downloaded agenda packets |
| `parse_road_spending.py` | Highway spending per maintained mile for the ten Suffolk towns, from State Comptroller filings and NYSDOT's road inventory |
| `build_search_index.py` | The sharded search index |
| `export_csv.py` | The CSV downloads |
| `ocr_scanned_pdf.py` | The text of a scanned PDF with no text layer, page by page (Brookhaven's 2027 Tentative). Run by hand: it needs Tesseract, which the workflows do not install |
| `write_meta.py` | The sitewide data-freshness stamp |

The pipeline keeps its own copies of some inputs under `etl/data/`: payroll
exports, salary schedules, the AFR, Budget Supplements and meeting-minutes
text. Those datasets rebuild from a clean checkout. Budget documents are
downloaded again from the Town's Financial Reports page on each run.

**Not part of the automated pipeline:** Campaign Finance's filing lists,
donor breakdowns and watch lists come from data.ny.gov live in the browser
when a reader presses Refresh. The pipeline stores only the committee totals
and the 2026 General Election reports. The facts about each official (office,
term, salary, notes) are typed by hand in `campaign-finance.json`, and the
2026 election result in `web/lib/election-results-2026.ts`; both change when
the sources are reviewed again, such as when the County certifies the
result.
Research pages such as Town Square, the Supervisor's promises, the Open
Meetings Law, credit ratings and the Brookhaven comparison are written by hand
from the sources they cite. They change when those sources are reviewed again.

---

# Status

Riverhead Budget Live is under active development and expanding rapidly as additional Town financial records, New York State disclosure data, and analytics systems are integrated into the platform.
