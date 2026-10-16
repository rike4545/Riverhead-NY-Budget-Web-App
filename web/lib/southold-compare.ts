// Southold's 2027 Tentative beside Riverhead's, for /southold-2027/.
//
// Southold's side is read from its budget (southold-2027.ts). Riverhead's comes
// from the records this site already checks: the Tentative's Summary
// (budget-stages.json), the 2027 Budget Supplement's lines, the audited General
// Fund (audits.ts, reserve-policy.ts), the Supervisor's letter and the salary
// page. Brookhaven's column is brookhaven-compare.ts's. All three towns'
// residents are the Census Bureau's estimates for July 1, 2025, from one
// release (census-pep.json), so the per-resident figures divide alike.
//
// The comparison is of like with like where the budgets allow it: Southold's
// four funds that its Tax Statistics page prints (General Whole Town, General
// Part Town, Highway, Solid Waste) against Riverhead's "Total Town Wide"
// (General, Highway, Street Lighting) with its refuse district shown beside
// them, and each town's police department line against the other's.

import pep from '../public/data/census-pep.json'
import { AUDITED_OPERATIONS } from './audits'
import { amendmentEffect } from './budget-amendments-effect'
import { brookhaven } from './brookhaven-compare'
import { stageDoc, TOWN_WIDE_FUNDS } from './budget-stages'
import { lineSource, supplementLines } from './funds-2027'
import { appropriations as gfAppropriations2026, percentOfAppropriations, reserveYearAudited, unassignedFundBalance } from './reserve-policy'
import {
  SOUTHOLD_CAPITAL, SOUTHOLD_FUND_BALANCES, SOUTHOLD_LINES, SOUTHOLD_SALARIES, SOUTHOLD_SUMMARY, SOUTHOLD_TAX_STATISTICS,
} from './southold-2027'
import { REFUSE_2027 } from './tax-cap-letter'
import { READ_BY_HAND } from './tentative-letters'
import { RIVERHEAD_SALARIES_2027 } from './tentative-salaries'

const adopted2026 = stageDoc(2026, 'adopted')
const tentative2027 = stageDoc(2027, 'tentative')

const pctChange = (from: number, to: number) => ((to - from) / from) * 100
const sum = (xs: readonly number[]) => xs.reduce((s, x) => s + x, 0)

// ── Southold ─────────────────────────────────────────────────────────────────

const ts = SOUTHOLD_TAX_STATISTICS
const gfBalance = SOUTHOLD_FUND_BALANCES.rows.find((r) => r.code === 'A')!
const sr = SOUTHOLD_SUMMARY.special.find((r) => r.code === 'SR')!

export const southold = {
  /** The four funds of the Tax Statistics page. */
  main: {
    from: ts.appropriations.total.y2026,
    to: ts.appropriations.total.y2027,
    pct: ts.appropriations.total.pct,
    levyFrom: ts.levy.total.y2026,
    levyTo: ts.levy.total.y2027,
    levyPct: ts.levy.total.pct,
    ratePct: ts.rates.total.pct,
    savings: ts.fundBalance.total.y2027,
    savingsShare: (ts.fundBalance.total.y2027 / ts.appropriations.total.y2027) * 100,
    assessedPct: ts.assessedValue.wholeTown.pct,
  },
  general: {
    from: ts.appropriations.A.y2026,
    to: ts.appropriations.A.y2027,
    pct: ts.appropriations.A.pct,
    savings: ts.fundBalance.A.y2027,
    savingsShare: (ts.fundBalance.A.y2027 / ts.appropriations.A.y2027) * 100,
    /** The budget's own estimate of what is left at the end of 2026, after the 2026 budget's planned use. */
    cushion: gfBalance.remaining,
    cushionShare: (gfBalance.remaining / ts.appropriations.A.y2027) * 100,
    /** The fund page's 2025 actual revenues less spending, which the fund-balance page prints as its "FY2025 Projected Increase". */
    result2025: Math.round(SOUTHOLD_LINES.revenues.actual2025 - SOUTHOLD_LINES.spending.actual2025),
    plannedDraw2026: SOUTHOLD_LINES.appropriatedFundBalance.budget2026,
  },
  /** The land funds draw on their own balances by design: they save transfer-tax money and spend it on land and housing. */
  landFunds: SOUTHOLD_SUMMARY.town.filter((r) => r.code === 'CM' || r.code === 'CM2'),
  police: {
    from: SOUTHOLD_LINES.police.budget2026,
    to: SOUTHOLD_LINES.police.tentative2027,
    pct: pctChange(SOUTHOLD_LINES.police.budget2026, SOUTHOLD_LINES.police.tentative2027),
    communications: SOUTHOLD_LINES.communications.tentative2027,
    retirement: SOUTHOLD_LINES.policeFireRetirement.tentative2027,
  },
  solidWaste: { spending: sr.appropriations, charges: sr.revenues, savings: sr.unexpended, tax: sr.tax, pct: ts.appropriations.SR.pct, taxPct: ts.levy.SR.pct },
  estimates: {
    interest: { estimate: SOUTHOLD_LINES.interest.tentative2027, collected2025: SOUTHOLD_LINES.interest.actual2025 },
    mortgageTax: { estimate: SOUTHOLD_LINES.mortgageTax.tentative2027, collected2025: SOUTHOLD_LINES.mortgageTax.actual2025 },
    salesTax: { estimate: SOUTHOLD_LINES.salesTax.tentative2027, collected2025: SOUTHOLD_LINES.salesTax.actual2025 },
  },
  capital: { y2027: SOUTHOLD_CAPITAL.grandTotal[0], debt2027: SOUTHOLD_CAPITAL.financing.debt[0], years: SOUTHOLD_CAPITAL.years },
  fire: SOUTHOLD_SUMMARY.fireTotal,
  grandTotal: SOUTHOLD_SUMMARY.grandTotal,
  salaries: SOUTHOLD_SALARIES,
}

// ── Riverhead ────────────────────────────────────────────────────────────────

const line = (account: string) => supplementLines.find((l) => l.account === account) ?? null
const department = supplementLines.filter((l) => l.fund === 'A01' && l.kind === 'expenditure' && l.account.split('-')[2] === '3120')
const total = (ls: typeof department, key: 'tentative' | 'adopted') => sum(ls.map((l) => l[key] ?? 0))
const amendedGF = amendmentEffect?.funds.find((f) => f.fund === 'A01')?.after ?? null

export const riverhead = adopted2026 && tentative2027?.townWide && lineSource && department.length
  ? (() => {
      const tw = tentative2027.townWide!
      const interest = line('A01-2401-000-00000-G')
      const mortgage = line('A01-3005-000-00000-E')
      const sales = line('A01-1120-000-00000-C')
      const pfrs = line('A01-9-9015-801-UNI-00000')
      const townWideSavings = sum(TOWN_WIDE_FUNDS.map((c) => tentative2027.funds[c]?.fundBalance ?? 0))
      return {
        main: {
          from: tw.priorAppropriations,
          to: tw.appropriations,
          pct: pctChange(tw.priorAppropriations, tw.appropriations),
          levyFrom: tw.priorLevy,
          levyTo: tw.levy,
          levyPct: pctChange(tw.priorLevy, tw.levy),
          rate: tw.rate,
          ratePct: pctChange(tw.priorRate, tw.rate),
          savings: townWideSavings,
          savingsShare: (townWideSavings / tw.appropriations) * 100,
          /** The assessed value each rate is spread over grew by about this much: the levy rises faster than the rate. */
          basePct: pctChange(tw.priorLevy / tw.priorRate, tw.levy / tw.rate),
        },
        general: {
          from: adopted2026.funds.A01.appropriations,
          to: tentative2027.funds.A01.appropriations,
          pct: pctChange(adopted2026.funds.A01.appropriations, tentative2027.funds.A01.appropriations),
          savings: tentative2027.funds.A01.fundBalance ?? 0,
          savingsShare: ((tentative2027.funds.A01.fundBalance ?? 0) / tentative2027.funds.A01.appropriations) * 100,
          amendedSavings: amendedGF?.fundBalance ?? null,
          cushion: unassignedFundBalance,
          cushionShare: percentOfAppropriations(unassignedFundBalance, gfAppropriations2026) * 100,
          cushionAudited: reserveYearAudited,
          result2025: AUDITED_OPERATIONS[2025].netChange,
          plannedDraw2026: adopted2026.funds.A01.fundBalance ?? 0,
        },
        allFunds: { savings: tentative2027.totals.fundBalance, spending: tentative2027.totals.appropriations },
        police: {
          from: total(department, 'adopted'),
          to: total(department, 'tentative'),
          pct: pctChange(total(department, 'adopted'), total(department, 'tentative')),
          pages: Array.from(new Set(department.map((l) => l.page))).sort((a, b) => a - b),
          retirement: pfrs?.tentative ?? null,
        },
        refuse: REFUSE_2027,
        estimates: {
          interest: { estimate: interest?.tentative ?? null, amended: interest ? (interest.tentative ?? 0) + (amendmentEffect?.accounts.find((a) => a.account === interest.account)?.change ?? 0) : null, collected2025: interest?.actual ?? null },
          mortgageTax: { estimate: mortgage?.tentative ?? null, collected2025: mortgage?.actual ?? null },
          salesTax: { estimate: sales?.tentative ?? null, collected2025: sales?.actual ?? null },
        },
        salaries: RIVERHEAD_SALARIES_2027,
        letter: READ_BY_HAND[2027] ?? null,
        capHistory: { y2025: READ_BY_HAND[2025]?.taxCap ?? null, y2026: READ_BY_HAND[2026]?.taxCap ?? null },
        source: lineSource,
      }
    })()
  : null

/** Riverhead's town-wide levy with its refuse district beside it, to set against Southold's four funds, which include solid waste. */
export const riverheadWithRefuse = riverhead ? riverhead.main.levyTo + riverhead.refuse.tentative2027 : null

// ── Per resident ─────────────────────────────────────────────────────────────

const residents = (name: string) => (pep.towns as { name: string; estimates: Record<string, number> }[]).find((t) => t.name === name)?.estimates[String(pep.vintage)] ?? null

export const population = {
  asOf: pep.asOf,
  vintage: pep.vintage,
  source: pep.source,
  southold: residents('Southold town'),
  riverhead: residents('Riverhead town'),
  brookhaven: residents('Brookhaven town'),
}

export const perResident = population.southold && population.riverhead && riverhead && riverheadWithRefuse !== null
  ? {
      southold: {
        levy: southold.main.levyTo / population.southold,
        police: southold.police.to / population.southold,
        policeWithCommunications: (southold.police.to + southold.police.communications) / population.southold,
      },
      riverhead: {
        levy: riverhead.main.levyTo / population.riverhead,
        levyWithRefuse: riverheadWithRefuse / population.riverhead,
        police: riverhead.police.to / population.riverhead,
      },
      brookhaven: population.brookhaven ? { levy: brookhaven.main.levy / population.brookhaven } : null,
    }
  : null

/** The three neighbours on the measures each budget prints. */
export const threeTowns = riverhead
  ? {
      generalSavingsShare: { southold: southold.general.savingsShare, riverhead: riverhead.general.savingsShare, brookhaven: 0 },
      generalCushionShare: { southold: southold.general.cushionShare, riverhead: riverhead.general.cushionShare, brookhaven: brookhaven.general.cushionShare },
      brookhavenLevyPct: brookhaven.levyAdjustmentPct,
    }
  : null

/** Revenue estimates as a share of what came in during 2025: how cautiously each town budgets. */
export const estimateShare = (estimate: number | null, collected: number | null) => (estimate !== null && collected ? (estimate / collected) * 100 : null)
