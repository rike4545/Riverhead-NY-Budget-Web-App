// What is already set for 2027 pay, person by person where a contract or a
// public notice sets it, for the Payroll page's "Raises 2026 → 2027" section.
//
// Per-person 2027 salaries are set by the Board's salary resolution at its
// January 2027 organizational meeting, so none is official yet. What the record
// does fix:
//   - CSEA: the executed 2026–2029 agreement, Article 15(2), raises every step
//     of the salary schedule 2.5% and then adds $1,000 in 2027 (the same terms
//     etl/predict_2027.py uses). Applied to each person's 2026 authorized salary,
//     that is the schedule increase; moving up a step adds more for anyone not
//     at the top, so it is the least a CSEA member's base should rise.
//   - PBA and SOA: both agreements expire December 31, 2026 and no successor has
//     come before the Board (labor-contracts-2027.ts). Under the Triborough
//     Amendment the 2026 schedule stands and step movement continues.
//   - Elected officials: the public notice of the November 5, 2026 budget
//     hearing, attached to Resolution 2026-923, proposes every 2027 salary at
//     its 2026 amount.
//   - Everyone else (managers, appointees, part-time): set in January.
//
// Union membership comes from the latest payroll export, matched by name
// (surname and first given name, used only where the match is unique), because
// the authorized-salary listing does not say which unit a title is in.
//
// No JSON imports: the page passes the data in, so verify-raises-2027.mjs can
// run the same arithmetic under Node.

export const CSEA_2027 = { pct: 0.025, flat: 1_000, source: '2026–2029 CSEA agreement (Article 15(2), Wages), which the Board approved December 16, 2025 (Resolution 2025-1001),' } as const

export const ELECTED_2027 = {
  source: 'public notice of the November 5, 2026 budget hearing, attached to Resolution 2026-923 (October 6, 2026)',
  rows: [
    { position: 'Town Supervisor', y2026: 118_919, y2027: 118_919, note: 'The notice adds that the Supervisor reduced his actual salary to $110,000 in 2026.' },
    { position: 'Town Council (4)', y2026: 50_558, y2027: 50_558 },
    { position: 'Town Justice (2)', y2026: 96_872, y2027: 96_872 },
    { position: 'Tax Receiver', y2026: 96_085, y2027: 96_085 },
    { position: 'Assessor Chair', y2026: 110_663, y2027: 110_663 },
    { position: 'Assessors (2)', y2026: 96_085, y2027: 96_085 },
    { position: 'Town Clerk', y2026: 96_085, y2027: 96_085 },
    { position: 'Town Clerk stipend, as Registrar of Vital Statistics', y2026: 5_000, y2027: 5_000 },
    { position: 'Superintendent of Highways', y2026: 107_967, y2027: 107_967 },
  ],
} as const

export type Authorized = { name: string; title: string; department: string; group: string; annual: number | null; isStipend: boolean }
export type PayrollRow = { y: number; n: string; u: string }

export type CseaRaise = { name: string; title: string; department: string; y2026: number; y2027: number; raise: number; pct: number }

const nameKey = (n: string) => {
  const [last, rest = ''] = n.split(',')
  return `${last.toLowerCase().replace(/[^a-z]/g, '')}|${rest.trim().split(/\s+/)[0]?.toLowerCase() ?? ''}`
}

/** The 2027 CSEA schedule increase on one 2026 salary. */
export const cseaFloor = (annual: number) => Math.round((annual * (1 + CSEA_2027.pct) + CSEA_2027.flat) * 100) / 100

export function raises2027(authorized: Authorized[], payroll: PayrollRow[]) {
  const latest = Math.max(...payroll.map((r) => r.y))
  // The union each name was last paid under, in the latest two payroll years.
  // Two people who share a surname and first name, in different units, match
  // neither.
  const unions = new Map<string, { y: number; u: Set<string> }>()
  for (const r of payroll) {
    if (r.y < latest - 1) continue
    const k = nameKey(r.n)
    const seen = unions.get(k)
    if (!seen || r.y > seen.y) unions.set(k, { y: r.y, u: new Set([r.u]) })
    else if (r.y === seen.y) seen.u.add(r.u)
  }
  const unionOf = (n: string) => {
    const u = unions.get(nameKey(n))?.u
    return u && u.size === 1 ? Array.from(u)[0] : null
  }
  // A stipend is not a salary on the schedule; some are listed without the flag
  // ("License Stipend"), so the title counts too.
  const counted = authorized.filter((a) => !a.isStipend && !/stipend/i.test(a.title) && (a.annual ?? 0) > 0 && a.group !== 'Elected Officials')
  const csea: CseaRaise[] = counted
    .filter((a) => unionOf(a.name) === 'CSE')
    .map((a) => {
      const y2026 = a.annual!
      const y2027 = cseaFloor(y2026)
      return { name: a.name, title: a.title, department: a.department, y2026, y2027, raise: y2027 - y2026, pct: (y2027 / y2026 - 1) * 100 }
    })
    .sort((a, b) => b.pct - a.pct || a.name.localeCompare(b.name))
  const police = counted.filter((a) => ['PBA', 'SOA'].includes(unionOf(a.name) ?? ''))
  const unmatched = counted.filter((a) => unionOf(a.name) === null)
  const others = counted.length - csea.length - police.length - unmatched.length
  const sorted = [...csea].sort((a, b) => a.raise - b.raise)
  const median = sorted.length ? sorted[Math.floor(sorted.length / 2)] : null
  return {
    payrollYear: latest,
    listed: counted.length,
    csea,
    cseaTotal: csea.reduce((s, r) => s + r.raise, 0),
    cseaMedian: median,
    cseaPctRange: csea.length ? [Math.min(...csea.map((r) => r.pct)), Math.max(...csea.map((r) => r.pct))] as const : null,
    pba: police.filter((a) => unionOf(a.name) === 'PBA').length,
    soa: police.filter((a) => unionOf(a.name) === 'SOA').length,
    others,
    unmatched: unmatched.length,
  }
}
