// Multi-year fund-level appropriations history, extracted from each adopted
// budget's Summary page by etl/parse_budget_history.py. The town-total
// appropriations reconcile to the official 2026 figure ($121,110,904).

import historyJson from '../public/data/history/fund-appropriations.json'

export type FundYearValue = { appropriations: number }

export type FundHistory = {
  code: string
  name: string
  years: Record<string, FundYearValue>
  firstYear: number
  lastYear: number
  totalChange: number
  totalChangePct: number | null
}

export type BudgetHistory = {
  source: { title: string; url: string }
  note: string
  years: number[]
  townTotals: Record<string, { appropriations: number; fundCount: number }>
  funds: FundHistory[]
}

export const budgetHistory = historyJson as BudgetHistory

export function fundHistory(code: string): FundHistory | undefined {
  return budgetHistory.funds.find((f) => f.code.toUpperCase() === code.toUpperCase())
}

export function appropriationsByYear(code: string): { year: number; value: number | null }[] {
  const f = fundHistory(code)
  return budgetHistory.years.map((year) => ({
    year,
    value: f?.years[String(year)]?.appropriations ?? null,
  }))
}
