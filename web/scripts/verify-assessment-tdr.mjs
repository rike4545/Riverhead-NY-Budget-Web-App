// Checks for /assessment/ and /tdr/:
//   - assessment: the class totals add to the roll's grand total (parcels and
//     assessed value) on both rolls, the exemption groups add to the roll's
//     exemption total, no parcel-level field is kept, and the page states the
//     totals;
//   - TDR: the Walmart site-plan rows add to the credits required, the credits
//     bought less those conveyed are the credits held, the shortfall is the
//     difference, the floor areas agree with the lot size and ratios, and the
//     page states the credits needed and the hearing date.

import { existsSync, readFileSync } from 'node:fs'
import { isAbsolute, relative, resolve, sep } from 'node:path'

const root = resolve(process.cwd())
const repo = resolve(root, '..')
const path = (...parts) => {
  const target = resolve(root, ...parts)
  const rel = relative(repo, target)
  if (rel === '..' || rel.startsWith(`..${sep}`) || isAbsolute(rel)) throw new Error(`refusing to read outside ${repo}: ${target}`)
  return target
}
const read = (...p) => JSON.parse(readFileSync(path(...p), 'utf8'))
const fail = (message) => { console.error(`ASSESSMENT/TDR VERIFY FAILED: ${message}`); process.exitCode = 1 }
const page = (route) => {
  const f = path('out', route, 'index.html')
  if (!existsSync(f)) { fail(`/${route}/ was not built`); return '' }
  return readFileSync(f, 'utf8').replace(/<[^>]+>/g, ' ').replace(/&#x27;|&apos;/g, "'").replace(/\s+/g, ' ')
}
const fmt = (n) => Math.round(n).toLocaleString('en-US')
const close = (a, b, tol = 0.0015) => Math.abs(a - b) <= tol

// ── Assessment roll ──
const roll = read('public', 'data', 'assessment-roll-2026.json')
for (const kind of ['tentative', 'final']) {
  const r = roll[kind]
  const parcels = r.byClass.reduce((s, c) => s + c.parcels, 0)
  const assessed = r.byClass.reduce((s, c) => s + c.assessedTotal, 0)
  if (parcels !== r.grandTotals.parcels) fail(`${kind}: classes have ${parcels} parcels, the roll ${r.grandTotals.parcels}`)
  if (assessed !== r.grandTotals.assessedTotal) fail(`${kind}: classes add to ${assessed}, the roll to ${r.grandTotals.assessedTotal}`)
  const secs = Object.values(r.grandTotals.sections).reduce((s, x) => s + x.assessedTotal, 0)
  if (secs !== r.grandTotals.assessedTotal) fail(`${kind}: roll sections add to ${secs}, the grand total is ${r.grandTotals.assessedTotal}`)
  for (const c of r.byClass) if (!(c.marketValue > c.assessedTotal)) fail(`${kind} class ${c.code}: market value ${c.marketValue} is not above assessed ${c.assessedTotal}`)
}
const ex = roll.final.exemptions
for (const k of ['town', 'school']) {
  const sum = ex.groups.reduce((s, g) => s + g[k], 0)
  if (sum !== ex.total[k]) fail(`exemption groups add to ${sum} for the ${k}, the roll says ${ex.total[k]}`)
}
const bandHomes = roll.oneFamilyHomes.bands.reduce((s, b) => s + b.homes, 0)
if (bandHomes !== roll.oneFamilyHomes.count) fail(`home value bands hold ${bandHomes} homes, not ${roll.oneFamilyHomes.count}`)
const text = JSON.stringify(roll)
if (/"(tm|owner|address|taxMap|sbl)"/i.test(text)) fail('the assessment data carries a parcel-level field')
const assessPage = page('assessment')
if (assessPage && !assessPage.includes(`${fmt(roll.final.grandTotals.parcels)} parcels`)) fail('/assessment/ does not state the parcel count')
if (assessPage && !assessPage.includes(`$${fmt(roll.final.grandTotals.assessedTotal)}`)) fail('/assessment/ does not state the assessed total')

// ── TDR ──
const t = read('public', 'data', 'tdr.json')
const w = t.walmart
for (const c of w.calculation) {
  const sign = c.credits < 0 ? -1 : 1
  if (!close(sign * c.squareFeet / c.perCredit, c.credits)) fail(`Walmart row "${c.label}": ${c.squareFeet} / ${c.perCredit} is not ${c.credits}`)
}
const required = w.calculation.reduce((s, c) => s + c.credits, 0)
if (!close(required, w.creditsRequired)) fail(`Walmart rows add to ${required}, not ${w.creditsRequired}`)
const bought = w.creditsBought.reduce((s, c) => s + c.credits, 0)
if (!close(bought - w.creditsConveyed, w.creditsHeld)) fail(`Walmart credits held ${w.creditsHeld} are not ${bought} less ${w.creditsConveyed}`)
if (!close(w.creditsRequired - w.creditsHeld, w.creditsAdditional)) fail(`Walmart's additional credits ${w.creditsAdditional} are not ${w.creditsRequired} less ${w.creditsHeld}`)
if (!close(w.lotSquareFeet * w.baseCoverageShare, w.baseSquareFeet, 0.5)) fail('Walmart base floor area is not 15% of the lot')
// The site plan prints 270,794.7 sq. ft. for 0.30 of a 902,668 sq. ft. lot (270,800.4): its own rounding, kept as printed.
if (!close(w.lotSquareFeet * 0.3, w.maxWithCreditsSquareFeet, 10)) fail('Walmart maximum floor area is not 0.30 of the lot')
if (w.proposedBuildingSquareFeet - w.approvedBuildingSquareFeet !== w.additionalSquareFeet) fail('Walmart added building area does not match proposed less approved')
if (!close(w.lotSquareFeet / 43560, w.acres, 0.001)) fail(`Walmart lot ${w.lotSquareFeet} sq. ft. is not ${w.acres} acres`)
const p = t.program
if (p.residentialRedeemed + p.commercialRedeemed !== p.creditsRedeemed) fail('TDR program: residential and commercial redemptions do not add to the total')
const tdrPage = page('tdr')
if (tdrPage && !tdrPage.includes(w.creditsAdditional.toFixed(3))) fail('/tdr/ does not state the additional credits')
if (tdrPage && !tdrPage.includes('November 19, 2026')) fail('/tdr/ does not state the hearing date')
if (tdrPage && !tdrPage.includes(`about ${p.creditsNotRedeemed}`)) fail('/tdr/ does not state the credits not yet redeemed')

if (!process.exitCode) console.log(`Assessment and TDR verified: ${fmt(roll.final.grandTotals.parcels)} parcels, $${fmt(roll.final.grandTotals.assessedTotal)} assessed; Walmart needs ${w.creditsAdditional} more credits of ${w.creditsRequired}.`)
