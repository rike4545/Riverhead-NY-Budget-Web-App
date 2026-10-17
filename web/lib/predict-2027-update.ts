// The 2027 prediction, made again once the Tentative and the six amendments to
// it were known, for /predict-2027/.
//
// The September model on that page grows each 2026 line by a rate for its
// category. It knows nothing the Town decided after its 2026 budget, and it
// stays as it was, so the scorecard can hold it to what the Town filed. This is
// a second prediction, with its own date: the budget the Town Board adopts by
// November 20, 2026. It is the 2027 Tentative as filed (budget-stages.json),
// changed by the six amendments on the draft agenda for October 20
// (budget-amendments-2027.ts), as budget-amendments-effect.ts works them out.
// Once the adopted budget is parsed, stageDoc(2027, 'adopted') returns it and
// the adopted column fills in, so this prediction is scored the same way,
// without being rewritten. scripts/verify-predict-2027.mjs re-derives every
// figure.

import modelJson from '../public/data/budget-2027-lines.json'
import supplementJson from '../public/data/budget-supplement/current-lines.json'
import july7 from '../public/data/meetings/2026-07-07-fiscal.json'
import august4 from '../public/data/meetings/2026-08-04-fiscal.json'
import prediction from '../public/data/budget-2027-prediction.json'
import { AMENDMENTS, ARTICLE, PACKET } from './budget-amendments-2027'
import { amendmentEffect } from './budget-amendments-effect'
import { stageDoc, tentativeToAdopted } from './budget-stages'
import { statedLimitPct } from './tentative-2027'
import { levelOf } from './zero-percent-2027'

/** When this prediction was made. A later revision gets its own date, and this one is kept. */
export const UPDATED = { date: 'October 17, 2026', iso: '2026-10-17' } as const

/** Town Law §109(2): the Board adopts the budget by resolution no later than this. */
export const ADOPTION_DEADLINE = 'November 20, 2026'

const sum = (xs: number[]) => xs.reduce((s, x) => s + x, 0)
const pct = (from: number, to: number) => ((to - from) / from) * 100

const prior = stageDoc(2026, 'adopted')
const tentative = stageDoc(2027, 'tentative')
/** Null until the Town publishes its adopted 2027 budget and the parser reads it. */
export const adopted = stageDoc(2027, 'adopted')
const fx = amendmentEffect

export type PredictionRow = {
  id: string
  metric: string
  basis: string
  kind: 'usd' | 'pct'
  /** The 2026 adopted figure; null where the row is itself a change from 2026. */
  y2026: number | null
  tentative: number
  predicted: number
  adopted: number | null
}

/** The Tentative, the prediction and, once it exists, the adopted budget, measure by measure. */
export const updatedPrediction =
  prior?.townWide && tentative?.townWide && prior.funds.A01 && tentative.funds.A01 && fx
    ? (() => {
        const tw = tentative.townWide!
        const gfBefore = tentative.funds.A01
        const gfPrior = prior.funds.A01
        const gfEffect = fx.funds.find((f) => f.fund === 'A01')
        const levyChange = sum(fx.funds.map((f) => f.levy))
        const adoptedTownWide = adopted?.townWide ?? null
        const rows: PredictionRow[] = [
          {
            id: 'town-wide-levy', metric: 'Town-wide tax levy', basis: 'General Fund, Highway and Street Lighting', kind: 'usd',
            y2026: tw.priorLevy, tentative: tw.levy, predicted: fx.townWide.after, adopted: adoptedTownWide?.levy ?? null,
          },
          {
            id: 'town-wide-change', metric: 'Change from 2026', basis: 'Town-wide levy', kind: 'pct',
            y2026: null, tentative: fx.townWide.pctBefore, predicted: fx.townWide.pctAfter,
            adopted: adoptedTownWide ? pct(adoptedTownWide.priorLevy, adoptedTownWide.levy) : null,
          },
          {
            id: 'all-funds-levy', metric: 'Tax levy, all funds', basis: 'Special districts included', kind: 'usd',
            y2026: prior.totals.levy, tentative: tentative.totals.levy, predicted: tentative.totals.levy + levyChange, adopted: adopted?.totals.levy ?? null,
          },
          {
            id: 'appropriations', metric: 'Total appropriations', basis: 'All 19 funds', kind: 'usd',
            y2026: prior.totals.appropriations, tentative: tentative.totals.appropriations,
            predicted: tentative.totals.appropriations + fx.totals.appropriationsChange, adopted: adopted?.totals.appropriations ?? null,
          },
          {
            id: 'general-fund', metric: 'General Fund appropriations', basis: 'A01', kind: 'usd',
            y2026: gfPrior.appropriations, tentative: gfBefore.appropriations,
            predicted: gfBefore.appropriations + (gfEffect?.appropriations ?? 0), adopted: adopted?.funds.A01?.appropriations ?? null,
          },
          {
            id: 'general-fund-savings', metric: 'General Fund savings used', basis: 'Appropriated fund balance', kind: 'usd',
            y2026: gfPrior.fundBalance ?? 0, tentative: gfBefore.fundBalance ?? 0,
            predicted: (gfBefore.fundBalance ?? 0) + (gfEffect?.fundBalance ?? 0), adopted: adopted ? adopted.funds.A01?.fundBalance ?? 0 : null,
          },
        ]
        const row = (id: string) => rows.find((r) => r.id === id)!
        return {
          rows,
          row,
          /** The September model's levy across all funds, the figure the scorecard holds the Tentative to. */
          model: { levy: prediction.levyEstimate.levy2027, levyPct: prediction.levyEstimate.levyIncreasePct },
          allFundsPct: { tentative: pct(prior.totals.levy, tentative.totals.levy), predicted: pct(prior.totals.levy, row('all-funds-levy').predicted) },
          /** Equipment the amendments take out of the budget, to be bought from savings by separate votes during 2027. */
          equipmentFromSavings: fx.deferred.total,
          statedLimitPct,
        }
      })()
    : null

// ── Why this outcome ─────────────────────────────────────────────────────────

/** Each budget on record whose Tentative and Adopted versions are both parsed, and how far the Board moved its levy. */
export const record = tentativeToAdopted.map((t) => ({ year: t.year, fundsChanged: t.fundsChanged, levyDelta: t.levy.delta }))
export const unchangedCount = record.filter((r) => r.fundsChanged === 0).length
export const largestChange = record.reduce((a, b) => (Math.abs(b.levyDelta) > Math.abs(a.levyDelta) ? b : a))
/** The six amendments' change to the levy, which no year on record matches. */
export const amendmentsLevyChange = fx ? fx.townWide.change : null

export const basis = {
  items: AMENDMENTS.map((a) => a.item),
  statementsDated: PACKET.statementsDated,
  meeting: PACKET.meeting,
  developed: ARTICLE.reported.developed,
  support: ARTICLE.reported.support,
  noResponse: ARTICLE.reported.noResponse,
  article: { outlet: ARTICLE.outlet, published: ARTICLE.published, url: ARTICLE.url },
}

/** The outcomes that remain open, each with the town-wide levy and the tax on the Supervisor's $800,000 example home. */
export const scenarios = (() => {
  const of = (id: string) => levelOf(id)
  const start = of('2026')
  const outcome = (id: string, levelId: string, name: string, call: string) => {
    const l = of(levelId)
    return { id, name, call, levy: l.levy, pct: l.pct, homeTax: l.homeTax, homeChange: l.homeChange, printed: l.printed }
  }
  return {
    home2026: start.homeTax,
    outcomes: [
      outcome('amended', 'amended', 'The six amendments pass as printed', 'This prediction'),
      outcome('tentative', 'tentative', 'They fail or are withdrawn', 'Less likely'),
      outcome('further', 'target-1', 'The Board goes further, to 1%', 'Not proposed'),
    ],
  }
})()

// ── Where the September model missed ─────────────────────────────────────────

type ModelLine = { account: string; category: string; v2026: number; v2027: number }
type SupplementLine = { account: string; kind: string; adopted: number | null; tentative: number | null }

// The rule etl/parse_subaccounts.py's object_category applies to an expenditure
// account's object code (its fourth part), for the accounts the Tentative adds
// that the 2026 budget did not have.
const OBJECT_CATEGORY: Record<number, string> = {
  1: 'Personal Services', 2: 'Equipment & Capital Outlay', 4: 'Contractual', 8: 'Employee Benefits', 9: 'Interfund / Transfers',
}
const objectCategory = (account: string) => {
  const code = Number(account.split('-')[3])
  return Number.isFinite(code) ? OBJECT_CATEGORY[Math.floor(code / 100)] ?? 'Other' : 'Other'
}

// The model's six categories, as residents would name them. Debt payments sit in
// "Other" (object codes 600 and 700) beside the transfers that pay for them.
export const MISS_GROUPS = [
  { label: 'Salaries and wages', categories: ['Personal Services'] },
  { label: 'Employee benefits', categories: ['Employee Benefits'] },
  { label: 'Contractual', categories: ['Contractual'] },
  { label: 'Equipment', categories: ['Equipment & Capital Outlay'] },
  { label: 'Debt payments, transfers and reserves', categories: ['Interfund / Transfers', 'Other'] },
] as const

const supplementLines = (supplementJson as unknown as { lines: SupplementLine[] }).lines
const lineOf = (account: string) => supplementLines.find((l) => l.account === account) ?? null

export const modelMiss = tentative && prior?.funds.V01 && tentative.funds.V01
  ? (() => {
      const model = (modelJson as unknown as { lines: ModelLine[] }).lines
      const spending = supplementLines.filter((l) => l.kind === 'expenditure')
      const modelCategory = new Map(model.map((l) => [l.account, l.category]))
      const rows = MISS_GROUPS.map((g) => ({ label: g.label as string, y2026: 0, model: 0, tentative: 0 }))
      const rowFor = (category: string) => {
        const g = MISS_GROUPS.find((x) => (x.categories as readonly string[]).includes(category))
        // A category the model never had would be counted nowhere, so it stops the build.
        if (!g) throw new Error(`predict-2027-update: no group for spending category "${category}"`)
        return rows.find((r) => r.label === g.label)!
      }
      for (const l of model) {
        const r = rowFor(l.category)
        r.y2026 += l.v2026
        r.model += l.v2027
      }
      for (const l of spending) rowFor(modelCategory.get(l.account) ?? objectCategory(l.account)).tentative += l.tentative ?? 0
      const rounded = rows.map((r) => ({ ...r, y2026: Math.round(r.y2026), model: Math.round(r.model), tentative: Math.round(r.tentative) }))
      const totals = {
        y2026: sum(rounded.map((r) => r.y2026)),
        model: sum(rounded.map((r) => r.model)),
        tentative: sum(rounded.map((r) => r.tentative)),
      }
      const wages = rounded.find((r) => r.label === 'Salaries and wages')!
      const amount = (account: string, column: 'adopted' | 'tentative') => lineOf(account)?.[column] ?? 0
      type Resolution = { number: string; amount?: number | null; funding?: { fundBalanceDraw?: number | null; accounts?: { code: string; amount: number }[] } }
      const res642 = (july7.resolutions as unknown as Resolution[]).find((r) => r.number === '2026-642')
      const res762 = (august4.resolutions as unknown as Resolution[]).find((r) => r.number === '2026-762')
      return {
        rows: rounded,
        totals,
        /** The Summary's totals, which the lines must add up to. */
        summaryTotals: { y2026: prior.totals.appropriations, model: prediction.totals.appropriations2027, tentative: tentative.totals.appropriations },
        wages: { ...wages, modelPct: pct(wages.y2026, wages.model), tentativePct: pct(wages.y2026, wages.tentative) },
        debt: {
          fund: { y2026: prior.funds.V01!.appropriations, y2027: tentative.funds.V01!.appropriations },
          cpfTransfer: { y2026: amount('CM4-9-9901-900-V01-00000', 'adopted'), y2027: amount('CM4-9-9901-900-V01-00000', 'tentative') },
          cpfToFundBalance: amount('CM4-9-9990-000-000-00000', 'tentative'),
          gfTransfer: { y2026: amount('A01-9-9901-900-V01-00000', 'adopted'), y2027: amount('A01-9-9901-900-V01-00000', 'tentative') },
          bonds: {
            number: '2026-642', date: 'July 7, 2026', what: '2018 Series B refunding bonds',
            cpfSavings: res642?.funding?.fundBalanceDraw ?? null,
            saleProceeds: res642?.funding?.accounts?.find((a) => a.code === 'A01-2660-000-00000-1')?.amount ?? null,
          },
          townSquare: {
            numbers: ['2026-641', '2026-762'], dates: 'July 7 and August 4, 2026',
            generalFundSavings: res762?.funding?.fundBalanceDraw ?? null,
            total: res762?.amount ?? null,
          },
        },
      }
    })()
  : null
