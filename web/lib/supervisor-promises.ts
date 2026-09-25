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

import { stageDoc, operatingAppropriations, TRANSFER_FUNDED } from './budget-stages'
import { projection, requestHistory, stability, unchangedYears, statedLimitPct } from './tentative-2027'
import { outcome as incentiveOutcome } from './buyout-2026'
import requestsJson from '../public/data/budget-supplement/requests-by-year.json'
import {
  restoring25PercentOnFour, nyshipIndividualMonthly, eligiblePositionsModeled, resolution984, contributionRemovedByResolution984,
} from './management-compensation'
import {
  OFFICE_HEADING, staff as officeStaff, supervisor as officeSupervisor, totals as officeTotals,
  deputyRate, sameRateCount, raise2025, documents as officeDocuments,
} from './supervisor-office'
import { policyMinimumPercent } from './reserve-policy'
import {
  openingUnassigned, openingPercentOfAppropriations, committedThisYear, surplusAboveFloorCeiling,
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
  `He won by 37 votes after a hand recount, 3,958 to 3,921, defeating Supervisor Tim Hubbard (RiverheadLOCAL, Nov. 25, 2025).`,
  'He is serving a one-year term. New York moved local elections to even-numbered years, which cut his two-year term short, so the seat is on the ballot again this November (Riverhead News-Review, Feb. 2026).',
  'He is an independent who ran on the Democratic line (East End Beacon, Dec. 31, 2025). He isn’t registered in any party, and he is the only Town Board member who isn’t a Republican (RiverheadLOCAL). In his words: “I am not a Republican, and I am not a Democrat” (votejerryhalpin.com). In February the Riverhead Town Democratic Committee unanimously backed him for reelection (Riverhead News-Review).',
  'His opponent, Councilman Kenneth Rothwell, is one of the five Board members who will vote on the 2027 budget by November 20.',
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
type OfficeLine = { account: string; name: string; actual: number; adopted: number; ytd: number; request: number; tentative: number }
type Office = { lines: number; actual: number; adopted: number; ytd: number; request: number; tentative: number; detail?: OfficeLine[] }
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
// One line of function 1220 -- object 101 is full-time salaries, 102 part-time
// -- read the same way: the 2027 Supplement's "adopted" column once it is in,
// the 2026 Tentative until then. 2025's comes from the 2026 Supplement.
const officeLine = (object: string, year: 2025 | 2026): number | null => {
  const find = (o: Office | null | undefined) => o?.detail?.find((l) => l.account.startsWith(`A01-1-1220-${object}-`))
  const o2026 = requestYears['2026']?.supervisorOffice
  if (year === 2025) return find(o2026)?.adopted ?? null
  return office2027 ? find(office2027)?.adopted ?? null : find(o2026)?.tentative ?? null
}
const fullTime2025 = officeLine('101', 2025)
const fullTime2026 = officeLine('101', 2026)
const partTime2026 = officeLine('102', 2026)

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
// Spending not counting the Debt Service, Workers' Compensation and Risk
// Retention funds, which the other funds pay for; the projection counted the
// same way, so the two compare like for like.
const transferFunded = (code: string) => (TRANSFER_FUNDED as readonly string[]).includes(code)
const operating2027 = operatingAppropriations(tentative2027)
const operating2026 = operatingAppropriations(adopted2026)
const projectedOperating = projection.byFund.filter((f) => !transferFunded(f.fundCode))
const projectedOperatingGrowth = growth(
  projectedOperating.reduce((sum, f) => sum + f.v2026, 0),
  projectedOperating.reduce((sum, f) => sum + f.v2027, 0),
)
const revenue = (d: typeof tentative2027, f: string) => d?.funds[f]?.revenues ?? null
const gfRevenue2027 = revenue(tentative2027, 'A01')
/** A count at the start of a sentence. */
const spelledOut = (n: number) => ['None', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve'][n] ?? String(n)
const gfLevyGrowth2027 = growth(adopted2026?.funds.A01?.levy ?? null, tentative2027?.funds.A01?.levy ?? null)
const gfRevenue2026 = revenue(adopted2026, 'A01')

export const tests: Test[] = [
  {
    id: 'cap',
    question: 'Did town-wide property taxes stay close to the tax cap?',
    measure: 'How much the town-wide levy grows in the 2027 proposal (General Fund, Highway and Street Lighting)',
    value: pct(townWide.growth2027),
    benchmark: statedLimitPct !== null
      ? `The limit his letter in the proposal gives: ${statedLimitPct}%. It comes from a longer formula than a flat ${projection.referencePct}%, and the Town files the calculation with the State without publishing it.`
      : `A ${projection.referencePct}% reference line. The exact legal limit uses a longer formula that the Town files with the State but doesn’t publish.`,
    note: 'He promised “as close to the tax cap as possible,” not “under it,” so this table measures it without grading it.',
  },
  {
    id: 'ran-against',
    question: 'Is the increase smaller than the one he campaigned against?',
    measure: 'The same town-wide levy growth',
    value: pct(townWide.growth2027),
    benchmark: `2025: ${pct(townWide.growth2025)} (the increase he ran against). 2026: ${pct(townWide.growth2026)} (his predecessor’s last budget).`,
  },
  {
    id: 'spending',
    question: 'Did he keep a tight lid on spending?',
    measure: 'How much spending grows compared with the 2026 budget, not counting money moved between funds',
    value: operating2027 !== null && operating2026 !== null ? pct(growth(operating2026, operating2027)) : null,
    benchmark: `Our projection, counted the same way: ${pct(projectedOperatingGrowth)}. Growth isn’t the whole story; see what departments asked for, below.`,
    note: approp2027 !== null
      ? `Counting all 19 funds, spending ${approp2027 < approp2026 ? 'falls' : 'rises'} ${pct(growth(approp2026, approp2027))?.replace(/^[+−]/, '')}. The difference is the Debt Service Fund and the two self-insurance funds, which are paid for entirely by transfers from the other funds, so counting them counts the same dollars twice. His letter leaves them out too.`
      : undefined,
  },
  {
    id: 'requests',
    question: 'Did he trim what departments asked for?',
    measure: 'His proposal minus what departments requested, across all spending (a negative number means he trimmed)',
    value: req2027 && req2027.reconciliation.complete
      ? `${signed(req2027.expenditure.delta)} (${pct((req2027.expenditure.delta / req2027.expenditure.request) * 100)})`
      : null,
    benchmark: requestHistory.filter((r) => r.year < 2027).map((r) => `${r.year} (${r.preparedUnder}): ${pct(r.deltaPct)}`).join('; '),
    note: req2027 && !req2027.reconciliation.complete
      ? 'The 2027 Budget Supplement is out, but it doesn’t add up to the proposal, so we’re holding this back rather than showing a wrong number.'
      : undefined,
  },
  {
    id: 'one-time',
    question: 'Did he lean on savings to hold taxes down?',
    measure: 'How much of the General Fund’s savings (fund balance) the 2027 proposal spends',
    value: gfFundBalance2027 !== null ? usd(gfFundBalance2027) : null,
    benchmark: gfFundBalance2026 !== null ? `2026 budget: ${usd(gfFundBalance2026)}.` : '2026 figure unavailable.',
    note: 'Savings spent to hold down one year’s taxes are gone the next year, so the cost comes back in 2028. Using more isn’t wrong in itself, but it’s the question to ask of any election-year budget.',
  },
  {
    id: 'new-dollars',
    question: 'Did he bring in more money from sources other than property taxes?',
    measure: 'General Fund revenue other than property taxes and savings',
    value: gfRevenue2027 !== null ? `${usd(gfRevenue2027)} (${pct(growth(gfRevenue2026, gfRevenue2027))})` : null,
    benchmark: gfRevenue2026 !== null ? `2026 budget: ${usd(gfRevenue2026)}.` : '2026 figure unavailable.',
    note: 'Economic development takes years, so one budget shows little of it either way.',
  },
  {
    id: 'office',
    question: 'Did his own office’s payroll go down?',
    measure: 'Pay for the Supervisor’s office in the 2027 proposal, compared with the 2026 budget',
    value: office2027 ? `${usd(office2027.tentative)} (${signed(office2027.tentative - office2027.adopted)})` : null,
    benchmark: [
      office2026Budget !== null ? `2026 budget: ${usd(office2026Budget)}.` : null,
      officeHistory.length ? `Earlier proposals: ${officeHistory.map((o) => `${o.year} ${usd(o.tentative)} (${o.preparedUnder})`).join('; ')}.` : null,
    ].filter(Boolean).join(' '),
    note: [
      office2026Budget !== null
        ? `His campaign site says he cut $40,000 from the office’s salaries. That would be about ${Math.round((CLAIMED_OFFICE_CUT / office2026Budget) * 100)}% of this budget line.`
        : null,
      office2027 && office2027.ytd > 0
        ? `The office spent ${usd(office2027.ytd)} in the first half of 2026, a pace of about ${usd(office2027.ytd * 2)} a year.`
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
    text: 'Campaigned against the 7.89% tax increase in the 2025 town budget, which the paper calls the town’s largest since the state tax cap began in 2012, and its effect on residents living on fixed incomes.',
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
    outside: 'These are land-use decisions, not budget lines, so the budget can’t measure them and we don’t score them.',
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
      'A budget shows payroll dollars, not jobs, so his budget proposal can’t settle this on its own. What the records show so far: the 2026 retirement incentive is voluntary, and the Town expects to refill every job it opens up.',
  },
]

// ── What he says he has done, checked ────────────────────────────────────────
export type ClaimStatus = 'supported' | 'partly' | 'unverifiable' | 'outside'
export const STATUS_LABEL: Record<ClaimStatus, string> = {
  supported: 'Supported by the records',
  partly: 'Partly supported',
  unverifiable: 'Not in the records we check',
  outside: 'Not a budget or voting question',
}

export type Vote = { resolution: string; date: string; action: string; result: string; halpin: string; mover: string; ayes?: string; nays?: string; abstain?: string }
export type RosterRow = {
  kind: 'seat' | 'subtotal' | 'total' | 'estimate'
  label: string
  holder2025?: string
  holder2026?: string
  y2025: number
  y2026: number
  mark?: string // ties the row to a note
}
export type Roster = { caption: string; rows: RosterRow[]; notes: string[] }
export type Claim = {
  claim: string
  status: ClaimStatus
  summary: string // the bottom line, in one or two sentences
  finding: string
  votes?: Vote[]
  roster?: Roster
  records: string[]
  documents?: Source[]
}

// ── The Supervisor's Office, seat by seat ────────────────────────────────────
//
// Who is in the office is the 2026 schedule's own grouping; see
// supervisor-office.ts for how 2025 is matched to it and for the one raise the
// 2025 schedule does not show.
const seatOf = (title: string) => officeStaff.find((s) => s.title === title)
const budgetOfficer = seatOf(raise2025.title)
const secretary = seatOf('Secretary')
const rateOf = (s: typeof budgetOfficer) => (s ? s.salary2026 / s.salary2025 - 1 : null)
const boRate = rateOf(budgetOfficer)
// The finding says the two appointees he kept got the same rate. If a re-parse
// ever breaks that, fail the build rather than print it.
if (deputyRate === null || boRate === null || Math.abs(boRate - deputyRate) > 5e-5) {
  throw new Error('supervisor-promises: the Budget Officer’s 2026 rate no longer matches the Deputy Supervisor’s; revisit the office finding')
}
const ratePct = `${(deputyRate * 100).toFixed(3)}%`
const officeChange = officeTotals.office2026 - officeTotals.office2025
const staffChange = officeTotals.staff2026 - officeTotals.staff2025
const ownCut = officeSupervisor.salary2025 - officeSupervisor.salary2026
const below = (line: number | null, total: number) => (line !== null ? line - total : null)
const headroom2025 = below(fullTime2025, officeTotals.office2025)
const headroom2026 = below(fullTime2026, officeTotals.office2026)
const belowBudget = below(office2026Budget, officeTotals.office2026)
// Salaries are not all of the office's pay. Resolution 2025-984 names three of
// its titles -- "Secretary (Supervisor's Office), Chief of Staff or Budget
// Officer, Deputy Supervisor" -- with the Town Board Coordinator, and moved
// their 25% share of medical, dental and vision premiums to the Town from
// January 1, 2026, "in lieu of merit increases". Its fiscal impact statement
// charges the Town's health insurance line (A01-9-9060-810), so neither the
// schedule nor the office's 1220 line shows it. Priced the way the health-share
// lever prices it: the individual NYSHIP medical rate, as if each is enrolled.
const TITLES_IN_984 = ['Secretary', 'Town Budget Officer', 'Deputy Town Supervisor']
const coveredSeats = officeStaff.filter((s) => TITLES_IN_984.indexOf(s.title) >= 0).length
const premiumShare = nyshipIndividualMonthly * 12 * contributionRemovedByResolution984 * coveredSeats
const withPremium2026 = officeTotals.office2026 + premiumShare
const withPremiumChange = withPremium2026 - officeTotals.office2025
const about = (n: number) => usd(Math.round(n / 100) * 100)
const article = (t: string) => (/^[AEIOU]/.test(t) ? `an ${t}` : `a ${t}`)
const listed = (xs: string[]) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`)
const moreOrLess = (n: number) => `${usd(Math.abs(n))} ${n < 0 ? 'less' : 'more'}`
const higherOrLower = (n: number) => `${usd(Math.abs(n))} ${n < 0 ? 'lower' : 'higher'}`
const word = (n: number) => ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'][n] ?? String(n)

const officeSummary = [
  Math.abs(officeChange) < CLAIMED_OFFICE_CUT ? 'Not from one year to the next.' : null,
  `The office’s salaries are ${moreOrLess(officeChange)} than in 2025${coveredSeats > 0 ? `, and counting a new health-insurance benefit the office costs about ${about(Math.abs(withPremiumChange))} ${withPremiumChange > 0 ? 'more' : 'less'}` : ''}.`,
  `Only a comparison with the 2026 budget reaches ${usd(CLAIMED_OFFICE_CUT)}.`,
].filter(Boolean).join(' ')

const officeFinding = [
  `The Town’s 2026 pay list groups staff by department. Under “${OFFICE_HEADING}” it lists ${listed(officeStaff.map((s) => article(s.title)))} (Resolution 2026-2). The 2025 list has the same ${word(officeStaff.length)} jobs.`,
  `Counting his own pay, the office’s salaries total ${usd(officeTotals.office2026)} in 2026, compared with ${usd(officeTotals.office2025)} in 2025. That’s ${moreOrLess(officeChange)}, not ${usd(CLAIMED_OFFICE_CUT)}.`,
  ownCut > 0
    ? `He cut his own salary by ${usd(ownCut)}, to ${usd(officeSupervisor.salary2026)}. The budget allowed ${usd(officeSupervisor.salary2025)}, what his predecessor was paid.`
    : `His own salary is ${higherOrLower(-ownCut)}: ${usd(officeSupervisor.salary2026)}, against the ${usd(officeSupervisor.salary2025)} the budget allowed.`,
  `Staff pay is ${higherOrLower(staffChange)}. The two senior staff he kept each got ${ratePct}, the same raise ${sameRateCount} other positions off the union pay scale got. His new aide took the Secretary’s job ${secretary && secretary.salary2026 === secretary.salary2025 ? 'at the same salary as before' : `at ${usd(secretary?.salary2026 ?? 0)}`}.`,
  coveredSeats > 0
    ? `Salaries aren’t the whole picture. On December 16, 2025, before he took office, the Board voted to have the Town pay the full cost of health insurance for ${coveredSeats === officeStaff.length ? `all ${word(coveredSeats)} staff jobs` : `${word(coveredSeats)} of the staff jobs`}, which had paid 25% themselves (Resolution ${resolution984.number}). The resolution says the Supervisor of the day suggested it “in lieu of merit increases.” It’s worth about ${about(premiumShare)} a year if all are enrolled, and it comes out of the Town’s health insurance budget, not the office’s. Counting it, the office costs about ${about(Math.abs(withPremiumChange))} ${withPremiumChange > 0 ? 'more' : 'less'} than in 2025. His aide’s contract includes the same fully paid coverage (Resolution 2026-58).`
    : null,
  headroom2026 !== null && belowBudget !== null && office2026Budget !== null
    ? `Compared with the 2026 budget, which was passed before he took office, the salaries are ${usd(headroom2026)} under the office’s full-time salary budget and ${usd(belowBudget)} under its whole payroll budget of ${usd(office2026Budget)}.${headroom2025 !== null ? ` The full-time budget also covers pay beyond base salaries; in 2025 the salaries came in ${usd(headroom2025)} under it.` : ''}${partTime2026 ? ` The larger budget includes ${usd(partTime2026)} for part-time help, and no one is on the pay list for it.` : ''} Only that last comparison reaches ${usd(CLAIMED_OFFICE_CUT)}.`
    : null,
  office2027 && office2026Budget !== null
    ? `Money an office doesn’t spend isn’t a tax cut: whatever is left at the end of the year goes back into the Town’s savings. His 2027 proposal budgets ${usd(office2027.tentative)} for the office’s payroll, ${usd(Math.abs(office2027.tentative - office2026Budget))} ${office2027.tentative <= office2026Budget ? 'less' : 'more'} than the 2026 budget; see “Did his own office’s payroll go down?” above.`
    : 'Money an office doesn’t spend isn’t a tax cut: whatever is left at the end of the year goes back into the Town’s savings. His 2027 proposal will show what he plans for the office; see “Did his own office’s payroll go down?” above.',
].filter(Boolean).join(' ')

const officeRoster: Roster = {
  caption: `Pay as set each January: the jobs listed under “${OFFICE_HEADING},” plus the Supervisor, whose pay is set with the other elected officials.`,
  rows: [
    ...officeStaff.map((s): RosterRow => ({
      kind: 'seat', label: s.title, holder2025: s.holder2025, holder2026: s.holder2026, y2025: s.salary2025, y2026: s.salary2026,
      mark: s.title === raise2025.title ? '*' : s.title === 'Secretary' ? '†' : undefined,
    })),
    { kind: 'subtotal', label: `Staff (${OFFICE_HEADING})`, y2025: officeTotals.staff2025, y2026: officeTotals.staff2026 },
    { kind: 'seat', label: officeSupervisor.title, holder2025: officeSupervisor.holder2025, holder2026: officeSupervisor.holder2026, y2025: officeSupervisor.salary2025, y2026: officeSupervisor.salary2026 },
    { kind: 'total', label: 'The office’s salaries', y2025: officeTotals.office2025, y2026: officeTotals.office2026 },
    ...(coveredSeats > 0
      ? [
          { kind: 'estimate', label: `Health insurance share the Town now pays (Resolution ${resolution984.number})`, y2025: 0, y2026: premiumShare, mark: '‡' } as RosterRow,
          { kind: 'total', label: 'Salaries plus health insurance share', y2025: officeTotals.office2025, y2026: withPremium2026 } as RosterRow,
        ]
      : []),
  ],
  notes: [
    budgetOfficer
      ? `* The 2025 pay list shows ${usd(budgetOfficer.schedule2025)}. A separate resolution passed the same day, ${raise2025.adopted} (Resolution ${raise2025.resolution}, requested by Supervisor Hubbard), added ${raise2025.rate * 100}% from January 1. Without it, the 2025 total would be ${usd(officeTotals.office2025Schedule)}, and 2026 would be ${moreOrLess(officeTotals.office2026 - officeTotals.office2025Schedule)}.`
      : null,
    secretary
      ? '† Resolution 2026-58 names the job “Legislative Aide to the Town Supervisor.” Its fiscal impact form calls it “Secretary to Town Supervisor” and charges it to the office’s full-time salary budget.'
      : null,
    coveredSeats > 0
      ? `‡ From ${resolution984.effective}, Resolution ${resolution984.number} made medical, dental and vision insurance fully Town-paid for three jobs: the Secretary (Supervisor’s Office), the Chief of Staff or Budget Officer and the Deputy Supervisor. They had paid 25% themselves. We estimate it with the lowest State health plan (NYSHIP) rate, for one person and medical only (${usd(nyshipIndividualMonthly)} a month), assuming all ${word(coveredSeats)} are enrolled. Family coverage, dental and vision would make it larger; anyone who declines coverage would make it smaller. The Town doesn’t publish who is enrolled. The cost is charged to the Town’s health insurance budget (A01-9-9060), not the office’s.`
      : null,
    officeTotals.paid2025 !== null ? `Check: the 2025 payroll shows the four people in these jobs were paid ${usd(officeTotals.paid2025)} in regular pay that year.` : null,
  ].filter((n): n is string => n !== null),
}

export const claims: Claim[] = [
  {
    claim: 'Paid off $7 million in CPF debt, saving taxpayers $600,000 in interest.',
    status: 'supported',
    summary: 'Yes. The Board voted 5–0 to pay off the bonds early with money the preservation fund already had.',
    finding:
      'Resolution 2026-642 used $7,212,941 the Community Preservation Fund had on hand, plus $92,059 from the sale of the Vail-Leavitt Music Hall, to pay off the 2018 Series B bonds by August 1. It passed 5–0. The resolution doesn’t state the $600,000 in interest savings, so we haven’t checked that number.',
    votes: [{ resolution: '2026-642', date: 'July 7, 2026', action: 'Pay off the 2018 Series B bonds early', result: 'Adopted 5–0', halpin: 'Aye', mover: 'Merrifield', ayes: 'Halpin, Rothwell, Kern, Merrifield, Waski' }],
    records: ['TB Resolution 2026-642, July 7, 2026'],
  },
  {
    claim: 'Voted against using eminent domain to acquire the Long Island Science Center property — a move that could cost taxpayers millions.',
    status: 'partly',
    summary: 'Partly. He voted no at the two early steps, but on the vote that decided it he abstained rather than voting no.',
    finding:
      'He voted no at the first two steps and abstained on the decision to take the property, the vote that settled it. Councilman Kern did the same at all three steps, and the other three members voted yes each time. Once a town decides to take a property, state law requires it to offer at least its highest approved appraisal (Eminent Domain Procedure Law §303). He joined the unanimous vote making that $1,950,000 offer, paid from General Fund savings.',
    votes: [
      { resolution: '2026-327', date: 'Apr. 7, 2026', action: 'Confirm the plan to acquire 111 East Main Street', result: 'Adopted 3–2', halpin: 'No', mover: 'Waski', ayes: 'Rothwell, Merrifield, Waski', nays: 'Halpin, Kern' },
      { resolution: '2026-404', date: 'Apr. 21, 2026', action: 'Schedule the public hearing on taking the property', result: 'Adopted 3–2', halpin: 'No', mover: 'Rothwell', ayes: 'Rothwell, Merrifield, Waski', nays: 'Halpin, Kern' },
      { resolution: '2026-553', date: 'June 2, 2026', action: 'Decide to take the property by eminent domain', result: 'Adopted, 3 yes', halpin: 'Abstained', mover: 'Merrifield', ayes: 'Rothwell, Merrifield, Waski', abstain: 'Halpin, Kern' },
      { resolution: '2026-832', date: 'Sept. 1, 2026', action: 'Approve the required $1,950,000 offer, paid from General Fund savings', result: 'Adopted, unanimous', halpin: 'Aye', mover: 'Merrifield' },
    ],
    records: ['Town Board minutes, Apr. 7, Apr. 21, June 2 and Sept. 1, 2026', 'Eminent Domain Procedure Law §303'],
  },
  {
    claim: 'Cut $40,000 from the salaries in the Supervisor’s Office.',
    status: 'partly',
    summary: officeSummary,
    finding: officeFinding,
    roster: officeRoster,
    records: [
      'TB Resolutions 2026-1, 2026-2 and 2026-58, Jan. 6, 2026',
      'TB Resolutions 2025-8, 2025-9 and 2025-64, Jan. 7, 2025',
      'TB Resolution 2025-984, Dec. 16, 2025, and its fiscal impact statement',
      '2025 Town payroll',
      '2025 and 2026 Budget Supplements, function 1220',
    ],
    documents: [officeDocuments.schedule2026, officeDocuments.packet2026, officeDocuments.packet2025Dec, officeDocuments.minutes2025],
  },
  {
    claim: 'Offered a retirement incentive to PBA, SOA and CSEA workers, expected to reduce 2027 taxes.',
    status: 'supported',
    summary: released
      ? `Yes, the incentive was offered and approved 5–0. ${spelledOut(incentiveOutcome.took.total)} employees took it, and his 2027 proposal counts ${usd(incentiveOutcome.savings2027)} of General Fund savings from it.`
      : 'Yes, the incentive was offered and approved 5–0. The tax savings are the Town’s estimate until we know how many people take it.',
    finding: released
      ? `The 2026 Voluntary Retirement Incentive was open to 53 employees: 29 in the CSEA union, 18 police officers (PBA) and 6 police supervisors (SOA). In July the Town estimated it would save $500,000 to $800,000. His letter in the 2027 proposal says ${incentiveOutcome.took.csea} CSEA members and ${incentiveOutcome.took.pba} PBA members took it, and it budgets ${usd(incentiveOutcome.savings2027)} of General Fund savings for 2027: ${usd(incentiveOutcome.salariesAndPayrollTaxes)} less in salaries and payroll taxes and ${usd(incentiveOutcome.retirementContributions)} less in State retirement contributions, partly offset by higher retiree health insurance. The Town expects to refill every job that opens up.${gfLevyGrowth2027 !== null ? ` The General Fund levy in the proposal rises ${gfLevyGrowth2027.toFixed(2)}%.` : ''}`
      : 'The 2026 Voluntary Retirement Incentive is open to 53 employees: 29 in the CSEA union, 18 police officers (PBA) and 6 police supervisors (SOA). The Town estimates it will save $500,000 to $800,000. Retirements are due by October 1, and the Town expects to refill every job that opens up. The savings stay an estimate until we know how many people take it.',
    votes: [
      { resolution: '2026-678', date: 'July 7, 2026', action: 'Approve the incentive agreement with CSEA', result: 'Adopted, unanimous', halpin: 'Aye', mover: 'Merrifield' },
      { resolution: '2026-679', date: 'July 7, 2026', action: 'Approve the incentive agreement with the SOA', result: 'Adopted, unanimous', halpin: 'Aye', mover: 'Waski' },
      { resolution: '2026-680', date: 'July 7, 2026', action: 'Approve the incentive agreement with the PBA', result: 'Adopted, unanimous', halpin: 'Aye', mover: 'Rothwell' },
    ],
    records: [
      'TB Resolutions 2026-678, 2026-679 and 2026-680, July 7, 2026',
      'RiverheadLOCAL, July 9, 2026, quoting the Financial Administrator',
      ...(released ? [incentiveOutcome.source.title] : []),
    ],
  },
  {
    claim: 'Repaired bulkheads and beach stairs without impacting the budget — none of it in the 2026 budget.',
    status: 'partly',
    summary: 'Partly. The bulkhead was paid for with money already set aside, not new taxes. The beach stairs aren’t in the records we check.',
    finding:
      'The bulkhead is in the records. Resolution 2026-361 paid for the Meetinghouse Creek Road bulkhead with $113,613 the Town had already set aside from community-benefit payments. It wasn’t in the 2026 budget and didn’t raise taxes, but it is still Town money. The beach stairs aren’t in the records we check.',
    votes: [{ resolution: '2026-361', date: 'Apr. 21, 2026', action: 'Pay for the Meetinghouse Creek Road bulkhead from money set aside', result: 'Adopted, unanimous', halpin: 'Aye', mover: 'Kern' }],
    records: ['TB Resolution 2026-361, fiscal impact statement'],
  },
  {
    claim: 'Closed the $450,000 shortfall in the 2026 budget left by the previous supervisor.',
    status: 'partly',
    summary: 'Partly. The records show one inherited shortfall, about $199,000 in the ambulance budget, and it was fixed. We found nothing showing the rest of the $450,000.',
    finding:
      'The records show one shortfall in the 2026 budget passed under his predecessor, and it was fixed: the Ambulance District’s payment to the Riverhead Volunteer Ambulance Corps (RVAC). The Board’s own resolutions say “several expenditure lines in the Adopted Budget were inaccurate,” and that RVAC’s contract (last year’s payment plus the tax-cap increase) needed more than the budget provided. Two fixes added $199,322 to RVAC’s line: $119,322 moved from other ambulance lines and $80,000 from the district’s savings. That’s less than half of $450,000, and it’s in the ambulance budget, not the General Fund. We searched every 2026 agenda packet through September 15 and found nothing else correcting the budget. The year’s other budget changes pay for needs that came up during the year, such as “unanticipated” legal work and road salt after the winter storms, or for new projects. Separately, the 2025 audit reports shortfalls of $692,688 in the Recreation Program Fund and $73,185 in the Police Athletic League Fund at the end of 2025, which it expects to be closed in 2026. The 2023 and 2024 audits said the same about the following year, and both deficits grew each time. The 2026 audit will show whether they were.',
    votes: [
      { resolution: '2026-156', date: 'Feb. 18, 2026', action: 'Move $100,000 within the ambulance budget to RVAC’s line, because “several expenditure lines in the Adopted Budget were inaccurate”', result: 'Adopted, unanimous', halpin: 'Aye', mover: 'Kern' },
      { resolution: '2026-470', date: 'May 20, 2026', action: 'Add $99,322 to RVAC’s line “in accordance with the contract,” $80,000 of it from the district’s savings', result: 'Adopted 4–0, Kern absent', halpin: 'Aye', mover: 'Rothwell', ayes: 'Halpin, Rothwell, Merrifield, Waski' },
    ],
    records: [
      'TB Resolutions 2026-156 (Feb. 18, 2026) and 2026-470 (May 20, 2026)',
      'TB Resolution 2025-944, the 2026 Ambulance District budget (Nov. 18, 2025), and 2023-932, the RVAC agreement',
      '2025 audited financial statements (TB Resolution 2026-834, Sept. 1, 2026)',
      'Every 2026 agenda packet through Sept. 15, 2026',
    ],
    documents: [
      { label: 'Agenda packet, Resolution 2026-156 (p. 98)', url: 'https://riverheadny.api.civicclerk.com/v1/Meetings/GetMeetingFileStream(fileId=11718,plainText=false)', date: 'Feb. 18, 2026' },
      { label: 'Agenda packet, Resolution 2026-470 (p. 91)', url: 'https://riverheadny.api.civicclerk.com/v1/Meetings/GetMeetingFileStream(fileId=11919,plainText=false)', date: 'May 20, 2026' },
      { label: 'Agenda packet, 2025 audited financial statements (deficit note, p. 149)', url: 'https://riverheadny.api.civicclerk.com/v1/Meetings/GetMeetingFileStream(fileId=12303,plainText=false)', date: 'Sept. 1, 2026' },
    ],
  },
  {
    claim: 'Supported the sale of the Vail-Leavitt Music Hall property to continue as an arts venue.',
    status: 'supported',
    summary: 'Yes, though the sale was decided before he took office. The 2025 Board chose the Jazz Loft and signed the contract; the sale closed in March 2026 with him as Supervisor, and he backed it publicly.',
    finding:
      'The Town Board chose the buyer in 2025, under Supervisor Hubbard, before Halpin was on the Board. In April it voted 3–2 to negotiate a sale to the Jazz Loft (Resolution 2025-374). After an October hearing where the Jazz Loft presented its plan to restore the hall as a performing arts center, the Board voted 4–1 in November to name it the “qualified and eligible sponsor” to buy and redevelop the hall (2025-939). Supervisor Hubbard signed the contract on December 16, 2025; RiverheadLOCAL reported the price as $150,000. The sale closed on March 17, 2026. His office’s press release that day quotes him: “It’s an honor for me to be in the position to see the conclusion of this deal, but today’s closing is the culmination of several years of dedication and hard work put in by the Town Board, previous Supervisors Tim Hubbard and Yvette Aguiar, and The Jazz Loft.” In July he voted with the rest of the Board to put $92,059 of the sale’s proceeds toward paying off bonds (2026-642). So he supported the sale and completed it, but the decisions to sell, and to whom, were made before he took office.',
    votes: [
      { resolution: '2025-374', date: 'Apr. 15, 2025', action: 'Tell the Town Attorney to negotiate a sale of the hall to the Jazz Loft', result: 'Adopted 3–2', halpin: 'Not on the Board yet', mover: 'Merrifield', ayes: 'Hubbard, Merrifield, Waski', nays: 'Rothwell, Kern' },
      { resolution: '2025-939', date: 'Nov. 18, 2025', action: 'Name the Jazz Loft the qualified and eligible sponsor to buy and redevelop the hall', result: 'Adopted 4–1', halpin: 'Not on the Board yet', mover: 'Merrifield', ayes: 'Hubbard, Rothwell, Merrifield, Waski', nays: 'Kern' },
      { resolution: '2026-642', date: 'July 7, 2026', action: 'Put $92,059 of the sale’s proceeds, with $7.2 million from the preservation fund, toward paying off the 2018 Series B bonds', result: 'Adopted 5–0', halpin: 'Aye', mover: 'Merrifield', ayes: 'Halpin, Rothwell, Kern, Merrifield, Waski' },
    ],
    records: [
      'TB Resolutions 2025-374 (Apr. 15, 2025), 2025-939 (Nov. 18, 2025) and 2026-642 (July 7, 2026)',
      'Town Board hearing minutes, Oct. 16, 2025, and meeting minutes, Dec. 16, 2025 (the contract signing)',
      'Town of Riverhead press release, Mar. 17, 2026',
    ],
    documents: [
      { label: 'Town press release: “Riverhead Completes Sale of the Vail-Leavitt Music Hall to The Jazz Loft”', url: 'https://www.townofriverheadny.gov/DocumentCenter/View/3407/3-17-26-Town-of-Riverhead-completes-sale-of-the-Vail-Leavitt-Music-Hall-to-The-Jazz-Loft', date: 'Mar. 17, 2026' },
      { label: 'Town Board minutes, Resolution 2025-374', url: 'https://riverheadny.api.civicclerk.com/v1/Meetings/GetMeetingFileStream(fileId=3948,plainText=false)', date: 'Apr. 15, 2025' },
      { label: 'Town Board minutes, Resolution 2025-939', url: 'https://riverheadny.api.civicclerk.com/v1/Meetings/GetMeetingFileStream(fileId=10384,plainText=false)', date: 'Nov. 18, 2025' },
      { label: 'RiverheadLOCAL: “Riverhead signs contract to sell the Vail-Leavitt Music Hall”', url: 'https://riverheadlocal.com/2025/12/16/riverhead-signs-contract-to-sell-the-vail-leavitt-music-hall/', date: 'Dec. 16, 2025' },
      { label: 'RiverheadLOCAL: “Riverhead closes sale of Vail-Leavitt Music Hall to The Jazz Loft”', url: 'https://riverheadlocal.com/2026/03/17/riverhead-closes-sale-of-vail-leavitt-music-hall-to-the-jazz-loft/', date: 'Mar. 17, 2026' },
    ],
  },
  {
    claim: 'Working with Empire State Development on EPCAL; preserving the 4-H property; rejecting the Sound Avenue agritourism resort; preserving the East End Arts building; electronic permitting; an employee-fraud case.',
    status: 'outside',
    summary: 'These aren’t budget or voting questions, so we don’t rate them.',
    finding: 'These are land-use, economic-development and management matters. This site checks budgets, fiscal impact forms and votes, so we leave them out.',
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

const deputySeat = seatOf('Deputy Town Supervisor')
const annualPremium = nyshipIndividualMonthly * 12
const fifteenPercentAcrossModeled = annualPremium * eligiblePositionsModeled * 0.15
const round100 = (n: number) => Math.round(n / 100) * 100

export const levers: Lever[] = [
  {
    id: 'office-payroll',
    lever: 'Cut the payroll of his own office',
    whoActs: 'He proposes the office’s budget as the Town’s budget officer; the Board sets salaries by resolution.',
    record: [
      `He set his own salary at ${usd(officeSupervisor.salary2026)}, ${usd(Math.abs(ownCut))} ${ownCut >= 0 ? 'below' : 'above'} the ${usd(officeSupervisor.salary2025)} the budget allowed.`,
      `The 2026 pay list, adopted unanimously at his first meeting on January 6, has the same ${word(officeStaff.length)} staff jobs in his office as 2025. It raised the Deputy Supervisor${deputySeat ? ` to ${usd(deputySeat.salary2026)}` : ''} and the Town Budget Officer${budgetOfficer ? ` to ${usd(budgetOfficer.salary2026)}` : ''}, ${ratePct} each${secretary ? `, and kept the Secretary’s job, now held by his Legislative Aide (Resolution 2026-58), at ${usd(secretary.salary2026)}` : ''}.`,
      `Counting his own pay, the office’s salaries are ${usd(officeTotals.office2026)}, ${moreOrLess(officeChange)} than in 2025.`,
      ...(coveredSeats > 0
        ? [`Since January 1 the Town also pays the staff’s 25% share of health insurance (Resolution ${resolution984.number}), about ${about(premiumShare)} a year if all are enrolled. That comes out of the Town’s health insurance budget, so it never shows up in the office’s budget. Counting it, the office costs about ${about(Math.abs(withPremiumChange))} ${withPremiumChange > 0 ? 'more' : 'less'} than in 2025.`]
        : []),
    ],
    worth: office2026Budget !== null
      ? `The office’s payroll budget is ${usd(office2026Budget)} in 2026${fullTime2026 !== null ? `, ${usd(fullTime2026)} of it for full-time salaries` : ''}.`
      : null,
    testId: 'office',
    link: { label: 'Management Pay', path: '/management-compensation/' },
    sources: ['Authorized salary schedules, 2025 and 2026', 'TB Resolutions 2025-64, 2025-984, 2026-1, 2026-2 and 2026-58', 'Budget Supplements, 2024–2026'],
  },
  {
    id: 'appointees',
    lever: 'Choose his own senior staff',
    whoActs: 'The Supervisor appoints the Deputy Supervisor and his office staff; the Board formally acknowledges each appointment.',
    record: [
      'He kept both senior staff members from his predecessors. The Deputy Supervisor has held the job since 2020, under Supervisors Aguiar and Hubbard (Resolution 2020-130). The Town Budget Officer, who is also his Chief of Staff, has held the job since July 2022 (Resolution 2022-491). The Board acknowledged both on January 6 (Resolutions 2026-59 and 2026-60).',
      `His one new hire is a Legislative Aide (Resolution 2026-58), who fills the office’s Secretary job. The 2026 pay list has the same ${word(officeStaff.length)} staff jobs in the office as 2025, so the office didn’t grow.`,
      'Keeping them gives a one-year term some continuity, since both have worked on the last four budgets. It also means his first budget comes from the same office that produced his predecessors’.',
    ],
    worth: null,
    sources: ['Authorized salary schedules, 2022–2026', '2020–2025 Town payroll', 'TB Resolutions 2024-35 and 2024-36 (citing 2020-130 and 2022-491)', 'TB Resolutions 2026-58, 2026-59, 2026-60'],
  },
  {
    id: 'health-share',
    lever: 'Have employees pay at least 15% of their health insurance',
    whoActs: 'The Board decides, by resolution, for elected officials and non-union managers. For union members the share is set by contract. The police unions’ contracts (PBA and SOA) end in 2026, so the new contracts are the chance to change it.',
    record: [
      `On ${new Date(resolution984.adopted + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}, before he took office, the Board voted unanimously to stop charging four appointed jobs their 25% share of medical, dental and vision insurance (Resolution ${resolution984.number}). Two of them are the Deputy Supervisor and the Chief of Staff, and the resolution calls it a change “in lieu of merit increases.” The 2026 pay list then raised both by ${ratePct}, the same raise it gave ${sameRateCount} other positions off the union pay scale.`,
      'No resolution passed in 2026 sets or restores an employee share.',
    ],
    worth: `About ${usd(round100(fifteenPercentAcrossModeled))} a year at 15% across the ${eligiblePositionsModeled} senior-staff and elected positions we model, and about ${usd(round100(restoring25PercentOnFour))} for bringing back the 25% share on the four jobs alone. Both use the lowest State health plan (NYSHIP) rate, for one person, assuming everyone is enrolled. A 15% share for union members would save more, depending on what each contract charges now, which the budget doesn’t show.`,
    link: { label: 'Management Pay', path: '/management-compensation/' },
    sources: [`TB Resolution ${resolution984.number}, Dec. 16, 2025`, 'NYSHIP Empire Plan participating-agency rate'],
  },
  {
    id: 'fund-balance-policy',
    lever: 'Update the rule for the Town’s savings',
    whoActs: 'The Board decides, by resolution. The Supervisor can propose one, and as budget officer he decides how much savings each budget proposal uses.',
    record: [
      `The Town’s rule is Resolution 918 of 2011, which updated one from 2006. It says General Fund savings should be at least ${pctPlain(policyMinimumPercent, 0)} of the budget, and that money above that may be used to reduce the next year’s property taxes, for one-time capital costs, or for emergencies like hurricanes. It sets no ceiling.`,
      `At the end of 2025 the audit found ${usd(openingUnassigned)} in General Fund savings not set aside for anything. That’s ${pctPlain(openingPercentOfAppropriations)} of the 2026 General Fund budget, ${(openingPercentOfAppropriations / policyMinimumPercent).toFixed(1)} times the floor. Resolutions passed in 2026 have committed ${usd(committedThisYear)} of it.`,
      'No resolution since 2011 has changed the rule, including in 2026.',
    ],
    worth: `At most ${usd(surplusAboveFloorCeiling)} above the 15% floor after this year’s commitments. It’s one-time money: it can pay off debt, pay for building projects or soften one year’s taxes, but it can’t cover an ongoing cost for long.`,
    testId: 'one-time',
    link: { label: 'Reserves & Fund Balance', path: '/reserves/' },
    sources: ['TB Resolution 918, Dec. 20, 2011 (the policy)', '2025 audited financial statements', '2026 Adopted Budget', 'TB resolutions, 2026'],
  },
  {
    id: 'housing',
    lever: 'Adopt a housing plan',
    whoActs: `The Board passes local laws and a community housing plan. A community housing fund also needs a town-wide vote (${housingStatute.citation}).`,
    record: [
      'In March the Board replaced the Town’s accessory-apartment law with a new accessory dwelling unit (ADU) law (Resolution 2026-252, unanimous).',
      'Riverhead is still the only one of the five Peconic Bay towns without a community housing plan or fund. No resolution passed in 2026 starts either one.',
    ],
    worth: `A 0.5% housing transfer tax would have raised an estimated ${usd(round100(forgoneLow))} to ${usd(round100(forgoneHigh))} from 2023 through ${forgoneThroughYear}, based on the Town’s own audited transfer-tax revenue.`,
    link: { label: 'Community Housing Plan', path: '/housing-plan/' },
    sources: ['TB Resolutions 2026-153 and 2026-252', `${housingStatute.citation}`, 'Peconic Bay CPF financial statements'],
  },
]

// ── The question this page poses, and does not answer ────────────────────────
const largestMove = Math.max(0, ...stability.map((s) => Math.abs(s.appropriationsPct)))

export const prudence = {
  question: 'Smart politics, or a missed chance?',
  framing:
    'Our scorecard, above, answers the narrower question: how much of the restraint he promised shows up in his budget, scored the same way as the three before it. Whether it’s smart politics is for voters to judge. What the records can do is set the choices in his budget next to what he said he would do. He named the tension himself before taking office: “Our workers want to be paid better and our taxpayers want to have a lessened tax burden” (East End Beacon). Those two goals can pull against each other. Using savings to hold taxes down can be good politics in an election year and a problem for the 2028 budget. Raising taxes to pay for ongoing costs can be sound finance and costly at the polls.',
  considerations: [
    `His budget is a proposal, not the final word. The Board adopts the budget by November 20, after the November 3 election, and four of its five members are Republicans, including his opponent. In the ${stability.length} years we’ve checked, the Board adopted the proposal unchanged ${unchangedYears.length} times and never moved total spending by more than ${largestMove.toFixed(2)}%, so the September 24 proposal usually becomes the budget. His opponent says this one may not: after the meeting Councilman Rothwell told the Riverhead News-Review the Board would go through it item by item and “could probably, at this point, present our own budget to review at a lesser impact.”`,
    'Some of the 2027 pressure is outside any Supervisor’s control. The police unions’ contracts (PBA and SOA) end in 2026, and no one knows yet what the new ones will cost. The July 7 agreements with both unions set up the retirement incentive, not new contracts. Pension and health costs are set by the State and by insurers.',
    'The 2026 budget he inherited raised town-wide taxes by the same measure he campaigned against, and it was adopted the month he won. The 2027 proposal is the first one that’s his.',
  ],
}
