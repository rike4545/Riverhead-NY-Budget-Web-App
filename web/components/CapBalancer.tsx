'use client'

import { useState } from 'react'

const usd = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

type Props = { levy2026: number; predictedLevy: number; allowedLevy: number; approp2027: number; capPct: number }

export default function CapBalancer({ levy2026, predictedLevy, allowedLevy, approp2027, capPct }: Props) {
  const [cutPct, setCutPct] = useState(0)     // % cut to appropriations
  const [buyout, setBuyout] = useState(0)     // $ buyout salary savings
  const [revenue, setRevenue] = useState(0)   // $ new non-tax revenue
  const [reserves, setReserves] = useState(0) // $ reserves used

  const spendingCut = Math.round((approp2027 * cutPct) / 100)
  const totalReduction = spendingCut + buyout + revenue + reserves
  const newLevy = predictedLevy - totalReduction
  const newPct = (newLevy / levy2026 - 1) * 100
  const under = newLevy <= allowedLevy
  const remaining = newLevy - allowedLevy

  const good = '#15803d', bad = '#b91c1c'
  const col = under ? good : bad

  return (
    <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 16, padding: 20, boxShadow: '0 14px 34px rgba(15,23,42,.05)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 20 }}>
        {/* Controls */}
        <div style={{ display: 'grid', gap: 16 }}>
          <Slider label="Trim spending" value={cutPct} min={0} max={5} step={0.1} onChange={setCutPct}
            display={`${cutPct.toFixed(1)}% = ${usd(spendingCut)}`} hint="Hold posts vacant, defer equipment, trim contracts" />
          <Slider label="Retirement-buyout savings" value={buyout} min={0} max={1800000} step={50000} onChange={setBuyout}
            display={usd(buyout)} hint="Lower-step refills / vacancies from the 2026 buyout (model: up to ~$1.8M)" />
          <Slider label="New non-tax revenue" value={revenue} min={0} max={2000000} step={50000} onChange={setRevenue}
            display={usd(revenue)} hint="State aid, mortgage tax, fees, interest earnings" />
          <Slider label="Reserves used (one-time)" value={reserves} min={0} max={3000000} step={50000} onChange={setReserves}
            display={usd(reserves)} hint="Appropriated fund balance — spends the cushion, can't repeat forever" />
        </div>

        {/* Result */}
        <div style={{ background: under ? '#f0fdf4' : '#fef2f2', border: `1px solid ${under ? '#bbf7d0' : '#fecaca'}`, borderRadius: 14, padding: 18, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ color: '#64748b', fontSize: 12, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 0.5 }}>Resulting 2027 levy</div>
          <div style={{ fontSize: 34, fontWeight: 900, color: '#284a69', lineHeight: 1.1, margin: '2px 0 6px' }}>{usd(newLevy)}</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: col }}>{newPct >= 0 ? '+' : ''}{newPct.toFixed(1)}% vs 2026</div>
          <div style={{ marginTop: 12, padding: '10px 12px', borderRadius: 10, background: col, color: 'white', fontWeight: 800, fontSize: 14.5 }}>
            {under
              ? `✓ Under the ~${capPct}% cap — no override needed`
              : `✗ Still over the cap by ${usd(remaining)}`}
          </div>
          <div style={{ color: '#64748b', fontSize: 12.5, marginTop: 10, lineHeight: 1.45 }}>
            Cap allows about <strong>{usd(allowedLevy)}</strong> (~{capPct}%). You&apos;ve found <strong>{usd(totalReduction)}</strong> so far;
            the starting gap was <strong>{usd(predictedLevy - allowedLevy)}</strong>.
          </div>
          {(reserves > 0 && under) && (
            <div style={{ color: '#92400e', fontSize: 12, marginTop: 8, lineHeight: 1.4 }}>
              Note: {usd(reserves)} of this is one-time reserve money — it balances 2027 but reopens the gap in 2028.
            </div>
          )}
        </div>
      </div>
      <p style={{ color: '#94a3b8', fontSize: 12, marginTop: 14, marginBottom: 0, lineHeight: 1.45 }}>
        Illustrative. Moves each lever against the model&apos;s predicted levy; the real cap ceiling is a bit above a flat {capPct}%
        once the tax-base-growth factor and pension/capital exclusions are added, so the true gap is somewhat smaller.
      </p>
    </div>
  )
}

function Slider({ label, value, min, max, step, onChange, display, hint }: {
  label: string; value: number; min: number; max: number; step: number; onChange: (n: number) => void; display: string; hint: string
}) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
        <span style={{ fontWeight: 800, color: '#284a69', fontSize: 14.5 }}>{label}</span>
        <span style={{ fontWeight: 800, color: '#4a7297', fontSize: 14 }}>{display}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: '100%', accentColor: '#4a7297', marginTop: 6 }} />
      <div style={{ color: '#94a3b8', fontSize: 12, lineHeight: 1.35 }}>{hint}</div>
    </div>
  )
}
