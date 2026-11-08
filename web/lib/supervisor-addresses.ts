// State of the Town and inaugural addresses by Riverhead's Supervisors, for
// /state-of-the-town/. supervisor-addresses.json is hand-curated: each entry
// names its sources and marks each as a Town record, news, video or a machine
// transcript. web/scripts/verify-supervisor-addresses.mjs checks it.

import json from '../public/data/supervisor-addresses.json'

export type SourceKind = 'town' | 'news' | 'video' | 'transcript'
export type AddressSource = { kind: SourceKind; title: string; url: string }
export type AddressEvent = { date: string; where: string | null; summary: string; sources: AddressSource[] }
export type SupervisorRecord = {
  name: string; party: string; term: string
  inauguration: AddressEvent; addresses: AddressEvent[]; gaps: string[]
  /** Years this site has a sourced swearing-in for, and years with a sourced State of the Town address. */
  inaugurationYears: number[]; addressYears: number[]
}
type LawItem = { text: string; cite: string; url: string }
type File = {
  asOf: string; termNote: string
  law: { governor: LawItem; townReport: LawItem; finding: string }
  format: { before2018: string; change2018: string; source: AddressSource }
  supervisors: SupervisorRecord[]
}

const data = json as unknown as File
export const addressesAsOf = data.asOf
export const addressLaw = data.law
export const addressFormat = data.format
export const supervisors = data.supervisors
export const termNote = data.termNote

export const kindLabel: Record<SourceKind, string> = {
  town: 'Town record', news: 'News coverage', video: 'Video', transcript: 'Machine transcript',
}

/** The calendar year of a "YYYY-MM-DD" or "YYYY-MM" date. */
const yearOf = (d: string) => Number(d.slice(0, 4))

export type YearMark = { year: number; supervisor: string; inaugural: boolean; address: boolean }

/** One row per year from the first Supervisor's start through the as-of year, marking an inauguration and a State of the Town address. */
export function yearMarks(): YearMark[] {
  const first = yearOf(supervisors[0].inauguration.date)
  const last = yearOf(addressesAsOf)
  const marks: YearMark[] = []
  for (let year = first; year <= last; year++) {
    const s = [...supervisors].reverse().find((x) => yearOf(x.inauguration.date) <= year)!
    marks.push({ year, supervisor: s.name, inaugural: s.inaugurationYears.includes(year), address: s.addressYears.includes(year) })
  }
  return marks
}

export const addressCount = yearMarks().filter((m) => m.address).length
export const yearsWithout = yearMarks().filter((m) => !m.address).map((m) => m.year)

/** "April 10, 2018", or "February 2010" for a month-only date. */
export function longDate(d: string): string {
  if (d.length === 7) return new Date(`${d}-15T12:00:00`).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  return new Date(`${d}T12:00:00`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}
