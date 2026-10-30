'use client'

import { useMemo, useState } from 'react'

const money = (value: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value)

export default function HousingTransferTaxCalculator() {
  const [salePrice, setSalePrice] = useState('500000')
  const amount = Number(salePrice)
  const valid = Number.isFinite(amount) && amount >= 0 && amount <= 100_000_000
  const estimate = useMemo(() => {
    if (!valid) return null
    return {
      current: amount * 0.02,
      additional: amount * 0.005,
      combined: amount * 0.025,
    }
  }, [amount, valid])

  return (
    <section aria-labelledby="housing-tax-calculator-title" style={{ border: '1px solid var(--rbl-teal-border)', background: 'var(--rbl-teal-bg)', borderRadius: 16, padding: 20, marginBottom: 16 }}>
      <div style={{ maxWidth: 760 }}>
        <p style={{ color: 'var(--rbl-teal-strong)', fontSize: 11, fontWeight: 900, letterSpacing: '.08em', textTransform: 'uppercase', margin: '0 0 5px' }}>Interactive estimate</p>
        <h3 id="housing-tax-calculator-title" style={{ color: 'var(--rbl-title)', margin: '0 0 8px', fontSize: 20 }}>What would an extra half-percent look like?</h3>
        <p style={{ color: 'var(--rbl-text-body)', fontSize: 14, lineHeight: 1.6, margin: '0 0 14px' }}>
          Enter a hypothetical sale price to see the simple, gross arithmetic: today&apos;s 2% Peconic Bay Community Preservation Fund rate, the proposed additional 0.5%, and the combined 2.5% rate used in the four participating towns.
        </p>
        <label htmlFor="housing-sale-price" style={{ display: 'block', color: 'var(--rbl-text-strong)', fontSize: 13, fontWeight: 800, marginBottom: 5 }}>Hypothetical sale price (USD)</label>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <span aria-hidden="true" style={{ color: 'var(--rbl-text-muted)', fontWeight: 800 }}>$</span>
          <input
            id="housing-sale-price"
            type="number"
            min="0"
            max="100000000"
            step="1000"
            inputMode="decimal"
            value={salePrice}
            onChange={(event) => setSalePrice(event.target.value)}
            aria-describedby="housing-sale-price-note"
            style={{ width: 'min(100%, 260px)', minHeight: 44, border: '1px solid var(--rbl-border-strong)', borderRadius: 9, padding: '9px 11px', background: 'var(--rbl-surface)', color: 'var(--rbl-text-strong)', font: 'inherit', fontVariantNumeric: 'tabular-nums' }}
          />
        </div>
        {!valid && <p role="alert" style={{ color: 'var(--rbl-danger)', fontSize: 13, margin: '6px 0 0' }}>Enter a sale price between $0 and $100,000,000.</p>}
        {estimate && (
          <div aria-live="polite" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 10, marginTop: 16 }}>
            <Result label="Existing 2% CPF" value={money(estimate.current)} />
            <Result label="Additional 0.5%" value={money(estimate.additional)} accent />
            <Result label="Combined 2.5%" value={money(estimate.combined)} />
          </div>
        )}
        <p id="housing-sale-price-note" style={{ color: 'var(--rbl-text-muted)', fontSize: 12.5, lineHeight: 1.55, margin: '12px 0 0' }}>
          Illustration only, not a closing-cost quote. Actual tax due depends on statutory exemptions, the applicable taxable consideration and the buyer&apos;s eligibility. The additional 0.5% is not in effect in Riverhead; it would require a local law and mandatory referendum. This calculator does not model exemptions or changes in buyer behavior.
        </p>
      </div>
    </section>
  )
}

function Result({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div style={{ background: 'var(--rbl-surface)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 11, padding: '12px 13px' }}>
      <div style={{ color: 'var(--rbl-text-muted)', fontSize: 12, fontWeight: 700 }}>{label}</div>
      <div style={{ color: accent ? 'var(--rbl-teal-strong)' : 'var(--rbl-title)', fontSize: 22, fontWeight: 900, fontVariantNumeric: 'tabular-nums', marginTop: 3 }}>{value}</div>
    </div>
  )
}
