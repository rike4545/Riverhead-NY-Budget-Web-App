// Real, individually-sourced recurring spending-reduction candidates identified for the 2027 budget
// cycle. Ported from the iOS app's Budget2027SpendingReductionView / Budget2027Models.swift /
// DepartmentBudgetLensData.swift, which reconciled three previously-inconsistent "recurring savings
// package" figures across that app's own 2027 planning views into one canonical set of numbers.
//
// Deliberately excludes contractually-locked union wage growth (PBA/SOA/CSEA — modeled at $907,858.52
// of 2027 pressure) since that isn't a spending-reduction lever without a successor labor agreement;
// it stays on the pressure side of the model, not here.

import supplementReductions from '../public/data/budget-supplement/reductions.json'

export type SpendingReductionItem = {
  id: string
  title: string
  amount: number
  source: string
  rationale: string
  confidence?: 'firm' | 'moderate' | 'volatile'
}

// 20% healthcare-premium-contribution policy: 22 eligible senior-staff/elected positions, using the
// NYSHIP Empire Plan participating-agency individual premium rate as a conservative per-position rate.
//
// Exported because /management-compensation/ prices the same policy and must
// quote the same numbers. It previously restated the premium as its own literal
// while telling readers the figure was imported, which is the drift that claim
// was supposed to rule out. One definition, imported, is what makes it true.
export const nyshipPlanPrimeIndividualMonthlyPremium = 1_611.46
export const modeledEligibleHealthcarePositions = 22
export const healthcareContributionRate = 0.2
const healthcareContributionSavings =
  modeledEligibleHealthcarePositions * (nyshipPlanPrimeIndividualMonthlyPremium * 12) * healthcareContributionRate

const policeUniformOTActual2024 = 1_401_354.0
// The budgets beside that actual. The 2024 budget was $700,011; $1,000,000 is
// 2025's, which the 2026 Supplement prints next to the 2024 actual and this
// line once labeled as 2024's. Typed here because a client component imports
// this file and the Supplement data would ship with it; scripts/verify-
// supplement.mjs checks both against the Supplements.
export const policeUniformOTBudget2024 = 700_011.0
export const policeUniformOTBudget2025 = 1_000_000.0

// Peer benchmark: Southampton's 2026 adopted Town Police OT (account 6101) is $1,476,854 for
// 113 officers — $13,069.50/officer. Applied to Riverhead's ~100 officers, that implies a
// regionally-normal OT budget of ~$1,306,950.44, meaning only the actual's excess over that
// (not the full variance over Riverhead's own $1M budget) is credibly "recoverable."
const peerBenchmarkOvertimePerOfficer = 1_476_854.0 / 113.0
const peerBenchmarkNormalizedBudget = peerBenchmarkOvertimePerOfficer * 100.0
const overtimeControlSavings = policeUniformOTActual2024 - peerBenchmarkNormalizedBudget

const civilianVacancyFactorSavings = 124_158.19
const targetedRetirementRefillSavings = 291_300.0
const exemptRaiseHoldSavings = 23_094.86
const electedRaiseHoldSavings = 22_278.92

export const personnelPolicyItems: SpendingReductionItem[] = [
  {
    id: 'healthcare',
    title: '20% healthcare premium contribution',
    amount: healthcareContributionSavings,
    source: `${modeledEligibleHealthcarePositions} eligible senior-staff/elected positions × NYSHIP Empire Plan participating-agency individual premium ($${nyshipPlanPrimeIndividualMonthlyPremium.toFixed(2)}/mo) × ${healthcareContributionRate * 100}%`,
    rationale: 'Requires a policy adoption for exempt and elected positions; represented staff would need successor bargaining.',
  },
  {
    id: 'overtime',
    title: 'Police Uniform OT recovery target',
    amount: overtimeControlSavings,
    source: `2024 actual ($${Math.round(policeUniformOTActual2024).toLocaleString()}) against a 2024 budget of $${Math.round(policeUniformOTBudget2024).toLocaleString()}; the line has been budgeted at $${Math.round(policeUniformOTBudget2025).toLocaleString()} since 2025`,
    rationale: "Southampton's 2026 adopted Police OT is $13,069.50/officer for 113 officers; at that regional rate Riverhead's ~100 officers would need about $1,306,950 — meaning most of the variance is likely real coverage need, not scheduling waste. Zero OT isn't realistic, so this targets only the residual above that peer benchmark.",
  },
  {
    id: 'retirementRefill',
    title: 'Targeted retirement + refill control',
    amount: targetedRetirementRefillSavings,
    source: 'Three modeled senior departures, two lower-cost backfills',
    rationale: 'Depends on which positions actually turn over in 2027; not guaranteed.',
  },
  {
    id: 'vacancyFactor',
    title: '1% civilian vacancy factor',
    amount: civilianVacancyFactorSavings,
    source: '1% applied to the 2026 civilian/CSEA payroll base',
    rationale: 'Assumes normal turnover timing, not a headcount reduction.',
  },
  {
    id: 'exemptRaiseHold',
    title: 'Hold exempt discretionary raises',
    amount: exemptRaiseHoldSavings,
    source: '2026 exempt discretionary raise baseline',
    rationale: 'A Board choice each budget cycle, not a structural change.',
  },
  {
    id: 'electedRaiseHold',
    title: 'Hold elected salary growth',
    amount: electedRaiseHoldSavings,
    source: '2026 elected-official raise baseline',
    rationale: 'Separately stated Board action, not embedded in the baseline.',
  },
]

// Real, account-level growth in the 2026 Adopted Budget (per the 2026 Budget Supplement) flagged for
// audit before being carried forward as a permanent 2027 baseline. Excludes the new Peconic Hockey
// electricity line ($167,742), which is a same-fund reclassification (the general Town Hall electricity
// line drops by the same amount), not net-new spending.
export const operationalItems: SpendingReductionItem[] = [
  {
    id: 'policeHolidayPay',
    title: 'Police holiday pay union',
    amount: 190_600,
    source: 'A01 Police 3120 — $752,400 (2025) → $943,000 (2026), +25.3%',
    rationale: 'Tie to scheduling audit before normalizing as permanent baseline.',
  },
  {
    id: 'policeHealthBuyback',
    title: 'Police health insurance buy-back',
    amount: 112_000,
    source: 'A01 Police 3120 — $389,000 (2025) → $501,000 (2026), +28.8%',
    rationale: 'Active audit needed. Capture savings if participation declines.',
  },
  {
    id: 'es5ScavengerWaste',
    title: 'ES5 scavenger waste disposal',
    amount: 187_000,
    source: 'ES5 Scavenger Waste 8189 — $490,000 (2025) → $677,000 (2026), +38.2%',
    rationale: 'Largest single enterprise fund jump. Benchmark disposal contracts.',
  },
  {
    id: 'taxCollectionPostage',
    title: 'Tax collection postage',
    amount: 12_000,
    source: 'A01 Tax Collection 1330 — $1,500 (2025) → $13,500 (2026), +800%',
    rationale: 'Review billing process changes vs. actual mailing volume.',
  },
  {
    id: 'otherGenGovtMisc',
    title: 'Other Gen Govt - Miscellaneous',
    amount: 50_000,
    source: 'A01 Other General Government 1989 — $3,200 (2025) → $53,200 (2026), +1,563%',
    rationale: "A catchall 'Miscellaneous' line tripling with no stated driver deserves an itemized explanation before adoption.",
  },
  {
    id: 'cdaSpecialEvents',
    title: 'CDA - Special Events',
    amount: 43_200,
    source: 'A01 Community Development Admin 8686 — $0 (2025) → $43,200 (2026), New',
    rationale: 'Brand-new discretionary program line with no prior-year baseline or stated participation target.',
  },
  {
    id: 'townAttorneyMgmtBuyback',
    title: 'Atty - Pers Svcs Mgmt Buy Back',
    amount: 32_600,
    source: 'A01 Town Attorney 1420 — $104,700 (2025) → $137,300 (2026), +31.1%',
    rationale: 'Management buy-back growth should be tied to a specific staffing or policy change, not carried forward automatically.',
  },
]

// Itemized, ledger-sourced trims from the 2026 Budget Supplement (generated by
// etl/parse_budget_supplement.py): every controllable, non-mandated line budgeted
// >30% above its trailing run-rate, tagged firm / moderate / volatile. Shared data
// with the iOS and Android apps.
const rawConfidence = (c: string): 'firm' | 'moderate' | 'volatile' =>
  c === 'moderate' || c === 'volatile' ? c : 'firm'

const supplementConfidenceRationale: Record<'firm' | 'moderate' | 'volatile', string> = {
  firm: 'Operating or professional-services line budgeted well above its own trailing actuals — the firmest kind of trim.',
  moderate: 'Capital or maintenance line that fluctuates year to year; the trim depends on 2027 project timing.',
  volatile: 'Price-driven (fuel, energy, utilities); the excess over trend is real but not guaranteed to recur.',
}

const fmtUSD0 = (n: number | null | undefined) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n ?? 0)

export const supplementTrimItems: SpendingReductionItem[] = supplementReductions.items.map((r) => {
  const confidence = rawConfidence(r.confidence)
  return {
    id: `supp-${r.account}`,
    title: r.name,
    amount: r.target,
    source: `${r.fundName} — 2026 tentative ${fmtUSD0(r.tentative2026)} vs 2024 actual ${fmtUSD0(r.actual2024)}; trims to the trailing run-rate`,
    rationale: supplementConfidenceRationale[confidence],
    confidence,
  }
})

export const personnelPolicyTotal = personnelPolicyItems.reduce((s, i) => s + i.amount, 0)
export const operationalTotal = operationalItems.reduce((s, i) => s + i.amount, 0)
export const supplementTrimTotal = supplementTrimItems.reduce((s, i) => s + i.amount, 0)
export const fullRecurringReductionPackage = personnelPolicyTotal + operationalTotal + supplementTrimTotal

// PBA + SOA + CSEA + non-contract increases at the default 2.5% COLA assumption — the modeled 2027
// automatic payroll-pressure gap this package is measured against. Contractually locked; not a lever.
export const modeledPBAIncrease = 354_689.61
export const modeledSOAIncrease = 68_773.45
export const modeledCSEAIncrease = 484_395.46
export const modeledNonContractIncrease = 28_868.58
export const modeledAutomaticPayrollPressure =
  modeledPBAIncrease + modeledSOAIncrease + modeledCSEAIncrease + modeledNonContractIncrease
