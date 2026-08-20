import type { ReactNode } from 'react'
import PageShell from '../../components/PageShell'
import PlainCallout from '../../components/PlainCallout'
import Term from '../../components/Term'
import { allOperatingFunds2026 } from '../../lib/all-funds'
import { dollars } from '../../lib/financial-data'
import { subAccountIndex, townwideSubAccountTotals, townwideCategoryTotals } from '../../lib/subaccounts'

const base = process.env.NEXT_PUBLIC_BASE_PATH || ''
const card = { background: 'var(--rbl-surface)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 18, padding: 20, boxShadow: '0 14px 34px var(--rbl-shadow)' } as const

const CATEGORY_COLOR: Record<string, string> = {
  'Personal Services': 'var(--rbl-series-blue)',
  'Employee Benefits': 'var(--rbl-series-indigo)',
  Contractual: 'var(--rbl-series-gold)',
  'Equipment & Capital Outlay': 'var(--rbl-series-teal)',
  'Interfund / Transfers': 'var(--rbl-series-violet)',
  Other: 'var(--rbl-series-slate)',
}

export const metadata = {
  title: 'Funds Explorer — every fund, department & line item',
  description:
    'Drill every Town of Riverhead operating fund down to departments, spending categories, and 848 individual account line items, reconciled to the official 2026 adopted budget.',
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
      <PlainCallout
        tips={[
          { label: 'A "fund"', text: 'is a separate pot of money for a purpose — General (most services), Highway, Water, Sewer, and so on. Each has its own balanced budget.' },
          { label: 'Click any fund', text: 'to open it and see the departments and individual spending lines inside it, with multi-year trends.' },
          { label: '"Reconciled"', text: 'means our line-item totals add up exactly to the Town’s official published numbers.' },
        ]}
      >
        This page shows <strong>where the Town plans to spend money</strong> in 2026, organized into separate pots called
        funds. The biggest is the General Fund, which pays for most town-wide services.
      </PlainCallout>

      <section style={{ ...card, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 12, marginBottom: 18 }}>
        <Stat label="Operating Funds" value={String(subAccountIndex.fundCount)} />
        <Stat label="Departments / Functions" value={String(townwideSubAccountTotals.departments)} />
        <Stat label="Account Line Items" value={townwideSubAccountTotals.lineItems.toLocaleString()} />
        <Stat label={<Term id="appropriations">Total Appropriations</Term>} value={dollars(townwideSubAccountTotals.expenditure2026)} />
        <Stat label={<Term id="reconciled">Funds Reconciled</Term>} value={`${townwideSubAccountTotals.reconciledFunds}/${subAccountIndex.fundCount}`} good />
      </section>

      <section style={{ ...card, marginBottom: 18 }}>
        <h2 style={{ margin: '0 0 4px' }}>Town-wide Spending by Category</h2>
        <p style={{ color: 'var(--rbl-text-body)', margin: '0 0 14px' }}>How every account line item across all funds rolls up by spending category.</p>
        <div style={{ display: 'flex', height: 26, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--rbl-border-subtle)' }}>
          {categories.map((c) => (
            <div key={c.category} title={`${c.category}: ${dollars(c.adopted2026)}`} style={{ width: `${(c.adopted2026 / catTotal) * 100}%`, background: CATEGORY_COLOR[c.category] ?? 'var(--rbl-series-slate)' }} />
          ))}
        </div>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 12 }}>
          {categories.map((c) => (
            <span key={c.category} style={{ fontSize: 13, fontWeight: 700, color: 'var(--rbl-text-strong)' }}>
              <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 10, background: CATEGORY_COLOR[c.category] ?? 'var(--rbl-series-slate)', marginRight: 6 }} />
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
                  <div style={{ color: 'var(--rbl-link)', fontWeight: 900, fontSize: 12, textTransform: 'uppercase' }}>{fund.code}</div>
                  <h2 style={{ margin: '6px 0' }}>{fund.name}</h2>
                  <p style={{ color: 'var(--rbl-text-body)', maxWidth: 920 }}>{fund.description}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ background: 'var(--rbl-info-bg)', color: 'var(--rbl-info-text)', padding: '10px 14px', borderRadius: 999, fontWeight: 900, display: 'inline-block' }}>
                    {dollars(fund.appropriations2026)}
                  </div>
                  {detail && (
                    <div style={{ color: detail.reconciled ? 'var(--rbl-success)' : 'var(--rbl-danger)', fontWeight: 800, fontSize: 12, marginTop: 6 }}>
                      {detail.reconciled ? '✓ reconciled' : `Δ ${dollars(detail.reconciliationVariance2026 ?? 0)}`}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 12, marginTop: 16 }}>
                <Mini label={<Term id="estimated-revenues">Estimated Revenues</Term>} value={dollars(fund.estimatedRevenues2026)} />
                <Mini label={<Term id="appropriated-fund-balance">Fund Balance Used</Term>} value={dollars(fund.appropriatedFundBalance2026)} />
                <Mini label={<Term id="tax-levy">Tax Levy</Term>} value={dollars(fund.taxLevy2026)} />
                <Mini label="Departments" value={detail ? String(detail.departmentCount) : '—'} />
                <Mini label="Line Items" value={detail ? String(detail.lineItemCount) : '—'} />
              </div>

              <div style={{ marginTop: 14, color: 'var(--rbl-accent)', fontWeight: 800 }}>
                Explore departments &amp; account line items →
              </div>
            </a>
          )
        })}
      </section>
    </PageShell>
  )
}

function Mini({ label, value }: { label: ReactNode; value: string }) {
  return (
    <div style={{ background: 'var(--rbl-surface-2)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 14, padding: 14 }}>
      <div style={{ color: 'var(--rbl-text-muted)', fontSize: 12, textTransform: 'uppercase', fontWeight: 900 }}>{label}</div>
      <strong style={{ fontSize: 20 }}>{value}</strong>
    </div>
  )
}

function Stat({ label, value, good }: { label: ReactNode; value: string; good?: boolean }) {
  return (
    <div style={{ background: 'var(--rbl-surface-2)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 12, padding: 12 }}>
      <div style={{ color: 'var(--rbl-text-muted)', fontSize: 11.5, textTransform: 'uppercase', fontWeight: 900, letterSpacing: 0.4 }}>{label}</div>
      <strong style={{ fontSize: 20, color: good ? 'var(--rbl-success)' : 'var(--rbl-title)' }}>{value}</strong>
    </div>
  )
}
