// /funds/ explains the savings each fund's budget counts as income
// ("appropriated fund balance") and the money it sets aside, under the rule in
// lib/savings-rules.ts. This holds the built pages to the records, running the
// same rule on them:
//   - the funds' savings add up to the Summaries' own printed totals in both
//     years, and every Budget Supplement 9999 line agrees with its fund's
//     Summary figure, so a page cite never points at a different number;
//   - the page names every fund that uses savings or sets money aside, with
//     both years' amounts and the totals;
//   - the General Fund's planned use is the same in its budget and in the
//     audit before it, and the page sets it beside the audit's result;
//   - the Supervisor's sentence on the General Fund's savings is shown only
//     while the Summaries bear out its $300,000;
//   - a fund page that says no budget plans to close a deficit is not one whose
//     budget sets money aside for it.

import { existsSync, readFileSync } from 'node:fs'
import { isAbsolute, relative, resolve, sep } from 'node:path'
import { drawRunStart, isSetAside, savingsByFund } from '../lib/savings-rules.ts'
import { AUDITED_GENERAL_FUND, AUDITED_OPERATIONS } from '../lib/audits.ts'
import { LETTER_2027 } from '../lib/tentative-letters.ts'

const root = resolve(process.cwd())
// Every file this check opens must sit inside the web/ directory it runs from.
const path = (...parts) => {
  const target = resolve(root, ...parts)
  const rel = relative(root, target)
  if (rel === '..' || rel.startsWith(`..${sep}`) || isAbsolute(rel)) throw new Error(`refusing to read outside ${root}: ${target}`)
  return target
}
const read = (p) => JSON.parse(readFileSync(path(p), 'utf8'))
const fail = (message) => { console.error(`FUNDS SAVINGS VERIFY FAILED: ${message}`); process.exitCode = 1 }
const usd = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
const signed = (n) => `${n > 0 ? '+' : '−'}${usd(Math.abs(n))}`
const pageText = (file) => readFileSync(path(file), 'utf8')
  .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, ' ')
  .replace(/<!-- -->/g, '')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/&ldquo;/g, '“').replace(/&rdquo;/g, '”').replace(/&apos;/g, "'")
  .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/\s+/g, ' ')

const stages = read('public/data/history/budget-stages.json')
const supplement = read('public/data/budget-supplement/current-lines.json')
const TENTATIVE_YEAR = 2027

const adopted = stages.years[String(TENTATIVE_YEAR - 1)]?.adopted
const tentative = stages.years[String(TENTATIVE_YEAR)]?.tentative
if (!adopted || !tentative) {
  console.log(`funds savings: no ${TENTATIVE_YEAR} Tentative beside a ${TENTATIVE_YEAR - 1} adopted budget; nothing to check`)
  process.exit()
}

const supplementFits = supplement.columns.tentative === TENTATIVE_YEAR && supplement.columns.adopted === TENTATIVE_YEAR - 1 && supplement.reconciliation.complete
const lines = supplementFits ? supplement.lines : []
const s = savingsByFund(adopted.funds, tentative.funds, lines)

// ── The records agree with each other ────────────────────────────────────────
if (s.totals.adopted !== adopted.totals.fundBalance) fail(`the funds' ${TENTATIVE_YEAR - 1} savings add up to ${usd(s.totals.adopted)}, the Summary prints ${usd(adopted.totals.fundBalance)}`)
if (s.totals.proposed !== tentative.totals.fundBalance) fail(`the funds' ${TENTATIVE_YEAR} savings add up to ${usd(s.totals.proposed)}, the Summary prints ${usd(tentative.totals.fundBalance)}`)
if (supplementFits) {
  for (const r of s.rows) if (r.page === null) fail(`${r.code}: the Supplement's savings line does not print the Summaries' ${usd(r.adopted)} and ${usd(r.proposed)}`)
  for (const l of s.unmatched) fail(`${l.account}: the Supplement prints savings of ${usd(l.adopted ?? 0)} and ${usd(l.tentative ?? 0)} that no Summary row matches`)
}

// ── The built page ───────────────────────────────────────────────────────────
const built = 'out/funds/index.html'
if (!existsSync(path(built))) { fail(`${built} was not built`); process.exit() }
const text = pageText(built)
const has = (x) => text.includes(x)

if (!has('How savings help balance the budget')) fail('the page has no section on the savings each fund uses')
for (const x of [usd(s.totals.adopted), usd(s.totals.proposed)]) if (!has(x)) fail(`the savings total ${x} is not on the page`)
for (const r of s.rows) {
  for (const x of [r.name, usd(r.adopted), usd(r.proposed), `${r.sharePct.toFixed(1)}%`]) if (!has(x)) fail(`${r.code}: "${x}" is not in the savings table`)
  if (r.adopted !== r.proposed && !has(signed(r.proposed - r.adopted))) fail(`${r.code}: its change, ${signed(r.proposed - r.adopted)}, is not on the page`)
}
for (const x of s.setAsides) {
  for (const y of [x.fundName, x.line, usd(x.adopted), usd(x.proposed)]) if (!has(y)) fail(`${x.code} set-aside: "${y}" is not on the page`)
}
if (s.setAsides.length && !has(usd(s.totals.setAsideProposed))) fail(`the set-aside total ${usd(s.totals.setAsideProposed)} is not on the page`)

// Every Supplement cite links to its page, once for each line that cites it.
if (supplementFits) {
  const html = readFileSync(path(built), 'utf8')
  const cites = [...s.rows.map((r) => r.page), ...s.setAsides.map((x) => x.page)].filter((p) => p !== null)
  for (const p of new Set(cites)) {
    const want = cites.filter((x) => x === p).length
    const got = html.split(`${supplement.source.url}#page=${p}"`).length - 1
    if (got < want) fail(`Supplement page ${p} is cited ${got} times, ${want} lines cite it`)
  }
}

// The every-year run, as the page states it.
const utility = s.rows.filter((r) => /^E[SW]/.test(r.code))
const runs = new Set(utility.map((r) => drawRunStart(stages.years, r.code, TENTATIVE_YEAR)))
const run = runs.size === 1 ? [...runs][0] : null
const runSentence = run !== null && run < TENTATIVE_YEAR - 1 ? `Every budget from ${run} through the ${TENTATIVE_YEAR} Tentative plans to use savings` : null
if (runSentence && !has(runSentence)) fail(`the page does not say: "${runSentence}"`)
if (!runSentence && has('plans to use savings in the')) fail('the page claims an every-year run of savings use that the stage history does not show')

// The Supervisor's sentence, only while the Summaries bear it out.
const gf = s.rows.find((r) => r.code === 'A01')
const letterHolds = !!gf && gf.adopted - gf.proposed === LETTER_2027.fundBalance.reduction
if (letterHolds !== has(LETTER_2027.fundBalance.quote)) fail(`the letter's sentence on General Fund savings is ${has(LETTER_2027.fundBalance.quote) ? 'shown' : 'missing'}, but the Summaries ${letterHolds ? 'bear it out' : 'do not bear it out'}`)

// The General Fund's plan beside its audited result.
let audited = 0
for (const year of Object.keys(AUDITED_OPERATIONS).map(Number)) {
  const planned = stages.years[String(year)]?.adopted?.funds.A01?.fundBalance
  const assigned = AUDITED_GENERAL_FUND[year - 1]?.assigned.subsequentYearsBudget
  if (planned == null || assigned == null) continue
  if (planned !== assigned) { fail(`${year}: the budget planned ${usd(planned)} of General Fund savings, the ${year - 1} audit assigned ${usd(assigned)}`); continue }
  audited++
  for (const x of [usd(planned), signed(AUDITED_OPERATIONS[year].netChange), usd(AUDITED_OPERATIONS[year].ending)]) {
    if (!has(x)) fail(`${year}: "${x}" from the General Fund's budget and audit is not on the page`)
  }
}

// ── A fund page's deficit note ───────────────────────────────────────────────
for (const code of ['A04', 'A06']) {
  const file = `out/funds/${code}/index.html`
  if (!existsSync(path(file))) { fail(`${file} was not built`); continue }
  const fundText = pageText(file)
  const line = lines.find((l) => l.fund === code && isSetAside(l))
  const setsAside = !!line && ((line.adopted ?? 0) > 0 || (line.tentative ?? 0) > 0)
  if (setsAside && fundText.includes('No budget has planned for it to close')) fail(`${code}: the page says no budget plans to close its deficit, but the Supplement sets aside ${usd(line.adopted ?? 0)} and ${usd(line.tentative ?? 0)}`)
  if (setsAside) for (const x of [usd(line.adopted ?? 0), usd(line.tentative ?? 0)].filter((x) => x !== '$0')) if (!fundText.includes(x)) fail(`${code}: the set-aside ${x} is not on its page`)
}

if (!process.exitCode) {
  console.log(`funds savings: ${s.rows.length} funds use ${usd(s.totals.proposed)} of savings in the ${TENTATIVE_YEAR} Tentative (${usd(s.totals.adopted)} in ${TENTATIVE_YEAR - 1}); ${s.setAsides.length} set-aside lines; ${audited} audited General Fund years`)
}
