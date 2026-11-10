// What a department enters on /department-efficiency/ to measure quality, and
// what the page works out from it:
//
// - Output measures: units of service a year (permits issued, calls answered,
//   miles paved). Cost per unit is the department's actual spending that year,
//   from the Budget Supplements, divided by the units entered.
// - Survey results: the tallies from the printed resident and staff surveys.
//   For a satisfaction scale the page gives the average (1 to 5), the share
//   satisfied (the top two answers) and a 95% margin of error on that share.
// - Service standards: the department's own target, from its page on the
//   Town's website or a document it has adopted, with where it is published,
//   and the actual count meeting it. The site suggests no targets of its own:
//   without the department's target the page reports the rate, not "met".
// - Strategic plan: whether the department has a written plan or mission
//   statement, what it is called, when it was adopted and where to find it.
//
// Nothing entered leaves the browser. No imports, so
// scripts/verify-quality-inputs.mjs runs the same functions.

export type OutputMeasure = { id: string; name: string; unit: string; values: Record<string, number | null> }
export type CostPerUnit = { year: number; spending: number; units: number; cost: number }

/** Cost per unit in every year with both spending and a positive count. */
export function costPerUnit(spending: Record<string, number>, m: OutputMeasure): { rows: CostPerUnit[]; change: number | null; perYear: number | null } {
  const rows = Object.keys(m.values)
    .map(Number)
    .filter((y) => (m.values[y] ?? 0) > 0 && (spending[y] ?? 0) > 0)
    .sort((a, b) => a - b)
    .map((y) => ({ year: y, spending: spending[y], units: m.values[y] as number, cost: spending[y] / (m.values[y] as number) }))
  if (rows.length < 2) return { rows, change: null, perYear: null }
  const first = rows[0]
  const last = rows[rows.length - 1]
  const change = (last.cost / first.cost - 1) * 100
  const span = last.year - first.year
  return { rows, change, perYear: span > 0 ? (Math.pow(last.cost / first.cost, 1 / span) - 1) * 100 : null }
}

/** Counts for one question, in the order of its answers. A scale runs from the lowest (index 0) to the highest. */
export type Tally = { question: string; kind: 'scale' | 'yesno' | 'choice'; answers: string[]; counts: number[] }

export type TallyResult = {
  n: number
  /** Scale only: the average answer on a 1-to-5 (or 1-to-k) scale. */
  mean: number | null
  /** Scale: share choosing one of the top two answers. Yes/no: share answering yes. Choice: share of the most common answer. */
  share: number | null
  shareLabel: string
  /** Half-width of a 95% confidence interval on the share, in percentage points, with a finite-population correction when the number served is known. */
  margin: number | null
  /** Fewer than 30 answers: too few for the share to mean much. */
  tooFew: boolean
}

export function marginOfError(p: number, n: number, population?: number | null): number {
  if (n <= 0) return NaN
  const fpc = population && population > n ? Math.sqrt((population - n) / (population - 1)) : 1
  return 1.96 * Math.sqrt((p * (1 - p)) / n) * fpc * 100
}

export function tallyResult(t: Tally, population?: number | null): TallyResult {
  const n = t.counts.reduce((s, c) => s + (c > 0 ? c : 0), 0)
  if (n === 0) return { n, mean: null, share: null, shareLabel: '', margin: null, tooFew: true }
  let mean: number | null = null
  let hits = 0
  let shareLabel = ''
  if (t.kind === 'scale') {
    mean = t.counts.reduce((s, c, i) => s + Math.max(0, c) * (i + 1), 0) / n
    hits = t.counts.slice(-2).reduce((s, c) => s + Math.max(0, c), 0)
    shareLabel = `${t.answers.slice(-2).join(' or ').toLowerCase()}`
  } else if (t.kind === 'yesno') {
    hits = Math.max(0, t.counts[0] ?? 0)
    shareLabel = t.answers[0].toLowerCase()
  } else {
    const top = t.counts.indexOf(Math.max(...t.counts))
    hits = Math.max(0, t.counts[top])
    shareLabel = t.answers[top].toLowerCase()
  }
  const p = hits / n
  return { n, mean, share: p * 100, shareLabel, margin: marginOfError(p, n, population), tooFew: n < 30 }
}

export type Standard = {
  id: string
  name: string
  /** The promise, in words: "within 10 business days". */
  promise: string
  /** The share of cases that should meet it, in percent, as the department set it; null until entered. */
  target: number | null
  /** Where the target is defined: the department's web page, a plan or a policy. */
  source: string
  met: number | null
  total: number | null
}

export function standardResult(s: Standard): { rate: number | null; met: boolean | null; gap: number | null } {
  if (!s.total || s.total <= 0 || s.met === null || s.met < 0 || s.met > s.total) return { rate: null, met: null, gap: null }
  const rate = (s.met / s.total) * 100
  // No target from the department, no verdict: the rate alone is reported.
  if (s.target === null) return { rate, met: null, gap: null }
  return { rate, met: rate >= s.target, gap: rate - s.target }
}

export type PlanStatus = 'yes' | 'no' | 'in-progress' | 'unknown'
export type StrategicPlan = { status: PlanStatus | null; title: string; adopted: string; link: string; mission: string; goals: string }
export const PLAN_STATUS: { id: PlanStatus; label: string }[] = [
  { id: 'yes', label: 'Yes, a written plan or mission statement' },
  { id: 'in-progress', label: 'Being written' },
  { id: 'no', label: 'No' },
  { id: 'unknown', label: 'Not sure' },
]

/** Measures a department could count, by kind of service (the function's first digit). */
export const SUGGESTED_MEASURES: Record<string, { name: string; unit: string }[]> = {
  '1': [{ name: 'Requests handled', unit: 'requests' }, { name: 'Documents processed', unit: 'documents' }, { name: 'Payments processed', unit: 'payments' }],
  '3': [{ name: 'Calls for service answered', unit: 'calls' }, { name: 'Inspections completed', unit: 'inspections' }, { name: 'Permits issued', unit: 'permits' }],
  '4': [{ name: 'Ambulance calls answered', unit: 'calls' }, { name: 'Clients served', unit: 'clients' }],
  '5': [{ name: 'Lane miles maintained', unit: 'lane miles' }, { name: 'Lane miles plowed per storm', unit: 'lane miles' }, { name: 'Potholes repaired', unit: 'potholes' }],
  '6': [{ name: 'Clients served', unit: 'clients' }, { name: 'Applications processed', unit: 'applications' }],
  '7': [{ name: 'Program participants', unit: 'participants' }, { name: 'Facility visits', unit: 'visits' }, { name: 'Acres maintained', unit: 'acres' }],
  '8': [{ name: 'Gallons treated (millions)', unit: 'million gallons' }, { name: 'Tons collected', unit: 'tons' }, { name: 'Applications reviewed', unit: 'applications' }],
}

/**
 * Kinds of standard a department might have, by kind of service. Names only:
 * the promise and the target come from the department, never from this site.
 */
export const SUGGESTED_STANDARDS: Record<string, string[]> = {
  '1': ['Requests answered on time'],
  '3': ['Inspections done on time', 'Permits issued on time'],
  '4': ['Response time'],
  '5': ['Streets cleared after snow', 'Potholes repaired on time'],
  '6': ['Applications processed on time'],
  '7': ['Facility complaints resolved on time'],
  '8': ['Collections on schedule', 'Plan reviews on time'],
}

const cell = (v: string | number | null | undefined) => {
  const s = v === null || v === undefined ? '' : String(v)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

/** Everything entered and worked out, as one spreadsheet. */
export function qualityCsv(department: string, spending: Record<string, number>, measures: OutputMeasure[], tallies: Tally[], population: number | null, standards: Standard[], plan?: StrategicPlan): string {
  const rows: (string | number | null)[][] = [['Department', department], []]
  if (plan) {
    rows.push(['Strategic plan or mission statement', PLAN_STATUS.find((x) => x.id === plan.status)?.label ?? 'Not answered'])
    if (plan.title) rows.push(['Title', plan.title])
    if (plan.adopted) rows.push(['Adopted', plan.adopted])
    if (plan.link) rows.push(['Where to find it', plan.link])
    if (plan.mission) rows.push(['Mission', plan.mission])
    if (plan.goals) rows.push(['Goals', plan.goals])
    rows.push([])
  }
  rows.push(['Output measures'], ['Measure', 'Unit', 'Year', 'Units', 'Spending', 'Cost per unit'])
  for (const m of measures) for (const r of costPerUnit(spending, m).rows) rows.push([m.name, m.unit, r.year, r.units, Math.round(r.spending), Math.round(r.cost * 100) / 100])
  rows.push([], ['Survey results', population ? `Number served: ${population}` : ''], ['Question', 'Answers', 'Responses', 'Average', 'Share', 'Of', 'Margin of error (points)'])
  for (const t of tallies) {
    const r = tallyResult(t, population)
    if (!r.n) continue
    rows.push([t.question, t.answers.map((a, i) => `${a}: ${t.counts[i] || 0}`).join('; '), r.n, r.mean === null ? '' : Math.round(r.mean * 100) / 100, r.share === null ? '' : Math.round(r.share * 10) / 10, r.shareLabel, r.margin === null ? '' : Math.round(r.margin * 10) / 10])
  }
  rows.push([], ['Service standards'], ['Standard', 'Promise', 'Target %', 'Where the target is defined', 'Met', 'Total', 'Actual %', 'Result'])
  for (const s of standards) {
    const r = standardResult(s)
    rows.push([s.name, s.promise, s.target, s.source, s.met, s.total, r.rate === null ? '' : Math.round(r.rate * 10) / 10, r.met === null ? (s.target === null ? 'No target entered' : '') : r.met ? 'Met' : 'Not met'])
  }
  return rows.map((r) => r.map(cell).join(',')).join('\n')
}
