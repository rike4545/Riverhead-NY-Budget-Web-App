// What a 1% or a zero-percent 2027 tax levy would take, for /zero-percent-2027/.
//
// The page began with Suffolk County's pledge of no general fund increase for
// 2027, and priced a freeze on this site's projection. The Town's own 2027
// Tentative is now out, and six amendments before the Board would trim it, so
// both targets are measured against those instead:
//   - the Tentative's town-wide levy, the General, Highway and Street Lighting
//     funds (its Summary's "Total Town Wide", budget-stages.json);
//   - the same levy with the six amendments (budget-amendments-effect.ts);
//   - a 1% increase and no increase over 2026's levy.
//
// Where the money could come from is read from the 2027 Budget Supplement, which
// adds up to the Tentative to the dollar, and from every earlier Supplement
// (revenue-history.json): what each revenue line brought in during 2023, 2024
// and 2025, and by June 30, 2026. Savings are the audited 2025 General Fund
// balance above the Town's 15% policy floor, less what 2026's resolutions have
// already committed (fiscal-commitments-2027.ts).
//
// The Town has proposed no 1% or 0% budget. Every step toward one here is this
// site's arithmetic from those records, and the page says so.
//
// ONE DISTINCTION THE COMPARISON WITH SUFFOLK TURNS ON. Suffolk's police district
// is levied separately, on the towns inside it, and Riverhead is not one of them.
// Riverhead's police department sits inside the very General Fund a freeze
// would apply to.

import revenueHistory from '../public/data/budget-supplement/revenue-history.json'
import supplementJson from '../public/data/budget-supplement/current-lines.json'
import taxBill from '../public/data/tax-bill.json'
import { AUDITED_GENERAL_FUND, AUDITED_OPERATIONS } from './audits'
import { PACKET, scaledRate } from './budget-amendments-2027'
import { amendmentEffect } from './budget-amendments-effect'
import { stageDoc, TOWN_WIDE_FUNDS } from './budget-stages'
import { committedTotal, drawCounts, remainingHeadroomCeiling } from './fiscal-commitments-2027'
import { lineSource } from './funds-2027'
import { generalFund } from './general-fund'
import { corpus as laborCorpus, openUnits, triborough } from './labor-contracts-2027'
import { appropriations, minimumRequired, policyMinimumPercent, surplusAboveFloor, unassignedFundBalance } from './reserve-policy'
import { savingEstimate } from './retirement-actuals-2026'
import { LETTER_2027, READ_BY_HAND } from './tentative-letters'
import { CARRYOVER_CAP, CARRYOVER_SOURCES, factorsAllowPct, GROWTH_2027 } from './tax-cap-carryover'

type Line = {
  account: string; fund: string; name: string; kind: string; page: number
  actual: number | null; adopted: number | null; ytd: number | null; tentative: number | null; priorActual: number | null
}
type History = {
  account: string; fund: string; name: string; page: number
  actual: Record<string, number>; adopted: Record<string, number>; ytd: Record<string, number>; tentative: number | null
}

const tentative = stageDoc(2027, 'tentative')
const adopted = stageDoc(2026, 'adopted')
const fx = amendmentEffect
if (!tentative?.townWide || !adopted?.townWide || !fx || !lineSource) {
  throw new Error('zero-percent-2027: needs the 2027 Tentative and 2026 adopted Summaries, the six amendments and a 2027 Supplement that adds up')
}
const tw = tentative.townWide

const lines = new Map((supplementJson.lines as unknown as Line[]).map((l) => [l.account, l]))
const histories = new Map((revenueHistory.accounts as unknown as History[]).map((h) => [h.account, h]))
const amendedChange = new Map(fx.accounts.map((a) => [a.account, a.change]))

const sum = (xs: number[]) => xs.reduce((s, x) => s + x, 0)
const pct = (from: number, to: number) => ((to - from) / from) * 100
const usd = (n: number) => `${n < 0 ? '−' : ''}$${Math.round(Math.abs(n)).toLocaleString('en-US')}`
const fmtPct = (p: number, digits = 2) => `${p < 0 ? '−' : ''}${Math.abs(p).toFixed(digits)}%`
const NUMBER_WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve']
const countWord = (n: number) => NUMBER_WORDS[n] ?? String(n)
const COLLECTED_YEARS = [2023, 2024, 2025] as const

// ── Five levels for 2027 ─────────────────────────────────────────────────────

/** The example home the Supervisor's letter prices the Tentative on, at the Receiver of Taxes' residential assessment ratio. */
export const exampleHome = (() => {
  const marketValue = LETTER_2027.generalFund.exampleValue
  const ratio = taxBill.equalization.residentialAssessmentRatio
  return { marketValue, ratio, ratioYear: taxBill.equalization.asOfYear, assessed: (marketValue * ratio) / 100 }
})()
/**
 * A newer ratio than the rate sheet's: the Department of Taxation and
 * Finance's municipal profile for Riverhead, "Most recent RAR: 7.03, Year of
 * RAR: 2026", as it read on October 16, 2026. The profile is an interactive
 * page, so no copy is kept. The site keeps the rate sheet's ratio on every
 * page so the pages agree, and says what the newer one would change.
 */
export const newerRatio = {
  ratio: 7.03,
  year: 2026,
  source: { title: 'Department of Taxation and Finance, Municipal Profiles: Town of Riverhead (SWIS 473000)', url: 'https://pad.tax.ny.gov/muni' },
}

/** Rounded to the dollar, so a table's changes add up as printed. */
const homeTax = (rate: number) => Math.round((exampleHome.assessed / 1000) * rate)

/** The three town-wide funds: 2026's levy, the Tentative's, the amended one and the Tentative's rate. */
export const townWideFunds = (TOWN_WIDE_FUNDS as readonly string[]).map((code) => {
  const t = tentative.funds[code]
  const amended = fx.funds.find((f) => f.fund === code)?.after?.levy ?? t.levy ?? 0
  return {
    code,
    name: t.name,
    prior: adopted.funds[code].levy ?? 0,
    tentative: t.levy ?? 0,
    amended,
    rate: tw.fundRates?.[code]?.rate ?? null,
  }
})

/** The town-wide rate if each fund's levy rose by the same percentage over 2026, as each does in the Tentative. */
const rateAtIncrease = (p: number) =>
  townWideFunds.every((f) => f.rate !== null)
    ? sum(townWideFunds.map((f) => scaledRate(f.rate as number, f.tentative, f.prior * (1 + p / 100))))
    : null

export const TARGET_PCTS = [1, 0] as const
const targetLevy = (p: number) => Math.round(tw.priorLevy * (1 + p / 100))

export type Level = {
  id: string
  label: string
  levy: number
  /** Over 2026's levy. */
  change: number
  pct: number
  /** How much less than the Tentative it raises. */
  belowTentative: number
  /** The town-wide rate per $1,000 of assessed value. */
  rate: number | null
  /** The rate's change over 2026's. */
  ratePct: number | null
  /** Printed by the Town, or this site's estimate. */
  printed: boolean
  homeTax: number | null
  homeChange: number | null
}

const level = (id: string, label: string, levy: number, rate: number | null, printed: boolean): Level => ({
  id,
  label,
  levy,
  change: levy - tw.priorLevy,
  pct: pct(tw.priorLevy, levy),
  belowTentative: tw.levy - levy,
  rate,
  ratePct: rate === null ? null : pct(tw.priorRate, rate),
  printed,
  homeTax: rate === null ? null : homeTax(rate),
  homeChange: rate === null ? null : homeTax(rate) - homeTax(tw.priorRate),
})

export const levels: Level[] = [
  level('2026', '2026 adopted', tw.priorLevy, tw.priorRate, true),
  level('tentative', '2027 Tentative', tw.levy, tw.rate, true),
  level('amended', 'With the six amendments', fx.townWide.after, fx.townWide.rateAfter, false),
  ...TARGET_PCTS.map((p) => level(`target-${p}`, p === 0 ? 'No increase' : `A ${p}% increase`, targetLevy(p), rateAtIncrease(p), false)),
]
export const levelOf = (id: string) => levels.find((l) => l.id === id)!

/** What each target needs: below the Tentative, and beyond the six amendments. */
export const gaps = TARGET_PCTS.map((p) => {
  const levy = targetLevy(p)
  return { pct: p, levy, belowTentative: tw.levy - levy, beyondAmendments: fx.townWide.after - levy }
})
export const gapOf = (p: number) => gaps.find((g) => g.pct === p)!

/**
 * The tax base grew, so a flat levy is spread over more assessed value: the
 * Tentative raises the levy faster than the rate. Each fund's levy over its
 * rate is the assessed value it is spread over.
 */
export const baseGrowthPct = pct(tw.priorLevy / tw.priorRate, tw.levy / tw.rate)

// ── Where the money could come from ──────────────────────────────────────────

const amendedEstimate = (account: string) => {
  const t = lines.get(account)?.tentative ?? 0
  return t + (amendedChange.get(account) ?? 0)
}

/**
 * Interest on the three funds' deposits. Each Supplement prints what came in by
 * June 30 beside the prior year's full year, so the yardstick is twice the first
 * half of 2026: less than every full year since 2023 brought in.
 */
export const interest = (() => {
  const rows = (TOWN_WIDE_FUNDS as readonly string[]).map((code) => {
    const account = `${code}-2401-000-00000-G`
    const h = histories.get(account)
    const l = lines.get(account)
    if (!h || !l) throw new Error(`zero-percent-2027: no interest line ${account} in the Supplements`)
    const collected = COLLECTED_YEARS.map((y) => ({ year: y, amount: h.actual[String(y)], firstHalf: h.ytd[String(y)] }))
    const firstHalf2026 = h.ytd['2026']
    const pace = Math.round(2 * firstHalf2026)
    const amended = amendedEstimate(account)
    return {
      account,
      fund: code,
      fundName: tentative.funds[code].name,
      page: l.page,
      collected,
      lowest: Math.min(...collected.map((c) => c.amount)),
      /** The full year over the first half, the smallest of 2023–2025. */
      lowestMultiple: Math.min(...collected.map((c) => c.amount / c.firstHalf)),
      firstHalf2026,
      budgeted2026: h.adopted['2026'],
      tentative: l.tentative ?? 0,
      amended,
      pace,
      room: Math.max(0, pace - Math.round(amended)),
    }
  })
  return {
    rows,
    total: sum(rows.map((r) => r.room)),
    /** Every year since 2023, each fund collected at least this multiple of its first half. */
    lowestMultiple: Math.min(...rows.map((r) => r.lowestMultiple)),
    paceBelowEveryYear: rows.every((r) => r.pace < r.lowest),
  }
})()

/**
 * Every other estimate in the three funds that, even after the amendments, sits
 * below what the line brought in during each of 2023, 2024 and 2025. Left out:
 * property taxes and savings, interest (above), charges and transfers between
 * Town funds (raising them moves a cost, it doesn't collect one), and lines the
 * Town no longer budgets at all.
 */
export const otherEstimates = (() => {
  const rows = Array.from(lines.values())
    .filter((l) => (TOWN_WIDE_FUNDS as readonly string[]).includes(l.fund) && l.kind === 'revenue')
    .filter((l) => {
      const code = l.account.split('-')[1]
      return !['1001', '9999', '2401'].includes(code) && !code.startsWith('28') && !code.startsWith('5')
    })
    .flatMap((l) => {
      const h = histories.get(l.account)
      const estimate = Math.round(amendedEstimate(l.account))
      if (!h || estimate <= 0 || COLLECTED_YEARS.some((y) => h.actual[String(y)] === undefined)) return []
      const lowest = Math.round(Math.min(...COLLECTED_YEARS.map((y) => h.actual[String(y)])))
      if (lowest <= estimate) return []
      const firstHalf2025 = h.ytd['2025'] ?? null
      const firstHalf2026 = h.ytd['2026'] ?? null
      return [{
        account: l.account,
        name: l.name,
        page: l.page,
        collected: COLLECTED_YEARS.map((y) => ({ year: y, amount: h.actual[String(y)] })),
        lowest,
        estimate,
        amended: amendedChange.has(l.account),
        room: lowest - estimate,
        firstHalf2025,
        firstHalf2026,
        behind: firstHalf2025 !== null && firstHalf2026 !== null && firstHalf2026 < firstHalf2025,
      }]
    })
    .sort((a, b) => b.room - a.room)
  return {
    rows,
    total: sum(rows.map((r) => r.room)),
    behind: rows.filter((r) => r.behind).length,
    largest: rows.filter((r) => r.room >= 25_000),
  }
})()

const buildingFees = otherEstimates.rows.find((r) => r.account === 'A01-1560-170-00000-3') ?? null
export const buildingFeesWatch = buildingFees
  ? { ...buildingFees, tentative: lines.get(buildingFees.account)?.tentative ?? 0 }
  : null

/** The General Fund's own savings: what each budget counts as income. */
export const draws = {
  y2026: adopted.funds.A01.fundBalance ?? 0,
  tentative: tentative.funds.A01.fundBalance ?? 0,
  amended: fx.funds.find((f) => f.fund === 'A01')?.after?.fundBalance ?? (tentative.funds.A01.fundBalance ?? 0),
}

/** The Town's fund balance policy and what is left above its floor. */
export const savings = {
  unassigned: unassignedFundBalance,
  unassignedYear: 2025,
  shareOfAppropriations: (unassignedFundBalance / appropriations) * 100,
  floorPct: policyMinimumPercent * 100,
  floor: minimumRequired,
  aboveFloor: surplusAboveFloor,
  committed: committedTotal,
  unpriced: drawCounts.unpriced,
  ceiling: remainingHeadroomCeiling,
}

/** What each year's adopted budget planned to draw, and what the audit found. */
export const afterTheFact = Object.entries(AUDITED_OPERATIONS).map(([year, ops]) => {
  const row = generalFund.rows.find((r) => r.year === Number(year))
  const audit = AUDITED_GENERAL_FUND[Number(year)]
  return { year: Number(year), plannedDraw: row?.appropriatedFundBalance ?? null, netChange: ops.netChange, page: ops.page, source: audit?.source ?? null }
})

// ── One way to reach each ────────────────────────────────────────────────────

/**
 * The site's illustration, not a proposal: the amendments, then interest at its
 * 2026 pace, then the rest from General Fund savings. Other estimates could take
 * the place of some of the savings; the page sets out their risks separately.
 */
export const paths = TARGET_PCTS.map((p) => {
  const g = gapOf(p)
  const afterInterest = Math.max(0, g.beyondAmendments - interest.total)
  const fromOthers = Math.min(afterInterest, otherEstimates.total)
  return {
    pct: p,
    levy: g.levy,
    belowTentative: g.belowTentative,
    amendments: tw.levy - fx.townWide.after,
    interest: Math.min(interest.total, g.beyondAmendments),
    fromSavings: afterInterest,
    draw: draws.amended + afterInterest,
    /** If the other estimates were raised to their three-year lows first. */
    withOthers: { fromOthers, fromSavings: afterInterest - fromOthers, draw: draws.amended + afterInterest - fromOthers },
  }
})
export const pathOf = (p: number) => paths.find((x) => x.pct === p)!

// ── The carryover argument ───────────────────────────────────────────────────

/**
 * What each 2027 levy would leave under the cap, and how much of it could carry
 * into 2028. The Tentative levies to its limit: its town-wide levy rises by the
 * State's two growth factors multiplied, so its levy stands in for the limit.
 * The Town has published no limit in dollars, and the cap counts the combined
 * levy of every fund and district inside it, so this is an illustration on the
 * town-wide levy, labelled as one on the page.
 */
export const carryover = (() => {
  const limit = tw.levy
  const cap = Math.round(limit * CARRYOVER_CAP)
  const rows = ['amended', 'target-1', 'target-0'].map((id) => {
    const l = levelOf(id)
    const room = Math.max(0, limit - l.levy)
    const carried = Math.min(room, cap)
    return { id, label: l.label, levy: l.levy, pct: l.pct, room, carried, lost: room - carried }
  })
  return {
    limit,
    cap,
    rows,
    /** Any increase at least this large leaves no more room than can carry over. */
    thresholdPct: pct(tw.priorLevy, limit * (1 - CARRYOVER_CAP)),
    factorsPct: factorsAllowPct(GROWTH_2027.taxBase.riverhead),
    taxBaseFactor: GROWTH_2027.taxBase.riverhead,
    allowableFactor: GROWTH_2027.allowable,
    tentativePct: pct(tw.priorLevy, tw.levy),
    /** The years the Town's own letters put the town-wide budget over the cap. */
    overCap: [2025, 2026].map((y) => ({ year: y, sentence: READ_BY_HAND[y]?.taxCap ?? null })),
    overrideHeadline: LETTER_2027.meetingReport,
    sources: CARRYOVER_SOURCES,
  }
})()

// ── A middle course ──────────────────────────────────────────────────────────

/**
 * An increase between 1% and the amendments' 1.73%, suggested on the page for
 * residents to put to the Board. Each end is priced like the targets: beyond
 * the amendments, how much of interest at its 2026 pace it uses, the example
 * home's tax, and the room it leaves under the limit against what can carry.
 */
export const MIDDLE_PCTS = [1.24, 1.58] as const
/** The two thresholds the range clears: no more savings than the amendments use, and no carryover lost. */
export const middleThresholds = {
  noSavingsPct: pct(tw.priorLevy, fx.townWide.after - interest.total),
  carryoverPct: carryover.thresholdPct,
}
export const middle = MIDDLE_PCTS.map((p) => {
  const levy = targetLevy(p)
  const beyondAmendments = fx.townWide.after - levy
  const rate = rateAtIncrease(p)
  const room = Math.max(0, carryover.limit - levy)
  return {
    pct: p,
    levy,
    change: levy - tw.priorLevy,
    belowTentative: tw.levy - levy,
    beyondAmendments,
    /** Interest at its 2026 pace left over once it covers the gap: a cushion if interest falls short. */
    interestSpare: interest.total - beyondAmendments,
    fromSavings: Math.max(0, beyondAmendments - interest.total),
    rate,
    homeTax: rate === null ? null : homeTax(rate),
    homeChange: rate === null ? null : homeTax(rate) - homeTax(tw.priorRate),
    room,
    /** Room beyond what can carry into 2028. */
    lost: Math.max(0, room - carryover.cap),
  }
})

// ── How the levy got here ────────────────────────────────────────────────────

const fundRate = (code: string) => tw.fundRates?.[code]?.rate ?? null
export const trajectory = {
  rateRows: [
    { label: 'General Fund', y2025: taxBill.rates2025.generalFund, y2026: taxBill.rates2026.generalFund, y2027: fundRate('A01') },
    { label: 'Highway', y2025: taxBill.rates2025.highway, y2026: taxBill.rates2026.highway, y2027: fundRate('DA1') },
    { label: 'Street lighting', y2025: taxBill.rates2025.streetLighting, y2026: taxBill.rates2026.streetLighting, y2027: fundRate('SL1') },
    { label: 'Total town-wide', y2025: taxBill.rates2025.totalTownWide, y2026: taxBill.rates2026.totalTownWide, y2027: tw.rate },
  ],
  rateSource: taxBill.rateSource,
  levyHistory: (() => {
    const rows = generalFund.rows
      .filter((r) => r.taxLevy !== null && r.year >= 2021)
      .map((r) => ({ year: r.year, label: String(r.year), levy: r.taxLevy as number }))
    const gf = townWideFunds.find((f) => f.code === 'A01')!
    rows.push({ year: 2027, label: '2027 Tentative', levy: gf.tentative }, { year: 2027, label: '2027 with the six amendments', levy: gf.amended })
    const last2026 = rows.find((r) => r.year === 2026)!.levy
    return rows.map((r, i) => {
      const prev = r.year === 2027 ? last2026 : i > 0 ? rows[i - 1].levy : null
      return { ...r, change: prev === null ? null : pct(prev, r.levy) }
    })
  })(),
}

/** The trend in a sentence, from the rows above. */
export const trendNote = (() => {
  const yearly = trajectory.levyHistory.filter((r) => r.year < 2027 && r.change !== null)
  const t = trajectory.levyHistory.find((r) => r.label === '2027 Tentative')!
  const a = trajectory.levyHistory.find((r) => r.label === '2027 with the six amendments')!
  const fell = yearly.filter((r) => (r.change as number) < 0)
  const lastFall = fell[fell.length - 1]
  const after = yearly.filter((r) => !lastFall || r.year > lastFall.year)
  const since = [...yearly].reverse().find((r) => (r.change as number) <= (t.change as number))
  const lead = lastFall
    ? `The General Fund levy fell ${fmtPct(-(lastFall.change as number))} in ${lastFall.year}, then rose ${after.map((r) => fmtPct(r.change as number)).join(', ').replace(/, ([^,]*)$/, ' and $1')} in ${after[0].year}–${after[after.length - 1].year}.`
    : `The General Fund levy rose ${yearly.map((r) => fmtPct(r.change as number)).join(', ')}.`
  const tail = since
    ? ` The 2027 Tentative would raise it ${fmtPct(t.change as number)}, or ${fmtPct(a.change as number)} with the amendments: the smallest change since ${since.year}${(since.change as number) < 0 ? ', when it fell' : ''}.`
    : ` The 2027 Tentative would raise it ${fmtPct(t.change as number)}, or ${fmtPct(a.change as number)} with the amendments.`
  return lead + tail
})()

// ── Why a town is harder to hold flat than a county ──────────────────────────

export const suffolk = {
  who: 'Suffolk County Executive Ed Romaine, third State of the County address, September 3, 2026',
  pledge:
    '“Affordability is currently at the top of every resident’s mind in Suffolk County. With that, I am announcing that I will not be raising general fund taxes for 2027. There will be no increase for Suffolk County residents.”',
  dateNote:
    'The County’s own headline on that release says 2026 while the text says 2027. The address was delivered in September 2026 and concerns the 2027 budget, so 2027 is the operative year.',
  how:
    'The County credited more than $700 million in reserves, five bond upgrades since 2024, improved liquidity and conservative budgeting.',
  theCatch:
    'A county general fund is one fund among several. Suffolk’s police district is a separate fund levied on the towns inside it, and the five East End towns, Riverhead among them, are not in it and do not pay that levy. So “no general fund increase” at the county level leaves a great deal of county spending outside the promise. Riverhead’s General Fund is not structured that way.',
}

const CATEGORY: Record<string, string> = { '1': 'General government', '3': 'Public safety', '9': 'Employee benefits and debt' }
export const whyHarder = (() => {
  const gfLines = Array.from(lines.values()).filter((l) => l.fund === 'A01' && l.kind === 'expenditure')
  const total = sum(gfLines.map((l) => l.tentative ?? 0))
  const by = new Map<string, number>()
  for (const l of gfLines) {
    const label = CATEGORY[l.account.split('-')[1]] ?? 'Everything else'
    by.set(label, (by.get(label) ?? 0) + (l.tentative ?? 0))
  }
  const order = ['Employee benefits and debt', 'Public safety', 'General government', 'Everything else']
  const shares = order.map((label) => ({ label, amount: by.get(label) ?? 0, pct: Number((((by.get(label) ?? 0) / total) * 100).toFixed(1)) }))
  const debtTransfer = lines.get('A01-9-9901-900-V01-00000')?.tentative ?? 0
  const policeAndBenefits = (((by.get('Public safety') ?? 0) + (by.get('Employee benefits and debt') ?? 0)) / total) * 100
  return {
    basis: 'the 2027 Tentative’s General Fund',
    total,
    lineCount: gfLines.length,
    shares,
    detail:
      `Public safety and employee benefits together are ${policeAndBenefits.toFixed(1)}% of the 2027 Tentative’s General Fund. The benefits figure includes ${usd(debtTransfer)} sent to the Debt Service Fund for the General Fund’s share of debt payments. Suffolk can hold its general fund flat in part because its largest public-safety cost sits in a separate district fund that Riverhead does not pay into and does not control. Riverhead’s police department sits inside the fund a freeze would apply to.`,
    contracts:
      'The timing compounds it. The ' + openUnits.map((u) => u.unit).join(' and ') + ' agreements expire on December 31, ' +
      '2026, and across ' + laborCorpus.resolutions.toLocaleString() + ' resolutions in ' + laborCorpus.meetings +
      ' meetings, no successor for either has been put to the Board. Their only items this year are the July 7 ' +
      'retirement-incentive stipulations, which pay people to leave and set no wage rate. A 0% or 1% budget would be ' +
      'adopted while both police unions are unsettled, and a settlement would add to it.',
    triboroughFloor:
      'And an unsettled contract is not a free one. Civil Service Law § 209-a(1)(e) makes it an improper practice to refuse ' +
      'to continue the terms of an expired agreement, so step movement carries on with no successor and no vote: ' +
      usd(triborough.stepCost2027) + ' in 2027 for the Police Officer ladder alone, ' + triborough.officersMoving +
      ' officers advancing one rung while the ' + triborough.officersAtTopStep + ' already at top step cost nothing. What does ' +
      'not continue is the across-the-board increase.',
    sourceNote:
      `Shares are computed from the ${gfLines.length} General Fund expenditure lines of the 2027 Budget Supplement, which add up to the Tentative’s ${usd(total)}, grouped by the first digit of each line’s function code.`,
  }
})()

/**
 * The two police numbers this year produced, set against each other. Sworn
 * retirements are worth about as much a year as the step movement the Town owes
 * whether or not it settles a contract, so on the police side, the largest
 * block of the General Fund, 2027 looks less like a saving than like treading
 * water.
 */
export const policeOffset = {
  swornCount: savingEstimate.swornCount,
  savingFromRetirements: savingEstimate.annualFromSworn,
  triboroughStepFloor: triborough.stepCost2027,
  net: savingEstimate.annualFromSworn - triborough.stepCost2027,
  get reading() {
    const net = this.savingFromRetirements - this.triboroughStepFloor
    return (
      `${countWord(this.swornCount).replace(/^./, (c) => c.toUpperCase())} sworn retirements are worth ${usd(this.savingFromRetirements)} a year. ` +
      `Step movement the Town owes with or without a contract costs ${usd(this.triboroughStepFloor)} in the Police Officer ladder alone. ` +
      `The two nearly cancel: ${usd(Math.abs(net))} ${net >= 0 ? 'to the good' : 'to the bad'} before a single contract is negotiated, ` +
      'and before the detective, sergeant and superior-officer ladders, which this floor does not include, are counted at all.'
    )
  },
  caveat:
    'These are not strictly additive. Some of the retiring officers were at top step and so were not going to move anyway, which is already reflected in both figures being computed from the same authorized-salary listings. The point is the order of magnitude, not a net line in a budget.',
}

// ── The headline, in a few sentences ─────────────────────────────────────────

const one = pathOf(1)
const zero = pathOf(0)
const tentativeLevel = levelOf('tentative')
const amendedLevel = levelOf('amended')
const oneLevel = levelOf('target-1')
const zeroLevel = levelOf('target-0')

export const summary = {
  tentativePct: tentativeLevel.pct,
  amendedPct: amendedLevel.pct,
  tentativeRise: tentativeLevel.change,
  amendedRise: amendedLevel.change,
  oneBeyond: gapOf(1).beyondAmendments,
  zeroBeyond: gapOf(0).beyondAmendments,
  oneBelowTentative: gapOf(1).belowTentative,
  zeroBelowTentative: gapOf(0).belowTentative,
  /** On the letter's example home: the Tentative against no increase, and the amendments against 1%. */
  homeTentativeVsZero: (tentativeLevel.homeTax ?? 0) - (zeroLevel.homeTax ?? 0),
  homeAmendedVsOne: (amendedLevel.homeTax ?? 0) - (oneLevel.homeTax ?? 0),
  generalFundRise: townWideFunds.find((f) => f.code === 'A01')!.tentative - townWideFunds.find((f) => f.code === 'A01')!.prior,
  statedLimitPct: READ_BY_HAND[2027]?.statedLimitPct ?? null,
}

export const verdict = {
  onePct:
    `Yes, without cutting a service. The six amendments bring the increase to ${fmtPct(summary.amendedPct)}. Budgeting interest at its 2026 pace, still below what each fund collected in every year since 2023, adds ${usd(one.interest)}, and the last ${usd(one.fromSavings)} could come from savings: a General Fund draw of ${usd(one.draw)}, still less than 2026’s ${usd(draws.y2026)}. Most of it would be recurring revenue, though interest falls when rates or balances do.`,
  zeroPct:
    `For one year, yes, but it leans on savings. After the amendments and interest, ${usd(zero.fromSavings)} would still be needed. From savings, that is a General Fund draw of ${usd(zero.draw)}, ${usd(zero.draw - draws.y2026)} more than 2026’s. The Town’s policy allows it, and what is left above its floor, at most ${usd(remainingHeadroomCeiling)}, is more than ${Math.floor(remainingHeadroomCeiling / zero.fromSavings)} times that. Raising the other estimates to their three-year lows could cut the draw to ${usd(zero.withOthers.draw)}, but leaves no cushion if any of them falls short.`,
  theRealPoint:
    `On the Supervisor’s ${usd(exampleHome.marketValue)} example home, the Tentative’s town-wide tax is about ${usd(summary.homeTentativeVsZero)} a year more than no increase would be, and the amendments’ about ${usd(summary.homeAmendedVsOne)} more than 1%. Small for one household, the gap is ${usd(summary.zeroBelowTentative)} for the Town. A 1% budget built on revenue the Town actually collects could last. A zero-percent budget paid partly from savings is a one-year choice: whatever comes from savings has to be found again in 2028. GFOA’s recommended practice is to pay recurring costs from recurring revenue, so a draw like that should be adopted as a deliberate choice, not presented as costless.`,
}

export const sources = [
  {
    title: 'Town of Riverhead, 2027 Tentative Budget (PDF)',
    url: LETTER_2027.source.url,
    covers: 'The town-wide levy, tax rates and General Fund savings in its Summary, and the Supervisor’s letter: the 2.79% limit, the $800,000 example home, the retirement incentive and the new positions.',
  },
  {
    title: 'Town of Riverhead, 2027 Budget Supplement (PDF)',
    url: lineSource.url,
    covers: 'Every revenue and spending line: the 2027 estimate, the 2026 budget, what came in by June 30, 2026, and the 2024 and 2025 collections. Earlier Supplements give 2023.',
  },
  {
    title: PACKET.title,
    url: PACKET.url,
    covers: 'The six amendments to the 2027 Preliminary Budget, account by account.',
  },
  {
    title: AUDITED_GENERAL_FUND[2025].source.title,
    url: AUDITED_GENERAL_FUND[2025].source.url,
    covers: 'The General Fund’s unassigned balance at December 31, 2025, and its change in fund balance for 2025.',
  },
  {
    title: AUDITED_GENERAL_FUND[2024].source.title,
    url: AUDITED_GENERAL_FUND[2024].source.url,
    covers: 'The General Fund’s change in fund balance for 2024.',
  },
  {
    title: 'Town of Riverhead, 2026 Adopted Budget',
    url: taxBill.rateSource.url,
    covers: 'The 2026 levy and the tax-rate table used for the rate comparison.',
  },
  ...Object.values(CARRYOVER_SOURCES).map((src) => ({
    title: src.title,
    url: src.url,
    covers: 'How tax cap carryover, the base of the next year’s limit and an override work, and the 2027 growth factors.',
  })),
  {
    title: 'Suffolk County: County Executive Romaine announces no general fund tax increase (September 3, 2026)',
    url: 'https://suffolkcountyny.gov/News/ArtMID/583/ArticleID/15376/Suffolk-County-Executive-Ed-Romaine-Announces-No-General-Fund-Tax-Increase-in-2026-State-of-the-County-Address',
    covers: 'The pledge itself, the reserves and bond upgrades the County credits for it, and the headline/body year discrepancy.',
  },
]
