// Every bond and bond anticipation note the Town of Riverhead had outstanding
// at the close of the 2025 fiscal year, itemised.
//
// Two documents feed this file, and they do different jobs:
//
//   • The 2025 Annual Financial Report (Statement of Indebtedness, p.142-143;
//     Bond Repayment schedule, p.144-146) is the newest filing and the source
//     for every balance below. Its Debt Records table lists each issue by
//     purpose, issue date, maturity date, and ending balance.
//   • The 2024 Audited Basic Financial Statements (Note 3.E Indebtedness,
//     p.60-62) is the newest independent audit. The AFR does not print
//     interest rates or formal issue names; the audit does, and it also splits
//     each issue between governmental and business-type activities — which is
//     what decides whether an issue counts against the constitutional debt
//     limit. Rates and issue names below therefore carry a date one year older
//     than the balances beside them.
//
// Where the two documents disagree, both readings are kept and the conflict is
// stated rather than resolved silently — see the EFC 2024 note.

export type DebtActivity = 'governmental' | 'business-type' | 'split'

export type DebtIssue = {
  kind: 'bond' | 'ban'
  /** Purpose exactly as the Town's Statement of Indebtedness words it. */
  purpose: string
  /** Formal issue name from the audit, where the audit names it. */
  issueName?: string
  /** Coupon range from the audit. Undefined where no audit discloses it. */
  rate?: string
  issued: string
  matures: string
  beginning2025: number
  principalPaid2025: number
  /** Balance at December 31, 2025. */
  outstanding: number
  activity: DebtActivity
  /** Governmental / business-type split at 12/31/2024, for split issues. */
  split?: { governmental: number; businessType: number }
  note?: string
}

// Ordered largest balance first. The eight bonds sum to $38,423,858 and the two
// notes to $21,975,000, matching the Statement of Indebtedness Debt Summary.
export const debtIssues: DebtIssue[] = [
  {
    kind: 'ban',
    purpose: 'Purchase of Town Hall properties — Griffing Ave & West Second St',
    issued: '2023-02-21',
    matures: '2026-02-20',
    beginning2025: 20_000_000,
    principalPaid2025: 750_000,
    outstanding: 19_250_000,
    activity: 'governmental',
    note:
      'The single largest thing the Town owes. State law gives a capital BAN five years from its original issue date to be converted into long-term bonds, which puts the conversion deadline at February 2028.',
  },
  {
    kind: 'bond',
    purpose: 'Improvements',
    issueName: 'General Obligation Serial Bonds — 2018 Refunding Bond',
    rate: '4.000% – 5.000%',
    issued: '2018-12-01',
    matures: '2030-08-01',
    beginning2025: 12_565_000,
    principalPaid2025: 2_625_000,
    outstanding: 9_940_000,
    activity: 'governmental',
    note: 'The fastest-amortising issue on the books — a quarter of it was retired during 2025 alone.',
  },
  {
    kind: 'bond',
    purpose: 'Sewer improvements (EFC)',
    issueName: 'NYS Environmental Facilities Corporation Bonds, Series 2016B — Clean Water',
    rate: '0.698% – 3.073%',
    issued: '2016-09-22',
    matures: '2036-08-01',
    beginning2025: 7_980_000,
    principalPaid2025: 620_000,
    outstanding: 7_360_000,
    activity: 'business-type',
  },
  {
    kind: 'bond',
    purpose: 'Water & street parking improvements',
    issueName: 'General Obligation Serial Bonds — 2021 Public Improvement',
    rate: '2.00% – 5.00%',
    issued: '2021-08-17',
    matures: '2036-12-31',
    beginning2025: 6_050_000,
    principalPaid2025: 390_000,
    outstanding: 5_660_000,
    activity: 'split',
    split: { governmental: 551_107, businessType: 5_498_893 },
    note:
      'One issue paying for two unrelated things — a water district (business-type, outside the debt limit) and street parking (governmental, inside it). The audit splits it; the AFR does not.',
  },
  {
    kind: 'bond',
    purpose: 'Water district improvements',
    issueName: 'General Obligation Serial Bonds — 2024 Public Improvement',
    rate: '1.00% – 4.00%',
    issued: '2024-12-03',
    matures: '2039-12-01',
    beginning2025: 4_975_000,
    principalPaid2025: 0,
    outstanding: 4_975_000,
    activity: 'business-type',
    note: 'The newest bond, and the only one that paid no principal at all in 2025 — its first principal payment falls later.',
  },
  {
    kind: 'bond',
    purpose: 'Improvements',
    issueName: 'General Obligation Serial Bonds — 2019 Refunding Bond',
    rate: '2.000% – 5.000%',
    issued: '2019-10-01',
    matures: '2031-11-15',
    beginning2025: 4_935_000,
    principalPaid2025: 1_375_000,
    outstanding: 3_560_000,
    activity: 'split',
    split: { governmental: 3_165_685, businessType: 1_769_315 },
    note: 'The audit dates this issue September 25, 2019; the Annual Financial Report dates it October 1, 2019.',
  },
  {
    kind: 'bond',
    purpose: 'Water district improvements',
    issueName: 'General Obligation Serial Bonds — 2018 Public Improvement',
    rate: '4.000%',
    issued: '2018-12-01',
    matures: '2033-12-01',
    beginning2025: 3_790_000,
    principalPaid2025: 355_000,
    outstanding: 3_435_000,
    activity: 'business-type',
  },
  {
    kind: 'bond',
    purpose: 'Sewer improvements (EFC)',
    issueName: 'NYS Environmental Facilities Corporation Bonds, Series 2024 — Clean Water',
    rate: '0.000%',
    issued: '2024-06-13',
    matures: '2053-09-01',
    beginning2025: 3_219_898,
    principalPaid2025: 111_040,
    outstanding: 3_108_858,
    activity: 'business-type',
    note:
      'Interest-free, and the reason the repayment schedule runs to 2053: $111,040 of principal a year and nothing else. The two Town documents disagree about it — the AFR says it was issued June 13, 2024 and matures in 2053, the audit says September 1, 2024 and 2041. The AFR reading is the one its own payment schedule supports.',
  },
  {
    kind: 'ban',
    purpose: 'Purchase of Town Square properties',
    issued: '2021-08-15',
    matures: '2026-08-14',
    beginning2025: 2_800_000,
    principalPaid2025: 75_000,
    outstanding: 2_725_000,
    activity: 'governmental',
    note:
      'Originally issued in August 2021, which puts it at the five-year statutory limit for converting a capital BAN into long-term bonds.',
  },
  {
    kind: 'bond',
    purpose: 'Sewer improvements (EFC)',
    issueName: 'NYS Environmental Facilities Corporation Bonds, Series 2021B — Clean Water',
    rate: '0.00% – 4.951%',
    issued: '2021-12-09',
    matures: '2031-10-15',
    beginning2025: 445_000,
    principalPaid2025: 60_000,
    outstanding: 385_000,
    activity: 'business-type',
  },
]

export const debtProfile = {
  asOf: 'December 31, 2025',
  source: {
    title: 'Town of Riverhead 2025 Annual Financial Report',
    detail: 'Statement of Indebtedness, p.142-143; Bond Repayment schedule, p.144-146',
    url: 'https://www.townofriverheadny.gov/DocumentCenter/View/3513/2025-Annual-Financial-Report',
  },
  auditSource: {
    title: 'Town of Riverhead 2024 Audited Basic Financial Statements',
    detail: 'Note 3.E Indebtedness, p.60-62',
  },
  totalBondedDebt: 38_423_858, // excl. BANs, all activities combined
  bondAnticipationNotes: 21_975_000, // ending balance, all activities
  // What the Town retired during 2025, from the same Debt Summary.
  principalPaid2025: { bonds: 5_536_040, bans: 825_000 },
  issuedDuring2025: 0,
  moodyRating: 'Aa2',
  // Aa2 was first assigned in an upgrade dated July 23, 2021 (from Aa3) and has
  // since been affirmed, most recently in a Feb. 16, 2024 rating action tied to
  // a $20M BAN renewal (which also carried a MIG 1 short-term rating). See
  // lib/credit-rating.ts for the full rating history and sourcing detail.
  moodyRatingAsOf: 'affirmed February 2024',
  debtLimit: {
    asOf: 'December 31, 2024',
    source: {
      title: 'Town of Riverhead 2024 Audited Basic Financial Statements',
      detail: 'Note 3.E Indebtedness, p.62',
    },
    governmentalBonds: 16_281_792,
    businessTypeBonds: 16_033_208, // water — excluded from the constitutional debt limit by statute
    efcBonds: 11_644_898, // sewer, also business-type and also excluded
    bondsAuthorizedUnissued: 49_924_917, // approved by the Board but not yet issued as long-term bonds
    constitutionalDebtLimit: 579_848_545, // implied: debt subject to the limit ÷ the audit's 6.74%
    debtSubjectToLimit: 39_081_792, // governmental bonds + BANs
    debtLimitExhaustedPct: 6.74,
    // The prior audit put this at 3.78%. Almost none of the jump is new
    // borrowing: the 2023 audit's aggregate ($41,280,000) counted bonds only,
    // while the 2024 audit's ($66,759,898) counts the two BANs as well. The
    // basis changed, so the two percentages are not a trend.
    priorYear: { asOf: 'December 31, 2023', debtLimitExhaustedPct: 3.78, bondsAuthorizedUnissued: 57_059_509 },
  },
  // Future principal & interest on all bonds already on the books (all
  // activities combined), year by year, from the 2025 AFR's Bond Repayment
  // schedule. Every year through final maturity is listed — the schedule is
  // printed annually, so there is no need to band or average anything.
  amortization: [
    { year: 2026, principal: 5_961_040, interest: 1_287_124 },
    { year: 2027, principal: 5_845_778, interest: 1_036_167 },
    { year: 2028, principal: 3_826_040, interest: 815_734 },
    { year: 2029, principal: 3_866_040, interest: 678_963 },
    { year: 2030, principal: 3_906_040, interest: 538_955 },
    { year: 2031, principal: 2_391_040, interest: 400_965 },
    { year: 2032, principal: 2_161_040, interest: 323_721 },
    { year: 2033, principal: 2_206_040, interest: 255_527 },
    { year: 2034, principal: 1_746_040, interest: 185_173 },
    { year: 2035, principal: 1_771_040, interest: 138_679 },
    { year: 2036, principal: 1_796_040, interest: 91_079 },
    { year: 2037, principal: 471_040, interest: 42_400 },
    { year: 2038, principal: 471_040, interest: 28_000 },
    { year: 2039, principal: 451_040, interest: 13_600 },
    { year: 2040, principal: 111_040, interest: 0 },
    { year: 2041, principal: 111_040, interest: 0 },
    { year: 2042, principal: 111_040, interest: 0 },
    { year: 2043, principal: 111_040, interest: 0 },
    { year: 2044, principal: 111_040, interest: 0 },
    { year: 2045, principal: 111_040, interest: 0 },
    { year: 2046, principal: 111_040, interest: 0 },
    { year: 2047, principal: 111_040, interest: 0 },
    { year: 2048, principal: 111_040, interest: 0 },
    { year: 2049, principal: 111_040, interest: 0 },
    { year: 2050, principal: 111_040, interest: 0 },
    { year: 2051, principal: 111_040, interest: 0 },
    { year: 2052, principal: 111_040, interest: 0 },
    { year: 2053, principal: 111_040, interest: 0 },
  ],
}

// Everything above is a photograph taken on December 31, 2025. These are the
// things the Town's own record shows happening after the shutter closed, and
// they matter because both notes reached their maturity dates during 2026.
export const sinceBalanceSheet = {
  asOf: 'August 20, 2026',
  events: [
    {
      date: 'March 18, 2025',
      what: 'Bond resolution 2025-273 — appropriating $2,350,000',
      why: 'A new borrowing authorisation. Authorised is not issued; it joins the authorised-but-unissued balance until bonds are actually sold.',
      source: 'Town Board meeting of March 18, 2025 — adopted unanimously.',
    },
    {
      date: 'October 7, 2025',
      what: 'Bond resolution 2025-856 — authorising issuance and appropriating $6,500,000',
      why: 'A second, larger authorisation in the same year.',
      source: 'Town Board meeting of October 7, 2025 — adopted unanimously.',
    },
    {
      date: 'February 20, 2026',
      what: 'The $19,250,000 Town Hall BAN reached its maturity date',
      why: 'A note that matures is either paid off or renewed. The Town has until February 2028 — five years from the original 2023 issue — to convert it into long-term bonds.',
      source: '2025 Annual Financial Report, Statement of Indebtedness Debt Records.',
    },
    {
      date: 'July 7, 2026',
      what: 'Resolution 2026-641 — budget adjustment to pay down the Town Square BAN',
      why: 'The Board voted unanimously to use fund balance to pay the note down rather than roll it over again.',
      source: 'Town Board meeting of July 7, 2026 — adopted unanimously.',
    },
    {
      date: 'July 7, 2026',
      what: 'Resolution 2026-642 — budget adjustment to pay down the 2018 Series B bond refunding',
      why: 'Booked as present-value debt-service savings — retiring principal early to avoid the interest that would have accrued on it.',
      source: 'Town Board meeting of July 7, 2026 — adopted unanimously.',
    },
    {
      date: 'August 14, 2026',
      what: 'The Town Square BAN reached its maturity date',
      why: 'Five years to the day after the original August 2021 issue, which is the statutory outside limit for converting a capital BAN into long-term bonds.',
      source: '2025 Annual Financial Report, Statement of Indebtedness Debt Records.',
    },
  ],
  caveat:
    'The amounts of the two July 2026 pay-downs are not in the resolution titles, and no financial report covering 2026 has been filed yet. So the balances on this page are the audited December 31, 2025 figures — the true figures today are lower by whatever those pay-downs came to.',
}

export const debtProfileTotals = {
  principal: debtProfile.amortization.reduce((s, r) => s + r.principal, 0),
  interest: debtProfile.amortization.reduce((s, r) => s + r.interest, 0),
}

export const debtIssueTotals = {
  bonds: debtIssues.filter((d) => d.kind === 'bond').reduce((s, d) => s + d.outstanding, 0),
  bans: debtIssues.filter((d) => d.kind === 'ban').reduce((s, d) => s + d.outstanding, 0),
  all: debtIssues.reduce((s, d) => s + d.outstanding, 0),
}
