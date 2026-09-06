import PageShell from '../../components/PageShell'
import { analyticsModules, automatedKpis } from '../../lib/analytics-modules'
import { allOperatingFunds2026, fundBalanceUseSummary } from '../../lib/all-funds'
import { dollars } from '../../lib/financial-data'

const card = { background: 'var(--rbl-surface)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 18, padding: 20, boxShadow: '0 14px 34px var(--rbl-shadow)' } as const

export default function AnalyticsPage() {
  const levyTotal = allOperatingFunds2026.reduce((sum, fund) => sum + fund.taxLevy2026, 0)
  const appropriationTotal = allOperatingFunds2026.reduce((sum, fund) => sum + fund.appropriations2026, 0)
  const reserveUse = fundBalanceUseSummary.totalAppropriatedFundBalanceInSummary

  return (
    <PageShell
      title="Riverhead Financial Health"
      subtitle="A plain-English scorecard for the Town’s fiscal position: taxes, spending, savings, debt pressure, and the signals worth watching. Click any indicator to understand what it means and where the number comes from."
    >
      <section style={{ ...card, marginBottom: 18, borderLeft: '6px solid var(--rbl-page-accent)' }}>
        <div style={{ color: 'var(--rbl-badge)', textTransform: 'uppercase', letterSpacing: 1.2, fontSize: 11, fontWeight: 950 }}>How to read this page</div>
        <h2 style={{ margin: '5px 0 7px', fontSize: 24 }}>The goal is not a single “good” or “bad” score.</h2>
        <p style={{ color: 'var(--rbl-text-body)', lineHeight: 1.65, margin: 0, maxWidth: 900 }}>
          Municipal finances have tradeoffs. These indicators show where Riverhead is under pressure, where it has room, and what deserves a closer look. An indicator is a signal — not a conclusion about whether a policy is right or wrong.
        </p>
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 14, marginBottom: 18 }}>
        <Metric label="Operating funds" value={String(allOperatingFunds2026.length)} />
        <Metric label="Appropriations" value={dollars(appropriationTotal)} />
        <Metric label="Tax levy" value={dollars(levyTotal)} />
        <Metric label="Fund balance used" value={dollars(reserveUse)} />
      </section>

      <section style={{ ...card, marginBottom: 18 }}>
        <h2 style={{ marginTop: 0 }}>The signals</h2>
        <p style={{ color: 'var(--rbl-text-muted)' }}>Resident-readable indicators summarize major fiscal patterns while preserving source-backed caution.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 12 }}>
          {automatedKpis.map((kpi) => (
            <article key={kpi.label} style={{ border: '1px solid var(--rbl-border-subtle)', borderRadius: 16, padding: 14, background: 'var(--rbl-surface-2)' }}>
              <div style={{ color: 'var(--rbl-link)', fontWeight: 900, fontSize: 12, textTransform: 'uppercase' }}>{kpi.label}</div>
              <strong style={{ fontSize: 26 }}>{kpi.value}</strong>
              <p style={{ color: 'var(--rbl-text-body)', lineHeight: 1.55 }}>{kpi.explanation}</p>
            </article>
          ))}
        </div>
      </section>

      <section style={{ ...card, marginBottom: 18 }}>
        <h2 style={{ marginTop: 0 }}>Where to go next</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))', gap: 12 }}>
          <Action href="/reserves/" title="Savings & reserves" text="See how much fund balance is being used and what that means." />
          <Action href="/capital-debt/" title="Debt & borrowing" text="Follow outstanding debt, capital financing, and borrowing pressure." />
          <Action href="/compare/" title="What changed?" text="Compare budgets across years and find the biggest movers." />
          <Action href="/scenarios/" title="What if?" text="Test choices and see the tradeoffs rather than guessing." />
        </div>
      </section>

      <section style={card}>
        <h2 style={{ marginTop: 0 }}>Method & data coverage</h2>
        <p style={{ color: 'var(--rbl-text-muted)' }}>The indicators below describe what the site can currently calculate automatically. They are intentionally transparent about their source basis and remaining work.</p>
        <div style={{ display: 'grid', gap: 10 }}>
          {analyticsModules.map((module) => (
            <article key={module.name} style={{ borderTop: '1px solid var(--rbl-border-subtle)', padding: '14px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <h3 style={{ margin: 0 }}>{module.name}</h3>
                <span style={{ fontWeight: 900, color: module.status === 'active' ? 'var(--rbl-success)' : module.status === 'partial' ? 'var(--rbl-warn)' : 'var(--rbl-text-muted)' }}>{module.status}</span>
              </div>
              <p style={{ color: 'var(--rbl-text-strong)' }}>{module.description}</p>
              <p style={{ color: 'var(--rbl-text-muted)', fontSize: 13 }}><strong>Source basis:</strong> {module.sourceBasis}</p>
              <p style={{ color: 'var(--rbl-text-muted)', fontSize: 13 }}><strong>Next step:</strong> {module.nextStep}</p>
            </article>
          ))}
        </div>
      </section>
    </PageShell>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div style={card}>
      <div style={{ color: 'var(--rbl-text-muted)', fontSize: 12, textTransform: 'uppercase', fontWeight: 900 }}>{label}</div>
      <strong style={{ fontSize: 28 }}>{value}</strong>
    </div>
  )
}

function Action({ href, title, text }: { href: string; title: string; text: string }) {
  const base = process.env.NEXT_PUBLIC_BASE_PATH || ''
  return (
    <a href={`${base}${href}`} style={{ display: 'block', color: 'inherit', textDecoration: 'none', border: '1px solid var(--rbl-border-subtle)', borderRadius: 14, padding: 15, background: 'var(--rbl-surface-2)' }}>
      <strong style={{ color: 'var(--rbl-title)' }}>{title} →</strong>
      <p style={{ color: 'var(--rbl-text-muted)', lineHeight: 1.5, margin: '6px 0 0' }}>{text}</p>
    </a>
  )
}
