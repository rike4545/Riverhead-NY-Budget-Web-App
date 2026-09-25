// The Town's Budget Supplements, read line by line across every year the
// site has them. Written by etl/parse_supplement_history.py from the eight
// committed Supplements (2020 through 2027):
//
//   line-history.json    every expenditure account: actual, adopted and
//                        mid-year spending by year, and the newest request and
//                        Tentative
//   current-lines.json   the newest Supplement, every line, with the previous
//                        Supplement's columns beside it
//
// Nothing here is typed in by hand. A page that quotes a line's budget or
// actual reads it from these files, so the figure is the Town's own.

import lineHistoryJson from '../public/data/budget-supplement/line-history.json'
import currentJson from '../public/data/budget-supplement/current-lines.json'

export type YearMap = Record<string, number>

export type LineHistory = {
  account: string
  fund: string
  name: string
  page: number | null
  actual: YearMap
  adopted: YearMap
  ytd: YearMap
  request: number | null
  tentative: number | null
}

export type CurrentLine = {
  account: string
  fund: string
  name: string
  kind: 'expenditure' | 'revenue'
  control: 'mandated' | 'personnel' | 'controllable' | 'revenue'
  page: number | null
  actual: number | null
  adopted: number | null
  ytd: number | null
  request: number | null
  tentative: number | null
  priorActual: number | null
  priorAdopted: number | null
  priorYtd: number | null
}

type LineHistoryFile = { supplementYears: number[]; budgetYear: number; actualYears: number[]; adoptedYears: number[]; accounts: LineHistory[] }
type CurrentFile = {
  supplementYear: number
  columns: { actual: number; adopted: number; ytd: number; request: number; tentative: number; priorActual: number; priorAdopted: number; priorYtd: number }
  source: { title: string; url: string } | null
  reconciliation: { complete: boolean; gap?: number }
  lines: CurrentLine[]
}

const history = lineHistoryJson as unknown as LineHistoryFile
export const current = currentJson as unknown as CurrentFile

/** The year the newest Supplement budgets, and the years its columns cover. */
export const budgetYear = current.supplementYear
export const columns = current.columns
export const supplementSource = current.source
export const supplementYears = history.supplementYears
export const actualYears = history.actualYears

const byAccount = new Map(history.accounts.map((a) => [a.account, a]))

/** Every expenditure account the Supplements have carried, with its full record. */
export const expenditureHistory: LineHistory[] = history.accounts

/** One account, or every account under a prefix ending in "-" (a department). */
function matching(spec: string): LineHistory[] {
  if (spec.endsWith('-')) return history.accounts.filter((a) => a.account.startsWith(spec))
  const one = byAccount.get(spec)
  return one ? [one] : []
}

export type Figures = {
  accounts: string[]
  name: string
  page: number | null
  /** Sum across the matched accounts; null when no matched account has the year. */
  actual: (year: number) => number | null
  adopted: (year: number) => number | null
  ytd: (year: number) => number | null
  request: number | null
  tentative: number | null
}

const sumYear = (rows: LineHistory[], field: 'actual' | 'adopted' | 'ytd', year: number): number | null => {
  const vals = rows.map((r) => r[field][String(year)]).filter((v): v is number => typeof v === 'number')
  return vals.length ? vals.reduce((s, v) => s + v, 0) : null
}

/** A line's (or a department's) figures for any year the Supplements cover. */
export function figures(specs: string[]): Figures {
  const rows = specs.flatMap(matching)
  if (rows.length === 0) throw new Error(`No Supplement line matches ${specs.join(', ')}`)
  const sumLatest = (field: 'request' | 'tentative') => {
    const vals = rows.map((r) => r[field]).filter((v): v is number => typeof v === 'number')
    return vals.length ? vals.reduce((s, v) => s + v, 0) : null
  }
  return {
    accounts: rows.map((r) => r.account),
    name: rows.length === 1 ? rows[0].name : `${rows.length} lines`,
    page: rows[0].page,
    actual: (y) => sumYear(rows, 'actual', y),
    adopted: (y) => sumYear(rows, 'adopted', y),
    ytd: (y) => sumYear(rows, 'ytd', y),
    request: sumLatest('request'),
    tentative: sumLatest('tentative'),
  }
}

/** Every line of the newest Supplement matching a test. */
export const lines = (test: (l: CurrentLine) => boolean) => current.lines.filter(test)

export type CurrentField = 'actual' | 'adopted' | 'ytd' | 'request' | 'tentative' | 'priorActual' | 'priorAdopted' | 'priorYtd'

export const total = (rows: CurrentLine[], field: CurrentField) =>
  rows.reduce((s, r) => s + (r[field] ?? 0), 0)

/** Object code (the fourth segment) of an expenditure account: 101 is full-time pay. */
export const objectCode = (account: string) => account.split('-')[3] ?? ''
/** Function code (the third segment): 1420 is the Town Attorney. */
export const functionCode = (account: string) => account.split('-')[2] ?? ''

export const usd = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

export const pct = (n: number, digits = 0) => `${n >= 0 ? '+' : '−'}${Math.abs(n * 100).toFixed(digits)}%`
