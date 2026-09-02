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
    'Construction has started. The Town described itself in August 2026 as moving from planning into construction across six connected downtown projects, with the hotel mobilising first and the parking garage not finished until 2030. Officials have said the overall project cannot be built out while the science center parcel stays unresolved, which is the stated reason for the condemnation described below.',
  asOf: 'September 2, 2026',
}

// Ordered oldest first. Everything here is drawn from a named source; nothing is
// inferred from the shape of the story.
export const timeline: Milestone[] = [
  {
    date: 'December 2019',
    kind: 'money',
    what: 'Two state grants seed the idea',
    detail:
      'The Long Island Regional Economic Development Council awarded $775,000 to the Long Island Science Center for its expansion and $800,000 to the Town, in the same round, to create a town square opening the riverfront to Main Street.',
    source: 'RiverheadLOCAL, February 4, 2020',
  },
  {
    date: 'February 2020',
    kind: 'property',
    what: 'The science center moves to buy the old Swezey’s building',
    detail:
      'Board president Laurence Oxman announced the purchase of 111 East Main Street, the former Swezey’s Department Store, for a permanent home — 24,000 square feet over two floors, quadruple its existing space. Plans were unveiled at a February 14 press conference where Supervisor Yvette Aguiar called it “a heart transplant for Riverhead.” The completed purchase, in April 2020, was $1.45 million.',
    source: 'RiverheadLOCAL, February 4 and 14, 2020; April 1, 2025',
  },
  {
    date: 'May 2021',
    kind: 'property',
    what: 'The Town buys three buildings east of the science center',
    detail:
      'Two were demolished, creating the green space that became the public plaza. The third, 127 East Main Street, was left standing and cost the Town $2,650,000 — a two-storey building with two ground-floor storefronts and offices above, partly tenanted. One storefront was leased to the bar Craft’d; the other now houses the Riverhead Chamber of Commerce and the Business Improvement District.',
    source: 'RiverheadLOCAL, April 1, 2025',
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
    what: 'The developer files a $32.7M private budget for review',
    detail:
      'The Community Development Agency’s Qualified and Eligible review produced a CPA verification of the developer’s financial capacity and a development budget totalling $32,672,889.76 — about 97% of it a construction loan and developer equity, with a $1,000,000 Restore NY grant the only public money in it. J. Petrocelli had already been designated master developer in April 2022; this was the review that had to clear before the land could change hands.',
    source: 'Town of Riverhead, Town Square QE Documents',
  },
  {
    date: 'August 5, 2025',
    kind: 'money',
    what: 'The Board approves the developer agreement and the land sale',
    detail:
      'Resolution 2025-696 declared J. Petrocelli Riverhead Town Square LLC a qualified and eligible sponsor under the State Urban Renewal Law, which lets the Town sell it the land — including the standing building at 127 East Main Street — for $2,625,000 without competitive bidding. The same action authorised the master developer agreement, under which the Town pays the company a construction management fee of 7% of the cost of building the public plaza, playground, walkways and amphitheatre, and takes on certain maintenance obligations for them. Adopted unanimously, moved by Rothwell and seconded by Kern, after fifteen letters of objection and a run of critical public comment.',
    source: 'Town Board resolution 2025-696; RiverheadLOCAL, August 6, 2025',
  },
  {
    date: 'April–September 2025',
    kind: 'legal',
    what: 'The Craft’d leasehold is condemned, then settled for $170,000',
    detail:
      'The Town owned 127 East Main Street but not the bar inside it: when it took title in 2021 it took the building subject to SNR Bar 25 Corp’s 2018 lease, whose two five-year renewal options ran the tenancy to November 2033. Clearing the site meant buying that lease out. Public hearings were set unanimously in April, with Supervisor Tim Hubbard saying he would invite the science center’s board to a work session and that the Town would help Craft’d relocate. Co-owner Sean Kenna told the Board he was disappointed by what he called a communication breakdown. The Board funded a $120,000 offer on August 5; a State Supreme Court judge granted the Town’s petition on August 27 and the order was filed the next day; the settlement was signed September 3 at $170,000, with a second budget adjustment on September 16 covering the difference. Craft’d closed on September 20.',
    source: 'RiverheadLOCAL, April 3, August 29 and September 11, 2025; Town Board resolutions 2025-647 and 2025-778',
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
    date: 'April 1, 2025',
    kind: 'legal',
    what: 'Two condemnations, not one',
    detail:
      'The Town moved on both buildings flanking the square at once: buying out the Craft’d bar’s lease inside its own building at 127 East Main Street, and acquiring the science center’s building at 111 East Main. Clearing both would let the Town convey each to private developers. The leasehold was settled by budget adjustments in August and September 2025; the science center’s building took another eighteen months.',
    source: 'RiverheadLOCAL, April 1, 2025; Town Board resolutions 2025-316, 2025-499, 2025-647 and 2025-778',
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
    date: 'August 6, 2026',
    kind: 'build',
    what: 'The Town publishes a schedule running to 2030',
    detail:
      'Six connected projects were put on one timetable at a Town Board work session: hotel construction mobilising that month, garage design in the autumn, Town Square construction in spring 2027 and opening in spring 2028, streetscape work in autumn 2027, and the parking garage built between 2028 and 2030. The public half had slipped: in November 2024 the same official said Town Square and playground construction could start as early as late summer 2025.',
    source: 'RiverheadLOCAL, August 7, 2026',
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
    { label: 'Land acquisition', amount: 2_625_000, note: 'The developer acquiring the parcels — money flowing toward the Town, not out of it. Credits against this price reduce what the Town actually banks; see the land sale below.' },
    { label: 'Soft costs', amount: 3_365_600, note: 'Architecture and engineering, appraisal, legal, financing points, and a $1,680,000 interest reserve.' },
    { label: 'Contingency', amount: 603_000, note: 'Held against hard costs.' },
  ],
  // Worth stating plainly, because it is the thing most easily got wrong.
  whoPays:
    'Of the $32.7 million, roughly 97% is private — a construction loan and developer equity. The only public money in this budget is a $1,000,000 Restore NY grant awarded in 2024. None of it is Town fund balance. A letter of support in the same filing describes it as “this privately funded project.” Two things qualify that without contradicting it: the budget is a July 2025 snapshot the developer later revised upward to about $35.1 million, and it books cash only — it does not show the tax abatement now pending before the Industrial Development Agency, nor the public commitments listed further down that carry no price.',
}

// The two documents disagree about the building, and both are dated.
export const scopeDiscrepancy = {
  headline: 'The condominiums were dropped, and that has a tax consequence',
  detail:
    'The July 2025 budget describes 76 hotel rooms and 12 condominium units — 88 keys, the figure its cost-per-key is calculated on. The approved building has none: 94 rooms, of which 80 are guest rooms and 14 are suites, hotel-only. Twelve owner-occupied condominiums would have entered the assessment roll as taxable residential property paying town, county and school taxes; hotel rooms do not. Laura Jens-Smith asked the Board in June 2026 whether it had evaluated that difference in assessed value, property tax and school tax revenue. No analysis answering that question has been published.',
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
    date: 'April 1, 2025', number: '2025-316',
    title: 'Sets the public hearing on acquiring SNR Bar 25 Corp’s lease — the Craft’d bar at 127 East Main Street',
    result: 'Adopted unanimously', contested: false,
  },
  {
    date: 'June 3, 2025', number: '2025-499',
    title: 'Findings and determination under the Eminent Domain Procedure Law — the Craft’d leasehold',
    result: 'Adopted 4–1', contested: true, dissent: 'Kern voted no.',
  },
  {
    date: 'August 5, 2025', number: '2025-647',
    title: 'Budget adjustment funding a $120,000 settlement offer to the tenant of 127 East Main Street',
    result: 'Adopted unanimously', contested: false,
  },
  {
    date: 'August 5, 2025', number: '2025-696',
    title: 'Designates J. Petrocelli Riverhead Town Square LLC a qualified and eligible sponsor and authorises the master developer agreement — the vote that permits the $2,625,000 land sale without competitive bidding',
    result: 'Adopted unanimously', contested: false,
  },
  {
    date: 'August 19, 2025', number: '2025-705',
    title: 'Budget transfer for Capital Project #12101, Town Square Properties',
    result: 'Adopted unanimously', contested: false,
  },
  {
    date: 'September 16, 2025', number: '2025-778',
    title: 'A second budget adjustment for the same tenant, covering the rise from the $120,000 offer to the $170,000 settlement',
    result: 'Adopted unanimously', contested: false,
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

// WHAT THE LAND COST. Distinct from the fund-balance question below: this is the
// price of assembling the site, however it was financed. Keeping the two apart
// matters, because the 2021 purchases were paid for with borrowing while the 2026
// taking comes out of surplus, and adding a purchase to the note that financed it
// would count the same money twice.
export const landAssembly = {
  seller: 'Riverhead Enterprises, for the 2020–21 purchases',
  parcels: [
    { address: '117 East Main Street', amount: 1_250_000, when: 'Authorised August 2020, title May 2021', fate: 'Demolished, to become the square.' },
    { address: '121 East Main Street', amount: 950_000, when: 'Authorised August 2020, title May 2021', fate: 'Demolished, to become the square.' },
    { address: '127 East Main Street', amount: 2_650_000, when: 'Option August 2020, title May 2021', fate: 'Kept and standing. Houses the Chamber of Commerce and the Business Improvement District, and formerly the Craft’d bar. Part of the hotel site.' },
    { address: 'Six-month purchase option on 127', amount: 50_000, when: 'August 2020', fate: 'Paid to hold the third parcel while appraisals and environmental work were done.' },
    { address: 'Craft’d leasehold at 127 East Main Street', amount: 170_000, when: 'Court order August 27, 2025; settled September 3, 2025', fate: 'Bought out from SNR Bar 25 Corp so the building could be demolished. The bar closed on September 20, 2025.' },
    { address: '111 East Main Street', amount: 1_950_000, when: 'Authorised September 2026', fate: 'Taken by eminent domain from The Place for Learning. The offer is a floor, not a ceiling.' },
  ],
  knownTotal: 7_020_000,
  whatStaysPublic:
    'Of the three buildings bought in 2020–21, 117 East Main Street — tax lot 12 — is not part of the sale to the developer. It stays in public hands and becomes part of the square. What is being sold on is 121 and 127, plus an adjoining parcel.',
  financing:
    'The Board authorised $5,500,000 of bonding in August 2020 to cover the purchase price, site work and demolition. The $2,800,000 bond anticipation note issued in August 2021 is part of that authorisation rather than money on top of it. The 2026 taking, by contrast, is being paid from fund balance.',
  missing:
    'The settlement figure is known — $170,000, with the company to vacate by September 30, 2025 and the Town to pay by October 15. The Board had funded a $120,000 offer six weeks earlier and topped it up on September 16. The full settlement agreement was not attached to the resolution released to the press, so the terms beyond those dates and that number are not public.',
  referendum:
    'Both 2020 resolutions were subject to permissive referendum. Residents could have forced a town-wide vote on the purchase and the borrowing with 594 signatures — 10% of the 11,882 who voted in the 2018 governor’s election — within 30 days. No petition was filed.',
}

// WHAT COMES BACK. The land assembly above is only half the transaction. The
// Town bought the site, and it is selling most of it on to the developer. Every
// story about this project reports the buying; the selling sits in a resolution,
// a master developer agreement and a lease, and it changes the net figure.
export const landSale = {
  headline: 'The Town is selling most of the site back out',
  resolution: 'Resolution 2025-696, adopted unanimously August 5, 2025 — moved by Rothwell, seconded by Kern',
  parcels:
    'Portions of SCTM #0600-129-1 lots 13 and 14 — 121 and 127 East Main Street — together with #0600-128-6-86.1. The resolution also lists lot 15. What the Town is not selling is 117 East Main Street, lot 12, which stays public and becomes part of the square.',
  price: 2_625_000,
  deposit: 131_250,
  credit: 660_000,
  net: 1_965_000,
  noBid:
    'Designating J. Petrocelli Riverhead Town Square LLC a “qualified and eligible sponsor” under the State Urban Renewal Law is what allows the sale without competitive bidding. Town Attorney Erik Howard told the Board in May 2025 that as urban renewal properties these parcels do not require a request for proposals. That is a lawful and ordinary route inside an urban renewal area. It is also the reason no other price was ever tested against this one.',
  creditNote:
    'The purchase price is not all cash. When the draft master developer agreement was released in July 2025, RiverheadLOCAL reported credits against the price for the developer’s contributions supporting three of the Town’s grant applications — $660,000 in total — and further credits potentially applied for construction management fees and maintenance obligations on the public spaces. A resident, Adele Wallach, asked from the floor before the August 5 vote whether that 2022 pledge had effectively obligated the Town to the designation. The $1,965,000 shown here is the price less the grant-match credits only; the construction-management and maintenance credits have no published figure, so the true net is lower than this by an unknown amount.',
  managementFee:
    'The same agreement hires the developer to build the public side of the square — plaza, playground, walkways and amphitheatre — for a construction management fee of 7% of those projects’ total construction costs, and commits the Town to certain maintenance obligations afterwards. Neither can be priced here: the public construction cost the 7% is calculated against has not been published, and neither has the maintenance schedule.',
  notClosedYet:
    'As of August 2026 the sale had not closed. The developer exercised a contractual right to push the closing past July 31, 2026; the contract allows an extension of up to six months. Ron Hariri of Aquebogue called the delay “a red flag” about possible financing or investor issues at the August 4 meeting. Until it closes, the price is an expectation rather than a receipt — which is exactly what the lease below exists to manage.',
}

// THE PIECE THAT TIES THE PROJECT TO THE TOWN'S DEBT. This is the most useful
// document on this page and the least reported. The Town let the developer take
// possession and start demolishing before it had bought anything, and set the
// rent at whatever the Town's own debt service on the land costs. Read alongside
// the fund balance section: it explains why the Town could retire the note out
// of surplus without that surplus staying gone.
export const preposession = {
  headline: 'The developer is renting the site, and the rent is the Town’s debt service',
  document: 'Pre-Possession and Lease Agreement between the Town, the Community Development Agency and J. Petrocelli Riverhead Town Square LLC, 2025',
  purpose:
    'The agreement lets the developer take possession of the hotel parcels, demolish what stands on them and begin foundation work before title changes hands. The developer takes the property as is, with no Town warranty of any kind including environmental condition, bears every cost and liability of demolition, and carries $5,000,000 of general liability insurance with the Town named.',
  rentRule:
    'Section 3.03 sets the rent at “not less than cost of annual payment due for repayment of bond principal and interest related to purchase and demolition of 117, 121, and 127.” The rent is not a market rent. It is the Town’s carrying cost on the land, passed through.',
  schedule: [
    { label: 'Monthly rent to August 15, 2026', amount: 17_500, note: 'Due on the 15th. The first payment was due on execution. Twelve months of it is $210,000, against $209,000 of note debt service — $100,000 principal and $109,000 interest for the year to August 15, 2026.' },
    { label: 'Monthly rent, six-month extension', amount: 19_000, note: 'If closing slipped past August 14, 2026 the parties could extend by mutual agreement, running to March 14, 2027 at the higher rate. The closing did slip.' },
    { label: 'Backstop payment if no closing by March 14, 2027', amount: 2_493_750, note: 'The purchase price less the 5% deposit. The obligation is “absolute and unconditional without offset or counterclaim,” and the developer consents in advance to the Town releasing the money to pay down the debt.' },
  ],
  deposit: 131_250,
  avoidBonding:
    'The agreement states the purpose of that backstop in its own words: the money is to be released “to make payment related to indebtedness necessary to avoid long term bonding.” Without it the Town was required to convert the note into a fifteen-year bond on August 15, 2026 — roughly $175,000 of principal a year at an estimated 3.75%, $2,625,000 of principal over the term and more than $500,000 of interest on top. The purchase price and the bond principal are the same number, which is the whole design: the sale is meant to retire the debt on the land.',
  risk:
    'The protection is not total. The developer must post a performance bond or claw-back letter of credit before excavation, but the Town’s own departments set the amount and it is not fixed in the agreement, and the restoration obligation expressly does not cover the demolished buildings. If the project failed between demolition and closing, the Town would get back a cleared lot rather than the buildings it bought.',
}

// THE FOURTH LEDGER, AND THE ONE WITH NO NUMBER IN IT YET. Grants, private
// financing and land assembly are all money that moves. This is money that does
// not arrive: an Industrial Development Agency package abates taxes rather than
// spending cash, so it never shows up in a budget line, and it is the piece of
// this project with the longest tail for ordinary taxpayers.
export const idaAssistance = {
  headline: 'A tax-abatement application is pending, and nothing has been decided',
  status: 'Application accepted for review, August 3, 2026. No assistance approved.',
  timeline:
    'J. Petrocelli Riverhead Town Square LLC applied to the Riverhead Industrial Development Agency for financial assistance in November 2025 and amended the application on June 12, 2026 to reflect the hotel-only plan. The IDA accepted the amended application on August 3, 2026 — one day before the Town Board granted site plan and special permit approval.',
  whatWasAsked:
    'Sales and use tax exemptions, mortgage recording tax exemptions, and real property tax abatement through a payment-in-lieu-of-taxes agreement. At the June 2026 hearing the developer’s attorney, Eric Russo, put a term on it: a twenty-year PILOT. Against that he set the project’s jobs case — an estimated 210 construction jobs, 26 full-time and 14 part-time hotel staff, and about 50 more across the ground-floor retail. Those are the applicant’s figures, given at a hearing; no independent verification of them has been published.',
  notPublic:
    'The application itself is not public. Newsday reported in June 2026 that it had filed a Freedom of Information Law request to obtain it. So the twenty-year figure above rests on what the developer’s attorney said in a public meeting rather than on a document anyone outside the agency has read.',
  whatWasDecided:
    'Nothing yet. The IDA resolution accepts the amended application for review and authorises Chairman James Farley to engage Camoin Associates to prepare an absorption and impact study at the applicant’s expense. A public hearing must be held before the agency decides, and none has been noticed: the agency’s own public hearing notices page carried nothing for this project when this page was written, its most recent posting of any kind dating to February 2024.',
  whatToWatchFor:
    'When the hearing is noticed it will appear on the Riverhead IDA’s public hearing notices page, linked in the sources below. Judging by what the agency posted for comparable applications, the notice is usually accompanied by the application itself, a Camoin Associates report, a cost-benefit calculator and the authorising resolution — which together are the documents that would let a resident work out what the abatement is worth and who bears it. That hearing is the point at which the public can be heard on this, and it is the only one.',
  projectCost:
    'The amended application estimates total project cost at about $35.1 million — a branded 94-room hotel with roughly 8,800 square feet of first-floor specialty retail, restaurant and food-hall space. That is a later and larger figure than the $32.67 million in the July 2025 development budget shown above.',
  whyItMatters:
    'A PILOT does not spend money; it forgoes it. Property tax abated on the hotel is revenue the Town, the county, the fire district and — the largest share by far — the school district do not collect, which means the cost of running them is spread across everybody else’s assessment for the life of the agreement. None of that appears in the grant table or the developer’s budget, and none of it can be quantified until the IDA acts. What is on the record is that the master developer agreement treats IDA approval of financial assistance as integral to the project.',
  whoDecides:
    'The Riverhead Industrial Development Agency is a public benefit corporation created in 1980, separate from the Town Board and not elected. Its members are James Farley as chair, Lee Mendelsen as vice-chair, Lori Ann Pipczynski as secretary and Douglas Williams as treasurer, with Council Member Joann Waski as Town Board liaison. It has the authority to issue industrial development bonds and to grant real property tax abatements, sales and compensating use tax exemptions and mortgage recording tax exemptions — the three things sought here. It meets at 5pm on the first Monday of each month at Town Hall, and the meetings are open.',
  caution:
    'This page takes no position on whether the abatement should be granted. It notes that a fourth pot of public support is in play, that its size is unknown, and that the decision belongs to a body residents do not elect.',
}

// WHAT THE AGENCY HAS ACTUALLY GRANTED. Nobody can say what the hotel's
// abatement will be worth, and this page will not guess. What can be shown is
// the Riverhead IDA's own record — the terms it has given comparable projects —
// so a resident reading the pending application has something to measure it
// against. Every row is from the agency's published project list.
export const idaPrecedent = {
  headline: 'What abatements this agency has granted before',
  note:
    'The Petrocelli hotel is not on this list. Its application has been accepted for review, not approved, and it would join this list only if the agency grants assistance. These are shown so the pending application can be read against the agency’s own practice rather than against nothing.',
  rows: [
    { project: 'Bradford Allen Hospitality, formerly Browning Hotels', where: '2038 Old Country Road', term: '2023–2027', years: 4, note: 'The closest comparison on the list: a hotel.' },
    { project: 'Atlantis Marine World Aquarium', where: '431 and 428 East Main Street', term: '2016–2030 and 2017–2027', years: 14, note: 'Downtown, and built by the same developer. The aquarium has held an IDA agreement since 1999, amended repeatedly — most recently in 2025.' },
    { project: 'Peconic Crossing', where: '11 West Main Street', term: '2018–2028', years: 10, note: 'Downtown apartments.' },
    { project: '331 East Main, The Shipyard', where: '331 East Main Street', term: '2021–2032', years: 11, note: 'Downtown mixed use.' },
    { project: 'Restaurant Depot', where: '756 Old Country Road', term: '2024–2034', years: 10, note: 'Commercial.' },
    { project: 'Island Water Park, Scott’s Pointe', where: 'Middle Country Road, Calverton', term: '2022–2032', years: 10, note: 'Commercial recreation.' },
    { project: 'Riverhead Apartments, Georgica Green Ventures', where: '221 East Main Street', term: '2020–2050', years: 30, note: 'Affordable housing, which the agency treats differently.' },
    { project: 'Riverhead Housing LP, River Pointe', where: '821 East Main Street', term: '2024–2054', years: 30, note: 'Affordable housing.' },
  ],
  reading:
    'The pattern is legible without any arithmetic on the hotel: commercial and mixed-use projects downtown have generally received about ten years, affordable housing thirty, and the one existing hotel four. The request on the table is for twenty. That is roughly double what this agency has given comparable downtown commercial projects and five times what it gave the other hotel, and it is the single most checkable thing a resident can carry into the hearing. It is not a reason the request should be refused — the agency weighs jobs, investment and blight, not precedent alone — but it is the question the agency will have to answer.',
}

// ORGANISED OPPOSITION TO THE SUBSIDY, reported with its actual size. A petition
// is not a proceeding and thirty-odd signatures is not a movement; leaving it out
// would hide that opposition organised at all, and reporting it without the count
// would inflate it. Both facts go in.
export const petition = {
  headline: 'A petition asks the agency to refuse',
  what:
    'A change.org petition titled “No IDA Subsidy for Town Square Hotel” urges the Riverhead Industrial Development Agency to “rigorously evaluate and completely reject” the request for tax subsidies, describing the project as a five-storey, thirty-four-million-dollar luxury tourist hotel that would dominate half of the new square.',
  started: 'August 8, 2026 — three days after the Town Board approved the site plan, five days after the agency accepted the application for review.',
  by: 'Posted under the name Riverhead Watch. No organisation is listed behind it.',
  size: 'It had 33 signatures against a goal of 50 when this page was written, nearly all of them gathered in its first week.',
  basis:
    'The petition points readers to a linked document for its reasoning and describes part of that material as a ChatGPT analysis. This page has not evaluated those arguments and does not rely on them for any figure; the numbers on this page come from the Town’s own filings, the agency’s own records and named reporting.',
  why:
    'It is here because the abatement is the one live decision on this project that has not been made, and because the agency must hold a public hearing before it decides. Whatever a reader thinks of the petition, that hearing is the moment when support and objection both count, and it has not been scheduled.',
}

// The parking question keeps coming back, and it has a fiscal edge the argument
// about spaces tends to bury: downtown parking is its own taxing district.
export const parkingDistrict = {
  headline: 'The parking agreement did not exist when the hotel was approved',
  detail:
    'The hotel site sits inside the Riverhead Parking District, a special taxing district established in 1967 and governed by the Town Board itself sitting as its trustees. Since the 2007 revitalisation zoning the Town has not required downtown residential or hotel developers to provide their own parking; they rely on municipal lots. The master developer agreement refers to a parking agreement, but at the August 4, 2026 approval it had not been negotiated. Town Attorney Erik Howard said it “will be negotiated shortly” and would be incorporated into the approval once complete.',
  arithmetic:
    'Martin Sendlewski, who chairs the Town’s own Parking District Advisory Committee, told the June 2026 hearing that the Main Street improvement plan would cut parking between Roanoke and East Avenues from 40 spaces to 21, and that the hotel’s valet area would remove several more. He noted that the First Street lot belongs to Riverhead Parking District No. 1 rather than to the Town generally, and argued that any agreement allocating public spaces to hotel use should come before the district’s trustees. He returned in August to ask how a site plan could be approved before the parking agreement or even its framework existed, with the planned garage “likely years off.”',
  answer:
    'Council members defended the approval. Joann Waski called the emergence of a downtown parking problem “a good thing… because it means that what has been happening downtown is working,” and told a resident she could personally assure him downtown businesses would not be harmed. Denise Merrifield said no one had raised parking objections to the science center’s plan for the opposite side of the square, which she called unpersuasive as a standard.',
}

// Support that never appears as a dollar figure, because it is not paid in cash.
// Each of these is a public asset committed to a private building under a
// separate agreement, and none of them has a published price.
export const inKindSupport = {
  headline: 'Four public commitments, none of them priced',
  items: [
    { label: 'Guest parking in public lots — to be paid for', detail: 'Hotel guests use valet service, with cars parked in the public lot behind the Suffolk Theater until the planned garage is built, then in the garage. This one is not free: the developer’s attorney said in June 2026 that his client was negotiating an agreement with the Town Attorney’s office to pay for roughly 100 spaces in that lot in the meantime. What it will pay has not been published, and the agreement did not exist when the site plan was approved two months later.' },
    { label: 'Stormwater onto Town land', detail: 'Stormwater from the hotel is directed to 25 leaching galleys on the adjacent town square property, under an agreement with the Town.' },
    { label: 'Access across the square', detail: 'The hotel’s lower-level parking is reached from Heidi Behr Way through the town square parcel, under an agreement with the Town.' },
    { label: 'Maintenance of the public spaces', detail: 'The master developer agreement commits the Town to certain ongoing maintenance obligations for the plaza, playground, walkways and amphitheatre once built.' },
  ],
  note:
    'None of these is improper and all are ordinary in a public-private downtown project. One of them is to be paid for. They are listed together because the grant table and the developer’s budget are both cash ledgers, and a reader who adds those two up has still not seen any of this.',
}

// WHAT ACTUALLY GETS BUILT, AND WHEN. A resident's most practical question is
// not what the project costs but when the disruption starts and when the thing
// opens. The Town laid out a six-project schedule at an August 2026 work session,
// and it is the first consolidated timetable published for the whole effort.
export const buildSchedule = {
  headline: 'Six connected projects, running to 2030',
  asOf: 'August 6, 2026 work session, presented by Planning and Community Development Director Dawn Thomas',
  lede:
    'The Town described itself as “transitioning out of the planning role to a construction role.” Six projects are now tied to one schedule: the Town Square itself, the 94-room hotel, an adaptive playground, a riverfront amphitheatre, East Main Street streetscape work, and a structured parking garage.',
  rows: [
    { when: 'August 2026', what: 'Hotel construction mobilises', detail: 'The foundation permit was expected within a week or two of the work session, following site plan and special permit approval.' },
    { when: 'Fall 2026', what: 'Parking garage design begins; East End Arts buildings move', detail: 'The Davis-Corwin building at 133 East Main Street shifts about ten feet east, and both it and the Benjamin House are raised to 13.5 feet to lift them out of the floodplain. Grant funding rather than Town taxpayers pays for this, according to the Town.' },
    { when: 'Spring 2027', what: 'Town Square construction starts', detail: 'It serves first as staging for the hotel, then takes underground drainage, electric, Wi-Fi, cable and fibre, then pavers and public programming elements.' },
    { when: 'Summer 2027', what: 'Adaptive playground', detail: 'Opening shortly after the square.' },
    { when: 'Fall 2027', what: 'East Main Street streetscape', detail: 'Peconic Avenue to East Avenue: narrowing Main Street, widening sidewalks, burying utilities, lighting, landscaping and space for outdoor dining. An extension east toward the aquarium is hoped for but not funded in this phase.' },
    { when: 'Spring 2028', what: 'Town Square opens', detail: '' },
    { when: 'Fall or winter 2028', what: 'Hotel opens', detail: 'The developer’s own schedule presented in July 2025 had aimed at June 2027.' },
    { when: 'Fall 2028 to fall 2030', what: 'Parking garage built', detail: 'The last piece, and the one the hotel’s parking arrangement ultimately depends on.' },
  ],
  slippage:
    'The public half has moved later. In November 2024 the same official said Town Square and playground construction could begin as early as late summer or early autumn 2025; the current schedule places it in spring 2027 with an opening in spring 2028. The hotel, meanwhile, has gone from a June 2027 opening to fall or winter 2028. The Town cautions that the schedule remains subject to funding, weather and materials.',
  disruption:
    'Streetscape construction will disrupt Main Street while it runs. The Town is considering a weekend shuttle from Town Hall to downtown businesses, every fifteen minutes, funded initially through the parking district with sponsorships or small fares possible later. Seven public engagement sessions are scheduled between September 2026 and 2030.',
}

// The garage is the largest single unbuilt piece and the one with the widest
// range on its price. It also matters to the hotel: until it exists, hotel
// guests park in a public lot.
export const garage = {
  headline: 'The garage: $17 million available, cost unknown until it is bid',
  available: 17_000_000,
  design: 2_000_000,
  spaces: 504,
  detail:
    'The Town has about $17 million available for the structured parking garage, roughly $2 million of it for design, but said the total construction cost will not be known until the project goes out to bid. It is currently sized at about 504 spaces; Council Member Denise Merrifield noted the Town’s 1995 downtown vision plan contemplated 589. Size, construction method and circulation remain undetermined, and the Town is weighing whether a modular structure could allow later expansion. It is also applying for funding for a police substation inside it.',
  why:
    'The garage is the backstop for every parking commitment made elsewhere in this project. Hotel guests are to park in the public lot behind the Suffolk Theater until it opens, then shift into the garage under an agreement with the Town. On the current schedule that is 2030 — four years of hotel operation, and two years of hotel occupancy, before the structure it depends on exists.',
}

// The amphitheatre has a grant and a design that has not been settled.
export const amphitheatre = {
  headline: 'A $1.4 million grant for something not yet decided',
  detail:
    'The Board accepted a $1,400,000 Empire State Development award for the riverfront amphitheatre by resolution 2025-591 in July 2025. As of August 2026 the Town had not settled what it is building: whether the space includes a fixed amphitheatre, a temporary stage, seasonal programming or something else “remains undecided.” The area becomes a flexible riverfront performance and gathering space once the East End Arts buildings are moved and raised.',
  memorial:
    'The square may also carry a veterans memorial, which the Town says is aided by the pending acquisition of 111 East Main Street and by funding transferred from a boathouse project that did not go forward.',
}

// PUBLIC OBJECTION. An earlier version of this page had none, which was a real
// gap rather than a neutral omission: the record contains sustained, specific,
// on-the-record criticism, and the answers officials gave to it. Both belong.
export const publicObjections = {
  lede:
    'The money votes have been unanimous, but the hearings have not been quiet. These are the objections actually made on the record, and the answers actually given.',
  raised: [
    {
      who: 'Angela DeVito, South Jamesport — July 2025',
      what: 'Asked the Board to hold the qualified-and-eligible hearing open thirty days because the documents presented were not available to the public before or at the hearing; they were posted the following day. She also questioned what standard the Town used to judge the finances of J. Petrocelli Riverhead Town Square LLC, the new entity replacing the one originally designated master developer, noting the Board had no information about that LLC’s own finances or development record.',
    },
    {
      who: 'Adele Wallach, Riverhead — August 2025',
      what: 'Questioned the clause crediting the developer against the purchase price for its 2022 grant-match pledge, and asked whether that pledge had effectively obligated the Town to the qualified-and-eligible designation.',
    },
    {
      who: 'John McAuliff, Riverhead — August 2025 and August 2026',
      what: 'Asked the Board to pause until September so residents could examine the financials, and questioned whether a five-storey hotel is the best use of the site. A year later he argued the hotel would hurt nearby businesses whose customers already struggle to park, and called the design a “five-story box” that would block views of the Peconic River and sunlight to the art galleries next door. The developer’s team answered that the building was designed to suit the neighbourhood and that its upper floors step back to reduce visual impact.',
    },
    {
      who: 'Kathy McGraw, Northville — June 2026',
      what: 'Argued the application was being treated as a final site plan while processed as a preliminary one, contrary to the Town’s two-step code. Community Development Administrator Dawn Thomas answered that the Town has long used a single application and a single hearing, followed by approval with conditions and later signoff.',
    },
    {
      who: 'Laura Jens-Smith, Laurel — June and August 2026',
      what: 'Called for a cost-benefit analysis of the total public investment — land conveyed, easements, parking commitments, infrastructure and future maintenance — and for a statement separating infrastructure costs borne by the developer from those ultimately borne by taxpayers. She asked whether the Town had evaluated the loss of assessed value, property tax and school tax revenue in dropping the condominiums for a hotel-only plan, and argued the approval was premature given the site’s designation as a potential environmental justice area.',
    },
    {
      who: 'Desmond Wong, Baiting Hollow — June 2026',
      what: 'Objected that the hotel’s parking arrangement depends on infrastructure that does not exist yet — the First Street garage, which on the Town’s own August 2026 schedule is not finished until 2030. “That is not a parking plan — that is a hope.”',
    },
    {
      who: 'Martin Sendlewski, Parking District Advisory Committee chair — June and August 2026',
      what: 'Questioned approving the site plan before the parking agreement existed, and set out the arithmetic of spaces being lost on Main Street.',
    },
  ],
  answers:
    'Dawn Thomas told the June 2026 hearing that the cost-benefit analysis Jens-Smith asked for was performed by Perkins Eastman as part of the State Downtown Revitalization Initiative strategic investment plan, that grant funding rather than Town taxpayers is paying to relocate and preserve the East End Arts buildings, and that the hotel itself is not being built with taxpayer money. Town Attorney Erik Howard said the Suffolk County Planning Commission’s environmental justice remarks were comments rather than binding conditions, and that the Board was free to vote.',
  tone:
    'The exchanges have not always been temperate. Supervisor Tim Hubbard, voting yes in August 2025, called requests to delay “disingenuous” and speculated about objectors’ party affiliation; Claudette Bianco of Baiting Hollow told him taxpayers “paid for the right to disagree with you,” and he replied “if the shoe fits, wear it.” In June 2026 Council Member Denise Merrifield pressed Jens-Smith to state whether she chairs the Riverhead Democratic Committee, which Jens-Smith declined to do, saying the same standard would then have to apply to board members and Town officials. Joann Waski pointed to the eleven members of the public in the room as evidence that opposition was not widespread.',
  balance:
    'Support was also on the record and is not incidental: roughly twenty speakers appeared at the 2025 hearing, the developer submitted nine letters from local businesses and nonprofits — including the Long Island Science Center, whose building the Town later moved to condemn — and business owners including Suffolk Theater’s Bob Castaldi and Riverhead Flower Shop’s Peggy Kneski spoke in favour. Fifteen letters of objection were filed before the August 2025 vote.',
}

// THE WHOLE SHAPE. Three separate pots pay for this, and the Town's own money is
// the smallest of them by a wide margin. Setting them side by side is the single
// most useful thing this page does, because every individual story about the
// project describes only one.
export const threeLedgers = {
  lede:
    'About $74.6 million is going into the Town Square between grants, private development and the Town’s own land assembly. Riverhead’s share — every parcel and interest it has bought or taken — is roughly 9% of that, and part of it was borrowed rather than paid from surplus.',
  note:
    'These are not a single budget and should not be read as one. Grants and the developer’s financing pay for different things, on different schedules, and the Town’s figure is land assembly rather than construction. What the comparison shows is scale: the Town’s own cash exposure is small relative to the money moving through the project.',
  incomplete:
    'Three ledgers are also not all of it. The Town expects to sell most of the site back to the developer, which returns money; a tax abatement is pending that would forgo money; and several public commitments — parking, stormwater, access, maintenance — carry no price at all. Each has its own section below. Nobody has published a single figure that nets these against one another, and this page does not invent one.',
}

// The building has been redescribed several times. Rather than pick, show the run.
export const scopeEvolution = {
  headline: 'The hotel has been four different buildings on paper',
  rows: [
    { when: 'April 19, 2022', what: 'Four storeys, 84 rooms', extra: 'Plus a two-storey building west of the square, a boat house on the river, and a four-storey riverfront condominium building — all since dropped from the plan.', source: 'RiverheadLOCAL, April 17, 2024' },
    { when: 'July 22, 2025', what: '76 hotel rooms and 12 condominium units', extra: '88 keys, which is what the developer’s cost-per-key of $371,283 is calculated on.', source: 'Town of Riverhead, Town Square QE Documents' },
    { when: 'August 4, 2026', what: 'Five storeys, 94 rooms — approved', extra: 'A 69,738 sq ft building on roughly 0.42 acres at 117–127 East Main Street, with retail, a restaurant, a café and nine staff parking spaces on the lower level. Branded as a Tapestry by Hilton. This is the version that holds site plan and special permit approval, granted unanimously by resolution 2026-746.', source: 'RiverheadLOCAL, August 5, 2026; Town Board resolution 2026-746' },
    { when: 'June 11, 2026', what: 'Five storeys, 94 rooms — condominiums gone', extra: '80 guest rooms and 14 suites, a Tapestry by Hilton, with a roughly 5,100 sq ft, 116-seat restaurant and bar with terrace seating, a coffee shop and retail, and nine staff parking spaces on the lower level. The fifth-floor condominiums of the earlier scheme are not in it.', source: 'RiverheadLOCAL and Newsday, June 11–12, 2026' },
    { when: 'June 12, 2026', what: 'About $35.1 million, per the amended IDA filing', extra: 'The developer’s amended application to the Industrial Development Agency puts total project cost near $35.1 million with about 8,800 sq ft of first-floor retail, restaurant and food-hall space — a later and larger figure than the $32.67 million filed with the Town in July 2025.', source: 'RiverheadLOCAL, August 5, 2026' },
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
  offsets:
    'Both draws have money running the other way against them, which is the part the resolutions do not say. The pre-possession lease has the developer paying the Town $17,500 a month to August 2026 and $19,000 a month through the six-month extension, set deliberately at the Town’s own debt service on the land. And if the sale has not closed by March 14, 2027 the developer must remit $2,493,750 — an obligation the agreement makes “absolute and unconditional” — which the Town may apply straight to the debt. Retiring the note out of surplus was not surplus spent and gone; it was surplus advanced against a contracted receipt, and it saved the Town a fifteen-year bond carrying more than $500,000 of interest.',
  verdict:
    'Even taking the paydown at its ceiling, the two together are about a sixth of the unassigned balance and leave it near twice the top of the Town’s own policy range. This is a real draw on surplus, it is comfortably affordable, and most of one of the two draws is contractually due back. All three things are true, and a page that reported only one of them would be misleading.',
  caveat:
    'These are the audited December 31, 2025 balances against the 2026 adopted appropriations. They do not reflect anything that happened to fund balance during 2026, because no report covering 2026 has been filed.',
}

export const openQuestions = [
  'How much did the July 7 note paydown actually apply? The resolution title does not say, and no 2026 financial report exists yet.',
  'Will The Place for Learning accept the $1.95 million as full payment, or take it as an advance and litigate for more? That answer sets the real acquisition cost.',
  'What does the Town actually net on the land sale? The price is $2,625,000, less $660,000 of credits for the developer’s grant-match contributions, less further credits the draft agreement allows for construction management fees and maintenance obligations. Those last two have no published figure, so the net is unknown and lower than $1,965,000.',
  'What is the 7% construction management fee worth in dollars? It is calculated on the total construction cost of the public plaza, playground, walkways and amphitheatre, and that cost has not been published.',
  'What will the Town’s maintenance obligation for the public spaces cost each year, and out of which budget line? The agreement commits to it; nothing published sizes it.',
  'What will the Industrial Development Agency grant, and what is it worth? A twenty-year PILOT has been requested, along with sales tax and mortgage recording tax relief. Nobody outside the agency has read the application, no hearing has been scheduled, and the school district — which stands to forgo the largest share — has no vote in it.',
  'What will the developer pay for the roughly 100 public parking spaces it is negotiating to use, and for how long? The agreement did not exist when the site plan was approved.',
  'What did dropping the twelve condominiums cost the tax base? Owner-occupied units would have been taxable residential property; the question was asked of the Board in June 2026 and has not been answered publicly.',
  'What has the Town itself spent in total — land, demolition, site work, flood mitigation, outside counsel for the condemnations — as opposed to what the developer is spending? The developer’s budget is published; no equivalent consolidated figure for the Town’s own outlay is. This is the cost-benefit statement residents asked for in June 2026 and did not receive.',
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
    title: 'Town of Riverhead — Pre-Possession and Lease Agreement with J. Petrocelli Riverhead Town Square LLC (2025)',
    url: 'https://www.townofriverheadny.gov/213/Downtown-Revitalization-Projects',
    covers: 'The primary document behind the lease section: the $17,500 and $19,000 monthly payments, the rule tying them to bond principal and interest, the $131,250 deposit, the $2,493,750 backstop due March 14, 2027, the fifteen-year bond it was written to avoid, and the demolition, insurance and claw-back terms.',
  },
  {
    title: 'RiverheadLOCAL — Riverhead weighs whether Petrocelli is ‘qualified and eligible’ for town square development (July 24, 2025)',
    url: 'https://riverheadlocal.com/2025/07/24/riverhead-weighs-whether-petrocelli-is-qualified-and-eligible-for-town-square-development/',
    covers: 'The draft master developer agreement as released: the $2.625 million price, the $660,000 of grant-match credits, the further credits available for construction management and maintenance, the 5% deposit, the 7% fee, and the objections raised at the hearing.',
  },
  {
    title: 'RiverheadLOCAL — Riverhead approves town square developer agreement (August 6, 2025)',
    url: 'https://riverheadlocal.com/2025/08/06/town-square-moves-forward-as-riverhead-designates-petrocelli-qualified-and-eligible/',
    covers: 'The unanimous qualified-and-eligible vote, the sale without competitive bidding, the fifteen letters of objection, and the exchange between Supervisor Hubbard and residents over the decision to proceed.',
  },
  {
    title: 'RiverheadLOCAL — Craft’d sets closing date after Riverhead acquires lease through eminent domain (August 29, 2025)',
    url: 'https://riverheadlocal.com/2025/08/29/craftd-sets-closing-date-after-riverhead-acquires-lease-through-eminent-domain/',
    covers: 'The August 27 court order, the lease that ran to November 2033, the $120,000 offer funded on August 5, and the bar’s September 20 closing.',
  },
  {
    title: 'Riverhead News-Review — Craft’d, Riverhead officials at odds over eminent domain (May 2025)',
    url: 'https://riverheadnewsreview.timesreview.com/2025/05/126450/craftd-riverhead-officials-at-odds-over-eminent-domain/',
    covers: 'The May 21 hearing, the Town’s HUD enquiry about block grant funds to help relocate the bar, the 2021 StreetSense study recommending a hotel as highest and best use, and the Town Attorney’s statement that urban renewal properties need no request for proposals.',
  },
  {
    title: 'RiverheadLOCAL — Peconic River Hotel plan draws support, questions and opposition at hearing (June 11, 2026)',
    url: 'https://riverheadlocal.com/2026/06/11/peconic-river-hotel-plan-hearing/',
    covers: 'The 94-room hotel-only plan, the valet and public-lot parking arrangement, the stormwater and access agreements over Town land, and the call for a full public cost-benefit accounting.',
  },
  {
    title: 'RiverheadLOCAL — Riverhead’s downtown transformation enters construction phase (August 7, 2026)',
    url: 'https://riverheadlocal.com/2026/08/07/riverheads-downtown-transformation-enters-construction-phase/',
    covers: 'The six-project construction schedule through 2030, the $17 million available for the parking garage, the 504-space sizing, the slippage against the 2024 timetable, and the undecided amphitheatre.',
  },
  {
    title: 'Town of Riverhead — Industrial Development Agency',
    url: 'https://www.townofriverheadny.gov/256/Industrial-Development-Agency-IDA',
    covers: 'The agency’s composition, powers and meeting schedule — 5pm on the first Monday of each month at Town Hall.',
  },
  {
    title: 'Town of Riverhead — Agendas and Minutes',
    url: 'https://www.townofriverheadny.gov/129/Agendas-Minutes',
    covers: 'The Town’s own agendas and minutes, where the resolutions cited throughout this page originate.',
  },
  {
    title: 'Newsday — Riverhead hearing on downtown hotel raises questions about parking plan, by Tara Smith (June 12, 2026)',
    url: 'https://www.newsday.com/long-island/towns/riverhead-hotel-parking-downtown-revitalization-slsr2lnl',
    covers: 'The twenty-year PILOT term stated by the developer’s attorney, the jobs estimates, the negotiation to pay for roughly 100 public parking spaces, and that the IDA application is not public — Newsday filed a records request for it.',
  },
  {
    title: 'change.org — No IDA Subsidy for Town Square Hotel',
    url: 'https://www.change.org/p/no-ida-subsidy-for-town-square-hotel',
    covers: 'The petition asking the agency to refuse the abatement, its stated reasoning, and its signature count. Cited for what it says and how large it is, not as evidence for any figure.',
  },
  {
    title: 'Riverhead Industrial Development Agency — Projects',
    url: 'https://www.riverheadida.org/ida-projects',
    covers: 'The agency’s own list of active and past agreements, with the term of each. The source for the comparison table, and confirmation that the Town Square hotel is not yet among them.',
  },
  {
    title: 'Riverhead Industrial Development Agency — Public Hearing Notices',
    url: 'https://www.riverheadida.org/ida-public-hearing-notices',
    covers: 'Where an IDA hearing on the hotel abatement would be noticed. Checked directly: it carried no notice for this project, and its most recent posting of any kind was February 2024.',
  },
  {
    title: 'Riverhead Budget Live — Town Board Votes',
    url: 'https://rike4545.github.io/Riverhead-NY-Budget-Web-App/meetings/',
    covers: 'Resolution 2026-641 of July 7, 2026, the vote to pay the note down with fund balance.',
  },
]
