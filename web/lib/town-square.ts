// The Town Square project, gathered in one place.
//
// The Town's largest downtown capital undertaking had no page of its own here.
// What existed was scattered: the bond anticipation note on the capital-debt
// page, a passing line on the scenarios page, a mention in the 2026 candidate
// material. A resident could not see the shape of it, and the pieces did not
// agree with each other.
//
// WHAT THIS TRACKS THAT MATTERS FISCALLY. Two separate draws on the General Fund
// balance are being made for one project: the July 2026 vote to pay down the
// project's bond anticipation note, and the September 2026 authorisation to pay
// $1.95 million for 111 East Main Street out of fund balance. Neither is a
// borrowing. Both spend accumulated surplus, which is the thing the reserve
// policy exists to govern, so both belong in the same frame.
//
// WHAT IS NOT KNOWN, AND IS SAID SO. The July resolution's title states no
// amount, and no financial report covering 2026 has been filed. The site
// previously asserted that paydown was $2.6 million; nothing in the record
// supports that figure and it has been removed rather than left standing.

export type Milestone = {
  date: string
  what: string
  detail: string
  kind: 'property' | 'money' | 'legal' | 'build'
  source: string
}

export const project = {
  name: 'Town Square',
  where: 'East Main Street, Riverhead, on the Peconic riverfront',
  what:
    'A public plaza, playground and amphitheatre, together with a five-storey, 92-room hotel and a restaurant, and major site work to carry out flood mitigation along the Peconic Riverfront. A parking garage north of East Main Street is planned separately as part of the same downtown effort.',
  status:
    'Demolition and site work have begun. Town officials have said the overall project cannot be built out while the science center parcel stays unresolved, which is the stated reason for the condemnation described below.',
  asOf: 'September 2, 2026',
}

// Ordered oldest first. Everything here is drawn from a named source; nothing is
// inferred from the shape of the story.
export const timeline: Milestone[] = [
  {
    date: '2020',
    kind: 'property',
    what: 'The Place for Learning buys 111 East Main Street',
    detail:
      'The purchase of the building intended for the Long Island Science Center is what prompted the Town to buy the three adjoining properties to its east — the parcels that became the Town Square site.',
    source: 'RiverheadLOCAL, September 2, 2026',
  },
  {
    date: 'February 14, 2020',
    kind: 'build',
    what: 'The Town unveils the Town Square plan',
    detail:
      'The Supervisor presented the plan for a town square and an expanded Long Island Science Center, describing it as a “heart transplant” for Main Street. The science center was then considered the centrepiece of the plan.',
    source: 'RiverheadLOCAL, February 14, 2020',
  },
  {
    date: 'August 15, 2021',
    kind: 'money',
    what: 'A bond anticipation note funds the property purchases',
    detail:
      'A $2,800,000 note for “Purchase of Town Square properties.” It stood at $2,725,000 at the close of 2025 and reached its maturity date on August 14, 2026 — five years after issue, which is the statutory outside limit for converting a capital note into long-term bonds.',
    source: '2025 Annual Financial Report, Statement of Indebtedness',
  },
  {
    date: 'July 2025',
    kind: 'build',
    what: 'J. Petrocelli named master developer, with a $32.7M private budget',
    detail:
      'The Community Development Agency’s Qualified and Eligible review produced a CPA verification of the developer’s financial capacity and a development budget totalling $32,672,889.76 — about 97% of it a construction loan and developer equity, with a $1,000,000 Restore NY grant the only public money in it.',
    source: 'Town of Riverhead, Town Square QE Documents',
  },
  {
    date: 'December 12, 2025',
    kind: 'build',
    what: 'Groundbreaking',
    detail:
      'The Town held its groundbreaking ceremony and published a full accounting of the public money behind the project — $34.9 million across seven federal, state and county awards. Supervisor Tim Hubbard called it “a vision that has been 30 years in the making.”',
    source: 'Town of Riverhead press release, December 12, 2025',
  },
  {
    date: 'March 2026',
    kind: 'legal',
    what: 'The Town revives eminent domain after the science center stalls',
    detail:
      'The nonprofit had not begun the first phase of its expansion and held no building permits. Its representatives cancelled a scheduled Town Board update at the last minute as a roughly $1 million grant tied to the project neared its deadline. Councilwoman Merrifield: “I have absolutely no hope that the Science Center will ever come to fruition in the time schedule that we need for the activation of our Town Square.” The Board had backed off eminent domain a year earlier when the science center presented a two-phase plan.',
    source: 'Riverhead News-Review, March 27, 2026',
  },
  {
    date: 'April–June 2026',
    kind: 'legal',
    what: 'The Board votes to take the property — over the Supervisor’s objection',
    detail:
      'Three votes, none unanimous. The acquisition was affirmed 3-2 on April 7 and the condemnation hearing set 3-2 on April 21, with Supervisor Halpin and Councilman Kern against both. The findings under the Eminent Domain Procedure Law passed 3-1 on June 2 with the same two abstaining.',
    source: 'Town Board resolutions 2026-327, 2026-404 and 2026-553',
  },
  {
    date: 'June 18, 2026',
    kind: 'legal',
    what: 'The Town publishes its determination to take 111 East Main Street',
    detail:
      'Publication started a 30-day window in which the owner could have brought an action challenging the condemnation itself. No such challenge was filed, according to court filings reviewed by RiverheadLOCAL.',
    source: 'RiverheadLOCAL, September 2, 2026',
  },
  {
    date: 'July 7, 2026',
    kind: 'money',
    what: 'The Board votes to pay down the Town Square note with fund balance',
    detail:
      'Resolution 2026-641, adopted unanimously — a budget adjustment using fund balance to pay the note down rather than roll it over again. The resolution title states no amount, and no financial report covering 2026 has been filed, so how much was applied is not on the public record.',
    source: 'Town Board meeting of July 7, 2026',
  },
  {
    date: 'August 4, 2026',
    kind: 'build',
    what: 'The Peconic River Hotel wins site plan and special permit approval',
    detail:
      'A unanimous 5-0 vote on resolution 2026-746, for a five-storey, 94-room Tapestry by Hilton at 117–127 East Main Street — 69,738 square feet on about 0.42 acres, with retail, a restaurant, a café and nine staff parking spaces below. The same meeting ratified a budget adjustment temporarily amending the funding source for the note paydown, resolution 2026-762.',
    source: 'RiverheadLOCAL, August 5, 2026; Town Board resolutions 2026-746 and 2026-762',
  },
  {
    date: 'August 26, 2026',
    kind: 'legal',
    what: 'The court issues a vesting order',
    detail:
      'Under the State’s Eminent Domain Procedure Law, title passes to the Town once the vesting order and the acquisition map are filed with the county clerk.',
    source: 'RiverheadLOCAL, September 2, 2026',
  },
  {
    date: 'September 1, 2026',
    kind: 'money',
    what: 'The Board authorises a $1.95 million offer, payable from fund balance',
    detail:
      'A unanimous vote approving the Town’s appraisal at $1,950,000 and authorising its attorneys to transmit that offer to The Place for Learning, with the sum to be paid out of the General Fund balance. The resolution also authorises the town financial administrator to establish a budget for the expenditure.',
    source: 'RiverheadLOCAL, September 2, 2026',
  },
]

// THE OTHER LEDGER. The Town's spending and the development's cost are two
// different books, and adding them together is the easy mistake this section
// exists to prevent. The vertical development — hotel, condominiums, retail —
// is privately financed. Its figures come from the master developer's budget
// filed with the Town's Community Development Agency as part of the Qualified
// and Eligible review, which the Town publishes in full.
export const developmentBudget = {
  asOf: 'July 22, 2025',
  developer: 'J. Petrocelli Development Associates',
  qualification:
    'Named master developer through a Qualified and Eligible review by the Town’s Community Development Agency. A CPA letter dated July 17, 2025 from Piccirillo, Lamont & Giammarese LLP verified J. Petrocelli Contracting’s financial capacity to complete the project.',
  total: 32_672_889.76,
  perKey: 371_282.84,
  keys: 88,
  sources: [
    { label: 'Construction loan', amount: 19_603_733.86, share: 60.0, kind: 'private' as const },
    { label: 'Developer equity', amount: 12_069_155.90, share: 36.94, kind: 'private' as const },
    { label: 'Restore NY grant, awarded 2024', amount: 1_000_000, share: 3.06, kind: 'public' as const },
  ],
  uses: [
    { label: 'Hard costs', amount: 26_079_289.76, note: 'Includes $2,125,000 of parking garage construction, $1,579,000 of hotel infrastructure at the plaza, and $450,000 to demolish the existing building.' },
    { label: 'Land acquisition', amount: 2_625_000, note: 'The developer acquiring the parcels — money flowing toward the Town, not out of it.' },
    { label: 'Soft costs', amount: 3_365_600, note: 'Architecture and engineering, appraisal, legal, financing points, and a $1,680,000 interest reserve.' },
    { label: 'Contingency', amount: 603_000, note: 'Held against hard costs.' },
  ],
  // Worth stating plainly, because it is the thing most easily got wrong.
  whoPays:
    'Of the $32.7 million, roughly 97% is private — a construction loan and developer equity. The only public money in this budget is a $1,000,000 Restore NY grant awarded in 2024. None of it is Town fund balance. A letter of support in the same filing describes it as “this privately funded project.”',
}

// The two documents disagree about the building, and both are dated.
export const scopeDiscrepancy = {
  headline: 'The room count depends on which document you read',
  detail:
    'RiverheadLOCAL reported in September 2026 that the project includes a five-storey, 92-room hotel. The developer’s own budget, filed with the Town in July 2025, describes 76 hotel rooms and 12 condominium units — 88 keys, which is the figure its cost-per-key is calculated on. Plans change over fourteen months and both may have been accurate when written, so both are shown here rather than one being picked.',
}

// THE VOTES. The September offer was unanimous, and reporting only that would
// leave a false impression. The decision to take the property was not: it was
// carried 3-2 twice over the Supervisor's objection, and the findings that made
// it final passed 3-1 with two abstentions. Riverhead's own resolution record
// holds all of it, so the page shows the split rather than the headline.
export type BoardVote = {
  date: string
  number: string
  title: string
  result: string
  contested: boolean
  dissent?: string
}

export const boardRecord: BoardVote[] = [
  {
    date: 'June 3, 2025', number: '2025-499',
    title: 'Findings and determination under the Eminent Domain Procedure Law — leasehold interest',
    result: 'Adopted 4–1', contested: true, dissent: 'Kern voted no.',
  },
  {
    date: 'July 1, 2025', number: '2025-591',
    title: 'Accepts a $1,400,000 New York State ESD grant for the Town Square riverfront amphitheatre',
    result: 'Adopted unanimously', contested: false,
  },
  {
    date: 'April 7, 2026', number: '2026-327',
    title: 'Affirms the prior authorisation to acquire 111 East Main Street',
    result: 'Adopted 3–2', contested: true, dissent: 'Supervisor Halpin and Councilman Kern voted no.',
  },
  {
    date: 'April 21, 2026', number: '2026-404',
    title: 'Sets the public hearing on condemning the parcel',
    result: 'Adopted 3–2', contested: true, dissent: 'Halpin and Kern voted no again.',
  },
  {
    date: 'June 2, 2026', number: '2026-553',
    title: 'Findings and determination under the Eminent Domain Procedure Law — fee title to 111 East Main Street',
    result: 'Adopted 3–1', contested: true, dissent: 'Halpin and Kern abstained rather than voting no.',
  },
  {
    date: 'June 16, 2026', number: '2026-566',
    title: 'Closes Capital Project #12101, Town Square Properties',
    result: 'Adopted unanimously', contested: false,
  },
  {
    date: 'July 7, 2026', number: '2026-641',
    title: 'Budget adjustment to pay down the Town Square bond anticipation note',
    result: 'Adopted unanimously', contested: false,
  },
  {
    date: 'August 4, 2026', number: '2026-746',
    title: 'Grants special permit and site plan approval for the Peconic River Hotel',
    result: 'Adopted unanimously', contested: false,
  },
  {
    date: 'August 4, 2026', number: '2026-762',
    title: 'Ratifies a budget adjustment temporarily amending the funding source for the note paydown',
    result: 'Adopted unanimously', contested: false,
  },
]

export const voteSummary =
  'Every money vote on this project has been unanimous. Every vote to take the property was not. The Supervisor voted against the acquisition in April 2026 and against setting the condemnation hearing two weeks later, then abstained when the findings were adopted in June. Councilman Kern did the same, and had voted no on the leasehold findings a year earlier. Three members — Rothwell, Merrifield and Waski — carried it each time.'

// PUBLIC MONEY. The Town published a complete itemisation at the December 2025
// groundbreaking, which is a better source than any reporting: seven awards from
// federal, state and county government totalling $34.9 million. The largest by
// far is federal. Note the $1.4M amphitheatre award sits inside the $3.2M Empire
// State Development line and is not a separate eighth award — adding it again
// would overstate the total by that much.
export const publicMoney = {
  asOf: 'December 12, 2025',
  awards: [
    { label: 'Federal RAISE grant, U.S. Department of Transportation', amount: 24_123_369, level: 'federal' as const,
      note: 'Secured under the Bipartisan Infrastructure Law. Senator Schumer described it as funding to reclaim the Peconic riverfront for public use, install flood mitigation, spur mixed-use development and make downtown safer for pedestrians and cyclists.' },
    { label: 'NYS Downtown Revitalization Initiative, Department of State', amount: 4_200_000, level: 'state' as const,
      note: 'Riverhead’s downtown won a $10 million DRI award in January 2022; this is the share directed to the Town Square itself.' },
    { label: 'Empire State Development', amount: 3_200_000, level: 'state' as const,
      note: 'Includes the $1,400,000 for the riverfront amphitheatre that the Board accepted by resolution 2025-591 — a part of this line, not an addition to it.' },
    { label: 'Suffolk County Jumpstart', amount: 2_400_000, level: 'county' as const, note: '' },
    { label: 'NYS Parks, Recreation and Historic Preservation', amount: 500_000, level: 'state' as const, note: '' },
    { label: 'Brownfield Opportunity Area funds, Department of State', amount: 400_000, level: 'state' as const, note: '' },
    { label: 'Suffolk County Downtown Revitalization', amount: 97_500, level: 'county' as const, note: '' },
  ],
  total: 34_920_869,
}

// THE WHOLE SHAPE. Three separate pots pay for this, and the Town's own money is
// the smallest of them by a wide margin. Setting them side by side is the single
// most useful thing this page does, because every individual story about the
// project describes only one.
export const threeLedgers = {
  lede:
    'Roughly $72 million is going into the Town Square between grants, private development and Town land assembly. Riverhead’s own accumulated surplus covers about 6% of that.',
  note:
    'These are not a single budget and should not be read as one. Grants and the developer’s financing pay for different things, on different schedules, and the Town’s figure is land assembly rather than construction. What the comparison shows is scale: the Town’s own cash exposure is small relative to the money moving through the project.',
}

// The building has been redescribed several times. Rather than pick, show the run.
export const scopeEvolution = {
  headline: 'The hotel has been four different buildings on paper',
  rows: [
    { when: 'April 2022', what: 'Four storeys, 84 rooms', extra: 'Plus a two-storey building west of the square, a boat house on the river, and a four-storey riverfront condominium building — all since dropped from the plan.', source: 'RiverheadLOCAL, April 17, 2024' },
    { when: 'July 22, 2025', what: '76 hotel rooms and 12 condominium units', extra: '88 keys, which is what the developer’s cost-per-key of $371,283 is calculated on.', source: 'Town of Riverhead, Town Square QE Documents' },
    { when: 'August 4, 2026', what: 'Five storeys, 94 rooms — approved', extra: 'A 69,738 sq ft building on roughly 0.42 acres at 117–127 East Main Street, with retail, a restaurant, a café and nine staff parking spaces on the lower level. Branded as a Tapestry by Hilton. This is the version that holds site plan and special permit approval, granted unanimously by resolution 2026-746.', source: 'RiverheadLOCAL, August 5, 2026; Town Board resolution 2026-746' },
    { when: 'September 2, 2026', what: 'Described as 92 rooms', extra: 'Later reporting gives a slightly different count than the approved plan. The approved figure is the one to rely on.', source: 'RiverheadLOCAL, September 2, 2026' },
  ],
}

export const acquisition = {
  parcel: '111 East Main Street',
  owner: 'The Place for Learning, which owns the real estate and operates the science center',
  mortgageHolders: 'Elifran LLC and Fralin LLC, whose attorneys filed notices of appearance after being served',
  offer: 1_950_000,
  basis:
    'State law requires the Town to make a formal written offer based on its own highest approved appraisal. $1.95 million is that appraisal.',
  // The single most important thing for a reader to understand about the number.
  notFinal:
    'The owner may take the $1.95 million as full payment, or take it as an advance payment and keep seeking more in court. Once title vests the remaining dispute is usually only about money — whether the appraisal reflects fair value. So $1.95 million is a floor on what this parcel costs the Town, not a ceiling.',
  whyItMatters:
    'The parcel borders the Town Square site on its west side and officials have called it integral to the plan. Board members have repeatedly cited the lack of progress on redeveloping the building as their reason for condemning it — the science center had not begun its first phase and held no building permits, and its representatives cancelled a scheduled Town Board update in March 2026 as a roughly $1 million grant tied to the project neared its deadline.',
  contested:
    'The $1.95 million offer passed unanimously, but the decision to take the property did not. It was carried 3-2 in April 2026 over the Supervisor’s objection, twice, and the findings that made it final passed 3-1 in June with two abstentions. The Board had backed off eminent domain a year earlier, in 2025, after the science center presented a two-phase plan and pledged to proceed.',
}

// The fiscal question a resident actually has: does this dent the reserves?
// Figures come from the site's existing pipeline rather than fresh constants —
// the 2025 AFR's audited Unassigned balance and the 2026 Adopted appropriations.
export const fundBalanceImpact = {
  lede:
    'Both draws come out of accumulated surplus rather than new borrowing, which puts them squarely inside what the Town’s reserve policy governs.',
  draws: [
    {
      label: 'Acquisition offer for 111 East Main Street',
      amount: 1_950_000,
      certainty: 'authorised' as const,
      note: 'Authorised September 1, 2026, explicitly from the General Fund balance. Could rise if the owner pursues more in court.',
    },
    {
      label: 'Town Square note paydown',
      amount: 2_725_000,
      certainty: 'ceiling' as const,
      note: 'The July 7 resolution states no amount. $2,725,000 was the full balance outstanding at the close of 2025, so it is the most the paydown could have been, not what it was.',
    },
  ],
  verdict:
    'Even taking the paydown at its ceiling, the two together are about a sixth of the unassigned balance and leave it near twice the top of the Town’s own policy range. This is a real draw on surplus, and it is comfortably affordable. Both things are true, and a page that reported only one of them would be misleading.',
  caveat:
    'These are the audited December 31, 2025 balances against the 2026 adopted appropriations. They do not reflect anything that happened to fund balance during 2026, because no report covering 2026 has been filed.',
}

export const openQuestions = [
  'How much did the July 7 note paydown actually apply? The resolution title does not say, and no 2026 financial report exists yet.',
  'Will The Place for Learning accept the $1.95 million as full payment, or take it as an advance and litigate for more? That answer sets the real acquisition cost.',
  'What has the Town itself spent in total — land, demolition, site work, flood mitigation — as opposed to what the developer is spending? The developer’s $32.7 million budget is published; no equivalent consolidated figure for the Town’s own outlay is.',
  'What are the terms of the master developer agreement? J. Petrocelli was designated master developer in April 2022; as of April 2024 the agreement had not been finalised and its terms had not been publicly discussed. Nothing published since answers it.',
  'What does the Town receive when the developer buys the land? The developer’s budget books $2,625,000 for land acquisition — money flowing toward the Town — but no public document reviewed here confirms the price or the terms of that conveyance.',
]

export const sources = [
  {
    title: 'RiverheadLOCAL — Riverhead moves ahead with eminent domain of science center property, approves $1.95M offer (September 2, 2026)',
    url: 'https://riverheadlocal.com/2026/09/02/riverhead-approves-1-95-million-offer-for-long-island-science-center-site/',
    covers: 'The offer, the vesting order, the unchallenged determination, the project scope, and that the money comes from fund balance.',
  },
  {
    title: 'Town of Riverhead 2025 Annual Financial Report — Statement of Indebtedness',
    url: 'https://www.townofriverheadny.gov/DocumentCenter/View/3513/2025-Annual-Financial-Report',
    covers: 'The bond anticipation note: $2,800,000 issued August 15, 2021, $2,725,000 outstanding at December 31, 2025, matured August 14, 2026.',
  },
  {
    title: 'Town of Riverhead — press release, groundbreaking ceremony (December 12, 2025)',
    url: 'https://www.townofriverheadny.gov/',
    covers: 'The complete itemisation of public funding — seven federal, state and county awards totalling $34,920,869 — and the groundbreaking itself. The Town’s own accounting, and the source for every grant figure on this page.',
  },
  {
    title: 'Riverhead News-Review — Riverhead may seize L.I. Science Center property amid delays (March 27, 2026)',
    url: 'https://riverheadnewsreview.timesreview.com/2026/03/132743/riverhead-may-seize-l-i-science-center-amid-delays/',
    covers: 'Why the Town revived eminent domain: no building permits, no start on phase one, a cancelled Board update, and a $1 million grant nearing its deadline.',
  },
  {
    title: 'RiverheadLOCAL — Petrocelli hotel wins site plan and special permit approvals (August 5, 2026)',
    url: 'https://riverheadlocal.com/2026/08/05/https-riverheadlocal-com-2026-08-05-petrocelli-hotel-approvals-riverhead/',
    covers: 'The approved building: five storeys, 94 rooms, 69,738 sq ft at 117–127 East Main Street, branded Tapestry by Hilton.',
  },
  {
    title: 'RiverheadLOCAL — Town plans to apply for state grant to aid Petrocelli hotel project (April 17, 2024)',
    url: 'https://riverheadlocal.com/2024/04/17/town-plans-to-apply-for-state-grant-to-aid-petrocelli-hotel-project-on-town-square/',
    covers: 'The 2022 master developer designation, the original 84-room scheme and the elements since dropped, and the Restore NY application.',
  },
  {
    title: 'Newsday — Riverhead close to selecting town square developer, but some criticize hotel part of plan (July 23, 2025)',
    url: 'https://www.newsday.com/long-island/towns/riverhead-town-square-hotel-plan-wd7j9ckh',
    covers: 'The developer selection. Cited for its headline and opening only — the article is behind a paywall and was not read in full here.',
  },
  {
    title: 'Town of Riverhead — Town Square QE Documents (Qualified and Eligible filing)',
    url: 'https://www.townofriverheadny.gov/DocumentCenter/View/2344/Town-Square-QE-Documents',
    covers: 'The July 22, 2025 development budget in full, the CPA financial verification, and letters of support. The source for every developer figure on this page.',
  },
  {
    title: 'Town of Riverhead — Downtown Revitalization Projects',
    url: 'https://www.townofriverheadny.gov/213/Downtown-Revitalization-Projects',
    covers: 'Where the QE documents and presentation are published, alongside the East Main Street Urban Renewal Area Plan and the 2021 Pattern Book.',
  },
  {
    title: 'Riverhead Budget Live — Town Board Votes',
    url: 'https://rike4545.github.io/Riverhead-NY-Budget-Web-App/meetings/',
    covers: 'Resolution 2026-641 of July 7, 2026, the vote to pay the note down with fund balance.',
  },
]
