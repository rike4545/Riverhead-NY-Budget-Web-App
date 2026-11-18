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
import { PBA, SOA, FIS_ANSWER, IMPLIED_RAISE, BODYCAM_2027, INCENTIVE_PAYOUTS, MEETING, FORM_E_A, PAYOUTS_FORM, BUDGET_LINES, PFRS_RATE, POLICE_FORM_FIXES } from '../lib/police-stipulations-2027.ts'
import { CSEA_TERMS, CSEA_2027 } from '../lib/raises-2027.ts'

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

// The corrections to the two police forms describe what each form prints.
const field = (page, from, to) => {
  const p = squash(pages.get(page) ?? '')
  const a = p.indexOf(from)
  const b = a < 0 ? -1 : p.indexOf(to, a + from.length)
  return a < 0 || b < 0 ? null : p.slice(a + from.length, b).trim()
}
for (const u of [PBA, SOA]) {
  const pg = u.packetPages.fiscalImpact
  const fis = squash(pages.get(pg) ?? '')
  if (!fis.includes(FORM_E_A)) fail(`${u.item}: section E(a) on page ${pg} does not read "${FORM_E_A}"`)
  const typeA = field(pg, 'A. Type of Legislation:', 'B.')
  if ((typeA === '') !== (u === SOA)) fail(`${u.item}: section A reads "${typeA}"; the corrections say it is blank on the SOA form only`)
  if (field(pg, 'Detail/Initials:', '(b)') !== '') fail(`${u.item}: E(a) is initialled on page ${pg}, but the corrections say it is blank`)
  if (field(pg, 'over ___', 'G.') !== '') fail(`${u.item}: section F is filled in on page ${pg}, but the corrections say it is blank`)
  if (field(pg, 'Appropriation Account to be Charged:', 'Grant or other') !== '') fail(`${u.item}: section G names an account on page ${pg}`)
  const sign = field(pg, 'J. Date', 'K. Accounting')
  if (sign !== 'Karen Occhiogrosso, Paralegal') fail(`${u.item}: the preparer block reads "${sign}", not a typed name alone`)
  const acct = field(pg, 'M. Date', 'Page ')
  if (acct !== '[SPONSOR]') fail(`${u.item}: the accounting block reads "${acct}", not "[SPONSOR]" alone`)
}
if (POLICE_FORM_FIXES.length !== 7) fail(`expected 7 form corrections, found ${POLICE_FORM_FIXES.length}; update this check with any new one`)

// The payouts form: "yes", initialled under E(a), and yet F and G filled in.
const pf = squash(pages.get(PAYOUTS_FORM.packetPage) ?? '')
for (const s of ['Fiscal Impact: Yes', FORM_E_A, PAYOUTS_FORM.initialled, PAYOUTS_FORM.years, PAYOUTS_FORM.source, `$${whole(INCENTIVE_PAYOUTS.fromFundBalance)}`]) {
  if (!pf.includes(s)) fail(`IX.2: its Fiscal Impact Statement (page ${PAYOUTS_FORM.packetPage}) does not say "${s}"`)
}
for (const l of INCENTIVE_PAYOUTS.lines) if (!pf.includes(l.account)) fail(`IX.2: ${l.account} is not on its Fiscal Impact Statement`)
// Social Security on the payouts is 7.65% of the pay lines, uniformed and civilian.
const uni = INCENTIVE_PAYOUTS.lines.find((l) => l.account.includes('3120-101-UNI')).amount
const non = INCENTIVE_PAYOUTS.lines.filter((l) => l.account.includes('-101-NON-')).reduce((s, l) => s + l.amount, 0)
const ficaU = INCENTIVE_PAYOUTS.lines.find((l) => l.account.includes('9035')).amount
const ficaN = INCENTIVE_PAYOUTS.lines.find((l) => l.account.includes('9030')).amount
if (Math.abs(uni * 0.0765 - ficaU) > 1 || Math.abs(non * 0.0765 - ficaN) > 1) fail('IX.2: the Social Security lines are not 7.65% of the pay lines')

// The budget lines the corrections cite are the ones the parsed 2027 Preliminary Budget has.
const prelim = JSON.parse(readFileSync(join(root, 'public/data/budget-2027-preliminary-lines.json'), 'utf8')).lines
for (const l of BUDGET_LINES) {
  const row = prelim.find((r) => r.account === l.account)
  if (!row) { fail(`${l.account} is not in the 2027 Preliminary Budget`); continue }
  if (row.adopted !== l.adopted2026 || row.request !== l.request2027 || row.preliminary !== l.budget2027) fail(`${l.account}: the page's figures differ from the 2027 Preliminary Budget`)
}
const pfrs = readFileSync(join(root, '../etl/predict_2027.py'), 'utf8').match(/PFRS_RATE_INCREASE_PTS = ([0-9.]+) - ([0-9.]+)/)
if (!pfrs || Number(pfrs[1]) / 100 !== PFRS_RATE) fail('the police pension rate differs from etl/predict_2027.py')
if (pfrs && BUDGET_LINES[4].budget2027 / BUDGET_LINES[4].adopted2026 >= Number(pfrs[1]) / Number(pfrs[2])) fail('the page says the pension line rises less than the State rate; it no longer does')

// The CSEA terms shown beside the police ones are the ones the 2027 forecast uses.
const py = readFileSync(join(root, '../etl/predict_2027.py'), 'utf8')
for (const t of CSEA_TERMS) {
  const m = py.match(new RegExp(`${t.year}: \\{"pctStep": ([0-9.]+), "flatAdj": (\\d+)\\}`))
  if (!m || Number(m[1]) !== t.pct || Number(m[2]) !== t.flat) fail(`CSEA ${t.year}: raises-2027.ts and etl/predict_2027.py disagree`)
}
const c27 = CSEA_TERMS.find((t) => t.year === 2027)
if (c27?.pct !== CSEA_2027.pct || c27?.flat !== CSEA_2027.flat) fail('CSEA 2027: CSEA_TERMS and CSEA_2027 disagree')

const built = [
  ['payroll', ['What the Town’s cost forms get wrong', 'data-form-fixes', 'data-budget-lines', 'Reviewed, signed and dated by the Accounting Office', 'How this compares with the Town’s civilian workers', 'Resolution 2025-1001', MEETING.packetUrl, MEETING.agendaUrl, money(PBA.officers[6].rates[4]), money(SOA.ranks[3].rates[4]), FIS_ANSWER]],
  // Each page's vote status is checked by verify-watched-resolutions.mjs.
  ['buyout', [MEETING.agendaUrl, `$${whole(INCENTIVE_PAYOUTS.fromFundBalance)}`, 'data-payouts-form', PAYOUTS_FORM.years]],
]
for (const [page, must] of built) {
  const file = join(root, `out/${page}/index.html`)
  if (!existsSync(file)) { fail(`out/${page}/index.html was not built`); continue }
  const html = readFileSync(file, 'utf8').replace(/<!-- -->/g, '').replace(/&amp;/g, '&')
  for (const s of must) if (!html.includes(s)) fail(`/${page}/ does not show "${s}"`)
}

if (!process.exitCode) console.log(`Police stipulations: ${rows} schedule rows match packet pages and rise ${IMPLIED_RAISE * 100}% a year; both Fiscal Impact Statements say "No" and print what the 7 corrections describe; the payouts form is checked too; ${INCENTIVE_PAYOUTS.lines.length} payout lines add to $${whole(INCENTIVE_PAYOUTS.fromFundBalance)}.`)
