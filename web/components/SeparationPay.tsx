'use client'

// Aggregate only, by deliberate choice. Every figure here is derived from public
// payroll records that this site already publishes per-person in the Actual Pay
// tab — but presenting named individuals under a payout heading reads as an
// accusation, and the finding is about how the Town tracks a liability, not
// about anyone's conduct. Same standard the employee-donor matching uses:
// disclosure context, not accusation.

export type UnionRollupProp = {
  union: string
  separations: number
  excessOverCareerAverage: number
  medianFinalYearResidual: number
}

export type SeparationPayProps = {
  summary: {
    separations: number
    totalExcess: number
    medianFinalYearResidual: number
    largestFinalYearResidual: number
    concentratedCount: number
    concentratedShare: number
    byUnion: UnionRollupProp[]
  }
  liability: {
    source: { title: string; detail: string }
    series: { asOf: string; amount: number }[]
    gasb101Note: string
  }
  oneYearChange: number
  twoYearChange: number
  whyItMattersNow: string
  caveats: string[]
  whatWouldSettleIt: { document: string; line: string; ask: string }
  unionLabels: Record<string, string>
  overtimeFinalYearRatio: number
}

const usd = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

// lib/payroll.ts's unionLabels only names the actual bargaining units. These are
// the remaining group codes in the payroll data, read off the pay classes and
// titles that carry them — none of them are unions, which is exactly why they
// need spelling out rather than showing as a bare code.
const NON_UNION_LABELS: Record<string, string> = {
  NON: 'Non-represented (incl. part-time & seasonal)',
  APT: 'Appointed board members',
  CON: 'Individual contract',
  ELE: 'Elected',
  // Derived in lib/separation-pay.ts where the Town reported no group code but
  // the pay class still says plainly the person was a department head or
  // contractual employee — no raw union code covers that category, so it keeps
  // its own bucket (unlike the elected/appointed-board inferences, which are
  // folded into ELE/APT directly in separation-pay.ts since those already have
  // a real code).
  '~appointed': 'Department head / appointed — group inferred',
  '~unknown': 'Group not recorded',
}
const groupLabel = (code: string, unionLabels: Record<string, string>) =>
  unionLabels[code] ?? NON_UNION_LABELS[code] ?? code
const card = { background: 'var(--rbl-surface)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 16, padding: 20, boxShadow: '0 14px 34px var(--rbl-shadow)' } as const

export default function SeparationPay(p: SeparationPayProps) {
  const maxLiability = Math.max(...p.liability.series.map((s) => s.amount))

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      {/* Frame: the thing people suspect, and where the money actually is */}
      <section style={{ background: 'var(--rbl-info-bg)', border: '1px solid var(--rbl-info-border)', borderLeft: '6px solid var(--rbl-accent-border)', borderRadius: 14, padding: '16px 18px' }}>
        <strong style={{ color: 'var(--rbl-title)', fontSize: 16 }}>Where end-of-career money actually shows up</strong>
        <p style={{ color: 'var(--rbl-info-text)', fontSize: 14.5, lineHeight: 1.65, margin: '6px 0 0' }}>
          A common suspicion about municipal payroll is that people run up overtime late in a career to lift a pension.
          In Riverhead&apos;s records that is <strong>not</strong> what happens — median final-year overtime is about{' '}
          <strong>{p.overtimeFinalYearRatio.toFixed(2)}×</strong> the same person&apos;s own prior average, meaning
          overtime <em>falls</em> at the end of a career. The end-of-career money is in a different column entirely:
          the residual left when you subtract base pay and overtime from gross pay. That is where accrued-leave payouts
          live.
        </p>
      </section>

      {/* The audited liability — the sourced half */}
      <section style={{ ...card, borderLeft: '6px solid var(--rbl-danger)' }}>
        <div style={{ color: 'var(--rbl-danger)', fontWeight: 900, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          What the Town says it owes
        </div>
        <h3 style={{ margin: '5px 0 4px', color: 'var(--rbl-title)', fontSize: 20 }}>
          Unused leave owed to employees has grown {usd(p.twoYearChange)} in two years
        </h3>
        <p style={{ color: 'var(--rbl-text-body)', fontSize: 14, lineHeight: 1.6, margin: '0 0 14px' }}>
          Town-wide Compensated Absences, from the Town&apos;s own filing. This is an audited balance-sheet figure, not
          an estimate by this site.
        </p>

        <div style={{ display: 'grid', gap: 7, marginBottom: 12 }}>
          {p.liability.series.map((s) => (
            <div key={s.asOf} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ color: 'var(--rbl-text-muted)', fontSize: 12.5, fontWeight: 700, width: 118 }}>{s.asOf}</span>
              <div style={{ flex: 1, background: 'var(--rbl-surface-3)', borderRadius: 5, height: 22, overflow: 'hidden' }}>
                <div style={{ width: `${(s.amount / maxLiability) * 100}%`, background: 'var(--rbl-fill-danger)', height: '100%', borderRadius: 5 }} />
              </div>
              <span style={{ color: 'var(--rbl-text)', fontSize: 13.5, fontWeight: 900, width: 104, textAlign: 'right' }}>{usd(s.amount)}</span>
            </div>
          ))}
        </div>

        <div style={{ background: 'var(--rbl-warn-bg)', border: '1px solid var(--rbl-warn-border)', borderRadius: 10, padding: '12px 14px' }}>
          <strong style={{ color: 'var(--rbl-warn)' }}>Read this before quoting the jump:</strong>{' '}
          <span style={{ color: 'var(--rbl-warn-strong)', fontSize: 14.5, lineHeight: 1.6 }}>{p.liability.gasb101Note}</span>
        </div>

        <p style={{ color: 'var(--rbl-text-muted)', fontSize: 13, lineHeight: 1.6, margin: '12px 0 0' }}>
          Source: {p.liability.source.title} — {p.liability.source.detail}.
        </p>
      </section>

      {/* The cash side, from payroll */}
      <section style={{ ...card, borderLeft: '6px solid var(--rbl-warn)' }}>
        <h3 style={{ margin: '0 0 4px', color: 'var(--rbl-title)', fontSize: 20 }}>What separations actually paid out</h3>
        <p style={{ color: 'var(--rbl-text-muted)', fontSize: 14, lineHeight: 1.6, margin: '0 0 14px', maxWidth: 900 }}>
          For everyone with at least three years on the payroll who stopped appearing before {2025}, comparing their
          final year&apos;s residual pay against their own career average. Measured per person against their own
          history, so a well-paid career doesn&apos;t register as an anomaly.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(185px,1fr))', gap: 10, marginBottom: 16 }}>
          <Stat label="Separations examined" value={p.summary.separations.toLocaleString()} />
          <Stat label="Final-year pay above career average" value={usd(p.summary.totalExcess)} accent />
          <Stat label="Median separation year" value={usd(p.summary.medianFinalYearResidual)} />
          <Stat label="Largest single final year" value={usd(p.summary.largestFinalYearResidual)} />
        </div>

        <div style={{ background: 'var(--rbl-success-bg)', border: '1px solid var(--rbl-success-border)', borderRadius: 10, padding: '12px 14px', marginBottom: 16 }}>
          <strong style={{ color: 'var(--rbl-success-strong)' }}>The median is the important number.</strong>{' '}
          <span style={{ color: 'var(--rbl-success-strong)', fontSize: 14.5, lineHeight: 1.6 }}>
            At {usd(p.summary.medianFinalYearResidual)}, the typical separation is unremarkable. Precisely{' '}
            <strong>{p.summary.concentratedCount} of the {p.summary.separations}</strong> people here account for{' '}
            <strong>{Math.round(p.summary.concentratedShare * 100)}%</strong> of the entire total. This is a tail, not a
            norm, and any reading that implies most departing employees receive a windfall is wrong.
          </span>
        </div>

        <div style={{ background: 'var(--rbl-surface-2)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 10, padding: '11px 13px', marginBottom: 12, color: 'var(--rbl-text-body)', fontSize: 13.5, lineHeight: 1.6 }}>
          <strong style={{ color: 'var(--rbl-title)' }}>Not all of these are unions.</strong> CSEA, the PBA and the SOA are
          bargaining units, and their leave and buy-back terms are set in a negotiated contract. Elected, appointed,
          management and non-represented staff are not union-covered — their leave benefits come from Board policy or
          an individual agreement, which is a different accountability path for the same kind of cost. Where the Town
          reported no group at all, the pay class and job title are used to say at least whether the person was
          union-covered; the rows that remain genuinely unidentifiable are mostly people who left before 2022, when the
          Town began reporting titles and departments at all.
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, minWidth: 520 }}>
            <thead>
              <tr style={{ background: 'var(--rbl-surface-2)' }}>
                <Th align="left">Group</Th>
                <Th align="right">Separations</Th>
                <Th align="right">Final-year pay above career average</Th>
                <Th align="right">Median separation year</Th>
              </tr>
            </thead>
            <tbody>
              {p.summary.byUnion.map((u) => (
                <tr key={u.union} style={{ borderTop: '1px solid var(--rbl-border-subtle)' }}>
                  <Td align="left"><strong style={{ color: 'var(--rbl-title)' }}>{groupLabel(u.union, p.unionLabels)}</strong></Td>
                  <Td align="right">{u.separations}</Td>
                  <Td align="right">{usd(u.excessOverCareerAverage)}</Td>
                  <Td align="right">{usd(u.medianFinalYearResidual)}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Why now */}
      <section style={{ ...card, borderLeft: '6px solid var(--rbl-violet)', background: 'var(--rbl-violet-bg)' }}>
        <h3 style={{ margin: '0 0 6px', color: 'var(--rbl-violet-strong)', fontSize: 17 }}>Why this matters in 2026 specifically</h3>
        <p style={{ color: 'var(--rbl-violet-strong)', fontSize: 14.5, lineHeight: 1.65, margin: 0 }}>{p.whyItMattersNow}</p>
      </section>

      {/* What would settle it */}
      <section style={{ ...card, borderLeft: '6px solid var(--rbl-teal)' }}>
        <h3 style={{ margin: '0 0 8px', color: 'var(--rbl-title)', fontSize: 17 }}>What would settle this</h3>
        <p style={{ color: 'var(--rbl-text-strong)', fontSize: 14.5, lineHeight: 1.65, margin: '0 0 8px' }}>
          <strong>The document:</strong> {p.whatWouldSettleIt.document} — {p.whatWouldSettleIt.line}.
        </p>
        <p style={{ color: 'var(--rbl-text-strong)', fontSize: 14.5, lineHeight: 1.65, margin: 0 }}>
          <strong>What&apos;s missing:</strong> {p.whatWouldSettleIt.ask}
        </p>
      </section>

      {/* Caveats */}
      <section style={{ ...card }}>
        <h3 style={{ margin: '0 0 10px', color: 'var(--rbl-title)', fontSize: 17 }}>The limits of this analysis</h3>
        <ul style={{ margin: 0, paddingLeft: 0, listStyle: 'none', display: 'grid', gap: 9 }}>
          {p.caveats.map((c, i) => (
            <li key={i} style={{ display: 'flex', gap: 9, alignItems: 'baseline', color: 'var(--rbl-text-body)', fontSize: 14.5, lineHeight: 1.6 }}>
              <span aria-hidden style={{ color: 'var(--rbl-text-faint)', fontWeight: 900 }}>›</span>
              <span>{c}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div style={{ background: accent ? 'var(--rbl-warn-bg)' : 'var(--rbl-surface-2)', border: `1px solid ${accent ? 'var(--rbl-warn-border)' : 'var(--rbl-border-subtle)'}`, borderRadius: 10, padding: '10px 13px' }}>
      <div style={{ color: 'var(--rbl-text-muted)', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.4, lineHeight: 1.35 }}>{label}</div>
      <div style={{ color: accent ? 'var(--rbl-warn)' : 'var(--rbl-title)', fontSize: 20, fontWeight: 950, marginTop: 3 }}>{value}</div>
    </div>
  )
}

function Th({ children, align }: { children: React.ReactNode; align: 'left' | 'right' }) {
  return <th style={{ textAlign: align, padding: '9px 11px', color: 'var(--rbl-text-muted)', fontSize: 11.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.4 }}>{children}</th>
}
function Td({ children, align }: { children: React.ReactNode; align: 'left' | 'right' }) {
  return <td style={{ textAlign: align, padding: '10px 11px', color: 'var(--rbl-text-strong)' }}>{children}</td>
}
