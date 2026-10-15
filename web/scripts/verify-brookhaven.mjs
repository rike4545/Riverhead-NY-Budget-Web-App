// /brookhaven-2027/ sets Brookhaven's 2027 Tentative beside Riverhead's. The
// Brookhaven figures in lib/brookhaven-2027.ts were read by hand from a scan,
// so this checks them every way the documents allow:
//   - each table's rows add to its printed totals, and each row's columns to
//     each other (the balance columns within the scan's rounding);
//   - the levy summary and the fund-balance table agree fund by fund, and the
//     levy summary's grand total exceeds the table's by the street-lighting
//     district, as the page says;
//   - the 2026 figures are on the saved page of Brookhaven's 2026 budget;
//   - every quotation is in the OCR text of its page, word for word but for
//     what OCR misreads, and every salary figure is in the salary page's;
//   - each mission statement page is one, and the public safety divisions are
//     in the table of contents;
// and holds the built page to the Riverhead records it quotes.

import { existsSync, readFileSync } from 'node:fs'
import { isAbsolute, relative, resolve, sep } from 'node:path'
import {
  BROOKHAVEN_2026_ADOPTED, BROOKHAVEN_BOOK, BROOKHAVEN_FUND_BALANCES as FB, BROOKHAVEN_LEVY as LEVY, BROOKHAVEN_QUOTES,
  BROOKHAVEN_SALARIES as SAL, BROOKHAVEN_SOURCE, BROOKHAVEN_STATED,
} from '../lib/brookhaven-2027.ts'
import { RIVERHEAD_SALARIES_2027 as RS } from '../lib/tentative-salaries.ts'
import { REFUSE_2027 } from '../lib/tax-cap-letter.ts'
import { READ_BY_HAND } from '../lib/tentative-letters.ts'

const root = resolve(process.cwd())
const repo = resolve(root, '..')
const path = (...parts) => {
  const target = resolve(root, ...parts)
  const rel = relative(repo, target)
  if (rel === '..' || rel.startsWith(`..${sep}`) || isAbsolute(rel)) throw new Error(`refusing to read outside ${repo}: ${target}`)
  return target
}
const read = (p) => JSON.parse(readFileSync(path(p), 'utf8'))
const fail = (message) => { console.error(`BROOKHAVEN VERIFY FAILED: ${message}`); process.exitCode = 1 }
const fmt = (n) => n.toLocaleString('en-US')
const usd = (n) => `$${fmt(Math.round(n))}`
const sum = (rows, key) => rows.reduce((s, r) => s + r[key], 0)
// The scan prints its balances rounded to the dollar, so the balance columns
// add to their printed totals within a dollar or two; the rest add exactly.
const ROUNDING = 2

// ── The levy summary (PDF p. 16) ─────────────────────────────────────────────
const LEVY_KEYS = ['appropriations', 'revenues', 'surplus', 'taxes']
const levyRows = [...LEVY.fullTown, ...LEVY.outsideVillages, ...LEVY.special]
for (const r of [...levyRows, LEVY.fullTownTotal, LEVY.outsideVillagesTotal, LEVY.majorTotal, LEVY.specialTotal, LEVY.allTotal]) {
  if (r.revenues + r.surplus + r.taxes !== r.appropriations) fail(`levy summary: ${r.name ?? 'a total'} does not balance (${fmt(r.revenues)} + ${fmt(r.surplus)} + ${fmt(r.taxes)} ≠ ${fmt(r.appropriations)})`)
}
const groups = [[LEVY.fullTown, LEVY.fullTownTotal, 'full town'], [LEVY.outsideVillages, LEVY.outsideVillagesTotal, 'outside villages'], [LEVY.special, LEVY.specialTotal, 'special districts']]
for (const [rows, total, name] of groups) for (const k of LEVY_KEYS) if (sum(rows, k) !== total[k]) fail(`levy summary: the ${name} ${k} add to ${fmt(sum(rows, k))}, not the printed ${fmt(total[k])}`)
for (const k of LEVY_KEYS) {
  if (LEVY.fullTownTotal[k] + LEVY.outsideVillagesTotal[k] !== LEVY.majorTotal[k]) fail(`levy summary: the major districts' ${k} do not add up`)
  if (LEVY.majorTotal[k] + LEVY.specialTotal[k] !== LEVY.allTotal[k]) fail(`levy summary: the grand total's ${k} does not add up`)
}

// ── The fund-balance table (PDF pp. 17–18) ───────────────────────────────────
for (const r of [...FB.major, ...FB.special]) {
  if (r.expenditures - r.revenues !== r.appropriated) fail(`${r.code}: spending less revenues is not the fund balance it appropriates`)
  if (r.start - r.appropriated !== r.end) fail(`${r.code}: the opening balance less what it appropriates is not the closing balance`)
}
const within = (got, want, tol) => Math.abs(got - want) <= tol
for (const [rows, total, name] of [[FB.major, FB.majorTotal, 'major funds'], [FB.special, FB.specialTotal, 'special districts']]) {
  for (const k of ['expenditures', 'revenues', 'appropriated']) if (sum(rows, k) !== total[k]) fail(`fund balances: the ${name}' ${k} add to ${fmt(sum(rows, k))}, not ${fmt(total[k])}`)
  for (const k of ['start', 'end']) if (!within(sum(rows, k), total[k], ROUNDING)) fail(`fund balances: the ${name}' ${k} add to ${fmt(sum(rows, k))}, not ${fmt(total[k])}`)
}
for (const k of ['expenditures', 'revenues', 'appropriated']) if (FB.majorTotal[k] + FB.specialTotal[k] !== FB.grandTotal[k]) fail(`fund balances: the grand total's ${k} does not add up`)
for (const k of ['start', 'end']) if (!within(FB.majorTotal[k] + FB.specialTotal[k], FB.grandTotal[k], ROUNDING)) fail(`fund balances: the grand total's ${k} does not add up`)

// ── The two tables against each other ────────────────────────────────────────
const fb = (code) => FB.major.find((r) => r.code === code)
const lv = (prefix) => levyRows.find((r) => r.name.startsWith(prefix))
const generalFull = sum([lv('General Fund - Full Town'), lv('Parks & Recreation'), lv('Animal Shelter')], 'appropriations')
if (fb('A').expenditures !== generalFull) fail(`the town-wide General Fund's ${fmt(fb('A').expenditures)} is not the levy summary's General Fund, parks and animal shelter (${fmt(generalFull)})`)
for (const [code, prefix] of [['B', 'General Fund - Part Town'], ['DA', 'Highway Fund - Full Town'], ['DB', 'Highway Fund - Part Town'], ['SL', 'Streetlighting'], ['VO', 'Open Space']]) {
  if (fb(code).expenditures !== lv(prefix).appropriations) fail(`${code}: the two tables disagree (${fmt(fb(code).expenditures)} and ${fmt(lv(prefix).appropriations)})`)
}
if (LEVY.majorTotal.appropriations !== FB.majorTotal.expenditures - fb('SR').expenditures - fb('VO').expenditures) fail('the levy summary\'s major districts are not the table\'s major funds less refuse and open space')
const other = lv('Other Special Districts')
if (other.appropriations !== fb('SR').expenditures + FB.specialTotal.expenditures + fb('SL').expenditures) fail('the levy summary\'s other special districts line is not refuse, the special districts and street lighting, so the double count the page describes is not there')
if (LEVY.allTotal.appropriations - FB.grandTotal.expenditures !== fb('SL').expenditures) fail('the levy summary\'s grand total no longer exceeds the table\'s by the street-lighting district')
if (LEVY.allTotal.surplus !== FB.grandTotal.appropriated) fail('the two tables disagree on the fund balance appropriated')

// ── Brookhaven's 2026 Adopted Budget, from the saved page ────────────────────
const excerpts = read('../etl/data/policies/fund-balance-policies.json').documents
const page2026 = excerpts[BROOKHAVEN_2026_ADOPTED.excerpt]?.pages?.[String(BROOKHAVEN_2026_ADOPTED.page)] ?? ''
if (!page2026) fail(`there is no saved page ${BROOKHAVEN_2026_ADOPTED.page} of ${BROOKHAVEN_2026_ADOPTED.excerpt}`)
if (excerpts[BROOKHAVEN_2026_ADOPTED.excerpt]?.url !== BROOKHAVEN_2026_ADOPTED.url) fail('the 2026 budget\'s link is not the saved document\'s')
for (const [code, v] of Object.entries(BROOKHAVEN_2026_ADOPTED.expenditures)) if (!page2026.includes(fmt(v))) fail(`2026 ${code}: ${fmt(v)} is not on the saved page`)
if (sum(Object.values(BROOKHAVEN_2026_ADOPTED.expenditures).map((v) => ({ v })), 'v') !== BROOKHAVEN_2026_ADOPTED.majorTotal || !page2026.includes(fmt(BROOKHAVEN_2026_ADOPTED.majorTotal))) fail('the 2026 major funds do not add to the saved page\'s subtotal')

// ── Quotations and salaries, against the OCR text ────────────────────────────
const ocr = read('../etl/data/brookhaven/2027/ocr-pages.json')
if (ocr.source.sha256 !== BROOKHAVEN_SOURCE.sha256) fail('the OCR text is not from the scan this page cites')
if (ocr.source.pages !== BROOKHAVEN_SOURCE.pages) fail(`the scan has ${ocr.source.pages} pages, not ${BROOKHAVEN_SOURCE.pages}`)
const pageText = (p) => ocr.pages[String(p)]?.text ?? ''
// OCR splits and misreads characters ("Land fill", "S30" for "$30"), so a
// quotation is compared on letters and digits alone, as the closest stretch
// of its page (fewest characters added, dropped or changed), and passes when
// that is within 5% of its length.
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
for (const [key, q] of Object.entries(BROOKHAVEN_QUOTES)) {
  const off = closeness(q.text, pageText(q.page))
  if (off > 0.05) fail(`quotation "${key}": the closest text on PDF p. ${q.page} differs in ${(off * 100).toFixed(0)}% of its characters`)
}
const stated = [
  [BROOKHAVEN_QUOTES.levyCap.text, `${BROOKHAVEN_STATED.levyAdjustmentPct.toFixed(2)}%`],
  [BROOKHAVEN_QUOTES.refuseAmount.text, `$${BROOKHAVEN_STATED.refuseFee.toFixed(2)}`],
  [BROOKHAVEN_QUOTES.refuseAmount.text, `${BROOKHAVEN_STATED.refuseAdjustmentPct.toFixed(1)}%`],
  [BROOKHAVEN_QUOTES.ambulance.text, `${BROOKHAVEN_STATED.ambulanceCutPct.toFixed(2)}%`],
  [BROOKHAVEN_QUOTES.taxShare.text, `${BROOKHAVEN_STATED.taxSharePct.toFixed(2)}%`],
]
for (const [text, figure] of stated) if (!text.includes(figure)) fail(`the stated figure ${figure} is not in its quotation`)
if (SAL.supervisor + SAL.councilMember * SAL.councilSeats + SAL.taxReceiver + SAL.townClerk + SAL.highwaySuperintendent !== SAL.total) fail('the salaries do not add to the printed total')
for (const v of [SAL.supervisor, SAL.councilMember, SAL.taxReceiver, SAL.townClerk, SAL.highwaySuperintendent]) if (!pageText(SAL.page).includes(fmt(v))) fail(`salary ${fmt(v)} is not on PDF p. ${SAL.page}`)

// ── The book: mission statements and the public safety divisions ─────────────
const missions = Object.entries(ocr.pages).filter(([, p]) => /mission statement/i.test(p.text)).map(([n]) => Number(n))
for (const p of BROOKHAVEN_BOOK.missionStatementPages) if (!missions.includes(p)) fail(`PDF p. ${p} has no mission statement in its OCR text`)
for (const p of missions) if (!BROOKHAVEN_BOOK.missionStatementPages.includes(p)) fail(`PDF p. ${p} has a mission statement the page does not count`)
const contents = pageText(BROOKHAVEN_BOOK.publicSafetyContentsPage).toLowerCase()
for (const d of BROOKHAVEN_BOOK.publicSafetyDivisions) if (!BROOKHAVEN_BOOK.publicSafetyFromImage.includes(d) && closeness(d, contents) > 0.15) fail(`"${d}" is not in the table of contents on PDF p. ${BROOKHAVEN_BOOK.publicSafetyContentsPage}`)
const contentsPages = [6, 7, 8, 9, 10].map((p) => pageText(p).toLowerCase()).join('\n')
if (/police/.test(contentsPages)) fail('Brookhaven\'s table of contents now lists police, which the page says its budget has none of')

// ── Riverhead's records ──────────────────────────────────────────────────────
const index = read('public/data/financial-reports/index.json').documents
const tentativeDoc = index.find((d) => d.url === RS.url)
if (!tentativeDoc) fail(`Riverhead's Tentative (${RS.url}) is not in the financial-reports index`)
const rhPages = tentativeDoc ? read(`public/data/financial-reports/${tentativeDoc.json}`).pages : []
const squash = (s) => s.replace(/\s+/g, ' ')
const salaryPage = squash(rhPages[RS.pdfPage - 1]?.text ?? '')
for (const v of [RS.supervisor[2026], RS.supervisor[2027], RS.councilMember[2026], RS.councilMember[2027]]) if (!salaryPage.includes(fmt(v))) fail(`Riverhead salary ${fmt(v)} is not on PDF p. ${RS.pdfPage}`)
if (!salaryPage.includes(RS.supervisorNote)) fail('the Supervisor\'s salary footnote is not on the page word for word')
const rhText = rhPages.map((p) => p.text ?? '').join('\n').toLowerCase()
for (const absent of ['mission statement', 'schedule of positions']) if (rhText.includes(absent)) fail(`Riverhead's Tentative now has "${absent}", which the page says it lacks`)
const stages = read('public/data/history/budget-stages.json')
const t2027 = stages.years['2027']?.tentative
if (t2027?.funds.SR1?.revenues !== REFUSE_2027.tentative2027 || (t2027?.funds.SR1?.levy ?? 0) !== 0) fail('the refuse district is no longer raised entirely by the one property-tax line the page quotes')
for (const year of ['2025', '2026', '2027']) {
  const unreadable = stages.years[year]?.tentative?.message?.unreadablePages ?? []
  if (!unreadable.length || !READ_BY_HAND[year]) fail(`the ${year} letter is not recorded as a scanned image, which the page says it is`)
}

// ── The built page ───────────────────────────────────────────────────────────
const built = 'out/brookhaven-2027/index.html'
if (!existsSync(path(built))) { fail(`${built} was not built`); process.exit() }
const text = readFileSync(path(built), 'utf8')
  .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, ' ')
  .replace(/<!-- -->/g, '')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/\s+/g, ' ')
const has = (s) => text.includes(s)
const onPage = [
  usd(FB.grandTotal.expenditures), usd(LEVY.majorTotal.appropriations), usd(LEVY.majorTotal.taxes), usd(FB.grandTotal.appropriated),
  usd(fb('A').start), usd(fb('A').expenditures), usd(BROOKHAVEN_2026_ADOPTED.expenditures.A), usd(LEVY.allTotal.appropriations), usd(fb('SL').expenditures),
  usd(SAL.supervisor), usd(SAL.councilMember), usd(RS.supervisor[2027]), usd(RS.councilMember[2027]),
  usd(REFUSE_2027.tentative2027), `$${BROOKHAVEN_STATED.refuseFee.toFixed(2)}`,
]
for (const s of onPage) if (!has(s)) fail(`"${s}" is not on the page`)
for (const [key, q] of Object.entries(BROOKHAVEN_QUOTES)) {
  const shown = key === 'caps' ? q.text.charAt(0).toLowerCase() + q.text.slice(1) : q.text
  if (!has(shown)) fail(`quotation "${key}" is not on the page as printed`)
}
if (READ_BY_HAND[2027]?.taxCap && !has(READ_BY_HAND[2027].taxCap)) fail('Riverhead\'s letter on the tax cap is not quoted')
for (const stale of ['Fire Prevention', 'Brookhaven’s budget has none']) if (has(stale)) fail(`the page still says "${stale}"`)

if (!process.exitCode) {
  console.log(`brookhaven: ${levyRows.length} levy rows and ${FB.major.length + FB.special.length} fund-balance rows add to their totals; ${Object.keys(BROOKHAVEN_QUOTES).length} quotations in the OCR text; ${missions.length} mission statements; ${BROOKHAVEN_BOOK.publicSafetyDivisions.length - BROOKHAVEN_BOOK.publicSafetyFromImage.length} of ${BROOKHAVEN_BOOK.publicSafetyDivisions.length} public safety divisions in the OCR contents (${BROOKHAVEN_BOOK.publicSafetyFromImage.join(', ')} read from the image); the page shows ${onPage.length} checked figures`)
}
