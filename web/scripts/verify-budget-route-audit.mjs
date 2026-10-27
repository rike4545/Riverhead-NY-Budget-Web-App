#!/usr/bin/env node
// Route/data dependency audit for views affected by budget-stage changes.
// This checks that the route files and their declared data dependencies remain
// present. It does not claim to prove every rendered number is correct; numeric
// reconciliation remains in the focused verifiers and shared stage contract.
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const root = resolve(process.cwd())
const routeContracts = [
  { route: 'app/analytics/page.tsx', tier: 'indirect', deps: ['all-funds', 'financial-data'], why: 'Cross-topic operating-fund and fund-balance summaries.' },
  { route: 'app/explore/page.tsx', tier: 'indirect', deps: ['programs', 'all-funds', 'tentative-2027', 'debt-profile'], why: 'Combines program costs, payroll, debt and budget forecasts.' },
  { route: 'app/annual-report/page.tsx', tier: 'historical-plus-current', deps: ['afr', 'audits', 'general-fund'], why: 'Audited historical results must remain distinct from current budget claims.' },
  { route: 'app/credit-rating/page.tsx', tier: 'indirect', deps: ['debt-profile', 'reserve-policy'], why: 'Debt and reserve ratios may use appropriation denominators.' },
  { route: 'app/payroll/page.tsx', tier: 'stage-sensitive', deps: ['budget-amendments-2027', 'line-history', 'raises-2027'], why: 'Uses proposed amendment and personal-services line data alongside actual payroll.' },
  { route: 'app/fringe-benefits/page.tsx', tier: 'indirect', deps: ['benefit-load'], why: 'Benefit assumptions and their basis should be identified separately from adopted amounts.' },
  { route: 'app/management-compensation/page.tsx', tier: 'historical-plus-current', deps: ['ManagementSalaryHistory'], why: 'Salary history should not be mistaken for the latest authorized budget.' },
  { route: 'app/workforce-by-title/page.tsx', tier: 'historical', deps: ['WorkforceByTitle'], why: 'Workforce records are historical; any authorized salary comparison needs its own year label.' },
  { route: 'app/scenarios/page.tsx', tier: 'stage-sensitive', deps: ['tentative-2027', 'budget-2027-prediction'], why: 'Scenario baselines must say which proposal stage and forecast they use.' },
  { route: 'app/town-square/page.tsx', tier: 'indirect', deps: ['reserve-policy'], why: 'Reserve and affordability assumptions may be affected by revised budget totals.' },
  { route: 'app/buyout/page.tsx', tier: 'stage-sensitive', deps: ['tentative-2027', 'buyout-2026'], why: 'Must separate the 2027 proposal from the 2026 buyout model and historical outcomes.' },
  { route: 'app/tax-cap/page.tsx', tier: 'stage-sensitive', deps: ['tentative-2027', 'tax-cap.json'], why: 'Levy-limit assumptions and proposed levy need explicit stage and source.' },
  { route: 'app/capital-debt/page.tsx', tier: 'stage-sensitive', deps: ['debt-2027-plan'], why: '2027 debt lines should follow the current Supplement and reconcile to the published budget.' },
  { route: 'app/compare/page.tsx', tier: 'stage-sensitive', deps: ['budget-history'], why: 'Must select Preliminary over Tentative when both exist.' },
  { route: 'app/what-changed/page.tsx', tier: 'stage-sensitive', deps: ['budget-stages', 'tentative-2027'], why: 'Headline comparisons must not keep presenting Tentative as the latest stage.' },
  { route: 'app/general-fund/page.tsx', tier: 'stage-sensitive', deps: ['tentative-2027', 'budget-stages'], why: 'General Fund proposal comparisons must follow the latest published stage.' },
  { route: 'app/funds/page.tsx', tier: 'stage-sensitive', deps: ['funds-2027'], why: 'Fund totals and account-line comparisons must use a reconciled current source.' },
  { route: 'app/funds/[code]/page.tsx', tier: 'stage-sensitive', deps: ['funds-2027', 'budget-stages'], why: 'Individual fund drilldowns can otherwise disagree with town-wide totals.' },
  { route: 'app/programs/page.tsx', tier: 'stage-sensitive', deps: ['programs', 'program-budget'], why: 'Program rollups should identify proposal-stage inputs and reconciliation.' },
  { route: 'app/revenue/page.tsx', tier: 'stage-sensitive', deps: ['revenue'], why: 'Revenue estimates should follow the latest published Supplement/stage.' },
  { route: 'app/budget-accuracy/page.tsx', tier: 'historical-plus-current', deps: ['budget-accuracy', 'supplement'], why: 'Historical budget-vs-actual flags must distinguish adopted, actual and proposed columns.' },
  { route: 'app/outliers/page.tsx', tier: 'stage-sensitive', deps: ['outlier-watch'], why: 'Outlier flags must use the current line data and label comparison stages.' },
  { route: 'app/budget-amendments-2027/page.tsx', tier: 'transition-specific', deps: ['budget-amendments-2027'], why: 'Keep the six adopted amendments as a historical record and reconcile them to Preliminary/Adopted.' },
  { route: 'app/budget-changes/page.tsx', tier: 'historical-plus-current', deps: ['budget-changes', 'budget-stages'], why: 'Resolution changes must remain tied to the correct fiscal-year adopted baseline.' },
  { route: 'app/fund-balance-draws/page.tsx', tier: 'historical-plus-current', deps: ['fund-balance-draws'], why: 'Committed/drawn amounts must not be treated as the current unassigned balance.' },
  { route: 'app/reserves/page.tsx', tier: 'indirect', deps: ['reserve-availability', 'reserve-policy'], why: 'Reserve percentages and policy comparisons may change with appropriation totals.' },
  { route: 'app/predict-2027/page.tsx', tier: 'stage-sensitive', deps: ['predict-2027-update'], why: 'Keep the original forecast, revised proposal-stage estimate and eventual adopted result separate.' },
  { route: 'app/taxpayer-impact/page.tsx', tier: 'stage-sensitive', deps: ['tentative-2027'], why: 'Taxpayer-facing conclusions should reconcile to current levy/rate assumptions.' },
  { route: 'app/tax-bill/page.tsx', tier: 'stage-sensitive', deps: ['tax-bill'], why: 'The calculator must state which published Town-wide rate it uses.' },
  { route: 'app/zero-percent-2027/page.tsx', tier: 'stage-sensitive', deps: ['zero-percent-2027'], why: 'A zero-levy scenario must be recalculated against the current proposal, not treated as official.' },
  { route: 'app/spending-reduction-2027/page.tsx', tier: 'stage-sensitive', deps: ['savings-rules'], why: 'Savings estimates must be distinguished from official budget reductions and amendments.' },
]

let failed = false
for (const item of routeContracts) {
  const file = resolve(root, item.route)
  if (!existsSync(file)) {
    console.error(`ROUTE AUDIT FAIL: missing route source ${item.route}`)
    failed = true
    continue
  }
  const source = readFileSync(file, 'utf8')
  for (const dep of item.deps) {
    if (!source.includes(dep)) {
      console.error(`ROUTE AUDIT REVIEW: ${item.route} no longer mentions expected dependency "${dep}" (${item.tier})`)
      failed = true
    }
  }
}
if (failed) process.exitCode = 1
else console.log(`Budget route dependency audit passed: ${routeContracts.length} routes classified and expected dependencies present.`)
console.log('Note: dependency presence is not proof of numeric freshness; the route inventory document records the required semantic checks.')
