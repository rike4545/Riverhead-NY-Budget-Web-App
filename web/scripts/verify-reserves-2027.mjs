// /reserves/ prices its one-time plan and its notes against the 2027 budget.
// The figures come from data the site already parses, so this holds the built
// page to those records directly:
//   - plan option 1 is the 2027 budget's own General Fund draw (its Summary);
//   - options 2 and 3 are the 2027 Budget Supplement's BAN interest and
//     principal in the Debt Service Fund, and the 2026 figures they replaced
//     are gone;
//   - the water and sewer table matches the 2025 audit and the budgets'
//     Summaries, fund by fund;
//   - the General Fund's interest, 2023 to 2025, matches the Supplements;
//   - the tax-stabilization reserve's ceiling is 10% of the 2027 General and
//     Highway funds;
//   - Brookhaven's 2027 line matches its fund-balance table.

import { existsSync, readFileSync } from 'node:fs'
import { isAbsolute, relative, resolve, sep } from 'node:path'
import { AUDIT_2025 } from '../lib/audits.ts'
import { BROOKHAVEN_FUND_BALANCES } from '../lib/brookhaven-2027.ts'

const root = resolve(process.cwd())
const repo = resolve(root, '..')
const path = (...parts) => {
  const target = resolve(root, ...parts)
  const rel = relative(repo, target)
  if (rel === '..' || rel.startsWith(`..${sep}`) || isAbsolute(rel)) throw new Error(`refusing to read outside ${repo}: ${target}`)
  return target
}
const read = (p) => JSON.parse(readFileSync(path(p), 'utf8'))
const fail = (message) => { console.error(`RESERVES 2027 VERIFY FAILED: ${message}`); process.exitCode = 1 }
const usd = (n) => `$${Math.round(Math.abs(n)).toLocaleString('en-US')}`
const signed = (n) => `${n < 0 ? '−' : '+'}${usd(n)}`
const sum = (xs) => xs.reduce((s, x) => s + x, 0)

// ── The records ──────────────────────────────────────────────────────────────
const stages = read('public/data/history/budget-stages.json')
const stage2027 = ['adopted', 'preliminary', 'tentative'].find((st) => stages.years['2027']?.[st])
if (!stage2027) { fail('there is no 2027 budget in budget-stages.json'); process.exit() }
const budget2027 = stages.years['2027'][stage2027]
const adopted2026 = stages.years['2026'].adopted
const draw2027 = budget2027.funds.A01.fundBalance ?? 0
const ceiling = Math.round((budget2027.funds.A01.appropriations + budget2027.funds.DA1.appropriations) / 10)

const supplement = read('public/data/budget-supplement/current-lines.json')
const line = (account) => supplement.lines.find((l) => l.account === account)
const banInterest = line('V01-9-9730-700-000-00000')?.tentative
const banPrincipal = line('V01-9-9730-600-000-00000')?.tentative
if (!banInterest || !banPrincipal) fail('the 2027 Supplement has no BAN interest or principal line in the Debt Service Fund')

const fundBalance = (doc, codes) => sum(codes.map((c) => doc.funds[c]?.fundBalance ?? 0))
const SEWER = ['ES1', 'ES3', 'ES5']
const sewerDraws = { adopted: fundBalance(adopted2026, SEWER), proposed: fundBalance(budget2027, SEWER) }
const waterDraws = { adopted: fundBalance(adopted2026, ['EW1']), proposed: fundBalance(budget2027, ['EW1']) }
const { sewer, water } = AUDIT_2025.enterprise

const history = read('public/data/budget-supplement/revenue-history.json').accounts.find((a) => a.account === 'A01-2401-000-00000-G')
const interestYears = [2023, 2024, 2025].map((y) => Math.round(history?.actual[String(y)] ?? 0))
if (interestYears.some((v) => !v)) fail('the revenue history lacks the General Fund’s interest for 2023–2025')

const bhGeneral = BROOKHAVEN_FUND_BALANCES.major.find((r) => r.code === 'A')
const bhShare = `${((bhGeneral.start / bhGeneral.expenditures) * 100).toFixed(1)}%`

// ── The built page ───────────────────────────────────────────────────────────
const built = 'out/reserves/index.html'
if (!existsSync(path(built))) { fail(`${built} was not built`); process.exit() }
const html = readFileSync(path(built), 'utf8')
const visible = (h) => h
  .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, ' ')
  .replace(/<!-- -->/g, '')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/\s+/g, ' ')
const text = visible(html)
const has = (s) => text.includes(s)
const section = (attr) => {
  const i = html.indexOf(attr)
  if (i === -1) { fail(`/reserves/ has no ${attr} section`); return '' }
  return visible(html.slice(i, html.indexOf('</section>', i)))
}

const expected = [
  ['the 2027 budget’s draw as option 1', `The 2027 budget’s own draw`],
  ['option 1’s amount', usd(draw2027)],
  ['BAN interest', usd(banInterest ?? 0)],
  ['BAN principal', usd(banPrincipal ?? 0)],
  ['the tax-stabilization ceiling', usd(ceiling)],
  ['Brookhaven’s 2027 General Town Wide balance', usd(bhGeneral.start)],
  ['Brookhaven’s 2027 share', bhShare],
]
for (const [what, s] of expected) if (!has(s)) fail(`${what} (“${s}”) is not on the page`)

for (const stale of ['Crush BAN interest', 'Clean up the current General Fund mismatch', '$1,233,750', '$1,025,000', '$74,283', 'before it compounds']) {
  if (has(stale)) fail(`the page still shows the 2026 plan’s “${stale}”`)
}

const districts = section('data-district-reserves')
for (const s of [
  usd(sewer.cash), usd(water.cash), signed(sewer.unrestricted), signed(water.unrestricted), signed(sewer.change), signed(water.change),
  usd(sewerDraws.adopted), usd(sewerDraws.proposed), usd(waterDraws.adopted), usd(waterDraws.proposed),
  usd(sewerDraws.adopted + sewerDraws.proposed), usd(sewer.opebDueWithinYear + sewer.opebLater), `packet p. ${AUDIT_2025.enterprise.page}`,
]) if (districts && !districts.includes(s)) fail(`the water and sewer section does not show ${s}`)

const planned = section('data-planned-2027')
if (planned && !planned.includes(usd(draw2027))) fail('the 2027 note does not give the budget’s draw')
const earnings = section('data-reserve-earnings')
for (const s of [...interestYears.map(usd), usd(sum(interestYears))]) if (earnings && !earnings.includes(s)) fail(`the earnings note does not show ${s}`)

if (!process.exitCode) {
  console.log(`reserves 2027: option 1 is the 2027 ${stage2027} draw (${usd(draw2027)}); BAN interest ${usd(banInterest)} and principal ${usd(banPrincipal)} from the Supplement; sewer and water figures match the audit and the Summaries; interest ${usd(sum(interestYears))} over 2023–2025; tax-stabilization ceiling ${usd(ceiling)}; Brookhaven ${bhShare}`)
}
