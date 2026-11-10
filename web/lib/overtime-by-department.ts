// Overtime by department, from the Budget Supplements, for the payroll page's
// Overtime & Staffing tab, and the Police Athletic League's uniform line for
// its fund page.
//
// Every overtime account (object code 111) the 2027 Supplement carries: what
// each year's budget set aside, what was spent, spending through June 30 of
// the current year, and the 2027 proposal. The pattern it shows is that most
// overtime budgets are carried from year to year unchanged, whatever was
// spent, so some departments run over every year and others never use theirs.
//
// No JSON imports: the page passes the lines in, so
// scripts/verify-overtime-departments.mjs runs the same arithmetic.

export const OT_SOURCE = {
  title: '2027 Budget Supplement (PDF)',
  url: 'https://www.townofriverheadny.gov/DocumentCenter/View/3929/2027-Budget-Supplement-PDF',
  ytdThrough: 'June 30',
} as const

/** Plain names for the departments the account codes stand for. Keyed by fund and function code. */
const DEPARTMENT: Record<string, string> = {
  'A01-3120-UNI': 'Police, sworn officers',
  'A01-3120-NON': 'Police, civilian staff',
  'A01-3620': 'Building inspection',
  'A01-1625': 'Buildings and grounds',
  'A01-3410': 'Fire Marshal',
  'DA1-5110': 'Highway repairs',
  'DA1-5142': 'Highway snow removal',
  'A01-8160': 'Refuse and recycling',
  'SL1-5182': 'Street lighting',
  'ES5-8189': 'Scavenger waste',
  'EW1-8310': 'Water District',
  'ES1-8110': 'Riverhead Sewer District',
  'ES3-8130': 'Calverton Sewer District',
  'A01-1690': 'Municipal garage',
  'A01-1680': 'Information technology',
  'A01-8020': 'Planning',
  'A01-1110': 'Justice Court',
  'A01-1310': 'Accounting',
  'A01-5010': 'Highway administration',
  'A01-3625': 'Code enforcement',
  'A01-7020': 'Recreation',
  'A06-7020': 'Recreation programs',
  'A01-1440': 'Engineering',
  'A01-3122': 'Bay constable',
  'A01-8686': 'Community development',
  'A01-3125': 'Juvenile aid',
  'A01-1420': 'Town attorney',
  'A01-1345': 'Purchasing',
  'A01-1410': 'Town clerk',
  'A01-6772': 'Senior services',
  'A01-7110': 'Parks',
  'CM2-7230': 'East Creek docking',
}

export type SupplementLine = {
  account: string
  name: string
  page: number
  actual: Record<string, number>
  adopted: Record<string, number>
  ytd: Record<string, number>
  proposed: number | null
}

export const isOvertime = (account: string) => account.split('-')[3] === '111'

export function departmentOf(account: string, name: string) {
  const [fund, , fn, , cls] = account.split('-')
  return DEPARTMENT[`${fund}-${fn}-${cls}`] ?? DEPARTMENT[`${fund}-${fn}`] ?? name
}

export function overtimeByDepartment(accounts: SupplementLine[]) {
  const ot = accounts.filter((l) => isOvertime(l.account))
  const lastActual = Math.max(...ot.flatMap((l) => Object.keys(l.actual).map(Number)))
  const thisYear = lastActual + 1
  const five = Array.from({ length: 5 }, (_, i) => lastActual - 4 + i)
  const rows = ot
    .map((l) => {
      const budgetLast = l.adopted[lastActual] ?? 0
      const spentLast = l.actual[lastActual] ?? 0
      const budgetNow = l.adopted[thisYear] ?? 0
      const ytdNow = l.ytd[thisYear] ?? 0
      return {
        account: l.account,
        department: departmentOf(l.account, l.name),
        page: l.page,
        budgetLast,
        spentLast,
        budgetNow,
        ytdNow,
        /** Share of this year's budget spent by June 30; null when nothing was budgeted. */
        ytdShare: budgetNow > 0 ? ytdNow / budgetNow : null,
        proposed: l.proposed ?? 0,
        unchanged: (l.proposed ?? 0) === budgetNow,
        /** Of the last five years, those that spent more than was budgeted, a $0 budget included. */
        yearsOver: five.filter((y) => (l.actual[y] ?? 0) > (l.adopted[y] ?? 0)).length,
      }
    })
    .filter((r) => r.budgetLast > 0 || r.spentLast > 0 || r.budgetNow > 0 || r.ytdNow > 0 || r.proposed > 0)
    .sort((a, b) => (b.spentLast - b.budgetLast) - (a.spentLast - a.budgetLast))

  const isPolice = (a: string) => a === 'A01-3-3120-111-UNI-00000'
  const rest = rows.filter((r) => !isPolice(r.account))
  const sum = (xs: typeof rows, k: 'budgetLast' | 'spentLast' | 'budgetNow' | 'ytdNow' | 'proposed') => xs.reduce((s, r) => s + r[k], 0)
  const budgeted = rows.filter((r) => r.budgetNow > 0)
  return {
    rows,
    lastActual,
    thisYear,
    budgetedLines: budgeted.length,
    unchangedLines: budgeted.filter((r) => r.unchanged).length,
    /** Lines that had spent their whole year's budget by June 30. */
    spentByJune: rows.filter((r) => r.ytdShare !== null && r.ytdShare >= 1),
    /** Totals without the sworn police line, which has its own panel. */
    restBudgetLast: sum(rest, 'budgetLast'),
    restSpentLast: sum(rest, 'spentLast'),
    restBudgetNow: sum(rest, 'budgetNow'),
    restYtdNow: sum(rest, 'ytdNow'),
    restProposed: sum(rest, 'proposed'),
  }
}

/** The Police Athletic League's uniform line, for /funds/A04/. */
export const PAL_UNIFORMS = 'A04-3-3120-425-000-00000'

export function palUniforms(l: SupplementLine) {
  const years = Object.keys(l.actual).map(Number).sort((a, b) => a - b)
  const lastActual = years[years.length - 1]
  const thisYear = lastActual + 1
  const rows = years.filter((y) => y >= lastActual - 4).map((y) => ({ year: y, budget: l.adopted[y] ?? 0, spent: l.actual[y] }))
  return {
    rows,
    lastActual,
    thisYear,
    budgetNow: l.adopted[thisYear] ?? 0,
    ytdNow: l.ytd[thisYear] ?? 0,
    proposed: l.proposed ?? 0,
    yearsOver: rows.filter((r) => r.spent > r.budget).length,
    page: l.page,
  }
}
