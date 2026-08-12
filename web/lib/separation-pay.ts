// What the Town owes its workforce in unused leave — and what it pays out when
// people go.
//
// SERVER-ONLY (imports the full payroll record set). Import from a server
// component and pass the result down as props.
//
// ---------------------------------------------------------------------------
// Why this exists
// ---------------------------------------------------------------------------
// A reasonable suspicion about municipal payroll is that overtime functions as
// informal salary inflation — that people run up overtime late in a career to
// lift a pension. In Riverhead's data that is NOT what happens: median
// final-year overtime is about 0.93x the same person's own prior average, so
// overtime FALLS at the end of a career (see lib/overtime-staffing.ts).
//
// The end-of-career money is in a different column. Every payroll record has a
// residual — gross minus base minus overtime — and in a separation year that
// residual is frequently many times the person's own career norm. That residual
// is where accrued-leave payouts live.
//
// IMPORTANT LIMIT: the residual is a mixed bucket. Longevity, stipends,
// retroactive contract settlements, and leave buyouts all land in it, and the
// Gross Earnings report does not break them apart. A retro settlement paid in
// someone's final year is indistinguishable here from a leave payout. So this
// module measures a PATTERN THAT NEEDS AN EXPLANATION, not a proven payout —
// and the audited liability below is the document that would settle it.

import recordsJson from '../public/data/payroll/records.json'

type Raw = { y: number; n: string; d: string; t: string; c: string; u: string; r: number; o: number; g: number; f?: string }
const records = (recordsJson as { records: Raw[] }).records

const LAST_FULL_YEAR = 2025
const MIN_YEARS_ON_RECORD = 3

export type UnionSeparationRollup = {
  union: string
  separations: number
  excessOverCareerAverage: number
  medianFinalYearResidual: number
}

export type SeparationSummary = {
  separations: number
  totalExcess: number
  medianFinalYearResidual: number
  largestFinalYearResidual: number
  /** People whose final year exceeded their own norm by a material amount. */
  concentratedCount: number
  /** Share of the whole total those few people account for. */
  concentratedShare: number
  byUnion: UnionSeparationRollup[]
}

// Above this, a separation year is materially bigger than the person's own norm
// rather than ordinary year-to-year noise.
const MATERIAL_EXCESS = 5_000

const residual = (r: Raw) => r.g - r.r - r.o

// A blank union code is not one thing. Most of these people are pre-2022 leavers
// whose records predate the Town reporting a group at all — genuinely unknown.
// But the largest separation payouts in the whole dataset sit in this bucket and
// are NOT unknown: they are department heads and appointed officials, who are not
// union-covered by definition. Lumping a police chief in with an unidentifiable
// seasonal worker as "(unlabeled)" hides the most interesting row on the table.
function groupOf(r: Raw): string {
  const union = (r.u || '').trim()
  if (union) return union
  const payClass = (r.c || '').trim().toLowerCase()
  const title = (r.t || '').trim().toLowerCase()
  if (payClass === 'elected' || title === 'town clerk' || title === 'supervisor') return '~elected'
  if (payClass.indexOf('dept head') >= 0 || payClass.indexOf('contractual') >= 0) return '~appointed'
  if (title.indexOf('member of') === 0) return '~appointed'
  return '~unknown'
}

export const DERIVED_GROUP_LABELS: Record<string, string> = {
  '~elected': 'Elected — group inferred from pay class',
  '~appointed': 'Department head / appointed — group inferred',
  '~unknown': 'Group not recorded',
}
const median = (xs: number[]) => {
  if (!xs.length) return 0
  const s = xs.slice().sort((a, b) => a - b)
  const m = Math.floor(s.length / 2)
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}

export const separationSummary: SeparationSummary = (() => {
  const byPerson: Record<string, Raw[]> = {}
  for (const r of records) {
    // Identity must not include a field this pipeline fills in. Keying on the
    // union code would split one person into two the moment a blank code got
    // derived, inventing a separation that never happened. The payroll File
    // Number is stable and even follows a name change; fall back to the name,
    // which is 1:1 with File Number across this dataset.
    const key = (r.f || '').trim() || r.n
    byPerson[key] = (byPerson[key] ?? []).concat(r)
  }

  type Row = { union: string; excess: number; finalResidual: number }
  const rows: Row[] = []

  for (const key of Object.keys(byPerson)) {
    const ys = byPerson[key].slice().sort((a, b) => a.y - b.y)
    const last = ys[ys.length - 1]
    // Still employed (appears in the most recent year) or too short a record to
    // form a personal baseline — either way, no usable comparison.
    if (last.y >= LAST_FULL_YEAR || ys.length < MIN_YEARS_ON_RECORD) continue
    const prior = ys.slice(0, -1).map(residual)
    const careerAvg = prior.reduce((s, x) => s + x, 0) / prior.length
    const finalResidual = residual(last)
    rows.push({ union: groupOf(last), excess: finalResidual - careerAvg, finalResidual })
  }

  const byUnionMap: Record<string, Row[]> = {}
  for (const row of rows) byUnionMap[row.union] = (byUnionMap[row.union] ?? []).concat(row)

  const byUnion = Object.keys(byUnionMap)
    .map((u) => ({
      union: u,
      separations: byUnionMap[u].length,
      // Only positive excess is summed: a separation year BELOW someone's own
      // norm isn't evidence of a payout, and netting it against the ones above
      // would understate the thing being measured.
      excessOverCareerAverage: byUnionMap[u].reduce((s, r) => s + Math.max(0, r.excess), 0),
      medianFinalYearResidual: median(byUnionMap[u].map((r) => r.finalResidual)),
    }))
    .sort((a, b) => b.excessOverCareerAverage - a.excessOverCareerAverage)

  const totalExcess = rows.reduce((s, r) => s + Math.max(0, r.excess), 0)
  const concentrated = rows.filter((r) => r.excess > MATERIAL_EXCESS)
  return {
    separations: rows.length,
    totalExcess,
    medianFinalYearResidual: median(rows.map((r) => r.finalResidual)),
    largestFinalYearResidual: Math.max.apply(null, rows.map((r) => r.finalResidual)),
    concentratedCount: concentrated.length,
    concentratedShare: totalExcess > 0
      ? concentrated.reduce((s, r) => s + r.excess, 0) / totalExcess
      : 0,
    byUnion,
  }
})()

// ---------------------------------------------------------------------------
// The document that settles it: the audited liability
// ---------------------------------------------------------------------------
// Town-wide Compensated Absences, account code W687, from the Schedule of
// Non-Current Governmental Liabilities. Transcribed from the Town's own filing
// rather than parsed, because the three-year comparative column only appears in
// the newest report.
export const compensatedAbsences = {
  source: {
    title: 'Town of Riverhead 2025 Annual Financial Report',
    detail: 'Schedule of Non-Current Governmental Liabilities, account 687 — Compensated Absences (town-wide)',
  },
  series: [
    { asOf: 'December 31, 2023', amount: 8_112_950.99 },
    { asOf: 'December 31, 2024', amount: 9_773_699.95 },
    { asOf: 'December 31, 2025', amount: 11_608_615.25 },
  ],
  // The 2024 audited statements record that the Town reviewed GASB Statement
  // No. 101, "Compensated Absences," for the fiscal year ended December 31,
  // 2024. That standard changes how the liability is measured, so part of the
  // 2023-to-2024 step is an accounting change rather than more leave accruing.
  // The 2024-to-2025 change is measured on the same basis at both ends.
  gasb101Note:
    'The Town adopted GASB Statement No. 101 (“Compensated Absences”) for the fiscal year ended December 31, 2024, which changes how this liability is measured. Part of the jump from 2023 to 2024 is therefore an accounting change, not purely additional accrued leave. The 2024-to-2025 increase is measured the same way at both ends.',
}

export const liabilityLatest = compensatedAbsences.series[compensatedAbsences.series.length - 1]
export const liabilityPrior = compensatedAbsences.series[compensatedAbsences.series.length - 2]
export const liabilityOneYearChange = liabilityLatest.amount - liabilityPrior.amount
export const liabilityTwoYearChange = liabilityLatest.amount - compensatedAbsences.series[0].amount

export const whyItMattersNow =
  'The 2026 retirement incentive the Town Board adopted 5–0 pays PBA and SOA members up to 30 accrued sick days on top of $1,000 per year of service, and CSEA members a flat $12,500. That converts part of this liability into cash inside a single budget year. The savings projection attached to that vote counts the salary the Town stops paying; it does not net out what the payouts cost.'

export const caveats = [
  'The payroll figures measure a residual, not a payout. Gross pay minus base minus overtime captures longevity, stipends, retroactive contract settlements and leave buyouts together — the Gross Earnings report does not separate them. A retro settlement landing in someone’s final year looks identical here to a leave payout.',
  'Most separations are unremarkable. The median separation year’s residual is small; this is a tail, and the tail is what the totals are made of.',
  'A separation year can be a partial year. Someone who left in March has a smaller base and a compressed record, which distorts any comparison against their own full-year history.',
  'The liability and the payroll data are different measures. One is an audited balance-sheet estimate of leave owed; the other is cash that moved. They should move together over time, but they will not tie out year to year.',
  'None of this implies anyone was paid something they had not earned. Accrued leave is compensation employees banked under contracts the Town signed. The question is whether the Town is tracking and funding what it owes.',
]

export const whatWouldSettleIt = {
  document: 'The Town’s audited financial statements and Annual Financial Report',
  line: 'Compensated Absences (account 687), Schedule of Non-Current Governmental Liabilities, plus the notes disclosing how the liability is measured',
  ask: 'A schedule of accrued leave balances by bargaining unit, and the annual cash paid out on separation — neither of which the Town currently publishes, though both exist in its payroll system.',
}
