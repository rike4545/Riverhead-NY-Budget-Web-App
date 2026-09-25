// Fund balance / reserve policy analysis: compliance status, a one-time deployment
// plan, and peer-town benchmarking. Ported from the iOS app's FundBalanceDashboardView
// for web/app parity, but computed from the site's real data pipeline (the audited
// 2025 Unassigned balance, and the 2026 Adopted Budget appropriations) rather than
// duplicating those figures as fresh constants.

import { allOperatingFunds2026 } from './all-funds'
import { generalFundAfr } from './afr'
import { AUDITED_GENERAL_FUND, AUDITED_YEARS, FUND_BALANCE_CLASSES, type FundBalanceClass } from './audits'
import { countWord, FUND_BALANCE_POLICY, nameList, PEER_BALANCES } from './fund-balance-policies'

const generalFund2026 = allOperatingFunds2026.find((f) => f.code === 'A01')!

export const appropriations = generalFund2026.appropriations2026 // 69,113,159

/** The year-end every reserve figure on the site measures. */
export const RESERVE_YEAR = 2025

// Each year's balance by tier comes from the independent audit where there is
// one, and from the Town's unaudited Annual Financial Report where there is
// not yet. lib/audits.ts explains why the two differ.
const afrTier = (name: FundBalanceClass) =>
  (generalFundAfr.fundBalanceClasses.find((c) => c.class === name)?.values ?? {}) as Record<string, number>
const tierYears = Object.keys(afrTier('Unassigned')).concat(AUDITED_YEARS.map(String)).filter((y, i, all) => all.indexOf(y) === i).sort()
const tierValues = (name: FundBalanceClass): Record<string, number> =>
  Object.fromEntries(tierYears.map((y) => [y, AUDITED_GENERAL_FUND[Number(y)]?.classes[name] ?? afrTier(name)[y]]))

/** Whether a year's figures are the audit's or, until the audit is out, the Annual Financial Report's. */
export const fundBalanceSource = (year: number | string): 'audit' | 'afr' => (AUDITED_GENERAL_FUND[Number(year)] ? 'audit' : 'afr')
export const reserveYearAudited = fundBalanceSource(RESERVE_YEAR) === 'audit'

export const unassignedFundBalance = tierValues('Unassigned')[String(RESERVE_YEAR)] // 28,829,513, audited
/** The same balance as the Town's unaudited Annual Financial Report filed it: 29,671,084.17. */
export const unassignedFundBalanceAfr = afrTier('Unassigned')[String(RESERVE_YEAR)]

// The Town's policy, Resolution 918 of 2011, and the written rules of nearby
// towns live in lib/fund-balance-policies.ts, which has no imports so the
// build can check every quote in it against its source.
export { FUND_BALANCE_POLICY } from './fund-balance-policies'

export const policyMinimumPercent = FUND_BALANCE_POLICY.floorPercent
/** This site's modeled reserve for its one-time plan below — not a Town target. The Town sets only the 15% floor. */
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

/** The policy's floor in dollars: 15% of the 2026 General Fund budget. */
export const minimumRequired = Math.max(0, appropriations * policyMinimumPercent)
/**
 * Unassigned balance above the 15% floor — the money the policy says may be
 * used to cut the next year's taxes, for one-time capital or for storms.
 *
 * Measured on the unassigned balance, which is stricter than the policy's own
 * test (the total, including reserves) and so never overstates what is free.
 */
export const surplusAboveFloor = unassignedFundBalance - minimumRequired

/**
 * The five GASB fund-balance classifications, which the AFR reports and this
 * site had been reducing to one number.
 *
 * GASB Statement 54 splits a governmental fund's balance by how hard it is to
 * spend, from money that cannot be spent at all to money spendable on anything.
 * Every figure on this page that talks about "surplus" means the last tier,
 * Unassigned — and a reader is entitled to see that it is one of five, and how
 * large the other four are.
 *
 * Definitions are the standard ones, written plainly. The numbers are the
 * independent audits' for every year that has one, and the Annual Financial
 * Report's for a year that does not yet.
 */
export type FundBalanceTier = {
  name: string
  what: string
  spendable: 'no' | 'constrained' | 'yes'
  values: Record<string, number>
}

const TIER_MEANING: Record<FundBalanceClass, { what: string; spendable: FundBalanceTier['spendable'] }> = {
  Nonspendable: {
    what: 'Cannot be spent — either not in spendable form, like inventory or prepaid items, or legally required to stay intact, like the principal of an endowment.',
    spendable: 'no',
  },
  Restricted: {
    what: 'Constrained by someone outside the Town: a creditor, a grantor, another government, or a law or constitutional provision.',
    spendable: 'constrained',
  },
  Committed: {
    what: 'Constrained by the Town Board itself, by formal action. It takes the same kind of action to undo, which is what separates this from Assigned.',
    spendable: 'constrained',
  },
  Assigned: {
    what: 'Intended for a particular use by the Board or an official it delegates to, but not formally restricted or committed. The intent can be changed without a vote.',
    spendable: 'constrained',
  },
  Unassigned: {
    what: 'The residual in the General Fund — spendable on any lawful purpose. This is the tier every reserve percentage on this page is measured against.',
    spendable: 'yes',
  },
}

export const fundBalanceTiers: FundBalanceTier[] = FUND_BALANCE_CLASSES.map((name) => ({
  name,
  what: TIER_MEANING[name].what,
  spendable: TIER_MEANING[name].spendable,
  values: tierValues(name),
}))

export const fundBalanceYears = Object.keys(fundBalanceTiers[0]?.values ?? {}).sort()
export const latestFundBalanceYear = fundBalanceYears[fundBalanceYears.length - 1]
export const earliestFundBalanceYear = fundBalanceYears[0]

const tierTotal = (year: string) =>
  fundBalanceTiers.reduce((sum, t) => sum + (t.values[year] ?? 0), 0)

export const totalFundBalance = tierTotal(latestFundBalanceYear)
export const constrainedFundBalance = totalFundBalance - unassignedFundBalance
/** The Town policy's own measure: the total General Fund balance, including reserves, against the budget. */
export const policyMeasurePercent = appropriations > 0 ? totalFundBalance / appropriations : 0

/**
 * Where the growth went. Between the first and last year here, the
 * unconstrained tier is the one that moved — which is why this site measures
 * the cushion on Unassigned, and why the total is a misleading headline on its
 * own even though the Town's policy is written against it.
 */
export const fundBalanceTrend = fundBalanceTiers.map((t) => {
  const from = t.values[earliestFundBalanceYear] ?? 0
  const to = t.values[latestFundBalanceYear] ?? 0
  return {
    name: t.name,
    from,
    to,
    change: to - from,
    pct: from > 0 ? ((to - from) / from) * 100 : null,
  }
})

export const fundBalanceReading =
  `Of ${totalFundBalance.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })} in total General Fund balance at the close of ${latestFundBalanceYear}, ` +
  `${unassignedFundBalance.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })} is Unassigned — spendable on anything lawful — and ` +
  `${constrainedFundBalance.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })} sits in the four constrained tiers. ` +
  'Every percentage on this page measures the Unassigned tier, the only money free for any use. The Town’s own policy measures the total, including reserves, so this page’s test is the stricter one.'


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

// ── What nearby towns hold ──────────────────────────────────────────────────
// Every town on one measure: the total General Fund balance at the end of 2025
// over the 2026 General Fund budget. It is the only measure all three
// neighbors' budgets report, so Riverhead appears on its audited total, not the
// stricter unassigned figure the rest of this page tests. The average counts
// the neighbors' balances and nothing else.
export type PeerHolding = {
  town: string
  total: number
  budget: number
  percent: number
  detail: string
  own?: boolean
  source?: { label: string; url: string }
}

export const peerHoldings: PeerHolding[] = [
  ...PEER_BALANCES.map((b) => ({ town: b.town, total: b.total, budget: b.budget, percent: b.total / b.budget, detail: b.detail, source: b.source })),
  {
    town: 'Riverhead',
    total: totalFundBalance,
    budget: appropriations,
    percent: policyMeasurePercent,
    detail: `Audited total at the end of ${latestFundBalanceYear}, reserves included.`,
    own: true,
  },
].sort((a, b) => b.percent - a.percent)

const neighborHoldings = peerHoldings.filter((p) => !p.own)
/** The simple average of the neighbors' shares — balances only, all on the same measure. */
export const peerHoldingsAverage = neighborHoldings.reduce((sum, p) => sum + p.percent, 0) / neighborHoldings.length
export const peerHoldingsTowns = neighborHoldings.map((p) => p.town)
const riverheadHolding = peerHoldings.find((p) => p.own)!
/** Where Riverhead falls among the neighbors on this measure, in words. */
export const peerHoldingsReading = (() => {
  const more = neighborHoldings.filter((p) => p.percent > riverheadHolding.percent).map((p) => p.town)
  const less = neighborHoldings.filter((p) => p.percent < riverheadHolding.percent).map((p) => p.town)
  const sides = [more.length ? `less than ${nameList(more)}` : '', less.length ? `more than ${nameList(less)}` : ''].filter(Boolean)
  return `On it, Riverhead holds ${sides.join(' and ')}, and ${riverheadHolding.percent < peerHoldingsAverage ? 'less' : 'more'} than the ${countWord(neighborHoldings.length).toLowerCase()} neighbors’ average.`
})()

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
