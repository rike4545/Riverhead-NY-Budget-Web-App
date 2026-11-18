// Who signed the Fiscal Impact Statements, and whether the signed ones are
// read as more accurate than the unsigned ones.
//
// etl/parse_fiscal_impact.py reads sections H to M of every statement and
// keeps only whether the preparer (J) and the Accounting Office (M) dated it.
// A dated block shows someone signed; it does not show how closely they read.
// "Understates" is this site's realistic read (flag understated or
// reserve-draw), not an audit finding.
//
// No imports, so scripts/verify-fiscal-signoff.mjs can load it directly.

export type SignoffResolution = {
  category: string
  realistic: { flag: string }
  signoff?: { preparerDated: boolean; accountingDated: boolean } | null
}
export type SignoffMeeting = { meetingDate: string; resolutions: SignoffResolution[] }

const understates = (r: SignoffResolution) => r.realistic.flag === 'understated' || r.realistic.flag === 'reserve-draw'

export type Split = { signed: number; signedWrong: number; unsigned: number; unsignedWrong: number; z: number | null }

/** Error rates for statements the Accounting Office dated and those it did not, with a two-proportion z score. */
export function split(rows: SignoffResolution[]): Split {
  const read = rows.filter((r) => r.signoff)
  const s = read.filter((r) => r.signoff!.accountingDated)
  const u = read.filter((r) => !r.signoff!.accountingDated)
  const sw = s.filter(understates).length
  const uw = u.filter(understates).length
  let z: number | null = null
  if (s.length && u.length) {
    const p = (sw + uw) / (s.length + u.length)
    const se = Math.sqrt(p * (1 - p) * (1 / s.length + 1 / u.length))
    z = se ? (sw / s.length - uw / u.length) / se : null
  }
  return { signed: s.length, signedWrong: sw, unsigned: u.length, unsignedWrong: uw, z }
}

/** The categories the page breaks out: where most of the understated forms are. */
export const SIGNOFF_CATEGORIES = [
  { id: 'personnel', label: 'Hiring and pay' },
  { id: 'contract', label: 'Contracts' },
  { id: 'capital', label: 'Purchases, projects and budget transfers' },
] as const

export function signoffReport(meetings: SignoffMeeting[]) {
  const all = meetings.flatMap((m) => m.resolutions)
  const read = all.filter((r) => r.signoff)
  return {
    statements: all.length,
    read: read.length,
    accountingDated: read.filter((r) => r.signoff!.accountingDated).length,
    preparerDated: read.filter((r) => r.signoff!.preparerDated).length,
    overall: split(all),
    byCategory: SIGNOFF_CATEGORIES.map((c) => ({ ...c, ...split(all.filter((r) => r.category === c.id)) })),
    byMeeting: [...meetings]
      .sort((a, b) => (a.meetingDate < b.meetingDate ? 1 : -1))
      .map((m) => {
        const r = m.resolutions.filter((x) => x.signoff)
        return {
          date: m.meetingDate,
          statements: m.resolutions.length,
          read: r.length,
          accountingDated: r.filter((x) => x.signoff!.accountingDated).length,
          preparerDated: r.filter((x) => x.signoff!.preparerDated).length,
          understated: m.resolutions.filter(understates).length,
        }
      }),
  }
}
