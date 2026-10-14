// Outlier Watch: year-over-year appropriation swings across all 19 town funds,
// flagged under the rule in outlier-rules.ts.
//
// The budgets compared are budgetColumns ([[budget-history]]): every adopted
// budget in the history, each read from its own Summary page, then next year's
// budget while it is still a proposal (the 2027 Tentative now). The proposal is
// compared with the last adopted budget and labelled a proposal wherever it
// appears. The Preliminary takes its place when it is published, and the
// adopted budget when that is parsed into the history.

import fiscalIndex from '../public/data/meetings/fiscal-index.json'
import { budgetColumns, budgetHistory } from './budget-history'
import { lineSource, supplementAdoptedYear, supplementLines } from './funds-2027'
import { compareColumns, lineMoves, splitByBar } from './outlier-rules'

export { DOLLAR_THRESHOLD, PCT_THRESHOLD, isOutlier } from './outlier-rules'
export type { FundYoyChange, LineMove } from './outlier-rules'

const compared = compareColumns(budgetColumns, budgetHistory.funds)

export const allYoyChanges = compared.changes
export const outliers = compared.outliers
/** Every comparison, oldest first, for the year filter. */
export const transitions = compared.transitions.map((t) => ({ key: t.key, proposed: t.proposed }))
export const fundCount = budgetHistory.funds.length
/** A fund's name as the history prints it, by code. */
export const fundNames: Record<string, string> = Object.fromEntries(budgetHistory.funds.map((f) => [f.code, f.name]))
export const adoptedYears = { first: budgetHistory.years[0], last: budgetHistory.years[budgetHistory.years.length - 1] }

/** The proposal against the last adopted budget: what it flags, and what clears one bar only. */
export const proposal = (() => {
  const t = compared.transitions.find((x) => x.proposed)
  if (!t) return null
  return { key: t.key, from: t.from, to: t.to, ...splitByBar(allYoyChanges.filter((c) => c.transition === t.key)) }
})()

/**
 * For each fund the proposal flags, the Budget Supplement lines that moved.
 * Only for a Tentative that the Supplement prints, beside the same adopted
 * year the comparison starts from.
 */
export const proposalLines = (() => {
  if (!proposal || proposal.to.stage !== 'tentative' || !lineSource || supplementAdoptedYear !== proposal.from.year) return {}
  return Object.fromEntries(
    proposal.flagged.flatMap((c) => {
      const moves = lineMoves([...supplementLines], c.code, c.prior, c.current)
      return moves ? [[c.code, moves]] : []
    }),
  ) as Record<string, NonNullable<ReturnType<typeof lineMoves>>>
})()
export const supplementSource = lineSource

// ── Why the 2027 Tentative's Debt Service Fund falls ─────────────────────────
//
// The fund makes bond and note payments for the General Fund and other funds,
// with money they send it (the water and sewer districts pay their own). Two
// votes the Board took in 2026 paid debt down, mostly with savings. They are
// read here from the meeting records, so the amounts are the resolutions' own,
// account by account; the words around them are this site's.

type Account = { code: string; role: string; amount: number | null }
type Res = { number: string | null; title: string; vote: { adopted: boolean | null; tag: string | null } | null; funding?: { accounts?: Account[] } }
type Meeting = { meetingDate: string; resolutions: Res[] }

const meetings = (fiscalIndex.meetings as string[]).map((slug) => ({ slug, ...(require(`../public/data/meetings/${slug}-fiscal.json`) as Meeting) }))

const PAYDOWNS = [
  {
    number: '2026-642',
    paysDown: 'the 2018 Series B refunding bonds',
    money: [
      { account: 'CM4-9999-000-00000-0', words: 'of Community Preservation Fund balance' },
      { account: 'A01-2660-000-00000-1', words: 'from the sale of Town property' },
    ],
  },
  {
    number: '2026-762',
    paysDown: 'the Town Square bond anticipation note',
    money: [
      { account: 'A01-9999-000-00000-0', words: 'of General Fund balance' },
      { account: 'A01-2410-357-00000-1', words: 'of rent from the Town Square properties' },
    ],
  },
]

export type Paydown = {
  number: string
  meetingSlug: string
  meetingDate: string
  title: string
  unanimous: boolean
  paysDown: string
  money: { amount: number; words: string }[]
}

/** The two votes, or none if either can no longer be found with every amount it names. */
export const paydowns2026: Paydown[] = (() => {
  const found = PAYDOWNS.map((p) => {
    const meeting = meetings.find((m) => m.resolutions.some((r) => r.number === p.number))
    const r = meeting?.resolutions.find((x) => x.number === p.number)
    if (!meeting || !r || r.vote?.adopted !== true) return null
    const money = p.money.map((m) => {
      const amount = r.funding?.accounts?.find((a) => a.code === m.account && a.role === 'revenue')?.amount
      return amount ? { amount, words: m.words } : null
    })
    if (money.some((m) => m === null)) return null
    return {
      number: p.number,
      meetingSlug: meeting.slug,
      meetingDate: meeting.meetingDate,
      title: r.title,
      unanimous: r.vote?.tag === 'unanimous',
      paysDown: p.paysDown,
      money: money as { amount: number; words: string }[],
    }
  })
  return found.every((p) => p !== null) ? (found as Paydown[]) : []
})()

/**
 * The Community Preservation Fund's side of it, from the Supplement: its
 * transfer for debt payments, and the "Fund Balance Contribution" line that
 * takes its place in the Tentative.
 */
export const cpfDebtTransfer = (() => {
  const line = (account: string) => supplementLines.find((l) => l.account === account)
  const transfer = line('CM4-9-9901-900-V01-00000')
  const contribution = line('CM4-9-9990-000-000-00000')
  if (!transfer || !contribution) return null
  return {
    transfer: { from: transfer.adopted ?? 0, to: transfer.tentative ?? 0, page: transfer.page },
    contribution: { from: contribution.adopted ?? 0, to: contribution.tentative ?? 0, page: contribution.page, name: contribution.name },
  }
})()
