// The Town's total outstanding debt, from the 2025 Annual Financial Report's
// Statement of Indebtedness (p.142) and Bond Repayment schedule (p.144-146) —
// the newest figures available, covering all activities (governmental +
// business-type) combined.
//
// The debt-limit metrics below (governmentalBonds, businessTypeBonds,
// bondsAuthorizedUnissued, constitutionalDebtLimit, debtSubjectToLimit,
// debtLimitExhaustedPct) require a governmental-vs-business-type split and a
// constitutional debt limit that only an independent audit discloses — the
// Annual Financial Reports filed since 2023 don't carry that MD&A section,
// and the itemized debt records don't cleanly separate every bond by fund
// type (one 2021 bond is billed as "water & street parking improvements,"
// mixing an enterprise and a governmental purpose). So debtLimit is still
// sourced from the 2023 Audited Basic Financial Statement — the newest audit
// available — and is two years older than the totals above.
export const debtProfile = {
  asOf: 'December 31, 2025',
  source: {
    title: 'Town of Riverhead 2025 Annual Financial Report',
    detail: 'Statement of Indebtedness, p.142; Bond Repayment schedule, p.144-146',
  },
  totalBondedDebt: 38_423_858, // excl. BANs, all activities combined
  bondAnticipationNotes: 21_975_000, // ending balance, all activities
  moodyRating: 'Aa2',
  moodyRatingAsOf: 'July 2021',
  debtLimit: {
    asOf: 'December 31, 2023',
    source: {
      title: 'Town of Riverhead 2023 Audited Basic Financial Statement',
      detail: 'Management’s Discussion and Analysis, p.24; Note 3.E Indebtedness, p.65-66',
    },
    governmentalBonds: 20_198_462,
    businessTypeBonds: 21_081_538, // water/sewer — excluded from the constitutional debt limit by statute
    bondsAuthorizedUnissued: 57_059_509, // approved by the Board but not yet issued as long-term bonds
    constitutionalDebtLimit: 534_955_931, // 7% of the 5-year average full valuation, excl. water/sewer debt
    debtSubjectToLimit: 20_198_462,
    debtLimitExhaustedPct: 3.78,
  },
  // Future principal & interest on all bonds already on the books (all
  // activities combined), from the 2025 AFR's Bond Repayment schedule.
  amortization: [
    { period: '2026', principal: 5_961_040, interest: 1_287_124 },
    { period: '2027', principal: 5_845_778, interest: 1_036_167 },
    { period: '2028', principal: 3_826_040, interest: 815_734 },
    { period: '2029', principal: 3_866_040, interest: 678_963 },
    { period: '2030', principal: 3_906_040, interest: 538_955 },
    { period: '2031–2035', principal: 10_275_200, interest: 1_304_065 },
    { period: '2036–2040', principal: 3_300_200, interest: 175_079 },
    { period: '2041–2053', principal: 1_443_520, interest: 0 },
  ],
}

export const debtProfileTotals = {
  principal: debtProfile.amortization.reduce((s, r) => s + r.principal, 0),
  interest: debtProfile.amortization.reduce((s, r) => s + r.interest, 0),
}
