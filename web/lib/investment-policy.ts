// /investment-policy/: the investment policy the Town Board readopts each
// January, read across its last four years and beside Brookhaven's,
// Southampton's, Southold's and Smithtown's, with the State Comptroller's model.
//
// Every quotation names the document it comes from (`doc`). The documents'
// text is kept in etl/data/investment-policy/sources.json, except Riverhead's
// 2023 to 2025 policies, which are read from the meeting minutes in
// etl/data/meetings/. scripts/verify-investment-policy.mjs checks each
// quotation against that text, ignoring spacing.
//
// No JSON imports, so the verify script can load this file directly.

export type Quote = { doc: string; text: string }
export type Source = { label: string; url: string }

const civicclerk = (host: string, fileId: number) =>
  `https://${host}.api.civicclerk.com/v1/Meetings/GetMeetingFileStream(fileId=${fileId},plainText=false)`

/** The documents behind the page, keyed by the `doc` each quotation names. */
export const SOURCES: Record<string, Source> = {
  'minutes-2023-01-04': { label: 'Town of Riverhead, Town Board minutes, January 4, 2023 (Resolution 2023-33 and the attached policy)', url: civicclerk('riverheadny', 2637) },
  'minutes-2024-01-03': { label: 'Town of Riverhead, Town Board minutes, January 3, 2024 (Resolution 2024-48 and the attached policy)', url: civicclerk('riverheadny', 2595) },
  'minutes-2025-01-07': { label: 'Town of Riverhead, Town Board minutes, January 7, 2025 (Resolution 2025-81 and the attached policy)', url: civicclerk('riverheadny', 2722) },
  'riverhead-2026': { label: 'Town of Riverhead, January 6, 2026 agenda packet, Resolution 2026-53 and the attached policy (packet pages 218 to 225)', url: civicclerk('riverheadny', 10512) },
  'riverhead-audit-2025': { label: 'Town of Riverhead, Financial Statements, December 31, 2025, notes 3.A, pages 56 to 57 (September 1, 2026 agenda packet)', url: civicclerk('riverheadny', 12303) },
  'brookhaven-2026': { label: 'Town of Brookhaven, January 5, 2026 organizational meeting agenda packet (resolutions 2026-22, 2026-31 and 2026-48)', url: civicclerk('brookhavenny', 6987) },
  'brookhaven-os-2024': { label: 'Town of Brookhaven, Preliminary Official Statement dated July 8, 2024, “Investment Policy”, page 19', url: 'https://www.munistat.com/wp-content/uploads/2024/07/BrookhavenTNJuly24BNPOS.pdf' },
  'southampton-2015-431': { label: 'Town of Southampton, Resolution 2015-431, Adopt Town of Southampton Investment Policy (April 14, 2015)', url: 'https://southamptonny.iqm2.com/Citizens/Detail_LegiFile.aspx?ID=22107' },
  'southampton-budget-2026': { label: 'Town of Southampton, 2026 Adopted Budget, Financial Policies', url: 'https://www.southamptontownny.gov/DocumentCenter/View/42516/2026-Financial-Policies---Adopted' },
  'southold-2024': { label: 'Town of Southold, organizational meeting minutes, January 2, 2024 (RES-2024-33)', url: civicclerk('southoldny', 1433) },
  'southold-2025': { label: 'Town of Southold, organizational meeting minutes, January 7, 2025 (RES-2025-44)', url: civicclerk('southoldny', 1416) },
  'southold-2026': { label: 'Town of Southold, organizational meeting minutes, January 2, 2026 (resolutions 2026-18 and 2026-53)', url: civicclerk('southoldny', 3623) },
  'smithtown-2026': { label: 'Town of Smithtown, Investment Policy, January 2026, attached to Resolution 2026-7', url: 'https://smithtownny.portal.civicclerk.com/event/4228/overview' },
  'smithtown-minutes-2026': { label: 'Town of Smithtown, Town Board minutes, January 6, 2026', url: civicclerk('smithtownny', 10379) },
  'smithtown-2025': { label: 'Town of Smithtown, Investment Policy, January 2025', url: 'https://smithtownny.portal.civicclerk.com/event/94/overview' },
  'gml-10': { label: 'General Municipal Law §10', url: 'https://www.nysenate.gov/legislation/laws/GMU/10' },
  'gml-39': { label: 'General Municipal Law §39', url: 'https://www.nysenate.gov/legislation/laws/GMU/39' },
  'osc-guide': { label: 'Office of the State Comptroller, Local Government Management Guide: Investing and Protecting Public Funds', url: 'https://www.osc.ny.gov/files/local-government/publications/pdf/investing-and-protecting-public-funds.pdf' },
}

// ── Riverhead, year by year ──────────────────────────────────────────────────

export type PolicyYear = {
  year: number
  resolution: string
  date: string
  doc: string
  mover: string
  seconder: string
  /** What changed from the year before, read by comparing the texts word by word. */
  change: string
  evidence?: Quote[]
}

export const RIVERHEAD_YEARS: PolicyYear[] = [
  {
    year: 2023, resolution: '2023-33', date: 'January 4, 2023', doc: 'minutes-2023-01-04',
    mover: 'Tim Hubbard', seconder: 'Frank Beyrodt Jr.',
    change: 'The starting point here.',
    evidence: [{ doc: 'minutes-2023-01-04', text: '2023-33 Adopts 2023 Investment Policy RESULT: ADOPTED [UNANIMOUS]' }],
  },
  {
    year: 2024, resolution: '2024-48', date: 'January 3, 2024', doc: 'minutes-2024-01-03',
    mover: 'Joann Waski', seconder: 'Kenneth Rothwell',
    change: 'None. The policy is word for word the 2023 text.',
    evidence: [{ doc: 'minutes-2024-01-03', text: '2024-48 Adopts 2024 Investment Policy RESULT: ADOPTED [UNANIMOUS]' }],
  },
  {
    year: 2025, resolution: '2025-81', date: 'January 7, 2025', doc: 'minutes-2025-01-07',
    mover: 'Kenneth Rothwell', seconder: 'Robert Kern',
    change: 'One word: the Financial Administrator’s “his deputy” became “her deputy”. One typing error was fixed (“it rights” to “its rights”).',
    evidence: [
      { doc: 'minutes-2025-01-07', text: '2025-81 Adopts 2025 Investment Policy RESULT: ADOPTED [UNANIMOUS]' },
      { doc: 'minutes-2024-01-03', text: 'authorizes the Financial Administrator or his deputy' },
      { doc: 'minutes-2025-01-07', text: 'authorizes the Financial Administrator or her deputy' },
    ],
  },
  {
    year: 2026, resolution: '2026-53', date: 'January 6, 2026', doc: 'riverhead-2026',
    mover: 'Kenneth Rothwell', seconder: 'Robert Kern',
    change: 'None in the wording. The text was retyped, and a leftover note at the end (“Underline represents addition(s)”, with nothing underlined) was dropped.',
    evidence: [
      { doc: 'riverhead-2026', text: 'MOVER: Councilman Kenneth Rothwell SECONDER: Councilman Robert Kern AYES: Jerry Halpin, Kenneth Rothwell, Robert Kern, Denise Merrifield, Joann Waski NAYS: None' },
      { doc: 'minutes-2025-01-07', text: 'Underline represents addition(s)' },
    ],
  },
]

/** The twelve depositories, unchanged in all four years. */
export const RIVERHEAD_DEPOSITORIES = 'Dime, Capital One, Citibank, Chase, Bank United, First National Bank of Long Island, TD Bank, Flushing Bank, Webster, Hanover, M&T Bank, NYCLASS'

// ── What the money is ────────────────────────────────────────────────────────

/** From the 2025 audit, note 3.A. */
export const CASH_2025 = {
  bookBalance: 137_127_782,
  fiduciary: 29_461_178,
  bankBalance: 110_424_442,
  fdic: 2_182_196,
  collateral: 108_242_246,
  nyclass: 24_631_579,
  quotes: [
    { doc: 'riverhead-audit-2025', text: 'At December 31, 2025, the Town’s cash book balance was $137,127,782. This amount is inclusive of fiduciary fund deposits of $29,461,178' },
    { doc: 'riverhead-audit-2025', text: 'The available bank balance was $110,424,442, exclusive of CLASS deposits. Of the available bank balance, $2,182,196 was covered by Federal deposit insurance and $108,242,246 was covered by collateral' },
    { doc: 'riverhead-audit-2025', text: 'The Town’s $24,631,579 CLASS investment consists of U.S. Treasury Obligations and repurchase agreements' },
  ] as Quote[],
}

// ── The five towns side by side ──────────────────────────────────────────────

export const TOWNS = ['Riverhead', 'Brookhaven', 'Southampton', 'Southold', 'Smithtown'] as const
export type Town = typeof TOWNS[number]

export type Row = { topic: string; cells: Record<Town, string>; quotes: Quote[] }

export const COMPARISON: Row[] = [
  {
    topic: 'Latest adoption',
    cells: {
      Riverhead: 'Resolution 2026-53, January 6, 2026, unanimous. Readopted each January.',
      Brookhaven: 'Resolution 2026-31, January 5, 2026, unanimous. Readopted each January.',
      Southampton: 'Resolution 2015-431, April 14, 2015. The 2026 Adopted Budget still prints that text.',
      Southold: 'Readopted January 2, 2026 (2026-53). The text is dated January 2, 2024 (RES-2024-33).',
      Smithtown: 'Resolution 2026-7, January 6, 2026, unanimous. Readopted each January.',
    },
    quotes: [
      { doc: 'brookhaven-2026', text: 'Adoption of Town of Brookhaven Investment Policy for 2026' },
      { doc: 'southampton-2015-431', text: 'RES-2015-431' },
      { doc: 'southampton-budget-2026', text: 'Adopt Town of Southampton Investment Policy – Amended April 14, 2015: Resolution 2015-431' },
      { doc: 'southold-2026', text: 'hereby readopts the Investment Policy for the Town of Southold dated January 2, 2024' },
      { doc: 'southold-2024', text: 'amends and adopts the Investment Policy for the Town of Southold dated January 2, 2024' },
      { doc: 'southold-2025', text: 'hereby readopts the Investment Policy for the Town of Southold dated January 2, 2024' },
      { doc: 'smithtown-minutes-2026', text: '3686 - 2026 Investment Policy 2026-7' },
    ],
  },
  {
    topic: 'Is the policy text published?',
    cells: {
      Riverhead: 'Yes, attached to the resolution in each January agenda packet.',
      Brookhaven: 'No. The resolution adopts “the attached investment policy”, but the packet does not include it. A July 2024 bond document summarizes it.',
      Southampton: 'Yes, in the annual budget’s Financial Policies.',
      Southold: 'No. This site did not find the January 2, 2024 text online.',
      Smithtown: 'Yes, attached to the resolution each January.',
    },
    quotes: [
      { doc: 'brookhaven-2026', text: 'that the attached investment policy for the Town of Brookhaven be adopted' },
      { doc: 'southampton-2015-431', text: 'The policy shall be included in the Annual Operating Budget with other applicable financial policies.' },
    ],
  },
  {
    topic: 'Banks named',
    cells: {
      Riverhead: `Twelve, the same in all four years: ${RIVERHEAD_DEPOSITORIES}.`,
      Brookhaven: 'Five for the Supervisor’s accounts (Capital One, JP Morgan Chase, TD Bank, Hanover Bank, JP Morgan Wealth Management), “as well as any and all commercial banks” in the State.',
      Southampton: 'None by name: “commercial banks that are authorized by the Town Board”.',
      Southold: 'Seven banks, ten accounts, in a separate resolution each January.',
      Smithtown: 'Seven, including NYCLASS. The 2026 list replaced First National Bank of Long Island with Connect One Bank.',
    },
    quotes: [
      { doc: 'riverhead-2026', text: 'Dime, Capital One, Citibank, Chase, Bank United, First National Bank of Long Island, TD Bank, Flushing Bank, Webster, Hanover, M&T Bank, NYCLASS' },
      { doc: 'brookhaven-2026', text: 'as well as any and all commercial banks authorized to conduct banking business in New York State' },
      { doc: 'southampton-2015-431', text: 'shall be made only with those commercial banks that are authorized by the Town Board' },
      { doc: 'smithtown-2026', text: '2. Connect One Bank' },
      { doc: 'smithtown-2025', text: 'First National Bank of Long Island' },
    ],
  },
  {
    topic: 'A dollar amount for each bank',
    cells: {
      Riverhead: 'None. The policy lists bank names only.',
      Brookhaven: 'Deferred to the policy: “the maximum amount of such deposits shall be pursuant to the Town’s adopted investment policy”, which is not posted.',
      Southampton: 'None in the policy. This site did not find the Board’s designation of banks.',
      Southold: 'Yes. Each account carries a collateral requirement, from $5,000,000 (Bank of America) to $70,000,000 (Capital One).',
      Smithtown: 'Yes. Appendix B limits each institution, from $30,000,000 to $200,000,000 (JP Morgan Chase).',
    },
    quotes: [
      { doc: 'brookhaven-2026', text: 'that the maximum amount of such deposits shall be pursuant to the Town’s adopted investment policy' },
      { doc: 'southold-2026', text: 'the following securities are hereby required as collateral for such cash balances in said banks' },
      { doc: 'southold-2026', text: 'Bank of America $5,000,000' },
      { doc: 'southold-2026', text: 'Capital One Bank $70,000,000' },
      { doc: 'smithtown-2026', text: 'the limits to amounts which can be invested with each financial institution are as follows' },
      { doc: 'smithtown-2026', text: 'a. JP Morgan Chase Bank $200,000,000' },
      { doc: 'smithtown-2026', text: 'g. Hanover Bank $30,000,000' },
    ],
  },
  {
    topic: 'Collateral for deposits above FDIC insurance',
    cells: {
      Riverhead: 'Securities worth 102% of deposits, or a letter of credit or surety bond.',
      Brookhaven: 'The 2024 summary does not give a percentage.',
      Southampton: 'Not less than 102%, held by a third party in the Town’s name.',
      Southold: 'The dollar amounts above; the policy text is not posted.',
      Smithtown: 'At least 105%, or a Federal Home Loan Bank letter of credit.',
    },
    quotes: [
      { doc: 'riverhead-2026', text: 'equal to the 102% of the aggregate amount of deposits from the categories designated Appendix A to this policy' },
      { doc: 'southampton-2015-431', text: 'The value of any such collateral shall not be less than 102% of the obligations it secures.' },
      { doc: 'smithtown-2026', text: 'equal to at least 105 percent of the aggregate amount of deposits' },
    ],
  },
  {
    topic: 'Which securities count as collateral',
    cells: {
      Riverhead: 'Appendix A lists eleven kinds with a blank line before each for the Board to mark. None is marked, in any of the four years.',
      Brookhaven: 'Obligations of the United States and its agencies, and of New York State and its municipalities and school districts.',
      Southampton: 'FDIC insurance, New York State and its local governments’ obligations, federally guaranteed agency obligations, and a Federal Home Loan Bank letter of credit.',
      Southold: 'Not known; the policy text is not posted.',
      Smithtown: 'Four kinds, listed in its Appendix A: U.S. obligations, four development banks’, partly guaranteed U.S. agency obligations, and New York State and its local governments’.',
    },
    quotes: [
      { doc: 'brookhaven-os-2024', text: 'Obligations that may be pledged as collateral are obligations of the United States and its agencies and obligations of New York State and its municipalities and school districts.' },
      { doc: 'southampton-2015-431', text: 'All Town funds held in banks are to be secured by one or more of the following:' },
    ],
  },
  {
    topic: 'Reports on deposits and collateral',
    cells: {
      Riverhead: 'None. The resolution speaks of “reporting”, but the policy has no reporting section.',
      Brookhaven: 'Not stated in the 2024 summary.',
      Southampton: 'Monthly: each bank confirms the collateral in writing, and the Comptroller’s Office prepares a collateral report.',
      Southold: 'Not known; the policy text is not posted.',
      Smithtown: 'None stated.',
    },
    quotes: [
      { doc: 'riverhead-2026', text: 'regarding the deposit, investing, monitoring, and reporting of funds of the local government' },
      { doc: 'southampton-2015-431', text: 'Each month the bank shall supply the Town with written confirmation of the collateral pledged.' },
      { doc: 'southampton-2015-431', text: 'A monthly collateral report is to be prepared by the Comptroller\'s Office, which shall monitor these requirements.' },
    ],
  },
  {
    topic: 'Annual review',
    cells: {
      Riverhead: 'The policy has no review section. The resolution readopts it and says nothing about a review.',
      Brookhaven: 'The resolution records the result: the Commissioner of Finance “determined that no revisions are required for fiscal year 2026”.',
      Southampton: 'The Town Comptroller reviews it each year, and the Board “shall consider amendments”.',
      Southold: 'Readopted each January.',
      Smithtown: 'Section XIII: “The Town shall review this Policy annually”.',
    },
    quotes: [
      { doc: 'brookhaven-2026', text: 'the Commissioner of Finance has reviewed the Town of Brookhaven Investment Policy and determined that no revisions are required for fiscal year 2026' },
      { doc: 'southampton-2015-431', text: 'The Investment Policy shall be reviewed annually by the Town Comptroller, and if recommendations are advisable, the Town Board shall consider amendments.' },
      { doc: 'smithtown-2026', text: 'The Town shall review this Policy annually and it shall have the power to amend it at any time it deems appropriate.' },
    ],
  },
]

// ── Possible improvements ────────────────────────────────────────────────────

export type Improvement = { title: string; body: string; quotes: Quote[] }

export const IMPROVEMENTS: Improvement[] = [
  {
    title: 'Set a dollar limit for each bank',
    body: 'State law says the resolution designating the Town’s banks “shall specify the maximum amount which may be kept on deposit at any time in each such bank or trust company.” The State Comptroller’s model policy has a column for it. Riverhead’s policy names twelve banks and no amounts, and this site found no other resolution that sets them, in the 55 sets of Board minutes it holds from 2022 to 2026 or in the January 2026 agenda packet. Smithtown lists a limit for every institution, and Southold a dollar figure for every account. If the Town sets limits somewhere else, the policy could say where.',
    quotes: [
      { doc: 'gml-10', text: 'Such resolution shall specify the maximum amount which may be kept on deposit at any time in each such bank or trust company.' },
      { doc: 'osc-guide', text: 'The banks and trust companies that are authorized for the deposit of moneys, and the maximum amount which may be kept on deposit at any time, are:' },
    ],
  },
  {
    title: 'Choose the collateral the Town accepts',
    body: 'Section VIII asks banks to pledge securities “from the categories designated Appendix A”, but Appendix A has a blank line before each of its eleven kinds and none has been marked in four years. The model says boards “must determine which types of eligible securities, authorized by law, to list as permitted.” Smithtown lists four. Marking the list, or replacing it with the kinds the Town actually accepts, would make Section VIII mean what it says.',
    quotes: [
      { doc: 'riverhead-2026', text: 'from the categories designated Appendix A to this policy' },
      { doc: 'osc-guide', text: 'must determine which types of eligible securities, authorized by law, to list as permitted.' },
    ],
  },
  {
    title: 'Bring the bank list up to date',
    body: 'The 2026 list, prepared in December 2025, still names First National Bank of Long Island, which ConnectOne Bancorp took over on June 1, 2025. Smithtown’s 2026 policy and Southold’s 2026 designations name Connect One instead. The list also puts NYCLASS, a cooperative investment pool, among the “banks and trust companies”. The audit treats it as an investment pool, and the policy’s own Section XII covers such pools, so it may belong there.',
    quotes: [
      { doc: 'riverhead-2026', text: 'The banks and trust companies authorized for the deposit of Town funds' },
      { doc: 'southold-2026', text: 'Connect One Bank $15,000,000' },
      { doc: 'riverhead-audit-2025', text: 'The Town participates in the Cooperative Liquid Assets Securities System - New York (“CLASS”), a multi-municipal cooperative investment pool' },
      { doc: 'riverhead-2026', text: 'By participating in a cooperative investment program with another authorized governmental entity pursuant to Article 5G of the General Municipal Law' },
    ],
  },
  {
    title: 'Add reports to the Board',
    body: 'State law describes an investment policy as instructions “regarding the investing, monitoring and reporting of funds”, and the Comptroller’s guide lists “Reporting to management and the governing board” among the basics. Riverhead’s policy has no reporting section. A short one could have the Financial Administrator report each quarter: the balance at each bank against its limit, the collateral held, the NYCLASS balance and the interest earned. Southampton already requires a monthly collateral report.',
    quotes: [
      { doc: 'gml-39', text: 'regarding the investing, monitoring and reporting of funds of the local government' },
      { doc: 'osc-guide', text: 'Reporting to management and the governing board.' },
    ],
  },
  {
    title: 'Record the yearly review',
    body: 'The law says the policy “shall be annually reviewed”. Riverhead readopts the same text each January, and neither the resolution nor the policy says who reviewed it or what they found. Brookhaven’s resolution records that its Commissioner of Finance reviewed the policy and found no revisions needed. Smithtown’s policy has the model’s annual review section. Either would show residents the review happened.',
    quotes: [
      { doc: 'gml-39', text: 'The investment policy shall be annually reviewed by the local government.' },
      { doc: 'osc-guide', text: 'shall review this investment policy annually, and it shall have the power to amend this policy at any time' },
    ],
  },
  {
    title: 'Fix the wording errors',
    body: 'Several errors have been readopted every year since at least 2023. They change nothing in practice but are worth correcting in a document the Board adopts by resolution.',
    quotes: [
      { doc: 'riverhead-2026', text: 'AUTHORIZED FINANACIAL INSTITUTES AND DEALERS' },
      { doc: 'riverhead-2026', text: 'By utilizing an ongoing investment program with an authorized tracking partner' },
      { doc: 'riverhead-2026', text: 'by such bank in trust company only in accordance with prior written authorization' },
      { doc: 'riverhead-2026', text: 'The agreement shall provide from the frequency of revaluation' },
      { doc: 'riverhead-2026', text: '(xi) Zero obligations of the United States government related as "Treasury strips".' },
      { doc: 'gml-10', text: 'Zero-coupon obligations of the United States government marketed as "Treasury STRIPS"' },
      { doc: 'osc-guide', text: '1. Directly, from an authorized trading partner' },
    ],
  },
]

/** The specific errors and their corrections, shown as a list on the page. */
export const WORDING_FIXES: [string, string][] = [
  ['AUTHORIZED FINANACIAL INSTITUTES AND DEALERS (heading of Section XI)', 'Authorized financial institutions and dealers, as in the model'],
  ['“an authorized tracking partner” (Section XII)', '“an authorized trading partner”, as in the model'],
  ['“by such bank in trust company” (Section XII)', '“by such bank or trust company”'],
  ['“shall provide from the frequency of revaluation” (Section IX)', '“shall provide for the frequency of revaluation”'],
  ['“Zero obligations of the United States government related as "Treasury strips"” (Appendix A)', 'The statute’s words: “Zero-coupon obligations of the United States government marketed as "Treasury STRIPS"”'],
]
