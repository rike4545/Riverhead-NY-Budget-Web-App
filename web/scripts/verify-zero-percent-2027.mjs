// /zero-percent-2027/ prices a 1% and a zero-percent 2027 town-wide levy. Every
// figure on it is arithmetic on records the site already parses, so this check
// works each one out again from those records and holds the built page to it:
//   - the five levels: 2026's and the Tentative's town-wide levy and rate from
//     the Summaries, the levy with the six amendments from the resolutions'
//     own lines, and 1% and 0% over 2026, with the example home's tax at each;
//   - interest at its 2026 pace: twice each fund's first half of 2026, which
//     must be below what the fund collected in each of 2023-2025;
//   - the other estimates below three years of collections, and how many were
//     behind 2025 at June 30;
//   - the path to each target, the General Fund's savings used, and the
//     audited 2024 and 2025 results beside the draws their budgets planned;
//   - the General Fund's shares, from the 2027 Supplement's lines;
//   - the General Fund levy history and the trend sentence;
//   - the carryover argument's answer: every quotation from the State
//     Comptroller and the Tax Department against the saved text of its page,
//     the Tentative rising by exactly the State's two growth factors (which is
//     what lets the page take its levy as the limit), and the table;
//   - and that the forecast-era figures this page used to quote are gone.

import { existsSync, readFileSync } from 'node:fs'
import { isAbsolute, relative, resolve, sep } from 'node:path'
import { AUDITED_OPERATIONS } from '../lib/audits.ts'
import { AMENDMENTS, change, fundEffects, revenueCode } from '../lib/budget-amendments-2027.ts'
import { TOWN_WIDE_FUNDS } from '../lib/fund-groups.ts'
import { LETTER_2027, READ_BY_HAND } from '../lib/tentative-letters.ts'
import { CARRYOVER_ARGUMENT, CARRYOVER_CAP, CARRYOVER_QUOTES, CARRYOVER_SOURCES, GROWTH_2027 } from '../lib/tax-cap-carryover.ts'

const root = resolve(process.cwd())
const repo = resolve(root, '..')
const path = (...parts) => {
  const target = resolve(root, ...parts)
  const rel = relative(repo, target)
  if (rel === '..' || rel.startsWith(`..${sep}`) || isAbsolute(rel)) throw new Error(`refusing to read outside ${repo}: ${target}`)
  return target
}
const read = (p) => JSON.parse(readFileSync(path(p), 'utf8'))
const fail = (message) => { console.error(`ZERO PERCENT 2027 VERIFY FAILED: ${message}`); process.exitCode = 1 }
const usd = (n) => `${n < 0 ? '−' : ''}$${Math.round(Math.abs(n)).toLocaleString('en-US')}`
const signed = (n) => (Math.round(n) === 0 ? '$0' : `${n > 0 ? '+' : '−'}$${Math.round(Math.abs(n)).toLocaleString('en-US')}`)
const pct = (p, digits = 2) => `${p > 0 ? '+' : p < 0 ? '−' : ''}${Math.abs(p).toFixed(digits)}%`
const sum = (xs) => xs.reduce((s, x) => s + x, 0)
const growth = (from, to) => ((to - from) / from) * 100

// ── The records ──────────────────────────────────────────────────────────────
const stages = read('public/data/history/budget-stages.json')
const t = stages.years['2027']?.tentative
const a = stages.years['2026']?.adopted
if (!t?.townWide || !a?.townWide) { fail('budget-stages.json lacks the 2027 Tentative or 2026 adopted town-wide rows'); process.exit() }
const tw = t.townWide

const supplement = read('public/data/budget-supplement/current-lines.json')
const lines = new Map(supplement.lines.map((l) => [l.account, l]))
const histories = new Map(read('public/data/budget-supplement/revenue-history.json').accounts.map((h) => [h.account, h]))
const taxBill = read('public/data/tax-bill.json')
const gfHistory = read('public/data/history/general-fund.json')

// The six amendments, line by line.
const amendedChange = new Map()
for (const am of AMENDMENTS) for (const l of am.lines) amendedChange.set(l.account, (amendedChange.get(l.account) ?? 0) + change(l))
const effects = fundEffects(AMENDMENTS)
const effect = (code) => effects.find((e) => e.fund === code) ?? { levy: 0, fundBalance: 0 }
const funds = TOWN_WIDE_FUNDS.map((code) => ({
  code,
  prior: a.funds[code].levy,
  tentative: t.funds[code].levy,
  amended: t.funds[code].levy + effect(code).levy,
  rate: tw.fundRates[code].rate,
}))
const amendedLevy = tw.levy + sum(TOWN_WIDE_FUNDS.map((c) => effect(c).levy))
if (amendedLevy !== sum(funds.map((f) => f.amended))) fail('the amended fund levies do not add up to the amended town-wide levy')

// ── Five levels ──────────────────────────────────────────────────────────────
const assessed = (LETTER_2027.generalFund.exampleValue * taxBill.equalization.residentialAssessmentRatio) / 100
const home = (rate) => Math.round((assessed / 1000) * rate)
const scaled = (f, levy) => (f.rate * levy) / f.tentative
const target = (p) => Math.round(tw.priorLevy * (1 + p / 100))
const levels = [
  { label: '2026 adopted', levy: tw.priorLevy, rate: tw.priorRate, printed: true },
  { label: '2027 Tentative', levy: tw.levy, rate: tw.rate, printed: true },
  { label: 'With the six amendments', levy: amendedLevy, rate: sum(funds.map((f) => scaled(f, f.amended))), printed: false },
  { label: 'A 1% increase', levy: target(1), rate: sum(funds.map((f) => scaled(f, f.prior * 1.01))), printed: false },
  { label: 'No increase', levy: target(0), rate: sum(funds.map((f) => scaled(f, f.prior))), printed: false },
]
if (levels[4].levy !== tw.priorLevy) fail('no increase should be 2026’s levy')
const limit = READ_BY_HAND[2027]?.statedLimitPct
if (limit !== undefined && !(growth(tw.priorLevy, tw.levy) <= limit + 0.005)) fail(`the Tentative’s levy rises more than the letter’s ${limit}% limit`)

const gap = (p) => ({ belowTentative: tw.levy - target(p), beyondAmendments: amendedLevy - target(p) })

// ── Interest at its 2026 pace ────────────────────────────────────────────────
const YEARS = ['2023', '2024', '2025']
const amendedEstimate = (account) => (lines.get(account)?.tentative ?? 0) + (amendedChange.get(account) ?? 0)
const interest = TOWN_WIDE_FUNDS.map((code) => {
  const account = `${code}-2401-000-00000-G`
  const h = histories.get(account)
  if (!h || h.ytd['2026'] === undefined || YEARS.some((y) => h.actual[y] === undefined || !h.ytd[y])) {
    fail(`the Supplements lack ${account}’s collections or first halves`)
    return { code, pace: 0, room: 0, collected: [], amended: 0, h1: 0, multiple: 0 }
  }
  const pace = Math.round(2 * h.ytd['2026'])
  const amended = Math.round(amendedEstimate(account))
  const multiple = Math.min(...YEARS.map((y) => h.actual[y] / h.ytd[y]))
  if (YEARS.some((y) => pace >= h.actual[y])) fail(`${account}: twice the first half of 2026 (${usd(pace)}) is not below every 2023–2025 collection`)
  if (multiple < 2) fail(`${account}: in some year since 2023 the full year was under twice the first half, so “twice the first half” is not a cautious pace`)
  return { code, pace, amended, room: Math.max(0, pace - amended), collected: YEARS.map((y) => h.actual[y]), h1: h.ytd['2026'], multiple }
})
const interestTotal = sum(interest.map((r) => r.room))
const lowestMultiple = Math.min(...interest.map((r) => r.multiple))

// ── Other estimates below three years of collections ─────────────────────────
const others = supplement.lines
  .filter((l) => TOWN_WIDE_FUNDS.includes(l.fund) && l.kind === 'revenue')
  .filter((l) => {
    const code = l.account.split('-')[1]
    return !['1001', '9999', '2401'].includes(code) && !code.startsWith('28') && !code.startsWith('5')
  })
  .flatMap((l) => {
    const h = histories.get(l.account)
    const estimate = Math.round(amendedEstimate(l.account))
    if (!h || estimate <= 0 || YEARS.some((y) => h.actual[y] === undefined)) return []
    const lowest = Math.round(Math.min(...YEARS.map((y) => h.actual[y])))
    if (lowest <= estimate) return []
    const behind = h.ytd['2025'] !== undefined && h.ytd['2026'] !== undefined && h.ytd['2026'] < h.ytd['2025']
    return [{ account: l.account, name: l.name, lowest, estimate, room: lowest - estimate, behind }]
  })
const othersTotal = sum(others.map((r) => r.room))
const largest = others.filter((r) => r.room >= 25_000)

// ── Paths, savings, the audits ───────────────────────────────────────────────
const drawOf = (doc) => doc.funds.A01.fundBalance ?? 0
const draws = { y2026: drawOf(a), tentative: drawOf(t), amended: drawOf(t) + effect('A01').fundBalance }
const path1 = (() => { const rest = Math.max(0, gap(1).beyondAmendments - interestTotal); return { rest, draw: draws.amended + rest } })()
const path0 = (() => { const rest = Math.max(0, gap(0).beyondAmendments - interestTotal); return { rest, draw: draws.amended + rest, withOthers: draws.amended + rest - Math.min(rest, othersTotal) } })()

const afterTheFact = Object.entries(AUDITED_OPERATIONS).map(([year, ops]) => ({
  year, netChange: ops.netChange, planned: gfHistory.rows.find((r) => r.year === Number(year))?.appropriatedFundBalance ?? null,
}))
for (const y of afterTheFact) if (y.planned === null) fail(`general-fund.json has no ${y.year} adopted draw to set beside the audit`)

// ── Shares ───────────────────────────────────────────────────────────────────
const gfLines = supplement.lines.filter((l) => l.fund === 'A01' && l.kind === 'expenditure')
const gfTotal = sum(gfLines.map((l) => l.tentative ?? 0))
if (Math.round(gfTotal) !== t.funds.A01.appropriations) fail(`the Supplement’s General Fund lines (${usd(gfTotal)}) do not add up to the Tentative’s ${usd(t.funds.A01.appropriations)}`)
const CATEGORY = { 1: 'General government', 3: 'Public safety', 9: 'Employee benefits and debt' }
const byCategory = new Map()
for (const l of gfLines) {
  const label = CATEGORY[l.account.split('-')[1]] ?? 'Everything else'
  byCategory.set(label, (byCategory.get(label) ?? 0) + (l.tentative ?? 0))
}

// ── Levy history ─────────────────────────────────────────────────────────────
const history = gfHistory.rows.filter((r) => r.taxLevy !== null && r.year >= 2021)
const yearly = history.slice(1).map((r, i) => ({ year: r.year, change: growth(history[i].taxLevy, r.taxLevy) }))
const gf = funds.find((f) => f.code === 'A01')
const gf2026 = history.find((r) => r.year === 2026)?.taxLevy
if (gf2026 !== gf.prior) fail(`general-fund.json’s 2026 levy (${gf2026}) is not the Summary’s ${gf.prior}`)

// ── The built pages ──────────────────────────────────────────────────────────
const built = 'out/zero-percent-2027/index.html'
if (!existsSync(path(built))) { fail(`${built} was not built`); process.exit() }
const html = readFileSync(path(built), 'utf8')
const visible = (h) => h
  .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, ' ')
  .replace(/<!-- -->/g, '')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/\s+/g, ' ')
const text = visible(html)
const block = (attr, end) => {
  const i = html.indexOf(attr)
  if (i === -1) { fail(`/zero-percent-2027/ has no ${attr} block`); return '' }
  return visible(html.slice(i, html.indexOf(end, i)))
}
const expect = (where, body, strings) => { for (const s of strings) if (body && !body.includes(s)) fail(`${where} does not show ${s}`) }

const levelsText = block('data-levels', '</figure>')
for (const l of levels) {
  const row = [l.label, usd(l.levy), l.printed ? l.rate.toFixed(3) : `about ${l.rate.toFixed(2)}`, `${l.printed ? '' : 'about '}${usd(home(l.rate))}`]
  if (l.label !== '2026 adopted') row.push(`${signed(l.levy - tw.priorLevy)} (${pct(growth(tw.priorLevy, l.levy))})`, signed(home(l.rate) - home(tw.priorRate)))
  if (!['2026 adopted', '2027 Tentative'].includes(l.label)) row.push(usd(tw.levy - l.levy))
  expect(`the levels table’s “${l.label}” row`, levelsText, row)
}

expect('the interest table', block('data-interest', '</figure>'), [
  ...interest.flatMap((r) => [r.collected.map(usd).join(' / '), usd(r.h1), usd(r.amended), usd(r.pace), usd(r.room)]), usd(interestTotal),
])
expect('the interest note', text, [`at least ${lowestMultiple.toFixed(2)} times`])

const othersText = block('data-other-estimates', '</figure>')
expect('the other-estimates table', othersText, largest.flatMap((r) => [r.name, usd(r.room), usd(r.estimate)]))
expect('the other-estimates note', text, [`${others.length} more estimates`, `${usd(othersTotal)} in all`, `Of the ${others.length}, ${others.filter((r) => r.behind).length} had brought in less`])

expect('the paths table', block('data-paths', '</figure>'), [
  usd(gap(1).belowTentative), usd(gap(0).belowTentative), signed(-(tw.levy - amendedLevy)), signed(-Math.min(interestTotal, gap(1).beyondAmendments)),
  signed(-path1.rest), signed(-path0.rest), usd(path1.draw), usd(path0.draw), usd(target(1)), usd(target(0)),
])
expect('the paths note', text, [usd(path0.withOthers), usd(draws.y2026 - path1.draw), usd(path0.draw - draws.y2026)])
expect('the savings note', block('data-draws', '</p>'), [usd(draws.tentative), usd(draws.amended), usd(draws.y2026), usd(draws.amended + gap(1).beyondAmendments), usd(draws.amended + gap(0).beyondAmendments)])
expect('the audits note', block('data-after-the-fact', '</p>'), afterTheFact.flatMap((y) => [usd(y.planned ?? 0), usd(Math.abs(y.netChange))]))

expect('the shares table', block('data-shares', '</figure>'), Array.from(byCategory.entries()).flatMap(([label, amount]) => [label, usd(amount), `${((amount / gfTotal) * 100).toFixed(1)}%`]))

expect('the levy history', block('data-levy-history', '</figure>'), [
  ...history.map((r) => usd(r.taxLevy)), ...yearly.map((y) => pct(y.change)),
  usd(gf.tentative), usd(gf.amended), pct(growth(gf.prior, gf.tentative)), pct(growth(gf.prior, gf.amended)),
])
const trend = block('data-trend-note', '</span>')
const fmt = (p) => `${p < 0 ? '−' : ''}${Math.abs(p).toFixed(2)}%`
expect('the trend sentence', trend, [...yearly.map((y) => fmt(Math.abs(y.change)).replace(/^−/, '')), fmt(growth(gf.prior, gf.tentative)), fmt(growth(gf.prior, gf.amended))])

expect('the summary', text, [usd(gap(1).beyondAmendments), usd(gap(0).beyondAmendments), usd(home(levels[1].rate) - home(levels[4].rate))])
expect('the 1% verdict', block('data-verdict-one', '</span>'), [usd(Math.min(interestTotal, gap(1).beyondAmendments)), usd(path1.rest), usd(path1.draw), usd(draws.y2026)])
expect('the 0% verdict', block('data-verdict-zero', '</span>'), [usd(path0.rest), usd(path0.draw), usd(path0.withOthers)])

for (const stale of ['$3,514,315', 'about $3.5 million', 'down 3.10%', 'does not publish a General Fund levy', '52% harder', '52% more', 'of the $3.5M']) {
  if (text.includes(stale)) fail(`the page still shows the forecast-era “${stale}”`)
}

// ── The carryover argument ───────────────────────────────────────────────────
const capSources = read('../etl/data/tax-cap/carryover-sources.json').documents
const squash = (str) => str.replace(/\s+/g, ' ').trim()
const ON_OTHER_PAGES = ['userFees']
for (const [key, qt] of Object.entries(CARRYOVER_QUOTES)) {
  const doc = capSources[qt.doc]
  if (!doc) { fail(`carryover quotation "${key}": there is no saved copy of ${qt.doc}`); continue }
  if (doc.url !== CARRYOVER_SOURCES[qt.doc].url) fail(`${qt.doc}: the saved copy is not of the page the site cites`)
  if (!squash(doc.pages[qt.page] ?? '').includes(squash(qt.text))) fail(`carryover quotation "${key}" is not on ${qt.doc} (${qt.page}) word for word`)
  if (!ON_OTHER_PAGES.includes(key) && !text.includes(qt.text)) fail(`carryover quotation "${key}" is not on the page`)
}
const factorsText = squash(capSources['dtf-tbgf-2027']?.pages.page ?? '')
if (!factorsText.includes('for fiscal years starting in 2027')) fail('the saved tax base growth factors are not the 2027 ones')
for (const [town, factor] of Object.entries(GROWTH_2027.taxBase)) {
  const name = town.charAt(0).toUpperCase() + town.slice(1)
  if (!factorsText.includes(`Suffolk County Town of ${name} ${factor.toFixed(4)}`)) fail(`${name}'s 2027 tax base growth factor is not ${factor.toFixed(4)} in the saved table`)
}
const factors = GROWTH_2027.allowable * GROWTH_2027.taxBase.riverhead
if (Math.abs(tw.levy / tw.priorLevy - factors) > 0.00005) fail('the Tentative’s town-wide levy no longer rises by the State’s two growth factors, so the page can no longer take its levy as the limit')
const capAmount = Math.round(tw.levy * CARRYOVER_CAP)
const carryRows = [['With the six amendments', amendedLevy], ['A 1% increase', target(1)], ['No increase', target(0)]].map(([label, levy]) => {
  const room = Math.max(0, tw.levy - levy)
  const carried = Math.min(room, capAmount)
  return { label, levy, room, carried, lost: room - carried }
})
expect('the carryover table', block('data-carryover', '</figure>'), carryRows.flatMap((r) => [r.label, usd(r.levy), usd(r.room), usd(r.carried), r.lost ? usd(r.lost) : 'None']))
expect('the carryover limit note', block('data-carryover-limit', '</span>'), [usd(capAmount), `${growth(tw.priorLevy, tw.levy).toFixed(3)}%`, `${((factors - 1) * 100).toFixed(3)}%`, GROWTH_2027.taxBase.riverhead.toFixed(4)])
expect('the carryover section', text, [`about ${growth(tw.priorLevy, tw.levy * (1 - CARRYOVER_CAP)).toFixed(2)}% or more`, CARRYOVER_ARGUMENT, usd(carryRows[1].lost), usd(carryRows[2].lost)])
for (const y of ['2025', '2026']) {
  const sentence = READ_BY_HAND[y]?.taxCap
  if (!sentence || !/over the tax cap/i.test(sentence)) fail(`the ${y} letter is no longer recorded as over the tax cap, which the page says left no carryover`)
  else if (!text.includes(sentence)) fail(`the ${y} letter’s tax-cap sentence is not on the page`)
}

// ── The middle course ────────────────────────────────────────────────────────
const middleRows = [1.24, 1.58].map((p) => {
  const levy = target(p)
  const rate = sum(funds.map((f) => scaled(f, f.prior * (1 + p / 100))))
  const room = Math.max(0, tw.levy - levy)
  return { p, levy, beyond: amendedLevy - levy, spare: interestTotal - (amendedLevy - levy), room, lost: Math.max(0, room - capAmount), home: home(rate) }
})
for (const r of middleRows) {
  if (r.spare < 0) fail(`a ${r.p}% increase now needs savings beyond the amendments, which the page says it does not`)
  // The low end sits at the carryover threshold: it may leave a sliver that cannot carry, which the page states.
  if (r.lost > capAmount * 0.005) fail(`a ${r.p}% increase now leaves ${usd(r.lost)} that cannot carry over, more than the sliver the page describes`)
}
expect('the middle-course table', block('data-middle', '</figure>'), middleRows.flatMap((r) => [
  usd(r.levy), signed(r.levy - tw.priorLevy), usd(tw.levy - r.levy), usd(r.beyond), usd(r.spare), `${usd(r.room)}, ${r.lost ? `all but ${usd(r.lost)}` : 'all of it'}`, `about ${usd(r.home)}`, signed(r.home - home(tw.priorRate)),
]))
const noSavingsPct = growth(tw.priorLevy, amendedLevy - interestTotal)
expect('the middle-course thresholds', block('data-middle-thresholds', '</span>'), [`about ${noSavingsPct.toFixed(2)}% up`, `about ${growth(tw.priorLevy, tw.levy * (1 - CARRYOVER_CAP)).toFixed(2)}% up`])
if (!(noSavingsPct < middleRows[0].p && Math.abs(growth(tw.priorLevy, tw.levy * (1 - CARRYOVER_CAP)) - middleRows[0].p) < 0.01)) fail(`${middleRows[0].p}% is no longer at the carryover threshold and above the no-savings one, as the page says`)
expect('the middle-course verdict', block('data-verdict-middle', '</span>'), [usd(middleRows[0].spare), usd(middleRows[1].spare)])

// /answers/ routes the freeze question here, with this page's figures.
const answersFile = 'out/answers/index.html'
if (existsSync(path(answersFile))) {
  const answers = visible(readFileSync(path(answersFile), 'utf8'))
  if (!answers.includes(usd(gap(0).beyondAmendments)) || !answers.includes(usd(gap(1).beyondAmendments))) fail('/answers/ does not give the 0% and 1% figures this page prices')
} else fail(`${answersFile} was not built`)

if (!process.exitCode) {
  console.log(`zero percent 2027: 1% needs ${usd(gap(1).beyondAmendments)} and 0% ${usd(gap(0).beyondAmendments)} beyond the amendments; carryover cap ${usd(capAmount)}, ${Object.keys(CARRYOVER_QUOTES).length} State quotations on their pages; interest at its 2026 pace ${usd(interestTotal)}; ${others.length} other estimates ${usd(othersTotal)} (${others.filter((r) => r.behind).length} behind); savings used ${usd(path1.draw)} and ${usd(path0.draw)}`)
}
