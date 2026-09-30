// The allowance on /fringe-benefits/ is read out of the Town's payroll reports
// and quoted from Town Board records, and lib/fringe-benefits.ts types both in.
// This checks them:
//
// 1. Recomputes, from etl/data/payroll/gross-earnings-*.csv, how many people
//    were paid each year's elected, Supervisor and manager sums, and who they
//    were in the latest year.
// 2. Checks every year against the rule the contracts state: last year's sum
//    raised by New York-area CPI-U inflation for the year before, rounded to a
//    hundredth of a percent, using the BLS values kept in
//    etl/data/fringe/allowance-sources.json.
// 3. Checks every quoted phrase against the passage it comes from, kept in the
//    same file, and that the Recreation Superintendent contract adopted in July
//    2026 has none of the clause its draft carried.
// 4. Checks the budget-line comparison against the Budget Supplement's line
//    history, and that the built page shows the findings.

import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  ALLOWANCE, NY_CPI, RECIPIENTS_2025, TIMELINE, RECREATION_2026, TOWN_BOARD_2025, COUNCIL_SALARY_FLAT,
  CONTRACT_2009, JUSTICE_SICK_BUYBACK_2025, LATEST, FIRST, ESTIMATE_2026, allowanceTotal, allowanceTotalAllYears, contract2009Carried,
  ruleRaise, townBoardPayrollLessBuyouts, townBoardWithoutAllowance,
} from '../lib/fringe-benefits.ts'

const root = process.cwd()
const path = (...parts) => join(root, ...parts)
const repo = (...parts) => join(root, '..', ...parts)
const fail = (message) => { console.error(`FRINGE VERIFY FAILED: ${message}`); process.exitCode = 1 }
const near = (a, b, tol = 0.02) => Math.abs(a - b) <= tol + 1e-9
const cents = (n) => Math.round(n * 100) / 100
const usd = (n) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD' })

// ── 1. The payroll ───────────────────────────────────────────────────────────
function parseCsv(text) {
  const rows = []
  let row = []; let field = ''; let quoted = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++ } else if (c === '"') quoted = false
      else field += c
    } else if (c === '"') quoted = true
    else if (c === ',') { row.push(field); field = '' }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = '' }
    else if (c !== '\r') field += c
  }
  if (field || row.length) { row.push(field); rows.push(row) }
  const [header, ...body] = rows
  return body.filter((r) => r.length === header.length).map((r) => Object.fromEntries(header.map((h, i) => [h, r[i]])))
}
const num = (x) => { const n = Number(x); return Number.isFinite(n) ? n : 0 }
const payroll = (year) => parseCsv(readFileSync(repo(`etl/data/payroll/gross-earnings-${year}.csv`), 'utf8'))

// What is left of gross pay after base pay, overtime, longevity, holiday pay,
// buyouts and retroactive pay. The allowance is paid under codes the parser
// files as "stipend" for some people and leaves unfiled for others, and split
// across both for one, so all three are tried.
function allowanceTag(r, y) {
  const extra = cents(num(r.gross) - num(r.regular) - num(r.overtime) - num(r.longevity) - num(r.holiday) - num(r.buyout) - num(r.retro))
  const stipend = num(r.stipend)
  const candidates = [cents(extra - stipend), stipend, extra]
  for (const [tag, amount] of [['elected', y.elected], ['supervisor', y.supervisor], ['manager', y.manager]]) {
    if (candidates.some((v) => near(v, amount))) return tag
  }
  return null
}

const paidIn = {}
for (const y of ALLOWANCE) {
  const rows = payroll(y.year)
  const paid = { elected: [], supervisor: [], manager: [] }
  for (const r of rows) { const tag = allowanceTag(r, y); if (tag) paid[tag].push(r) }
  paidIn[y.year] = paid
  if (paid.elected.length !== y.electedPaid) fail(`${y.year}: ${paid.elected.length} people were paid the elected officials’ ${usd(y.elected)}, not ${y.electedPaid}`)
  if (paid.supervisor.length !== 1) fail(`${y.year}: ${paid.supervisor.length} people were paid the Supervisor’s ${usd(y.supervisor)}, not one`)
  if (paid.manager.length !== y.managersPaid) fail(`${y.year}: ${paid.manager.length} people were paid the managers’ ${usd(y.manager)}, not ${y.managersPaid}`)
  // The Supervisor's sum is one and two-thirds of the others' every year.
  if (!near(y.supervisor, y.elected * 5 / 3)) fail(`${y.year}: the Supervisor’s ${usd(y.supervisor)} is not 5/3 of ${usd(y.elected)}`)
}

// Everyone the page names for the latest year, and no one else.
const latestPaid = paidIn[LATEST.year]
for (const group of ['elected', 'supervisor', 'manager']) {
  const named = RECIPIENTS_2025.filter((r) => r.group === group).map((r) => r.payrollName).sort()
  const paid = latestPaid[group].map((r) => r.name).sort()
  if (JSON.stringify(named) !== JSON.stringify(paid)) fail(`${LATEST.year} ${group} recipients: the page names ${named.join('; ')}; the payroll pays ${paid.join('; ')}`)
}

// A Council Member's salary stayed flat while the allowance rose.
{
  const first = paidIn[COUNCIL_SALARY_FLAT.from].elected.filter((r) => num(r.regular) === COUNCIL_SALARY_FLAT.salary)
  if (first.length === 0) fail(`no official paid the allowance in ${COUNCIL_SALARY_FLAT.from} had a ${usd(COUNCIL_SALARY_FLAT.salary)} salary`)
  const council = paidIn[COUNCIL_SALARY_FLAT.to].elected.filter((r) => r.title === 'Council Member')
  if (council.length === 0) fail(`no Council Member was paid the allowance in ${COUNCIL_SALARY_FLAT.to}`)
  for (const r of council) if (num(r.regular) !== COUNCIL_SALARY_FLAT.salary) fail(`${r.name}’s ${COUNCIL_SALARY_FLAT.to} salary is ${usd(num(r.regular))}, not ${usd(COUNCIL_SALARY_FLAT.salary)}`)
}

// The Town Board's payroll, set against its budget line.
{
  const rows = payroll(2025).filter((r) => r.department === 'Town Board Elected')
  const gross = cents(rows.reduce((s, r) => s + num(r.gross), 0))
  const buyouts = cents(rows.reduce((s, r) => s + num(r.buyout), 0))
  if (!near(gross, TOWN_BOARD_2025.payrollGross, 0.01)) fail(`the Town Board’s 2025 payroll is ${usd(gross)}, not ${usd(TOWN_BOARD_2025.payrollGross)}`)
  if (!near(buyouts, TOWN_BOARD_2025.payrollBuyouts, 0.01)) fail(`the Town Board’s 2025 buyouts are ${usd(buyouts)}, not ${usd(TOWN_BOARD_2025.payrollBuyouts)}`)
  const council = rows.filter((r) => r.title === 'Council Member' && allowanceTag(r, LATEST) === 'elected')
  if (council.length !== TOWN_BOARD_2025.councilAllowances) fail(`${council.length} Council Members were paid the 2025 allowance, not ${TOWN_BOARD_2025.councilAllowances}`)
  const history = JSON.parse(readFileSync(path('public/data/budget-supplement/line-history.json'), 'utf8')).accounts
  const actual = (prefix) => history.find((a) => a.account.startsWith(prefix))?.actual?.['2025']
  if (actual(TOWN_BOARD_2025.account) !== TOWN_BOARD_2025.personalServicesActual) fail(`${TOWN_BOARD_2025.account}’s 2025 actual is ${actual(TOWN_BOARD_2025.account)}, not ${TOWN_BOARD_2025.personalServicesActual}`)
  if (actual(TOWN_BOARD_2025.buyoutAccount) !== TOWN_BOARD_2025.buyoutActual) fail(`${TOWN_BOARD_2025.buyoutAccount}’s 2025 actual is ${actual(TOWN_BOARD_2025.buyoutAccount)}, not ${TOWN_BOARD_2025.buyoutActual}`)
  const withGap = Math.abs(TOWN_BOARD_2025.personalServicesActual - townBoardPayrollLessBuyouts)
  const withoutGap = Math.abs(TOWN_BOARD_2025.personalServicesActual - townBoardWithoutAllowance)
  if (!(withGap < 2000 && withoutGap > 10 * withGap)) fail(`the Town Board line no longer matches its payroll with the allowance in it (gaps ${usd(withGap)} with, ${usd(withoutGap)} without)`)
  // The page says the Justice Court's sick-buyback line spent less than one judge's allowance.
  const sick = actual('A01-1-1110-152')
  if (sick !== JUSTICE_SICK_BUYBACK_2025) fail(`the Justice Court sick-buyback line spent ${usd(sick)} in 2025, not ${usd(JUSTICE_SICK_BUYBACK_2025)}`)
  if (!(JUSTICE_SICK_BUYBACK_2025 < LATEST.elected)) fail(`the Justice Court sick-buyback line spent ${usd(JUSTICE_SICK_BUYBACK_2025)}, not less than one judge’s allowance`)
  // And that no budget line is named for the allowance.
  const named = history.filter((a) => /annuit|deferred\s*comp|def\s*comp|life\s*ins/i.test(a.name))
  if (named.length) fail(`budget lines now name the allowance: ${named.map((a) => `${a.account} ${a.name}`).join('; ')}`)
}

// Resolution 2019-37's Chief of Staff: paid the managers' sum in 2019, not 2018.
{
  const name = 'Marafino, John C.'
  if (!paidIn[2019].manager.some((r) => r.name === name)) fail(`${name} was not paid the managers’ sum in 2019`)
  if (Object.values(paidIn[2018]).flat().some((r) => r.name === name)) fail(`${name} was already paid the allowance in 2018`)
}

// ── 2. The inflation rule ────────────────────────────────────────────────────
const sources = JSON.parse(readFileSync(repo('etl/data/fringe/allowance-sources.json'), 'utf8'))
for (const [year, value] of Object.entries(sources.cpi.annualAverage)) {
  if (NY_CPI[year] !== value) fail(`NY_CPI[${year}] is ${NY_CPI[year]}; BLS publishes ${value}`)
}
for (let i = 1; i < ALLOWANCE.length; i++) {
  const [prev, y] = [ALLOWANCE[i - 1], ALLOWANCE[i]]
  const raise = ruleRaise(y.year)
  for (const key of ['elected', 'supervisor', 'manager']) {
    const expected = cents(prev[key] * (1 + raise))
    if (!near(y[key], expected)) fail(`${y.year} ${key}: ${usd(y[key])} is not ${usd(prev[key])} raised ${(raise * 100).toFixed(2)}% (${usd(expected)})`)
  }
}
if (!near(ESTIMATE_2026.elected, cents(LATEST.elected * (1 + ruleRaise(2026))))) fail('the 2026 estimate does not follow the rule')
if (!(Math.abs(contract2009Carried - FIRST.manager) < 5)) fail(`the contracts’ ${usd(CONTRACT_2009)} for 2009 carries forward to ${usd(contract2009Carried)} for ${FIRST.year}, not near the ${usd(FIRST.manager)} paid`)
if (!near(allowanceTotalAllYears, cents(ALLOWANCE.reduce((s, y) => s + allowanceTotal(y), 0)), 0.01)) fail('the all-years total does not add up')

// ── 3. The quotations ────────────────────────────────────────────────────────
// PDF and OCR text break lines and words unpredictably, and quote marks vary:
// compare without whitespace, with plain quote marks and hyphens. A
// stenographic transcript's line numbers are dropped first.
const norm = (s) => s.replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[–—]/g, '-').replace(/\s+/g, '')
function sourceText(excerpt, pages) {
  const doc = sources.documents[excerpt]
  if (!doc) { fail(`there is no excerpt “${excerpt}”`); return [''] }
  const texts = pages ? pages.map((p) => doc.pages?.[p] ?? (fail(`${excerpt} has no page ${p}`), '')) : [(doc.passages ?? []).join(' ')]
  return doc.lineNumbers ? texts.map((t) => t.replace(/(^|\s)\d{1,2}(?=\s)/g, ' ')) : texts
}
let phrases = 0
function quoted(excerpt, pages, phrase, what) {
  phrases++
  const want = norm(phrase)
  for (const text of sourceText(excerpt, pages)) {
    const have = norm(text)
    // A quotation that starts mid-sentence may capitalize its first letter.
    if (!have.includes(want) && !have.includes(want.charAt(0).toLowerCase() + want.slice(1)) && !have.includes(want.charAt(0).toUpperCase() + want.slice(1))) {
      fail(`${what}: “${phrase}” is not in ${excerpt}${pages ? ` p. ${pages.join(', ')}` : ''}`)
    }
  }
}
for (const t of TIMELINE) {
  const doc = sources.documents[t.source.excerpt]
  if (doc && doc.url !== t.source.url) fail(`${t.date}: links ${t.source.url}, not the excerpted ${doc.url}`)
  for (const q of t.quotes) quoted(t.source.excerpt, t.source.pages, q, t.date)
}
// Every vote the timeline states is in the record.
const votes = [
  ['minutes-2010-01-05', 'The Vote: “Giglio, yes; Gabrielsen, yes; Wooten, yes; Dunleavy, yes; Walter, yes. The resolution is adopted.”'],
  ['minutes-2017-06-20', 'The Vote: “Hubbard, yes; Giglio, yes; Wooten, yes; Dunleavy, yes; Walter, yes. Resolution adopted.”'],
  ['minutes-2019-01-03', 'AYES: Laura Jens-Smith, James Wooten, Tim Hubbard, Catherine Kent ABSENT: Jodi Giglio'],
  ['minutes-2023-12-05', 'AYES: Aguiar, Hubbard, Beyrodt Jr., Rothwell, Kern'],
  ['minutes-2025-04-01', 'AYES: Hubbard, Rothwell, Kern, Merrifield, Waski'],
  ['packet-2026-07-21', 'AYES: Jerry Halpin, Kenneth Rothwell, Robert Kern, Denise Merrifield, Joann Waski'],
]
for (const [excerpt, phrase] of votes) quoted(excerpt, null, phrase, `vote in ${excerpt}`)
quoted('minutes-2018-01-03', null, 'Appoints Executive Assistant to the Supervisor (John Marafino)', 'the January 2018 appointment')

// July 2026: the draft carried the clause; the adopted contract does not.
const recreation = RECREATION_2026
quoted(recreation.draftSource.excerpt, null, '6. The Town will offer a Universal Life Insurance Policy', 'the July 16, 2026 draft')
quoted(recreation.draftSource.excerpt, null, recreation.draftQuote, 'the July 16, 2026 draft')
quoted(recreation.adoptedSource.excerpt, null, `TB Resolution ${recreation.resolution}`, 'the July 21, 2026 packet')
const adopted = norm(sourceText(recreation.adoptedSource.excerpt, null)[0]).toLowerCase()
for (const word of ['universallife', 'deferredcompensation', 'annuity']) {
  if (adopted.includes(word)) fail(`the contract adopted with Resolution ${recreation.resolution} mentions “${word}”; the page says the clause was left out`)
}
if (recreation.ayes.length !== 5 || recreation.vote !== '5–0') fail(`Resolution ${recreation.resolution}: ${recreation.ayes.length} ayes listed for a ${recreation.vote} vote`)

// ── 4. The page ──────────────────────────────────────────────────────────────
const html = existsSync(path('out/fringe-benefits/index.html')) ? readFileSync(path('out/fringe-benefits/index.html'), 'utf8') : ''
if (!html) fail('the build did not export /fringe-benefits/')
else {
  for (const text of [
    usd(allowanceTotal(LATEST)), usd(LATEST.elected), usd(LATEST.supervisor), usd(LATEST.manager), usd(CONTRACT_2009),
    usd(contract2009Carried), usd(TOWN_BOARD_2025.personalServicesActual), usd(townBoardPayrollLessBuyouts),
    usd(townBoardWithoutAllowance), `Resolution ${recreation.resolution}`, 'Roth 457',
  ]) if (!html.includes(text)) fail(`/fringe-benefits/ does not show ${text}`)
  for (const r of RECIPIENTS_2025) if (!html.includes(r.name)) fail(`/fringe-benefits/ does not name ${r.name}`)
}

if (process.exitCode) process.exit(process.exitCode)
console.log(`Fringe benefits verification passed: ${ALLOWANCE.length} years of payroll recomputed (${RECIPIENTS_2025.length} recipients in ${LATEST.year}), every year on the inflation rule, ${phrases} quoted phrases found in the record, and the July 2026 contract checked for the clause it dropped.`)
