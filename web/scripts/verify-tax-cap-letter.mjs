// /tax-cap-letter/ sets the supervisors' letter beside figures read by hand
// from the 2027 Tentative (lib/tax-cap-letter.ts). This checks each of them
// against the text of the page it was read from, and checks the two comparisons
// the page's wording depends on, so a misread number or a changed budget fails
// the build instead of reaching the page.

import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { BENEFIT_LINES_2027, BENEFIT_LINES_PAGE, REFUSE_2027, benefitGrowth2027, ASKS } from '../lib/tax-cap-letter.ts'

const root = process.cwd()
const path = (...parts) => join(root, ...parts)
const fail = (message) => { console.error(`TAX-CAP LETTER VERIFY FAILED: ${message}`); process.exitCode = 1 }
const usd = (n) => `$${n.toLocaleString('en-US')}`

// ── Each line against the Tentative's own text ──────────────────────────────
const doc = JSON.parse(readFileSync(path('public/data/financial-reports/documents/2027-2027-tentative-budget-pdf.json'), 'utf8'))
const pageText = (n) => { const p = doc.pages[n - 1]; return typeof p === 'string' ? p : (p?.text ?? '') }
const money = (s) => Number(s.replace(/,/g, ''))

function checkLine(line, page) {
  const row = pageText(page).split('\n').find((l) => l.startsWith(line.account))
  if (!row) return fail(`${line.account} is not on page ${page} of the 2027 Tentative`)
  // Adopted 2026, Department Requested 2027, Tentative 2027
  const figures = row.match(/[\d,]+\.\d{2}/g)?.map(money) ?? []
  if (figures.length !== 3) return fail(`${line.account}: expected three columns, read ${figures.length}`)
  if (figures[0] !== line.adopted2026) fail(`${line.account}: 2026 adopted is ${usd(figures[0])}, not ${usd(line.adopted2026)}`)
  if (figures[2] !== line.tentative2027) fail(`${line.account}: 2027 Tentative is ${usd(figures[2])}, not ${usd(line.tentative2027)}`)
}
for (const line of BENEFIT_LINES_2027) checkLine(line, BENEFIT_LINES_PAGE)
checkLine(REFUSE_2027, REFUSE_2027.page)

const sum = BENEFIT_LINES_2027.reduce((s, l) => s + l.tentative2027 - l.adopted2026, 0)
if (sum !== benefitGrowth2027) fail(`The benefit lines grow ${usd(sum)}, not ${usd(benefitGrowth2027)}`)

// ── The comparisons the page's wording rests on ─────────────────────────────
const stages = JSON.parse(readFileSync(path('public/data/history/budget-stages.json'), 'utf8')).years
const t = stages['2027']?.tentative?.funds?.A01
const prior = stages['2026']?.adopted?.funds?.A01
if (!t || !prior) fail('The 2027 Tentative or the 2026 adopted General Fund is missing from budget-stages.json')
else {
  const levyChange = t.levy - prior.levy
  const revenueChange = t.revenues - prior.revenues
  // "On their own, those five lines take up about the entire increase."
  if (Math.abs(benefitGrowth2027 - levyChange) / levyChange > 0.02) fail(`The benefit lines grow ${usd(benefitGrowth2027)}, not about the General Fund levy increase of ${usd(levyChange)}; reword the page`)
  // "its other revenues rise … more than the levy does."
  if (!(revenueChange > levyChange)) fail(`General Fund revenues rise ${usd(revenueChange)}, not more than the levy's ${usd(levyChange)}; reword the page`)
}

// The refuse district's only revenue is the property tax the page says it is.
const refuseRows = pageText(REFUSE_2027.page).split('\n').filter((l) => l.startsWith('SR1-'))
if (refuseRows.length !== 1) fail(`The refuse district has ${refuseRows.length} revenue lines on page ${REFUSE_2027.page}, not one`)

for (const a of ASKS) if (!a.source.url.startsWith('https://')) fail(`A quoted ask has no source link: "${a.text.slice(0, 40)}…"`)

// ── The built page ──────────────────────────────────────────────────────────
const built = path('out/tax-cap-letter/index.html')
if (!existsSync(built)) fail('out/tax-cap-letter/index.html was not built')
else {
  const html = readFileSync(built, 'utf8')
  for (const figure of [usd(benefitGrowth2027), usd(REFUSE_2027.tentative2027)]) {
    if (!html.includes(figure)) fail(`The built page does not show ${figure}`)
  }
}

if (!process.exitCode) console.log(`Tax-cap letter: ${BENEFIT_LINES_2027.length + 1} hand-read lines match the 2027 Tentative; benefit growth ${usd(benefitGrowth2027)}.`)
