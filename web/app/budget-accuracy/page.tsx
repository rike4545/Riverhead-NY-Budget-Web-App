import PageShell from '../../components/PageShell'
import PlainCallout from '../../components/PlainCallout'
import BudgetAccuracyOutliers from '../../components/BudgetAccuracyOutliers'
import {
  curatedFlags, overBudget, chronicOverrun, noBudget,
  recoverablePool, outlierNote, detectedCount, severityLabel,
  dueIn2027, underBudgeted, renumbered, actualYears,
  accountsTracked, historyNote, underBudgetedShortfall,
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

      <h2 style={{ color: 'var(--rbl-title)' }}>The seven-year view</h2>
      <p style={{ color: 'var(--rbl-text-muted)', fontSize: 14, marginTop: 0, lineHeight: 1.6 }}>{historyNote}</p>

      <section style={{ ...card, marginBottom: 14, borderLeft: '6px solid var(--rbl-warn-border)' }}>
        <h3 style={{ marginTop: 0, color: 'var(--rbl-title)' }}>Lines that go quiet, then cost real money</h3>
        <p style={{ color: 'var(--rbl-text-body)', fontSize: 14.5, lineHeight: 1.6, marginTop: 0 }}>
          These sit at or near zero for years, so any single-year comparison reads them as dead. Then the bill arrives.
          Across {underBudgeted.length} such lines the 2026 budget is <strong>{usd(underBudgetedShortfall)}</strong> short
          of what they have actually cost in the years they happened.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5, minWidth: 620 }}>
            <thead>
              <tr style={{ textAlign: 'left', color: 'var(--rbl-text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.4 }}>
                <th style={{ padding: '8px 10px' }}>Line</th>
                <th style={{ padding: '8px 10px' }}>{actualYears[0]}–{actualYears[actualYears.length - 1]} actuals</th>
                <th style={{ padding: '8px 10px', textAlign: 'right' }}>Costs when it happens</th>
                <th style={{ padding: '8px 10px', textAlign: 'right' }}>2026 budget</th>
              </tr>
            </thead>
            <tbody>
              {underBudgeted.map((r) => (
                <tr key={r.account} style={{ borderTop: '1px solid var(--rbl-border-subtle)' }}>
                  <td style={{ padding: '9px 10px' }}>
                    <strong style={{ color: 'var(--rbl-title)' }}>{r.name}</strong>
                    <div style={{ color: 'var(--rbl-text-muted)', fontSize: 11.5, marginTop: 2 }}>
                      quiet in {r.quietYears} of {Object.keys(r.series).length} years
                    </div>
                  </td>
                  <td style={{ padding: '9px 10px' }}>
                    <Spark series={r.series} />
                  </td>
                  <td style={{ padding: '9px 10px', textAlign: 'right', fontWeight: 800, color: 'var(--rbl-title)', whiteSpace: 'nowrap' }}>{usd(r.averageWhenActive)}</td>
                  <td style={{ padding: '9px 10px', textAlign: 'right', whiteSpace: 'nowrap', color: r.tentative2026 === 0 ? 'var(--rbl-danger)' : 'var(--rbl-text-body)' }}>
                    {usd(r.tentative2026)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {dueIn2027.length > 0 && (
        <section style={{ ...card, marginBottom: 14 }}>
          <h3 style={{ marginTop: 0, color: 'var(--rbl-title)' }}>On a cycle, and due again in 2027</h3>
          <p style={{ color: 'var(--rbl-text-body)', fontSize: 14.5, lineHeight: 1.6, marginTop: 0 }}>
            Spending here repeats on a regular interval rather than every year. The last spike and the interval say the
            next one lands in 2027, which is the budget being written now.
          </p>
          <div style={{ display: 'grid', gap: 10 }}>
            {dueIn2027.map((c) => (
              <div key={c.account} style={{ border: '1px solid var(--rbl-border-subtle)', borderRadius: 10, padding: '11px 13px', background: 'var(--rbl-warn-bg)' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                  <strong style={{ color: 'var(--rbl-title)', fontSize: 15 }}>{c.name}</strong>
                  <span style={{ color: 'var(--rbl-badge)', fontSize: 11.5, fontWeight: 800 }}>
                    every {c.periodYears} years · last {c.spikeYears[c.spikeYears.length - 1]}
                  </span>
                </div>
                <div style={{ margin: '6px 0' }}><Spark series={c.series} /></div>
                <div style={{ color: 'var(--rbl-text-body)', fontSize: 13 }}>
                  Costs about <strong>{usd(c.spikeAverage)}</strong> when it lands. The 2026 budget carries{' '}
                  <strong style={{ color: c.tentative2026 === 0 ? 'var(--rbl-danger)' : 'var(--rbl-title)' }}>{usd(c.tentative2026)}</strong>.
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {renumbered.length > 0 && (
        <section style={{ ...card, marginBottom: 22 }}>
          <h3 style={{ marginTop: 0, color: 'var(--rbl-title)' }}>Renumbered, not abandoned</h3>
          <p style={{ color: 'var(--rbl-text-body)', fontSize: 14.5, lineHeight: 1.6, marginTop: 0 }}>
            These accounts stopped and an identically-named one started. Nothing was cut and nothing appeared from
            nowhere — the money moved account numbers. They are listed so neither half gets read as a finding.
          </p>
          {renumbered.map((r) => (
            <div key={r.oldAccount} style={{ borderTop: '1px solid var(--rbl-border-subtle)', paddingTop: 9, marginTop: 9 }}>
              <strong style={{ color: 'var(--rbl-title)', fontSize: 14.5 }}>{r.name}</strong>
              <div style={{ color: 'var(--rbl-text-muted)', fontSize: 12.4, marginTop: 3, lineHeight: 1.5 }}>
                {r.oldAccount} through {r.lastYear} → {r.newAccount} from {r.firstYear}. Peak {usd(r.peak)}.
              </div>
            </div>
          ))}
        </section>
      )}

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

function Spark({ series }: { series: Record<string, number> }) {
  const years = Object.keys(series).sort()
  const max = Math.max(...years.map((y) => Math.abs(series[y])), 1)
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 30 }} aria-hidden>
      {years.map((y) => {
        const v = series[y]
        const h = Math.max(2, Math.round((Math.abs(v) / max) * 28))
        return (
          <div key={y} title={`${y}: ${v.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}`}
            style={{ width: 9, height: h, borderRadius: 2, background: v > 0 ? 'var(--rbl-series-blue)' : 'var(--rbl-border-subtle)' }} />
        )
      })}
    </div>
  )
}
