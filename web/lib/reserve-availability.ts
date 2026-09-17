// A ceiling on what is left of the cushion, after the votes the Board has
// already taken this year. A ceiling, never a balance — see unassignedCeiling.
//
// WHY THIS EXISTS. /reserves/ priced its entire deployment plan against
// unassignedFundBalance — $29,671,084, the AUDITED POSITION AT DECEMBER 31,
// 2025. That is an opening balance, not an availability. The Board has been
// drawing against it all through 2026, and a dollar already voted cannot fund a
// suggested action as well.
//
// This is the same defect #44 fixed on /predict-2027/ and /zero-percent-2027/,
// whose commit message says it plainly: "The page was offering an opening
// balance as though it were headroom." That correction never reached
// /reserves/, which is the page where it matters most, because it is the one
// carrying a deployment plan and a drawdown slider.
//
// WHY A THIRD MODULE. fiscal-commitments-2027 already imports reserve-policy
// for surplusAboveUpper, so reserve-policy cannot import it back without a
// cycle. The dependency runs one way into this file and out of neither of them:
// reserve-policy stays the reported-and-policy layer, fiscal-commitments-2027
// stays the resolution layer, and the netting lives here.

import {
  appropriations,
  deploymentOptions,
  peerAlignmentScenarios,
  percentOfAppropriations,
  policyMinimumPercent,
  targetReservePercent,
  targetUnassignedAt288,
  targetUpper,
  unassignedFundBalance,
  type DeploymentOption,
} from './reserve-policy'
import {
  committedAuthorized,
  committedDocumented,
  committedTotal,
  remainingHeadroomCeiling,
} from './fiscal-commitments-2027'

/**
 * The 2026 General Fund commitments netted here.
 *
 * Split by provenance because the total is not one source: the documented part
 * is read from Section G, where the Town names its own 9999 account; the rest
 * is separately sourced resolutions whose statements name no account code.
 * Attributing all of it to the Fiscal Impact Statements would overstate how
 * much of this figure the Town itself wrote down.
 */
export { committedDocumented, committedAuthorized }
/** The 2026 General Fund commitments netted here, from the resolution record. */
export const committedThisYear = committedTotal

/** The reported opening balance, kept named so the page cannot confuse the two. */
export const openingUnassigned = unassignedFundBalance

/**
 * Opening balance less what 2026 has committed — a CEILING, not a balance.
 *
 * fiscal-commitments-2027's own `limits` say why, and this module must not
 * quietly contradict them: "every total here is a floor on what was committed
 * and every remaining-headroom figure is a ceiling on what is left. Neither is
 * a balance." The committed side is a floor because adopted draws that state no
 * amount are counted at zero, so the real remainder can be lower. And fund
 * balance moves for reasons no resolution records at all — revenue beating
 * budget, departments underspending, which together swung the General Fund $8.6
 * million to the GOOD in 2023 — so it can also be higher.
 *
 * There is no 2026 financial report. The true current balance is unknown and
 * stays unknown until the Town files one. What this number is good for is the
 * comparison: it is what the opening position becomes once the votes already on
 * the record are taken off it, and that is strictly more honest than pricing a
 * plan against an opening balance as though nothing had happened since.
 */
export const unassignedCeiling = openingUnassigned - committedThisYear

export const openingPercentOfAppropriations = percentOfAppropriations(openingUnassigned, appropriations)
export const ceilingPercentOfAppropriations = percentOfAppropriations(unassignedCeiling, appropriations)

/** Still comfortably above the policy floor — the verdict does not change. */
export const ceilingStillAbovePolicyFloor = ceilingPercentOfAppropriations >= policyMinimumPercent

/**
 * Surplus above the 20% upper target, netted. Identical by construction to
 * remainingHeadroomCeiling on /predict-2027/, and imported rather than
 * recomputed so the two pages cannot drift into quoting different numbers for
 * the same quantity — which is exactly what they were doing.
 */
export const surplusAboveUpperCeiling = remainingHeadroomCeiling

/** One-time money above the 28.8% target, after 2026's votes. */
export const deployableAbove288Ceiling = Math.max(0, unassignedCeiling - targetUnassignedAt288)

/**
 * The 28.8% plan measured against money that still exists.
 *
 * The plan was published against the opening balance and fits it with room to
 * spare. Against the netted pool it does not fit, and the options are NOT
 * quietly trimmed to make it fit: each one is run in published order with the
 * balance after it, so a reader can see exactly which option the money stops
 * at. Reordering or dropping entries would be this site choosing the Town's
 * priorities, which is not its job.
 */
/**
 * Does this option pay for something that recurs?
 *
 * Read from the option's own description rather than asserted, so the claim
 * stays tied to the text it is about. It matters because the caveat at the top
 * of /reserves/ says one-time money suits debt paydown and capital rather than
 * permanent new spending — an option funding posts is in tension with the
 * page's own rule, and that is worth saying next to the option instead of in a
 * loose paragraph that would be pointing at the wrong row the moment the split
 * moved.
 */
const RECURRING_IN_DETAIL = /\bpositions?\b|\bposts?\b|\bstaffing\b|\bsalar(?:y|ies)\b/i

export type DeploymentLedgerRow = DeploymentOption & {
  remainingAfter: number
  coveredInFull: boolean
  fundsRecurringCost: boolean
}

export const deploymentLedger: DeploymentLedgerRow[] = (() => {
  let running = deployableAbove288Ceiling
  return deploymentOptions.map((o) => {
    const coveredInFull = running >= o.amount
    running -= o.amount
    return { ...o, remainingAfter: running, coveredInFull, fundsRecurringCost: RECURRING_IN_DETAIL.test(o.detail) }
  })
})()

/**
 * The plan split at the point the money runs out.
 *
 * Derived from the ledger rather than hard-coded to a position, so if a draw
 * lands, an option is repriced, or 2026 results change the ceiling, the split
 * moves on its own instead of going stale. When everything fits, unfunded is
 * empty and the page renders the plan as one list.
 *
 * Note the split is by running balance in PUBLISHED ORDER, not by picking the
 * cheapest items that fit. Reordering to maximise how many get funded would be
 * this site ranking the Town's priorities, which is not its job.
 */
export const fundedOptions = deploymentLedger.filter((r) => r.coveredInFull)
export const unfundedOptions = deploymentLedger.filter((r) => !r.coveredInFull)

export const fundedTotal = fundedOptions.reduce((s, o) => s + o.amount, 0)
export const unfundedTotal = unfundedOptions.reduce((s, o) => s + o.amount, 0)
/** What is still unallocated once every option the ceiling covers is funded. */
export const leftoverAfterFunded = deployableAbove288Ceiling - fundedTotal
/** How much of the first option that does not fit the leftover would cover. */
export const partialCoverageOfNext =
  unfundedOptions.length > 0 && unfundedOptions[0].amount > 0
    ? leftoverAfterFunded / unfundedOptions[0].amount
    : null

export const deploymentPlanTotal = deploymentOptions.reduce((s, o) => s + o.amount, 0)
/**
 * The reserve percentage that would fund the published plan in full.
 *
 * The other side of the trade, stated so the page does not present dropping an
 * option as the only way out: holding less back frees the difference.
 */
export const targetForFullPlan =
  appropriations > 0 ? (unassignedCeiling - deploymentPlanTotal) / appropriations : targetReservePercent
export const deploymentPlanShortfall = Math.max(0, deploymentPlanTotal - deployableAbove288Ceiling)
export const deploymentPlanFits = deploymentPlanShortfall === 0

/**
 * Which options are even large enough to absorb the shortfall on their own.
 *
 * The obvious question once a plan does not fit is what to trim, and the
 * answer is constrained before anyone reaches a preference: an option smaller
 * than the gap cannot close it however completely it is cut. Stating that
 * first keeps the discussion off the four small items, where it would
 * otherwise start.
 */
/**
 * What kind of thing a trim to this option would be.
 *
 * Keyed by the option's own number rather than sniffed from its prose: these
 * are judgments about what each line buys, and a regex guessing at them would
 * be worse than saying nothing. An option without an entry simply renders no
 * note, and one that is removed takes its note with it — which is the property
 * the loose paragraph this replaces did not have.
 */
const TRIM_CHARACTER: Record<number, string> = {
  1: 'Closes a stated imbalance, so a part payment leaves it open.',
  2: 'Buys down future interest, so a trim costs more later than the figure here shows.',
  3: 'Buys down future interest, so a trim costs more later than the figure here shows.',
  4: 'A part payment toward a liability its own entry calls larger than the whole deployable surplus, so a trim changes how much is set aside and nothing else.',
}

export type AbsorptionRow = DeploymentOption & {
  canAbsorbAlone: boolean
  /** Share of this option that would have to go, if it is big enough. */
  trimFraction: number | null
  remainsAfterTrim: number | null
  fundsRecurringCost: boolean
  /** What a trim here would mean, where this page has something to say. */
  trimCharacter: string | null
}

export const absorptionOptions: AbsorptionRow[] = deploymentLedger.map((o) => {
  const canAbsorbAlone = deploymentPlanShortfall > 0 && o.amount >= deploymentPlanShortfall
  return {
    ...o,
    canAbsorbAlone,
    trimFraction: canAbsorbAlone ? deploymentPlanShortfall / o.amount : null,
    remainsAfterTrim: canAbsorbAlone ? o.amount - deploymentPlanShortfall : null,
    trimCharacter: TRIM_CHARACTER[o.number] ?? null,
  }
})

/**
 * Every option too small to close the gap by itself — and whether several of
 * them together would.
 *
 * Both halves are reported because one without the other misleads. "No single
 * small item can absorb this" is true and invites the conclusion that only the
 * large items are candidates, which is false: here the four smallest come to
 * $266,283 against a $163,366 gap, so combinations of them do close it.
 */
export const tooSmallToAbsorb = absorptionOptions.filter((o) => !o.canAbsorbAlone)
export const tooSmallCombined = tooSmallToAbsorb.reduce((s, o) => s + o.amount, 0)
export const smallOnesTogetherCover =
  deploymentPlanShortfall > 0 && tooSmallCombined >= deploymentPlanShortfall
export const spareIfAllSmallDropped = tooSmallCombined - deploymentPlanShortfall

/** The first option the netted pool cannot cover in full, if any. */
export const firstUnfundedOption = deploymentLedger.filter((r) => !r.coveredInFull)[0] ?? null

const usd = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
const pct = (n: number) => `${(n * 100).toFixed(1)}%`

export const availabilityReading =
  `The ${usd(openingUnassigned)} above is what the Town reported at December 31, 2025 — its own filing with the ` +
  `State Comptroller, not an independent audit. Through the meetings published so far the Board has committed ` +
  `${usd(committedThisYear)} of it, which puts a ceiling of ${usd(unassignedCeiling)} on what is left: ` +
  `${pct(ceilingPercentOfAppropriations)} of appropriations rather than ${pct(openingPercentOfAppropriations)}. ` +
  `A ceiling and not a balance — there is no 2026 financial report, several adopted draws state no amount so the ` +
  `committed side is itself a floor, and fund balance moves for reasons no resolution records. The compliance ` +
  `verdict does not turn on which end you take: both figures clear the ` +
  `${(policyMinimumPercent * 100).toFixed(0)}% policy floor comfortably. What the netting changes is how much ` +
  `one-time money a plan can responsibly assume.`

export const planReading = deploymentPlanFits
  ? `The plan totals ${usd(deploymentPlanTotal)} and fits the ${usd(deployableAbove288Ceiling)} available above the ${pct(targetReservePercent)} target.`
  : `For scale: against the reported opening balance the plan fit with ${usd(Math.max(0, unassignedCeiling + committedThisYear - targetUnassignedAt288) - deploymentPlanTotal)} to spare, which is the version published before 2026's votes were netted.`

/**
 * The peer scenarios, re-measured against money that still exists.
 *
 * "If Riverhead matched Brookhaven, how much one-time room would that create?"
 * is a question about the balance today, not the one on December 31. The
 * targets themselves are unchanged — they are a percentage of appropriations,
 * which 2026's votes do not move — so only the capacity figure is recomputed.
 */
export const peerAlignmentScenariosNet = peerAlignmentScenarios.map((p) => ({
  ...p,
  deploymentCapacity: unassignedCeiling - p.targetBalance,
  deploymentCapacityAtOpening: p.deploymentCapacity,
}))

/** Kept for the callout: the upper target is unchanged by any of this. */
export { targetUpper, targetUnassignedAt288, targetReservePercent, appropriations, policyMinimumPercent }
