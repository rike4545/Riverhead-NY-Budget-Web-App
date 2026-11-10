// Patterns across funds on /outliers/#fund-patterns (lib/fund-patterns.ts).
// - each fund's yearly collected and spent add up to its lines in the Budget
//   Supplements, with the non-cash entries, capital transfers and explained
//   one-offs taken out exactly as the page says;
// - budgets balance (spending budget = revenue estimate + appropriated fund
//   balance, within $10,000) in all but a handful of fund-years;
// - where the page says fund balance matches depreciation, it does to the dollar;
// - the least-squares fit agrees with a closed-form check;
// - the built page carries the section and its four patterns.
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fundPatterns, ols, isNonCash, capitalRecipient } from '../lib/fund-patterns.ts'
import { FUND_NAMES } from '../lib/account-names.ts'
import { ONE_OFF_EXPLAINED } from '../lib/account-changes.ts'

const root = process.cwd()
const fail = (m) => { console.error(`FUND PATTERNS VERIFY FAILED: ${m}`); process.exitCode = 1 }
const read = (p) => JSON.parse(readFileSync(join(root, p), 'utf8'))
const L = read('public/data/budget-supplement/line-history.json')
const R = read('public/data/budget-supplement/revenue-history.json')
const oneOffs = Object.entries(ONE_OFF_EXPLAINED).map(([account, o]) => ({ account, year: o.year, amount: o.amount, number: o.number }))
const patterns = fundPatterns(L.accounts, R.accounts, L.actualYears, L.adoptedYears, FUND_NAMES, oneOffs)

const fit = ols([1, 2, 3, 4], [2, 4, 6, 8])
if (Math.abs(fit.b - 2) > 1e-9 || Math.abs(fit.r2 - 1) > 1e-9) fail('the least-squares fit does not recover a perfect line')

let checked = 0
const unbalanced = []
for (const p of patterns) {
  const S = L.accounts.filter((l) => l.fund === p.fund)
  const V = R.accounts.filter((l) => l.fund === p.fund)
  for (const y of p.years) {
    const k = String(y.year)
    const all = S.reduce((s, l) => s + (l.actual[k] ?? 0), 0) - oneOffs.filter((o) => o.year === y.year && S.some((l) => l.account === o.account)).reduce((s, o) => s + o.amount, 0)
    const nonCash = S.filter(isNonCash).reduce((s, l) => s + (l.actual[k] ?? 0), 0)
    const capital = S.filter((l) => capitalRecipient(l)).reduce((s, l) => s + (l.actual[k] ?? 0), 0)
    if (Math.abs(all - nonCash - capital - y.spent) > 1) fail(`${p.fund} ${k}: spent is ${y.spent}, the lines give ${Math.round(all - nonCash - capital)}`)
    const collected = V.filter((l) => l.code !== '9999').reduce((s, l) => s + (l.actual[k] ?? 0), 0)
    if (Math.abs(collected - y.collected) > 1) fail(`${p.fund} ${k}: collected is ${y.collected}, the lines give ${Math.round(collected)}`)
    if (y.budget !== null && y.estimate !== null && y.fundBalance !== null) {
      checked++
      if (Math.abs(y.budget - y.estimate - y.fundBalance) > 10000) unbalanced.push(`${p.fund} ${k}`)
    }
  }
  for (const yr of p.fbMatchesDepreciation) {
    const k = String(yr)
    const fb = V.filter((l) => l.code === '9999').reduce((s, l) => s + (l.adopted[k] ?? 0), 0)
    const dep = S.filter((l) => l.account.split('-')[2] === '1994').reduce((s, l) => s + (l.adopted[k] ?? 0), 0)
    if (Math.round(fb) !== Math.round(dep) || fb <= 0) fail(`${p.fund} ${k}: fund balance ${fb} does not match depreciation ${dep}`)
  }
}
// The Supplements print a handful of fund-years whose spending budget and revenue budget differ
// (ES1 2020, EW1 2022, CM2 2019 and 2022 when this was written); more than a few would mean the data moved.
if (unbalanced.length > Math.max(5, checked * 0.06)) fail(`${unbalanced.length} of ${checked} fund-years do not balance: ${unbalanced.join(', ')}`)
const gf = patterns.find((p) => p.fund === 'A01')
if (!gf?.flags.includes('revenue-low') || !gf.revenueBeat.since) fail('the General Fund revenue pattern is not found')
for (const f of ['ES1', 'EW1', 'ES5']) if (!patterns.find((p) => p.fund === f)?.flags.includes('fb-is-depreciation')) fail(`${f} fund balance should match depreciation`)

const page = join(root, 'out/outliers/index.html')
if (!existsSync(page)) fail('out/outliers/index.html was not built')
else {
  const html = readFileSync(page, 'utf8')
  for (const k of ['data-fund-patterns', 'data-pattern="revenue-low"', 'data-pattern="capital-off-budget"', 'data-pattern="fb-is-depreciation"']) if (!html.includes(k)) fail(`the outliers page lacks ${k}`)
}

if (!process.exitCode) console.log(`fund patterns: ${patterns.length} funds, each year's collected and spent matching its lines; ${patterns.filter((p) => p.flags.length).length} funds with a pattern (${patterns.flatMap((p) => p.flags).length} in all); budgets balance in ${checked - unbalanced.length} of ${checked} fund-years; fund balance matches depreciation in ${patterns.filter((p) => p.flags.includes('fb-is-depreciation')).map((p) => p.fund).join(', ')}.`)
