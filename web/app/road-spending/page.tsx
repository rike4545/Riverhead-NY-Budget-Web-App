import PageShell from '../../components/PageShell'
import PlainCallout from '../../components/PlainCallout'
import {
  roadSpending, towns, riverhead, medianPerMile, maxPerMile, riverheadRank,
  shareOfMedian, gapToMedianAnnual, riverheadMixTotal, RIVERHEAD,
} from '../../lib/road-spending'

const card = { background: 'white', border: '1px solid #e2e8f0', borderRadius: 16, padding: 20, boxShadow: '0 14px 34px rgba(15,23,42,.05)' } as const
const usd = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

export const metadata = {
  title: 'Road spending per mile — Riverhead vs. the Suffolk towns',
  description:
    'What Riverhead spends maintaining each mile of its own roads, compared with every other town in Suffolk County, using the State Comptroller’s filings and NYSDOT road mileage.',
}

export default function RoadSpendingPage() {
  return (
    <PageShell
      title="Road spending, per mile"
      subtitle={roadSpending.intro}
    >
      <PlainCallout title="Why per mile">
        Brookhaven maintains <strong>1,800 miles</strong> of road and Riverhead maintains <strong>208</strong>, so
        comparing total highway budgets tells you nothing except which town is bigger. Dividing by the miles each town
        actually maintains puts them on the same footing. Only roads the <em>town</em> maintains are counted — state and
        county roads running through a town are somebody else’s bill.
      </PlainCallout>

      {/* Headline */}
      <section style={{ ...card, borderLeft: '6px solid #4a7297' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 12 }}>
          <Stat label="Riverhead, per maintained mile" value={usd(riverhead.perMile)} accent />
          <Stat label="Suffolk town median" value={usd(medianPerMile)} />
          <Stat label="Rank among the 10 towns" value={`${riverheadRank}th of 10`} />
          <Stat label="Miles Riverhead maintains" value={riverhead.miles.toFixed(0)} />
        </div>
        <p style={{ color: '#334155', fontSize: 15.5, lineHeight: 1.7, margin: '16px 0 0' }}>
          Riverhead spends about <strong>{Math.round((1 - shareOfMedian) * 100)}% less per mile</strong> than the median
          Suffolk town. Spending at the median rate across its {riverhead.miles.toFixed(0)} miles would cost roughly{' '}
          <strong>{usd(gapToMedianAnnual)} more a year</strong> than it currently spends on highways.
        </p>
      </section>

      {/* Chart */}
      <section style={{ ...card, marginTop: 16 }}>
        <h2 style={{ margin: '0 0 4px', color: '#284a69', fontSize: 20 }}>Every Suffolk town, {roadSpending.asOf}</h2>
        <p style={{ color: '#64748b', fontSize: 14, lineHeight: 1.6, margin: '0 0 16px' }}>
          Highway spending divided by locally maintained centerline miles.
        </p>
        <div style={{ display: 'grid', gap: 8 }}>
          {towns.map((t) => {
            const me = t.town === RIVERHEAD
            return (
              <div key={t.town} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 108, fontSize: 13.5, fontWeight: me ? 900 : 600, color: me ? '#284a69' : '#475569' }}>
                  {t.town}
                </span>
                <div style={{ flex: 1, background: '#f1f5f9', borderRadius: 6, height: 24, overflow: 'hidden', position: 'relative' }}>
                  <div style={{ width: `${(t.perMile / maxPerMile) * 100}%`, background: me ? '#b45309' : '#94a3b8', height: '100%', borderRadius: 6 }} />
                </div>
                <span style={{ width: 74, textAlign: 'right', fontSize: 13.5, fontWeight: me ? 900 : 700, color: me ? '#b45309' : '#334155' }}>
                  {usd(t.perMile)}
                </span>
                <span style={{ width: 62, textAlign: 'right', fontSize: 12, color: '#94a3b8' }}>
                  {t.miles.toFixed(0)} mi
                </span>
              </div>
            )
          })}
        </div>
        <div style={{ color: '#64748b', fontSize: 12.5, marginTop: 12, paddingTop: 10, borderTop: '1px solid #e2e8f0' }}>
          Median across the ten towns: <strong>{usd(medianPerMile)}</strong> per mile.
        </div>
      </section>

      {/* What Riverhead's money buys */}
      <section style={{ ...card, marginTop: 16, borderLeft: '6px solid #b45309' }}>
        <h2 style={{ margin: '0 0 10px', color: '#284a69', fontSize: 19 }}>What Riverhead’s highway money goes to</h2>
        <div style={{ display: 'grid', gap: 8 }}>
          {roadSpending.riverheadMix.map((m) => (
            <div key={m.object} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ width: 190, fontSize: 13.5, color: '#475569', fontWeight: 600 }}>{m.object}</span>
              <div style={{ flex: 1, background: '#f1f5f9', borderRadius: 6, height: 20, overflow: 'hidden' }}>
                <div style={{ width: `${(m.amount / riverheadMixTotal) * 100}%`, background: '#b45309', height: '100%', borderRadius: 6 }} />
              </div>
              <span style={{ width: 86, textAlign: 'right', fontSize: 13.5, fontWeight: 800, color: '#334155' }}>{usd(m.amount)}</span>
              <span style={{ width: 42, textAlign: 'right', fontSize: 12.5, color: '#94a3b8' }}>
                {Math.round((m.amount / riverheadMixTotal) * 100)}%
              </span>
            </div>
          ))}
        </div>
        <p style={{ color: '#475569', fontSize: 14.5, lineHeight: 1.65, margin: '14px 0 0' }}>
          Just under three fifths of it is wages. That is normal for a highway department and it is also why a
          per-mile figure moves more with staffing decisions than with how much asphalt got laid.
        </p>
      </section>

      {/* The honest reading */}
      <section style={{ ...card, marginTop: 16, borderLeft: '6px solid #0f766e', background: '#f0fdfa' }}>
        <h2 style={{ margin: '0 0 8px', color: '#0f766e', fontSize: 19 }}>What this does and doesn’t tell you</h2>
        <p style={{ color: '#134e4a', fontSize: 15, lineHeight: 1.7, margin: 0 }}>
          Spending less per mile than your neighbours is not a result — it is a question. It can mean a lean, efficient
          operation, or it can mean roads are being allowed to degrade and the bill is being handed to a later budget.
          Nothing in these two datasets can distinguish those, because neither measures the condition of the pavement.
          The Town does not publish a pavement-condition rating, and until it does, a number like{' '}
          <strong>{usd(riverhead.perMile)} a mile</strong> is a prompt to go and ask rather than an answer.
        </p>
      </section>

      {/* Caveats */}
      <section style={{ ...card, marginTop: 16 }}>
        <h2 style={{ margin: '0 0 10px', color: '#284a69', fontSize: 17 }}>Limits of this comparison</h2>
        <ul style={{ margin: 0, paddingLeft: 0, listStyle: 'none', display: 'grid', gap: 9 }}>
          {roadSpending.caveats.map((c) => (
            <li key={c} style={{ display: 'flex', gap: 9, alignItems: 'baseline', color: '#475569', fontSize: 14.5, lineHeight: 1.6 }}>
              <span aria-hidden style={{ color: '#94a3b8', fontWeight: 900 }}>›</span>
              <span>{c}</span>
            </li>
          ))}
        </ul>
        <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid #e2e8f0', display: 'grid', gap: 8 }}>
          <SourceLine label="Spending" s={roadSpending.spending} />
          <SourceLine label="Road mileage" s={roadSpending.mileage} />
        </div>
      </section>
    </PageShell>
  )
}

function SourceLine({ label, s }: { label: string; s: { source: string; detail: string; url: string } }) {
  return (
    <div style={{ color: '#64748b', fontSize: 13, lineHeight: 1.6 }}>
      <strong style={{ color: '#284a69' }}>{label}:</strong>{' '}
      <a href={s.url} target="_blank" rel="noreferrer" style={{ color: '#4a7297', fontWeight: 700 }}>{s.source}</a>
      {' — '}{s.detail}
    </div>
  )
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div style={{ background: accent ? '#fff7ed' : '#f8fafc', border: `1px solid ${accent ? '#fed7aa' : '#e2e8f0'}`, borderRadius: 12, padding: '12px 14px' }}>
      <div style={{ color: '#64748b', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.4, lineHeight: 1.35 }}>{label}</div>
      <div style={{ color: accent ? '#b45309' : '#284a69', fontSize: 24, fontWeight: 950, marginTop: 3 }}>{value}</div>
    </div>
  )
}
