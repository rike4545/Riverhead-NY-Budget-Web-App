// Peconic Bay Community Preservation Fund: the 2% real-estate transfer tax's
// revenue history, fund balance, and related debt, built by etl/parse_cpf.py
// from the Town's own CPF financial statements (a different document each
// year, several different auditors). This is a trend explainer, not an
// advocacy page — the fund balance is healthy and growing, but revenue is
// entirely tied to the real-estate market, which is the real question worth
// laying out for residents.

import cpfJson from '../public/data/cpf/history.json'

export type CpfDebtRow = {
  description: string
  issued: number
  rateLow: number
  rateHigh: number
  matures: string
  outstanding: number
}

export type CpfDebt = {
  rows: CpfDebtRow[]
  totalOutstanding: number
}

export type CpfYear = {
  year: number
  transferTaxRevenue: number
  interestIncome: number
  fundBalanceBeginning: number | null
  fundBalanceEnd: number
  realEstatePurchasesLifetime: number | null
  debt: CpfDebt | null
  sourceUrl: string
  sourceTitle: string
}

type CpfHistoryFile = {
  source: { title: string; url: string }
  note: string
  years: CpfYear[]
}

const cpfHistoryFile = cpfJson as CpfHistoryFile

export const cpfHistory: CpfYear[] = cpfHistoryFile.years
export const cpfSource = cpfHistoryFile.source

function totalRevenue(y: CpfYear): number {
  return y.transferTaxRevenue + y.interestIncome
}

const latest = cpfHistory[cpfHistory.length - 1]
const lowYearEntry = cpfHistory.reduce((a, b) => (b.transferTaxRevenue < a.transferTaxRevenue ? b : a))
const peakYearEntry = cpfHistory.reduce((a, b) => (b.transferTaxRevenue > a.transferTaxRevenue ? b : a))

export const cpfDebt = latest.debt
  ? {
      description: `${latest.debt.rows.map((r) => `${r.description} ${r.issued}`).join(', ')} issued against CPF-financed land purchases.`,
      rows: latest.debt.rows,
      totalOutstanding: latest.debt.totalOutstanding,
    }
  : null

export const cpfMechanics = {
  ratePercent: 0.02,
  unimprovedThreshold: 75000,
  improvedThreshold: 150000,
  authorityBeganYear: 1999,
  authorityExtendedYear: 2016,
  authorityExpiresYear: 2050,
  waterQualityCapPercent: 0.2,
  lifetimeLandPurchases: latest.realEstatePurchasesLifetime,
  acresProtected: 2280,
}

export const revenueSwing = {
  lowYear: lowYearEntry.year,
  lowAmount: lowYearEntry.transferTaxRevenue,
  peakYear: peakYearEntry.year,
  peakAmount: peakYearEntry.transferTaxRevenue,
  latestYear: latest.year,
  latestAmount: latest.transferTaxRevenue,
  // If the latest year IS the peak (revenue is still climbing), there's no
  // pullback to report — this stays null rather than reporting a fabricated
  // "0% change from itself."
  peakToLatestChangePercent:
    peakYearEntry.year === latest.year
      ? null
      : (latest.transferTaxRevenue - peakYearEntry.transferTaxRevenue) / peakYearEntry.transferTaxRevenue,
  lowToPeakMultiple: peakYearEntry.transferTaxRevenue / lowYearEntry.transferTaxRevenue,
}

export function cpfTotalRevenue(y: CpfYear): number {
  return totalRevenue(y)
}
