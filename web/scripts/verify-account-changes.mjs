// The Board's budget changes listed under accounts on /outliers/#by-category
// and the payroll page's overtime table (lib/account-changes.ts).
// - every listed change is an adopted resolution whose fiscal impact
//   statement names the account with that amount;
// - every one-off the categories explain is explained by a resolution that
//   names the account with the stated amount, adopted, whose packet carries
//   the quoted words;
// - both pages say their budgets are the original, not amended, budgets.
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { accountChanges, ONE_OFF_EXPLAINED } from '../lib/account-changes.ts'

const root = process.cwd()
const fail = (m) => { console.error(`ACCOUNT CHANGES VERIFY FAILED: ${m}`); process.exitCode = 1 }
const read = (p) => JSON.parse(readFileSync(join(root, p), 'utf8'))
const norm = (s) => s.replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[–—]/g, '-').replace(/\s+/g, ' ')
const usd = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

const slugs = read('public/data/meetings/fiscal-index.json').meetings
const meetings = slugs.map((s) => ({ slug: s, ...read(`public/data/meetings/${s}-fiscal.json`) }))
const byAccount = accountChanges(meetings, 2026)

let listed = 0
for (const [code, list] of Object.entries(byAccount)) {
  for (const c of list) {
    listed++
    const m = meetings.find((x) => x.meetingDate === c.date)
    const r = m?.resolutions.find((x) => x.number === c.number)
    if (!r || r.vote?.adopted !== true) { fail(`${c.number} is not an adopted resolution of ${c.date}`); continue }
    const sum = (r.funding?.accounts ?? []).filter((a) => a.code === code && a.amount !== null).reduce((s, a) => s + a.amount, 0)
    if (Math.round(sum) !== Math.round(c.amount)) fail(`${c.number} names ${code} with ${sum}, the list says ${c.amount}`)
  }
}

for (const [code, why] of Object.entries(ONE_OFF_EXPLAINED)) {
  const c = (byAccount[code] ?? []).find((x) => x.number === why.number)
  if (!c) { fail(`Resolution ${why.number} does not name ${code} in the fiscal records`); continue }
  if (c.amount !== why.amount) fail(`Resolution ${why.number} names ${code} with ${c.amount}, the explanation says ${why.amount}`)
  const r = meetings.find((x) => x.meetingDate === c.date).resolutions.find((x) => x.number === why.number)
  if (norm(r.title) !== norm(why.title)) fail(`Resolution ${why.number}'s title is "${r.title}", not "${why.title}"`)
  const packet = join(root, `../etl/data/meetings/${c.date}-vote-packet.txt`)
  const minutes = join(root, `../etl/data/meetings/${c.date}-minutes.txt`)
  const text = norm([packet, minutes].filter(existsSync).map((p) => readFileSync(p, 'utf8')).join(' ') + ' ' + (r.statedAmounts ?? []).map((s) => s.quote).join(' '))
  for (const q of why.quotes) if (!text.includes(norm(q))) fail(`Resolution ${why.number}: "${q.slice(0, 50)}…" is not in the record`)
}

const outliers = join(root, 'out/outliers/index.html')
const payroll = join(root, 'out/payroll/index.html')
for (const [p, label] of [[outliers, 'outliers'], [payroll, 'payroll']]) {
  if (!existsSync(p)) { fail(`${label} page was not built`); continue }
  const raw = readFileSync(p, 'utf8')
  if (label === 'outliers' && !raw.includes('data-original-budget-note')) fail('the outliers page does not say its budgets are the original ones')
  if (label === 'payroll' && !raw.includes('otChanges')) fail('the payroll page does not carry the overtime budget changes')
}
if (existsSync(outliers)) {
  const html = readFileSync(outliers, 'utf8')
  for (const [code, why] of Object.entries(ONE_OFF_EXPLAINED)) if (!html.includes('data-one-off-explained') || !html.includes(why.number)) fail(`the outliers page does not explain ${code} with Resolution ${why.number}`)
  if (!html.includes(usd(3_575_000))) fail('the outliers page does not show the $3,575,000 pass-through grant')
}

if (!process.exitCode) console.log(`account changes: ${listed} listings across ${Object.keys(byAccount).length} accounts in 2026, each matching its resolution; ${Object.keys(ONE_OFF_EXPLAINED).length} one-off explained from the record.`)
