import PageShell from '../../components/PageShell'
import PlainCallout from '../../components/PlainCallout'
import Budget2027Table from '../../components/Budget2027Table'
import p from '../../public/data/budget-2027-prediction.json'

const base = '/rike4545-riverhead-budget-live'
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

      {/* Does it pierce the tax cap? */}
      <section style={{ ...card, marginBottom: 16, borderLeft: '6px solid #b91c1c' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'baseline', justifyContent: 'space-between' }}>
          <h2 style={{ margin: 0, color: '#12385b' }}>Does the 2027 budget pierce the tax cap?</h2>
          <span style={{ background: '#fee2e2', color: '#991b1b', fontWeight: 900, fontSize: 14, padding: '5px 14px', borderRadius: 999 }}>
            Yes — by about {usd(p.capGap.gap)}
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 10, margin: '14px 0' }}>
          <Stat label={`Cap allows (~${p.capGap.capBasePct}%)`} value={usd(p.capGap.allowedLevy)} />
          <Stat label="Predicted levy" value={usd(p.capGap.predictedLevy)} amber />
          <Stat label="Over the cap by" value={usd(p.capGap.gap)} />
        </div>
        <p style={{ color: '#334155', fontSize: 14.5, lineHeight: 1.6, margin: 0 }}>{p.capGap.summary}</p>

        <h3 style={{ color: '#12385b', marginBottom: 8, marginTop: 18 }}>What could be done to stay under it</h3>
        <div style={{ display: 'grid', gap: 8 }}>
          {p.capGap.levers.map((l, i) => (
            <div key={i} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '11px 14px' }}>
              <strong style={{ color: '#12385b', fontSize: 14.5 }}>{l.lever}</strong>
              <div style={{ color: '#475569', fontSize: 13.8, lineHeight: 1.5, marginTop: 3 }}>{l.detail}</div>
            </div>
          ))}
        </div>
        <p style={{ color: '#64748b', fontSize: 13, marginTop: 12, marginBottom: 0 }}>
          Want to try the trade-offs yourself? The <a href={`${base}/scenarios/`} style={{ color: '#1f5f8f', fontWeight: 700 }}>What-if scenarios</a> page
          has an interactive tool to close the gap with your own mix of cuts, revenue, and reserves — and the
          {' '}<a href={`${base}/tax-cap/`} style={{ color: '#1f5f8f', fontWeight: 700 }}>Tax Cap page</a> explains how the override works.
        </p>
      </section>

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
                  <td style={{ ...td, textAlign: 'right', fontWeight: 800, color: 'var(--inc)' }}>+{a.ratePct}%/yr</td>
                  <td style={{ ...td, color: '#475569', whiteSpace: 'nowrap' }}>{a.recentTrend}</td>
                  <td style={{ ...td, color: '#475569', lineHeight: 1.45 }}>{a.why}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Union contract breakdown */}
      <section style={{ ...card, marginBottom: 16 }}>
        <h2 style={{ marginTop: 0, color: '#12385b' }}>How the Personal Services rate is built</h2>
        <p style={{ color: '#475569', fontSize: 14.5, lineHeight: 1.55, marginTop: 0 }}>{p.unionBreakdown.note}</p>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
            <thead>
              <tr style={{ textAlign: 'left', color: '#64748b', borderBottom: '2px solid #e2e8f0' }}>
                <th style={th}>Union</th>
                <th style={{ ...th, textAlign: 'right' }}>Share of payroll</th>
                <th style={{ ...th, textAlign: 'right' }}>2027 rate used</th>
                <th style={th}>Contract</th>
                <th style={th}>Source</th>
              </tr>
            </thead>
            <tbody>
              {p.unionBreakdown.groups.map((g) => (
                <tr key={g.union} style={{ borderBottom: '1px solid #f1f5f9', verticalAlign: 'top' }}>
                  <td style={{ ...td, fontWeight: 800, color: '#12385b', whiteSpace: 'nowrap' }}>{g.union}</td>
                  <td style={{ ...td, textAlign: 'right', color: '#64748b' }}>{g.payrollSharePct}%</td>
                  <td style={{ ...td, textAlign: 'right', fontWeight: 800, color: 'var(--inc)' }}>
                    +{g.ratePct}%{!g.known2027 && <span style={{ color: '#b45309', fontWeight: 700 }}> (est.)</span>}
                  </td>
                  <td style={{ ...td, color: '#475569' }}>{g.term ?? '—'}</td>
                  <td style={{ ...td, color: '#64748b', fontSize: 12.5, lineHeight: 1.4 }}>{g.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ color: '#64748b', fontSize: 13, marginTop: 10, marginBottom: 0 }}>
          “(est.)” means that union's contract expires 12/31/2026 with no successor yet public — the rate shown is
          that union's own trailing average annual raise from its just-completed contract, used as a placeholder.
        </p>
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
                  <td style={{ ...td, textAlign: 'right', fontWeight: 700, color: 'var(--inc)', whiteSpace: 'nowrap' }}>+{usd(c.delta)} ({c.pct}%)</td>
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
                  <td style={{ ...td, textAlign: 'right', fontWeight: 800, color: 'var(--inc)', whiteSpace: 'nowrap' }}>+{usd(m.delta)}</td>
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
