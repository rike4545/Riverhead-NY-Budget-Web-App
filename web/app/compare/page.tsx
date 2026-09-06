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
  const from = budgetHistory.townTotals[String(years[years.length - 2])]?.appropriations ?? null
  const to = budgetHistory.townTotals[String(years[years.length - 1])]?.appropriations ?? null
  const change = from != null && to != null ? to - from : null
  const pct = from && to != null ? (change! / from) * 100 : null

  return (
    <PageShell
      title="Budget Compare"
      subtitle={`Compare adopted appropriations across every operating fund from ${years[0]} to ${years[years.length - 1]}. Pick any two years, sort by the biggest movers, and see each fund's multi-year trend.`}
    >
      <section style={{ background: 'var(--rbl-info-bg)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 16, padding: 18, marginBottom: 16 }}>
        <div style={{ color: 'var(--rbl-accent)', fontSize: 11.5, fontWeight: 950, textTransform: 'uppercase', letterSpacing: 0.5 }}>Start with the big picture</div>
        <h2 style={{ margin: '5px 0 6px', fontSize: 22 }}>Town-wide planned spending {change != null && change >= 0 ? 'increased' : 'changed'} {change != null ? usd(change) : '—'} from {years[years.length - 2]} to {years[years.length - 1]}.</h2>
        <p style={{ margin: 0, color: 'var(--rbl-text-sub)', lineHeight: 1.5 }}>
          That is {pct != null ? `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%` : '—'} overall. Use the comparison below to see which funds account for the largest dollar changes. A larger appropriation means more planned spending; it does not by itself mean a larger property-tax increase.
        </p>
      </section>
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

function usd(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}
