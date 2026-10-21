// The Payroll page explains how the Town's payroll file numbers run
// (lib/file-numbers.ts). This re-derives each block from the Town's roster and
// the payroll exports' hire years, checks the latest number the Board cited in
// its agenda packet, then holds the built page to the figures.

import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { isAbsolute, relative, resolve, sep } from 'node:path'
import { fileNumbers } from '../lib/file-numbers.ts'

const root = resolve(process.cwd())
const repo = resolve(root, '..')
const path = (...parts) => {
  const target = resolve(root, ...parts)
  const rel = relative(repo, target)
  if (rel === '..' || rel.startsWith(`..${sep}`) || isAbsolute(rel)) throw new Error(`refusing to read outside ${repo}: ${target}`)
  return target
}
const fail = (message) => { console.error(`FILE NUMBER VERIFY FAILED: ${message}`); process.exitCode = 1 }

// A small CSV reader: quoted fields with commas, no embedded newlines.
const parseCsv = (text) => {
  const rows = text.trim().split(/\r?\n/).map((line) => {
    const out = []; let cur = ''; let quoted = false
    for (const ch of line) {
      if (ch === '"') quoted = !quoted
      else if (ch === ',' && !quoted) { out.push(cur); cur = '' }
      else cur += ch
    }
    out.push(cur)
    return out
  })
  const [head, ...body] = rows
  return body.map((r) => Object.fromEntries(head.map((h, i) => [h, r[i] ?? ''])))
}

const dir = '../etl/data/payroll'
const roster = parseCsv(readFileSync(path(dir, 'gfz-code-lookup.csv'), 'utf8')).filter((r) => /^\d+$/.test(r['File Number']))
const people = new Map()
for (const file of readdirSync(path(dir)).filter((f) => /^gross-earnings-\d{4}\.csv$/.test(f)).sort()) {
  for (const r of parseCsv(readFileSync(path(dir, file), 'utf8'))) {
    const p = people.get(r.name) ?? { statuses: [] }
    if (r.hire_year) p.hire = Math.trunc(Number(r.hire_year))
    p.statuses.push(r.status)
    people.set(r.name, p)
  }
}

if (roster.length !== fileNumbers.rosterPeople) fail(`the roster lists ${roster.length} people, the page says ${fileNumbers.rosterPeople}`)
if (new Set(roster.map((r) => r['Payroll Company Code'])).size !== 1 || roster[0]['Payroll Company Code'] !== fileNumbers.code) fail(`the roster has company codes other than ${fileNumbers.code}`)
const unmatched = roster.filter((r) => people.get(r['Payroll Name'])?.hire === undefined)
if (unmatched.length) fail(`${unmatched.length} roster names have no hire year in the payroll exports`)

const num = (s) => Number(s)
const highest = Math.max(...roster.map((r) => num(r['File Number'])).filter((n) => n < 900000))
if (highest !== num(fileNumbers.highestOnRoster)) fail(`the highest regular number is ${highest}, the page says ${fileNumbers.highestOnRoster}`)
const top = Math.max(...roster.map((r) => people.get(r['Payroll Name'])?.hire ?? 0))
if (top !== fileNumbers.highestHireYear) fail(`the latest hire year on the roster is ${top}, the page says ${fileNumbers.highestHireYear}`)

const covered = roster.filter((r) => fileNumbers.blocks.some((b) => num(r['File Number']) >= num(b.from) && num(r['File Number']) <= num(b.to)))
if (covered.length !== roster.length) fail(`${roster.length - covered.length} roster numbers fall outside the page's blocks`)

const ordered = (rows) => {
  const s = rows.map((r) => [num(r['File Number']), people.get(r['Payroll Name']).hire]).sort((a, b) => a[0] - b[0])
  return s.filter((x, i) => i > 0 && x[1] < s[i - 1][1]).length
}
for (const b of fileNumbers.blocks) {
  const rows = roster.filter((r) => num(r['File Number']) >= num(b.from) && num(r['File Number']) <= num(b.to))
  if (rows.length !== b.people) fail(`${b.from}–${b.to} holds ${rows.length} people, the page says ${b.people}`)
  // A hire year before 1950 is a placeholder in the exports (one record shows 1900).
  const years = rows.map((r) => people.get(r['Payroll Name']).hire).filter((y) => y >= 1950)
  const span = `${Math.min(...years)}–${Math.max(...years)}`
  if (span !== b.hired) fail(`${b.from}–${b.to} were hired ${span}, the page says ${b.hired}`)
  const outOfOrder = ordered(rows)
  if (/^(By hire year|The next number)/.test(b.order) && outOfOrder > rows.length * 0.05) fail(`${b.from}–${b.to} has ${outOfOrder} numbers out of hire-year order`)
  if (/retired or deceased/.test(b.who)) {
    const former = rows.filter((r) => people.get(r['Payroll Name']).statuses.some((s) => s === 'Retired' || s === 'Deceased')).length
    const stated = b.who.match(/(\d+) of them/)
    const want = stated ? Number(stated[1]) : rows.length
    if (former !== want) fail(`${former} of ${rows.length} in ${b.from}–${b.to} are retired or deceased, the page says ${want}`)
  }
}

const counts = new Map()
for (const r of roster) counts.set(r['File Number'], (counts.get(r['File Number']) ?? 0) + 1)
const shared = [...counts.values()].filter((c) => c > 1).length
if (shared !== fileNumbers.sharedNumbers) fail(`${shared} numbers appear under two names, the page says ${fileNumbers.sharedNumbers}`)

const ex = fileNumbers.example
const exRow = roster.find((r) => r['File Number'] === ex.number)
if (exRow?.['Payroll Name'] !== ex.name || people.get(ex.name)?.hire !== ex.hired) fail(`${ex.number} is not ${ex.name}, hired ${ex.hired}`)
const sameYear = roster.filter((r) => people.get(r['Payroll Name']).hire === ex.hired && num(r['File Number']) < 900000).map((r) => num(r['File Number'])).sort((a, b) => a - b)
if (sameYear[0] !== num(ex.yearFrom) || sameYear[sameYear.length - 1] !== num(ex.yearTo)) fail(`${ex.hired} hires run ${sameYear[0]}–${sameYear[sameYear.length - 1]}, the page says ${ex.yearFrom}–${ex.yearTo}`)

const cited = fileNumbers.latestCited
const packet = readFileSync(path('../etl/data/meetings/2026-10-20-vote-packet.txt'), 'utf8')
if (!packet.includes(`terminates employee GFZ${cited.number}`)) fail(`the October 20, 2026 packet no longer cites GFZ${cited.number}`)

// The page's example citation: Resolution 2026-888 sends "employee #GFZ000152" to a conference.
const oct6 = readFileSync(path('../etl/data/meetings/2026-10-06-vote-packet.txt'), 'utf8')
const r888 = oct6.indexOf('TB Resolution 2026-888')
if (r888 === -1 || !oct6.slice(r888, r888 + 1200).includes('employee #GFZ000152')) fail('Resolution 2026-888 no longer cites employee #GFZ000152')

const built = 'out/payroll/index.html'
if (!existsSync(path(built))) fail(`${built} was not built`)
else {
  const html = readFileSync(path(built), 'utf8')
  const i = html.indexOf('data-file-numbers')
  const text = i === -1 ? '' : html.slice(i, html.indexOf('</details>', i)).replace(/<!-- -->/g, '').replace(/<[^>]+>/g, ' ').replace(/&#x27;/g, "'").replace(/\s+/g, ' ')
  if (!text) fail('/payroll/ has no file-number section')
  for (const s of [...fileNumbers.blocks.flatMap((b) => [b.from, b.to, b.hired]), ex.number, 'Resolution 2026-888', '#GFZ000152', `GFZ${cited.number}`, `Resolution ${cited.resolution}`]) {
    if (text && !text.includes(s)) fail(`the file-number section does not show ${s}`)
  }
}

// The personnel actions table: each name is the roster's for its number, and
// the page shows every action with its caveat.
const personnel = JSON.parse(readFileSync(path('public/data/meetings/personnel-actions.json'), 'utf8'))
const rosterNames = new Map()
for (const r of roster) rosterNames.set(r['File Number'], [...(rosterNames.get(r['File Number']) ?? []), r['Payroll Name']])
for (const a of personnel.actions) {
  const want = rosterNames.get(a.fileNumber) ?? []
  if (a.people.map((p) => p.name).join('|') !== want.join('|')) fail(`${a.resolution}: GFZ${a.fileNumber} is shown as ${a.people.map((p) => p.name).join(' or ') || 'no one'}, the roster says ${want.join(' or ') || 'no one'}`)
  if (!readFileSync(path('..', a.source), 'utf8').includes(a.fileNumber)) fail(`${a.resolution}: ${a.source} does not cite GFZ${a.fileNumber}`)
}
if (existsSync(path(built))) {
  const html = readFileSync(path(built), 'utf8')
  const i = html.indexOf('data-personnel-actions')
  const text = i === -1 ? '' : html.slice(i, html.indexOf('</details>', i)).replace(/<!-- -->/g, '').replace(/<[^>]+>/g, ' ').replace(/&#x27;/g, "'").replace(/\s+/g, ' ')
  if (personnel.actions.length && !text) fail('/payroll/ has no personnel actions table')
  if (text && !text.includes('A resolution is an action, not a finding.')) fail('the personnel actions table lost its caveat')
  for (const a of personnel.actions) {
    if (text && !text.includes(a.resolution)) fail(`the personnel actions table does not show ${a.resolution}`)
    for (const p of a.people) if (text && !text.includes(p.name)) fail(`the personnel actions table does not show ${p.name} for ${a.resolution}`)
  }
}

if (!process.exitCode) console.log(`File-number verification passed: ${roster.length} roster numbers in ${fileNumbers.blocks.length} blocks, each matching its hire years.`)
