// /campaign-finance/ shows each committee's 2026 General Election reports (the
// 32-Day and 11-Day Pre-General and the 27-Day Post-General) from the stored
// copy etl/build_campaign_reports.py writes. This checks that copy and the
// built page:
//   - the file names the November 3, 2026 election and the three reports, and
//     covers every committee on the page;
//   - each row is one committee, report and schedule;
//   - the page shows each report, the 11-Day report's other filing name, and,
//     for every committee with itemized activity, its committee name and its
//     contributions (Schedules A to C) and spending (Schedule F), worked out
//     here from the rows independently of the page's own code.
// Transactions dated after a report's period are reported as warnings: they are
// the State's data, not this site's, and must not stop a deploy.

import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const fail = (message) => { console.error(`CAMPAIGN REPORTS VERIFY FAILED: ${message}`); process.exitCode = 1 }
const read = (p) => JSON.parse(readFileSync(join(process.cwd(), p), 'utf8'))

const store = read('public/data/campaign-finance-2026-general.json')
const officials = read('public/data/campaign-finance.json').officials

const REPORTS = { '32-Day Pre-General': '2026-09-28', '11-Day Pre-General': '2026-10-19', '27-Day Post-General': '2026-11-26' }
if (store.election?.date !== '2026-11-03' || store.election?.electionYear !== '2026') fail('the stored file does not name the November 3, 2026 General Election')
if (JSON.stringify(store.reports) !== JSON.stringify(Object.keys(REPORTS))) fail(`the stored reports are ${JSON.stringify(store.reports)}`)
if (!/^\d{4}-\d{2}-\d{2}$/.test(store.fetchedOn ?? '')) fail('the stored file has no fetchedOn date')

const ids = [...new Set(officials.flatMap((o) => o.filerIDs.map((f) => f.filerID)))].sort((a, b) => a - b)
if (JSON.stringify(ids) !== JSON.stringify(store.filerIDs)) fail('the stored file does not cover the same committees as campaign-finance.json')

const seen = new Set()
for (const r of store.rows) {
  const key = `${r.filerID}|${r.report}|${r.schedule}|${r.amended}`
  if (seen.has(key)) fail(`duplicate row ${key}`)
  seen.add(key)
  if (!(r.report in REPORTS)) fail(`row for an unknown report ${r.report}`)
  if (!ids.includes(r.filerID)) fail(`row for a committee not on the page, ${r.filerID}`)
  if (!(typeof r.amount === 'number' && Number.isFinite(r.amount)) || !(r.rows > 0)) fail(`bad amount or count in ${key}`)
  if (r.schedule !== 'N' && r.lastDate && r.lastDate > REPORTS[r.report]) {
    console.warn(`campaign reports: ${key} has a transaction dated ${r.lastDate}, after the report's period ends ${REPORTS[r.report]}`)
  }
}

const usd = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
const committee = Object.fromEntries(officials.flatMap((o) => o.filerIDs.map((f) => [f.filerID, f.committeeName])))
const sum = (rows, schedules) => Math.round(rows.filter((r) => schedules.includes(r.schedule)).reduce((s, r) => s + r.amount, 0) * 100) / 100

const built = join(process.cwd(), 'out', 'campaign-finance', 'index.html')
let checked = 0
if (!existsSync(built)) fail('out/campaign-finance/index.html is missing; run the build first')
else {
  const html = readFileSync(built, 'utf8').replace(/<!-- -->/g, '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#x27;/g, "'")
  for (const text of ['2026 General Election reports (November 3, 2026)', '2026 General 11/03/2026 11-Day', 'Election Law §14-108', ...Object.keys(REPORTS).map((r) => `${r} report`)]) {
    if (!html.includes(text)) fail(`the built page is missing “${text}”`)
  }
  for (const report of Object.keys(REPORTS)) {
    const start = html.indexOf(`${report} report`)
    const next = Object.keys(REPORTS).map((r) => html.indexOf(`${r} report`)).filter((i) => i > start).sort((a, b) => a - b)[0] ?? html.indexOf('Contributions are Schedules A to C')
    const section = html.slice(start, next)
    for (const filer of [...new Set(store.rows.filter((r) => r.report === report).map((r) => r.filerID))]) {
      const rows = store.rows.filter((r) => r.report === report && r.filerID === filer)
      const row = section.slice(section.indexOf(committee[filer]))
      if (!section.includes(committee[filer])) { fail(`the ${report} table has no row for ${committee[filer]}`); continue }
      const cells = row.slice(0, row.indexOf('</tr>'))
      for (const [what, schedules] of [['contributions', ['A', 'B', 'C']], ['spending', ['F']]]) {
        if (!cells.includes(usd(sum(rows, schedules)))) fail(`the ${report} row for ${committee[filer]} does not show ${what} of ${usd(sum(rows, schedules))}`)
      }
      checked += 1
    }
  }
}

if (!process.exitCode) {
  const eleven = new Set(store.rows.filter((r) => r.report === '11-Day Pre-General').map((r) => r.filerID)).size
  console.log(`campaign reports: ${store.rows.length} rows from data.ny.gov (${store.fetchedOn}); ${checked} committee reports on the page, ${eleven} in the 11-Day Pre-General`)
}
