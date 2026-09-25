// The run-rate test from spending-reduction-2027.ts, on the newest Supplement's
// own lines. A separate module because the spending-reduction list is a client
// component: anything imported beside it ships to the browser.

import currentReductions from '../public/data/budget-supplement/current-reductions.json'

// Kept apart from the savings package: the package, and the pages that
// measure against it, were built on the 2026 Tentative before the 2027
// Tentative existed, and the iOS app ships the same 2026-based trims. This is
// what the test finds in the budget now before the Board.
export type TentativeTrim = {
  account: string
  name: string
  fund: string
  fundName: string
  page: number | null
  actual: number | null
  ytd: number | null
  tentative: number | null
  target: number
  confidence: 'firm' | 'moderate' | 'volatile'
}
export const tentativeTrims = {
  year: currentReductions.supplementYear as number,
  columns: currentReductions.columns as { actual: number; adopted: number; ytd: number; tentative: number },
  total: currentReductions.total as number,
  byConfidence: currentReductions.byConfidence as Record<'firm' | 'moderate' | 'volatile', number>,
  items: (currentReductions.items as TentativeTrim[]).map((r) => ({ ...r, confidence: (r.confidence === 'moderate' || r.confidence === 'volatile' ? r.confidence : 'firm') as TentativeTrim['confidence'] })),
  method: currentReductions.method as string,
}
