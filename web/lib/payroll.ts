// SeeThroughNY-style payroll dataset built by etl/parse_payroll.py from the
// Town of Riverhead Gross Earnings reports (actual paid earnings incl. overtime).

import recordsJson from '../public/data/payroll/records.json'
import summaryJson from '../public/data/payroll/summary.json'

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

const raw = recordsJson as { unionLabels: Record<string, string>; records: PayrollRecordRaw[]; source: { title: string; url: string }; note: string }
const summary = summaryJson as { years: number[]; yearSummaries: YearSummary[] }

export const payrollSource = raw.source
export const payrollNote = raw.note
export const unionLabels = raw.unionLabels
export const payrollYears = summary.years
export const yearSummaries = summary.yearSummaries

export const payrollRecords: PayrollRecord[] = raw.records.map((r) => ({
  year: r.y, name: r.n, department: r.d, title: r.t, payClass: r.c, union: r.u,
  regular: r.r, overtime: r.o, gross: r.g,
}))

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
  records: payrollRecords.length,
  latestYear: summary.years[summary.years.length - 1],
}
