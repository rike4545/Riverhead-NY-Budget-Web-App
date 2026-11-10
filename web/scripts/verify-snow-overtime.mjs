// The Highway Fund page's snow-plowing overtime section (/funds/DA1/#snow-overtime).
// - the three Supplement lines exist, and the history's latest columns agree
//   with the 2027 Supplement's own (current-lines.json);
// - Resolution 2026-196 and Amendment #4 (2026-938) move the amounts named,
//   to and from the snow line, in the fiscal impact statements, and both
//   were adopted;
// - the Preliminary figure is the Tentative less Amendment #4;
// - the built page shows the figures lib/snow-overtime.ts computes.
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { SNOW, snowOvertime, highwayPayrollOvertime } from '../lib/snow-overtime.ts'

const root = process.cwd()
const fail = (m) => { console.error(`SNOW OVERTIME VERIFY FAILED: ${m}`); process.exitCode = 1 }
const read = (p) => JSON.parse(readFileSync(join(root, p), 'utf8'))
const usd = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

const history = read('public/data/budget-supplement/line-history.json').accounts
const current = read('public/data/budget-supplement/current-lines.json').lines
const lines = [SNOW.snowOt, SNOW.repairOt, SNOW.snowContractual].map((a) => history.find((l) => l.account === a))
if (lines.some((l) => !l)) { fail('a snow or repair overtime line is missing from the Supplement history'); process.exit() }
const s = snowOvertime(...lines)

for (const l of lines) {
  const now = current.find((c) => c.account === l.account)
  const last = Math.max(...Object.keys(l.actual).map(Number))
  if (!now) { fail(`${l.account} is not in the 2027 Supplement`); continue }
  if (now.actual !== l.actual[last] || now.ytd !== l.ytd[last + 1] || now.adopted !== l.adopted[last + 1] || now.preliminary !== l.proposed) {
    fail(`${l.account}: the Supplement history and the 2027 Supplement disagree`)
  }
}

const fiscal = read('public/data/meetings/fiscal-index.json').meetings.flatMap((slug) => read(`public/data/meetings/${slug}-fiscal.json`).resolutions)
const moved = (number, account) => {
  const r = fiscal.find((x) => x.number === number)
  if (!r) return null
  if (r.vote?.adopted !== true) fail(`Resolution ${number} is not recorded as adopted`)
  return (r.funding?.accounts ?? []).filter((a) => a.code === account).reduce((t, a) => t + a.amount, 0)
}
for (const t of SNOW.transfers2026) {
  const m = moved(t.number, t.account)
  if (m !== t.amount) fail(`Resolution ${t.number} moves ${m} on ${t.account}, the page says ${t.amount}`)
}
const a4 = moved(SNOW.amendment2027.number, SNOW.amendment2027.account)
if (a4 !== SNOW.amendment2027.amount) fail(`${SNOW.amendment2027.label} moves ${a4} on the snow line, the page says ${SNOW.amendment2027.amount}`)
if (s.supplies.tentative - SNOW.amendment2027.amount !== s.supplies.proposed) fail(`the Preliminary snow line (${s.supplies.proposed}) is not the Tentative (${s.supplies.tentative}) less ${SNOW.amendment2027.label}`)

const payroll = highwayPayrollOvertime(read('public/data/payroll/records.json').records)
const page = join(root, 'out/funds/DA1/index.html')
if (!existsSync(page)) fail('out/funds/DA1/index.html was not built')
else {
  const raw = readFileSync(page, 'utf8')
  if (!raw.includes('data-snow-overtime')) fail('the Highway Fund page has no snow-overtime section')
  const html = raw.replace(/<[^>]+>/g, ' ').replace(/&#x27;|&#39;/g, "'").replace(/&amp;/g, '&').replace(/\s+/g, ' ')
  const want = [s.snowSpentFiveYears, s.snowBudgetedFiveYears, s.repairLast.actual, s.repair.ytdThisYear, s.suppliesThisYear, s.supplies.ytdThisYear, s.supplies.proposed, Math.round(payroll[s.repair.lastActualYear])]
  for (const n of want) if (!html.includes(usd(n))) fail(`the Highway Fund page does not show ${usd(n)}`)
  for (const r of s.snow.rows.filter((x) => x.year >= s.snow.lastActualYear - 6)) if (!raw.includes(`data-snow-row="${r.year}"`)) fail(`the overtime table has no ${r.year} row`)
}

if (!process.exitCode) {
  console.log(`snow overtime: snow OT spent ${usd(s.snowSpentFiveYears)} of ${usd(s.snowBudgetedFiveYears)} over five years (none in ${s.snowUnspentYears.join(', ')}); repair OT ${usd(s.repairLast.actual)} against ${usd(s.repairLast.adopted)} in ${s.repairLast.year}; salt and contractors ${usd(s.suppliesThisYear)} in ${s.supplies.thisYear}, ${usd(s.supplies.proposed)} proposed.`)
}
