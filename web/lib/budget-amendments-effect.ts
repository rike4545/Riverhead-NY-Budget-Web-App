// What the six amendments to the 2027 Preliminary Budget would change, for
// /budget-amendments-2027/.
//
// The amendments are as the Town printed them (budget-amendments-2027.ts). The
// figures they change are the 2027 Tentative's: each account from the 2027
// Budget Supplement, whose lines add up to the Tentative's Summary to the dollar,
// and each fund's totals, levy and tax rate from the Tentative's Summary
// (budget-stages.json). Revenue history comes from every Budget Supplement since
// 2020 (revenue-history.json). Nothing here is the Town's own total of the six:
// the Town has not published one, so each is worked out from the resolutions.

import revenueHistory from '../public/data/budget-supplement/revenue-history.json'
import supplementJson from '../public/data/budget-supplement/current-lines.json'
import taxBill from '../public/data/tax-bill.json'
import {
  AMENDMENTS, change, deferredToFundBalance, fundEffects, isRevenue, PROPERTY_TAXES, revenueCode, scaledRate, unbalanced,
} from './budget-amendments-2027'
import { stageDoc, TOWN_WIDE_FUNDS } from './budget-stages'
import { lineSource } from './funds-2027'
import { LETTER_2027 } from './tentative-letters'

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
const lines = new Map((lineSource ? (supplementJson.lines as unknown as Line[]) : []).map((l) => [l.account, l]))
const histories = new Map((revenueHistory.accounts as unknown as History[]).map((h) => [h.account, h]))

const sum = (xs: number[]) => xs.reduce((s, x) => s + x, 0)
const pct = (from: number, to: number) => ((to - from) / from) * 100

/** Each account the six change, once, with every amendment that touches it. */
function accounts() {
  const out = new Map<string, { account: string; name: string; amendments: number[]; change: number }>()
  for (const a of AMENDMENTS) {
    for (const l of a.lines) {
      const row = out.get(l.account) ?? { account: l.account, name: l.name, amendments: [], change: 0 }
      if (!row.amendments.includes(a.n)) row.amendments.push(a.n)
      row.change += change(l)
      out.set(l.account, row)
    }
  }
  return Array.from(out.values()).map((r) => {
    const s = lines.get(r.account)
    const before = s?.tentative ?? null
    return {
      ...r,
      revenue: isRevenue(r.account),
      supplementName: s?.name ?? null,
      page: s?.page ?? null,
      /** The 2026 adopted figure the Supplement prints beside the Tentative. */
      adopted: s?.adopted ?? null,
      before,
      after: before === null ? null : before + r.change,
    }
  })
}

export const amendmentEffect = lineSource && tentative?.townWide && adopted?.townWide
  ? (() => {
      const tw = tentative.townWide!
      const effects = fundEffects(AMENDMENTS)
      const funds = effects.map((e) => {
        const row = tentative.funds[e.fund]
        return {
          ...e,
          name: row?.name ?? e.fund,
          before: row ? { appropriations: row.appropriations, levy: row.levy ?? 0, fundBalance: row.fundBalance ?? 0 } : null,
          after: row ? { appropriations: row.appropriations + e.appropriations, levy: (row.levy ?? 0) + e.levy, fundBalance: (row.fundBalance ?? 0) + e.fundBalance } : null,
          prior: adopted.funds[e.fund] ? { levy: adopted.funds[e.fund].levy ?? 0 } : null,
          unbalanced: unbalanced(e),
        }
      })
      const levyChange = sum(effects.filter((e) => (TOWN_WIDE_FUNDS as readonly string[]).includes(e.fund)).map((e) => e.levy))
      const levyAfter = tw.levy + levyChange
      const rates = (TOWN_WIDE_FUNDS as readonly string[]).map((code) => {
        const r = tw.fundRates?.[code]
        const f = tentative.funds[code]
        const e = effects.find((x) => x.fund === code)
        const before = r?.rate ?? null
        const after = before !== null && f?.levy ? scaledRate(before, f.levy, f.levy + (e?.levy ?? 0)) : before
        return { fund: code, name: f?.name ?? code, prior: r?.priorRate ?? null, before, after }
      })
      const rateAfter = rates.every((r) => r.after !== null) ? sum(rates.map((r) => r.after as number)) : null
      const deferred = deferredToFundBalance(AMENDMENTS)
      return {
        accounts: accounts(),
        funds,
        /** The Summary's "Total Town Wide": the General, Highway and Street Lighting funds. */
        townWide: {
          prior: tw.priorLevy,
          before: tw.levy,
          change: levyChange,
          after: levyAfter,
          pctBefore: pct(tw.priorLevy, tw.levy),
          pctAfter: pct(tw.priorLevy, levyAfter),
          growthBefore: tw.levy - tw.priorLevy,
          growthAfter: levyAfter - tw.priorLevy,
          /** 2026's own increase over 2025, from the 2026 adopted budget's Summary. */
          priorYearPct: pct(adopted.townWide!.priorLevy, adopted.townWide!.levy),
          ratePrior: tw.priorRate,
          rateBefore: tw.rate,
          rateAfter,
          rates,
        },
        totals: {
          appropriationsBefore: tentative.totals.appropriations,
          appropriationsChange: sum(effects.map((e) => e.appropriations)),
          fundBalanceChange: sum(effects.map((e) => e.fundBalance)),
          otherRevenueChange: sum(effects.map((e) => e.otherRevenue)),
        },
        deferred: {
          lines: deferred.map(({ n, line }) => ({ n, ...line, fund: line.account.split('-')[0] })),
          total: sum(deferred.map(({ line }) => line.amount)),
        },
        source: lineSource,
        summary: tentative.source,
      }
    })()
  : null

// ── The revenue estimates the amendments raise ───────────────────────────────

const YEARS = [2023, 2024, 2025]

/** Every revenue estimate the amendments raise, other than property taxes, with what the Town collected before. */
export const raisedRevenues = (amendmentEffect?.accounts ?? [])
  .filter((a) => a.revenue && a.change > 0 && revenueCode(a.account) !== PROPERTY_TAXES)
  .map((a) => {
    const h = histories.get(a.account)
    const s = lines.get(a.account)
    return {
      ...a,
      collected: YEARS.map((y) => ({ year: y, amount: h?.actual[String(y)] ?? null })),
      estimated: YEARS.map((y) => ({ year: y, amount: h?.adopted[String(y)] ?? null })),
      adopted2026: s?.adopted ?? null,
      firstHalf2026: s?.ytd ?? null,
    }
  })

/**
 * The General Fund's interest and earnings: what each year's budget estimated
 * and what the Town collected. Collections are the Supplements' actual columns,
 * the Town's books before the audit.
 */
export const generalFundInterest = (() => {
  const h = histories.get('A01-2401-000-00000-G')
  if (!h) return null
  const years = Object.keys(h.actual).map(Number).filter((y) => y >= 2019).sort((a, b) => a - b)
  const rows = years.map((y) => ({ year: y, estimated: h.adopted[String(y)] ?? null, collected: h.actual[String(y)] ?? null }))
  const threeYears = rows.filter((r) => r.year >= 2023 && r.year <= 2025)
  return {
    account: h.account,
    page: h.page,
    rows,
    // Each year rounded to the dollar first, so the total matches the rows a page shows.
    threeYears: { from: 2023, to: 2025, collected: sum(threeYears.map((r) => Math.round(r.collected ?? 0))) },
    adopted2026: h.adopted['2026'] ?? null,
    firstHalf2026: h.ytd['2026'] ?? null,
    tentative: h.tentative,
  }
})()

// ── A home's town-wide tax ───────────────────────────────────────────────────

/**
 * The Supervisor's letter prices the Tentative for "property valued at
 * $800,000". At the residential assessment ratio on the Receiver of Taxes'
 * 2025–26 rate sheet, that is the assessed value below; the town-wide rates are
 * per $1,000 of it. Before any exemption (STAR reduces school taxes, not these).
 */
export const exampleHome = amendmentEffect?.townWide.rateAfter
  ? (() => {
      const marketValue = LETTER_2027.generalFund.exampleValue
      const ratio = taxBill.equalization.residentialAssessmentRatio
      const assessed = (marketValue * ratio) / 100
      const tax = (rate: number) => (assessed / 1000) * rate
      const t = amendmentEffect.townWide
      return {
        marketValue,
        ratio,
        ratioYear: taxBill.equalization.asOfYear,
        assessed,
        prior: tax(t.ratePrior),
        before: tax(t.rateBefore),
        after: tax(t.rateAfter as number),
      }
    })()
  : null
