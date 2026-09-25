// What the Board has already spent out of fund balance — and what that leaves
// for the 2027 choices.
//
// WHY THIS EXISTS. /predict-2027/ offers the Board's options and prices several
// of them against "surplus above policy" — about $15.0M sitting above the top of the
// Town's own reserve range. That figure is the audited position at DECEMBER 31,
// 2025. It is not what is available now. Every resolution adopted during 2026
// that draws on fund balance has already spent part of it, and a suggested
// action cannot be funded twice.
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
import { surplusAboveUpper, unassignedFundBalance, targetUpper, policyUpperPercent } from './reserve-policy'
import { fundBalanceImpact } from './town-square'
import prediction from '../public/data/budget-2027-prediction.json'
import type { ResolutionFunding } from './account-lookup'

type FiscalRes = {
  number: string
  title: string
  category: string
  amount: number | null
  realistic: { flag: string; verdict: string; reason: string }
  vote: { adopted: boolean | null }
  /** Section G, where the preparer filled it in. Added with the sub-account join. */
  funding?: ResolutionFunding | null
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
   *              Fund Balance account on the statement.
   * authorized — read from the resolution, which stated the amount in prose.
   * ceiling    — the resolution states no amount and this is the most it could
   *              have been. Always an over-statement of what was actually drawn.
   */
  certainty: 'documented' | 'authorized' | 'ceiling'
  fund: 'General Fund'
  source: string
  note: string
  /** Set when this entry replaced a curated one. */
  supersedes?: { label: string; was: number; by: number }
}

// ── Documented draws, from the Town's own Appropriated Fund Balance account ──
//
// Every adopted resolution whose section G charges A01-9999 is a General Fund
// draw the Town wrote down itself. These take precedence over anything read
// from prose, because they carry a figure the Town booked rather than one this
// site inferred or bounded.
type DrawRow = { number: string | null; title: string; amount: number }

/**
 * Not every General Fund draw comes out of the tier this page measures.
 *
 * The headroom arithmetic below starts from surplusAboveUpper, which is
 * UNASSIGNED fund balance less the policy target. GASB 54 splits the balance
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
const isUnassignedDraw = (r: FiscalRes) =>
  (r.funding?.fundBalanceClasses ?? []).every((c) => c === null || c === 'Unassigned')

const generalFundBalanceDraws = allRes.filter(
  (r) =>
    isAdopted(r) &&
    r.funding?.drawsFundBalance === true &&
    (r.funding.fundBalanceFunds ?? []).indexOf('General Fund') !== -1 &&
    (r.funding.fundBalanceDraw ?? 0) > 0,
)

const documentedGeneralFundDraws: DrawRow[] = generalFundBalanceDraws
  .filter(isUnassignedDraw)
  .map((r) => ({ number: r.number, title: r.title, amount: r.funding!.fundBalanceDraw as number }))
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
    amount: r.funding!.fundBalanceDraw as number,
    tiers: Array.from(
      new Set((r.funding!.fundBalanceClasses ?? []).filter((c): c is string => !!c)),
    ),
  }))
  .sort((a, b) => b.amount - a.amount)

export const otherTierDrawTotal = otherTierGeneralFundDraws.reduce((s, d) => s + d.amount, 0)

/**
 * A curated entry a documented draw replaces.
 *
 * The Town Square case is why this exists. The curated entry carried the
 * paydown at a $2,725,000 CEILING, with a note saying the July 7 resolution
 * stated no amount and that this was the most it could have been. Resolution
 * 2026-762 then ratified the budget adjustment for that paydown and booked
 * $1,874,218 against A01-9999 — so the question the note called unanswerable is
 * answered, and the ceiling overstated the draw by $850,782.
 *
 * The match is declared here by resolution number rather than inferred from
 * text, so it is visible, checkable and reversible.
 */
const SUPERSEDES: Record<string, string> = {
  '2026-762': 'Town Square note paydown',
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
const supersededLabels = Object.keys(SUPERSEDES).map((n) => SUPERSEDES[n])

export const generalFundCommitments2026: Commitment[] = [
  // Documented first — the Town's own booked figures.
  ...documentedGeneralFundDraws.map((d) => {
    const replacedLabel = d.number ? SUPERSEDES[d.number] : undefined
    const replaced = replacedLabel
      ? fundBalanceImpact.draws.filter((x) => x.label === replacedLabel)[0]
      : undefined
    return {
      label: replacedLabel ?? d.title,
      amount: d.amount,
      certainty: 'documented' as const,
      fund: 'General Fund' as const,
      source: `Resolution ${d.number ?? '—'}, section G · A01-9999 Appropriated Fund Balance`,
      note: replaced
        ? `Booked against the Town's own Appropriated Fund Balance account. This replaces a ${replaced.amount.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })} ceiling carried here before, which existed only because the earlier resolution stated no amount.`
        : 'Booked against the Town\u2019s own Appropriated Fund Balance account on the fiscal-impact statement, so the figure is the Town\u2019s rather than this site\u2019s.',
      ...(replaced
        ? { supersedes: { label: replacedLabel as string, was: replaced.amount, by: d.amount } }
        : {}),
    }
  }),
  // Curated entries the account codes do not cover, minus anything superseded.
  ...fundBalanceImpact.draws
    .filter((d) => supersededLabels.indexOf(d.label) === -1)
    .map((d) => ({
      label: d.label,
      amount: d.amount,
      certainty: d.certainty as 'authorized' | 'ceiling',
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

/**
 * The running ledger — what the opening position becomes, draw by draw.
 *
 * This is the answer to "how is the change shown". A pair of totals tells a
 * reader the surplus fell; a ledger tells them which votes spent it and what
 * was left after each one.
 */
export const headroomLedger = (() => {
  let running = surplusAboveUpper
  const rows = generalFundCommitments2026
    .slice()
    .sort((a, b) => b.amount - a.amount)
    .map((c) => {
      running -= c.amount
      return { ...c, remainingAfter: running }
    })
  return { opening: surplusAboveUpper, rows, closing: running }
})()

/** What reading the account codes did to the published figure. */
export const supersessions = generalFundCommitments2026
  .filter((c) => c.supersedes)
  .map((c) => c.supersedes!)

export const documentedChangedTotalBy = supersessions.reduce((s, x) => s + (x.by - x.was), 0)

/** The audited opening position, before anything 2026 did to it. */
export const openingSurplusAbovePolicy = surplusAboveUpper
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
    `The options page prices a zero-percent year against the surplus sitting above the Town’s own policy ceiling. On the audited opening position that surplus covers the freeze several times over, which makes a reserve-funded freeze look almost costless. Netting only the draws already on the record cuts it by roughly a third — and ${drawCounts.unpriced} further adopted draws carry no published amount, so the real figure is lower again. The freeze is still affordable out of surplus. It is not as comfortably affordable as an un-netted number implies, and the difference is the whole point of reading the resolutions.`,
  caution:
    'This cuts both ways and the page should not pretend otherwise. The Town Square paydown is carried here at its ceiling because the resolution states no amount, and a large part of it is contractually due back — the developer owes $2,493,750 by March 14, 2027 under an obligation the agreement calls “absolute and unconditional.” Money advanced against a contracted receipt is not the same as money spent. Treating every draw as permanently gone would overstate the problem exactly as ignoring them understates it.',
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
    title: 'Town of Riverhead 2024 Audited Basic Financial Statements',
    url: 'https://www.townofriverheadny.gov/206/Financial-Reports',
    covers: 'The December 31, 2025 unassigned General Fund balance and the appropriations the policy percentages are measured against.',
  },
]
