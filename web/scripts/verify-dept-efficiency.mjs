// The department efficiency view (/department-efficiency/, lib/dept-efficiency.ts).
// - every department spending line (not a fund-wide benefit line) is counted
//   in exactly one department, and each department's yearly actual and budget
//   add up to its lines in the Budget Supplements' line history;
// - the one-off the records explain (Resolution 2026-640) is taken out of the
//   Water District's 2025 spending, and only that amount;
// - every line flagged for review meets its rule in the records;
// - each department's survey kit names it and asks residents and staff;
// - the built page carries the measures and the survey kit.
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { departmentMeasures, surveyKit } from '../lib/dept-efficiency.ts'
import { plainAccountName, departmentName, FUND_NAMES, isFundWide } from '../lib/account-names.ts'
import { ONE_OFF_EXPLAINED } from '../lib/account-changes.ts'

const root = process.cwd()
const fail = (m) => { console.error(`DEPT EFFICIENCY VERIFY FAILED: ${m}`); process.exitCode = 1 }
const h = JSON.parse(readFileSync(join(root, 'public/data/budget-supplement/line-history.json'), 'utf8'))
const oneOffs = Object.entries(ONE_OFF_EXPLAINED).map(([account, o]) => ({ account, year: o.year, amount: o.amount, number: o.number }))
const naming = { plainAccountName, departmentName, FUND_NAMES, isFundWide }
const depts = departmentMeasures(h.accounts, naming, h.actualYears, h.adoptedYears, 35000, oneOffs)
const raw = departmentMeasures(h.accounts, naming, h.actualYears, h.adoptedYears, 35000, [])
const last = Math.max(...h.actualYears)

const spending = h.accounts.filter((l) => /^[A-Z]{1,3}\d{1,2}-\d-\d{4}-/.test(l.account) && !isFundWide(l.account.split('-')[2]))
for (const d of depts) {
  const ls = spending.filter((l) => `${l.fund}-${l.account.split('-')[2]}` === d.key)
  if (ls.length !== d.lines) fail(`${d.key} counts ${d.lines} lines, the history has ${ls.length}`)
  for (const y of h.adoptedYears) {
    const sum = Math.round(ls.reduce((s, l) => s + (l.adopted[y] ?? 0), 0))
    if (sum !== d.adopted[y]) fail(`${d.key} ${y} budget is ${d.adopted[y]}, its lines add up to ${sum}`)
  }
  for (const y of h.actualYears) {
    const off = oneOffs.filter((o) => o.year === y && ls.some((l) => l.account === o.account)).reduce((s, o) => s + o.amount, 0)
    const sum = Math.round(ls.reduce((s, l) => s + (l.actual[y] ?? 0), 0) - off)
    if (sum !== d.actual[y]) fail(`${d.key} ${y} actual is ${d.actual[y]}, its lines less one-offs add up to ${sum}`)
  }
  if (d.name.includes('function')) fail(`${d.key} has no department name`)
  for (const r of d.review) {
    const l = ls.find((x) => x.account === r.account)
    if (!l) { fail(`${r.account} is flagged under ${d.key} but is not one of its lines`); continue }
    const five = h.adoptedYears.filter((y) => h.actualYears.includes(y)).slice(-5).filter((y) => (l.adopted[y] ?? 0) >= 5000)
    const n = five.filter((y) => r.why === 'over' ? l.actual[y] > l.adopted[y] : r.why === 'unused' ? (l.actual[y] ?? 0) === 0 : (l.actual[y] ?? 0) < 0.8 * l.adopted[y]).length
    if (n < (r.why === 'unused' ? 3 : 4)) fail(`${r.account} is flagged "${r.why}" in only ${n} years`)
  }
  const kit = surveyKit(d)
  if (!kit.resident.some((q) => q.text.includes(d.name)) || kit.staff.length < 5) fail(`${d.key}'s survey kit does not name it or is short`)
}
const counted = new Set(depts.map((d) => d.key))
for (const l of spending) {
  const k = `${l.fund}-${l.account.split('-')[2]}`
  const any = (l.actual[last] ?? 0) !== 0 || (l.adopted[Math.max(...h.adoptedYears)] ?? 0) !== 0 || (l.proposed ?? 0) !== 0
  if (any && !counted.has(k)) fail(`${l.account} spends or is budgeted but its department ${k} is missing`)
}
for (const o of oneOffs) {
  const k = `${o.account.split('-')[0]}-${o.account.split('-')[2]}`
  const a = depts.find((d) => d.key === k)
  const b = raw.find((d) => d.key === k)
  if (!a || !b || b.actual[o.year] - a.actual[o.year] !== o.amount) fail(`Resolution ${o.number}'s ${o.amount} is not taken out of ${k} in ${o.year}`)
}

const page = join(root, 'out/department-efficiency/index.html')
if (!existsSync(page)) fail('out/department-efficiency/index.html was not built')
else {
  const html = readFileSync(page, 'utf8')
  if (!html.includes('eff-survey-kit')) fail('the page does not carry the survey kit')
  if (!html.includes(depts[0].name)) fail(`the page does not name ${depts[0].name}`)
  if (!html.includes('2026-640')) fail('the page does not say which one-off it takes out')
}

if (!process.exitCode) console.log(`dept efficiency: ${depts.length} departments, each adding up to its ${spending.length} lines' budgets and spending; ${depts.reduce((s, d) => s + d.review.length, 0)} lines to review, each meeting its rule; ${oneOffs.length} one-off taken out; survey kits for each.`)
