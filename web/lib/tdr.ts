// Riverhead's transfer of development rights (TDR) program, for /tdr/. Every
// figure is quoted in public/data/tdr.json from the Town's own documents; this
// file only does the arithmetic the page shows, and labels it as such.

import tdrJson from '../public/data/tdr.json'

type Source = { title: string; url: string }
type Receiving = { code: string; name: string; kind: 'floor' | 'homes'; squareFeetPerCredit?: number; maxFar?: number; rule?: string }
type Step = { label: string; squareFeet: number; perCredit: number; credits: number }
type Data = {
  code: { title: string; url: string; adopted: string }
  sources: Record<string, Source>
  sending: { district: string; yield: string; squareFeetPerCredit: number; source: string; where: string; exclusions: string[]; dgeisCheck: string; dgeisCheckWhere: string }
  price: { perCredit: number; quote: string; source: string; where: string }
  receiving: Receiving[]
  receivingSource: string
  receivingWhere: string
  proposed: { code: string; name: string; squareFeetPerCredit: number; history: string; source: string; where: string }
  rateChange: { before: { date: string; squareFeetPerCredit: number }; after: { date: string; squareFeetPerCredit: number }; quote: string; source: string; where: string }
  walmart: {
    address: string; zoning: string; acres: number; lotSquareFeet: number; expansionSquareFeet: number; baseCoverageShare: number
    baseSquareFeet: number; maxWithCreditsSquareFeet: number; existingBuildingSquareFeet: number; approvedBuildingSquareFeet: number
    proposedBuildingSquareFeet: number; liquorStoreSquareFeet: number; additionalSquareFeet: number; calculation: Step[]
    creditsRequired: number; creditsBought: { credits: number; approval: string; recorded: string }[]; creditsConveyed: number
    creditsHeld: number; creditsAdditional: number; status: string; staffQuote: string; source: string; where: string; hearing: string
    news: Source
  }
  program: { since: number; acresPreserved: number; creditsRedeemed: number; residentialRedeemed: number; commercialRedeemed: number; creditsNotRedeemed: number; asOf: string; quote: string; attribution: string; source: string; where: string }
  bank: { exists: boolean; quote: string; noList: string; recommendation: string; source: string; where: string }
}

export const tdr = tdrJson as unknown as Data
export const src = (key: string) => tdr.sources[key]
export const ACRE = 43_560

/** Floor-area receiving districts, plus the proposed golf-course one, with what a credit buys and costs per square foot. */
export const floorRates = [
  ...tdr.receiving.filter((r) => r.kind === 'floor').map((r) => ({ code: r.code, name: r.name, perCredit: r.squareFeetPerCredit!, maxFar: r.maxFar!, proposed: false })),
  { code: tdr.proposed.code, name: tdr.proposed.name, perCredit: tdr.proposed.squareFeetPerCredit, maxFar: null as number | null, proposed: true },
].map((r) => ({ ...r, costPerSquareFoot: tdr.price.perCredit / r.perCredit }))

const w = tdr.walmart
/** The Walmart site's floor area, in order: what zoning allows without credits, what credits already pay for, the addition, and the room left under the 0.30 cap. */
export const walmartSegments = [
  { label: 'Allowed without credits (15% of the lot)', value: w.baseSquareFeet, color: 'var(--rbl-series-slate)' },
  { label: 'Built with credits already redeemed', value: w.existingBuildingSquareFeet - w.baseSquareFeet, color: 'var(--rbl-series-teal)' },
  { label: 'Proposed added building area', value: w.proposedBuildingSquareFeet - w.existingBuildingSquareFeet, color: 'var(--rbl-series-gold)' },
  { label: 'Room left before the 0.30 cap', value: w.maxWithCreditsSquareFeet - w.proposedBuildingSquareFeet, color: 'var(--rbl-track)' },
]
export const walmartSumCredits = Math.round(w.calculation.reduce((s, c) => s + c.credits, 0) * 1000) / 1000
/** Estimates at the DGEIS's quoted price; the Town documents give no price for Walmart's credits. */
export const walmartAdditionalCost = w.creditsAdditional * tdr.price.perCredit
export const walmartHeadroomCredits = (w.maxWithCreditsSquareFeet - w.proposedBuildingSquareFeet) / tdr.rateChange.after.squareFeetPerCredit
