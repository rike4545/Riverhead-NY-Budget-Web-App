import PlainCallout from './PlainCallout'
import {
  officerScheduleHiredOnOrAfter20121203,
  officerTopStepHiredBefore20121203,
  detectiveSchedule,
  academyRuleExample,
  source,
  realRaiseExamples,
  realRaiseSource,
  type StepRow,
} from '../lib/pba-step-schedule'

const base = process.env.NEXT_PUBLIC_BASE_PATH || ''
const usd = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
const card = { background: 'white', border: '1px solid #e2e8f0', borderRadius: 16, padding: 18, boxShadow: '0 14px 34px rgba(15,23,42,.05)' } as const
const th = { padding: '8px 9px' } as const
const td = { padding: '7px 9px' } as const

const YEARS = [2023, 2024, 2025, 2026] as const

function pctChange(a: number, b: number) {
  return ((b / a - 1) * 100).toFixed(1)
}

function StepTable({ rows, highlightLast }: { rows: StepRow[]; highlightLast?: boolean }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
        <thead>
          <tr style={{ textAlign: 'left', color: '#64748b', borderBottom: '2px solid #e2e8f0' }}>
            <th style={th}>Step</th>
            {YEARS.map((y) => <th key={y} style={{ ...th, textAlign: 'right' }}>{y}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const isTop = highlightLast && i === rows.length - 1
            return (
              <tr key={r.step} style={{ borderBottom: '1px solid #f1f5f9', background: isTop ? '#fff7ed' : undefined }}>
                <td style={{ ...td, fontWeight: isTop ? 900 : 700, color: '#284a69' }}>{r.step}</td>
                {YEARS.map((y) => <td key={y} style={{ ...td, textAlign: 'right', fontWeight: isTop ? 800 : 500 }}>{usd(r.values[y])}</td>)}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default function PoliceStepSchedule() {
  const rows = officerScheduleHiredOnOrAfter20121203
  const jumps = rows.slice(0, -1).map((r, i) => {
    const next = rows[i + 1]
    return { from: r.step, to: next.step, pct: pctChange(r.values[2025], next.values[2026]) }
  })

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <PlainCallout
        tips={[
          { label: 'Two separate raises', text: 'every year the WHOLE schedule gets an across-the-board % increase (the PBA contract rate) — and separately, each officer with under 6 years of service moves up one step on that new schedule.' },
          { label: 'Steps compound with the raise', text: 'an officer climbing the ladder gets both effects at once, so their actual year-over-year pay jump is much bigger than the contract’s headline %.' },
          { label: 'Two-tier system', text: 'officers hired before 12/3/2012 reach the same top pay a year sooner than officers hired on or after that date — a cost-saving structure the Town negotiated for future hires.' },
        ]}
      >
        Police pay grows two ways at once: the <strong>across-the-board contract increase</strong> that raises every step on
        the schedule (2.5% in 2026, per the PBA contract), and <strong>step advancement</strong> — every officer with under 6
        years of service moves up one step each year, regardless of the contract %. The table below is the actual schedule
        from the signed contract.
      </PlainCallout>

      <section style={card}>
        <h3 style={{ marginTop: 0, color: '#284a69' }}>Police Officer schedule — hired on or after 12/3/2012</h3>
        <p style={{ color: '#64748b', fontSize: 13.5, marginTop: 0 }}>
          Seven steps from Academy to top pay. The Academy rate applies only until the officer completes the Academy and
          reports for regular duty — then they move to the 1st Year Officer rate for one year, and so on.
        </p>
        <StepTable rows={rows} highlightLast />
      </section>

      <section style={card}>
        <h3 style={{ marginTop: 0, color: '#284a69' }}>Officers hired before 12/3/2012</h3>
        <p style={{ color: '#475569', fontSize: 14, lineHeight: 1.55 }}>
          Legacy officers — hired before December 3, 2012 — reach the <strong>same top-step dollar figure</strong> as the
          post-2012 schedule&apos;s 6th Year Officer rate, but a full year sooner: their ladder has no separate 6th-year step.
          Every officer hired before that date has long since reached the top, so the contract no longer needs to spell out
          their early steps.
        </p>
        <StepTable rows={[officerTopStepHiredBefore20121203]} highlightLast />
      </section>

      <section style={card}>
        <h3 style={{ marginTop: 0, color: '#284a69' }}>Detective schedule</h3>
        <p style={{ color: '#64748b', fontSize: 13.5, marginTop: 0 }}>
          Applies once an officer is promoted to detective, regardless of hire date. Three grades, senior grade paying most.
        </p>
        <StepTable rows={detectiveSchedule} />
      </section>

      <section style={{ ...card, background: '#eef6ff', border: '1px solid #bcd9f5' }}>
        <h3 style={{ marginTop: 0, color: '#284a69' }}>What a step increase is actually worth</h3>
        <p style={{ color: '#1f3a52', fontSize: 14.5, lineHeight: 1.6 }}>
          Because step movement and the contract&apos;s across-the-board increase both apply in the same year, an officer
          climbing the ladder sees a much bigger raise than the 2.5% headline rate. Comparing each 2025 step to the next
          step&apos;s 2026 rate:
        </p>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
            <thead>
              <tr style={{ textAlign: 'left', color: '#1f3a52', borderBottom: '2px solid #bcd9f5' }}>
                <th style={th}>Officer&apos;s step move (2025 → 2026)</th>
                <th style={{ ...th, textAlign: 'right' }}>Actual pay increase</th>
              </tr>
            </thead>
            <tbody>
              {jumps.map((j) => (
                <tr key={j.from} style={{ borderBottom: '1px solid #dbeafe' }}>
                  <td style={{ ...td, color: '#284a69', fontWeight: 700 }}>{j.from} → {j.to}</td>
                  <td style={{ ...td, textAlign: 'right', fontWeight: 900, color: 'var(--inc)' }}>+{j.pct}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ color: '#1f3a52', fontSize: 13, marginTop: 10, marginBottom: 0 }}>
          That&apos;s why aggregate Personal Services costs can grow faster than the contract&apos;s headline % in years
          with a lot of junior officers on the force — every one of them is getting a step increase on top of the raise
          everyone gets. It cuts the other way too: an officer who retires at the top step and is replaced by a rookie at
          Academy pay is the single biggest source of savings in the{' '}
          <a href={`${base}/buyout/`} style={{ color: '#4a7297', fontWeight: 800 }}>2026 retirement buyout</a> model.
        </p>
      </section>

      <section style={card}>
        <h3 style={{ marginTop: 0, color: '#284a69' }}>The real 2025 → 2026 raises, by name</h3>
        <p style={{ color: '#475569', fontSize: 14, lineHeight: 1.6 }}>
          The table above is the theoretical schedule. Here&apos;s what actually happened: every currently-serving Police
          Officer&apos;s 2025 and 2026 Board-authorized salary, grouped by officers who saw the exact same before-and-after
          pay. Every group lines up with a step move — plus one thing the base contract table doesn&apos;t show.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
            <thead>
              <tr style={{ textAlign: 'left', color: '#64748b', borderBottom: '2px solid #e2e8f0' }}>
                <th style={th}>Step move</th>
                <th style={{ ...th, textAlign: 'right' }}>2025 actual</th>
                <th style={{ ...th, textAlign: 'right' }}>2026 actual</th>
                <th style={{ ...th, textAlign: 'right' }}>Contract schedule says</th>
                <th style={{ ...th, textAlign: 'right' }}>Unexplained add-on</th>
                <th style={{ ...th, textAlign: 'right' }}>Officers</th>
                <th style={th}>Example</th>
              </tr>
            </thead>
            <tbody>
              {realRaiseExamples.map((r) => (
                <tr key={r.exampleName} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ ...td, color: '#284a69', fontWeight: 700 }}>
                    {r.fromStep === r.toStep ? `${r.fromStep} (no move)` : `${r.fromStep} → ${r.toStep}`}
                  </td>
                  <td style={{ ...td, textAlign: 'right', color: '#64748b' }}>{usd(r.actual2025)}</td>
                  <td style={{ ...td, textAlign: 'right', fontWeight: 800 }}>{usd(r.actual2026)}</td>
                  <td style={{ ...td, textAlign: 'right', color: '#64748b' }}>{usd(r.contractStep2026)}</td>
                  <td style={{ ...td, textAlign: 'right', fontWeight: 800, color: '#b45309' }}>+{usd(r.addOn)}</td>
                  <td style={{ ...td, textAlign: 'right', color: '#64748b' }}>{r.officerCount}</td>
                  <td style={{ ...td, color: '#64748b' }}>{r.exampleName}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ color: '#475569', fontSize: 13, marginTop: 10, marginBottom: 0, lineHeight: 1.5 }}>
          Every single group — from Academy rookies to 32 officers already at the top step — landed exactly{' '}
          <strong>$2,550 above</strong> what the base Article XXXVI step schedule alone predicts for 2026. That&apos;s too
          precise and too universal to be a coincidence, but it isn&apos;t itemized anywhere in the salary article we have —
          it&apos;s likely a holiday-pay or other stipend the Board&apos;s authorized-salary listing folds into
          &quot;annual salary&quot; that the base step table doesn&apos;t separately break out. Source: {realRaiseSource.title}.
          {' '}{realRaiseSource.note}
        </p>
      </section>

      <section style={card}>
        <h3 style={{ marginTop: 0, color: '#284a69' }}>How the Academy step transition works</h3>
        <p style={{ color: '#475569', fontSize: 14, lineHeight: 1.6 }}>{academyRuleExample}</p>
      </section>

      <p style={{ color: '#64748b', fontSize: 13, lineHeight: 1.5 }}>
        Source: {source.title}. {source.note} See the{' '}
        <a href={`${base}/predict-2027/`} style={{ color: '#4a7297', fontWeight: 700 }}>2027 budget prediction</a> for how PBA&apos;s
        2027 rate is estimated now that the contract has expired.
      </p>
    </div>
  )
}
