// Peconic Bay Community Preservation Fund: the 2% real-estate transfer tax's
// revenue history, fund balance, and related debt, sourced directly from the
// Town's own audited CPF financial statements (Craig, Fitzsimmons & Meyer LLP
// for 2024; Cullen & Danowski LLP for 2019 and 2025). This is a trend
// explainer, not an advocacy page — the fund balance is healthy and growing,
// but revenue is entirely tied to the real-estate market, which is the real
// question worth laying out for residents.

export type CpfYear = {
  year: number
  transferTaxRevenue: number
  interestIncome: number
  totalRevenue: number
  fundBalanceEnd: number
}

export const cpfHistory: CpfYear[] = [
  { year: 2019, transferTaxRevenue: 3431456, interestIncome: 109299, totalRevenue: 3540755, fundBalanceEnd: 7472219 },
  { year: 2024, transferTaxRevenue: 9539252, interestIncome: 568130, totalRevenue: 10107382, fundBalanceEnd: 25595093 },
  { year: 2025, transferTaxRevenue: 7033230, interestIncome: 976170, totalRevenue: 8009400, fundBalanceEnd: 30106726 },
]

export const cpfDebt = {
  issued: 2018,
  description: '2018 refunding bonds issued against CPF-financed land purchases.',
  rateLow: 0.04,
  rateHigh: 0.05,
  matures: 2029,
  outstanding2024: 12290588,
  outstanding2025: 9756470,
}

export const cpfMechanics = {
  ratePercent: 0.02,
  unimprovedThreshold: 75000,
  improvedThreshold: 150000,
  authorityBeganYear: 1999,
  authorityExtendedYear: 2016,
  authorityExpiresYear: 2050,
  waterQualityCapPercent: 0.2,
  lifetimeLandPurchases2025: 76983250,
  acresProtected: 2280,
}

const first = cpfHistory[0]
const peak = cpfHistory[1]
const latest = cpfHistory[cpfHistory.length - 1]

export const revenueSwing = {
  lowYear: first.year,
  lowAmount: first.transferTaxRevenue,
  peakYear: peak.year,
  peakAmount: peak.transferTaxRevenue,
  latestYear: latest.year,
  latestAmount: latest.transferTaxRevenue,
  peakToLatestChangePercent: (latest.transferTaxRevenue - peak.transferTaxRevenue) / peak.transferTaxRevenue,
  lowToPeakMultiple: peak.transferTaxRevenue / first.transferTaxRevenue,
}
