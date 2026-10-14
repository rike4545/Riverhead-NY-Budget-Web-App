// Savings the 2027 Tentative uses and sets aside, fund by fund, for the Funds
// Explorer. The rule is in savings-rules.ts; this wires it to the budgets'
// Summary pages (budget-stages.json), the 2027 Budget Supplement and the
// General Fund's audits.

import { AUDITED_GENERAL_FUND, AUDITED_OPERATIONS } from './audits'
import { budgetStages, stageDoc } from './budget-stages'
import { lineSource, supplementActualYear, supplementAdoptedYear, supplementLines, TENTATIVE_YEAR } from './funds-2027'
import { drawRunStart, isSavingsUsed, isSetAside, savingsByFund } from './savings-rules'
import { LETTER_2027 } from './tentative-letters'

const adopted = stageDoc(TENTATIVE_YEAR - 1, 'adopted')
const tentative = stageDoc(TENTATIVE_YEAR, 'tentative')
const lines = lineSource && supplementAdoptedYear === TENTATIVE_YEAR - 1 ? supplementLines : []

/** Savings used and set aside in the 2026 adopted budget and the 2027 Tentative; null until both are parsed. */
export const savings = adopted && tentative
  ? (() => {
      const s = savingsByFund(adopted.funds, tentative.funds, lines)
      return {
        ...s,
        rows: s.rows.map((r) => ({ ...r, since: drawRunStart(budgetStages.years, r.code, TENTATIVE_YEAR) })),
        /** The Summaries' own totals, which the rows must add up to. */
        printed: { adopted: adopted.totals.fundBalance, proposed: tentative.totals.fundBalance },
        funds: tentative.totals.funds,
        supplement: lines.length ? lineSource : null,
        /**
         * The year of the Supplement's actual column, when it shows nothing on
         * every savings line: savings are never received like a fee, so a
         * year's actual draw shows only in its year-end results.
         */
        actualYearBlank: lines.length && lines.filter((l) => isSavingsUsed(l) || isSetAside(l)).every((l) => !l.actual) ? supplementActualYear : null,
      }
    })()
  : null

/** The Supervisor's sentence on the General Fund's savings, while the Summaries bear out its figure. */
export const generalFundLetter = (() => {
  const row = savings?.rows.find((r) => r.code === 'A01')
  if (!row || row.adopted - row.proposed !== LETTER_2027.fundBalance.reduction) return null
  return { quote: LETTER_2027.fundBalance.quote, signedBy: LETTER_2027.signedBy, source: LETTER_2027.source }
})()

/**
 * The General Fund's planned use of savings beside what its audit found, for
 * each audited year. The plan is the adopted budget's Summary figure, and the
 * audit before it must show the same amount assigned to that budget, or the
 * year is left out.
 */
export const generalFundResults = Object.keys(AUDITED_OPERATIONS)
  .map(Number)
  .sort((a, b) => a - b)
  .flatMap((year) => {
    const planned = stageDoc(year, 'adopted')?.funds.A01?.fundBalance
    const assigned = AUDITED_GENERAL_FUND[year - 1]?.assigned.subsequentYearsBudget
    const audit = AUDITED_GENERAL_FUND[year]
    if (planned == null || assigned !== planned || !audit) return []
    const ops = AUDITED_OPERATIONS[year]
    // A page in the 2025 audit is counted in the agenda packet that carries it.
    const page = `${audit.source.printedPage != null ? 'packet ' : ''}p. ${ops.page}`
    return [{ year, planned, actual: ops.netChange, beginning: ops.beginning, ending: ops.ending, source: { title: audit.source.title, url: audit.source.url, page } }]
  })
