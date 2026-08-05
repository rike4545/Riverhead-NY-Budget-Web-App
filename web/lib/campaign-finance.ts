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
  photoUrl?: string | null
}

export type LatestYearSnapshot = {
  direct: number
  transfers: number
  filingAmount: number
  rowCount: number
  schedules: string
  lastReported: string | null
}

export type ContributorTypeAmount = { type: string; amount: number; donorCount: number }

export type YearBreakdown = {
  year: string
  raised: number
  donorCount: number
  avgDonationPerDonor: number | null
  typeBreakdown: ContributorTypeAmount[]
}

export type WatchContribution = {
  donorName: string
  amount: number
  date: string | null
  schedule: string | null
  contributorType: string | null
}

/** @deprecated Use WatchContribution — kept for back-compat with callers that imported the old name. */
export type PetroCelliContribution = WatchContribution

export type CampaignSnapshot = {
  raised: number
  directContributions: number
  transfersIn: number
  lastReported: string | null
  latestYear: LatestYearSnapshot | null
  /** Scoped to the current cycle (endYear) only — not the full multi-year window. */
  donorCount: number
  avgDonationPerDonor: number | null
  contributorTypeBreakdown: ContributorTypeAmount[]
  /** Loans received (schedule I), summed across the full window — safe to sum since each row is new money. */
  loanAmount: number | null
  /** Latest outstanding balance (schedule N) as of its most recent election_year — NOT a sum, since N re-reports a running balance every filing year. */
  outstandingLoanAmount: number | null
  outstandingLoanYear: string | null
  /** Direct contributions by election year, most recent first, excluding the current cycle. */
  historicalByYear: YearBreakdown[]
  /** Petrocelli project-interest donor rows matched across the full filing window. null = not yet fetched. */
  petrocelliContributions: WatchContribution[] | null
  /** Scott's Pointe / Island Water Park project-interest donor rows. null = not yet fetched. */
  scottPointeContributions: WatchContribution[] | null
  /** Candidate self-funding and known family-name contributions. null = not yet fetched. */
  candidateFamilyContributions: WatchContribution[] | null
}

// U.S. Census Bureau QuickFacts, Riverhead town, Suffolk County, NY — 2024 estimate. Used only to
// contextualize a committee's raised total as a "per resident" figure.
export const RIVERHEAD_POPULATION_ESTIMATE_2024 = 35980

// ---------------------------------------------------------------------------
// Project-interest and candidate-family watch logic
// Mirrors isPetrocelliContribution(), isScottPointeRelatedContribution(),
// and isCandidateOrFamilyFinancing() from CouncilScorecardView.swift.
// All matches are transparency context, not proof of coordination or quid pro quo.
// ---------------------------------------------------------------------------

const PETROCELLI_WATCHLIST = [
  'petrocelli',
  'hp east end riverhead',
  'jacqueline phillips',
  'alexandra bussi',
  'preston house',
  'atlantis banquets',
  'sea star ballroom',
  'taste the east end',
  'raphael vineyard',
  'long island aquarium',
  'hyatt place east end',
]

const SCOTT_POINTE_ENTITY_WATCHLIST = [
  "scott's pointe",
  'scotts pointe',
  'island water park',
  'island waterpark',
  'island water park corp',
  'island water sports',
  'lake view grill',
]

// Individual name matches for Scott's Pointe — [first, last] pairs
const SCOTT_POINTE_PEOPLE: [string, string][] = [
  ['eric', 'scott'],
  ['claudia', 'scott'],
  ['cody', 'scott'],
  ['jake', 'scott'],
  ['ken', 'myers'],
  ['grant', 'anderson'],
]

// Per-official candidate self-name and known family-name sets.
// Mirrors candidateSelfNames() and candidateFamilyNames() in the iOS app.
const CANDIDATE_SELF_NAMES: Record<string, string[]> = {
  'Honorable Jerome Halpin': ['jerome halpin', 'jerry halpin'],
  'Kenneth Rothwell': ['kenneth rothwell', 'kenneth t rothwell', 'ken rothwell'],
  'Joann Waski': ['joann waski'],
  'Robert "Bob" Kern': ['robert kern', 'bob kern'],
  'Denise Merrifield': ['denise merrifield', 'denise m merrifield', 'denise m. merrifield'],
}
const CANDIDATE_FAMILY_NAMES: Record<string, string[]> = {
  'Honorable Jerome Halpin': ['dennis halpin', 'chloe halpin', 'patrick halpin', 'kristen halpin'],
  'Kenneth Rothwell': ['werner rothwell', 'alexander rothwell'],
}

type ItemizedRow = {
  filer_id: string
  flng_ent_name?: string
  flng_ent_first_name?: string
  flng_ent_last_name?: string
  org_amt?: string
  sched_date?: string
  filing_sched_abbrev?: string
  cntrbr_type_desc?: string
}

function nameFields(row: ItemizedRow) {
  return [
    row.flng_ent_name ?? '',
    row.flng_ent_first_name ?? '',
    row.flng_ent_last_name ?? '',
    `${row.flng_ent_first_name ?? ''} ${row.flng_ent_last_name ?? ''}`,
  ].map((s) => s.toLowerCase().trim())
}

function isPetroCelliRow(row: ItemizedRow): boolean {
  const fields = nameFields(row)
  return PETROCELLI_WATCHLIST.some((term) => fields.some((f) => f.includes(term)))
}

function isScottPointeRow(row: ItemizedRow): boolean {
  const entity = (row.flng_ent_name ?? '').toLowerCase()
  if (SCOTT_POINTE_ENTITY_WATCHLIST.some((term) => entity.includes(term))) return true
  const first = (row.flng_ent_first_name ?? '').trim().toLowerCase()
  const last = (row.flng_ent_last_name ?? '').trim().toLowerCase()
  return SCOTT_POINTE_PEOPLE.some(([pf, pl]) => first === pf && last === pl)
}

function isCandidateFamilyRow(row: ItemizedRow, officialName: string): boolean {
  const type = (row.cntrbr_type_desc ?? '').toLowerCase()
  if (type === 'candidate/candidate spouse' || type === 'candidate family member') return true
  const fullName = nameFields(row).at(-1) ?? '' // "first last"
  const self = CANDIDATE_SELF_NAMES[officialName] ?? []
  const family = CANDIDATE_FAMILY_NAMES[officialName] ?? []
  return [...self, ...family].some((n) => fullName === n || nameFields(row).includes(n))
}

function donorDisplayName(row: ItemizedRow): string {
  const entity = (row.flng_ent_name ?? '').trim()
  if (entity) return entity
  const first = (row.flng_ent_first_name ?? '').trim()
  const last = (row.flng_ent_last_name ?? '').trim()
  if (first || last) return `${first} ${last}`.trim()
  return 'Unknown'
}

function toWatchContribution(row: ItemizedRow): WatchContribution {
  return {
    donorName: donorDisplayName(row),
    amount: parseFloat(row.org_amt ?? '0') || 0,
    date: row.sched_date ? row.sched_date.slice(0, 10) : null,
    schedule: row.filing_sched_abbrev ?? null,
    contributorType: row.cntrbr_type_desc ?? null,
  }
}

export type AllWatchResults = {
  petrocelli: Record<string, WatchContribution[]>
  scottPointe: Record<string, WatchContribution[]>
  candidateFamily: Record<string, WatchContribution[]>
}

/**
 * Fetches all itemized contribution rows for the given officials in a single
 * Socrata query, then runs each row through all three watch checks:
 *   - Petrocelli project-interest
 *   - Scott's Pointe / Island Water Park project-interest
 *   - Candidate self-funding and known family-name financing
 *
 * Returns results bucketed by official name for each watch type.
 */
export async function fetchAllWatchContributions(
  officials: CampaignOfficial[],
  startYear: number,
  endYear: number
): Promise<AllWatchResults> {
  const allFilerIDs = Array.from(new Set(officials.flatMap((o) => o.filerIDs.map((f) => f.filerID))))
  if (allFilerIDs.length === 0) {
    const empty = Object.fromEntries(officials.map((o) => [o.name, []]))
    return { petrocelli: empty, scottPointe: empty, candidateFamily: empty }
  }

  const inClause = allFilerIDs.map((id) => `'${id}'`).join(',')
  const years = Array.from({ length: endYear - startYear + 1 }, (_, i) => `'${startYear + i}'`).join(',')

  const url =
    `https://data.ny.gov/resource/4j2b-6a2j.json?` +
    new URLSearchParams({
      '$select': 'filer_id,flng_ent_name,flng_ent_first_name,flng_ent_last_name,org_amt,sched_date,filing_sched_abbrev,cntrbr_type_desc',
      '$where': `filer_id in (${inClause}) and election_year in(${years}) and filing_sched_abbrev in('A','B','C')`,
      '$limit': '5000',
      '$order': 'sched_date DESC',
    }).toString()

  const rows = (await fetchSocrataRows(url)) as unknown as ItemizedRow[]

  const filerToOfficial: Record<string, string> = {}
  for (const official of officials) {
    for (const ref of official.filerIDs) filerToOfficial[ref.filerID] = official.name
  }

  const petrocelli: Record<string, WatchContribution[]> = {}
  const scottPointe: Record<string, WatchContribution[]> = {}
  const candidateFamily: Record<string, WatchContribution[]> = {}
  for (const o of officials) {
    petrocelli[o.name] = []
    scottPointe[o.name] = []
    candidateFamily[o.name] = []
  }

  for (const row of rows) {
    const name = filerToOfficial[row.filer_id]
    if (!name) continue
    if (isPetroCelliRow(row)) petrocelli[name].push(toWatchContribution(row))
    if (isScottPointeRow(row)) scottPointe[name].push(toWatchContribution(row))
    if (isCandidateFamilyRow(row, name)) candidateFamily[name].push(toWatchContribution(row))
  }

  return { petrocelli, scottPointe, candidateFamily }
}

/** @deprecated Use fetchAllWatchContributions — kept for callers that imported the old name. */
export async function fetchPetroCelliContributions(
  officials: CampaignOfficial[],
  startYear: number,
  endYear: number
): Promise<Record<string, WatchContribution[]>> {
  const result = await fetchAllWatchContributions(officials, startYear, endYear)
  return result.petrocelli
}

function contributorTypeBucket(desc: string | null | undefined): string {
  const lower = (desc ?? '').toLowerCase()
  if (lower.includes('individual')) return 'Individual'
  if (lower.includes('committee') || lower.includes('party') || lower.includes('pac')) return 'PAC / Committee'
  return 'Business / Other'
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

const summaryUsd = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

/**
 * A deterministic, template-based summary of a candidate's fundraising -- not an
 * LLM-generated take. Every clause restates a number already shown elsewhere on the
 * card, so nothing here can say something the underlying data doesn't support.
 */
export function buildCandidateSummary(official: CampaignOfficial, snapshot: CampaignSnapshot, endYear: number): string {
  const shortName = official.name.replace('Honorable ', '')
  const cycleRaised = snapshot.contributorTypeBreakdown.reduce((sum, t) => sum + t.amount, 0)
  const donorCount = snapshot.donorCount

  let electionClause = ''
  const days = daysToElectionFor(official.nextElection)
  if (days != null) {
    if (days > 0) electionClause = `, with ${days} day${days === 1 ? '' : 's'} until the election`
    else if (days === 0) electionClause = ', with the election today'
  }

  const sentences: string[] = []
  if (donorCount > 0) {
    sentences.push(`${shortName} has raised ${summaryUsd(cycleRaised)} from ${donorCount} donor${donorCount === 1 ? '' : 's'} this cycle${electionClause}.`)
  } else {
    sentences.push(`${shortName} has no reported contributions for the ${endYear} cycle yet${electionClause}.`)
  }

  const dominant = snapshot.contributorTypeBreakdown.reduce(
    (max, t) => (!max || t.amount > max.amount ? t : max),
    null as ContributorTypeAmount | null
  )
  if (dominant && cycleRaised > 0) {
    const share = Math.floor((dominant.amount / cycleRaised) * 100)
    if (share >= 50) sentences.push(`${dominant.type} donors account for ${share}% of this cycle's fundraising.`)
  }

  if (snapshot.outstandingLoanAmount && snapshot.outstandingLoanAmount > 0) {
    const yearClause = snapshot.outstandingLoanYear ? ` as of the ${snapshot.outstandingLoanYear} filing.` : '.'
    sentences.push(`The campaign is carrying ${summaryUsd(snapshot.outstandingLoanAmount)} in outstanding loans${yearClause}`)
  } else if (snapshot.loanAmount && snapshot.loanAmount > 0) {
    sentences.push(`The campaign has taken loans totaling ${summaryUsd(snapshot.loanAmount)} over time, none currently outstanding.`)
  } else {
    sentences.push('No campaign loans on file.')
  }

  return sentences.join(' ')
}

function daysToElectionFor(nextElection: string | null): number | null {
  if (!nextElection) return null
  const ms = new Date(`${nextElection}T00:00:00`).getTime() - new Date(new Date().toDateString()).getTime()
  return Math.round(ms / (1000 * 60 * 60 * 24))
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

  // Full window here (not scoped to endYear) — grouped by election_year too, so both the
  // current-cycle breakdown AND the by-year historical breakdown can come from one query.
  const typeBreakdownURL =
    `https://data.ny.gov/resource/4j2b-6a2j.json?` +
    new URLSearchParams({
      '$select': 'filer_id,election_year,cntrbr_type_desc,sum(org_amt) as amount,count(*) as row_count',
      '$where': `filer_id in (${inClause}) and election_year in(${years}) and filing_sched_abbrev in('A','B','C')`,
      '$group': 'filer_id,election_year,cntrbr_type_desc',
    }).toString()

  // Schedule I = Loans Received (new money that period, safe to sum across years). Neither this
  // nor schedule N below exist in the itemized-contributions dataset (4j2b-6a2j) for these
  // filers — both must hit e9ss-239a, the per-filing aggregate dataset.
  const loanReceivedURL =
    `https://data.ny.gov/resource/e9ss-239a.json?` +
    new URLSearchParams({
      '$select': 'filer_id,sum(org_amt) as amount',
      '$where': `filer_id in (${inClause}) and election_year in(${years}) and filing_sched_abbrev='I'`,
      '$group': 'filer_id',
    }).toString()

  // Schedule N = Outstanding Liabilities/Loans, re-reported as a running balance every filing
  // year — summing across years double-counts, so only the highest election_year's value is
  // used client-side below (sched_date is unreliable here: NY BOE carries a loan's original
  // transaction date forward on every re-report, so it can't be used to find "most recent").
  const outstandingLoanURL =
    `https://data.ny.gov/resource/e9ss-239a.json?` +
    new URLSearchParams({
      '$select': 'filer_id,election_year,sum(org_amt) as amount',
      '$where': `filer_id in (${inClause}) and election_year in(${years}) and filing_sched_abbrev='N'`,
      '$group': 'filer_id,election_year',
    }).toString()

  const [raisedRows, latestYearRows, typeBreakdownRows, loanReceivedRows, outstandingLoanRows] = await Promise.all([
    fetchSocrataRows(raisedURL),
    fetchSocrataRows(latestYearURL),
    fetchSocrataRows(typeBreakdownURL) as unknown as Promise<
      { filer_id: string; election_year?: string; cntrbr_type_desc?: string; amount?: string; row_count?: string }[]
    >,
    fetchSocrataRows(loanReceivedURL) as unknown as Promise<{ filer_id: string; amount?: string }[]>,
    fetchSocrataRows(outstandingLoanURL) as unknown as Promise<{ filer_id: string; election_year?: string; amount?: string }[]>,
  ])

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

  const typeRowsByFiler: Record<string, { election_year?: string; cntrbr_type_desc?: string; amount?: string; row_count?: string }[]> = {}
  for (const row of typeBreakdownRows) {
    typeRowsByFiler[row.filer_id] = [...(typeRowsByFiler[row.filer_id] ?? []), row]
  }

  function buildTypeBreakdown(
    rows: { cntrbr_type_desc?: string; amount?: string; row_count?: string }[]
  ): ContributorTypeAmount[] {
    const typeTotals = new Map<string, { amount: number; donorCount: number }>()
    for (const row of rows) {
      const bucket = contributorTypeBucket(row.cntrbr_type_desc)
      const existing = typeTotals.get(bucket) ?? { amount: 0, donorCount: 0 }
      existing.amount += parseFloat(row.amount ?? '0') || 0
      existing.donorCount += parseInt(row.row_count ?? '0', 10) || 0
      typeTotals.set(bucket, existing)
    }
    return Array.from(typeTotals.entries())
      .map(([type, { amount, donorCount }]) => ({ type, amount, donorCount }))
      .sort((a, b) => b.amount - a.amount)
  }

  const loanReceivedByFiler: Record<string, number> = {}
  for (const row of loanReceivedRows) {
    loanReceivedByFiler[row.filer_id] = parseFloat(row.amount ?? '0') || 0
  }

  // Keep only the highest election_year per filer.
  const outstandingByFiler: Record<string, { amount: number; year: string }> = {}
  for (const row of outstandingLoanRows) {
    const year = row.election_year ?? ''
    const existing = outstandingByFiler[row.filer_id]
    if (!existing || year > existing.year) {
      outstandingByFiler[row.filer_id] = { amount: parseFloat(row.amount ?? '0') || 0, year }
    }
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

    const allTypeRows = ids.flatMap((id) => typeRowsByFiler[id] ?? [])
    const currentCycleRows = allTypeRows.filter((r) => r.election_year === `${endYear}`)
    const contributorTypeBreakdown = buildTypeBreakdown(currentCycleRows)
    const donorCount = contributorTypeBreakdown.reduce((sum, t) => sum + t.donorCount, 0)
    const currentCycleRaised = contributorTypeBreakdown.reduce((sum, t) => sum + t.amount, 0)

    const rowsByYear = new Map<string, typeof allTypeRows>()
    for (const row of allTypeRows) {
      if (row.election_year === `${endYear}`) continue
      const year = row.election_year ?? 'Unknown'
      rowsByYear.set(year, [...(rowsByYear.get(year) ?? []), row])
    }
    const historicalByYear: YearBreakdown[] = Array.from(rowsByYear.entries())
      .map(([year, rows]) => {
        const typeBreakdown = buildTypeBreakdown(rows)
        const yearRaised = typeBreakdown.reduce((sum, t) => sum + t.amount, 0)
        const yearDonorCount = typeBreakdown.reduce((sum, t) => sum + t.donorCount, 0)
        return {
          year,
          raised: yearRaised,
          donorCount: yearDonorCount,
          avgDonationPerDonor: yearDonorCount > 0 ? yearRaised / yearDonorCount : null,
          typeBreakdown,
        }
      })
      .sort((a, b) => b.year.localeCompare(a.year))

    const loanReceived = ids.reduce((sum, id) => sum + (loanReceivedByFiler[id] ?? 0), 0)
    const outstanding = ids
      .map((id) => outstandingByFiler[id])
      .filter((o): o is { amount: number; year: string } => !!o)
      .sort((a, b) => b.year.localeCompare(a.year))[0] ?? null

    result[official.name] = {
      raised: direct + transfers,
      directContributions: direct,
      transfersIn: transfers,
      lastReported,
      latestYear,
      donorCount,
      avgDonationPerDonor: donorCount > 0 ? currentCycleRaised / donorCount : null,
      contributorTypeBreakdown,
      loanAmount: loanReceived > 0 ? loanReceived : null,
      outstandingLoanAmount: outstanding && outstanding.amount > 0 ? outstanding.amount : null,
      outstandingLoanYear: outstanding?.year ?? null,
      historicalByYear,
      petrocelliContributions: null,       // populated by fetchAllWatchContributions after the main fetch
      scottPointeContributions: null,
      candidateFamilyContributions: null,
    }
  }

  return result
}

// Riverhead Town-race contribution limits under NY Election Law § 14-114, computed by
// the Business Council of NYS from the registered-voter-count formula (most donors:
// registered voters x $0.05, minimum $1,000; family donors: the greater of registered
// voters x $0.25 or $1,250). Published August 2022, so it reflects that cycle's
// registered-voter count, not necessarily the current one — voter rolls (and therefore
// these dollar caps) shift over time, so treat this as a concrete recent reference point
// rather than this exact cycle's number. Confirm the current figure with the Suffolk
// County Board of Elections' own Comprehensive Limits Report before relying on it.
export const riverheadContributionLimits = {
  asOfYear: 2022,
  source: 'Business Council of New York State, "NYS Campaign Contribution Limits"',
  general: { individual: 1109.3, family: 5546.5 },
  democraticPrimary: { individual: 1000, family: 1538 },
  republicanPrimary: { individual: 1000, family: 2000.75 },
}
