// Four years of Board-authorized management pay, and the January rounds that set it.
//
// WHY THIS EXISTS. The management-compensation page could show one year-over-year
// step, 2025 to 2026, for four named positions. That is enough to notice a
// pattern and not enough to say whether it is one. The Town has published a full
// salary schedule every January for years; this reads 2022 through 2025 of them
// so the same question can be asked of a run of years instead of a single pair.
//
// WHAT "MANAGEMENT" MEANS HERE. It is the Town's own line, not one drawn for
// this page. The General Fund schedule prints a grade and step for positions on
// the union grid and leaves that column blank for positions the Board sets
// individually. The blank column is the definition used. It holds only inside
// the General Fund schedule -- Police, Elected Officials and Boards print ranks
// or stipends and carry no grade either, and counting those would fill a table
// about management pay with police step progression.
//
// WHAT THE SCHEDULE IS NOT. It is the schedule as adopted in January. A raise
// granted later in the year is not in it. That is not a gap in the data so much
// as the thing worth seeing: in January 2023 the Board adopted the schedule and
// then, at the same meeting, adopted fourteen more resolutions that paid people
// above it.

import history from '../public/data/salary/management-history.json'

export type YearPoint = { year: number; title: string; annual: number } | null

export type ManagementPosition = {
  name: string
  title: string
  series: YearPoint[]
  firstYear: number
  lastYear: number
  titleChanged: boolean
  titles: string[] | null
  change: number
  pct: number | null
}

export type ComparisonRow = { name: string; title: string; from: number; to: number; pct: number }
export type ExcludedRow = ComparisonRow & { titleTo: string }

export type Spread = {
  n: number
  median: number | null
  mean: number | null
  min: number | null
  max: number | null
  rows: ComparisonRow[]
  excluded: ExcludedRow[]
  medianWithExcluded: number | null
}

export type RaiseResolution = {
  resolution: string
  name: string | null
  title: string
  mechanism: 'grid' | 'pct' | 'flat' | 'hourly'
  value: number
  scheduleBase: number | null
  increase: number | null
  newSalary: number | null
  vote: string
  nay: string | null
}

export const years = history.years as number[]
export const source = history.source as { title: string; detail: string; url: string }
export const positions = history.positions as ManagementPosition[]
export const comparison = history.comparison as { from: number; to: number; management: Spread; graded: Spread }
export const january2023 = history.january2023 as {
  date: string
  count: number
  offSchedule: { count: number; total: number }
  grid: { count: number; total: number }
  pricedCount: number
  pricedTotal: number
  splitVotes: string[]
  notInSchedule: string[]
  resolutions: RaiseResolution[]
}

/** The off-schedule awards: a percentage or a flat sum, granted on top of the adopted schedule. */
export const offScheduleAwards = january2023.resolutions.filter(
  (r) => r.mechanism === 'pct' || r.mechanism === 'flat',
)

/** The grid moves: the Board moving someone to a named grade and step on a published schedule. */
export const gridMoves = january2023.resolutions.filter((r) => r.mechanism === 'grid')

/** Hourly-rate changes, which state no annual figure and so cannot be priced here. */
export const hourlyChanges = january2023.resolutions.filter((r) => r.mechanism === 'hourly')

/** Positions held by the same person across every year in the series. */
export const continuousPositions = positions.filter((p) => p.series.every((s) => s !== null))

export const managementMedian = comparison.management.median
export const gradedMedian = comparison.graded.median
export const medianGap =
  managementMedian != null && gradedMedian != null ? managementMedian - gradedMedian : null

/**
 * The same gap if every position whose printed title moved were counted as the
 * same job. It is reported because the strict comparison drops five management
 * rows, and a reader is entitled to know whether the finding depends on that.
 * It does not: the gap narrows by about a point and stays in the same direction.
 */
export const medianGapWithExcluded =
  comparison.management.medianWithExcluded != null && comparison.graded.medianWithExcluded != null
    ? comparison.management.medianWithExcluded - comparison.graded.medianWithExcluded
    : null

export const limits = [
  `The management sample is small: ${comparison.management.n} people held the same printed title in both ${comparison.from} and ${comparison.to}, against ${comparison.graded.n} on the union grid. A median over ${comparison.management.n} values moves a long way on one person, so the comparison is a reason to look further rather than a finding about the Town's pay policy.`,
  'Neither figure is a raise rate. A graded employee also moves up steps within their grade, and that movement is part of the change measured here, so the grid column is not a pure cost-of-living comparison either.',
  `${comparison.management.excluded.length} management positions are excluded from the comparison because the schedule printed a different title in ${comparison.to} than in ${comparison.from}. Two are genuine promotions. At least one is the same job spelled differently, and the printed title for it in ${comparison.to} is itself garbled. Folding all of them back in moves the management median to ${comparison.management.medianWithExcluded}% and the grid median to ${comparison.graded.medianWithExcluded}%, so the gap survives the choice either way.`,
  'These are authorized salaries, not what anyone was paid. The schedule is adopted in January; a resolution passed in March that raises a salary does not change it. The January 2023 round below is exactly that case, which is why its awards are shown against the schedule rather than inside it.',
  `One award cannot be priced: ${january2023.notInSchedule.join(', ')} is named in a resolution but absent from the January schedule, having been promoted the previous November. Two more are hourly-rate changes that state no annual figure. So ${january2023.pricedCount} of the ${january2023.count} resolutions carry a dollar value here.`,
  'The Sewer/Scavenger schedule lists fund-allocation percentages beside some names, and the seasonal and call-in schedules are hourly rate cards. Where a schedule carries no annual dollar figure this data does not include it, which is recorded in each year’s own note.',
]
