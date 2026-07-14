// The Town's actual outstanding debt, transcribed from the most recent full
// audit (the 2023 Audited Basic Financial Statement — MD&A "Debt
// Administration" p.24 and Note 3.E "Indebtedness" p.65-66). Annual Financial
// Report Updates for 2024/2025 don't carry the MD&A debt-administration
// section, so this is the newest full breakdown available. Figures are
// governmental-activities General Fund/town-wide debt unless noted.
export const debtProfile = {
  asOf: 'December 31, 2023',
  source: {
    title: 'Town of Riverhead 2023 Audited Basic Financial Statement',
    detail: 'Management’s Discussion and Analysis, p.24; Note 3.E Indebtedness, p.65-66',
  },
  totalBondedDebt: 41_280_000, // excl. BANs, governmental + business-type combined
  governmentalBonds: 20_198_462,
  businessTypeBonds: 21_081_538, // water/sewer — excluded from the constitutional debt limit by statute
  bondAnticipationNotes: 22_800_000, // governmental activities only; $0 in the prior year
  bondsAuthorizedUnissued: 57_059_509, // approved by the Board but not yet issued as long-term bonds
  constitutionalDebtLimit: 534_955_931, // 7% of the 5-year average full valuation, excl. water/sewer debt
  debtSubjectToLimit: 20_198_462,
  debtLimitExhaustedPct: 3.78,
  moodyRating: 'Aa2',
  moodyRatingAsOf: 'July 2021',
  // Future principal & interest on the governmental-activities bonds already on the books.
  amortization: [
    { period: '2024', principal: 3_916_670, interest: 929_558 },
    { period: '2025', principal: 3_783_442, interest: 733_725 },
    { period: '2026', principal: 3_784_348, interest: 544_553 },
    { period: '2027', principal: 3_624_939, interest: 355_335 },
    { period: '2028', principal: 1_595_991, interest: 200_638 },
    { period: '2029–2033', principal: 3_332_295, interest: 227_744 },
    { period: '2034–2036', principal: 160_777, interest: 6_477 },
  ],
}

export const debtProfileTotals = {
  principal: debtProfile.amortization.reduce((s, r) => s + r.principal, 0),
  interest: debtProfile.amortization.reduce((s, r) => s + r.interest, 0),
}
