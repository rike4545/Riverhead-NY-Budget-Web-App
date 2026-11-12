// /epcal/ (lib/epcal.ts).
// - every CDA fund (Z14) line the page reads exists in the Budget Supplement data;
// - the built page shows each year's rent and legal total as the lines give them;
// - each Town Board resolution it lists is EPCAL's, from the meeting data;
// - every news source is linked and the page says its plan is this site's reading.
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { Z14, NEWS, TIMELINE, POSITIONS, CDA_FUND_BALANCE_2024 } from '../lib/epcal.ts'

const root = process.cwd()
const fail = (m) => { console.error(`EPCAL VERIFY FAILED: ${m}`); process.exitCode = 1 }
const read = (p) => JSON.parse(readFileSync(join(root, p), 'utf8'))
const cur = read('public/data/budget-supplement/current-lines.json').lines
const old = read('public/data/budget-supplement/lines.json').lines
const usd = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

for (const [k, a] of Object.entries(Z14)) if (!cur.some((l) => l.account === a)) fail(`${k} line ${a} is not in the 2027 Budget Supplement data`)
const row = (a) => { const c = cur.find((l) => l.account === a) || {}; const o = old.find((l) => l.account === a) || {}; return [o.actual2023 ?? 0, c.priorActual ?? 0, c.actual ?? 0, c.adopted ?? 0, c.preliminary ?? 0] }
const rent = row(Z14.rent)
const legal = [Z14.legal, Z14.catLegal, Z14.consultants].map(row).reduce((s, r) => s.map((v, i) => v + r[i]))
if (rent[2] !== 209125) fail(`2025 rent reads ${rent[2]}, the 2027 Budget Supplement says 209,125`)
for (const k of new Set([...TIMELINE.map((e) => e.source), ...POSITIONS.flatMap((p) => p.source)])) if (!NEWS[k]) fail(`source ${k} is not defined`)

const fiscal = read('public/data/meetings/fiscal-index.json').meetings.flatMap((m) => read(`public/data/meetings/${m}-fiscal.json`).resolutions)
const out = join(root, 'out/epcal/index.html')
if (!existsSync(out)) fail('out/epcal/index.html was not built')
else {
  const html = readFileSync(out, 'utf8').replace(/<!-- -->/g, '')
  for (const v of [...rent, ...legal]) if (!html.includes(usd(v))) fail(`the page does not show ${usd(v)}`)
  if (!html.includes(usd(CDA_FUND_BALANCE_2024))) fail('the page does not show the CDA fund balance')
  for (const n of Object.values(NEWS)) if (!html.includes(n.url)) fail(`the page does not link ${n.url}`)
  for (const s of ['not a finding or the Town’s plan', 'news reports']) if (!html.includes(s)) fail(`the page does not say "${s}"`)
  const listed = [...html.matchAll(/Resolution (2026-\d+)/g)].map((m) => m[1])
  if (listed.length < 8) fail(`only ${listed.length} EPCAL resolutions listed`)
  for (const n of listed) { const r = fiscal.find((x) => x.number === n); if (!r) fail(`resolution ${n} is not in the meeting data`); else if (!/EPCAL|Calverton|CDA|Runway/i.test(r.title)) fail(`resolution ${n} does not look like EPCAL's`) }
  if (!process.exitCode) console.log(`EPCAL: ${Object.keys(Z14).length} CDA lines found; rent and legal for 5 years shown as budgeted; ${listed.length} Board resolutions checked; ${Object.keys(NEWS).length} news sources linked.`)
}
