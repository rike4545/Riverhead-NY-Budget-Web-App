import PageShell from '../../components/PageShell'
import PlainCallout from '../../components/PlainCallout'
import BudgetAccuracyOutliers from '../../components/BudgetAccuracyOutliers'
import {
  curatedFlags, overBudget, chronicOverrun, noBudget,
  recoverablePool, outlierNote, outlierColumns, detectedCount, severityLabel,
  dueInBudgetYear, underBudgeted, chronicUnderBudget, chronicGap, unused, unusedTotal, unusedGeneralFund,
  renumbered, historyActualYears, historyBudgetYear, supplementCount,
  historyNote, underBudgetedShortfall, variance, flagYears, flagCorrections,
} from '../../lib/budget-accuracy'
import { supplementSource } from '../../lib/supplement'

const card = { background: 'var(--rbl-surface)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 16, padding: 20, boxShadow: '0 14px 34px var(--rbl-shadow)' } as const
const usd = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
const money = (n: number | null) => (n === null ? '—' : usd(n))
const th = { padding: '8px 10px' } as const
const thr = { padding: '8px 10px', textAlign: 'right' } as const
const td = { padding: '9px 10px' } as const
const tdr = { padding: '9px 10px', textAlign: 'right', whiteSpace: 'nowrap' } as const
const headRow = { textAlign: 'left', color: 'var(--rbl-text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.4 } as const

const SEV_COLOR: Record<string, string> = {
  critical: 'var(--rbl-danger)',
  high: 'var(--rbl-warn-border)',
  explain: 'var(--rbl-badge)',
}

const FIRST = historyActualYears[0]
const LAST = historyActualYears[historyActualYears.length - 1]
const LAST3 = historyActualYears.slice(-3)

export const metadata = {
  title: 'Budget Accuracy — where the plan and the spending diverge',
  description:
    `Riverhead budget lines where the adopted amount and the money actually spent are far enough apart that the budget stops being a plan: ${curatedFlags.length} researched flags, ${chronicUnderBudget.length} lines over budget three years running, ${unused.length} lines never used, and every outlier in the ${historyBudgetYear} Budget Supplement.`,
}

export default function BudgetAccuracyPage() {
  const critical = curatedFlags.filter((f) => f.severity === 'critical').length

  return (
    <PageShell
      title="Budget accuracy"
      subtitle={`A budget is a promise about what things will cost. These are the lines where that promise and the actual spending drift far enough apart to be worth asking about — ${curatedFlags.length} researched by hand, plus ${detectedCount} found automatically in the ${historyBudgetYear} Budget Supplement and more across ${supplementCount} years of Supplements.`}
    >
      <PlainCallout
        tips={[
          { label: 'Why it matters', text: 'a line budgeted at a fraction of what it really costs makes the whole budget look smaller than it is, and the gap has to be absorbed somewhere later in the year.' },
          { label: 'Not the same as overspending', text: 'a line can be over budget because a bill genuinely rose, or because the budgeted figure was never realistic. The point is to ask which.' },
          { label: 'What is excluded', text: 'mandated costs — pension, workers’ compensation, insurance, debt service, payroll taxes — and revenue lines. Their variance is obligation or timing, not discretion.' },
        ]}
      >
        Of the {curatedFlags.length} researched lines below, <strong>{critical}</strong> ran over budget in both {flagYears.first} and{' '}
        {flagYears.second} and are budgeted below what they cost again in the {flagYears.tentative} Tentative. Across every fund,{' '}
        <strong>{chronicUnderBudget.length}</strong> lines were over budget in each of the last three years, and{' '}
        <strong>{unused.length}</strong> have been budgeted year after year with nothing spent. Separately, the {historyBudgetYear} Supplement
        budgets <strong>{usd(recoverablePool)}</strong> above the trailing run-rate on controllable lines.
      </PlainCallout>

      <h2 style={{ color: 'var(--rbl-title)' }}>The {historyActualYears.length}-year view</h2>
      <p style={{ color: 'var(--rbl-text-muted)', fontSize: 14, marginTop: 0, lineHeight: 1.6 }}>{historyNote}</p>

      {chronicUnderBudget.length > 0 && (
        <section style={{ ...card, marginBottom: 14, borderLeft: '6px solid var(--rbl-danger)' }}>
          <h3 style={{ marginTop: 0, color: 'var(--rbl-title)' }}>Over budget three years running, and budgeted low again</h3>
          <p style={{ color: 'var(--rbl-text-body)', fontSize: 14.5, lineHeight: 1.6, marginTop: 0 }}>
            These lines cost more than their budget in each of {LAST3.join(', ')}. A line can only spend past its budget if money
            is moved to it from other lines during the year, so the adopted budget never shows what these cost. The{' '}
            {historyBudgetYear} Tentative budgets them <strong>{usd(chronicGap)}</strong> below their three-year average.
          </p>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5, minWidth: 640 }}>
              <thead>
                <tr style={headRow}>
                  <th style={th}>Line</th>
                  {LAST3.map((y) => <th key={y} style={thr}>{y}: spent / budget</th>)}
                  <th style={thr}>{historyBudgetYear} Tentative</th>
                </tr>
              </thead>
              <tbody>
                {chronicUnderBudget.map((r) => (
                  <tr key={r.account} style={{ borderTop: '1px solid var(--rbl-border-subtle)' }}>
                    <td style={td}>
                      <strong style={{ color: 'var(--rbl-title)' }}>{r.name}</strong>
                      <div style={{ color: 'var(--rbl-text-muted)', fontSize: 11.5, marginTop: 2 }}>{r.account}{r.page ? ` · p. ${r.page}` : ''}</div>
                    </td>
                    {LAST3.map((y) => (
                      <td key={y} style={tdr}>
                        <strong style={{ color: 'var(--rbl-title)' }}>{usd(r.actual[String(y)])}</strong>
                        <div style={{ color: 'var(--rbl-text-muted)', fontSize: 11.5 }}>{usd(r.adoptedByYear[String(y)])}</div>
                      </td>
                    ))}
                    <td style={{ ...tdr, fontWeight: 800, color: 'var(--rbl-danger)' }}>{usd(r.tentative)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section style={{ ...card, marginBottom: 14, borderLeft: '6px solid var(--rbl-warn-border)' }}>
        <h3 style={{ marginTop: 0, color: 'var(--rbl-title)' }}>Lines that go quiet, then cost real money</h3>
        <p style={{ color: 'var(--rbl-text-body)', fontSize: 14.5, lineHeight: 1.6, marginTop: 0 }}>
          These sit at or near zero for years, so any single-year comparison reads them as dead. Then the bill arrives.
          Across {underBudgeted.length} such lines the {historyBudgetYear} Tentative is <strong>{usd(underBudgetedShortfall)}</strong> short
          of what they have actually cost in the years they happened.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5, minWidth: 620 }}>
            <thead>
              <tr style={headRow}>
                <th style={th}>Line</th>
                <th style={th}>{FIRST}–{LAST} actuals</th>
                <th style={thr}>Costs when it happens</th>
                <th style={thr}>{historyBudgetYear} Tentative</th>
              </tr>
            </thead>
            <tbody>
              {underBudgeted.map((r) => (
                <tr key={r.account} style={{ borderTop: '1px solid var(--rbl-border-subtle)' }}>
                  <td style={td}>
                    <strong style={{ color: 'var(--rbl-title)' }}>{r.name}</strong>
                    <div style={{ color: 'var(--rbl-text-muted)', fontSize: 11.5, marginTop: 2 }}>
                      {r.account} · quiet in {r.quietYears} of {Object.keys(r.series).length} years
                    </div>
                  </td>
                  <td style={td}>
                    <Spark series={r.series} />
                  </td>
                  <td style={{ ...tdr, fontWeight: 800, color: 'var(--rbl-title)' }}>{usd(r.averageWhenActive)}</td>
                  <td style={{ ...tdr, color: r.tentative === 0 ? 'var(--rbl-danger)' : 'var(--rbl-text-body)' }}>
                    {usd(r.tentative)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {unused.length > 0 && (
        <section style={{ ...card, marginBottom: 14 }}>
          <h3 style={{ marginTop: 0, color: 'var(--rbl-title)' }}>Budgeted every year, never used</h3>
          <p style={{ color: 'var(--rbl-text-body)', fontSize: 14.5, lineHeight: 1.6, marginTop: 0 }}>
            {unused.length} lines were budgeted in {historyBudgetYear - 2}, {historyBudgetYear - 1} and the {historyBudgetYear} Tentative with
            nothing spent in {LAST3.join(', ')} or the first half of {historyBudgetYear - 1}. They hold <strong>{usd(unusedTotal)}</strong> in the
            Tentative, {usd(unusedGeneralFund)} of it in the General Fund. Some are a cushion for a rare expense, such as severance, and the
            Board may want to keep those; it should know they have gone unused. Debt payments, reserves and contingencies are left out.
          </p>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5, minWidth: 560 }}>
              <thead>
                <tr style={headRow}>
                  <th style={th}>Line</th>
                  <th style={thr}>{historyBudgetYear - 2} budget</th>
                  <th style={thr}>{historyBudgetYear - 1} budget</th>
                  <th style={thr}>{historyBudgetYear} Tentative</th>
                </tr>
              </thead>
              <tbody>
                {unused.map((r) => (
                  <tr key={r.account} style={{ borderTop: '1px solid var(--rbl-border-subtle)' }}>
                    <td style={td}>
                      <strong style={{ color: 'var(--rbl-title)' }}>{r.name}</strong>
                      <div style={{ color: 'var(--rbl-text-muted)', fontSize: 11.5, marginTop: 2 }}>{r.account}{r.page ? ` · p. ${r.page}` : ''}</div>
                    </td>
                    <td style={tdr}>{usd(r.adoptedPrior)}</td>
                    <td style={tdr}>{usd(r.adopted)}</td>
                    <td style={{ ...tdr, fontWeight: 800, color: 'var(--rbl-title)' }}>{usd(r.tentative)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {dueInBudgetYear.length > 0 && (
        <section style={{ ...card, marginBottom: 14 }}>
          <h3 style={{ marginTop: 0, color: 'var(--rbl-title)' }}>On a cycle, and due again in {historyBudgetYear}</h3>
          <p style={{ color: 'var(--rbl-text-body)', fontSize: 14.5, lineHeight: 1.6, marginTop: 0 }}>
            Spending here repeats on a regular interval rather than every year. The last spike and the interval say the
            next one lands in {historyBudgetYear}, the budget now before the Board.
          </p>
          <div style={{ display: 'grid', gap: 10 }}>
            {dueInBudgetYear.map((c) => (
              <div key={c.account} style={{ border: '1px solid var(--rbl-border-subtle)', borderRadius: 10, padding: '11px 13px', background: 'var(--rbl-warn-bg)' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                  <strong style={{ color: 'var(--rbl-title)', fontSize: 15 }}>{c.name}</strong>
                  <span style={{ color: 'var(--rbl-badge)', fontSize: 11.5, fontWeight: 800 }}>
                    every {c.periodYears} years · last {c.spikeYears[c.spikeYears.length - 1]}
                  </span>
                </div>
                <div style={{ margin: '6px 0' }}><Spark series={c.series} /></div>
                <div style={{ color: 'var(--rbl-text-body)', fontSize: 13 }}>
                  Costs about <strong>{usd(c.spikeAverage)}</strong> when it lands. The {historyBudgetYear} Tentative carries{' '}
                  <strong style={{ color: c.tentative === 0 ? 'var(--rbl-danger)' : 'var(--rbl-title)' }}>{usd(c.tentative)}</strong>.
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
        Each carries a specific question for the Finance Department, not just a number. The figures are read from the
        Town&apos;s Budget Supplements for each account named.
      </p>

      <section style={{ display: 'grid', gap: 12, marginBottom: 14 }}>
        {curatedFlags.map((f) => (
          <div key={f.rank} style={{ ...card, borderLeft: `6px solid ${SEV_COLOR[f.severity] ?? 'var(--rbl-border-subtle)'}` }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
              <span style={{ color: 'var(--rbl-text-muted)', fontWeight: 900, fontSize: 12 }}>#{f.rank}</span>
              <strong style={{ color: 'var(--rbl-title)', fontSize: 16.5 }}>{f.title}</strong>
              <span style={{ marginLeft: 'auto', color: SEV_COLOR[f.severity], fontWeight: 800, fontSize: 11.5, letterSpacing: 0.4, textTransform: 'uppercase' }}>
                {severityLabel[f.severity]}
              </span>
            </div>
            <div style={{ color: 'var(--rbl-text-muted)', fontSize: 11.5, marginTop: 3 }}>
              {f.accounts.length === 1 ? f.accounts[0] : `${f.accounts.length} accounts: ${f.accounts[0].split('-').slice(0, 3).join('-')}-…`}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(118px,1fr))', gap: 8, margin: '11px 0' }}>
              {f.years.map((y) => (
                <div key={y.year} style={{ display: 'contents' }}>
                  <Fig label={`${y.year} budget`} value={money(y.budget)} />
                  <Fig label={`${y.year} actual`} value={money(y.actual)} strong note={variance(y)} />
                </div>
              ))}
              <Fig label={`${flagYears.adopted} adopted`} value={money(f.adopted)} />
              <Fig label={`${flagYears.tentative} Tentative`} value={money(f.tentative)} strong />
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

      <section style={{ ...card, marginBottom: 22, background: 'var(--rbl-info-bg)' }}>
        <h3 style={{ margin: '0 0 6px', color: 'var(--rbl-title)', fontSize: 15.5 }}>Corrected</h3>
        <p style={{ color: 'var(--rbl-text-body)', fontSize: 14, lineHeight: 1.6, margin: 0 }}>{flagCorrections.note}</p>
      </section>

      <h2 style={{ color: 'var(--rbl-title)' }}>Found automatically</h2>
      <p style={{ color: 'var(--rbl-text-muted)', fontSize: 14, marginTop: 0, lineHeight: 1.6 }}>{outlierNote}</p>

      <BudgetAccuracyOutliers
        overBudget={overBudget}
        chronicOverrun={chronicOverrun}
        noBudget={noBudget}
        recoverablePool={recoverablePool}
        columns={outlierColumns}
      />

      <section style={{ ...card, marginTop: 18 }}>
        <p style={{ color: 'var(--rbl-text-muted)', fontSize: 13, lineHeight: 1.6, margin: 0 }}>
          Researched flags show each line&apos;s budget and actual for {flagYears.first} and {flagYears.second}, the {flagYears.adopted} adopted
          amount and the {flagYears.tentative} Tentative. The automatic set comes from the Town&apos;s {historyBudgetYear} Budget
          Supplement{supplementSource ? <> (<a href={supplementSource.url} style={{ color: 'var(--rbl-link)' }}>PDF</a>)</> : null}; the multi-year
          view stacks every Supplement since {historyActualYears[0] + 2}. Actuals are the Town&apos;s books before each year&apos;s audit. None of
          this is an allegation of waste — a line can miss because costs genuinely rose. The question each raises is whether the budgeted
          figure was ever realistic.
        </p>
      </section>
    </PageShell>
  )
}

function Fig({ label, value, strong, note }: { label: string; value: string; strong?: boolean; note?: string }) {
  return (
    <div>
      <div style={{ color: 'var(--rbl-text-muted)', fontSize: 10.5, fontWeight: 800, letterSpacing: 0.4, textTransform: 'uppercase' }}>{label}</div>
      <div style={{ color: strong ? 'var(--rbl-title)' : 'var(--rbl-text-body)', fontSize: 15, fontWeight: strong ? 800 : 600 }}>{value || '—'}</div>
      {note && <div style={{ color: 'var(--rbl-text-muted)', fontSize: 11.5, fontWeight: 700 }}>{note}</div>}
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
