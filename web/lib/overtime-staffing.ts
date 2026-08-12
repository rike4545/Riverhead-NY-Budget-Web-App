// Overtime-as-staffing analysis for the sworn police units (PBA and SOA).
//
// The question this answers: when a rank runs persistent overtime, is the Town
// buying coverage more expensively than it would by adding a position at that
// rank?
//
// SERVER-ONLY. Imports the full 671KB payroll record set and reduces it to a
// small serializable summary; import this from a server component and pass the
// result down as props. Never import it from a 'use client' file.
//
// ---------------------------------------------------------------------------
// A note on the threshold, because the obvious one doesn't work
// ---------------------------------------------------------------------------
// The intuitive test — flag anyone whose overtime is 1.5x their base salary —
// finds nobody in Riverhead. Not one sworn officer in any year 2018-2025 comes
// close; the single highest individual ratio on record is about 54%. A test
// that never fires isn't a conservative test, it's a broken one, so the ratio
// is still computed and reported (see `individualRatioCheck`) specifically so
// the page can say out loud that the Town does NOT have a runaway-individual
// overtime problem.
//
// The signal that IS there is at the rank level, and it's the one that actually
// supports a staffing argument: convert each rank's total overtime into the
// number of full-time positions' worth of straight-time hours it represents.
// Overtime is paid at 1.5x, so $150,000 of overtime buys $100,000 worth of
// labor hours — roughly one more officer's worth of coverage. A rank that
// consistently runs a full position or more of overtime is a rank the Town is
// staffing by premium rather than by headcount.

import recordsJson from '../public/data/payroll/records.json'

// FLSA / contract overtime premium. Overtime hours cost 1.5x the straight-time
// rate, so overtime dollars must be divided by this to compare with base pay.
export const OT_PREMIUM = 1.5

// Employer cost on top of base salary — pension, health, FICA. Computed from
// Riverhead's own Comptroller filing rather than assumed; see lib/benefit-load.ts
// for the derivation and for why the range exists at all (it is one methodological
// choice about health insurance, not uncertainty about the Town's numbers).
import { BENEFIT_LOAD } from './benefit-load'
export { BENEFIT_LOAD }

export const SWORN_UNIONS = ['PBA', 'SOA'] as const

type Raw = { y: number; n: string; d: string; t: string; c: string; u: string; r: number; o: number; g: number; i?: string }

// A title carried back from another year is an inference, and this analysis
// assigns dollars to a specific rank in a specific year. Using a carried title
// here would let a since-promoted officer's current rank absorb overtime they
// earned at a lower one. Rank figures use reported titles only.
const titleIsReported = (r: Raw) => (r.i ?? '').indexOf('t') < 0

const records = (recordsJson as { records: Raw[] }).records

export type RankYear = {
  year: number
  union: string
  title: string
  headcount: number
  totalBase: number
  totalOvertime: number
  avgBase: number
  /** Overtime dollars as a share of base dollars for the rank. */
  otShareOfBase: number
  /** Full-time positions' worth of straight-time hours the overtime represents. */
  fteCovered: number
}

export type RankTrend = {
  union: string
  title: string
  years: RankYear[]
  latest: RankYear
  /** Mean fteCovered across every year with title data. */
  meanFte: number
  /** Ran a full position or more of overtime in most years covered — not a one-off spike. */
  persistent: boolean
}

// Department/title fields are only populated from 2022 onward, so rank-level
// analysis starts there. Earlier years still power the individual ratio check.
export const TITLE_DATA_FROM = 2022

export const analysisYears: number[] = records
  .filter((r) => r.y >= TITLE_DATA_FROM)
  .map((r) => r.y)
  .filter((y, i, arr) => arr.indexOf(y) === i)
  .sort((a, b) => a - b)

export const latestYear = analysisYears[analysisYears.length - 1]

function rankYears(): RankYear[] {
  const buckets: Record<string, RankYear> = {}
  for (const r of records) {
    if (r.y < TITLE_DATA_FROM) continue
    if (!titleIsReported(r)) continue
    if (!(SWORN_UNIONS as readonly string[]).includes(r.u)) continue
    if (r.r <= 0) continue // no base pay recorded — can't form a ratio
    const title = (r.t || '').trim()
    if (!title) continue
    const key = `${r.y}|${r.u}|${title}`
    const b = buckets[key] ?? {
      year: r.y, union: r.u, title, headcount: 0, totalBase: 0, totalOvertime: 0,
      avgBase: 0, otShareOfBase: 0, fteCovered: 0,
    }
    b.headcount += 1
    b.totalBase += r.r
    b.totalOvertime += r.o
    buckets[key] = b
  }
  const out = Object.keys(buckets).map((k) => buckets[k])
  for (const b of out) {
    b.avgBase = b.headcount ? b.totalBase / b.headcount : 0
    b.otShareOfBase = b.totalBase ? b.totalOvertime / b.totalBase : 0
    b.fteCovered = b.avgBase ? b.totalOvertime / OT_PREMIUM / b.avgBase : 0
  }
  return out
}

const allRankYears = rankYears()

export const rankTrends: RankTrend[] = (() => {
  const byRank: Record<string, RankYear[]> = {}
  for (const ry of allRankYears) {
    const key = `${ry.union}|${ry.title}`
    byRank[key] = (byRank[key] ?? []).concat(ry)
  }
  const out: RankTrend[] = []
  for (const key of Object.keys(byRank)) {
    const years = byRank[key]
    years.sort((a, b) => a.year - b.year)
    const latest = years[years.length - 1]
    if (!latest || latest.year !== latestYear) continue // rank no longer exists
    const meanFte = years.reduce((s, y) => s + y.fteCovered, 0) / years.length
    const fullPositionYears = years.filter((y) => y.fteCovered >= 1).length
    out.push({
      union: latest.union,
      title: latest.title,
      years,
      latest,
      meanFte,
      persistent: fullPositionYears > years.length / 2,
    })
  }
  return out.sort((a, b) => b.latest.fteCovered - a.latest.fteCovered)
})()

/** Ranks where adding headcount is worth costing out: a full position or more of
 *  overtime in the latest year, sustained across most years on record. */
export const flaggedRanks = rankTrends.filter((t) => t.latest.fteCovered >= 1 && t.persistent)

// ---------------------------------------------------------------------------
// The individual 1.5x test — reported precisely because it finds nothing
// ---------------------------------------------------------------------------
export const INDIVIDUAL_RATIO_THRESHOLD = 1.5

export const individualRatioCheck = (() => {
  const sworn = records.filter((r) => (SWORN_UNIONS as readonly string[]).includes(r.u) && r.r > 0)
  let max = 0
  let maxYear = 0
  let maxTitle = ''
  for (const r of sworn) {
    const ratio = r.o / r.r
    if (ratio > max) { max = ratio; maxYear = r.y; maxTitle = (r.t || '').trim() }
  }
  const over = sworn.filter((r) => r.o / r.r >= INDIVIDUAL_RATIO_THRESHOLD).length
  const overHalf = sworn.filter((r) => r.o / r.r >= 0.5).length
  return {
    threshold: INDIVIDUAL_RATIO_THRESHOLD,
    recordsChecked: sworn.length,
    countOverThreshold: over,
    countOverHalfBase: overHalf,
    highestRatio: max,
    highestRatioYear: maxYear,
    // Rank, not name: the argument here is about how a rank is staffed, not
    // about any individual, and nobody is doing anything wrong by working
    // overtime that is offered to them.
    highestRatioTitle: maxTitle,
  }
})()

// ---------------------------------------------------------------------------
// The pension-spike test: does overtime climb at the end of a career?
// ---------------------------------------------------------------------------
// If overtime were being used to inflate a final average salary, a person's last
// years would run hot against their own history. Measured per person against
// their own baseline, so a habitually high earner doesn't register as a spike.
export const finalYearOvertimeCheck = (() => {
  const byPerson: Record<string, Raw[]> = {}
  for (const r of records) {
    if (!(SWORN_UNIONS as readonly string[]).includes(r.u)) continue
    byPerson[r.n] = (byPerson[r.n] ?? []).concat(r)
  }
  const ratios: number[] = []
  for (const name of Object.keys(byPerson)) {
    const ys = byPerson[name].slice().sort((a, b) => a.y - b.y)
    const last = ys[ys.length - 1]
    if (last.y >= 2025 || ys.length < 3) continue // still employed, or too short
    // Part-year records distort the ratio at both ends; require full-year pay.
    const prior = ys.slice(0, -1).filter((r) => r.r > 40_000).map((r) => r.o)
    if (!prior.length || last.r < 40_000) continue
    const avg = prior.reduce((s, x) => s + x, 0) / prior.length
    if (avg > 0) ratios.push(last.o / avg)
  }
  ratios.sort((a, b) => a - b)
  const mid = Math.floor(ratios.length / 2)
  const medianRatio = ratios.length
    ? (ratios.length % 2 ? ratios[mid] : (ratios[mid - 1] + ratios[mid]) / 2)
    : 0
  return {
    sampleSize: ratios.length,
    medianRatio,
    shareAboveOwnAverage: ratios.length ? ratios.filter((r) => r > 1).length / ratios.length : 0,
  }
})()

// ---------------------------------------------------------------------------
// Cost comparison: cover one position's hours with overtime, or with a hire?
// ---------------------------------------------------------------------------
// The only rank the Town hires into off the street. Detective, Sergeant, and
// Lieutenant are promotional: you cannot post a vacancy and fill it externally,
// so "hire one at the entry step" is the wrong comparison for them. Adding one
// of those posts means promoting a serving officer AND hiring an entry-step
// officer to backfill the vacancy that promotion creates.
export const ENTRY_RANK_TITLE = 'Police Officer'

export type FillCost = {
  /** How the post actually gets filled. */
  path: 'external hire' | 'promotion + backfill'
  /** Loaded annual cost of filling one post this way, at low/mid/high benefit load. */
  cost: { low: number; mid: number; high: number }
  /** For the promotion path: the raise the promoted officer receives, unloaded. */
  promotionDifferential?: number
  /** For the promotion path: the entry-step base of the backfill hire. */
  backfillBase?: number
}

export type CostComparison = {
  union: string
  title: string
  avgBase: number
  entryBase: number
  isEntryRank: boolean
  overtimeCost: number
  fill: FillCost
  hireAtAverage: { low: number; mid: number; high: number }
  /** Annual saving from filling the post instead of covering it with overtime, at the mid load. */
  savingAtEntryMid: number
  /** That saving scaled by how many FTEs of overtime the rank actually runs. */
  rankAnnualOpportunityMid: number
}

// Lowest base above a part-year floor, used as a proxy for the entry step: a
// new hire starts at the bottom of the salary schedule, not at the average.
// Records below the floor are people who worked part of a year, not low steps.
const FULL_YEAR_BASE_FLOOR = 60_000

const load = (base: number) => ({
  low: base * (1 + BENEFIT_LOAD.low),
  mid: base * (1 + BENEFIT_LOAD.mid),
  high: base * (1 + BENEFIT_LOAD.high),
})

/** Lowest full-year base actually paid at a title — a proxy for the bottom of
 *  that title's salary schedule. */
function entryBaseFor(year: number, union: string, title: string, fallback: number): number {
  const peers = records.filter(
    (r) => r.y === year && r.u === union && (r.t || '').trim() === title && r.r > FULL_YEAR_BASE_FLOOR,
  )
  return peers.length ? Math.min.apply(null, peers.map((r) => r.r)) : fallback
}

export function costComparisonFor(trend: RankTrend): CostComparison {
  const y = trend.latest
  const isEntryRank = y.title === ENTRY_RANK_TITLE
  const entryBase = entryBaseFor(y.year, y.union, y.title, y.avgBase)
  const overtimeCost = y.avgBase * OT_PREMIUM

  let fill: FillCost
  if (isEntryRank) {
    fill = { path: 'external hire', cost: load(entryBase) }
  } else {
    // Promote a serving officer into the post, then backfill the officer vacancy
    // at the bottom of the entry rank's schedule. The marginal cost is the
    // promoted officer's raise plus a whole new entry-step officer.
    const entryRank = allRankYears.filter((r) => r.year === y.year && r.title === ENTRY_RANK_TITLE)[0]
    const entryRankAvg = entryRank ? entryRank.avgBase : y.avgBase
    const entryRankFloor = entryRank
      ? entryBaseFor(y.year, entryRank.union, ENTRY_RANK_TITLE, entryRank.avgBase)
      : entryBase
    const differential = Math.max(0, y.avgBase - entryRankAvg)
    fill = {
      path: 'promotion + backfill',
      cost: {
        low: load(differential).low + load(entryRankFloor).low,
        mid: load(differential).mid + load(entryRankFloor).mid,
        high: load(differential).high + load(entryRankFloor).high,
      },
      promotionDifferential: differential,
      backfillBase: entryRankFloor,
    }
  }

  const savingAtEntryMid = overtimeCost - fill.cost.mid
  return {
    union: y.union,
    title: y.title,
    avgBase: y.avgBase,
    entryBase,
    isEntryRank,
    overtimeCost,
    fill,
    hireAtAverage: load(y.avgBase),
    savingAtEntryMid,
    rankAnnualOpportunityMid: savingAtEntryMid * y.fteCovered,
  }
}

export const costComparisons: CostComparison[] = flaggedRanks.map(costComparisonFor)

/** Total modeled annual opportunity across every flagged rank, at the mid benefit load. */
export const totalOpportunityMid = costComparisons.reduce((s, c) => s + Math.max(0, c.rankAnnualOpportunityMid), 0)

// ---------------------------------------------------------------------------
// The honest caveats. Rendered on the page — this analysis is a prompt to cost
// something out, not a conclusion that the Town is wasting money.
// ---------------------------------------------------------------------------
export const caveats = [
  'Not all overtime is vacancy coverage. Court appearances, grant-funded details, special events, and genuine emergencies all land in the same line, and none of them are fixed by adding headcount.',
  'A position is permanent; overtime is not. Overtime flexes down in a quiet year, and a hire made in a busy one still has to be paid in the quiet one — with a pension obligation that outlives the budget that created it.',
  'The benefit load now comes from the Town’s own Comptroller filing rather than an assumption, but it still carries one judgment: health insurance is bought per person and has to be divided between police and everyone else. Splitting it per person or per payroll dollar moves the load from about 45% to about 56%, and the conclusion moves with it.',
  'Contract terms shape the floor. Minimum call-in guarantees and shift-swap rules can mean a rank cannot actually convert overtime hours into a post one-for-one.',
  'Supervisory ranks can’t be hired into. Detective, Sergeant, and Lieutenant are promotional, so adding one means promoting a serving officer and hiring an entry-step officer to backfill — that combined cost is what is shown here, not a pretend external hire.',
  'A new officer isn’t available immediately. Academy training and field training mean a hire authorized this budget year does not relieve overtime until well into the next one.',
]

export const sourceNote =
  'Computed from the Town of Riverhead Gross Earnings reports already parsed for the Payroll Explorer — actual paid base and overtime by employee and year. Title and union are available from 2022 onward, so rank-level figures start there.'
