// The quality inputs on /department-efficiency/ (lib/quality-inputs.ts).
// - cost per unit, survey averages, shares and margins of error, and
//   service-standard results come out right on worked examples;
// - the site suggests no service targets of its own: suggestions are names
//   only, and a standard with no department target gets a rate but no verdict;
// - the staff survey asks whether the department has a strategic plan;
// - the built page carries the inputs.
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { costPerUnit, marginOfError, tallyResult, standardResult, qualityCsv, SUGGESTED_STANDARDS } from '../lib/quality-inputs.ts'
import { surveyKit } from '../lib/dept-efficiency.ts'

const fail = (m) => { console.error(`QUALITY INPUTS VERIFY FAILED: ${m}`); process.exitCode = 1 }
const near = (a, b, tol = 0.01) => Math.abs(a - b) <= tol

const c = costPerUnit({ 2020: 1000, 2021: 1210, 2022: 999 }, { id: 'm', name: 'Permits', unit: 'permits', values: { 2020: 10, 2021: 11, 2022: null } })
if (c.rows.length !== 2 || !near(c.rows[0].cost, 100) || !near(c.rows[1].cost, 110) || !near(c.change, 10) || !near(c.perYear, 10)) fail(`cost per unit is wrong: ${JSON.stringify(c)}`)

if (!near(marginOfError(0.5, 100), 9.8)) fail(`margin of error at p=0.5, n=100 is ${marginOfError(0.5, 100)}, not 9.8`)
if (!near(marginOfError(0.5, 100, 200), 9.8 * Math.sqrt(100 / 199))) fail('the finite-population correction is wrong')
const scale = tallyResult({ question: 'q', kind: 'scale', answers: ['1', '2', '3', 'Satisfied', 'Very satisfied'], counts: [10, 0, 10, 20, 20] })
if (scale.n !== 60 || !near(scale.mean, (10 * 1 + 10 * 3 + 20 * 4 + 20 * 5) / 60) || !near(scale.share, 66.667, 0.01) || scale.tooFew) fail(`scale tally is wrong: ${JSON.stringify(scale)}`)
const yn = tallyResult({ question: 'q', kind: 'yesno', answers: ['Yes', 'No', 'Not sure'], counts: [15, 5, 0] })
if (!near(yn.share, 75) || !yn.tooFew) fail(`yes/no tally is wrong: ${JSON.stringify(yn)}`)

const base = { id: 's', name: 'Permits issued on time', promise: 'within the department’s stated days', source: 'Building Department page', met: 45, total: 50 }
const r1 = standardResult({ ...base, target: 90 })
if (!near(r1.rate, 90) || r1.met !== true) fail('a standard met exactly at its target is not "met"')
if (standardResult({ ...base, target: 95 }).met !== false) fail('a standard short of its target is not "not met"')
const r0 = standardResult({ ...base, target: null })
if (!near(r0.rate, 90) || r0.met !== null) fail('a standard with no department target should report the rate and no verdict')
if (standardResult({ ...base, target: 90, met: 60 }).rate !== null) fail('more cases meeting a standard than the total is accepted')

for (const names of Object.values(SUGGESTED_STANDARDS)) for (const n of names) if (typeof n !== 'string' || /\d/.test(n)) fail(`suggested standard "${JSON.stringify(n)}" carries a target; targets must come from the department`)

const csv = qualityCsv('Town Clerk', { 2020: 1000 }, [], [], null, [{ ...base, name: 'A, B', target: null }], { status: 'no', title: '', adopted: '', link: '', mission: '', goals: '' })
if (!csv.includes('"A, B"') || !csv.includes('No target entered') || !csv.includes('Strategic plan or mission statement,No')) fail('the spreadsheet does not quote commas, report a missing target or carry the plan answer')

const staff = surveyKit({ name: 'Town Clerk', group: '1', fn: '1410' }).staff
if (!staff.some((q) => /strategic plan or mission statement/i.test(q.text))) fail('the staff survey does not ask about a strategic plan')

const page = join(process.cwd(), 'out/department-efficiency/index.html')
if (!existsSync(page)) fail('out/department-efficiency/index.html was not built')
else {
  const html = readFileSync(page, 'utf8')
  for (const k of ['data-eff-quality', 'Strategic plan or mission statement', 'This site suggests no targets']) if (!html.includes(k)) fail(`the page lacks "${k}"`)
}

if (!process.exitCode) console.log('quality inputs: cost per unit, survey shares and margins, and standards check out on worked examples; no target is suggested by the site; the strategic-plan question is asked.')
