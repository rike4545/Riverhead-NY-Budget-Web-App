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
  k?: number[]   // [longevity, holiday, stipend, buyout, retro] breakdown of "other"
}

export type PayComponent = { key: string; label: string; amount: number }

export type PayrollRecord = {
  year: number
  name: string
  department: string
  title: string
  payClass: string
  union: string
  regular: number
  overtime: number
  other: number   // gross - regular - overtime: longevity, stipends, retro, buy-outs, etc.
  gross: number
  // Additive breakdown that sums EXACTLY to gross (misc absorbs the remainder).
  components: PayComponent[]
}

const COMPONENT_LABELS: [string, string][] = [
  ['longevity', 'Longevity'],
  ['holiday', 'Holiday & shift differential'],
  ['stipend', 'Stipends & allowances'],
  ['buyout', 'Leave & termination buy-outs'],
  ['retro', 'Retroactive pay'],
]

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

const r2 = (n: number) => Math.round(n * 100) / 100

export function mapRawRecords(raw: PayrollRecordRaw[]): PayrollRecord[] {
  return raw.map((r) => {
    // The residual after base pay and overtime — everything else in the gross.
    const other = r2(r.g - r.r - r.o)
    const k = r.k ?? []
    const named = k.reduce((s, v) => s + (v || 0), 0)
    const misc = r2(other - named)
    // Build the additive component list that sums EXACTLY to gross.
    const components: PayComponent[] = [
      { key: 'regular', label: 'Regular (base pay)', amount: r.r },
      { key: 'overtime', label: 'Overtime', amount: r.o },
    ]
    COMPONENT_LABELS.forEach(([key, label], i) => {
      if (k[i]) components.push({ key, label, amount: r2(k[i]) })
    })
    if (Math.abs(misc) >= 1) components.push({ key: 'misc', label: 'Other pay & adjustments', amount: misc })
    return {
      year: r.y, name: r.n, department: r.d, title: r.t, payClass: r.c, union: r.u,
      regular: r.r, overtime: r.o, gross: r.g, other, components,
    }
  })
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
