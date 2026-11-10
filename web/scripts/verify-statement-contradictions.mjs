// "Statements that contradict themselves" on /fiscal-impact/
// (lib/statement-contradictions.ts).
// - every listed statement is an adopted resolution of the year;
// - each "absorbed but fund balance" statement's own section G text names a
//   9999 fund-balance account or fund balance, and each "no impact" one names
//   an account;
// - where the meeting's agenda packet is on file, the packet itself shows the
//   contradiction: D answered as stated, E(a) initialed, and fund balance in
//   section G;
// - the built page carries the section and the total.
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { statementContradictions } from '../lib/statement-contradictions.ts'

const root = process.cwd()
const fail = (m) => { console.error(`STATEMENT CONTRADICTIONS VERIFY FAILED: ${m}`); process.exitCode = 1 }
const read = (p) => JSON.parse(readFileSync(join(root, p), 'utf8'))
const meetings = read('public/data/meetings/fiscal-index.json').meetings.map((s) => read(`public/data/meetings/${s}-fiscal.json`))
const year = Number([...meetings.map((m) => m.meetingDate)].sort().slice(-1)[0].slice(0, 4))
const c = statementContradictions(meetings, year)

if (c.all.length === 0) fail('no contradictions found; the data or the rules have changed')
let packetChecked = 0
for (const x of c.all) {
  const m = meetings.find((mm) => mm.meetingDate === x.date)
  const r = m?.resolutions.find((rr) => rr.number === x.number)
  if (!r || r.vote?.adopted !== true) { fail(`${x.number} is not an adopted resolution of ${x.date}`); continue }
  const g = r.funding?.sourceText ?? ''
  if (x.kinds.includes('absorbed-fund-balance')) {
    if (r.townTreatment !== 'absorbed') fail(`${x.number} is not marked absorbed`)
    if (!/9999|fund balance/i.test(g)) fail(`${x.number}'s section G does not name fund balance: "${g.slice(0, 60)}"`)
  }
  if (x.kinds.includes('no-impact-funded')) {
    if (r.townFiscalImpact !== 'No') fail(`${x.number} does not answer No`)
    if (!/[A-Z]{1,3}\d{1,2}-\d/.test(g)) fail(`${x.number}'s section G names no account: "${g.slice(0, 60)}"`)
  }
  if (x.kinds.includes('table-mismatch') && !(r.statementBelowTable && r.statementBelowTable.statement < r.statementBelowTable.table)) fail(`${x.number} has no smaller section G amount`)
  const packet = join(root, `../etl/data/meetings/${x.date}-vote-packet.txt`)
  if (!existsSync(packet)) continue
  const t = readFileSync(packet, 'utf8')
  let block = null
  for (const hit of t.matchAll(new RegExp(`Resolution\\s+${x.number.replace('-', '\\-')}\\b`, 'g'))) {
    const j = t.indexOf('FISCAL IMPACT STATEMENT', hit.index)
    const k = t.indexOf('FISCAL IMPACT STATEMENT', j + 10)
    const b = t.slice(j, k > 0 ? k : j + 4000)
    if (j >= 0 && b.includes('Proposed Source of Funding')) { block = b; break }
  }
  if (!block) continue
  packetChecked++
  const d = block.match(/Fiscal Impact:\s*(Yes|No)/)?.[1]
  const initials = /\(a\)\s*\nDetail\/Initials:\s*[A-Za-z]/.test(block)
  const gText = block.slice(block.indexOf('Proposed Source of Funding'), block.indexOf('H. Typed'))
  if (x.kinds.includes('absorbed-fund-balance') && (!initials || !/9999|Fund\s*Balance/i.test(gText))) fail(`${x.number}: the packet does not show E(a) initialed with fund balance in section G`)
  if (x.kinds.includes('no-impact-funded') && d !== 'No') fail(`${x.number}: the packet answers D "${d}", not No`)
}

const page = join(root, 'out/fiscal-impact/index.html')
if (!existsSync(page)) fail('out/fiscal-impact/index.html was not built')
else {
  const html = readFileSync(page, 'utf8')
  if (!html.includes('data-statement-contradictions')) fail('the page lacks the contradictions section')
  for (const x of c.all) if (!html.includes(x.number)) fail(`the page does not list ${x.number}`)
}

if (!process.exitCode) console.log(`statement contradictions: ${c.all.length} of ${c.adopted} adopted ${year} statements (${c.tableMismatch.length} table mismatch, ${c.absorbedFundBalance.length} absorbed but fund balance, ${c.noImpactFunded.length} no impact but funded), each confirmed in its section G text, ${packetChecked} also in the packet on file.`)
