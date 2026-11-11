// The resolution builder on /resolution-builder/ (lib/resolution-builder.ts).
// - every fixed phrase it writes, and every sentence of every starting point
//   outside its blanks, appears word for word in the 2026 agenda packets kept
//   in etl/data/meetings/*-vote-packet.txt;
// - each starting point's source resolution is an adopted 2026 resolution with
//   that title;
// - the four Council Members are named as the packets name them;
// - the account-code pattern accepts the codes the Board's budget tables used;
// - the joining words, the budget table and the checks behave as the page says;
// - the built page carries the builder and no email address.
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { ACCOUNT_CODE, MEMBERS, PHRASES, TEMPLATES, checkDraft, compose, fromTemplate, toPlainText, toWordHtml } from '../lib/resolution-builder.ts'

const root = process.cwd()
const fail = (m) => { console.error(`RESOLUTION BUILDER VERIFY FAILED: ${m}`); process.exitCode = 1 }
const norm = (s) => s.replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, ' ').toLowerCase()

const dir = join(root, '../etl/data/meetings')
const packets = readdirSync(dir).filter((f) => /^2026-.*-vote-packet\.txt$/.test(f))
if (packets.length === 0) fail('no 2026 agenda packets on file')
const corpus = norm(packets.map((f) => readFileSync(join(dir, f), 'utf8')).join(' '))

for (const [k, v] of Object.entries(PHRASES)) if (!corpus.includes(norm(v))) fail(`fixed phrase "${k}" is not in the packets: "${v}"`)
let sentences = 0
for (const t of TEMPLATES) {
  for (const c of [...t.draft.whereas, ...t.draft.resolved]) {
    for (const piece of c.split(/\[[^\]]*\]/).map((s) => s.trim()).filter((s) => s.length > 25)) {
      sentences++
      if (!corpus.includes(norm(piece))) fail(`${t.id}: "${piece.slice(0, 80)}" is not in the packets`)
    }
  }
}
for (const m of MEMBERS) if (!corpus.includes(norm(`${m.title} ${m.last} ${PHRASES.offered}`))) fail(`${m.title} ${m.last} never offers a resolution in the packets`)

// Each starting point names the adopted resolution it follows.
const index = JSON.parse(readFileSync(join(root, 'public/data/meetings/fiscal-index.json'), 'utf8')).meetings
const resolutions = index.flatMap((s) => JSON.parse(readFileSync(join(root, `public/data/meetings/${s}-fiscal.json`), 'utf8')).resolutions)
for (const t of TEMPLATES.filter((x) => x.source)) {
  const num = t.source.split(',')[0].trim()
  const title = t.source.slice(num.length + 1).replace(/\s*\([^)]*\)\s*$/, '').trim()
  const r = resolutions.find((x) => x.number === num)
  if (!r) fail(`${t.id}: source ${num} is not in the meeting data`)
  else {
    if (r.vote?.adopted !== true) fail(`${t.id}: ${num} was not adopted`)
    if (!norm(r.title).startsWith(norm(title).slice(0, 30))) fail(`${t.id}: ${num} is titled "${r.title}", not "${title}"`)
  }
}

// The account-code pattern accepts the codes the Board's 2026 tables used.
const codes = resolutions.flatMap((r) => (r.funding?.accounts ?? []).map((a) => a.code))
const accepted = codes.filter((c) => ACCOUNT_CODE.test(c)).length
if (codes.length < 100) fail(`only ${codes.length} account codes to test the pattern against`)
if (accepted / codes.length < 0.97) fail(`the account-code pattern accepts only ${accepted} of ${codes.length} codes in the record`)

// Composition: a filled-in donation reads as 2026-883 does.
const d = fromTemplate(TEMPLATES.find((t) => t.id === 'donation'), 2026)
Object.assign(d, {
  mover: 'kern', seconder: 'merrifield', number: '883',
  title: 'Accepts Anonymous Donations for The Recreation Department',
  whereas: ['the Town of Riverhead Recreation Department received anonymous donations in the amount of $1,420.00; and', d.whereas[1], 'WHEREAS, ' + d.whereas[2] + '.'],
  resolved: ['RESOLVED, that the Town of Riverhead hereby accepts the generous anonymous donations of $1,420.00 to the Town of Riverhead Recreation Department', d.resolved[1].replace('[revenue account]', 'Gifts and Donations Account').replace('[expenditure account]', 'Special Events Account')],
  budget: { verb: 'establish', rows: [{ code: 'A01-2705-000-00000-J', name: 'Gifts and Donations', from: 1420, to: null }, { code: 'A01-7-7310-450-000-00000', name: 'Yth Prg – Special Events', from: null, to: 1420 }] },
  copies: ['the Finance Department', 'the Riverhead Recreation Department'],
})
const c = compose(d)
const texts = c.paragraphs.filter((p) => p.kind !== 'table').map((p) => p.text)
const wh = texts.filter((t) => t.startsWith('WHEREAS'))
const re = texts.filter((t) => t.startsWith('RESOLVED'))
if (c.numberLine !== 'TB Resolution 2026-883') fail(`number line reads "${c.numberLine}"`)
if (c.title !== 'ACCEPTS ANONYMOUS DONATIONS FOR THE RECREATION DEPARTMENT') fail(`title reads "${c.title}"`)
if (c.offered !== 'Councilman Kern offered the following resolution, which was seconded by Councilwoman Merrifield') fail(`offered line reads "${c.offered}"`)
if (wh.length !== 3 || !wh[0].endsWith('$1,420.00; and') || !wh[2].endsWith('Riverhead. Now, therefore, be it')) fail(`WHEREAS joining is wrong: ${JSON.stringify(wh)}`)
if (wh.some((t) => /WHEREAS, WHEREAS|; and; and|\.\./.test(t))) fail('a WHEREAS clause repeats what the builder adds')
if (re.length !== 5) fail(`expected 5 RESOLVED clauses (2 own, budget, copies, closing), got ${re.length}`)
if (!re[0].startsWith('RESOLVED, that the Town of Riverhead hereby accepts') || re[0].includes('that that')) fail(`first RESOLVED reads "${re[0]}"`)
if (!re[2].endsWith('budget adjustment:')) fail('the budget clause does not lead into the table')
if (!re[3].endsWith('the Finance Department and the Riverhead Recreation Department; and be it further')) fail(`copies clause reads "${re[3]}"`)
if (!re[4].endsWith('Office of the Town Clerk.')) fail('the closing clause is not last')
const table = c.paragraphs.find((p) => p.kind === 'table')
if (!table || table.fromTotal !== 1420 || table.toTotal !== 1420 || table.after !== 'And be it further') fail('the budget table is wrong')
const checks = checkDraft(d)
if (checks.some((x) => x.level === 'error')) fail(`a complete resolution still has errors: ${checks.filter((x) => x.level === 'error').map((x) => x.text).join(' | ')}`)

// The checks catch what the page says they catch.
const has = (dd, re2) => checkDraft(dd).some((x) => x.level !== 'ok' && re2.test(x.text))
if (!has({ ...d, budget: { verb: 'establish', rows: [{ ...d.budget.rows[0], from: 1000 }, d.budget.rows[1]] } }, /does not balance/)) fail('an unbalanced table is not flagged')
if (!has({ ...d, whereas: ['received $[amount]'] }, /square brackets/)) fail('a blank left in brackets is not flagged')
if (!has({ ...d, budget: { verb: 'ratify', rows: [{ code: 'DA1-9999-000-00000-0', name: 'Appropriated Fund Balance', from: 1420, to: null }, d.budget.rows[1]] } }, /fund balance/)) fail('a fund-balance draw is not flagged')
if (!has({ ...d, whereas: ['the Department received a donation'], resolved: ['accepts the donation of $2,000.00'], budget: d.budget }, /the table moves/)) fail('a clause amount that differs from the table is not flagged')
if (!has({ ...d, seconder: 'kern' }, /cannot both offer and second/)) fail('the same mover and seconder is not flagged')
if (!toPlainText(d).includes('A01-2705-000-00000-J')) fail('the plain text leaves out the budget table')
if (!toWordHtml(d).includes('Times New Roman') || /<script/i.test(toWordHtml({ ...d, title: '<script>x</script>' }))) fail('the Word file is not built safely')

// The built page.
const out = join(root, 'out/resolution-builder/index.html')
if (!existsSync(out)) fail('out/resolution-builder/index.html was not built')
else {
  const html = readFileSync(out, 'utf8')
  for (const s of ['Resolution builder', 'id="res-sheet"', 'Now, therefore, be it', 'Fiscal impact statement helper']) if (!html.includes(s)) fail(`the built page does not show "${s}"`)
  if (/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[a-z]{2,}/.test(html.replace(/@[0-9.]+\//g, ''))) fail('the built page contains an email address')
}

if (!process.exitCode) console.log(`Resolution builder: ${Object.keys(PHRASES).length} fixed phrases and ${sentences} starting-point sentences found in ${packets.length} packets; ${TEMPLATES.length - 1} starting points traced to adopted resolutions; the code pattern accepts ${accepted} of ${codes.length} codes; composition and checks pass.`)
