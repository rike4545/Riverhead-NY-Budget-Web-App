// The six amendments to the 2027 Preliminary Budget on the Town Board's
// October 20, 2026 agenda, as the Town printed them, for /budget-amendments-2027/.
//
// They come from the pre-final draft of that agenda, which the Town published in
// the agenda packet for its October 15, 2026 work session (CivicClerk event
// 6501). Each resolution lists the accounts it changes in two columns, FROM and
// TO, and each has a fiscal impact statement dated October 9, 2026. The text of
// the pages is kept in etl/data/budget-2027/amendments-packet-2026-10-15.json,
// and scripts/verify-budget-amendments.mjs checks every account, amount and
// quotation here against it.
//
// This module has no JSON imports, so the check can load it under Node's type
// stripping. The figures each line changes, and the totals, are worked out in
// budget-amendments-effect.ts.

export const PACKET = {
  title: 'Town Board Work Session agenda packet, October 15, 2026',
  url: 'https://riverheadny.portal.civicclerk.com/event/6501/files/agenda/12482',
  fileUrl: 'https://riverheadny.api.civicclerk.com/v1/Meetings/GetMeetingFileStream(fileId=12482,plainText=false)',
  excerpt: 'etl/data/budget-2027/amendments-packet-2026-10-15.json',
  /** The packet's own page numbers for the October 20 agenda that lists the six. */
  agendaPages: [556, 557],
  /** Every page of the resolutions carries this mark. */
  status: 'Pre-Final Draft',
  /** Section J of each fiscal impact statement. */
  statementsDated: 'October 9, 2026',
  meeting: { slug: '2026-10-20', date: 'October 20, 2026', label: 'Town Board regular meeting, October 20, 2026, 6:00 PM' },
} as const

/** The news report that brought the amendments to residents. */
export const ARTICLE = {
  title: 'Rothwell offers budget amendments trimming 2027 proposed tax levy increase to 1.73%',
  outlet: 'RiverheadLOCAL',
  published: 'October 15, 2026',
  url: 'https://riverheadlocal.com/2026/10/15/rothwell-offers-budget-amendments-trimming-2027-proposed-tax-levy-increase-to-1-73/',
  /** As the article puts them; the page quotes these and labels them as reported. */
  reported: {
    lede: 'Council Member Ken Rothwell has proposed six amendments to Supervisor Jerry Halpin’s tentative 2027 budget that would reduce the proposed townwide property tax levy increase from 2.79% to about 1.73%.',
    developed: 'he developed the amendments with the town’s financial administrator and the other council members',
    support: 'He said all the other council members support them.',
    noResponse: 'Halpin did not respond to a request for comment as of presstime.',
    earnings: 'He said the town earned $4.8 million in investment returns on its fund balance.',
    earningsMillions: 4.8,
    belongs: 'That money belongs to the taxpayers',
    services: 'we did not decrease or remove any services',
    ongoing: 'we never want to use fund balance for ongoing costs',
    advisers: 'Rothwell said he asked his personal financial advisers to review the publicly available tentative budget, then brought their findings to the town’s financial administrator. He said she was comfortable with the amendments and the revenue assumptions supporting them.',
    lastYear: 'However, we did not need to have the tax increase that we did last year',
    financing: 'Paying for the equipment later from fund balance would change how the purchases are financed rather than eliminate their cost.',
  },
} as const

/**
 * A staff appointment by the Town Board, from this site's meeting record, to
 * show that the Board, not the Supervisor alone, appoints the Town's staff.
 */
export const STAFF_APPOINTMENT = { number: '2026-891', title: 'Appoints an Accountant', meeting: '2026-10-06', date: 'October 6, 2026' } as const

/** The 2027 Budget Supplement's year-to-date column, as its header prints it: "2026 YTD as of 6/30/26". */
export const SUPPLEMENT_YTD_THROUGH = 'June 30, 2026'

export type Side = 'from' | 'to'
export type AmendmentLine = { account: string; name: string; amount: number; side: Side }
export type Amendment = {
  /** As the Town numbers them. RiverheadLOCAL describes them in another order. */
  n: number
  /** Item number on the October 20 agenda. */
  item: string
  /** Packet pages: the resolution, then its fiscal impact statement. */
  page: number
  statementPages: number[]
  /** Each WHEREAS clause, as printed, without "WHEREAS," and the joining "and" or "Now, therefore be it". */
  whereas: string[]
  lines: AmendmentLine[]
  /** A plain-English heading for the page. */
  short: string
}

export const AMENDMENTS: Amendment[] = [
  {
    n: 1,
    item: 'VII.6',
    page: 585,
    statementPages: [586],
    short: 'Take three equipment purchases out of the General Fund budget',
    whereas: [
      'upon review of the 2027 Tentative Budget, the Town Board wishes to make additional reductions to the property tax levy for 2027',
      'several one-time expenditures were identified in the budget which can be removed from the budget and instead funded with General Fund balance via the submission of separate Town Board resolutions in 2027',
    ],
    lines: [
      { account: 'A01-1-1625-240-000-00000', name: 'B&G Equipment', amount: 53_300, side: 'from' },
      { account: 'A01-3-3410-240-000-00000', name: 'Fire Marshal Equipment', amount: 50_000, side: 'from' },
      { account: 'A01-8-8160-280-000-00000', name: 'Refuse Vehicles', amount: 55_000, side: 'from' },
      { account: 'A01-1001-001-00000-A', name: 'Property Taxes', amount: 158_300, side: 'to' },
    ],
  },
  {
    n: 2,
    item: 'VII.7',
    page: 587,
    statementPages: [588],
    short: 'A merit increase in the Highway Department’s office, paid for by the General Fund levy',
    whereas: [
      'the Highway Superintendent requested an adjustment to the 2027 Preliminary Budget for an additional merit increase for an administrative employee in the General Fund',
    ],
    lines: [
      { account: 'A01-1001-001-00000-A', name: 'Property Taxes', amount: 1_949, side: 'from' },
      { account: 'A01-5-5010-101-NON-00000', name: 'Highway Admin Personal Services', amount: 1_603, side: 'to' },
      { account: 'A01-9-9010-801-NON-00000', name: 'NYS Retirement', amount: 223, side: 'to' },
      { account: 'A01-9-9030-805-NON-00000', name: 'FICA', amount: 123, side: 'to' },
    ],
  },
  {
    n: 3,
    item: 'VII.8',
    page: 589,
    statementPages: [590],
    short: 'Raise three General Fund revenue estimates',
    whereas: [
      'upon review of the 2027 Tentative Budget, the Town Board wishes to make additional reductions to the property tax levy and appropriated fund balance for 2027',
    ],
    lines: [
      { account: 'A01-1560-170-00000-3', name: 'Building Inspection Fees', amount: 165_941, side: 'from' },
      { account: 'A01-2401-000-00000-G', name: 'Interest and Earnings', amount: 250_000, side: 'from' },
      { account: 'A01-2610-000-00000-1', name: 'Fines and Forfeited Bail', amount: 50_000, side: 'from' },
      { account: 'A01-1001-001-00000-A', name: 'Property Taxes', amount: 395_941, side: 'to' },
      { account: 'A01-9999-000-00000-0', name: 'Appropriated Fund Balance', amount: 70_000, side: 'to' },
    ],
  },
  {
    n: 4,
    item: 'VII.9',
    page: 591,
    statementPages: [592],
    short: 'A promotion and a merit increase in the Highway Fund, paid for from its snow budget',
    whereas: [
      'the Highway Superintendent requested an adjustment to the 2027 Preliminary Budget for an additional promotion for one employee and an additional merit increase for one employee in the Highway Fund',
    ],
    lines: [
      { account: 'DA1-5-5142-400-000-00000', name: 'Snow Contractual', amount: 5_392, side: 'from' },
      { account: 'DA1-5-5110-101-NON-00000', name: 'Highway Personal Services', amount: 3_923, side: 'to' },
      { account: 'DA1-5-5110-112-NON-00000', name: 'Highway Longevity', amount: 282, side: 'to' },
      { account: 'DA1-9-9010-801-NON-00000', name: 'NYS Retirement', amount: 866, side: 'to' },
      { account: 'DA1-9-9030-805-NON-00000', name: 'FICA', amount: 321, side: 'to' },
    ],
  },
  {
    n: 5,
    item: 'VII.10',
    page: 593,
    statementPages: [594],
    short: 'Take street lighting equipment out and raise the district’s interest estimate',
    whereas: [
      'upon review of the 2027 Tentative Budget, the Town Board wishes to make additional reductions to the property tax levy for 2027',
      'one-time expenditures for Street Lighting equipment can be removed from the budget and instead funded with Street Lighting fund balance via the submission of separate Town Board resolutions in 2027',
    ],
    lines: [
      { account: 'SL1-5-5182-240-000-00000', name: 'Street Lighting Equipment', amount: 42_937, side: 'from' },
      { account: 'SL1-2401-000-00000-G', name: 'Interest and Earnings', amount: 48_629, side: 'from' },
      { account: 'SL1-1001-001-00000-A', name: 'Property Taxes', amount: 91_566, side: 'to' },
    ],
  },
  {
    n: 6,
    item: 'VII.11',
    page: 595,
    statementPages: [597, 598],
    short: 'Money for a possible change in CSEA dental plans',
    whereas: [
      'the Town Board wishes to provide funding for a possible change in dental insurance plans for the CSEA in the 2027 Preliminary Budget',
    ],
    lines: [
      { account: 'A01-1560-170-00000-3', name: 'Building Inspection Fees', amount: 74_059, side: 'from' },
      { account: 'A01-9-9060-810-NON-00000', name: 'Health Insurance', amount: 62_402, side: 'to' },
      { account: 'A01-9-9065-810-NON-00000', name: 'Health Insurance', amount: 11_657, side: 'to' },
      { account: 'DA1-5-5130-240-000-00000', name: 'Highway Equipment', amount: 25_371, side: 'from' },
      { account: 'DA1-9-9060-810-NON-00000', name: 'Health Insurance', amount: 25_371, side: 'to' },
      { account: 'ES1-2401-000-00000-G', name: 'Interest and Earnings', amount: 4_800, side: 'from' },
      { account: 'ES1-9-9060-810-NON-00000', name: 'Health Insurance', amount: 4_800, side: 'to' },
      { account: 'ES3-2401-000-00000-G', name: 'Interest and Earnings', amount: 1_371, side: 'from' },
      { account: 'ES3-9-9060-810-NON-00000', name: 'Health Insurance', amount: 1_371, side: 'to' },
      { account: 'ES5-2401-000-00000-G', name: 'Interest and Earnings', amount: 2_057, side: 'from' },
      { account: 'ES5-9-9060-810-NON-00000', name: 'Health Insurance', amount: 2_057, side: 'to' },
      { account: 'EW1-2401-000-00000-G', name: 'Interest and Earnings', amount: 10_971, side: 'from' },
      { account: 'EW1-9-9060-810-NON-00000', name: 'Health Insurance', amount: 10_971, side: 'to' },
      { account: 'SL1-2401-000-00000-G', name: 'Interest and Earnings', amount: 1_371, side: 'from' },
      { account: 'SL1-9-9060-810-NON-00000', name: 'Health Insurance', amount: 1_371, side: 'to' },
    ],
  },
]

// ── Reading an account ───────────────────────────────────────────────────────
//
// An expenditure account is FUND-category-function-object-…, with a one-digit
// category ("A01-1-1625-240-…"); a revenue account is FUND-code-…, with a
// four-digit revenue code ("A01-1001-001-…").

export const fundOf = (account: string) => account.split('-')[0]
export const isRevenue = (account: string) => /^\d{4}$/.test(account.split('-')[1] ?? '')
/** The revenue code: 1001 is property taxes, 9999 appropriated fund balance. */
export const revenueCode = (account: string) => (isRevenue(account) ? account.split('-')[1] : null)
export const PROPERTY_TAXES = '1001'
export const APPROPRIATED_FUND_BALANCE = '9999'

/**
 * What a line does to its account's 2027 figure. FROM is where the money comes
 * from: a smaller appropriation, or a larger revenue estimate. TO is where it
 * goes: a larger appropriation, or a smaller revenue (less property tax, or less
 * fund balance used). Each resolution's WHEREAS clauses say which way it moves.
 */
export function change(line: AmendmentLine): number {
  const sign = isRevenue(line.account) === (line.side === 'from') ? 1 : -1
  return sign * line.amount
}

export type FundEffect = {
  fund: string
  /** Change in appropriations: the fund's spending. */
  appropriations: number
  /** Change in the property tax levy. */
  levy: number
  /** Change in the appropriated fund balance: savings counted as income. */
  fundBalance: number
  /** Change in every other revenue estimate. */
  otherRevenue: number
}

/** Each fund's changes across the given amendments, in the order the funds first appear. */
export function fundEffects(amendments: Amendment[]): FundEffect[] {
  const out = new Map<string, FundEffect>()
  for (const a of amendments) {
    for (const l of a.lines) {
      const fund = fundOf(l.account)
      const e = out.get(fund) ?? { fund, appropriations: 0, levy: 0, fundBalance: 0, otherRevenue: 0 }
      const c = change(l)
      const code = revenueCode(l.account)
      if (code === null) e.appropriations += c
      else if (code === PROPERTY_TAXES) e.levy += c
      else if (code === APPROPRIATED_FUND_BALANCE) e.fundBalance += c
      else e.otherRevenue += c
      out.set(fund, e)
    }
  }
  return Array.from(out.values())
}

/** A fund balances when its revenue changes equal its spending changes. Every resolution should leave each fund balanced. */
export const unbalanced = (e: FundEffect) => e.levy + e.fundBalance + e.otherRevenue - e.appropriations

/**
 * The purchases a resolution takes out of the budget to buy later "via the
 * submission of separate Town Board resolutions in 2027", paid from fund
 * balance: the expenditure lines of the amendments whose WHEREAS clauses say so.
 */
export function deferredToFundBalance(amendments: Amendment[]): { n: number; line: AmendmentLine }[] {
  return amendments
    .filter((a) => a.whereas.some((w) => /fund balance via the submission of separate Town Board resolutions in 2027/i.test(w)))
    .flatMap((a) => a.lines.filter((l) => !isRevenue(l.account) && l.side === 'from').map((line) => ({ n: a.n, line })))
}

/**
 * The Tentative's tax rate scaled by the change in its levy. The rates are per
 * $1,000 of assessed value; the amendments change no assessment, so a fund's
 * rate moves with its levy. This is the site's estimate, not the Town's: the
 * Town sets the rates on the exact assessed values when it adopts the budget.
 */
export const scaledRate = (rate: number, levyBefore: number, levyAfter: number) => (rate * levyAfter) / levyBefore
