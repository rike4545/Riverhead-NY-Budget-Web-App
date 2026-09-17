// What a part-year 2026 does to a full-year 2027.
//
// THE MECHANISM. A person hired in September draws four months of pay in 2026,
// but the appropriation line carrying them is a FULL-YEAR line. The 2027 budget
// has to fund twelve months of the same person on the same line. Nothing in the
// 2026 adopted budget shows that increase, and nothing in the resolution that
// hired them shows it either. The same thing runs in reverse for a departure: a
// retirement effective in September saves four months in 2026 and a full year in
// 2027. Turnover compounds it — a seat vacated and refilled inside one year can
// charge one line for two people's part-years plus any payout, so that year's
// spending on the line is a poor guide to what the next year needs.
//
// WHAT THIS PAGE CAN AND CANNOT COUNT. The Fiscal Impact Statement names the
// appropriation account an appointment is charged to. It does not state the
// salary. Of 218 personnel resolutions in the 2026 record, 59 name the budget
// line and NOT ONE of them names an amount against it. So the hire side of the
// annualization cannot be priced from the record, and this file does not
// pretend otherwise — it reports the exposure's shape and size in headcount,
// and prices only the side that the published record actually supports.

import fiscalIndex from '../public/data/meetings/fiscal-index.json'
import { lookupAccount, type StatementAccount } from './account-lookup'
import { inWindow, sworn, savingEstimate } from './retirement-actuals-2026'

type Res = {
  number: string | null
  title: string
  category: string
  amount: number | null
  funding?: { accounts?: StatementAccount[] } | null
  vote: { adopted: boolean | null } | null
}
type Meeting = { meetingDate: string; resolutions: Res[] }

const meetings: Meeting[] = (fiscalIndex.meetings as string[]).map(
  (slug) => require(`../public/data/meetings/${slug}-fiscal.json`) as Meeting,
)

const APPOINTS = /appoint/i
/** NY chart of accounts object codes on the personal-services lines. */
const OBJECT = { fullTime: '101', partTime: '102', overtime: '103' } as const
const objectOf = (code: string) => code.split('-')[3] ?? ''

const personnel = meetings.flatMap((m) =>
  m.resolutions
    .filter((r) => r.category === 'personnel')
    .map((r) => ({
      month: m.meetingDate.slice(0, 7),
      meetingDate: m.meetingDate,
      title: r.title,
      number: r.number,
      amount: r.amount,
      accounts: (r.funding?.accounts ?? []).filter((a) => a.kind === 'appropriation'),
    })),
)

const appointments = personnel.filter((p) => APPOINTS.test(p.title))

/**
 * The gap this site cannot close from the record.
 *
 * The Board is told which line an appointment charges and never what it costs.
 * That is not a parsing limitation — the form has no field for it.
 */
export const whatTheFormOmits = {
  personnelResolutions: personnel.length,
  namingAnAccount: personnel.filter((p) => p.accounts.length > 0).length,
  namingAnAmount: personnel.filter((p) => p.amount !== null).length,
  namingBoth: personnel.filter((p) => p.accounts.length > 0 && p.accounts.some((a) => a.amount)).length,
  note:
    'The Fiscal Impact Statement asks for the appropriation account to be charged, and Riverhead fills it in. It does not ask what the appointment pays. So a resident can see which budget line a new hire lands on, and cannot see what the line now owes — which is the number that carries into next year.',
}

/** When the hiring happened, which is what decides how much annualises. */
export const appointmentTiming = (() => {
  const byMonth = new Map<string, number>()
  const fullTimeByMonth = new Map<string, number>()
  for (const a of appointments) {
    byMonth.set(a.month, (byMonth.get(a.month) ?? 0) + 1)
    if (a.accounts.some((x) => objectOf(x.code) === OBJECT.fullTime)) {
      fullTimeByMonth.set(a.month, (fullTimeByMonth.get(a.month) ?? 0) + 1)
    }
  }
  const months = Array.from(byMonth.keys()).sort()
  const firstHalf = months.filter((m) => m <= '2026-06').reduce((s, m) => s + (byMonth.get(m) ?? 0), 0)
  const total = appointments.length
  return {
    total,
    byMonth: months.map((m) => ({ month: m, count: byMonth.get(m) ?? 0, fullTime: fullTimeByMonth.get(m) ?? 0 })),
    firstHalf,
    secondHalf: total - firstHalf,
    firstHalfShare: total > 0 ? firstHalf / total : 0,
    reading:
      'Most of the year’s hiring happened early, so most of it already sits in the 2026 line at close to a full year’s cost. The annualisation tail on the hire side is real but small — which is worth saying, because the instinct is to assume the opposite.',
  }
})()

/** Payroll lines the 2026 record touches more than once — where turnover lands. */
export const linesWithRepeatedActions = (() => {
  const hits = new Map<string, number>()
  for (const p of personnel) {
    for (const a of p.accounts) hits.set(a.code, (hits.get(a.code) ?? 0) + 1)
  }
  return Array.from(hits.entries())
    .filter(([, n]) => n > 1)
    .map(([code, actions]) => {
      const match = lookupAccount(code)
      return {
        code,
        actions,
        line: match.status === 'matched' ? match.lineName : null,
        department: match.status === 'matched' ? match.department : null,
        fund: match.status === 'matched' ? match.fundName : null,
        adopted2026: match.status === 'matched' ? match.adopted2026 : null,
      }
    })
    .sort((a, b) => b.actions - a.actions)
})()

// ── The side the record does support: departures ────────────────────────────
//
// Retirements carry an effective date bounded by the incentive itself — no later
// than October 1, 2026 — and the saving per sworn retirement is already derived
// from the contract step schedule. So the 2027 increment can be bracketed, and
// bracketed is how it is reported: two bounds, not a point estimate.
const MONTHS_IN_YEAR = 12

function monthsRemainingIn2026(iso: string): number {
  const month = Number(iso.slice(5, 7))
  const day = Number(iso.slice(8, 10))
  return Math.max(0, MONTHS_IN_YEAR - (month - 1) - day / 30)
}

export const retirementAnnualisation = (() => {
  const full = savingEstimate.annualFromSworn
  // Earliest: each retirement effective the day the Board accepted it.
  const earliestMonths = sworn.reduce((s, r) => s + monthsRemainingIn2026(r.meetingDate), 0)
  const caught2026Earliest = (full * earliestMonths) / (sworn.length * MONTHS_IN_YEAR || 1)
  // Latest: every one effective on the October 1 deadline.
  const caught2026Latest = (full * 3) / MONTHS_IN_YEAR
  return {
    fullYearSaving: full,
    swornCount: sworn.length,
    caught2026Low: Math.round(caught2026Latest),
    caught2026High: Math.round(caught2026Earliest),
    increment2027Low: Math.round(full - caught2026Earliest),
    increment2027High: Math.round(full - caught2026Latest),
    note:
      'Bracketed because the resolutions state the Board accepted a retirement, not the day it took effect. The low bound assumes every one landed on the October 1 deadline; the high bound assumes each took effect the day it was accepted.',
    counterweight:
      'This runs the other way if the seats are slow to fill. The per-retirement figure is a steady-state number that already nets a replacement at the entry step, so a seat left empty saves more than it says in the months it stays empty, and 2027 gives that back once the seat is filled.',
  }
})()

export const bothDirections = {
  headline: 'Part-year 2026, full-year 2027 — and it runs both ways',
  body:
    `Two things in the 2026 record change size in 2027 without anyone voting on them again. ` +
    `${appointmentTiming.secondHalf} of the year’s ${appointmentTiming.total} appointments were made in the second half of the year, ` +
    `and each will draw a full twelve months from the same appropriation line next year. Running against that, ` +
    `${sworn.length} sworn retirements took effect between July and October, so 2027 is the first budget to carry the ` +
    `whole of that saving rather than a part of it. The departures are priceable from the contract step schedule and the ` +
    `arrivals are not, because the Fiscal Impact Statement never states what an appointment pays.`,
  windowRetirements: inWindow.length,
}

export const limits = [
  'The hire side is reported in headcount, not dollars. The Fiscal Impact Statement names the account an appointment charges and never the salary, so pricing it would mean inventing a figure.',
  'Appointment month is the meeting that approved or ratified the appointment, which is close to but not the same as the start date. Several resolutions ratify an appointment already made.',
  'Repeated actions on one payroll line are a signal of turnover, not proof of it: a line can be named twice for two different seats in the same department.',
  'Nothing here covers contractual step movement or an across-the-board raise. Those are separate 2027 pressures and are modeled elsewhere on this site.',
]
