// /workforce-by-title/ counts the Town's staff three ways: an organization
// chart, a table by job title and a table by department. This holds them to the
// payroll they are built from.
//
// The two tables list only the years the Town's own export reports a title or a
// department. Every earlier value in this dataset was carried back from a later
// year (etl/parse_payroll.py, carry_forward_static_fields), and counting those
// years once published a 2018 roster of only the people still employed in 2022,
// with a "change since 2018" built on it.
//
// The organization chart (lib/org-chart.ts) places the payroll's department
// codes into the Town's offices and departments by hand, so a code the Town
// renames or adds in a new year's payroll must fail the build instead of quietly
// dropping people from the chart:
//   - every payroll department with staff in the latest year sits in exactly
//     one unit, and every code the chart names is one the payroll has;
//   - each head the chart names starts a title its own unit's payroll paid,
//     so "Supervisor" is not satisfied by a Deputy Supervisor;
//   - the chart's people add up to the payroll's departments and to the
//     distinct people paid that year, each listed once, as the page says;
//   - the built page shows the chart and its total.

import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { ALL_UNITS, fill } from '../lib/org-chart.ts'

const root = process.cwd()
const path = (...parts) => join(root, ...parts)
const fail = (message) => { console.error(`WORKFORCE VERIFY FAILED: ${message}`); process.exitCode = 1 }

const data = JSON.parse(readFileSync(path('public/data/payroll/titles-by-year.json'), 'utf8'))
const records = JSON.parse(readFileSync(path('public/data/payroll/records.json'), 'utf8')).records

// ── Only the years the Town reports ───────────────────────────────────────────
// A record's "i" lists the fields carried in from another year: t for title,
// d for department.
const reportedYears = (field, code) => Array.from(new Set(records.filter((r) => r[field] && !(r.i ?? '').includes(code)).map((r) => r.y))).sort((a, b) => a - b)
const same = (a, b) => a.length === b.length && a.every((v, i) => v === b[i])
const titleYears = reportedYears('t', 't')
const departmentYears = reportedYears('d', 'd')
if (!same(data.years, titleYears)) fail(`The title table covers ${data.years.join(', ')}; the Town reports titles in ${titleYears.join(', ')}`)
if (!same(data.departmentYears, departmentYears)) fail(`The department table covers ${data.departmentYears.join(', ')}; the Town reports departments in ${departmentYears.join(', ')}`)
for (const t of data.titles) {
  if (!same(Object.keys(t.counts).map(Number), data.years)) fail(`${t.title} has counts for ${Object.keys(t.counts).join(', ')}, not the table's years`)
}

const YEAR = data.departmentYears[data.departmentYears.length - 1]
const y = String(YEAR)

// ── Every payroll department placed exactly once ──────────────────────────────
const known = new Set(data.departments.map((d) => d.department))
const placed = new Map()
for (const unit of ALL_UNITS) {
  for (const code of unit.payroll) {
    if (!known.has(code)) fail(`${unit.name} names the payroll department "${code}", which the payroll does not have`)
    if (placed.has(code)) fail(`"${code}" is placed under both ${placed.get(code)} and ${unit.name}`)
    placed.set(code, unit.name)
  }
}
const staffed = data.departments.filter((d) => (d.counts[y] ?? 0) > 0)
for (const d of staffed) {
  if (!placed.has(d.department)) fail(`The payroll department "${d.department}" paid ${d.counts[y]} people in ${YEAR} but is not on the chart`)
}

// ── Heads and counts ──────────────────────────────────────────────────────────
const filled = ALL_UNITS.map((u) => fill(u, data.departments, YEAR))
for (const u of filled) {
  if (u.head && !u.titles.some((t) => t.title.toLowerCase().startsWith(u.head.toLowerCase()))) {
    fail(`${u.name} is shown as headed by "${u.head}", but its payroll paid no such title in ${YEAR}`)
  }
  if (u.payroll.length > 0 && u.people === 0) fail(`${u.name} names payroll departments that paid nobody in ${YEAR}`)
  if (u.payroll.length === 0 && !u.note) fail(`${u.name} has no payroll department, so it needs a note saying why`)
  const titled = u.titles.reduce((s, t) => s + t.people, 0)
  if (titled + u.untitled !== u.people) fail(`${u.name}'s titles add up to ${titled} plus ${u.untitled} untitled, not its ${u.people} people`)
}
const chartPeople = filled.reduce((s, u) => s + u.people, 0)
const payrollPeople = staffed.reduce((s, d) => s + d.counts[y], 0)
if (chartPeople !== payrollPeople) fail(`The chart counts ${chartPeople} people in ${YEAR}; the payroll's departments count ${payrollPeople}`)
const paid = records.filter((r) => r.y === YEAR)
const names = new Set(paid.map((r) => r.n))
if (names.size !== paid.length) fail(`The ${YEAR} payroll lists ${paid.length - names.size} people more than once, but the page says each person is listed once`)
if (chartPeople !== names.size) fail(`The chart counts ${chartPeople} people in ${YEAR}; the payroll paid ${names.size} distinct people`)

// ── The page shows it ─────────────────────────────────────────────────────────
const file = path('out/workforce-by-title/index.html')
if (!existsSync(file)) fail('/workforce-by-title/ was not built')
else {
  const text = readFileSync(file, 'utf8').replace(/<!-- -->/g, '').replace(/<[^>]+>/g, ' ').replace(/&#x27;|&#39;/g, "'").replace(/&amp;/g, '&').replace(/\s+/g, ' ')
  for (const want of ['How the Town is organized', `${chartPeople.toLocaleString('en-US')} people`, ...filled.map((u) => u.name)]) {
    if (!text.includes(want)) fail(`/workforce-by-title/ does not show "${want}"`)
  }
  const first = data.years[0]
  if (!text.includes(`${first}→${data.years[data.years.length - 1]}`)) fail(`/workforce-by-title/ does not show the title table's ${first} start`)
}

if (!process.exitCode) {
  console.log(`workforce: titles and departments cover ${data.years[0]}–${YEAR}, the years the Town reports them; ${placed.size} payroll departments placed in ${ALL_UNITS.length} offices and departments, ${chartPeople} people in ${YEAR}, matching the payroll`)
}
