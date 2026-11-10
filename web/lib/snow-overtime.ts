// Snow-plowing overtime and the snow budget in the Highway Fund, for the
// Highway Fund's page (/funds/DA1/).
//
// The Highway Fund carries two overtime lines: "Snow - Personal Services OT"
// (DA1-5-5142-111) and "Repair - Personal Services OT" (DA1-5-5110-111). The
// Budget Supplements show the snow line budgeted every year and almost never
// spent, while the repair line runs over its budget, so plowing overtime looks
// to be charged to the repair line. The budget does not say so; the page puts
// it as a question for the Town.
//
// Figures come from the Budget Supplements (line-history.json): actual
// spending by year, each year's adopted budget, spending through June 30 of
// the current year, and the 2027 proposal. No JSON imports: the page passes
// the lines in, so scripts/verify-snow-overtime.mjs runs the same arithmetic.

export const SNOW = {
  snowOt: 'DA1-5-5142-111-NON-00000',
  repairOt: 'DA1-5-5110-111-NON-00000',
  snowContractual: 'DA1-5-5142-400-000-00000',
  ytdThrough: 'June 30',
  source: { title: '2027 Budget Supplement (PDF)', url: 'https://www.townofriverheadny.gov/DocumentCenter/View/3929/2027-Budget-Supplement-PDF' },
  /** Board votes in 2026 that moved money into the snow budget, from the fiscal impact statements. */
  transfers2026: [
    { number: '2026-196', date: 'March 3, 2026', title: 'Adopts Highway Department Budget Transfer for Additional Salt', account: 'DA1-5-5142-400-000-00000', amount: 100_000 },
  ],
  /** The October 20 amendment that took money out of the 2027 snow budget. */
  amendment2027: { number: '2026-938', label: 'Amendment #4', account: 'DA1-5-5142-400-000-00000', amount: 5_392 },
} as const

export type SupplementLine = {
  account: string
  name: string
  page: number
  actual: Record<string, number>
  adopted: Record<string, number>
  ytd: Record<string, number>
  request: number | null
  tentative: number | null
  proposed: number | null
}

const years = (l: SupplementLine) => Object.keys(l.actual).map(Number).sort((a, b) => a - b)

function summarize(l: SupplementLine) {
  const ys = years(l)
  const lastActual = ys[ys.length - 1]
  const thisYear = lastActual + 1
  return {
    account: l.account,
    name: l.name,
    page: l.page,
    rows: ys.filter((y) => l.adopted[y] != null).map((y) => ({ year: y, adopted: l.adopted[y], actual: l.actual[y] })),
    lastActualYear: lastActual,
    thisYear,
    adoptedThisYear: l.adopted[thisYear] ?? null,
    ytdThisYear: l.ytd[thisYear] ?? null,
    tentative: l.tentative,
    proposed: l.proposed,
  }
}

export function snowOvertime(snowOt: SupplementLine, repairOt: SupplementLine, contractual: SupplementLine) {
  const snow = summarize(snowOt)
  const repair = summarize(repairOt)
  const supplies = summarize(contractual)
  const recent = (s: ReturnType<typeof summarize>, n: number) => s.rows.filter((r) => r.year > s.lastActualYear - n)
  // Years the snow-overtime line spent nothing, and years the repair line spent more than its budget.
  const snowUnspentYears = snow.rows.filter((r) => r.actual === 0).map((r) => r.year)
  const repairOverYears = repair.rows.filter((r) => r.actual > r.adopted).map((r) => r.year)
  const transferred = SNOW.transfers2026.reduce((s, t) => s + t.amount, 0)
  return {
    snow,
    repair,
    supplies,
    snowUnspentYears,
    repairOverYears,
    /** Snow overtime actually spent over the last five years with an actual. */
    snowSpentFiveYears: recent(snow, 5).reduce((s, r) => s + r.actual, 0),
    snowBudgetedFiveYears: recent(snow, 5).reduce((s, r) => s + r.adopted, 0),
    /** The repair line's last full year, against its budget. */
    repairLast: repair.rows[repair.rows.length - 1],
    /** The snow budget for supplies and contractors this year, with the Board's transfers into it. */
    suppliesThisYear: (supplies.adoptedThisYear ?? 0) + transferred,
    transferred,
  }
}

/** Overtime paid to Highway Department staff in the payroll exports, by year. */
export function highwayPayrollOvertime(records: { y: number; d: string; o: number | null }[]) {
  const out: Record<number, number> = {}
  for (const r of records) {
    if (!/highway/i.test(r.d)) continue
    out[r.y] = (out[r.y] ?? 0) + (r.o ?? 0)
  }
  return out
}
