// Checks for /grants/:
//   - each year's State and federal totals equal the sum of its accounts, and
//     mortgage tax and revenue sharing are kept out of them;
//   - each single audit's awards add to its total and match that year's
//     federal aid in the Comptroller data;
//   - every curated award quotes its resolution, states a match or says it is
//     not stated, and quotes the match where it states a share;
//   - the page states the total received and lists every award.

import { existsSync, readFileSync } from 'node:fs'
import { isAbsolute, relative, resolve, sep } from 'node:path'

const root = resolve(process.cwd())
const repo = resolve(root, '..')
const path = (...parts) => {
  const target = resolve(root, ...parts)
  const rel = relative(repo, target)
  if (rel === '..' || rel.startsWith(`..${sep}`) || isAbsolute(rel)) throw new Error(`refusing to read outside ${repo}: ${target}`)
  return target
}
const read = (...p) => JSON.parse(readFileSync(path(...p), 'utf8'))
const fail = (m) => { console.error(`GRANTS VERIFY FAILED: ${m}`); process.exitCode = 1 }
const fmt = (n) => Math.round(n).toLocaleString('en-US')

const rec = read('public', 'data', 'grants-received.json')
const general = new Set(Object.keys(rec.generalAidAccounts))
let total = 0
if (rec.years.length < 8) fail(`only ${rec.years.length} years of grants received`)
for (const y of rec.years) {
  const sum = (level) => y.accounts.filter((a) => a.level === level).reduce((s, a) => s + a.amount, 0)
  if (Math.abs(sum('State Aid') - y.state) > 1 || Math.abs(sum('Federal Aid') - y.federal) > 1) fail(`${y.year}: accounts do not add to the State or federal total`)
  if (Math.abs(y.state + y.federal - y.total) > 1) fail(`${y.year}: State plus federal is not the total`)
  for (const a of y.accounts) if (general.has(a.code.replace(/\D/g, ''))) fail(`${y.year}: general aid ${a.code} is counted as a grant`)
  const byPurpose = Object.values(y.byPurpose).reduce((s, v) => s + v, 0)
  if (Math.abs(byPurpose - y.total) > 1) fail(`${y.year}: purposes add to ${byPurpose}, not ${y.total}`)
  total += y.total
}
for (const a of rec.singleAudits) {
  const s = a.awards.reduce((t, w) => t + w.amount, 0)
  if (Math.abs(s - a.total) > 1) fail(`single audit ${a.year}: awards add to ${s}, not ${a.total}`)
  const y = rec.years.find((x) => x.year === a.year)
  if (y && Math.abs(y.federal - a.total) > 5) fail(`${a.year}: single audit ${a.total} differs from federal aid ${y.federal}`)
}

const aw = read('public', 'data', 'grants-awards.json')
for (const a of aw.awards) {
  if (!/^\d{4}-\d+$/.test(a.resolution)) fail(`award with resolution ${a.resolution}`)
  if (!a.quote || a.quote.length < 30) fail(`${a.resolution} has no quotation`)
  if (!a.match) fail(`${a.resolution} does not say whether a match is required`)
  if ((a.matchPercent ?? 0) > 0 && !a.matchQuote) fail(`${a.resolution} states a ${a.matchPercent}% match without quoting it`)
  if (a.matchPercent == null && a.match !== 'not stated') fail(`${a.resolution}: match "${a.match}" has no percent`)
  if (a.award != null && a.awardNote == null && !a.quote.includes(a.award.toLocaleString('en-US', { minimumFractionDigits: a.award % 1 ? 2 : 0 }))) fail(`${a.resolution}: the award ${a.award} is not in its quotation`)
}

const f = path('out', 'grants', 'index.html')
if (!existsSync(f)) fail('/grants/ was not built')
else {
  const html = readFileSync(f, 'utf8').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')
  const millions = `$${(total / 1e6).toFixed(2)} million`
  if (!html.includes(millions)) fail(`/grants/ does not state the ${millions} received`)
  for (const a of aw.awards) if (!html.includes(a.resolution)) fail(`/grants/ does not list ${a.resolution}`)
}

if (!process.exitCode) console.log(`Grants verified: $${fmt(total)} received ${rec.years[0].year}–${rec.years.at(-1).year}; ${aw.awards.length} awards quoted; ${rec.singleAudits.length} single audit(s) reconcile.`)
