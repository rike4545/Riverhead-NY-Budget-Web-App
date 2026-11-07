'use client'

import { useState } from 'react'
import { assessedFromMarketValue, estimateTaxBill, type TaxRates } from '../lib/tax-bill'

const usd = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
const card = { background: 'var(--rbl-surface)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 16, padding: 20 } as const

export default function TaxBillEstimator({
  rates2026,
  rates2025,
  rates2027Proposal,
  proposalLabel = '2027 proposal',
  residentialAssessmentRatio,
}: {
  rates2026: TaxRates
  rates2025: TaxRates
  rates2027Proposal?: TaxRates
  proposalLabel?: string
  residentialAssessmentRatio: number
}) {
  const [inputMode, setInputMode] = useState<'assessed' | 'market'>('assessed')
  const [assessedValue, setAssessedValue] = useState(45000)
  const [marketValue, setMarketValue] = useState(550000)
  const [starReduction, setStarReduction] = useState(0)

  const effectiveAssessed = inputMode === 'assessed' ? assessedValue : assessedFromMarketValue(marketValue, residentialAssessmentRatio)
  const estimate2026 = estimateTaxBill(effectiveAssessed, starReduction, rates2026)
  const estimate2025 = estimateTaxBill(effectiveAssessed, starReduction, rates2025)
  const estimate2027Proposal = rates2027Proposal ? estimateTaxBill(effectiveAssessed, starReduction, rates2027Proposal) : null
  const diff = estimate2026.total - estimate2025.total

  return (
    <div style={card}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        <ModeButton active={inputMode === 'assessed'} onClick={() => setInputMode('assessed')} label="I know my assessed value" />
        <ModeButton active={inputMode === 'market'} onClick={() => setInputMode('market')} label="I only know my home’s market value" />
      </div>

      {inputMode === 'assessed' ? (
        <Field label="Assessed value" value={usd(assessedValue)} hint="Use the assessed value printed on your tax bill or assessment notice.">
          <input
            type="range"
            aria-label="Assessed value"
            min={5000}
            max={300000}
            step={1000}
            value={assessedValue}
            onChange={(e) => setAssessedValue(Number(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--rbl-series-blue)' }}
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
            aria-label="Market value"
            min={200000}
            max={1500000}
            step={10000}
            value={marketValue}
            onChange={(e) => setMarketValue(Number(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--rbl-series-blue)' }}
          />
        </Field>
      )}

      <div style={{ marginTop: 14 }}>
        <Field label="STAR assessed-value reduction (if any)" value={usd(starReduction)} hint="If your bill lists a STAR reduction, enter that amount. It varies by school district and year, so this calculator does not assume one.">
          <input
            type="range"
            aria-label="STAR assessed-value reduction"
            min={0}
            max={30000}
            step={500}
            value={starReduction}
            onChange={(e) => setStarReduction(Number(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--rbl-series-blue)' }}
          />
        </Field>
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid var(--rbl-border-subtle)', margin: '18px 0' }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
        <span style={{ color: 'var(--rbl-title)', fontWeight: 800 }}>Estimated 2026 Town taxes</span>
        <strong style={{ fontSize: 28, color: 'var(--rbl-title)' }}>{usd(estimate2026.total)}</strong>
      </div>
      {estimate2027Proposal && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, flexWrap: 'wrap', marginTop: 12, padding: 12, borderRadius: 10, background: 'var(--rbl-info-bg)', border: '1px solid var(--rbl-border-subtle)' }}>
          <div>
            <div style={{ color: 'var(--rbl-title)', fontWeight: 850 }}>Estimated Town taxes using the {proposalLabel} rate</div>
            <div style={{ color: 'var(--rbl-text-muted)', fontSize: 12.5, marginTop: 3 }}>This is an illustrative estimate only: it applies the rate in the proposal to your current inputs. The rate is not final, and this is not a tax bill.</div>
          </div>
          <strong style={{ fontSize: 24, color: 'var(--rbl-title)' }}>{usd(estimate2027Proposal.total)}</strong>
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--rbl-text-muted)', fontSize: 13.5, marginTop: 4 }}>
        <span>2025 (for comparison)</span>
        <span>{usd(estimate2025.total)}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, marginTop: 6 }}>
        <span>Change vs. 2025</span>
        <span style={{ color: diff >= 0 ? 'var(--rbl-danger)' : 'var(--rbl-success-strong)' }}>
          {diff >= 0 ? '+' : ''}
          {usd(diff)}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10, marginTop: 16 }}>
        <Mini label="General Fund" value={usd(estimate2026.generalFund)} />
        <Mini label="Highway Fund" value={usd(estimate2026.highway)} />
        <Mini label="Street Lighting" value={usd(estimate2026.streetLighting)} />
      </div>

      <p style={{ color: 'var(--rbl-text-muted)', fontSize: 13, lineHeight: 1.5, marginTop: 16 }}>
        This estimate covers Town taxes only. County, school district, fire district, and library taxes are separate line
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
        border: active ? '1px solid var(--rbl-accent-border)' : '1px solid var(--rbl-border-subtle)',
        background: active ? 'var(--rbl-fill-accent)' : 'var(--rbl-surface)',
        color: active ? 'white' : 'var(--rbl-title)',
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
        <span style={{ fontWeight: 800, color: 'var(--rbl-title)', fontSize: 14.5 }}>{label}</span>
        <span style={{ fontWeight: 800, color: 'var(--rbl-accent)', fontSize: 14 }}>{value}</span>
      </div>
      {children}
      <div style={{ color: 'var(--rbl-text-muted)', fontSize: 12, lineHeight: 1.4, marginTop: 4 }}>{hint}</div>
    </div>
  )
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: 'var(--rbl-surface-2)', borderRadius: 10, padding: 10 }}>
      <div style={{ color: 'var(--rbl-text-muted)', fontSize: 13, fontWeight: 700 }}>{label}</div>
      <div style={{ fontWeight: 800, marginTop: 2, color: 'var(--rbl-title)' }}>{value}</div>
    </div>
  )
}
