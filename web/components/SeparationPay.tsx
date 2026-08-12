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
  '(unlabeled)': 'Group not recorded',
}
const groupLabel = (code: string, unionLabels: Record<string, string>) =>
  unionLabels[code] ?? NON_UNION_LABELS[code] ?? code
const card = { background: 'white', border: '1px solid #e2e8f0', borderRadius: 16, padding: 20, boxShadow: '0 14px 34px rgba(15,23,42,.05)' } as const

export default function SeparationPay(p: SeparationPayProps) {
  const maxLiability = Math.max(...p.liability.series.map((s) => s.amount))

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      {/* Frame: the thing people suspect, and where the money actually is */}
      <section style={{ background: '#eef6ff', border: '1px solid #bcd9f5', borderLeft: '6px solid #4a7297', borderRadius: 14, padding: '16px 18px' }}>
        <strong style={{ color: '#284a69', fontSize: 16 }}>Where end-of-career money actually shows up</strong>
        <p style={{ color: '#1f3a52', fontSize: 14.5, lineHeight: 1.65, margin: '6px 0 0' }}>
          A common suspicion about municipal payroll is that people run up overtime late in a career to lift a pension.
          In Riverhead&apos;s records that is <strong>not</strong> what happens — median final-year overtime is about{' '}
          <strong>{p.overtimeFinalYearRatio.toFixed(2)}×</strong> the same person&apos;s own prior average, meaning
          overtime <em>falls</em> at the end of a career. The end-of-career money is in a different column entirely:
          the residual left when you subtract base pay and overtime from gross pay. That is where accrued-leave payouts
          live.
        </p>
      </section>

      {/* The audited liability — the sourced half */}
      <section style={{ ...card, borderLeft: '6px solid #b91c1c' }}>
        <div style={{ color: '#b91c1c', fontWeight: 900, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          What the Town says it owes
        </div>
        <h3 style={{ margin: '5px 0 4px', color: '#284a69', fontSize: 20 }}>
          Unused leave owed to employees has grown {usd(p.twoYearChange)} in two years
        </h3>
        <p style={{ color: '#475569', fontSize: 14, lineHeight: 1.6, margin: '0 0 14px' }}>
          Town-wide Compensated Absences, from the Town&apos;s own filing. This is an audited balance-sheet figure, not
          an estimate by this site.
        </p>

        <div style={{ display: 'grid', gap: 7, marginBottom: 12 }}>
          {p.liability.series.map((s) => (
            <div key={s.asOf} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ color: '#64748b', fontSize: 12.5, fontWeight: 700, width: 118 }}>{s.asOf}</span>
              <div style={{ flex: 1, background: '#f1f5f9', borderRadius: 5, height: 22, overflow: 'hidden' }}>
                <div style={{ width: `${(s.amount / maxLiability) * 100}%`, background: '#b91c1c', height: '100%', borderRadius: 5 }} />
              </div>
              <span style={{ color: '#1f2933', fontSize: 13.5, fontWeight: 900, width: 104, textAlign: 'right' }}>{usd(s.amount)}</span>
            </div>
          ))}
        </div>

        <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 10, padding: '12px 14px' }}>
          <strong style={{ color: '#92400e' }}>Read this before quoting the jump:</strong>{' '}
          <span style={{ color: '#78350f', fontSize: 14.5, lineHeight: 1.6 }}>{p.liability.gasb101Note}</span>
        </div>

        <p style={{ color: '#64748b', fontSize: 13, lineHeight: 1.6, margin: '12px 0 0' }}>
          Source: {p.liability.source.title} — {p.liability.source.detail}.
        </p>
      </section>

      {/* The cash side, from payroll */}
      <section style={{ ...card, borderLeft: '6px solid #b45309' }}>
        <h3 style={{ margin: '0 0 4px', color: '#284a69', fontSize: 20 }}>What separations actually paid out</h3>
        <p style={{ color: '#64748b', fontSize: 14, lineHeight: 1.6, margin: '0 0 14px', maxWidth: 900 }}>
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

        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '12px 14px', marginBottom: 16 }}>
          <strong style={{ color: '#166534' }}>The median is the important number.</strong>{' '}
          <span style={{ color: '#14532d', fontSize: 14.5, lineHeight: 1.6 }}>
            At {usd(p.summary.medianFinalYearResidual)}, the typical separation is unremarkable. This is a tail, not a
            norm — a small number of very large final years make up nearly all of the total. Any reading of this that
            implies most departing employees receive a windfall is wrong.
          </span>
        </div>

        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '11px 13px', marginBottom: 12, color: '#475569', fontSize: 13.5, lineHeight: 1.6 }}>
          <strong style={{ color: '#284a69' }}>Not all of these are unions.</strong> CSEA, the PBA and the SOA are
          bargaining units, and their leave and buy-back terms are set in a negotiated contract. Elected, appointed,
          management and non-represented staff are not union-covered — their leave benefits come from Board policy or
          an individual agreement, which is a different accountability path for the same kind of cost.
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, minWidth: 520 }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                <Th align="left">Group</Th>
                <Th align="right">Separations</Th>
                <Th align="right">Final-year pay above career average</Th>
                <Th align="right">Median separation year</Th>
              </tr>
            </thead>
            <tbody>
              {p.summary.byUnion.map((u) => (
                <tr key={u.union} style={{ borderTop: '1px solid #e2e8f0' }}>
                  <Td align="left"><strong style={{ color: '#284a69' }}>{groupLabel(u.union, p.unionLabels)}</strong></Td>
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
      <section style={{ ...card, borderLeft: '6px solid #7c3aed', background: '#faf5ff' }}>
        <h3 style={{ margin: '0 0 6px', color: '#5b21b6', fontSize: 17 }}>Why this matters in 2026 specifically</h3>
        <p style={{ color: '#4c1d95', fontSize: 14.5, lineHeight: 1.65, margin: 0 }}>{p.whyItMattersNow}</p>
      </section>

      {/* What would settle it */}
      <section style={{ ...card, borderLeft: '6px solid #0d9488' }}>
        <h3 style={{ margin: '0 0 8px', color: '#284a69', fontSize: 17 }}>What would settle this</h3>
        <p style={{ color: '#334155', fontSize: 14.5, lineHeight: 1.65, margin: '0 0 8px' }}>
          <strong>The document:</strong> {p.whatWouldSettleIt.document} — {p.whatWouldSettleIt.line}.
        </p>
        <p style={{ color: '#334155', fontSize: 14.5, lineHeight: 1.65, margin: 0 }}>
          <strong>What&apos;s missing:</strong> {p.whatWouldSettleIt.ask}
        </p>
      </section>

      {/* Caveats */}
      <section style={{ ...card }}>
        <h3 style={{ margin: '0 0 10px', color: '#284a69', fontSize: 17 }}>The limits of this analysis</h3>
        <ul style={{ margin: 0, paddingLeft: 0, listStyle: 'none', display: 'grid', gap: 9 }}>
          {p.caveats.map((c, i) => (
            <li key={i} style={{ display: 'flex', gap: 9, alignItems: 'baseline', color: '#475569', fontSize: 14.5, lineHeight: 1.6 }}>
              <span aria-hidden style={{ color: '#94a3b8', fontWeight: 900 }}>›</span>
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
    <div style={{ background: accent ? '#fff7ed' : '#f8fafc', border: `1px solid ${accent ? '#fed7aa' : '#e2e8f0'}`, borderRadius: 10, padding: '10px 13px' }}>
      <div style={{ color: '#64748b', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.4, lineHeight: 1.35 }}>{label}</div>
      <div style={{ color: accent ? '#b45309' : '#284a69', fontSize: 20, fontWeight: 950, marginTop: 3 }}>{value}</div>
    </div>
  )
}

function Th({ children, align }: { children: React.ReactNode; align: 'left' | 'right' }) {
  return <th style={{ textAlign: align, padding: '9px 11px', color: '#64748b', fontSize: 11.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.4 }}>{children}</th>
}
function Td({ children, align }: { children: React.ReactNode; align: 'left' | 'right' }) {
  return <td style={{ textAlign: align, padding: '10px 11px', color: '#334155' }}>{children}</td>
}
