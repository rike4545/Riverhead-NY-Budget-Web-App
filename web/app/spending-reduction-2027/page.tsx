import PageShell from '../../components/PageShell'
import PlainCallout from '../../components/PlainCallout'
import SpendingReductionToggleList from '../../components/SpendingReductionToggleList'
import { fullRecurringReductionPackage, modeledAutomaticPayrollPressure } from '../../lib/spending-reduction-2027'
import { builtFromDocuments } from '../../lib/built-from-documents'
import { acrossTheBoard2027 as atb } from '../../lib/across-the-board-2027'

const usd = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
const card = { background: 'white', border: '1px solid #e2e8f0', borderRadius: 16, padding: 20, boxShadow: '0 14px 34px rgba(15,23,42,.05)' } as const
const KIND: Record<string, { color: string; bg: string }> = {
  budget: { color: '#1e40af', bg: '#dbeafe' },
  supplement: { color: '#166534', bg: '#dcfce7' },
  afr: { color: '#92400e', bg: '#fef3c7' },
}

export const metadata = {
  title: '2027 Spending Reduction — a real, sourced savings package',
  description:
    'Every real, individually-sourced recurring spending-reduction candidate identified for the 2027 budget, toggleable so you can build your own package and see it against the modeled payroll-pressure gap.',
}

export default function SpendingReduction2027Page() {
  return (
    <PageShell
      title="2027 Spending Reduction"
      subtitle="A real, sourced recurring spending-reduction package for the 2027 budget — not a wishlist. Toggle items to build your own package and watch it move against the modeled payroll-pressure gap."
    >
      {/* 1 — The gap, and how this closes it. */}
      <PlainCallout title="The 2027 gap, and how this closes it">
        The modeled 2027 automatic payroll-pressure gap — the recurring cost the Town has to cover just to stand
        still — is <strong>{usd(modeledAutomaticPayrollPressure)}</strong>. The package below totals{' '}
        <strong>{usd(fullRecurringReductionPackage)}</strong> in real, individually-sourced recurring savings and
        cost-recovery, enough to cover that gap several times over. It deliberately excludes the single largest
        driver of pressure — about $907.9K of contractually locked PBA/SOA/CSEA union wage growth — which can&apos;t be
        cut without a successor labor agreement. Toggle any item to build your own package.
      </PlainCallout>

      {/* 2 — The interactive package (centerpiece). */}
      <div style={{ marginTop: 16 }}>
        <SpendingReductionToggleList />
      </div>

      {/* 3 — Inflation / buying-power lens. */}
      <section style={{ ...card, marginTop: 16, borderLeft: '6px solid #c99a2e' }}>
        <h2 style={{ margin: '0 0 6px', color: '#284a69', fontSize: 17 }}>In real terms: the cost of standing still</h2>
        <p style={{ color: '#334155', fontSize: 14.5, lineHeight: 1.6, margin: 0 }}>
          Most of that {usd(modeledAutomaticPayrollPressure)} gap isn&apos;t new programs — it&apos;s the automatic
          cost-of-living growth built into payroll (the model uses a 2.5% COLA). Meanwhile New York&apos;s tax cap
          limits the Town&apos;s levy growth to the <em>lesser</em> of 2% or inflation. So contracted costs are set to
          rise about as fast as — or faster than — the revenue the Town is allowed to raise.
        </p>
        <p style={{ color: '#334155', fontSize: 14.5, lineHeight: 1.6, margin: '10px 0 0' }}>
          That cuts both ways when reading a &ldquo;cut.&rdquo; Because prices keep rising, a line that merely holds
          flat in dollars is already a real cut in what it buys — and a savings target set in today&apos;s dollars
          buys a little less each year it slips. The honest way to read this package is in <strong>recurring, real
          terms</strong>: it&apos;s about keeping recurring costs within recurring revenue as both are pushed by
          inflation, not a one-time patch.
        </p>
        <p style={{ color: '#6b7280', fontSize: 12, marginTop: 10, marginBottom: 0 }}>
          Inflation reference: U.S. Bureau of Labor Statistics, Consumer Price Index. Levy-growth limit: NY&apos;s
          2% property-tax cap (the lesser of 2% or CPI).
        </p>
      </section>

      {/* 4 — The blunter alternative: a flat 2.5% cut. */}
      <section style={{ ...card, marginTop: 16 }}>
        <h2 style={{ margin: '0 0 4px', color: '#284a69', fontSize: 17 }}>The blunter alternative: a flat 2.5% cut</h2>
        <p style={{ color: '#64748b', fontSize: 13.5, margin: '0 0 12px' }}>
          Instead of the targeted lines above, a Supervisor could simply tell every department to cut 2.5%. Here&apos;s
          how that actually pencils out — and why the blunt version overstates what&apos;s really cuttable.
        </p>

        <div style={{ display: 'grid', gap: 8, marginBottom: 14 }}>
          {atb.bases.map((b) => (
            <div key={b.label} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '10px 14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'baseline', flexWrap: 'wrap' }}>
                <span style={{ color: '#284a69', fontWeight: 700, fontSize: 14 }}>{b.label}</span>
                <span style={{ color: '#1f7a5c', fontWeight: 900, fontSize: 16, whiteSpace: 'nowrap' }}>{usd(b.base * atb.cutPercent)}</span>
              </div>
              <div style={{ color: '#6b7280', fontSize: 12.5, marginTop: 2 }}>{b.note}</div>
            </div>
          ))}
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
            <thead>
              <tr style={{ textAlign: 'left', color: '#64748b', borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ padding: '6px 8px' }}>Fund / department</th>
                <th style={{ padding: '6px 8px', textAlign: 'right' }}>2026 tentative</th>
                <th style={{ padding: '6px 8px', textAlign: 'right' }}>2.5% of all</th>
                <th style={{ padding: '6px 8px', textAlign: 'right' }}>2.5% of controllable</th>
              </tr>
            </thead>
            <tbody>
              {atb.byFund.map((f) => (
                <tr key={f.fund} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '6px 8px', color: '#284a69', fontWeight: 700 }}>{f.fund}</td>
                  <td style={{ padding: '6px 8px', textAlign: 'right' }}>{usd(f.tentative)}</td>
                  <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 700 }}>{usd(f.tentative * atb.cutPercent)}</td>
                  <td style={{ padding: '6px 8px', textAlign: 'right', color: '#1f7a5c', fontWeight: 700 }}>{f.controllable ? usd(f.controllable * atb.cutPercent) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p style={{ color: '#334155', fontSize: 14, lineHeight: 1.6, margin: '12px 0 0' }}>{atb.takeaway}</p>
        <p style={{ color: '#6b7280', fontSize: 12, marginTop: 8, marginBottom: 0 }}>
          Computed from the 2026 Budget Supplement line totals. &ldquo;Controllable&rdquo; excludes personnel and
          mandated costs (pension, debt service, insurance, payroll taxes) a flat directive can&apos;t change. Measured
          against the {usd(atb.gapToClose)} modeled payroll-pressure gap.
        </p>
      </section>

      {/* 5 — Compact provenance strip. */}
      <section style={{ ...card, marginTop: 16 }}>
        <h2 style={{ margin: '0 0 8px', color: '#284a69', fontSize: 15 }}>Built from the Town&apos;s own documents</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {builtFromDocuments.map((doc) => {
            const k = KIND[doc.kind]
            return (
              <a key={doc.url} href={doc.url} target="_blank" rel="noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none', background: k.bg, color: k.color,
                  border: `1px solid ${k.color}22`, borderRadius: 999, padding: '5px 11px', fontSize: 12.5, fontWeight: 700 }}>
                {doc.title} ↗
              </a>
            )
          })}
        </div>
        <p style={{ color: '#6b7280', fontSize: 12, marginTop: 10, marginBottom: 0 }}>
          Links open the Town&apos;s DocumentCenter (townofriverheadny.gov). Blue = budget, green = supplement, amber =
          financial report.
        </p>
      </section>
    </PageShell>
  )
}
