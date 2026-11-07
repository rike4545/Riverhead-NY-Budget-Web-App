// The committees on /campaign-finance/, put together from two files:
//
//   campaign-finance.json         facts typed by hand: name, office, term, salary,
//                                 committees (filer IDs) and notes
//   campaign-finance-totals.json  figures built from the State's data by
//                                 etl/build_campaign_totals.py on every data refresh
//
// The refresh never rewrites the hand-typed file, and a hand edit never touches a
// figure. Each card shows the stored figures until a visitor presses Refresh.

import facts from '../public/data/campaign-finance.json'
import totalsJson from '../public/data/campaign-finance-totals.json'
import type { CampaignOfficial } from './campaign-finance'

export type CommitteeTotals = {
  filerIDs: string[]
  raised: number
  directContributions: number
  transfersIn: number
  internalTransfers: number
  inKind: number
  refunds: number
  lastContribution: string | null
  loansReceived: number
  owed: number
  owedReport: string | null
  cycleRaised: number
  cycleItems: number
}

const totals = totalsJson as unknown as {
  source: { label: string; url: string }
  fetchedOn: string
  window: [number, number]
  committees: Record<string, CommitteeTotals>
}

type Facts = Omit<CampaignOfficial, `seed${string}`>

/** Every official and committee, hand-typed facts with the stored figures, in the hand-typed file's order. */
export const campaignOfficials: CampaignOfficial[] = (facts.officials as unknown as Facts[]).map((o) => {
  const t = totals.committees[o.name]
  // A committee the totals file does not cover yet shows no stored figures rather than wrong ones.
  if (!t || t.filerIDs.join() !== o.filerIDs.map((f) => f.filerID).join()) {
    return { ...o, seedRaised: null, seedDirectContributions: null, seedTransfersIn: null, seedLastReported: null }
  }
  return {
    ...o,
    seedRaised: t.raised,
    seedDirectContributions: t.directContributions,
    seedTransfersIn: t.transfersIn,
    seedInternalTransfers: t.internalTransfers,
    seedInKind: t.inKind,
    seedRefunds: t.refunds,
    seedLastReported: t.lastContribution,
    seedLoansReceived: t.loansReceived,
    seedOwed: t.owed,
    seedOwedReport: t.owedReport,
    seedCycleRaised: t.cycleRaised,
    seedCycleItems: t.cycleItems,
  }
})

export const campaignFacts = { title: facts.title, intro: facts.intro, startYear: facts.campaignFilingStartYear, endYear: facts.campaignFilingEndYear }
export const totalsSource = { ...totals.source, fetchedOn: totals.fetchedOn }
