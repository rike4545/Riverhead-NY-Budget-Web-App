// What is actually left of the cushion, after the votes the Board has already
// taken this year.
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
// reserve-policy stays the audited-and-policy layer, fiscal-commitments-2027
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
import { committedTotal, remainingHeadroomCeiling } from './fiscal-commitments-2027'

/** The 2026 General Fund commitments netted here, from the resolution record. */
export const committedThisYear = committedTotal

/** The audited opening balance, kept named so the page cannot confuse the two. */
export const openingUnassigned = unassignedFundBalance

/** Opening balance less what 2026 has already committed. */
export const availableUnassigned = openingUnassigned - committedThisYear

export const openingPercentOfAppropriations = percentOfAppropriations(openingUnassigned, appropriations)
export const availablePercentOfAppropriations = percentOfAppropriations(availableUnassigned, appropriations)

/** Still comfortably above the policy floor — the verdict does not change. */
export const availableStillAbovePolicyFloor = availablePercentOfAppropriations >= policyMinimumPercent

/**
 * Surplus above the 20% upper target, netted. Identical by construction to
 * remainingHeadroomCeiling on /predict-2027/, and imported rather than
 * recomputed so the two pages cannot drift into quoting different numbers for
 * the same quantity — which is exactly what they were doing.
 */
export const availableSurplusAboveUpper = remainingHeadroomCeiling

/** One-time money above the 28.8% target, after 2026's votes. */
export const deployableAbove288Net = Math.max(0, availableUnassigned - targetUnassignedAt288)

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
export type DeploymentLedgerRow = DeploymentOption & {
  remainingAfter: number
  coveredInFull: boolean
}

export const deploymentLedger: DeploymentLedgerRow[] = (() => {
  let running = deployableAbove288Net
  return deploymentOptions.map((o) => {
    const coveredInFull = running >= o.amount
    running -= o.amount
    return { ...o, remainingAfter: running, coveredInFull }
  })
})()

export const deploymentPlanTotal = deploymentOptions.reduce((s, o) => s + o.amount, 0)
export const deploymentPlanShortfall = Math.max(0, deploymentPlanTotal - deployableAbove288Net)
export const deploymentPlanFits = deploymentPlanShortfall === 0
/** The first option the netted pool cannot cover in full, if any. */
export const firstUnfundedOption = deploymentLedger.filter((r) => !r.coveredInFull)[0] ?? null

const usd = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
const pct = (n: number) => `${(n * 100).toFixed(1)}%`

export const availabilityReading =
  `The ${usd(openingUnassigned)} above is the audited balance at December 31, 2025. ` +
  `Through the meetings published so far, the Board has committed ${usd(committedThisYear)} of it, ` +
  `leaving ${usd(availableUnassigned)} — ${pct(availablePercentOfAppropriations)} of appropriations rather than ` +
  `${pct(openingPercentOfAppropriations)}. That is still well above the ${(policyMinimumPercent * 100).toFixed(0)}% policy floor, ` +
  `so the compliance verdict does not change; what changes is how much one-time money is actually free.`

export const planReading = deploymentPlanFits
  ? `The plan totals ${usd(deploymentPlanTotal)} and still fits the ${usd(deployableAbove288Net)} available above the ${pct(targetReservePercent)} target.`
  : `The plan was published against the opening balance, where it fit with ${usd(Math.max(0, unassignedFundBalance - targetUnassignedAt288) - deploymentPlanTotal)} to spare. ` +
    `Against what is left it does not: ${usd(deploymentPlanTotal)} of options against ${usd(deployableAbove288Net)} available, ` +
    `a shortfall of ${usd(deploymentPlanShortfall)}. The options are listed in published order with the balance after each, ` +
    `rather than reordered or trimmed, because choosing which to drop is the Board's call and not this site's.`

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
  deploymentCapacity: availableUnassigned - p.targetBalance,
  deploymentCapacityAtOpening: p.deploymentCapacity,
}))

/** Kept for the callout: the upper target is unchanged by any of this. */
export { targetUpper, targetUnassignedAt288, targetReservePercent, appropriations, policyMinimumPercent }
