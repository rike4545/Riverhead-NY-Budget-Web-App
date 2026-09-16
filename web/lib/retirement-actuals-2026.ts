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
// participation, and it is labelled that way everywhere it appears. What it is
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
  /** The modelled eligible-pool member this resolution names, when unambiguous. */
  pool: PoolMember | null
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
          pool: matchPool(surname, sworn),
        }
      }),
  )
  .sort((a, b) => (a.meetingDate < b.meetingDate ? -1 : 1))

/** Retirements accepted before the Board ratified the program — not takers. */
export const beforeProgram = all.filter((r) => r.meetingDate < RATIFIED)
/** Retirements accepted on or after ratification — the participation ceiling. */
export const inWindow = all.filter((r) => r.meetingDate >= RATIFIED)

export const sworn = inWindow.filter((r) => r.sworn)
export const civilian = inWindow.filter((r) => !r.sworn)
export const identified = inWindow.filter((r) => r.pool !== null)

/** The Town's own count of who could take it, from the July 7 briefing. */
export const townEligible = buyout2026.actualEligible

export const uptake = {
  windowRetirements: inWindow.length,
  sworn: sworn.length,
  civilian: civilian.length,
  identifiedByName: identified.length,
  beforeProgram: beforeProgram.length,
  townEligibleTotal: townEligible.total,
  /** Ceiling, not a rate: accepting a retirement is not electing the incentive. */
  shareOfEligibleCeiling: inWindow.length / townEligible.total,
  awaitingVoteRecord: inWindow.filter((r) => r.adopted === null).length,
}

// ── Cost ────────────────────────────────────────────────────────────────────
// Police incentive is $1,000 per year of Town service plus up to 30 accrued
// sick days at the 2024-2026 average base; CSEA is a flat $12,500. Years of
// service come from the eligible-pool model, which derives them from hire date,
// so a retiree matched by name carries a real figure and an unmatched one is
// carried at the CSEA flat rate. The sick-day component is excluded here because
// the published record does not say how much excess accrual anyone has.
const CSEA_FLAT = 12_500

export const incentiveCostFloor = {
  fromIdentified: identified.reduce((s, r) => s + (r.pool?.estIncentive ?? 0), 0),
  fromUnidentifiedAtCseaRate: (inWindow.length - identified.length) * CSEA_FLAT,
  get total() {
    return this.fromIdentified + this.fromUnidentifiedAtCseaRate
  },
  excludes:
    'Up to 30 accrued sick days per sworn retiree, paid at their 2024-2026 average base. The Town publishes no accrual balances, so this site cannot price it. The real cost is higher than the figure above, not lower.',
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
 * Named in a retirement resolution during the window, absent from the modelled
 * eligible pool. Not a matching failure — the pool is built from hire date and
 * union, and real PFRS eligibility also turns on age and service credit the Town
 * does not publish. Someone retiring here is evidence the model's pool, though
 * already an upper bound at 78 against the Town's own 53, still misses people.
 */
export const retiredOutsideModelledPool = inWindow.filter((r) => r.surname !== null && r.pool === null)

export const limits = [
  'A retirement accepted during the incentive window is not proof the retiree elected the incentive. Somebody can retire on their own terms in the same months. Every count here is a ceiling on participation.',
  `${uptake.awaitingVoteRecord} of the ${uptake.windowRetirements} window retirements come from a meeting whose vote record the Clerk has not yet published, so they are filed but not confirmed adopted.`,
  'Savings count salary only. Each retiree keeps Town-paid retiree health for life, and a refilled seat then carries both a retiree and an active employee, so the net figure is smaller than the salary arithmetic shows.',
  'The saving assumes every vacated seat is refilled — which is what the Town said it expects. A seat left empty saves more; a seat filled by promotion from outside the modelled chain saves less.',
  'Civilian retirements in the window are carried at the flat CSEA incentive because the resolutions name a title rather than a person, so they cannot be matched to a years-of-service figure.',
  `${retiredOutsideModelledPool.length > 0 ? `${retiredOutsideModelledPool.length} named retiree${retiredOutsideModelledPool.length === 1 ? ' is' : 's are'} absent from this site's modelled eligible pool` : 'Every named retiree appears in the modelled eligible pool'}. That pool is built from hire date and union; actual retirement eligibility also turns on age and service credit the Town does not publish, so it is neither a superset nor a subset of who could really go.`,
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
