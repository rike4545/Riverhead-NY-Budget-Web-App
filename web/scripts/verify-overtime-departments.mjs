// The Overtime & Staffing tab's "Overtime by department" table and the Police
// Athletic League's uniform note (/funds/A04/#pal-uniforms).
// - every overtime line in the 2027 Supplement (object code 111) is in the
//   table, and the Supplement history agrees with the 2027 Supplement's own
//   columns for each;
// - the totals add up from the rows;
// - every department name is a plain label, not a raw account name;
// - the built pages show the rows and the figures lib/overtime-by-department.ts computes.
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { overtimeByDepartment, isOvertime, PAL_UNIFORMS, palUniforms } from '../lib/overtime-by-department.ts'

const root = process.cwd()
const fail = (m) => { console.error(`OVERTIME BY DEPARTMENT VERIFY FAILED: ${m}`); process.exitCode = 1 }
const read = (p) => JSON.parse(readFileSync(join(root, p), 'utf8'))
const usd = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
const text = (p) => readFileSync(p, 'utf8').replace(/<[^>]+>/g, ' ').replace(/&#x27;|&#39;/g, "'").replace(/&amp;/g, '&').replace(/\s+/g, ' ')

const history = read('public/data/budget-supplement/line-history.json').accounts
const current = read('public/data/budget-supplement/current-lines.json').lines
const d = overtimeByDepartment(history)

for (const r of d.rows) {
  const now = current.find((c) => c.account === r.account)
  if (!now) { fail(`${r.account} is not in the 2027 Supplement`); continue }
  if (now.actual !== r.spentLast || now.adopted !== r.budgetNow || now.ytd !== r.ytdNow || now.preliminary !== r.proposed) fail(`${r.account}: the Supplement history and the 2027 Supplement disagree`)
  if (/ - |Personal Services|Pers Svcs|\bOT\b/.test(r.department)) fail(`${r.account} has no plain department name ("${r.department}")`)
}
const listed = new Set(d.rows.map((r) => r.account))
for (const c of current) {
  if (isOvertime(c.account) && (c.actual || c.adopted || c.ytd || c.preliminary) && !listed.has(c.account)) fail(`overtime line ${c.account} is missing from the table`)
}
const rest = d.rows.filter((r) => r.account !== 'A01-3-3120-111-UNI-00000')
const add = (k) => rest.reduce((s, r) => s + r[k], 0)
if (add('spentLast') !== d.restSpentLast || add('budgetLast') !== d.restBudgetLast || add('proposed') !== d.restProposed) fail('the totals do not add up from the rows')

const payroll = join(root, 'out/payroll/index.html')
if (!existsSync(payroll)) fail('out/payroll/index.html was not built')
else {
  // The tab renders in the browser, so the static HTML carries its data as the
  // serialized props rather than as table markup: check those.
  const raw = readFileSync(payroll, 'utf8').replace(/\\"/g, '"')
  const prop = (k) => Number(raw.match(new RegExp(`"${k}":([0-9.]+)`))?.[1])
  for (const k of ['restSpentLast', 'restBudgetLast', 'restYtdNow', 'restProposed']) {
    if (Math.round(prop(k)) !== Math.round(d[k])) fail(`the payroll page carries ${k} ${prop(k)}, the Supplement gives ${d[k]}`)
  }
  for (const r of d.rows) if (!raw.includes(`"account":"${r.account}"`)) fail(`the payroll page's table data has no row for ${r.account}`)
  if (!readFileSync(join(root, 'components/OvertimeStaffing.tsx'), 'utf8').includes('<DepartmentOvertimePanel d={p.departments} />')) fail('the Overtime & Staffing tab does not render the table')
}

const pal = history.find((l) => l.account === PAL_UNIFORMS)
if (!pal) fail(`${PAL_UNIFORMS} is not in the Supplement history`)
else {
  const u = palUniforms(pal)
  const page = join(root, 'out/funds/A04/index.html')
  if (!existsSync(page)) fail('out/funds/A04/index.html was not built')
  else {
    const raw = readFileSync(page, 'utf8')
    const html = text(page)
    if (!raw.includes('data-pal-uniforms')) fail('the PAL fund page has no uniform note')
    for (const r of u.rows) if (!raw.includes(`data-pal-row="${r.year}"`) || !html.includes(usd(r.spent))) fail(`the PAL uniform table is missing ${r.year}`)
    for (const n of [u.ytdNow, u.budgetNow, u.proposed]) if (!html.includes(usd(n))) fail(`the PAL fund page does not show ${usd(n)}`)
    if (!html.includes(`${u.yearsOver} of the last ${u.rows.length} years`)) fail('the PAL note miscounts the years over budget')
  }
}

if (!process.exitCode) {
  console.log(`overtime by department: ${d.rows.length} lines; ${d.unchangedLines} of ${d.budgetedLines} budgeted lines unchanged in ${d.thisYear + 1}; without sworn police ${usd(d.restSpentLast)} spent of ${usd(d.restBudgetLast)} in ${d.lastActual}; ${d.spentByJune.length} lines past their full-year budget by June 30. PAL uniforms checked.`)
}
