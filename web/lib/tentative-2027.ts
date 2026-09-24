// The site's 2027 projection against the Town's own 2027 Tentative Budget.
//
// Before the Tentative is published this module describes the projection and
// the record of how far past Tentatives moved before adoption. Once the
// Tentative is parsed -- the deploy that discovers it runs
// parse_budget_stages.py and parse_budget_requests.py -- stageDoc(2027,
// 'tentative') returns it and every comparison below populates with no code
// change. Nothing here is written in by hand about 2027: if the Tentative has
// not been parsed, the page says so rather than guessing.
//
// Two bases, one sum. The projection's 2026 totals ($121,110,904 appropriated,
// $65,343,939 levied) are the Town's own 19-fund Summary figures to the dollar,
// so fund-by-fund comparison is like for like. Both include interfund items
// such as debt service and internal service funds, so they compare budgets
// rather than state what the Town spends.
//
// Three other measures, each the Town's own. The town-wide levy and tax rate
// are the Summary's "Total Town Wide" rows (General Fund, Highway and Street
// Lighting; the special districts are outside them), read as printed. Spending
// "not counting transfers" leaves out the three funds paid for entirely by the
// others, which is how the Supervisor's letter counts it. And the tax cap limit
// is the figure the letter gives, which no table in the budget prints; the
// letter is a scanned image, read by hand in tentative-letters.ts.

import prediction from '../public/data/budget-2027-prediction.json'
import requestsJson from '../public/data/budget-supplement/requests-by-year.json'
import { stageDoc, tentativeToAdopted, operatingAppropriations, type StageDoc } from './budget-stages'
import { READ_BY_HAND } from './tentative-letters'

export const YEAR = 2027
export const PRIOR = 2026

export const projection = {
  appropriations2026: prediction.totals.appropriations2026,
  appropriations2027: prediction.totals.appropriations2027,
  appropriationsPct: prediction.totals.pct,
  levy2026: prediction.levyEstimate.levy2026,
  levy2027: prediction.levyEstimate.levy2027,
  levyPct: prediction.levyEstimate.levyIncreasePct,
  // A 2% reference, not the legal limit. New York's levy limit applies a
  // tax-base growth factor, PILOT receivables, carryover and exclusions; the
  // Town files the real figure with the State Comptroller before adoption and
  // prints it in none of its budget documents. /tax-cap/ explains the formula.
  referenceLevy: prediction.capGap.allowedLevy,
  referencePct: prediction.capGap.capBasePct,
  referenceGap: prediction.capGap.gap,
  byFund: prediction.byFund as { fundCode: string; fund: string; v2026: number; v2027: number; delta: number; pct: number }[],
}

/** The 2027 Tentative, once the Town has published it and the parser has read it. */
export const tentative: StageDoc | null = stageDoc(YEAR, 'tentative')
export const adoptedPrior: StageDoc | null = stageDoc(PRIOR, 'adopted')
export const released = tentative !== null

/** The tax cap limit as the Supervisor's letter gives it, once the letter has been read. */
export const statedLimitPct: number | null = READ_BY_HAND[YEAR]?.statedLimitPct ?? null

export type FundComparison = {
  code: string
  name: string
  adopted2026: number | null
  projected: number | null
  tentative: number
  vsProjection: number | null
  vsProjectionPct: number | null
  vsPrior: number | null
  vsPriorPct: number | null
}

const pct = (a: number, b: number) => (b === 0 ? null : ((a - b) / b) * 100)

/** Fund by fund: the Tentative against both the projection and last year's adopted budget. */
export function fundComparison(t: StageDoc | null = tentative): FundComparison[] {
  if (!t) return []
  const proj = new Map(projection.byFund.map((f) => [f.fundCode, f]))
  return Object.entries(t.funds)
    .map(([code, f]) => {
      const p = proj.get(code)
      const prior = adoptedPrior?.funds[code]?.appropriations ?? null
      return {
        code,
        name: f.name,
        adopted2026: prior,
        projected: p ? p.v2027 : null,
        tentative: f.appropriations,
        vsProjection: p ? f.appropriations - p.v2027 : null,
        vsProjectionPct: p ? pct(f.appropriations, p.v2027) : null,
        vsPrior: prior !== null ? f.appropriations - prior : null,
        vsPriorPct: prior !== null ? pct(f.appropriations, prior) : null,
      }
    })
    .sort((a, b) => b.tentative - a.tentative)
}

/** The headline figures, computed only from what the Tentative prints. */
export function headline(t: StageDoc | null = tentative) {
  if (!t) return null
  const levy = t.totals.levy
  const appropriations = t.totals.appropriations
  const priorLevy = adoptedPrior?.totals.levy ?? projection.levy2026
  const priorApprop = adoptedPrior?.totals.appropriations ?? projection.appropriations2026
  const gf = t.funds.A01
  const gfPrior = adoptedPrior?.funds.A01
  const tw = t.townWide ?? null
  const op = operatingAppropriations(t)
  const opPrior = operatingAppropriations(adoptedPrior)
  const debt = t.funds.V01
  const debtPrior = adoptedPrior?.funds.V01
  // Every taxing district's levy against its own prior levy, to set beside the limit the letter gives.
  const districts = Object.entries(t.funds).flatMap(([code, f]) => {
    const before = adoptedPrior?.funds[code]?.levy
    return f.levy && before ? [{ code, name: f.name, pct: ((f.levy - before) / before) * 100 }] : []
  })
  const steepest = districts.length ? districts.reduce((a, b) => (b.pct > a.pct ? b : a)) : null
  return {
    appropriations,
    appropriationsPct: pct(appropriations, priorApprop),
    appropriationsVsProjection: appropriations - projection.appropriations2027,
    levy,
    priorLevy,
    /** What holding the levy flat would take: the Tentative's increase over the prior levy. */
    levyOverPrior: levy - priorLevy,
    levyPct: pct(levy, priorLevy),
    levyVsProjection: levy - projection.levy2027,
    levyVsReference: levy - projection.referenceLevy,
    fundBalance: t.totals.fundBalance,
    fundBalancePrior: adoptedPrior?.totals.fundBalance ?? null,
    generalFund: gf
      ? {
          appropriations: gf.appropriations,
          levy: gf.levy,
          fundBalance: gf.fundBalance,
          levyPct: gfPrior?.levy ? pct(gf.levy ?? 0, gfPrior.levy) : null,
          levyOverPrior: gf.levy !== null && gfPrior?.levy ? gf.levy - gfPrior.levy : null,
          fundBalancePrior: gfPrior?.fundBalance ?? null,
        }
      : null,
    fundsWithoutLevyColumn: t.totals.fundsWithoutLevyColumn,
    source: t.source,
    /** The Summary's "Total Town Wide" rows: General Fund, Highway and Street Lighting. */
    townWide: tw
      ? {
          levy: tw.levy,
          priorLevy: tw.priorLevy,
          levyPct: pct(tw.levy, tw.priorLevy),
          appropriations: tw.appropriations,
          priorAppropriations: tw.priorAppropriations,
          appropriationsPct: pct(tw.appropriations, tw.priorAppropriations),
          rate: tw.rate,
          priorRate: tw.priorRate,
          ratePct: pct(tw.rate, tw.priorRate),
          generalFundRate: tw.fundRates?.A01 ?? null,
        }
      : null,
    /** Spending not counting the three funds paid for by the others, as the Supervisor's letter counts it. */
    operating: op !== null && opPrior !== null ? { appropriations: op, prior: opPrior, delta: op - opPrior, pct: pct(op, opPrior) } : null,
    debtService: debt && debtPrior ? { appropriations: debt.appropriations, prior: debtPrior.appropriations } : null,
    districts,
    steepestDistrict: steepest,
    statedLimitPct,
    /** Whether any district's levy rises past the letter's limit, compared at the letter's two decimals. */
    withinStatedLimit: statedLimitPct !== null && steepest ? Number(steepest.pct.toFixed(2)) <= statedLimitPct : null,
  }
}

// ── For the pages built on the projection ─────────────────────────────────────
// Every page that quotes the projection says the same thing about the Tentative
// once it is out, in the same words, so the figures below are the only ones
// those pages use. Null until then, and each page shows its projection alone.

/** The Tentative's headline figures, or null until it is parsed. */
export const released2027 = headline()

const dollars = (n: number) => `$${Math.round(Math.abs(n)).toLocaleString('en-US')}`

/** "$1,306,879 more than", "$1,306,879 less than", or "the same as". */
export function gapPhrase(n: number): string {
  if (Math.round(n) === 0) return 'the same as'
  return `${dollars(n)} ${n > 0 ? 'more' : 'less'} than`
}

/** "up 3.2% from", "down 0.4% from", or "unchanged from". */
export function changePhrase(p: number | null, digits = 1): string {
  if (p === null || Math.abs(p) < 0.5 * 10 ** -digits) return 'unchanged from'
  return `${p > 0 ? 'up' : 'down'} ${Math.abs(p).toFixed(digits)}% from`
}

type Headline = NonNullable<ReturnType<typeof headline>>

/**
 * The Tentative's levy in a few sentences, used by every page that mentions it:
 * the town-wide levy, the levy with the special districts against this site's
 * forecast, and where it stands against the limit the Supervisor's letter
 * gives. Before the letter is read, the 2% reference line stands in for the
 * limit, and says it is only a reference.
 */
export function levySentence(h: Headline): string {
  const tw = h.townWide
  const lead = tw
    ? `It proposes a town-wide tax levy of ${dollars(tw.levy)}, ${changePhrase(tw.levyPct, 2)} ${PRIOR}, for the General Fund, Highway and Street Lighting. With the special districts, the levy is ${dollars(h.levy)}, `
    : `It proposes a tax levy of ${dollars(h.levy)} across all funds, `
  const forecast = `${changePhrase(h.levyPct, 2)} ${PRIOR} and ${gapPhrase(h.levyVsProjection)} this site’s forecast of ${dollars(projection.levy2027)}.`
  if (h.statedLimitPct === null) {
    return `${lead}${forecast} It is ${gapPhrase(h.levyVsReference)} a ${projection.referencePct}% increase, a reference line rather than the legal limit.`
  }
  const check = h.withinStatedLimit
    ? ', and no district’s levy rises by more than that'
    : h.steepestDistrict ? `, but the ${h.steepestDistrict.name}’s levy rises ${h.steepestDistrict.pct.toFixed(2)}%` : ''
  return `${lead}${forecast} The Supervisor’s letter says every taxing district is within the tax cap limit of ${h.statedLimitPct}%${check}.`
}

/**
 * Spending, counted two ways. All nineteen funds is the budget's own total; it
 * includes the three funds paid for by the others, so a fall in debt payments
 * reads as a cut. Not counting them is how the Supervisor's letter counts it.
 */
export function spendingSentence(h: Headline): string {
  const all = `Counting all ${tentative ? Object.keys(tentative.funds).length : 19} funds, it appropriates ${dollars(h.appropriations)}, ${changePhrase(h.appropriationsPct)} ${PRIOR}.`
  if (!h.operating) return all
  const debt = h.debtService && h.debtService.appropriations < h.debtService.prior
    ? ` The Debt Service Fund, paid for by transfers from the other funds, falls ${dollars(h.debtService.prior - h.debtService.appropriations)}.`
    : ''
  return (
    `Not counting transfers between funds, it spends ${dollars(h.operating.appropriations)}, ${changePhrase(h.operating.pct)} ${PRIOR} ` +
    `(${h.operating.delta >= 0 ? '+' : '−'}${dollars(h.operating.delta)}). ${all}${debt}`
  )
}

// ── How far a Tentative has moved before adoption ─────────────────────────────
export const stability = tentativeToAdopted.map((x) => ({
  year: x.year,
  fundsChanged: x.fundsChanged,
  fundsCompared: x.fundsCompared,
  appropriationsDelta: x.appropriations.delta,
  appropriationsPct: x.appropriations.from ? (x.appropriations.delta / x.appropriations.from) * 100 : 0,
  levyDelta: x.levy.delta,
}))
export const unchangedYears = stability.filter((s) => s.fundsChanged === 0).map((s) => s.year)

// ── What departments asked for, and what the Tentative gave them ──────────────
type RequestYear = {
  year: number
  expenditure: { lines: number; request: number; tentative: number; delta: number; cutLines: number; cutAmount: number; raisedLines: number; raisedAmount: number }
  largestCuts: { account: string; name: string; fund: string; request: number; tentative: number }[]
  largestRaises: { account: string; name: string; fund: string; request: number; tentative: number }[]
  reconciliation: { complete: boolean; gap?: number; reason?: string }
  source: { title: string; url: string }
}
const requests = requestsJson as unknown as { completeYears: number[]; byYear: Record<string, RequestYear> }

/**
 * Who each Tentative was prepared under. Town Law s.103(2) makes the
 * Supervisor the budget officer, and lets the Supervisor -- not the Board --
 * appoint someone else "to serve at his pleasure". Riverhead's schedules carry
 * a Town Budget Officer, so the Tentative is prepared by the Supervisor's own
 * appointee: the Supervisor's recommendation either way. It is prepared in
 * September of the year before, so the 2025 Tentative is Supervisor Hubbard's
 * first and the 2027 Tentative is Supervisor Halpin's first.
 */
/**
 * The Supervisor's own account of the job, on the Town's Supervisor's Office
 * page: "Chief Executive Officer, Police Commissioner, Chief Financial Officer
 * and Chairperson of the Town Board", responsible for "accounting, budgeting,
 * payroll and personnel". The same page lists the Chief of Staff as Budget
 * Officer, the appointee s.103(2) allows.
 */
export const SUPERVISOR_ROLE_SOURCE = {
  label: 'Town of Riverhead, Supervisor’s Office',
  url: 'https://www.townofriverheadny.gov/245/Supervisors-Office',
}

export const PREPARED_UNDER: Record<number, string> = {
  2024: 'Supervisor Yvette Aguiar',
  2025: 'Supervisor Tim Hubbard',
  2026: 'Supervisor Tim Hubbard',
  2027: 'Supervisor Jerry Halpin',
}

/** Only Supplements whose lines add up to their own Tentative. A partial parse is withheld. */
export const requestHistory = requests.completeYears
  .map((y) => requests.byYear[String(y)])
  .filter(Boolean)
  .map((r) => ({
    year: r.year,
    preparedUnder: PREPARED_UNDER[r.year] ?? null,
    ...r.expenditure,
    deltaPct: r.expenditure.request ? (r.expenditure.delta / r.expenditure.request) * 100 : 0,
    largestCuts: r.largestCuts.slice(0, 6),
    largestRaises: r.largestRaises.slice(0, 6),
    source: r.source,
  }))

/** The 2027 Supplement, if published: present-but-incomplete is reported, never totalled. */
export const supplement2027 = (() => {
  const r = requests.byYear[String(YEAR)]
  if (!r) return { state: 'absent' as const }
  return r.reconciliation.complete ? { state: 'complete' as const } : { state: 'incomplete' as const, gap: r.reconciliation.gap ?? null }
})()

export const limits = [
  statedLimitPct !== null
    ? `The ${statedLimitPct}% limit is the Town’s own figure, from the Supervisor’s letter. No table in the budget prints it, and the letter gives neither the dollar amount nor how it was reached. New York’s formula starts from the State’s ${projection.referencePct}% growth factor and adjusts the prior levy for tax-base growth, PILOT payments, carryover and exclusions; the Town files the result with the State Comptroller. This site’s ${projection.referencePct}% line is a reference, not that limit.`
    : `The 2% line is a reference, not the legal limit. New York’s levy limit applies a tax-base growth factor, PILOT receivables, carryover and exclusions to the prior levy, and the Town files the resulting figure with the State Comptroller before adoption. None of the Town’s budget documents prints it. A Tentative above the ${projection.referencePct}% line may still be within the legal limit, and one below it is not thereby compliant.`,
  'Totals of all 19 funds include the Debt Service, Workers’ Compensation and Risk Retention funds, which are paid for entirely by transfers from the other funds, so those dollars are counted twice. “Not counting transfers between funds” leaves the three out, as the Supervisor’s letter does. Either way, a total compares one budget with another; it does not state what the Town spends.',
  'A Tentative is a proposal. It appropriates nothing (Town Law §109). The Board may change it before the hearing on the Preliminary and again before adoption. In the years on record it rarely has, but it can.',
  'The projection grows each 2026 line by a rate for its category. It knows nothing about decisions made since, so a gap between it and the Tentative is a question about what changed, not a finding that either is wrong.',
  'Department requests come from the Budget Supplement, which accompanies the Tentative. A year is shown only when its lines add up to its own Tentative; 2022 and 2023 extract with pages missing and are withheld.',
]
