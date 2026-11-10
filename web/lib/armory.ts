// The former New York State Armory at 1405 Old Country Road, for /armory/:
// the 2011 State law that gave it to the Town, the 2025-26 bill that would let
// the Town lease it to the YMCA, and what the Town Board has done. armory.json
// is hand-curated and quotes each record; web/scripts/verify-armory.mjs checks
// the quotes against the minutes and packets the repository keeps.

import json from '../public/data/armory.json'

export type SourceKind = 'town' | 'law' | 'news'
export type ArmorySource = { kind: SourceKind; title: string; url: string }
export type TimelineItem = { date: string; what: string; source: ArmorySource }
export type BillStep = { step: string; date: string | null; done: boolean; note: string }
type File = {
  asOf: string
  property: { name: string; address: string; acres: string; acresSource: string; building: string; buildingSource: string }
  law2011: { chapter: string; bill: string; signed: string; url: string; conveyance: string; section4: string }
  bill2026: { numbers: string; sponsors: string; url: string; senateUrl: string; section4: string; effective: string; steps: BillStep[]; earlierTry: string }
  loi: { resolution: string; date: string; url: string; pages: string; signedNote: string; terms: { topic: string; quote: string }[] }
  timeline: TimelineItem[]
  quotes: { id: string; text: string; resolution: string; file: string }[]
  news: { outlet: string; date: string; url: string; point: string }[]
  discrepancies: string[]
  questions: string[]
}

const data = json as unknown as File
export const armoryAsOf = data.asOf
export const property = data.property
export const law2011 = data.law2011
export const bill = data.bill2026
export const loi = data.loi
export const timeline = data.timeline
export const news = data.news
export const discrepancies = data.discrepancies
export const questions = data.questions

/** A quoted passage from a Town resolution, by id. */
export const quote = (id: string) => {
  const q = data.quotes.find((x) => x.id === id)
  if (!q) throw new Error(`armory.json has no quote "${id}"`)
  return q
}

export const kindLabel: Record<SourceKind, string> = { town: 'Town record', law: 'State law', news: 'News report' }

/** "August 31, 2011"; a bare year is returned as is. */
export function longDate(d: string): string {
  if (/^\d{4}$/.test(d)) return d
  return new Date(`${d}T12:00:00`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}
