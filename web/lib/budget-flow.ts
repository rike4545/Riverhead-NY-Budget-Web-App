// Where the 2027 Preliminary budget's money comes from and goes, for
// /budget-flow/: revenue by kind, into each fund, out by function. Every
// figure is a line of the 2027 Preliminary Budget book
// (budget-2027-preliminary-lines.json, written by parse_preliminary_lines.py
// and reconciled there to the book's summary). Nothing is typed by hand but
// the groupings, which follow the State Comptroller's chart of accounts for
// towns: a revenue account's first digits give its kind, and a spending
// account's function code gives its purpose.

import linesJson from '../public/data/budget-2027-preliminary-lines.json'
import { allOperatingFunds2026 } from './all-funds'

type Line = { account: string; fund: string; kind: 'expenditure' | 'revenue'; name: string; preliminary: number | null }
const book = linesJson as unknown as { year: number; source: { title: string; url: string }; reconciliation: { preliminaryTotal: number; preliminarySummaryTotal: number }; lines: Line[] }
export const flowYear = book.year
export const flowSource = book.source
export const flowTotal = book.reconciliation.preliminarySummaryTotal

/** A revenue account's kind, from its source code (the second segment): 1001 property taxes, 5031 transfers, 599 savings. */
export function revenueKind(account: string): string {
  const code = account.split('-')[1] ?? ''
  const two = Number(code.slice(0, 2))
  if (code.startsWith('1001')) return 'Property taxes'
  if (two === 10) return 'PILOTs and tax penalties'
  if (two === 11) return 'Sales, franchise and other taxes'
  if (two >= 12 && two <= 23) return 'Fees, charges, sewer and water rents'
  if (two >= 24 && two <= 26) return 'Interest, rents, permits and fines'
  if (two >= 27 && two <= 29) return 'Charges to other funds, other income'
  if (two >= 30 && two <= 49) return 'State and federal aid'
  if (two === 50) return 'Transfers from other funds'
  if (two === 99) return 'Savings (appropriated fund balance)'
  return 'Other revenue'
}

/** A spending account's purpose, from its function code (the third segment). */
export function spendingPurpose(account: string): string {
  const fn = account.split('-')[2] ?? ''
  if (fn.startsWith('97')) return 'Debt payments'
  if (fn.startsWith('99')) return 'Transfers to other funds'
  if (fn.startsWith('90') || fn.startsWith('91')) return 'Employee benefits'
  const map: Record<string, string> = {
    '1': 'General government', '3': 'Public safety (police, fire, code)', '4': 'Health', '5': 'Highways and transportation',
    '6': 'Economic assistance', '7': 'Parks, recreation and culture', '8': 'Water, sewer, sanitation and planning',
  }
  return map[fn[0]] ?? 'Other spending'
}

const fundName = (code: string) => allOperatingFunds2026.find((f) => f.code === code)?.name ?? code
/** Funds of at least this much are shown on their own; the rest are grouped. */
const OWN_FUND = 2_000_000

export type FlowNode = { id: string; label: string; column: 0 | 1 | 2; value: number }
export type FlowLink = { from: string; to: string; value: number }

export const flow = (() => {
  const lines = book.lines.filter((l) => (l.preliminary ?? 0) !== 0)
  const fundTotals = new Map<string, number>()
  for (const l of lines) if (l.kind === 'expenditure') fundTotals.set(l.fund, (fundTotals.get(l.fund) ?? 0) + (l.preliminary ?? 0))
  const small = Array.from(fundTotals.entries()).filter(([, v]) => v < OWN_FUND).map(([k]) => k)
  const fundKey = (f: string) => (small.includes(f) ? 'fund:other' : `fund:${f}`)
  const links = new Map<string, number>()
  const add = (from: string, to: string, v: number) => links.set(`${from}|${to}`, (links.get(`${from}|${to}`) ?? 0) + v)
  for (const l of lines) {
    const v = l.preliminary ?? 0
    if (l.kind === 'revenue') add(`rev:${revenueKind(l.account)}`, fundKey(l.fund), v)
    else add(fundKey(l.fund), `use:${spendingPurpose(l.account)}`, v)
  }
  const linkList: FlowLink[] = Array.from(links.entries()).map(([k, value]) => { const [from, to] = k.split('|'); return { from, to, value } })
  const total = (id: string, side: 'from' | 'to') => linkList.filter((l) => l[side] === id).reduce((s, l) => s + l.value, 0)
  const ids = Array.from(new Set(linkList.flatMap((l) => [l.from, l.to])))
  const nodes: FlowNode[] = ids.map((id) => {
    const column = id.startsWith('rev:') ? 0 : id.startsWith('fund:') ? 1 : 2
    const label = id === 'fund:other' ? `${small.length} smaller funds` : id.startsWith('fund:') ? fundName(id.slice(5)) : id.split(':')[1]
    return { id, label, column: column as 0 | 1 | 2, value: column === 0 ? total(id, 'from') : total(id, 'to') }
  })
  nodes.sort((a, b) => a.column - b.column || (a.id === 'fund:other' ? 1 : b.id === 'fund:other' ? -1 : b.value - a.value))
  return { nodes, links: linkList, smallFunds: small.map(fundName) }
})()

/** Totals that must match the book: revenue in, spending out. */
export const revenueTotal = flow.nodes.filter((n) => n.column === 0).reduce((s, n) => s + n.value, 0)
export const spendingTotal = flow.nodes.filter((n) => n.column === 2).reduce((s, n) => s + n.value, 0)
