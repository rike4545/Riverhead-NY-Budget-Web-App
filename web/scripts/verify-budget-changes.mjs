// /budget-changes/ is a live dashboard of the budget changes the Town Board has
// passed, built from each meeting's fiscal companion with
// lib/budget-change-rules.ts and published as /data/budget-changes.json, which
// the page re-reads while it is open. This holds the published file to the
// records it is built from:
//   - it reports one year, and counts only meetings held in it;
//   - it lists exactly the adopted resolutions the rules call budget changes,
//     and reads each one's account table the way the rules do;
//   - its totals by source add up from its own entries;
//   - its savings are the figures /fund-balance-draws/ states, and every draw
//     that page counts belongs to a change listed here;
//   - it carries the site's data version, which the page's live check compares;
//   - the built page shows the total and the latest meeting.

import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { NEW_MONEY, budgetChangeReason, readTable } from '../lib/budget-change-rules.ts'

const root = process.cwd()
const path = (...parts) => join(root, ...parts)
const read = (p) => JSON.parse(readFileSync(path(p), 'utf8'))
const fail = (message) => { console.error(`BUDGET CHANGES VERIFY FAILED: ${message}`); process.exitCode = 1 }
const dollars = (n) => `$${Math.round(n).toLocaleString('en-US')}`
const close = (a, b) => Math.abs(a - b) < 0.5

const file = path('out/data/budget-changes.json')
if (!existsSync(file)) { fail('out/data/budget-changes.json was not built'); process.exit() }
const out = JSON.parse(readFileSync(file, 'utf8'))

// ── One year ─────────────────────────────────────────────────────────────────
const year = out.year
if (!Number.isInteger(year)) fail(`the dashboard names no year it reports (year is ${JSON.stringify(year)})`)
if (!String(out.adopted?.title ?? '').includes(String(year))) fail(`the dashboard reports ${year} but compares against "${out.adopted?.title}"`)
const indexed = read('public/data/meetings/fiscal-index.json').meetings.slice().sort()
  .map((slug) => read(`public/data/meetings/${slug}-fiscal.json`))
const inYear = indexed.filter((m) => m.meetingDate.startsWith(`${year}-`))
const later = indexed.filter((m) => m.meetingDate > `${year}-12-31`).length
if (out.laterMeetings !== later) fail(`laterMeetings is ${out.laterMeetings}; the records hold ${later} meetings after ${year}`)
for (const p of out.byMeeting) if (!p.date.startsWith(`${year}-`)) fail(`the meeting series includes ${p.date}, outside ${year}`)
if (out.counts.meetings !== inYear.length) fail(`counts.meetings is ${out.counts.meetings}; ${inYear.length} meetings were held in ${year}`)

// ── The same changes, read the same way ──────────────────────────────────────
const expected = new Map()
for (const m of inYear) {
  for (const r of m.resolutions) {
    if (r.vote?.adopted !== true) continue
    const accounts = r.funding?.accounts ?? []
    const reason = budgetChangeReason(r.title, accounts, r.funding?.drawsFundBalance === true)
    if (reason) expected.set(`${m.slug}:${r.number ?? r.title}`, { reason, table: readTable(accounts) })
  }
}
const published = new Map(out.changes.map((c) => [`${c.meetingSlug}:${c.number ?? c.title}`, c]))
for (const k of expected.keys()) if (!published.has(k)) fail(`${k} is a budget change by the rules but is not on the dashboard`)
for (const k of published.keys()) if (!expected.has(k)) fail(`${k} is on the dashboard but is not a budget change by the rules`)
for (const [k, e] of expected) {
  const c = published.get(k)
  if (!c) continue
  if (c.reason !== e.reason) fail(`${k}: counted for "${c.reason}", the rules say "${e.reason}"`)
  if ((c.notTotalled === null) !== e.table.plain) fail(`${k}: ${e.table.plain ? 'reads plainly but is left out of the totals' : 'is totalled though its table does not read plainly'}`)
  if (e.table.plain) {
    const want = e.table.sources.filter((s) => s.source !== 'savings').reduce((s, l) => s + l.amount, 0)
    const got = c.sources.reduce((s, l) => s + l.amount, 0)
    if (!close(want, got)) fail(`${k}: its table's sources other than savings come to ${dollars(want)}, the dashboard has ${dollars(got)}`)
  }
}
if (out.counts.changes !== expected.size) fail(`counts.changes is ${out.counts.changes}; there are ${expected.size}`)

// ── Totals from the entries ──────────────────────────────────────────────────
for (const source of [...NEW_MONEY, 'moved']) {
  const sum = out.changes.reduce((s, c) => s + (source === 'savings'
    ? c.savings.reduce((t, d) => t + (d.amount ?? 0), 0)
    : c.sources.filter((l) => l.source === source).reduce((t, l) => t + l.amount, 0)), 0)
  if (!close(sum, out.totals[source])) fail(`totals.${source} is ${dollars(out.totals[source])}; the entries add up to ${dollars(sum)}`)
  const byMeeting = out.byMeeting.reduce((s, p) => s + p.bySource[source], 0)
  if (!close(byMeeting, out.totals[source])) fail(`the meeting series for ${source} adds up to ${dollars(byMeeting)}, not ${dollars(out.totals[source])}`)
}
if (!close(out.added, NEW_MONEY.reduce((s, k) => s + out.totals[k], 0))) fail('added is not the sum of the four kinds of new money')

// ── Savings as /fund-balance-draws/ states them ──────────────────────────────
if (out.savingsNotListed.length) fail(`draws counted on /fund-balance-draws/ but not listed here: ${out.savingsNotListed.join(', ')}`)
const surplus = path('out/fund-balance-draws/index.html')
if (!existsSync(surplus)) fail('/fund-balance-draws/ was not built')
else {
  const text = readFileSync(surplus, 'utf8').replace(/<!-- -->/g, '')
  for (const [what, n] of [['the General Fund', out.savingsGeneralFund], ['the other funds', out.totals.savings - out.savingsGeneralFund]]) {
    if (!text.includes(dollars(n))) fail(`the dashboard's savings from ${what}, ${dollars(n)}, is not the figure /fund-balance-draws/ states${later ? `. The records hold ${later} meetings after ${year}: when the year turns, COMMITMENT_YEAR in lib/fiscal-commitments-2027.ts moves both pages together` : ''}`)
  }
}

// ── Live ─────────────────────────────────────────────────────────────────────
const meta = read('public/data/meta.json')
if (out.dataVersion !== meta.dataVersion) fail(`the dashboard was built from data version ${out.dataVersion}; meta.json says ${meta.dataVersion}, so the page would refetch forever`)
const newest = inYear.length ? inYear[inYear.length - 1].meetingDate : null
if (out.latestMeeting !== newest) fail(`latestMeeting is ${out.latestMeeting}; the newest ${year} meeting on file is ${newest}`)

// ── The page ─────────────────────────────────────────────────────────────────
const page = path('out/budget-changes/index.html')
if (!existsSync(page)) fail('/budget-changes/ was not built')
else {
  const text = readFileSync(page, 'utf8').replace(/<!-- -->/g, '').replace(/<[^>]+>/g, ' ').replace(/&#x27;|&#39;/g, "'").replace(/&amp;/g, '&').replace(/\s+/g, ' ')
  const latest = new Date(`${out.latestMeeting}T12:00:00Z`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
  for (const want of [dollars(out.added), latest, 'Live']) if (!text.includes(want)) fail(`/budget-changes/ does not show "${want}"`)
}

if (!process.exitCode) {
  console.log(`budget changes: ${year}, ${out.counts.changes} adopted changes at ${out.counts.meetingsWithChanges} of ${out.counts.meetings} meetings read by the rules${later ? ` (${later} later meeting${later === 1 ? "" : "s"} left out)` : ''} (${out.counts.notTotalled} listed without a total); ${dollars(out.added)} added by vote, savings matching /fund-balance-draws/; built from data version ${out.dataVersion}`)
}
