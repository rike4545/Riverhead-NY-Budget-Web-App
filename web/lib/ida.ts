// The Riverhead Industrial Development Agency (IDA) for /ida/.
//
// Projects, tax breaks, PILOTs and jobs come from the State Authorities Budget
// Office's "Industrial Development Agencies' Project Data" (data.ny.gov,
// 9rtk-3fkw), built into public/data/ida.json by etl/build_ida.py. The agency's
// own income comes from its audited financial statements, quoted in
// etl/data/ida/audited-financial-statements-2024-excerpt.txt.
// scripts/verify-ida.mjs checks the sums and every quoted figure.
//
// No imports, so the verify script can load this file directly.

export type ExemptionKey = 'stateSales' | 'localSales' | 'countyProperty' | 'localProperty' | 'schoolProperty' | 'mortgageRecording'

export type IdaYear = {
  year: number
  projects: number
  projectsWithBreaks: number
  stateSales: number; localSales: number; countyProperty: number; localProperty: number; schoolProperty: number; mortgageRecording: number
  pilot_county: number; pilot_local: number; pilot_school: number
  exemptions: number; pilots: number; pilotsDue: number; net: number
  ftesWithBreaks: number; ftesBeforeWithBreaks: number
}

export type IdaProject = {
  code: string; name: string; applicant: string; type: string; purpose: string; address: string
  approved: string; plannedEnd: number | null; firstYear: number; lastYear: number
  projectAmount: number; bondAmount: number
  exemptions: number; pilots: number; net: number
  byType: Record<ExemptionKey, number>
  jobsBefore: number; jobsPromised: number; jobsRetainedPromised: number; jobsLatest: number
  avgSalaryPromised: number | null
  years: Record<string, { exemptions: number; pilots: number; net: number; jobs: number }>
}

export type IdaData = { source: { title: string; url: string; dataset: string; rowsUpdatedAt: number | null; note: string }; agency: string; reports: number; years: IdaYear[]; projects: IdaProject[] }

export const EXEMPTION_LABELS: Record<ExemptionKey, string> = {
  schoolProperty: 'School property tax',
  localProperty: 'Town property tax',
  countyProperty: 'County property tax',
  localSales: 'Local sales tax',
  stateSales: 'State sales tax',
  mortgageRecording: 'Mortgage recording tax',
}

/** A project with no tax break was only a bond the IDA issued for it (the hospital, for one): it cost no taxes, so its jobs are not counted against the breaks. */
export const hadBreaks = (p: IdaProject) => p.exemptions > 0

export function totals(d: IdaData) {
  const sum = (k: keyof IdaYear) => d.years.reduce((s, y) => s + (y[k] as number), 0)
  const byType = Object.fromEntries((Object.keys(EXEMPTION_LABELS) as ExemptionKey[]).map((k) => [k, sum(k)])) as Record<ExemptionKey, number>
  const withBreaks = d.projects.filter(hadBreaks)
  const jobsBefore = withBreaks.reduce((s, p) => s + p.jobsBefore, 0)
  const jobsLatest = withBreaks.reduce((s, p) => s + p.jobsLatest, 0)
  const jobsPromised = withBreaks.reduce((s, p) => s + p.jobsPromised, 0)
  const metPromise = withBreaks.filter((p) => p.jobsLatest - p.jobsBefore >= p.jobsPromised)
  return {
    firstYear: d.years[0].year,
    lastYear: d.years[d.years.length - 1].year,
    exemptions: sum('exemptions'),
    pilots: sum('pilots'),
    net: sum('net'),
    byType,
    pilotBy: { school: sum('pilot_school'), local: sum('pilot_local'), county: sum('pilot_county') },
    projects: d.projects.length,
    withBreaks: withBreaks.length,
    bondOnly: d.projects.length - withBreaks.length,
    jobsBefore, jobsLatest, jobsPromised,
    metPromise: metPromise.length,
  }
}

/** The latest year: what one year of the program cost and what its active projects reported. */
export function latestYear(d: IdaData) {
  const y = d.years[d.years.length - 1]
  const gain = y.ftesWithBreaks - y.ftesBeforeWithBreaks
  return { ...y, jobGain: gain, netPerJob: gain > 0 ? y.net / gain : null }
}

/**
 * The agency's own income and spending, from its audited financial statements
 * for 2024 (which also give 2023 and 2022). Each quote is a line of the excerpt.
 */
export const IDA_FINANCES = {
  source: {
    title: 'Riverhead IDA, Audited Financial Statements, December 31, 2024 and 2023',
    url: 'https://riverheadida.org/sitehold/PDFs/IDA/Financial%20Audit/IDA-Audited_Financial_Statements-2024.pdf',
  },
  years: [
    { year: 2022, revenue: 179555, expenses: 211910 },
    { year: 2023, revenue: 506218, expenses: 256979 },
    { year: 2024, revenue: 301431, expenses: 258393 },
  ],
  quotes: {
    revenue: 'Total operating revenue                        $   301,431    (204,787)   506,218   326,663     179,555',
    expenses: 'Total operating expenses                           258,393       1,414    256,979    45,069     211,910',
    revenue2024: 'The Agency had operating revenue of $301,431 for 2024. This includes $251,489 for a project that',
    transfer: 'authorized transfer of $135,875 from the Riverhead IDA Economic Job Development Corporation',
    payroll: 'Payroll                                                      173,748       153,097',
  },
}

/** The State's December 2024 review of the agency's website, as RiverheadLOCAL reported it (the review letter's address on the State's site no longer resolves). */
export const ABO_REVIEW = {
  title: 'RiverheadLOCAL, January 9, 2025: “State agency reviews Riverhead IDA’s website, finds deficiencies in compliance with laws”',
  url: 'https://riverheadlocal.com/2025/01/09/state-agency-reviews-riverhead-idas-website-finds-deficiencies-in-compliance-with-laws/',
  finding: 'The Riverhead Industrial Development Agency’s website does not meet the requirements of the State Public Authorities Law',
  meetings: 'The Riverhead IDA also has not complied with the State Open Meetings Law for committee meetings held by video conferencing',
  response: 'Almost all those corrective actions have been taken,',
}
