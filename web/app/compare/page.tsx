import PageShell from '../../components/PageShell'
import CompareExplorer from '../../components/CompareExplorer'
import { budgetHistory } from '../../lib/budget-history'

export default function ComparePage() {
  const years = budgetHistory.years
  return (
    <PageShell
      title="Budget Compare"
      subtitle={`Compare adopted appropriations across every operating fund from ${years[0]} to ${years[years.length - 1]}. Pick any two years, sort by the biggest movers, and see each fund's multi-year trend.`}
    >
      <CompareExplorer />
    </PageShell>
  )
}
