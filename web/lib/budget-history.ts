// Multi-year fund-level appropriations history, extracted from each adopted
// budget's Summary page by etl/parse_budget_history.py. The town-total
// appropriations reconcile to the official 2026 figure ($121,110,904).

import historyJson from '../public/data/history/fund-appropriations.json'
import { stageDoc, STAGE_LABEL, type Stage } from './budget-stages'
import { TRANSFER_FUNDED } from './fund-groups'

export type FundYearValue = { appropriations: number }

export type FundHistory = {
  code: string
  name: string
  years: Record<string, FundYearValue>
  firstYear: number
  lastYear: number
  totalChange: number
  totalChangePct: number | null
}

export type BudgetHistory = {
  source: { title: string; url: string }
  note: string
  years: number[]
  townTotals: Record<string, { appropriations: number; fundCount: number }>
  funds: FundHistory[]
}

export const budgetHistory = historyJson as BudgetHistory

export function fundHistory(code: string): FundHistory | undefined {
  return budgetHistory.funds.find((f) => f.code.toUpperCase() === code.toUpperCase())
}

export function appropriationsByYear(code: string): { year: number; value: number | null }[] {
  const f = fundHistory(code)
  return budgetHistory.years.map((year) => ({
    year,
    value: f?.years[String(year)]?.appropriations ?? null,
  }))
}

// --- columns a page can compare ---------------------------------------------
//
// The history above is adopted budgets only, which is right for a spending
// history. In budget season a resident's question is the next one: how does the
// proposal compare? So a comparison also gets the next year's budget while it is
// still a proposal: its latest published stage, Preliminary before Tentative,
// read from the stage history (budget-stages.json). It drops out on its own once
// that year's adopted budget is parsed into the history.

/** One budget a page can compare: an adopted year, or next year's while it is a proposal. */
export type BudgetColumn = {
  /** '2026' for an adopted year, '2027-tentative' for a proposal. */
  key: string
  year: number
  stage: Stage
  /** '2026' or '2027 Tentative'. */
  label: string
  source: { title: string; url: string }
  /** Appropriations by fund code, as the Summary page prints them. */
  appropriations: Record<string, number>
}

const adoptedColumns: BudgetColumn[] = budgetHistory.years.map((year) => ({
  key: String(year),
  year,
  stage: 'adopted',
  label: String(year),
  source: budgetHistory.source,
  appropriations: Object.fromEntries(
    budgetHistory.funds.flatMap((f) => {
      const v = f.years[String(year)]?.appropriations
      return v == null ? [] : [[f.code, v]]
    }),
  ),
}))

export const proposalColumn: BudgetColumn | null = (() => {
  const year = budgetHistory.years[budgetHistory.years.length - 1] + 1
  for (const stage of ['preliminary', 'tentative'] as const) {
    const d = stageDoc(year, stage)
    if (d) {
      return {
        key: `${year}-${stage}`,
        year,
        stage,
        label: `${year} ${STAGE_LABEL[stage]}`,
        source: { title: d.source.title, url: d.source.url },
        appropriations: Object.fromEntries(Object.entries(d.funds).map(([code, f]) => [code, f.appropriations])),
      }
    }
  }
  return null
})()

export const budgetColumns: BudgetColumn[] = proposalColumn ? [...adoptedColumns, proposalColumn] : adoptedColumns

/** Every fund's appropriations added up: the Summary's own "Total Town Operating". */
export function columnTotal(c: BudgetColumn): number {
  return Object.values(c.appropriations).reduce((sum, v) => sum + v, 0)
}

/**
 * The same total without the funds the others pay for (fund-groups.ts): debt
 * service, workers' compensation and risk retention. This is how the
 * Supervisor's 2027 letter counts "town operating" appropriations. Null if one
 * of those funds is missing from the column.
 */
export function columnOperating(c: BudgetColumn): number | null {
  if (!TRANSFER_FUNDED.every((code) => c.appropriations[code] != null)) return null
  return Object.entries(c.appropriations)
    .filter(([code]) => !(TRANSFER_FUNDED as readonly string[]).includes(code))
    .reduce((sum, [, v]) => sum + v, 0)
}
