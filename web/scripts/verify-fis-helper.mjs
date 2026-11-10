// /fiscal-impact-helper/ (lib/fis-helper.ts).
// - every spending line in the 2027 Supplement belongs to exactly one
//   department, and every revenue line to its fund;
// - the helper fills section G the way the Town's own statements do: three
//   real 2026 resolutions, rebuilt with the helper, put each account and
//   amount in the same section G field as the agenda packet prints it;
// - the checks catch an unbalanced entry, an entry across two funds and an
//   assigned balance with no purpose, and pass a correct multi-entry draft;
// - the built page carries the helper's data.
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { MAX_ENTRIES, buildHelperData, checkDraft, reconcile, fundBalanceRow, newAccountCode, sectionG, writeStatement } from '../lib/fis-helper.ts'
import { plainAccountName, departmentName, FUND_NAMES, isFundWide } from '../lib/account-names.ts'

const root = process.cwd()
const fail = (m) => { console.error(`FIS HELPER VERIFY FAILED: ${m}`); process.exitCode = 1 }
const read = (p) => JSON.parse(readFileSync(join(root, p), 'utf8'))

const lines = read('public/data/budget-supplement/current-lines.json').lines
const meetings = read('public/data/meetings/fiscal-index.json').meetings.map((s) => read(`public/data/meetings/${s}-fiscal.json`))
const data = buildHelperData(lines, meetings, { plainAccountName, departmentName, FUND_NAMES, isFundWide }, 2026)

const seen = new Map()
for (const d of data.departments) for (const a of d.accounts) seen.set(a.code, (seen.get(a.code) ?? 0) + 1)
for (const l of lines.filter((x) => x.kind === 'expenditure')) if (seen.get(l.account) !== 1) fail(`${l.account} is in ${seen.get(l.account) ?? 0} departments`)
for (const l of lines.filter((x) => x.kind === 'revenue')) if (!(data.revenue[l.fund] ?? []).some((r) => r.code === l.account)) fail(`revenue ${l.account} is missing from its fund`)

// Three real statements, rebuilt.
const nameOf = (code) => lines.find((l) => l.account === code)?.name ?? code
const row = (code, amount) => ({ code, name: nameOf(code), amount })
const cases = [
  { number: '2026-844', date: '2026-09-15', entry: { action: 'fund-balance', from: [fundBalanceRow('A01', 375000, { assigned: false, purpose: '' })], to: [row('A01-1-1620-402-000-00000', 375000)] } },
  { number: '2026-882', date: '2026-10-06', entry: { action: 'revenue', from: [row('A04-2705-000-00000-7', 1000)], to: [row('A04-7-7314-417-000-00000', 1000)] } },
  { number: '2026-969', date: '2026-11-05', entry: { action: 'transfer', from: [row('EW1-8-8320-474-000-00000', 55000), row('EW1-8-8320-240-000-00000', 30000), row('EW1-8-8320-230-000-00000', 49000)], to: [row('EW1-8-8320-472-000-00000', 134000)] } },
]
const digits = (s) => s.replace(/[^0-9]/g, '')
for (const c of cases) {
  const packet = join(root, `../etl/data/meetings/${c.date}-vote-packet.txt`)
  if (!existsSync(packet)) { fail(`${c.number}: the ${c.date} packet is not on file`); continue }
  const text = readFileSync(packet, 'utf8')
  const at = text.lastIndexOf(c.number.replace('2026-', 'Resolution 2026-'))
  const gAt = text.indexOf('Proposed Source of Funding', at)
  const block = text.slice(gAt, text.indexOf('H. Typed Name', gAt))
  const field = (name, next) => {
    const s = block.indexOf(name)
    const e = next ? block.indexOf(next, s) : block.length
    return s < 0 ? '' : block.slice(s + name.length, e)
  }
  const fields = {
    charged: field('Appropriation Account to be Charged:', 'Grant or other Revenue Source:'),
    revenue: field('Grant or other Revenue Source:', 'Appropriation Transfer'),
    transfer: field('Appropriation Transfer (list account(s) and amount):', null),
  }
  const g = sectionG({ legislation: 'Resolution', title: 't', purpose: 'p', period: 'x', absorbed: false, entries: [c.entry] })
  for (const k of ['charged', 'revenue', 'transfer']) {
    for (const r of g[k]) {
      if (!fields[k].includes(r.code)) fail(`${c.number}: the helper puts ${r.code} under "${k}", the packet does not`)
      if (!digits(fields[k]).includes(String(Math.round(r.amount)))) fail(`${c.number}: the packet's "${k}" field does not carry ${r.amount}`)
    }
    if (g[k].length === 0 && fields[k].replace(/\s/g, '').length > 0) fail(`${c.number}: the packet fills "${k}" but the helper leaves it empty`)
  }
}

// The checks.
const base = { legislation: 'Resolution', title: 'Test', purpose: 'Test', period: '2026', absorbed: false }
const errors = (entries) => checkDraft({ ...base, entries }).filter((x) => x.level === 'error').map((x) => x.text)
const good = [cases[0].entry, cases[1].entry]
if (errors(good).length) fail(`a correct two-entry draft is flagged: ${errors(good)[0]}`)
if (!errors([{ ...cases[1].entry, to: [row('A04-7-7314-417-000-00000', 900)] }]).some((t) => t.includes('add up to the same amount'))) fail('an unbalanced entry is not flagged')
// Two funds in one entry is a note, not an error: the Town did it in 2026-843 (General Fund savings to a capital project line).
const capital = { action: 'fund-balance', from: [fundBalanceRow('A01', 40000, { assigned: false, purpose: '' })], to: [{ code: 'H01-1-1940-435-000-12620', name: 'Professional Services - Engineering', amount: 40000, isNew: true }] }
const capChecks = checkDraft({ ...base, entries: [capital] })
if (capChecks.some((x) => x.level === 'error')) fail(`the 2026-843 shape is flagged as an error: ${capChecks.find((x) => x.level === 'error').text}`)
if (!capChecks.some((x) => x.level === 'warning' && x.text.includes('more than one fund'))) fail('an entry across two funds carries no note')
if (!capChecks.some((x) => x.level === 'warning' && x.text.includes('new account'))) fail('a new account carries no note')
if (newAccountCode('H01', '1940', '435', '000', '12620') !== 'H01-1-1940-435-000-12620') fail('the account builder does not reproduce H01-1-1940-435-000-12620')
const pk = readFileSync(join(root, '../etl/data/meetings/2026-09-15-vote-packet.txt'), 'utf8').replace(/\s+/g, ' ')
if (!pk.includes('authorized to establish the following budget adjustments') || !pk.includes('H01-1-1940-435-000-12620')) fail('2026-843 is not quoted as the packet prints it')
if (!errors([{ action: 'fund-balance', from: [fundBalanceRow('A01', 10, { assigned: true, purpose: '' })], to: [row('A01-1-1620-402-000-00000', 10)] }]).some((t) => t.includes('purpose'))) fail('an assigned balance with no purpose is not flagged')
const two = writeStatement({ ...base, entries: good })
if (!two.table?.includes('Entry 1') || !two.table.includes('Entry 2')) fail('a two-entry statement does not number its tables')

// Reconciliation across the most entries a statement holds: nine transfers in
// the General Fund, each moving $1,000 to one shared line from a different
// line, and a tenth that takes $1,000 back from it in two $500 rows. Every
// entry balances, the grand totals match, and the shared line nets to +$8,000.
const spend = lines.filter((l) => l.kind === 'expenditure' && l.fund === 'A01').slice(0, 12)
const hub = spend[0].account
const ten = Array.from({ length: MAX_ENTRIES }, (_, i) => i < MAX_ENTRIES - 1
  ? { action: 'transfer', from: [row(spend[i + 1].account, 1000)], to: [row(hub, 1000)] }
  : { action: 'transfer', from: [row(hub, 500), row(hub, 500)], to: [row(spend[11].account, 1000)] })
const rec = reconcile({ ...base, entries: ten })
if (MAX_ENTRIES !== 10) fail(`a statement holds ${MAX_ENTRIES} entries, not 10`)
if (rec.entries.length !== 10 || !rec.balanced) fail('ten balanced entries do not reconcile')
if (rec.from !== 10000 || rec.to !== 10000) fail(`ten entries total ${rec.from} FROM and ${rec.to} TO, not $10,000 each`)
const hubRow = rec.accounts.find((a) => a.code === hub)
if (!hubRow || hubRow.change !== 8000 || hubRow.entries.length !== 10) fail(`${hub} nets to ${hubRow?.change} across ${hubRow?.entries.length} entries, not +$8,000 across 10`)
if (Math.round(rec.accounts.reduce((s, a) => s + a.change, 0)) !== 0) fail('net changes inside one fund do not add up to zero for transfers')
if (rec.funds.length !== 1 || !rec.funds[0].balanced) fail('the A01 transfers do not balance by fund')
if (errors(ten).length) fail(`ten correct entries are flagged: ${errors(ten)[0]}`)
const eleven = checkDraft({ ...base, entries: [...ten, ten[0]] })
if (!eleven.some((c) => c.level === 'error' && c.text.includes('no more than 10'))) fail('an eleventh entry is not flagged')
const bad = reconcile({ ...base, entries: [...ten.slice(0, 9), { ...ten[9], to: [row(spend[11].account, 900)] }] })
if (bad.balanced) fail('an unbalanced tenth entry reconciles')
// The 2026-843 shape: each entry balances, the funds do not, and the page says why.
const cap = reconcile({ ...base, entries: [capital] })
if (!cap.balanced || cap.funds.every((f) => f.balanced)) fail('a cross-fund entry should balance as an entry but not by fund')
const adj = reconcile({ ...base, entries: good })
if (!adj.funds.every((f) => f.balanced)) fail('2026-844 and 2026-882 together do not balance by fund')

const page = join(root, 'out/fiscal-impact-helper/index.html')
if (!existsSync(page)) fail('out/fiscal-impact-helper/index.html was not built')
else {
  const raw = readFileSync(page, 'utf8')
  if (!raw.includes('A01-1-1620-402-000-00000')) fail('the built page does not carry the account data')
  if (!raw.includes('data-new-account-guide')) fail('the page does not explain how a new account is created')
}

if (!process.exitCode) console.log(`fis helper: ${data.departments.length} departments, ${[...seen.keys()].length} spending lines, ${Object.values(data.revenue).flat().length} revenue lines; section G matches ${cases.map((c) => c.number).join(', ')} as printed; the checks catch imbalance, cross-fund and an unnamed assigned balance; ten entries reconcile by entry, account and fund.`)
