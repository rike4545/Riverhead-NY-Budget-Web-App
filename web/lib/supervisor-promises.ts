// The Supervisor's own commitments and claims, against the Town's own records.
//
// WHAT THIS IS. Supervisor Jerry Halpin took office in January 2026 and is on
// the November 3, 2026 ballot for a two-year term. The 2027 Tentative Budget,
// presented September 24, is the first budget prepared under him -- the 2026
// budget was his predecessor's, adopted the month he won. So it is the first
// document that can be measured against what he said he would do. This module
// quotes what he and his campaign have said, and checks it against records the
// Town itself publishes.
//
// WHAT THIS IS NOT. It is not an endorsement or an opposition. It does not
// score character or intent, and it never calls a statement false: where the
// record contradicts part of a claim it says which part, and where the record
// cannot settle a claim it says that instead. The challenger has no record as
// Supervisor to check, so his platform is analysed alongside this one on
// /candidate-cost-benefit/ rather than here -- but he sits on the Board, and
// every vote cited below shows the full roll call, his included.
//
// ONE VOTE OF FIVE. The Supervisor prepares the Tentative; the Board adopts
// the budget, by November 20 -- after the election. Four of the five members
// are Republicans, the challenger among them; the Supervisor is not enrolled
// in a party. An outcome is attributed to whoever the roll call shows carried
// it, not to the office.

import { stageDoc } from './budget-stages'
import { projection, requestHistory, stability, unchangedYears } from './tentative-2027'
import requestsJson from '../public/data/budget-supplement/requests-by-year.json'
import { affectedPositions, restoring25PercentOnFour, nyshipIndividualMonthly, eligiblePositionsModeled, resolution984 } from './management-compensation'
import { policyMinimumPercent, policyUpperPercent } from './reserve-policy'
import {
  openingUnassigned, openingPercentOfAppropriations, committedThisYear, surplusAboveUpperCeiling,
} from './reserve-availability'
import { forgoneLow, forgoneHigh, forgoneThroughYear, statute as housingStatute } from './community-housing'

export const SUPERVISOR = 'Jerry Halpin'
export const ELECTION = 'November 3, 2026'

export type Source = { label: string; url: string; date: string }
const SITE: Source = { label: 'votejerryhalpin.com/about', url: 'https://www.votejerryhalpin.com/about', date: 'accessed Sept. 2026' }
const NEWS_REVIEW: Source = {
  label: 'Riverhead News-Review, “Jerry Halpin gets supervisor nomination from Riverhead Democrats”',
  url: 'https://riverheadnewsreview.timesreview.com/2026/02/131898/jerry-halpin-gets-supervisor-nomination-from-riverhead-democrats/',
  date: 'Feb. 2026',
}
// The live article sits behind a bot check that serves automated readers a
// captcha, so it is cited by its public Wayback Machine snapshot of Dec. 31,
// 2025. The quotes below were read from that snapshot.
const BEACON: Source = {
  label: 'East End Beacon, “Halpin Reflects on Leadership Ahead of Riverhead Inauguration” (Beth Young; archived copy)',
  url: 'https://web.archive.org/web/20251231111344/https://www.eastendbeacon.com/halpin-reflects-on-leadership-ahead-of-riverhead-inauguration/',
  date: 'Dec. 31, 2025',
}
const RH_LOCAL: Source = {
  label: 'RiverheadLOCAL, “Halpin wins supervisor race by 37 votes”',
  url: 'https://riverheadlocal.com/2025/11/25/halpin-wins-supervisor-race-by-37-votes-final-results-announced-by-suffolk-board-of-elections/',
  date: 'Nov. 25, 2025',
}

export const context = [
  `Won by 37 votes after a manual recount, 3,958 to 3,921, unseating Supervisor Tim Hubbard (RiverheadLOCAL, Nov. 25, 2025).`,
  'Serving a one-year term: New York’s move to even-year local elections cut his two-year term short, so the seat is on the ballot again this November (Riverhead News-Review, Feb. 2026).',
  'An independent who ran on the Democratic line (East End Beacon, Dec. 31, 2025) and is not registered in any party, the only member of the Town Board who is not a Republican (RiverheadLOCAL). “I am not a Republican, and I am not a Democrat” (votejerryhalpin.com). In February the Riverhead Town Democratic Committee unanimously backed him for reelection (Riverhead News-Review).',
  'His opponent, Councilman Kenneth Rothwell, is one of the five votes that will adopt the 2027 budget, on or before November 20.',
]

// ── Town-wide levy: the measure he campaigned on ─────────────────────────────
//
// The 7.89% the News-Review reports he ran against is the Town's own printed
// figure: the "Total Town Wide" row of the 2025 Adopted Budget's Summary, which
// is the General Fund, Highway and Street Lighting levies together
// ($52,629,650 -> $56,783,579). Special districts are outside it. Using the
// same three funds keeps every comparison below like for like with it.
const TOWN_WIDE = ['A01', 'DA1', 'SL1']

function townWideLevy(year: number, stage: 'tentative' | 'adopted'): number | null {
  const d = stageDoc(year, stage)
  if (!d) return null
  let total = 0
  for (const f of TOWN_WIDE) {
    const levy = d.funds[f]?.levy
    if (levy == null) return null
    total += levy
  }
  return total
}

function growth(a: number | null, b: number | null) {
  return a && b ? ((b - a) / a) * 100 : null
}

export const townWide = {
  y2024: townWideLevy(2024, 'adopted'),
  y2025: townWideLevy(2025, 'adopted'),
  y2026: townWideLevy(2026, 'adopted'),
  y2027Tentative: townWideLevy(2027, 'tentative'),
  get growth2025() { return growth(this.y2024, this.y2025) },
  get growth2026() { return growth(this.y2025, this.y2026) },
  get growth2027() { return growth(this.y2026, this.y2027Tentative) },
}

const tentative2027 = stageDoc(2027, 'tentative')
const adopted2026 = stageDoc(2026, 'adopted')
export const released = tentative2027 !== null

// The Supervisor's own office, General Fund function 1220, personal services.
// parse_budget_requests.py sums it from each Budget Supplement, so a year's
// `adopted` is last year's budget and `tentative` is this year's proposal.
type Office = { lines: number; actual: number; adopted: number; ytd: number; request: number; tentative: number }
type RequestYear = {
  expenditure: { request: number; tentative: number; delta: number }
  reconciliation: { complete: boolean }
  supervisorOffice?: Office
}
const requestYears = (requestsJson as unknown as { byYear: Record<string, RequestYear> }).byYear
const req2027 = requestYears['2027']
const office2027 = req2027?.reconciliation.complete ? req2027.supervisorOffice ?? null : null
// Tentatives before his, from Supplements that add up to their own Tentative.
const officeHistory = requestHistory
  .filter((r) => r.year < 2027 && requestYears[String(r.year)]?.supervisorOffice)
  .map((r) => ({ year: r.year, preparedUnder: r.preparedUnder, tentative: requestYears[String(r.year)].supervisorOffice!.tentative }))
// The 2026 figure: the 2027 Supplement's own "adopted" column once it is
// published, and until then the 2026 Tentative, which was adopted unchanged.
const office2026Budget = office2027?.adopted ?? requestYears['2026']?.supervisorOffice?.tentative ?? null
const CLAIMED_OFFICE_CUT = 40_000

// ── The tests the 2027 Tentative can answer ──────────────────────────────────
export type Test = {
  id: string
  question: string
  measure: string
  value: string | null // null until the Tentative is published
  benchmark: string
  note?: string
}

const pct = (n: number | null, d = 2) => (n === null ? null : `${n > 0 ? '+' : n < 0 ? '−' : ''}${Math.abs(n).toFixed(d)}%`)
const pctPlain = (n: number, d = 1) => `${(n * 100).toFixed(d)}%`
const usd = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
const signed = (n: number) => `${n > 0 ? '+' : n < 0 ? '−' : ''}${usd(Math.abs(n))}`

const gfFundBalance2027 = tentative2027?.funds.A01?.fundBalance ?? null
const gfFundBalance2026 = adopted2026?.funds.A01?.fundBalance ?? null
const approp2027 = tentative2027?.totals.appropriations ?? null
const approp2026 = adopted2026?.totals.appropriations ?? projection.appropriations2026
const revenue = (d: typeof tentative2027, f: string) => d?.funds[f]?.revenues ?? null
const gfRevenue2027 = revenue(tentative2027, 'A01')
const gfRevenue2026 = revenue(adopted2026, 'A01')

export const tests: Test[] = [
  {
    id: 'cap',
    question: 'Did the town-wide levy stay close to the tax cap?',
    measure: 'Town-wide levy growth in the 2027 Tentative (General Fund, Highway, Street Lighting)',
    value: pct(townWide.growth2027),
    benchmark: `A ${projection.referencePct}% reference line. The legal limit is set by a fuller formula and filed with the State; the Town does not print it.`,
    note: 'His written commitment is “as close to the tax cap as possible,” not “under it,” so this is measured rather than scored.',
  },
  {
    id: 'ran-against',
    question: 'Is the increase smaller than the one he ran against?',
    measure: 'The same town-wide levy growth',
    value: pct(townWide.growth2027),
    benchmark: `2025: ${pct(townWide.growth2025)} (the increase he campaigned against). 2026: ${pct(townWide.growth2026)} (his predecessor’s last budget).`,
  },
  {
    id: 'spending',
    question: 'Did it keep a tight lid on spending?',
    measure: 'Appropriations growth, all funds, 2027 Tentative against 2026 adopted',
    value: approp2027 !== null ? pct(growth(approp2026, approp2027)) : null,
    benchmark: `This site’s projection: ${pct(projection.appropriationsPct)}. Growth is not the only lens — see what departments asked for, below.`,
  },
  {
    id: 'requests',
    question: 'Did it trim what departments asked for?',
    measure: 'Tentative minus department requests, all expenditure lines (negative means trimmed)',
    value: req2027 && req2027.reconciliation.complete
      ? `${signed(req2027.expenditure.delta)} (${pct((req2027.expenditure.delta / req2027.expenditure.request) * 100)})`
      : null,
    benchmark: requestHistory.filter((r) => r.year < 2027).map((r) => `${r.year} (${r.preparedUnder}): ${pct(r.deltaPct)}`).join('; '),
    note: req2027 && !req2027.reconciliation.complete
      ? 'The 2027 Supplement is published but does not add up to the Tentative, so this is withheld rather than shown wrong.'
      : undefined,
  },
  {
    id: 'one-time',
    question: 'Did it lean on one-time money to hold the levy down?',
    measure: 'General Fund appropriated fund balance in the 2027 Tentative',
    value: gfFundBalance2027 !== null ? usd(gfFundBalance2027) : null,
    benchmark: gfFundBalance2026 !== null ? `2026 adopted: ${usd(gfFundBalance2026)}.` : '2026 adopted figure unavailable.',
    note: 'Fund balance spent to hold down one year’s levy is gone the next year; the cost comes back in 2028. A larger draw is not wrong in itself, but it is the question to ask of any election-year budget.',
  },
  {
    id: 'new-dollars',
    question: 'Did it bring in new non-property-tax dollars?',
    measure: 'General Fund estimated revenues (everything but the levy and fund balance)',
    value: gfRevenue2027 !== null ? `${usd(gfRevenue2027)} (${pct(growth(gfRevenue2026, gfRevenue2027))})` : null,
    benchmark: gfRevenue2026 !== null ? `2026 adopted: ${usd(gfRevenue2026)}.` : '2026 adopted figure unavailable.',
    note: 'Economic development is a multi-year lever; a single budget shows little of it either way.',
  },
  {
    id: 'office',
    question: 'Did the payroll for his own office go down?',
    measure: 'Supervisor’s office personal services (General Fund, function 1220), 2027 Tentative against the 2026 budget',
    value: office2027 ? `${usd(office2027.tentative)} (${signed(office2027.tentative - office2027.adopted)})` : null,
    benchmark: [
      office2026Budget !== null ? `2026 budget: ${usd(office2026Budget)}.` : null,
      officeHistory.length ? `Earlier Tentatives: ${officeHistory.map((o) => `${o.year} ${usd(o.tentative)} (${o.preparedUnder})`).join('; ')}.` : null,
    ].filter(Boolean).join(' '),
    note: [
      office2026Budget !== null
        ? `His campaign site says he cut $40,000 from the office’s salaries, which would be about ${Math.round((CLAIMED_OFFICE_CUT / office2026Budget) * 100)}% of this line.`
        : null,
      office2027 && office2027.ytd > 0
        ? `The Supplement’s first-half figure for 2026 is ${usd(office2027.ytd)}, a pace of about ${usd(office2027.ytd * 2)} a year.`
        : null,
    ].filter(Boolean).join(' ') || undefined,
  },
]

// ── What he committed to ─────────────────────────────────────────────────────
export type Commitment = {
  text: string
  kind: 'quote' | 'reported'
  via?: string // whose account, when it is reported rather than his own words
  source: Source
  testedBy: string[] // ids in `tests`
  outside?: string // when the budget cannot measure it
  evidence?: string // what the record already shows, where the budget alone cannot settle it
}

export const commitments: Commitment[] = [
  {
    text: 'I am working diligently to keep the 2027 town budget as low as possible and as close to the tax cap as possible.',
    kind: 'quote', source: SITE, testedBy: ['cap', 'spending'],
  },
  {
    text: 'Ran citing the 7.89% tax increase in the 2025 town budget, which the paper calls the town’s largest since the state cap was enacted in 2012, and its impact on fixed-income residents.',
    kind: 'reported', via: 'The News-Review’s account of his 2025 campaign', source: NEWS_REVIEW, testedBy: ['ran-against'],
  },
  {
    text: 'Keep a tight lid on spending.',
    kind: 'reported', via: 'Laura Jens-Smith, chair of the Riverhead Town Democratic Committee, describing his campaign', source: NEWS_REVIEW, testedBy: ['spending', 'requests'],
  },
  {
    text: 'Be welcoming to bringing in new tax dollars, and make sure businesses, and small businesses, can thrive.',
    kind: 'reported', via: 'Laura Jens-Smith, chair of the Riverhead Town Democratic Committee, describing his campaign', source: NEWS_REVIEW, testedBy: ['new-dollars'],
  },
  {
    text: 'Maintain our rural character and preserve open space.',
    kind: 'reported', via: 'Laura Jens-Smith, chair of the Riverhead Town Democratic Committee, describing his campaign', source: NEWS_REVIEW, testedBy: [],
    outside: 'Land-use decisions, not budget lines. The budget cannot measure this, so it is not scored here.',
  },
  {
    text: 'I look forward to getting to work and putting the taxpayers first.',
    kind: 'quote', source: RH_LOCAL, testedBy: ['cap', 'one-time'],
  },
  {
    text: 'We have to start literally thinking that every dollar we can save or retain is a dollar that lowers a taxpayer’s burden.',
    kind: 'quote', source: BEACON, testedBy: ['spending', 'requests', 'cap'],
  },
  {
    text: 'I don’t want to see staffing cuts. I’m not forecasting that. Humans are what makes our town go around.',
    kind: 'quote', source: BEACON, testedBy: [],
    evidence:
      'A budget prints payroll dollars, not positions, so the Tentative cannot settle this on its own. What the record shows so far: the 2026 retirement incentive is voluntary, and the Town says every position it vacates is expected to be refilled.',
  },
]

// ── What he says he has done, checked ────────────────────────────────────────
export type ClaimStatus = 'supported' | 'partly' | 'unverifiable' | 'outside'
export const STATUS_LABEL: Record<ClaimStatus, string> = {
  supported: 'Supported by the record',
  partly: 'Partly supported',
  unverifiable: 'Not in the records this site reads',
  outside: 'Outside this site’s fiscal records',
}

export type Vote = { resolution: string; date: string; action: string; result: string; halpin: string; mover: string; ayes?: string; nays?: string; abstain?: string }
export type Claim = {
  claim: string
  status: ClaimStatus
  finding: string
  votes?: Vote[]
  records: string[]
}

export const claims: Claim[] = [
  {
    claim: 'Paid off $7 million in CPF debt, saving taxpayers $600,000 in interest.',
    status: 'supported',
    finding:
      'Resolution 2026-642 applied $7,212,941 of Community Preservation Fund balance, plus $92,059 of General Fund proceeds from the sale of the Vail-Leavitt Music Hall, to pay down the 2018 Series B refunding bonds on or before August 1. It passed unanimously. The $600,000 interest figure is not stated in the resolution and is not checked here.',
    votes: [{ resolution: '2026-642', date: 'July 7, 2026', action: 'Pay down the 2018 Series B refunding', result: 'Adopted 5–0', halpin: 'Aye', mover: 'Merrifield', ayes: 'Halpin, Rothwell, Kern, Merrifield, Waski' }],
    records: ['TB Resolution 2026-642, July 7, 2026'],
  },
  {
    claim: 'Voted against using eminent domain to acquire the Long Island Science Center property — a move that could cost taxpayers millions.',
    status: 'partly',
    finding:
      'He voted no twice, at the two early stages, and abstained on the determination to condemn — the vote that decided the taking. Councilman Kern did the same at all three stages; it passed on the other three votes. Once a taking is decided, the Eminent Domain Procedure Law requires the Town to make a written offer of no less than its highest approved appraisal (§303); he joined the unanimous vote making that $1,950,000 offer, to be paid from General Fund balance.',
    votes: [
      { resolution: '2026-327', date: 'Apr. 7, 2026', action: 'Affirm authorization to acquire 111 East Main Street', result: 'Adopted 3–2', halpin: 'No', mover: 'Waski', ayes: 'Rothwell, Merrifield, Waski', nays: 'Halpin, Kern' },
      { resolution: '2026-404', date: 'Apr. 21, 2026', action: 'Set the condemnation hearing', result: 'Adopted 3–2', halpin: 'No', mover: 'Rothwell', ayes: 'Rothwell, Merrifield, Waski', nays: 'Halpin, Kern' },
      { resolution: '2026-553', date: 'June 2, 2026', action: 'Adopt the determination to acquire by eminent domain', result: 'Adopted, 3 ayes', halpin: 'Abstained', mover: 'Merrifield', ayes: 'Rothwell, Merrifield, Waski', abstain: 'Halpin, Kern' },
      { resolution: '2026-832', date: 'Sept. 1, 2026', action: 'Approve the $1,950,000 offer (§303), from General Fund balance', result: 'Adopted, unanimous', halpin: 'Aye', mover: 'Merrifield' },
    ],
    records: ['Town Board minutes, Apr. 7, Apr. 21, June 2 and Sept. 1, 2026', 'Eminent Domain Procedure Law §303'],
  },
  {
    claim: 'Cut $40,000 from the salaries in the Supervisor’s Office.',
    status: 'partly',
    finding:
      'His own salary was set at $110,000 at the January 6, 2026 organizational meeting, $8,919 below the $118,919 budgeted for the position and paid to his predecessor in 2025. Whether the office as a whole fell by $40,000 cannot be checked yet: the salary schedule does not say which positions belong to the office. What it does show is that the two senior appointees he kept were paid more in 2026 than in 2025, and that a Legislative Aide was added. The 2027 Tentative will show what he proposes for the office’s payroll line; see “Did the payroll for his own office go down?” above.',
    records: ['2025 and 2026 authorized salary schedules (January organizational meetings)', '2025 Town payroll'],
  },
  {
    claim: 'Offered a retirement incentive to PBA, SOA and CSEA workers, expected to reduce 2027 taxes.',
    status: 'supported',
    finding:
      'The 2026 Voluntary Retirement Incentive covers 53 eligible employees: 29 CSEA, 18 PBA and 6 SOA. The Town’s own estimate of savings is $500,000 to $800,000; retirements are due by October 1, and the Town expects to refill every vacated position. The savings are a projection until uptake is known.',
    votes: [
      { resolution: '2026-678', date: 'July 7, 2026', action: 'Ratify the incentive stipulation with CSEA', result: 'Adopted, unanimous', halpin: 'Aye', mover: 'Merrifield' },
      { resolution: '2026-679', date: 'July 7, 2026', action: 'Ratify the incentive stipulation with the SOA', result: 'Adopted, unanimous', halpin: 'Aye', mover: 'Waski' },
      { resolution: '2026-680', date: 'July 7, 2026', action: 'Ratify the incentive stipulation with the PBA', result: 'Adopted, unanimous', halpin: 'Aye', mover: 'Rothwell' },
    ],
    records: ['TB Resolutions 2026-678, 2026-679 and 2026-680, July 7, 2026', 'RiverheadLOCAL, July 9, 2026, quoting the Financial Administrator'],
  },
  {
    claim: 'Repaired bulkheads and beach stairs without impacting the budget — none of it in the 2026 budget.',
    status: 'partly',
    finding:
      'The bulkhead is in the record: Resolution 2026-361 funded the Meetinghouse Creek Road bulkhead with $113,613 of Assigned Fund Balance set aside from community-benefit payments. It was not in the 2026 budget and did not touch the levy; it drew on money already set aside, which is still Town money. The beach stairs are not in the records this site reads.',
    votes: [{ resolution: '2026-361', date: 'Apr. 21, 2026', action: 'Meetinghouse Creek Road bulkhead, from Assigned Fund Balance', result: 'Adopted, unanimous', halpin: 'Aye', mover: 'Kern' }],
    records: ['TB Resolution 2026-361, fiscal impact statement'],
  },
  {
    claim: 'Closed the $450,000 shortfall in the 2026 budget left by the previous supervisor.',
    status: 'unverifiable',
    finding: 'No resolution or budget document this site reads identifies a $450,000 shortfall or its closing. That is not evidence against the claim; it is outside what can be checked here.',
    records: [],
  },
  {
    claim: 'Supported the sale of the Vail-Leavitt Music Hall property to continue as an arts venue.',
    status: 'unverifiable',
    finding: 'The sale took place — Resolution 2026-642 applies $92,059 of its proceeds — but the vote authorizing it is not in the records this site reads.',
    records: ['TB Resolution 2026-642'],
  },
  {
    claim: 'Working with Empire State Development on EPCAL; preserving the 4-H property; rejecting the Sound Avenue agritourism resort; preserving the East End Arts building; electronic permitting; an employee-fraud case.',
    status: 'outside',
    finding: 'These are land-use, economic-development and administrative matters. This site reads budgets, fiscal impact statements and votes, and does not assess them.',
    records: [],
  },
]

// ── Other levers, and where each stands ──────────────────────────────────────
//
// Ways a Supervisor could act on the tax burden or on how the Town is run.
// Only the first appears among his campaign's own claims. Each is set against the
// record since he took office: who can pull it, what has happened so far and
// what it is worth. None is scored. Most need a Board majority, and the
// Supervisor is one of five votes.
export type Lever = {
  id: string
  lever: string
  whoActs: string
  record: string[]
  worth: string | null
  testId?: string // a measure in `tests` that the 2027 Tentative fills in
  link?: { label: string; path: string }
  sources: string[]
}

const byTitle = (t: string) => affectedPositions.find((p) => p.title === t)
const deputy = byTitle('Deputy Town Supervisor')
const chief = byTitle('Chief of Staff / Town Budget Officer')
const aide = byTitle('Secretary (Supervisor’s Office)')
const raise = (p: typeof deputy) =>
  p && p.salary2025 && p.salary2026 ? `${usd(p.salary2026)} (up ${(((p.salary2026 - p.salary2025) / p.salary2025) * 100).toFixed(1)}% from 2025)` : null
const annualPremium = nyshipIndividualMonthly * 12
const fifteenPercentAcrossModeled = annualPremium * eligiblePositionsModeled * 0.15
const round100 = (n: number) => Math.round(n / 100) * 100

export const levers: Lever[] = [
  {
    id: 'office-payroll',
    lever: 'Reduce the payroll of the Supervisor’s own office',
    whoActs: 'The Supervisor proposes the office’s budget line as budget officer; the Board sets salaries by resolution.',
    record: [
      'His own salary was set at $110,000, $8,919 below the $118,919 budgeted for the position.',
      `The 2026 salary schedule, adopted unanimously at his first meeting on January 6, raised the Deputy Supervisor to ${raise(deputy)} and the Town Budget Officer to ${raise(chief)}, and added a Legislative Aide at ${aide?.salary2026 ? usd(aide.salary2026) : 'a new salary'} (Resolution 2026-58).`,
    ],
    worth: office2026Budget !== null ? `The office’s personal-services line is ${usd(office2026Budget)} in the 2026 budget.` : null,
    testId: 'office',
    link: { label: 'Management Pay', path: '/management-compensation/' },
    sources: ['Authorized salary schedules, 2025 and 2026', 'TB Resolutions 2026-58, 2026-59, 2026-60', 'Budget Supplements, 2024–2026'],
  },
  {
    id: 'appointees',
    lever: 'Appoint his own senior staff',
    whoActs: 'The Supervisor appoints the Deputy Supervisor and his confidential staff; the Board acknowledges each appointment.',
    record: [
      'He kept both senior appointees of his predecessors: the Deputy Supervisor, in that post since at least 2022 under Supervisors Aguiar and Hubbard, and the Town Budget Officer, in that post since 2023, who is also his Chief of Staff (Resolutions 2026-59 and 2026-60).',
      'His one new appointment is a Legislative Aide (Resolution 2026-58).',
      'Keeping them brings continuity to a one-year term, since both held their posts through the last three budgets. It also means his first Tentative comes from the same office that produced his predecessors’.',
    ],
    worth: null,
    sources: ['Authorized salary schedules, 2022–2026', 'TB Resolutions 2026-58, 2026-59, 2026-60'],
  },
  {
    id: 'health-share',
    lever: 'Require employees to pay at least 15% of their health premiums',
    whoActs: 'The Board, by resolution, for elected officials and managers outside a union. For union members the share is set by contract; the PBA and SOA contracts expire at the end of 2026, so their successors are the opening.',
    record: [
      `On ${new Date(resolution984.adopted + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}, before he took office, the Board moved four appointed titles, including the Deputy Supervisor and the Chief of Staff, from paying 25% of their medical, dental and vision premiums to paying nothing, “in lieu of merit increases” (Resolution ${resolution984.number}, unanimous). The 2026 salary schedule then raised both.`,
      'No resolution adopted in 2026 sets or restores an employee contribution.',
    ],
    worth: `About ${usd(round100(fifteenPercentAcrossModeled))} a year at 15% across the ${eligiblePositionsModeled} senior-staff and elected positions this site models, and about ${usd(round100(restoring25PercentOnFour))} for restoring 25% on the four titles alone. Both use the lowest (individual) NYSHIP rate at full enrollment. A 15% share for union members would save more, by an amount that depends on what each contract charges now, which the budget does not print.`,
    link: { label: 'Management Pay', path: '/management-compensation/' },
    sources: [`TB Resolution ${resolution984.number}, Dec. 16, 2025`, 'NYSHIP Empire Plan participating-agency rate'],
  },
  {
    id: 'fund-balance-policy',
    lever: 'Adopt a new fund balance policy',
    whoActs: 'The Board, by resolution. The Supervisor can propose one, and as budget officer decides how much of the balance each Tentative spends.',
    record: [
      `The Town’s policy sets a floor of ${pctPlain(policyMinimumPercent, 0)} of General Fund appropriations and an upper target of ${pctPlain(policyUpperPercent, 0)}.`,
      `The audited unassigned General Fund balance at the end of 2025 was ${usd(openingUnassigned)}, ${pctPlain(openingPercentOfAppropriations)} of the 2026 General Fund budget, more than twice the upper target. Resolutions adopted in 2026 have committed ${usd(committedThisYear)} of it.`,
      'No resolution adopted in 2026 adopts or amends the policy.',
    ],
    worth: `At most ${usd(surplusAboveUpperCeiling)} above the upper target after this year’s commitments. It is one-time money: it can retire debt, fund capital or soften a single year’s levy, but it cannot carry a recurring cost for long.`,
    testId: 'one-time',
    link: { label: 'Reserves & Fund Balance', path: '/reserves/' },
    sources: ['2025 Annual Financial Report', '2026 Adopted Budget', 'TB resolutions, 2026'],
  },
  {
    id: 'housing',
    lever: 'Adopt a housing policy',
    whoActs: `The Board adopts local laws and a community housing plan. A community housing fund also needs a townwide referendum (${housingStatute.citation}).`,
    record: [
      'In March the Board replaced the Town Code’s accessory-apartment law with a new accessory dwelling unit (ADU) law (Resolution 2026-252, unanimous).',
      'Riverhead remains the only one of the five Peconic Bay towns without a community housing plan or fund. No resolution adopted in 2026 starts either.',
    ],
    worth: `A 0.5% housing transfer tax would have raised an estimated ${usd(round100(forgoneLow))} to ${usd(round100(forgoneHigh))} from 2023 through ${forgoneThroughYear}, from the Town’s own audited transfer-tax revenue.`,
    link: { label: 'Community Housing Plan', path: '/housing-plan/' },
    sources: ['TB Resolutions 2026-153 and 2026-252', `${housingStatute.citation}`, 'Peconic Bay CPF financial statements'],
  },
]

// ── The question this page poses, and does not answer ────────────────────────
const largestMove = Math.max(0, ...stability.map((s) => Math.abs(s.appropriationsPct)))

export const prudence = {
  question: 'Politically prudent — or a missed opportunity?',
  framing:
    'This site does not answer that; voters will. What the record can do is show the choices the Tentative made, against what the Supervisor said he would do. He named the tension himself before taking office: “Our workers want to be paid better and our taxpayers want to have a lessened tax burden” (East End Beacon). The two questions can pull against each other: a Tentative that holds the levy down by drawing on fund balance can be good politics in an election year and a problem for the 2028 budget, while one that raises the levy to fund recurring costs can be sound finance and costly at the polls.',
  considerations: [
    `The Tentative is a proposal. The Board adopts the budget by November 20, after the November 3 election, and four of its five members are Republicans, including the Supervisor’s opponent. On the record so far the Board adopted the Tentative unchanged in ${unchangedYears.length} of ${stability.length} years and never moved total appropriations by more than ${largestMove.toFixed(2)}%, so the September 24 document tends to be the budget.`,
    'Part of the 2027 pressure is outside any Supervisor’s control. The PBA and SOA contracts expire at the end of 2026 and what their successors will cost is not yet known; the July 7 stipulations with both unions set up the retirement incentive, not new contracts. Pension and health costs are set by the State and by carriers.',
    'The 2026 budget he inherited raised the town-wide levy on the same measure he campaigned against, and was adopted the month he won. The 2027 Tentative is the first one that is his.',
  ],
}
