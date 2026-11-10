// Patterns across funds, for /outliers/#fund-patterns.
//
// The line-by-line outliers find single accounts that moved. This looks at
// each fund as a whole, year by year from the Budget Supplements (actuals 2018
// onward, adopted budgets and revenue estimates 2019 onward), and fits simple
// least-squares trends to what each fund collected and spent. It asks four
// questions a resident or Board member could ask of any fund:
//
// 1. Do revenue estimates run consistently low or high? A fund whose revenue
//    beats its estimate year after year has a cushion the budget does not show.
// 2. Is capital paid for with transfers the adopted budget never planned?
// 3. Is "appropriated fund balance" really a draw on savings? In the Sewer,
//    Water and Scavenger Waste budgets it matches the depreciation budget to
//    the dollar. Depreciation is a non-cash expense these funds record because
//    they keep business-style (full accrual) books, so the appropriation
//    offsets an expense that takes no cash.
// 4. Is the gap between collections and spending narrowing? Least-squares
//    slopes of both over 2018-2025 show which is growing faster.
//
// Governmental accounting: the budget is a spending limit on the modified
// accrual (budgetary) basis; the Supplements' actuals for the utility funds
// also carry full-accrual entries (depreciation, losses on asset disposals,
// pension expense under GASB 68). Those are set aside here as non-cash so
// the result compares like with like. Figures are the Supplements', not the
// audited statements, and these are patterns to ask about, not findings.
//
// No imports: the page passes the data in and scripts/verify-fund-patterns.mjs
// runs the same function.

export type SpendLine = { account: string; fund: string; name: string; actual: Record<string, number>; adopted: Record<string, number> }
export type RevenueLine = { account: string; fund: string; code: string; name: string; actual: Record<string, number>; adopted: Record<string, number> }
export type OneOff = { account: string; year: number; amount: number; number: string }

/** Funds that hold capital projects: the Capital Projects Fund and the districts' project funds, whose lines carry project numbers. */
export const CAPITAL_FUNDS = ['H01', 'EW3', 'ES2', 'ES4', 'ES6']

const fnOf = (account: string) => account.split('-')[2] ?? ''
const isDepreciation = (l: SpendLine) => fnOf(l.account) === '1994'
/** Entries the full-accrual books record and the budget does not spend: depreciation, losses on disposal, GASB 68 pension expense. */
export const isNonCash = (l: SpendLine) => ['1994', '1995'].includes(fnOf(l.account)) || /\bNPL\b/.test(l.name)
/** A transfer out to a capital fund: 9901 with the receiving fund in the fifth part of the account. */
export const capitalRecipient = (l: SpendLine) => (fnOf(l.account) === '9901' && CAPITAL_FUNDS.includes(l.account.split('-')[4] ?? '') ? l.account.split('-')[4] : null)

export type FundYear = {
  year: number
  /** Adopted spending budget, estimated revenue (without fund balance) and appropriated fund balance. */
  budget: number | null
  estimate: number | null
  fundBalance: number | null
  depreciationBudget: number | null
  /** Collected: every revenue line but appropriated fund balance, interfund transfers in included. */
  collected: number
  /** Spent: every spending line less non-cash entries, explained one-offs and transfers to capital funds. */
  spent: number
  nonCash: number
  capitalTransfers: number
  plannedCapital: number
  /** Collected less spent: positive means the fund took in more than it paid out before capital transfers. */
  result: number
  /** All spending as the Supplement prints it (less explained one-offs), for the budget comparison. */
  spentAll: number
}

export type Trend = { slope: number; pct: number; r2: number }
export type FundPattern = {
  fund: string
  name: string
  years: FundYear[]
  /** streak: the latest consecutive years in which collections beat the estimate. */
  revenueBeat: { years: number; of: number; average: number; averagePct: number; streak: number; since: number | null; streakAverage: number }
  spendingUnder: { years: number; of: number; average: number; averagePct: number }
  topRevenueLines: { account: string; name: string; average: number }[]
  fbMatchesDepreciation: number[]
  capitalOffBudget: { total: number; years: { year: number; amount: number; planned: number; to: string[] }[] }
  collectedTrend: Trend
  spentTrend: Trend
  narrowing: boolean
  flags: ('revenue-low' | 'revenue-high' | 'spending-under' | 'fb-is-depreciation' | 'capital-off-budget' | 'narrowing')[]
}

export function ols(xs: number[], ys: number[]): { a: number; b: number; r2: number } {
  const n = xs.length
  const mx = xs.reduce((s, x) => s + x, 0) / n
  const my = ys.reduce((s, y) => s + y, 0) / n
  const sxx = xs.reduce((s, x) => s + (x - mx) ** 2, 0)
  const b = sxx ? xs.reduce((s, x, i) => s + (x - mx) * (ys[i] - my), 0) / sxx : 0
  const a = my - b * mx
  const ss = ys.reduce((s, y) => s + (y - my) ** 2, 0)
  const res = ys.reduce((s, y, i) => s + (y - a - b * xs[i]) ** 2, 0)
  return { a, b, r2: ss ? 1 - res / ss : 0 }
}

const r0 = (n: number) => Math.round(n)

export function fundPatterns(spend: SpendLine[], revenue: RevenueLine[], actualYears: number[], adoptedYears: number[], fundNames: Record<string, string>, oneOffs: OneOff[] = [], minSpending = 200_000): FundPattern[] {
  const compare = adoptedYears.filter((y) => actualYears.includes(y))
  const off = (account: string, y: number) => oneOffs.filter((o) => o.account === account && o.year === y).reduce((s, o) => s + o.amount, 0)
  const funds = Array.from(new Set(spend.map((l) => l.fund))).sort()
  const out: FundPattern[] = []
  for (const fund of funds) {
    const S = spend.filter((l) => l.fund === fund)
    const V = revenue.filter((l) => l.fund === fund)
    const isFB = (l: RevenueLine) => l.code === '9999'
    const years: FundYear[] = actualYears.map((year) => {
      const k = String(year)
      const has = adoptedYears.includes(year)
      const spentAll = S.reduce((s, l) => s + (l.actual[k] ?? 0) - off(l.account, year), 0)
      const nonCash = S.filter(isNonCash).reduce((s, l) => s + (l.actual[k] ?? 0), 0)
      const capitalTransfers = S.filter((l) => capitalRecipient(l)).reduce((s, l) => s + (l.actual[k] ?? 0), 0)
      const plannedCapital = S.filter((l) => capitalRecipient(l)).reduce((s, l) => s + (l.adopted[k] ?? 0), 0)
      const collected = V.filter((l) => !isFB(l)).reduce((s, l) => s + (l.actual[k] ?? 0), 0)
      const spent = spentAll - nonCash - capitalTransfers
      return {
        year,
        budget: has ? r0(S.reduce((s, l) => s + (l.adopted[k] ?? 0), 0)) : null,
        estimate: has ? r0(V.filter((l) => !isFB(l)).reduce((s, l) => s + (l.adopted[k] ?? 0), 0)) : null,
        fundBalance: has ? r0(V.filter(isFB).reduce((s, l) => s + (l.adopted[k] ?? 0), 0)) : null,
        depreciationBudget: has ? r0(S.filter(isDepreciation).reduce((s, l) => s + (l.adopted[k] ?? 0), 0)) : null,
        collected: r0(collected), spent: r0(spent), nonCash: r0(nonCash), capitalTransfers: r0(capitalTransfers), plannedCapital: r0(plannedCapital),
        result: r0(collected - spent), spentAll: r0(spentAll),
      }
    })
    const last = years[years.length - 1]
    if (fund === 'V01' || last.spentAll < minSpending) continue
    const cmp = years.filter((y) => compare.includes(y.year) && (y.estimate ?? 0) > 0)
    const beats = cmp.map((y) => y.collected - (y.estimate ?? 0))
    const estSum = cmp.reduce((s, y) => s + (y.estimate ?? 0), 0)
    const cmpS = years.filter((y) => compare.includes(y.year) && (y.budget ?? 0) > 0)
    const unders = cmpS.map((y) => (y.budget ?? 0) - y.spentAll)
    const budSum = cmpS.reduce((s, y) => s + (y.budget ?? 0), 0)
    const avg = (xs: number[]) => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : 0)
    let streak = 0
    for (let i = beats.length - 1; i >= 0 && beats[i] > 0; i--) streak++
    const revenueBeat = { streak, since: streak ? cmp[cmp.length - streak].year : null, streakAverage: r0(avg(beats.slice(beats.length - streak))), years: beats.filter((b) => b > 0).length, of: beats.length, average: r0(avg(beats)), averagePct: estSum ? Math.round((beats.reduce((s, b) => s + b, 0) / estSum) * 1000) / 10 : 0 }
    const spendingUnder = { years: unders.filter((u) => u > 0).length, of: unders.length, average: r0(avg(unders)), averagePct: budSum ? Math.round((unders.reduce((s, u) => s + u, 0) / budSum) * 1000) / 10 : 0 }
    const topRevenueLines = V.filter((l) => !isFB(l))
      .map((l) => ({ account: l.account, name: l.name, average: r0(avg(compare.map((y) => (l.actual[String(y)] ?? 0) - (l.adopted[String(y)] ?? 0)))) }))
      .filter((x) => x.average > 0).sort((a, b) => b.average - a.average).slice(0, 4)
    const fbMatchesDepreciation = years.filter((y) => (y.fundBalance ?? 0) > 0 && y.fundBalance === y.depreciationBudget).map((y) => y.year)
    const capYears = years.filter((y) => y.capitalTransfers !== 0).map((y) => ({
      year: y.year, amount: y.capitalTransfers, planned: y.plannedCapital,
      to: Array.from(new Set(S.filter((l) => capitalRecipient(l) && (l.actual[String(y.year)] ?? 0) !== 0).map((l) => capitalRecipient(l) as string))),
    }))
    // Net of reversals (Calverton Sewer sent $7.65 million to ES4 in 2020 and took $4.18 million back in 2021).
    const capitalOffBudget = { total: r0(capYears.reduce((s, y) => s + y.amount - y.planned, 0)), years: capYears }
    const xs = years.map((y) => y.year)
    const trend = (ys: number[]): Trend => {
      const f = ols(xs, ys)
      const mean = avg(ys)
      return { slope: r0(f.b), pct: mean ? Math.round((f.b / mean) * 1000) / 10 : 0, r2: Math.round(f.r2 * 100) / 100 }
    }
    const collectedTrend = trend(years.map((y) => y.collected))
    const spentTrend = trend(years.map((y) => y.spent))
    const first3 = avg(years.slice(0, 3).map((y) => y.result))
    const last3 = avg(years.slice(-3).map((y) => y.result))
    const narrowing = spentTrend.slope > collectedTrend.slope && spentTrend.r2 >= 0.6 && last3 < first3
    const flags: FundPattern['flags'] = []
    // A pattern needs most years (70%), at least 3% of the budget, and at least $100,000 a year, so small funds' noise is not flagged.
    if (revenueBeat.years >= Math.ceil(revenueBeat.of * 0.7) && revenueBeat.averagePct >= 3 && revenueBeat.average >= 100_000) flags.push('revenue-low')
    if (revenueBeat.of - revenueBeat.years >= Math.ceil(revenueBeat.of * 0.7) && revenueBeat.averagePct <= -3 && revenueBeat.average <= -100_000) flags.push('revenue-high')
    if (spendingUnder.years >= Math.ceil(spendingUnder.of * 0.7) && spendingUnder.averagePct >= 3 && spendingUnder.average >= 100_000) flags.push('spending-under')
    if (fbMatchesDepreciation.length >= 3) flags.push('fb-is-depreciation')
    if (capitalOffBudget.total >= 250_000) flags.push('capital-off-budget')
    if (narrowing) flags.push('narrowing')
    out.push({ fund, name: fundNames[fund] ?? fund, years, revenueBeat, spendingUnder, topRevenueLines, fbMatchesDepreciation, capitalOffBudget, collectedTrend, spentTrend, narrowing, flags })
  }
  return out.sort((a, b) => b.years[b.years.length - 1].spentAll - a.years[a.years.length - 1].spentAll)
}
