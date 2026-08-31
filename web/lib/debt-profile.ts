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
      'The single largest thing the Town owes. State law gives a capital BAN five years from its original issue date to be converted into long-term bonds, which puts the conversion deadline at February 2028. The COVID-era seven-year extension (Chapter 157 of the Laws of 2020) does not reach this note — it applies only to BANs originally issued in calendar years 2015 through 2021, and this one was issued in 2023.',
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
      'Issued August 2021, so the usual five-year conversion limit did not bind it: a BAN first issued between 2015 and 2021 may be renewed for seven years under Chapter 157 of the Laws of 2020. The Town could have carried it to 2028 and chose not to, retiring it in August 2026 with the proceeds of the Petrocelli parcel sale.',
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
      why: 'Five years to the day after the original August 2021 issue — but five was not the deadline. Chapter 157 of the Laws of 2020 lets a capital BAN originally issued in calendar years 2015 through 2021 be renewed for up to seven years rather than five, and this note was issued in August 2021, inside that window. The Town could have rolled it to 2028. It chose to retire it instead, using the proceeds of the Petrocelli parcel sale.',
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

// ---------------------------------------------------------------------------
// Schedule W — Non-Current Government Liabilities, 2025 Annual Financial
// Report, p.140. Bonds and notes are itemised above; this is everything else
// the Town owes long-term, and it is the larger half of the picture by a wide
// margin. Three comparative years are printed, so the direction of travel is
// the Town's own, not a reconstruction.
//
// One basis warning that matters more than any single number here: Schedule W
// is the schedule of *government* liabilities, so every figure below is the
// governmental-activities share only. The Town's water and sewer enterprises
// carry their own, and the audited financial statements report the combined
// total. For OPEB the gap is material — see opebLiability.

export type LongTermObligation = {
  /** OSC account code from Schedule W. */
  account: string
  label: string
  /** Governmental activities only. */
  values: { 2025: number; 2024: number; 2023: number }
  note?: string
}

export const longTermObligations: LongTermObligation[] = [
  {
    account: '683',
    label: 'Other post-employment benefits (retiree health)',
    values: { 2025: 129_479_192, 2024: 120_100_149, 2023: 140_439_500 },
    note: 'By far the largest thing on the Town\'s books — bigger than all bonds, notes, pension and leave liabilities put together. Unfunded and paid year-to-year out of the operating budget.',
  },
  {
    account: '638',
    label: 'Net pension liability (proportionate share)',
    values: { 2025: 27_346_801, 2024: 21_376_407, 2023: 26_299_923 },
    note: 'Riverhead\'s slice of the State retirement systems\' shortfall. It swings with the systems\' investment returns rather than with anything the Town does, which is why it can move by millions in a year in either direction.',
  },
  {
    account: '626',
    label: 'Bond anticipation notes payable',
    values: { 2025: 21_975_000, 2024: 22_800_000, 2023: 22_800_000 },
  },
  {
    account: '628',
    label: 'Bonds payable',
    values: { 2025: 12_498_350, 2024: 16_281_792, 2023: 20_198_462 },
    note: 'Governmental-activities bonds only. The full bond total across all activities is $38,423,858 — the difference is water and sewer, carried by the enterprise funds.',
  },
  {
    account: '687',
    label: 'Compensated absences (accrued leave)',
    values: { 2025: 11_608_615.25, 2024: 9_773_699.95, 2023: 8_112_950.99 },
    note: 'Unused vacation and sick time the Town will have to cash out when people leave. Broken out in detail, with the accounting-change caveat, on the Payroll page under Separation Pay.',
  },
  {
    account: '684',
    label: 'Landfill closure and post-closure care',
    values: { 2025: 1_256_895, 2024: 1_325_278, 2023: 1_391_990 },
    note: 'The only long-term obligation on this schedule that falls every single year without the Town having to do anything — the estimated remaining cost of monitoring a closed landfill winds down on its own.',
  },
  {
    account: '685',
    label: 'Installment purchase contract debt',
    values: { 2025: 0, 2024: 0, 2023: 20_877.11 },
    note: 'Paid off during 2024 and gone since. Kept on the list so the three columns still add to the Town\'s printed total.',
  },
]

/** Schedule W's own total, for reconciliation. */
export const longTermObligationsTotal = { 2025: 204_164_853.25, 2024: 191_657_325.95, 2023: 219_263_703.10 }

// OPEB gets its own export because it is the number most often quoted about
// Riverhead and the one most often quoted on a basis its source doesn't state.
//
// The audited statements report a TOTAL total-OPEB-liability; Schedule W of the
// AFR reports only the governmental-activities share. Quoting one against the
// other across years produces a fake trend. Both bases are kept here.
export const opebLiability = {
  source: {
    governmental: '2025 Annual Financial Report, Schedule W — Non-Current Government Liabilities, account 683',
    total: 'Town of Riverhead Audited Basic Financial Statements, Note 8 — Total OPEB Liability',
  },
  series: [
    {
      asOf: 'December 31, 2023',
      governmental: 140_439_500,
      businessType: 12_157_618,
      total: 152_597_117,
      discountRate: 4.0,
    },
    {
      asOf: 'December 31, 2024',
      governmental: 120_100_149,
      businessType: 12_317_039,
      total: 132_417_187,
      discountRate: 4.28,
    },
    {
      asOf: 'December 31, 2025',
      governmental: 129_479_192,
      businessType: null,
      total: null,
      discountRate: null,
      note: 'The 2025 audited statements are not out yet, so only the AFR\'s governmental share is available. On the prior two years the enterprise funds added about $12.2M, so the eventual 2025 total should land near $142M.',
    },
  ],
  // Why the numbers move the way they do. This matters: read on the
  // governmental basis alone, the liability FELL by $20.3M in 2024 and then
  // rose $9.4M in 2025, which looks like the Town did something and then
  // stopped. It didn't. GASB 75 makes an unfunded plan discount its future
  // retiree-health payments at a municipal-bond index rate, and that rate
  // went from 4.00% to 4.28% between the two valuations. A higher discount
  // rate mechanically shrinks the reported liability without one dollar
  // being set aside or one benefit changing.
  whyItMoves:
    'This liability is an actuarial estimate, not a bill. Most of the year-to-year movement comes from the discount rate GASB 75 requires an unfunded plan to use — the S&P Municipal Bond 20-Year High Grade index. It rose from 4.00% at the 2023 valuation to 4.28% at the 2024 one, which is the bulk of why the reported liability dropped that year. Nothing was pre-funded and no benefit was reduced. Read the direction of this number as a rate story first and a policy story second.',
  latestGovernmental: 129_479_192,
  latestAuditedTotal: { amount: 132_417_187, asOf: 'December 31, 2024' },
}
