// Budget against cost, year by year: four screens over the Budget Supplements'
// account histories, for /budget-accuracy/. Each year's actual is set beside
// that same year's adopted budget, never another year's. Nothing here imports
// data, so scripts/verify-accuracy-screens.mjs runs this same code on the same
// records; lib/budget-accuracy.ts wires it to the site's data.
//
// Like the rest of the page, the spending screens leave out mandated costs,
// debt payments, interfund transfers and fund-balance contributions (function
// codes 97xx and 99xx), and the revenue screen leaves out property taxes,
// appropriated fund balance and interfund transfers (code 5031): their swings
// are obligation or timing, not a choice made in the budget.

/** A gap smaller than this is left out: too small to change a budget conversation. */
export const GAP_FLOOR = 25_000
/** Spending at least this many times its budget counts as short of its cost. */
export const SHORT_RATIO = 1.25
/** Spending at most this share of its budget counts as budgeted well above its cost. */
export const OVER_SHARE = 0.6
/** Revenue at most this share of its estimate counts as estimated above what comes in. */
export const REVENUE_SHARE = 0.75

export type AccountHistory = {
  account: string
  fund: string
  name: string
  page: number
  actual: Record<string, number>
  adopted: Record<string, number>
  ytd?: Record<string, number>
  proposed: number | null
  category?: string
}

export type YearPair = { year: string; budget: number; actual: number }

export type ScreenRow = {
  account: string
  fund: string
  name: string
  page: number
  years: YearPair[]
  proposed: number
  /** What makes the row: dollars short, dollars over, or past the budget by mid-year. */
  gap: number
}

export type MidYearRow = { account: string; fund: string; name: string; page: number; budget: number; spent: number; proposed: number; gap: number }

const pairsOf = (a: AccountHistory, years: string[]): YearPair[] | null => {
  const pairs = years.map((year) => ({ year, budget: a.adopted[year], actual: a.actual[year] }))
  return pairs.every((p) => p.budget != null && p.actual != null) ? pairs : null
}
const average = (ps: YearPair[]) => ps.reduce((s, p) => s + p.actual, 0) / ps.length
const byGap = (x: { gap: number }, y: { gap: number }) => y.gap - x.gap

/** A spending line the screens consider: controllable or personnel, and not debt, a transfer or a contribution. */
export const isScreenedSpending = (account: string, control: string | undefined) => {
  const fn = account.split('-')[2] ?? ''
  return (control === 'controllable' || control === 'personnel') && !fn.startsWith('97') && !fn.startsWith('99')
}

/**
 * Spending lines whose cost ran past the budget in at least two of the three
 * years, including the last, by at least SHORT_RATIO and GAP_FLOOR; and whose
 * proposal is again at least GAP_FLOOR below the last year's cost.
 */
export function shortOfCost(accounts: AccountHistory[], years: string[]): ScreenRow[] {
  return accounts.flatMap((a) => {
    const ps = pairsOf(a, years)
    if (!ps) return []
    const short = ps.map((p) => p.actual - p.budget >= GAP_FLOOR && p.actual >= SHORT_RATIO * p.budget)
    const lastCost = ps[ps.length - 1].actual
    const proposed = a.proposed ?? 0
    if (!short[short.length - 1] || short.filter(Boolean).length < 2 || lastCost - proposed < GAP_FLOOR) return []
    return [{ account: a.account, fund: a.fund, name: a.name, page: a.page, years: ps, proposed, gap: lastCost - proposed }]
  }).sort(byGap)
}

/**
 * Spending lines that spent at most OVER_SHARE of the budget in each of the
 * three years, and something in at least one of them (a line never used is
 * listed elsewhere on the page); and whose proposal is at least GAP_FLOOR
 * above, and half again, the three years' average cost.
 */
export function aboveCost(accounts: AccountHistory[], years: string[]): ScreenRow[] {
  return accounts.flatMap((a) => {
    const ps = pairsOf(a, years)
    if (!ps || !ps.every((p) => p.budget > 0 && p.actual <= OVER_SHARE * p.budget) || !ps.some((p) => p.actual > 0)) return []
    const proposed = a.proposed ?? 0
    const avg = average(ps)
    if (proposed - avg < GAP_FLOOR || proposed < 1.5 * avg) return []
    return [{ account: a.account, fund: a.fund, name: a.name, page: a.page, years: ps, proposed, gap: proposed - avg }]
  }).sort(byGap)
}

/** Spending lines that had already spent at least GAP_FLOOR more than the whole year's budget by June 30. */
export function pastBudgetByMidYear(accounts: AccountHistory[], year: string): MidYearRow[] {
  return accounts.flatMap((a) => {
    const spent = a.ytd?.[year]
    const budget = a.adopted[year]
    if (spent == null || budget == null || spent - budget < GAP_FLOOR) return []
    return [{ account: a.account, fund: a.fund, name: a.name, page: a.page, budget, spent, proposed: a.proposed ?? 0, gap: spent - budget }]
  }).sort(byGap)
}

const UNSCREENED_REVENUE = new Set(['property-tax', 'fund-balance'])
/** A revenue line the screen considers: not property tax, fund balance or an interfund transfer. */
export const isScreenedRevenue = (a: { account: string; category?: string }) =>
  !UNSCREENED_REVENUE.has(a.category ?? '') && a.account.split('-')[1] !== '5031'

/**
 * Revenue lines that brought in something, but at most REVENUE_SHARE of the
 * estimate, in each of the three years; and whose proposal again counts on at
 * least GAP_FLOOR more than the three years' average.
 */
export function revenueBelowEstimate(accounts: AccountHistory[], years: string[]): ScreenRow[] {
  return accounts.flatMap((a) => {
    const ps = pairsOf(a, years)
    if (!ps || !ps.every((p) => p.budget > 0 && p.actual > 0 && p.actual <= REVENUE_SHARE * p.budget)) return []
    const proposed = a.proposed ?? 0
    const avg = average(ps)
    if (proposed - avg < GAP_FLOOR) return []
    return [{ account: a.account, fund: a.fund, name: a.name, page: a.page, years: ps, proposed, gap: proposed - avg }]
  }).sort(byGap)
}
