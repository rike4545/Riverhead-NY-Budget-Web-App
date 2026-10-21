// /payroll/'s "Raises 2026 → 2027" section. Its CSEA terms must be the ones the
// 2027 projection uses (etl/predict_2027.py), its elected officials' salaries
// the ones the budget-hearing notice prints, and the built page must show the
// figures lib/raises-2027.ts works out from the authorized salaries and payroll.

import { existsSync, readFileSync } from 'node:fs'
import { isAbsolute, relative, resolve, sep } from 'node:path'
import { CSEA_2027, ELECTED_2027, cseaFloor, raises2027 } from '../lib/raises-2027.ts'

const root = resolve(process.cwd())
const repo = resolve(root, '..')
const path = (...parts) => {
  const target = resolve(root, ...parts)
  const rel = relative(repo, target)
  if (rel === '..' || rel.startsWith(`..${sep}`) || isAbsolute(rel)) throw new Error(`refusing to read outside ${repo}: ${target}`)
  return target
}
const fail = (message) => { console.error(`RAISES 2027 VERIFY FAILED: ${message}`); process.exitCode = 1 }
const money = (n) => `$${Math.round(n).toLocaleString('en-US')}`

// The contract terms, as the projection carries them.
const predict = readFileSync(path('../etl/predict_2027.py'), 'utf8')
const terms = /2027:\s*\{"pctStep":\s*([\d.]+),\s*"flatAdj":\s*(\d+)\}/.exec(predict)
if (!terms) fail('etl/predict_2027.py no longer gives the CSEA 2027 terms')
else if (Number(terms[1]) !== CSEA_2027.pct || Number(terms[2]) !== CSEA_2027.flat) fail(`the page uses ${CSEA_2027.pct} + $${CSEA_2027.flat}, the projection ${terms[1]} + $${terms[2]}`)
if (cseaFloor(50_000) !== 52_250) fail('the CSEA increase on $50,000 should be $52,250')
const dec16 = readFileSync(path('../etl/data/meetings/2025-12-16-minutes.txt'), 'utf8')
if (!/2025-1001 Approves CSEA 2026-2029 Contract/.test(dec16)) fail('Resolution 2025-1001 no longer approves the CSEA 2026-2029 contract')

// The elected officials' salaries, as the hearing notice prints them.
const notice = readFileSync(path('../etl/data/meetings/2026-10-06-vote-packet.txt'), 'utf8').replace(/\s+/g, ' ')
const table = notice.slice(notice.indexOf("ELECTED OFFICIALS' SALARIES"), notice.indexOf('PLEASE TAKE FURTHER NOTICE, that a copy of the Preliminary Budget'))
const fmt = (n) => n.toLocaleString('en-US')
for (const e of ELECTED_2027.rows) {
  if (!new RegExp(`\\$ ${fmt(e.y2026).replace(',', ',')} \\$ ${fmt(e.y2027)}`).test(table)) fail(`the notice does not print ${e.position} at $${fmt(e.y2026)} and $${fmt(e.y2027)}`)
}
const printed = (table.match(/\$ [\d,]+ \$ [\d,]+/g) ?? []).length
if (printed !== ELECTED_2027.rows.length) fail(`the notice lists ${printed} salaries, the page ${ELECTED_2027.rows.length}`)
if (!/reduced his actual salary to \$110,000/.test(table)) fail('the notice no longer notes the Supervisor’s reduced salary')

// The page.
const authorized = JSON.parse(readFileSync(path('public/data/salary/authorized-2026.json'), 'utf8')).records
const payroll = JSON.parse(readFileSync(path('public/data/payroll/records.json'), 'utf8')).records
const r = raises2027(authorized, payroll)
if (r.csea.length < 100) fail(`only ${r.csea.length} CSEA members matched to the payroll; the name match has broken`)
if (r.cseaPctRange && r.cseaPctRange[1] > 6) fail(`a CSEA raise of ${r.cseaPctRange[1].toFixed(1)}% means a stipend or part-time rate got the flat $1,000`)
const built = 'out/payroll/index.html'
if (!existsSync(path(built))) fail(`${built} was not built`)
else {
  const html = readFileSync(path(built), 'utf8')
  const i = html.indexOf('data-raises-2027')
  const text = i === -1 ? '' : html.slice(i).replace(/<!-- -->/g, '').replace(/<[^>]+>/g, ' ').replace(/&#x27;/g, "'").replace(/&amp;/g, '&').replace(/\s+/g, ' ')
  if (!text) fail('/payroll/ has no 2027 raises section')
  for (const s of [money(r.cseaTotal), `${r.csea.length}`, `${r.pba} PBA, ${r.soa} SOA`, ...ELECTED_2027.rows.map((e) => money(e.y2027)), 'No one’s 2027 salary is official yet']) {
    if (text && !text.includes(s)) fail(`the 2027 raises section does not show ${s}`)
  }
  for (const c of r.csea) if (text && !text.includes(c.name)) fail(`the CSEA list leaves out ${c.name}`)
}

if (!process.exitCode) console.log(`Raises 2027 verification passed: ${r.csea.length} CSEA members at 2.5% + $1,000 (${money(r.cseaTotal)}), ${ELECTED_2027.rows.length} elected salaries unchanged as noticed.`)
