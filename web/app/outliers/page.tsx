import PageShell from '../../components/PageShell'
import PlainCallout from '../../components/PlainCallout'
import OutlierWatch from '../../components/OutlierWatch'
import { outliers, yearTransitions, allYoyChanges, PCT_THRESHOLD, DOLLAR_THRESHOLD } from '../../lib/outlier-watch'

const base = process.env.NEXT_PUBLIC_BASE_PATH || ''
const card = { background: 'white', border: '1px solid #e2e8f0', borderRadius: 16, padding: 20, boxShadow: '0 14px 34px rgba(15,23,42,.05)' } as const
const usd = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

export const metadata = {
  title: 'Outlier Watch — unusual year-over-year fund swings',
  description:
    "Every one of Riverhead's 19 funds, checked year over year against its own budget history. Flags appropriation swings large enough in both percentage and dollar terms to be worth a resident's attention.",
}

export default function OutlierWatchPage() {
  const biggest = outliers[0]

  return (
    <PageShell
      title="Outlier Watch"
      subtitle="Riverhead's 19 town funds, checked year over year against their own budget history. This flags appropriation swings large enough to be worth a second look — not proof of a problem, but a place to start asking questions."
    >
      <PlainCallout
        tips={[
          { label: 'What counts as an outlier', text: `a fund whose appropriation moved at least ${PCT_THRESHOLD}% AND at least ${usd(DOLLAR_THRESHOLD)} from one year's adopted budget to the next.` },
          { label: 'Why two thresholds', text: 'percent alone flags small funds swinging on a tiny base (a $15,000 fund going to $25,000 is "+67%" but immaterial); dollars alone would flag the General Fund almost every year simply because it is the biggest fund.' },
          { label: 'What it does not mean', text: 'a flag is not an accusation. Big swings often have ordinary explanations — a bond payoff, a new contract, a one-time grant. Treat this as a starting point for a question at a Town Board meeting, not a conclusion.' },
        ]}
      >
        Across {allYoyChanges.length} fund-year comparisons since 2020, <strong>{outliers.length}</strong> clear the bar
        for a flag.
      </PlainCallout>

      <section style={{ ...card, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 12, marginBottom: 16 }}>
        <Stat label="Fund-year comparisons" value={String(allYoyChanges.length)} sub="2020–2026, all 19 funds" />
        <Stat label="Flagged as outliers" value={String(outliers.length)} sub={`≥${PCT_THRESHOLD}% and ≥${usd(DOLLAR_THRESHOLD)}`} accent />
        <Stat label="Largest flagged swing" value={biggest ? usd(Math.abs(biggest.dollarChange)) : '—'} sub={biggest ? `${biggest.name}, ${biggest.fromYear}→${biggest.toYear}` : ''} />
      </section>

      <OutlierWatch outliers={outliers} yearTransitions={yearTransitions} />

      <p style={{ color: '#94a3b8', fontSize: 12.5, marginTop: 16 }}>
        Source: each year's Adopted Budget Summary page, via the same fund-appropriations history that powers{' '}
        <a href={`${base}/funds/`} style={{ color: '#4a7297' }}>Funds Explorer</a>.
      </p>
    </PageShell>
  )
}

function Stat({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div>
      <div style={{ color: '#64748b', fontSize: 12.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.3 }}>{label}</div>
      <div style={{ color: accent ? '#b91c1c' : '#284a69', fontSize: 26, fontWeight: 900, lineHeight: 1.2 }}>{value}</div>
      {sub && <div style={{ color: '#94a3b8', fontSize: 12.5 }}>{sub}</div>}
    </div>
  )
}
