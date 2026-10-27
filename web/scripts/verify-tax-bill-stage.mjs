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
  if (!page.includes('proposal2027.townWide.fundRates.A01') || !page.includes('proposal2027.townWide.fundRates.DA1') || !page.includes('proposal2027.townWide.fundRates.SL1')) fail('proposal fund rates are not mapped to the estimator')
  console.log(`2027 proposal rate available: town-wide ${current.townWide.rate.toFixed(3)} per $1,000; source ${current.source.title}`)
} else {
  console.log('No 2027 proposal rate table is present; historical adopted calculator remains available.')
}
if (!process.exitCode) console.log('Tax-bill stage check passed.')
