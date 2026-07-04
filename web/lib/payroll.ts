// SeeThroughNY-style payroll dataset built by etl/parse_payroll.py from the
// Town of Riverhead Gross Earnings reports (actual paid earnings incl. overtime).
//
// Only the small summary file is imported at build time. The full per-employee
// records (~500KB) are fetched in the browser on demand — see PAYROLL_RECORDS_URL
// and mapRawRecords() — so they don't bloat the client bundle.

import summaryJson from '../public/data/payroll/summary.json'

export const PAYROLL_RECORDS_URL = '/rike4545-riverhead-budget-live/data/payroll/records.json'

export type PayrollRecordRaw = {
  y: number; n: string; d: string; t: string; c: string; u: string
  r: number; o: number; g: number
}

export type PayrollRecord = {
  year: number
  name: string
  department: string
  title: string
  payClass: string
  union: string
  regular: number
  overtime: number
  gross: number
}

export type LeaderRow = { name: string; title: string; department: string; gross: number; overtime: number }
export type UnionRollup = { union: string; headcount: number; gross: number; overtime: number }
export type DeptRollup = { department: string; headcount: number; gross: number; overtime: number }

export type YearSummary = {
  year: number
  headcount: number
  totalGross: number
  totalRegular: number
  totalOvertime: number
  avgGross: number
  medianGross: number
  maxGross: number
  hasDepartments: boolean
  topEarners: LeaderRow[]
  overtimeLeaders: LeaderRow[]
  byUnion: UnionRollup[]
  byDepartment: DeptRollup[]
}

const summary = summaryJson as { years: number[]; yearSummaries: YearSummary[] }

export const payrollSource = {
  title: 'Town of Riverhead Gross Earnings reports',
  url: 'https://www.townofriverheadny.gov/206/Financial-Reports',
}
export const payrollNote =
  'Actual paid earnings (including overtime) by employee and year. Department, title, and pay class are available for 2022 onward.'

// Matches UNION_LABELS in etl/parse_payroll.py.
export const unionLabels: Record<string, string> = {
  PBA: 'Police Benevolent Association',
  SOA: 'Superior Officers Association',
  CSE: 'CSEA',
  CSEA: 'CSEA',
  ELE: 'Elected / Appointed',
  MGT: 'Management / Confidential',
  MGM: 'Management / Confidential',
  HWY: 'Highway',
  TEM: 'Temporary / Seasonal',
}

export const payrollYears = summary.years
export const yearSummaries = summary.yearSummaries

export function mapRawRecords(raw: PayrollRecordRaw[]): PayrollRecord[] {
  return raw.map((r) => ({
    year: r.y, name: r.n, department: r.d, title: r.t, payClass: r.c, union: r.u,
    regular: r.r, overtime: r.o, gross: r.g,
  }))
}

export function yearSummary(year: number): YearSummary | undefined {
  return summary.yearSummaries.find((y) => y.year === year)
}

export function unionLabel(code: string): string {
  if (!code) return 'Unspecified'
  return unionLabels[code] ? `${code} — ${unionLabels[code]}` : code
}

// Town-wide totals across all available years.
export const payrollTotals = {
  years: summary.years,
  latestYear: summary.years[summary.years.length - 1],
}
