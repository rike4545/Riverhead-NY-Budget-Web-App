// Revenue, stream by stream: what each source was expected to bring in and
// what it did, for every year the Budget Supplements cover. Written by
// etl/parse_supplement_history.py (revenue-history.json).
//
// Two kinds of "revenue" are kept apart throughout. The tax levy and the fund
// balance a budget plans to use are set, not estimated, and money moved between
// the Town's own funds (charges and transfers) is bookkeeping. "Outside revenue"
// is everything else: the sources whose estimates can be right or wrong.

import revenueJson from '../public/data/budget-supplement/revenue-history.json'

export type YearMap = Record<string, number>

export type RevenueAccount = {
  account: string
  fund: string
  code: string
  category: string
  name: string
  page: number | null
  actual: YearMap
  adopted: YearMap
  ytd: YearMap
  request: number | null
  tentative: number | null
}

export type UnderEstimated = {
  account: string
  fund: string
  name: string
  category: string
  page: number | null
  collected: YearMap
  estimated: YearMap
  averageCollected: number
  averageEstimated: number
  tentative: number | null
  gap: number
}

export type NeverCollected = {
  account: string
  fund: string
  name: string
  category: string
  page: number | null
  estimated: YearMap
  tentative: number | null
}

type RevenueFile = {
  supplementYears: number[]
  budgetYear: number
  actualYears: number[]
  adoptedYears: number[]
  underEstimated: UnderEstimated[]
  neverCollected: NeverCollected[]
  categories: { id: string; label: string; codes: string }[]
  accounts: RevenueAccount[]
  note: string
}

const data = revenueJson as unknown as RevenueFile

export const revenueBudgetYear = data.budgetYear
export const revenueActualYears = data.actualYears
export const revenueAdoptedYears = data.adoptedYears
export const revenueSupplementYears = data.supplementYears
export const revenueNote = data.note
export const categories = data.categories
export const underEstimated = data.underEstimated
export const neverCollected = data.neverCollected
export const revenueAccounts = data.accounts

export const categoryLabel = (id: string) => categories.find((c) => c.id === id)?.label ?? id

/** Set rather than estimated, or moved between the Town's own funds. */
export const NOT_ESTIMATED = new Set(['property-tax', 'fund-balance', 'interfund-revenue', 'other-sources'])
export const isOutside = (a: RevenueAccount) => !NOT_ESTIMATED.has(a.category)

export const FUND_LABELS: Record<string, string> = {
  A01: 'General Fund', A04: 'Police Athletic League', A06: 'Recreation Program Fund',
  CM1: 'Business Improvement District', CM2: 'East Creek Docking Facility', CM4: 'Community Preservation Fund',
  DA1: 'Highway Fund', ES1: 'Riverhead Sewer District', ES3: 'Calverton Sewer District',
  ES5: 'Riverhead Scavenger Waste', EW1: 'Water District', MS1: 'Workers Compensation Fund',
  MS2: 'Risk Retention Fund', SL1: 'Street Lighting District', SM1: 'Ambulance District',
  SR1: 'Refuse and Garbage District', ST1: 'Public Parking District', V01: 'Debt Service Fund',
  Z14: 'Calverton Parks Community Development Agency',
}

export const accountsIn = (fund: string, test: (a: RevenueAccount) => boolean = () => true) =>
  revenueAccounts.filter((a) => a.fund === fund && test(a))

const sum = (rows: RevenueAccount[], pick: (a: RevenueAccount) => number | null | undefined) =>
  rows.reduce((s, a) => s + (pick(a) ?? 0), 0)

export const collected = (rows: RevenueAccount[], year: number) => sum(rows, (a) => a.actual[String(year)])
export const estimated = (rows: RevenueAccount[], year: number) => sum(rows, (a) => a.adopted[String(year)])
export const midYear = (rows: RevenueAccount[], year: number) => sum(rows, (a) => a.ytd[String(year)])
export const tentative = (rows: RevenueAccount[]) => sum(rows, (a) => a.tentative)
export const requested = (rows: RevenueAccount[]) => sum(rows, (a) => a.request)

/** Years with both an estimate and a collection on file. */
export const comparableYears = revenueActualYears.filter((y) => revenueAdoptedYears.includes(y))

export type YearRow = { year: number; estimated: number; collected: number; difference: number }

/** Estimate against collections, year by year, for a set of accounts. A year
    whose estimate or collections are missing from every account is skipped. */
export function estimateRecord(rows: RevenueAccount[]): YearRow[] {
  return comparableYears
    .map((year) => ({ year, estimated: estimated(rows, year), collected: collected(rows, year) }))
    .filter((r) => r.estimated > 0 && r.collected > 0)
    .map((r) => ({ ...r, difference: r.collected - r.estimated }))
}

export type CategoryRow = {
  id: string
  label: string
  estimatedLast: number
  collectedLast: number
  estimatedNow: number
  midYearPrior: number
  midYearNow: number
  tentative: number
  accounts: RevenueAccount[]
}

/** One fund's revenue by source: the last full year, this year so far, and the Tentative. */
export function byCategory(fund: string): CategoryRow[] {
  const last = revenueActualYears[revenueActualYears.length - 1]
  const now = revenueAdoptedYears[revenueAdoptedYears.length - 1]
  const rows = accountsIn(fund)
  return categories
    .map((c) => {
      const acc = rows.filter((a) => a.category === c.id)
      return {
        id: c.id, label: c.label,
        estimatedLast: estimated(acc, last), collectedLast: collected(acc, last),
        estimatedNow: estimated(acc, now), midYearPrior: midYear(acc, now - 1), midYearNow: midYear(acc, now),
        tentative: tentative(acc), accounts: acc,
      }
    })
    .filter((r) => r.accounts.length > 0 && (r.estimatedLast || r.collectedLast || r.estimatedNow || r.tentative))
}

/** Streams worth listing: at least $1,000 in some year. */
export const material = (a: RevenueAccount) =>
  [...Object.values(a.actual), ...Object.values(a.adopted), a.tentative ?? 0].some((v) => Math.abs(v) >= 1000)
