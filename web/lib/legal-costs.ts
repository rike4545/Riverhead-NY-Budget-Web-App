// What the Town spends on lawyers and legal claims, 2018 to the newest
// proposal, for /legal-costs/. Every figure is a Budget Supplement account read
// through lib/supplement.ts: actual spending by year, the adopted budget, what
// was spent by June 30 of the current year, and the newest proposal. Nothing
// here is typed in by hand except which accounts belong to which group and the
// Board's own resolution titles below; scripts/verify-legal-costs.mjs rebuilds
// the groups from line-history.json and checks the page against them.

import { actualYears, budgetYear, figures, proposalLabel, type Figures } from './supplement'

export { budgetYear, proposalLabel }

/** The year the newest Supplement adopted, whose mid-year spending it prints. */
export const currentYear = budgetYear - 1
/** The first year the Supplements carry an actual. */
export const firstYear = actualYears[0]
/** The last full year of actual spending. */
export const lastActualYear = actualYears[actualYears.length - 1]
export const years = actualYears

export type LegalGroup = {
  key: string
  label: string
  plain: string
  accounts: string[]
  f: Figures
}

const group = (key: string, label: string, plain: string, accounts: string[]): LegalGroup => ({ key, label, plain, accounts, f: figures(accounts) })

/** The Town Attorney's outside-counsel line: the one most of the page is about. */
export const OUTSIDE_COUNSEL = 'A01-1-1420-433-000-00000'

/**
 * Legal services, in four groups that do not overlap. Each account is one the
 * Supplement names as the Town Attorney's office or as a department's legal
 * professional services (object code 433). The Town Clerk's "Legal and
 * Reference Materials" line is books and subscriptions, so it is left out.
 */
export const groups: LegalGroup[] = [
  group('outside', 'Outside lawyers hired by the Town Attorney', 'Law firms and special counsel the Town Attorney’s office retains, paid from its professional-services line.', [OUTSIDE_COUNSEL]),
  group('departments', 'Outside lawyers for other departments', 'Legal professional services budgeted in other departments: the Town Board, Youth Court, the Zoning Board, the Sewer Districts and Community Development.', [
    'A01-1-1010-433-000-00000',
    'A01-3-3126-433-000-00000',
    'A01-8-8010-433-000-00000',
    'ES1-8-8130-433-000-00000',
    'ES3-8-8130-433-000-00000',
    'Z14-6-6980-433-000-00000',
    'Z14-6-6980-433-100-00000',
  ]),
  group('staff', 'Town Attorney’s office: staff pay', 'Salaries, part-time pay, overtime, longevity, allowances and the buy-backs of unused time for the office’s own lawyers and staff.', [
    'A01-1-1420-101-NON-00000',
    'A01-1-1420-102-000-00000',
    'A01-1-1420-111-NON-00000',
    'A01-1-1420-112-NON-00000',
    'A01-1-1420-123-000-00000',
    'A01-1-1420-124-000-00000',
    'A01-1-1420-152-000-00000',
    'A01-1-1420-153-000-00000',
    'A01-1-1420-154-000-00000',
    'A01-1-1420-154-NON-00000',
  ]),
  group('office', 'Town Attorney’s office: other costs', 'Equipment, office supplies, training and other professional services.', [
    'A01-1-1420-240-000-00000',
    'A01-1-1420-416-000-00000',
    'A01-1-1420-436-210-00000',
    'A01-1-1420-442-000-00000',
  ]),
]

/**
 * Claims and settlements: what the Town's self-insurance fund (Risk Retention,
 * fund MS2) paid out. Kept apart from legal services, because it pays claims,
 * not lawyers. The operating funds' "Gen Liab - Claim Payments" lines are not
 * added to it: they may be the charges those funds pay into the same
 * self-insurance arrangement, and adding both could count one dollar twice.
 */
export const SELF_INSURANCE = 'MS2-1-1930-487-000-00000'
export const claims = group('claims', 'Self-insurance payments on claims', 'What the Risk Retention fund paid on claims against the Town.', [SELF_INSURANCE])

const n = (v: number | null | undefined) => v ?? 0

/** Legal services in one year, across the four groups. */
export const legalTotal = (year: number) => groups.reduce((s, g) => s + n(g.f.actual(year)), 0)
export const legalAdopted = (year: number) => groups.reduce((s, g) => s + n(g.f.adopted(year)), 0)
export const legalYtd = (year: number) => groups.reduce((s, g) => s + n(g.f.ytd(year)), 0)
export const legalProposed = groups.reduce((s, g) => s + n(g.f.proposed), 0)

const outside = groups[0].f

/** The outside-counsel line, budget beside cost, each year both are printed. */
export const outsideByYear = years
  .filter((y) => outside.adopted(y) != null && outside.actual(y) != null)
  .map((y) => ({ year: y, budget: outside.adopted(y) as number, actual: outside.actual(y) as number }))

export const outsideOverYears = outsideByYear.filter((r) => r.actual > r.budget)
export const outsideCurrent = {
  year: currentYear,
  budget: n(outside.adopted(currentYear)),
  spentByJune30: n(outside.ytd(currentYear)),
  proposed: n(outside.proposed),
}
/** Outside counsel across every full year the Supplements print. */
export const outsideAllYears = years.reduce((s, y) => s + n(outside.actual(y)), 0)
/** Legal services across every full year. */
export const legalAllYears = years.reduce((s, y) => s + legalTotal(y), 0)

/** The Board's actions on legal matters in the meeting records this site holds. */
export type LegalAction = { date: string; number: string; kind: 'counsel' | 'settled' | 'brought' | 'claims' | 'cpf'; text: string }

/**
 * From the Town Board's resolutions. Private individuals are not named: a
 * case by or against a person is described, not captioned. The site holds
 * full records for 2025 and 2026 meetings; earlier years have one meeting
 * each, so the list is not complete before 2025. Six settlements of the
 * Town's code-enforcement actions against property owners in 2025 are counted
 * in CODE_SETTLEMENTS rather than listed.
 */
export const actions: LegalAction[] = [
  { date: '2023-01-04', number: '2023-41', kind: 'settled', text: 'Settles a lawsuit a resident brought against the Town.' },
  { date: '2024-01-03', number: '2024-71', kind: 'counsel', text: 'Accepts the resignation of the Planning Board’s special counsel.' },
  { date: '2025-01-07', number: '2025-88', kind: 'settled', text: 'Ratifies the settlement of the Town’s action against Island Water Park Corp. (Scott’s Pointe).' },
  { date: '2025-03-18', number: '2025-259', kind: 'counsel', text: 'Engages Whiteman Osterman & Hanna LLP as special counsel on tax certiorari and related real property matters.' },
  { date: '2025-04-01', number: '2025-308', kind: 'counsel', text: 'Authorizes special counsel to resolve pending litigation by agreeing to pursue administrative remedies and tolling certain claims.' },
  { date: '2025-08-05', number: '2025-647', kind: 'settled', text: 'Budget adjustment for a settlement offer to the tenant of 127 East Main Street (SNR Bar 25 Corp.).' },
  { date: '2025-08-05', number: '2025-695', kind: 'counsel', text: 'Authorizes the Town Attorney to retain special counsel to perfect an appeal.' },
  { date: '2025-09-16', number: '2025-778', kind: 'settled', text: 'A second budget adjustment for the settlement offer to SNR Bar 25 Corp.' },
  { date: '2025-09-16', number: '2025-789', kind: 'settled', text: 'Stipulation of settlement with Kar-McVeigh, LLC.' },
  { date: '2025-10-07', number: '2025-838', kind: 'counsel', text: 'Authorizes the Town Attorney to retain special counsel to perfect an appeal.' },
  { date: '2025-10-21', number: '2025-888', kind: 'brought', text: 'Authorizes a lawsuit against the Office of Cannabis Management, the Cannabis Control Board and the State.' },
  { date: '2025-11-18', number: '2025-936', kind: 'counsel', text: 'Hires an appraiser for the United Riverhead Terminal tax grievance case, and a second in resolution 2025-937.' },
  { date: '2025-12-02', number: '2025-964', kind: 'cpf', text: 'Authorizes the intermunicipal agreement for regional Community Preservation Fund counsel “notwithstanding stated objection.”' },
  { date: '2026-03-17', number: '2026-258', kind: 'counsel', text: 'Ratifies retaining special counsel in the litigation the Suffolk County Water Authority brought.' },
  { date: '2026-03-17', number: '2026-265', kind: 'settled', text: 'Settles a complaint before the State Division of Human Rights.' },
  { date: '2026-05-20', number: '2026-523', kind: 'settled', text: 'Settles a lawsuit a resident brought against the Town.' },
  { date: '2026-06-16', number: '2026-628', kind: 'brought', text: 'Ratifies starting a legal action against 400 David Court LLC.' },
  { date: '2026-08-04', number: '2026-760', kind: 'settled', text: 'Settles United Riverhead Terminal’s tax grievance case against the Board of Assessors.' },
  { date: '2026-11-05', number: '2026-970', kind: 'claims', text: 'Moves $225,000 to cover “additional general liability insurance claims incurred during the current fiscal year,” $205,700 of it from the workers’ compensation claims account.' },
  { date: '2026-11-05', number: '2026-980', kind: 'cpf', text: 'Tables, 5–0, the $400-an-hour retainer for regional Community Preservation Fund counsel.' },
]

/** 2025-133, 2025-160, 2025-208, 2025-262, 2025-348 and 2025-726. */
export const CODE_SETTLEMENTS = ['2025-133', '2025-160', '2025-208', '2025-262', '2025-348', '2025-726']

export const kindLabel: Record<LegalAction['kind'], string> = {
  counsel: 'Lawyers and experts hired',
  settled: 'Settlement',
  brought: 'Case the Town brought',
  claims: 'Claims budget',
  cpf: 'Regional CPF counsel',
}

/** The even-year election case, the one matter whose cost to the Town has been reported (see /election-law-case/). */
export { electionLawCase } from './election-law-case'
