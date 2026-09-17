// How many people actually took the 2026 retirement incentive — read from the
// Town Board's own resolution record rather than estimated.
//
// WHY THIS EXISTS. /buyout/ models the program against an eligible pool and says
// plainly that participation "is unknown until the September 1, 2026 election
// deadline passes". That deadline has passed. Every retirement the Board accepts
// arrives as its own resolution, so the record now answers the question the
// model had to leave open, and the answer can be priced against the same salary
// schedule the model used.
//
// WHAT THIS IS AND IS NOT. A retirement accepted inside the incentive window is
// not proof that the retiree elected the incentive: a person may retire on their
// own terms in the same months. So the count here is an UPPER BOUND on
// participation, and it is labeled that way everywhere it appears. What it is
// not is a guess — every entry is a numbered resolution with a date.
//
// The saving is not the retiree's salary. For a ranked police job the Town must
// keep the rank filled, so a retirement triggers a promotion chain and the only
// seat that actually gets cheaper is the rookie seat at the bottom. That
// correction already lives in buyout-analysis.json and is used here rather than
// recomputed, so the two pages cannot drift apart.

import fiscalIndex from '../public/data/meetings/fiscal-index.json'
import buyout from '../public/data/buyout-analysis.json'
import { buyout2026 } from './buyout-2026'

type Res = {
  number: string | null
  title: string
  category: string
  vote: { adopted: boolean | null } | null
}
type Meeting = { slug: string; meetingDate: string; resolutions: Res[] }

const meetings: Meeting[] = (fiscalIndex.meetings as string[]).map(
  (slug) => require(`../public/data/meetings/${slug}-fiscal.json`) as Meeting,
)

/** The Board ratified all three union stipulations on this date. */
export const RATIFIED = '2026-07-07'
/** Latest effective retirement date the incentive allows. */
export const LAST_EFFECTIVE = '2026-10-01'
/**
 * Last meeting date at which an acceptance can still be an incentive retirement.
 *
 * The window needs an upper bound and did not have one. Every figure here was
 * derived from `meetingDate >= RATIFIED` with nothing on the other side, which
 * is correct only while the corpus stops before the program does. It does not
 * stop: sync-meetings runs twice daily and commits new meetings on its own, so
 * once meetings past October 1 arrive, every ordinary retirement the Board
 * accepts would have been counted as a possible incentive taker, inflating
 * uptake, incentive cost and annual savings indefinitely with nobody in the
 * loop to notice.
 *
 * The right test is the retiree's EFFECTIVE date, and the record does not carry
 * it — "Accepts the Retirement of a Police Officer Brogan" is the whole title.
 * So this bounds on the acceptance date instead, and allows for the Board
 * accepting a retirement after it takes effect: the Town's official calendar
 * puts the two regular meetings after October 1 on October 6 and October 20,
 * and a retirement effective by October 1 should have been accepted by the
 * second of them. Anything later is reported as outside the window rather than
 * priced, which is the conservative direction — it can undercount a very late
 * ratification, where the alternative overcounts every ordinary retirement
 * forever.
 */
export const WINDOW_CLOSES = '2026-10-20'

type PoolMember = {
  name: string
  title: string
  union: string
  program: string
  hireYear: number
  yearsService: number
  base: number
  estIncentive: number
}
const pool = buyout.eligibleEmployees as PoolMember[]

// "Accepts the Retirement of a Police Officer Michael Mowdy", "... Police
// Detective - Henry", "... Police Officer_Lipinsky". The Clerk's separator
// varies; the surname is always last.
const NAMED = /(?:Police\s+(?:Officer|Detective|Sergeant))[\s_\-]+(?:[A-Z][a-z]+\s+)?([A-Z][a-z]+)\s*$/

/**
 * Retirements whose resolution title names only the position.
 *
 * The statement's title field carries "Accepts the Retirement of a Senior
 * Justice Court Clerk" and nothing more, so these could not be matched to the
 * eligible-pool model by parsing alone. The names below were supplied by the
 * site's maintainer from the Board's resolution documents, keyed to the
 * resolution number, and each is verified here against the pool by exact name
 * before it is used.
 *
 * Surname alone would not have sufficed in at least one case: the pool holds
 * both a Maribeth Vail (Senior Justice Court Clerk, CSEA) and a John H Vail
 * (Sergeant, SOA), and the position is what separates them.
 */
const NAMED_BY_RESOLUTION: Record<string, string> = {
  '2026-783': 'DeFilippis, Theresa A', // Network and Systems Specialist II
  '2026-822': 'Vail, Maribeth', // Senior Justice Court Clerk
  '2026-852': 'Wulffraat, Lisa M', // Account Clerk
}
const IS_RETIREMENT = /\bretirement\b/i
const SWORN = /police\s+(officer|detective|sergeant)/i

export type ActualRetirement = {
  meetingDate: string
  number: string | null
  title: string
  /** Surname parsed from the resolution title, where the Clerk published one. */
  surname: string | null
  sworn: boolean
  adopted: boolean | null
  /** The modeled eligible-pool member this resolution names, when unambiguous. */
  pool: PoolMember | null
  /** Matched via the curated map rather than from the resolution title itself. */
  namedFromDocument?: boolean
}

/** An exact pool name, for a retiree the resolution title did not name. */
function matchPoolByFullName(name: string | undefined): PoolMember | null {
  return name ? pool.find((p) => p.name === name) ?? null : null
}

function matchPool(surname: string | null, sworn: boolean): PoolMember | null {
  if (!surname) return null
  const hits = pool.filter(
    (p) =>
      p.name.toLowerCase().startsWith(`${surname.toLowerCase()},`) &&
      (sworn ? /police|detective|sergeant|lieutenant|captain/i.test(p.title) : true),
  )
  return hits.length === 1 ? hits[0] : null
}

const all: ActualRetirement[] = meetings
  .flatMap((m) =>
    m.resolutions
      .filter((r) => r.category === 'personnel-out' && IS_RETIREMENT.test(r.title))
      .map((r) => {
        const surname = NAMED.exec(r.title)?.[1] ?? null
        const sworn = SWORN.test(r.title)
        return {
          meetingDate: m.meetingDate,
          number: r.number,
          title: r.title,
          surname,
          sworn,
          adopted: r.vote?.adopted ?? null,
          pool: matchPool(surname, sworn) ?? matchPoolByFullName(r.number ? NAMED_BY_RESOLUTION[r.number] : undefined),
          namedFromDocument: r.number != null && NAMED_BY_RESOLUTION[r.number] != null,
        }
      }),
  )
  .sort((a, b) => (a.meetingDate < b.meetingDate ? -1 : 1))

/** Retirements accepted before the Board ratified the program — not takers. */
export const beforeProgram = all.filter((r) => r.meetingDate < RATIFIED)
/** Retirements accepted inside the incentive window — the participation ceiling. */
export const inWindow = all.filter(
  (r) => r.meetingDate >= RATIFIED && r.meetingDate <= WINDOW_CLOSES,
)
/**
 * Accepted after the window closed. Reported, never priced: on the record this
 * site can see, an ordinary retirement and a late incentive ratification look
 * identical, so neither is claimed.
 */
export const afterWindow = all.filter((r) => r.meetingDate > WINDOW_CLOSES)

/**
 * Confirmed by a published vote record — the only set the headline figures use.
 *
 * This site's standing rule, stated on /fiscal-impact/, is that it does not
 * infer adoption from agenda placement. Four of the window retirements come
 * from a meeting whose vote record the Clerk has not published, and an earlier
 * version of this file counted them in the headline anyway: it reported 10
 * accepted retirements and priced 7 sworn ones, when 6 and 4 were confirmed.
 * Pending items are reported, separately, and never priced.
 */
export const confirmed = inWindow.filter((r) => r.adopted === true)
/** No published vote record yet — outcome unknown, so never priced. */
export const pending = inWindow.filter((r) => r.adopted === null)
/**
 * Decided and NOT adopted. A separate fact from "awaiting a record", and an
 * earlier version of this file conflated the two by testing `!== true`: a
 * rejected or tabled retirement would have inflated the awaiting-confirmation
 * count and the if-confirmed scenario, while the table withheld its pending
 * badge because that correctly tested for null. Nothing in the corpus is
 * rejected today; the three sets partition the window so nothing can be.
 */
export const rejected = inWindow.filter((r) => r.adopted === false)

export const sworn = confirmed.filter((r) => r.sworn)
export const civilian = confirmed.filter((r) => !r.sworn)
export const swornPending = pending.filter((r) => r.sworn)
export const identified = confirmed.filter((r) => r.pool !== null)

/** The Town's own count of who could take it, from the July 7 briefing. */
export const townEligible = buyout2026.actualEligible

export const uptake = {
  /** Confirmed by a published vote record. */
  windowRetirements: confirmed.length,
  sworn: sworn.length,
  civilian: civilian.length,
  identifiedByName: identified.length,
  beforeProgram: beforeProgram.length,
  townEligibleTotal: townEligible.total,
  /** Ceiling, not a rate: accepting a retirement is not electing the incentive. */
  shareOfEligibleCeiling: confirmed.length / townEligible.total,
  /** Filed but not yet confirmed adopted. Reported, never priced. */
  awaitingVoteRecord: pending.length,
  swornAwaitingVoteRecord: swornPending.length,
  /** Decided and not adopted — never counted as awaiting anything. */
  rejected: rejected.length,
  /** What the count would be if every item still awaiting a record is confirmed. */
  ifPendingConfirmed: confirmed.length + pending.length,
  /** Accepted after the window closed — outside the program, never priced. */
  acceptedAfterWindow: afterWindow.length,
  ifPendingConfirmedSworn: sworn.length + swornPending.length,
}

// ── Cost ────────────────────────────────────────────────────────────────────
// Police incentive is $1,000 per year of Town service plus up to 30 accrued
// sick days at the 2024-2026 average base; CSEA is a flat $12,500. Years of
// service come from the eligible-pool model, which derives them from hire date,
// so a retiree matched by name carries a real figure and an unmatched one is
// carried at the CSEA flat rate. The sick-day component is excluded here because
// the published record does not say how much excess accrual anyone has.
const CSEA_FLAT = 12_500
// PFRS requires 20 years of law-enforcement service to retire, and the police
// incentive pays $1,000 per year of Town service, so no sworn retiree can carry
// less than this. An earlier version fell back to the CSEA flat rate for an
// unmatched sworn officer, which is the wrong formula and understated him.
const SWORN_MINIMUM = 20_000

/**
 * NOT a floor, and an earlier version of this file was wrong to call it one.
 *
 * The incentive is paid only to someone who elected it, and this module says in
 * its own header that accepting a retirement does not prove election. Both
 * cannot be true at once: if none of these retirees elected, the cost is zero.
 * So the real lower bound IS zero, and the figure below is what the incentive
 * costs IF every confirmed retirement in the window took it — a scenario, priced
 * with the Town's own formula, and labeled as one.
 */
export const incentiveCostIfAllElected = {
  fromIdentified: identified.reduce((s, r) => s + (r.pool?.estIncentive ?? 0), 0),
  fromUnidentifiedCivilianAtCseaRate:
    confirmed.filter((r) => r.pool === null && !r.sworn).length * CSEA_FLAT,
  fromUnidentifiedSwornAtMinimum:
    confirmed.filter((r) => r.pool === null && r.sworn).length * SWORN_MINIMUM,
  unidentifiedSworn: confirmed.filter((r) => r.pool === null && r.sworn).length,
  get total() {
    return (
      this.fromIdentified +
      this.fromUnidentifiedCivilianAtCseaRate +
      this.fromUnidentifiedSwornAtMinimum
    )
  },
  /** The defensible lower bound, absent election records. */
  trueFloor: 0,
  basis:
    'Years of service come from the eligible-pool model for a retiree matched by name. An unmatched civilian is carried at the flat CSEA rate; an unmatched sworn officer at the $20,000 implied by the 20 years of PFRS-qualifying service the incentive requires, which is a minimum and not an estimate.',
  excludes:
    'Up to 30 accrued sick days per sworn retiree, paid at their 2024-2026 average base. The Town publishes no accrual balances, so this site cannot price it — the scenario above is understated to that extent.',
  whyNotAFloor:
    'The Town does not publish who elected the incentive, only whose retirement the Board accepted. Without election records the lower bound on incentive cost is zero, and calling this figure a floor would assert participation the record does not show.',
}

// ── Saving ──────────────────────────────────────────────────────────────────
// Not the retiree's salary. buyout-analysis.json works out that a ranked police
// retirement keeps the rank filled by promotion and only frees the rookie seat
// at the bottom of the chain, which is worth top-step officer minus entry step.
const chain = buyout.policeChain as {
  officerEntryStep: number
  officerTopStep: number
  ranked: { perRetiree: number }
}

export const savingEstimate = {
  perSwornRetirement: chain.ranked.perRetiree,
  swornCount: sworn.length,
  annualFromSworn: sworn.length * chain.ranked.perRetiree,
  /** If the pending September 15 retirements are later confirmed. */
  swornCountIfPendingConfirmed: uptake.ifPendingConfirmedSworn,
  annualIfPendingConfirmed: uptake.ifPendingConfirmedSworn * chain.ranked.perRetiree,
  officerTopStep: chain.officerTopStep,
  officerEntryStep: chain.officerEntryStep,
  /** These retirements are effective July-October 2026, so 2026 catches part of
   *  a year and 2027 is the first budget that carries the whole saving. */
  firstFullYear: 2027,
  townEstimate: buyout2026.estimatedSavings,
  note:
    'A sworn retirement is worth a top-step officer minus a rookie, not the retiree’s own rank salary minus a rookie — the rank itself stays filled by promotion. Civilian retirements are not priced here because the resolutions do not name the individual.',
}

/**
 * Named in a retirement resolution during the window, absent from the modeled
 * eligible pool. Not a matching failure — the pool is built from hire date and
 * union, and real PFRS eligibility also turns on age and service credit the Town
 * does not publish. Someone retiring here is evidence the model's pool, though
 * already an upper bound at 78 against the Town's own 53, still misses people.
 */
export const retiredOutsideModeledPool = inWindow.filter((r) => r.surname !== null && r.pool === null)

export const limits = [
  'A retirement accepted during the incentive window is not proof the retiree elected the incentive. Somebody can retire on their own terms in the same months. Every count here is a ceiling on participation.',
  `A further ${uptake.awaitingVoteRecord} retirements (${uptake.swornAwaitingVoteRecord} of them sworn) were filed at a meeting whose vote record the Clerk has not published. They are excluded from every figure here, because this site does not infer adoption from agenda placement. If all are later confirmed the count becomes ${uptake.ifPendingConfirmed} and the annual saving ${savingEstimate.annualIfPendingConfirmed.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}.`,
  'Savings count salary only. Each retiree keeps Town-paid retiree health for life, and a refilled seat then carries both a retiree and an active employee, so the net figure is smaller than the salary arithmetic shows.',
  'The saving assumes every vacated seat is refilled — which is what the Town said it expects. A seat left empty saves more; a seat filled by promotion from outside the modeled chain saves less.',
  'Civilian retirements in the window are carried at the flat CSEA incentive because the resolutions name a title rather than a person, so they cannot be matched to a years-of-service figure.',
  `${retiredOutsideModeledPool.length > 0 ? `${retiredOutsideModeledPool.length} named retiree${retiredOutsideModeledPool.length === 1 ? ' is' : 's are'} absent from this site's modeled eligible pool` : 'Every named retiree appears in the modeled eligible pool'}. That pool is built from hire date and union; actual retirement eligibility also turns on age and service credit the Town does not publish, so it is neither a superset nor a subset of who could really go.`,
]

export const sources = [
  {
    title: 'Town of Riverhead Town Board resolutions accepting retirements, 2026',
    url: 'https://www.townofriverheadny.gov/129/Agendas-Minutes',
    covers: `Every retirement the Board accepted in 2026: ${beforeProgram.length} before the July 7 ratification and ${inWindow.length} after it.`,
  },
  {
    title: buyout2026.source.title,
    url: buyout2026.source.url,
    covers: `The Town's own eligibility count (${townEligible.total}: ${townEligible.csea} CSEA, ${townEligible.pba} PBA, ${townEligible.soa} SOA) and its $${(buyout2026.estimatedSavings.low / 1000).toFixed(0)}k-$${(buyout2026.estimatedSavings.high / 1000).toFixed(0)}k savings estimate.`,
  },
]
