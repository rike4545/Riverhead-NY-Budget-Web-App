// Join a sub-account code written on a Fiscal Impact Statement to the budget
// line it charges.
//
// Riverhead's Fiscal Impact Statement, section G, asks the preparer for three
// things: the appropriation account to be charged, the grant or revenue source,
// and any appropriation transfer. Where the preparer fills those in, the Town
// has told us in its own chart of accounts exactly which budget line a
// resolution moves money into and where that money comes from — no inference
// from the resolution's title required.
//
// This module resolves those codes against the 2026 Adopted Budget's 848
// appropriation lines and 161 revenue lines (web/public/data/subaccounts), so a
// resolution can be shown as "$150,000 into Atty - Prof Svcs - Legal, a line the
// adopted budget set at $400,000" instead of "commits money".
//
// Riverhead uses the NY chart of accounts in two shapes, and the shape alone
// says which side of the ledger a code sits on:
//
//   appropriation  FUND-F-DDDD-OOO-SSS-PPPPP   A01-1-1420-433-000-00000
//   revenue        FUND-RRRR-SSS-PPPPP-T       A01-9999-000-00000-0
//
// Every line in the adopted-budget extract follows one of those two exactly.

import { subAccountIndex, getFundDetail, allFundCodes } from './subaccounts'

/** Revenue object 9999 is the Town's journal entry for "Appropriated Fund Balance". */
export const FUND_BALANCE_OBJECT = '9999'

// Funds that appear in section G but not in the operating-budget extract,
// because they are not operating funds. Money moving through them is real, but
// it is not a draw on any operating fund's accumulated surplus.
const NON_OPERATING_FUNDS: Record<string, string> = {
  H01: 'Capital Projects Fund',
  EW3: 'Water District — developer fees',
  ES2: 'Sewer — developer fees',
  CM5: 'Community Preservation — capital',
  CD1: 'Community Development',
  // Two sewer funds the 2026 capital statements use that the adopted-budget
  // extract does not carry. Labelled from the Town's own account descriptions
  // on the statement rather than given an official title this site cannot cite.
  ES6: 'Sewer District (ES6)',
  ES7: 'Sewer District (ES7)',
  // SW1, PK1 and BID were listed here and are removed. The adopted budget
  // carries Calverton Sewer District as ES3, Public Parking District as ST1 and
  // Business Improvement District as CM1 — all of them OPERATING funds in the
  // extract. Keeping the other codes here would have told a reader that a fund
  // the Town does budget sits outside the operating budget. None of the three
  // appears anywhere in the resolution corpus, so nothing is lost by dropping
  // them and a live mislabel is avoided.
}

export type AccountRole = 'charge' | 'revenue' | 'transfer' | 'unspecified'
export type AccountKind = 'appropriation' | 'revenue'

/** One account as the Town wrote it on a statement. Emitted by etl/parse_fiscal_impact.py. */
export type StatementAccount = {
  code: string
  role: AccountRole
  kind: AccountKind
  fund: string
  name: string | null
  amount: number | null
  /** The resolution opens this account — it post-dates the adopted budget. */
  createdHere?: boolean
}

/** The whole of section G for one resolution. */
export type ResolutionFunding = {
  source: string | null
  sources: string[]
  sourceText: string | null
  fundCodes: string[]
  funds: string[]
  amount: number | null
  accounts?: StatementAccount[]
  fundBalanceAccounts?: string[]
  /** The fund each 9999 account belongs to — the fund actually being drawn down. */
  fundBalanceFunds?: string[]
  fundBalanceDraw?: number | null
  drawsFundBalance?: boolean
  /** Grant terms, read from the statement. null means the statement did not say. */
  matchRequired?: boolean | null
  matchPercent?: number | null
  reimbursementBasis?: boolean
  /** How many appropriation lines this one action charges. */
  splitAcross?: number
  createsAccounts?: string[]
}

export type AccountMatch =
  /** The code names a line in the adopted budget. */
  | {
      status: 'matched'
      code: string
      kind: AccountKind
      fund: string
      fundName: string
      department: string
      lineName: string
      category: string | null
      adopted2026: number | null
      adopted2025: number | null
      /** Set when the budget spells this line differently from the statement. */
      normalizedFrom?: string
    }
  /** A fund-balance draw from a fund whose adopted budget appropriated none. */
  | { status: 'unbudgeted-fund-balance'; code: string; fund: string; fundName: string }
  /** An account this resolution opens, so it cannot be in the adopted budget. */
  | { status: 'new-account'; code: string; fund: string; fundName: string; project: string }
  /**
   * A well-formed code, in a fund the adopted budget does cover, naming a line
   * the budget does not carry. That is a fact about the budget rather than a
   * failure here: the Town charged an account it had not appropriated.
   */
  | { status: 'not-in-adopted-budget'; code: string; fund: string; fundName: string }
  /** A valid code in a fund the operating-budget extract does not cover. */
  | { status: 'non-operating'; code: string; fund: string; fundName: string }
  /** Shape recognised, fund unknown to this site. */
  | { status: 'unknown'; code: string; fund: string }

type Row = {
  kind: AccountKind
  fund: string
  fundName: string
  department: string
  lineName: string
  category: string | null
  adopted2026: number | null
  adopted2025: number | null
}

let index: Map<string, Row> | null = null
let prefixIndex: Map<string, string[]> | null = null

/** First four segments — fund, function, department, object. */
function prefixOf(code: string): string {
  return code.split('-').slice(0, 4).join('-')
}

function buildIndex(): Map<string, Row> {
  const map = new Map<string, Row>()
  for (const code of allFundCodes()) {
    const fund = getFundDetail(code)
    if (!fund) continue
    for (const dept of fund.departments) {
      for (const item of dept.lineItems) {
        map.set(item.account, {
          kind: 'appropriation',
          fund: fund.code,
          fundName: fund.name,
          department: dept.name,
          lineName: item.name,
          category: item.category,
          adopted2026: item.adopted2026,
          adopted2025: item.adopted2025,
        })
      }
    }
    for (const rev of fund.revenues) {
      map.set(rev.account, {
        kind: 'revenue',
        fund: fund.code,
        fundName: fund.name,
        department: 'Revenue',
        lineName: rev.name,
        category: null,
        adopted2026: rev.adopted2026,
        adopted2025: rev.adopted2025,
      })
    }
  }
  return map
}

function accountIndex(): Map<string, Row> {
  if (!index) index = buildIndex()
  return index
}

/**
 * First-four-segments index, for the Town's own spelling variants.
 *
 * Riverhead writes the sub-segment two ways for the same line: the budget
 * carries A01-3-3625-102-000-00000 (Code - Personal Services PT) and a
 * resolution charges A01-3-3625-102-NON-00000, NON for non-uniformed. Same
 * line, different convention. Where exactly one budget account shares the first
 * four segments, that is the line; where several do, the sub-segment is
 * carrying real meaning and guessing would be wrong.
 */
function accountPrefixIndex(): Map<string, string[]> {
  if (!prefixIndex) {
    prefixIndex = new Map()
    for (const code of Array.from(accountIndex().keys())) {
      const p = prefixOf(code)
      const list = prefixIndex.get(p)
      if (list) list.push(code)
      else prefixIndex.set(p, [code])
    }
  }
  return prefixIndex
}

/** Fund code of a sub-account, e.g. "A01" from "A01-1-1420-433-000-00000". */
export function fundOf(code: string): string {
  return code.split('-')[0] ?? ''
}

/** Which side of the ledger, read from the code's shape alone. */
export function kindOf(code: string): AccountKind {
  return (code.split('-')[1] ?? '').length === 4 ? 'revenue' : 'appropriation'
}

/** True for the Town's "Appropriated Fund Balance" account in any fund. */
export function isFundBalanceAccount(code: string): boolean {
  return kindOf(code) === 'revenue' && code.split('-')[1] === FUND_BALANCE_OBJECT
}

/** Trailing project segment of a code, e.g. "12620". "00000" means no project. */
export function projectOf(code: string): string {
  const parts = code.split('-')
  return parts.length >= 5 ? parts[parts.length - 1] : ''
}

/** Fund name from the adopted budget, falling back to the non-operating list. */
export function fundName(fund: string): string | null {
  const entry = subAccountIndex.funds.find((f) => f.code === fund)
  return entry?.name ?? NON_OPERATING_FUNDS[fund] ?? null
}

/**
 * Resolve one statement account code against the adopted budget.
 *
 * A code that does not resolve is not necessarily a parsing failure, and the
 * distinction matters: a capital-fund code has no operating budget line by
 * design, while a fund-balance code that fails to resolve means the fund
 * appropriated no fund balance at adoption and is drawing on it anyway.
 */
export function lookupAccount(code: string, createdHere = false): AccountMatch {
  const fund = fundOf(code)
  const row = accountIndex().get(code)
  if (row) {
    return {
      status: 'matched',
      code,
      kind: row.kind,
      fund: row.fund,
      fundName: row.fundName,
      department: row.department,
      lineName: row.lineName,
      category: row.category,
      adopted2026: row.adopted2026,
      adopted2025: row.adopted2025,
    }
  }

  // The Town's own spelling variant of a line the budget does carry.
  const siblings = accountPrefixIndex().get(prefixOf(code))
  if (siblings && siblings.length === 1) {
    const only = accountIndex().get(siblings[0])!
    return {
      status: 'matched',
      code: siblings[0],
      kind: only.kind,
      fund: only.fund,
      fundName: only.fundName,
      department: only.department,
      lineName: only.lineName,
      category: only.category,
      adopted2026: only.adopted2026,
      adopted2025: only.adopted2025,
      normalizedFrom: code,
    }
  }

  const name = fundName(fund)
  // An account the resolution itself opens is absent from the adopted budget by
  // definition, not because anything failed to resolve. Saying so is the point:
  // it is new spending authority created outside the budget the Board adopted.
  if (createdHere) {
    return { status: 'new-account', code, fund, fundName: name ?? fund, project: projectOf(code) }
  }
  if (isFundBalanceAccount(code) && subAccountIndex.funds.some((f) => f.code === fund)) {
    return { status: 'unbudgeted-fund-balance', code, fund, fundName: name ?? fund }
  }
  // Only a fund that is genuinely outside the operating extract may be called
  // non-operating. fundName() also answers for every operating fund, so testing
  // it alone told a reader that an unmatched General Fund code — say the
  // A01-2705 Gifts and Donations line, which the budget does not carry — sits
  // outside the operating budget. It does not. It is simply not in the extract,
  // and "we could not resolve this" is the honest answer.
  const nonOperating = NON_OPERATING_FUNDS[fund]
  if (nonOperating) return { status: 'non-operating', code, fund, fundName: nonOperating }

  // Well formed, in a fund the budget covers, and absent from it. The Town
  // charged a line it had not appropriated — worth saying, not worth calling a
  // lookup failure. A code of the wrong shape is a different thing entirely.
  const segments = code.split('-').length
  const inBudgetedFund = subAccountIndex.funds.some((f) => f.code === fund)
  if (inBudgetedFund && (segments === 5 || segments === 6)) {
    return { status: 'not-in-adopted-budget', code, fund, fundName: name ?? fund }
  }
  return { status: 'unknown', code, fund }
}

/** A charge as a share of the budget line it hits — null unless both are known. */
export function shareOfLine(amount: number | null, match: AccountMatch): number | null {
  if (!amount || match.status !== 'matched') return null
  if (!match.adopted2026 || match.adopted2026 <= 0) return null
  return amount / match.adopted2026
}

export type ResolvedAccount = StatementAccount & { match: AccountMatch; share: number | null }

/** Every account on a statement, resolved, in the order the Town wrote them. */
export function resolveFunding(funding: ResolutionFunding | null | undefined): ResolvedAccount[] {
  if (!funding?.accounts?.length) return []
  return funding.accounts.map((a) => {
    const match = lookupAccount(a.code, a.createdHere === true)
    return { ...a, match, share: shareOfLine(a.amount, match) }
  })
}

/**
 * One action charged across several budget lines.
 *
 * Riverhead splits routinely — a single fund-balance draw for part-time Code
 * Enforcement staff lands on nine sub-accounts at once, with wages, FICA,
 * uniforms, equipment and phone each charged separately. A year-end
 * reconciliation or a cost-allocation entry does the same thing. Reading only
 * the headline figure loses which departments actually absorbed the money, so
 * the split is reported as its own fact.
 */
export type FundingSplit = {
  lines: ResolvedAccount[]
  total: number
  /** The line taking the largest share, and what share that is. */
  largest: { line: ResolvedAccount; share: number } | null
  /** Distinct departments the one action touches. */
  departments: string[]
  /** True when the money lands on more than one budget line. */
  isSplit: boolean
}

export function fundingSplit(funding: ResolutionFunding | null | undefined): FundingSplit {
  const lines = resolveFunding(funding).filter((a) => a.kind === 'appropriation' && a.amount)
  const total = lines.reduce((sum, a) => sum + (a.amount ?? 0), 0)
  const departments = Array.from(
    new Set(lines.map((a) => (a.match.status === 'matched' ? a.match.department : fundName(a.fund) ?? a.fund))),
  )
  let largest: FundingSplit['largest'] = null
  for (const line of lines) {
    const share = total > 0 ? (line.amount ?? 0) / total : 0
    if (!largest || share > largest.share) largest = { line, share }
  }
  return { lines, total, largest, departments, isSplit: lines.length > 1 }
}

/** What a grant actually costs the Town, in one sentence, or null if free/unstated. */
export function grantCost(funding: ResolutionFunding | null | undefined): string | null {
  if (!funding) return null
  if (funding.matchRequired) {
    const pct = funding.matchPercent
    return pct
      ? `Requires a ${pct}% local match — that share is Town money, not grant money.`
      : 'Requires a local match — that share is Town money, not grant money.'
  }
  if (funding.reimbursementBasis) {
    return 'Paid on a reimbursement basis — the Town spends first and is paid back.'
  }
  if (funding.matchRequired === false) return 'The statement says no local match is required.'
  return null
}

export const accountLookupCoverage = {
  appropriationLines: subAccountIndex.funds.reduce((s, f) => s + f.lineItemCount, 0),
  funds: subAccountIndex.funds.length,
  source: subAccountIndex.source,
}
