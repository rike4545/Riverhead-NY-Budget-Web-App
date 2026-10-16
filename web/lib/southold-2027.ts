// The Town of Southold's 2027 Tentative Operating Budget: the figures and
// sentences /southold-2027/ sets beside Riverhead's 2027 Tentative.
//
// The copy this site has (etl/data/southold/2027/southold-2027-tentative.pdf,
// downloaded from the Town's Document Center) is a scan with no text layer.
// Every figure and quotation here was read from the page image.
// etl/ocr_scanned_pdf.py read every page with OCR into
// etl/data/southold/2027/ocr-pages.json. scripts/verify-southold.mjs checks:
// - each table's rows against its printed totals, and each row's columns
//   against each other;
// - the tables against each other and against the fund pages;
// - each quotation against the OCR text of its page, and each line's figures
//   against the OCR text of theirs.
//
// Pages are the PDF's own page numbers. The fund pages also print their own
// ("Page 5 of 67"); this file does not use those.
//
// No imports, so the verify script loads this file directly.

export const SOUTHOLD_SOURCE = {
  title: 'Town of Southold, Tentative 2027 Operating Budget',
  /** The Town Clerk's certification (PDF p. 4): "as received on the 30th day of September, 2026". */
  received: 'September 30, 2026',
  certificationPage: 4,
  signedBy: 'Albert J. Krupski, Jr., Supervisor',
  pages: 82,
  sha256: '6a0bc3d215758ce59e900754be37b5d965fd794ed2160626186a8dccf810de54',
  /** The copy in this repository. */
  file: 'etl/data/southold/2027/southold-2027-tentative.pdf',
  repoUrl: 'https://github.com/rike4545/Riverhead-NY-Budget-Web-App/blob/main/etl/data/southold/2027/southold-2027-tentative.pdf',
  /** Where the Town posts it. */
  townUrl: 'https://www.southoldtownny.gov/DocumentCenter/View/13091/SupervisorsTentitive',
} as const

/** Sentences from the Supervisor's letter (PDF pp. 1–3, undated), as printed. */
export const SOUTHOLD_QUOTES = {
  strong: { page: 1, text: 'Overall, the Town’s fiscal position is strong, thanks to careful management of departmental growth and overall spending.' },
  benchmark: { page: 1, text: 'Nevertheless, it serves as a benchmark we strive to remain under, as a measure of sound budgeting and responsible management.' },
  cap: { page: 1, text: 'This budget reflects that philosophy and does not pierce the cap.' },
  arpa: { page: 1, text: 'Previous budgets relied on federal ARPA funds to support recurring expenses, such as police vehicles. These critical vehicles are now included in this budget.' },
  revenue: { page: 2, text: 'Forecasted sales tax revenue has not increased, and mortgage tax revenue has significantly decreased.' },
  costs: { page: 2, text: 'Revenues increased in 2026, but the cost of operations outpaced all expectations.' },
  lawsuits: { page: 2, text: 'Settlements of inherited lawsuits from the past administration has drained the contingency fund for 2026.' },
  staff: { page: 2, text: 'All 217 full-time employees and 49 part-time employees are partners in this budget, and I appreciate their hard work.' },
  resident: { page: 2, text: 'As a resident, I want services delivered for the least amount of money.' },
  size: { page: 2, text: 'If we expect families to live here in the future—working in this Town and building their lives here—we must control the size of government and its associated costs.' },
} as const

/** The figures the quotations state, for the page's arithmetic. */
export const SOUTHOLD_STATED = { fullTime: 217, partTime: 49 } as const

/** Schedule of Salaries of Elected Officials (PDF p. 9). The page prints no total. */
export const SOUTHOLD_SALARIES = {
  page: 9,
  supervisor: 132_092,
  boardMember: 45_257,
  boardSeats: 4,
  /** "Town Justice and Member of the Town Board, Fishers Island": the Board's sixth seat. */
  fishersIslandJusticeMember: 67_155,
  townJustice: 90_203,
  townClerk: 124_479,
  highwaySuperintendent: 129_186,
  taxReceiver: 48_568,
  assessor: 93_040,
  trustee: 26_759,
} as const

type SummaryRow = { code: string; name: string; appropriations: number; revenues: number; unexpended: number; tax: number }
const s = (code: string, name: string, appropriations: number, revenues: number, unexpended: number, tax: number): SummaryRow =>
  ({ code, name, appropriations, revenues, unexpended, tax })

/**
 * Summary of Town Budget, 2027 Tentative (PDF p. 5): "Appropriations and
 * Provisions for Other Uses", "Less: Estimated Revenues", "Less: Unexpended
 * Balance" and "Amount to be Raised by Tax". The fire districts are listed
 * with the Town's own funds, and their taxes are in its grand total.
 */
export const SOUTHOLD_SUMMARY = {
  page: 5,
  town: [
    s('A', 'General', 47_340_762, 7_043_607, 4_000_000, 36_297_155),
    s('B', 'General-Outside Village', 4_366_907, 2_728_298, 400_000, 1_238_609),
    s('DB', 'Highway Fund', 8_554_838, 1_522_625, 400_000, 6_632_213),
    s('CM', 'Community Preservation Fund', 39_321_985, 12_899_806, 26_422_179, 0),
    s('CM2', 'Community Housing Fund', 6_763_446, 2_620_000, 4_143_446, 0),
    s('CS', 'Risk Retention Fund', 928_250, 928_250, 0, 0),
  ],
  townTotal: { appropriations: 107_276_188, revenues: 27_742_586, unexpended: 35_365_625, tax: 44_167_977 },
  special: [
    s('SF', 'East-West Fire Protection District', 997_941, 9_000, 0, 988_941),
    s('SM', 'Fishers Island Ferry District', 8_365_639, 6_828_317, 0, 1_537_322),
    s('SR', 'Solid Waste Management District', 5_674_231, 3_376_092, 250_000, 2_048_139),
    s('SS2', 'Fishers Island Sewer District', 66_100, 66_100, 0, 0),
    s('', 'F.I. Waste Management District', 1_398_197, 82_000, 0, 1_316_197),
    s('', 'Orient Mosquito District', 107_000, 0, 0, 107_000),
  ],
  specialTotal: { appropriations: 16_609_108, revenues: 10_361_509, unexpended: 250_000, tax: 5_997_599 },
  parks: [
    s('', 'Orient-East Marion Park District', 93_600, 0, 0, 93_600),
    s('', 'Southold Park District', 400_801, 25_000, 0, 375_801),
    s('', 'Cutchogue-New Suffolk Park Dist.', 427_160, 0, 37_200, 389_960),
    s('', 'Mattituck Park District', 824_400, 155_600, 0, 668_800),
  ],
  parksTotal: { appropriations: 1_745_961, revenues: 180_600, unexpended: 37_200, tax: 1_528_161 },
  fire: [
    s('', 'Fishers Island Fire District', 1_443_669, 0, 0, 1_443_669),
    s('', 'Orient Fire District', 1_475_550, 95_000, 0, 1_380_550),
    s('', 'East Marion Fire District', 908_901, 131_700, 0, 777_201),
    s('', 'Southold Fire District', 2_333_755, 80_000, 0, 2_253_755),
    s('', 'Cutchogue Fire District', 3_219_994, 77_000, 22_200, 3_120_794),
    s('', 'Mattituck Fire District', 3_209_771, 22_800, 0, 3_186_971),
  ],
  fireTotal: { appropriations: 12_591_640, revenues: 406_500, unexpended: 22_200, tax: 12_162_940 },
  grandTotal: { appropriations: 138_222_897, revenues: 38_691_195, unexpended: 35_675_025, tax: 63_856_677 },
} as const

type Change = { y2026: number; y2027: number; change: number; pct: number }
const c = (y2026: number, y2027: number, change: number, pct: number): Change => ({ y2026, y2027, change, pct })

/**
 * 2027 Tax Statistics (PDF pp. 6–7): the four funds the Town levies for, 2026
 * Adopted against 2027 Tentative, with the change and the percentage change as
 * printed. Rates are per $1,000 of assessed value. The General Fund's levy
 * includes its pro-rata receivables, which its rate leaves out.
 */
export const SOUTHOLD_TAX_STATISTICS = {
  pages: [6, 7],
  assessedValue: {
    wholeTown: c(113_669_817, 114_340_646, 670_829, 0.59),
    wholeTownProRataReceivables: c(81_269, 72_661, -8_608, -10.59),
    partTown: c(108_541_506, 109_202_303, 660_797, 0.61),
    solidWaste: c(108_072_692, 108_505_595, 432_903, 0.4),
  },
  appropriations: {
    A: c(46_172_172, 47_340_762, 1_168_590, 2.53),
    B: c(4_190_696, 4_366_907, 176_211, 4.2),
    DB: c(8_500_338, 8_554_838, 54_500, 0.64),
    SR: c(5_282_901, 5_674_231, 391_330, 7.41),
    total: c(64_146_107, 65_936_738, 1_790_631, 2.79),
  },
  rates: {
    A: c(309.089, 316.812, 7.723, 2.5),
    B: c(9.656, 11.342, 1.686, 17.46),
    DB: c(61.928, 60.733, -1.195, -1.93),
    SR: c(17.973, 18.876, 0.903, 5.02),
    total: c(398.646, 407.763, 9.117, 2.29),
  },
  levy: {
    A: c(35_215_396, 36_297_155, 1_081_759, 3.07),
    B: c(1_048_108, 1_238_609, 190_501, 18.18),
    DB: c(6_721_713, 6_632_213, -89_500, -1.33),
    SR: c(1_942_401, 2_048_139, 105_738, 5.44),
    total: c(44_927_618, 46_216_116, 1_288_498, 2.87),
  },
  revenues: {
    A: c(6_956_776, 7_043_607, 86_831, 1.25),
    B: c(2_742_588, 2_728_298, -14_290, -0.52),
    DB: c(1_378_625, 1_522_625, 144_000, 10.45),
    SR: c(3_090_500, 3_376_092, 285_592, 9.24),
    total: c(14_168_489, 14_670_622, 502_133, 3.54),
  },
  fundBalance: {
    A: c(4_000_000, 4_000_000, 0, 0),
    B: c(400_000, 400_000, 0, 0),
    DB: c(400_000, 400_000, 0, 0),
    SR: c(250_000, 250_000, 0, 0),
    total: c(5_050_000, 5_050_000, 0, 0),
  },
} as const

export type FundBalanceRow = { code: string; name: string; end2024: number; increase2025: number; end2025: number; change2026: number; remaining: number }
const f = (code: string, name: string, end2024: number, increase2025: number, end2025: number, change2026: number, remaining: number): FundBalanceRow =>
  ({ code, name, end2024, increase2025, end2025, change2026, remaining })

/**
 * Projected Estimated Fund Balances 12.31.26 (PDF p. 8), "Date Prepared:
 * September 30, 2026": each fund's balance at the end of 2024, its "FY2025
 * Projected Increase", the balance at the end of 2025, its "Projected Change
 * in FB 2026" and the "Remaining Estimated Unappropriated". The totals add to
 * the rows within a dollar.
 */
export const SOUTHOLD_FUND_BALANCES = {
  page: 8,
  prepared: 'September 30, 2026',
  rows: [
    f('A', 'General Fund Whole Town', 27_098_404, 1_081_941, 28_180_345, -4_000_000, 24_180_345),
    f('B', 'General Fund Part Town', 3_004_915, 32_927, 3_037_842, -400_000, 2_637_842),
    f('DB', 'Highway Fund Part Town', 3_659_939, 237_739, 3_897_678, -1_055_000, 2_842_678),
    f('SR', 'Solid Waste District', 2_358_344, 288_484, 2_646_828, -250_000, 2_396_828),
    f('CM', 'CPF FUND', 37_006_306, 10_309_524, 47_315_830, -20_893_651, 26_422_179),
    f('CM2', 'CHF FUND', 3_995_482, 2_909_637, 6_905_119, -2_761_673, 4_143_446),
  ],
  totals: { end2024: 77_123_390, increase2025: 14_860_253, end2025: 91_983_643, change2026: -29_360_324, remaining: 62_623_319 },
} as const

type Line = { page: number; account: string; name: string; actual2025: number; budget2026: number; revised2026: number; tentative2027: number }
const l = (page: number, account: string, name: string, actual2025: number, budget2026: number, revised2026: number, tentative2027: number): Line =>
  ({ page, account, name, actual2025, budget2026, revised2026, tentative2027 })

/**
 * Lines from the General Fund Whole Town's pages (PDF pp. 10–31), each with
 * its 2025 Actual, 2026 Orig Bud, 2026 Revised Bud and 2027 Tentative columns.
 * Names are as the fund pages print them, which cut some short.
 */
export const SOUTHOLD_LINES = {
  police: l(14, 'A3120', 'POLICE', 10_169_888.34, 10_620_728, 11_049_540.96, 11_028_744),
  communications: l(14, 'A3020', 'PUBLIC SAFETY COMMUNICATIONS', 1_183_875.96, 1_395_586, 1_396_061, 1_437_650),
  policeFireRetirement: l(23, 'A9015', 'FIRE & POLICE RETIREMENT', 2_545_918.8, 3_390_000, 3_390_000, 3_600_000),
  propertyTax: l(27, '410010', 'REAL PROPERTY T', 34_054_088, 35_215_396, 35_215_396, 36_297_155),
  salesTax: l(27, '411200', 'SALES TAX', 1_759_073, 1_759_073, 1_759_073, 1_759_073),
  interest: l(28, '424010', 'INTEREST AND EA', 1_369_071.68, 850_000, 850_000, 925_000),
  mortgageTax: l(30, '430050', 'MORTGAGE Tax', 1_920_134.05, 1_500_000, 1_500_000, 1_500_000),
  /** "TOTAL A GENERAL FUND WHOLE T", the fund's spending. */
  spending: l(26, 'A', 'TOTAL A GENERAL FUND WHOLE TOWN', 41_935_322.41, 46_172_172, 46_573_100.59, 47_340_762),
  /** The same total on the revenue pages, savings included. */
  revenues: l(31, 'A', 'TOTAL A GENERAL FUND WHOLE TOWN', 43_017_263.88, 46_172_172, 46_442_438.1, 47_340_762),
  appropriatedFundBalance: l(31, '459900', 'APPROPRIATED FUND BALANCE', 0, 4_000_000, 4_000_000, 4_000_000),
} as const

/** The Solid Waste Management District's revenue page (PDF p. 71): its 2027 property tax, and the charges beside it. */
export const SOUTHOLD_SOLID_WASTE = { page: 71, propertyTax2027: 2_048_139 } as const

type CapitalFund = { name: string; appropriations: number[]; debt: number[]; parkPlayground: number[]; total: number[] }

/**
 * Three Year Capital Improvement Plan, For Fiscal Years Ending 2027 through
 * 2029, Supervisor's Tentative (PDF p. 81, detailed; p. 82, summary): the
 * proposed projects by fund and how each year is paid for, from the year's
 * appropriations, from debt, or from park and playground money.
 */
export const SOUTHOLD_CAPITAL = {
  pages: [81, 82],
  years: [2027, 2028, 2029],
  funds: [
    { name: 'General Fund Whole Town', appropriations: [409_700, 0, 0], debt: [325_000, 450_000, 250_000], parkPlayground: [82_000, 0, 0], total: [816_700, 450_000, 250_000] },
    { name: 'Highway Fund', appropriations: [1_000_000, 1_147_000, 1_148_000], debt: [1_030_000, 785_000, 290_000], parkPlayground: [0, 0, 0], total: [2_030_000, 1_932_000, 1_438_000] },
    { name: 'Solid Waste District', appropriations: [160_000, 50_000, 0], debt: [0, 380_000, 500_000], parkPlayground: [0, 0, 0], total: [160_000, 430_000, 500_000] },
  ] as CapitalFund[],
  financing: { appropriations: [1_569_700, 1_197_000, 1_148_000], debt: [1_355_000, 1_615_000, 1_040_000], parkPlayground: [82_000, 0, 0] },
  grandTotal: [3_006_700, 2_812_000, 2_188_000],
} as const

/** The news report that brought the budget to residents. Its figures match the budget's own; the page cites it only for the cap history. */
export const SOUTHOLD_NEWS = {
  outlet: 'The Suffolk Times',
  title: 'Southold’s proposed budget stays below tax cap, raises levy by $1.3M',
  author: 'Nick Mongiovi',
  date: 'October 2, 2026',
  url: 'https://suffolktimes.timesreview.com/2026/10/southolds-proposed-budget-stays-below-tax-cap-raises-levy-by-1-3m/',
  /** What it reports of the cap before 2027, in the page's words. */
  capHistory: { y2026: 'stayed within the state tax cap', y2025: { levyPct: 7.48, pierced: true } },
} as const
