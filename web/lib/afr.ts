// Actual year-end results from the 2025 Annual Financial Report (NYS AUD),
// built by etl/parse_afr.py. Columns are 2025 / 2024 / 2023.

import afrJson from '../public/data/afr/2025.json'

export type YearCols = Record<string, number> // keys: "2025","2024","2023"
export type CategoryRow = { category: string; values: YearCols }
export type FundBalanceClassRow = { class: string; values: YearCols }

export type AfrFund = {
  code: string
  name: string
  revenues: YearCols | null
  expenditures: YearCols | null
  surplus: YearCols | null
  fundBalance: YearCols | null
  revenueCategories: CategoryRow[]
  expenditureCategories: CategoryRow[]
  fundBalanceClasses: FundBalanceClassRow[]
}

export type AnnualFinancialReport = {
  source: { title: string; url: string }
  fiscalYear: number
  years: number[]
  note: string
  funds: AfrFund[]
}

export const afr2025 = afrJson as AnnualFinancialReport

export function afrFund(code: string): AfrFund | undefined {
  return afr2025.funds.find((f) => f.code === code)
}

export const generalFundAfr = afrFund('A')!

// Budget fund codes (A01, DA1, …) roll up into the AFR's broader fund groups
// (A, DA, …). Several budget funds can share one AFR group, so actuals shown
// on a fund page are for the whole group.
const BUDGET_TO_AFR: Record<string, string> = {
  A01: 'A', A04: 'A', A06: 'A',
  CM1: 'CM', CM2: 'CM', CM4: 'CM',
  DA1: 'DA',
  ES1: 'ES', ES3: 'ES', ES5: 'ES',
  EW1: 'EW',
  MS1: 'MS', MS2: 'MS',
  SL1: 'SL', SM1: 'SM', SR1: 'SR', ST1: 'ST',
  V01: 'V',
}

export function afrGroupForBudgetFund(budgetCode: string): { fund: AfrFund; shared: boolean } | null {
  const letter = BUDGET_TO_AFR[budgetCode.toUpperCase()]
  if (!letter) return null
  const fund = afrFund(letter)
  if (!fund) return null
  const shared = Object.values(BUDGET_TO_AFR).filter((v) => v === letter).length > 1
  return { fund, shared }
}
