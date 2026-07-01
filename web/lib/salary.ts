// 2025 Board-authorized salary schedule (from the Jan 7, 2025 salary
// resolutions), enriched with each employee's most recent ACTUAL pay so
// authorized-vs-actual can be shown directly. Built by
// etl/parse_salary_schedule.py.

import salaryJson from '../public/data/salary/authorized-2025.json'

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
