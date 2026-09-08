import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const read = (p) => readFileSync(join(root, p), 'utf8')
const fail = (m) => { console.error(`VERIFY FAILED: ${m}`); process.exitCode = 1 }

const component = read('components/BudgetProcessMeetingForecast.tsx')
const html = read('out/meetings/index.html')
const schedule = JSON.parse(read('out/data/meetings/upcoming.json'))

for (const text of [
  '2027 budget process · forecast',
  'Which Town Board meetings are likely to carry the budget?',
  'on or before October 5',
  'Preliminary-budget public hearing',
  'Final 2027 budget adoption',
  'A prediction becomes an actual item only when the Town publishes it',
]) {
  if (!component.includes(text) && !html.includes(text)) fail(`Budget-process forecast regressed: missing ${text}`)
}

const official = new Set(schedule.officialScheduleDates ?? [])
for (const date of ['2026-10-06', '2026-10-20', '2026-11-05', '2026-11-17']) {
  if (!official.has(date)) fail(`Budget forecast is aligned to a date not present in the official Riverhead schedule: ${date}`)
  if (!component.includes(`date: '${date}'`)) fail(`Budget forecast lost expected meeting alignment: ${date}`)
}

for (const law of ['TWN/104', 'TWN/106', 'TWN/108', 'TWN/109']) {
  if (!component.includes(law)) fail(`Budget forecast lost statutory source: ${law}`)
}

if (!component.includes('publishedBudgetItem')) fail('Budget forecast no longer upgrades itself from prediction to published item')
if (!component.includes('PUBLISHED BUDGET ITEM')) fail('Budget forecast lost published-item state')
if (!component.includes('FORECAST')) fail('Budget forecast lost explicit prediction labeling')

// The forecast must remain analytical metadata, never injected into the official
// docket/hearing arrays. Those arrays continue to come only from the meeting ETL.
if (component.includes('.docket.push(') || component.includes('.hearings.push(')) {
  fail('Budget forecast is mutating official meeting items')
}

if (process.exitCode) process.exit(process.exitCode)
console.log('Budget-process meeting forecast verification passed.')
