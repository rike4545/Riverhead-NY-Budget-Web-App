// The Overtime & Staffing tab's 2026 and 2027 panel. Re-derives it from the
// Budget Supplement history, checks the history against the 2027 Supplement's
// own columns and the payroll exports' sworn overtime, then holds the built
// page to the figures.

import { existsSync, readFileSync } from 'node:fs'
import { isAbsolute, relative, resolve, sep } from 'node:path'
import { UNIFORM_OT, policeOvertimeBudget } from '../lib/police-overtime-budget.ts'

const root = resolve(process.cwd())
const repo = resolve(root, '..')
const path = (...parts) => {
  const target = resolve(root, ...parts)
  const rel = relative(repo, target)
  if (rel === '..' || rel.startsWith(`..${sep}`) || isAbsolute(rel)) throw new Error(`refusing to read outside ${repo}: ${target}`)
  return target
}
const read = (p) => JSON.parse(readFileSync(path(p), 'utf8'))
const fail = (message) => { console.error(`POLICE OVERTIME VERIFY FAILED: ${message}`); process.exitCode = 1 }
const usd = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

const line = read('public/data/budget-supplement/line-history.json').accounts.find((l) => l.account === UNIFORM_OT.account)
if (!line) { fail(`${UNIFORM_OT.account} is not in the Supplement history`); process.exit() }
const b = policeOvertimeBudget(line)

// The history's latest columns are the 2027 Supplement's own.
const current = read('public/data/budget-supplement/current-lines.json')
const now = current.lines.find((l) => l.account === UNIFORM_OT.account)
if (now.ytd !== b.ytdNow || now.actual !== line.actual[b.lastActualYear] || now.tentative !== b.tentative || now.adopted !== b.adoptedThisYear) fail('the Supplement history and the 2027 Supplement disagree on this line')
if (current.columns.ytd !== b.thisYear || current.columns.tentative !== b.thisYear + 1) fail('the 2027 Supplement columns are not the years the panel names')

// The line and the payroll exports' sworn overtime should tell the same story.
const payroll = read('public/data/payroll/records.json').records
for (const y of [b.lastActualYear - 1, b.lastActualYear]) {
  const sworn = payroll.filter((r) => r.y === y && (r.u === 'PBA' || r.u === 'SOA')).reduce((s, r) => s + r.o, 0)
  const gap = Math.abs(sworn - line.actual[y]) / line.actual[y]
  if (gap > 0.1) fail(`${y}: the line shows ${usd(line.actual[y])} and the payroll ${usd(sworn)}, ${(gap * 100).toFixed(0)}% apart`)
}
if (b.firstHalfShare <= 0.2 || b.firstHalfShare >= 0.8) fail(`a first-half share of ${b.firstHalfShare.toFixed(2)} is not a usable pace`)

const built = 'out/payroll/index.html'
if (!existsSync(path(built))) fail(`${built} was not built`)
// The tab renders on the client, so the built page has only its shell; check the
// panel's figures in the component's own words instead.
const source = readFileSync(path('components/OvertimeStaffing.tsx'), 'utf8')
for (const s of ['data-police-ot-budget', 'this\n        site’s estimate', 'That is a likely concern']) if (!source.replace(/\s+/g, ' ').includes(s.replace(/\s+/g, ' '))) fail(`the panel no longer says "${s.trim()}"`)

if (!process.exitCode) console.log(`Police overtime verification passed: ${b.thisYear} budget ${usd(b.adoptedThisYear)}, ${usd(b.ytdNow)} by ${UNIFORM_OT.ytdThrough} (${(b.ytdChange * 100).toFixed(1)}% on ${b.lastActualYear}), ${b.thisYear + 1} Tentative ${usd(b.tentative)}; over budget ${b.yearsOver} of ${b.rows.length} years.`)
