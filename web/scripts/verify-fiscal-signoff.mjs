// The sign-off read (sections H to M of each Fiscal Impact Statement) and the
// "Who checked the forms" section on /fiscal-impact/:
// - every meeting's summary counts match its own resolutions;
// - nearly every statement had a sign-off block to read, so a parser that
//   stops finding them fails here instead of reporting 0% signed;
// - three statements match the kept packet text: the payouts form (IX.2,
//   2026-996) is dated by both, the two police forms (2026-1020, 2026-1021)
//   by neither;
// - the built page shows the year's figures as lib/fiscal-signoff.ts computes them.
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { signoffReport } from '../lib/fiscal-signoff.ts'

const root = process.cwd()
const fail = (m) => { console.error(`FISCAL SIGNOFF VERIFY FAILED: ${m}`); process.exitCode = 1 }
const dir = join(root, 'public/data/meetings')
const dates = JSON.parse(readFileSync(join(dir, 'fiscal-index.json'), 'utf8')).meetings
const meetings = dates.map((d) => JSON.parse(readFileSync(join(dir, `${d}-fiscal.json`), 'utf8')))

for (const m of meetings) {
  const rs = m.resolutions
  const read = rs.filter((r) => r.signoff)
  const s = m.summary
  if (s.signoffRead !== read.length) fail(`${m.meetingDate}: summary.signoffRead ${s.signoffRead}, resolutions ${read.length}`)
  if (s.accountingDated !== read.filter((r) => r.signoff.accountingDated).length) fail(`${m.meetingDate}: summary.accountingDated does not match its resolutions`)
  if (s.preparerDated !== read.filter((r) => r.signoff.preparerDated).length) fail(`${m.meetingDate}: summary.preparerDated does not match its resolutions`)
  if (read.length < 0.9 * rs.length) fail(`${m.meetingDate}: only ${read.length} of ${rs.length} statements had a sign-off block read; the packet layout may have changed`)
}

// Against the kept packet text for November 17, 2026.
const excerpt = readFileSync(join(root, '../etl/data/meetings/2026-11-17-police-stipulations-excerpt.txt'), 'utf8')
const page = (n) => (excerpt.split(`===== Packet page ${n} =====`)[1] ?? '').split('===== Packet page')[0]
const nov17 = meetings.find((m) => m.meetingDate === '2026-11-17')
const anchors = [['2026-996', 25], ['2026-1020', 203], ['2026-1021', 207]]
for (const [num, pg] of anchors) {
  const r = nov17?.resolutions.find((x) => x.number === num)
  if (!r?.signoff) { fail(`${num}: no sign-off read`); continue }
  // In -layout text the accounting date sits on the line under "K. ... L. ... M. Date".
  const block = page(pg)
  const acct = /\d{1,2}\/\d{1,2}\/\d{4}/.test(block.split('K. Accounting Staff')[1] ?? '')
  const prep = /\d{1,2}\/\d{1,2}\/\d{4}/.test((block.split('H. Typed Name')[1] ?? '').split('K. Accounting Staff')[0])
  if (r.signoff.accountingDated !== acct) fail(`${num}: accountingDated ${r.signoff.accountingDated}, packet page ${pg} says ${acct}`)
  if (r.signoff.preparerDated !== prep) fail(`${num}: preparerDated ${r.signoff.preparerDated}, packet page ${pg} says ${prep}`)
}


// The built page.
const rep = signoffReport(meetings)
const html = join(root, 'out/fiscal-impact/index.html')
if (!existsSync(html)) fail('out/fiscal-impact/index.html was not built')
else {
  const text = readFileSync(html, 'utf8').replace(/<!-- -->/g, '')
  const of = (k, n) => `${k.toLocaleString('en-US')} of ${n.toLocaleString('en-US')}`
  for (const s of ['Who checked the forms', 'data-fiscal-signoff', of(rep.accountingDated, rep.read), of(rep.overall.signedWrong, rep.overall.signed), of(rep.overall.unsignedWrong, rep.overall.unsigned)]) {
    if (!text.includes(s)) fail(`/fiscal-impact/ does not show "${s}"`)
  }
}

if (!process.exitCode) {
  const o = rep.overall
  console.log(`Fiscal sign-off: ${rep.read} of ${rep.statements} statements read; Accounting dated ${rep.accountingDated}; understated ${o.signedWrong}/${o.signed} signed vs ${o.unsignedWrong}/${o.unsigned} unsigned; 3 packet anchors match.`)
}
