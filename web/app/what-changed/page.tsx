import PageShell from '../../components/PageShell'
import DataStatus from '../../components/DataStatus'
import RecordTrail from '../../components/RecordTrail'
import { dollars, townWideComparison2026, adoptedBudget2026Summary } from '../../lib/financial-data'
import taxBill from '../../public/data/tax-bill.json'

const base = process.env.NEXT_PUBLIC_BASE_PATH || ''
const pct = (n: number) => `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`
const delta = (n: number) => `${n >= 0 ? '+' : ''}${dollars(n)}`

export default function WhatChangedPage() {
  const c = townWideComparison2026
  const rates = taxBill.rates2025
  const rates26 = taxBill.rates2026
  const totalTaxRateChange = rates26.totalTownWide - rates.totalTownWide
  const totalTaxRatePct = ((rates26.totalTownWide / rates.totalTownWide) - 1) * 100
  const general = adoptedBudget2026Summary.find(r => r.fundCode === 'A01')!
  const total = adoptedBudget2026Summary.find(r => r.fundCode === 'TOTAL')!

  const metrics = [
    { label: 'Town-wide appropriations', value: dollars(c.appropriations2026), change: `${delta(c.dollarChange)} · ${pct(c.percentChange)}`, href: '/compare/', note: 'The 2026 adopted operating budget increased versus 2025.' },
    { label: 'Town-wide tax levy', value: dollars(c.taxLevy2026), change: `${delta(c.taxLevyDollarChange)} · ${pct(c.taxLevyPercentChange)}`, href: '/tax-bill/', note: 'The levy is the property-tax amount raised Town-wide.' },
    { label: 'Town-wide rate', value: `$${rates26.totalTownWide.toFixed(3)} / $1,000`, change: `+${totalTaxRateChange.toFixed(3)} · ${pct(totalTaxRatePct)}`, href: '/tax-bill/', note: 'This is the Town rate, not the full school/county/fire/library bill.' },
    { label: 'General Fund', value: dollars(general.appropriations2026), change: '2026 adopted', href: '/general-fund/', note: 'The main operating fund for Town services.' },
    { label: 'Appropriated fund balance', value: dollars(total.appropriatedFundBalance2026), change: '2026 adopted', href: '/reserves/', note: 'One-time fund balance included in the adopted operating budget.' },
  ]

  return (
    <PageShell title="What Changed: 2025 → 2026" subtitle="The resident version of the year-over-year story: the biggest budget, tax and financial changes, with a direct path to the underlying records.">
      <main style={{ display: 'grid', gap: 16 }}>
        <section style={{ background: 'var(--rbl-surface)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 16, padding: 20, boxShadow: '0 10px 26px var(--rbl-shadow)' }}>
          <DataStatus status="calculated" text="Calculated from published 2025/2026 budget and tax-rate records" />
          <p style={{ margin: '10px 0 0', color: 'var(--rbl-text-sub)', lineHeight: 1.6, maxWidth: 930 }}>This page answers the first resident question — <strong>what actually moved?</strong> — then lets you drill into the underlying records.</p>
        </section>

        <section aria-label="2025 to 2026 changes" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))', gap: 12 }}>
          {metrics.map(m => <a key={m.label} href={`${base}${m.href}`} style={{ color: 'inherit', textDecoration: 'none', background: 'var(--rbl-surface)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 14, padding: 17, boxShadow: '0 8px 22px var(--rbl-shadow)' }}>
            <div style={{ color: 'var(--rbl-text-muted)', fontSize: 11.5, fontWeight: 900, textTransform: 'uppercase', letterSpacing: .7 }}>{m.label}</div>
            <div style={{ fontSize: 25, fontWeight: 950, marginTop: 6 }}>{m.value}</div>
            <div style={{ color: 'var(--rbl-accent)', fontWeight: 900, fontSize: 13, marginTop: 4 }}>{m.change}</div>
            <div style={{ color: 'var(--rbl-text-sub)', fontSize: 13, lineHeight: 1.45, marginTop: 8 }}>{m.note}</div>
            <div style={{ color: 'var(--rbl-accent)', fontSize: 12.5, fontWeight: 800, marginTop: 11 }}>See the evidence →</div>
          </a>)}
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 14 }}>
          <article style={{ background: 'var(--rbl-surface)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 14, padding: 18 }}>
            <h2 style={{ margin: 0, fontSize: 20 }}>What changed most?</h2>
            <p style={{ color: 'var(--rbl-text-sub)', lineHeight: 1.6 }}>The adopted operating budget rose <strong>{dollars(c.dollarChange)}</strong> ({c.percentChange.toFixed(2)}%). The Town-wide property-tax levy rose <strong>{dollars(c.taxLevyDollarChange)}</strong> ({c.taxLevyPercentChange.toFixed(2)}%).</p>
            <a href={`${base}/compare/`} style={{ color: 'var(--rbl-accent)', fontWeight: 900 }}>Sort every fund and line item by change →</a>
          </article>
          <article style={{ background: 'var(--rbl-surface)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 14, padding: 18 }}>
            <h2 style={{ margin: 0, fontSize: 20 }}>What should I be careful not to confuse?</h2>
            <p style={{ color: 'var(--rbl-text-sub)', lineHeight: 1.6, marginBottom: 0 }}>Appropriations are spending authority, not proof that cash was spent. The Town levy is only the Town&apos;s property-tax share. And the Town rate shown here is not your complete property-tax bill.</p>
          </article>
        </section>

        <section style={{ background: 'var(--rbl-surface-2)', borderRadius: 14, padding: 18 }}>
          <h2 style={{ margin: 0, fontSize: 19 }}>Where the story goes next</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 12 }}>
            {[['Why did my taxes change?', '/tax-bill/'], ['Where your levy goes', '/taxpayer-impact/'], ['What changed line by line', '/compare/'], ['What could happen in 2027', '/predict-2027/'], ['How the Board voted', '/meetings/']].map(([label, href]) => <a key={href} href={`${base}${href}`} style={{ textDecoration: 'none', color: 'var(--rbl-title)', border: '1px solid var(--rbl-border)', background: 'var(--rbl-surface)', borderRadius: 999, padding: '8px 12px', fontWeight: 800, fontSize: 13 }}>{label} →</a>)}
          </div>
        </section>

        <RecordTrail title="Primary records" items={[
          { label: '2026 Adopted Budget', text: c.source.title, href: '/compare/' },
          { label: 'Town tax-rate data', text: 'Published 2025 and 2026 Town rates used for the comparison.', href: '/tax-bill/' },
        ]} />
      </main>
    </PageShell>
  )
}
