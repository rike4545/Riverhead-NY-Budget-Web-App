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
