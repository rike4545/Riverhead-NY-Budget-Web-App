// The budget changes the Town Board has passed in one year, for
// /budget-changes/ and for /data/budget-changes.json, which the page re-reads
// while it is open.
//
// The year is COMMITMENT_YEAR, the year of the adopted budget the page compares
// against and of the draws Where the Surplus Went counts. A meeting held after
// it changes the next year's budgets, so it is counted apart and never added.
//
// Every adopted resolution in each meeting's fiscal companion (parsed by
// etl/parse_fiscal_impact.py from the agenda packets) is tested with
// lib/budget-change-rules.ts, which says when the Town itself marks a
// resolution as a budget change and how its account table reads.
//
// Money taken from savings is not read again here. It comes from
// lib/fund-balance-draws.ts, which reads each draw from the budget table the
// Board adopted where that differs from section G (2026-765: $280,000, not the
// $150,000 section G names), so this page and /fund-balance-draws/ always
// state the same figure. The other sources are totalled only for resolutions
// whose tables read plainly; the rest are listed with their own lines.

import fiscalIndex from '../public/data/meetings/fiscal-index.json'
import meta from '../public/data/meta.json'
import budgetStages from '../public/data/history/budget-stages.json'
import { documentedDraws, otherFundDraws, otherTierGeneralFundDraws } from './fund-balance-draws'
import { COMMITMENT_YEAR } from './fiscal-commitments-2027'
import {
  NEW_MONEY, SOURCE_LABELS, budgetChangeReason, readTable,
  type ChangeAccount, type Line, type Reason, type Source,
} from './budget-change-rules'

export { NEW_MONEY, SOURCE_LABELS }
export type { Source }

type FiscalRes = {
  number: string | null
  seq: number
  title: string
  category: string
  amount: number | null
  vote?: { adopted?: boolean | null; tag?: string | null; ayes?: number | null; nays?: number | null } | null
  funding?: { accounts?: ChangeAccount[]; drawsFundBalance?: boolean } | null
}
type FiscalMeeting = { slug: string; meetingDate: string; resolutions: FiscalRes[] }

export const YEAR = COMMITMENT_YEAR

// Every fiscal companion the index names, oldest first. Done with require so
// the set grows with new meetings without editing this file.
const indexed: FiscalMeeting[] = (fiscalIndex.meetings as string[])
  .slice()
  .sort()
  .map((slug) => require(`../public/data/meetings/${slug}-fiscal.json`) as FiscalMeeting)
const meetings = indexed.filter((m) => m.meetingDate.startsWith(`${YEAR}-`))
const laterMeetings = indexed.filter((m) => m.meetingDate > `${YEAR}-12-31`).length

type Stage = { source?: { title: string; url: string }; funds: Record<string, { name?: string; appropriations?: number | null }> }
const adoptedStage = (budgetStages as unknown as { years: Record<string, { adopted?: Stage }> }).years[String(YEAR)]?.adopted
const operatingFunds = new Set(Object.keys(adoptedStage?.funds ?? {}))
const fundName = (code: string) => adoptedStage?.funds[code]?.name ?? code

export type SavingsDraw = { fund: string; amount: number | null; fromAdoptedTable: boolean; tier?: string }

// ── Savings, exactly as /fund-balance-draws/ counts it ───────────────────────
const savingsByNumber = new Map<string, SavingsDraw[]>()
const addSavings = (number: string | null | undefined, draw: SavingsDraw) => {
  if (!number) return
  savingsByNumber.set(number, (savingsByNumber.get(number) ?? []).concat(draw))
}
for (const d of documentedDraws) addSavings(d.number, { fund: 'General Fund', amount: d.amount, fromAdoptedTable: d.tableGap?.counted === 'table' })
for (const d of otherTierGeneralFundDraws) addSavings(d.number, { fund: 'General Fund', amount: d.amount, fromAdoptedTable: d.tableGap?.counted === 'table', tier: d.tiers.join(', ') })
for (const d of otherFundDraws) addSavings(d.number, { fund: d.fund, amount: d.amount, fromAdoptedTable: d.tableGap?.counted === 'table' })

export type ChangeEntry = {
  meetingDate: string
  meetingSlug: string
  number: string | null
  title: string
  reason: Reason
  vote: string
  /** Fund codes the table names, and whether they are operating funds or capital and other funds. */
  funds: { code: string; name: string; operating: boolean }[]
  /** Savings drawn, as /fund-balance-draws/ counts it. */
  savings: SavingsDraw[]
  /** Every other source, for a table that reads plainly; empty otherwise. */
  sources: { source: Source; fund: string; name: string; amount: number }[]
  /** What the money pays for, as section G lists it, for a table that reads plainly. */
  destinations: { fund: string; operating: boolean; name: string; amount: number }[]
  /** Why the table is not totalled, when it is not. */
  notTotalled: string | null
  /** The table as the statement prints it, for reading the ones that are not totalled. */
  lines: { field: string; fund: string; code: string; name: string; amount: number | null }[]
}

const FIELD: Record<string, string> = { charge: 'Charged', revenue: 'Revenue source', transfer: 'Transfer', unspecified: 'Listed' }

function voteWords(v: FiscalRes['vote']): string {
  if (v?.tag === 'unanimous') return 'Adopted unanimously'
  if (typeof v?.ayes === 'number' && typeof v?.nays === 'number') return `Adopted ${v.ayes}–${v.nays}`
  return 'Adopted'
}

export const changes: ChangeEntry[] = []
for (const m of meetings) {
  for (const r of m.resolutions) {
    if (r.vote?.adopted !== true) continue
    const accounts = r.funding?.accounts ?? []
    const reason = budgetChangeReason(r.title, accounts, r.funding?.drawsFundBalance === true)
    if (!reason) continue
    const table = readTable(accounts)
    const codes = Array.from(new Set(accounts.map((a) => a.fund)))
    const sources = table.plain ? table.sources.filter((s) => s.source !== 'savings') : []
    changes.push({
      meetingDate: m.meetingDate,
      meetingSlug: m.slug,
      number: r.number,
      title: r.title,
      reason,
      vote: voteWords(r.vote),
      funds: codes.map((code) => ({ code, name: fundName(code), operating: operatingFunds.has(code) })),
      savings: (r.number && savingsByNumber.get(r.number)) || [],
      sources: sources.map((s) => ({ source: s.source, fund: s.fund, name: s.name, amount: s.amount })),
      destinations: table.plain ? table.destinations.map((d: Line) => ({ fund: d.fund, operating: operatingFunds.has(d.fund), name: d.name, amount: d.amount })) : [],
      notTotalled: table.plain ? null : table.why,
      lines: accounts.map((a) => ({ field: FIELD[a.role] ?? a.role, fund: a.fund, code: a.code, name: a.name ?? a.code, amount: a.amount })),
    })
  }
}

const savingsAmount = (e: ChangeEntry) => e.savings.reduce((s, d) => s + (d.amount ?? 0), 0)
const sourceAmount = (e: ChangeEntry, source: Source) =>
  source === 'savings' ? savingsAmount(e) : e.sources.filter((s) => s.source === source).reduce((s, l) => s + l.amount, 0)

// Every draw the surplus page counts must belong to a change listed here.
const listed = new Set(changes.map((e) => e.number))
export const savingsNotListed = Array.from(savingsByNumber.keys()).filter((n) => !listed.has(n))

export type MeetingPoint = { date: string; slug: string; changes: number; bySource: Record<Source, number> }

const emptySources = (): Record<Source, number> => ({ savings: 0, borrowed: 0, grants: 0, fees: 0, moved: 0 })

export const byMeeting: MeetingPoint[] = meetings.map((m) => {
  const here = changes.filter((e) => e.meetingSlug === m.slug)
  const bySource = emptySources()
  for (const e of here) for (const s of Object.keys(bySource) as Source[]) bySource[s] += sourceAmount(e, s)
  return { date: m.meetingDate, slug: m.slug, changes: here.length, bySource }
})

const totals = emptySources()
for (const p of byMeeting) for (const s of Object.keys(totals) as Source[]) totals[s] += p.bySource[s]

const savingsGeneral = changes.reduce((s, e) => s + e.savings.filter((d) => d.fund === 'General Fund').reduce((t, d) => t + (d.amount ?? 0), 0), 0)
const unpricedSavings = changes.reduce((n, e) => n + e.savings.filter((d) => d.amount === null).length, 0)
const destinations = changes.flatMap((e) => e.destinations)

export const budgetChanges = {
  schemaVersion: 1,
  /** Fingerprint of the meeting data this was built from (etl/write_meta.py); the page re-reads when it moves. */
  dataVersion: meta.dataVersion as string,
  generatedAt: meta.generatedAt as string,
  /** The year reported: every meeting counted here was held in it. */
  year: YEAR,
  latestMeeting: meetings.length ? meetings[meetings.length - 1].meetingDate : null,
  /** Meetings in the records held after the year, which this page does not count. */
  laterMeetings,
  adopted: {
    title: adoptedStage?.source?.title.replace(/\s*\(PDF\)$/, '') ?? `${YEAR} Adopted Budget`,
    url: adoptedStage?.source?.url ?? '',
    appropriations: Object.values(adoptedStage?.funds ?? {}).reduce((s, f) => s + (f.appropriations ?? 0), 0),
    funds: operatingFunds.size,
  },
  counts: {
    meetings: meetings.length,
    meetingsWithChanges: byMeeting.filter((p) => p.changes > 0).length,
    changes: changes.length,
    totalled: changes.filter((e) => e.notTotalled === null).length,
    notTotalled: changes.filter((e) => e.notTotalled !== null).length,
    unpricedSavings,
  },
  totals,
  /** Money added to budgets: everything but money moved between lines and funds. */
  added: NEW_MONEY.reduce((s, k) => s + totals[k], 0),
  savingsGeneralFund: savingsGeneral,
  destinations: {
    operating: destinations.filter((d) => d.operating).reduce((s, d) => s + d.amount, 0),
    capital: destinations.filter((d) => !d.operating).reduce((s, d) => s + d.amount, 0),
  },
  byMeeting,
  changes: changes.slice().reverse(),
  /** Draws /fund-balance-draws/ counts whose resolution is not listed here; the build check requires none. */
  savingsNotListed,
}

export type BudgetChanges = typeof budgetChanges
