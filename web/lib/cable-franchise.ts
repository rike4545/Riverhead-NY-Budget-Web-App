// Riverhead's cable television franchise with Optimum (formerly Cablevision)
// and the question of a competing provider such as Verizon, for
// /cable-franchise/. cable-franchise.json is hand-curated: the 2016 terms are
// quoted from the Town Board minutes, the law from the U.S. Code, and the
// revenue from the Budget Supplement data the site already publishes.
// web/scripts/verify-cable-franchise.mjs checks the revenue against that data.

import json from '../public/data/cable-franchise.json'

export type SourceKind = 'town' | 'law' | 'news'
export type CableSource = { kind: SourceKind; title: string; url: string }
type File = {
  asOf: string
  recordsSearched: string
  franchise: {
    operator: string; resolution: string; adopted: string; vote: string; minutesUrl: string; hearing: string; hearingUrl: string
    term: string; endNote: string; terms: { topic: string; quote: string }[]; speakers: Record<string, string>
  }
  revenue: { account: string; name: string; note: string; actual: Record<string, number>; adopted2026: number; preliminary2027: number; source: string }
  law: { topic: string; cite: string; url: string; quote: string }[]
  verizon: { date: string; point: string; source: CableSource }[]
  verizonNow: string
  channels: { date: string; point: string; source: CableSource }
  questions: string[]
}

const data = json as unknown as File
export const cableAsOf = data.asOf
export const recordsSearched = data.recordsSearched
export const franchise = data.franchise
export const revenue = data.revenue
export const law = data.law
export const verizon = data.verizon
export const verizonNow = data.verizonNow
export const channels = data.channels
export const questions = data.questions

/** Revenue by year: actuals, then the 2026 adopted and 2027 Preliminary budgets. */
export const revenueRows = [
  ...Object.entries(revenue.actual).map(([year, value]) => ({ year, value, kind: 'Actual' as const })),
  { year: '2026', value: revenue.adopted2026, kind: 'Adopted budget' as const },
  { year: '2027', value: revenue.preliminary2027, kind: 'Preliminary budget' as const },
]

export const usd = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

export function longDate(d: string): string {
  return new Date(`${d}T12:00:00`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

export const kindLabel: Record<SourceKind, string> = { town: 'Town record', law: 'Federal law', news: 'News report' }
