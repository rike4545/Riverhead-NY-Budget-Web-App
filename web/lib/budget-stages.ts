// Every budget stage the Town has published, kept apart.
//
// Town Law makes these three different documents, not three drafts of one:
//   Tentative   (s.106(2))  the budget officer's recommendation
//   Preliminary (s.106(4))  the Tentative plus the Board's changes; the public
//                           hearing is held on this one (s.108), and it becomes
//                           the budget by default if none is adopted by Nov 20
//   Adopted     (s.109)     the only stage that appropriates anything
//
// Built by etl/parse_budget_stages.py from the Town's own Summary pages. Every
// figure here is read, not recomputed from something else on the site.

import stagesJson from '../public/data/history/budget-stages.json'
import { TOWN_WIDE_FUNDS, TRANSFER_FUNDED } from './fund-groups'

export type Stage = 'tentative' | 'preliminary' | 'adopted'

export type FundRow = {
  name: string
  appropriations: number
  revenues: number | null
  fundBalance: number | null
  levy: number | null
}

/** The budget officer's opening letter, as far as its text can be read. Tentatives only. */
export type BudgetMessage = {
  readablePages: number[]
  /** Opening pages with no machine-readable text: blank, or a scanned image. Never read as blank. */
  unreadablePages: number[]
  taxCapSentences: string[]
  dated: string | null
  levyLimitPage: number | null
}

/**
 * The Summary's own "Total Town Wide" rows, as printed, each beside the year
 * before: the General Fund, Highway and Street Lighting, which are levied on
 * every parcel in town. The special districts are outside them.
 */
export type TownWide = {
  appropriations: number
  priorAppropriations: number
  levy: number
  priorLevy: number
  /** Dollars per $1,000 of assessed value. */
  rate: number
  priorRate: number
  /** Each fund's own rate from the same table, where it prints current fund codes (2019 on). */
  fundRates?: Record<string, { rate: number; priorRate: number }>
}

export type StageDoc = {
  source: { title: string; url: string; slug: string; parsedAt?: string | null }
  funds: Record<string, FundRow>
  totals: { funds: number; appropriations: number; levy: number; fundBalance: number; fundsWithoutLevyColumn: string[] }
  townWide?: TownWide
  message?: BudgetMessage
}

export type Transition = {
  year: number
  from: Stage
  to: Stage
  fundsCompared: number
  fundsChanged: number
  appropriations: { from: number; to: number; delta: number }
  levy: { from: number; to: number; delta: number }
  changed: { fund: string; name: string; appropriationsDelta: number; levyDelta: number }[]
}

type StagesFile = {
  note: string
  stages: Stage[]
  documents: { year: number; stage: Stage; title: string; url: string }[]
  years: Record<string, Partial<Record<Stage, StageDoc>>>
  transitions: Transition[]
  tentativeToAdopted: { years: number[]; unchangedYears: number[] }
}

export const budgetStages = stagesJson as unknown as StagesFile

export function stageDoc(year: number, stage: Stage): StageDoc | null {
  return budgetStages.years[String(year)]?.[stage] ?? null
}

export { TOWN_WIDE_FUNDS, TRANSFER_FUNDED }

/** All appropriations except the funds paid for by the others (fund-groups.ts), or null if a fund row is missing. */
export function operatingAppropriations(d: StageDoc | null): number | null {
  if (!d) return null
  const rows = Object.entries(d.funds)
  if (!TRANSFER_FUNDED.every((code) => d.funds[code])) return null
  return rows.filter(([code]) => !(TRANSFER_FUNDED as readonly string[]).includes(code)).reduce((sum, [, f]) => sum + f.appropriations, 0)
}

export const STAGE_LABEL: Record<Stage, string> = {
  tentative: 'Tentative',
  preliminary: 'Preliminary',
  adopted: 'Adopted',
}

/** Every year with both a Tentative and an Adopted budget, and how far one moved to the other. */
export const tentativeToAdopted = budgetStages.transitions.filter(
  (t) => t.from === 'tentative' && t.to === 'adopted',
)

/**
 * The same record for one fund. Used where a page is about one fund and the
 * all-funds figure would overstate or understate what changed in it.
 */
export function fundTentativeToAdopted(fund: string) {
  return tentativeToAdopted
    .map((t) => {
      const a = stageDoc(t.year, 'tentative')?.funds[fund]
      const b = stageDoc(t.year, 'adopted')?.funds[fund]
      if (!a || !b) return null
      const delta = b.appropriations - a.appropriations
      return { year: t.year, from: a.appropriations, to: b.appropriations, delta, pct: (delta / a.appropriations) * 100 }
    })
    .filter((x): x is { year: number; from: number; to: number; delta: number; pct: number } => x !== null)
}
