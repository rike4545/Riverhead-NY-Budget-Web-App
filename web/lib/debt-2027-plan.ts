// What the 2027 Tentative Budget sets aside for debt, for /capital-debt/,
// beside the repayment schedule in the 2025 Annual Financial Report.
//
// The schedule was printed as of December 31, 2025. In July 2026 the Board paid
// the 2018 refunding bonds down early (Resolution 2026-642), and in August the
// Town Square note was retired, so the budget's own lines are the newer record
// of what the Town expects to pay. Every figure is a line of the 2027 Budget
// Supplement, which adds up to the Tentative to the dollar; function 9710 is
// serial bonds and 9730 bond anticipation notes, object 600 principal and 700
// interest. scripts/verify-capital-debt.mjs re-derives them.

import supplementJson from '../public/data/budget-supplement/current-lines.json'
import { debtProfile } from './debt-profile'

type Line = { account: string; fund: string; name: string; kind: string; adopted: number | null; tentative: number | null }
// The Sewer District's serial bond administrative fee shares object 700 with
// interest; it is a fee, not interest, so it is left out.
const lines = (supplementJson as unknown as { lines: Line[] }).lines.filter((l) => l.kind === 'expenditure' && !/fee/i.test(l.name))

const sumOf = (fn: string, obj: string, column: 'adopted' | 'tentative') =>
  lines.filter((l) => l.account.split('-')[2] === fn && l.account.split('-')[3] === obj).reduce((s, l) => s + (l[column] ?? 0), 0)
const byFund = (fn: string, obj: string) =>
  lines
    .filter((l) => l.account.split('-')[2] === fn && l.account.split('-')[3] === obj && ((l.tentative ?? 0) !== 0 || (l.adopted ?? 0) !== 0))
    .map((l) => ({ fund: l.fund, account: l.account, adopted: l.adopted ?? 0, tentative: l.tentative ?? 0 }))

const scheduled = (year: number) => debtProfile.amortization.find((r) => r.year === year)!

export const debtPlan2027 = {
  bonds: {
    principal: { adopted2026: sumOf('9710', '600', 'adopted'), tentative2027: sumOf('9710', '600', 'tentative'), byFund: byFund('9710', '600') },
    interest: { adopted2026: sumOf('9710', '700', 'adopted'), tentative2027: sumOf('9710', '700', 'tentative') },
  },
  notes: {
    principal: { adopted2026: sumOf('9730', '600', 'adopted'), tentative2027: sumOf('9730', '600', 'tentative') },
    interest: { adopted2026: sumOf('9730', '700', 'adopted'), tentative2027: sumOf('9730', '700', 'tentative') },
  },
  /** The AFR's schedule for the same years, all bonds, before the 2026 pay-downs. */
  schedule: { 2026: scheduled(2026), 2027: scheduled(2027) },
}

/** How far the Tentative's bond principal falls short of the AFR's 2027 schedule. */
export const principalBelowSchedule = debtPlan2027.schedule[2027].principal - debtPlan2027.bonds.principal.tentative2027
