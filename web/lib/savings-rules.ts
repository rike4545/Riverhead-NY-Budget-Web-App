// How a budget uses savings, fund by fund, and the arithmetic behind it.
//
// Two kinds of budget line move a fund's savings instead of paying for a
// service:
//   - revenue 9999, "Appropriated Fund Balance": savings from earlier years
//     that a fund counts as income, so less of its spending has to come from
//     taxes or fees. The Summary page prints it for each fund; the Budget
//     Supplement prints the same line, with its page.
//   - expenditure 9990, "Fund Balance Contribution": money a fund budgets into
//     its savings instead of spending it. The Summary folds it into
//     appropriations; only the Supplement shows it.
//
// Each fund's savings are its own. A sewer district's cannot pay for General
// Fund services, so nothing here nets one fund's draw against another's
// contribution.
//
// No imports, so scripts/verify-funds-savings.mjs runs this same code on the
// same records; lib/savings-used.ts wires it to the site's data.

export type StageFund = { name: string; appropriations: number; fundBalance: number | null }

export type SavingsLine = {
  account: string
  fund: string
  name: string
  kind: string
  page: number
  adopted: number | null
  tentative: number | null
}

/** Revenue object 9999: savings a fund counts as income. */
export const isSavingsUsed = (l: { account: string; kind: string }) => l.kind === 'revenue' && l.account.split('-')[1] === '9999'

/** Expenditure 9990: money a fund sets aside into its savings. */
export const isSetAside = (l: { account: string; kind: string }) => l.kind === 'expenditure' && l.account.split('-')[2] === '9990'

export type SetAside = { code: string; fundName: string; line: string; adopted: number; proposed: number; page: number }

export type SavingsRow = {
  code: string
  name: string
  adopted: number
  proposed: number
  /** The proposal's appropriations for the fund. */
  appropriations: number
  /** The share of those appropriations the proposal pays from savings. */
  sharePct: number
  /** The Supplement page with the fund's 9999 line, only when that line prints both Summary figures. */
  page: number | null
  /** What the fund also sets aside into its savings, both years, when it does. */
  setAside: { adopted: number; proposed: number } | null
}

const sum = (xs: number[]) => xs.reduce((s, x) => s + x, 0)

/**
 * Savings used and set aside, fund by fund, from the adopted budget to the
 * proposal. Rows are the funds whose Summary shows savings used in either
 * year, largest proposal first.
 */
export function savingsByFund(adopted: Record<string, StageFund>, proposed: Record<string, StageFund>, lines: readonly SavingsLine[]) {
  const nameOf = (code: string) => (proposed[code] ?? adopted[code])?.name ?? code
  const setAsides: SetAside[] = lines
    .filter((l) => isSetAside(l) && ((l.adopted ?? 0) !== 0 || (l.tentative ?? 0) !== 0))
    .map((l) => ({ code: l.fund, fundName: nameOf(l.fund), line: l.name, adopted: l.adopted ?? 0, proposed: l.tentative ?? 0, page: l.page }))
    .sort((a, b) => b.proposed - a.proposed || b.adopted - a.adopted)

  const codes = Array.from(new Set([...Object.keys(adopted), ...Object.keys(proposed)]))
  const rows: SavingsRow[] = codes
    .flatMap((code) => {
      const from = adopted[code]?.fundBalance ?? 0
      const to = proposed[code]?.fundBalance ?? 0
      if (!from && !to) return []
      const line = lines.find((l) => l.fund === code && isSavingsUsed(l))
      const agrees = !!line && (line.adopted ?? 0) === from && (line.tentative ?? 0) === to
      const own = setAsides.filter((s) => s.code === code)
      const appropriations = proposed[code]?.appropriations ?? 0
      return [{
        code,
        name: nameOf(code),
        adopted: from,
        proposed: to,
        appropriations,
        sharePct: appropriations ? (to / appropriations) * 100 : 0,
        page: agrees ? line!.page : null,
        setAside: own.length ? { adopted: sum(own.map((s) => s.adopted)), proposed: sum(own.map((s) => s.proposed)) } : null,
      }]
    })
    .sort((a, b) => b.proposed - a.proposed || b.adopted - a.adopted)

  return {
    rows,
    setAsides,
    totals: {
      adopted: sum(rows.map((r) => r.adopted)),
      proposed: sum(rows.map((r) => r.proposed)),
      setAsideAdopted: sum(setAsides.map((s) => s.adopted)),
      setAsideProposed: sum(setAsides.map((s) => s.proposed)),
    },
    /** Supplement 9999 lines that print a figure the Summaries do not: none, while the two agree. */
    unmatched: lines.filter((l) => isSavingsUsed(l) && ((l.adopted ?? 0) !== 0 || (l.tentative ?? 0) !== 0) && !rows.some((r) => r.code === l.fund && r.page === l.page)),
  }
}

type YearDocs = Record<string, Partial<Record<'tentative' | 'preliminary' | 'adopted', { funds: Record<string, StageFund> }>>>

/**
 * The first year of the unbroken run of budgets, ending with `lastYear`, in
 * which the fund planned to use savings. Each year counts its adopted budget,
 * or its latest stage before adoption. A year the records do not have ends the
 * run, so the answer never reaches back past a gap.
 */
export function drawRunStart(years: YearDocs, code: string, lastYear: number): number | null {
  let start: number | null = null
  for (let year = lastYear; ; year--) {
    const y = years[String(year)]
    const doc = y?.adopted ?? y?.preliminary ?? y?.tentative
    if (!doc || !((doc.funds[code]?.fundBalance ?? 0) > 0)) return start
    start = year
  }
}
