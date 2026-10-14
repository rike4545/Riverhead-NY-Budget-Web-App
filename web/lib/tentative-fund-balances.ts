// The 2027 Tentative Budget's own Fund Balances page (PDF p. 9, printed p. 4),
// the rows this site uses, as printed.
//
// For each fund the page gives the balance audited at the end of 2025, a
// column labelled "2025 Application of Fund Balance", and an estimate for the
// end of 2026: the first less the second. For the water and sewer funds the
// audited figure is the audit's total net position, mostly capital (see
// AUDIT_2025.enterprise in audits.ts). The three sewer funds share one audited
// figure, as the audit reports them together.
//
// No imports, so scripts/verify-funds-savings.mjs checks every figure against
// the text of the page and the column against the budgets it matches.

export const TENTATIVE_FUND_BALANCES_2027 = {
  source: {
    title: '2027 Tentative Budget (PDF)',
    url: 'https://www.townofriverheadny.gov/DocumentCenter/View/3973/2027-Tentative-Budget-PDF',
    pdfPage: 9,
    printedPage: 4,
  },
  /** The column the page subtracts, as labelled. */
  applicationLabel: '2025 Application of Fund Balance',
  generalFund: { audited: 33_303_051, application: 0, estimated: 33_303_051 },
  sewer: { audited: 23_794_711, application: { ES1: 2_150_000, ES3: 550_000, ES5: 100_000 }, estimated: 20_994_711 },
  water: { audited: 49_353_504, application: { EW1: 1_850_000 }, estimated: 47_503_504 },
  totals: { audited: 150_333_196, application: 4_650_000, estimated: 145_683_196 },
} as const
