// The fiscal impact statement helper, /fiscal-impact-helper/.
//
// Every Town Board resolution carries a Fiscal Impact Statement (sections A
// to M). Section G, "Proposed Source of Funding", has three fields, and the
// Town's accounting staff fill them the same way in every packet this site
// has read (2026-844, 2026-882, 2026-934, 2026-969):
//
//   budget adjustment (grant, donation, fees, fund balance)
//     Grant or other Revenue Source: the revenue or 9999 account   (FROM)
//     Appropriation Transfer:        the spending lines that get it (TO)
//   transfer between spending lines
//     Appropriation Account to be Charged: the lines giving money  (FROM)
//     Appropriation Transfer:              the lines receiving it  (TO)
//   charge an existing budget line, no change to the budget
//     Appropriation Account to be Charged: the line(s)
//
// and the resolution's own FROM/TO table repeats the same lines. A statement
// can carry one journal entry or several (a donation and a draw on savings
// for the same purchase, or entries in two funds); each entry balances on its
// own and stays in one fund, section G gathers every entry's lines, and the
// table shows each entry as its own block.
//
// It is an aid, not the Town's form: the Accounting Department reviews every
// statement (sections K to M).
//
// No imports: the page passes the naming functions in, so
// scripts/verify-fis-helper.mjs runs the same code.

export type ActionType = 'absorbed' | 'charge' | 'revenue' | 'fund-balance' | 'transfer'
export type EntryAction = Exclude<ActionType, 'absorbed'>

export const ACTIONS: { id: EntryAction; label: string; plain: string }[] = [
  { id: 'charge', label: 'Charge an existing budget line', plain: 'The budget already holds the money. Name the line or lines to be charged.' },
  { id: 'revenue', label: 'Add new money (grant, donation, fees)', plain: 'A budget adjustment: new revenue raises the revenue estimate and the spending line by the same amount.' },
  { id: 'fund-balance', label: 'Use savings (fund balance)', plain: 'A budget adjustment from the fund’s Appropriated Fund Balance (account 9999), unassigned or assigned to a purpose.' },
  { id: 'transfer', label: 'Move money between spending lines', plain: 'A budget transfer: lines in the same fund give money up and others receive it. The total budget does not change.' },
]

/** What kind of money a revenue account is, from its revenue code (the second part of the account number). */
export function revenueKind(code: string): 'savings' | 'borrowed' | 'interfund' | 'grant' | 'donation' | 'tax' | 'fees' {
  const c = code.split('-')[1] ?? ''
  if (c === '9999') return 'savings'
  if (c.startsWith('57')) return 'borrowed'
  if (c.startsWith('50')) return 'interfund'
  if (c === '2705' || c === '2706') return 'donation'
  if (c.startsWith('3') || c.startsWith('4')) return 'grant'
  if (c.startsWith('10') || c.startsWith('11')) return 'tax'
  return 'fees'
}

export const REVENUE_KIND_LABEL: Record<ReturnType<typeof revenueKind>, string> = {
  savings: 'Fund balance', borrowed: 'Bond or note proceeds', interfund: 'Transfer from another fund', grant: 'State or federal aid',
  donation: 'Gifts and donations', tax: 'Taxes', fees: 'Fees, charges and other revenue',
}

export type SupplementLine = { account: string; fund: string; name: string; kind: string; actual: number; adopted: number; preliminary?: number | null }
export type Naming = {
  plainAccountName: (account: string, townName: string) => { name: string; known: boolean }
  departmentName: (fund: string, fn: string) => string | null
  FUND_NAMES: Record<string, string>
  isFundWide: (fn: string) => boolean
}
export type FiscalMeeting = { meetingDate: string; resolutions: { number: string | null; title: string; vote?: { adopted: boolean | null } | null; funding?: { accounts?: { code: string; amount: number | null }[] | null } | null }[] }

export type HelperAccount = { code: string; townName: string; plain: string; budget: number; actual: number; proposed: number }
export type HelperDepartment = { key: string; fund: string; fundName: string; name: string; fundWide: boolean; accounts: HelperAccount[]; examples: { number: string; date: string; title: string }[] }
export type HelperRevenue = { code: string; name: string; kind: ReturnType<typeof revenueKind>; budget: number; actual: number }

export function buildHelperData(lines: SupplementLine[], meetings: FiscalMeeting[], n: Naming, year: number) {
  const spending = lines.filter((l) => l.kind === 'expenditure')
  const groups = new Map<string, SupplementLine[]>()
  for (const l of spending) {
    const [fund, , fn] = l.account.split('-')
    const key = `${fund}-${fn}`
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(l)
  }
  // Past statements naming each department's accounts, newest first, as examples.
  const examples = new Map<string, { number: string; date: string; title: string }[]>()
  for (const m of meetings) {
    if (!m.meetingDate.startsWith(`${year}-`)) continue
    for (const r of m.resolutions) {
      if (r.vote?.adopted !== true || !r.number) continue
      const keys = Array.from(new Set((r.funding?.accounts ?? []).filter((a) => a.amount !== null).map((a) => {
        const [fund, , fn] = a.code.split('-')
        return `${fund}-${fn}`
      })))
      for (const k of keys) {
        if (!examples.has(k)) examples.set(k, [])
        examples.get(k)!.push({ number: r.number, date: m.meetingDate, title: r.title })
      }
    }
  }
  const departments: HelperDepartment[] = Array.from(groups.entries()).map(([key, ls]) => {
    const [fund, fn] = key.split('-')
    const named = n.departmentName(fund, fn)
    const town = ls[0].name.split(/\s+-\s*|-\s+/)[0].trim()
    return {
      key, fund, fundName: n.FUND_NAMES[fund] ?? fund,
      name: named ?? `${town} (the Town’s abbreviation)`,
      fundWide: n.isFundWide(fn),
      accounts: ls
        .map((l) => ({ code: l.account, townName: l.name, plain: n.plainAccountName(l.account, l.name).name, budget: l.adopted, actual: l.actual, proposed: l.preliminary ?? 0 }))
        .sort((a, b) => a.code.localeCompare(b.code)),
      examples: (examples.get(key) ?? []).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5),
    }
  }).sort((a, b) => (a.fund === b.fund ? Number(a.fundWide) - Number(b.fundWide) || a.name.localeCompare(b.name) : a.fund.localeCompare(b.fund)))

  // Object codes in use, each with the name the Town most often gives it, for building a new account.
  const objNames = new Map<string, Map<string, number>>()
  for (const l of spending) {
    const obj = l.account.split('-')[3]
    const tail = l.name.split(/\s+-\s*|-\s+/).slice(1).join(' - ').trim() || l.name
    if (!objNames.has(obj)) objNames.set(obj, new Map())
    const m = objNames.get(obj)!
    m.set(tail, (m.get(tail) ?? 0) + 1)
  }
  const objects = Array.from(objNames.entries())
    .map(([code, m]) => ({ code, name: Array.from(m.entries()).sort((x, y) => y[1] - x[1])[0][0] }))
    .sort((x, y) => x.code.localeCompare(y.code))

  const revenue: Record<string, HelperRevenue[]> = {}
  for (const l of lines.filter((x) => x.kind === 'revenue')) {
    ;(revenue[l.fund] ??= []).push({ code: l.account, name: l.name, kind: revenueKind(l.account), budget: l.adopted, actual: l.actual })
  }
  for (const f of Object.keys(revenue)) revenue[f].sort((a, b) => a.code.localeCompare(b.code))
  return { departments, revenue, objects, funds: Array.from(new Set(departments.map((d) => d.fund))).map((f) => ({ code: f, name: n.FUND_NAMES[f] ?? f })) }
}

export type HelperData = ReturnType<typeof buildHelperData>

// ── The statement ─────────────────────────────────────────────────────────────

/** The most journal entries one statement can carry here. */
export const MAX_ENTRIES = 10

export type Row = { code: string; name: string; amount: number; isNew?: boolean }

/**
 * A new spending account, built the way the Town numbers them:
 * FUND-group-FUNCTION-OBJECT-SUBOBJECT-PROJECT, as in H01-1-1940-435-000-12620
 * (Capital Projects Fund, general government, function 1940, object 435
 * professional services, project 12620). The Accounting Department assigns and
 * creates the account; this only drafts the number to ask about.
 */
export function newAccountCode(fund: string, fn: string, object: string, sub: string, project: string): string {
  const group = fn.charAt(0)
  const clean = (v: string, n: number) => (v.replace(/[^0-9A-Za-z]/g, '').toUpperCase() || '0'.repeat(n)).padStart(n, '0').slice(-n)
  return `${fund}-${group}-${fn}-${clean(object, 3)}-${clean(sub, 3)}-${clean(project, 5)}`
}
export type Entry = { action: EntryAction; from: Row[]; to: Row[] }
export type Draft = {
  legislation: string
  title: string
  purpose: string
  period: string
  /** D answered No: no fiscal impact, so E to G are left blank. */
  noImpact?: boolean
  absorbed: boolean
  entries: Entry[]
}

const money = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
export const formatMoney = money
const rowText = (r: Row) => `${r.code} ${r.name}${r.isNew ? ' (new account)' : ''} ${money(r.amount)}`
const fundOf = (code: string) => code.split('-')[0]
const isSpending = (code: string) => /^[A-Z]{1,3}\d{1,2}-\d-\d{4}-/.test(code)
const total = (rs: Row[]) => Math.round(rs.reduce((s, r) => s + (r.amount || 0), 0) * 100) / 100
const filled = (rs: Row[]) => rs.filter((r) => r.code)

export type Tier = { assigned: boolean; purpose: string }

/** The fund-balance line as the Town writes it, with its tier when it is assigned. */
export function fundBalanceRow(fund: string, amount: number, tier: Tier): Row {
  return {
    code: `${fund}-9999-000-00000-0`,
    name: tier.assigned ? `Assigned Unappropriated Fund Balance – ${tier.purpose.trim() || '[purpose]'}` : 'Appropriated Fund Balance',
    amount,
  }
}

export type Check = { level: 'error' | 'warning' | 'ok'; text: string }

function checkEntry(e: Entry, label: string): Check[] {
  const out: Check[] = []
  const add = (ok: boolean, text: string, level: 'error' | 'warning' = 'error') => out.push({ level: ok ? 'ok' : level, text: `${label}${text}` })
  const from = filled(e.from)
  const to = filled(e.to)
  const all = [...from, ...to]
  add(all.length > 0, 'at least one account is chosen. Most statements in the record name no accounts, which leaves the Board and residents unable to see where the money comes from.')
  add(all.length > 0 && all.every((r) => r.amount > 0), 'every account has an amount greater than zero.')
  if (e.action === 'charge') {
    add(to.every((r) => isSpending(r.code)), 'the lines to be charged are spending (appropriation) lines.')
    return out
  }
  add(from.length > 0 && to.length > 0, 'there is at least one FROM line and one TO line.')
  add(from.length > 0 && total(from) === total(to), `the FROM lines (${money(total(from))}) and the TO lines (${money(total(to))}) add up to the same amount.`)
  add(new Set(all.map((r) => fundOf(r.code))).size <= 1, `the lines are in more than one fund (${Array.from(new Set(all.map((r) => fundOf(r.code)))).join(' and ')}). The Town does this for capital projects (2026-843 moved General Fund savings straight to a capital project line); otherwise money moving between funds normally goes through an interfund transfer (object 9901 in the paying fund, revenue 50xx in the receiving one). Confirm with the Accounting Department.`, 'warning')
  add(to.every((r) => isSpending(r.code)), 'the TO lines are spending (appropriation) lines.')
  if (all.some((r) => r.isNew)) out.push({ level: 'warning', text: `${label}it uses a new account (${all.filter((r) => r.isNew).map((r) => r.code).join(', ')}). Naming it in the resolution's budget table is how the Town establishes one, as in 2026-843; the Accounting Department assigns the number, so confirm it before the resolution goes to the Board.` })
  if (e.action === 'transfer') add(from.every((r) => isSpending(r.code)), 'the FROM lines are spending lines: a transfer moves money between appropriations.')
  if (e.action === 'revenue') add(from.every((r) => !isSpending(r.code) && revenueKind(r.code) !== 'savings'), 'the FROM lines are revenue accounts, not fund balance (use “Use savings” for that).')
  if (e.action === 'fund-balance') {
    add(from.every((r) => revenueKind(r.code) === 'savings'), 'the FROM line is the fund’s 9999 account.')
    add(!from.some((r) => r.name.includes('[purpose]')), 'an assigned balance names the purpose it is held for, as the Town writes it (for example “Assigned Unappropriated Fund Balance – CBF - Nextera Easement Phase 1”).')
  }
  return out
}

export function checkDraft(d: Draft): Check[] {
  const checks: Check[] = []
  const add = (ok: boolean, text: string) => checks.push({ level: ok ? 'ok' : 'error', text })
  add(d.title.trim().length > 0, 'B. The title of the legislation is filled in.')
  add(d.purpose.trim().length > 0, 'C. The purpose is filled in.')
  if (d.noImpact || d.absorbed) return checks
  add(d.entries.length > 0, 'There is at least one journal entry.')
  add(d.entries.length <= MAX_ENTRIES, `There are no more than ${MAX_ENTRIES} journal entries.`)
  d.entries.forEach((e, i) => checks.push(...checkEntry(e, d.entries.length > 1 ? `Entry ${i + 1}: ` : '')))
  if (d.entries.some((e) => e.action !== 'charge')) {
    checks.push({ level: 'warning', text: 'Section G and the resolution’s FROM/TO table must carry the same lines and amounts. In 2026-765 section G said $150,000 and the table the Board adopted moved $280,000; this helper writes both from the same lines.' })
  }
  return checks
}

/** The three section G fields, as the Town fills them, gathered from every entry. */
export function sectionG(d: Draft): { charged: Row[]; revenue: Row[]; transfer: Row[] } {
  const g = { charged: [] as Row[], revenue: [] as Row[], transfer: [] as Row[] }
  if (d.noImpact || d.absorbed) return g
  for (const e of d.entries) {
    const from = filled(e.from)
    const to = filled(e.to)
    if (e.action === 'charge') g.charged.push(...to)
    else if (e.action === 'transfer') { g.charged.push(...from); g.transfer.push(...to) }
    else { g.revenue.push(...from); g.transfer.push(...to) }
  }
  return g
}

/** The statement's total: what the TO lines (and the lines charged) of every entry add up to. */
export const statementTotal = (d: Draft) => (d.noImpact || d.absorbed ? 0 : Math.round(d.entries.reduce((s, e) => s + total(filled(e.to)), 0) * 100) / 100)

/** The entries that need a FROM/TO table in the resolution (every kind but a plain charge). */
export const tableEntries = (d: Draft) => (d.noImpact || d.absorbed ? [] : d.entries.filter((e) => e.action !== 'charge').map((e) => ({ from: filled(e.from), to: filled(e.to) })))

/** Sections A to G and the resolution's FROM/TO table, as text to paste. */
export function writeStatement(d: Draft): { sections: string; table: string | null } {
  const lines: string[] = []
  lines.push(`A. Type of Legislation: ${d.legislation}`)
  lines.push(`B. Title of Proposed Legislation: ${d.title.trim()}`)
  lines.push(`C. Purpose of Proposed Legislation: ${d.purpose.trim()}`)
  lines.push(`D. Will the Proposed Legislation have a Fiscal Impact: ${d.noImpact ? 'No' : 'Yes'}`)
  if (d.noImpact) return { sections: lines.join('\n'), table: null }
  if (d.absorbed) {
    lines.push('E. (a) The fiscal impact can be absorbed by Town/Department existing resources set forth in approved Town Annual Budget. Detail/Initials: ______')
    lines.push('F. and G.: skipped, as E(a) directs.')
    return { sections: lines.join('\n'), table: null }
  }
  lines.push('E. (b) The description/explanation of fiscal impact is set forth as follows:')
  lines.push(`F. Total Financial Cost of Funding over ${d.period.trim() || '[period]'}: ${money(statementTotal(d))}`)
  const g = sectionG(d)
  const list = (rs: Row[]) => rs.map(rowText).join('; ')
  lines.push('G. Proposed Source of Funding:')
  lines.push(`   Appropriation Account to be Charged: ${list(g.charged)}`)
  lines.push(`   Grant or other Revenue Source: ${list(g.revenue)}`)
  lines.push(`   Appropriation Transfer (list account(s) and amount): ${list(g.transfer)}`)
  const blocks = tableEntries(d)
  if (blocks.length === 0) return { sections: lines.join('\n'), table: null }
  const rows = blocks.flatMap((e) => [...e.from, ...e.to])
  const width = Math.max(...rows.map((r) => `${r.code} ${r.name}${r.isNew ? ' (new account)' : ''}`.length), 20)
  const pad = (r: Row) => `${`${r.code} ${r.name}${r.isNew ? ' (new account)' : ''}`.padEnd(width)}  ${money(r.amount)}`
  const table = blocks.map((e, i) => [
    ...(blocks.length > 1 ? [`Entry ${i + 1}`] : []),
    'FROM', ...e.from.map(pad), 'TO', ...e.to.map((r) => `        ${pad(r)}`),
  ].join('\n')).join('\n\n')
  return { sections: lines.join('\n'), table }
}

// ── Reconciliation ────────────────────────────────────────────────────────────

export type ReconEntry = { n: number; action: EntryAction; from: number; to: number; balanced: boolean }
/**
 * One account's change to the budget across every entry. An appropriation
 * goes up when it is a TO line and down when a transfer takes from it; an
 * estimated revenue or appropriated fund balance goes up when it funds a
 * budget adjustment. A line only charged (no budget change) shows as charged.
 */
export type ReconAccount = { code: string; name: string; fund: string; side: 'appropriation' | 'revenue' | 'fund balance'; change: number; charged: number; entries: number[]; isNew?: boolean }
/** Per fund: what appropriations rise by, and what pays for it. Balanced when the two match. */
export type ReconFund = { fund: string; appropriations: number; revenue: number; fundBalance: number; balanced: boolean }

const round2 = (n: number) => Math.round(n * 100) / 100

/**
 * Totals across every journal entry: each entry's FROM and TO, the
 * statement's grand totals, the net change to each account (an account named
 * in two entries is netted), and each fund's change in appropriations against
 * the revenue and savings that pay for it.
 */
export function reconcile(d: Draft): { entries: ReconEntry[]; from: number; to: number; balanced: boolean; accounts: ReconAccount[]; funds: ReconFund[] } {
  const empty = { entries: [], from: 0, to: 0, balanced: true, accounts: [], funds: [] }
  if (d.noImpact || d.absorbed) return empty
  const accounts = new Map<string, ReconAccount>()
  const touch = (r: Row, n: number, side: ReconAccount['side'], change: number, charged: number) => {
    const a = accounts.get(r.code) ?? { code: r.code, name: r.name, fund: fundOf(r.code), side, change: 0, charged: 0, entries: [], isNew: r.isNew }
    a.change = round2(a.change + change)
    a.charged = round2(a.charged + charged)
    if (!a.entries.includes(n)) a.entries.push(n)
    accounts.set(r.code, a)
  }
  const entries: ReconEntry[] = d.entries.map((e, i) => {
    const n = i + 1
    const from = filled(e.from)
    const to = filled(e.to)
    if (e.action === 'charge') {
      for (const r of to) touch(r, n, 'appropriation', 0, r.amount || 0)
      return { n, action: e.action, from: 0, to: total(to), balanced: true }
    }
    for (const r of from) {
      if (isSpending(r.code)) touch(r, n, 'appropriation', -(r.amount || 0), 0)
      else touch(r, n, revenueKind(r.code) === 'savings' ? 'fund balance' : 'revenue', r.amount || 0, 0)
    }
    for (const r of to) touch(r, n, 'appropriation', r.amount || 0, 0)
    return { n, action: e.action, from: total(from), to: total(to), balanced: from.length > 0 && to.length > 0 && total(from) === total(to) }
  })
  const list = Array.from(accounts.values()).sort((a, b) => a.fund.localeCompare(b.fund) || (a.side === b.side ? 0 : a.side === 'appropriation' ? 1 : -1) || a.code.localeCompare(b.code))
  const funds = new Map<string, ReconFund>()
  for (const a of list) {
    const f = funds.get(a.fund) ?? { fund: a.fund, appropriations: 0, revenue: 0, fundBalance: 0, balanced: true }
    if (a.side === 'appropriation') f.appropriations = round2(f.appropriations + a.change)
    else if (a.side === 'revenue') f.revenue = round2(f.revenue + a.change)
    else f.fundBalance = round2(f.fundBalance + a.change)
    funds.set(a.fund, f)
  }
  for (const f of Array.from(funds.values())) f.balanced = round2(f.revenue + f.fundBalance) === f.appropriations
  const nonCharge = entries.filter((e) => e.action !== 'charge')
  const fromAll = round2(nonCharge.reduce((s, e) => s + e.from, 0))
  const toAll = round2(nonCharge.reduce((s, e) => s + e.to, 0))
  return { entries, from: fromAll, to: toAll, balanced: entries.every((e) => e.balanced), accounts: list, funds: Array.from(funds.values()) }
}
