// 2025 Board-authorized salary schedule (from the Jan 7, 2025 salary
// resolutions), enriched with each employee's most recent ACTUAL pay so
// authorized-vs-actual can be shown directly. Built by
// etl/parse_salary_schedule.py.

import salaryJson from '../public/data/salary/authorized-2025.json'
import comparisonJson from '../public/data/salary/comparison-2025-2026.json'

export type SalaryRecord = {
  name: string
  grade: string
  title: string
  department: string
  group: string
  resolution: string | null
  annual: number
  hourly: number | null
  isStipend: boolean
  actualYear?: number
  actualRegular?: number
  actualOvertime?: number
  actualGross?: number
}

export type GroupRollup = { group: string; headcount: number; authorized: number }

export type AuthorizedSalary = {
  source: { title: string; url: string }
  year: number
  note: string
  count: number
  totalAuthorized: number
  byGroup: GroupRollup[]
  records: SalaryRecord[]
}

export const authorizedSalary = salaryJson as AuthorizedSalary

export const salaryActualYear =
  authorizedSalary.records.find((r) => r.actualYear)?.actualYear ?? null

export const salaryMatchedCount =
  authorizedSalary.records.filter((r) => r.actualGross != null).length

// ---- 2025 -> 2026 raise comparison ----

export type RaiseRecord = {
  name: string
  title2026: string
  title2025: string | null
  department: string
  group: string
  annual2026: number
  annual2025: number | null
  raise?: number
  raisePct?: number | null
  promoted?: boolean
  comparable: boolean
}

export type RaiseSummary = {
  count2026: number
  matched: number
  raised: number
  promotions: number
  totalRaise: number
  avgRaise: number
  medianRaisePct: number | null
  topRaises: {
    name: string; title2026: string; annual2025: number; annual2026: number
    raise: number; raisePct: number | null; promoted: boolean
  }[]
}

export type SalaryComparison = {
  source: { title: string; url: string }
  note: string
  summary: RaiseSummary
  records: RaiseRecord[]
}

export const salaryComparison = comparisonJson as SalaryComparison
