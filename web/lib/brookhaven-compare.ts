// Brookhaven's 2027 Tentative beside Riverhead's, for /brookhaven-2027/.
//
// Brookhaven's side is read from its budget (brookhaven-2027.ts). Riverhead's
// comes from the records this site already checks: the Tentative's Summary
// (budget-stages.json), the savings each fund uses (savings-used.ts), the
// audited General Fund reserve (reserve-policy.ts), the Supervisor's letter
// and the Tentative's own pages. Nothing is divided by population: this site
// has no Census figure for Brookhaven yet, so the comparisons are shares and
// rates of change, which do not depend on size.

import { BROOKHAVEN_2026_ADOPTED, BROOKHAVEN_FUND_BALANCES, BROOKHAVEN_LEVY, BROOKHAVEN_STATED } from './brookhaven-2027'
import { stageDoc } from './budget-stages'
import { riverheadCurrent } from './credit-rating'
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
