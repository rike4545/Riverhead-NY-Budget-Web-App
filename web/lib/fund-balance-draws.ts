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
// The other funds (the water and sewer districts, Highway, Street Lighting,
// the Community Preservation Fund) draw on their own balances the same way,
// through their own 9999 accounts. Those are listed apart and never added to
// the General Fund figures: a sewer district's surplus cannot pay for General
// Fund services, so it does not move the cushion the 2027 options are priced
// against.
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
  otherFundDraws,
  otherFundDrawTotal,
  otherFundDrawsUnpriced,
  otherFundVotes,
  gapNote,
  corpus,
  drawCounts,
  type Commitment,
} from './fiscal-commitments-2027'
import { adoptedBudget2026Summary } from './financial-data'
import { stageDoc } from './budget-stages'
import { released2027 } from './tentative-2027'
import fiscalIndex from '../public/data/meetings/fiscal-index.json'

export {
  generalFundCommitments2026, committedTotal, otherTierGeneralFundDraws, otherTierDrawTotal,
  otherFundDraws, otherFundDrawTotal, otherFundDrawsUnpriced, otherFundVotes, gapNote, corpus, drawCounts,
}
export type { Commitment }

/**
 * Fund balance the adopted budget planned to use, per fund.
 *
 * Read from all 19 fund rows of the adopted budget's Summary, as
 * etl/parse_budget_stages.py parses them, and checked against the Town's own
 * printed "Total Town Operating" row, entered by hand in financial-data.ts.
 * The hand-entered table carries only six rows, and building the list from it
 * left the Calverton Sewer District and Scavenger Waste out: $745,000 the page
 * then reported as unexplained. If the parsed rows are ever missing, the six
 * hand rows stand in, and the gap against the Town's total shows again rather
 * than closing in silence.
 */
const adopted2026 = stageDoc(2026, 'adopted')

const summaryRows = adoptedBudget2026Summary.filter(
  (r) => r.fundCode.toUpperCase().indexOf('TOTAL') === -1 && r.fund.toLowerCase().indexOf('total') === -1,
)

export const budgetedUseFrom = adopted2026
  ? { rows: 'all' as const, funds: Object.keys(adopted2026.funds).length, source: adopted2026.source }
  : { rows: 'hand' as const, funds: summaryRows.length, source: { title: '2026 Adopted Budget', url: summaryRows[0]?.source.url ?? '' } }

export const budgetedUseByFund = (
  adopted2026
    ? Object.entries(adopted2026.funds).map(([code, f]) => ({ code, fund: f.name, budgeted: f.fundBalance ?? 0, appropriations: f.appropriations }))
    : summaryRows.map((r) => ({ code: r.fundCode, fund: r.fund, budgeted: r.appropriatedFundBalance2026, appropriations: r.appropriations2026 }))
)
  .filter((r) => r.budgeted > 0)
  .sort((a, b) => b.budgeted - a.budgeted)

export const budgetedUseTotal = budgetedUseByFund.reduce((s, r) => s + r.budgeted, 0)

export const generalFundBudgetedUse = budgetedUseByFund.find((r) => r.code === 'A01')?.budgeted ?? 0

/** The Town's own town-wide total, as printed, and how far it sits from the itemized rows. */
const townWideRow = adoptedBudget2026Summary.find(
  (r) => r.fundCode.toUpperCase().indexOf('TOTAL') !== -1 || r.fund.toLowerCase().indexOf('total') !== -1,
)
export const townWideBudgetedUse = townWideRow?.appropriatedFundBalance2026 ?? null
export const budgetedUseUnexplained =
  townWideBudgetedUse == null ? null : townWideBudgetedUse - budgetedUseTotal

/**
 * What the 2027 Tentative plans, for the line under the 2026 table. Null until
 * the Tentative is parsed.
 */
export const plannedUse2027 = released2027
  ? {
      allFunds: released2027.fundBalance,
      allFundsPrior: released2027.fundBalancePrior,
      generalFund: released2027.generalFund?.fundBalance ?? null,
      generalFundPrior: released2027.generalFund?.fundBalancePrior ?? null,
    }
  : null

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

/**
 * The other funds drawn on, largest total first, each with its own entries.
 * Each entry carries only that fund's lines, so a subtotal never includes
 * another fund's money. A fund whose entries state no amount has a null
 * total, not a zero.
 */
export const otherFundsByFund = Array.from(new Set(otherFundDraws.map((d) => d.fund)))
  .map((fund) => {
    const draws = otherFundDraws.filter((d) => d.fund === fund)
    const priced = draws.filter((d) => d.amount !== null)
    return {
      fund,
      draws,
      total: priced.length ? Math.round(priced.reduce((s, d) => s + (d.amount as number), 0) * 100) / 100 : null,
    }
  })
  .sort((a, b) => (b.total ?? -1) - (a.total ?? -1))

/** How many of those funds have a vote with a stated amount. */
export const otherFundsPriced = otherFundsByFund.filter((g) => g.total !== null).length

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

const usd = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
const listPhrase = (items: string[]) =>
  items.length <= 1 ? items.join('') : `${items.slice(0, -1).join(', ')}${items.length > 2 ? ',' : ''} and ${items[items.length - 1]}`

export const limits = [
  'These are appropriations, not expenditures. Adopting the resolution creates the authority to spend the money; whether it was then obligated or paid is a separate question this site does not track. An encumbrance in the accounting sense — a purchase order reserving part of an appropriation — happens later and is not published in a form this site reads.',
  `Only ${coverage.resolutionsWithAccounts} of the ${coverage.resolutionsWithStatement.toLocaleString()} resolutions with a parsed fiscal impact statement (${coverage.accountSharePct.toFixed(0)}%) itemise their accounts. The rest name a funding source without the account detail that identifies a fund balance draw, so a draw among them cannot be counted here. Every total on this page is a floor.`,
  `${documentedDraws.length} of the ${chargedToFundBalanceCount} General Fund draws name no GASB 54 tier on the account itself. The object code alone does not distinguish Unassigned from Assigned or Committed, so an unnamed draw is treated as unassigned — the overwhelming default, but a default rather than a fact from the record.`,
  'A draw split across two tiers is held out whole. The Meals on Wheels truck (2026-645) charges A01-9999 twice — $48,128.53 of Assigned Fund Balance for Senior Day Care and $31,871.47 of Appropriated Fund Balance — and the rule that keeps Assigned money out of the unassigned cushion applies to the resolution rather than to each account, so all $80,000 sits in the reported-not-netted section. The $31,871.47 genuinely is unassigned, so the cushion is described as very slightly larger than the record supports, in the direction that flatters it. Splitting per account would be more exact and is not what the code does today.',
  ...(otherTierGeneralFundDraws.length
    ? [`${otherTierGeneralFundDraws.length === 1 ? 'One General Fund draw is' : `${otherTierGeneralFundDraws.length} General Fund draws are`} reported and deliberately not netted against the unassigned cushion, because the account itself names another GASB 54 tier: ${listPhrase(otherTierGeneralFundDraws.map((d) => `resolution ${d.number ?? '\u2014'} (${usd(d.amount)}, ${d.tiers.join(' and ')} fund balance)`))}. Real money and real votes, but they do not come out of the unassigned tier this site measures the cushion on.`]
    : []),
  `Draws on other funds' balances are listed apart and never added to the General Fund figures. ${otherFundsPriced} other funds drew ${usd(otherFundDrawTotal)} from their own balances by resolution${otherFundVotes.unpriced ? `, and ${otherFundVotes.unpriced === 1 ? 'one vote names' : `${otherFundVotes.unpriced} votes name`} a fund balance account without an amount` : ''}. Each fund keeps its balance for its own purposes, so that money does not pay for General Fund services and does not move the cushion either way.`,
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
    detail: budgetedUseFrom.rows === 'all'
      ? `Appropriated fund balance for each of the ${budgetedUseFrom.funds} funds on the Summary, and the Town's own total`
      : 'Appropriated fund balance by fund, summary page 3',
    url: budgetedUseFrom.source.url || 'https://www.townofriverheadny.gov/DocumentCenter/View/2967/2026-Adopted-Budget',
  },
  ...(released2027
    ? [{ title: released2027.source.title.replace(/\s*\(PDF\)$/, ''), detail: 'Appropriated fund balance planned for 2027, by fund', url: released2027.source.url }]
    : []),
]
