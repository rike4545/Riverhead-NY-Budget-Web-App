import PageShell from '../../components/PageShell'
import Budget2027Table from '../../components/Budget2027Table'
import p from '../../public/data/budget-2027-prediction.json'

const base = process.env.NEXT_PUBLIC_BASE_PATH || ''
const usd = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
const card = { background: 'var(--rbl-surface)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 16, padding: 20, boxShadow: '0 14px 34px var(--rbl-shadow)' } as const
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
      subtitle="What next year’s budget could look like if current trends hold. Start with the headline; open the detail as far as you like. This is a model, not the Town’s budget."
    >
      <div style={{ background: 'var(--rbl-warn-bg)', border: '1px solid var(--rbl-warn-border)', borderLeft: '6px solid #ea580c', borderRadius: 12, padding: '14px 16px', marginBottom: 16, color: 'var(--rbl-warn-strong)', fontSize: 14.5, lineHeight: 1.55 }}>
        <strong>Read this first — it’s a prediction, not a fact.</strong> {p.disclaimer}
      </div>

      {/* Headline numbers — the answer. */}
      <section style={{ ...card, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 12, marginBottom: 16 }}>
        <Stat label="2026 adopted (appropriations)" value={usd(t.appropriations2026)} />
        <Stat label="2027 predicted" value={usd(t.appropriations2027)} accent />
        <Stat label="Predicted change" value={`+${usd(t.delta)}`} sub={`+${t.pct}% on ${t.lineItems.toLocaleString()} line items`} />
        <Stat label="Implied levy increase" value={`+${le.levyIncreasePct}%`} sub={`${usd(le.levy2026)} → ${usd(le.levy2027)}`} amber />
      </section>

      {/* The headline finding: pierces the cap. */}
      <section style={{ ...card, marginBottom: 16, borderLeft: '6px solid var(--rbl-danger)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'baseline', justifyContent: 'space-between' }}>
          <h2 style={{ margin: 0, color: 'var(--rbl-title)' }}>Does the 2027 budget pierce the tax cap?</h2>
          <span style={{ background: 'var(--rbl-danger-bg)', color: 'var(--rbl-danger-strong)', fontWeight: 900, fontSize: 14, padding: '5px 14px', borderRadius: 999 }}>
            Yes — by about {usd(p.capGap.gap)}
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 10, margin: '14px 0' }}>
          <Stat label={`Cap allows (~${p.capGap.capBasePct}%)`} value={usd(p.capGap.allowedLevy)} />
          <Stat label="Predicted levy" value={usd(p.capGap.predictedLevy)} amber />
          <Stat label="Over the cap by" value={usd(p.capGap.gap)} />
        </div>
        <p style={{ color: 'var(--rbl-text-strong)', fontSize: 14.5, lineHeight: 1.6, margin: 0 }}>{p.capGap.summary}</p>

        <div style={{ background: 'var(--rbl-success-bg)', border: '1px solid var(--rbl-success-border)', borderRadius: 10, padding: '12px 14px', marginTop: 14 }}>
          <strong style={{ color: 'var(--rbl-success-strong)' }}>How the gap gets closed →</strong>{' '}
          <span style={{ color: 'var(--rbl-text-strong)', fontSize: 14, lineHeight: 1.55 }}>
            The <a href={`${base}/spending-reduction-2027/`} style={{ color: 'var(--rbl-success)', fontWeight: 800 }}>2027 Spending Reduction</a> page
            lays out the plan — the retirement incentive plus sourced trims cover essentially the whole gap. Prefer to try the
            trade-offs yourself? Use the <a href={`${base}/scenarios/`} style={{ color: 'var(--rbl-success)', fontWeight: 800 }}>What-if scenarios</a> tool.
          </span>
        </div>

        <Detail title="Or stay under it another way — the full menu of levers">
          <div style={{ display: 'grid', gap: 8 }}>
            {p.capGap.levers.map((l, i) => (
              <div key={i} style={{ background: 'var(--rbl-surface-2)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 10, padding: '11px 14px' }}>
                <strong style={{ color: 'var(--rbl-title)', fontSize: 14.5 }}>{l.lever}</strong>
                <div style={{ color: 'var(--rbl-text-body)', fontSize: 13.8, lineHeight: 1.5, marginTop: 3 }}>{l.detail}</div>
              </div>
            ))}
          </div>
        </Detail>
      </section>

      {/* Things known to be moving that the line-by-line model can't carry. */}
      <section style={{ ...card, marginBottom: 16, borderLeft: '6px solid var(--rbl-gold-border)' }}>
        <h2 style={{ margin: '0 0 4px', color: 'var(--rbl-title)', fontSize: 18 }}>What to watch — and what this model can&apos;t see</h2>
        <p style={{ color: 'var(--rbl-text-body)', fontSize: 14.2, lineHeight: 1.6, margin: '0 0 12px' }}>
          A line-by-line projection grows what the Town already budgets. It cannot see a decision that
          hasn&apos;t been made yet, or a document that hasn&apos;t been filed. These four are known to be moving.
        </p>
        <div style={{ display: 'grid', gap: 10 }}>
          {p.watchList.map((w) => (
            <div key={w.item} style={{ background: 'var(--rbl-surface-2)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 10, padding: '12px 14px' }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'baseline', flexWrap: 'wrap' }}>
                <strong style={{ color: 'var(--rbl-title)', fontSize: 14.8 }}>{w.item}</strong>
                <span style={{
                  marginLeft: 'auto', fontSize: 11, fontWeight: 900, letterSpacing: 0.3, textTransform: 'uppercase',
                  padding: '2px 7px', borderRadius: 5, whiteSpace: 'nowrap',
                  background: 'var(--rbl-warn-bg)', color: 'var(--rbl-warn-strong)', border: '1px solid var(--rbl-warn-border)',
                }}>{w.effect}</span>
              </div>
              <p style={{ color: 'var(--rbl-text-body)', fontSize: 13.5, lineHeight: 1.55, margin: '5px 0 0' }}>{w.detail}</p>
            </div>
          ))}
        </div>
      </section>

      {/* GO DEEPER — the method and the big tables, progressively disclosed. */}
      <h2 style={{ margin: '26px 0 4px', color: 'var(--rbl-title)', fontSize: 18 }}>Go deeper</h2>
      <p style={{ color: 'var(--rbl-text-muted)', fontSize: 13.5, margin: '0 0 8px' }}>The full model — open only what you want.</p>

      <Detail title="How this projection works — and the assumptions you can argue with">
        <p style={{ color: 'var(--rbl-text-strong)', fontSize: 14.5, lineHeight: 1.6, margin: '0 0 8px' }}>
          The spending side is projected <strong>line by line</strong>: each 2026 amount grows by the rate for its
          category. Add it up and 2027 spending lands near <strong>{usd(t.appropriations2027)}</strong>, up{' '}
          <strong>{t.pct}%</strong>. The tax-levy figure is a separate, illustrative estimate — {le.note.charAt(0).toLowerCase() + le.note.slice(1)}
        </p>
        <p style={{ color: 'var(--rbl-text-body)', fontSize: 14, lineHeight: 1.55, margin: '0 0 12px' }}>{p.method}</p>
        <div style={{ background: 'var(--rbl-info-bg)', border: '1px solid var(--rbl-info-border)', borderRadius: 10, padding: '12px 14px', marginBottom: 14 }}>
          <strong style={{ color: 'var(--rbl-info-text)', fontSize: 14 }}>Debt service is scheduled, not forecast</strong>
          <p style={{ color: 'var(--rbl-info-text)', fontSize: 13.6, lineHeight: 1.55, margin: '4px 0 8px' }}>{p.debtSchedule.note}</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 10 }}>
            <MiniStat label="Principal 2026 → 2027" value={`${usd(p.debtSchedule.principal2026)} → ${usd(p.debtSchedule.principal2027)}`} pct={p.debtSchedule.principalRatePct} />
            <MiniStat label="Interest 2026 → 2027" value={`${usd(p.debtSchedule.interest2026)} → ${usd(p.debtSchedule.interest2027)}`} pct={p.debtSchedule.interestRatePct} />
          </div>
          <div style={{ color: 'var(--rbl-text-muted)', fontSize: 12, marginTop: 8 }}>{p.debtSchedule.source}</div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
            <thead>
              <tr style={{ textAlign: 'left', color: 'var(--rbl-text-muted)', borderBottom: '2px solid var(--rbl-border-subtle)' }}>
                <th style={th}>Category</th>
                <th style={{ ...th, textAlign: 'right' }}>2027 growth used</th>
                <th style={th}>Recent trend</th>
                <th style={th}>Why</th>
              </tr>
            </thead>
            <tbody>
              {p.assumptions.map((a) => (
                <tr key={a.category} style={{ borderBottom: '1px solid var(--rbl-border-subtle)', verticalAlign: 'top' }}>
                  <td style={{ ...td, fontWeight: 800, color: 'var(--rbl-title)', whiteSpace: 'nowrap' }}>{a.category}</td>
                  <td style={{ ...td, textAlign: 'right', fontWeight: 800, color: 'var(--inc)' }}>+{a.ratePct}%/yr</td>
                  <td style={{ ...td, color: 'var(--rbl-text-body)', whiteSpace: 'nowrap' }}>{a.recentTrend}</td>
                  <td style={{ ...td, color: 'var(--rbl-text-body)', lineHeight: 1.45 }}>{a.why}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Detail>

      <Detail title="How the Personal Services rate is built (CSEA/PBA/SOA breakdown)">
        <p style={{ color: 'var(--rbl-text-body)', fontSize: 14.5, lineHeight: 1.55, marginTop: 0 }}>{p.unionBreakdown.note}</p>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
            <thead>
              <tr style={{ textAlign: 'left', color: 'var(--rbl-text-muted)', borderBottom: '2px solid var(--rbl-border-subtle)' }}>
                <th style={th}>Union</th>
                <th style={{ ...th, textAlign: 'right' }}>Share of payroll</th>
                <th style={{ ...th, textAlign: 'right' }}>2027 rate used</th>
                <th style={th}>Contract</th>
                <th style={th}>Source</th>
              </tr>
            </thead>
            <tbody>
              {p.unionBreakdown.groups.map((g) => (
                <tr key={g.union} style={{ borderBottom: '1px solid var(--rbl-border-subtle)', verticalAlign: 'top' }}>
                  <td style={{ ...td, fontWeight: 800, color: 'var(--rbl-title)', whiteSpace: 'nowrap' }}>{g.union}</td>
                  <td style={{ ...td, textAlign: 'right', color: 'var(--rbl-text-muted)' }}>{g.payrollSharePct}%</td>
                  <td style={{ ...td, textAlign: 'right', fontWeight: 800, color: 'var(--inc)' }}>
                    +{g.ratePct}%{!g.known2027 && <span style={{ color: 'var(--rbl-warn)', fontWeight: 700 }}> (est.)</span>}
                  </td>
                  <td style={{ ...td, color: 'var(--rbl-text-body)' }}>{g.term ?? '—'}</td>
                  <td style={{ ...td, color: 'var(--rbl-text-muted)', fontSize: 12.5, lineHeight: 1.4 }}>{g.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ color: 'var(--rbl-text-muted)', fontSize: 13, marginTop: 10, marginBottom: 0 }}>
          &quot;(est.)&quot; means that union&apos;s contract expires 12/31/2026 with no successor yet public — the rate
          shown is that union&apos;s own trailing average annual raise from its just-completed contract, used as a
          placeholder.
        </p>
      </Detail>

      <Detail title="Where the increase comes from (by category)">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
            <thead>
              <tr style={{ textAlign: 'left', color: 'var(--rbl-text-muted)', borderBottom: '2px solid var(--rbl-border-subtle)' }}>
                <th style={th}>Category</th>
                <th style={{ ...th, textAlign: 'right' }}>Lines</th>
                <th style={{ ...th, textAlign: 'right' }}>2026</th>
                <th style={{ ...th, textAlign: 'right' }}>2027 predicted</th>
                <th style={{ ...th, textAlign: 'right' }}>Change</th>
              </tr>
            </thead>
            <tbody>
              {p.byCategory.map((c) => (
                <tr key={c.category} style={{ borderBottom: '1px solid var(--rbl-border-subtle)' }}>
                  <td style={{ ...td, fontWeight: 700, color: 'var(--rbl-title)' }}>{c.category}</td>
                  <td style={{ ...td, textAlign: 'right', color: 'var(--rbl-text-muted)' }}>{c.count}</td>
                  <td style={{ ...td, textAlign: 'right', color: 'var(--rbl-text-muted)' }}>{usd(c.v2026)}</td>
                  <td style={{ ...td, textAlign: 'right', fontWeight: 700 }}>{usd(c.v2027)}</td>
                  <td style={{ ...td, textAlign: 'right', fontWeight: 700, color: 'var(--inc)', whiteSpace: 'nowrap' }}>+{usd(c.delta)} ({c.pct}%)</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Detail>

      <Detail title="The 10 biggest single-line increases">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
            <thead>
              <tr style={{ textAlign: 'left', color: 'var(--rbl-text-muted)', borderBottom: '2px solid var(--rbl-border-subtle)' }}>
                <th style={th}>Line item</th>
                <th style={th}>Fund / Dept</th>
                <th style={{ ...th, textAlign: 'right' }}>2026 → 2027</th>
                <th style={{ ...th, textAlign: 'right' }}>Change</th>
              </tr>
            </thead>
            <tbody>
              {p.topMovers.slice(0, 10).map((m, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--rbl-border-subtle)' }}>
                  <td style={{ ...td, fontWeight: 700, color: 'var(--rbl-title)' }}>{m.name}</td>
                  <td style={{ ...td, color: 'var(--rbl-text-muted)' }}>{m.fund} · {m.dept}</td>
                  <td style={{ ...td, textAlign: 'right', color: 'var(--rbl-text-muted)', whiteSpace: 'nowrap' }}>{usd(m.v2026)} → {usd(m.v2027)}</td>
                  <td style={{ ...td, textAlign: 'right', fontWeight: 800, color: 'var(--inc)', whiteSpace: 'nowrap' }}>+{usd(m.delta)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Detail>

      <Detail title={`Every line, projected (all ${t.lineItems.toLocaleString()} lines)`}>
        <p style={{ color: 'var(--rbl-text-body)', fontSize: 14, lineHeight: 1.55, margin: '0 0 12px' }}>
          Filter by fund or category, search a department, or sort by the biggest movers.
        </p>
        <Budget2027Table />
      </Detail>

      <p style={{ color: 'var(--rbl-text-muted)', fontSize: 13, lineHeight: 1.5, marginTop: 16 }}>
        {p.source} {le.recentLevyIncreases} A prediction is only as good as its assumptions — they’re laid out in
        &ldquo;How this projection works&rdquo; precisely so you can change them in your head and see which way the answer moves.
      </p>
    </PageShell>
  )
}

function Detail({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <details style={{ ...card, padding: 0, marginTop: 12, overflow: 'hidden' }}>
      <summary style={{ cursor: 'pointer', listStyle: 'none', padding: '15px 18px', fontWeight: 800, color: 'var(--rbl-title)', fontSize: 15.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <span>{title}</span>
        <span aria-hidden style={{ color: 'var(--rbl-text-muted)', fontSize: 13, fontWeight: 700 }}>Open ▾</span>
      </summary>
      <div style={{ padding: '0 18px 18px' }}>{children}</div>
    </details>
  )
}

function MiniStat({ label, value, pct }: { label: string; value: string; pct: number }) {
  return (
    <div style={{ background: 'var(--rbl-surface)', border: '1px solid var(--rbl-info-border)', borderRadius: 8, padding: '8px 10px' }}>
      <div style={{ color: 'var(--rbl-text-muted)', fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 0.3 }}>{label}</div>
      <div style={{ color: 'var(--rbl-title)', fontSize: 13.5, fontWeight: 800 }}>{value}</div>
      <div style={{ color: 'var(--dec)', fontSize: 13, fontWeight: 900 }}>{pct}%</div>
    </div>
  )
}

function Stat({ label, value, sub, accent, amber }: { label: string; value: string; sub?: string; accent?: boolean; amber?: boolean }) {
  return (
    <div style={{ background: amber ? 'var(--rbl-warn-bg)' : accent ? 'var(--rbl-info-bg)' : 'var(--rbl-surface-2)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 12, padding: 12 }}>
      <div style={{ color: 'var(--rbl-text-muted)', fontSize: 11.5, textTransform: 'uppercase', fontWeight: 900, letterSpacing: 0.4 }}>{label}</div>
      <strong style={{ fontSize: 20, color: amber ? 'var(--rbl-warn)' : 'var(--rbl-title)' }}>{value}</strong>
      {sub && <div style={{ color: 'var(--rbl-text-muted)', fontSize: 12.5, marginTop: 2 }}>{sub}</div>}
    </div>
  )
}
