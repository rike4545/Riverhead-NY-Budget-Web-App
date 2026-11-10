// Checks /armory/ and its hand-curated data (public/data/armory.json):
// - each Town quote appears, word for word, in the minutes or vote packet the
//   repository keeps (etl/data/meetings/), allowing for line breaks;
// - the 2022 date the page reports as a discrepancy really is in those records;
// - the data carries no tax-map numbers and no email addresses;
// - every source link is the Town's portal, the Legislature, a named news
//   outlet or a page on this site;
// - the bill's steps are consistent, and the built page shows them.
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const fail = (m) => { console.error(`ARMORY VERIFY FAILED: ${m}`); process.exitCode = 1 }
const norm = (s) => s.replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, ' ').trim()
const raw = readFileSync(join(root, 'public/data/armory.json'), 'utf8')
const data = JSON.parse(raw)
const meetings = join(root, '..', 'etl', 'data', 'meetings')
const text = (f) => {
  const p = join(meetings, f)
  if (!existsSync(p)) { fail(`etl/data/meetings/${f} is missing`); return '' }
  return norm(readFileSync(p, 'utf8'))
}

for (const q of data.quotes) if (!text(q.file).includes(norm(q.text))) fail(`quote "${q.id}" (Resolution ${q.resolution}) is not in ${q.file}`)

const wrongYear = 'signed into law by the Governor on August 31, 2022'
for (const f of ['2025-05-21-minutes.txt', '2025-06-17-minutes.txt']) if (!text(f).includes(wrongYear)) fail(`${f} no longer says "${wrongYear}"; recheck the discrepancy the page reports`)
if (!data.discrepancies.some((d) => d.includes('August 31, 2022')) || data.law2011.signed !== '2011-08-31') fail('the signing-date discrepancy or the 2011 signing date is missing')

if (/SCTM|\d{3,4}-\d{3}(\.\d+)?-\d/.test(raw)) fail('armory.json contains a tax-map number')
if (/[\w.+-]+@[\w-]+\.[\w.]+/.test(raw)) fail('armory.json contains an email address')

const allowed = [/^https:\/\/riverheadny\.portal\.civicclerk\.com\//, /^https:\/\/nyassembly\.gov\/leg\//, /^https:\/\/www\.nysenate\.gov\/legislation\//, /^https:\/\/riverheadlocal\.com\//, /^https:\/\/riverheadnewsreview\.timesreview\.com\//, /^\/[a-z0-9-]+\//]
const urls = [data.law2011.url, data.bill2026.url, data.bill2026.senateUrl, data.loi.url, ...data.timeline.map((t) => t.source.url), ...data.news.map((n) => n.url)]
for (const u of urls) if (!allowed.some((r) => r.test(u))) fail(`unexpected source link ${u}`)
for (const t of data.timeline) if (t.source.kind === 'news' && !data.news.some((n) => n.url === t.source.url)) fail(`timeline news item ${t.date} is not listed among the news reports`)

const steps = data.bill2026.steps
for (const s of steps) if (s.done !== (s.date !== null)) fail(`bill step "${s.step}" is ${s.done ? 'done without a date' : 'dated but not done'}`)
const firstOpen = steps.findIndex((s) => !s.done)
if (firstOpen >= 0 && steps.slice(firstOpen).some((s) => s.done)) fail('a later bill step is done while an earlier one is not')

const page = join(root, 'out/armory/index.html')
if (!existsSync(page)) fail('out/armory/index.html was not built')
else {
  const html = norm(readFileSync(page, 'utf8').replace(/<[^>]+>/g, ' ').replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&'))
  for (const s of steps) if (!html.includes(s.step)) fail(`the page does not show the bill step "${s.step}"`)
  for (const t of data.loi.terms) if (!html.includes(norm(t.quote))) fail(`the page does not quote the letter of intent on "${t.topic}"`)
  if (!html.includes('99 years')) fail('the page does not state the 99-year term')
}

if (!process.exitCode) console.log(`armory: ${data.quotes.length} Town quotes found in the minutes and packets, ${data.timeline.length} dated events, ${steps.filter((s) => s.done).length} of ${steps.length} bill steps done, ${data.loi.terms.length} letter-of-intent terms on the page.`)
