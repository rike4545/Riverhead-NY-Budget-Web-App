// Checks that fund-balance draws are split by fund, and that no line is counted
// twice, on /fund-balance-draws/ and in the data behind it.
//
// lib/fund-balance-lines.ts turns a statement's 9999 lines (Appropriated Fund
// Balance) into one entry per fund. This script:
//   1. tests that split on made-up statements the published data does not
//      contain yet: two districts in one resolution, a fund named without an
//      amount beside one with an amount;
//   2. checks every adopted draw in the published data: each resolution is
//      counted once, and its per-fund entries add up to its own 9999 lines;
//   3. recomputes the built page's totals from the source lines,
//      independently of the page's code. A line counted twice, on the General
//      Fund side or the other-funds side, fails here.
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { drawsByFund, fundBalanceLines } from '../lib/fund-balance-lines.ts'

const web = join(dirname(fileURLToPath(import.meta.url)), '..')
let failures = 0
const fail = (message) => { console.error(`VERIFY FAILED: ${message}`); failures += 1 }
const cents = (n) => Math.round(n * 100)
const GENERAL_FUND = 'General Fund'

// ── 1. The split, on made-up statements ──────────────────────────────────────
const line = (code, amount, kind = 'revenue') => ({ code, kind, fund: code.split('-')[0], amount })
/** A statement whose 9999 lines draw on the named funds, in order. */
const statement = (lines, funds) => ({ accounts: lines, fundBalanceFunds: funds, fundBalanceClasses: funds.map(() => null) })
const shape = (entries) => entries.map(({ fund, amount, unpricedLines }) => ({ fund, amount, unpricedLines }))

const cases = [
  {
    name: 'two districts in one resolution, both priced',
    funding: statement([line('SL1-9999-000-00000-0', 98000), line('EW1-9999-000-00000-0', 35000), line('SL1-5-5182-412-000-00000', 133000, 'appropriation')], ['Street Lighting District', 'Water District']),
    want: [{ fund: 'Street Lighting District', amount: 98000, unpricedLines: 0 }, { fund: 'Water District', amount: 35000, unpricedLines: 0 }],
  },
  {
    name: 'a district named without an amount beside a priced one',
    funding: statement([line('ES7-9999-000-00000-0', 800000), line('CM5-9999-000-00000-8', null)], ['Sewer District (ES7)', 'Community Preservation — capital']),
    want: [{ fund: 'Sewer District (ES7)', amount: 800000, unpricedLines: 0 }, { fund: 'Community Preservation — capital', amount: null, unpricedLines: 1 }],
  },
  {
    name: 'the General Fund beside a district',
    funding: statement([line('A01-9999-000-00000-0', 10000), line('DA1-9999-000-00000-0', 20000)], [GENERAL_FUND, 'Highway Fund']),
    want: [{ fund: GENERAL_FUND, amount: 10000, unpricedLines: 0 }, { fund: 'Highway Fund', amount: 20000, unpricedLines: 0 }],
  },
  {
    name: 'two lines in one fund',
    funding: statement([line('A01-9999-000-00000-0', 48128.53), line('A01-9999-000-00000-0', 31871.47)], [GENERAL_FUND, GENERAL_FUND]),
    want: [{ fund: GENERAL_FUND, amount: 80000, unpricedLines: 0 }],
  },
  {
    name: 'a priced and an unpriced line in one fund',
    funding: statement([line('EW1-9999-000-00000-0', 30000), line('EW1-9999-000-00000-0', null)], ['Water District', 'Water District']),
    want: [{ fund: 'Water District', amount: 30000, unpricedLines: 1 }],
  },
  {
    name: 'other revenue and appropriation lines are not fund balance',
    funding: statement([line('A01-9999-000-00000-0', 1874218), line('A01-2410-357-00000-1', 122500), line('A01-9-9901-900-V01-00000', 1996718, 'appropriation')], [GENERAL_FUND]),
    want: [{ fund: GENERAL_FUND, amount: 1874218, unpricedLines: 0 }],
  },
  {
    name: 'an adopted-table figure stands when the draw is in one fund',
    funding: statement([line('A01-9999-000-00000-0', 150000)], [GENERAL_FUND]),
    table: 280000,
    want: [{ fund: GENERAL_FUND, amount: 280000, unpricedLines: 0 }],
  },
  {
    name: 'an adopted-table figure is ignored when the draw spans funds',
    funding: statement([line('A01-9999-000-00000-0', 100), line('DA1-9999-000-00000-0', 50)], [GENERAL_FUND, 'Highway Fund']),
    table: 999,
    want: [{ fund: GENERAL_FUND, amount: 100, unpricedLines: 0 }, { fund: 'Highway Fund', amount: 50, unpricedLines: 0 }],
  },
  { name: 'no section G', funding: null, want: [] },
]
for (const c of cases) {
  const got = shape(drawsByFund(c.funding, c.table ?? null))
  if (JSON.stringify(got) !== JSON.stringify(c.want)) fail(`split, ${c.name}: got ${JSON.stringify(got)}, want ${JSON.stringify(c.want)}`)
  if (c.table == null) {
    const lines = cents(fundBalanceLines(c.funding).reduce((s, l) => s + (l.amount ?? 0), 0))
    const entries = cents(got.reduce((s, e) => s + (e.amount ?? 0), 0))
    if (lines !== entries) fail(`split, ${c.name}: entries add to ${entries / 100}, its lines to ${lines / 100}`)
  }
}

// ── 2. Every adopted draw in the published data ──────────────────────────────
const meetingDir = join(web, 'public/data/meetings')
const index = JSON.parse(readFileSync(join(meetingDir, 'fiscal-index.json'), 'utf8'))
const draws = []
for (const slug of index.meetings) {
  for (const r of JSON.parse(readFileSync(join(meetingDir, `${slug}-fiscal.json`), 'utf8')).resolutions ?? []) {
    if (r.funding?.drawsFundBalance !== true || r.vote?.adopted !== true) continue
    draws.push({ slug, r })
  }
}
const counted = new Map()
for (const { slug, r } of draws) {
  const key = r.number ?? `${slug}:${r.title}`
  if (counted.has(key)) fail(`resolution ${key} is an adopted draw in both ${counted.get(key)} and ${slug}`)
  counted.set(key, slug)
  const lines = fundBalanceLines(r.funding)
  const entries = drawsByFund(r.funding)
  const funds = entries.map((e) => e.fund)
  if (new Set(funds).size !== funds.length) fail(`${r.number}: a fund appears twice in its split`)
  if (new Set(lines.map((l) => l.fundName)).size !== entries.length) fail(`${r.number}: ${entries.length} entries for ${new Set(lines.map((l) => l.fundName)).size} funds`)
  const lineTotal = cents(lines.reduce((s, l) => s + (l.amount ?? 0), 0))
  const entryTotal = cents(entries.reduce((s, e) => s + (e.amount ?? 0), 0))
  if (lineTotal !== entryTotal) fail(`${r.number}: its entries add to ${entryTotal / 100}, its 9999 lines to ${lineTotal / 100}`)
}

// ── 3. The built page, against the source lines ──────────────────────────────
// The adopted-table figures declared in lib/fiscal-commitments-2027.ts replace
// section G for the General Fund (2026-765). Read them as verify-build does,
// and apply each only where the record still shows the same gap.
const src = readFileSync(join(web, 'lib/fiscal-commitments-2027.ts'), 'utf8')
const start = src.indexOf('const ADOPTED_TABLE')
const declared = new Map(
  Array.from((start === -1 ? '' : src.slice(start, src.indexOf('\n\n', start)))
    .matchAll(/'(\d{4}-\d+)':\s*\{\s*statement:\s*([\d_.]+),\s*table:\s*([\d_.]+)/g))
    .map((m) => [m[1], { statement: Number(m[2].replace(/_/g, '')), table: Number(m[3].replace(/_/g, '')) }]),
)
if (start !== -1 && declared.size === 0) fail('could not read ADOPTED_TABLE in lib/fiscal-commitments-2027.ts')

let generalFund = 0
let otherFunds = 0
for (const { r } of draws) {
  const lines = fundBalanceLines(r.funding)
  const gf = lines.filter((l) => l.fundName === GENERAL_FUND).reduce((s, l) => s + (l.amount ?? 0), 0)
  const d = declared.get(r.number)
  const gap = r.statementBelowTable
  const tableApplies = d && gap && gap.statement === d.statement && gap.table === d.table &&
    r.funding.fundBalanceDraw === d.statement && lines.every((l) => l.fundName === GENERAL_FUND)
  generalFund += tableApplies ? d.table : gf
  otherFunds += lines.filter((l) => l.fundName !== GENERAL_FUND).reduce((s, l) => s + (l.amount ?? 0), 0)
}

const pageFile = join(web, 'out/fund-balance-draws/index.html')
if (!existsSync(pageFile)) {
  fail('out/fund-balance-draws/index.html is missing; build the site first')
} else {
  const html = readFileSync(pageFile, 'utf8')
  const attr = (tag, name) => tag.match(new RegExp(`${name}="([^"]*)"`))?.[1]
  const tags = (name) => Array.from(html.matchAll(new RegExp(`<[^>]*\\b${name}="[^"]*"[^>]*>`, 'g'))).map((m) => m[0])
  const amount = (v) => (v === undefined || v === '' ? null : Number(v))

  // Other funds: one group per fund, each adding up to its own rows.
  const groups = tags('data-other-fund').map((t) => ({ fund: attr(t, 'data-other-fund'), total: amount(attr(t, 'data-other-fund-total')) }))
  const rows = tags('data-other-fund-row').map((t) => ({ fund: attr(t, 'data-other-fund-row'), amount: amount(attr(t, 'data-amount')) }))
  const pageOther = amount(tags('data-other-funds-total').map((t) => attr(t, 'data-other-funds-total'))[0])
  if (!groups.length) fail('/fund-balance-draws/ shows no other-fund groups; the markup may have changed')
  if (new Set(groups.map((g) => g.fund)).size !== groups.length) fail('/fund-balance-draws/ lists a fund twice')
  for (const g of groups) {
    const own = rows.filter((r) => r.fund === g.fund)
    const priced = own.filter((r) => r.amount !== null)
    const sum = priced.length ? cents(priced.reduce((s, r) => s + r.amount, 0)) : null
    if ((g.total === null ? null : cents(g.total)) !== sum) fail(`/fund-balance-draws/: ${g.fund} shows ${g.total}, its rows add to ${sum === null ? null : sum / 100}`)
  }
  const groupSum = cents(groups.reduce((s, g) => s + (g.total ?? 0), 0))
  if (pageOther === null || groupSum !== cents(pageOther)) fail(`/fund-balance-draws/: the fund subtotals add to ${groupSum / 100}, the page's total is ${pageOther}`)
  if (pageOther === null || cents(pageOther) !== cents(otherFunds)) fail(`/fund-balance-draws/: other funds total ${pageOther}, the source lines add to ${otherFunds}`)

  // General Fund: the documented and other-tier totals together are every
  // General Fund 9999 line, once.
  const ledger = Object.fromEntries(tags('data-ledger').map((t) => [attr(t, 'data-ledger'), amount(attr(t, 'data-ledger-total'))]))
  const documented = ledger['Charged to A01-9999']
  const otherTier = ledger['other-tier'] ?? 0
  if (documented == null) fail('/fund-balance-draws/: the "Charged to A01-9999" total is missing')
  else if (cents(documented + otherTier) !== cents(generalFund)) {
    fail(`/fund-balance-draws/: General Fund draws on the page add to ${documented + otherTier}, the source lines to ${generalFund}`)
  }
  if (!failures) {
    console.log(
      `Fund-balance lines: ${cases.length} split cases pass; ${draws.length} adopted draws each counted once; ` +
      `/fund-balance-draws/ matches its source lines (General Fund ${generalFund.toLocaleString('en-US')}, ` +
      `other funds ${otherFunds.toLocaleString('en-US')} in ${groups.length} funds).`,
    )
  }
}

if (failures) process.exit(1)
