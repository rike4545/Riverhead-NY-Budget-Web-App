// Closing the *real* 2027 constraint — the tax-cap gap — and the politically
// durable path through a divided Town Board.
//
// Two different "gaps" appear in the 2027 planning views and they measure
// different things; conflating them is the most common way to misread this
// page:
//   • payroll-pressure gap  ($936,727) — the recurring automatic cost the Town
//     must cover just to stand still (the spending-reduction package is sized
//     against this).
//   • cap-piercing gap     ($2,619,382) — how far the projected 2027 levy
//     overshoots what NY's 2% property-tax cap allows. This is the number that
//     actually forces a political decision: cut, raise other revenue, spend
//     reserves, or override the cap.
//
// The retirement-incentive figures are the Town's own: 53 eligible employees
// and a $500K–$800K savings projection (RiverheadLOCAL, July 9, 2026, quoting
// Financial Administrator DiPaola). The executed program terms live in
// buyout-2026.ts (resolutions 2026-678/679/680, adopted unanimously July 7,
// 2026). Board composition is from BoardElectionsData / the July 7 roster.

import prediction from '../public/data/budget-2027-prediction.json'
import { personnelPolicyTotal, operationalTotal, supplementTrimItems } from './spending-reduction-2027'
import { unassignedFundBalance } from './reserve-policy'

/** The cap gap as prose ("$2.32M"), and what appropriating all of it would cost
    the unassigned cushion. Both derived, so neither can drift from the model. */
const capGapAsMillions = `$${(prediction.capGap.gap / 1_000_000).toFixed(2)}M`
const gapShareOfUnassignedPct = ((prediction.capGap.gap / unassignedFundBalance) * 100).toFixed(1)

// Read live from the projection. Do not annotate these with the current values:
// the comments here drifted a full model run out of date while the code stayed
// correct, which is worse than no comment at all.
export const capGap2027 = {
  gap: prediction.capGap.gap,
  allowedLevy: prediction.capGap.allowedLevy,
  predictedLevy: prediction.capGap.predictedLevy,
  predictedLevyPct: prediction.capGap.predictedLevyPct,
  capBasePct: prediction.capGap.capBasePct,
}

// The firmest, least-arguable recurring savings: personnel-policy items +
// audited operational anomalies + only the FIRM-confidence supplement trims
// (excludes moderate capital-timing and volatile fuel/energy items).
export const firmSupplementTotal = supplementTrimItems
  .filter((i) => i.confidence === 'firm')
  .reduce((s, i) => s + i.amount, 0)

export const firmRecurringTotal = personnelPolicyTotal + operationalTotal + firmSupplementTotal

// The Town's own retirement-incentive program, as a gap-closing lever.
export const retirementIncentive2027 = {
  approved: 'July 7, 2026 — unanimous Town Board vote',
  resolutions: '2026-678 (CSEA), 2026-679 (SOA), 2026-680 (PBA)',
  eligibleTotal: 53,
  eligible: [
    { unit: 'CSEA', count: 29, benefit: 'Flat $12,500 lump sum' },
    { unit: 'PBA', count: 18, benefit: '$1,000 / year of service + up to 30 accrued sick days' },
    { unit: 'SOA', count: 6, benefit: '$1,000 / year of service + up to 30 accrued sick days' },
  ] as const,
  projectedSavingsLow: 500_000,
  projectedSavingsHigh: 800_000,
  savingsWindow: 'the rest of 2026 and the full 2027 budget year',
  electionDeadline: 'September 1, 2026',
  retireBy: 'October 1, 2026',
  note:
    "The savings figure is the Town's own projection; the final number depends on how many of the 53 eligible employees actually elect to retire by the September 1, 2026 deadline, and on how each vacated post is refilled.",
}

// How each lever fares on a divided board (1 Democratic Supervisor + a 4-member
// Republican Council majority). "standing" describes political durability, not
// dollars.
export type GapPath = {
  name: string
  closes: string
  standing: 'already agreed' | 'low-friction' | 'neutral' | 'one-time' | 'deliberate' | 'blunt'
  politics: string
}

export const gapClosingPaths: GapPath[] = [
  {
    name: 'Bank the retirement-incentive savings the whole Board already voted for',
    closes: '$500K–$800K recurring (Town projection)',
    standing: 'already agreed',
    politics:
      "The three union incentives passed 5–0 on July 7, 2026. Refilling the vacated posts at a lower step is the one salary saving both the Democratic Supervisor and the Republican majority have already endorsed — no new fight to have.",
  },
  {
    name: 'Stack the sourced, audit-driven line trims',
    closes: `~${usd(firmRecurringTotal)} in firm-confidence recurring trims`,
    standing: 'low-friction',
    politics:
      "Each trim is tied to a specific, documented anomaly in the Town's own budget — a line that jumped 800%, 1,563%, or budgeted well above its own trailing actuals. Opposing one means defending an unexplained increase on the record, which is hard to do along party lines. These aren't program choices; they're accountability questions.",
  },
  {
    name: 'Grow non-property-tax revenue',
    closes: '$1 off the levy for every $1 of new state aid, fees, mortgage tax, or interest',
    standing: 'neutral',
    politics:
      'Offsets the cap-busting levy dollar-for-dollar with no service cut and no tax increase — the rare move with nothing for either side to run against.',
  },
  {
    name: 'Use a modest, disclosed one-time fund-balance appropriation for the residual only',
    closes: 'whatever gap remains after the recurring measures above',
    standing: 'one-time',
    politics:
      `An easy vote — it raises no tax and cuts no service — but it spends one-time money on recurring cost, so it can only bridge a transitional remainder, not the whole gap. Appropriating the full ${capGapAsMillions} would burn ~${gapShareOfUnassignedPct}% of the $29.7M unassigned fund balance — the truly flexible cushion — for something that recurs.`,
  },
  {
    name: 'If the Board still wants the spending, override the cap — deliberately and in public',
    closes: 'the full gap, by raising the legal ceiling',
    standing: 'deliberate',
    politics:
      'The cap can be exceeded legally: adopt the override local law first, in the open, with the 60% vote on the record — as Riverhead did in 2023, 2024, and 2026. The problem to avoid is piercing the cap by accident; a disclosed, on-purpose override is a legitimate choice, not a violation.',
  },
  {
    name: 'The blunt shortcut: an across-the-board 2.5% cut',
    closes: '~$2.1M on paper',
    standing: 'blunt',
    politics:
      "Politically tempting because it sounds even-handed, but it overstates what's actually cuttable — most of the base is personnel and mandated costs a flat directive can't touch — and it hits services indiscriminately. See the flat-cut table below.",
  },
]

function usd(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}
