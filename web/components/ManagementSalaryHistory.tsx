// Four years of authorized management pay, against the union grid over the same years.
//
// The table prints each year's figure rather than only a start and an end,
// because the interesting movement is not always at the ends: the January 2023
// awards do not appear in the 2023 column at all -- they were granted on top of
// that schedule and first show up in 2024.

import {
  years, positions, comparison, january2023, offScheduleAwards, gridMoves,
  hourlyChanges, managementMedian, gradedMedian, medianGap, limits, source,
} from '../lib/management-salary-history'

const usd = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
const card = {
  background: 'var(--rbl-surface)', border: '1px solid var(--rbl-border-subtle)',
  borderRadius: 16, padding: 20, boxShadow: '0 14px 34px var(--rbl-shadow)',
} as const
const th = {
  padding: '8px 10px', textAlign: 'left' as const, color: 'var(--rbl-text-muted)',
  fontSize: 11.5, textTransform: 'uppercase' as const, fontWeight: 900, letterSpacing: 0.4,
}
const td = { padding: '8px 10px', verticalAlign: 'top' as const }
const num = { ...td, textAlign: 'right' as const, whiteSpace: 'nowrap' as const, fontWeight: 700 }

export default function ManagementSalaryHistory() {
  const tracked = positions.filter((p) => p.series[0] && p.series[p.series.length - 1])
  const first = years[0]
  const last = years[years.length - 1]

  return (
    <>
      <section style={{ ...card, marginBottom: 16 }}>
        <h3 style={{ marginTop: 0, color: 'var(--rbl-title)' }}>
          The January schedules, {first} to {last}
        </h3>
        <p style={{ color: 'var(--rbl-text-body)', fontSize: 14.5, lineHeight: 1.6, marginTop: 0 }}>
          One year-over-year step tells you something happened. Four tells you whether it is a pattern. These are the
          Board-authorized salaries for the positions the Town sets <strong>individually</strong> — the ones whose
          schedule line carries no grade and step, because they are not on the union grid. That blank column is the
          Town&apos;s own distinction, not one drawn here.
        </p>

        {managementMedian != null && gradedMedian != null && (
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 12,
            marginBottom: 14, padding: 14, borderRadius: 12,
            background: 'var(--rbl-surface-alt)', border: '1px solid var(--rbl-border-subtle)',
          }}>
            <Stat
              label={`Management, ${comparison.from}–${comparison.to}`}
              value={`+${managementMedian.toFixed(1)}%`}
              sub={`median of ${comparison.management.n}, same person and title`}
              accent
            />
            <Stat
              label={`Union grid, ${comparison.from}–${comparison.to}`}
              value={`+${gradedMedian.toFixed(1)}%`}
              sub={`median of ${comparison.graded.n}, same person and title`}
            />
            {medianGap != null && (
              <Stat
                label="Difference"
                value={`${medianGap > 0 ? '+' : ''}${medianGap.toFixed(1)} pts`}
                sub={`${comparison.management.medianWithExcluded != null ? `${(comparison.management.medianWithExcluded - (comparison.graded.medianWithExcluded ?? 0)).toFixed(1)} pts if title changes are folded in` : ''}`}
              />
            )}
          </div>
        )}

        <p style={{ color: 'var(--rbl-text-body)', fontSize: 13.6, lineHeight: 1.6, marginTop: 0, marginBottom: 12 }}>
          A graded employee also moves up steps inside their grade, so neither column is a pure raise rate — and{' '}
          {comparison.management.n} people is a small sample, which is why the difference is shown as a reason to look
          rather than a conclusion. What it is not is an artifact of who got excluded: counting every position whose
          printed title moved, promotions included, leaves the gap in the same direction.
        </p>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--rbl-border-subtle)' }}>
                <th style={th}>Position</th>
                {years.map((y) => <th key={y} style={{ ...th, textAlign: 'right' }}>{y}</th>)}
                <th style={{ ...th, textAlign: 'right' }}>Change</th>
              </tr>
            </thead>
            <tbody>
              {tracked.map((p) => (
                <tr key={p.name} style={{ borderBottom: '1px solid var(--rbl-border-subtle)' }}>
                  <td style={td}>
                    <strong style={{ color: 'var(--rbl-title)' }}>{p.name}</strong>
                    <div style={{ color: 'var(--rbl-text-muted)', fontSize: 11.8, lineHeight: 1.4 }}>
                      {p.titleChanged && p.titles ? p.titles.join(' → ') : p.title}
                      {p.titleChanged && (
                        <span
                          style={{ color: 'var(--rbl-warn-strong)', fontWeight: 700 }}
                          title="The schedule prints a different title in a later year, so this row may be a promotion rather than a raise"
                        > · title changed</span>
                      )}
                    </div>
                  </td>
                  {p.series.map((s, i) => (
                    <td key={years[i]} style={{ ...num, fontWeight: 400 }}>
                      {s ? usd(s.annual) : <span style={{ color: 'var(--rbl-text-muted)' }}>—</span>}
                    </td>
                  ))}
                  <td style={{ ...num, color: (p.pct ?? 0) >= 0 ? 'var(--rbl-warn-strong)' : 'var(--rbl-text-body)' }}>
                    {p.pct == null ? '—' : `${p.pct > 0 ? '+' : ''}${p.pct.toFixed(1)}%`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ color: 'var(--rbl-text-muted)', fontSize: 12.4, lineHeight: 1.5, marginTop: 10, marginBottom: 0 }}>
          A dash means the position does not appear on that year&apos;s General Fund schedule. The change column spans
          the first and last year the position does appear, which is not always {first} to {last}.
        </p>
      </section>

      <section style={{ ...card, marginBottom: 16, borderLeft: '5px solid var(--rbl-warn)' }}>
        <h3 style={{ marginTop: 0, color: 'var(--rbl-title)' }}>Why the schedule is not the answer on its own</h3>
        <p style={{ color: 'var(--rbl-text-body)', fontSize: 14.5, lineHeight: 1.6, marginTop: 0 }}>
          Every figure above is the schedule <em>as adopted in January</em>. On January 4, 2023 the Board adopted the
          schedule and then adopted {january2023.count} resolutions paying people above it — each one worded as an
          increase &ldquo;in addition to the salary set forth in resolution setting salaries for 2023.&rdquo; None of
          them appears in the 2023 column. They surface a year later, in the 2024 schedule, with nothing on that line
          to say where the increase came from.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--rbl-border-subtle)' }}>
                <th style={th}>Resolution</th><th style={th}>Who</th><th style={th}>Instrument</th>
                <th style={{ ...th, textAlign: 'right' }}>Increase</th><th style={th}>Vote</th>
              </tr>
            </thead>
            <tbody>
              {[...offScheduleAwards, ...gridMoves, ...hourlyChanges].map((r) => (
                <tr key={r.resolution} style={{ borderBottom: '1px solid var(--rbl-border-subtle)' }}>
                  <td style={{ ...td, whiteSpace: 'nowrap', fontWeight: 700, color: 'var(--rbl-title)' }}>{r.resolution}</td>
                  <td style={td}>
                    {r.name ?? <span style={{ color: 'var(--rbl-text-muted)' }}>not named in the resolution</span>}
                    <div style={{ color: 'var(--rbl-text-muted)', fontSize: 11.8 }}>{r.title}</div>
                  </td>
                  <td style={td}>
                    {r.mechanism === 'pct' && <strong style={{ color: 'var(--rbl-warn-strong)' }}>{r.value}% of salary</strong>}
                    {r.mechanism === 'flat' && <strong style={{ color: 'var(--rbl-warn-strong)' }}>flat {usd(r.value)}</strong>}
                    {r.mechanism === 'grid' && <span>to a named grade and step</span>}
                    {r.mechanism === 'hourly' && <span>hourly rate → ${r.value.toFixed(2)}</span>}
                  </td>
                  <td style={{ ...num, fontWeight: r.mechanism === 'pct' || r.mechanism === 'flat' ? 800 : 400 }}>
                    {r.increase == null ? <span style={{ color: 'var(--rbl-text-muted)' }}>—</span> : usd(r.increase)}
                  </td>
                  <td style={{ ...td, whiteSpace: 'nowrap' }}>
                    {r.vote === 'unanimous'
                      ? <span style={{ color: 'var(--rbl-text-muted)' }}>unanimous</span>
                      : <strong style={{ color: 'var(--rbl-warn-strong)' }}>{r.vote} · {r.nay} against</strong>}
                  </td>
                </tr>
              ))}
              <tr>
                <td style={{ ...td, fontWeight: 800 }} colSpan={3}>
                  {january2023.pricedCount} of {january2023.count} priced against the adopted schedule
                </td>
                <td style={{ ...num, fontWeight: 900 }}>{usd(january2023.pricedTotal)}</td>
                <td style={td} />
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section style={{ ...card, marginBottom: 16 }}>
        <h3 style={{ marginTop: 0, color: 'var(--rbl-title)' }}>What this section cannot tell you</h3>
        <ul style={{ color: 'var(--rbl-text-body)', fontSize: 13.8, lineHeight: 1.6, paddingLeft: 18, margin: 0 }}>
          {limits.map((l, i) => <li key={i} style={{ marginBottom: 6 }}>{l}</li>)}
        </ul>
        <p style={{ color: 'var(--rbl-text-muted)', fontSize: 12.8, lineHeight: 1.55, marginTop: 12, marginBottom: 0 }}>
          Source: {source.title} — {source.detail}
        </p>
      </section>
    </>
  )
}

function Stat({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div>
      <div style={{ color: 'var(--rbl-text-muted)', fontSize: 11.5, textTransform: 'uppercase', fontWeight: 900, letterSpacing: 0.4 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 900, color: accent ? 'var(--rbl-warn-strong)' : 'var(--rbl-title)', lineHeight: 1.2 }}>{value}</div>
      {sub && <div style={{ color: 'var(--rbl-text-muted)', fontSize: 12, lineHeight: 1.45 }}>{sub}</div>}
    </div>
  )
}
