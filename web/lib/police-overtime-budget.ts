// Police overtime as the budget carries it: the uniformed overtime line, what
// each year's adopted budget set aside, what was spent, the first half of 2026,
// and what the 2027 Tentative asks for. For the Overtime & Staffing tab.
//
// The payroll exports stop at 2025, so 2026 and 2027 come from the Budget
// Supplements (line-history.json): account A01-3-3120-111-UNI-00000, "Police -
// Pers Svcs Uniform OT". Each Supplement's year-to-date column is as of June 30
// (the 2026 Supplement prints "2025 YTD as of 6/30/25", the 2027 Supplement
// "2026 YTD as of 6/30/26"), so the two first halves compare directly.
//
// No JSON imports: the page passes the line in, so the verify script can run
// the same arithmetic.

export const UNIFORM_OT = {
  account: 'A01-3-3120-111-UNI-00000',
  name: 'Police - Pers Svcs Uniform OT',
  ytdThrough: 'June 30',
  source: { title: '2027 Budget Supplement (PDF)', url: 'https://www.townofriverheadny.gov/DocumentCenter/View/3929/2027-Budget-Supplement-PDF' },
} as const

export type HistoryLine = {
  account: string
  page: number
  actual: Record<string, number>
  adopted: Record<string, number>
  ytd: Record<string, number>
  request: number | null
  tentative: number | null
}

export function policeOvertimeBudget(line: HistoryLine) {
  const years = Object.keys(line.adopted).map(Number).filter((y) => line.actual[y] != null).sort((a, b) => a - b)
  const rows = years.map((y) => ({ year: y, adopted: line.adopted[y], actual: line.actual[y], over: line.actual[y] - line.adopted[y] }))
  const lastActual = Math.max(...Object.keys(line.actual).map(Number))
  const thisYear = lastActual + 1
  const ytdNow = line.ytd[thisYear]
  const ytdThen = line.ytd[lastActual]
  // The share of last year's spending that came by June 30, applied to this
  // year's first half: an estimate, not a forecast the Town made.
  const firstHalfShare = ytdThen / line.actual[lastActual]
  // The last five years of actual spending, against the Tentative.
  const recent = rows.filter((r) => r.year >= thisYear - 5)
  return {
    rows,
    yearsOver: rows.filter((r) => r.over > 0).length,
    lastActualYear: lastActual,
    thisYear,
    adoptedThisYear: line.adopted[thisYear],
    ytdNow,
    ytdThen,
    ytdChange: ytdNow / ytdThen - 1,
    firstHalfShare,
    paceEstimate: ytdNow / firstHalfShare,
    request: line.request,
    tentative: line.tentative,
    /** Of the last five years, those whose actual spending was above the Tentative. */
    actualsAboveTentative: recent.filter((r) => line.tentative != null && r.actual > line.tentative).map((r) => r.year),
    recentYears: recent.map((r) => r.year),
    page: line.page,
  }
}

export type PoliceOvertimeBudget = ReturnType<typeof policeOvertimeBudget>
