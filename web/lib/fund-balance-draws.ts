// Every resolution that spent fund balance this year, in one place.
//
// The Town uses accumulated surplus through two separate channels, and only the
// first is visible in the budget a resident can read.
//
// The adopted budget appropriates fund balance up front as a REVENUE line,
// object code 9999. For 2026 that was $1,250,000 in the General Fund. Then,
// during the year, individual resolutions appropriate more of it: each fiscal
// impact statement's section G credits A01-9999 and debits whatever is being
// bought. Adopting the resolution creates the spending authority.
//
// Nothing on this site previously showed the second channel on its own. The
// figures existed only inside the 2027 projection, where they are netted
// against next year's headroom — useful for that question, and no use at all to
// someone asking the simpler one: what did we spend the surplus on this year.
//
// Every number here is imported from the module that already computes it.
// Recomputing them locally is exactly the drift a page like this exists to
// catch, and this repository has made that mistake once already.

import {
  generalFundCommitments2026,
  committedTotal,
  otherTierGeneralFundDraws,
  otherTierDrawTotal,
  corpus,
  drawCounts,
  type Commitment,
} from './fiscal-commitments-2027'
import { adoptedBudget2026Summary } from './financial-data'
import fiscalIndex from '../public/data/meetings/fiscal-index.json'

export { generalFundCommitments2026, committedTotal, otherTierGeneralFundDraws, otherTierDrawTotal, corpus, drawCounts }
export type { Commitment }

/**
 * Fund balance the adopted budget planned to use, per fund.
 *
 * The summary carries a "Total Town Operating" row alongside the individual
 * funds. It is the Town's own total, not a fund, so it is separated here rather
 * than added to the others — and the two do not agree, which is reported below
 * rather than reconciled away.
 */
const summaryRows = adoptedBudget2026Summary.filter(
  (r) => r.fundCode.toUpperCase().indexOf('TOTAL') === -1 && r.fund.toLowerCase().indexOf('total') === -1,
)

export const budgetedUseByFund = summaryRows
  .filter((r) => r.appropriatedFundBalance2026 > 0)
  .map((r) => ({
    code: r.fundCode,
    fund: r.fund,
    budgeted: r.appropriatedFundBalance2026,
    appropriations: r.appropriations2026,
    source: r.source,
  }))
  .sort((a, b) => b.budgeted - a.budgeted)

export const budgetedUseTotal = budgetedUseByFund.reduce((s, r) => s + r.budgeted, 0)

export const generalFundBudgetedUse =
  summaryRows.find((r) => r.fundCode === 'A01')?.appropriatedFundBalance2026 ?? 0

/** The Town's own town-wide total, where it prints one, and how far it sits from the itemized rows. */
const townWideRow = adoptedBudget2026Summary.find(
  (r) => r.fundCode.toUpperCase().indexOf('TOTAL') !== -1 || r.fund.toLowerCase().indexOf('total') !== -1,
)
export const townWideBudgetedUse = townWideRow?.appropriatedFundBalance2026 ?? null
export const budgetedUseUnexplained =
  townWideBudgetedUse == null ? null : townWideBudgetedUse - budgetedUseTotal

/**
 * Two kinds of entry sit in generalFundCommitments2026 and they are not the
 * same claim, so this page never totals them together.
 *
 * A DOCUMENTED draw charged A01-9999 on the Town's own fiscal impact statement:
 * the figure is the Town's, booked against its Appropriated Fund Balance
 * account. A CURATED commitment was read from the record because the account
 * codes do not cover it — the largest, the East Main Street acquisition offer,
 * was authorized by vote rather than booked against 9999, and the record notes
 * it could rise if the property owner litigates, so it is not a ceiling either.
 *
 * Presenting the sum as "spent from fund balance by resolution" would assert of
 * the curated entries something the record does not say.
 */
export const documentedDraws = generalFundCommitments2026.filter((c) => c.certainty === 'documented')
export const documentedTotal = documentedDraws.reduce((s, c) => s + c.amount, 0)

export const curatedCommitments = generalFundCommitments2026.filter((c) => c.certainty !== 'documented')
export const curatedTotal = curatedCommitments.reduce((s, c) => s + c.amount, 0)

/** Everything charged to the General Fund's 9999 account, whichever tier it named. */
export const chargedToFundBalanceTotal = documentedTotal + otherTierDrawTotal
export const chargedToFundBalanceCount = documentedDraws.length + otherTierGeneralFundDraws.length

/**
 * What the budget planned, plus what the 9999 account actually carried.
 *
 * Additive is the right reading for a budget ADJUSTMENT, which appropriates new
 * money. It is the wrong reading for a resolution that only moves an existing
 * appropriation between funding sources, and at least one of this year's draws
 * is written that way. The record does not mark which, so the page presents
 * this as a sum of two channels rather than as a settled figure.
 */
export const generalFundUseThisYear = generalFundBudgetedUse + chargedToFundBalanceTotal

// ── Coverage: what share of the record this ledger can actually see ──────────
//
// A draw in a resolution whose fiscal impact statement was never published, or
// was published without itemised accounts, cannot be counted. Reporting the
// total without reporting its coverage would present a floor as a finding.
type FiscalRes = { funding?: { accounts?: unknown[] } | null }
type FiscalMeeting = { resolutions: FiscalRes[] }

const fiscalMeetings: FiscalMeeting[] = (fiscalIndex.meetings as string[]).map(
  (slug) => require(`../public/data/meetings/${slug}-fiscal.json`) as FiscalMeeting,
)

const fiscalResolutions = fiscalMeetings.reduce((n, m) => n + m.resolutions.length, 0)
const withAccounts = fiscalMeetings.reduce(
  (n, m) => n + m.resolutions.filter((r) => (r.funding?.accounts ?? []).length > 0).length,
  0,
)

export const coverage = {
  meetings: fiscalMeetings.length,
  earliest: [...(fiscalIndex.meetings as string[])].sort()[0],
  latest: [...(fiscalIndex.meetings as string[])].sort().slice(-1)[0],
  resolutionsWithStatement: fiscalResolutions,
  resolutionsWithAccounts: withAccounts,
  accountSharePct: fiscalResolutions === 0 ? 0 : (withAccounts / fiscalResolutions) * 100,
}

export const limits = [
  'These are appropriations, not expenditures. Adopting the resolution creates the authority to spend the money; whether it was then obligated or paid is a separate question this site does not track. An encumbrance in the accounting sense — a purchase order reserving part of an appropriation — happens later and is not published in a form this site reads.',
  `Only ${coverage.resolutionsWithAccounts} of the ${coverage.resolutionsWithStatement.toLocaleString()} resolutions with a parsed fiscal impact statement (${coverage.accountSharePct.toFixed(0)}%) itemise their accounts. The rest name a funding source without the account detail that identifies a fund balance draw, so a draw among them cannot be counted here. Every total on this page is a floor.`,
  `${documentedDraws.length} of the ${chargedToFundBalanceCount} General Fund draws name no GASB 54 tier on the account itself. The object code alone does not distinguish Unassigned from Assigned or Committed, so an unnamed draw is treated as unassigned — the overwhelming default, but a default rather than a fact from the record.`,
  'A draw split across two tiers is held out whole. The Meals on Wheels truck (2026-645) charges A01-9999 twice — $48,128.53 of Assigned Fund Balance for Senior Day Care and $31,871.47 of Appropriated Fund Balance — and the rule that keeps Assigned money out of the unassigned cushion applies to the resolution rather than to each account, so all $80,000 sits in the reported-not-netted section. The $31,871.47 genuinely is unassigned, so the cushion is described as very slightly larger than the record supports, in the direction that flatters it. Splitting per account would be more exact and is not what the code does today.',
  'One draw is reported and deliberately not netted against the unassigned cushion: resolution 2026-361 charges Assigned Unappropriated Fund Balance for Community Benefit Funds. Real money and a real vote, but it does not come out of the unassigned tier this site measures the cushion on.',
  `Two kinds of entry are listed apart and never totalled together. A documented draw charged A01-9999 on the Town's own fiscal impact statement, so the figure is the Town's. A curated commitment was read from the record because the account codes do not cover it, and the largest of them was authorized by vote rather than booked against the fund balance account — firmer than a ceiling, but the record notes it could rise if the property owner litigates. Adding the two would assert of the curated entries something the record does not say.`,
  'A resolution that amends the funding source of spending already budgeted moves money between sources rather than appropriating new surplus. Adding it to the budgeted figure would overstate the year. The record does not mark which resolutions do this, so the combined total is presented as a sum of two channels rather than as a settled figure.',
]

export const sources = [
  {
    title: 'Town Board fiscal impact statements, section G',
    detail: `${coverage.meetings} meetings, ${coverage.earliest} to ${coverage.latest}`,
    url: 'https://www.townofriverheadny.gov/129/Agendas-Minutes',
  },
  {
    title: '2026 Adopted Budget',
    detail: 'Appropriated fund balance by fund, summary page 3',
    url: 'https://www.townofriverheadny.gov/DocumentCenter/View/2967/2026-Adopted-Budget',
  },
]
