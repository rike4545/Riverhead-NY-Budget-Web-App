import PageShell from '../../components/PageShell'
import PlainCallout from '../../components/PlainCallout'
import {
  suffolk, trajectory, theAsk, levers, whyHarder, verdict, sources,
  generalFund2026, generalFund2027, costGrowth, costGrowthPct,
} from '../../lib/zero-percent-2027'
import { capGap2027 } from '../../lib/close-the-gap-2027'

const usd = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
const card = { background: 'var(--rbl-surface)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 16, padding: 20, boxShadow: '0 14px 34px var(--rbl-shadow)' } as const

const KIND: Record<string, { label: string; fg: string; bg: string; bd: string }> = {
  recurring: { label: 'Recurring', fg: 'var(--rbl-success-strong)', bg: 'var(--rbl-success-bg)', bd: 'var(--rbl-success-border)' },
  'one-time': { label: 'One-time', fg: 'var(--rbl-warn-strong)', bg: 'var(--rbl-warn-bg)', bd: 'var(--rbl-warn-border)' },
  legal: { label: 'Cap headroom', fg: 'var(--rbl-violet-strong)', bg: 'var(--rbl-violet-bg)', bd: 'var(--rbl-violet-border)' },
}

export const metadata = {
  title: 'A zero-percent year — what it would take Riverhead to follow Suffolk',
  description:
    'Suffolk County pledged no general fund tax increase for 2027. What the same promise would cost Riverhead: about $3.5 million of General Fund cost growth, the levers that could absorb it, and why a town General Fund is harder to freeze than a county one.',
}

export default function ZeroPercent2027Page() {
  return (
    <PageShell
      title="A zero-percent year"
      subtitle={`Suffolk County has pledged no general fund tax increase for 2027. Riverhead's General Fund is projected to grow ${usd(costGrowth)}. This is what closing that distance would actually take.`}
    >
      <PlainCallout
        tips={[
          { label: 'Levy vs rate', text: 'the levy is the total dollars raised from property tax; the rate is dollars per $1,000 of assessed value. The tax cap governs the levy. Residents feel the rate.' },
          { label: 'General Fund', text: 'the town-wide operating fund. In Riverhead it pays for the police department, general government and most employee benefits.' },
          { label: 'Fund balance', text: 'accumulated surplus from past years. Spending it is not borrowing, but it is finite and it is one-time money.' },
        ]}
      >
        A zero-percent General Fund year for 2027 would have to absorb <strong>{usd(costGrowth)}</strong> of
        projected cost growth — about <strong>52% more</strong> than the {usd(capGap2027.gap)} it would take simply to
        get under the tax cap. Riverhead has the reserves to do it for a year. Doing it durably is a different question,
        and this page separates the two.
      </PlainCallout>

      <section style={{ ...card, marginBottom: 18, borderLeft: '6px solid var(--rbl-info-border)' }}>
        <h2 style={{ marginTop: 0, marginBottom: 6, color: 'var(--rbl-title)', fontSize: 21 }}>What Suffolk actually pledged</h2>
        <blockquote style={{ margin: '0 0 10px', padding: '10px 14px', borderLeft: '3px solid var(--rbl-info-border)', background: 'var(--rbl-info-bg)', borderRadius: 8, color: 'var(--rbl-info-text)', fontSize: 14.2, lineHeight: 1.6 }}>
          {suffolk.pledge}
        </blockquote>
        <div style={{ color: 'var(--rbl-text-muted)', fontSize: 12.6, marginBottom: 10 }}>{suffolk.who}</div>
        <p style={{ color: 'var(--rbl-text-body)', fontSize: 14, lineHeight: 1.6, margin: '0 0 8px' }}>{suffolk.how}</p>
        <div style={{ background: 'var(--rbl-warn-bg)', border: '1px solid var(--rbl-warn-border)', borderRadius: 10, padding: '11px 13px', marginBottom: 8 }}>
          <strong style={{ color: 'var(--rbl-warn-strong)', fontSize: 13.6 }}>The comparison is not like for like:</strong>{' '}
          <span style={{ color: 'var(--rbl-warn-strong)', fontSize: 13.6, lineHeight: 1.55 }}>{suffolk.theCatch}</span>
        </div>
        <p style={{ color: 'var(--rbl-text-muted)', fontSize: 12.6, lineHeight: 1.6, margin: 0 }}>{suffolk.dateNote}</p>
      </section>

      <section style={{ ...card, marginBottom: 18 }}>
        <h2 style={{ marginTop: 0, marginBottom: 8, color: 'var(--rbl-title)', fontSize: 21 }}>Riverhead is moving the other way</h2>
        <div style={{ overflowX: 'auto', marginBottom: 10 }}>
          <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 420, fontSize: 13.4 }}>
            <thead>
              <tr>
                {['Tax rate per $1,000', '2025', '2026', 'Change'].map((h, i) => (
                  <th key={h} style={{ textAlign: i ? 'right' : 'left', padding: '7px 9px', borderBottom: '2px solid var(--rbl-border-subtle)', color: 'var(--rbl-text-muted)', fontSize: 11.4, textTransform: 'uppercase', letterSpacing: 0.4 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {trajectory.rateRows.map((r) => {
                const chg = (r.y2026 / r.y2025 - 1) * 100
                const strong = r.label === 'General Fund rate'
                return (
                  <tr key={r.label}>
                    <td style={{ padding: '7px 9px', borderBottom: '1px solid var(--rbl-border-subtle)', color: 'var(--rbl-title)', fontWeight: strong ? 800 : 600 }}>{r.label}</td>
                    <td style={{ padding: '7px 9px', borderBottom: '1px solid var(--rbl-border-subtle)', textAlign: 'right', color: 'var(--rbl-text-body)' }}>{r.y2025.toFixed(3)}</td>
                    <td style={{ padding: '7px 9px', borderBottom: '1px solid var(--rbl-border-subtle)', textAlign: 'right', color: 'var(--rbl-text-body)' }}>{r.y2026.toFixed(3)}</td>
                    <td style={{ padding: '7px 9px', borderBottom: '1px solid var(--rbl-border-subtle)', textAlign: 'right', color: chg > 0 ? 'var(--rbl-danger-strong)' : 'var(--rbl-success-strong)', fontWeight: 800 }}>
                      {chg >= 0 ? '+' : ''}{chg.toFixed(2)}%
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div style={{ display: 'grid', gap: 6, marginBottom: 10 }}>
          {trajectory.levyHistory.map((r, i, a) => {
            const prev = i > 0 ? a[i - 1] : null
            const span = prev ? r.year - prev.year : 0
            const chg = prev ? (r.levy / prev.levy - 1) * 100 : null
            // 2023 is missing from the parsed history, so one step covers two
            // years. Show the annualised rate rather than letting a two-year
            // change read as an annual one.
            const perYear = prev && span > 1 ? (Math.pow(r.levy / prev.levy, 1 / span) - 1) * 100 : null
            return (
              <div key={r.year} style={{ display: 'flex', gap: 10, alignItems: 'baseline', background: 'var(--rbl-surface-2)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 8, padding: '7px 12px', flexWrap: 'wrap' }}>
                <strong style={{ color: 'var(--rbl-title)', fontSize: 13.4, minWidth: 46 }}>{r.year}</strong>
                <span style={{ color: 'var(--rbl-text-muted)', fontSize: 12.4 }}>General Fund levy</span>
                <span style={{ marginLeft: 'auto', color: 'var(--rbl-title)', fontWeight: 800, fontSize: 14 }}>{usd(r.levy)}</span>
                {chg !== null && (
                  <span style={{ color: chg > 0 ? 'var(--rbl-danger-strong)' : 'var(--rbl-success-strong)', fontWeight: 800, fontSize: 12.8, textAlign: 'right' }}>
                    {chg >= 0 ? '+' : ''}{chg.toFixed(2)}%
                    <span style={{ color: 'var(--rbl-text-muted)', fontWeight: 600, fontSize: 11.6 }}>
                      {span > 1 ? ` over ${span} yrs · ~${perYear!.toFixed(1)}%/yr` : ' vs prior yr'}
                    </span>
                  </span>
                )}
              </div>
            )
          })}
        </div>
        <div style={{ background: 'var(--rbl-warn-bg)', border: '1px solid var(--rbl-warn-border)', borderRadius: 10, padding: '10px 13px', marginBottom: 8 }}>
          <strong style={{ color: 'var(--rbl-warn-strong)', fontSize: 13.2 }}>The direction matters more than any one year:</strong>{' '}
          <span style={{ color: 'var(--rbl-warn-strong)', fontSize: 13.2, lineHeight: 1.55 }}>{trajectory.trendNote}</span>
        </div>
        <p style={{ color: 'var(--rbl-text-muted)', fontSize: 12.6, lineHeight: 1.6, margin: 0 }}>{trajectory.note}</p>
      </section>

      <section style={{ ...card, marginBottom: 18, borderLeft: '6px solid var(--rbl-danger-border)' }}>
        <h2 style={{ marginTop: 0, marginBottom: 8, color: 'var(--rbl-title)', fontSize: 21 }}>{theAsk.headline}</h2>
        <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', marginBottom: 12 }}>
          {[
            { l: 'General Fund, 2026 adopted', v: usd(generalFund2026) },
            { l: 'General Fund, 2027 projected', v: usd(generalFund2027) },
            { l: 'Cost growth to absorb', v: usd(costGrowth), amber: true },
            { l: 'As a percentage', v: `+${costGrowthPct.toFixed(1)}%`, amber: true },
          ].map((s) => (
            <div key={s.l} style={{ background: 'var(--rbl-surface-2)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 12, padding: 12 }}>
              <div style={{ color: 'var(--rbl-text-muted)', fontSize: 11.4, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 0.4 }}>{s.l}</div>
              <strong style={{ fontSize: 19, color: s.amber ? 'var(--rbl-warn-strong)' : 'var(--rbl-title)' }}>{s.v}</strong>
            </div>
          ))}
        </div>
        <p style={{ color: 'var(--rbl-text-body)', fontSize: 14.2, lineHeight: 1.6, margin: '0 0 8px' }}>{theAsk.detail}</p>
        <p style={{ color: 'var(--rbl-text-body)', fontSize: 14, lineHeight: 1.6, margin: '0 0 10px' }}>{theAsk.versusCap}</p>
        <div style={{ background: 'var(--rbl-info-bg)', border: '1px solid var(--rbl-info-border)', borderRadius: 10, padding: '11px 13px' }}>
          <strong style={{ color: 'var(--rbl-info-text)', fontSize: 13.4 }}>What this number is, exactly:</strong>{' '}
          <span style={{ color: 'var(--rbl-info-text)', fontSize: 13.4, lineHeight: 1.55 }}>{theAsk.precision}</span>
        </div>
      </section>

      <h2 style={{ color: 'var(--rbl-title)' }}>What could absorb it</h2>
      <section style={{ display: 'grid', gap: 12, marginBottom: 18 }}>
        {levers.map((l) => {
          const k = KIND[l.kind]
          return (
            <div key={l.name} style={{ ...card, borderLeft: `6px solid ${k.bd}` }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'baseline', flexWrap: 'wrap', marginBottom: 4 }}>
                <strong style={{ color: 'var(--rbl-title)', fontSize: 16.4 }}>{l.name}</strong>
                <span style={{ color: k.fg, background: k.bg, border: `1px solid ${k.bd}`, borderRadius: 999, padding: '2px 9px', fontSize: 10.6, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 0.5 }}>{k.label}</span>
                <span style={{ marginLeft: 'auto', color: 'var(--rbl-title)', fontWeight: 900, fontSize: 17 }}>{l.display}</span>
              </div>
              <div style={{ color: 'var(--rbl-text-muted)', fontSize: 12.4, marginBottom: 6 }}>Covers {l.covers}</div>
              <p style={{ color: 'var(--rbl-text-body)', fontSize: 13.8, lineHeight: 1.6, margin: '0 0 8px' }}>{l.detail}</p>
              <div style={{ background: k.bg, border: `1px solid ${k.bd}`, borderRadius: 10, padding: '10px 13px' }}>
                <strong style={{ color: k.fg, fontSize: 13.2 }}>The catch:</strong>{' '}
                <span style={{ color: k.fg, fontSize: 13.2, lineHeight: 1.55 }}>{l.catch}</span>
              </div>
            </div>
          )
        })}
      </section>

      <section style={{ ...card, marginBottom: 18, borderLeft: '6px solid var(--rbl-violet)' }}>
        <h2 style={{ marginTop: 0, marginBottom: 8, color: 'var(--rbl-title)', fontSize: 21 }}>{whyHarder.headline}</h2>
        <div style={{ display: 'grid', gap: 6, marginBottom: 12 }}>
          {whyHarder.shares.map((s) => (
            <div key={s.label}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 13.4, marginBottom: 2 }}>
                <strong style={{ color: 'var(--rbl-title)' }}>{s.label}</strong>
                <span style={{ color: 'var(--rbl-text-body)' }}>{usd(s.amount)} · {s.pct}%</span>
              </div>
              <div style={{ height: 9, background: 'var(--rbl-surface-2)', borderRadius: 999, overflow: 'hidden' }}>
                <div style={{ width: `${s.pct}%`, height: '100%', background: 'var(--rbl-violet)', borderRadius: 999 }} />
              </div>
            </div>
          ))}
        </div>
        <p style={{ color: 'var(--rbl-text-body)', fontSize: 14, lineHeight: 1.6, margin: '0 0 8px' }}>{whyHarder.detail}</p>
        <div style={{ background: 'var(--rbl-warn-bg)', border: '1px solid var(--rbl-warn-border)', borderRadius: 10, padding: '11px 13px', marginBottom: 8 }}>
          <strong style={{ color: 'var(--rbl-warn-strong)', fontSize: 13.4 }}>And the timing:</strong>{' '}
          <span style={{ color: 'var(--rbl-warn-strong)', fontSize: 13.4, lineHeight: 1.55 }}>{whyHarder.contracts}</span>
        </div>
        <p style={{ color: 'var(--rbl-text-muted)', fontSize: 12.4, lineHeight: 1.6, margin: 0 }}>{whyHarder.sourceNote}</p>
      </section>

      <section style={{ ...card, marginBottom: 18, borderLeft: '6px solid var(--rbl-teal-border)' }}>
        <h2 style={{ marginTop: 0, marginBottom: 8, color: 'var(--rbl-title)', fontSize: 21 }}>So — could Riverhead do it?</h2>
        <div style={{ display: 'grid', gap: 9, marginBottom: 10 }}>
          <div><dt style={{ color: 'var(--rbl-success-strong)', fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 0.4 }}>For one year</dt>
            <dd style={{ margin: '2px 0 0', color: 'var(--rbl-text-body)', fontSize: 14, lineHeight: 1.6 }}>{verdict.oneYear}</dd></div>
          <div><dt style={{ color: 'var(--rbl-warn-strong)', fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 0.4 }}>Durably</dt>
            <dd style={{ margin: '2px 0 0', color: 'var(--rbl-text-body)', fontSize: 14, lineHeight: 1.6 }}>{verdict.durable}</dd></div>
        </div>
        <div style={{ background: 'var(--rbl-teal-bg)', border: '1px solid var(--rbl-teal-border)', borderRadius: 10, padding: '12px 14px' }}>
          <strong style={{ color: 'var(--rbl-teal-strong)', fontSize: 13.6 }}>The point a resident should take away:</strong>{' '}
          <span style={{ color: 'var(--rbl-teal-strong)', fontSize: 13.6, lineHeight: 1.55 }}>{verdict.theRealPoint}</span>
        </div>
      </section>

      <section style={{ ...card }}>
        <h3 style={{ marginTop: 0, color: 'var(--rbl-title)' }}>Sources</h3>
        <ul style={{ margin: 0, paddingLeft: 18, display: 'grid', gap: 9 }}>
          {sources.map((s) => (
            <li key={s.url}>
              <a href={s.url} style={{ color: 'var(--rbl-link)', fontWeight: 700 }}>{s.title}</a>
              <div style={{ color: 'var(--rbl-text-body)', fontSize: 13.2, lineHeight: 1.5 }}>{s.covers}</div>
            </li>
          ))}
        </ul>
      </section>
    </PageShell>
  )
}
