// The Supervisor's office roles in Riverhead and their counterparts in other
// towns, for /supervisor-office-pay/.
//
// Riverhead's office has five titles held by four people in 2026: the
// Supervisor, the Deputy Supervisor, a Chief of Staff who is also the Town
// Budget Officer (Resolution 2026-59; one salary, listed under Town Budget
// Officer), and a Legislative Aide listed in the salary schedule as Secretary
// (Resolution 2026-58). Riverhead's salaries come from the 2026 salary
// schedule (authorized-2026.json); the peers' from their own records, quoted in
// public/data/salary/peer-supervisor-offices.json.
//
// Towns organize these offices differently, so a "counterpart" is the title
// doing the same job, and the page says where there is none. Base salaries
// only. No imports: scripts/verify-supervisor-office-pay.mjs runs this too.

export type RoleKey = 'supervisor' | 'deputy' | 'chief' | 'budget' | 'aide'

export const ROLES: { key: RoleKey; label: string; riverheadTitle: string; what: string }[] = [
  { key: 'supervisor', label: 'Supervisor', riverheadTitle: 'Town Supervisor', what: 'The elected head of town government, its chief fiscal officer, and a voting member of the Town Board.' },
  { key: 'deputy', label: 'Deputy Supervisor', riverheadTitle: 'Deputy Town Supervisor', what: 'Acts for the Supervisor when the Supervisor is absent. Some towns make it a full-time job; others give a stipend to a part-time appointee or a Board member.' },
  { key: 'chief', label: 'Chief of Staff', riverheadTitle: 'Chief of Staff (Resolution 2026-59)', what: 'Runs the Supervisor’s office day to day. In Riverhead the same person is the Town Budget Officer and is paid one salary.' },
  { key: 'budget', label: 'Budget Officer', riverheadTitle: 'Town Budget Officer', what: 'Helps prepare the tentative budget. Under the State’s Town Law the Supervisor is the budget officer unless the Board appoints someone else, so towns differ in who does this work.' },
  { key: 'aide', label: 'Legislative Aide or Secretary', riverheadTitle: 'Secretary (Legislative Aide, Resolution 2026-58)', what: 'Supports the Supervisor with correspondence, scheduling and Board business.' },
]

/** primary: the title compared when a town has more than one for a role. inOffice: false when the counterpart sits outside the Supervisor's office. */
export type PeerRole = { role: RoleKey; title: string; salary: number; prior?: Record<string, number>; quote: string; note: string; primary?: boolean; inOffice?: boolean }
export type Peer = { town: string; censusName: string; source: { title: string; url: string; text: string; transcribed?: boolean }; roles: PeerRole[]; missing: { role: RoleKey; why: string }[] }
export type SalaryRecord = { title?: string | null; department?: string | null; annual?: number | null }

/** Riverhead's 2026 base salary for each role, from the salary schedule. The Chief of Staff and Budget Officer share one. */
export function riverheadRoles(records: SalaryRecord[]): Record<RoleKey, number | null> {
  // Titles unique to the office match on their own; "Secretary" is common, so it must be listed under the Supervisor's office.
  const office = (t: string) => records.find((r) => r.title === t && (t !== 'Secretary' || (r.department ?? '').startsWith('Supervisor')))?.annual ?? null
  const budget = office('Town Budget Officer')
  return { supervisor: office('Town Supervisor'), deputy: office('Deputy Town Supervisor'), chief: budget, budget, aide: office('Secretary') }
}

export type ComparisonCell = { town: string; titles: string[]; salary: number | null; notes: string[]; missing?: string; inOffice?: boolean }

/** The salary compared for a role: the primary title's, else the only one. */
export function peerSalary(p: Peer, role: RoleKey): PeerRole | null {
  const rs = p.roles.filter((r) => r.role === role)
  return rs.find((r) => r.primary) ?? rs[0] ?? null
}

/** One row per role: Riverhead, then each peer. Where a peer has more than one title for a role, all are listed and the primary one is compared. */
export function compare(riverhead: Record<RoleKey, number | null>, peers: Peer[]): { role: (typeof ROLES)[number]; riverhead: number | null; cells: ComparisonCell[] }[] {
  return ROLES.map((role) => ({
    role,
    riverhead: riverhead[role.key],
    cells: peers.map((p) => {
      const rs = p.roles.filter((r) => r.role === role.key)
      const miss = p.missing.find((m) => m.role === role.key)
      if (!rs.length) return { town: p.town, titles: [], salary: null, notes: [], missing: miss?.why ?? 'No counterpart in this record.' }
      const main = peerSalary(p, role.key) as PeerRole
      const others = rs.filter((r) => r !== main)
      return {
        town: p.town,
        titles: [main.title, ...others.map((r) => `${r.title} (${r.salary.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })})`)],
        salary: main.salary,
        notes: [main.note],
        inOffice: main.inOffice !== false,
      }
    }),
  }))
}

/** Percent difference of Riverhead from a peer: −27 means Riverhead is 27% lower. */
export const percentFrom = (riverhead: number, peer: number) => Math.round(((riverhead - peer) / peer) * 1000) / 10
