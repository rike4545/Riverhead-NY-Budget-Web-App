// What the Town Board has and has not adopted from the 2024 Comprehensive Plan
// Update, for /comprehensive-plan/. comprehensive-plan.json is hand-curated:
// each recommendation quotes the plan and cites its page, and each action cites
// its Town Board resolution. web/scripts/verify-comprehensive-plan.mjs checks it.

import json from '../public/data/comprehensive-plan.json'

export type PlanStatus = 'done' | 'partial' | 'related' | 'underway' | 'none'
export type PlanAction = { date: string; resolution: string; what: string; citesPlan: boolean; url: string }
export type PlanItem = {
  id: string; group: string; recommendation: string; planPage: number | null; quote: string | null
  status: PlanStatus; actions: PlanAction[]; note?: string
}
type File = {
  asOf: string
  plan: {
    title: string; pages: number; consultant: string; url: string
    adopted: { date: string; resolution: string; vote: string; url: string; previous: string; replaces: string }
  }
  coverage: string
  statuses: Record<PlanStatus, string>
  items: PlanItem[]
}

const data = json as unknown as File
export const planAsOf = data.asOf
export const plan = data.plan
export const planCoverage = data.coverage
export const statusLabel = data.statuses
export const planItems = data.items

/** Status order on the page: adopted first, then partly, related, under way, none. */
export const statusOrder: PlanStatus[] = ['done', 'partial', 'related', 'underway', 'none']

export const statusCounts = statusOrder.map((s) => ({ status: s, count: planItems.filter((i) => i.status === s).length }))

/** Recommendations with a law adopted, in full or in part, or a related law. */
export const adoptedItems = planItems.filter((i) => i.status === 'done' || i.status === 'partial' || i.status === 'related')
/** Recommendations still open: under way or no action found. */
export const openItems = planItems.filter((i) => i.status === 'underway' || i.status === 'none')

/** The plan PDF opened at a page. */
export const planPageUrl = (page: number) => `${plan.url}#page=${page}`

/** Resolutions adopted at one meeting that cite the plan, for the "biggest day" figure. */
export function citingByDate(): { date: string; count: number }[] {
  const by = new Map<string, Set<string>>()
  for (const i of planItems) for (const a of i.actions) {
    if (!a.citesPlan) continue
    if (!by.has(a.date)) by.set(a.date, new Set())
    by.get(a.date)!.add(a.resolution)
  }
  return Array.from(by.entries()).map(([date, s]) => ({ date, count: s.size })).sort((a, b) => a.date.localeCompare(b.date))
}

export const longDate = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
