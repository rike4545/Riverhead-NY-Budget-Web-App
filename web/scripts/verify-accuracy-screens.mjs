// /budget-accuracy/'s "Budget against cost, year by year": the four screens in
// lib/accuracy-screens.ts, run here on the same records, must each appear on
// the built page with every line they find and every figure that puts it there.
// A screen that finds nothing is not shown, so it is checked for absence.

import { existsSync, readFileSync } from 'node:fs'
import {
  aboveCost, isScreenedRevenue, isScreenedSpending, pastBudgetByMidYear, revenueBelowEstimate, shortOfCost,
} from '../lib/accuracy-screens.ts'

const fail = (message) => { console.error(`ACCURACY SCREENS VERIFY FAILED: ${message}`); process.exitCode = 1 }
const read = (p) => JSON.parse(readFileSync(p, 'utf8'))
const usd = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

const lines = read('public/data/budget-supplement/line-history.json')
const revenue = read('public/data/budget-supplement/revenue-history.json')
const history = read('public/data/budget-supplement/history.json')
const current = read('public/data/budget-supplement/current-lines.json')

const control = new Map(current.lines.map((l) => [l.account, l.control]))
const listed = new Set([...history.unused, ...history.chronicUnderBudget].map((r) => r.account))
const spending = lines.accounts.filter((a) => isScreenedSpending(a.account, control.get(a.account)) && !listed.has(a.account))
const years = lines.actualYears.slice(-3).map(String)
const midYear = String(lines.actualYears[lines.actualYears.length - 1] + 1)
if (years.length !== 3) fail(`the line history has ${years.length} actual years, not three`)
if (String(revenue.actualYears.slice(-1)[0]) !== years[2]) fail(`the revenue history ends in ${revenue.actualYears.slice(-1)[0]}, the spending history in ${years[2]}`)

const screens = {
  'Budgeted below what it costs': shortOfCost(spending, years),
  'Budgeted well above what it costs': aboveCost(spending, years),
  [`Past the whole ${midYear} budget by June 30`]: pastBudgetByMidYear(spending, midYear),
  'Revenue estimated above what comes in': revenueBelowEstimate(revenue.accounts.filter(isScreenedRevenue), years),
}

const built = 'out/budget-accuracy/index.html'
if (!existsSync(built)) { fail(`${built} was not built`); process.exit() }
const html = readFileSync(built, 'utf8').replace(/<!-- -->/g, '').replace(/&#x27;|&apos;/g, "'").replace(/&amp;/g, '&')
const has = (s) => html.includes(s)

if (!has('Budget against cost, year by year')) fail('the page has no year-by-year section')
let found = 0
for (const [title, rows] of Object.entries(screens)) {
  if (rows.length === 0) { if (has(title)) fail(`"${title}" is shown though it finds nothing`); continue }
  if (!has(`${title} (${rows.length})`)) fail(`"${title}" does not count its ${rows.length} lines`)
  for (const r of rows) {
    found++
    if (!has(r.account)) fail(`${title}: ${r.account} (${r.name}) is not on the page`)
    if (!has(usd(r.gap))) fail(`${title}: ${r.account}'s gap of ${usd(r.gap)} is not on the page`)
    for (const y of r.years ?? []) if (!has(usd(y.actual)) || !has(`of ${usd(y.budget)}`)) fail(`${title}: ${r.account} ${y.year} (${usd(y.actual)} of ${usd(y.budget)}) is not on the page`)
  }
}
if (!process.exitCode) console.log(`accuracy screens: ${found} lines across ${Object.values(screens).filter((r) => r.length).length} screens, ${years[0]}-${years[2]} and ${midYear} to June 30`)
