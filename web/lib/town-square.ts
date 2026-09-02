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
    'The parcel borders the Town Square site on its west side and officials have called it integral to the plan. Board members have repeatedly cited the lack of progress on redeveloping the building as their reason for condemning it.',
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
  'Beyond the $1,000,000 Restore NY grant inside the developer’s budget, which state and federal awards has the Town secured for the square, flood mitigation and the parking garage, and for how much? The Town’s Downtown Revitalization Efforts page lists grants from 2006 to 2012 and planning studies, but nothing about Town Square.',
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
