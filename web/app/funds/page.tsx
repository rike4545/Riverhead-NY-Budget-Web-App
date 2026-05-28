import PageShell from '../../components/PageShell'
import { allOperatingFunds2026 } from '../../lib/all-funds'
import { dollars } from '../../lib/financial-data'

const card = { background: 'white', border: '1px solid #e2e8f0', borderRadius: 18, padding: 20, boxShadow: '0 14px 34px rgba(15,23,42,.05)' } as const

export default function FundsPage() {
  return (
    <PageShell title="Funds Explorer" subtitle="Detailed operating fund drilldowns, reserve use, appropriations, levy pressure, and future account-level intelligence.">
      <section style={{ display: 'grid', gap: 14 }}>
        {allOperatingFunds2026.map((fund) => (
          <article key={fund.code} style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'start', flexWrap: 'wrap' }}>
              <div>
                <div style={{ color: '#2563eb', fontWeight: 900, fontSize: 12, textTransform: 'uppercase' }}>{fund.code}</div>
                <h2 style={{ margin: '6px 0' }}>{fund.name}</h2>
                <p style={{ color: '#475569', maxWidth: 920 }}>{fund.description}</p>
              </div>
              <div style={{ background: '#dbeafe', color: '#1e3a8a', padding: '10px 14px', borderRadius: 999, fontWeight: 900 }}>
                {dollars(fund.appropriations2026)}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 12, marginTop: 16 }}>
              <Mini label="Estimated Revenues" value={dollars(fund.estimatedRevenues2026)} />
              <Mini label="Fund Balance Used" value={dollars(fund.appropriatedFundBalance2026)} />
              <Mini label="Tax Levy" value={dollars(fund.taxLevy2026)} />
              <Mini label="Projected Balance" value={fund.estimatedFundBalance123125 ? dollars(fund.estimatedFundBalance123125) : 'Pending'} />
            </div>

            <details style={{ marginTop: 16 }}>
              <summary style={{ cursor: 'pointer', fontWeight: 900 }}>Planned detailed drilldowns</summary>
              <ul style={{ color: '#475569', lineHeight: 1.8 }}>
                <li>department pages</li>
                <li>account-level line items</li>
                <li>payroll/overtime analysis</li>
                <li>operational comparisons</li>
                <li>budget vs AFR vs audit reconciliation</li>
                <li>source citations and confidence scoring</li>
              </ul>
            </details>
          </article>
        ))}
      </section>
    </PageShell>
  )
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 14, padding: 14 }}>
      <div style={{ color: '#64748b', fontSize: 12, textTransform: 'uppercase', fontWeight: 900 }}>{label}</div>
      <strong style={{ fontSize: 20 }}>{value}</strong>
    </div>
  )
}
