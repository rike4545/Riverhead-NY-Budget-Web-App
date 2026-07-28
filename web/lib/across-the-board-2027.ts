// Illustration: what a flat "every department cut 2.5%" directive would yield,
// computed from the 2026 Budget Supplement line totals (budget-supplement/
// summary.json + lines.json). The honest point of this view is that an
// across-the-board percentage is blunt: most of the budget is personnel and
// mandated cost (pension, debt, insurance) that can't be trimmed by memo, so
// the realistic yield is far below "2.5% of everything."

export const acrossTheBoard2027 = {
  cutPercent: 0.025,
  gapToClose: 936_727, // modeled 2027 automatic payroll-pressure gap

  // Applying 2.5% to different bases (all funds, from the supplement).
  bases: [
    { label: '2.5% of every expenditure line, all funds', base: 118_614_214, note: 'Blunt maximum — treats salaries, pensions, and debt service as if they could be shaved 2.5% by directive. They can’t.' },
    { label: '2.5% of General Fund appropriations', base: 68_945_417, note: 'The usual target of a “everyone cut 2.5%” memo.' },
    { label: '2.5% of controllable + personnel (no mandated)', base: 68_764_052, note: 'Excludes pension, debt, insurance, payroll taxes — costs a directive can’t change.' },
    { label: '2.5% of controllable lines only', base: 29_038_688, note: 'The genuinely discretionary base — supplies, contracts, equipment, professional services.' },
  ],

  // Per fund/department: total 2026 tentative and the 2.5% slice, plus the 2.5%
  // slice of just that fund's controllable lines.
  byFund: [
    { fund: 'General Fund', tentative: 68_945_417, controllable: 11_032_240 },
    { fund: 'Sewer', tentative: 11_161_903, controllable: 5_020_240 },
    { fund: 'Water', tentative: 9_908_655, controllable: 3_048_560 },
    { fund: 'Highway', tentative: 7_919_250, controllable: 2_490_920 },
    { fund: 'Debt Service', tentative: 6_888_150, controllable: 0 },
    { fund: 'Refuse', tentative: 5_254_540, controllable: 5_097_080 },
    { fund: 'Ambulance', tentative: 3_411_536, controllable: 244_920 },
    { fund: 'Scavenger Waste', tentative: 2_031_988, controllable: 1_217_920 },
    { fund: 'Street Lighting', tentative: 755_585, controllable: 349_400 },
  ],

  takeaway:
    "A flat 2.5% General Fund cut pencils out to about $1.73 million — nearly twice the $936,727 payroll-pressure gap. But roughly three-quarters of spending is personnel and mandated cost that a directive can’t touch; trim only the genuinely controllable lines and 2.5% yields about $726,000 — short of the gap on its own. That’s why the targeted, line-item package above (which reaches the controllable over-budget lines specifically) does more than a blunt across-the-board percentage.",
}
