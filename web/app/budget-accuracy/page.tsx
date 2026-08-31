import PageShell from '../../components/PageShell'
import PlainCallout from '../../components/PlainCallout'
import BudgetAccuracyOutliers from '../../components/BudgetAccuracyOutliers'
import {
  curatedFlags, overBudget, chronicOverrun, noBudget,
  recoverablePool, outlierNote, detectedCount, severityLabel,
} from '../../lib/budget-accuracy'

const card = { background: 'var(--rbl-surface)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 16, padding: 20, boxShadow: '0 14px 34px var(--rbl-shadow)' } as const
const usd = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

const SEV_COLOR: Record<string, string> = {
  critical: 'var(--rbl-danger)',
  high: 'var(--rbl-warn-border)',
  explain: 'var(--rbl-badge)',
}

export const metadata = {
  title: 'Budget Accuracy — where the plan and the spending diverge',
  description:
    'Riverhead budget lines where the adopted amount and the money actually spent are far enough apart that the budget stops being a plan: 11 researched flags plus every outlier detected across ~1,700 expenditure lines.',
}

export default function BudgetAccuracyPage() {
  const critical = curatedFlags.filter((f) => f.severity === 'critical').length

  return (
    <PageShell
      title="Budget accuracy"
      subtitle={`A budget is a promise about what things will cost. These are the lines where that promise and the actual spending drift far enough apart to be worth asking about — ${curatedFlags.length} researched by hand, plus ${detectedCount} more found automatically across roughly 1,700 expenditure lines.`}
    >
      <PlainCallout
        tips={[
          { label: 'Why it matters', text: 'a line budgeted at a fraction of what it really costs makes the whole budget look smaller than it is, and the gap has to be absorbed somewhere later in the year.' },
          { label: 'Not the same as overspending', text: 'a line can be over budget because a bill genuinely rose, or because the budgeted figure was never realistic. The point is to ask which.' },
          { label: 'What is excluded', text: 'mandated costs — pension, workers’ compensation, insurance, debt service, payroll taxes — and revenue lines. Their variance is obligation or timing, not discretion.' },
        ]}
      >
        Of the {curatedFlags.length} researched lines below, <strong>{critical}</strong> are cases where the adopted budget
        repeats a figure the previous year&apos;s actual spending had already blown past. Separately, the Town&apos;s own
        supplement yields <strong>{usd(recoverablePool)}</strong> budgeted above the trailing run-rate on controllable lines.
      </PlainCallout>

      <h2 style={{ color: 'var(--rbl-title)' }}>Researched flags</h2>
      <p style={{ color: 'var(--rbl-text-muted)', fontSize: 14, marginTop: 0 }}>
        Each carries a specific question for the Finance Department, not just a number.
      </p>

      <section style={{ display: 'grid', gap: 12, marginBottom: 22 }}>
        {curatedFlags.map((f) => (
          <div key={f.rank} style={{ ...card, borderLeft: `6px solid ${SEV_COLOR[f.severity] ?? 'var(--rbl-border-subtle)'}` }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
              <span style={{ color: 'var(--rbl-text-muted)', fontWeight: 900, fontSize: 12 }}>#{f.rank}</span>
              <strong style={{ color: 'var(--rbl-title)', fontSize: 16.5 }}>{f.title}</strong>
              <span style={{ marginLeft: 'auto', color: SEV_COLOR[f.severity], fontWeight: 800, fontSize: 11.5, letterSpacing: 0.4, textTransform: 'uppercase' }}>
                {severityLabel[f.severity]}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))', gap: 8, margin: '11px 0' }}>
              <Fig label="2024 budget" value={f.budget2024} />
              <Fig label="2024 actual" value={f.actual2024} strong />
              <Fig label="Variance" value={f.variance} strong />
              <Fig label="2026 adopted" value={f.adopted2026} />
            </div>

            {f.plainEnglish && (
              <p style={{ color: 'var(--rbl-text-body)', fontSize: 14, lineHeight: 1.6, margin: '0 0 8px' }}>{f.plainEnglish}</p>
            )}
            <p style={{ color: 'var(--rbl-text-body)', fontSize: 14.5, lineHeight: 1.6, margin: '0 0 8px' }}>{f.issue}</p>
            <p style={{ color: 'var(--rbl-text-strong)', fontSize: 14, lineHeight: 1.55, margin: 0, fontWeight: 600 }}>
              Ask: {f.action}
            </p>
          </div>
        ))}
      </section>

      <h2 style={{ color: 'var(--rbl-title)' }}>Found automatically</h2>
      <p style={{ color: 'var(--rbl-text-muted)', fontSize: 14, marginTop: 0, lineHeight: 1.6 }}>{outlierNote}</p>

      <BudgetAccuracyOutliers
        overBudget={overBudget}
        chronicOverrun={chronicOverrun}
        noBudget={noBudget}
        recoverablePool={recoverablePool}
      />

      <section style={{ ...card, marginTop: 18 }}>
        <p style={{ color: 'var(--rbl-text-muted)', fontSize: 13, lineHeight: 1.6, margin: 0 }}>
          Researched flags compare the 2024 actual against the 2024 budget and the 2026 adopted amount for the same line.
          The automatic set comes from the Town&apos;s 2026 Budget Supplement, parsed weekly. Neither is an allegation of
          waste — a line can miss because costs genuinely rose. The question each raises is whether the budgeted figure was
          ever realistic.
        </p>
      </section>
    </PageShell>
  )
}

function Fig({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div>
      <div style={{ color: 'var(--rbl-text-muted)', fontSize: 10.5, fontWeight: 800, letterSpacing: 0.4, textTransform: 'uppercase' }}>{label}</div>
      <div style={{ color: strong ? 'var(--rbl-title)' : 'var(--rbl-text-body)', fontSize: 15, fontWeight: strong ? 800 : 600 }}>{value || '—'}</div>
    </div>
  )
}
