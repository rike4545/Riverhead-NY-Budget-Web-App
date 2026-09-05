// 2023 budget against 2023 actuals, from the audited statements.
//
// WHY THIS EXISTS. The site could show what the Town planned to spend and what
// it later reported spending, but not the two side by side for a closed year on
// the auditor's own numbers. The 2023 audited financial statements carry the
// Schedule of Revenues, Expenditures and Changes in Fund Balances — Budget and
// Actual for the General Fund, which is the authoritative version: it shows the
// original budget, the final budget after amendments, the actual result, and
// encumbrances, all in one table.
//
// WHY IT MATTERS FOR A LEVY FREEZE. A zero-percent year needs about $3.5M. In
// 2023 the Town collected $4.36M more revenue than its own final budget assumed
// and spent $4.0M less than it appropriated. Either one alone would have paid
// for a freeze. Both went to fund balance instead.
//
// RECONCILIATION, because the two sources disagree on their face. The Annual
// Financial Report filed with the State shows 2023 General Fund revenues of
// $60,760,554 and expenditures of $54,019,180, which do not match the audit's
// $59,298,952 and $50,260,655. The difference is interfund transfers, which the
// AFR folds into its totals and the audit reports separately: add transfers in
// of $1,461,602 and transfers out of $3,758,526 and the two tie exactly. Both
// are right; they are answering slightly different questions.

export type BudgetActualRow = {
  label: string
  original: number
  final: number
  actual: number
  /** Encumbered at year end — money committed but not yet spent. Expenditures only. */
  encumbered?: number
}

export const source = {
  title: 'Town of Riverhead — Audited Basic Financial Statements, year ended December 31, 2023',
  schedule: 'Schedule of Revenues, Expenditures, and Changes in Fund Balances — Budget and Actual, General Fund',
  url: 'https://www.townofriverheadny.gov/206/Financial-Reports',
}

export const revenues: BudgetActualRow[] = [
  { label: 'Real property taxes', original: 42_177_900, final: 42_230_075, actual: 42_517_065 },
  { label: 'Real property tax items', original: 2_200_800, final: 2_200_800, actual: 2_346_296 },
  { label: 'Non-property tax items', original: 2_744_000, final: 2_744_000, actual: 3_211_432 },
  { label: 'Departmental income', original: 2_608_200, final: 2_625_260, actual: 4_219_355 },
  { label: 'Use of money and property', original: 256_000, final: 273_500, actual: 1_830_965 },
  { label: 'Licenses and permits', original: 199_300, final: 199_300, actual: 231_713 },
  { label: 'Fines and forfeitures', original: 450_000, final: 475_000, actual: 720_376 },
  { label: 'Sale of property and compensation for loss', original: 407_500, final: 407_500, actual: 5_105 },
  { label: 'Miscellaneous local sources', original: 1_500, final: 1_500, actual: 25_798 },
  { label: 'Interfund revenues', original: 1_837_100, final: 1_837_100, actual: 1_142_729 },
  { label: 'State and local aid', original: 1_600_100, final: 1_650_100, actual: 2_491_359 },
  { label: 'Federal aid', original: 163_600, final: 295_998, actual: 556_759 },
]

export const expenditures: BudgetActualRow[] = [
  { label: 'General government support', original: 12_080_048, final: 12_282_036, actual: 10_767_185, encumbered: 15_359 },
  { label: 'Public safety', original: 19_940_958, final: 20_655_530, actual: 20_132_757, encumbered: 356_888 },
  { label: 'Health', original: 24_000, final: 17_900, actual: 15_302 },
  { label: 'Transportation', original: 363_800, final: 363_800, actual: 316_282 },
  { label: 'Economic assistance and opportunity', original: 1_027_100, final: 1_027_100, actual: 904_847, encumbered: 6_354 },
  { label: 'Culture and recreation', original: 1_432_728, final: 1_513_760, actual: 1_435_774, encumbered: 4_125 },
  { label: 'Home and community services', original: 1_854_281, final: 2_038_621, actual: 1_661_914, encumbered: 124_954 },
  { label: 'Employee benefits', original: 17_035_500, final: 16_322_500, actual: 14_983_044 },
  { label: 'Debt service — principal', original: 40_700, final: 40_700, actual: 40_262 },
  { label: 'Debt service — interest', original: 3_300, final: 3_300, actual: 3_288 },
]

export const totals = {
  revenues: { original: 54_646_000, final: 54_940_133, actual: 59_298_952 },
  expenditures: { original: 53_802_415, final: 54_265_247, actual: 50_260_655, encumbered: 507_680 },
  transfersIn: { original: 1_311_400, final: 1_311_400, actual: 1_461_602 },
  transfersOut: { original: -2_575_300, final: -3_849_489, actual: -3_758_526 },
  netChange: { original: -420_315, final: -1_863_203, actual: 6_741_373 },
}

export const theMiss = {
  headline: 'The Town planned to draw down $1.9 million and added $6.7 million instead',
  detail:
    'Against its own final amended budget, Riverhead’s 2023 General Fund took in $4,358,819 more revenue than it assumed and spent $4,004,592 less than it appropriated — of which $507,680 was encumbered rather than saved, leaving a true under-spend of $3,496,912. The budget projected a $1,863,203 reduction in fund balance. The year closed $6,741,373 to the good: a swing of $8,604,576.',
  swingFinal: 8_604_576,
  swingOriginal: 7_161_688,
  revenueVariance: 4_358_819,
  spendVariance: 4_004_592,
  trueUnderspend: 3_496_912,
}

export const biggestMisses = [
  { label: 'Use of money and property', final: 273_500, actual: 1_830_965, note: 'Interest on Town deposits. 2023 was the year rates rose sharply, and the budget was written before that was visible — this one is more forecasting difficulty than forecasting choice.' },
  { label: 'Departmental income', final: 2_625_260, actual: 4_219_355, note: 'Fees charged for Town services. A 61% overshoot on a line the Town sets the prices for.' },
  { label: 'State and local aid', final: 1_650_100, actual: 2_491_359, note: 'Aid is genuinely uncertain when the budget is adopted, and budgeting it low is the conventional prudent choice.' },
  { label: 'General government support', final: 12_282_036, actual: 10_767_185, note: 'Under-spent by $1.5 million, the largest single expenditure variance.' },
  { label: 'Employee benefits', final: 16_322_500, actual: 14_983_044, note: 'Under-spent by $1.3 million — notable because benefits are the category the Town names as its fastest-growing cost pressure.' },
]

export const whatItMeansForAFreeze = {
  headline: 'A freeze needs $3.5 million. In 2023 the Town found more than that twice over, by accident',
  detail:
    'The cost of holding the General Fund levy flat in 2027 is about $3,514,315. In 2023 the Town beat its own final revenue budget by $4,358,819 and under-spent its appropriations by $3,496,912 after encumbrances. Either number on its own would have covered a freeze of that size. Neither was used that way, because neither was known until the year was over — the money surfaced as surplus and went to fund balance.',
  theFairReading:
    'This is not proof of padding. Budgeting revenue conservatively and appropriating generously is ordinary municipal practice and the State Comptroller broadly prefers it to the reverse; an interest-rate spike in particular is not something a budget adopted the previous autumn can be expected to catch. But a pattern this large is also the reason the Town holds unassigned fund balance at 42.9% of appropriations against its own 15–20% policy. The surplus is not an accident of one year.',
  theQuestion:
    'So the real question a resident can put to the Board is narrower and more answerable than “can we afford zero percent.” It is: if the budget has been beating itself by several million a year, how much of that is now predictable enough to be budgeted for at the front end — where it would hold the levy down — rather than discovered at the back end, where it becomes surplus?',
}
