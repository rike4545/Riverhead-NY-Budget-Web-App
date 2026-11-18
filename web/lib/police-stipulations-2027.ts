// The 2027-2030 police stipulations, on the Town Board's November 17, 2026
// agenda, for the payroll, 2027 forecast and buyout pages.
//
// Items IX.26 (PBA) and IX.27 (SOA) asked the Board to approve "the attached
// Stipulation" with each union; it did, 5-0, as Resolutions 2026-1020 and
// 2026-1021. The agenda packet attaches
// only each stipulation's Appendix A (night differential) and Appendix B (salary
// schedule), not the stipulation's own text, so its other terms are not public.
// Every rate below is copied from those appendices and checked against the kept
// packet text (etl/data/meetings/2026-11-17-police-stipulations-excerpt.txt) by
// scripts/verify-police-stipulations.mjs. Whether the Board has approved them
// comes from the meeting record, through lib/watched-resolutions.ts (WATCH ids).
//
// No imports, so the verify script can load this file directly.

export const MEETING = {
  date: 'November 17, 2026',
  event: 6457,
  agendaUrl: 'https://riverheadny.portal.civicclerk.com/event/6457/files/agenda/12598',
  packetUrl: 'https://riverheadny.portal.civicclerk.com/event/6457/files/agenda/12599',
}

/** Their ids in etl/data/watched-resolutions.json, which records the Board's vote. */
export const WATCH = { pba: 'pba-stipulation-2027-2030', soa: 'soa-stipulation-2027-2030', payouts: 'incentive-payouts-ix2' } as const

export const YEARS = [2026, 2027, 2028, 2029, 2030] as const

export type Row = { title: string; rates: [number, number, number, number, number] }

export const PBA = {
  item: 'IX.26',
  title: 'Authorize Supervisor to Execute Stipulation with Riverhead Town Police Benevolent Association, Inc',
  packetPages: { resolution: 202, fiscalImpact: 203, nightDiff: 204, salary: 205 },
  officers: [
    { title: 'Academy', rates: [55_899.88, 58_496.13, 60_689.73, 62_965.60, 65_326.80] },
    { title: '1st year officer', rates: [72_066.67, 75_269.17, 78_091.76, 81_020.21, 84_058.46] },
    { title: '2nd year officer', rates: [88_233.47, 92_042.23, 95_493.81, 99_074.83, 102_790.13] },
    { title: '3rd year officer', rates: [104_400.27, 108_815.28, 112_895.85, 117_129.45, 121_521.80] },
    { title: '4th year officer', rates: [120_567.07, 125_588.34, 130_297.90, 135_184.07, 140_253.47] },
    { title: '5th year officer', rates: [136_733.86, 142_361.38, 147_699.93, 153_238.68, 158_985.13] },
    { title: '6th year officer (top step)', rates: [152_900.66, 159_134.43, 165_101.98, 171_293.30, 177_716.80] },
  ] as Row[],
  detectives: [
    { title: 'Detective grade III', rates: [163_860.84, 170_505.62, 176_899.58, 183_533.32, 190_415.82] },
    { title: 'Detective grade II', rates: [170_754.31, 177_657.60, 184_319.76, 191_231.75, 198_402.94] },
    { title: 'Detective grade I', rates: [175_080.43, 182_145.95, 188_976.42, 196_063.03, 203_415.40] },
  ] as Row[],
  nightDiff: [
    { title: 'Midnight tour', rates: [9_189.11, 9_533.70, 9_891.22, 10_262.14, 10_646.97] },
    { title: 'Two-tour rotating schedule', rates: [5_365.07, 5_566.26, 5_774.99, 5_991.56, 6_216.24] },
    { title: 'K-9', rates: [8_047.60, 8_349.39, 8_662.49, 8_987.33, 9_324.36] },
  ] as Row[],
  footnote: 'Bodycam agreement increases the 2027 salaries by $500 for PBA - 2027 is the final year for bodycam increases',
}

export const SOA = {
  item: 'IX.27',
  title: 'Authorize Supervisor to Execute Stipulation with Riverhead Town Superior Officers Association, Inc.',
  packetPages: { resolution: 206, fiscalImpact: 207, nightDiff: 208, salary: 209 },
  ranks: [
    { title: 'Probationary sergeant', rates: [170_273.93, 177_159.20, 183_802.68, 190_695.28, 197_846.35] },
    { title: 'Sergeant', rates: [187_647.21, 195_183.98, 202_503.37, 210_097.25, 217_975.90] },
    { title: 'Detective sergeant', rates: [192_311.78, 200_023.47, 207_524.35, 215_306.51, 223_380.51] },
    { title: 'Lieutenant', rates: [201_531.81, 209_589.25, 217_448.85, 225_603.18, 234_063.30] },
  ] as Row[],
  nightDiff: [
    { title: 'Steady midnight tour', rates: [9_189.11, 9_533.70, 9_891.22, 10_262.14, 10_646.97] },
    { title: 'Two-tour rotating schedule', rates: [5_365.07, 5_566.26, 5_774.99, 5_991.56, 6_216.24] },
  ] as Row[],
  footnote: 'Bodycam agreement increases the 2027 salaries by $500 for SOA - 2027 is the final year for bodycam increases',
}

/** Both Fiscal Impact Statements, section D, word for word. */
export const FIS_ANSWER = 'Will the Proposed Legislation have a Fiscal Impact: No'

/**
 * The yearly increase the schedules imply, worked out from them rather than
 * stated in the packet: each year is the year before times this, with the
 * $500 bodycam amount added on top of 2027 only (so 2028 grows from a base
 * that already includes it).
 */
export const IMPLIED_RAISE = 0.0375
export const BODYCAM_2027 = 500

const pct = (a: number, b: number) => b / a - 1
/** Every row's year-on-year change, for the check and the page. */
export const rowChanges = (r: Row) => ({
  y2027: pct(r.rates[0], r.rates[1]),
  y2027BeforeBodycam: pct(r.rates[0], r.rates[1] - BODYCAM_2027),
  y2028: pct(r.rates[1], r.rates[2]),
  y2029: pct(r.rates[2], r.rates[3]),
  y2030: pct(r.rates[3], r.rates[4]),
  fourYears: pct(r.rates[0], r.rates[4]),
})

/**
 * What the schedule increase adds to the Police Officer ladder in 2027, on top
 * of the step movement the Town owes anyway (lib/labor-contracts-2027.ts).
 * Takes each officer's 2027 step from the 2026 roster the site already infers
 * (officers advance one rung; those at the top stay) and prices it at the
 * proposed 2027 rate against the 2026 rate for the same step. Pass the counts by
 * 2026 step, in ladder order.
 */
export function officerLadderIncrease2027(countsBy2026Step: number[]) {
  const ladder = PBA.officers
  let officers = 0
  let cost = 0
  countsBy2026Step.forEach((n, i) => {
    const step2027 = Math.min(i + 1, ladder.length - 1)
    officers += n
    cost += n * (ladder[step2027].rates[1] - ladder[step2027].rates[0])
  })
  return { officers, cost }
}

/**
 * Item IX.2 on the same agenda: the one-time payouts for the July retirement
 * incentive, from General Fund balance. Quoted from packet page 23.
 */
export const INCENTIVE_PAYOUTS = {
  item: 'IX.2',
  title: 'Budget Adjustment for Retirement Incentive Severance Payouts',
  packetPage: 23,
  took: 'three CSEA members and seven PBA members accepted this incentive',
  fromFundBalance: 1_387_034,
  lines: [
    { account: 'A01-3-3120-101-UNI-00000', name: 'Police Uni Personal Services', amount: 1_188_322 },
    { account: 'A01-1-1110-101-NON-00000', name: 'Justice Court Personal Services', amount: 37_180 },
    { account: 'A01-1-1355-101-NON-00000', name: 'Assessors Personal Services', amount: 48_395 },
    { account: 'A01-1-1680-101-NON-00000', name: 'IT Personal Services', amount: 14_569 },
    { account: 'A01-9-9035-805-UNI-00000', name: 'FICA Police Uni', amount: 90_907 },
    { account: 'A01-9-9030-805-NON-00000', name: 'FICA Non-Uni', amount: 7_661 },
  ],
}

// ── What the Fiscal Impact Statements should say ──────────────────────────
//
// Each correction quotes the form as printed (the kept packet excerpt, checked
// by scripts/verify-police-stipulations.mjs) and says what the form's own
// instructions ask for instead. These are a resident's reading of the Town's
// form, not an audit finding.

/** Section E(a) of the Town's form, word for word: it sits under a "yes". */
export const FORM_E_A = 'The fiscal impact can be absorbed by Town/Department existing resources set forth in approved Town Annual Budget'

/** What both police forms print in each section, and what they should say. */
export const POLICE_FORM_FIXES: { section: string; says: string; shouldSay: string; why: string; soaOnly?: boolean }[] = [
  {
    section: 'A. Type of legislation',
    says: 'Blank',
    shouldSay: 'Resolution',
    why: 'The officers’ form says “Resolution”; the superior officers’ form leaves it empty.',
    soaOnly: true,
  },
  {
    section: 'D. Will it have a fiscal impact',
    says: 'No',
    shouldSay: 'Yes',
    why: 'Every pay rate in the attached schedules rises each year from 2027 to 2030. The form has no “no” for a cost the budget already covers: that case is box E(a), which is only reached by answering “yes”.',
  },
  {
    section: 'E. Absorbed (a) or explained (b)',
    says: 'Blank',
    shouldSay: '(b), with the cost explained',
    why: 'Box (a) is for a cost the approved budget already holds. The 2027 raise appears to be in the 2027 budget (see below), but the 2028, 2029 and 2030 raises are in no budget yet.',
  },
  {
    section: 'F. Total cost, and over how many years',
    says: 'Blank',
    shouldSay: 'The cost of each year, 2027 to 2030, and the four-year total',
    why: 'The form asks for the “total Financial Cost of Funding over ___” years. The payouts form on the same agenda fills this in.',
  },
  {
    section: 'G. Accounts to be charged',
    says: 'Blank',
    shouldSay: 'The police pay, overtime, night-differential, holiday, pension and Social Security lines',
    why: 'These are the General Fund lines the raises change. Their account numbers are in the table below.',
  },
  {
    section: 'I and J. Preparer’s signature and date',
    says: 'Typed name only',
    shouldSay: 'Signed and dated',
    why: 'The payouts form on the same agenda is signed and dated by its preparer.',
  },
  {
    section: 'K to M. Accounting staff review',
    says: '“[SPONSOR]”, with no signature or date',
    shouldSay: 'Reviewed, signed and dated by the Accounting Office',
    why: 'The payouts form names its accounting reviewer and the date. Neither police form shows that the Accounting Office saw it.',
  },
]

/** The payouts form (item IX.2, packet page 25): right on the money, wrong on one box. */
export const PAYOUTS_FORM = {
  packetPage: 25,
  initialled: 'Detail/Initials: BM',
  years: 'Fiscal Year 2026',
  source: 'A01-9999-000-00000-0 Appropriated Fund Balance',
}

/**
 * The 2027 budget lines the police raises run through, from the 2027
 * Preliminary Budget (pages 14 and 21), which item IX.1 on the same agenda asks
 * the Board to adopt. "adopted2026" is that document's 2026 adopted column.
 * Checked against public/data/budget-2027-preliminary-lines.json.
 */
export const BUDGET_LINES = [
  { account: 'A01-3-3120-101-UNI-00000', name: 'Police full-time uniformed pay', adopted2026: 14_966_311, request2027: 15_929_468, budget2027: 15_652_868, rateLinked: true },
  { account: 'A01-3-3120-111-UNI-00000', name: 'Police uniformed overtime', adopted2026: 1_000_000, request2027: 1_037_500, budget2027: 1_037_500, rateLinked: true },
  { account: 'A01-3-3120-121-UNI-00000', name: 'Police uniformed night differential', adopted2026: 629_465, request2027: 629_465, budget2027: 652_716, rateLinked: true },
  { account: 'A01-3-3120-122-UNI-00000', name: 'Police uniformed holiday pay', adopted2026: 943_000, request2027: 943_000, budget2027: 978_379, rateLinked: true },
  { account: 'A01-9-9015-801-UNI-00000', name: 'Police pension (State retirement system)', adopted2026: 6_633_131, request2027: 7_739_816, budget2027: 6_994_740, rateLinked: false },
  { account: 'A01-9-9035-805-UNI-00000', name: 'Police Social Security', adopted2026: 1_334_471, request2027: 1_409_160, budget2027: 1_390_419, rateLinked: false },
]

/** The police pension rate for the State's 2027 bill (the Comptroller's 2025 actuary report, as in etl/predict_2027.py). */
export const PFRS_RATE = 0.365
export const FICA_RATE = 0.0765

/**
 * This site's rough cost of the raises alone, against 2026 pay: each year's
 * pay on the rate-linked lines above is the 2026 amount raised 3.75% a year,
 * so the extra in year k is 2026 × (1.0375^k − 1). It assumes the same staff,
 * steps and hours as the 2026 budget, and leaves out the $500 in 2027 (it is
 * per person, and the stipulations' own headcount is not published), step
 * increases the Town owes anyway, longevity, and retirements. Social Security
 * is 7.65% of the extra pay. The pension figure is the yearly cost once the
 * 2030 pay is fully in the State's bill, at today's rate, on base pay only.
 */
export function raiseCostEstimate() {
  const base = BUDGET_LINES.filter((l) => l.rateLinked).reduce((s, l) => s + l.adopted2026, 0)
  const salary = BUDGET_LINES[0].adopted2026
  const years = [2027, 2028, 2029, 2030].map((year, i) => ({ year, pay: base * ((1 + IMPLIED_RAISE) ** (i + 1) - 1) }))
  const pay = years.reduce((s, y) => s + y.pay, 0)
  return {
    base,
    years,
    pay,
    socialSecurity: pay * FICA_RATE,
    pensionYearly: salary * ((1 + IMPLIED_RAISE) ** 4 - 1) * PFRS_RATE,
  }
}
