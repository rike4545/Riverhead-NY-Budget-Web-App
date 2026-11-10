// Checks /cable-franchise/ and its hand-curated data (public/data/cable-franchise.json):
// - the franchise revenue (account A01-1170) matches the Budget Supplement data
//   the site publishes, year by year, and the 2027 Preliminary Budget line;
// - the federal-law quotes name the section they come from;
// - the data carries no email addresses;
// - every source link is the Town's portal, the U.S. Code or a labelled news
//   report;
// - the built page shows each franchise term, each year of revenue and the
//   residents' questions.
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const fail = (m) => { console.error(`CABLE FRANCHISE VERIFY FAILED: ${m}`); process.exitCode = 1 }
const norm = (s) => s.replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, ' ').trim()
const read = (...p) => JSON.parse(readFileSync(join(root, ...p), 'utf8'))
const raw = readFileSync(join(root, 'public/data/cable-franchise.json'), 'utf8')
const data = JSON.parse(raw)

const history = read('public/data/budget-supplement/revenue-history.json')
const acct = history.accounts?.find((a) => a.account === data.revenue.account)
if (!acct) fail(`revenue-history.json has no account ${data.revenue.account}`)
else {
  for (const [year, value] of Object.entries(data.revenue.actual)) if (acct.actual?.[year] !== value) fail(`${year} actual is ${value} here but ${acct.actual?.[year]} in the Budget Supplement`)
  if (acct.adopted?.['2026'] !== data.revenue.adopted2026) fail(`2026 adopted is ${data.revenue.adopted2026} here but ${acct.adopted?.['2026']} in the Budget Supplement`)
}
const prelim = read('public/data/budget-2027-preliminary-lines.json').lines.find((l) => l.account === data.revenue.account)
if (!prelim) fail(`the 2027 Preliminary Budget has no line ${data.revenue.account}`)
else if (prelim.preliminary !== data.revenue.preliminary2027) fail(`2027 Preliminary is ${data.revenue.preliminary2027} here but ${prelim.preliminary} in the budget`)

const sections = { '541': '541(a)(1)', '542': '542(b)', '546': '546' }
for (const l of data.law) {
  const sec = l.url.match(/\/47\/(\d+)$/)?.[1]
  if (!sec || !l.cite.includes(sections[sec] ?? `§${sec}`)) fail(`${l.cite} does not match its link ${l.url}`)
}

if (/[\w.+-]+@[\w-]+\.[\w.]+/.test(raw)) fail('cable-franchise.json contains an email address')
const allowed = [/^https:\/\/riverheadny\.portal\.civicclerk\.com\//, /^https:\/\/www\.law\.cornell\.edu\/uscode\/text\/47\//, /^https:\/\/riverheadlocal\.com\//, /^https:\/\/riverheadnewsreview\.archive\.timesreview\.com\//]
const sources = [data.franchise.minutesUrl, data.franchise.hearingUrl, ...data.law.map((l) => l.url), ...data.verizon.map((v) => v.source.url), data.channels.source.url]
for (const u of sources) if (!allowed.some((r) => r.test(u))) fail(`unexpected source link ${u}`)
for (const s of [...data.verizon.map((v) => v.source), data.channels.source]) if (s.kind !== 'news') fail(`${s.url} is a news report but is not labelled news`)
for (const t of data.franchise.terms) if (!data.franchise.speakers[t.topic]) fail(`the term "${t.topic}" names no speaker`)

const page = join(root, 'out/cable-franchise/index.html')
if (!existsSync(page)) fail('out/cable-franchise/index.html was not built')
else {
  const html = norm(readFileSync(page, 'utf8').replace(/<[^>]+>/g, ' ').replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&'))
  for (const t of data.franchise.terms) if (!html.includes(norm(t.quote))) fail(`the page does not quote the franchise term "${t.topic}"`)
  for (const [year, value] of Object.entries(data.revenue.actual)) if (!html.includes(`$${value.toLocaleString('en-US')}`)) fail(`the page does not show ${year} revenue`)
  for (const q of data.questions) if (!html.includes(norm(q))) fail(`the page does not ask "${q.slice(0, 40)}…"`)
}

if (!process.exitCode) console.log(`cable franchise: ${Object.keys(data.revenue.actual).length} years of franchise revenue match the Budget Supplement, ${data.franchise.terms.length} terms quoted, ${data.law.length} federal provisions, ${data.questions.length} questions.`)
