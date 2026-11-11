// /supervisor-office-pay/ (lib/supervisor-office-pay.ts and
// public/data/salary/peer-supervisor-offices.json).
// - every peer salary, and every prior-year figure, appears on its quoted line
//   in the town's own record kept in etl/data/salary/peers/;
// - Riverhead's figures match the 2026 salary schedule and the agenda packet,
//   including the Supervisor's "reduced from budgeted amount of $118,919";
// - a hand transcription of a scanned page adds up to the page's printed
//   department totals, and the page image is kept beside it;
// - the page's claims hold: Riverhead's Supervisor is paid the least of the
//   towns compared, and the built page names every town left out and why.
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { riverheadRoles, compare, RIVERHEAD_SERVICE, SUPERVISOR_START_SOURCE } from '../lib/supervisor-office-pay.ts'

const root = process.cwd()
const fail = (m) => { console.error(`SUPERVISOR OFFICE PAY VERIFY FAILED: ${m}`); process.exitCode = 1 }
const norm = (s) => s.replace(/\s+/g, ' ')
const data = JSON.parse(readFileSync(join(root, 'public/data/salary/peer-supervisor-offices.json'), 'utf8'))

let figures = 0
for (const p of data.peers) {
  const path = join(root, '..', p.source.text)
  if (!existsSync(path)) { fail(`${p.town}: ${p.source.text} is missing`); continue }
  const text = norm(readFileSync(path, 'utf8'))
  for (const r of p.roles) {
    const q = norm(r.quote)
    if (!text.includes(q)) { fail(`${p.town}: "${r.quote.trim().slice(0, 50)}" is not in the record`); continue }
    if (!q.includes(r.salary.toLocaleString('en-US'))) fail(`${p.town} ${r.title}: the quote does not carry ${r.salary}`)
    if (r.serviceDate && !q.includes(r.serviceDate)) fail(`${p.town} ${r.title}: service date ${r.serviceDate} is not on the quoted line`)
    figures++
    // Prior years sit on the same printed line, after the quoted 2026 figures.
    const line = readFileSync(path, 'utf8').split('\n').find((l) => norm(l).includes(q))
    for (const [y, v] of Object.entries(r.prior ?? {})) {
      if (!line.includes(v.toLocaleString('en-US'))) fail(`${p.town} ${r.title}: ${y} figure ${v} is not on the line`)
      figures++
    }
  }
}

// A transcribed page is checked against itself: each department's lines must add up to the total printed under it.
for (const p of data.peers.filter((x) => x.source.transcribed)) {
  const lines = readFileSync(join(root, '..', p.source.text), 'utf8').split('\n')
  let sum = 0
  let blocks = 0
  for (const l of lines) {
    if (/^Dept \d+/.test(l)) sum = 0
    const total = l.match(/^Total Dept .* ([\d,]+\.\d\d)$/)
    const item = l.match(/^[A-Z][A-Z/ &]+ ([\d,]+\.\d\d)$/)
    if (total) { blocks++; if (Math.abs(sum - Number(total[1].replace(/,/g, ''))) > 0.005) fail(`${p.town}: transcribed lines add to ${sum}, the page prints ${total[1]}`) }
    else if (item) sum += Number(item[1].replace(/,/g, ''))
  }
  if (blocks < 2) fail(`${p.town}: the transcription has no department totals to check against`)
  if (!existsSync(join(root, '..', p.source.text.replace('-transcription.txt', '-149.png')))) fail(`${p.town}: the page image kept beside the transcription is missing`)
}

const a2026 = JSON.parse(readFileSync(join(root, 'public/data/salary/authorized-2026.json'), 'utf8'))
const rh = riverheadRoles(a2026.records)
const packet = norm(readFileSync(join(root, '../etl/data/salary/agenda-packet-2026.txt'), 'utf8'))
const expect = { supervisor: 110000, deputy: 105526.77, budget: 80567.22, aide: 59740.45 }
for (const [k, v] of Object.entries(expect)) if (rh[k] !== v) fail(`Riverhead ${k} is ${rh[k]}, the schedule says ${v}`)
for (const s of ['Halpin, Jerry Town Supervisor $110,000.00*', '* reduced from budgeted amount of $118,919', 'Higgins, Devon Deputy Town Supervisor 105,526.77', 'Burkowsky, Debi Town Budget Officer 80,567.22', 'Cote, David Secretary 59,740.45', 'ACKNOWLEDGES APPOINTMENT OF CHIEF OF STAFF (BURKOWSKY)', 'under all terms and conditions previously adopted']) {
  if (!packet.includes(norm(s))) fail(`the 2026 agenda packet does not carry "${s}"`)
}
if (rh.chief !== rh.budget) fail('the Chief of Staff and Budget Officer should share one salary')

// Riverhead's service dates: hire dates from the 2023 Gross Earnings report (the latest with full dates), the aide's start from Resolution 2026-58.
const gross = readFileSync(join(root, '../etl/data/payroll/gross-earnings-2023.csv'), 'utf8').split('\n')
const hireDate = (name, title) => gross.find((l) => l.includes(`"${name}"`) && l.includes(`,${title},`))?.split(',').at(-2)
const longDate = (iso) => new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
for (const [key, name, title] of [['deputy', 'Higgins, Devon M', 'Deputy Supervisor'], ['budget', 'Burkowsky, Debi Iris', 'Town Budget Officer']]) {
  const d = hireDate(name, title)
  if (!d || !/^\d{4}-\d{2}-\d{2}$/.test(d)) fail(`the 2023 Gross Earnings report has no hire date for ${name} as ${title}`)
  else if (RIVERHEAD_SERVICE[key] !== `Hired ${longDate(d)}`) fail(`Riverhead ${key}: the page says "${RIVERHEAD_SERVICE[key]}", the report's hire date is ${d}`)
}
if (RIVERHEAD_SERVICE.chief !== RIVERHEAD_SERVICE.budget) fail('the Chief of Staff and Budget Officer are one person, so they share one service date')
if (!packet.includes(norm('David Cote, as Legislative Aide to the Town Supervisor for a term commencing January 1, 2026')) || RIVERHEAD_SERVICE.aide !== 'Term began January 1, 2026') fail("the aide's start does not match Resolution 2026-58")
// The Supervisor's start is from a news report, so it must say so and the page must link it.
if (RIVERHEAD_SERVICE.supervisor !== 'Sworn in January 1, 2026 (news report)') fail(`the Supervisor's start reads "${RIVERHEAD_SERVICE.supervisor}", not the labelled news-report date`)
if (new Date(Date.UTC(2026, 0, 1)).getUTCDay() !== 4) fail('January 1, 2026 is not the Thursday the report names')

const rows = compare(rh, data.peers)
const sup = rows.find((r) => r.role.key === 'supervisor')
if (!sup.cells.every((c) => c.salary !== null && c.salary > rh.supervisor)) fail('the page says Riverhead pays its Supervisor the least, which no longer holds')
if (!sup.cells.every((c) => c.salary > 118919)) fail('the page says the budgeted $118,919 would also be the lowest, which no longer holds')

const page = join(root, 'out/supervisor-office-pay/index.html')
if (!existsSync(page)) fail('out/supervisor-office-pay/index.html was not built')
else {
  const html = readFileSync(page, 'utf8')
  if (!html.includes('data-supervisor-comparison')) fail('the page lacks the comparison table')
  for (const n of data.notFound) if (!html.includes(n.town)) fail(`the page does not say why ${n.town} is left out`)
  for (const p of data.peers) if (!html.includes(p.source.url)) fail(`the page does not link ${p.town}'s source`)
  if (!html.includes(SUPERVISOR_START_SOURCE.url)) fail("the page does not link the news report for the Supervisor's start")
}

if (!process.exitCode) console.log(`supervisor office pay: ${figures} peer figures found on their quoted lines in ${data.peers.length} towns' records; Riverhead's four salaries match the 2026 schedule and packet; ${data.notFound.length} towns left out with reasons.`)
