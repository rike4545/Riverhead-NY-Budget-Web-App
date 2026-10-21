// /predict-2027/ carries two predictions. The September model grew each 2026
// line by a rate for its category, before the Tentative existed, and stays as
// it was. The updated prediction (lib/predict-2027-update.ts) is the Tentative
// as filed, changed by the six amendments on the October 20 draft agenda: what
// this site expects the Board to adopt by November 20, 2026. This re-derives
// the updated prediction from the Tentative's Summary (budget-stages.json) and
// the amendments' own FROM and TO lines, the September model's misses from its
// line items and the 2027 Budget Supplement's, and the two 2026 debt
// paydowns from the meetings' fiscal-impact records, then holds the built page
// to all of it:
//   - the prediction table, row by row, with its adopted column empty until the
//     adopted budget is parsed and filled from it afterwards;
//   - the lead, the figures above the table, the basis and the outcomes;
//   - the table of where the September model missed, which must add up to the
//     Summary's totals, and the debt paragraph under it;
//   - the September model's own figures, still on the page as made;
//   - /answers/ and /candidate-cost-benefit/, which quote the prediction.

import { existsSync, readFileSync } from 'node:fs'
import { isAbsolute, relative, resolve, sep } from 'node:path'
import { AMENDMENTS, ARTICLE, PACKET, change, deferredToFundBalance, fundEffects } from '../lib/budget-amendments-2027.ts'
import { TOWN_WIDE_FUNDS } from '../lib/fund-groups.ts'
import { LETTER_2027, READ_BY_HAND } from '../lib/tentative-letters.ts'

const root = resolve(process.cwd())
const repo = resolve(root, '..')
const path = (...parts) => {
  const target = resolve(root, ...parts)
  const rel = relative(repo, target)
  if (rel === '..' || rel.startsWith(`..${sep}`) || isAbsolute(rel)) throw new Error(`refusing to read outside ${repo}: ${target}`)
  return target
}
const read = (p) => JSON.parse(readFileSync(path(p), 'utf8'))
const fail = (message) => { console.error(`PREDICT 2027 VERIFY FAILED: ${message}`); process.exitCode = 1 }
const sum = (xs) => xs.reduce((s, x) => s + x, 0)
const usd = (n) => `$${Math.round(n).toLocaleString('en-US')}`
const signedUsd = (n) => `${n > 0 ? '+' : n < 0 ? '−' : ''}${usd(Math.abs(n))}`
const signedPct = (p) => `${p > 0 ? '+' : p < 0 ? '−' : ''}${Math.abs(p).toFixed(2)}%`
const growth = (from, to) => ((to - from) / from) * 100
const word = (n) => ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'][n] ?? String(n)

const UPDATED = 'October 17, 2026'

// ── The Tentative and the six amendments ─────────────────────────────────────
const stages = read('public/data/history/budget-stages.json')
const t = stages.years['2027']?.tentative
const p = stages.years['2026']?.adopted
const adopted = stages.years['2027']?.adopted ?? null
if (!t?.townWide || !p?.townWide || !t.funds.A01 || !p.funds.A01) { fail('budget-stages.json lacks the 2027 Tentative or the 2026 adopted budget'); process.exit() }
const tw = t.townWide

const effects = fundEffects(AMENDMENTS)
const effect = (code) => effects.find((e) => e.fund === code) ?? { appropriations: 0, levy: 0, fundBalance: 0 }
const levyChange = sum(effects.map((e) => e.levy))
const townWideChange = sum(TOWN_WIDE_FUNDS.map((c) => effect(c).levy))
if (levyChange !== townWideChange) fail(`the amendments change a levy outside the town-wide funds (${levyChange} against ${townWideChange})`)
const appropriationsChange = sum(effects.map((e) => e.appropriations))
const deferred = sum(deferredToFundBalance(AMENDMENTS).map(({ line }) => line.amount))

const rows = [
  { id: 'town-wide-levy', y2026: tw.priorLevy, tentative: tw.levy, predicted: tw.levy + townWideChange, adopted: adopted?.townWide?.levy, kind: 'usd' },
  {
    id: 'town-wide-change', y2026: null, tentative: growth(tw.priorLevy, tw.levy), predicted: growth(tw.priorLevy, tw.levy + townWideChange),
    adopted: adopted?.townWide ? growth(adopted.townWide.priorLevy, adopted.townWide.levy) : undefined, kind: 'pct',
  },
  { id: 'all-funds-levy', y2026: p.totals.levy, tentative: t.totals.levy, predicted: t.totals.levy + levyChange, adopted: adopted?.totals.levy, kind: 'usd' },
  { id: 'appropriations', y2026: p.totals.appropriations, tentative: t.totals.appropriations, predicted: t.totals.appropriations + appropriationsChange, adopted: adopted?.totals.appropriations, kind: 'usd' },
  { id: 'general-fund', y2026: p.funds.A01.appropriations, tentative: t.funds.A01.appropriations, predicted: t.funds.A01.appropriations + effect('A01').appropriations, adopted: adopted?.funds.A01?.appropriations, kind: 'usd' },
  {
    id: 'general-fund-savings', y2026: p.funds.A01.fundBalance ?? 0, tentative: t.funds.A01.fundBalance ?? 0,
    predicted: (t.funds.A01.fundBalance ?? 0) + effect('A01').fundBalance, adopted: adopted ? adopted.funds.A01?.fundBalance ?? 0 : undefined, kind: 'usd',
  },
]
const row = (id) => rows.find((r) => r.id === id)
const show = (r, n) => (r.kind === 'pct' ? signedPct(n) : usd(n))

// The prediction as made on October 17, 2026. The page says it stays as it is,
// so a change to the Tentative's figures or to the amendments that moves it
// fails here: a revised prediction gets its own date beside this one.
const MADE = {
  'town-wide-levy': 62_238_344, 'all-funds-levy': 66_516_005, appropriations: 120_854_219,
  'general-fund': 71_932_070, 'general-fund-savings': 880_000,
}
for (const [id, value] of Object.entries(MADE)) {
  if (Math.round(row(id).predicted) !== value) fail(`the ${id} prediction is now ${usd(row(id).predicted)}, not the ${usd(value)} made on ${UPDATED}; date a revised prediction instead of changing this one`)
}

// What the amendments say they do, and what RiverheadLOCAL reported: 2.79% to about 1.73%.
if (row('town-wide-change').tentative.toFixed(2) !== '2.79') fail(`the Tentative’s town-wide increase is ${row('town-wide-change').tentative.toFixed(2)}%, not the 2.79% reported`)
if (row('town-wide-change').predicted.toFixed(2) !== '1.73') fail(`the amended town-wide increase is ${row('town-wide-change').predicted.toFixed(2)}%, not the about 1.73% reported`)
if (row('general-fund-savings').predicted >= row('general-fund-savings').tentative) fail('the amendments should use less General Fund savings than the Tentative')
if (row('all-funds-levy').predicted >= row('all-funds-levy').tentative) fail('the amendments should lower the levy across all funds')

// ── The example home and the outcomes ────────────────────────────────────────
const taxBill = read('public/data/tax-bill.json')
const assessed = (LETTER_2027.generalFund.exampleValue * taxBill.equalization.residentialAssessmentRatio) / 100
const home = (rate) => Math.round((assessed / 1000) * rate)
const fundRows = TOWN_WIDE_FUNDS.map((code) => ({ code, prior: p.funds[code].levy, tentative: t.funds[code].levy, rate: tw.fundRates[code].rate }))
const scaled = (f, levy) => (f.rate * levy) / f.tentative
const rateFor = (levyOf) => sum(fundRows.map((f) => scaled(f, levyOf(f))))
const outcomes = [
  { id: 'amended', levy: tw.levy + townWideChange, rate: rateFor((f) => f.tentative + effect(f.code).levy), printed: false, call: 'This prediction' },
  { id: 'tentative', levy: tw.levy, rate: tw.rate, printed: true, call: 'Less likely' },
  { id: 'further', levy: Math.round(tw.priorLevy * 1.01), rate: rateFor((f) => f.prior * 1.01), printed: false, call: 'Not proposed' },
]

// ── The adoption record ──────────────────────────────────────────────────────
const record = stages.transitions.filter((x) => x.from === 'tentative' && x.to === 'adopted')
const unchanged = record.filter((x) => x.fundsChanged === 0).length
const largest = record.reduce((a, b) => (Math.abs(b.levy.delta) > Math.abs(a.levy.delta) ? b : a))
if (Math.abs(townWideChange) <= Math.abs(largest.levy.delta)) fail(`the page says the six are the largest change on record, but ${largest.year} moved the levy ${usd(Math.abs(largest.levy.delta))}`)

// ── Where the September model missed ─────────────────────────────────────────
const prediction = read('public/data/budget-2027-prediction.json')
const model = read('public/data/budget-2027-lines.json').lines
const supplement = read('public/data/budget-supplement/current-lines.json').lines
const spending = supplement.filter((l) => l.kind === 'expenditure')
const OBJECT_CATEGORY = { 1: 'Personal Services', 2: 'Equipment & Capital Outlay', 4: 'Contractual', 8: 'Employee Benefits', 9: 'Interfund / Transfers' }
const objectCategory = (account) => {
  const code = Number(account.split('-')[3])
  return Number.isFinite(code) ? OBJECT_CATEGORY[Math.floor(code / 100)] ?? 'Other' : 'Other'
}
const GROUPS = [
  ['Salaries and wages', ['Personal Services']],
  ['Employee benefits', ['Employee Benefits']],
  ['Contractual', ['Contractual']],
  ['Equipment', ['Equipment & Capital Outlay']],
  ['Debt payments, transfers and reserves', ['Interfund / Transfers', 'Other']],
]
const groupOf = (category) => {
  const g = GROUPS.find(([, cats]) => cats.includes(category))
  if (!g) fail(`no group for spending category “${category}”`)
  return g?.[0]
}
const modelCategory = new Map(model.map((l) => [l.account, l.category]))
for (const l of model) if (objectCategory(l.account) !== l.category) fail(`${l.account}: the model files it under ${l.category}, its object code under ${objectCategory(l.account)}`)
const missRows = GROUPS.map(([label]) => ({ label, y2026: 0, model: 0, tentative: 0 }))
const at = (label) => missRows.find((r) => r.label === label)
for (const l of model) { const r = at(groupOf(l.category)); if (r) { r.y2026 += l.v2026; r.model += l.v2027 } }
for (const l of spending) { const r = at(groupOf(modelCategory.get(l.account) ?? objectCategory(l.account))); if (r) r.tentative += l.tentative ?? 0 }
for (const r of missRows) { r.y2026 = Math.round(r.y2026); r.model = Math.round(r.model); r.tentative = Math.round(r.tentative) }
const missTotals = { y2026: sum(missRows.map((r) => r.y2026)), model: sum(missRows.map((r) => r.model)), tentative: sum(missRows.map((r) => r.tentative)) }
if (missTotals.y2026 !== p.totals.appropriations) fail(`the model’s 2026 lines add up to ${usd(missTotals.y2026)}, not the Summary’s ${usd(p.totals.appropriations)}`)
if (missTotals.model !== prediction.totals.appropriations2027) fail(`the model’s 2027 lines add up to ${usd(missTotals.model)}, not its own total of ${usd(prediction.totals.appropriations2027)}`)
if (missTotals.tentative !== t.totals.appropriations) fail(`the Supplement’s 2027 lines add up to ${usd(missTotals.tentative)}, not the Tentative’s ${usd(t.totals.appropriations)}`)
const wages = at('Salaries and wages')
const debtRow = at('Debt payments, transfers and reserves')
if (!(wages.tentative > wages.model)) fail('the page says salaries and wages came in above the model, and they did not')
if (!(debtRow.model - debtRow.tentative > missTotals.model - missTotals.tentative)) fail('the page says the difference is debt, but the debt row does not carry it')

const line = (account) => supplement.find((l) => l.account === account)
const amount = (account, column) => line(account)?.[column] ?? 0
const debt = {
  fund: { y2026: p.funds.V01.appropriations, y2027: t.funds.V01.appropriations },
  cpf: { y2026: amount('CM4-9-9901-900-V01-00000', 'adopted'), y2027: amount('CM4-9-9901-900-V01-00000', 'tentative') },
  cpfToFundBalance: amount('CM4-9-9990-000-000-00000', 'tentative'),
  gf: { y2026: amount('A01-9-9901-900-V01-00000', 'adopted'), y2027: amount('A01-9-9901-900-V01-00000', 'tentative') },
}
const r642 = read('public/data/meetings/2026-07-07-fiscal.json').resolutions.find((r) => r.number === '2026-642')
const r641 = read('public/data/meetings/2026-07-07-fiscal.json').resolutions.find((r) => r.number === '2026-641')
const r762 = read('public/data/meetings/2026-08-04-fiscal.json').resolutions.find((r) => r.number === '2026-762')
if (!r642 || !/2018 Series B/.test(r642.title)) fail('2026-07-07-fiscal.json has no Resolution 2026-642 paying down the 2018 Series B bonds')
if (!r641 || !/Town Square/.test(r641.title)) fail('2026-07-07-fiscal.json has no Resolution 2026-641 on the Town Square note')
if (!r762 || !/Town Square/.test(r762.title)) fail('2026-08-04-fiscal.json has no Resolution 2026-762 on the Town Square note')
const cpfSavings = r642?.funding?.fundBalanceDraw
const saleProceeds = r642?.funding?.accounts?.find((a) => a.code === 'A01-2660-000-00000-1')?.amount
if (!r642?.funding?.fundBalanceFunds?.includes('Community Preservation Fund')) fail('Resolution 2026-642 does not draw on the Community Preservation Fund')

// ── The built pages ──────────────────────────────────────────────────────────
const built = 'out/predict-2027/index.html'
if (!existsSync(path(built))) { fail(`${built} was not built`); process.exit() }
const html = readFileSync(path(built), 'utf8')
const visible = (h) => h
  .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, ' ')
  .replace(/<!-- -->/g, '')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/\s+/g, ' ')
const block = (from, attr, end) => {
  const i = from.indexOf(attr)
  if (i === -1) { fail(`/predict-2027/ has no ${attr} block`); return '' }
  return from.slice(i, from.indexOf(end, i))
}
const expect = (where, body, strings) => { for (const s of strings) if (body && !visible(body).includes(s)) fail(`${where} does not show ${s}`) }

const section = block(html, 'data-updated-prediction', '</section>')
expect('the updated prediction', section, [
  `Made ${UPDATED}`,
  `${usd(prediction.levyEstimate.levy2027)}, up ${prediction.levyEstimate.levyIncreasePct}%`,
  `${usd(t.totals.levy)}, up ${growth(p.totals.levy, t.totals.levy).toFixed(2)}%`,
  `town-wide levy of ${usd(row('town-wide-levy').predicted)}, up ${row('town-wide-change').predicted.toFixed(2)}% from 2026`,
  `${usd(row('all-funds-levy').predicted)} across all funds, up ${growth(p.totals.levy, row('all-funds-levy').predicted).toFixed(2)}%`,
  usd(row('general-fund-savings').predicted), usd(row('general-fund-savings').tentative), usd(row('general-fund-savings').y2026), usd(deferred),
  `about ${usd(home(outcomes[0].rate))}`, `${signedUsd(home(outcomes[0].rate) - home(tw.priorRate))} over 2026’s ${usd(home(tw.priorRate))}`,
  'None expected', `within its ${READ_BY_HAND[2027].statedLimitPct}% limit`,
])

const table = block(section, 'data-updated-table', '</table>')
for (const r of rows) {
  const tr = block(table, `data-row="${r.id}"`, '</tr>')
  expect(`the prediction table’s ${r.id} row`, tr, [...(r.y2026 === null ? [] : [usd(r.y2026)]), show(r, r.tentative), show(r, r.predicted)])
  const cell = block(tr, 'data-adopted', '</td>')
  if (r.adopted === undefined || r.adopted === null) {
    if (adopted) fail(`the adopted budget is parsed but ${r.id} has no adopted figure`)
    else if (!visible(cell).includes('Not yet adopted')) fail(`the prediction table’s ${r.id} row should say “Not yet adopted”`)
  } else if (!visible(cell).includes(show(r, r.adopted))) fail(`the prediction table’s ${r.id} row should show the adopted ${show(r, r.adopted)}`)
}

expect('the basis', block(section, 'data-updated-basis', '</ul>'), [
  `items ${AMENDMENTS[0].item} to ${AMENDMENTS[AMENDMENTS.length - 1].item}`, PACKET.meeting.date, `dated ${PACKET.statementsDated}`,
  `${ARTICLE.outlet} reported on ${ARTICLE.published}`, `“${ARTICLE.reported.support}”`, `“${ARTICLE.reported.noResponse}”`,
  `Of the ${word(record.length)} on record, it adopted ${word(unchanged)} unchanged`,
  `in ${largest.year}, ${largest.levy.delta > 0 ? 'raised' : 'cut'} the levy ${usd(Math.abs(largest.levy.delta))}`,
  `would cut it ${usd(Math.abs(townWideChange))}`,
])

const scenarios = block(section, 'data-scenarios', '</table>')
for (const o of outcomes) {
  expect(`the ${o.id} outcome`, block(scenarios, `data-outcome="${o.id}"`, '</tr>'), [
    usd(o.levy), signedPct(growth(tw.priorLevy, o.levy)), `${o.printed ? '' : 'about '}${usd(home(o.rate))}`, o.call,
  ])
}

const miss = block(html, 'data-model-miss', '</section>')
const missTable = block(miss, 'data-model-miss-table', '</table>')
for (const r of [...missRows, { label: 'All 19 funds', ...missTotals }]) {
  const i = visible(missTable).indexOf(r.label)
  if (i === -1) { fail(`the model-miss table has no ${r.label} row`); continue }
  const rowText = visible(missTable).slice(i, i + 200)
  for (const s of [usd(r.y2026), usd(r.model), usd(r.tentative), signedUsd(r.tentative - r.model)]) if (!rowText.includes(s)) fail(`the model-miss table’s ${r.label} row does not show ${s}`)
}
expect('the model-miss note', miss, [
  `spends ${usd(missTotals.model - missTotals.tentative)} less than the model`,
  `${usd(wages.tentative - wages.model)} above it`,
  `raises them ${growth(wages.y2026, wages.tentative).toFixed(1)}%, against the model’s ${growth(wages.y2026, wages.model).toFixed(1)}%`,
])
expect('the debt paragraph', block(miss, 'data-model-miss-debt', '</p>'), [
  'Resolution 2026-642 (July 7, 2026)', usd(cpfSavings ?? 0), usd(saleProceeds ?? 0), 'Resolutions 2026-641 and 2026-762',
  usd(r762?.funding?.fundBalanceDraw ?? 0), `${usd(debt.fund.y2027)}, against ${usd(debt.fund.y2026)} in 2026`,
  `sent it ${usd(debt.cpf.y2026)} in 2026, sends ${debt.cpf.y2027 === 0 ? 'nothing' : usd(debt.cpf.y2027)} in 2027`,
  `puts ${usd(debt.cpfToFundBalance)} into its own fund balance`, `falls from ${usd(debt.gf.y2026)} to ${usd(debt.gf.y2027)}`,
])

// The September model is still on the page as it was made.
expect('the September model', html, ['The September model, made before the Tentative', usd(prediction.totals.appropriations2027), `+${prediction.levyEstimate.levyIncreasePct}%`])

// The pages that quote the prediction.
for (const [page, needle] of [
  ['out/answers/index.html', `As of ${UPDATED}, this site predicts the Board adopts it with the six amendments on its agenda, for a town-wide levy ${row('town-wide-change').predicted.toFixed(2)}% above 2026's.`],
  ['out/candidate-cost-benefit/index.html', `would lower the town-wide increase to ${row('town-wide-change').predicted.toFixed(2)}%, as this site’s updated prediction (${UPDATED}) expected.`],
]) {
  if (!existsSync(path(page))) { fail(`${page} was not built`); continue }
  if (!visible(readFileSync(path(page), 'utf8')).includes(needle)) fail(`${page} does not carry the updated prediction: ${needle}`)
}

if (!process.exitCode) {
  console.log(
    `Predict-2027 verification passed: a town-wide levy of ${usd(row('town-wide-levy').predicted)} (${signedPct(row('town-wide-change').predicted)}) predicted on ${UPDATED}, ` +
    `${adopted ? 'scored against the adopted budget' : 'awaiting the adopted budget'}; the September model’s ${usd(missTotals.model - missTotals.tentative)} miss traced to debt.`,
  )
}
