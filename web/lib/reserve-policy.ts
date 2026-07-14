// Fund balance / reserve policy analysis: compliance status, a one-time deployment
// plan, and peer-town benchmarking. Ported from the iOS app's FundBalanceDashboardView
// for web/app parity, but computed from the site's real data pipeline (the AFR-sourced
// actual 2025 Unassigned balance, and the 2026 Adopted Budget appropriations) rather than
// duplicating those figures as fresh constants.

import { allOperatingFunds2026 } from './all-funds'
import { generalFundAfr } from './afr'

const generalFund2026 = allOperatingFunds2026.find((f) => f.code === 'A01')!

export const appropriations = generalFund2026.appropriations2026 // 69,113,159
export const unassignedFundBalance =
  generalFundAfr.fundBalanceClasses.find((c) => c.class === 'Unassigned')!.values['2025'] // 29,671,084.17, actual FY2025 AFR

export const policyMinimumPercent = 0.15
export const policyUpperPercent = 0.2
export const targetReservePercent = 0.288

export type FundBalanceHealth = 'healthy' | 'watch' | 'atRisk'

export function percentOfAppropriations(balance: number, approp: number): number {
  return approp === 0 ? 0 : balance / approp
}

export function fundBalanceHealth(pct: number, minPercent: number): FundBalanceHealth {
  if (pct >= minPercent * 1.15) return 'healthy'
  if (pct >= minPercent) return 'watch'
  return 'atRisk'
}

export const minimumRequired = Math.max(0, appropriations * policyMinimumPercent)
export const targetUpper = Math.max(0, appropriations * policyUpperPercent)
export const surplusAboveUpper = unassignedFundBalance - targetUpper

export const targetUnassignedAt288 = appropriations * targetReservePercent
export const deployableAbove288 = Math.max(0, unassignedFundBalance - targetUnassignedAt288)

export type DeploymentOption = {
  number: number
  title: string
  amount: number
  detail: string
}

export const deploymentOptions: DeploymentOption[] = [
  {
    number: 1,
    title: 'Clean up the current General Fund mismatch',
    amount: 74283,
    detail:
      'Use one-time money first to close the current A01 imbalance identified in the 2026 supplement before calling anything else balanced.',
  },
  {
    number: 2,
    title: 'Crush BAN interest before it compounds',
    amount: 1233750,
    detail:
      'The 2026 adopted budget shows BAN interest in the Debt Service Fund at about $1.234M. A one-time reserve deployment here directly reduces financing drag.',
  },
  {
    number: 3,
    title: 'Retire BAN principal early',
    amount: 1025000,
    detail:
      'The adopted V01 debt schedule also carries about $1.025M of BAN principal. Paying that down reduces rollover risk and future interest exposure.',
  },
  {
    number: 4,
    title: 'Use excess fund balance for CPF debt reduction',
    amount: 2000000,
    detail:
      "Riverhead's CPF debt began as roughly $70M borrowed against future fund revenue, was refunded in 2016, and RiverheadLOCAL reported about $12.29M still outstanding as of December 31, 2024. Using some excess fund balance for a one-time CPF principal payment should lower future interest cost and shorten the payoff path.",
  },
  {
    number: 5,
    title: 'File a one-time Legal Aid support grant',
    amount: 15000,
    detail:
      'Reserve a one-time $15,000 grant application to the Legal Aid Society of Suffolk County as a targeted community-support investment that does not create a recurring operating obligation.',
  },
  {
    number: 6,
    title: 'Launch a community improvement micro-grant series',
    amount: 50000,
    detail:
      'Reserve one-time funding for a visible run of small grants of about $500 to $1,000 each, up to $50,000 total, for block-scale beautification, civic ideas, or neighborhood improvement projects.',
  },
  {
    number: 7,
    title: 'Fund a visible innovation and service package',
    amount: 608294.61,
    detail:
      "This covers building capacity, online modernization, added code enforcement, one Town Clerk position, and two police positions.",
  },
]

export const remainingAfterDeploymentOptions = Math.max(
  0,
  deployableAbove288 - deploymentOptions.reduce((sum, o) => sum + o.amount, 0)
)

export type PeerBenchmark = {
  town: string
  percent: number
  detail: string
}

export const peerBenchmarks: PeerBenchmark[] = [
  {
    town: 'Riverhead target',
    percent: targetReservePercent,
    detail: 'Modeled target for this plan: 28.8% of the General Fund budget after one-time deployment.',
  },
  {
    town: 'Brookhaven',
    percent: 60023184 / 154611894,
    detail:
      "Brookhaven's 2026 adopted General Town Wide unreserved fund balance is about $60.0M against about $154.6M of budgeted expenditures, or roughly 38.8%.",
  },
  {
    town: 'Smithtown',
    percent: 24099593 / 60384813,
    detail:
      "Smithtown's 2026 tentative General Fund projected fund balance is about $24.1M against roughly $60.4M of projected annual scale, or about 39.9%.",
  },
  {
    town: 'East Hampton',
    percent: (29709031 + 19034693) / 86782601,
    detail:
      "East Hampton's 2026 adopted General Fund projection totals about $48.7M across whole-town and part-town balances against roughly $86.8M of General Fund appropriations, or about 56.2%.",
  },
  {
    town: 'Southampton policy',
    percent: 0.17,
    detail:
      "Southampton's 2026 adopted financial policy sets a general-fund reserve structure of 10% restricted plus at least 7% unallocated, for a 17% benchmark.",
  },
]

export type PeerAlignmentScenario = {
  label: string
  percent: number
  targetBalance: number
  deploymentCapacity: number
  detail: string
}

function scenario(label: string, percent: number, detail: string): PeerAlignmentScenario {
  const targetBalance = appropriations * percent
  return { label, percent, targetBalance, deploymentCapacity: unassignedFundBalance - targetBalance, detail }
}

const allPeerAverage = peerBenchmarks.filter((p) => p.town !== 'Riverhead target').reduce((sum, p) => sum + p.percent, 0) / 4

export const peerAlignmentScenarios: PeerAlignmentScenario[] = [
  scenario(
    'Match Brookhaven',
    60023184 / 154611894,
    'A Brookhaven-style posture would still leave Riverhead with a large cushion and only modest one-time deployment capacity.'
  ),
  scenario(
    'Match Smithtown',
    24099593 / 60384813,
    "A Smithtown-style posture lands close to Brookhaven and still preserves most of Riverhead's current reserve strength."
  ),
  scenario(
    'Match East Hampton',
    (29709031 + 19034693) / 86782601,
    'An East Hampton-style posture would require Riverhead to hold more back than it has now, so it reads as a high-reserve outlier rather than a practical deployment target.'
  ),
  scenario(
    'Match Southampton policy',
    0.17,
    "A Southampton-style policy floor would release a very large amount of one-time money, but it is much leaner than Riverhead's current posture and likely too aggressive as a first reset."
  ),
  scenario(
    'Match average of peers',
    allPeerAverage,
    'Using the simple average of Brookhaven, Smithtown, East Hampton, and Southampton lands Riverhead near 38.0%, still notably above the current 28.8% target.'
  ),
]
