// What the Board has already spent out of fund balance — and what that leaves
// for the 2027 choices.
//
// WHY THIS EXISTS. /predict-2027/ offers the Board's options and prices several
// of them against the surplus above the Town's policy floor — the unassigned
// balance above 15% of the budget, which Resolution 918 of 2011 says may be used
// to cut the next year's taxes, for one-time capital or for storms. That figure
// is the audited position at DECEMBER 31, 2025. It is not what is available
// now. Every resolution adopted during 2026 that draws on fund balance has
// already spent part of it, and a suggested action cannot be funded twice.
//
// This library nets the documented 2026 draws against the audited opening
// position so the options page states a CEILING on what remains rather than an
// opening balance, and counts the draws that are adopted but carry no published
// amount so the reader knows which direction the real number moves.
//
// WHAT THIS IS NOT. It is not a running fund-balance ledger. The Town has filed
// no report covering 2026, so the true closing position is unknown and will stay
// unknown until one exists. Everything here is "the audited opening position,
// less what the record shows was committed" — an upper bound, and labeled as one
// everywhere it appears.
//
// FUND MATTERS. The surplus in question is GENERAL FUND unassigned balance. A
// Water District capital adjustment draws on the Water District's own balance and
// does not touch it. Only draws attributed to the General Fund are netted off;
// the rest are reported separately rather than silently summed.

import fiscalIndex from '../public/data/meetings/fiscal-index.json'
import { surplusAboveFloor } from './reserve-policy'
import { AUDIT_2025 } from './audits'
import { fundBalanceImpact } from './town-square'
import prediction from '../public/data/budget-2027-prediction.json'
import type { ResolutionFunding } from './account-lookup'
import { drawsByFund } from './fund-balance-lines'

type FiscalRes = {
  number: string
  title: string
  category: string
  amount: number | null
  realistic: { flag: string; verdict: string; reason: string }
  vote: { adopted: boolean | null }
  /** Section G, where the preparer filled it in. Added with the sub-account join. */
  funding?: ResolutionFunding | null
  /** Set by the ETL when section G names less than the resolution's own budget table. */
  statementBelowTable?: { statement: number; table: number } | null
}
type FiscalMeeting = { slug: string; meetingDate: string; resolutions: FiscalRes[] }

// Load every fiscal companion the index names. Done with require so the set can
// grow with new meetings without editing this file.
const meetings: FiscalMeeting[] = (fiscalIndex.meetings as string[]).map(
  (slug) => require(`../public/data/meetings/${slug}-fiscal.json`) as FiscalMeeting,
)

export const corpus = {
  meetings: meetings.length,
  earliest: [...(fiscalIndex.meetings as string[])].sort()[0],
  latest: [...(fiscalIndex.meetings as string[])].sort().slice(-1)[0],
  resolutions: meetings.reduce((n, m) => n + m.resolutions.length, 0),
}

const allRes = meetings.flatMap((m) => m.resolutions.map((r) => ({ ...r, meetingDate: m.meetingDate })))
const isAdopted = (r: { vote: { adopted: boolean | null } }) => r.vote?.adopted === true

// THE ETL's "reserve-draw" FLAG CONFLATES TWO DIFFERENT THINGS, and only one of
// them touches fund balance. etl/parse_fiscal_impact.py assigns the flag from the
// resolution's CATEGORY and the Yes/No box alone — it never reads an amount — and
// it applies the same flag to capital/debt items and to personnel, contract, fees
// and labor-contract items. For that second group its own verdict text reads
// "Real, recurring cost", which is right: a salary appointment is recurring
// operating cost funded by the LEVY, not a draw against accumulated surplus. The
// flag contradicts the verdict.
//
// Across the corpus that is not a rounding issue: of the adopted resolutions
// carrying the flag, roughly a third are capital or debt and the rest are
// recurring cost. Counting all of them as fund-balance draws overstates the draw
// on surplus about threefold, so this file splits them and only the capital/debt
// side is allowed anywhere near the headroom arithmetic.
const FUND_BALANCE_CATEGORIES = new Set(['capital', 'debt'])

// The ETL now settles most of this itself. Where a statement charges only
// appropriation accounts and names no 9999, a personnel or contract item is
// flagged "recurring" rather than "reserve-draw" — because a highway operator's
// salary line is levy-funded payroll, not a reach for accumulated surplus. What
// still arrives as "reserve-draw" on a non-capital category is an item whose
// statement named no accounts at all, so the category split below is still
// needed as the fallback for those.
const flagged = allRes.filter((r) => r.realistic?.flag === 'reserve-draw')
const reserveDraws = flagged.filter((r) => FUND_BALANCE_CATEGORIES.has(r.category))
const recurringCosts = allRes.filter(
  (r) =>
    r.realistic?.flag === 'recurring' ||
    (r.realistic?.flag === 'reserve-draw' && !FUND_BALANCE_CATEGORIES.has(r.category)),
)
const adoptedDraws = reserveDraws.filter(isAdopted)
const adoptedRecurring = recurringCosts.filter(isAdopted)

// Fund attribution for the UNPRICED draws is inferred from the resolution title,
// which is the only signal the packet gives. It is good enough to say "most of
// these are General Fund" and not good enough to put a dollar figure behind, so
// it is used for counts only.
const OTHER_FUND_WORDS: [string, string][] = [
  ['water', 'Water District'], ['sewer', 'Sewer'], ['highway', 'Highway'],
  ['street lighting', 'Street Lighting'], ['scavenger', 'Scavenger Waste'],
  ['refuse', 'Refuse and Garbage'], ['ambulance', 'Ambulance District'],
]
const inferredFund = (title: string) =>
  OTHER_FUND_WORDS.find(([k]) => title.toLowerCase().includes(k))?.[1] ?? null

export const drawCounts = {
  flagged: reserveDraws.length,
  adopted: adoptedDraws.length,
  priced: adoptedDraws.filter((r) => r.amount !== null).length,
  unpriced: adoptedDraws.filter((r) => r.amount === null).length,
  adoptedLikelyGeneralFund: adoptedDraws.filter((r) => inferredFund(r.title) === null).length,
  adoptedOtherFunds: adoptedDraws.filter((r) => inferredFund(r.title) !== null).length,
  note:
    'A resolution is counted here when it is a CAPITAL or DEBT item the Town answered "Yes" on its own Fiscal Impact Statement, and the record shows it was adopted. Fund attribution for the unpriced ones is inferred from the resolution title — the only signal the agenda packet offers — so it is used to characterise the mix, never to produce a dollar figure.',
}

/**
 * The other half of the ETL's flag: adopted resolutions that commit RECURRING
 * operating money — salaries, contracts, fee changes. These are a real budget
 * pressure and they belong on this site, but they are funded by the levy and do
 * not reduce accumulated surplus, so they are reported separately and never
 * netted against headroom.
 */
export const recurringCostCounts = {
  adopted: adoptedRecurring.length,
  byCategory: Object.fromEntries(
    Array.from(new Set(adoptedRecurring.map((r) => r.category)))
      .map((c) => [c, adoptedRecurring.filter((r) => r.category === c).length])
      .sort((a, b) => (b[1] as number) - (a[1] as number)),
  ) as Record<string, number>,
  note:
    'Levy-funded operating commitments, not draws on surplus, so they are counted apart from the fund-balance arithmetic. Most now carry their own "recurring" flag from the ETL, decided by the accounts: a statement that charges an appropriation line and names no Appropriated Fund Balance account is payroll or contract money the levy carries. The remainder still arrive flagged "reserve-draw" because their statements named no accounts at all, and are separated here by category as before.',
}

export type Commitment = {
  label: string
  amount: number
  /**
   * documented — the Town wrote the figure against its own 9999 Appropriated
   *              Fund Balance account, on the statement or in the budget
   *              table the Board adopted.
   * authorized — read from the resolution, which stated the amount in prose.
   * ceiling    — the resolution states no amount and this is the most it could
   *              have been. Always an over-statement of what was actually drawn.
   */
  certainty: 'documented' | 'authorized' | 'ceiling'
  fund: 'General Fund'
  /** The resolution, for a documented draw. */
  number?: string | null
  source: string
  note: string
  /** Set when this entry replaced a curated one. */
  supersedes?: { label: string; was: number; by: number }
  /**
   * Set when section G names less than the resolution's own budget table.
   * `counted` says which figure the amount is: the adopted table, once checked
   * against the packet (ADOPTED_TABLE below), or section G until then.
   */
  tableGap?: { statement: number; table: number; counted: 'table' | 'statement'; line?: string }
  /** What the resolution says about repaying the draw, quoted. */
  repayment?: string
}

// ── Documented draws, from the Town's own Appropriated Fund Balance account ──
//
// Every adopted resolution whose section G charges A01-9999 is a General Fund
// draw the Town wrote down itself. These take precedence over anything read
// from prose, because they carry a figure the Town booked rather than one this
// site inferred or bounded. The amount is section G's, except where the budget
// table the Board adopted moves more (ADOPTED_TABLE).
type DrawRow = { number: string | null; title: string; amount: number; tableGap?: Commitment['tableGap'] }

const usd0 = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })

/**
 * Where the Board adopted a larger draw than section G records.
 *
 * Section G is the preparer's summary of the funding; the budget table in the
 * RESOLVED clause is what the Board voted. They nearly always agree, and in
 * this corpus one adopted draw does not. Resolution 2026-765's section G
 * charges A01-9999 $150,000, while the resolution establishes "the following
 * budget adjustments", moving "A01-9999-000-00000-0 Appropriated Fund Balance
 * $280,000" into the Town Attorney's legal-fees line. The vote is the
 * appropriation, so the ledger counts $280,000 and says what section G shows.
 *
 * Declared by number after reading the packet, like SUPERSEDES below, and
 * applied only while the parsed record still shows the same gap, so a
 * corrected statement falls back to section G. A gap not declared here is
 * still shown wherever the draw appears, counted at section G's figure until
 * someone reads the table. verify-build.mjs warns about both cases.
 */
const ADOPTED_TABLE: Record<string, { statement: number; table: number; line: string }> = {
  '2026-765': { statement: 150_000, table: 280_000, line: 'A01-9999-000-00000-0 Appropriated Fund Balance $280,000' },
}

const tableGap = (r: FiscalRes): Commitment['tableGap'] => {
  const gap = r.statementBelowTable
  if (!gap) return undefined
  const declared = ADOPTED_TABLE[r.number]
  const checked = !!declared && declared.statement === gap.statement && declared.table === gap.table &&
    r.funding?.fundBalanceDraw === gap.statement
  return checked
    ? { statement: gap.statement, table: gap.table, counted: 'table', line: declared.line }
    : { statement: gap.statement, table: gap.table, counted: 'statement' }
}

/**
 * A draw split by fund: one entry per fund its statement draws on, each with
 * only that fund's own lines (lib/fund-balance-lines.ts). The ETL's
 * fundBalanceDraw adds every 9999 line together, whatever its fund, so it is
 * not used here. A table figure declared in ADOPTED_TABLE stands only when the
 * whole draw is in one fund.
 */
const fundDraws = (r: FiscalRes) => {
  const gap = tableGap(r)
  return drawsByFund(r.funding, gap?.counted === 'table' ? gap.table : null)
}
const GENERAL_FUND = 'General Fund'
const generalFundDraw = (r: FiscalRes) => fundDraws(r).find((d) => d.fund === GENERAL_FUND)

/** How a draw's section G and adopted table compare, in a sentence for its row. */
export const gapNote = (gap: NonNullable<Commitment['tableGap']>) =>
  gap.counted === 'table'
    ? `The budget table the Board adopted moves “${gap.line}”; section G of the fiscal impact statement says ${usd0(gap.statement)}. The vote is the appropriation, so the table’s figure is counted.`
    : `Section G says ${usd0(gap.statement)}, less than the ${usd0(gap.table)} on the resolution’s own budget table. Counted at section G’s figure until the table is checked against the packet.`

/**
 * Not every General Fund draw comes out of the tier this page measures.
 *
 * The headroom arithmetic below starts from surplusAboveFloor, which is
 * UNASSIGNED fund balance less the policy's 15% floor. GASB 54 splits the balance
 * into five tiers, and the Town sometimes names the tier on the account itself:
 * resolution 2026-361 charges "Assigned Unappropriated Fund Balance - CBF",
 * moving $113,613 of Community Benefit Funds into a bulkhead project. That is a
 * real draw on a real balance, but it is not the unassigned cushion, so netting
 * it against unassigned headroom would report the cushion shrinking when the
 * cushion has not moved.
 *
 * A draw that names no tier is kept. The object code alone does not distinguish
 * them, and the overwhelming default is an unassigned draw; excluding the
 * unnamed ones would understate commitments far more than including them
 * overstates any single tier.
 */
const generalFundTiers = (r: FiscalRes) => generalFundDraw(r)?.tiers ?? []
const isUnassignedDraw = (r: FiscalRes) =>
  generalFundTiers(r).every((c) => c === null || c === 'Unassigned')

const generalFundBalanceDraws = allRes.filter(
  (r) =>
    isAdopted(r) &&
    r.funding?.drawsFundBalance === true &&
    (generalFundDraw(r)?.amount ?? 0) > 0,
)

const documentedGeneralFundDraws: DrawRow[] = generalFundBalanceDraws
  .filter(isUnassignedDraw)
  .map((r) => ({ number: r.number, title: r.title, amount: generalFundDraw(r)!.amount as number, tableGap: tableGap(r) }))
  .sort((a, b) => b.amount - a.amount)

/**
 * Draws on a General Fund tier other than Unassigned — reported, never netted.
 * Kept visible rather than filtered away in silence, because "it did not touch
 * the cushion" is a finding about the money, not a reason to hide the vote.
 */
export const otherTierGeneralFundDraws = generalFundBalanceDraws
  .filter((r) => !isUnassignedDraw(r))
  .map((r) => ({
    number: r.number,
    title: r.title,
    amount: generalFundDraw(r)!.amount as number,
    tableGap: tableGap(r),
    tiers: Array.from(new Set(generalFundTiers(r).filter((c): c is string => !!c))),
  }))
  .sort((a, b) => b.amount - a.amount)

export const otherTierDrawTotal = otherTierGeneralFundDraws.reduce((s, d) => s + d.amount, 0)

/**
 * Draws on the balance of a fund other than the General Fund: reported, never
 * netted.
 *
 * A Water District capital adjustment spends the Water District's own surplus,
 * which its ratepayers built and which is kept for the district's own purposes,
 * so none of these move the cushion the 2027 options are priced against. They are
 * still surplus spent by vote, and a page about where the surplus went would
 * mislead by leaving them out, so /fund-balance-draws/ lists them by fund and
 * totals them apart. A statement naming the account without an amount is
 * listed without one, not counted as nothing.
 *
 * One entry per resolution per fund, each carrying only that fund's lines. A
 * resolution drawing on two districts appears under each with its own amount,
 * so no fund's subtotal carries another fund's money, and a fund named without
 * an amount stays unpriced even when the other fund's line has one.
 */
export const otherFundDraws = allRes
  .filter((r) => isAdopted(r) && r.funding?.drawsFundBalance === true)
  .flatMap((r) =>
    fundDraws(r)
      .filter((d) => d.fund !== GENERAL_FUND)
      .map((d) => ({
        number: r.number,
        title: r.title,
        meetingDate: r.meetingDate,
        fund: d.fund,
        amount: d.amount,
        unpricedLines: d.unpricedLines,
        tableGap: tableGap(r),
      })),
  )
  .sort((a, b) => (b.amount ?? -1) - (a.amount ?? -1))

export const otherFundDrawTotal = otherFundDraws.reduce((s, d) => s + (d.amount ?? 0), 0)
/** Entries with a fund-balance line that states no amount: the whole fund's draw, or part of it. */
export const otherFundDrawsUnpriced = otherFundDraws.filter((d) => d.unpricedLines > 0)

/** Resolutions, not fund entries: one vote can draw on several funds. */
const votes = (rows: { number: string | null; title: string }[]) => new Set(rows.map((d) => d.number ?? d.title)).size
export const otherFundVotes = {
  /** Votes with at least one other-fund amount counted. */
  priced: votes(otherFundDraws.filter((d) => d.amount !== null)),
  /** Votes naming an other-fund balance account without an amount. */
  unpriced: votes(otherFundDrawsUnpriced),
}

/**
 * A curated entry a documented draw replaces, and the ceiling it carried.
 *
 * The Town Square case is why this exists. The curated entry carried the
 * paydown at a $2,725,000 CEILING, with a note saying the July 7 resolution
 * stated no amount and that this was the most it could have been. Resolution
 * 2026-762 then ratified the budget adjustment for that paydown and booked
 * $1,874,218 against A01-9999 — so the question the note called unanswerable is
 * answered, and the ceiling overstated the draw by $850,782. The Town Square
 * page now carries the booked figure itself, so the old ceiling is kept here,
 * where the correction is reported.
 *
 * The match is declared here by resolution number rather than inferred from
 * text, so it is visible, checkable and reversible.
 */
const SUPERSEDES: Record<string, { label: string; ceiling: number }> = {
  '2026-762': { label: 'Town Square note paydown', ceiling: 2_725_000 },
}

/**
 * What a draw's own resolution says about the money coming back, quoted from
 * the packet. A draw the Town says it will repay is still a draw today, so it
 * stays in the ledger; the quote tells a reader it is meant to be temporary.
 * 2026-762's recitals: "In the interim, until the proceeds are received, the
 * Town can pay down the BAN with the General Fund's Appropriated Fund
 * Balance ... Once the sale of 127 E, Main Street is complete, the General
 * Fund's Appropriated Fund Balance will be reimbursed for the amount utilized."
 */
const REPAYMENT: Record<string, string> = {
  '2026-762': 'The resolution says that once the sale of 127 East Main Street is complete, the General Fund\u2019s Appropriated Fund Balance \u201cwill be reimbursed for the amount utilized.\u201d',
}

// The priced General Fund draws. Each one was read individually rather than swept
// up by a keyword rule, because the packet mixes funds freely and a wrong
// attribution here would move the headline number.
//
// Two entries were removed after the first pass. The Engineering intern
// appointments ($8,000) are personnel and the LVF Landscape Architects addendum
// ($76,500) is a professional-services contract: both commit recurring operating
// money funded by the levy, neither draws down accumulated surplus. They had been
// included only because the ETL tags them with the same "reserve-draw" flag it
// gives capital and debt items. Nothing belongs in this list unless it is capital,
// debt, or a draw the record explicitly states comes from fund balance.
const supersededLabels = Object.keys(SUPERSEDES).map((n) => SUPERSEDES[n].label)

export const generalFundCommitments2026: Commitment[] = [
  // Documented first — the Town's own booked figures.
  ...documentedGeneralFundDraws.map((d) => {
    const replaced = d.number ? SUPERSEDES[d.number] : undefined
    const gap = d.tableGap
    const repayment = d.number ? REPAYMENT[d.number] : undefined
    const note = replaced
      ? `Booked against the Town's own Appropriated Fund Balance account. This replaces a ${usd0(replaced.ceiling)} ceiling carried here before, set when the July 7 resolution, which states no amount, was taken to be the draw.`
      : gap
        ? gapNote(gap)
        : 'Booked against the Town\u2019s own Appropriated Fund Balance account on the fiscal-impact statement, so the figure is the Town\u2019s rather than this site\u2019s.'
    return {
      label: replaced?.label ?? d.title,
      amount: d.amount,
      certainty: 'documented' as const,
      fund: 'General Fund' as const,
      number: d.number,
      source: `Resolution ${d.number ?? '—'}, ${gap?.counted === 'table' ? 'adopted budget table' : 'section G'} · A01-9999 Appropriated Fund Balance`,
      note: repayment ? `${note} ${repayment}` : note,
      ...(replaced
        ? { supersedes: { label: replaced.label, was: replaced.ceiling, by: d.amount } }
        : {}),
      ...(gap ? { tableGap: gap } : {}),
      ...(repayment ? { repayment } : {}),
    }
  }),
  // Curated entries the account codes do not cover, minus anything superseded.
  ...fundBalanceImpact.draws
    .filter((d) => supersededLabels.indexOf(d.label) === -1)
    .map((d) => ({
      label: d.label,
      amount: d.amount,
      certainty: d.certainty,
      fund: 'General Fund' as const,
      source: 'Town Square — fund-balance impact',
      note: d.note,
    })),
  // Two entries stood here, both from July 7, 2026, and both were guesses made
  // because that meeting's fiscal companion carried no account codes at all --
  // 0 of 53 resolutions, against 100% at every other meeting, because the file
  // was hand-curated and the ETL skipped it rather than parsing it. It is now
  // parsed and merged, so the statements speak for themselves and the guesses
  // are gone.
  //
  // The Meals on Wheels truck (2026-645, $80,000) is now read from its own
  // accounts and arrives through documentedGeneralFundDraws. Leaving the hand
  // entry here would have counted it twice.
  //
  // The East Creek boat launch (2026-639, $60,000) is not a General Fund draw.
  // Its note here said the Town "runs a separate East Creek Docking Facility
  // fund, but the resolution does not name it" -- the resolution names it
  // twice, charging CM2-9999-000-00000-0 and CM2-7-7230-230-000-00000. CM2 is
  // that fund. It never belonged in General Fund headroom.
]

export const committedTotal = generalFundCommitments2026.reduce((s, c) => s + c.amount, 0)
export const committedDocumented = generalFundCommitments2026
  .filter((c) => c.certainty === 'documented')
  .reduce((s, c) => s + c.amount, 0)
export const committedAuthorized = generalFundCommitments2026
  .filter((c) => c.certainty === 'authorized')
  .reduce((s, c) => s + c.amount, 0)
export const committedAtCeiling = generalFundCommitments2026
  .filter((c) => c.certainty === 'ceiling')
  .reduce((s, c) => s + c.amount, 0)
/** Documented draws counted at the adopted table's figure rather than section G's. */
export const countedFromAdoptedTable = generalFundCommitments2026.filter((c) => c.tableGap?.counted === 'table')

/**
 * The running ledger — what the opening position becomes, draw by draw.
 *
 * This is the answer to "how is the change shown". A pair of totals tells a
 * reader the surplus fell; a ledger tells them which votes spent it and what
 * was left after each one.
 */
export const headroomLedger = (() => {
  let running = surplusAboveFloor
  const rows = generalFundCommitments2026
    .slice()
    .sort((a, b) => b.amount - a.amount)
    .map((c) => {
      running -= c.amount
      return { ...c, remainingAfter: running }
    })
  return { opening: surplusAboveFloor, rows, closing: running }
})()

/** What reading the account codes did to the published figure. */
export const supersessions = generalFundCommitments2026
  .filter((c) => c.supersedes)
  .map((c) => c.supersedes!)

export const documentedChangedTotalBy = supersessions.reduce((s, x) => s + (x.by - x.was), 0)

/** The audited opening position above the 15% policy floor, before anything 2026 did to it. */
export const openingSurplusAbovePolicy = surplusAboveFloor
/** What can still be true after the documented draws. A ceiling, not a balance. */
export const remainingHeadroomCeiling = openingSurplusAbovePolicy - committedTotal
export const reductionPct = (committedTotal / openingSurplusAbovePolicy) * 100

// What this does to the options on /predict-2027/.
const zeroYearMustFind = Math.round(prediction.levyEstimate.levy2027 - prediction.levyEstimate.levy2026)
const capGap = prediction.capGap.gap

export const effectOnOptions = {
  headline: 'What this leaves for the 2027 choices',
  zeroYearMustFind,
  capGap,
  coverageBefore: openingSurplusAbovePolicy / zeroYearMustFind,
  coverageAfter: remainingHeadroomCeiling / zeroYearMustFind,
  body:
    `The options page prices a zero-percent year against the surplus above the Town’s 15% policy floor, the money its fund balance policy says may be used to reduce the next year’s property taxes. On the audited opening position that surplus covers the freeze several times over, which makes a reserve-funded freeze look almost costless. Netting only the draws already on the record cuts it by ${Math.round(reductionPct)}% — and ${drawCounts.unpriced} further adopted draws carry no published amount, so the real figure is lower again. The freeze is still affordable out of surplus. It is not as comfortably affordable as an un-netted number implies, and the difference is the whole point of reading the resolutions.`,
  caution:
    'This cuts both ways and the page should not pretend otherwise. The Town Square paydown is carried here at the $1,874,218 the Town booked against fund balance, and it is due back: resolution 2026-762 says the fund balance will be reimbursed once the sale closes, and the developer owes $2,493,750 by March 14, 2027 under an obligation the agreement calls “absolute and unconditional.” Money advanced against a contracted receipt is not the same as money spent. Treating every draw as permanently gone would overstate the problem exactly as ignoring them understates it.',
}

export const limits = {
  headline: 'What this cannot tell you',
  points: [
    'There is no 2026 financial report. The audited position is December 31, 2025, so the true current fund balance is unknown and stays unknown until the Town files one.',
    `Of ${drawCounts.adopted} adopted resolutions this site reads as drawing on reserves, only ${drawCounts.priced} carry a dollar amount. The Town’s Fiscal Impact Statements answer Yes/No and “absorbed by existing budget”; the amounts live in interleaved backup tables that do not reliably tie to a single resolution, so this site leaves them blank rather than guessing.`,
    'Because of that, every total here is a floor on what was committed and every remaining-headroom figure is a ceiling on what is left. Neither is a balance.',
    'Fund balance also moves for reasons no resolution records — revenue beating budget, departments underspending. In 2023 those two together swung the General Fund $8.6 million to the good. Draws are one side of a ledger this page can only see half of.',
  ],
}

export const sources = [
  {
    title: 'Town of Riverhead Town Board agenda packets — Fiscal Impact Statements',
    url: 'https://www.townofriverheadny.gov/129/Agendas-Minutes',
    covers: `Every resolution's own fiscal-impact answer, transcribed as published across ${corpus.meetings} meetings from ${corpus.earliest} to ${corpus.latest}.`,
  },
  {
    title: AUDIT_2025.source.title,
    url: AUDIT_2025.source.url,
    covers: 'The December 31, 2025 unassigned General Fund balance, from the independent audit the Board accepted on September 1, 2026.',
  },
  {
    title: 'Town Board Resolution 918 of 2011 — the Town’s fund balance policy',
    url: 'https://riverheadny.api.civicclerk.com/v1/Meetings/GetMeetingFileStream(fileId=7270,plainText=false)',
    covers: 'The 15% floor the surplus is measured above, and the three uses the policy allows for money above it.',
  },
]
