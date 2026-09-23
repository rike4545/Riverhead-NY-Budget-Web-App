// The site's scoring rule for a Tentative Budget, fixed on September 23, 2026,
// the day before the 2027 Tentative is presented, so that it cannot be tuned to
// the result.
//
// WHAT IT SCORES. Restraint, which is what Supervisor Halpin promised: to keep
// the budget "as close to the tax cap as possible," to keep "a tight lid on
// spending," and to treat "every dollar we can save or retain" as a dollar off a
// taxpayer's burden. Each criterion below is tied to one of those commitments.
// The rule is applied the same way to every Tentative with complete data --
// 2024 under Supervisor Aguiar, 2025 and 2026 under Supervisor Hubbard, 2027
// under Supervisor Halpin -- so his has a baseline rather than a verdict of its
// own.
//
// WHAT IT DOES NOT SCORE. Whether a budget is good. A Tentative can fail every
// criterion and still be the prudent one in a year of new contracts or storm
// damage. The score is this site's analysis, not a fact, and whether the result
// was politically prudent stays a judgment for voters.
//
// THE THRESHOLDS. 2% is the reference line the site uses everywhere; it is
// stricter than the legal levy limit, which the Town does not print (see
// /tax-cap/). Every other threshold is "no worse than the year before."
// Revenue growth is reported on the page but not scored: a Tentative can raise
// its revenue estimates to hold the levy down, so scoring it would reward
// optimism.
//
// Any change to the criteria will be dated here, with the earlier scores kept.

import { stageDoc, type StageDoc } from './budget-stages'
import { PREPARED_UNDER } from './tentative-2027'
import requestsJson from '../public/data/budget-supplement/requests-by-year.json'

export const RULE = { fixed: 'September 23, 2026', version: 1 }
export const YEARS = [2024, 2025, 2026, 2027] as const
export const preparedUnder = (y: number) => PREPARED_UNDER[y] ?? null
const REFERENCE = 2 // percent

type Office = { adopted: number; tentative: number }
type RequestYear = { expenditure: { delta: number; request: number }; reconciliation: { complete: boolean }; supervisorOffice?: Office }
const requests = (requestsJson as unknown as { byYear: Record<string, RequestYear> }).byYear
const completeRequests = (y: number) => (requests[String(y)]?.reconciliation.complete ? requests[String(y)] : null)

const TOWN_WIDE = ['A01', 'DA1', 'SL1']
function townWide(d: StageDoc | null): number | null {
  if (!d) return null
  let total = 0
  for (const f of TOWN_WIDE) {
    const levy = d.funds[f]?.levy
    if (levy == null) return null
    total += levy
  }
  return total
}
const growth = (from: number | null, to: number | null) => (from && to !== null ? ((to - from) / from) * 100 : null)
const pct = (n: number) => `${n > 0 ? '+' : n < 0 ? '−' : ''}${Math.abs(n).toFixed(2)}%`
const usd = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
const signedUsd = (n: number) => `${n > 0 ? '+' : n < 0 ? '−' : ''}${usd(Math.abs(n))}`

export type Result = { met: boolean | null; value: string | null }
export type Criterion = { id: string; promise: string; test: string; measure: (y: number) => Result }

const NONE: Result = { met: null, value: null }

export const criteria: Criterion[] = [
  {
    id: 'levy-reference',
    promise: '“As close to the tax cap as possible”',
    test: `Town-wide levy growth at or under ${REFERENCE}%`,
    measure: (y) => {
      const g = growth(townWide(stageDoc(y - 1, 'adopted')), townWide(stageDoc(y, 'tentative')))
      return g === null ? NONE : { met: g <= REFERENCE, value: pct(g) }
    },
  },
  {
    id: 'levy-trend',
    promise: 'Ran against the 7.89% increase',
    test: 'A smaller town-wide increase than the year before',
    measure: (y) => {
      const now = growth(townWide(stageDoc(y - 1, 'adopted')), townWide(stageDoc(y, 'tentative')))
      const before = growth(townWide(stageDoc(y - 2, 'adopted')), townWide(stageDoc(y - 1, 'adopted')))
      return now === null || before === null ? NONE : { met: now < before, value: `${pct(now)} vs ${pct(before)}` }
    },
  },
  {
    id: 'spending',
    promise: '“A tight lid on spending”',
    test: `Appropriations growth, all funds, at or under ${REFERENCE}%`,
    measure: (y) => {
      const t = stageDoc(y, 'tentative')
      const g = growth(stageDoc(y - 1, 'adopted')?.totals.appropriations ?? null, t?.totals.appropriations ?? null)
      return g === null ? NONE : { met: g <= REFERENCE, value: pct(g) }
    },
  },
  {
    id: 'one-time',
    promise: '“Every dollar we can save or retain”',
    test: 'No larger General Fund draw on fund balance than the year before',
    measure: (y) => {
      const now = stageDoc(y, 'tentative')?.funds.A01?.fundBalance
      const before = stageDoc(y - 1, 'adopted')?.funds.A01?.fundBalance
      return now == null || before == null ? NONE : { met: now <= before, value: `${usd(now)} vs ${usd(before)}` }
    },
  },
  {
    id: 'requests',
    promise: '“Every dollar we can save or retain”',
    test: 'Comes in below what departments asked for',
    measure: (y) => {
      const r = completeRequests(y)
      return r ? { met: r.expenditure.delta < 0, value: signedUsd(r.expenditure.delta) } : NONE
    },
  },
  {
    id: 'office',
    promise: 'Cut $40,000 from the Supervisor’s Office salaries',
    test: 'No more for the Supervisor’s own office payroll than the year before',
    measure: (y) => {
      const o = completeRequests(y)?.supervisorOffice
      return o ? { met: o.tentative <= o.adopted, value: signedUsd(o.tentative - o.adopted) } : NONE
    },
  },
]

export type YearScore = { year: number; preparedUnder: string | null; results: Record<string, Result>; met: number; measured: number; released: boolean }

export const scores: YearScore[] = YEARS.map((year) => {
  const results = Object.fromEntries(criteria.map((c) => [c.id, c.measure(year)]))
  const measured = Object.values(results).filter((r) => r.met !== null)
  return {
    year,
    preparedUnder: preparedUnder(year),
    results,
    met: measured.filter((r) => r.met).length,
    measured: measured.length,
    released: stageDoc(year, 'tentative') !== null,
  }
})

/** Reported beside the score, not in it. */
export const revenueGrowth = YEARS.map((y) => ({
  year: y,
  value: growth(stageDoc(y - 1, 'adopted')?.funds.A01?.revenues ?? null, stageDoc(y, 'tentative')?.funds.A01?.revenues ?? null),
}))
