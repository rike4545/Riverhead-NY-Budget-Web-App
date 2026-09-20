import PageShell from '../../components/PageShell'
import PlainCallout from '../../components/PlainCallout'
import ManagementSalaryHistory from '../../components/ManagementSalaryHistory'
import {
  affectedPositions, salaryMoves, resolution984, appointmentResolutions,
  nyshipIndividualMonthly, restoring25PercentOnFour, twentyPercentAcross22,
  raises2023, limits, sources,
} from '../../lib/management-compensation'

const usd = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
const card = { background: 'var(--rbl-surface)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 16, padding: 20, boxShadow: '0 14px 34px var(--rbl-shadow)' } as const
const th = { padding: '8px 10px' } as const
const td = { padding: '9px 10px' } as const

export const metadata = {
  title: 'Management pay, and the part that never reaches the salary schedule — Riverhead',
  description:
    'In December 2025 the Town Board moved four appointed positions to fully employer-paid health premiums, "in lieu of merit increases." Three weeks later the 2026 salary schedule raised two of them. Both votes were public; neither is visible from the other.',
}

export default function ManagementCompensationPage() {
  const biggest = salaryMoves[0]

  return (
    <PageShell
      title="Management pay, and the part that never reaches the salary schedule"
      subtitle="Riverhead publishes what its employees are paid. It does not publish what they are paid in benefits — and in the space of three weeks the Board used both channels for the same four positions."
    >
      <PlainCallout
        tips={[
          { label: 'Exempt position', text: 'an appointed, at-will job that serves at the pleasure of the Supervisor. No union contract, no step ladder — the Board sets the terms directly by resolution.' },
          { label: 'Premium contribution', text: 'the share of a health insurance premium the employee pays. Moving it from 25% to zero is worth money to the employee and costs the Town money, but it is not a raise and never appears on a salary line.' },
          { label: 'Why both matter together', text: 'the salary schedule is published every January and a resident can read it. The benefit change is a single resolution in a 252-page packet. Read apart, each looks routine.' },
        ]}
      >
        On December 16, 2025 the Board voted unanimously to make health premiums{' '}
        <strong>100% employer paid</strong> for four appointed titles, up from the{' '}
        <strong>25%</strong> those employees had been contributing — giving as its reason that the change was made{' '}
        <strong>&ldquo;in lieu of merit increases.&rdquo;</strong> On January 6, 2026 the Board adopted a salary
        schedule raising the Chief of Staff and Budget Officer by <strong>{biggest.pct.toFixed(1)}%</strong>.
      </PlainCallout>

      <section style={{ ...card, marginBottom: 16, borderLeft: '6px solid var(--rbl-accent-border)' }}>
        <h3 style={{ marginTop: 0, color: 'var(--rbl-title)' }}>What the resolution did</h3>
        <p style={{ color: 'var(--rbl-text-body)', fontSize: 14.5, lineHeight: 1.6, marginTop: 0 }}>
          <strong>Resolution {resolution984.number}</strong>, {resolution984.title}, adopted{' '}
          {new Date(resolution984.adopted + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })},
          effective {resolution984.effective}.
        </p>
        <div style={{ display: 'grid', gap: 10, marginBottom: 12 }}>
          <div style={{ background: 'var(--rbl-surface-2)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 10, padding: '10px 13px' }}>
            <strong style={{ fontSize: 13, color: 'var(--rbl-text-muted)' }}>Before</strong>
            <p style={{ margin: '2px 0 0', fontSize: 14 }}>{resolution984.before}</p>
          </div>
          <div style={{ background: 'var(--rbl-surface-2)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 10, padding: '10px 13px' }}>
            <strong style={{ fontSize: 13, color: 'var(--rbl-text-muted)' }}>After</strong>
            <p style={{ margin: '2px 0 0', fontSize: 14 }}>{resolution984.after}</p>
          </div>
        </div>
        <p style={{ color: 'var(--rbl-text-body)', fontSize: 13.6, lineHeight: 1.6, margin: 0 }}>
          {resolution984.statedReason}
        </p>
        <p style={{ color: 'var(--rbl-text-muted)', fontSize: 12.8, lineHeight: 1.55, margin: '10px 0 0' }}>
          Moved by {resolution984.mover}, seconded by {resolution984.seconder}. Adopted {resolution984.ayes.length}&ndash;{resolution984.nays}:{' '}
          {resolution984.ayes.join(', ')}.
        </p>
      </section>

      <section style={{ ...card, marginBottom: 16 }}>
        <h3 style={{ marginTop: 0, color: 'var(--rbl-title)' }}>What the salary schedule did, three weeks later</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.6 }}>
            <thead>
              <tr style={{ textAlign: 'left', color: 'var(--rbl-text-muted)', borderBottom: '1px solid var(--rbl-border-subtle)' }}>
                <th style={th}>Title named in {resolution984.number}</th>
                <th style={{ ...th, textAlign: 'right' }}>2025</th>
                <th style={{ ...th, textAlign: 'right' }}>2026</th>
                <th style={{ ...th, textAlign: 'right' }}>Change</th>
              </tr>
            </thead>
            <tbody>
              {affectedPositions.map((p) => {
                const has = p.salary2025 !== null && p.salary2026 !== null
                const d = has ? (p.salary2026 as number) - (p.salary2025 as number) : null
                return (
                  <tr key={p.title} style={{ borderBottom: '1px solid var(--rbl-border-subtle)', verticalAlign: 'top' }}>
                    <td style={td}>
                      <strong>{p.title}</strong>
                      {p.holder && <div style={{ color: 'var(--rbl-text-muted)', fontSize: 12.6 }}>{p.holder}</div>}
                      {p.note && <div style={{ color: 'var(--rbl-text-faint)', fontSize: 12.3, lineHeight: 1.45, marginTop: 3, maxWidth: 440 }}>{p.note}</div>}
                    </td>
                    <td style={{ ...td, textAlign: 'right', whiteSpace: 'nowrap' }}>{p.salary2025 === null ? '—' : usd(p.salary2025)}</td>
                    <td style={{ ...td, textAlign: 'right', whiteSpace: 'nowrap' }}>{p.salary2026 === null ? '—' : usd(p.salary2026)}</td>
                    <td style={{ ...td, textAlign: 'right', whiteSpace: 'nowrap', fontWeight: 800, color: d && d > 0 ? 'var(--rbl-warn-strong)' : 'var(--rbl-text-muted)' }}>
                      {d === null ? '—' : `+${usd(d)} · ${(((d) / (p.salary2025 as number)) * 100).toFixed(1)}%`}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <p style={{ color: 'var(--rbl-text-body)', fontSize: 13.6, lineHeight: 1.6, margin: '12px 0 0' }}>
          The Board acknowledged the appointments the same day, under{' '}
          {appointmentResolutions.map((r) => r.number).join(', ')}. Each carries a fiscal impact statement answering{' '}
          <strong>&ldquo;yes.&rdquo;</strong>
        </p>
        <p style={{ color: 'var(--rbl-text-body)', fontSize: 13.6, lineHeight: 1.6, margin: '8px 0 0' }}>
          This is the whole finding, and it is worth stating carefully. A benefit was granted expressly{' '}
          <em>in place of</em> merit increases, and salary increases followed three weeks later for two of the same
          positions. That is not proof the two contradict each other &mdash; a reclassification or added duties would
          explain a raise without being a merit increase, and none of those appear on a schedule either. It does mean
          the record as published supports the question, and nothing in the Town&apos;s material answers it.
        </p>
      </section>

      <section style={{ ...card, marginBottom: 16 }}>
        <h3 style={{ marginTop: 0, color: 'var(--rbl-title)' }}>What a contribution is worth</h3>
        <p style={{ color: 'var(--rbl-text-body)', fontSize: 14.5, lineHeight: 1.6, marginTop: 0 }}>
          Using the NYSHIP Empire Plan participating-agency individual rate of{' '}
          <strong>{usd(nyshipIndividualMonthly)}</strong> a month, at full enrollment:
        </p>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 14.5 }}>
          <span>Restoring the 25% contribution on these four positions</span>
          <strong>{usd(restoring25PercentOnFour)}/yr</strong>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 14.5, marginTop: 6 }}>
          <span>A 20% contribution across ~22 exempt and elected positions</span>
          <strong>{usd(twentyPercentAcross22)}/yr</strong>
        </div>
        <p style={{ color: 'var(--rbl-text-muted)', fontSize: 12.8, lineHeight: 1.55, margin: '10px 0 0' }}>
          Neither is a floor, and the reason cuts both ways. The individual rate is the cheapest enrollment tier and
          the resolution covers dental and vision on top of medical, so a position that is enrolled is understated
          here. But a position that waives Town coverage &mdash; on a spouse&apos;s plan, say &mdash; costs the Town
          nothing and is still counted. Read both as what the policy is worth if every position is enrolled; the Town
          publishes no enrollment by position, so neither correction can be made. The second figure takes its premium,
          position count and rate from this site&apos;s 2027 reduction analysis by import, so the two pages cannot
          quote different numbers &mdash; and the direction is worth noticing: the Town is being asked to consider
          introducing a contribution for twenty-two positions, having removed one from four.
        </p>
      </section>

      <section style={{ ...card, marginBottom: 16 }}>
        <h3 style={{ marginTop: 0, color: 'var(--rbl-title)' }}>This is not the first round</h3>
        <p style={{ color: 'var(--rbl-text-body)', fontSize: 14.5, lineHeight: 1.6, marginTop: 0 }}>
          On January 4, 2023 the Board adopted the year&apos;s salary schedules and then, at the same meeting,
          adopted <strong>{raises2023.count}</strong> further resolutions paying named individuals above them.
          The {raises2023.pricedCount} that can be priced against the adopted schedule come to{' '}
          <strong>{usd(raises2023.pricedTotal)}</strong>.
        </p>
        <p style={{ color: 'var(--rbl-text-body)', fontSize: 14.5, lineHeight: 1.6, marginTop: 0 }}>
          Two instruments were used, and the difference is the point. Most of the fourteen moved someone to a named
          grade and step on a published schedule — a position on a grid anyone can look up. The{' '}
          <strong>{raises2023.offScheduleCount} below</strong> did not: each granted a percentage or a flat sum{' '}
          <em>in addition to</em> the schedule, so the schedule no longer states what the position is paid.
          Together they come to <strong>{usd(raises2023.offScheduleTotal)}</strong>.
        </p>
        <div style={{ display: 'grid', gap: 8, marginBottom: 12 }}>
          {raises2023.named.map((r) => (
            <div key={r.name} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 13.6, flexWrap: 'wrap' }}>
              <span>
                <strong>{r.name}</strong>
                <span style={{ color: 'var(--rbl-text-muted)' }}> · {r.title}</span>
                {!r.unanimous && (
                  <span style={{ color: 'var(--rbl-warn-strong)', fontWeight: 700 }}> · adopted 4–1</span>
                )}
              </span>
              <span style={{ whiteSpace: 'nowrap', color: 'var(--rbl-text-muted)' }}>
                {usd(r.from)} → {usd(r.to)}{' '}
                <strong style={{ color: 'var(--rbl-warn-strong)' }}>{r.mechanism}</strong>{' '}
                <span style={{ fontSize: 12 }}>({r.resolution})</span>
              </span>
            </div>
          ))}
        </div>
        <p style={{ color: 'var(--rbl-text-body)', fontSize: 13.6, lineHeight: 1.6, margin: 0 }}>{raises2023.alreadyBudgeted}</p>
        <p style={{ color: 'var(--rbl-text-body)', fontSize: 13.6, lineHeight: 1.6, margin: '8px 0 0' }}>{raises2023.csea}</p>
      </section>

      <ManagementSalaryHistory />

      <section style={{ ...card, marginBottom: 16 }}>
        <h3 style={{ marginTop: 0, color: 'var(--rbl-title)' }}>What this page cannot tell you</h3>
        <ul style={{ color: 'var(--rbl-text-body)', fontSize: 13.8, lineHeight: 1.6, paddingLeft: 18, margin: 0 }}>
          {limits.map((l, i) => <li key={i} style={{ marginBottom: 6 }}>{l}</li>)}
        </ul>
      </section>

      <p style={{ color: 'var(--rbl-text-muted)', fontSize: 13, lineHeight: 1.55, marginTop: 16 }}>
        Sources: {sources.map((s) => `${s.title} — ${s.detail}`).join(' ')}
      </p>
    </PageShell>
  )
}
