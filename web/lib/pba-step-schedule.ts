// The PBA (Police Benevolent Association) salary step schedule, transcribed from the
// signed 2023-2026 PBA contract, Article XXXVI (Salaries) and Appendix B. This is the
// actual, contractual step-by-step pay ladder rank-and-file officers move through — as
// distinct from the across-the-board % increase applied to the whole schedule each year
// (see the 2027 prediction page for that).

export type StepRow = {
  step: string
  values: { 2023: number; 2024: number; 2025: number; 2026: number }
}

export const officerScheduleHiredOnOrAfter20121203: StepRow[] = [
  { step: 'Academy', values: { 2023: 49_540.66, 2024: 50_779.18, 2025: 52_048.66, 2026: 53_349.88 } },
  { step: '1st Year Officer', values: { 2023: 64_553.14, 2024: 66_166.97, 2025: 67_821.14, 2026: 69_516.67 } },
  { step: '2nd Year Officer', values: { 2023: 79_565.62, 2024: 81_554.76, 2025: 83_593.63, 2026: 85_683.47 } },
  { step: '3rd Year Officer', values: { 2023: 94_578.10, 2024: 96_942.55, 2025: 99_366.11, 2026: 101_850.27 } },
  { step: '4th Year Officer', values: { 2023: 109_590.57, 2024: 112_330.34, 2025: 115_138.60, 2026: 118_017.06 } },
  { step: '5th Year Officer', values: { 2023: 124_603.05, 2024: 127_718.13, 2025: 130_911.08, 2026: 134_183.86 } },
  { step: '6th Year Officer (top step)', values: { 2023: 139_615.53, 2024: 143_105.92, 2025: 146_683.57, 2026: 150_350.66 } },
]

// Officers hired before 12/3/2012 reach the SAME top dollar figure — but a full year
// sooner, since their schedule has no separate 6th-year step. The rest of that legacy
// schedule (1st-4th year) isn't reproduced in the contract text because no one hired
// before 12/3/2012 is still climbing it 13+ years later; every such officer is already
// at or near the top step.
export const officerTopStepHiredBefore20121203: StepRow = {
  step: '5th Year Officer (top step)',
  values: { 2023: 139_615.53, 2024: 143_105.92, 2025: 146_683.57, 2026: 150_350.66 },
}

export const detectiveSchedule: StepRow[] = [
  { step: 'Detective Grade III', values: { 2023: 149_793.15, 2024: 153_537.98, 2025: 157_376.43, 2026: 161_310.84 } },
  { step: 'Detective Grade II', values: { 2023: 156_194.43, 2024: 160_099.29, 2025: 164_101.77, 2026: 168_204.31 } },
  { step: 'Detective Grade I', values: { 2023: 160_211.65, 2024: 164_216.95, 2025: 168_322.37, 2026: 172_530.43 } },
]

export const academyRuleExample =
  'The contract spells out exactly how the Academy step transitions: an officer hired ' +
  'November 1, 2024 who completed the Academy on April 25, 2025 and reported for regular ' +
  'duty on May 1, 2025 would (a) be paid the Academy Rate from November 1, 2024 through ' +
  'April 30, 2025; (b) move to the 1st Year Officer rate from May 1, 2025 through April ' +
  '30, 2026, the 2nd Year Officer rate from May 1, 2026 through April 30, 2027, and so on ' +
  'through the 5th year of service.'

export const source = {
  title: 'Signed 2023-2026 PBA contract, Article XXXVI (Salaries) and Appendix B',
  note: 'Two-tier schedule: officers hired on or after 12/3/2012 climb 7 steps (Academy ' +
    'through 6th Year Officer) to reach top pay; officers hired before that date reach the ' +
    'same top dollar figure a year sooner, with no separate 6th-year step. Detective grade ' +
    'pay applies once promoted, regardless of hire date. The 2027 rate for this schedule ' +
    "isn't set — the PBA contract expires 12/31/2026 with no successor yet public; see the " +
    '2027 prediction page for how that gap is modeled.',
}

// Real 2025->2026 raises for actual Police Officers, from the Board's authorized-salary
// listings (web/public/data/salary/comparison-2025-2026.json), grouped by identical
// before/after dollar pairs and matched to the step each group is moving from. Verified:
// every group's actual 2026 pay equals (the contract step schedule's next-step 2026 rate)
// plus a flat $2,550 that isn't itemized in Article XXXVI's base table — likely a holiday-pay
// or similar stipend the Board's authorized listing folds into "annual salary" but the base
// step schedule doesn't. Not confirmed against contract text beyond Article XXXVI/Appendix B.
export type RealRaiseExample = {
  fromStep: string
  toStep: string
  actual2025: number
  actual2026: number
  contractStep2026: number
  addOn: number
  officerCount: number
  exampleName: string
}

export const realRaiseExamples: RealRaiseExample[] = [
  { fromStep: 'Academy', toStep: '1st Year Officer', actual2025: 52_048.66, actual2026: 72_066.67, contractStep2026: 69_516.67, addOn: 2_550.00, officerCount: 3, exampleName: 'Romer, Krista' },
  { fromStep: '1st Year Officer', toStep: '2nd Year Officer', actual2025: 67_821.14, actual2026: 88_233.47, contractStep2026: 85_683.47, addOn: 2_550.00, officerCount: 7, exampleName: 'Buczynski, Julia' },
  { fromStep: '2nd Year Officer', toStep: '3rd Year Officer', actual2025: 83_593.63, actual2026: 104_400.27, contractStep2026: 101_850.27, addOn: 2_550.00, officerCount: 8, exampleName: 'Dahlem, John' },
  { fromStep: '3rd Year Officer', toStep: '4th Year Officer', actual2025: 99_366.11, actual2026: 120_567.07, contractStep2026: 118_017.06, addOn: 2_550.01, officerCount: 5, exampleName: 'Boden, Bryan' },
  { fromStep: '4th Year Officer', toStep: '5th Year Officer', actual2025: 115_138.60, actual2026: 136_733.86, contractStep2026: 134_183.86, addOn: 2_550.00, officerCount: 15, exampleName: 'Ady, Stephan' },
  { fromStep: '5th Year Officer', toStep: '6th Year Officer (top step)', actual2025: 130_911.08, actual2026: 152_900.66, contractStep2026: 150_350.66, addOn: 2_550.00, officerCount: 2, exampleName: 'Anderson, Peter' },
  { fromStep: '6th Year Officer (top step)', toStep: '6th Year Officer (top step)', actual2025: 146_683.57, actual2026: 152_900.66, contractStep2026: 150_350.66, addOn: 2_550.00, officerCount: 32, exampleName: 'Bianco, William' },
]

export const realRaiseSource = {
  title: 'Town of Riverhead Board-authorized salary listings for 2025 and 2026 (January 2026 agenda packet)',
  note: 'Filtered to employees whose title is exactly "Police Officer" in both years, grouped ' +
    'by identical 2025->2026 dollar pairs. The 32 officers already at the 2025 top step and the ' +
    '2 officers who moved from 5th to 6th Year Officer land at the exact same 2026 figure, since ' +
    'both groups are at (or reach) the ceiling.',
}
