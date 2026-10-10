// The arithmetic behind /programs/: one year's budget, line by line, regrouped
// into the seven service functions of New York's Uniform System of Accounts.
// lib/programs.ts explains each adjustment and runs this once for every year
// it shows.
//
// Each year comes from the Town's Budget Supplements, which print every line of
// the year's adopted budget again in the following year's Supplement, and the
// Tentative Budget in its own. A year is shown only when its lines add up, fund
// by fund, to the Summary page of that year's budget on both the spending and
// the revenue side; unreconciled() is that test.
//
// This file imports nothing, so scripts/verify-programs.mjs runs the same
// arithmetic under Node that the page runs at build time.

export type ProgramKey = '1' | '3' | '4' | '5' | '6' | '7' | '8'

/** The order the page lists the programs in. */
export const PROGRAM_ORDER: ProgramKey[] = ['3', '8', '1', '5', '7', '4', '6']

// The seven service functions. Function 9 is not a program: it is benefits,
// debt, transfers and money set aside, redistributed or reported separately.
export const PROGRAM_NAMES: Record<ProgramKey, string> = {
  '1': 'General Government Support',
  '3': 'Public Safety',
  '4': 'Health',
  '5': 'Transportation',
  '6': 'Economic Assistance & Opportunity',
  '7': 'Culture & Recreation',
  '8': 'Home & Community Services',
}

// Funds whose function-1 spending is genuinely town-wide overhead and so stays
// in General Government. In every other fund it follows the fund's service.
const SHARED_FUNDS = new Set(['A01', 'MS1', 'MS2'])

export type BudgetLine = { fund: string; account: string; name: string; amount: number }
export type BudgetStage = 'adopted' | 'tentative'

export type ProgramDepartment = { fund: string; code: string; name: string; amount: number }

export type ProgramFigures = {
  key: ProgramKey
  direct: number
  benefits: number
  fullCost: number
  earned: number
  net: number
  /** Share of full cost the service recovers from the people who use it. */
  recoveryPct: number
  /** Departments by spending, largest first. */
  departments: ProgramDepartment[]
  /** Revenue lines tagged to the program, largest first. */
  revenues: { account: string; name: string; amount: number }[]
}

export type BudgetFigures = {
  programs: ProgramFigures[]
  debtService: number
  interfundTransfers: number
  /** Account 9990, "Fund Balance Contribution": money a fund budgets into its savings instead of spending it. */
  setAside: number
  setAsideLines: BudgetLine[]
  /** Pension, health insurance, payroll taxes and the like in function 9, before they are pushed onto programs. */
  benefitPool: number
  /** Function-1 spending in single-purpose funds, moved onto the service each fund exists for. */
  overheadMoved: number
  townwideRevenue: number
  /** Every spending line, which the Summary page calls appropriations. */
  appropriations: number
  revenueTotal: number
}

const isProgramKey = (g: string): g is ProgramKey =>
  g === '1' || g === '3' || g === '4' || g === '5' || g === '6' || g === '7' || g === '8'
const segments = (account: string) => account.split('-')
/** The department, or function, of a spending account: 3120 in A01-3-3120-101-NON-00000. */
const departmentOf = (account: string) => segments(account)[2] ?? ''
/** Object codes 100 to 199 are Personal Services, as etl/parse_subaccounts.py classifies them. */
const isPersonalServices = (account: string) => Math.floor(Number(segments(account)[3]) / 100) === 1
/** A revenue account's last segment is its function: a digit for a program, a letter or 0 for town-wide revenue. */
const tagOf = (account: string) => {
  const s = segments(account)
  return s[s.length - 1]
}
/** A department's name when the list of names lacks it: the start of its first line's name. */
const nameFromLine = (line: string) => line.split(/\s*-\s*/)[0].trim() || line

const add = <K>(map: Map<K, number>, key: K, value: number) => map.set(key, (map.get(key) ?? 0) + value)

/**
 * One year's budget as programs. `departmentNames` maps "FUND-CODE" to the
 * Town's name for a department.
 */
export function programBudget(spend: BudgetLine[], revenue: BudgetLine[], departmentNames: Record<string, string> = {}): BudgetFigures {
  // Each fund's departments, for the service a single-purpose fund exists for.
  const departmentTotals = new Map<string, Map<string, number>>()
  const firstLine = new Map<string, string>()
  for (const line of spend) {
    const code = departmentOf(line.account)
    if (!departmentTotals.has(line.fund)) departmentTotals.set(line.fund, new Map())
    add(departmentTotals.get(line.fund)!, code, line.amount)
    if (!firstLine.has(`${line.fund}-${code}`)) firstLine.set(`${line.fund}-${code}`, line.name)
  }
  const dominant = new Map<string, ProgramKey | null>()
  for (const [fund, codes] of Array.from(departmentTotals.entries())) {
    if (SHARED_FUNDS.has(fund)) { dominant.set(fund, null); continue }
    const byProgram = new Map<string, number>()
    for (const [code, amount] of Array.from(codes.entries())) {
      const g = code.charAt(0)
      if (isProgramKey(g) && g !== '1') add(byProgram, g, amount)
    }
    const best = Array.from(byProgram.entries()).sort((a, b) => b[1] - a[1])[0]
    dominant.set(fund, best && isProgramKey(best[0]) ? best[0] : null)
  }

  const direct = new Map<ProgramKey, number>()
  const personalServices = new Map<string, Map<ProgramKey, number>>()
  const fundDirect = new Map<string, Map<ProgramKey, number>>()
  const departments = new Map<string, ProgramDepartment & { key: ProgramKey }>()
  const benefitPoolByFund = new Map<string, number>()
  const setAsideLines: BudgetLine[] = []
  let uniformedBenefits = 0
  let benefitPool = 0
  let debtService = 0
  let interfundTransfers = 0
  let setAside = 0
  let overheadMoved = 0

  for (const line of spend) {
    const code = departmentOf(line.account)
    const raw = code.charAt(0)
    if (raw !== '9') {
      if (!isProgramKey(raw)) continue
      // Overhead inside a single-purpose fund follows its service.
      const moved = raw === '1' ? dominant.get(line.fund) ?? null : null
      const key: ProgramKey = moved ?? raw
      if (moved) overheadMoved += line.amount
      add(direct, key, line.amount)
      if (!fundDirect.has(line.fund)) fundDirect.set(line.fund, new Map())
      add(fundDirect.get(line.fund)!, key, line.amount)
      if (isPersonalServices(line.account)) {
        if (!personalServices.has(line.fund)) personalServices.set(line.fund, new Map())
        add(personalServices.get(line.fund)!, key, line.amount)
      }
      const id = `${line.fund}-${code}`
      const dept = departments.get(id) ?? { key, fund: line.fund, code, name: departmentNames[id] ?? nameFromLine(firstLine.get(id) ?? code), amount: 0 }
      dept.amount += line.amount
      departments.set(id, dept)
      continue
    }

    // Function 9 is not a service. Split it up.
    if (code.startsWith('97')) { debtService += line.amount; continue }
    if (code === '9901' || code === '9950') { interfundTransfers += line.amount; continue }
    if (code === '9990') { setAside += line.amount; if (line.amount) setAsideLines.push(line); continue }
    benefitPool += line.amount
    // The Town's own uniformed and non-uniformed split.
    if (line.account.includes('-UNI-')) uniformedBenefits += line.amount
    else add(benefitPoolByFund, line.fund, line.amount)
  }

  const benefits = new Map<ProgramKey, number>([['3', uniformedBenefits]])
  for (const [fund, pool] of Array.from(benefitPoolByFund.entries())) {
    // By payroll share where the fund has payroll; by spending share where it
    // carries benefits but contracts the work out.
    const ps = personalServices.get(fund)
    const basis = ps && Array.from(ps.values()).reduce((s, v) => s + v, 0) > 0 ? ps : fundDirect.get(fund) ?? new Map<ProgramKey, number>()
    const total = Array.from(basis.values()).reduce((s, v) => s + v, 0)
    if (total <= 0) continue
    for (const [key, value] of Array.from(basis.entries())) add(benefits, key, (pool * value) / total)
  }

  const earned = new Map<ProgramKey, number>()
  const revenues = new Map<ProgramKey, { account: string; name: string; amount: number }[]>()
  let townwideRevenue = 0
  for (const line of revenue) {
    const tag = tagOf(line.account)
    if (isProgramKey(tag)) {
      add(earned, tag, line.amount)
      if (line.amount > 0) revenues.set(tag, (revenues.get(tag) ?? []).concat({ account: line.account, name: line.name, amount: line.amount }))
    } else {
      townwideRevenue += line.amount
    }
  }

  const programs = PROGRAM_ORDER.map((key): ProgramFigures => {
    const d = direct.get(key) ?? 0
    const b = benefits.get(key) ?? 0
    const fullCost = d + b
    const e = earned.get(key) ?? 0
    return {
      key,
      direct: d,
      benefits: b,
      fullCost,
      earned: e,
      net: fullCost - e,
      recoveryPct: fullCost > 0 ? (e / fullCost) * 100 : 0,
      departments: Array.from(departments.values())
        .filter((x) => x.key === key && x.amount > 0)
        .map(({ fund, code, name, amount }) => ({ fund, code, name, amount }))
        .sort((a, z) => z.amount - a.amount),
      revenues: (revenues.get(key) ?? []).sort((a, z) => z.amount - a.amount),
    }
  })

  return {
    programs,
    debtService,
    interfundTransfers,
    setAside,
    setAsideLines,
    benefitPool,
    overheadMoved,
    townwideRevenue,
    appropriations: spend.reduce((s, l) => s + l.amount, 0),
    revenueTotal: revenue.reduce((s, l) => s + l.amount, 0),
  }
}

// ── Reading a year out of the Supplement histories ───────────────────────────

/** An account in web/public/data/budget-supplement/line-history.json or revenue-history.json. */
export type HistoryAccount = {
  account: string
  fund: string
  name: string
  adopted: Record<string, number | null>
  tentative?: number | null
}

/** One year's lines: an adopted year's column, or the Tentative of the newest Supplement. */
export function linesFor(accounts: HistoryAccount[], year: number, stage: BudgetStage): BudgetLine[] {
  return accounts
    .map((a) => ({ fund: a.fund, account: a.account, name: a.name, amount: (stage === 'tentative' ? a.tentative : a.adopted[String(year)]) ?? 0 }))
    .filter((l) => l.amount !== 0)
}

/**
 * The funds whose lines do not add up to that year's Summary page: spending
 * against appropriations, and revenue against appropriations too, since every
 * fund's budget balances. Empty when the year reconciles to the dollar.
 */
export function unreconciled(spend: BudgetLine[], revenue: BudgetLine[], summary: Record<string, { appropriations?: number | null }>): string[] {
  const total = (lines: BudgetLine[], fund: string) => lines.filter((l) => l.fund === fund).reduce((s, l) => s + l.amount, 0)
  const funds = Array.from(new Set(Object.keys(summary).concat(spend.map((l) => l.fund), revenue.map((l) => l.fund))))
  const off: string[] = []
  for (const fund of funds) {
    const official = summary[fund]?.appropriations ?? null
    if (official === null) { off.push(`${fund}: not on the Summary page`); continue }
    const spent = total(spend, fund)
    const raised = total(revenue, fund)
    if (Math.abs(spent - official) >= 0.5) off.push(`${fund}: spending lines ${Math.round(spent)} against ${official}`)
    if (Math.abs(raised - official) >= 0.5) off.push(`${fund}: revenue lines ${Math.round(raised)} against ${official}`)
  }
  return off
}

export type StageSummary = { source?: { title: string; url: string }; funds: Record<string, { appropriations?: number | null }> }
export type BudgetYear = { year: number; stage: BudgetStage; spend: BudgetLine[]; revenue: BudgetLine[]; summary: StageSummary }

/**
 * Every adopted year the Supplements reprint, and the newest Supplement's
 * Tentative, split into the years whose lines reconcile to their Summary page
 * and the years left out, with the funds that do not add up.
 */
export function budgetYears(
  spendHistory: { budgetYear: number; adoptedYears: number[]; accounts: HistoryAccount[] },
  revenueHistory: { accounts: HistoryAccount[] },
  summaries: Record<string, Partial<Record<BudgetStage, StageSummary>>>,
): { shown: BudgetYear[]; leftOut: { year: number; stage: BudgetStage; off: string[] }[] } {
  const candidates: { year: number; stage: BudgetStage }[] = spendHistory.adoptedYears
    .map((year) => ({ year, stage: 'adopted' as BudgetStage }))
    .concat([{ year: spendHistory.budgetYear, stage: 'tentative' }])
  const shown: BudgetYear[] = []
  const leftOut: { year: number; stage: BudgetStage; off: string[] }[] = []
  for (const { year, stage } of candidates) {
    const summary = summaries[String(year)]?.[stage]
    if (!summary) { leftOut.push({ year, stage, off: ['no Summary page on file'] }); continue }
    const spend = linesFor(spendHistory.accounts, year, stage)
    const revenue = linesFor(revenueHistory.accounts, year, stage)
    const off = unreconciled(spend, revenue, summary.funds)
    if (off.length) leftOut.push({ year, stage, off })
    else shown.push({ year, stage, spend, revenue, summary })
  }
  return { shown, leftOut }
}
