// Cross-references Town payroll employees against individual campaign donors to the
// officials tracked on the Campaign Finance page. This is disclosure context, not an
// accusation — modest personal donations from Town employees to sitting or former
// officials are common and legal. Matching is by (last name, first name) only, normalized
// and case-insensitive; it does not use middle names/initials, so a shared first+last name
// with a different person is possible and not verified beyond the name match itself.
import { PAYROLL_RECORDS_URL, mapRawRecords, type PayrollRecordRaw } from './payroll'
import type { CampaignOfficial } from './campaign-finance'

export type EmployeeDonorMatch = {
  employeeName: string
  department: string | null
  title: string | null
  mostRecentPayrollYear: number
  officialName: string
  committeeName: string
  electionYear: string
  filingDesc: string
  amount: number
  date: string | null
}

type ContributionRow = {
  filer_id: string
  election_year?: string
  filing_desc?: string
  flng_ent_first_name?: string
  flng_ent_last_name?: string
  org_amt?: string
  sched_date?: string
  cntrbr_type_desc?: string
}

// A council member draws a Town salary too, so without this a candidate donating to their
// own committee would show up as a "town employee donor" — trivially true and not a
// meaningful finding. Excludes those self-donations from the results.
const SELF_NAME_KEYS: Record<string, string[]> = {
  'Honorable Jerome Halpin': ['halpin|jerome', 'halpin|jerry'],
  'Kenneth Rothwell': ['rothwell|kenneth', 'rothwell|ken'],
  'Robert "Bob" Kern': ['kern|robert', 'kern|bob'],
  'Joann Waski': ['waski|joann'],
  'Denise Merrifield': ['merrifield|denise'],
  'Tim Hubbard': ['hubbard|tim', 'hubbard|timothy'],
  'Jodi Giglio': ['giglio|jodi'],
  'Yvette Aguiar': ['aguiar|yvette'],
}

function nameKey(last: string | undefined, first: string | undefined): string | null {
  const l = (last ?? '').trim().toLowerCase()
  const f = (first ?? '').trim().toLowerCase().split(/\s+/)[0]
  if (!l || !f) return null
  return `${l}|${f}`
}

// Payroll names are "Last, First Middle" — split on the first comma.
function payrollNameKey(name: string): string | null {
  const commaIndex = name.indexOf(',')
  if (commaIndex < 0) return null
  const last = name.slice(0, commaIndex)
  const first = name.slice(commaIndex + 1).trim().split(/\s+/)[0]
  return nameKey(last, first)
}

async function fetchIndividualContributions(filerIDs: string[], startYear: number, endYear: number): Promise<ContributionRow[]> {
  if (filerIDs.length === 0) return []
  const inClause = filerIDs.map((id) => `'${id}'`).join(',')
  const years = Array.from({ length: endYear - startYear + 1 }, (_, i) => `'${startYear + i}'`).join(',')
  const url =
    `https://data.ny.gov/resource/4j2b-6a2j.json?` +
    new URLSearchParams({
      '$select': 'filer_id,election_year,filing_desc,flng_ent_first_name,flng_ent_last_name,org_amt,sched_date,cntrbr_type_desc',
      '$where': `filer_id in (${inClause}) and election_year in(${years}) and filing_sched_abbrev in('A','B','C') and cntrbr_type_desc='Individual'`,
      '$limit': '5000',
    }).toString()
  const response = await fetch(url)
  if (!response.ok) throw new Error(`NY Open Data request failed: ${response.status}`)
  return response.json()
}

export async function fetchEmployeeDonorMatches(
  officials: CampaignOfficial[],
  startYear: number,
  endYear: number
): Promise<EmployeeDonorMatch[]> {
  const filerIDs = Array.from(new Set(officials.flatMap((o) => o.filerIDs.map((f) => f.filerID))))
  const committeeNameByFiler: Record<string, { committeeName: string; officialName: string }> = {}
  for (const official of officials) {
    for (const ref of official.filerIDs) committeeNameByFiler[ref.filerID] = { committeeName: ref.committeeName, officialName: official.name }
  }

  const [payrollResponse, contributions] = await Promise.all([
    fetch(PAYROLL_RECORDS_URL).then((r) => (r.ok ? r.json() : Promise.reject(new Error(`Payroll data request failed: ${r.status}`)))),
    fetchIndividualContributions(filerIDs, startYear, endYear),
  ])

  const payrollRecords = mapRawRecords((payrollResponse.records ?? []) as PayrollRecordRaw[])

  // One entry per distinct employee, keeping the most recent year's department/title.
  const employeeByKey = new Map<string, { name: string; department: string | null; title: string | null; year: number }>()
  for (const rec of payrollRecords) {
    const key = payrollNameKey(rec.name)
    if (!key) continue
    const existing = employeeByKey.get(key)
    if (!existing || rec.year > existing.year) {
      employeeByKey.set(key, { name: rec.name, department: rec.department || null, title: rec.title || null, year: rec.year })
    }
  }

  const matches: EmployeeDonorMatch[] = []
  for (const row of contributions) {
    const key = nameKey(row.flng_ent_last_name, row.flng_ent_first_name)
    if (!key) continue
    const employee = employeeByKey.get(key)
    if (!employee) continue
    const committee = committeeNameByFiler[row.filer_id]
    if (!committee) continue
    if ((SELF_NAME_KEYS[committee.officialName] ?? []).includes(key)) continue
    matches.push({
      employeeName: employee.name,
      department: employee.department,
      title: employee.title,
      mostRecentPayrollYear: employee.year,
      officialName: committee.officialName,
      committeeName: committee.committeeName,
      electionYear: row.election_year ?? '',
      filingDesc: row.filing_desc ?? 'Unlabeled filing',
      amount: parseFloat(row.org_amt ?? '0') || 0,
      date: row.sched_date ?? null,
    })
  }

  matches.sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''))
  return matches
}
