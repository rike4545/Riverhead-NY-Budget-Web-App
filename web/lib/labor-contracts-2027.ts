// Which bargaining units have a 2027 wage rate the Town has actually signed —
// checked against the Board's own resolution record, not assumed.
//
// WHY THIS EXISTS. The 2027 projection applies a raise to each union's payroll.
// For CSEA that raise is contractual: the 2026-2029 agreement is executed and
// names 2027. For the PBA and the SOA the 2023-2026 agreements expire 12/31/2026
// and the projection falls back to each unit's trailing average — a placeholder.
//
// A placeholder is only honest if somebody checked. This file checks: it reads
// every labor-agreement resolution the Board passed in the corpus and reports,
// per unit, whether anything that could be a successor came before it. The
// answer for PBA and SOA is that nothing did, and that is a finding worth
// stating rather than an assumption worth hiding.
//
// LIMITS OF THE CHECK. A resolution title says which union, not what the
// document does. A "stipulation" can be a full successor agreement or a narrow
// side letter about one employee, and the Town does not publish the documents.
// So this file reports what the Board was asked to approve and never claims to
// know what was inside it.

import fiscalIndex from '../public/data/meetings/fiscal-index.json'
import { realRaiseExamples } from './pba-step-schedule'

type Res = {
  number: string | null
  title: string
  category: string
  vote: { adopted: boolean | null } | null
}
type Meeting = { meetingDate: string; resolutions: Res[] }

const meetings: Meeting[] = (fiscalIndex.meetings as string[]).map(
  (slug) => require(`../public/data/meetings/${slug}-fiscal.json`) as Meeting,
)

export type Unit = 'CSEA' | 'PBA' | 'SOA'

const UNIT_PATTERNS: Record<Unit, RegExp> = {
  CSEA: /\bcsea\b|civil service employees/i,
  PBA: /police benevolent|\bpba\b/i,
  SOA: /superior officers|\bsoa\b/i,
}

// A resolution that could carry wage terms. Donations from a union, and
// appointments of its members, are not labour agreements.
const AGREEMENT = /\b(agreement|stipulation|memorandum of agreement|\bmoa\b|collective bargaining|contract)\b/i
const NOT_AGREEMENT = /\b(donation|donate|sponsorship|appoint|retirement of)\b/i

export type UnitResolution = {
  meetingDate: string
  number: string | null
  title: string
  adopted: boolean | null
  /** The July 7 retirement-incentive stipulations, which are not wage contracts. */
  isRetirementIncentive: boolean
}

const RETIREMENT_INCENTIVE_DATE = '2026-07-07'

function forUnit(unit: Unit): UnitResolution[] {
  const re = UNIT_PATTERNS[unit]
  return meetings
    .flatMap((m) =>
      m.resolutions
        .filter((r) => re.test(r.title) && AGREEMENT.test(r.title) && !NOT_AGREEMENT.test(r.title))
        .map((r) => ({
          meetingDate: m.meetingDate,
          number: r.number,
          title: r.title,
          adopted: r.vote?.adopted ?? null,
          isRetirementIncentive: m.meetingDate === RETIREMENT_INCENTIVE_DATE,
        })),
    )
    .sort((a, b) => (a.meetingDate < b.meetingDate ? -1 : 1))
}

export type UnitStatus = {
  unit: Unit
  /** What the projection uses for 2027: a signed rate, or a trailing average. */
  contractual2027: boolean
  contractTerm: string
  expiry: string | null
  resolutions: UnitResolution[]
  /** Agreements that are not the retirement incentive — successor candidates. */
  candidates: UnitResolution[]
  finding: string
}

export const units: UnitStatus[] = [
  {
    unit: 'CSEA',
    contractual2027: true,
    contractTerm: '2026–2029 CSEA agreement',
    expiry: '2029-12-31',
    resolutions: forUnit('CSEA'),
    candidates: forUnit('CSEA').filter((r) => !r.isRetirementIncentive),
    finding:
      'Signed and before the Board. The 2026–2029 agreement names 2027 — 2.5% plus a flat $1,000 that compounds into later years — so the projection uses a contractual figure for this unit, not an estimate.',
  },
  {
    unit: 'PBA',
    contractual2027: false,
    contractTerm: '2023–2026 PBA memorandum of agreement',
    expiry: '2026-12-31',
    resolutions: forUnit('PBA'),
    candidates: forUnit('PBA').filter((r) => !r.isRetirementIncentive),
    finding:
      'Nothing that could be a successor has come before the Board this year. The only PBA item in the record is the July 7 retirement-incentive stipulation, which pays people to leave and sets no wage rate. The contract runs out on December 31, 2026.',
  },
  {
    unit: 'SOA',
    contractual2027: false,
    contractTerm: '2023–2026 SOA agreement',
    expiry: '2026-12-31',
    resolutions: forUnit('SOA'),
    candidates: forUnit('SOA').filter((r) => !r.isRetirementIncentive),
    finding:
      'Same as the PBA: the only SOA item this year is the July 7 retirement-incentive stipulation. No successor wage agreement has been put to a vote, and the contract expires December 31, 2026.',
  },
]

// ── What an expired contract actually costs ─────────────────────────────────
//
// THE INSTINCT IS WRONG. A contract running out does not freeze the payroll.
// New York's Taylor Law, at Civil Service Law § 209-a(1)(e) — the Triborough
// Amendment — makes it an improper practice for a public employer "to refuse to
// continue all the terms of an expired agreement until a new agreement is
// negotiated". The only exception in the text is a union that has struck in
// violation of § 210.
//
// So on January 1, 2027, with no successor signed, the 2026 PBA agreement keeps
// running. Two consequences pull in opposite directions and both are real:
//
//   STEPS CONTINUE. The step ladder is a term of the agreement, so an officer
//   still advances along it. That is money the Town owes with no new contract
//   and no vote.
//
//   THE SCHEDULE DOES NOT MOVE. An across-the-board increase raises the ladder
//   itself, and that is what a successor negotiates. Until one is signed the
//   2026 rates stand.
//
// The step cost is computed from the Board's own authorized-salary listings:
// where each officer sat after the 2026 move, advanced one rung at 2026 rates.
const STEP_ORDER = [
  'Academy',
  '1st Year Officer',
  '2nd Year Officer',
  '3rd Year Officer',
  '4th Year Officer',
  '5th Year Officer',
  '6th Year Officer (top step)',
] as const

export const triborough = (() => {
  // Where officers sit after the 2025->2026 move is each row's destination step.
  const rate = new Map<string, number>()
  const count = new Map<string, number>()
  for (const r of realRaiseExamples) {
    rate.set(r.toStep, r.actual2026)
    count.set(r.toStep, (count.get(r.toStep) ?? 0) + r.officerCount)
  }

  const rungs: { from: string; to: string; officers: number; perOfficer: number; cost: number }[] = []
  for (let i = 0; i < STEP_ORDER.length - 1; i++) {
    const from = STEP_ORDER[i]
    const to = STEP_ORDER[i + 1]
    const officers = count.get(from) ?? 0
    const a = rate.get(from)
    const b = rate.get(to)
    if (!officers || a == null || b == null) continue
    rungs.push({ from, to, officers, perOfficer: b - a, cost: officers * (b - a) })
  }

  const topStep = STEP_ORDER[STEP_ORDER.length - 1]
  const atTop = count.get(topStep) ?? 0
  const moving = rungs.reduce((n, r) => n + r.officers, 0)
  return {
    statute: 'NY Civil Service Law § 209-a(1)(e) (Taylor Law, Triborough Amendment)',
    statuteUrl: 'https://www.nysenate.gov/legislation/laws/CVS/209-A',
    statuteQuote: 'to refuse to continue all the terms of an expired agreement until a new agreement is negotiated',
    rungs,
    stepCost2027: rungs.reduce((sum, r) => sum + r.cost, 0),
    officersMoving: moving,
    officersAtTopStep: atTop,
    officersCounted: moving + atTop,
    scope: 'Police Officer ladder only',
    reading:
      'An expired contract is not a pay freeze. Step movement is a term of the agreement and it continues, so the Town owes this in 2027 whether or not anything is signed. What does not continue is the across-the-board increase: that raises the ladder itself, and the ladder stays at its 2026 rates until a successor is negotiated.',
    caveats: [
      'The Police Officer ladder only. Detectives, sergeants and the superior-officer unit move on their own schedules, which this figure does not include, so the real Triborough cost is higher.',
      'Officers at the top step — the largest single group — get nothing from step movement. The cost is concentrated in the officers still climbing.',
      'Seven sworn retirements were accepted between July and October 2026, several of them top-step. Those seats change the roster this is computed from, and the two effects have to be read together rather than added up.',
      'Step placement is inferred from where each officer landed in the 2025-to-2026 authorized-salary comparison. The Town does not publish a step roster.',
    ],
  }
})()

export const placeholderVsFloor =
  'This matters for how the projection above should be read. For the PBA and the SOA it applies each unit’s ' +
  'trailing average raise, which is an across-the-board figure — so it is modelling a SETTLEMENT, at roughly ' +
  'the rate the last one landed. Triborough gives the other bound: the floor the Town owes if nothing is ' +
  'signed at all. Neither is a forecast. The real 2027 number sits somewhere between them, and which end it ' +
  'lands nearer depends on a negotiation that is not public.'

export const openUnits = units.filter((u) => !u.contractual2027)
export const settledUnits = units.filter((u) => u.contractual2027)

export const corpus = {
  meetings: meetings.length,
  resolutions: meetings.reduce((n, m) => n + m.resolutions.length, 0),
  earliest: [...(fiscalIndex.meetings as string[])].sort()[0],
  latest: [...(fiscalIndex.meetings as string[])].sort().slice(-1)[0],
}

export const headline =
  `Of the Town's three bargaining units, ${settledUnits.length} has a signed 2027 wage rate and ` +
  `${openUnits.length} do not. The ${openUnits.map((u) => u.unit).join(' and ')} contracts expire on ` +
  `December 31, 2026, and across ${corpus.resolutions.toLocaleString()} resolutions in ` +
  `${corpus.meetings} meetings no successor for either has been put to the Board.`

export const whyItMatters =
  'These are the police units, and police is the largest single department in the General Fund. The 2027 ' +
  'projection has to put some number against their payroll, so it uses each unit’s own trailing average raise ' +
  'as a placeholder. That is a defensible stand-in and it is still a guess — the difference between the ' +
  'placeholder and a settlement is real money on the levy, and nobody will know which until an agreement is ' +
  'signed. A page that showed the projected figure without saying this would be presenting an estimate as a fact.'

export const limits = [
  'A resolution title names the union, not what the document does. A "stipulation" can be a full successor agreement or a narrow side letter about a single employee, and the Town does not publish the underlying documents, so this check reports what the Board was asked to approve and not what was inside it.',
  'Negotiations are not public and need not reach the Board until they conclude. Nothing here implies that talks are not happening — only that nothing has been voted on.',
  'The check covers the meetings this site has parsed. A successor agreement approved at a meeting outside that range would not appear.',
]
