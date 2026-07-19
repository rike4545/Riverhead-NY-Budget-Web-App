import PageShell from '../../components/PageShell'
import PlainCallout from '../../components/PlainCallout'
import data from '../../public/data/tax-cap.json'

const base = process.env.NEXT_PUBLIC_BASE_PATH || ''
const card = { background: 'white', border: '1px solid #e2e8f0', borderRadius: 16, padding: 20, boxShadow: '0 14px 34px rgba(15,23,42,.05)' } as const
const usd = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

export const metadata = {
  title: 'The tax cap & Riverhead’s overrides',
  description:
    'New York caps how fast a town’s tax levy can grow. Riverhead exceeded the cap five years running (2018–2022) without adopting the required override local law, per its own auditor — and corrected it in 2023.',
}

const STATUS_STYLE: Record<string, { bg: string; fg: string; dot: string }> = {
  'over-no-law': { bg: '#fee2e2', fg: '#991b1b', dot: '#dc2626' },
  'over-with-law': { bg: '#dcfce7', fg: '#166534', dot: '#16a34a' },
  proposed: { bg: '#fef3c7', fg: '#92400e', dot: '#d97706' },
}

export default function TaxCapPage() {
  const d = data

  return (
    <PageShell
      title="The tax cap — and Riverhead’s overrides"
      subtitle="New York limits how fast a town’s property-tax levy can grow. Riverhead’s own auditor found the Town exceeded that cap five years in a row without ever adopting the override local law the law requires — the result of a 2018 miscalculation that went uncorrected until 2023."
    >
      <PlainCallout
        tips={[
          { label: 'It caps the levy, not the rate', text: 'the “tax cap” limits the total dollars a town raises from property taxes (the levy), not the tax rate on any one home.' },
          { label: 'The ceiling', text: 'levy growth is capped at 2% or inflation, whichever is less, after a few adjustments.' },
          { label: 'To go higher', text: 'a town must pass a local law authorizing the override (60% board vote) — before it adopts the budget.' },
        ]}
      >
        This page explains the cap in plain terms, documents a multi-year compliance failure the Town’s auditor
        flagged, and shows why it matters heading into the 2027 budget.
      </PlainCallout>

      <section style={{ ...card, marginBottom: 16 }}>
        <h3 style={{ marginTop: 0 }}>How the cap works</h3>
        <p style={{ color: '#334155', fontSize: 14.5, lineHeight: 1.6, marginTop: 0 }}><strong>The limit.</strong> {d.capBasics.limit}</p>
        <p style={{ color: '#334155', fontSize: 14.5, lineHeight: 1.6, margin: 0 }}><strong>The override.</strong> {d.capBasics.override}</p>
        <p style={{ color: '#64748b', fontSize: 12.5, marginTop: 10, marginBottom: 0 }}>Authority: {d.capBasics.law}</p>
      </section>

      {/* The finding */}
      <section style={{ ...card, marginBottom: 16, borderLeft: '6px solid #dc2626' }}>
        <h3 style={{ marginTop: 0 }}>The finding: five years over the cap, no override law</h3>
        <p style={{ color: '#334155', fontSize: 15, lineHeight: 1.6, marginTop: 0 }}>{d.finding.headline}{' '}{d.finding.cause}</p>
        <blockquote style={{ margin: '0 0 12px', padding: '12px 16px', background: '#fef2f2', borderLeft: '4px solid #fca5a5', borderRadius: 8, color: '#7f1d1d', fontSize: 14, lineHeight: 1.55, fontStyle: 'italic' }}>
          “{d.finding.auditQuote}”
          <span style={{ display: 'block', fontStyle: 'normal', fontSize: 12, color: '#b45309', marginTop: 6 }}>— Town of Riverhead 2022 Audited Basic Financial Statements</span>
        </blockquote>
        <p style={{ color: '#334155', fontSize: 14.5, lineHeight: 1.6, margin: 0 }}>
          <strong>The correction.</strong> {d.finding.correction}
        </p>
      </section>

      {/* Compliance timeline */}
      <section style={{ ...card, marginBottom: 16 }}>
        <h3 style={{ marginTop: 0 }}>Compliance timeline</h3>
        <div style={{ display: 'grid', gap: 8 }}>
          {d.capStatus.map((c) => {
            const st = STATUS_STYLE[c.status]
            return (
              <div key={c.year} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 14px', borderRadius: 10, background: st.bg }}>
                <span style={{ width: 10, height: 10, borderRadius: 999, background: st.dot, flexShrink: 0 }} />
                <span style={{ fontWeight: 900, color: '#284a69', minWidth: 46 }}>{c.year}</span>
                <span style={{ color: st.fg, fontWeight: 700, fontSize: 14 }}>{c.label}</span>
              </div>
            )
          })}
        </div>
        <p style={{ color: '#64748b', fontSize: 12.5, marginTop: 12, marginBottom: 0 }}>
          Status reflects whether the Town adopted the required override local law in each year, per its audited
          financial statements. Years 2018–2022 were over the cap without that local law; 2023 was the first year the
          override was done correctly.
        </p>
      </section>

      {/* Implications */}
      <h2 style={{ color: '#284a69' }}>Why it matters</h2>
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 14, marginBottom: 16 }}>
        {d.implications.map((im, i) => (
          <article key={i} style={{ ...card, borderTop: '5px solid #4a7297' }}>
            <h3 style={{ marginTop: 0, color: '#284a69', fontSize: 16 }}>{im.title}</h3>
            <p style={{ color: '#475569', fontSize: 14, lineHeight: 1.55, margin: 0 }}>{im.text}</p>
          </article>
        ))}
      </section>

      {/* Levy context */}
      <section style={{ ...card, marginBottom: 16 }}>
        <h3 style={{ marginTop: 0 }}>Levy growth, for context</h3>
        <p style={{ color: '#64748b', fontSize: 13, marginTop: 0, lineHeight: 1.5 }}>{d.levyContext.note}</p>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
            <thead>
              <tr style={{ textAlign: 'left', color: '#64748b', borderBottom: '2px solid #e2e8f0' }}>
                <th style={th}>Year</th>
                <th style={{ ...th, textAlign: 'right' }}>General Fund tax levy</th>
                <th style={{ ...th, textAlign: 'right' }}>Change vs prior</th>
              </tr>
            </thead>
            <tbody>
              {d.levyContext.rows.map((r) => (
                <tr key={r.year} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ ...td, fontWeight: 700, color: '#284a69' }}>{r.year}</td>
                  <td style={{ ...td, textAlign: 'right' }}>{usd(r.levy)}</td>
                  <td style={{ ...td, textAlign: 'right', fontWeight: 700, color: r.pct > 2 ? '#b91c1c' : r.pct < 0 ? '#166534' : '#475569' }}>
                    {r.pct > 0 ? '+' : ''}{r.pct.toFixed(2)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ color: '#64748b', fontSize: 12.5, marginTop: 10, marginBottom: 0 }}>
          Red marks years the General Fund levy grew faster than the ~2% cap. This is the General Fund portion only;
          the statutory cap applies to the total levy across all town funds, and the precise allowable limit each year
          also depends on exclusions and the tax-base-growth factor — so treat this as directional context, and rely on
          the auditor’s finding above for the compliance conclusion.
        </p>
      </section>

      <p style={{ color: '#64748b', fontSize: 13, lineHeight: 1.5 }}>
        Sources: {d.sources.join(' · ')} Independent public-information project — verify against the official audited
        statements before relying on these figures.
      </p>
    </PageShell>
  )
}

const th = { padding: '8px 10px' } as const
const td = { padding: '8px 10px' } as const
