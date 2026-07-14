// Live campaign-finance fetch from NY State's open data (data.ny.gov), mirroring
// the same Socrata queries used by the iOS app's Council Scorecard. Runs client-side
// since this is a statically-exported site with no server at runtime.

export type CampaignFilerRef = { committeeName: string; filerID: string }

export type CampaignOfficial = {
  name: string
  office: string
  termStarts: string | null
  termEnds: string | null
  nextElection: string | null
  currentlyServing: boolean
  committeeName: string
  filerIDs: CampaignFilerRef[]
  note: string
  seedRaised: number | null
  seedDirectContributions: number | null
  seedTransfersIn: number | null
  seedLastReported: string | null
}

export type LatestYearSnapshot = {
  direct: number
  transfers: number
  filingAmount: number
  rowCount: number
  schedules: string
  lastReported: string | null
}

export type CampaignSnapshot = {
  raised: number
  directContributions: number
  transfersIn: number
  lastReported: string | null
  latestYear: LatestYearSnapshot | null
}

type SocrataAggRow = {
  filer_id: string
  election_year?: string
  filing_sched_abbrev?: string
  amount?: string
  last_reported?: string
  row_count?: string
}

// A single filing SUBMISSION (e.g. "January Periodic, Original, Itemized, State/Local") as
// opposed to an individual itemized transaction within it. The bulk Socrata data has no
// "date filed" timestamp — only sched_date per transaction, which for recurring liabilities
// (an outstanding loan re-reported every period) can carry a stale original date. We use
// max(sched_date) as "latest reported activity," not a claimed filing date.
export type FilingEvent = {
  filerID: string
  committeeName: string
  electionYear: string
  filingDesc: string
  isAmendment: boolean
  category: string
  electionType: string
  amount: number
  transactionCount: number
  lastActivity: string | null
}

type SocrataFilingRow = {
  filer_id: string
  election_year: string
  filing_desc?: string
  r_amend?: string
  filing_cat_desc?: string
  election_type?: string
  amount?: string
  row_count?: string
  last_activity?: string
}

export async function fetchFilingHistory(
  officials: CampaignOfficial[],
  startYear: number,
  endYear: number
): Promise<Record<string, FilingEvent[]>> {
  const allFilerIDs = Array.from(new Set(officials.flatMap((o) => o.filerIDs.map((f) => f.filerID))))
  if (allFilerIDs.length === 0) return {}
  const inClause = allFilerIDs.map((id) => `'${id}'`).join(',')
  const years = yearsClause(startYear, endYear)

  const url =
    `https://data.ny.gov/resource/e9ss-239a.json?` +
    new URLSearchParams({
      '$select':
        'filer_id,election_year,filing_desc,r_amend,filing_cat_desc,election_type,sum(org_amt) as amount,count(*) as row_count,max(sched_date) as last_activity',
      '$where': `filer_id in (${inClause}) and election_year in(${years})`,
      '$group': 'filer_id,election_year,filing_desc,r_amend,filing_cat_desc,election_type',
      '$order': 'election_year DESC, last_activity DESC',
      '$limit': '2000',
    }).toString()

  const rows = (await fetchSocrataRows(url)) as unknown as SocrataFilingRow[]

  const committeeNameByFiler: Record<string, string> = {}
  for (const official of officials) {
    for (const ref of official.filerIDs) committeeNameByFiler[ref.filerID] = ref.committeeName
  }

  const result: Record<string, FilingEvent[]> = {}
  for (const official of officials) {
    const ids = new Set(official.filerIDs.map((f) => f.filerID))
    result[official.name] = rows
      .filter((r) => ids.has(r.filer_id))
      .map((r) => ({
        filerID: r.filer_id,
        committeeName: committeeNameByFiler[r.filer_id] ?? r.filer_id,
        electionYear: r.election_year,
        filingDesc: r.filing_desc ?? 'Unlabeled filing',
        isAmendment: (r.r_amend ?? '').toUpperCase() === 'Y',
        category: r.filing_cat_desc ?? '—',
        electionType: r.election_type ?? '—',
        amount: parseFloat(r.amount ?? '0') || 0,
        transactionCount: parseInt(r.row_count ?? '0', 10) || 0,
        lastActivity: r.last_activity ?? null,
      }))
  }
  return result
}

// NY State Board of Elections 2026 filing calendar (State/Local candidates), source:
// https://elections.ny.gov/system/files/documents/2025/12/2026-filing-calendar-12112025-approved.secure.accessible.pdf
export type FilingDeadline = { label: string; date: string; periodNote: string }

export const nyFilingDeadlines2026: FilingDeadline[] = [
  { label: 'July Periodic Report', date: '2026-07-15', periodNote: 'activity Jan 12 – Jul 11' },
  { label: '32-Day Pre-General Report', date: '2026-10-02', periodNote: 'period ends Sep 28' },
  { label: '11-Day Pre-General Report', date: '2026-10-23', periodNote: 'period ends Oct 19' },
  { label: 'General Election Day', date: '2026-11-03', periodNote: 'Election Day, not a filing deadline' },
  { label: '27-Day Post-General Report', date: '2026-11-30', periodNote: 'period ends Nov 26' },
]

export function nextFilingDeadline(from: Date = new Date()): FilingDeadline | null {
  const upcoming = nyFilingDeadlines2026
    .filter((d) => new Date(`${d.date}T23:59:59`) >= from)
    .sort((a, b) => a.date.localeCompare(b.date))
  return upcoming[0] ?? null
}

function yearsClause(startYear: number, endYear: number): string {
  const years: string[] = []
  for (let y = startYear; y <= endYear; y++) years.push(`'${y}'`)
  return years.join(',')
}

async function fetchSocrataRows(url: string): Promise<SocrataAggRow[]> {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`NY Open Data request failed: ${response.status}`)
  return response.json()
}

export async function fetchCampaignSnapshots(
  officials: CampaignOfficial[],
  startYear: number,
  endYear: number
): Promise<Record<string, CampaignSnapshot>> {
  const allFilerIDs = Array.from(new Set(officials.flatMap((o) => o.filerIDs.map((f) => f.filerID))))
  if (allFilerIDs.length === 0) return {}
  const inClause = allFilerIDs.map((id) => `'${id}'`).join(',')
  const years = yearsClause(startYear, endYear)

  const raisedURL =
    `https://data.ny.gov/resource/4j2b-6a2j.json?` +
    new URLSearchParams({
      '$select': 'filer_id,filing_sched_abbrev,sum(org_amt) as amount,max(sched_date) as last_reported',
      '$where': `filer_id in (${inClause}) and election_year in(${years}) and filing_sched_abbrev in('A','B','C','G')`,
      '$group': 'filer_id,filing_sched_abbrev',
    }).toString()

  const latestYearURL =
    `https://data.ny.gov/resource/e9ss-239a.json?` +
    new URLSearchParams({
      '$select':
        'filer_id,election_year,filing_sched_abbrev,sum(org_amt) as amount,max(sched_date) as last_reported,count(*) as row_count',
      '$where': `filer_id in (${inClause}) and election_year in(${years})`,
      '$group': 'filer_id,election_year,filing_sched_abbrev',
    }).toString()

  const [raisedRows, latestYearRows] = await Promise.all([fetchSocrataRows(raisedURL), fetchSocrataRows(latestYearURL)])

  const directByFiler: Record<string, number> = {}
  const transfersByFiler: Record<string, number> = {}
  const lastReportedByFiler: Record<string, string> = {}

  for (const row of raisedRows) {
    const amount = parseFloat(row.amount ?? '0') || 0
    const schedule = (row.filing_sched_abbrev ?? '').toUpperCase()
    if (['A', 'B', 'C'].includes(schedule)) {
      directByFiler[row.filer_id] = (directByFiler[row.filer_id] ?? 0) + amount
    } else if (schedule === 'G') {
      transfersByFiler[row.filer_id] = (transfersByFiler[row.filer_id] ?? 0) + amount
    }
    if (row.last_reported && (!lastReportedByFiler[row.filer_id] || row.last_reported > lastReportedByFiler[row.filer_id])) {
      lastReportedByFiler[row.filer_id] = row.last_reported
    }
  }

  const latestYearRowsByFiler: Record<string, SocrataAggRow[]> = {}
  for (const row of latestYearRows) {
    if (row.election_year !== `${endYear}`) continue
    latestYearRowsByFiler[row.filer_id] = [...(latestYearRowsByFiler[row.filer_id] ?? []), row]
  }

  const result: Record<string, CampaignSnapshot> = {}
  for (const official of officials) {
    const ids = official.filerIDs.map((f) => f.filerID)
    const direct = ids.reduce((sum, id) => sum + (directByFiler[id] ?? 0), 0)
    const transfers = ids.reduce((sum, id) => sum + (transfersByFiler[id] ?? 0), 0)
    const lastReported = ids.map((id) => lastReportedByFiler[id]).filter(Boolean).sort().at(-1) ?? null

    const latestRows = ids.flatMap((id) => latestYearRowsByFiler[id] ?? [])
    let latestYear: LatestYearSnapshot | null = null
    if (latestRows.length > 0) {
      const direct2 = latestRows.reduce(
        (sum, r) => (['A', 'B', 'C'].includes((r.filing_sched_abbrev ?? '').toUpperCase()) ? sum + (parseFloat(r.amount ?? '0') || 0) : sum),
        0
      )
      const transfers2 = latestRows.reduce(
        (sum, r) => ((r.filing_sched_abbrev ?? '').toUpperCase() === 'G' ? sum + (parseFloat(r.amount ?? '0') || 0) : sum),
        0
      )
      const filingAmount = latestRows.reduce((sum, r) => sum + (parseFloat(r.amount ?? '0') || 0), 0)
      const rowCount = latestRows.reduce((sum, r) => sum + (parseInt(r.row_count ?? '0', 10) || 0), 0)
      const schedules = Array.from(new Set(latestRows.map((r) => (r.filing_sched_abbrev ?? '').toUpperCase()).filter(Boolean))).sort().join(', ')
      const latestReportedDate = latestRows.map((r) => r.last_reported).filter(Boolean).sort().at(-1) ?? null
      latestYear = { direct: direct2, transfers: transfers2, filingAmount, rowCount, schedules, lastReported: latestReportedDate }
    }

    result[official.name] = { raised: direct + transfers, directContributions: direct, transfersIn: transfers, lastReported, latestYear }
  }

  return result
}
