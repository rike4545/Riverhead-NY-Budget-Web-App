// Grants and categorical aid the Town received since 2018, for /grants/.
// grants-received.json is written by etl/build_grants.py from the State
// Comptroller's data and the Federal Audit Clearinghouse; grants-awards.json is
// hand-curated from Town Board resolutions, each entry quoting its resolution.

import receivedJson from '../public/data/grants-received.json'
import awardsJson from '../public/data/grants-awards.json'

type Account = { code: string; name: string; level: 'State Aid' | 'Federal Aid'; category: string; amount: number; purpose?: string }
export type GrantYear = {
  year: number; state: number; federal: number; total: number; generalAid: number
  byPurpose: Record<string, number>; accounts: Account[]; general: Account[]; snapshot: string
}
type FederalAward = { reference: string; listing: string; program: string; amount: number; direct: boolean; passThrough: string | null; passThroughId: string | null }
type SingleAudit = { year: number; reportId: string; accepted: string; total: number; awards: FederalAward[] }
export type GrantAward = {
  date: string; resolution: string; grant: string; grantor: string; kind: 'award' | 'allocation' | 'agreement'
  award: number | null; awardNote?: string; match: string; matchPercent: number | null; matchQuote?: string
  received?: number | string; receivedNote?: string; quote: string
}

const received = receivedJson as unknown as { sources: Record<string, { title: string; url: string }>; years: GrantYear[]; singleAudits: SingleAudit[] }
const awardsFile = awardsJson as unknown as { since: string; awards: GrantAward[] }

export const grantSources = received.sources
export const grantYears = received.years
export const singleAudits = received.singleAudits
export const awards = awardsFile.awards
export const awardsSince = awardsFile.since

export const totalReceived = grantYears.reduce((s, y) => s + y.total, 0)
export const firstYear = grantYears[0]
export const lastYear = grantYears[grantYears.length - 1]

/** Every purpose's total across all years, largest first. */
export const purposeTotals = Object.entries(
  grantYears.reduce<Record<string, number>>((acc, y) => {
    for (const [k, v] of Object.entries(y.byPurpose)) acc[k] = (acc[k] ?? 0) + v
    return acc
  }, {}),
).sort((a, b) => b[1] - a[1])

/** How the awards' cost share breaks down: none, a stated share, or not stated. */
export const matchSummary = {
  none: awards.filter((a) => a.matchPercent === 0).length,
  stated: awards.filter((a) => (a.matchPercent ?? 0) > 0),
  notStated: awards.filter((a) => a.matchPercent == null).length,
}
export const awardedTotal = awards.reduce((s, a) => s + (a.award ?? 0), 0)

export const kindLabel: Record<GrantAward['kind'], string> = {
  award: 'Grant award',
  allocation: 'State formula aid',
  agreement: 'County agreement',
}
