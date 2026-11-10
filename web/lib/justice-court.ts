// The plan to turn the former Town Hall at 200 Howell Avenue into the Town
// Justice Court, for /justice-court/: the Board's resolutions, the $6.5 million
// bond, what the records do not yet show, and the grant programs that could
// help. justice-court.json is hand-curated and quotes each record;
// web/scripts/verify-justice-court.mjs checks the quotes against the minutes
// and packets the repository keeps.

import json from '../public/data/justice-court.json'

export type SourceKind = 'town' | 'law' | 'state' | 'news'
export type CourtSource = { kind: SourceKind; title: string; url: string }
export type CourtStep = { step: string; date: string | null; done: boolean; note: string }
export type Grant = { name: string; agency: string; fit: string; townHistory: string; status: string; sources: CourtSource[] }
type File = {
  asOf: string
  recordsThrough: string
  bond: { resolution: string; date: string; vote: string; url: string; pages: string; amount: number; purpose: string; repayment: string; usefulLife: string; referendum: string }
  steps: CourtStep[]
  quotes: { id: string; text: string; resolution: string; file: string }[]
  condition: { point: string; source: CourtSource }[]
  meanwhile: { resolution: string; date: string; url: string; pages: string; amount: number }
  grants: Grant[]
  timeline: { date: string; what: string; source: CourtSource }[]
  questions: string[]
}

const data = json as unknown as File
export const courtAsOf = data.asOf
export const recordsThrough = data.recordsThrough
export const bond = data.bond
export const steps = data.steps
export const condition = data.condition
export const meanwhile = data.meanwhile
export const grants = data.grants
export const timeline = data.timeline
export const questions = data.questions

/** A quoted passage from a Town resolution, by id. */
export const quote = (id: string) => {
  const q = data.quotes.find((x) => x.id === id)
  if (!q) throw new Error(`justice-court.json has no quote "${id}"`)
  return q
}

export const kindLabel: Record<SourceKind, string> = { town: 'Town record', law: 'State law', state: 'State agency', news: 'News report' }

export const usd = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

/** "October 7, 2025", "October 2023" for a month, or a bare year. */
export function longDate(d: string): string {
  if (/^\d{4}$/.test(d)) return d
  if (/^\d{4}-\d{2}$/.test(d)) return new Date(`${d}-15T12:00:00`).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  return new Date(`${d}T12:00:00`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}
