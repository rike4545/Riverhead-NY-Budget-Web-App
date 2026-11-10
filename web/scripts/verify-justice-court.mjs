// Checks /justice-court/ and its hand-curated data (public/data/justice-court.json):
// - each Town quote appears, word for word, in the minutes or vote packet the
//   repository keeps (etl/data/meetings/), allowing for line breaks;
// - the bond amount and the air-conditioning amount match their quotes;
// - the data carries no tax-map numbers and no email addresses;
// - every source link is the Town's portal, a State agency or law page, a news
//   outlet the page labels, or a page on this site;
// - the project steps are consistent, and the built page shows them and each
//   grant program.
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const fail = (m) => { console.error(`JUSTICE COURT VERIFY FAILED: ${m}`); process.exitCode = 1 }
const norm = (s) => s.replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, ' ').trim()
const joinHyphens = (s) => s.replace(/ ?- (?=[a-z])/g, '-').replace(/ -(?=[a-z])/g, '-')
const raw = readFileSync(join(root, 'public/data/justice-court.json'), 'utf8')
const data = JSON.parse(raw)
const meetings = join(root, '..', 'etl', 'data', 'meetings')
const text = (f) => {
  const p = join(meetings, f)
  if (!existsSync(p)) { fail(`etl/data/meetings/${f} is missing`); return '' }
  return joinHyphens(norm(readFileSync(p, 'utf8')))
}

for (const q of data.quotes) if (!text(q.file).includes(joinHyphens(norm(q.text)))) fail(`quote "${q.id}" (Resolution ${q.resolution}) is not in ${q.file}`)
const q = (id) => data.quotes.find((x) => x.id === id)?.text ?? ''
if (!q('bondtitle').includes(`$${data.bond.amount.toLocaleString('en-US')}`)) fail('the bond amount does not match the bond resolution title')
if (!q('acamount').includes(`$${data.meanwhile.amount.toLocaleString('en-US')}.00`)) fail('the air-conditioning amount does not match Resolution 2026-814')

// Riverhead's tax-map numbers are in district 600 ("600-108-2-3", "0600-108.00-2.00-005.000").
if (/SCTM|\b0?600-\d{3}(\.\d+)?-\d/.test(raw)) fail('justice-court.json contains a tax-map number')
if (/[\w.+-]+@[\w-]+\.[\w.]+/.test(raw)) fail('justice-court.json contains an email address')

const allowed = [/^https:\/\/riverheadny\.portal\.civicclerk\.com\//, /^https:\/\/www\.nysenate\.gov\/legislation\//, /^https:\/\/criminaljustice\.ny\.gov\//, /^https:\/\/www\.dasny\.org\//, /^https:\/\/riverheadlocal\.com\//, /^\/[a-z0-9-]+\//]
const sources = [...data.condition.map((c) => c.source), ...data.timeline.map((t) => t.source), ...data.grants.flatMap((g) => g.sources)]
for (const s of sources) {
  if (!allowed.some((r) => r.test(s.url))) fail(`unexpected source link ${s.url}`)
  if (/riverheadlocal\.com/.test(s.url) && s.kind !== 'news') fail(`${s.url} is a news report but is not labelled news`)
}
for (const u of [data.bond.url, data.meanwhile.url]) if (!allowed[0].test(u)) fail(`the Town record link ${u} is not the Town's portal`)

const firstOpen = data.steps.findIndex((s) => !s.done)
for (const s of data.steps) if (s.done !== (s.date !== null)) fail(`step "${s.step}" is ${s.done ? 'done without a date' : 'dated but not done'}`)
if (firstOpen >= 0 && data.steps.slice(firstOpen).some((s) => s.done)) fail('a later step is done while an earlier one is not')

const page = join(root, 'out/justice-court/index.html')
if (!existsSync(page)) fail('out/justice-court/index.html was not built')
else {
  const html = norm(readFileSync(page, 'utf8').replace(/<[^>]+>/g, ' ').replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&'))
  for (const s of data.steps) if (!html.includes(s.step)) fail(`the page does not show the step "${s.step}"`)
  for (const g of data.grants) if (!html.includes(g.name)) fail(`the page does not show the grant program "${g.name}"`)
  if (!html.includes('$6,500,000')) fail('the page does not state the $6,500,000 authorization')
}

if (!process.exitCode) console.log(`justice court: ${data.quotes.length} Town quotes found in the minutes and packets, ${data.steps.filter((s) => s.done).length} of ${data.steps.length} steps done, ${data.grants.length} grant programs, ${data.timeline.length} dated events.`)
