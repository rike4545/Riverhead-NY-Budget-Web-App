import PageShell from '../../components/PageShell'
import PlainCallout from '../../components/PlainCallout'
import SpendingReductionToggleList from '../../components/SpendingReductionToggleList'
import { fullRecurringReductionPackage, modeledAutomaticPayrollPressure } from '../../lib/spending-reduction-2027'
import { builtFromDocuments } from '../../lib/built-from-documents'
import { acrossTheBoard2027 as atb } from '../../lib/across-the-board-2027'

const usd = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
const card = { background: 'white', border: '1px solid #e2e8f0', borderRadius: 16, padding: 20, boxShadow: '0 14px 34px rgba(15,23,42,.05)' } as const
const KIND: Record<string, { label: string; color: string; bg: string }> = {
  budget: { label: 'Budget', color: '#1e40af', bg: '#dbeafe' },
  supplement: { label: 'Supplement', color: '#166534', bg: '#dcfce7' },
  afr: { label: 'Financial report', color: '#92400e', bg: '#fef3c7' },
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
      <PlainCallout title="Where this comes from">
        This totals <strong>{usd(fullRecurringReductionPackage)}</strong> in real, individually-sourced
        recurring savings and cost-recovery opportunities — not a wishlist, and not the whole 2027 gap.
        The single largest driver of 2027 budget pressure, about $907.9K of modeled PBA/SOA/CSEA union
        wage growth, is contractually locked and isn&apos;t included here, since it can&apos;t be cut
        without a successor labor agreement. The modeled 2027 automatic payroll-pressure gap this package
        is measured against — how much of that pressure it could offset — is{' '}
        <strong>{usd(modeledAutomaticPayrollPressure)}</strong>.
      </PlainCallout>

      <div style={{ marginTop: 16 }}>
        <SpendingReductionToggleList />
      </div>

      <section style={{ ...card, marginTop: 16 }}>
        <h2 style={{ margin: '0 0 4px', color: '#284a69', fontSize: 17 }}>What if the Supervisor asked every department to cut 2.5%?</h2>
        <p style={{ color: '#64748b', fontSize: 13.5, margin: '0 0 12px' }}>
          A flat across-the-board percentage is the classic budget directive. Here&apos;s how 2.5% actually pencils out —
          and why the blunt version overstates what&apos;s really cuttable.
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
          Computed from the 2026 Budget Supplement line totals. “Controllable” excludes personnel and mandated costs
          (pension, debt service, insurance, payroll taxes) that a flat directive can&apos;t change. Measured against the{' '}
          {usd(atb.gapToClose)} modeled payroll-pressure gap.
        </p>
      </section>

      <section style={{ ...card, marginTop: 16 }}>
        <h2 style={{ margin: '0 0 4px', color: '#284a69', fontSize: 17 }}>The documents this is built from</h2>
        <p style={{ color: '#64748b', fontSize: 13.5, margin: '0 0 12px' }}>
          Every figure on this page traces to the Town of Riverhead&apos;s own official documents. Open any of them:
        </p>
        <div style={{ display: 'grid', gap: 8 }}>
          {builtFromDocuments.map((doc) => {
            const k = KIND[doc.kind]
            return (
              <a key={doc.url} href={doc.url} target="_blank" rel="noreferrer"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, textDecoration: 'none',
                  background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '10px 14px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                  <span style={{ background: k.bg, color: k.color, fontWeight: 800, fontSize: 11, padding: '2px 9px', borderRadius: 999, whiteSpace: 'nowrap' }}>{k.label}</span>
                  <span style={{ color: '#284a69', fontWeight: 700, fontSize: 14.5 }}>{doc.title}</span>
                </span>
                <span style={{ color: '#4a7297', fontWeight: 800, fontSize: 13, whiteSpace: 'nowrap' }}>Open ↗</span>
              </a>
            )
          })}
        </div>
        <p style={{ color: '#6b7280', fontSize: 12, marginTop: 12, marginBottom: 0 }}>
          Links go to the Town&apos;s DocumentCenter (townofriverheadny.gov). The Budget Supplements are the line-item
          ledgers behind the adopted budgets; the Annual Financial Report is the audited year-end statement.
        </p>
      </section>
    </PageShell>
  )
}
