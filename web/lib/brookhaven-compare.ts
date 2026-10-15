// Brookhaven's 2027 Tentative beside Riverhead's, for /brookhaven-2027/.
//
// Brookhaven's side is read from its budget (brookhaven-2027.ts). Riverhead's
// comes from the records this site already checks: the Tentative's Summary
// (budget-stages.json), the savings each fund uses (savings-used.ts), the
// audited General Fund reserve (reserve-policy.ts), the Supervisor's letter,
// the Tentative's own pages and the 2027 Budget Supplement. Both towns'
// residents are the Census Bureau's estimates for July 1, 2025, from one
// release (census-pep.json), so the per-resident figures divide alike.

import { BROOKHAVEN_2026_ADOPTED, BROOKHAVEN_FUND_BALANCES, BROOKHAVEN_LEVY, BROOKHAVEN_STATED } from './brookhaven-2027'
import pep from '../public/data/census-pep.json'
import { stageDoc } from './budget-stages'
import { riverheadCurrent } from './credit-rating'
import { budgetTotals, lineSource, supplementLines } from './funds-2027'
import { appropriations as gfAppropriations2026, percentOfAppropriations, reserveYearAudited, unassignedFundBalance } from './reserve-policy'
import { savings } from './savings-used'
import { REFUSE_2027 } from './tax-cap-letter'
import { READ_BY_HAND } from './tentative-letters'
import { RIVERHEAD_SALARIES_2027 } from './tentative-salaries'

const adopted2026 = stageDoc(2026, 'adopted')
const tentative2027 = stageDoc(2027, 'tentative')

const pctChange = (from: number, to: number) => ((to - from) / from) * 100
const sum = (xs: readonly number[]) => xs.reduce((s, x) => s + x, 0)

// ── Brookhaven ───────────────────────────────────────────────────────────────

const fb = BROOKHAVEN_FUND_BALANCES
const MAIN = ['A', 'B', 'DA', 'DB', 'SL'] as const
const general = fb.major.find((r) => r.code === 'A')!
const drawn = [...fb.major, ...fb.special].filter((r) => r.appropriated > 0)

export const brookhaven = {
  spending: fb.grandTotal.expenditures,
  savingsUsed: fb.grandTotal.appropriated,
  savingsShare: (fb.grandTotal.appropriated / fb.grandTotal.expenditures) * 100,
  /** The funds that use any savings, with the share of their own spending. */
  drawn: drawn.map((r) => ({ name: r.name, amount: r.appropriated, spending: r.expenditures, share: (r.appropriated / r.expenditures) * 100 })),
  /** General, highway and lighting: the funds the levy summary calls its major tax districts. */
  main: {
    from: sum(MAIN.map((c) => BROOKHAVEN_2026_ADOPTED.expenditures[c])),
    to: BROOKHAVEN_LEVY.majorTotal.appropriations,
    levy: BROOKHAVEN_LEVY.majorTotal.taxes,
  },
  general: {
    from: BROOKHAVEN_2026_ADOPTED.expenditures.A,
    to: general.expenditures,
    cushion: general.start,
    cushionShare: (general.start / general.expenditures) * 100,
  },
  levyAdjustmentPct: BROOKHAVEN_STATED.levyAdjustmentPct,
  /** What the levy summary's grand total adds by listing street lighting twice. */
  levyDoubleCount: BROOKHAVEN_LEVY.allTotal.appropriations - fb.grandTotal.expenditures,
}

// ── Riverhead ────────────────────────────────────────────────────────────────

const WATER_SEWER = ['EW1', 'ES1', 'ES3', 'ES5']

export const riverhead = adopted2026 && tentative2027 && savings && tentative2027.townWide
  ? {
      spending: tentative2027.totals.appropriations,
      savingsUsed: savings.totals.proposed,
      savingsShare: (savings.totals.proposed / tentative2027.totals.appropriations) * 100,
      savingsFunds: savings.rows.length,
      generalFundSavings: savings.rows.find((r) => r.code === 'A01')?.proposed ?? 0,
      waterSewerSavings: sum(savings.rows.filter((r) => WATER_SEWER.includes(r.code)).map((r) => r.proposed)),
      waterSewerSpending: sum(WATER_SEWER.map((c) => tentative2027.funds[c]?.appropriations ?? 0)),
      /** The Summary's own "Total Town Wide": the General, Highway and Street Lighting funds. */
      main: {
        from: tentative2027.townWide.priorAppropriations,
        to: tentative2027.townWide.appropriations,
        levyFrom: tentative2027.townWide.priorLevy,
        levyTo: tentative2027.townWide.levy,
      },
      general: {
        from: adopted2026.funds.A01.appropriations,
        to: tentative2027.funds.A01.appropriations,
        cushion: unassignedFundBalance,
        cushionShare: percentOfAppropriations(unassignedFundBalance, gfAppropriations2026) * 100,
        cushionAudited: reserveYearAudited,
      },
      letter: READ_BY_HAND[2027] ?? null,
      ambulance: { from: adopted2026.funds.SM1?.levy ?? 0, to: tentative2027.funds.SM1?.levy ?? 0 },
      refuse: REFUSE_2027,
      salaries: RIVERHEAD_SALARIES_2027,
      rating: riverheadCurrent,
    }
  : null

export const growth = {
  brookhavenMain: pctChange(brookhaven.main.from, brookhaven.main.to),
  brookhavenGeneral: pctChange(brookhaven.general.from, brookhaven.general.to),
  riverheadMain: riverhead ? pctChange(riverhead.main.from, riverhead.main.to) : null,
  riverheadMainLevy: riverhead ? pctChange(riverhead.main.levyFrom, riverhead.main.levyTo) : null,
  riverheadGeneral: riverhead ? pctChange(riverhead.general.from, riverhead.general.to) : null,
  riverheadAmbulance: riverhead && riverhead.ambulance.from ? pctChange(riverhead.ambulance.from, riverhead.ambulance.to) : null,
  riverheadRefuse: riverhead ? pctChange(riverhead.refuse.adopted2026, riverhead.refuse.tentative2027) : null,
}

// ── Per resident ─────────────────────────────────────────────────────────────

const residents = (name: string) => (pep.towns as { name: string; estimates: Record<string, number> }[]).find((t) => t.name === name)?.estimates[String(pep.vintage)] ?? null

/** Both towns' residents, from one Census release. */
export const population = {
  asOf: pep.asOf,
  vintage: pep.vintage,
  source: pep.source,
  brookhaven: residents('Brookhaven town'),
  riverhead: residents('Riverhead town'),
}

/**
 * Riverhead's police department in the 2027 Tentative, from the Budget
 * Supplement: every line of the department (function 3120), and the benefits
 * the Town codes to sworn officers (function 9 accounts marked -UNI-:
 * pension, health insurance and Social Security). The department's own
 * -UNI- lines are its officers' pay, already counted in the first.
 */
export const riverheadPolice = lineSource
  ? (() => {
      const department = supplementLines.filter((l) => l.fund === 'A01' && l.kind === 'expenditure' && l.account.split('-')[2] === '3120')
      const benefits = supplementLines.filter((l) => l.kind === 'expenditure' && l.account.includes('-UNI-') && l.account.split('-')[2].startsWith('9'))
      const total = (ls: typeof department) => ls.reduce((s, l) => s + (l.tentative ?? 0), 0)
      const pages = (ls: typeof department) => Array.from(new Set(ls.map((l) => l.page))).sort((a, b) => a - b)
      return {
        department: total(department),
        benefits: total(benefits),
        total: total(department) + total(benefits),
        pages: { department: pages(department), benefits: pages(benefits) },
        source: lineSource,
      }
    })()
  : null

export const perResident = population.brookhaven && population.riverhead && riverhead && riverheadPolice && budgetTotals?.operatingTentative
  ? (() => {
      const b = population.brookhaven
      const r = population.riverhead
      /** What is left once the funds the others pay into, the police and the water and sewer districts are taken out. */
      const rest = budgetTotals.operatingTentative - riverheadPolice.total - riverhead.waterSewerSpending
      return {
        brookhaven: { spending: brookhaven.spending / b, levy: brookhaven.main.levy / b },
        riverhead: {
          spending: riverhead.spending / r,
          levy: riverhead.main.levyTo / r,
          police: riverheadPolice.total / r,
          waterSewer: riverhead.waterSewerSpending / r,
          operating: budgetTotals.operatingTentative,
          rest,
          restPerResident: rest / r,
        },
      }
    })()
  : null
