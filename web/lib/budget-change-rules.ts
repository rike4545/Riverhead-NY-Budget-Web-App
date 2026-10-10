// Which adopted resolutions change a Town budget, and how each one says it is
// paid for, read from the account table on the resolution's own fiscal impact
// statement. The dashboard at /budget-changes/ is built from these rules.
//
// A resolution counts as a budget change when the Town itself marks it as one:
//   - its title says it adjusts, transfers, amends, modifies or adopts a budget;
//   - its fiscal impact statement fills in section G's "Appropriation Transfer"
//     field, which the form provides for moving money between budget lines; or
//   - it appropriates fund balance (savings), which always amends a budget.
//
// Section G has three printed fields, and etl/parse_fiscal_impact.py keeps
// which one each account came from: "Appropriation Account to be Charged"
// (charge), "Grant or other Revenue Source" (revenue) and "Appropriation
// Transfer" (transfer). When the transfer field is filled, the transfer lines
// are what the money goes to and the charged lines are where it moves from.
// When it is empty, the charged lines are what the new money pays for.
//
// A table is read as plain only when that reading holds: no revenue line sits
// in the transfer field, no budget line sits in the revenue field, every line
// states an amount, and the sources add up to the destinations. Anything else
// is listed with its own lines and left out of the totals, because the parsed
// table carries no signs and netting it would be a guess.
//
// This file imports nothing, so scripts/verify-budget-changes.mjs runs the
// same rules under Node that the page runs at build time.

export type ChangeAccount = { code: string; role: string; kind: string; fund: string; name: string | null; amount: number | null }

export type Source = 'savings' | 'borrowed' | 'grants' | 'fees' | 'moved'

/** The four kinds of money that add to a budget, in the order the chart stacks them. */
export const NEW_MONEY: Source[] = ['savings', 'borrowed', 'grants', 'fees']

export const SOURCE_LABELS: Record<Source, string> = {
  savings: 'From savings',
  borrowed: 'Borrowed',
  grants: 'Grants, aid and donations',
  fees: 'Developer fees and other revenue',
  moved: 'Moved from other lines or funds',
}

const BUDGET_TITLE = /budget (adjustment|transfer|amendment|modification|adoption)|amends? .{0,40}budget|modif\w* .{0,40}budget/i

export type Reason = 'title' | 'transfer' | 'savings'

/** Why a resolution counts as a budget change, or null when it does not. */
export function budgetChangeReason(title: string, accounts: ChangeAccount[], drawsFundBalance: boolean): Reason | null {
  if (BUDGET_TITLE.test(title)) return 'title'
  if (accounts.some((a) => a.role === 'transfer')) return 'transfer'
  if (drawsFundBalance) return 'savings'
  return null
}

/**
 * What kind of money a revenue account is, from its revenue code: the second
 * segment, 2705 in A01-2705-000-00000-7. 9999 is the Town's Appropriated Fund
 * Balance; 57xx are bond and note proceeds; 50xx are transfers from other Town
 * funds; 3xxx and 4xxx are State and federal aid; 2705 and 2706 are gifts,
 * donations and county aid as the Town labels them.
 */
export function sourceOf(revenueAccount: string): Source {
  const code = revenueAccount.split('-')[1] ?? ''
  if (code === '9999') return 'savings'
  if (code.startsWith('57')) return 'borrowed'
  if (code.startsWith('50')) return 'moved'
  if (code.startsWith('3') || code.startsWith('4') || code === '2705' || code === '2706') return 'grants'
  return 'fees'
}

export type Line = { source?: Source; fund: string; code: string; name: string; amount: number }
export type Table =
  | { plain: true; sources: (Line & { source: Source })[]; destinations: Line[] }
  | { plain: false; why: string }

const line = (a: ChangeAccount): Line => ({ fund: a.fund, code: a.code, name: a.name ?? a.code, amount: a.amount ?? 0 })

/** The resolution's table read as sources and destinations, or why it cannot be. */
export function readTable(accounts: ChangeAccount[]): Table {
  if (accounts.length === 0) return { plain: false, why: 'Its fiscal impact statement lists no accounts.' }
  if (accounts.some((a) => a.amount === null)) return { plain: false, why: 'Some of its accounts are listed without an amount.' }
  const transfers = accounts.filter((a) => a.role === 'transfer')
  const charges = accounts.filter((a) => a.role === 'charge')
  const revenues = accounts.filter((a) => a.role === 'revenue')
  if (transfers.some((a) => a.kind === 'revenue')) return { plain: false, why: 'Its transfer field moves revenue lines as well as budget lines, so which way each line moves cannot be read from the table alone.' }
  if (revenues.some((a) => a.kind !== 'revenue')) return { plain: false, why: 'Its revenue field lists a budget line.' }
  const sources = revenues.map((a) => ({ ...line(a), source: sourceOf(a.code) }))
    .concat(transfers.length ? charges.map((a) => ({ ...line(a), source: 'moved' as Source })) : [])
  const destinations = (transfers.length ? transfers : charges).map(line)
  const from = sources.reduce((s, l) => s + l.amount, 0)
  const to = destinations.reduce((s, l) => s + l.amount, 0)
  if (sources.length === 0) return { plain: false, why: 'It names what the money pays for but no source.' }
  if (Math.abs(from - to) >= 0.5) return { plain: false, why: `Its sources (${Math.round(from).toLocaleString('en-US')}) and destinations (${Math.round(to).toLocaleString('en-US')}) do not add up to the same amount.` }
  return { plain: true, sources, destinations }
}
