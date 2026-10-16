// /southold-2027/ sets Southold's 2027 Tentative beside Riverhead's. The
// Southold figures in lib/southold-2027.ts were read by hand from a scan, so
// this checks them every way the documents allow:
//   - each table's rows against its printed totals, and each row's columns
//     against each other (the fund-balance totals within the scan's rounding);
//   - the Summary against the Tax Statistics pages, the fund-balance page and
//     the General Fund's own pages, and each tax rate against its levy and
//     assessed value;
//   - every quotation against the OCR text of its page, word for word but for
//     what OCR misreads, and every line figure and salary against its page's;
//   - the capital plan's funds against its financing and grand totals;
// and holds the built page to those figures and to the Riverhead records it
// sets beside them.

import { existsSync, readFileSync } from 'node:fs'
import { isAbsolute, relative, resolve, sep } from 'node:path'
import {
  SOUTHOLD_CAPITAL as CAP, SOUTHOLD_FUND_BALANCES as FB, SOUTHOLD_LINES as LINES, SOUTHOLD_QUOTES, SOUTHOLD_SALARIES as SAL,
  SOUTHOLD_SOLID_WASTE, SOUTHOLD_SOURCE, SOUTHOLD_STATED, SOUTHOLD_SUMMARY as SUM, SOUTHOLD_TAX_STATISTICS as TS,
} from '../lib/southold-2027.ts'
import { CARRYOVER_QUOTES, GROWTH_2027 } from '../lib/tax-cap-carryover.ts'
import { REFUSE_2027 } from '../lib/tax-cap-letter.ts'
import { RIVERHEAD_SALARIES_2027 as RS } from '../lib/tentative-salaries.ts'

const root = resolve(process.cwd())
const repo = resolve(root, '..')
const path = (...parts) => {
  const target = resolve(root, ...parts)
  const rel = relative(repo, target)
  if (rel === '..' || rel.startsWith(`..${sep}`) || isAbsolute(rel)) throw new Error(`refusing to read outside ${repo}: ${target}`)
  return target
}
const read = (p) => JSON.parse(readFileSync(path(p), 'utf8'))
const fail = (message) => { console.error(`SOUTHOLD VERIFY FAILED: ${message}`); process.exitCode = 1 }
const fmt = (n) => Math.round(n).toLocaleString('en-US')
const usd = (n) => `${n < 0 ? '−' : ''}$${fmt(Math.abs(n))}`
const sum = (xs) => xs.reduce((s, x) => s + x, 0)
const close = (a, b, tol) => Math.abs(a - b) <= tol

// ── The Summary (PDF p. 5) ───────────────────────────────────────────────────
const KEYS = ['appropriations', 'revenues', 'unexpended', 'tax']
const groups = [['town', SUM.town, SUM.townTotal], ['special districts', SUM.special, SUM.specialTotal], ['park districts', SUM.parks, SUM.parksTotal], ['fire districts', SUM.fire, SUM.fireTotal]]
for (const [name, rows, total] of groups) {
  for (const r of rows) if (r.revenues + r.unexpended + r.tax !== r.appropriations) fail(`Summary: ${r.name} does not balance`)
  for (const k of KEYS) if (sum(rows.map((r) => r[k])) !== total[k]) fail(`Summary: the ${name}' ${k} add to ${fmt(sum(rows.map((r) => r[k])))}, not the printed ${fmt(total[k])}`)
}
for (const k of KEYS) if (sum(groups.map(([, , t]) => t[k])) !== SUM.grandTotal[k]) fail(`Summary: the grand total's ${k} does not add up`)

// ── Tax Statistics (PDF pp. 6–7) ─────────────────────────────────────────────
const FUNDS = ['A', 'B', 'DB', 'SR']
for (const [block, rows] of Object.entries({ appropriations: TS.appropriations, rates: TS.rates, levy: TS.levy, revenues: TS.revenues, fundBalance: TS.fundBalance, assessedValue: TS.assessedValue })) {
  for (const [key, r] of Object.entries(rows)) {
    const tol = block === 'rates' ? 0.0005 : 0.5
    if (!close(r.y2027 - r.y2026, r.change, tol)) fail(`Tax Statistics ${block} ${key}: 2027 less 2026 is not the printed change`)
    if (r.y2026 && !close((r.change / r.y2026) * 100, r.pct, 0.006)) fail(`Tax Statistics ${block} ${key}: the printed percentage is not the change over 2026`)
  }
  if (block !== 'assessedValue') for (const y of ['y2026', 'y2027']) {
    const tol = block === 'rates' ? 0.0015 : 0.5
    if (!close(sum(FUNDS.map((f) => rows[f][y])), rows.total[y], tol)) fail(`Tax Statistics ${block}: the four funds do not add to the total for ${y.slice(1)}`)
  }
}
for (const f of FUNDS) for (const y of ['y2026', 'y2027']) {
  if (TS.levy[f][y] + TS.revenues[f][y] + TS.fundBalance[f][y] !== TS.appropriations[f][y]) fail(`Tax Statistics ${f} ${y.slice(1)}: levy, revenues and savings do not make its appropriations`)
}
const base = { A: TS.assessedValue.wholeTown, B: TS.assessedValue.partTown, DB: TS.assessedValue.partTown, SR: TS.assessedValue.solidWaste }
for (const f of FUNDS) for (const y of ['y2026', 'y2027']) {
  const levy = TS.levy[f][y] - (f === 'A' ? TS.assessedValue.wholeTownProRataReceivables[y] : 0)
  if (!close((levy / base[f][y]) * 1000, TS.rates[f][y], 0.0006)) fail(`Tax Statistics ${f} ${y.slice(1)}: the rate is not the levy over its assessed value`)
}

// ── The Summary against the Tax Statistics and the fund pages ────────────────
const sumRow = (code) => [...SUM.town, ...SUM.special].find((r) => r.code === code)
for (const f of FUNDS) {
  const r = sumRow(f)
  if (r.appropriations !== TS.appropriations[f].y2027 || r.revenues !== TS.revenues[f].y2027 || r.unexpended !== TS.fundBalance[f].y2027 || r.tax !== TS.levy[f].y2027) fail(`${f}: the Summary and the Tax Statistics disagree`)
}
const A = sumRow('A')
if (LINES.spending.tentative2027 !== A.appropriations || LINES.revenues.tentative2027 !== A.appropriations) fail('the General Fund pages\' totals are not the Summary\'s')
if (LINES.propertyTax.tentative2027 !== A.tax || LINES.appropriatedFundBalance.tentative2027 !== A.unexpended) fail('the General Fund pages\' property tax or savings are not the Summary\'s')
if (LINES.spending.budget2026 !== TS.appropriations.A.y2026 || LINES.propertyTax.budget2026 !== TS.levy.A.y2026 || LINES.appropriatedFundBalance.budget2026 !== TS.fundBalance.A.y2026) fail('the General Fund pages\' 2026 budget is not the Tax Statistics\' 2026')
if (SOUTHOLD_SOLID_WASTE.propertyTax2027 !== sumRow('SR').tax) fail('the solid waste district\'s property tax is not the Summary\'s')

// ── Projected Estimated Fund Balances (PDF p. 8) ─────────────────────────────
for (const r of FB.rows) {
  if (r.end2024 + r.increase2025 !== r.end2025) fail(`fund balances ${r.code}: 2024 plus the 2025 increase is not the 2025 balance`)
  if (r.end2025 + r.change2026 !== r.remaining) fail(`fund balances ${r.code}: the 2025 balance plus the 2026 change is not what remains`)
}
for (const k of ['end2024', 'increase2025', 'end2025', 'change2026', 'remaining']) if (!close(sum(FB.rows.map((r) => r[k])), FB.totals[k], 1)) fail(`fund balances: the rows' ${k} do not add to the printed total`)
for (const code of ['CM', 'CM2']) if (FB.rows.find((r) => r.code === code).remaining !== sumRow(code).unexpended) fail(`${code}: what remains at the end of 2026 is not the savings the Summary uses`)
const gfRow = FB.rows.find((r) => r.code === 'A')
if (gfRow.increase2025 !== Math.round(LINES.revenues.actual2025 - LINES.spending.actual2025)) fail('the General Fund\'s 2025 increase is not its 2025 actual revenues less spending')
if (-gfRow.change2026 !== LINES.appropriatedFundBalance.budget2026) fail('the General Fund\'s 2026 change is not the savings its 2026 budget uses')

// ── The capital plan (PDF pp. 81–82) ─────────────────────────────────────────
CAP.years.forEach((year, i) => {
  for (const f of CAP.funds) if (f.appropriations[i] + f.debt[i] + f.parkPlayground[i] !== f.total[i]) fail(`capital plan ${year}: ${f.name} does not add up`)
  for (const k of ['appropriations', 'debt', 'parkPlayground']) if (sum(CAP.funds.map((f) => f[k][i])) !== CAP.financing[k][i]) fail(`capital plan ${year}: the funds' ${k} are not the financing line`)
  if (sum(CAP.funds.map((f) => f.total[i])) !== CAP.grandTotal[i] || CAP.financing.appropriations[i] + CAP.financing.debt[i] + CAP.financing.parkPlayground[i] !== CAP.grandTotal[i]) fail(`capital plan ${year}: the grand total does not add up`)
})
if (CAP.financing.appropriations[0] - CAP.funds.find((f) => f.name.startsWith('General')).appropriations[0] < 0) fail('capital plan: the General Fund\'s share is more than the year\'s appropriations')

// ── Quotations, line figures and salaries, against the OCR text ──────────────
const ocr = read('../etl/data/southold/2027/ocr-pages.json')
if (ocr.source.sha256 !== SOUTHOLD_SOURCE.sha256) fail('the OCR text is not from the scan this page cites')
if (ocr.source.pages !== SOUTHOLD_SOURCE.pages) fail(`the scan has ${ocr.source.pages} pages, not ${SOUTHOLD_SOURCE.pages}`)
const pageText = (p) => ocr.pages[String(p)]?.text ?? ''
// OCR misreads characters ("|" for "I"), so a quotation is compared on letters
// and digits alone, as the closest stretch of its page, and passes within 5%.
const letters = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, '')
function closeness(quote, text) {
  const a = letters(quote)
  const b = letters(text)
  let prev = new Array(b.length + 1).fill(0)
  for (let i = 1; i <= a.length; i++) {
    const cur = new Array(b.length + 1)
    cur[0] = i
    for (let j = 1; j <= b.length; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
    prev = cur
  }
  return Math.min(...prev) / a.length
}
for (const [key, q] of Object.entries(SOUTHOLD_QUOTES)) {
  const off = closeness(q.text, pageText(q.page))
  if (off > 0.05) fail(`quotation "${key}": the closest text on PDF p. ${q.page} differs in ${(off * 100).toFixed(0)}% of its characters`)
}
if (!SOUTHOLD_QUOTES.staff.text.includes(`${SOUTHOLD_STATED.fullTime} full-time`) || !SOUTHOLD_QUOTES.staff.text.includes(`${SOUTHOLD_STATED.partTime} part-time`)) fail('the staff counts are not in their quotation')
// A figure as the scan prints it: thousands groups OCR may split with a space
// or misread as another mark ("46,172'172", "47,340!762"), and cents where the
// fund pages print them.
const SEP = "[,.'!/:]?\\s?"
const figure = (n) => {
  const [whole, cents] = n.toFixed(2).split('.')
  const groups = Number(whole).toLocaleString('en-US').split(',')
  return new RegExp(`(^|[^\\d])${groups.join(SEP)}(?:[.,:!'/]\\s?${cents})${cents === '00' ? '?' : ''}(?!\\d)`)
}
const onPage = (n, p) => figure(n).test(pageText(p))
for (const [key, l] of Object.entries(LINES)) {
  for (const col of ['actual2025', 'budget2026', 'revised2026', 'tentative2027']) {
    if (l[col] === 0) continue
    if (!onPage(l[col], l.page)) fail(`line "${key}": ${l[col]} (${col}) is not on PDF p. ${l.page}`)
  }
}
for (const v of [SAL.supervisor, SAL.boardMember, SAL.fishersIslandJusticeMember, SAL.townJustice, SAL.townClerk, SAL.highwaySuperintendent, SAL.taxReceiver, SAL.assessor, SAL.trustee]) {
  if (!onPage(v, SAL.page)) fail(`salary ${fmt(v)} is not on PDF p. ${SAL.page}`)
}
for (const [k, r] of Object.entries(TS.levy)) if (!onPage(r.y2027, 6)) fail(`Tax Statistics levy ${k} 2027 (${fmt(r.y2027)}) is not on PDF p. 6`)
for (const r of FB.rows) for (const k of ['end2024', 'end2025', 'remaining']) if (!onPage(r[k], FB.page)) fail(`fund balances ${r.code} ${k} is not on PDF p. ${FB.page}`)
if (!/Village of Greenport/.test(pageText(SOUTHOLD_SOURCE.certificationPage)) || !/30th day of September, 2026/.test(pageText(SOUTHOLD_SOURCE.certificationPage))) fail('the certification page no longer names Greenport or the date received')
// The OCR drops the financing rows' debt figures; those were read from the page image.
for (const p of CAP.pages) if (!onPage(CAP.grandTotal[0], p)) fail(`the capital plan's 2027 grand total is not on PDF p. ${p}`)

// ── Riverhead's records ──────────────────────────────────────────────────────
const stages = read('public/data/history/budget-stages.json')
const t2027 = stages.years['2027'].tentative
const a2026 = stages.years['2026'].adopted
const lines = read('public/data/budget-supplement/current-lines.json').lines
const department = lines.filter((l) => l.fund === 'A01' && l.kind === 'expenditure' && l.account.split('-')[2] === '3120')
const deptTotal = (k) => sum(department.map((l) => l[k] ?? 0))
if (lines.some((l) => l.fund === 'A01' && l.kind === 'expenditure' && l.account.split('-')[2] === '3020')) fail('Riverhead\'s Supplement now has a public safety communications line, which the page says it lacks')
if (Object.values(t2027.funds).some((f) => /fire/i.test(f.name))) fail('Riverhead\'s Summary now lists a fire district, which the page says it does not')
if (Object.keys(t2027.funds).some((c) => /^B|^DB/.test(c))) fail('Riverhead\'s budget now has part-town funds, which the page says it does not')
if (t2027.funds.SR1?.revenues !== REFUSE_2027.tentative2027 || (t2027.funds.SR1?.levy ?? 0) !== 0) fail('the refuse district is no longer raised entirely by the one property-tax line the page quotes')
const pep = read('public/data/census-pep.json')
const residents = (name) => pep.towns.find((t) => t.name === name)?.estimates[String(pep.vintage)]
const sRes = residents('Southold town')
const rRes = residents('Riverhead town')
if (!sRes || !rRes) fail(`the Census file has no ${pep.vintage} figure for Southold or Riverhead`)

// ── The built page ───────────────────────────────────────────────────────────
const built = 'out/southold-2027/index.html'
if (!existsSync(path(built))) { fail(`${built} was not built`); process.exit() }
const text = readFileSync(path(built), 'utf8')
  .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, ' ')
  .replace(/<!-- -->/g, '')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/\s+/g, ' ')
const has = (s) => text.includes(s)
const pct = (n, d = 1) => `${n.toFixed(d)}%`
const rhTW = t2027.townWide
const expected = [
  usd(TS.appropriations.total.y2027), usd(TS.levy.total.y2027), pct(TS.levy.total.pct, 2), usd(A.appropriations), usd(A.unexpended),
  pct((A.unexpended / A.appropriations) * 100), usd(gfRow.remaining), pct((gfRow.remaining / A.appropriations) * 100), usd(gfRow.increase2025),
  usd(LINES.police.tentative2027), usd(LINES.police.budget2026), usd(LINES.communications.tentative2027), usd(LINES.policeFireRetirement.tentative2027),
  usd(LINES.interest.tentative2027), usd(LINES.interest.actual2025), usd(LINES.mortgageTax.actual2025), usd(LINES.salesTax.tentative2027),
  usd(sumRow('SR').appropriations), usd(sumRow('SR').revenues), usd(sumRow('SR').tax), usd(CAP.grandTotal[0]), usd(CAP.financing.debt[0]),
  usd(SAL.supervisor), usd(SAL.boardMember), usd(SUM.fireTotal.appropriations), usd(SUM.grandTotal.appropriations),
  usd(rhTW.levy), pct(((rhTW.levy - rhTW.priorLevy) / rhTW.priorLevy) * 100, 2), usd(t2027.funds.A01.appropriations), usd(t2027.funds.A01.fundBalance),
  usd(deptTotal('tentative')), usd(deptTotal('adopted')), usd(REFUSE_2027.tentative2027), usd(RS.supervisor[2027]), usd(RS.councilMember[2027]),
  fmt(sRes ?? 0), fmt(rRes ?? 0), usd(TS.levy.total.y2027 / (sRes ?? 1)), usd(rhTW.levy / (rRes ?? 1)), usd(LINES.police.tentative2027 / (sRes ?? 1)), usd(deptTotal('tentative') / (rRes ?? 1)),
  pct((GROWTH_2027.allowable * GROWTH_2027.taxBase.southold - 1) * 100, 2), pct((GROWTH_2027.allowable * GROWTH_2027.taxBase.riverhead - 1) * 100, 2),
  pct((GROWTH_2027.allowable * GROWTH_2027.taxBase.brookhaven - 1) * 100, 2), CARRYOVER_QUOTES.userFees.text,
]
for (const s of expected) if (!has(s)) fail(`"${s}" is not on the page`)
// The at-a-glance table on its own, so a figure changed there is caught even where the prose repeats it.
const raw = readFileSync(path(built), 'utf8')
const gi = raw.indexOf('data-glance')
const glance = gi === -1 ? '' : raw.slice(gi, raw.indexOf('</figure>', gi)).replace(/<!-- -->/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')
if (!glance) fail('the page has no at-a-glance table')
for (const s of [
  usd(TS.appropriations.total.y2027), usd(TS.levy.total.y2027), usd(A.appropriations), usd(A.unexpended), usd(gfRow.remaining),
  usd(LINES.police.tentative2027), usd(LINES.policeFireRetirement.tentative2027), usd(sumRow('SR').appropriations), usd(CAP.grandTotal[0]), usd(CAP.financing.debt[0]),
  usd(SAL.supervisor), usd(SAL.boardMember), usd(rhTW.levy), usd(t2027.funds.A01.appropriations), usd(deptTotal('tentative')), usd(REFUSE_2027.tentative2027),
]) if (glance && !glance.includes(s)) fail(`the at-a-glance table does not show ${s}`)
for (const [key, q] of Object.entries(SOUTHOLD_QUOTES)) if (['strong', 'costs', 'lawsuits', 'resident', 'size'].includes(key) ? false : !has(q.text)) fail(`quotation "${key}" is not on the page as printed`)
if (a2026.funds.A01.fundBalance === undefined) fail('the 2026 adopted General Fund has no savings figure')

if (!process.exitCode) {
  console.log(`southold: the Summary's ${SUM.town.length + SUM.special.length + SUM.parks.length + SUM.fire.length} rows, the Tax Statistics, ${FB.rows.length} fund balances and the capital plan add to their totals and agree with each other; ${Object.keys(SOUTHOLD_QUOTES).length} quotations and ${Object.keys(LINES).length} lines in the OCR text; the page shows ${expected.length} checked figures (${fmt(sRes ?? 0)} and ${fmt(rRes ?? 0)} residents)`)
}
