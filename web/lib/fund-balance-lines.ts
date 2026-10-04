// A fiscal impact statement's fund-balance lines, split by fund.
//
// Section G can draw on more than one fund's balance: two sewer districts, say,
// or the General Fund and a district. Each fund's balance is its own, so a draw
// becomes one entry per fund, each carrying only that fund's lines. Adding every
// line together and filing the sum under each fund would overstate every fund's
// subtotal, and a fund named without an amount would look priced because another
// fund's line was.
//
// Section G is the preparer's summary. The budget table in the RESOLVED clause
// is what the Board adopts, and where it puts a different figure on a fund's
// 9999 account, the table's figure is the draw: 2026-765's section G says
// $150,000, its table $280,000. etl/parse_fiscal_impact.py reads those rows
// (tableFundBalance) and applies the same rule (adopted_draws).
//
// No imports, so scripts/verify-fund-balance-lines.mjs can load this file
// directly and test it on cases the published data does not contain yet.

/** Revenue object 9999 is the Town's journal entry for "Appropriated Fund Balance". */
export const FUND_BALANCE_OBJECT = '9999'

type Account = { code: string; kind: string; fund: string; amount: number | null }

/** The part of section G this file reads, as etl/parse_fiscal_impact.py writes it. */
export type FundBalanceFunding = {
  accounts?: Account[]
  /** The fund each 9999 account draws on, in the order the accounts appear. */
  fundBalanceFunds?: string[]
  /** The GASB 54 tier each 9999 account names, in the same order; null where none. */
  fundBalanceClasses?: (string | null)[]
} | null | undefined

/**
 * A 9999 row of the budget table the resolution orders (tableFundBalance).
 * The table's columns do not survive text extraction, so a row does not say
 * whether it is FROM or TO. It counts only in a fund whose section G names a
 * fund-balance source, which settles the direction.
 */
export type TableLine = { code: string; fund: string; amount: number; row: string }

export type FundBalanceLine = Account & { fundName: string; tier: string | null }

/** The statement's fund-balance lines, picked as the ETL picks them: revenue accounts on object 9999. */
export function fundBalanceLines(funding: FundBalanceFunding): FundBalanceLine[] {
  const names = funding?.fundBalanceFunds ?? []
  const tiers = funding?.fundBalanceClasses ?? []
  return (funding?.accounts ?? [])
    .filter((a) => a.kind === 'revenue' && a.code.split('-')[1] === FUND_BALANCE_OBJECT)
    .map((a, i) => ({ ...a, fundName: names[i] ?? a.fund, tier: tiers[i] ?? null }))
}

export type FundDraw = {
  fund: string
  /** The draw: the adopted table's figure where it has one for this fund, section G's otherwise. */
  amount: number | null
  /** This fund's section G lines added up, or null when none of them states an amount. */
  statement: number | null
  /** This fund's rows in the adopted table added up, or null when the table names none. */
  table: number | null
  /** Those rows as printed, for quoting. */
  rows: string[]
  /** How many of this fund's section G lines state no amount, where the table does not price the fund. */
  unpricedLines: number
  /** The tier each of this fund's lines names. */
  tiers: (string | null)[]
}

const cents = (n: number) => Math.round(n * 100) / 100

/** One entry per fund the statement draws on, each with only its own lines. */
export function drawsByFund(funding: FundBalanceFunding, table: TableLine[] | null | undefined = []): FundDraw[] {
  const lines = fundBalanceLines(funding)
  const funds = Array.from(new Set(lines.map((l) => l.fundName)))
  return funds.map((fund) => {
    const own = lines.filter((l) => l.fundName === fund)
    const priced = own.filter((l) => l.amount != null)
    const codes = new Set(own.map((l) => l.fund))
    const voted = (table ?? []).filter((t) => codes.has(t.fund))
    const statement = priced.length ? cents(priced.reduce((s, l) => s + (l.amount as number), 0)) : null
    const tableSum = voted.length ? cents(voted.reduce((s, t) => s + t.amount, 0)) : null
    return {
      fund,
      amount: tableSum ?? statement,
      statement,
      table: tableSum,
      rows: voted.map((t) => t.row),
      unpricedLines: tableSum === null ? own.length - priced.length : 0,
      tiers: own.map((l) => l.tier),
    }
  })
}

/** True when the adopted table puts a different figure on this fund's draw than section G. */
export const tableCorrects = (d: FundDraw) => d.table !== null && d.table !== d.statement

/**
 * Section G's figure for the action once the adopted table corrects a draw, as
 * etl/parse_fiscal_impact.py works it out (corrected_amount). A 9999 line
 * section G priced is part of that figure, so the table moves it by the
 * difference (2026-765: $150,000 to $280,000). A line section G left blank
 * never was: the action's cost is already in its other lines, so the table's
 * figure stands beside them, not on top, and the larger is the action.
 */
export function correctedAmount(amount: number | null | undefined, corrected: FundDraw[]): number | null {
  if (!corrected.length) return amount ?? null
  const moved = (amount ?? 0) + corrected
    .filter((d) => d.statement !== null)
    .reduce((n, d) => n + (d.table as number) - (d.statement as number), 0)
  const blank = corrected.filter((d) => d.statement === null).reduce((n, d) => n + (d.table as number), 0)
  return cents(Math.max(moved, blank))
}
