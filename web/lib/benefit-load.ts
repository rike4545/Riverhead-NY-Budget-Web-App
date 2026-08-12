// What an hour of police labour actually costs Riverhead on top of wages.
//
// This used to be a guess — a 35/55% band with a note admitting it was the one
// figure on the page that wasn't the Town's. It no longer has to be. The State
// Comptroller's annual filing breaks Riverhead's employee benefits out by
// account code, and one of those accounts is police-specific, so most of this
// is now measured rather than assumed.
//
// All figures: Town of Riverhead, fiscal year ending December 31, 2024, NYS
// Office of the State Comptroller, Financial Data for Local Governments.

export const source = {
  title: 'NYS Office of the State Comptroller, Financial Data for Local Governments',
  detail: 'Town of Riverhead annual financial report, fiscal year ended December 31, 2024',
  url: 'https://www.osc.ny.gov/local-government/data',
}

// General Fund (A) wages. Every sworn officer's pay sits in this fund, so it is
// the right denominator for splitting the shared benefit accounts.
export const aFundWages = 31_231_490
export const policeWages = 18_822_087

// A90158. The Police and Fire Retirement System is exactly that — sworn only.
// No allocation is needed or appropriate: all of it belongs to police.
export const policeRetirement = 4_341_995

// Shared A-fund benefit accounts, covering every General Fund employee.
export const shared = {
  health: 7_790_519,        // A90608 Hospital, Medical and Dental Insurance
  socialSecurity: 2_184_766, // A90308
  workersComp: 335_263,      // A90408
  unemployment: 15_026,      // A90508
  other: 102_799,            // A90898
}

// A90108, State Retirement (ERS), is deliberately excluded: sworn officers are
// in PFRS, not ERS, so none of that account is theirs.

export const policeWageShare = policeWages / aFundWages // ≈ 60.3%

// Health insurance is bought per person, not per dollar of salary, so splitting
// it by wage share overstates the police share — officers are paid more per head
// than the average town employee. Splitting it by headcount is the fairer basis,
// and the honest answer is that the choice moves the result. Headcount shares
// are of benefit-eligible staff (2025 payroll, base pay above the stated floor),
// which is a proxy: the Town does not publish who is enrolled in coverage.
export const policeHeadcountShare = {
  above40k: 0.327, // 98 sworn of 300 employees paid more than $40,000
  above50k: 0.406, // 97 sworn of 239 employees paid more than $50,000
}

// FICA, workers' compensation and the small residual accounts genuinely do scale
// with payroll dollars, so those are always wage-allocated. Only health moves.
const wageAllocated =
  (shared.socialSecurity + shared.workersComp + shared.unemployment + shared.other) * policeWageShare

function loadWith(healthShare: number): number {
  const total = policeRetirement + wageAllocated + shared.health * healthShare
  return total / policeWages
}

export const BENEFIT_LOAD = {
  low: loadWith(policeHeadcountShare.above40k),   // ≈ 0.45
  mid: loadWith(policeHeadcountShare.above50k),   // ≈ 0.48
  high: loadWith(policeWageShare),                // ≈ 0.56
}

export const BENEFIT_LOAD_BASIS: Record<keyof typeof BENEFIT_LOAD, string> = {
  low: 'health split per person (staff paid over $40,000)',
  mid: 'health split per person (staff paid over $50,000)',
  high: 'health split per dollar of wages',
}

/** Pension alone, as a share of police wages — exact, requiring no allocation. */
export const pensionOnlyLoad = policeRetirement / policeWages // ≈ 23.1%

export const explainer =
  'Riverhead’s police pension bill is measured, not modelled: the Comptroller reports Police and Fire Retirement as its own account, and all of it belongs to sworn staff — ' +
  'that alone is ' + Math.round(pensionOnlyLoad * 1000) / 10 + '% of police wages before a single other benefit. ' +
  'Health insurance, Social Security, workers’ compensation and the smaller accounts are shared across all General Fund employees and have to be divided up. ' +
  'FICA and workers’ comp scale with payroll dollars, so they follow wages. Health insurance does not — it is bought per person — and that single choice is what the range below represents.'
