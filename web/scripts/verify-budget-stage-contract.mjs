#!/usr/bin/env node
// Shared contract for pages whose comparisons depend on the latest published
// Tentative, Preliminary or Adopted budget. Complements route-specific checks.
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const root = resolve(process.cwd())
const read = (p) => JSON.parse(readFileSync(resolve(root, p), 'utf8'))
const fail = (message) => { console.error(`BUDGET STAGE CONTRACT FAILED: ${message}`); process.exitCode = 1 }
const stages = read('public/data/history/budget-stages.json')
const history = read('public/data/history/fund-appropriations.json')
const supplement = read('public/data/budget-supplement/current-lines.json')
const adoptedYears = [...history.years].map(Number).sort((a,b)=>a-b)
const latestAdopted = adoptedYears.at(-1)
if (latestAdopted == null) throw new Error('fund-appropriations.json has no adopted years')
const nextYear = latestAdopted + 1
const next = stages.years[String(nextYear)] ?? {}
const latestStage = next.preliminary ? 'preliminary' : next.tentative ? 'tentative' : null

if (latestStage) {
  const doc = next[latestStage]
  if (!doc.source?.url || !doc.source?.title) fail(`${nextYear} ${latestStage} is missing source provenance`)
  if (!doc.funds || !Object.keys(doc.funds).length) fail(`${nextYear} ${latestStage} has no fund rows`)
  if (!Number.isFinite(doc.totals?.appropriations) || !Number.isFinite(doc.totals?.levy)) fail(`${nextYear} ${latestStage} has invalid Summary totals`)
  const sum = Object.values(doc.funds).reduce((n, f) => n + Number(f.appropriations), 0)
  if (Math.abs(sum - doc.totals.appropriations) > 1) fail(`${nextYear} ${latestStage} fund appropriations sum to ${sum}, Summary says ${doc.totals.appropriations}`)
  if (latestStage === 'preliminary' && next.tentative && !stages.transitions.some(t=>t.year===nextYear && t.from==='tentative' && t.to==='preliminary')) fail(`${nextYear} Preliminary exists but Tentative-to-Preliminary transition is missing`)
  if (latestStage === 'tentative') {
    if (supplement.supplementYear !== nextYear) fail(`current-lines.json is Supplement ${supplement.supplementYear}, expected ${nextYear}`)
    if (supplement.columns?.tentative !== nextYear || supplement.columns?.adopted !== latestAdopted) fail(`Supplement columns do not compare ${nextYear} Tentative with ${latestAdopted} Adopted`)
    if (supplement.reconciliation?.complete !== true || Math.abs(Number(supplement.reconciliation?.gap ?? Infinity)) > 0.01 || (supplement.reconciliation?.fundsOff ?? []).length) fail(`Supplement does not reconcile to the ${nextYear} Tentative: ${JSON.stringify(supplement.reconciliation)}`)
  }
  console.log(`Latest proposal: ${nextYear} ${latestStage}; source and Summary totals checked`)
} else {
  console.log(`No unpublished proposal stage after adopted year ${latestAdopted}; historical adopted views remain valid`)
}

const latestAdoptedDoc = stages.years[String(latestAdopted)]?.adopted
if (!latestAdoptedDoc) fail(`stage index lacks the latest adopted year ${latestAdopted}`)
else for (const [code, fund] of Object.entries(latestAdoptedDoc.funds)) {
  const historical = history.funds.find(f=>f.code===code)?.years?.[String(latestAdopted)]?.appropriations
  if (historical == null || Number(historical)!==Number(fund.appropriations)) fail(`${code} ${latestAdopted}: adopted history (${historical ?? 'missing'}) differs from stage index (${fund.appropriations})`)
}

// Core proposal views must use the shared stage-aware model, not private year constants.
const contracts = [
  ['app/compare/page.tsx', /budget-history|budget-stages/],
  ['app/what-changed/page.tsx', /budget-history|budget-stages|tentative-2027/],
  ['app/general-fund/page.tsx', /budget-history|budget-stages|tentative-2027/],
  ['app/funds/page.tsx', /budget-history|budget-stages|funds-2027/],
  ['app/outliers/page.tsx', /outlier-watch|budget-history|budget-stages/],
]
for (const [file, pattern] of contracts) {
  const p = resolve(root, file)
  if (!existsSync(p)) { fail(`required stage-aware route source is missing: ${file}`); continue }
  if (!pattern.test(readFileSync(p, 'utf8'))) fail(`${file} no longer imports a stage-aware data module`)
}
console.log('Budget-stage contract checks complete')
