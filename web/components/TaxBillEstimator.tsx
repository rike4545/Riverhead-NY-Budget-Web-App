'use client'

import { useState } from 'react'
import { assessedFromMarketValue, estimateTaxBill, type TaxRates } from '../lib/tax-bill'

const usd = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
const card = { background: 'white', border: '1px solid #e2e8f0', borderRadius: 16, padding: 20, boxShadow: '0 14px 34px rgba(15,23,42,.05)' } as const

export default function TaxBillEstimator({
  rates2026,
  rates2025,
  residentialAssessmentRatio,
}: {
  rates2026: TaxRates
  rates2025: TaxRates
  residentialAssessmentRatio: number
}) {
  const [inputMode, setInputMode] = useState<'assessed' | 'market'>('assessed')
  const [assessedValue, setAssessedValue] = useState(45000)
  const [marketValue, setMarketValue] = useState(550000)
  const [starReduction, setStarReduction] = useState(0)

  const effectiveAssessed = inputMode === 'assessed' ? assessedValue : assessedFromMarketValue(marketValue, residentialAssessmentRatio)
  const estimate2026 = estimateTaxBill(effectiveAssessed, starReduction, rates2026)
  const estimate2025 = estimateTaxBill(effectiveAssessed, starReduction, rates2025)
  const diff = estimate2026.total - estimate2025.total

  return (
    <div style={card}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        <ModeButton active={inputMode === 'assessed'} onClick={() => setInputMode('assessed')} label="I know my assessed value" />
        <ModeButton active={inputMode === 'market'} onClick={() => setInputMode('market')} label="I only know market value" />
      </div>

      {inputMode === 'assessed' ? (
        <Field label="Assessed value" value={usd(assessedValue)} hint="From your tax bill or assessment notice.">
          <input
            type="range"
            min={5000}
            max={300000}
            step={1000}
            value={assessedValue}
            onChange={(e) => setAssessedValue(Number(e.target.value))}
            style={{ width: '100%', accentColor: '#4a7297' }}
          />
        </Field>
      ) : (
        <Field
          label="Market value"
          value={usd(marketValue)}
          hint={`Converted to an estimated assessed value of ${usd(effectiveAssessed)} using Riverhead's ${residentialAssessmentRatio}% residential assessment ratio — an approximation, not exact.`}
        >
          <input
            type="range"
            min={200000}
            max={1500000}
            step={10000}
            value={marketValue}
            onChange={(e) => setMarketValue(Number(e.target.value))}
            style={{ width: '100%', accentColor: '#4a7297' }}
          />
        </Field>
      )}

      <div style={{ marginTop: 14 }}>
        <Field label="STAR exemption reduction (if any)" value={usd(starReduction)} hint="Enter the assessed-value reduction shown on your tax bill, if you have one — this varies by school district and year, so we don't guess it for you.">
          <input
            type="range"
            min={0}
            max={30000}
            step={500}
            value={starReduction}
            onChange={(e) => setStarReduction(Number(e.target.value))}
            style={{ width: '100%', accentColor: '#4a7297' }}
          />
        </Field>
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '18px 0' }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{ color: '#284a69', fontWeight: 800 }}>2026 Town portion (estimated)</span>
        <strong style={{ fontSize: 28, color: '#284a69' }}>{usd(estimate2026.total)}</strong>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: 13.5, marginTop: 4 }}>
        <span>2025 (for comparison)</span>
        <span>{usd(estimate2025.total)}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, marginTop: 6 }}>
        <span>Change vs. 2025</span>
        <span style={{ color: diff >= 0 ? '#b91c1c' : '#166534' }}>
          {diff >= 0 ? '+' : ''}
          {usd(diff)}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10, marginTop: 16 }}>
        <Mini label="General Fund" value={usd(estimate2026.generalFund)} />
        <Mini label="Highway Fund" value={usd(estimate2026.highway)} />
        <Mini label="Street Lighting" value={usd(estimate2026.streetLighting)} />
      </div>

      <p style={{ color: '#64748b', fontSize: 13, lineHeight: 1.5, marginTop: 16 }}>
        This is only the Town&apos;s portion of your bill — county, school, fire, and library taxes are separate line
        items on your actual tax bill and aren&apos;t estimated here.
      </p>
    </div>
  )
}

function ModeButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        padding: '10px 12px',
        borderRadius: 8,
        border: active ? '1px solid #4a7297' : '1px solid #e2e8f0',
        background: active ? '#4a7297' : 'white',
        color: active ? 'white' : '#284a69',
        fontWeight: 800,
        fontSize: 13.5,
        cursor: 'pointer',
      }}
    >
      {label}
    </button>
  )
}

function Field({ label, value, hint, children }: { label: string; value: string; hint: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{ fontWeight: 800, color: '#284a69', fontSize: 14.5 }}>{label}</span>
        <span style={{ fontWeight: 800, color: '#4a7297', fontSize: 14 }}>{value}</span>
      </div>
      {children}
      <div style={{ color: '#6b7280', fontSize: 12, lineHeight: 1.4, marginTop: 4 }}>{hint}</div>
    </div>
  )
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: '#f8fafc', borderRadius: 10, padding: 10 }}>
      <div style={{ color: '#64748b', fontSize: 11, textTransform: 'uppercase', fontWeight: 800 }}>{label}</div>
      <div style={{ fontWeight: 800, marginTop: 2, color: '#284a69' }}>{value}</div>
    </div>
  )
}
