// Real, individually-sourced recurring spending-reduction candidates identified for the 2027 budget
// cycle. Ported from the iOS app's Budget2027SpendingReductionView / Budget2027Models.swift /
// DepartmentBudgetLensData.swift, which reconciled three previously-inconsistent "recurring savings
// package" figures across that app's own 2027 planning views into one canonical set of numbers.
//
// Deliberately excludes contractually-locked union wage growth (PBA/SOA/CSEA — modeled at $907,858.52
// of 2027 pressure) since that isn't a spending-reduction lever without a successor labor agreement;
// it stays on the pressure side of the model, not here.

export type SpendingReductionItem = {
  id: string
  title: string
  amount: number
  source: string
  rationale: string
}

// 20% healthcare-premium-contribution policy: 22 eligible senior-staff/elected positions, using the
// NYSHIP Empire Plan participating-agency individual premium rate as a conservative per-position floor.
const nyshipPlanPrimeIndividualMonthlyPremium = 1_611.46
const modeledEligibleHealthcarePositions = 22
const healthcareContributionSavings =
  modeledEligibleHealthcarePositions * (nyshipPlanPrimeIndividualMonthlyPremium * 12) * 0.2

const policeUniformOTActual2024 = 1_401_354.0
const policeUniformOTBudget2024 = 1_000_000.0
const policeUniformOTVariance = policeUniformOTActual2024 - policeUniformOTBudget2024

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
    source: `22 eligible senior-staff/elected positions × NYSHIP Empire Plan participating-agency individual premium ($${nyshipPlanPrimeIndividualMonthlyPremium.toFixed(2)}/mo) × 20%`,
    rationale: 'Requires a policy adoption for exempt and elected positions; represented staff would need successor bargaining.',
  },
  {
    id: 'overtime',
    title: 'Police Uniform OT recovery target',
    amount: overtimeControlSavings,
    source: `2024 actual ($${Math.round(policeUniformOTActual2024).toLocaleString()}) vs. $${Math.round(policeUniformOTBudget2024).toLocaleString()} budget — a $${Math.round(policeUniformOTVariance).toLocaleString()} variance`,
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

export const personnelPolicyTotal = personnelPolicyItems.reduce((s, i) => s + i.amount, 0)
export const operationalTotal = operationalItems.reduce((s, i) => s + i.amount, 0)
export const fullRecurringReductionPackage = personnelPolicyTotal + operationalTotal

// PBA + SOA + CSEA + non-contract increases at the default 2.5% COLA assumption — the modeled 2027
// automatic payroll-pressure gap this package is measured against. Contractually locked; not a lever.
export const modeledPBAIncrease = 354_689.61
export const modeledSOAIncrease = 68_773.45
export const modeledCSEAIncrease = 484_395.46
export const modeledNonContractIncrease = 28_868.58
export const modeledAutomaticPayrollPressure =
  modeledPBAIncrease + modeledSOAIncrease + modeledCSEAIncrease + modeledNonContractIncrease
