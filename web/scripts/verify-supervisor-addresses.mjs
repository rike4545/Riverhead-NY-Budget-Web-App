// Checks for /state-of-the-town/:
//   - every inauguration and address names at least one source, each marked
//     town, news, video or transcript, with a link;
//   - each Supervisor's addressYears includes the year of every address listed,
//     and inaugurationYears includes the year of the inauguration;
//   - the Supervisors are in order and their terms do not overlap;
//   - the built page states the count of years with an address and names every
//     Supervisor, and labels machine transcripts and news.

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
const fail = (m) => { console.error(`SUPERVISOR ADDRESSES VERIFY FAILED: ${m}`); process.exitCode = 1 }

const d = JSON.parse(readFileSync(path('public', 'data', 'supervisor-addresses.json'), 'utf8'))
const kinds = new Set(['town', 'news', 'video', 'transcript'])
const year = (s) => Number(s.slice(0, 4))
const checkEvent = (who, label, e) => {
  if (!/^\d{4}-\d{2}(-\d{2})?$/.test(e.date)) fail(`${who} ${label}: bad date ${e.date}`)
  if (!e.summary || e.summary.length < 20) fail(`${who} ${label}: no summary`)
  if (!e.sources?.length) fail(`${who} ${label}: no source`)
  for (const s of e.sources ?? []) {
    if (!kinds.has(s.kind)) fail(`${who} ${label}: source kind ${s.kind}`)
    if (!s.title || !(s.url?.startsWith('https://') || s.url?.startsWith('/'))) fail(`${who} ${label}: source without a title or link`)
  }
}
let prevStart = 0
let years = 0
for (const s of d.supervisors) {
  checkEvent(s.name, 'inauguration', s.inauguration)
  const start = year(s.inauguration.date)
  if (start <= prevStart) fail(`${s.name}: out of order`)
  prevStart = start
  if (!s.inaugurationYears.includes(start)) fail(`${s.name}: inaugurationYears leaves out ${start}`)
  for (const a of s.addresses) {
    checkEvent(s.name, `address ${a.date}`, a)
    if (!s.addressYears.includes(year(a.date))) fail(`${s.name}: addressYears leaves out ${year(a.date)}`)
  }
  for (const y of [...s.addressYears, ...s.inaugurationYears]) if (y < start) fail(`${s.name}: year ${y} before the term began`)
  years += s.addressYears.length
}
for (let i = 0; i + 1 < d.supervisors.length; i++) {
  const next = year(d.supervisors[i + 1].inauguration.date)
  for (const y of [...d.supervisors[i].addressYears, ...d.supervisors[i].inaugurationYears]) if (y >= next) fail(`${d.supervisors[i].name}: year ${y} falls in the next term`)
}
if (!d.law?.governor?.url || !d.law?.townReport?.url) fail('law section is missing a citation')

const html = path('out', 'state-of-the-town', 'index.html')
if (!existsSync(html)) fail('out/state-of-the-town/index.html is missing; run the build first')
else {
  const text = readFileSync(html, 'utf8').replace(/<!-- -->/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').replace(/&#x27;|&#39;/g, "'").replace(/&amp;/g, '&')
  const span = year(d.asOf) - year(d.supervisors[0].inauguration.date) + 1
  if (!text.includes(`${years} of the ${span} years`)) fail(`page does not say "${years} of the ${span} years"`)
  for (const s of d.supervisors) if (!text.includes(s.name)) fail(`page does not name ${s.name}`)
  if (!text.includes('Machine transcript') || !text.includes('News coverage')) fail('page does not label transcripts and news')
}
if (!process.exitCode) console.log(`supervisor addresses: ${d.supervisors.length} Supervisors, ${years} years with an address, all sourced`)
