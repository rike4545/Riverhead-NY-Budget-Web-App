'use client'

import { useMemo, useState } from 'react'
import { dollars } from '../lib/financial-data'

export type LevyShare = {
  code: string
  name: string
  share: number
  description: string
}

export default function TaxpayerLevyCalculator({ funds }: { funds: LevyShare[] }) {
  const [townTax, setTownTax] = useState('')

  const amount = Number(townTax.replace(/,/g, '').trim())
  const validAmount = Number.isFinite(amount) && amount > 0

  const rows = useMemo(
    () => funds.map((fund) => ({ ...fund, amount: validAmount ? amount * fund.share : 0 })),
    [funds, amount, validAmount],
  )

  return (
    <section style={card}>
      <div style={{ display: 'grid', gap: 10 }}>
        <div>
          <h2 style={{ margin: 0 }}>Translate the levy into your dollars</h2>
          <p style={{ color: 'var(--rbl-text-muted)', lineHeight: 1.55, margin: '6px 0 0' }}>
            Enter the <strong>Town portion</strong> of your annual property-tax bill—not the full bill including county, school, or other taxing jurisdictions.
            The calculator applies the adopted 2026 levy shares above to that amount.
          </p>
        </div>

        <label style={{ display: 'grid', gap: 6, maxWidth: 360 }}>
          <span style={{ fontWeight: 800, color: 'var(--rbl-title)' }}>Annual Town tax</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span aria-hidden="true" style={{ fontWeight: 800, color: 'var(--rbl-text-muted)' }}>$</span>
            <input
              type="text"
              inputMode="decimal"
              value={townTax}
              onChange={(e) => setTownTax(e.target.value)}
              placeholder="e.g. 4,000"
              aria-label="Annual Town property tax amount"
              style={{ width: '100%', boxSizing: 'border-box', padding: '11px 13px', border: '1px solid var(--rbl-border-strong)', borderRadius: 9, fontSize: 16, fontWeight: 700 }}
            />
          </div>
        </label>

        {validAmount ? (
          <div style={{ display: 'grid', gap: 8, marginTop: 4 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', alignItems: 'baseline' }}>
              <strong style={{ color: 'var(--rbl-title)' }}>Estimated allocation</strong>
              <span style={{ color: 'var(--rbl-text-muted)', fontSize: 12.5 }}>Totals may differ by a few cents because fund amounts are rounded.</span>
            </div>
            {rows.map((fund) => (
              <div key={fund.code} style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', gap: 12, alignItems: 'center', padding: '9px 11px', background: 'var(--rbl-surface-2)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 10 }}>
                <div style={{ minWidth: 0 }}>
                  <strong style={{ color: 'var(--rbl-title)' }}>{fund.name}</strong>
                  <div style={{ color: 'var(--rbl-text-muted)', fontSize: 12.5 }}>{(fund.share * 100).toFixed(1)}% of Town levy</div>
                </div>
                <strong style={{ color: 'var(--rbl-title)', fontSize: 17, whiteSpace: 'nowrap' }}>{dollars(fund.amount)}</strong>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, paddingTop: 4, fontSize: 13, color: 'var(--rbl-text-muted)' }}>
              <span>Amount entered</span>
              <strong style={{ color: 'var(--rbl-title)' }}>{dollars(amount)}</strong>
            </div>
          </div>
        ) : (
          <div style={{ background: 'var(--rbl-info-bg)', border: '1px solid var(--rbl-info-border)', borderRadius: 10, padding: 12, color: 'var(--rbl-text-body)', fontSize: 13.5, lineHeight: 1.5 }}>
            Enter a positive Town-tax amount to see the estimated dollar allocation by fund. This is an allocation estimate, not a statement of your actual tax bill composition.
          </div>
        )}
      </div>
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
