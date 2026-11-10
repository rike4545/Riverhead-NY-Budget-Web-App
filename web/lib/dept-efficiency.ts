// Department (cost center) measures for /department-efficiency/.
//
// A cost center here is a fund and function, as the Town's accounts number
// them: A01-3120 is the General Fund's Police, DA1-5142 the Highway Fund's snow
// removal. Every measure comes from the Budget Supplements' line history
// (actual spending 2018 onward, adopted budgets 2019 onward, the current
// Preliminary): what each department spends, how that has changed, what it
// costs per resident, how close its spending comes to its budget, what kind of
// costs it carries, and which of its lines a review would start with.
//
// Employee benefits (retirement, health insurance, Social Security) are
// budgeted fund-wide (functions 9010 to 9089), not in the departments, so a
// department's total here is its own lines only. The measures describe the
// records; they are prompts for questions, not findings about how well a
// department works.
//
// No imports: the page passes the naming functions in, and
// scripts/verify-dept-efficiency.mjs runs the same function.

export type HistoryLine = {
  account: string
  fund: string
  name: string
  actual: Record<string, number>
  adopted: Record<string, number>
  proposed?: number | null
}
export type EffNaming = {
  departmentName: (fund: string, fn: string) => string | null
  plainAccountName: (account: string, townName: string) => { name: string }
  FUND_NAMES: Record<string, string>
  isFundWide: (fn: string) => boolean
}

export type LineToReview = { account: string; name: string; why: 'under' | 'over' | 'unused'; detail: string; budget: number }
export type Department = {
  key: string
  fund: string
  fundName: string
  fn: string
  name: string
  /** Function group: 1 general government, 3 public safety, 5 transportation, 6 economic assistance, 7 culture and recreation, 8 home and community. */
  group: string
  lines: number
  actual: Record<string, number>
  adopted: Record<string, number>
  proposed: number
  latestActual: number
  latestBudget: number
  currentBudget: number
  /** Change in actual spending from the first to the latest year both have spending, with the years. */
  growth: { from: number; to: number; first: number; last: number; pct: number | null; perYear: number | null } | null
  perResident: number
  /** Actual over adopted, each year 2019 onward where both exist. */
  execution: { year: number; budget: number; actual: number; ratio: number | null }[]
  /** How far spending landed from budget, on average: the sum of |actual − budget| over the sum of budgets, in percent. */
  avgVariance: number | null
  yearsOver: number
  yearsCompared: number
  mix: { personal: number; equipment: number; contractual: number; other: number }
  /** Overtime (object 111) as a share of personal services, latest year. */
  overtimeShare: number | null
  review: LineToReview[]
}

export const GROUPS: Record<string, string> = {
  '1': 'General government', '3': 'Public safety', '4': 'Health', '5': 'Transportation', '6': 'Economic assistance',
  '7': 'Culture and recreation', '8': 'Home and community services',
}

const objectOf = (account: string) => account.split('-')[3] ?? ''
const fnOf = (account: string) => account.split('-')[2] ?? ''
const isSpending = (account: string) => /^[A-Z]{1,3}\d{1,2}-\d-\d{4}-/.test(account)
const r1 = (n: number) => Math.round(n * 10) / 10

/** A one-time entry the records explain, taken out of a year's actual so it does not read as growth (see lib/account-changes.ts). */
export type OneOff = { account: string; year: number; amount: number; number: string }

export function departmentMeasures(lines: HistoryLine[], n: EffNaming, actualYears: number[], adoptedYears: number[], population: number, oneOffs: OneOff[] = []): Department[] {
  const last = Math.max(...actualYears)
  const current = Math.max(...adoptedYears)
  const compareYears = adoptedYears.filter((y) => actualYears.includes(y))
  const five = compareYears.slice(-5)
  const byKey = new Map<string, HistoryLine[]>()
  for (const l of lines) {
    if (!isSpending(l.account)) continue
    const fn = fnOf(l.account)
    if (n.isFundWide(fn)) continue
    const key = `${l.fund}-${fn}`
    ;(byKey.get(key) ?? byKey.set(key, []).get(key)!).push(l)
  }
  const off = (account: string, y: number) => oneOffs.filter((o) => o.account === account && o.year === y).reduce((s, o) => s + o.amount, 0)
  const spent = (l: HistoryLine, y: number) => (l.actual[y] ?? 0) - off(l.account, y)
  const sumYear = (ls: HistoryLine[], k: 'actual' | 'adopted', y: number) => ls.reduce((s, l) => s + (k === 'actual' ? spent(l, y) : (l.adopted[y] ?? 0)), 0)
  const out: Department[] = []
  for (const [key, ls] of Array.from(byKey.entries())) {
    const [fund, fn] = key.split('-')
    const actual: Record<string, number> = {}
    const adopted: Record<string, number> = {}
    for (const y of actualYears) actual[y] = Math.round(sumYear(ls, 'actual', y))
    for (const y of adoptedYears) adopted[y] = Math.round(sumYear(ls, 'adopted', y))
    const proposed = Math.round(ls.reduce((s, l) => s + (l.proposed ?? 0), 0))
    const spentYears = actualYears.filter((y) => actual[y] > 0)
    let growth: Department['growth'] = null
    if (spentYears.length >= 2) {
      const first = spentYears[0]
      const lastY = spentYears[spentYears.length - 1]
      const span = lastY - first
      growth = {
        from: actual[first], to: actual[lastY], first, last: lastY,
        pct: actual[first] > 0 ? r1((actual[lastY] / actual[first] - 1) * 100) : null,
        perYear: actual[first] > 0 && span > 0 ? r1((Math.pow(actual[lastY] / actual[first], 1 / span) - 1) * 100) : null,
      }
    }
    const execution = compareYears.map((y) => ({ year: y, budget: adopted[y], actual: actual[y], ratio: adopted[y] > 0 ? actual[y] / adopted[y] : null }))
    const withBudget = execution.filter((e) => e.budget > 0)
    // Weighted by budget, so a year with a tiny budget does not swamp the rest.
    const budgetSum = withBudget.reduce((s, e) => s + e.budget, 0)
    const avgVariance = budgetSum > 0 ? r1((withBudget.reduce((s, e) => s + Math.abs(e.actual - e.budget), 0) / budgetSum) * 100) : null
    const latest = ls.map((l) => ({ obj: objectOf(l.account), v: spent(l, last) }))
    const mixSum = (test: (o: string) => boolean) => Math.round(latest.filter((x) => test(x.obj)).reduce((s, x) => s + x.v, 0))
    const personal = mixSum((o) => o.startsWith('1'))
    const mix = { personal, equipment: mixSum((o) => o.startsWith('2')), contractual: mixSum((o) => o.startsWith('4')), other: 0 }
    mix.other = Math.max(0, actual[last] - mix.personal - mix.equipment - mix.contractual)
    const ot = mixSum((o) => o === '111')
    const review: LineToReview[] = []
    for (const l of ls) {
      const budgeted = five.filter((y) => (l.adopted[y] ?? 0) >= 5000)
      const name = n.plainAccountName(l.account, l.name).name
      const budgetNow = l.adopted[current] ?? 0
      if (budgeted.length >= 4) {
        const under = budgeted.filter((y) => spent(l, y) < 0.8 * l.adopted[y])
        const over = budgeted.filter((y) => spent(l, y) > l.adopted[y])
        const unused = budgeted.filter((y) => spent(l, y) === 0)
        if (unused.length >= 3) review.push({ account: l.account, name, why: 'unused', budget: budgetNow, detail: `Budgeted but nothing spent in ${unused.length} of ${budgeted.length} years (${unused.join(', ')})` })
        else if (under.length >= 4) review.push({ account: l.account, name, why: 'under', budget: budgetNow, detail: `Spent less than 80% of its budget in ${under.length} of ${budgeted.length} years` })
        else if (over.length >= 4) review.push({ account: l.account, name, why: 'over', budget: budgetNow, detail: `Spent more than its budget in ${over.length} of ${budgeted.length} years` })
      }
    }
    review.sort((a, b) => b.budget - a.budget)
    const latestActual = actual[last] ?? 0
    if (latestActual === 0 && (adopted[current] ?? 0) === 0 && proposed === 0) continue
    out.push({
      key, fund, fn, fundName: n.FUND_NAMES[fund] ?? fund,
      name: n.departmentName(fund, fn) ?? `${fund} function ${fn}`,
      group: GROUPS[fn.charAt(0)] ? fn.charAt(0) : '1',
      lines: ls.length, actual, adopted, proposed,
      latestActual, latestBudget: adopted[last] ?? 0, currentBudget: adopted[current] ?? 0,
      growth,
      perResident: population > 0 ? Math.round((latestActual / population) * 100) / 100 : 0,
      execution, avgVariance,
      yearsOver: withBudget.filter((e) => e.actual > e.budget).length,
      yearsCompared: withBudget.length,
      mix,
      overtimeShare: personal > 0 ? r1((ot / personal) * 100) : null,
      review,
    })
  }
  return out.sort((a, b) => b.latestActual - a.latestActual)
}

// ── Survey kits ───────────────────────────────────────────────────────────────

export type SurveyQuestion = { text: string; kind: 'scale' | 'yesno' | 'open' | 'choice'; choices?: string[] }
export type SurveyKit = { resident: SurveyQuestion[]; staff: SurveyQuestion[] }

const SCALE = 'Very dissatisfied, dissatisfied, neutral, satisfied, very satisfied'

/** Questions a group of services adds to the common ones. */
const GROUP_QUESTIONS: Record<string, SurveyQuestion[]> = {
  '1': [
    { text: 'When you last contacted this office, was your request handled the first time, without being sent elsewhere?', kind: 'yesno' },
    { text: 'Could you complete what you needed online, without visiting in person?', kind: 'choice', choices: ['Yes, fully online', 'Partly', 'No, I had to visit', 'I did not know an online option existed'] },
  ],
  '3': [
    { text: 'How satisfied are you with how quickly this service responded when you needed it?', kind: 'scale' },
    { text: 'How safe do you feel in your neighborhood?', kind: 'choice', choices: ['Very safe', 'Safe', 'Neither', 'Unsafe', 'Very unsafe'] },
  ],
  '5': [
    { text: 'How would you rate the condition of the roads you use most?', kind: 'choice', choices: ['Very good', 'Good', 'Fair', 'Poor', 'Very poor'] },
    { text: 'After the last snowfall, how satisfied were you with how soon your street was cleared?', kind: 'scale' },
  ],
  '7': [
    { text: 'How often have you or your household used these programs or facilities in the past year?', kind: 'choice', choices: ['Never', 'Once or twice', 'Several times', 'Monthly or more'] },
    { text: 'How satisfied are you with the condition and cleanliness of the facilities?', kind: 'scale' },
  ],
  '8': [
    { text: 'How satisfied are you with how reliable this service is (for example collection on schedule, or water and sewer without interruption)?', kind: 'scale' },
    { text: 'If you applied for a permit or approval, how satisfied were you with how long it took?', kind: 'scale' },
  ],
}

/** Questions for one function where its group's would not fit. */
const FUNCTION_QUESTIONS: Record<string, SurveyQuestion[]> = {
  '5182': [
    { text: 'How satisfied are you with the street lighting where you live?', kind: 'scale' },
    { text: 'When you reported a streetlight out, how long did it take to be fixed?', kind: 'choice', choices: ['Within a week', 'One to four weeks', 'Longer than a month', 'It was not fixed', 'I have not reported one'] },
  ],
  '4540': [
    { text: 'If you or someone in your household needed an ambulance, how satisfied were you with how quickly it arrived?', kind: 'scale' },
    { text: 'How satisfied were you with the care the crew gave?', kind: 'scale' },
  ],
  '5650': [
    { text: 'How easy is it to find parking when you need it?', kind: 'choice', choices: ['Very easy', 'Easy', 'Neither', 'Hard', 'Very hard'] },
    { text: 'How satisfied are you with the condition, lighting and upkeep of the parking areas?', kind: 'scale' },
  ],
}

export function surveyKit(d: Pick<Department, 'name' | 'group' | 'fn'>): SurveyKit {
  const resident: SurveyQuestion[] = [
    { text: `Have you used or contacted ${d.name} in the past 12 months?`, kind: 'yesno' },
    { text: `Overall, how satisfied are you with the service ${d.name} provides?`, kind: 'scale' },
    { text: 'How satisfied are you with how long it took to get what you needed?', kind: 'scale' },
    { text: 'Were staff courteous and able to answer your questions?', kind: 'scale' },
    ...(FUNCTION_QUESTIONS[d.fn] ?? GROUP_QUESTIONS[d.group] ?? []),
    { text: `For what it costs, how would you rate the value of ${d.name}’s service?`, kind: 'choice', choices: ['Excellent', 'Good', 'Fair', 'Poor', 'Not sure'] },
    { text: 'What one change would most improve this service?', kind: 'open' },
  ]
  const staff: SurveyQuestion[] = [
    { text: 'Does your department have a written strategic plan or mission statement?', kind: 'choice', choices: ['Yes', 'Being written', 'No', 'Not sure'] },
    { text: 'If so, do you know its goals and how your work is measured against them?', kind: 'choice', choices: ['Yes', 'Partly', 'No', 'There is no plan'] },
    { text: 'Which tasks take the most of your time in a typical week?', kind: 'open' },
    { text: 'Which steps in your work are repeated, done on paper, or entered in more than one system?', kind: 'open' },
    { text: 'Do you have the equipment, software and training you need to do your job well?', kind: 'scale' },
    { text: 'How often is overtime needed because of staffing gaps rather than emergencies or weather?', kind: 'choice', choices: ['Never', 'Rarely', 'Sometimes', 'Often', 'Not applicable'] },
    { text: 'Is any work done by more than one department, or handed back and forth between them?', kind: 'open' },
    { text: 'Which budget line is hardest to keep within, and why?', kind: 'open' },
    { text: 'What one change would save the most time or money without reducing service?', kind: 'open' },
  ]
  return { resident, staff }
}

export const SURVEY_SCALE = SCALE
