// Budget accuracy: lines where the adopted budget and what was actually spent
// are far enough apart that the budget stops being a useful plan.
//
// Three parts, deliberately kept distinct:
//
//   • curatedFlags — hand-researched lines, each with a specific question a
//     resident or Board member can put to the Finance Department. The
//     questions are written by hand; every figure in them is read from the
//     Town's Budget Supplements (lib/supplement.ts), so none can drift.
//   • the multi-year view in web/public/data/budget-supplement/history.json,
//     built by etl/parse_supplement_history.py from every Supplement since 2020.
//   • the auto-detected outliers in current-outliers.json, the same script's
//     checks on the newest Supplement.

import outliersJson from '../public/data/budget-supplement/current-outliers.json'
import history from '../public/data/budget-supplement/history.json'
import { actualYears, budgetYear, columns, figures, pct, usd, type Figures } from './supplement'

export type Severity = 'critical' | 'high' | 'explain'

/** The two most recent years with actual spending, the budget before the new
    one, and the new Tentative: the frame every flag is read in. */
const Y1 = actualYears[actualYears.length - 2]
const Y2 = actualYears[actualYears.length - 1]
const ADOPTED_YEAR = budgetYear - 1

export type FlagYear = { year: number; budget: number | null; actual: number | null }

export type BudgetAccuracyFlag = {
  rank: number
  title: string
  severity: Severity
  accounts: string[]
  page: number | null
  years: FlagYear[]
  adopted: number | null
  midYear: number | null
  tentative: number | null
  plainEnglish?: string
  issue: string
  action: string
}

type FlagSpec = {
  title: string
  accounts: string[]
  /** Set only where the computed test would mislead; say why beside it. */
  severity?: Severity
  plainEnglish?: string
  issue: (f: Figures) => string
  action: (f: Figures) => string
}

const a = (f: Figures, y: number) => f.actual(y) ?? 0
const b = (f: Figures, y: number) => f.adopted(y) ?? 0
const times = (x: number, y: number) => `${(x / y).toFixed(1)} times`

/** The earliest year from which the budget has not changed. */
function unchangedSince(f: Figures): number {
  let y = ADOPTED_YEAR
  while (f.adopted(y - 1) !== null && f.adopted(y - 1) === f.adopted(ADOPTED_YEAR)) y--
  return y
}

const specs: FlagSpec[] = [
  {
    title: 'Police Uniform OT',
    accounts: ['A01-3-3120-111-UNI-00000'],
    plainEnglish: 'Uniform OT means overtime for sworn uniformed police personnel. It is driven by minimum staffing rules, vacancies, sick or vacation backfill, shift coverage, arrests, court time, events, emergencies, training coverage, and contract overtime premiums.',
    issue: (f) => {
      const recent = [2023, 2024, 2025].map((y) => `${usd(a(f, y))} against ${usd(b(f, y))} in ${y}`)
      return `Over budget in every year shown: ${recent.join(', ')}. The budget was cut from ${usd(b(f, 2022))} in 2022 to ${usd(b(f, 2023))} for 2023, less than the line had cost in any year since ${actualYears[0]}. The ${budgetYear} Tentative's ${usd(f.tentative ?? 0)} is below what it cost in each of the last three years. March workload data complicates the offset story: criminal incidents rose to 167 from 144 and total incidents rose to 2,994 from 2,922, even though accidents and summonses fell.`
    },
    action: (f) => {
      const recent = [2023, 2024, 2025].map((y) => a(f, y))
      return `Either budget overtime at what it has cost, or publish a monthly overtime report showing how the gap between the ${usd(f.tentative ?? 0)} budget and the ${usd(Math.min(...recent))}–${usd(Math.max(...recent))} the line has cost will be closed through scheduling, cause coding, and tighter court, recall, training and event review, without assuming workload has declined.`
    },
  },
  {
    title: 'Highway Machinery 5130',
    accounts: ['DA1-5-5130-'],
    plainEnglish: 'The Highway Department’s machinery function: buying equipment (DA1-5130-240) and repairing it (DA1-5130-403).',
    issue: (f) => {
      const eq = figures(['DA1-5-5130-240-000-00000'])
      return `The function spent ${usd(a(f, Y1))} in ${Y1} against a ${usd(b(f, Y1))} budget, and ${usd(a(f, Y2))} in ${Y2} against ${usd(b(f, Y2))}. Nearly all of the overrun is the equipment line: ${usd(a(eq, Y1))} and ${usd(a(eq, Y2))} spent against ${usd(b(eq, Y1))} and ${usd(b(eq, Y2))} budgeted. The ${budgetYear} Tentative budgets equipment at ${usd(eq.tentative ?? 0)} again.`
    },
    action: () => 'Confirm how the purchases are authorized and paid for, whether by transfers within the Highway fund or from its reserves, and budget the equipment line at what it costs.',
  },
  {
    title: 'Town Attorney — Outside Legal Services',
    accounts: ['A01-1-1420-433-000-00000'],
    plainEnglish: 'Fees for outside lawyers the Town Attorney’s office hires, separate from the office’s own staff.',
    issue: (f) => `Budgeted at ${usd(b(f, ADOPTED_YEAR))} every year since ${unchangedSince(f)}, it cost ${usd(a(f, 2023))} in 2023, ${usd(a(f, 2024))} in 2024 and ${usd(a(f, 2025))} in 2025. By June 30, ${ADOPTED_YEAR} it had cost ${usd(f.ytd(ADOPTED_YEAR) ?? 0)}, ${(f.ytd(ADOPTED_YEAR) ?? 0) > b(f, ADOPTED_YEAR) ? 'more than the whole year’s budget' : 'most of the year’s budget'}. The ${budgetYear} Tentative budgets ${usd(f.tentative ?? 0)} again.`,
    action: () => 'Budget outside counsel at what it has cost, or say which cases or contracts the Town expects to end.',
  },
  {
    title: 'Police Sick Buy-Back',
    accounts: ['A01-3-3120-152-000-00000'],
    plainEnglish: 'This is payment for unused sick leave under police contract or work rules. It can come from retirement or separation payouts, annual sick-leave sellbacks if permitted, or accumulated sick banks converting into cash.',
    issue: (f) => `Over budget in ${Y1} (${usd(a(f, Y1))} against ${usd(b(f, Y1))}) and in ${Y2} (${usd(a(f, Y2))} against ${usd(b(f, Y2))}). The ${ADOPTED_YEAR} budget cut the line to ${usd(b(f, ADOPTED_YEAR))}, and ${usd(f.ytd(ADOPTED_YEAR) ?? 0)} of it was spent by June 30 — before the seven PBA retirements under this year’s incentive, which let each retiree cash out up to 30 accrued sick days. The ${budgetYear} Tentative budgets ${usd(f.tentative ?? 0)}.`,
    action: () => 'Budget sick-leave payouts at what they have cost, including the incentive retirements, and say which contract terms drive them.',
  },
  {
    title: 'Police Body Cameras',
    accounts: ['A01-3-3120-240-305-00000'],
    issue: (f) => `${usd(a(f, Y1))} was spent in ${Y1} from a Police equipment account that had no line in the ${Y1} budget and has had no budget since. It is a separate account from IT Equipment.`,
    action: () => 'Confirm the capital authorization, funding source, and budget amendment trail so the one-time purchase is not confused with recurring equipment spending.',
  },
  {
    title: 'IT Equipment',
    accounts: ['A01-1-1680-240-000-00000'],
    issue: (f) => `${Y1} cost ${usd(a(f, Y1))}, ${times(a(f, Y1), b(f, Y1))} the ${usd(b(f, Y1))} budget. In ${Y2} the line came in ${a(f, Y2) <= b(f, Y2) ? 'under' : 'over'} its ${usd(b(f, Y2))} budget, at ${usd(a(f, Y2))}. The ${ADOPTED_YEAR} budget cut it to ${usd(b(f, ADOPTED_YEAR))}; the ${budgetYear} Tentative raises it to ${usd(f.tentative ?? 0)}.`,
    action: () => 'Confirm what drove the one-year spike and whether it was a single purchase.',
  },
  {
    title: 'ES1 Sewer Hospitalization',
    accounts: ['ES1-9-9060-810-NON-00000'],
    // The computed test would call this critical, but the swing is most likely
    // an accounting entry, not premiums; the question is how it is recorded.
    severity: 'high',
    issue: (f) => `${usd(a(f, Y1))} was charged in ${Y1} against a ${usd(b(f, Y1))} budget, then ${usd(a(f, Y2))} in ${Y2} against ${usd(b(f, Y2))}. The ${Y1} figure is consistent with a non-cash retiree-health (GASB 75/OPEB) allocation through the sewer district’s hospitalization account rather than premiums paid. The Supplement does not say so.`,
    action: () => 'Tie the charge to the audited OPEB allocation or journal entry, identify where it was disclosed, and explain why the Supplement does not label the spike as non-cash accounting activity.',
  },
  {
    title: 'Planning Environmental Review',
    accounts: ['A01-8-8020-436-100-00000'],
    issue: (f) => `${usd(a(f, 2023))} in 2023 and ${usd(a(f, 2024))} in 2024 went out with no budget in either year, and ${usd(a(f, 2025))} more in 2025, also unbudgeted. Neither the ${ADOPTED_YEAR} budget nor the ${budgetYear} Tentative carries anything.`,
    action: () => 'Determine whether this was grant-funded, reimbursed by applicants, or an unappropriated consulting expenditure.',
  },
  {
    title: 'Fire Protection - Part-Time Staff',
    accounts: ['A01-3-3410-102-000-00000'],
    issue: (f) => `Spent ${usd(a(f, Y1))} in ${Y1} against a ${usd(b(f, Y1))} budget. The line was then set to zero for ${Y2}, and ${usd(a(f, Y2))} was paid from it anyway. Neither the ${ADOPTED_YEAR} budget nor the ${budgetYear} Tentative carries anything.`,
    action: () => 'Determine whether part-time Fire Marshal help is still being used and, if it is, budget it.',
  },
  {
    title: 'CDA Special Events',
    accounts: ['A01-8-8686-450-000-00000'],
    issue: (f) => `The line had no ${Y2} budget, yet ${usd(a(f, Y2))} was spent from it in ${Y2}. It was budgeted at ${usd(b(f, ADOPTED_YEAR))} for ${ADOPTED_YEAR}, and the ${budgetYear} Tentative cuts it to ${usd(f.tentative ?? 0)}.`,
    action: () => 'Explain the event plan, the funding source and the public purpose, and why the spending came before the budget.',
  },
  {
    title: 'Town Hall Postage',
    accounts: ['A01-1-1620-421-000-00000'],
    // Small dollars, and most of the line's cost moved to another account.
    severity: 'explain',
    issue: (f) => {
      const cp = figures(['A01-1-1345-421-000-00000'])
      return `Budgeted at ${usd(b(f, Y1))} in ${Y1}, it cost ${usd(a(f, Y1))}. For ${Y2} most postage moved to a new Central Purchasing line (${usd(b(cp, Y2))} budgeted, ${usd(a(cp, Y2))} spent) and Town Hall’s own line was cut to ${usd(b(f, Y2))}, but it still cost ${usd(a(f, Y2))}. The ${budgetYear} Tentative keeps ${usd(f.tentative ?? 0)}.`
    },
    action: () => 'What does Town Hall still mail that Central Purchasing does not? Budget the line at what it costs.',
  },
]

/**
 * Critical: over budget in each of the last two years (spending with no budget
 * counts), and the new Tentative still at least $25,000 below the latest year.
 * High: spending with no budget, or a year more than 25% over. Otherwise a
 * question to explain.
 */
function severityOf(f: Figures): Severity {
  const over = (y: number) => a(f, y) > b(f, y) && a(f, y) > 0
  const noBudget = (y: number) => b(f, y) === 0 && a(f, y) > 0
  const gap = a(f, Y2) - (f.tentative ?? 0)
  if (over(Y1) && over(Y2) && gap >= 25_000) return 'critical'
  if (noBudget(Y1) || noBudget(Y2)) return 'high'
  if ([Y1, Y2].some((y) => b(f, y) > 0 && a(f, y) > 1.25 * b(f, y))) return 'high'
  return 'explain'
}

const ORDER: Record<Severity, number> = { critical: 0, high: 1, explain: 2 }

export const curatedFlags: BudgetAccuracyFlag[] = specs
  .map((s) => {
    const f = figures(s.accounts)
    return {
      title: s.title,
      severity: s.severity ?? severityOf(f),
      accounts: f.accounts,
      page: f.page,
      years: [Y1, Y2].map((year) => ({ year, budget: f.adopted(year), actual: f.actual(year) })),
      adopted: f.adopted(ADOPTED_YEAR),
      midYear: f.ytd(ADOPTED_YEAR),
      tentative: f.tentative,
      plainEnglish: s.plainEnglish,
      issue: s.issue(f),
      action: s.action(f),
      gap: a(f, Y2) - (f.tentative ?? 0),
    }
  })
  .sort((x, y) => ORDER[x.severity] - ORDER[y.severity] || y.gap - x.gap)
  .map(({ gap: _gap, ...flag }, i) => ({ ...flag, rank: i + 1 }))

/** Over or under the year's budget, as a signed percentage; null without a budget. */
export const variance = (y: FlagYear) => {
  if (!y.budget) return y.actual ? 'No budget' : '—'
  if (y.actual === null) return '—'
  const v = y.actual / y.budget - 1
  return Math.abs(v) < 0.005 ? 'On budget' : pct(v)
}

export const flagYears = { first: Y1, second: Y2, adopted: ADOPTED_YEAR, tentative: budgetYear }

// Earlier versions of this page compared each 2024 actual with the 2025
// budget, which the 2026 Supplement prints beside it, and labeled it the 2024
// budget. Kept as a record, with the figures read from the Supplements.
const financeBuyBack = figures(['A01-1-1310-153-000-00000'])
const postage = figures(['A01-1-1620-421-000-00000'])
export const flagCorrections = {
  note: `Earlier versions of this page compared each ${Y1} actual with the ${Y2} budget, which the ${ADOPTED_YEAR} Supplement prints beside it, and labeled it the ${Y1} budget. Seven flags were overstated. Two were not overruns at all: the Finance Department’s management buy-back (the ${Y1} budget was ${usd(b(financeBuyBack, Y1))} and ${usd(a(financeBuyBack, Y1))} was paid), which has been removed, and Town Hall postage (${usd(b(postage, Y1))} budgeted, ${usd(a(postage, Y1))} spent), which is kept for what happened in ${Y2}. Every figure in these flags is now read from the Supplements rather than typed in.`,
}

// ---------------------------------------------------------------------------
// Found automatically on the newest Supplement.

export type Outlier = {
  account: string
  fund: string
  name: string
  control: string
  page: number | null
  actual: number | null
  adopted: number | null
  ytd: number | null
  tentative: number | null
  flag: string
  excess: number
}

export const outlierColumns = columns
export const overBudget = outliersJson.overBudget as Outlier[]
export const chronicOverrun = outliersJson.chronicOverrun as Outlier[]
export const noBudget = outliersJson.noBudget as Outlier[]
export const recoverablePool = outliersJson.recoverablePoolControllable as number
export const outlierNote = outliersJson.note as string

export const detectedCount = overBudget.length + chronicOverrun.length + noBudget.length

export const severityLabel: Record<Severity, string> = {
  critical: 'Critical',
  high: 'High',
  explain: 'Needs explaining',
}

// ---------------------------------------------------------------------------
// Multi-year view, from etl/parse_supplement_history.py. The outliers above
// compare one year against the next; these compare eight, which is the only way
// to tell a line that is genuinely over budget from one that simply runs on a
// three-year cycle and happens to be in an off year.

export type CyclicalLine = {
  account: string
  name: string
  series: Record<string, number>
  spikeYears: number[]
  periodYears: number
  nextDue: number
  spikeAverage: number
  adopted: number
  tentative: number
}

export type UnderBudgetedLine = {
  account: string
  name: string
  series: Record<string, number>
  quietYears: number
  averageWhenActive: number
  peak: number
  adopted: number
  tentative: number
  shortfall: number
}

export type ChronicLine = {
  account: string
  name: string
  fund: string
  page: number | null
  actual: Record<string, number>
  adoptedByYear: Record<string, number>
  averageActual: number
  averageAdopted: number
  ytd: number | null
  adopted: number
  tentative: number
  gap: number
}

export type UnusedLine = {
  account: string
  name: string
  fund: string
  page: number | null
  adoptedPrior: number
  adopted: number
  tentative: number
}

export type RenumberedLine = {
  name: string
  oldAccount: string
  lastYear: number
  newAccount: string
  firstYear: number
  peak: number
}

export const historyBudgetYear = history.budgetYear as number
export const cyclical = history.cyclical as CyclicalLine[]
export const dueInBudgetYear = history.dueInBudgetYear as CyclicalLine[]
export const underBudgeted = history.underBudgeted as UnderBudgetedLine[]
export const chronicUnderBudget = history.chronicUnderBudget as ChronicLine[]
export const unused = history.unused as UnusedLine[]
export const renumbered = history.renumbered as RenumberedLine[]
export const historyActualYears = history.actualYears as number[]
export const supplementCount = (history.supplementYears as number[]).length
export const accountsTracked = history.accountsTracked as number
export const historyNote = history.note as string

/** What the lumpy, under-budgeted lines would cost if they all landed at once. */
export const underBudgetedShortfall = underBudgeted.reduce((n, r) => n + r.shortfall, 0)
export const unusedTotal = unused.reduce((n, r) => n + r.tentative, 0)
export const unusedGeneralFund = unused.filter((r) => r.fund === 'A01').reduce((n, r) => n + r.tentative, 0)
export const chronicGap = chronicUnderBudget.reduce((n, r) => n + r.gap, 0)
