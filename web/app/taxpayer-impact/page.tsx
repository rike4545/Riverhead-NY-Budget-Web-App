import Link from 'next/link'
import PageShell from '../../components/PageShell'
import RecordTrail from '../../components/RecordTrail'
import DataStatus from '../../components/DataStatus'
import { allOperatingFunds2026 } from '../../lib/all-funds'
import { dollars } from '../../lib/financial-data'

const base = process.env.NEXT_PUBLIC_BASE_PATH || ''

export default function TaxpayerImpactPage() {
  const levyFunds = allOperatingFunds2026
    .filter((fund) => fund.taxLevy2026 > 0)
    .sort((a, b) => b.taxLevy2026 - a.taxLevy2026)

  const levyTotal = levyFunds.reduce((sum, fund) => sum + fund.taxLevy2026, 0)

  return (
    <PageShell
      title="Where your Town levy goes"
      subtitle="A resident-facing view of the 2026 operating tax levy, by fund. This shows allocation of the Town levy—not the full property-tax bill or the share of every dollar the Town spends."
    >
      <div style={{ display: 'grid', gap: 16 }}>
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 12 }}>
          <Stat label="2026 Town levy" value={dollars(levyTotal)} sub="operating funds shown below" />
          <Stat label="Levy-funded accounts" value={String(levyFunds.length)} sub="funds with a positive levy" />
          <Stat label="Largest share" value={levyFunds[0] ? `${((levyFunds[0].taxLevy2026 / levyTotal) * 100).toFixed(1)}%` : '—'} sub={levyFunds[0]?.name ?? 'No levy data'} />
        </section>

        <section style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <div>
              <h2 style={{ margin: 0 }}>2026 levy by fund</h2>
              <p style={{ color: 'var(--rbl-text-muted)', lineHeight: 1.55, marginBottom: 0 }}>
                The percentage below answers: “What share of the Town’s operating levy is assigned to this fund?”
                It is not a claim that the same percentage of every taxpayer’s total property-tax bill goes to that fund.
              </p>
            </div>
            <DataStatus status="official" text="Based on the adopted 2026 budget fund schedule" />
          </div>
        </section>

        <section style={{ display: 'grid', gap: 10 }}>
          {levyFunds.map((fund) => {
            const share = levyTotal ? fund.taxLevy2026 / levyTotal : 0
            const detailHref = `${base}/funds/${fund.code}/`
            return (
              <article key={fund.code} style={card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', alignItems: 'start' }}>
                  <div style={{ minWidth: 220, flex: 1 }}>
                    <div style={{ color: 'var(--rbl-link)', fontSize: 12, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 0.35 }}>{fund.code}</div>
                    <h3 style={{ margin: '3px 0 6px' }}>{fund.name}</h3>
                    <p style={{ color: 'var(--rbl-text-body)', lineHeight: 1.5, margin: 0 }}>{fund.description}</p>
                  </div>
                  <div style={{ minWidth: 165, textAlign: 'right' }}>
                    <strong style={{ display: 'block', fontSize: 24, color: 'var(--rbl-title)' }}>{dollars(fund.taxLevy2026)}</strong>
                    <span style={{ color: 'var(--rbl-text-muted)', fontSize: 13 }}>{(share * 100).toFixed(1)}% of Town levy</span>
                  </div>
                </div>

                <div style={{ marginTop: 14 }}>
                  <div style={{ height: 10, borderRadius: 999, background: 'var(--rbl-surface-3)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${Math.max(share * 100, 1.5)}%`, background: 'var(--rbl-fill-accent)', borderRadius: 999 }} />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginTop: 12, alignItems: 'center' }}>
                  <span style={{ color: 'var(--rbl-text-muted)', fontSize: 12.5 }}>
                    One dollar of the Town levy contains about ${(share).toFixed(4)} assigned to this fund.
                  </span>
                  <Link href={detailHref} style={{ color: 'var(--rbl-accent)', fontWeight: 800, fontSize: 13.5, textDecoration: 'none' }}>
                    Open fund record →
                  </Link>
                </div>
              </article>
            )
          })}
        </section>

        <RecordTrail
          title="Follow the levy into the budget"
          intro="Start with the levy allocation, then inspect the fund, compare budget changes, and trace the underlying records."
          items={[
            { href: '/tax-bill/', label: 'My Taxes', text: 'Estimate the Town share of a property-tax bill and see how the levy is allocated.' },
            { href: '/funds/', label: 'Funds & Accounts', text: 'Open the full fund list and inspect each fund’s adopted budget figures.' },
            { href: '/compare/', label: 'Budget Changes', text: 'See how adopted appropriations changed across budget years.' },
            { href: '/sources/', label: 'Source Library', text: 'Review the budget schedules and public records behind these numbers.' },
          ]}
        />

        <p style={{ color: 'var(--rbl-text-muted)', fontSize: 13, lineHeight: 1.5, marginBottom: 0 }}>
          Important: this page allocates the Town’s operating levy among funds. It does not include every component of a property-tax bill,
          and it does not imply that all spending in a fund is paid by the levy. Other funding can include fees, grants, fund balance,
          interfund support, or other revenues.
        </p>
      </div>
    </PageShell>
  )
}

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <section style={{ ...card, background: 'var(--rbl-surface-2)' }}>
      <div style={{ color: 'var(--rbl-text-muted)', fontSize: 11.5, textTransform: 'uppercase', fontWeight: 900, letterSpacing: 0.4 }}>{label}</div>
      <strong style={{ display: 'block', marginTop: 2, fontSize: 24, color: 'var(--rbl-title)' }}>{value}</strong>
      <span style={{ color: 'var(--rbl-text-muted)', fontSize: 12.5 }}>{sub}</span>
    </section>
  )
}

const card = {
  background: 'var(--rbl-surface)',
  border: '1px solid var(--rbl-border-subtle)',
  borderRadius: 16,
  padding: 18,
  boxShadow: '0 14px 34px var(--rbl-shadow)',
} as const
