// The General Fund as the Town's independent auditors report it.
//
// Every reserve figure on this site measures unassigned fund balance, and the
// two sources for it disagree. The Annual Financial Report (AFR) the Town files
// with the State Comptroller each spring is not audited, and it counts less of
// the balance as "assigned" than the audit does, so its "unassigned" figure runs
// higher: by $576,661 for 2024 and $841,571 for 2025. The audit is the one that
// states the balance under GAAP, so the site uses it wherever one exists and the
// AFR only for a year that has none yet.
//
// Figures are hand-read from the statements, with the page each is on, and
// scripts/verify-audits.mjs checks every one against the text of that page. The
// 2023 and 2024 audits are on the Town's Financial Reports page, so their text is
// already in web/public/data/financial-reports/documents. The 2025 audit is not
// on that page yet: the Town Board accepted it on September 1, 2026 (Resolution
// 2026-834) and it is attached to that meeting's agenda packet, so the text of
// the pages cited is kept in etl/data/audits/2025-audited-financial-statements.json.

export const FUND_BALANCE_CLASSES = ['Nonspendable', 'Restricted', 'Committed', 'Assigned', 'Unassigned'] as const
export type FundBalanceClass = (typeof FUND_BALANCE_CLASSES)[number]

export type AuditSource = {
  title: string
  url: string
  /** Where the fund-balance table is: the PDF page for a posted audit, the packet page for 2025. */
  page: number
  /** For the 2025 audit, the statements' own printed page number. */
  printedPage?: number
}

export type AuditedGeneralFund = {
  year: number
  source: AuditSource
  classes: Record<FundBalanceClass, number>
  total: number
  /** What the Assigned tier is set aside for. */
  assigned: { subsequentYearsBudget: number; purchasesOnOrder: number; miscellaneousDesignations: number }
  /**
   * Year-end deficits in two funds reported inside the General Fund: the
   * Recreation Program Fund (A06) and the Police Athletic League (A04). `plan`
   * is the audit's sentence on when they will be gone, word for word.
   */
  deficits: { recreationProgram: number; pal: number; page: number; plan: string }
}

const deficitPlan = (year: number) =>
  `The deficits in these funds are expected to be eliminated in ${year} by reducing the expenditures and increasing the program revenues.`

const PACKET_2025 = 'https://riverheadny.api.civicclerk.com/v1/Meetings/GetMeetingFileStream(fileId=12303,plainText=false)'

export const AUDITED_GENERAL_FUND: Record<number, AuditedGeneralFund> = {
  2023: {
    year: 2023,
    source: {
      title: '2023 Audited Basic Financial Statement (PDF)',
      url: 'https://www.townofriverheadny.gov/DocumentCenter/View/251/2023-Audited-Basic-Financial-Statement-PDF',
      page: 57,
    },
    classes: { Nonspendable: 1_367_917, Restricted: 0, Committed: 0, Assigned: 3_396_309, Unassigned: 21_848_178 },
    total: 26_612_404,
    assigned: { subsequentYearsBudget: 2_000_000, purchasesOnOrder: 507_680, miscellaneousDesignations: 888_629 },
    deficits: { recreationProgram: 518_446, pal: 45_134, page: 58, plan: deficitPlan(2024) },
  },
  2024: {
    year: 2024,
    source: {
      title: '2024 Audited Basic Financial Statements (PDF)',
      url: 'https://www.townofriverheadny.gov/DocumentCenter/View/2858/2024-Audited-Basic-Financial-Statements-PDF',
      page: 58,
    },
    classes: { Nonspendable: 1_716_192, Restricted: 1_433, Committed: 22_005, Assigned: 2_776_342, Unassigned: 23_887_952 },
    total: 28_403_924,
    assigned: { subsequentYearsBudget: 1_750_000, purchasesOnOrder: 533_010, miscellaneousDesignations: 493_332 },
    deficits: { recreationProgram: 588_868, pal: 60_468, page: 58, plan: deficitPlan(2025) },
  },
  2025: {
    year: 2025,
    source: {
      title: '2025 audited financial statements, Sept. 1, 2026 agenda packet',
      url: PACKET_2025,
      page: 148,
      printedPage: 55,
    },
    classes: { Nonspendable: 2_012_534, Restricted: 17_924, Committed: 42_435, Assigned: 2_400_645, Unassigned: 28_829_513 },
    total: 33_303_051,
    assigned: { subsequentYearsBudget: 1_250_000, purchasesOnOrder: 596_960, miscellaneousDesignations: 553_685 },
    deficits: { recreationProgram: 692_688, pal: 73_185, page: 149, plan: deficitPlan(2026) },
  },
}

/**
 * The General Fund's operating statement for a year, from the audit's Statement
 * of Revenues, Expenditures and Changes in Fund Balances. Revenues and
 * expenditures exclude transfers, which are listed separately, so revenues less
 * expenditures plus transfers in less transfers out is the year's change in
 * fund balance.
 */
export type AuditedOperations = {
  /** The page it is on, counted the same way as AuditSource.page. */
  page: number
  revenues: number
  realPropertyTaxes: number
  expenditures: number
  employeeBenefits: number
  transfersIn: number
  transfersOut: number
  netChange: number
  beginning: number
  ending: number
}

export const AUDITED_OPERATIONS: Record<number, AuditedOperations> = {
  2024: {
    page: 32,
    revenues: 62_750_736,
    realPropertyTaxes: 44_524_150,
    expenditures: 57_036_285,
    employeeBenefits: 16_384_924,
    transfersIn: 1_643_843,
    transfersOut: 5_566_774,
    netChange: 1_791_520,
    beginning: 26_612_404,
    ending: 28_403_924,
  },
  2025: {
    page: 122,
    revenues: 67_435_893,
    realPropertyTaxes: 48_639_479,
    expenditures: 60_226_114,
    employeeBenefits: 18_829_792,
    transfersIn: 1_563_424,
    transfersOut: 3_874_076,
    netChange: 4_899_127,
    beginning: 28_403_924,
    ending: 33_303_051,
  },
}

/** The rest of what the 2025 audit reports that the site uses, with the packet page of each. */
export const AUDIT_2025 = {
  year: 2025,
  auditor: 'PKF O’Connor Davies, LLP',
  accepted: { resolution: '2026-834', date: 'September 1, 2026', vote: 'unanimous' },
  source: { title: '2025 audited financial statements, Sept. 1, 2026 agenda packet', url: PACKET_2025, pages: 'packet pp. 91–188' },
  /** The General Fund's operating statement (packet p. 122, statements p. 29). */
  generalFund: AUDITED_OPERATIONS[2025],
  /** Packet p. 149 (statements p. 56), word for word. */
  deficitPlan: deficitPlan(2026),
  /** The community benefit share of the $553,685 of miscellaneous designations (packet p. 149). */
  communityBenefitDesignation: 342_821,
  /**
   * What "the majority" of the $553,685 of miscellaneous designations is for,
   * as the audit lists it (packet p. 149). The four do not add to the total,
   * and the audit does not say what the rest is.
   */
  designations: [
    { purpose: 'a Teen Center', amount: 25_136 },
    { purpose: 'the Senior Day Care Center', amount: 48_129 },
    { purpose: 'improvement and maintenance of Stotzky Park', amount: 68_574 },
    { purpose: 'community benefit funds', amount: 342_821 },
  ],
  /** Retiree health (OPEB), measured December 31, 2025 (packet pp. 167–168, statements pp. 74–75). */
  opeb: { page: 167, total: 142_758_111, governmental: 129_479_191, businessType: 13_278_920, netChange: 10_340_924, discountRatePct: 4.43 },
  /**
   * Debt against the constitutional limit, from Note 3.E (packet p. 157,
   * statements p. 64). The limit itself in dollars, and the debt by type, are
   * in the MD&A (packet p. 114). Only governmental bonds and the BANs count;
   * water and sewer debt is excluded by statute.
   */
  debtLimit: {
    page: 157,
    subjectToLimit: 34_473_350,
    pct: 5.48,
    aggregate: 60_398_858,
    authorizedUnissued: 57_449_917,
    limitPage: 114,
    limit: 629_295_721,
    governmentalBonds: 12_498_350,
    waterBonds: 15_071_650,
    efcBonds: 10_853_858,
    bans: 21_975_000,
  },
} as const

export const AUDITED_YEARS = Object.keys(AUDITED_GENERAL_FUND).map(Number).sort((a, b) => a - b)

/**
 * The Recreation Program and PAL deficits, audit by audit, with the year each
 * audit said they would be gone. Every audit so far has said "next year".
 */
export const deficitHistory = AUDITED_YEARS.map((year) => {
  const d = AUDITED_GENERAL_FUND[year].deficits
  return { year, recreationProgram: d.recreationProgram, pal: d.pal, expectedGoneBy: Number(d.plan.match(/eliminated in (\d{4})/)![1]), source: AUDITED_GENERAL_FUND[year].source, page: d.page }
})
export const latestAudit: AuditedGeneralFund = AUDITED_GENERAL_FUND[AUDITED_YEARS[AUDITED_YEARS.length - 1]]

/** Change from one audited year to the next, in dollars and percent. */
export function auditedGrowth(year: number, key: 'revenues' | 'expenditures' | 'realPropertyTaxes' | 'employeeBenefits') {
  const now = AUDITED_OPERATIONS[year]?.[key]
  const before = AUDITED_OPERATIONS[year - 1]?.[key]
  if (now == null || before == null) return null
  return { now, before, change: now - before, pct: ((now - before) / before) * 100 }
}

/**
 * The same year-end as the Town's unaudited Annual Financial Report filed it,
 * set beside the audit's, tier by tier. `afr` is keyed by tier name and must
 * carry a Total. Returns null for a year that has no audit.
 */
export function auditVsReport(year: number, afr: Record<string, number>) {
  const audit = AUDITED_GENERAL_FUND[year]
  if (!audit) return null
  const rows = [...FUND_BALANCE_CLASSES, 'Total' as const].map((name) => {
    const audited = name === 'Total' ? audit.total : audit.classes[name]
    const reported = Math.round(afr[name] ?? 0)
    return { name, reported, audited, difference: audited - reported }
  })
  return { year, audit, rows }
}
