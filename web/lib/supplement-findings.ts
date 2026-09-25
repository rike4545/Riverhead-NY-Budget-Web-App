// What the line-by-line Budget Supplement shows about the Tentative, beyond
// its totals. Every figure is computed from the Supplements (lib/supplement.ts,
// lib/revenue.ts and history.json); only the questions are written by hand.

import historyJson from '../public/data/budget-supplement/history.json'
import {
  budgetYear, columns, expenditureHistory, figures, functionCode, lines, objectCode, total, usd,
  type LineHistory,
} from './supplement'
import { accountsIn, collected, estimated, FUND_LABELS, isOutside, revenueAccounts } from './revenue'

const ADOPTED = budgetYear - 1
const LAST = columns.actual // the most recent year with actual spending

const gfExpenditure = (l: { kind: string; fund: string }) => l.kind === 'expenditure' && l.fund === 'A01'
const gfLines = lines(gfExpenditure)
const gfHistory = expenditureHistory.filter((a) => a.fund === 'A01')
const sumHistory = (rows: LineHistory[], field: 'actual' | 'adopted', year: number) =>
  rows.reduce((s, a) => s + (a[field][String(year)] ?? 0), 0)

// --- Debt payments -----------------------------------------------------------
const debt = figures(['A01-9-9901-900-V01-00000'])
const debtNow = debt.adopted(ADOPTED) ?? 0
const debtNext = debt.tentative ?? 0
const gfAdopted = sumHistory(gfHistory, 'adopted', ADOPTED)
const gfTentative = total(gfLines, 'tentative')
export const debtFinding = {
  account: debt.accounts[0],
  page: debt.page,
  actualByYear: [LAST - 2, LAST - 1, LAST].map((y) => ({ year: y, amount: debt.actual(y) ?? 0 })),
  adopted: debtNow,
  tentative: debtNext,
  drop: debtNow - debtNext,
  gfAdopted,
  gfTentative,
  headlineGrowth: gfTentative - gfAdopted,
  otherGrowth: (gfTentative - debtNext) - (gfAdopted - debtNow),
  otherGrowthPct: ((gfTentative - debtNext) / (gfAdopted - debtNow) - 1) * 100,
}

// --- Where the General Fund's surplus comes from (the last full year) -------
function spendingGroup(account: string): string {
  const fn = functionCode(account)
  const obj = objectCode(account)
  if (fn === '9010' || fn === '9015') return 'State pension contributions'
  if (fn === '9060' || fn === '9065') return 'Health, dental and optical insurance'
  if (fn === '9040') return 'Workers’ compensation'
  if (['9030', '9035', '9050', '9055'].includes(fn)) return 'Social Security and other benefits'
  if (fn === '9901' || fn === '9950') return 'Transfers for debt, capital projects and other funds'
  if (obj.startsWith('1')) return 'Pay (all personal services)'
  if (obj.startsWith('2')) return 'Equipment'
  if (obj.startsWith('4')) return 'Contractual (services, supplies, utilities)'
  return 'Other'
}
const BENEFIT_GROUPS = ['State pension contributions', 'Health, dental and optical insurance', 'Workers’ compensation', 'Social Security and other benefits']

const groups = new Map<string, { budget: number; actual: number }>()
for (const a of gfHistory) {
  const g = groups.get(spendingGroup(a.account)) ?? { budget: 0, actual: 0 }
  g.budget += a.adopted[String(LAST)] ?? 0
  g.actual += a.actual[String(LAST)] ?? 0
  groups.set(spendingGroup(a.account), g)
}
const group = (name: string) => groups.get(name) ?? { budget: 0, actual: 0 }
const benefitsUnder = BENEFIT_GROUPS.reduce((s, g) => s + (group(g).budget - group(g).actual), 0)
const pay = group('Pay (all personal services)')

const gfOutside = accountsIn('A01', isOutside)
const interest = revenueAccounts.find((a) => a.account === 'A01-2401-000-00000-G')!
export const surplusFinding = {
  year: LAST,
  spendingBudget: sumHistory(gfHistory, 'adopted', LAST),
  spendingActual: sumHistory(gfHistory, 'actual', LAST),
  payBudget: pay.budget,
  payActual: pay.actual,
  benefitsUnder,
  outsideEstimated: estimated(gfOutside, LAST),
  outsideCollected: collected(gfOutside, LAST),
  interestBudget: interest.adopted[String(LAST)] ?? 0,
  interestActual: interest.actual[String(LAST)] ?? 0,
  interestNow: interest.adopted[String(ADOPTED)] ?? 0,
  interestMidYear: interest.ytd[String(ADOPTED)] ?? 0,
  interestTentative: interest.tentative ?? 0,
}

// --- Health insurance ----------------------------------------------------------
const health = figures(['A01-9-9060-', 'A01-9-9065-'])
export const healthFinding = {
  budgetLast: health.adopted(LAST) ?? 0,
  actualLast: health.actual(LAST) ?? 0,
  budgetNow: health.adopted(ADOPTED) ?? 0,
  midYearPrior: health.ytd(LAST) ?? 0,
  midYearNow: health.ytd(ADOPTED) ?? 0,
  tentative: health.tentative ?? 0,
  page: health.page,
}

// --- Multi-year patterns (etl/parse_supplement_history.py) -----------------
type Chronic = { account: string; name: string; fund: string; page: number | null; actual: Record<string, number>; averageActual: number; tentative: number; gap: number }
type Unused = { account: string; name: string; fund: string; page: number | null; tentative: number }
const chronic = historyJson.chronicUnderBudget as Chronic[]
const unused = historyJson.unused as Unused[]
export const chronicFinding = { lines: chronic, gap: chronic.reduce((s, r) => s + r.gap, 0) }
export const unusedFinding = {
  count: unused.length,
  total: unused.reduce((s, r) => s + r.tentative, 0),
  generalFund: unused.filter((r) => r.fund === 'A01').reduce((s, r) => s + r.tentative, 0),
  largest: unused.slice(0, 3),
}

// --- Revenue that depends on an agreement not yet signed ---------------------
const sro = revenueAccounts.find((a) => a.account === 'A01-1520-200-00000-3')!
export const sroFinding = {
  page: sro.page,
  request: sro.request ?? 0,
  tentative: sro.tentative ?? 0,
  received: [2024, LAST].map((y) => ({ year: y, amount: sro.actual[String(y)] ?? 0 })),
  midYear: sro.ytd[String(ADOPTED)] ?? 0,
}

// --- Employee benefits and the pension estimate --------------------------------
const BENEFIT_FUNCTIONS = ['9010', '9015', '9030', '9035', '9040', '9050', '9055', '9060', '9065']
const benefitLines = gfLines.filter((l) => BENEFIT_FUNCTIONS.includes(functionCode(l.account)))
const pension = gfLines.filter((l) => ['9010', '9015'].includes(functionCode(l.account)))
export const benefitsFinding = {
  actual: total(benefitLines, 'actual'),
  adopted: total(benefitLines, 'adopted'),
  tentative: total(benefitLines, 'tentative'),
  shareOfGeneralFund: total(benefitLines, 'tentative') / gfTentative,
  pensionRequest: total(pension, 'request'),
  pensionTentative: total(pension, 'tentative'),
}

export const findingsYears = { last: LAST, adopted: ADOPTED, budget: budgetYear }

export type Finding = { id: string; title: string; body: string; link?: { href: string; label: string } }

const base = process.env.NEXT_PUBLIC_BASE_PATH || ''
const pctText = (n: number) => `${n.toFixed(1)}%`

// The questions below name 2027 facts by hand: the September 15 tabling, the
// ten incentive retirements, the State's September 8 rate notice. When a newer
// Supplement arrives they no longer apply, so the list is withheld rather than
// shown against the wrong budget.
const FOR_YEAR = 2027

export const findings: Finding[] = budgetYear !== FOR_YEAR ? [] : [
  {
    id: 'debt',
    title: 'The General Fund’s debt payments fall about $1 million',
    body: `Its transfer for debt payments drops from ${usd(debtNow)} to ${usd(debtNext)}, ${usd(debtNow - debtNext)} less. Leave debt out and the rest of the General Fund rises ${usd(debtFinding.otherGrowth)}, or ${pctText(debtFinding.otherGrowthPct)}, where the headline increase is ${usd(debtFinding.headlineGrowth)}. The drop made room for other spending; the General Fund levy still rises the full amount the cap allows.`,
  },
  {
    id: 'surplus',
    title: `Where ${LAST}’s surplus came from`,
    body: `Pay came within ${usd(Math.abs(pay.actual - pay.budget))} of its ${LAST} budget. Pensions, health insurance, workers’ compensation, Social Security and other benefits came in ${usd(benefitsUnder)} under their budgets. Revenue from outside sources — everything but the tax levy and money moved between the Town’s own funds — came in ${usd(surplusFinding.outsideCollected - surplusFinding.outsideEstimated)} over its estimate; interest alone was budgeted at ${usd(surplusFinding.interestBudget)} and brought in ${usd(surplusFinding.interestActual)}. The ${budgetYear} Tentative raises the interest estimate to ${usd(surplusFinding.interestTentative)}.`,
    link: { href: `${base}/revenue/`, label: 'Every revenue stream' },
  },
  {
    id: 'health',
    title: `Health insurance: ${usd(healthFinding.tentative - healthFinding.actualLast)} above ${LAST} spending`,
    body: `The General Fund budgets ${usd(healthFinding.tentative)} for health, dental and optical insurance, ${pctText((healthFinding.tentative / healthFinding.budgetNow - 1) * 100)} above the ${ADOPTED} budget. ${LAST} came in ${usd(healthFinding.budgetLast - healthFinding.actualLast)} under its budget, and the first half of ${ADOPTED} cost ${usd(healthFinding.midYearNow)} against ${usd(healthFinding.midYearPrior)} in the first half of ${LAST}. Part of the increase is retiree coverage for the ten employees who took the retirement incentive. Mid-year figures can shift with billing dates, so the question is what premium increase the Tentative assumes.`,
  },
  {
    id: 'chronic',
    title: `${chronic.length} lines over budget three years running, budgeted low again`,
    body: `${chronic.map((r) => `“${r.name}” in the ${FUND_LABELS[r.fund] ?? r.fund} averaged ${usd(r.averageActual)} a year and gets ${usd(r.tentative)} in the Tentative`).join('; ')}. A line can only spend past its budget if money is moved to it during the year, so the adopted budget never shows what these cost.`,
    link: { href: `${base}/budget-accuracy/`, label: 'Budget accuracy' },
  },
  {
    id: 'unused',
    title: `${unusedFinding.count} lines budgeted every year, never used`,
    body: `Nothing has been spent from them in the last three years or the first half of ${ADOPTED}, yet the Tentative carries ${usd(unusedFinding.total)} on them, ${usd(unusedFinding.generalFund)} in the General Fund. The largest: ${unusedFinding.largest.map((r) => `“${r.name}” (${usd(r.tentative)})`).join(', ')}.`,
    link: { href: `${base}/budget-accuracy/`, label: 'The full list' },
  },
  {
    id: 'sro',
    title: 'Revenue from an agreement the Board tabled',
    body: `The Tentative counts ${usd(sroFinding.tentative)} of reimbursement for school resource officers, ${usd(sroFinding.tentative - sroFinding.request)} more than was requested, from the agreement with the Riverhead Central School District the Board tabled on September 15. The Town received ${sroFinding.received.map((r) => `${usd(r.amount)} in ${r.year}`).join(' and ')}, and ${usd(sroFinding.midYear)} through June 30, ${ADOPTED}.`,
    link: { href: `${base}/school-resource-officers/`, label: 'School resource officers' },
  },
  {
    id: 'benefits',
    title: 'Employee benefits are a third of the General Fund',
    body: `Pensions, health insurance, Social Security, workers’ compensation and unemployment come to ${usd(benefitsFinding.tentative)} in the ${budgetYear} Tentative, ${Math.round(benefitsFinding.shareOfGeneralFund * 100)}% of the General Fund, up from ${usd(benefitsFinding.adopted)} budgeted for ${ADOPTED} and ${usd(benefitsFinding.actual)} spent in ${LAST}. The Tentative’s pension figure is ${usd(benefitsFinding.pensionRequest - benefitsFinding.pensionTentative)} below what departments requested; the State set its ${budgetYear}–${String(budgetYear + 1).slice(2)} rates on September 8.`,
  },
]
