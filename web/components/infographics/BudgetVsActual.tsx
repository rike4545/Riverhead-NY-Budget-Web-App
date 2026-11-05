import PairedBars from '../charts/PairedBars'
import { curatedFlags, flagYears } from '../../lib/budget-accuracy'
import { money } from './format'

// The researched flags on /budget-accuracy, drawn as the budget beside what was
// spent in the latest year with actual spending. Only flags that have both a
// budget and an actual for that year are shown; the rest stay in the table below.
export default function BudgetVsActual({ limit = 8 }: { limit?: number }) {
  const year = flagYears.second
  const rows = curatedFlags
    .map((f) => ({ f, y: f.years.find((v) => v.year === year) }))
    .filter((r): r is { f: typeof r.f; y: NonNullable<typeof r.y> } => !!r.y && !!r.y.budget && r.y.actual !== null)
    .slice(0, limit)
  if (rows.length === 0) return null
  return (
    <PairedBars
      title={`Budgeted against spent, ${year}`}
      lede={`The first ${rows.length} flagged lines that have both a ${year} budget and ${year} spending. A red bar means the line spent more than it was budgeted.`}
      source={`Source: Town of Riverhead Budget Supplements (adopted budget and actual columns). The ${rows.length} lines shown are the highest-ranked flags on this page with both figures.`}
      rows={rows.map(({ f, y }) => ({ label: f.title, a: y.budget as number, b: y.actual as number }))}
      aLabel="Budgeted"
      bLabel="Spent"
      format={money}
    />
  )
}
