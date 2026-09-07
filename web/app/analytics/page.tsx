import PageShell from '../../components/PageShell'
import RecordTrail from '../../components/RecordTrail'
import ProvenanceLine from '../../components/ProvenanceLine'
import { analyticsModules, automatedKpis } from '../../lib/analytics-modules'
import { allOperatingFunds2026, fundBalanceUseSummary } from '../../lib/all-funds'
import { dollars } from '../../lib/financial-data'

const card = { background: 'var(--rbl-surface)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 18, padding: 20, boxShadow: '0 14px 34px var(--rbl-shadow)' } as const

const kpiLinks: Record<string, string> = {
  '2025 General Fund surplus (actual)': '/general-fund/',
  'Town-wide levy growth': '/tax-bill/',
  'Town-wide appropriation growth': '/what-changed/',
  'Actual payroll (2025)': '/payroll/',
  'Appropriated fund balance used': '/reserves/',
  'Operating funds indexed': '/funds/',
}

const sections = [
  {
    eyebrow: 'Where we are now',
    title: 'Current position',
    text: 'Start with the adopted budget, reserves, debt, and actual payroll before drawing conclusions about fiscal health.',
    links: [
      ['/funds/', '2026 budget', 'What the Town appropriated across operating funds.'],
      ['/reserves/', 'Savings & reserves', 'How much cushion exists and how much is being used.'],
      ['/capital-debt/', 'Debt & capital', 'Outstanding borrowing and capital-financing pressure.'],
      ['/payroll/', 'Actual payroll', 'What the Town actually paid employees, not just authorized salaries.'],
    ],
  },
  {
    eyebrow: 'What moved',
    title: 'What changed',
    text: 'Separate the size of the change from the reason for it, then follow the biggest movers back to the underlying budget records.',
    links: [
      ['/what-changed/', '2025 → 2026', 'Resident summary of the biggest changes.'],
      ['/compare/', 'Line-by-line compare', 'Sort funds, departments, and accounts by what moved most.'],
      ['/budget-accuracy/', 'Budget accuracy', 'Compare prior plans with actual results.'],
      ['/outliers/', 'Outlier watch', 'Find unusually large changes worth a closer read.'],
    ],
  },
  {
    eyebrow: 'Forward looking',
    title: 'What could happen next',
    text: 'Keep projections distinct from adopted policy. These tools show possible 2027 paths and the assumptions behind them.',
    links: [
      ['/predict-2027/', '2027 prediction', 'Transparent baseline projection, not the Town’s budget.'],
      ['/scenarios/', 'Scenario lab', 'Change assumptions and see the tradeoffs.'],
      ['/zero-percent-2027/', 'A zero-percent year', 'What a flat levy would require.'],
      ['/spending-reduction-2027/', 'Spending reduction', 'Where a lower spending path could come from.'],
    ],
  },
  {
    eyebrow: 'Decision layer',
    title: 'What the Board can do',
    text: 'Translate the financial position into actual choices: levy, reserves, spending, staffing, borrowing, and votes.',
    links: [
      ['/fiscal-impact/', 'Fiscal impact', 'See which Board actions move money and how they are described.'],
      ['/meetings/', 'Town Board votes', 'Open the resolution-by-resolution voting record.'],
      ['/tax-cap/', 'Tax cap', 'Understand the legal ceiling and override path.'],
      ['/buyout/', 'Staffing / buyout', 'See the modeled fiscal effect of the retirement initiative.'],
    ],
  },
] as const

export default function AnalyticsPage() {
  const levyTotal = allOperatingFunds2026.reduce((sum, fund) => sum + fund.taxLevy2026, 0)
  const appropriationTotal = allOperatingFunds2026.reduce((sum, fund) => sum + fund.appropriations2026, 0)
  const reserveUse = fundBalanceUseSummary.totalAppropriatedFundBalanceInSummary

  return (
    <PageShell title="Riverhead Financial Health" subtitle="One place to understand where the Town is now, what changed, what could happen next, and the choices the Town Board actually controls.">
      <section style={{ ...card, marginBottom: 18, borderLeft: '6px solid var(--rbl-page-accent)' }}>
        <div style={{ color: 'var(--rbl-badge)', textTransform: 'uppercase', letterSpacing: 1.2, fontSize: 11, fontWeight: 950 }}>How to use this page</div>
        <h2 style={{ margin: '5px 0 7px', fontSize: 24 }}>Financial health is a chain of evidence, not one score.</h2>
        <p style={{ color: 'var(--rbl-text-body)', lineHeight: 1.65, margin: 0, maxWidth: 920 }}>Start with official current-year figures, then examine changes, then projections, then policy choices. That sequence keeps adopted numbers, calculations, and scenarios from being mistaken for one another.</p>
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 14, marginBottom: 18 }}>
        <Metric label="Operating funds" value={String(allOperatingFunds2026.length)} href="/funds/" source="2026 Adopted Budget" />
        <Metric label="Appropriations" value={dollars(appropriationTotal)} href="/what-changed/" source="2026 Adopted Budget" />
        <Metric label="Tax levy" value={dollars(levyTotal)} href="/taxpayer-impact/" source="2026 Adopted Budget" />
        <Metric label="Fund balance used" value={dollars(reserveUse)} href="/reserves/" source="2026 Adopted Budget" />
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 14, marginBottom: 18 }}>
        {sections.map((s) => <HubSection key={s.title} {...s} />)}
      </section>

      <section style={{ ...card, marginBottom: 18 }}>
        <h2 style={{ marginTop: 0, marginBottom: 4 }}>Signals worth watching</h2>
        <p style={{ color: 'var(--rbl-text-muted)', marginTop: 0 }}>These are calculated indicators. Use them to decide where to look next, not as standalone judgments.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 12, marginTop: 14 }}>
          {automatedKpis.map((kpi) => <KpiCard key={kpi.label} label={kpi.label} value={kpi.value} explanation={kpi.explanation} href={kpiLinks[kpi.label]} />)}
        </div>
      </section>

      <RecordTrail title="Trace a fiscal signal across the site" intro="Move from the headline indicator to the budget, taxes, payroll, reserves, debt, Board vote, and original source." items={[
        { href: '/what-changed/', label: 'What Changed', text: 'See the resident-level 2025 → 2026 change summary.' },
        { href: '/taxpayer-impact/', label: 'Where Your Levy Goes', text: 'Translate the levy into fund-level allocation.' },
        { href: '/meetings/', label: 'Town Board Votes', text: 'See which decisions were actually adopted.' },
        { href: '/data-quality/', label: 'Data Quality', text: 'Check source-specific freshness and automated verification.' },
      ]} />

      <section style={{ ...card, marginTop: 18 }}>
        <h2 style={{ marginTop: 0 }}>Method & data coverage</h2>
        <div style={{ display: 'grid', gap: 10 }}>
          {analyticsModules.map((module) => <article key={module.name} style={{ borderTop: '1px solid var(--rbl-border-subtle)', padding: '14px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}><h3 style={{ margin: 0 }}>{module.name}</h3><span style={{ fontWeight: 900, color: module.status === 'active' ? 'var(--rbl-success)' : module.status === 'partial' ? 'var(--rbl-warn)' : 'var(--rbl-text-muted)' }}>{module.status}</span></div>
            <p style={{ color: 'var(--rbl-text-strong)' }}>{module.description}</p>
            <p style={{ color: 'var(--rbl-text-muted)', fontSize: 13 }}><strong>Source basis:</strong> {module.sourceBasis}</p>
            <p style={{ color: 'var(--rbl-text-muted)', fontSize: 13 }}><strong>Next step:</strong> {module.nextStep}</p>
          </article>)}
        </div>
      </section>
    </PageShell>
  )
}

function Metric({ label, value, href, source }: { label: string; value: string; href: string; source: string }) {
  const base = process.env.NEXT_PUBLIC_BASE_PATH || ''
  return <a href={`${base}${href}`} style={{ ...card, display: 'block', color: 'inherit', textDecoration: 'none' }}><div style={{ color: 'var(--rbl-text-muted)', fontSize: 12, textTransform: 'uppercase', fontWeight: 900 }}>{label}</div><strong style={{ fontSize: 28 }}>{value}</strong><ProvenanceLine status="calculated" source={source} asOf="2026 adopted budget" calculation="Aggregated from cited fund records" /></a>
}

function HubSection({ eyebrow, title, text, links }: { eyebrow: string; title: string; text: string; links: readonly (readonly [string, string, string])[] }) {
  const base = process.env.NEXT_PUBLIC_BASE_PATH || ''
  return <section style={card}><div style={{ color: 'var(--rbl-badge)', textTransform: 'uppercase', letterSpacing: .7, fontSize: 11, fontWeight: 950 }}>{eyebrow}</div><h2 style={{ margin: '5px 0 6px', fontSize: 21 }}>{title}</h2><p style={{ color: 'var(--rbl-text-muted)', fontSize: 13.5, lineHeight: 1.5 }}>{text}</p><div style={{ display: 'grid', gap: 8, marginTop: 12 }}>{links.map(([href, label, desc]) => <a key={href} href={`${base}${href}`} style={{ textDecoration: 'none', color: 'inherit', background: 'var(--rbl-surface-2)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 11, padding: 11 }}><strong style={{ color: 'var(--rbl-title)', fontSize: 13.5 }}>{label} →</strong><div style={{ color: 'var(--rbl-text-muted)', fontSize: 12.3, lineHeight: 1.4, marginTop: 3 }}>{desc}</div></a>)}</div></section>
}

function KpiCard({ label, value, explanation, href }: { label: string; value: string; explanation: string; href?: string }) {
  const base = process.env.NEXT_PUBLIC_BASE_PATH || ''
  const body = <><div style={{ color: 'var(--rbl-link)', fontWeight: 900, fontSize: 12, textTransform: 'uppercase' }}>{label}</div><strong style={{ fontSize: 26 }}>{value}</strong><p style={{ color: 'var(--rbl-text-body)', lineHeight: 1.55 }}>{explanation}</p><ProvenanceLine status="calculated" source="Cited site datasets" asOf="latest indexed records" calculation="Automated indicator" /></>
  const style = { border: '1px solid var(--rbl-border-subtle)', borderRadius: 16, padding: 14, background: 'var(--rbl-surface-2)', color: 'inherit', textDecoration: 'none', display: 'block' } as const
  return href ? <a href={`${base}${href}`} style={style}>{body}</a> : <article style={style}>{body}</article>
}
