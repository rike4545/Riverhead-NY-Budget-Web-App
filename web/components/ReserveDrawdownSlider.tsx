'use client'

import { useState } from 'react'

const usd = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

export default function ReserveDrawdownSlider({
  unassignedFundBalance,
  appropriations,
  policyMinimumPercent,
}: {
  unassignedFundBalance: number
  appropriations: number
  policyMinimumPercent: number
}) {
  const [drawDown, setDrawDown] = useState(0)

  const newTotal = unassignedFundBalance - drawDown
  const newPct = appropriations === 0 ? 0 : newTotal / appropriations
  const staysAboveMinimum = newPct >= policyMinimumPercent

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontWeight: 800, color: '#284a69', fontSize: 14.5 }}>Use for capital / tax relief</span>
        <span style={{ fontWeight: 800, color: '#4a7297', fontSize: 14 }}>{usd(drawDown)}</span>
      </div>
      <input
        type="range"
        min={0}
        max={unassignedFundBalance}
        step={50000}
        value={drawDown}
        onChange={(e) => setDrawDown(Number(e.target.value))}
        style={{ width: '100%', accentColor: '#4a7297' }}
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, fontSize: 14.5 }}>
        <span>After use, reserve would be</span>
        <strong>{usd(newTotal)}</strong>
      </div>

      <div style={{ background: '#e2e8f0', borderRadius: 999, height: 8, overflow: 'hidden', marginTop: 8 }}>
        <div
          style={{
            width: `${Math.min(100, Math.max(0, (newPct / Math.max(newPct, policyMinimumPercent * 2)) * 100))}%`,
            height: '100%',
            background: staysAboveMinimum ? '#16a34a' : '#dc2626',
            borderRadius: 999,
          }}
        />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginTop: 4, color: '#64748b' }}>
        <span>{(newPct * 100).toFixed(1)}% of appropriations</span>
        <span>Policy min: {(policyMinimumPercent * 100).toFixed(0)}%</span>
      </div>

      <p style={{ color: staysAboveMinimum ? '#166534' : '#b91c1c', fontSize: 14, marginTop: 10, fontWeight: 700 }}>
        {staysAboveMinimum
          ? 'This scenario keeps you at or above the policy minimum.'
          : 'This scenario would drop reserves below the policy minimum; long-term sustainability may be at risk.'}
      </p>
    </div>
  )
}
