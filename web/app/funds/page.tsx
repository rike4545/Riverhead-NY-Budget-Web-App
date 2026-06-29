import PageShell from '../../components/PageShell'
import { allOperatingFunds2026 } from '../../lib/all-funds'
import { dollars } from '../../lib/financial-data'
import { subAccountIndex, townwideSubAccountTotals, townwideCategoryTotals } from '../../lib/subaccounts'

const base = '/rike4545-riverhead-budget-live'
const card = { background: 'white', border: '1px solid #e2e8f0', borderRadius: 18, padding: 20, boxShadow: '0 14px 34px rgba(15,23,42,.05)' } as const

const CATEGORY_COLOR: Record<string, string> = {
  'Personal Services': '#1f5f8f',
  'Employee Benefits': '#2563eb',
  Contractual: '#c99a2e',
  'Equipment & Capital Outlay': '#0f766e',
  'Interfund / Transfers': '#7c3aed',
  Other: '#64748b',
}

export default function FundsPage() {
  const indexByCode = new Map(subAccountIndex.funds.map((f) => [f.code, f]))
  const categories = townwideCategoryTotals()
  const catTotal = categories.reduce((s, c) => s + c.adopted2026, 0)

  return (
    <PageShell
      title="Funds Explorer"
      subtitle="Every operating fund drills down to department, spending category, and individual account line items — extracted from the 2026 Adopted Budget and reconciled to the dollar against the official Summary page."
    >
      <section style={{ ...card, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 12, marginBottom: 18 }}>
        <Stat label="Operating Funds" value={String(subAccountIndex.fundCount)} />
        <Stat label="Departments / Functions" value={String(townwideSubAccountTotals.departments)} />
        <Stat label="Account Line Items" value={townwideSubAccountTotals.lineItems.toLocaleString()} />
        <Stat label="Total Appropriations" value={dollars(townwideSubAccountTotals.expenditure2026)} />
        <Stat label="Funds Reconciled" value={`${townwideSubAccountTotals.reconciledFunds}/${subAccountIndex.fundCount}`} good />
      </section>

      <section style={{ ...card, marginBottom: 18 }}>
        <h2 style={{ margin: '0 0 4px' }}>Town-wide Spending by Category</h2>
        <p style={{ color: '#475569', margin: '0 0 14px' }}>How every account line item across all funds rolls up by spending category.</p>
        <div style={{ display: 'flex', height: 26, borderRadius: 8, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
          {categories.map((c) => (
            <div key={c.category} title={`${c.category}: ${dollars(c.adopted2026)}`} style={{ width: `${(c.adopted2026 / catTotal) * 100}%`, background: CATEGORY_COLOR[c.category] ?? '#64748b' }} />
          ))}
        </div>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 12 }}>
          {categories.map((c) => (
            <span key={c.category} style={{ fontSize: 13, fontWeight: 700, color: '#334155' }}>
              <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 10, background: CATEGORY_COLOR[c.category] ?? '#64748b', marginRight: 6 }} />
              {c.category} — {dollars(c.adopted2026)} ({((c.adopted2026 / catTotal) * 100).toFixed(1)}%)
            </span>
          ))}
        </div>
      </section>

      <section style={{ display: 'grid', gap: 14 }}>
        {allOperatingFunds2026.map((fund) => {
          const detail = indexByCode.get(fund.code)
          return (
            <a key={fund.code} href={`${base}/funds/${fund.code}/`} style={{ ...card, textDecoration: 'none', color: 'inherit', display: 'block' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'start', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ color: '#2563eb', fontWeight: 900, fontSize: 12, textTransform: 'uppercase' }}>{fund.code}</div>
                  <h2 style={{ margin: '6px 0' }}>{fund.name}</h2>
                  <p style={{ color: '#475569', maxWidth: 920 }}>{fund.description}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ background: '#dbeafe', color: '#1e3a8a', padding: '10px 14px', borderRadius: 999, fontWeight: 900, display: 'inline-block' }}>
                    {dollars(fund.appropriations2026)}
                  </div>
                  {detail && (
                    <div style={{ color: detail.reconciled ? '#15803d' : '#b91c1c', fontWeight: 800, fontSize: 12, marginTop: 6 }}>
                      {detail.reconciled ? '✓ reconciled' : `Δ ${dollars(detail.reconciliationVariance2026 ?? 0)}`}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 12, marginTop: 16 }}>
                <Mini label="Estimated Revenues" value={dollars(fund.estimatedRevenues2026)} />
                <Mini label="Fund Balance Used" value={dollars(fund.appropriatedFundBalance2026)} />
                <Mini label="Tax Levy" value={dollars(fund.taxLevy2026)} />
                <Mini label="Departments" value={detail ? String(detail.departmentCount) : '—'} />
                <Mini label="Line Items" value={detail ? String(detail.lineItemCount) : '—'} />
              </div>

              <div style={{ marginTop: 14, color: '#1f5f8f', fontWeight: 800 }}>
                Explore departments &amp; account line items →
              </div>
            </a>
          )
        })}
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

function Stat({ label, value, good }: { label: string; value: string; good?: boolean }) {
  return (
    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 12 }}>
      <div style={{ color: '#64748b', fontSize: 11.5, textTransform: 'uppercase', fontWeight: 900, letterSpacing: 0.4 }}>{label}</div>
      <strong style={{ fontSize: 20, color: good ? '#15803d' : '#12385b' }}>{value}</strong>
    </div>
  )
}
