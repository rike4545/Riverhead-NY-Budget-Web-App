import PageShell from '../../components/PageShell'
import PlainCallout from '../../components/PlainCallout'
import Budget2027Table from '../../components/Budget2027Table'
import p from '../../public/data/budget-2027-prediction.json'

const usd = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
const card = { background: 'white', border: '1px solid #e2e8f0', borderRadius: 16, padding: 20, boxShadow: '0 14px 34px rgba(15,23,42,.05)' } as const
const th = { padding: '8px 10px' } as const
const td = { padding: '7px 10px' } as const

export const metadata = {
  title: '2027 Budget Prediction — a line-by-line projection',
  description:
    'An independent, transparent, line-by-line projection of the Town of Riverhead 2027 budget: every 2026 line grown by a stated, category-based assumption, with the implied tax-levy pressure. A model to test, not the Town’s budget.',
}

const t = p.totals
const le = p.levyEstimate

export default function Predict2027Page() {
  return (
    <PageShell
      title="A 2027 budget prediction — line by line"
      subtitle="What next year’s budget could look like if current trends hold — every 2026 line grown by a stated, category-based assumption you can see and argue with. This is a model, not the Town’s budget."
    >
      <div style={{ background: '#fff7ed', border: '1px solid #fdba74', borderLeft: '6px solid #ea580c', borderRadius: 12, padding: '14px 16px', marginBottom: 16, color: '#7c2d12', fontSize: 14.5, lineHeight: 1.55 }}>
        <strong>Read this first — it’s a prediction, not a fact.</strong> {p.disclaimer}
      </div>

      {/* Headline numbers */}
      <section style={{ ...card, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 12, marginBottom: 16 }}>
        <Stat label="2026 adopted (appropriations)" value={usd(t.appropriations2026)} />
        <Stat label="2027 predicted" value={usd(t.appropriations2027)} accent />
        <Stat label="Predicted change" value={`+${usd(t.delta)}`} sub={`+${t.pct}% on ${t.lineItems.toLocaleString()} line items`} />
        <Stat label="Implied levy increase" value={`+${le.levyIncreasePct}%`} sub={`${usd(le.levy2026)} → ${usd(le.levy2027)}`} amber />
      </section>

      <PlainCallout title="How to read this">
        The spending (appropriations) side is projected <strong>line by line</strong>: each 2026 amount grows by the rate
        for its category (below). Add it all up and 2027 spending lands near <strong>{usd(t.appropriations2027)}</strong>,
        up <strong>{t.pct}%</strong>. The <em>tax-levy</em> figure is a separate, illustrative estimate — {le.note.charAt(0).toLowerCase() + le.note.slice(1)}
      </PlainCallout>

      {/* Method + assumptions */}
      <section style={{ ...card, marginBottom: 16 }}>
        <h2 style={{ marginTop: 0, color: '#12385b' }}>The assumptions — argue with them</h2>
        <p style={{ color: '#475569', fontSize: 14.5, lineHeight: 1.55, marginTop: 0 }}>{p.method}</p>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
            <thead>
              <tr style={{ textAlign: 'left', color: '#64748b', borderBottom: '2px solid #e2e8f0' }}>
                <th style={th}>Category</th>
                <th style={{ ...th, textAlign: 'right' }}>2027 growth used</th>
                <th style={th}>Recent trend</th>
                <th style={th}>Why</th>
              </tr>
            </thead>
            <tbody>
              {p.assumptions.map((a) => (
                <tr key={a.category} style={{ borderBottom: '1px solid #f1f5f9', verticalAlign: 'top' }}>
                  <td style={{ ...td, fontWeight: 800, color: '#12385b', whiteSpace: 'nowrap' }}>{a.category}</td>
                  <td style={{ ...td, textAlign: 'right', fontWeight: 800, color: '#b45309' }}>+{a.ratePct}%/yr</td>
                  <td style={{ ...td, color: '#475569', whiteSpace: 'nowrap' }}>{a.recentTrend}</td>
                  <td style={{ ...td, color: '#475569', lineHeight: 1.45 }}>{a.why}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* By category */}
      <section style={{ ...card, marginBottom: 16 }}>
        <h2 style={{ marginTop: 0, color: '#12385b' }}>Where the increase comes from</h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
            <thead>
              <tr style={{ textAlign: 'left', color: '#64748b', borderBottom: '2px solid #e2e8f0' }}>
                <th style={th}>Category</th>
                <th style={{ ...th, textAlign: 'right' }}>Lines</th>
                <th style={{ ...th, textAlign: 'right' }}>2026</th>
                <th style={{ ...th, textAlign: 'right' }}>2027 predicted</th>
                <th style={{ ...th, textAlign: 'right' }}>Change</th>
              </tr>
            </thead>
            <tbody>
              {p.byCategory.map((c) => (
                <tr key={c.category} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ ...td, fontWeight: 700, color: '#12385b' }}>{c.category}</td>
                  <td style={{ ...td, textAlign: 'right', color: '#94a3b8' }}>{c.count}</td>
                  <td style={{ ...td, textAlign: 'right', color: '#64748b' }}>{usd(c.v2026)}</td>
                  <td style={{ ...td, textAlign: 'right', fontWeight: 700 }}>{usd(c.v2027)}</td>
                  <td style={{ ...td, textAlign: 'right', fontWeight: 700, color: '#b45309', whiteSpace: 'nowrap' }}>+{usd(c.delta)} ({c.pct}%)</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Top movers */}
      <section style={{ ...card, marginBottom: 16 }}>
        <h2 style={{ marginTop: 0, color: '#12385b' }}>The 10 biggest single-line increases</h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
            <thead>
              <tr style={{ textAlign: 'left', color: '#64748b', borderBottom: '2px solid #e2e8f0' }}>
                <th style={th}>Line item</th>
                <th style={th}>Fund / Dept</th>
                <th style={{ ...th, textAlign: 'right' }}>2026 → 2027</th>
                <th style={{ ...th, textAlign: 'right' }}>Change</th>
              </tr>
            </thead>
            <tbody>
              {p.topMovers.slice(0, 10).map((m, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ ...td, fontWeight: 700, color: '#12385b' }}>{m.name}</td>
                  <td style={{ ...td, color: '#64748b' }}>{m.fund} · {m.dept}</td>
                  <td style={{ ...td, textAlign: 'right', color: '#64748b', whiteSpace: 'nowrap' }}>{usd(m.v2026)} → {usd(m.v2027)}</td>
                  <td style={{ ...td, textAlign: 'right', fontWeight: 800, color: '#b45309', whiteSpace: 'nowrap' }}>+{usd(m.delta)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Full line-by-line */}
      <h2 style={{ color: '#12385b' }}>Every line, projected</h2>
      <p style={{ color: '#475569', fontSize: 14.5, lineHeight: 1.55, marginTop: 0 }}>
        All {t.lineItems.toLocaleString()} budget lines with their predicted 2027 value. Filter by fund or category,
        search a department, or sort by the biggest movers.
      </p>
      <Budget2027Table />

      <p style={{ color: '#64748b', fontSize: 13, lineHeight: 1.5, marginTop: 16 }}>
        {p.source} {le.recentLevyIncreases} A prediction is only as good as its assumptions — these are laid out above
        precisely so you can change them in your head and see which way the answer moves.
      </p>
    </PageShell>
  )
}

function Stat({ label, value, sub, accent, amber }: { label: string; value: string; sub?: string; accent?: boolean; amber?: boolean }) {
  return (
    <div style={{ background: amber ? '#fff7ed' : accent ? '#dbeafe' : '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 12 }}>
      <div style={{ color: '#64748b', fontSize: 11.5, textTransform: 'uppercase', fontWeight: 900, letterSpacing: 0.4 }}>{label}</div>
      <strong style={{ fontSize: 20, color: amber ? '#b45309' : '#12385b' }}>{value}</strong>
      {sub && <div style={{ color: '#64748b', fontSize: 12.5, marginTop: 2 }}>{sub}</div>}
    </div>
  )
}
