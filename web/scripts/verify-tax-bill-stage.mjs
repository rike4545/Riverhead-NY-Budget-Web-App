#!/usr/bin/env node
// The estimator must keep the published 2026 adopted rates separate from
// the latest 2027 proposal rate in the Town's budget-stage index.
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
const read = (p) => JSON.parse(readFileSync(resolve(process.cwd(), p), 'utf8'))
const fail = (m) => { console.error(`TAX BILL STAGE CHECK FAILED: ${m}`); process.exitCode = 1 }
const data = read('public/data/tax-bill.json')
const stages = read('public/data/history/budget-stages.json')
const page = readFileSync(resolve(process.cwd(), 'app/tax-bill/page.tsx'), 'utf8')
const component = readFileSync(resolve(process.cwd(), 'components/TaxBillEstimator.tsx'), 'utf8')
const current = stages.years['2027']?.preliminary ?? stages.years['2027']?.tentative
if (data.asOf !== '2026' || data.rateSource?.title !== '2026 Adopted Budget') fail('historical official rate source must remain the 2026 adopted table')
if (!page.includes("stageDoc(2027, 'preliminary')") || !page.includes("stageDoc(2027, 'tentative')")) fail('page must prefer Preliminary and fall back to Tentative')
if (!page.includes('rates2027Proposal={proposalRates}') || !component.includes('rates2027Proposal') || !component.includes('illustrative')) fail('proposal rates must be passed to a separately labeled illustrative estimate')
if (current?.townWide?.fundRates) {
  const r = current.townWide.fundRates
  const actual = [r.A01?.rate, r.DA1?.rate, r.SL1?.rate, current.townWide.rate]
  if (actual.some(n => !Number.isFinite(n))) fail('current proposal is missing a required town-wide rate')
  if (!page.includes('proposalFundRates.A01') || !page.includes('proposalFundRates.DA1') || !page.includes('proposalFundRates.SL1')) fail('proposal fund rates are not mapped to the estimator')
  console.log(`2027 proposal rate available: town-wide ${current.townWide.rate.toFixed(3)} per $1,000; source ${current.source.title}`)
} else {
  console.log('No 2027 proposal rate table is present; historical adopted calculator remains available.')
}
// STAR lowers school taxable value only (the 2026 final roll's exemption summary has no Town amount for codes 41834 and 41854),
// so the Town-tax estimator must not offer it as a reduction.
const roll = read('public/data/assessment-roll-2026.json')
const star = roll.final.exemptions.groups.find((g) => g.name.startsWith('STAR'))
if (!star || star.town !== 0) fail('the roll no longer shows STAR as school-only; re-check the estimator')
if (/starReduction|STAR assessed-value reduction/.test(component)) fail('the estimator still subtracts a STAR reduction from the Town tax')
if (!component.includes('STAR') || !component.includes('school taxes only')) fail('the estimator must tell readers STAR does not lower Town taxes')
if (!process.exitCode) console.log('Tax-bill stage check passed.')
