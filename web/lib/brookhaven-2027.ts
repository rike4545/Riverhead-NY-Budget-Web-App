// The Town of Brookhaven's 2027 Tentative Operating Budget: the figures and
// sentences /brookhaven-2027/ sets beside Riverhead's 2027 Tentative.
//
// The copy this site has (etl/data/brookhaven/2027/brookhaven2027-compressed.pdf,
// added by the site's owner; the Town posts its budgets on its Finance page) is
// a scan with no text layer. Every figure and quotation here was read from the
// page image. etl/ocr_scanned_pdf.py read every page with OCR into
// etl/data/brookhaven/2027/ocr-pages.json. scripts/verify-brookhaven.mjs checks:
// - each table's rows against its printed totals;
// - the two tables against each other;
// - each quotation against the OCR text.
//
// Pages are the PDF's own page numbers. The budget message is numbered i–iv in
// print, PDF pp. 2–5.
//
// No imports, so the verify script loads this file directly.

export const BROOKHAVEN_SOURCE = {
  title: 'Town of Brookhaven, 2027 Tentative Operating Budget',
  dated: 'September 30, 2026',
  signedBy: 'Daniel J. Panico, Supervisor',
  pages: 350,
  sha256: '803710dbe4ef3b0481c647bb40c73a54803f106eeeeb9fd645becdd9d4a49f03',
  /** The copy in this repository. */
  file: 'etl/data/brookhaven/2027/brookhaven2027-compressed.pdf',
  repoUrl: 'https://github.com/rike4545/Riverhead-NY-Budget-Web-App/blob/main/etl/data/brookhaven/2027/brookhaven2027-compressed.pdf',
  /** Where the Town posts its budgets. */
  townPage: 'https://www.brookhavenny.gov/156/Finance',
} as const

/** Sentences from the budget message, as printed, with the PDF page each is on. */
export const BROOKHAVEN_QUOTES = {
  balanced: { page: 2, text: 'The 2027 Tentative Operating Budget is structurally balanced across all six major tax districts without using fund balance to support operations.' },
  levyCap: { page: 2, text: 'It remains well below the New York State Property Tax Levy Cap, with a 1.70% adjustment after accounting for the new LIPA PILOT agreement reflected in 2026 property taxes.' },
  ratings: { page: 2, text: 'In 2026, both Moody’s Ratings and S&P Global Ratings reaffirmed the Town at AAA/Aaa—the highest credit ratings available—with stable outlooks.' },
  stress: { page: 2, text: 'The New York State Comptroller has also reported a 0.0 Fiscal Stress Score for Brookhaven, the best possible score and another independent measure of the Town’s strong financial condition.' },
  refuseFee: { page: 3, text: 'These expenses are identified through a dollar-for-dollar user fee so residents can see what these services cost and track those costs from year to year.' },
  refuseAmount: { page: 3, text: 'For a typical single-family home, the 2027 Garbage and Refuse User Fee is limited to a 1.5% adjustment, bringing the total to $395.52.' },
  taxShare: { page: 4, text: 'In 2026, the Town’s share represented approximately 7.51% of the total local property tax bill for properties outside incorporated villages and approximately 4.0% within village areas, based upon the 2025–2026 Property Tax Warrant certified by the Suffolk County Legislature.' },
  caps: { page: 4, text: 'Maintains compliance with the Town’s local tax-rate and debt-management caps' },
  ambulance: { page: 4, text: 'Reduces property taxes across the Town’s nine Ambulance Districts by 2.05%' },
} as const

/** The figures the quotations state, for the page's arithmetic. */
export const BROOKHAVEN_STATED = { levyAdjustmentPct: 1.7, refuseFee: 395.52, refuseAdjustmentPct: 1.5, ambulanceCutPct: 2.05, taxSharePct: 7.51 } as const

/** Salaries of Elected Officials (PDF p. 11). */
export const BROOKHAVEN_SALARIES = {
  page: 11,
  supervisor: 181_800,
  councilMember: 106_050,
  councilSeats: 6,
  taxReceiver: 136_065,
  townClerk: 136_581,
  highwaySuperintendent: 173_353,
  total: 1_264_099,
} as const

type LevyRow = { name: string; appropriations: number; revenues: number; surplus: number; taxes: number }

/**
 * Summary of 2027 Property Tax Levy (PDF p. 16). Its "Other Special
 * Districts & Airport" line comes to the special districts, the refuse
 * district and the street-lighting district together, though street lighting
 * is also a major district above it, so the page's grand total counts street
 * lighting twice; scripts/verify-brookhaven.mjs checks that reading.
 */
export const BROOKHAVEN_LEVY = {
  page: 16,
  fullTown: [
    { name: 'General Fund - Full Town (A)', appropriations: 106_115_937, revenues: 75_202_389, surplus: 0, taxes: 30_913_548 },
    { name: 'Parks & Recreation', appropriations: 43_929_400, revenues: 11_416_032, surplus: 0, taxes: 32_513_368 },
    { name: 'Animal Shelter / Ecology Center', appropriations: 4_597_607, revenues: 107_500, surplus: 0, taxes: 4_490_107 },
    { name: 'Highway Fund - Full Town (DA)', appropriations: 6_589_685, revenues: 511_530, surplus: 0, taxes: 6_078_155 },
  ] as LevyRow[],
  fullTownTotal: { appropriations: 161_232_629, revenues: 87_237_451, surplus: 0, taxes: 73_995_178 },
  outsideVillages: [
    { name: 'General Fund - Part Town (B)', appropriations: 39_230_930, revenues: 26_013_156, surplus: 0, taxes: 13_217_774 },
    { name: 'Highway Fund - Part Town (DB)', appropriations: 76_201_038, revenues: 5_138_912, surplus: 0, taxes: 71_062_126 },
    { name: 'Streetlighting (SL)', appropriations: 6_161_635, revenues: 516_494, surplus: 0, taxes: 5_645_141 },
  ] as LevyRow[],
  outsideVillagesTotal: { appropriations: 121_593_603, revenues: 31_668_562, surplus: 0, taxes: 89_925_041 },
  majorTotal: { appropriations: 282_826_232, revenues: 118_906_013, surplus: 0, taxes: 163_920_219 },
  special: [
    { name: 'Open Space - Full Town', appropriations: 11_883_228, revenues: 417_250, surplus: 0, taxes: 11_465_978 },
    { name: 'Other Special Districts & Airport', appropriations: 87_220_941, revenues: 60_982_408, surplus: 150_000, taxes: 26_088_533 },
  ] as LevyRow[],
  specialTotal: { appropriations: 99_104_169, revenues: 61_399_658, surplus: 150_000, taxes: 37_554_511 },
  allTotal: { appropriations: 381_930_401, revenues: 180_305_671, surplus: 150_000, taxes: 201_474_730 },
} as const

export type FundBalanceRow = { code: string; name: string; group: string; start: number; expenditures: number; revenues: number; appropriated: number; end: number }

/**
 * 2027 Estimated Fund Balances (PDF pp. 17–18): each fund's estimated
 * unappropriated, unreserved fund balance at the end of 2026, its 2027
 * spending and revenues, the fund balance it appropriates, and the estimate
 * for the end of 2027. Page 18 still carries the 2025 and 2026 headings of
 * the year before; its rows and totals continue page 17's. The balance
 * columns are rounded to the dollar and add to their printed totals within a
 * dollar or two.
 */
const row = (group: string, code: string, name: string, start: number, expenditures: number, revenues: number, appropriated: number, end: number): FundBalanceRow =>
  ({ code, name, group, start, expenditures, revenues, appropriated, end })

export const BROOKHAVEN_FUND_BALANCES = {
  pages: [17, 18],
  major: [
    row('Major funds', 'A', 'General Town Wide', 61_558_409, 154_642_944, 154_642_944, 0, 61_558_409),
    row('Major funds', 'B', 'General Outside Villages', 23_340_467, 39_230_930, 39_230_930, 0, 23_340_467),
    row('Major funds', 'DA', 'Highway Town Wide', 3_740_398, 6_589_685, 6_589_685, 0, 3_740_398),
    row('Major funds', 'DB', 'Highway Outside Villages', 21_779_363, 76_201_038, 76_201_038, 0, 21_779_363),
    row('Major funds', 'SL', 'Town Lighting Districts', 4_829_039, 6_161_635, 6_161_635, 0, 4_829_039),
    row('Major funds', 'SR', 'Refuse & Recycling District', 8_343_971, 50_115_866, 50_115_866, 0, 8_343_971),
    row('Major funds', 'VO', 'Open Space Preservation', 584_504, 11_883_228, 11_883_228, 0, 584_504),
  ],
  majorTotal: { start: 124_176_151, expenditures: 344_825_326, revenues: 344_825_326, appropriated: 0, end: 124_176_151 },
  special: [
    row('Ambulance districts', 'SABP', 'Blue Point/E Patchogue Amb Dist', 28_980, 691_385, 691_385, 0, 28_980),
    row('Ambulance districts', 'SAEM', 'East Moriches/Eastport Amb', 748_999, 1_550_614, 1_550_614, 0, 748_999),
    row('Ambulance districts', 'SAMA', 'Mastic Ambulance Dist', 357_555, 3_406_780, 3_406_780, 0, 357_555),
    row('Ambulance districts', 'SAMB', 'Mastic Beach Ambulance Dist', 526_663, 3_045_072, 3_045_072, 0, 526_663),
    row('Ambulance districts', 'SAMD', 'Medford Ambulance Dist', 409_405, 2_448_567, 2_448_567, 0, 409_405),
    row('Ambulance districts', 'SAMN', 'Manorville Ambulance Dist', 409_453, 2_110_582, 2_110_582, 0, 409_453),
    row('Ambulance districts', 'SASC', 'South Country Ambulance Dist', 363_331, 4_602_582, 4_602_582, 0, 363_331),
    row('Ambulance districts', 'SASH', 'Shirley Ambulance Dist', 414_994, 1_290_631, 1_290_631, 0, 414_994),
    row('Ambulance districts', 'SATH', 'TriHarbor Ambulance Dist', 389_685, 2_870_677, 2_870_677, 0, 389_685),
    row('Dock districts', 'SDCG', 'Cherry Grove Dock District', 666_109, 324_213, 324_213, 0, 666_109),
    row('Dock districts', 'SDFI', 'Fire Island Pines Dock District', 301_306, 235_079, 235_079, 0, 301_306),
    row('Erosion control districts', 'SEDP', 'Davis Park Erosion Control District', 930_820, 85_356, 85_356, 0, 930_820),
    row('Erosion control districts', 'SEFI', 'Fire Island Pines Erosion District', 233_880, 103_034, 103_034, 0, 233_880),
    row('Erosion control districts', 'SEOB', 'Ocean Bay Park Erosion District', 85_415, 85_356, 85_356, 0, 85_415),
    row('Erosion control districts', 'SEPW', 'Point O’Woods Erosion District', 266_908, 77_677, 77_677, 0, 266_908),
    row('Erosion control districts', 'SESV', 'Seaview Erosion District', 463_300, 27_677, 27_677, 0, 463_300),
    row('Erosion control districts', 'SEWI', 'Water Island Erosion District', 68_515, 57_596, 57_596, 0, 68_515),
    row('Fire protection districts', 'SFMR', 'Moriches Fire Protection District', 185_907, 645_153, 645_153, 0, 185_907),
    row('Fire protection districts', 'SFWI', 'Water Island Fire Prot. District', 98_389, 53_785, 53_785, 0, 98_389),
    row('Park districts', 'SPOB', 'Ocean Bay Park - Park District', 145_633, 6_425, 6_425, 0, 145_633),
    row('Park districts', 'SPSS', 'South Setauket Park District', 23_630, 51_757, 51_757, 0, 23_630),
    row('Garbage districts', 'J', 'Seaview/OBPK Joint Garbage District', 40_496, 483_509, 483_509, 0, 40_496),
    row('Garbage districts', 'SRCG', 'Cherry Grove Garbage District', 220_325, 787_608, 787_608, 0, 220_325),
    row('Garbage districts', 'SRDP', 'Davis Park Garbage District', 74_549, 537_323, 537_323, 0, 74_549),
    row('Garbage districts', 'SRFI', 'Fire Island Pines Garbage District', 174_835, 1_440_739, 1_440_739, 0, 174_835),
    row('Sewer districts', 'SSB2', 'Brookhaven Sewer District #2', 543_129, 1_333_451, 1_183_451, 150_000, 393_129),
    row('Sewer districts', 'SSBR', 'Brookhaven Sewer District #1', 465_904, 80_728, 80_728, 0, 465_904),
    row('Other districts', 'SMR', 'Munsell Road Improvement District', 49_151, 199_774, 199_774, 0, 49_151),
    row('Other districts', 'SWSB', 'Stony Brook Water District', 345_737, 941_895, 941_895, 0, 345_737),
    row('Other districts', 'CTA', 'Brookhaven Calabro Airport', 630_601, 1_368_415, 1_368_415, 0, 630_601),
  ],
  specialTotal: { start: 9_663_605, expenditures: 30_943_440, revenues: 30_793_440, appropriated: 150_000, end: 9_513_605 },
  grandTotal: { start: 133_839_757, expenditures: 375_768_766, revenues: 375_618_766, appropriated: 150_000, end: 133_689_757 },
} as const

/**
 * What the budget book holds besides its tables: the pages that open each
 * department with a mission statement, found in the OCR text, and the
 * Department of Public Safety's divisions, from the table of contents.
 */
export const BROOKHAVEN_BOOK = {
  missionStatementPages: [21, 27, 45, 55, 63, 98, 140, 146, 152, 167, 204, 226, 257, 263, 275, 293],
  /** The table of contents page that lists the Department of Public Safety's divisions. */
  publicSafetyContentsPage: 8,
  /** As the table of contents prints them. */
  publicSafetyDivisions: ['Public Safety Administration', 'Code Enforcement', 'Harbors & Waterways', 'Animal Shelter', 'Fire Marshals', 'Brookhaven Calabro Airport'],
  /**
   * Read from the page image only: the OCR text garbles these entries
   * (B 3620 comes out as "FIDE ARPS DONS"), so the verify script cannot
   * find them there.
   */
  publicSafetyFromImage: ['Fire Marshals'],
  /** The same, as the page words them. */
  publicSafetyPlain: ['public safety administration', 'code enforcement', 'harbors and waterways', 'the animal shelter', 'the fire marshals', 'the Brookhaven Calabro Airport'],
} as const

/**
 * The same funds in Brookhaven's 2026 Adopted Operating Budget (2026
 * Estimated Fund Balances, PDF p. 16), for the change from 2026. The page's
 * text is kept with the reserves comparison's excerpts
 * (etl/data/policies/fund-balance-policies.json, "brookhaven-2026-budget").
 */
export const BROOKHAVEN_2026_ADOPTED = {
  title: 'Town of Brookhaven, 2026 Adopted Operating Budget',
  url: 'https://www.brookhavenny.gov/DocumentCenter/View/38793/Town-of-Brookhaven-2026-Adopted-Operating-Budget---Web-Version',
  page: 16,
  excerpt: 'brookhaven-2026-budget',
  expenditures: { A: 154_611_894, B: 37_678_529, DA: 6_333_036, DB: 72_212_722, SL: 5_945_738, SR: 48_767_000, VO: 11_726_105 },
  majorTotal: 337_275_024,
} as const
