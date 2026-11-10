// /outliers/#by-category: recurring costs by category (lib/spending-categories.ts).
// - every account in a category has the category's object code, and every
//   account with one of those codes is counted;
// - the history agrees with the 2027 Supplement's own columns for each line;
// - each year's totals add up from the lines, and the one-off entries are
//   exactly the line-years ten times their budget and $250,000 or more;
// - a projection is shown only where the June 30 share has been steady;
// - the built page shows each category's figures.
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { CATEGORIES, spendingCategories } from '../lib/spending-categories.ts'

const root = process.cwd()
const fail = (m) => { console.error(`SPENDING CATEGORIES VERIFY FAILED: ${m}`); process.exitCode = 1 }
const read = (p) => JSON.parse(readFileSync(join(root, p), 'utf8'))
const usd = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

const history = read('public/data/budget-supplement/line-history.json').accounts
const current = read('public/data/budget-supplement/current-lines.json').lines
const o = read('public/data/budget-supplement/current-outliers.json')
const flags = ['overBudget', 'chronicOverrun', 'noBudget'].flatMap((k) => (o[k] ?? []).map((x) => ({ account: x.account, flag: x.flag })))
const cats = spendingCategories(history, flags)

const objects = new Set(CATEGORIES.flatMap((c) => c.objects))
if (objects.size !== CATEGORIES.reduce((n, c) => n + c.objects.length, 0)) fail('an object code is in two categories')

for (const c of cats) {
  const ls = history.filter((l) => c.objects.includes(l.account.split('-')[3]))
  if (ls.length !== c.lines) fail(`${c.label}: counts ${c.lines} accounts, the history has ${ls.length}`)
  if (ls.length === 0) fail(`${c.label} has no accounts`)
  for (const l of ls) {
    const now = current.find((x) => x.account === l.account)
    if (now && (now.actual !== (l.actual[c.lastActual] ?? 0) || now.adopted !== (l.adopted[c.thisYear] ?? 0) || now.ytd !== (l.ytd[c.thisYear] ?? 0) || now.preliminary !== l.proposed)) {
      fail(`${l.account}: the Supplement history and the 2027 Supplement disagree`)
    }
  }
  for (const y of c.years) {
    const budget = ls.reduce((s, l) => s + (l.adopted[y.year] ?? 0), 0)
    const actual = ls.reduce((s, l) => s + (l.actual[y.year] ?? 0), 0)
    const oneOff = ls.reduce((s, l) => {
      const a = l.actual[y.year] ?? 0
      return s + (a >= 250_000 && a >= 10 * Math.max(l.adopted[y.year] ?? 0, 1) ? a : 0)
    }, 0)
    if (Math.round(budget) !== Math.round(y.budget) || Math.round(actual) !== Math.round(y.actual) || Math.round(actual - oneOff) !== Math.round(y.usual)) fail(`${c.label} ${y.year}: totals do not add up from the lines`)
  }
  if (c.range && !(c.range.low <= c.range.high && Math.abs(c.range.low * c.range.maxShare - c.ytdNow) < 1 && Math.abs(c.range.high * c.range.minShare - c.ytdNow) < 1)) fail(`${c.label}: the projected range does not follow from the June 30 shares`)
  if (c.pace !== null && c.range && (c.pace < c.range.low - 1 || c.pace > c.range.high + 1)) fail(`${c.label}: the single estimate falls outside its own range`)
  if (c.pace !== null && (c.shares.some((s) => s === null) || Math.max(...c.shares) - Math.min(...c.shares) > 0.15)) fail(`${c.label}: projected although the June 30 share is not steady`)
}

const page = join(root, 'out/outliers/index.html')
if (!existsSync(page)) fail('out/outliers/index.html was not built')
else {
  const raw = readFileSync(page, 'utf8')
  const html = raw.replace(/<[^>]+>/g, ' ').replace(/&#x27;|&#39;/g, "'").replace(/&amp;/g, '&').replace(/\s+/g, ' ')
  if (!raw.includes('data-spending-categories')) fail('the outliers page has no category section')
  for (const c of cats) {
    if (!raw.includes(`data-category-card="${c.id}"`)) fail(`the page has no card for ${c.label}`)
    const last = c.years[c.years.length - 1]
    for (const n of [last.budget, last.usual, c.budgetNow, c.ytdNow, c.proposed]) if (!html.includes(usd(n))) fail(`${c.label}: the page does not show ${usd(n)}`)
    for (const one of c.oneOffs) if (!raw.includes(`data-one-off="${one.account}"`) || !html.includes(usd(one.actual))) fail(`${c.label}: the one-off ${one.account} is not explained on the page`)
  }
}

if (!process.exitCode) {
  console.log(`spending categories: ${cats.map((c) => `${c.label} ${c.lines}`).join(', ')}; ${cats.filter((c) => c.pace !== null).length} projected; one-offs: ${cats.flatMap((c) => c.oneOffs.map((x) => `${x.account} ${x.year}`)).join(', ') || 'none'}.`)
}
