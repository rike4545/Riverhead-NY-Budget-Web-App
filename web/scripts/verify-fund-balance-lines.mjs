// Checks that fund-balance draws are split by fund, and that no line is counted
// twice, on /fund-balance-draws/ and in the data behind it.
//
// lib/fund-balance-lines.ts turns a statement's 9999 lines (Appropriated Fund
// Balance) into one entry per fund, at the figure on the budget table the
// Board adopted wherever the ETL read that fund's 9999 row (2026-765: $280,000
// adopted, $150,000 in section G). This script:
//   1. tests that split on made-up statements the published data does not
//      contain yet: two districts in one resolution, a fund named without an
//      amount beside one with an amount, a table that corrects one fund;
//   2. checks every adopted draw in the published data: each resolution is
//      counted once, and its per-fund entries add up to its adopted lines;
//   3. recomputes the built page's totals from the source lines,
//      independently of the page's code. A line counted twice, on the General
//      Fund side or the other-funds side, fails here;
//   4. checks each meeting's "Drawn from fund balance" total, which the ETL
//      computes, against the same lines.
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { drawsByFund, fundBalanceLines } from '../lib/fund-balance-lines.ts'

const web = join(dirname(fileURLToPath(import.meta.url)), '..')
let failures = 0
const fail = (message) => { console.error(`VERIFY FAILED: ${message}`); failures += 1 }
const cents = (n) => Math.round(n * 100)
const GENERAL_FUND = 'General Fund'

/**
 * The draw by fund, worked out here without lib/fund-balance-lines.ts: section
 * G's 9999 lines grouped by fund, each group replaced by the adopted table's
 * rows in the same fund where the ETL read any. null where nothing is priced.
 */
function adoptedByFund(r) {
  const names = r.funding?.fundBalanceFunds ?? []
  const groups = new Map()
  ;(r.funding?.accounts ?? [])
    .filter((a) => a.kind === 'revenue' && a.code.split('-')[1] === '9999')
    .forEach((a, i) => {
      const fund = names[i] ?? a.fund
      const g = groups.get(fund) ?? { codes: new Set(), amounts: [] }
      g.codes.add(a.fund)
      if (a.amount != null) g.amounts.push(a.amount)
      groups.set(fund, g)
    })
  return new Map(Array.from(groups, ([fund, g]) => {
    const rows = (r.tableFundBalance ?? []).filter((t) => g.codes.has(t.fund)).map((t) => t.amount)
    const used = rows.length ? rows : g.amounts
    return [fund, used.length ? used.reduce((s, n) => s + n, 0) : null]
  }))
}

// ── 1. The split, on made-up statements ──────────────────────────────────────
const line = (code, amount, kind = 'revenue') => ({ code, kind, fund: code.split('-')[0], amount })
/** A statement whose 9999 lines draw on the named funds, in order. */
const statement = (lines, funds) => ({ accounts: lines, fundBalanceFunds: funds, fundBalanceClasses: funds.map(() => null) })
/** A 9999 row of the adopted budget table, as the ETL writes it. */
const row = (code, amount) => ({ code, fund: code.split('-')[0], amount, row: `${code} Appropriated Fund Balance $${amount.toLocaleString('en-US')}` })
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
    name: 'the adopted table outranks section G (2026-765)',
    funding: statement([line('A01-9999-000-00000-0', 150000), line('A01-1-1420-433-000-00000', 150000, 'appropriation')], [GENERAL_FUND]),
    table: [row('A01-9999-000-00000-0', 280000)],
    want: [{ fund: GENERAL_FUND, amount: 280000, unpricedLines: 0 }],
  },
  {
    name: 'a table corrects only the fund it names',
    funding: statement([line('A01-9999-000-00000-0', 100), line('DA1-9999-000-00000-0', 50)], [GENERAL_FUND, 'Highway Fund']),
    table: [row('A01-9999-000-00000-0', 120)],
    want: [{ fund: GENERAL_FUND, amount: 120, unpricedLines: 0 }, { fund: 'Highway Fund', amount: 50, unpricedLines: 0 }],
  },
  {
    name: 'a table row in a fund section G does not draw on is not counted',
    funding: statement([line('DA1-9999-000-00000-0', 171284.25)], ['Highway Fund']),
    table: [row('DA1-9999-000-00000-0', 171284.25), row('A01-9999-000-00000-0', 17972.55)],
    want: [{ fund: 'Highway Fund', amount: 171284.25, unpricedLines: 0 }],
  },
  {
    name: 'the table prices a line section G names without an amount',
    funding: statement([line('CM5-9999-000-00000-8', null)], ['Community Preservation — capital']),
    table: [row('CM5-9999-000-00000-8', 25000)],
    want: [{ fund: 'Community Preservation — capital', amount: 25000, unpricedLines: 0 }],
  },
  {
    name: 'two table rows in one fund add up',
    funding: statement([line('A01-9999-000-00000-0', 5000), line('A01-9999-000-00000-0', 108613)], [GENERAL_FUND, GENERAL_FUND]),
    table: [row('A01-9999-000-00000-0', 5000), row('A01-9999-000-00000-0', 108613)],
    want: [{ fund: GENERAL_FUND, amount: 113613, unpricedLines: 0 }],
  },
  { name: 'no section G', funding: null, table: [row('ES7-9999-000-00000-0', 650000)], want: [] },
]
for (const c of cases) {
  const entries = drawsByFund(c.funding, c.table ?? [])
  const got = shape(entries)
  if (JSON.stringify(got) !== JSON.stringify(c.want)) fail(`split, ${c.name}: got ${JSON.stringify(got)}, want ${JSON.stringify(c.want)}`)
  const want = cents(Array.from(adoptedByFund({ funding: c.funding, tableFundBalance: c.table }).values()).reduce((s, n) => s + (n ?? 0), 0))
  const sum = cents(entries.reduce((s, e) => s + (e.amount ?? 0), 0))
  if (want !== sum) fail(`split, ${c.name}: entries add to ${sum / 100}, its adopted lines to ${want / 100}`)
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
  const entries = drawsByFund(r.funding, r.tableFundBalance)
  const funds = entries.map((e) => e.fund)
  if (new Set(funds).size !== funds.length) fail(`${r.number}: a fund appears twice in its split`)
  if (new Set(lines.map((l) => l.fundName)).size !== entries.length) fail(`${r.number}: ${entries.length} entries for ${new Set(lines.map((l) => l.fundName)).size} funds`)
  const adopted = adoptedByFund(r)
  for (const e of entries) {
    if ((e.amount === null ? null : cents(e.amount)) !== (adopted.get(e.fund) == null ? null : cents(adopted.get(e.fund)))) {
      fail(`${r.number}: ${e.fund} is counted at ${e.amount}, its adopted lines add to ${adopted.get(e.fund)}`)
    }
  }
  for (const t of r.tableFundBalance ?? []) {
    if (!t.row.startsWith(t.code) || !t.row.replace(/[\s,]/g, '').includes(String(t.amount).replace(/\.0+$/, ''))) {
      fail(`${r.number}: table row "${t.row}" does not carry its account ${t.code} and figure ${t.amount}`)
    }
  }
}

// ── 3. The built page, against the source lines ──────────────────────────────
let generalFund = 0
let otherFunds = 0
for (const { r } of draws) {
  for (const [fund, amount] of adoptedByFund(r)) {
    if (fund === GENERAL_FUND) generalFund += amount ?? 0
    else otherFunds += amount ?? 0
  }
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

// ── 4. Each meeting's "Drawn from fund balance", against the same lines ──────
// etl/parse_fiscal_impact.py computes the total /fiscal-impact/ shows for each
// meeting (adopted_draws). It must count every draw as section 3 does.
let meetingTotals = 0
for (const slug of index.meetings) {
  const data = JSON.parse(readFileSync(join(meetingDir, `${slug}-fiscal.json`), 'utf8'))
  const want = (data.resolutions ?? []).reduce(
    (s, r) => s + Array.from(adoptedByFund(r).values()).reduce((n, a) => n + (a ?? 0), 0), 0)
  const got = data.summary?.fundBalanceDrawTotal ?? 0
  if (cents(got) !== cents(want)) fail(`${slug}: summary.fundBalanceDrawTotal is ${got}, its draws at the adopted figures add to ${want}`)
  else meetingTotals += 1
}
if (!failures) console.log(`Fund-balance lines: ${meetingTotals} meeting totals count each draw at its adopted figure.`)

if (failures) process.exit(1)
