// /election-map/ draws the Suffolk County Board of Elections' district counts
// on the County's own district boundaries. This checks:
//   - every contest has the same 22 districts as the boundary file;
//   - in each district, the candidates' votes add up to the district's total,
//     and the districts add up to the contest's total and each candidate's;
//   - every contest, in both years, sits on the same district map (the results
//     site's map feature for each district is the same);
//   - the 2026 Supervisor figures match lib/election-results-2026.ts, district
//     by district;
//   - the built page draws 22 districts, states the leads worked out here, and
//     gives the certified 2025 totals beside the unofficial count.

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
const fail = (message) => { console.error(`ELECTION MAP VERIFY FAILED: ${message}`); process.exitCode = 1 }
const num = (n) => n.toLocaleString('en-US')

const geo = read('public', 'data', 'elections', 'riverhead-districts.json')
const data = read('public', 'data', 'elections', 'riverhead-map.json')
const eds = geo.features.map((f) => f.properties.ed).sort()
if (eds.length !== 22 || new Set(eds).size !== 22) fail(`expected 22 distinct district boundaries, found ${eds.length}`)

let firstMap = null
for (const e of data.elections) {
  for (const c of e.contests) {
    const where = `${e.label} ${c.name}`
    const keys = Object.keys(c.districts).sort()
    if (keys.join() !== eds.join()) fail(`${where}: districts ${keys.join(',')} do not match the boundaries`)
    let sum = 0
    for (const [ed, d] of Object.entries(c.districts)) {
      const s = Object.values(d.votes).reduce((a, b) => a + b, 0)
      if (s !== d.total) fail(`${where}, district ${ed}: candidates add to ${s}, not ${d.total}`)
      sum += d.total
    }
    if (sum !== c.total) fail(`${where}: districts add to ${sum}, not ${c.total}`)
    for (const cand of c.candidates) {
      const s = Object.values(c.districts).reduce((a, d) => a + (d.votes[cand.name] ?? 0), 0)
      if (s !== cand.votes) fail(`${where}: ${cand.name}'s districts add to ${s}, not ${cand.votes}`)
      const lines = Object.values(cand.lines).reduce((a, b) => a + b, 0)
      if (lines !== cand.votes) fail(`${where}: ${cand.name}'s party lines add to ${lines}, not ${cand.votes}`)
    }
    // 2024 comes from a compilation without the results site's map ids; its import checks the boundaries instead.
    if (e.districtSource) {
      if (!(e.districtSource.boundaryOverlap >= 0.99)) fail(`${where}: the 2024 districts match today's only to ${e.districtSource.boundaryOverlap}`)
      continue
    }
    const ids = Object.fromEntries(Object.entries(c.districts).map(([ed, d]) => [ed, d.mapFeatureId]))
    firstMap ??= ids
    if (JSON.stringify(ids) !== JSON.stringify(firstMap)) fail(`${where} is drawn on a different district map from the first contest`)
  }
}

// Every Supervisor race since 2013, from the County's final pages.
const history = data.supervisorHistory ?? []
const years = history.map((r) => r.year)
if (years.join() !== '2013,2015,2017,2019,2021,2023,2025') fail(`Supervisor history covers ${years.join(', ')}, not every odd year 2013 to 2025`)
for (const r of history) {
  const sum = r.candidates.reduce((a, c) => a + c.votes, 0)
  if (sum !== r.votesCast) fail(`Supervisor ${r.year}: candidates add to ${sum}, not ${r.votesCast}`)
  for (const c of r.candidates) {
    const lines = Object.values(c.lines).reduce((a, b) => a + b, 0)
    if (lines !== c.votes) fail(`Supervisor ${r.year}: ${c.name}'s lines add to ${lines}, not ${c.votes}`)
  }
  if (!(r.registered > r.votesCast)) fail(`Supervisor ${r.year}: ${r.registered} registered voters for ${r.votesCast} votes`)
}
// The County's final 2025 page and this site's certified record must agree.
const board25 = read('public', 'data', 'board-elections.json').priorElections.find((p) => p.year === 2025).races.find((x) => x.office === 'Supervisor')
const final25 = history.find((r) => r.year === 2025)
const boardVotes = [...board25.winners, ...board25.runnersUp].map((x) => x.votes).sort((a, b) => b - a).join()
if (final25 && final25.candidates.map((c) => c.votes).join() !== boardVotes) fail(`2025 Supervisor: the County's final page (${final25.candidates.map((c) => c.votes).join()}) differs from board-elections.json (${boardVotes})`)

// The 2026 Supervisor result the rest of the site quotes.
const lib = readFileSync(path('lib', 'election-results-2026.ts'), 'utf8')
const sup26 = data.elections.flatMap((e) => e.contests).find((c) => c.key === 'supervisor-2026')
for (const m of lib.matchAll(/ed: '(\d{3})', halpinDem: (\d+), halpinTpf: (\d+), rothwellRep: (\d+), rothwellCon: (\d+), writeIn: (\d+), total: (\d+)/g)) {
  const [, ed, hd, ht, rr, rc, wi, total] = m.map(Number).map((v, i) => (i === 1 ? m[1] : v))
  const d = sup26.districts[ed]
  if (!d || d.votes['Jerome Halpin'] !== hd + ht || d.votes['Kenneth T Rothwell'] !== rr + rc || (d.votes['Write-in'] ?? 0) !== wi || d.total !== total) {
    fail(`2026 Supervisor, district ${ed}: the map's figures differ from lib/election-results-2026.ts`)
  }
}

// The built page.
const file = path('out', 'election-map', 'index.html')
if (!existsSync(file)) fail('/election-map/ was not built')
else {
  const html = readFileSync(file, 'utf8')
  const paths = (html.match(/<path[^>]*tabindex="0"/g) ?? []).length
  if (paths !== 22) fail(`the page draws ${paths} focusable districts, not 22`)
  const text = html.replace(/<[^>]+>/g, ' ').replace(/&#x27;|&apos;/g, "'").replace(/\s+/g, ' ')
  const lead = (c, name) => Object.values(c.districts).filter((d) => {
    const ranked = Object.entries(d.votes).filter(([n]) => n !== 'Write-in').sort((a, b) => b[1] - a[1])
    return ranked[0][0] === name && ranked[0][1] !== ranked[1]?.[1]
  }).length
  const words = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve']
  const w = (n) => words[n] ?? String(n)
  const h = lead(sup26, 'Jerome Halpin'), r = lead(sup26, 'Kenneth T Rothwell')
  if (!text.includes(`Jerry Halpin led in ${w(h)} of the 22 districts and Ken Rothwell in ${w(r)}`)) fail(`the page should say Halpin led ${h} districts and Rothwell ${r}`)
  if (h + r !== 22) fail(`leads add to ${h + r}, not 22: a tie needs wording`)
  const board = read('public', 'data', 'board-elections.json')
  const sup25 = board.priorElections.find((p) => p.year === 2025).races.find((x) => x.office === 'Supervisor')
  for (const v of [...sup25.winners, ...sup25.runnersUp].map((x) => num(x.votes))) if (!text.includes(v)) fail(`the certified 2025 Supervisor total ${v} is not on the page`)
  if (!/unofficial/i.test(text)) fail('the page does not say the counts are unofficial')
  for (const r of history) {
    const w = r.candidates[0], margin = w.votes - (r.candidates[1]?.votes ?? 0)
    if (!text.includes(`${r.year}`) || !text.includes(num(w.votes)) || !text.includes(num(margin))) fail(`the ${r.year} Supervisor row is missing or wrong`)
  }
  const pres = data.elections.flatMap((e) => e.contests).find((c) => c.key === 'president-2024')
  for (const c of pres.candidates.filter((x) => x.name !== 'Write-in')) if (!text.includes(num(c.votes))) fail(`the 2024 President total ${num(c.votes)} is not on the page`)
}

if (!process.exitCode) console.log(`Election map verified: 22 districts, ${data.elections.reduce((n, e) => n + e.contests.length, 0)} contests in ${data.elections.length} elections, ${history.length} Supervisor races since 2013, 2026 Supervisor matches the site's record.`)
