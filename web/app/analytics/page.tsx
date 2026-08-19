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
    <PageShell title="Trends &amp; risks, at a glance" subtitle="The bigger patterns behind the numbers: how fast the tax levy is climbing, how much the Town leans on its savings, what each fund is made of, and where the pressure points are.">
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 14, marginBottom: 18 }}>
        <Metric label="Operating funds indexed" value={String(allOperatingFunds2026.length)} />
        <Metric label="Appropriations indexed" value={dollars(appropriationTotal)} />
        <Metric label="Tax levy indexed" value={dollars(levyTotal)} />
        <Metric label="Fund balance use" value={dollars(reserveUse)} />
      </section>

      <section style={{ ...card, marginBottom: 18 }}>
        <h2 style={{ marginTop: 0 }}>Automated KPI Engine</h2>
        <p style={{ color: 'var(--rbl-text-muted)' }}>Resident-readable indicators summarize major fiscal signals while preserving source-backed caution.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 12 }}>
          {automatedKpis.map((kpi) => (
            <article key={kpi.label} style={{ border: '1px solid var(--rbl-border-subtle)', borderRadius: 16, padding: 14, background: 'var(--rbl-surface-2)' }}>
              <div style={{ color: 'var(--rbl-link)', fontWeight: 900, fontSize: 12, textTransform: 'uppercase' }}>{kpi.label}</div>
              <strong style={{ fontSize: 26 }}>{kpi.value}</strong>
              <p style={{ color: 'var(--rbl-text-body)' }}>{kpi.explanation}</p>
            </article>
          ))}
        </div>
      </section>

      <section style={card}>
        <h2 style={{ marginTop: 0 }}>Platform Intelligence Modules</h2>
        <p style={{ color: 'var(--rbl-text-muted)' }}>These modules show what is active, partial, or awaiting deeper parsed data.</p>
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
