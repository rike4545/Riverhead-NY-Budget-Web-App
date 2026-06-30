// Account-level (sub-account) budget detail extracted from the 2026 Adopted
// Budget by etl/parse_subaccounts.py. Every fund reconciles to the dollar
// against the official Summary page appropriations.

import indexJson from '../public/data/subaccounts/index.json'

import A01 from '../public/data/subaccounts/A01.json'
import A04 from '../public/data/subaccounts/A04.json'
import A06 from '../public/data/subaccounts/A06.json'
import CM1 from '../public/data/subaccounts/CM1.json'
import CM2 from '../public/data/subaccounts/CM2.json'
import CM4 from '../public/data/subaccounts/CM4.json'
import DA1 from '../public/data/subaccounts/DA1.json'
import ES1 from '../public/data/subaccounts/ES1.json'
import ES3 from '../public/data/subaccounts/ES3.json'
import ES5 from '../public/data/subaccounts/ES5.json'
import EW1 from '../public/data/subaccounts/EW1.json'
import MS1 from '../public/data/subaccounts/MS1.json'
import MS2 from '../public/data/subaccounts/MS2.json'
import SL1 from '../public/data/subaccounts/SL1.json'
import SM1 from '../public/data/subaccounts/SM1.json'
import SR1 from '../public/data/subaccounts/SR1.json'
import ST1 from '../public/data/subaccounts/ST1.json'
import V01 from '../public/data/subaccounts/V01.json'
import Z14 from '../public/data/subaccounts/Z14.json'

export type SubLineItem = {
  account: string
  name: string
  category: string
  adopted2024: number | null
  adopted2025: number | null
  deptRequested2026: number | null
  tentative2026: number | null
  preliminary2026: number | null
  adopted2026: number | null
  history: SubYearValue[]
}

export type SubYearValue = { year: number; value: number }

export type SubCategoryTotal = { category: string; adopted2026: number }

export type SubDepartment = {
  code: string
  name: string
  adopted2024: number
  adopted2025: number
  adopted2026: number
  change: number
  categoryTotals: SubCategoryTotal[]
  lineItems: SubLineItem[]
  lineItemCount: number
}

export type RevenueLineItem = {
  account: string
  name: string
  adopted2025: number | null
  deptRequested2026: number | null
  tentative2026: number | null
  preliminary2026: number | null
  adopted2026: number | null
}

export type FundDetail = {
  code: string
  name: string
  source: { title: string; url: string }
  expenditureTotal2026: number
  expenditureTotal2025: number
  revenueTotal2026: number
  departmentCount: number
  lineItemCount: number
  officialAppropriations2026: number | null
  reconciliationVariance2026: number | null
  reconciled: boolean
  departments: SubDepartment[]
  revenues: RevenueLineItem[]
}

export type FundIndexEntry = {
  code: string
  name: string
  expenditureTotal2026: number
  officialAppropriations2026: number | null
  reconciliationVariance2026: number | null
  reconciled: boolean
  revenueTotal2026: number
  departmentCount: number
  lineItemCount: number
}

export type SubAccountIndex = {
  source: { title: string; url: string }
  generatedFrom: string
  fundCount: number
  totalLineItems: number
  historyYears: number[]
  funds: FundIndexEntry[]
}

export const subAccountIndex = indexJson as SubAccountIndex

const fundDetails: Record<string, FundDetail> = {
  A01, A04, A06, CM1, CM2, CM4, DA1, ES1, ES3, ES5,
  EW1, MS1, MS2, SL1, SM1, SR1, ST1, V01, Z14,
} as unknown as Record<string, FundDetail>

export function getFundDetail(code: string): FundDetail | undefined {
  return fundDetails[code.toUpperCase()]
}

export function allFundCodes(): string[] {
  return subAccountIndex.funds.map((f) => f.code)
}

// Town-wide rollups across every fund.
export const townwideSubAccountTotals = {
  expenditure2026: subAccountIndex.funds.reduce((s, f) => s + f.expenditureTotal2026, 0),
  revenue2026: subAccountIndex.funds.reduce((s, f) => s + f.revenueTotal2026, 0),
  lineItems: subAccountIndex.totalLineItems,
  departments: subAccountIndex.funds.reduce((s, f) => s + f.departmentCount, 0),
  reconciledFunds: subAccountIndex.funds.filter((f) => f.reconciled).length,
}

// Town-wide spending by category, summed from every fund's line items.
export function townwideCategoryTotals(): SubCategoryTotal[] {
  const totals = new Map<string, number>()
  for (const fund of Object.values(fundDetails)) {
    for (const dept of fund.departments) {
      for (const item of dept.lineItems) {
        totals.set(item.category, (totals.get(item.category) ?? 0) + (item.adopted2026 ?? 0))
      }
    }
  }
  return Array.from(totals.entries())
    .map(([category, adopted2026]) => ({ category, adopted2026 }))
    .sort((a, b) => b.adopted2026 - a.adopted2026)
}
