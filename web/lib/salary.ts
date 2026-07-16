// Board-authorized salary schedules (2025 & 2026) and the raise comparison
// between them, built by etl/parse_salary_schedule.py and parse_salary_2026.py.
//
// These datasets (~380KB combined) are fetched in the browser on demand rather
// than bundled — see the URL constants below and components/useFetchJson.ts.

const base = '/Riverhead-NY-Budget-Web-App'

export function authorizedSalaryUrl(year: 2025 | 2026): string {
  return `${base}/data/salary/authorized-${year}.json`
}

export const SALARY_COMPARISON_URL = `${base}/data/salary/comparison-2025-2026.json`

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

export function actualYearFor(data: AuthorizedSalary): number | null {
  return data.records.find((r) => r.actualYear)?.actualYear ?? null
}

export function matchedCountFor(data: AuthorizedSalary): number {
  return data.records.filter((r) => r.actualGross != null).length
}

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
