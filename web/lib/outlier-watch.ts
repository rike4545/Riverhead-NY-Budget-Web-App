// Year-over-year appropriation swings across all 19 town funds, flagged when
// a change is both large in percentage terms and large enough in dollars to
// matter to a taxpayer — either test alone is too noisy: percent-only flags
// tiny funds swinging on a small base (e.g. Risk Retention +150% on $15,000),
// dollar-only flags the General Fund every year since it dwarfs every other
// fund. Source: budgetHistory ([[budget-history]]), itself extracted from
// each year's Adopted Budget Summary page.
import { budgetHistory } from './budget-history'

export const PCT_THRESHOLD = 20
export const DOLLAR_THRESHOLD = 100_000

export type FundYoyChange = {
  code: string
  name: string
  fromYear: number
  toYear: number
  prior: number
  current: number
  dollarChange: number
  pctChange: number | null
}

export const allYoyChanges: FundYoyChange[] = budgetHistory.funds.flatMap((fund) =>
  budgetHistory.years.slice(1).map((toYear, i) => {
    const fromYear = budgetHistory.years[i]
    const prior = fund.years[String(fromYear)].appropriations
    const current = fund.years[String(toYear)].appropriations
    return {
      code: fund.code,
      name: fund.name,
      fromYear,
      toYear,
      prior,
      current,
      dollarChange: current - prior,
      pctChange: prior === 0 ? null : ((current - prior) / prior) * 100,
    }
  })
)

export function isOutlier(change: FundYoyChange): boolean {
  return change.pctChange !== null && Math.abs(change.pctChange) >= PCT_THRESHOLD && Math.abs(change.dollarChange) >= DOLLAR_THRESHOLD
}

export const outliers: FundYoyChange[] = allYoyChanges
  .filter(isOutlier)
  .sort((a, b) => Math.abs(b.dollarChange) - Math.abs(a.dollarChange))

export const yearTransitions: string[] = budgetHistory.years.slice(1).map((toYear, i) => `${budgetHistory.years[i]}→${toYear}`)
