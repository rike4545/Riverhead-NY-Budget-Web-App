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

export type CommunityGrant = {
  organization: string
  focus: string
  amount: number
}

// Illustrative one-time grant amounts, sized like the deployment plan's other
// single-nonprofit grants — not an official Town commitment or budget line.
export const communityBlockGrants: CommunityGrant[] = [
  {
    organization: 'Legal Aid Society of Suffolk County',
    focus: 'Civil legal services for low-income Suffolk County residents',
    amount: 15000,
  },
  {
    organization: 'Helping Hands of the East End',
    focus: 'Emergency assistance for East End families and individuals in crisis',
    amount: 10000,
  },
  {
    organization: 'RISE',
    focus: 'Long Island community and social-services nonprofit',
    amount: 10000,
  },
  {
    organization: 'Long Island Housing Partnership (LIHP)',
    focus: 'Regional affordable-housing development and homebuyer counseling',
    amount: 15000,
  },
]

export const communityBlockGrantsTotal = communityBlockGrants.reduce((sum, g) => sum + g.amount, 0)

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
    title: 'Start funding the accrued-leave reserve',
    amount: 1834915,
    detail:
      "Accrued leave owed to employees grew from $9,773,700 to $11,608,615 during 2025 — $1,834,915 in one year, none of it set aside. General Municipal Law § 6-p lets the Board create an Employee Benefit Accrued Liability Reserve by resolution and put one-time money into it. Funding one year's growth will not retire the liability, which is larger than the whole deployable surplus, but it stops the unfunded gap widening while the 2026 retirement incentive converts part of it to cash. Because this transfer is not already in the adopted budget, the Comptroller’s guidance is that it takes a board resolution stating the amount and naming the reserve being credited.",
  },
  {
    number: 5,
    title: 'CPF debt paydown — already done, and mostly not from this money',
    amount: 92000,
    detail:
      "This one is history rather than a proposal. On July 7, 2026 the Board adopted Resolution 2026-642 unanimously, retiring the remaining Community Preservation Fund land-preservation debt five years ahead of its 2030 maturity and saving about $660,000 in future interest. The money came almost entirely from the CPF’s own fund balance — about $7.2M on top of the $2.75M already budgeted for the year’s debt service — which is a separate fund and never part of the General Fund surplus shown above. Only about $92,000 of General Fund balance was needed, because a small slice of the same 2018 bond series is tied to the General Fund. The CPF was left holding roughly $20.1M.,",
  },
  {
    number: 6,
    title: 'File a round of community block grants',
    amount: communityBlockGrantsTotal,
    detail:
      'Reserve one-time grant applications to four community-service nonprofits serving Riverhead and the East End as targeted community-support investments that do not create a recurring operating obligation. See the breakdown below.',
  },
  {
    number: 7,
    title: 'Launch a community improvement micro-grant series',
    amount: 50000,
    detail:
      'Reserve one-time funding for a visible run of small grants of about $500 to $1,000 each, up to $50,000 total, for block-scale beautification, civic ideas, or neighborhood improvement projects.',
  },
  {
    number: 8,
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

// ---------------------------------------------------------------------------
// Every deployment option above SPENDS the one-time money. New York also lets a
// town move it into a formal reserve, which is a different legal thing from
// leaving it as unassigned fund balance: a statutory reserve is committed to a
// named purpose and takes board action to unwind.
//
// General Municipal Law §§6-c through 6-r are the reserves a town may create.
// Two of them match obligations Riverhead already carries. What the statute
// does NOT offer is a retiree-health (OPEB) trust — see lib/credit-rating.ts.

export type AuthorizedReserve = {
  citation: string
  name: string
  /** The Riverhead exposure this reserve is actually for. */
  exposure: string
  exposureAmount: number
  detail: string
}

export const authorizedReserves: AuthorizedReserve[] = [
  {
    citation: 'GML § 6-p',
    name: 'Employee Benefit Accrued Liability Reserve',
    exposure: 'Accrued leave owed at Dec. 31, 2025',
    exposureAmount: 11_608_615,
    detail:
      'Pays out accumulated sick, vacation and holiday time when employees separate. The liability has risen every year since 2023, and the 2026 retirement incentive converts part of it to cash inside a single budget year.',
  },
  {
    citation: 'GML § 6-r',
    name: 'Retirement Contribution Reserve',
    exposure: 'Net pension liability at Dec. 31, 2025',
    exposureAmount: 27_346_801,
    detail:
      "Absorbs swings in the Town's NYSLRS and PFRS bills. Riverhead's share moved from $21.4M to $27.3M in a single year on investment returns alone — movement the Town does not control and cannot budget away.",
  },
  {
    citation: 'GML § 6-e',
    name: 'Contingency and Tax Stabilization Reserve',
    exposure: 'Ceiling for Riverhead (10% of general + highway)',
    exposureAmount: 7_703_241,
    detail:
      'The one written for the problem the Town actually has. It may be used to lessen or prevent a projected levy increase above 2½%, and to absorb unanticipated revenue losses. For a town the ceiling is 10% of the town-wide general and highway funds — about $77.0M for 2026. Establishing it takes a board resolution subject to permissive referendum, and spending from it needs the chief executive officer’s recommendation plus a two-thirds board vote. If the balance ever exceeds the 10% ceiling, the excess must go to reducing the next year’s levy.',
  },
]

export const authorizedReservesNote =
  'Unassigned fund balance is spendable on anything. A statutory reserve is not: the money is committed to a named purpose, and the Board has to act to get it back out. The first two below are created by board resolution and need no referendum; the tax-stabilization reserve is subject to permissive referendum. What the law does not offer is a retiree-health (OPEB) trust; there is no such reserve in the statute, which is why the Town\u2019s $129.5M OPEB liability cannot be pre-funded no matter how large the surplus gets.'

export const authorizedReservesSource =
  'NYS Comptroller, “Reserve Funds” (Local Government Management Guide); General Municipal Law Article 2. Liability figures from the 2025 Annual Financial Report, Schedule W (accounts 687 and 638).'
