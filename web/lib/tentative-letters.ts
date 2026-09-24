// The budget officer's opening letter in a Tentative, where it is a scanned
// image and had to be read by hand.
//
// etl/parse_budget_stages.py reads a letter that has a text layer on its own.
// The 2025, 2026 and 2027 letters are images with no text at all, so the
// parser reports their pages as unreadable, and what they say is recorded here
// with the pages it came from. Quotes are exact, including the letters' own
// punctuation and spelling. Every figure a letter gives that the budget's
// Summary can check is checked against it in scripts/verify-tentative-letter.mjs,
// so a misread number fails the build instead of reaching a page.

export type HandReadLetter = {
  pages: string
  /** As printed at the top of the letter, or null if it carries no date. */
  dated: string | null
  /** The sentence that says where the levy stands against the tax cap. */
  taxCap: string | null
  /** The levy limit, where the letter gives it as a percentage increase. It gives no dollar figure. */
  statedLimitPct?: number
}

export const READ_BY_HAND: Record<number, HandReadLetter> = {
  2025: {
    pages: 'pp. 2–3',
    dated: null,
    taxCap: 'The Town-wide 2025 Budget is 4.14% over the tax cap, due in large part to increases to insurance premiums and retirement systems contributions.',
  },
  2026: {
    pages: 'pp. 2–3',
    dated: 'September 29, 2025',
    taxCap: 'The 2026 town-wide budget is 4.63% over the tax cap.',
  },
  2027: {
    pages: 'pp. 2–3',
    dated: 'September 24, 2026',
    taxCap: 'There is joy in presenting this budget as all taxing districts are budgeted within the tax cap limit of 2.79%.',
    statedLimitPct: 2.79,
  },
}

/**
 * The rest of Supervisor Halpin's 2027 letter, claim by claim. The Tentative
 * page sets each one beside what the Summary shows. Where the Summary cannot
 * show it (the retirement incentive, the raises and new positions), the claim
 * is reported as the letter's and left for the Budget Supplement, which prints
 * the lines.
 */
export const LETTER_2027 = {
  year: 2027,
  signedBy: 'Jerry Halpin, Riverhead Town Supervisor',
  source: {
    title: '2027 Tentative Budget (PDF)',
    url: 'https://www.townofriverheadny.gov/DocumentCenter/View/3928/2027-Tentative-Budget-PDF',
    pages: 'pp. 2–3',
  },
  goal: 'The goal of this Tentative Budget is clear – provide financial relief for tax payers while bolstering opportunities for increased employee retention at the lower end of the pay scale.',
  operating: {
    quote: 'Total appropriations for the town operating fund in 2027 are $116,864,850, a stable growth of $4,142,096 over 2026.',
    total: 116_864_850,
    growth: 4_142_096,
  },
  generalFund: {
    quote: 'The 2027 General Fund Tentative Budget adds $2.9 million in expenditures, which equals approximately $0.28 per day for property valued at $800,000.',
    added: 2_900_000,
    perDay: 0.28,
    exampleValue: 800_000,
  },
  fundBalance: {
    quote: 'The 2027 Tentative Budget also includes a $300,000 reduction of Fund Balance contribution to the General Fund.',
    reduction: 300_000,
  },
  retirementIncentive: {
    savingsQuote: 'This year, we were able to offer a retirement incentive that yielded a $819,000 savings directly to the General Fund for 2027.',
    quote: 'Three CSEA members and seven PBA members chose to take the retirement incentive',
    csea: 3,
    pba: 7,
    soa: 0,
    /** Net General Fund saving for 2027, as the letter gives it. */
    savings: 819_000,
    salariesAndPayrollTaxes: 746_000,
    retirementContributions: 341_000,
    /** The letter says the gross saving "was partially offset by an increase in retirement health insurance" and gives no figure; this is the difference. */
    retireeHealthOffset: 746_000 + 341_000 - 819_000,
  },
  staffing: {
    quote: 'In total, seventy-six merit raises (including the sixty-four above), nine promotional raises, six new full-time positions, as well as two new part-time positions, are budgeted for while remaining under the 2.79% tax cap.',
    stepMoves: 64,
    stepDepartments: ['Seniors', 'Highway', 'Buildings & Grounds'],
    meritRaises: 76,
    promotions: 9,
    newFullTime: 6,
    newPartTime: 2,
  },
} as const
