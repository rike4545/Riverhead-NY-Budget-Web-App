import PageShell from '../../components/PageShell'
import CompareExplorer from '../../components/CompareExplorer'
import PlainCallout from '../../components/PlainCallout'
import { budgetHistory } from '../../lib/budget-history'

export const metadata = {
  title: 'Budget Compare — fund spending across years',
  description:
    'Compare Town of Riverhead adopted appropriations across every operating fund from 2020 to 2026, sorted by the biggest dollar and percent movers.',
}

export default function ComparePage() {
  const years = budgetHistory.years
  return (
    <PageShell
      title="Budget Compare"
      subtitle={`Compare adopted appropriations across every operating fund from ${years[0]} to ${years[years.length - 1]}. Pick any two years, sort by the biggest movers, and see each fund's multi-year trend.`}
    >
      <PlainCallout
        tips={[
          { label: '"Appropriations"', text: 'just means planned spending. This page only compares spending — not the property-tax bill.' },
          { label: 'Pick two years', text: 'at the top, then choose how to sort: biggest dollar change, biggest percent change, or largest fund.' },
          { label: 'The small line', text: 'on the right of each row shows that fund\'s spending trend across all the years.' },
        ]}
      >
        This page answers a simple question: <strong>which parts of the budget grew the most, and by how much?</strong>
        {' '}It lines up each fund&apos;s planned spending side by side across years.
      </PlainCallout>
      <CompareExplorer />
    </PageShell>
  )
}
