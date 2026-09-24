// The Supervisor's 2027 letter is a scanned image, so what it says is typed in
// by hand (lib/tentative-letters.ts). This checks every figure in it that can be
// checked: the numbers against the quotes they were read from, and against the
// budget's own Summary as the parser read it. A misread number fails the build
// instead of reaching a page. It also checks the pages built from it, and that
// the all-funds levy is never again called the town-wide levy.

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { READ_BY_HAND, LETTER_2027 as L } from '../lib/tentative-letters.ts'
import { TOWN_WIDE_FUNDS, TRANSFER_FUNDED } from '../lib/fund-groups.ts'

const root = process.cwd()
const path = (...parts) => join(root, ...parts)
const fail = (message) => { console.error(`TENTATIVE LETTER VERIFY FAILED: ${message}`); process.exitCode = 1 }
const usd = (n) => `$${n.toLocaleString('en-US')}`

// ── The numbers against the words they were read from ──────────────────────────
const letter = READ_BY_HAND[L.year]
if (!letter) fail(`No hand-read letter for ${L.year}`)
else {
  if (!letter.taxCap?.includes(`${letter.statedLimitPct}%`)) fail(`The tax-cap quote does not say ${letter.statedLimitPct}%`)
  if (!L.staffing.quote.includes(`${letter.statedLimitPct}%`)) fail(`The staffing quote gives a different limit from ${letter.statedLimitPct}%`)
  if (new Date(letter.dated) > new Date(`September 30, ${L.year - 1}`)) fail(`The letter is dated ${letter.dated}, after the September 30 filing deadline`)
}
const quoted = [
  [L.operating.quote, usd(L.operating.total)], [L.operating.quote, usd(L.operating.growth)],
  [L.fundBalance.quote, usd(L.fundBalance.reduction)],
  [L.generalFund.quote, `$${L.generalFund.added / 1e6} million`], [L.generalFund.quote, `$${L.generalFund.perDay}`], [L.generalFund.quote, usd(L.generalFund.exampleValue)],
  [L.retirementIncentive.savingsQuote, usd(L.retirementIncentive.savings)],
]
for (const [quote, figure] of quoted) if (!quote.includes(figure)) fail(`"${quote.slice(0, 60)}…" does not contain ${figure}`)
const WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten']
const ri = L.retirementIncentive
if (!ri.quote.toLowerCase().includes(`${WORDS[ri.csea]} csea`) || !ri.quote.toLowerCase().includes(`${WORDS[ri.pba]} pba`)) fail('The retirement counts do not match the words of the letter')
if (ri.retireeHealthOffset <= 0) fail('The retirement saving is larger than the savings it is made of')
for (const word of ['seventy-six', 'sixty-four', 'nine promotional', 'six new full-time', 'two new part-time']) {
  if (!L.staffing.quote.includes(word)) fail(`The staffing quote is missing "${word}"`)
}

// ── The letter against the Summary ────────────────────────────────────────────
const stages = JSON.parse(readFileSync(path('public/data/history/budget-stages.json'), 'utf8')).years
const t = stages[String(L.year)]?.tentative
const prior = stages[String(L.year - 1)]?.adopted
if (t && prior) {
  const operating = (d) => Object.entries(d.funds).filter(([code]) => !TRANSFER_FUNDED.includes(code)).reduce((sum, [, f]) => sum + f.appropriations, 0)
  if (operating(t) !== L.operating.total) fail(`The letter's operating total ${usd(L.operating.total)} is not the Summary's ${usd(operating(t))}`)
  if (operating(t) - operating(prior) !== L.operating.growth) fail(`The letter's growth ${usd(L.operating.growth)} is not the Summary's ${usd(operating(t) - operating(prior))}`)
  if (prior.funds.A01.fundBalance - t.funds.A01.fundBalance !== L.fundBalance.reduction) fail('The General Fund fund-balance reduction does not match the Summary')
  const gfAdded = t.funds.A01.appropriations - prior.funds.A01.appropriations
  if (Math.abs(gfAdded - L.generalFund.added) > 50_000) fail(`The General Fund adds ${usd(gfAdded)}, not about ${usd(L.generalFund.added)}`)
  const steepest = Math.max(...Object.entries(t.funds).filter(([c, f]) => f.levy && prior.funds[c]?.levy).map(([c, f]) => ((f.levy - prior.funds[c].levy) / prior.funds[c].levy) * 100))
  if (Number(steepest.toFixed(2)) > letter.statedLimitPct) console.warn(`Note: a district's levy rises ${steepest.toFixed(2)}%, above the letter's ${letter.statedLimitPct}%; the pages say so.`)
  const tw = t.townWide
  if (!tw) fail('The Tentative has no "Total Town Wide" rows')
  else {
    const sum = (key) => TOWN_WIDE_FUNDS.reduce((s, c) => s + t.funds[c][key], 0)
    if (tw.levy !== sum('levy') || tw.appropriations !== sum('appropriations')) fail('The printed town-wide totals are not the General Fund, Highway and Street Lighting')
  }
} else if (t) fail(`No ${L.year - 1} adopted budget to check the letter against`)

// ── The pages ─────────────────────────────────────────────────────────────────
const html = (route) => {
  const file = path(`out${route}index.html`)
  return existsSync(file) ? readFileSync(file, 'utf8') : (fail(`${route} was not exported`), '')
}
if (t) {
  const tentative = html('/tentative-2027/')
  if (!tentative.includes('data-letter')) fail('/tentative-2027/ has no section on the Supervisor’s letter')
  if ((tentative.match(/Matches/g) ?? []).length < 2) fail('/tentative-2027/ no longer finds the letter’s totals in the Summary')
  if (!html('/buyout/').includes('data-incentive-outcome')) fail('/buyout/ does not show who took the incentive')
}

// Nowhere may the levy of all nineteen funds be called the town-wide levy.
const allFundsLevy = t ? t.totals.levy.toLocaleString('en-US') : null
if (allFundsLevy) {
  const walk = (dir) => readdirSync(dir).flatMap((name) => {
    const full = join(dir, name)
    return statSync(full).isDirectory() ? walk(full) : full.endsWith('.html') ? [full] : []
  })
  const mislabel = new RegExp(`town-wide (tax )?levy (of )?\\$${allFundsLevy.replace(/,/g, ',')}`, 'i')
  for (const file of walk(path('out'))) {
    const text = readFileSync(file, 'utf8').replace(/<[^>]+>/g, '').replace(/&#x27;|&#39;/g, "'")
    if (mislabel.test(text)) fail(`${file.slice(path('out').length)} calls the all-funds levy ($${allFundsLevy}) the town-wide levy`)
  }
}

if (!process.exitCode) console.log(`Tentative letter verification passed: ${L.year} letter dated ${letter.dated}, ${quoted.length} quoted figures, the Summary checks and the pages.`)
