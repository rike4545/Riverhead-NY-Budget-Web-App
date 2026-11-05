// The latest 2027 proposal (the Preliminary Budget once the Town has printed
// it, else the Tentative) beside the 2026 adopted budget, for the Funds
// Explorer.
//
// Fund totals come from the Tentative's own Summary (budget-stages.json), the
// figures the Compare and Tentative pages use. Line by line, the 2027 Budget
// Supplement prints each account's Tentative figure, and its lines add up to
// the Tentative's Summary to the dollar (its reconciliation is complete), so a
// fund's page can carry the proposal beside the adopted figures. If a later
// Supplement stops adding up, the line figures are left out rather than shown
// wrong.
//
// A Tentative is the Supervisor's proposal and a Preliminary is that proposal
// with the Board's changes. Neither is adopted until the Board votes by
// November 20, so every figure here is labelled proposed.
//
// The Preliminary book prints its own account-level column, read by
// etl/parse_preliminary_lines.py into current-lines.json, so line figures
// follow the Preliminary where it exists and the Tentative stays beside it.

import supplementJson from '../public/data/budget-supplement/current-lines.json'
import { operatingAppropriations, stageDoc, TRANSFER_FUNDED } from './budget-stages'
import type { FundDetail, RevenueLineItem, SubDepartment, SubLineItem } from './subaccounts'

export const TENTATIVE_YEAR = 2027
const tentative = stageDoc(TENTATIVE_YEAR, 'tentative')
const preliminary = stageDoc(TENTATIVE_YEAR, 'preliminary')
const adopted = stageDoc(TENTATIVE_YEAR - 1, 'adopted')
export const tentativeOut = tentative !== null && adopted !== null
/** The newest stage the Town has printed for the year, and its name for readers. */
export const PROPOSAL_STAGE: 'preliminary' | 'tentative' = preliminary ? 'preliminary' : 'tentative'
export const PROPOSAL_LABEL = PROPOSAL_STAGE === 'preliminary' ? 'Preliminary' : 'Tentative'
const proposalDoc = preliminary ?? tentative

export type FundYear = { appropriations: number; revenues: number; fundBalance: number; levy: number }
const yearOf = (row: { appropriations: number; revenues: number | null; fundBalance: number | null; levy: number | null } | undefined): FundYear | null =>
  row ? { appropriations: row.appropriations, revenues: row.revenues ?? 0, fundBalance: row.fundBalance ?? 0, levy: row.levy ?? 0 } : null

/** One fund's 2026 adopted and 2027 Tentative totals, each from its own document's Summary. */
export function fundYears(code: string): { adopted: FundYear | null; tentative: FundYear | null; proposal: FundYear | null } {
  return { adopted: yearOf(adopted?.funds[code]), tentative: yearOf(tentative?.funds[code]), proposal: yearOf(proposalDoc?.funds[code]) }
}

/** The whole budget, both years. "Operating" leaves out the funds the others pay for, so no dollar counts twice. */
export const budgetTotals = tentativeOut
  ? {
      adopted: adopted!.totals.appropriations,
      tentative: tentative!.totals.appropriations,
      operatingAdopted: operatingAppropriations(adopted),
      operatingTentative: operatingAppropriations(tentative),
      levyAdopted: adopted!.totals.levy,
      levyTentative: tentative!.totals.levy,
      proposal: proposalDoc!.totals.appropriations,
      operatingProposal: operatingAppropriations(proposalDoc),
      levyProposal: proposalDoc!.totals.levy,
      fundBalanceProposal: proposalDoc!.totals.fundBalance,
      proposalSource: proposalDoc!.source,
      fundBalanceAdopted: adopted!.totals.fundBalance,
      fundBalanceTentative: tentative!.totals.fundBalance,
      source: tentative!.source,
    }
  : null

export const transferFunded = (code: string) => (TRANSFER_FUNDED as readonly string[]).includes(code)

// ── Line by line, from the 2027 Budget Supplement ────────────────────────────

type SupplementLine = {
  account: string; fund: string; name: string; kind: string; page: number; adopted: number | null; tentative: number | null; preliminary?: number | null
  /** The last full year's actual figure, and the adopted figure the year before the adopted column. */
  actual?: number | null; priorAdopted?: number | null
}
const supplement = supplementJson as unknown as {
  columns: { adopted: number; tentative: number; preliminary?: number; actual: number; priorAdopted: number }
  source: { title: string; url: string }
  reconciliation: { complete: boolean; against: string }
  lines: SupplementLine[]
}
/** The Supplement, when it is this year's and adds up to the Tentative. */
export const lineSource = supplement.columns.tentative === TENTATIVE_YEAR && supplement.reconciliation.complete ? supplement.source : null
/** Every Supplement line, with the adopted year it prints beside the Tentative; none without a Supplement that adds up. */
export const supplementLines: readonly SupplementLine[] = lineSource ? supplement.lines : []
export const supplementAdoptedYear = supplement.columns.adopted
/** The years of the Supplement's actual and earlier adopted columns. */
export const supplementActualYear = supplement.columns.actual
export const supplementPriorAdoptedYear = supplement.columns.priorAdopted
const byAccount = new Map(supplement.lines.map((l) => [l.account, l]))
/** One line's figure in the latest stage: the Preliminary book's when it prints one, else the Tentative. */
export const proposedOf = (l: { tentative: number | null; preliminary?: number | null }): number =>
  (supplement.columns.preliminary === TENTATIVE_YEAR && l.preliminary != null ? l.preliminary : l.tentative) ?? 0

// The spending category of an account, from its object code, as the
// subaccount parser assigns it (etl/parse_subaccounts.py).
const CATEGORY: Record<number, string> = { 1: 'Personal Services', 2: 'Equipment & Capital Outlay', 4: 'Contractual', 8: 'Employee Benefits', 9: 'Interfund / Transfers' }
const categoryOf = (account: string) => CATEGORY[Math.floor(Number(account.split('-')[3]) / 100)] ?? 'Other'

/**
 * The fund with each line's 2027 Tentative figure. Lines that are new in 2027
 * join their department, and departments that are new in 2027 are added; a
 * line with nothing in either year is left out. Without a Supplement that adds
 * up, the fund comes back unchanged.
 */
export function withTentative(fund: FundDetail): FundDetail {
  if (!lineSource) return fund
  const tentativeOf = (account: string) => byAccount.get(account)?.tentative ?? 0
  const proposedFor = (account: string) => { const l = byAccount.get(account); return l ? proposedOf(l) : 0 }
  const known = new Set<string>()
  const departments: SubDepartment[] = fund.departments.map((d) => {
    const lineItems: SubLineItem[] = d.lineItems.map((i) => { known.add(i.account); return { ...i, tentative2027: tentativeOf(i.account), proposed2027: proposedFor(i.account) } })
    return { ...d, lineItems }
  })
  const fresh = supplement.lines.filter((l) => l.fund === fund.code && l.kind === 'expenditure' && !known.has(l.account) && (proposedOf(l) !== 0 || (l.tentative ?? 0) !== 0))
  for (const l of fresh) {
    const code = l.account.split('-')[2]
    let dept = departments.find((d) => d.code === code)
    if (!dept) {
      dept = { code, name: `Function ${code}`, adopted2024: 0, adopted2025: 0, adopted2026: 0, change: 0, categoryTotals: [], lineItems: [], lineItemCount: 0 }
      departments.push(dept)
    }
    dept.lineItems.push({
      account: l.account, name: l.name, category: categoryOf(l.account),
      adopted2024: null, adopted2025: null, deptRequested2026: null, tentative2026: null, preliminary2026: null, adopted2026: null,
      history: [], tentative2027: l.tentative ?? 0, proposed2027: proposedOf(l), new2027: true,
    })
    dept.lineItemCount = dept.lineItems.length
  }
  for (const d of departments) {
    d.tentative2027 = d.lineItems.reduce((sum, i) => sum + (i.tentative2027 ?? 0), 0)
    d.proposed2027 = d.lineItems.reduce((sum, i) => sum + (i.proposed2027 ?? 0), 0)
  }

  const knownRevenue = new Set(fund.revenues.map((r) => r.account))
  const revenues: RevenueLineItem[] = fund.revenues.map((r) => ({ ...r, tentative2027: tentativeOf(r.account), proposed2027: proposedFor(r.account) }))
  for (const l of supplement.lines) {
    if (l.fund !== fund.code || l.kind === 'expenditure' || knownRevenue.has(l.account) || (proposedOf(l) === 0 && (l.tentative ?? 0) === 0)) continue
    revenues.push({ account: l.account, name: l.name, adopted2025: null, deptRequested2026: null, tentative2026: null, preliminary2026: null, adopted2026: null, tentative2027: l.tentative ?? 0, proposed2027: proposedOf(l), new2027: true })
  }
  return { ...fund, departments, revenues, tentativeExpenditure2027: departments.reduce((sum, d) => sum + (d.tentative2027 ?? 0), 0), proposedExpenditure2027: departments.reduce((sum, d) => sum + (d.proposed2027 ?? 0), 0) }
}
