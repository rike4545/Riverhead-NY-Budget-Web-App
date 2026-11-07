// Checks for /preserved-land/, /board-votes/ and /budget-flow/:
//   - preserved land: every parcel has a holder, acres and an outline, no
//     street address or tax-map number is kept, and the page states the total;
//   - board votes: every contested resolution really had differing votes, the
//     pair counts add up from that list, and the page lists every one;
//   - budget flow: revenue and spending each add to the 2027 Preliminary
//     book's total, every fund balances, and the page states the total.

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
const fail = (message) => { console.error(`NEW VIEWS VERIFY FAILED: ${message}`); process.exitCode = 1 }
const page = (route) => {
  const f = path('out', route, 'index.html')
  if (!existsSync(f)) { fail(`/${route}/ was not built`); return '' }
  return readFileSync(f, 'utf8').replace(/<[^>]+>/g, ' ').replace(/&#x27;|&apos;/g, "'").replace(/\s+/g, ' ')
}
const fmt = (n) => Math.round(n).toLocaleString('en-US')

// ── Preserved land ──
const farm = read('public', 'data', 'geo', 'riverhead-preserved-farmland.json')
let acres = 0
for (const f of farm.features) {
  const p = f.properties
  if (!['Town', 'County', 'County and Town', 'State', 'Other'].includes(p.holder)) fail(`parcel holder ${p.holder}`)
  if (!(p.acres > 0)) fail(`a parcel has ${p.acres} acres`)
  if (!f.geometry.coordinates.length) fail('a parcel has no outline')
  const keys = Object.keys(p).sort().join()
  if (keys !== 'acres,classification,hamlet,holder,year') fail(`a parcel carries ${keys}`)
  acres += p.acres
}
const land = page('preserved-land')
if (land && !land.includes(`${fmt(acres)} acres`)) fail(`/preserved-land/ does not state the ${fmt(acres)} acres`)
if (land && !land.includes(`${farm.features.length} parcels`)) fail('/preserved-land/ does not state the parcel count')

// ── Board votes ──
const v = read('public', 'data', 'vote-agreement.json')
const CAST = ['aye', 'nay', 'abstain']
const pairs = new Map()
for (const r of v.contested) {
  const cast = new Set(Object.values(r.votes).filter((x) => CAST.includes(x)))
  if (cast.size < 2) fail(`${r.number} is listed as contested but the votes agree`)
  const who = Object.keys(r.votes).sort()
  for (let i = 0; i < who.length; i++) for (let j = i + 1; j < who.length; j++) {
    const a = who[i], b = who[j]
    if (!CAST.includes(r.votes[a]) || !CAST.includes(r.votes[b])) continue
    const k = `${a}|${b}`, c = pairs.get(k) ?? [0, 0]
    c[0]++; if (r.votes[a] === r.votes[b]) c[1]++
    pairs.set(k, c)
  }
}
for (const p of v.pairs) {
  const c = pairs.get(`${p.a}|${p.b}`) ?? [0, 0]
  if (c[0] !== p.both || c[1] !== p.same) fail(`${p.a} and ${p.b}: file says ${p.same} of ${p.both}, the list gives ${c[1]} of ${c[0]}`)
}
const votesPage = page('board-votes')
if (votesPage) for (const r of v.contested) if (!votesPage.includes(r.number)) fail(`/board-votes/ does not list ${r.number}`)

// ── Budget flow ──
const book = read('public', 'data', 'budget-2027-preliminary-lines.json')
const total = book.reconciliation.preliminarySummaryTotal
const sum = (kind) => book.lines.filter((l) => l.kind === kind).reduce((s, l) => s + (l.preliminary ?? 0), 0)
if (Math.abs(sum('revenue') - total) > 0.5 || Math.abs(sum('expenditure') - total) > 0.5) fail(`the book's revenue ${sum('revenue')} or spending ${sum('expenditure')} differs from its total ${total}`)
const byFund = new Map()
for (const l of book.lines) byFund.set(l.fund, (byFund.get(l.fund) ?? 0) + (l.kind === 'revenue' ? 1 : -1) * (l.preliminary ?? 0))
for (const [fund, gap] of byFund) if (Math.abs(gap) > 0.5) fail(`fund ${fund} does not balance (${gap})`)
const flowPage = page('budget-flow')
const usd = `$${fmt(total)}`
if (flowPage && (flowPage.match(new RegExp(usd.replace(/[$]/g, '\\$'), 'g')) ?? []).length < 2) fail(`/budget-flow/ does not state the total ${usd}`)

if (!process.exitCode) console.log(`New views verified: ${farm.features.length} preserved parcels (${fmt(acres)} acres); ${v.contested.length} contested resolutions, ${v.pairs.length} pairs; 2027 flow balances at ${usd}.`)
