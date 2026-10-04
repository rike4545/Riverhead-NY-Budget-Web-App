// A fiscal impact statement's fund-balance lines, split by fund.
//
// Section G can draw on more than one fund's balance: two sewer districts, say,
// or the General Fund and a district. Each fund's balance is its own, so a draw
// becomes one entry per fund, each carrying only that fund's lines. Adding every
// line together and filing the sum under each fund would overstate every fund's
// subtotal, and a fund named without an amount would look priced because another
// fund's line was.
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
  /** This fund's own lines added up, or null when none of them states an amount. */
  amount: number | null
  /** How many of this fund's lines state no amount. */
  unpricedLines: number
  /** The tier each of this fund's lines names. */
  tiers: (string | null)[]
}

/**
 * One entry per fund the statement draws on, each with only its own lines.
 *
 * `table` is a figure declared for a whole resolution: the budget table the
 * Board adopted, where it moves more than section G (ADOPTED_TABLE in
 * fiscal-commitments-2027.ts). It stands only when every line is in one fund.
 * Otherwise nothing says which fund's line it corrects, so each fund keeps
 * section G's figures.
 */
export function drawsByFund(funding: FundBalanceFunding, table: number | null = null): FundDraw[] {
  const lines = fundBalanceLines(funding)
  const funds = Array.from(new Set(lines.map((l) => l.fundName)))
  return funds.map((fund) => {
    const own = lines.filter((l) => l.fundName === fund)
    const priced = own.filter((l) => l.amount != null)
    const amount = table != null && funds.length === 1
      ? table
      : priced.length
        ? Math.round(priced.reduce((s, l) => s + (l.amount as number), 0) * 100) / 100
        : null
    return { fund, amount, unpricedLines: own.length - priced.length, tiers: own.map((l) => l.tier) }
  })
}
