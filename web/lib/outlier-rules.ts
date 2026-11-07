// The rule Outlier Watch applies, and the arithmetic behind it. Nothing here
// imports data, so scripts/verify-outliers.mjs runs this same code on the same
// records; lib/outlier-watch.ts wires it to the site's data.
//
// A change is flagged when it is both large in percentage terms and large
// enough in dollars to matter to a taxpayer. Either test alone is too noisy:
// percent alone flags tiny funds swinging on a small base (Risk Retention
// +150% on $15,000), and dollars alone flags the General Fund every year,
// because it dwarfs every other fund.

export const PCT_THRESHOLD = 20
export const DOLLAR_THRESHOLD = 100_000

/** One budget: an adopted year, or next year's while it is still a proposal. */
export type Column = {
  year: number
  stage: 'tentative' | 'preliminary' | 'adopted'
  /** '2026', or '2027 Tentative' for a proposal. */
  label: string
  /** Appropriations by fund code, as the budget's Summary page prints them. */
  appropriations: Record<string, number>
}

export type Transition<C extends Column = Column> = {
  /** '2025→2026', or '2026→2027 Tentative'. */
  key: string
  from: C
  to: C
  /** True when the later budget is still a proposal. */
  proposed: boolean
}

export type FundYoyChange = {
  code: string
  name: string
  fromYear: number
  toYear: number
  /** The comparison the change belongs to: its Transition's key. */
  transition: string
  proposed: boolean
  prior: number
  current: number
  dollarChange: number
  pctChange: number | null
}

export function isOutlier(c: FundYoyChange): boolean {
  return c.pctChange !== null && Math.abs(c.pctChange) >= PCT_THRESHOLD && Math.abs(c.dollarChange) >= DOLLAR_THRESHOLD
}

const bySize = (a: { dollarChange: number }, b: { dollarChange: number }) => Math.abs(b.dollarChange) - Math.abs(a.dollarChange)

/** Each budget against the one before it, fund by fund, for every fund both print. */
export function compareColumns<C extends Column>(columns: C[], funds: { code: string; name: string }[]) {
  const transitions: Transition<C>[] = columns.slice(1).map((to, i) => ({
    key: `${columns[i].label}→${to.label}`,
    from: columns[i],
    to,
    proposed: to.stage !== 'adopted',
  }))
  const changes: FundYoyChange[] = funds.flatMap((fund) =>
    transitions.flatMap(({ key, from, to, proposed }) => {
      const prior = from.appropriations[fund.code]
      const current = to.appropriations[fund.code]
      if (prior == null || current == null) return []
      return [{
        code: fund.code,
        name: fund.name,
        fromYear: from.year,
        toYear: to.year,
        transition: key,
        proposed,
        prior,
        current,
        dollarChange: current - prior,
        pctChange: prior === 0 ? null : ((current - prior) / prior) * 100,
      }]
    }),
  )
  return { transitions, changes, outliers: changes.filter(isOutlier).sort(bySize) }
}

/** One comparison's flags, and the changes that clear one bar but not the other. */
export function splitByBar(changes: FundYoyChange[]) {
  return {
    flagged: changes.filter(isOutlier).sort(bySize),
    dollarsOnly: changes.filter((c) => !isOutlier(c) && Math.abs(c.dollarChange) >= DOLLAR_THRESHOLD).sort(bySize),
    percentOnly: changes.filter((c) => !isOutlier(c) && c.pctChange !== null && Math.abs(c.pctChange) >= PCT_THRESHOLD).sort(bySize),
  }
}

/** A Budget Supplement line: the adopted figure and the Tentative's, and the Preliminary's once the book is matched to it. */
export type SupplementLine = {
  account: string
  fund: string
  name: string
  kind: string
  page: number
  adopted: number | null
  tentative: number | null
  preliminary?: number | null
  /** The last full year's actual figure. */
  actual?: number | null
}

/** The proposal a line is read at: the Tentative the Supplement prints, or the Preliminary matched to it. */
export type LineStage = 'tentative' | 'preliminary'
const proposedLine = (l: SupplementLine, stage: LineStage) => (stage === 'preliminary' ? l.preliminary ?? l.tentative : l.tentative) ?? 0

export type LineMove = { account: string; name: string; from: number; to: number; dollarChange: number; page: number }

/**
 * The lines behind one fund's change from the adopted budget to the proposal,
 * largest move first: what the fund spends on, and where its money comes
 * from. Null unless its spending lines add up to the fund's two Summary
 * figures, so the lines cannot tell a different story from the totals.
 */
export function lineMoves(lines: SupplementLine[], code: string, adoptedTotal: number, proposedTotal: number, stage: LineStage = 'tentative') {
  const own = lines.filter((l) => l.fund === code)
  const spending = own.filter((l) => l.kind === 'expenditure')
  const adoptedSum = spending.reduce((s, l) => s + (l.adopted ?? 0), 0)
  const proposedSum = spending.reduce((s, l) => s + proposedLine(l, stage), 0)
  if (Math.abs(adoptedSum - adoptedTotal) >= 0.5 || Math.abs(proposedSum - proposedTotal) >= 0.5) return null
  const moved = (kind: string): LineMove[] =>
    own
      .filter((l) => l.kind === kind)
      .map((l) => {
        const from = l.adopted ?? 0
        const to = proposedLine(l, stage)
        return { account: l.account, name: l.name, from, to, dollarChange: to - from, page: l.page }
      })
      .filter((l) => l.dollarChange !== 0)
      .sort(bySize)
  return { spending: moved('expenditure'), money: moved('revenue') }
}

export type AccountFlag = LineMove & {
  fund: string
  kind: string
  /** The last full year's actual figure, for scale; null when the Supplement prints none. */
  actual: number | null
  /** Null for a line the adopted budget did not fund. */
  pctChange: number | null
}

/**
 * Every Supplement line, spending or revenue, that moves from the adopted
 * budget to the proposal by at least DOLLAR_THRESHOLD and at least
 * PCT_THRESHOLD, largest first. A line the adopted budget did not fund
 * counts on the dollar bar alone, since it has no percentage to clear.
 */
export function accountFlags(lines: SupplementLine[], stage: LineStage): AccountFlag[] {
  return lines
    .map((l) => {
      const from = l.adopted ?? 0
      const to = proposedLine(l, stage)
      return {
        account: l.account, name: l.name, fund: l.fund, kind: l.kind, page: l.page, actual: l.actual ?? null,
        from, to, dollarChange: to - from, pctChange: from === 0 ? null : ((to - from) / from) * 100,
      }
    })
    .filter((l) => Math.abs(l.dollarChange) >= DOLLAR_THRESHOLD && (l.pctChange === null || Math.abs(l.pctChange) >= PCT_THRESHOLD))
    .sort(bySize)
}

/**
 * A line that only carries the Debt Service Fund's change: the fund's own
 * lines, the transfers other funds send it, and the Community Preservation
 * Fund's "Fund Balance Contribution", which replaces that fund's transfer.
 */
export const isDebtServiceLine = (l: { fund: string; account: string }) =>
  l.fund === 'V01' || /-9901-900-V01-/.test(l.account) || l.account === 'CM4-9-9990-000-000-00000'
