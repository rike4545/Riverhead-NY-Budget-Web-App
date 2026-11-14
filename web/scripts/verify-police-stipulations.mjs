// The proposed 2027-2030 police stipulations and the retirement-incentive
// payouts (lib/police-stipulations-2027.ts), against the kept text of the
// November 17, 2026 agenda packet:
// - every salary and night-differential rate is on its packet page, in its row;
// - every row rises 3.75% a year, with $500 added to 2027 salaries only;
// - both Fiscal Impact Statements say what the page quotes;
// - the payout lines are in the packet and add to the transfer;
// - the built payroll and buyout pages show them and link the packet.
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { PBA, SOA, FIS_ANSWER, IMPLIED_RAISE, BODYCAM_2027, INCENTIVE_PAYOUTS, MEETING, adopted } from '../lib/police-stipulations-2027.ts'

const root = process.cwd()
const fail = (m) => { console.error(`POLICE STIPULATIONS VERIFY FAILED: ${m}`); process.exitCode = 1 }
const text = readFileSync(join(root, '../etl/data/meetings/2026-11-17-police-stipulations-excerpt.txt'), 'utf8')
const parts = text.split(/===== Packet page (\d+) =====/)
const pages = new Map()
for (let i = 1; i < parts.length; i += 2) pages.set(Number(parts[i]), parts[i + 1])
const money = (n) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const whole = (n) => n.toLocaleString('en-US')
const squash = (s) => s.replace(/\s+/g, ' ')

let rows = 0
function checkRows(list, page, label, salary) {
  const p = pages.get(page)
  if (!p) { fail(`packet page ${page} is not in the excerpt`); return }
  const lines = p.split('\n')
  for (const r of list) {
    if (!lines.some((l) => r.rates.every((v) => l.includes(money(v))))) fail(`${label} ${r.title}: its five rates are not on one line of packet page ${page}`)
    const bump = salary ? BODYCAM_2027 : 0
    const steps = [(r.rates[1] - bump) / r.rates[0], r.rates[2] / r.rates[1], r.rates[3] / r.rates[2], r.rates[4] / r.rates[3]]
    if (steps.some((s) => Math.abs(s - 1 - IMPLIED_RAISE) > 0.00002)) fail(`${label} ${r.title}: does not rise ${IMPLIED_RAISE * 100}% a year`)
    rows++
  }
}
checkRows([...PBA.officers, ...PBA.detectives], PBA.packetPages.salary, 'PBA', true)
checkRows(PBA.nightDiff, PBA.packetPages.nightDiff, 'PBA night differential', false)
checkRows(SOA.ranks, SOA.packetPages.salary, 'SOA', true)
checkRows(SOA.nightDiff, SOA.packetPages.nightDiff, 'SOA night differential', false)
for (const u of [PBA, SOA]) {
  if (!squash(pages.get(u.packetPages.salary) ?? '').includes(u.footnote)) fail(`${u.item}: the bodycam footnote is not on page ${u.packetPages.salary}`)
  const fis = pages.get(u.packetPages.fiscalImpact) ?? ''
  if (!fis.includes(FIS_ANSWER) || !squash(fis).includes(squash(u.title))) fail(`${u.item}: the Fiscal Impact Statement on page ${u.packetPages.fiscalImpact} does not say "${FIS_ANSWER}" for this item`)
  if (!(pages.get(u.packetPages.resolution) ?? '').includes(`${u.item}.`)) fail(`${u.item}: packet page ${u.packetPages.resolution} is not this item's resolution`)
}

const ix2 = squash(pages.get(INCENTIVE_PAYOUTS.packetPage) ?? '')
if (!ix2.includes(INCENTIVE_PAYOUTS.took)) fail('IX.2: the count of members who took the incentive is not quoted from the packet')
if (!ix2.includes(`$${whole(INCENTIVE_PAYOUTS.fromFundBalance)}`)) fail('IX.2: the fund-balance amount is not in the packet')
for (const l of INCENTIVE_PAYOUTS.lines) {
  if (!new RegExp(`${l.account} ${l.name} \\$ ?${whole(l.amount)}`).test(ix2)) fail(`IX.2: ${l.account} ${whole(l.amount)} is not in the packet`)
}
if (INCENTIVE_PAYOUTS.lines.reduce((s, l) => s + l.amount, 0) !== INCENTIVE_PAYOUTS.fromFundBalance) fail('IX.2: the lines do not add to the transfer')

const built = [
  ['payroll', [MEETING.packetUrl, MEETING.agendaUrl, money(PBA.officers[6].rates[4]), money(SOA.ranks[3].rates[4]), FIS_ANSWER, adopted === null ? 'proposed, not yet voted on' : 'approved']],
  ['buyout', [MEETING.agendaUrl, `$${whole(INCENTIVE_PAYOUTS.fromFundBalance)}`, 'not yet voted on']],
]
for (const [page, must] of built) {
  const file = join(root, `out/${page}/index.html`)
  if (!existsSync(file)) { fail(`out/${page}/index.html was not built`); continue }
  const html = readFileSync(file, 'utf8').replace(/<!-- -->/g, '').replace(/&amp;/g, '&')
  for (const s of must) if (!html.includes(s)) fail(`/${page}/ does not show "${s}"`)
}

if (!process.exitCode) console.log(`Police stipulations: ${rows} schedule rows match packet pages and rise ${IMPLIED_RAISE * 100}% a year; both Fiscal Impact Statements say "No"; ${INCENTIVE_PAYOUTS.lines.length} payout lines add to $${whole(INCENTIVE_PAYOUTS.fromFundBalance)}.`)
