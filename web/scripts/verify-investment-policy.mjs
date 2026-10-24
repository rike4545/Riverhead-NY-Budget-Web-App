// /investment-policy/ compares Riverhead's annual investment policy with four
// neighbors'. This checks lib/investment-policy.ts against the documents' text
// (etl/data/investment-policy/sources.json, and the meeting minutes in
// etl/data/meetings/ for Riverhead's 2023 to 2025 policies):
//   - every quotation appears in the document it names, ignoring spacing;
//   - the 2025 audit's cash figures are as quoted, and insured plus
//     collateralized equals the bank balance;
//   - Riverhead's twelve depositories are the same in all four years, its
//     Appendix A has eleven unmarked lines in each, and "his deputy" became
//     "her deputy" in 2025;
//   - Smithtown's and Southold's dollar amounts span the ranges the page gives;
// then that the built page shows every cell, improvement, fix, figure and source.

import { existsSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import {
  CASH_2025, COMPARISON, IMPROVEMENTS, RIVERHEAD_DEPOSITORIES, RIVERHEAD_YEARS, SOURCES, TOWNS, WORDING_FIXES,
} from '../lib/investment-policy.ts'

const fail = (message) => { console.error(`INVESTMENT POLICY VERIFY FAILED: ${message}`); process.exitCode = 1 }
const repo = resolve(process.cwd(), '..')

const store = JSON.parse(readFileSync(join(repo, 'etl/data/investment-policy/sources.json'), 'utf8'))
const text = Object.fromEntries(store.documents.map((d) => [d.id, d.text]))
for (const d of ['2023-01-04', '2024-01-03', '2025-01-07']) text[`minutes-${d}`] = readFileSync(join(repo, `etl/data/meetings/${d}-minutes.txt`), 'utf8')

// Compare without spacing or typographic quotes: the PDFs' text breaks lines and words at random.
const squash = (s) => s.replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[–—­]/g, '-').replace(/\s+/g, '')
const squashed = Object.fromEntries(Object.entries(text).map(([k, v]) => [k, squash(v)]))

for (const id of Object.keys(SOURCES)) if (!(id in text)) fail(`source ${id} has no stored text`)
for (const d of store.documents) if (!(d.id in SOURCES)) fail(`stored document ${d.id} is not listed in SOURCES`)

let quotes = 0
const check = (q, where) => {
  quotes += 1
  if (!(q.doc in SOURCES)) return fail(`${where}: unknown document ${q.doc}`)
  if (!squashed[q.doc].includes(squash(q.text))) fail(`${where}: “${q.text.slice(0, 70)}” is not in ${q.doc}`)
}
for (const y of RIVERHEAD_YEARS) for (const q of y.evidence ?? []) check(q, `${y.year}`)
for (const q of CASH_2025.quotes) check(q, 'cash')
for (const r of COMPARISON) {
  for (const q of r.quotes) check(q, r.topic)
  for (const t of TOWNS) if (!r.cells[t]?.trim()) fail(`${r.topic}: no cell for ${t}`)
}
for (const imp of IMPROVEMENTS) {
  if (!imp.quotes.length) fail(`${imp.title}: no quotation`)
  for (const q of imp.quotes) check(q, imp.title)
}

// The audit's figures.
const money = (n) => `$${n.toLocaleString('en-US')}`
for (const k of ['bookBalance', 'fiduciary', 'bankBalance', 'fdic', 'collateral', 'nyclass']) {
  if (!text['riverhead-audit-2025'].includes(money(CASH_2025[k]))) fail(`the audit does not show ${k} ${money(CASH_2025[k])}`)
}
if (CASH_2025.fdic + CASH_2025.collateral !== CASH_2025.bankBalance) fail('insured plus collateralized does not equal the bank balance')

// Riverhead, four years.
const policyText = { 2023: text['minutes-2023-01-04'], 2024: text['minutes-2024-01-03'], 2025: text['minutes-2025-01-07'], 2026: text['riverhead-2026'] }
for (const [year, t] of Object.entries(policyText)) {
  const s = squash(t)
  if (!s.includes(squash(RIVERHEAD_DEPOSITORIES))) fail(`${year}: the depository list differs from the page's`)
  const start = s.indexOf(squash('Appendix A Schedule of Eligible Securities'))
  if (start < 0) { fail(`${year}: no Appendix A`); continue }
  const appendix = t.slice(t.search(/Appendix A\s+Schedule of Eligible Securities/))
  const blanks = (appendix.match(/_{4,}\s*\(([ivx]+)\)/g) ?? []).length
  if (blanks !== 11) fail(`${year}: Appendix A has ${blanks} unmarked lines, expected 11`)
  if (/\b[Xx✓✔]\s*_*\s*\((?:[ivx]+)\)/.test(appendix)) fail(`${year}: Appendix A has a marked line`)
  const deputy = year < 2025 ? 'his deputy' : 'her deputy'
  if (!s.includes(squash(`Financial Administrator or ${deputy}`))) fail(`${year}: expected “${deputy}”`)
  for (const [was] of WORDING_FIXES) {
    const quoted = was.match(/“(.+)”/)?.[1] ?? was.replace(/ \(.*/, '')
    if (!s.includes(squash(quoted))) fail(`${year}: the wording “${quoted}” is not in the policy`)
  }
}

// Neighbors' dollar amounts.
const amounts = (t) => [...t.matchAll(/\$([\d,]{7,})/g)].map((m) => Number(m[1].replace(/,/g, '')))
const smith = amounts(text['smithtown-2026'].slice(text['smithtown-2026'].indexOf('APPENDIX B')))
if (smith.length !== 7 || Math.min(...smith) !== 30_000_000 || Math.max(...smith) !== 200_000_000) fail(`Smithtown's Appendix B: ${smith.join(', ')}`)
const sold = text['southold-2026']
const designations = amounts(sold.slice(sold.indexOf('2026 Depositories'), sold.indexOf('AND BE FURTHER RESOLVED')))
if (designations.length !== 10 || Math.min(...designations) !== 5_000_000 || Math.max(...designations) !== 70_000_000) fail(`Southold's designations: ${designations.join(', ')}`)

// The built page.
const built = join(process.cwd(), 'out', 'investment-policy', 'index.html')
if (!existsSync(built)) fail('out/investment-policy/index.html is missing; run the build first')
else {
  const decode = (s) => s.replace(/<!-- -->/g, '').replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&amp;/g, '&')
  const html = decode(readFileSync(built, 'utf8'))
  const must = [
    ...COMPARISON.flatMap((r) => [r.topic, ...TOWNS.map((t) => r.cells[t])]),
    ...RIVERHEAD_YEARS.flatMap((y) => [y.change, y.resolution]),
    ...IMPROVEMENTS.flatMap((i) => [i.title, i.body]),
    ...WORDING_FIXES.flat(),
    ...['bookBalance', 'bankBalance', 'fdic', 'collateral', 'nyclass'].map((k) => money(CASH_2025[k])),
    ...Object.values(SOURCES).flatMap((s) => [s.label, s.url]),
    'not legal or audit advice',
  ]
  for (const t of must) if (!html.includes(t)) fail(`the built page is missing “${t.slice(0, 80)}”`)
}

if (!process.exitCode) console.log(`investment policy: ${quotes} quotations found in ${Object.keys(SOURCES).length} documents; four Riverhead years, five towns, ${IMPROVEMENTS.length} improvements check out`)
