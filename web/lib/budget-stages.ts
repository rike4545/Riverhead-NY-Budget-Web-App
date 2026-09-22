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

export type Stage = 'tentative' | 'preliminary' | 'adopted'

export type FundRow = {
  name: string
  appropriations: number
  revenues: number | null
  fundBalance: number | null
  levy: number | null
}

export type StageDoc = {
  source: { title: string; url: string; slug: string }
  funds: Record<string, FundRow>
  totals: { funds: number; appropriations: number; levy: number; fundBalance: number; fundsWithoutLevyColumn: string[] }
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
