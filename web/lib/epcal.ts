// The Enterprise Park at Calverton (EPCAL), for /epcal/.
//
// Money: the Calverton Parks Community Development Agency fund (Z14), which
// holds the Town's EPCAL land, from the 2027 Budget Supplement (2024-2027) and
// the 2026 Budget Supplement (2023), read from public/data/budget-supplement/.
// Events: Town Board resolutions in the meeting data, and the lawsuit and the
// candidates' plans as RiverheadLOCAL reported them, each labelled as news.
// scripts/verify-epcal.mjs checks every money figure against the budget lines.
//
// No imports, so the verify script can load this file directly.

/** The CDA fund's lines the page shows, by account. */
export const Z14 = {
  rent: 'Z14-2410-355-00000-8',
  interest: 'Z14-2401-000-00000-G',
  legal: 'Z14-6-6980-433-000-00000',
  catLegal: 'Z14-6-6980-433-100-00000',
  consultants: 'Z14-6-6980-436-000-00000',
  otherServices: 'Z14-6-6980-436-210-00000',
  insurance: 'Z14-1-1910-487-000-00000',
  grounds: 'Z14-6-6980-404-000-00000',
} as const

/** The CDA's fund balance at the end of 2024, unaudited, from the 2026 Adopted Budget (lib/all-funds.ts). */
export const CDA_FUND_BALANCE_2024 = 1050888

export type NewsSource = { title: string; url: string }

export const NEWS = {
  dismissal: { title: 'RiverheadLOCAL, February 28, 2026: “Judge dismisses 16 of 17 claims in Calverton Aviation’s EPCAL lawsuit against Riverhead”', url: 'https://riverheadlocal.com/2026/02/28/epcal-lawsuit-calverton-aviation-claims-dismissed-triple-five/' },
  pendency: { title: 'RiverheadLOCAL, March 31, 2026: “Judge orders cancellation of CAT property claim on vast Calverton industrial site”', url: 'https://riverheadlocal.com/2026/03/31/judge-orders-cancellation-of-cat-property-claim-on-vast-calverton-industrial-site/' },
  rail: { title: 'RiverheadLOCAL, March 12, 2026: “Halpin sees rail, manufacturing at EPCAL, but key questions remain”', url: 'https://riverheadlocal.com/2026/03/12/halpin-sees-rail-manufacturing-at-epcal-but-key-questions-remain/' },
  forum: { title: 'RiverheadLOCAL, October 22, 2026: “Halpin and Rothwell field questions at Heart of Riverhead candidates forum”', url: 'https://riverheadlocal.com/2026/10/22/halpin-and-rothwell-field-questions-at-heart-of-riverhead-candidates-forum/' },
  subdivision: { title: 'RiverheadLOCAL, August 11, 2020: “Suffolk County Planning Commission green-lights EPCAL subdivision”', url: 'https://riverheadlocal.com/2020/08/11/suffolk-county-planning-commission-green-lights-epcal-subdivision/' },
} satisfies Record<string, NewsSource>

/** The sale and the lawsuit, in order. Each event names its source. */
export const TIMELINE: { when: string; what: string; source: keyof typeof NEWS }[] = [
  { when: '2018', what: 'The Town and its Community Development Agency agree to sell 1,643 acres to Calverton Aviation & Technology (CAT) for $40 million.', source: 'dismissal' },
  { when: '2020', what: 'The Suffolk County Planning Commission approves the eight-lot subdivision the sale needed, 9–1.', source: 'subdivision' },
  { when: 'September 21, 2022', what: 'A preliminary agreement with the Riverhead IDA sets out the steps toward the sale.', source: 'dismissal' },
  { when: 'October 23, 2023', what: 'The Riverhead IDA declines CAT’s and the CDA’s joint application for financial assistance.', source: 'dismissal' },
  { when: 'October 24, 2023', what: 'The Town Board cancels the CAT contract at an emergency meeting. CAT sues.', source: 'dismissal' },
  { when: 'February 2026', what: 'Justice David Reilly dismisses 16 of CAT’s 17 claims, including all its breach-of-contract and fraud claims and its demand that the Town hand over the land. One claim survives: that the Town interfered with CAT’s contract with the IDA, which seeks money, not the land.', source: 'dismissal' },
  { when: 'March 2026', what: 'CAT appeals (March 26) and the Town cross-appeals the surviving claim (March 30). The judge orders CAT’s notice of pendency, its claim recorded against the land, cancelled. Whether the Town can market the land while the appeal runs depends on whether CAT wins a stay.', source: 'pendency' },
]

/** What the two candidates for Supervisor said about EPCAL in 2026, as reported. */
export const POSITIONS = [
  { who: 'Supervisor Jerry Halpin', said: 'A rail-served manufacturing hub and “an economic engine”, keeping the site’s recreational and environmental assets; talks with Empire State Development and railroad representatives; no ash or trash facilities.', source: ['rail', 'forum'] as (keyof typeof NEWS)[] },
  { who: 'Council Member Ken Rothwell', said: 'Well-paying jobs and a larger tax base, with recreation in a broader mixed-use plan; no taxpayer money for a rail spur without a committed user; developers should bear development costs; opposes state involvement that would reduce local control, and data centers.', source: ['rail', 'forum'] as (keyof typeof NEWS)[] },
]

/** The rail spur, as reported: what it cost and what it serves. */
export const RAIL_SPUR = { federal: 4800000, contractor: 3500000, serves: 'the two adjacent business properties', source: 'rail' as keyof typeof NEWS }
