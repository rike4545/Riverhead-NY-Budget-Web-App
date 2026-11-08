'use client'

import { useId, useState } from 'react'
import { assessedFromMarketValue, estimateTaxBill, type TaxRates } from '../lib/tax-bill'

const usd = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
const card = { background: 'var(--rbl-surface)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 16, padding: 20 } as const
const group = (n: number) => Math.round(n).toLocaleString('en-US')
const parse = (s: string) => {
  const n = Number(s.replace(/[^0-9.]/g, ''))
  return Number.isFinite(n) ? n : 0
}

/**
 * The Town portion of a property-tax bill, for one property, under each year's
 * Town-wide rates. Exemptions here are only those that lower the Town's
 * taxable value (veterans', seniors', disability); STAR lowers school taxes
 * only, so it is not an input.
 */
export default function TaxBillEstimator({
  rates2026,
  rates2025,
  rates2027Proposal,
  proposalLabel = '2027 proposal',
  residentialAssessmentRatio,
  medianAssessed,
  lookup,
}: {
  rates2026: TaxRates
  rates2025: TaxRates
  rates2027Proposal?: TaxRates
  proposalLabel?: string
  residentialAssessmentRatio: number
  /** The median one-family home's assessed value on the latest final roll, for the quick-fill button. */
  medianAssessed?: number
  /** Where a resident can look up their own bill. Linked only: nothing is read from it. */
  lookup?: { title: string; url: string }
}) {
  const id = useId()
  const [inputMode, setInputMode] = useState<'assessed' | 'market'>('assessed')
  const [assessedText, setAssessedText] = useState(group(medianAssessed ?? 45000))
  const [marketText, setMarketText] = useState('600,000')
  const [exemptText, setExemptText] = useState('0')
  const [billText, setBillText] = useState('')

  const assessedValue = parse(assessedText)
  const marketValue = parse(marketText)
  const exemption = parse(exemptText)
  const billTotal = parse(billText)
  const effectiveAssessed = inputMode === 'assessed' ? assessedValue : assessedFromMarketValue(marketValue, residentialAssessmentRatio)
  const e2025 = estimateTaxBill(effectiveAssessed, exemption, rates2025)
  const e2026 = estimateTaxBill(effectiveAssessed, exemption, rates2026)
  const e2027 = rates2027Proposal ? estimateTaxBill(effectiveAssessed, exemption, rates2027Proposal) : null
  const latest = e2027 ?? e2026
  const change = e2027 ? e2027.total - e2026.total : e2026.total - e2025.total
  const changeBase = e2027 ? e2026.total : e2025.total
  const years = [
    { label: '2025 adopted', value: e2025.total },
    { label: '2026 adopted', value: e2026.total },
    ...(e2027 ? [{ label: proposalLabel.replace(' Budget', ''), value: e2027.total, proposal: true }] : []),
  ]
  const max = Math.max(...years.map((y) => y.value), 1)
  const funds: { label: string; key: keyof TaxRates }[] = [
    { label: 'General Fund', key: 'generalFund' },
    { label: 'Highway Fund', key: 'highway' },
    { label: 'Street Lighting', key: 'streetLighting' },
  ]

  return (
    <div style={card}>
      <h2 style={{ margin: '0 0 12px', fontSize: 21, color: 'var(--rbl-title)' }}>Estimate your Town taxes</h2>

      {lookup ? (
        <div style={{ margin: '0 0 16px', padding: '12px 14px', borderRadius: 10, background: 'var(--rbl-info-bg)', border: '1px solid var(--rbl-border-subtle)' }}>
          <p style={{ margin: '0 0 6px', fontWeight: 700, color: 'var(--rbl-title)', fontSize: 15 }}>Get your own numbers first</p>
          <p style={{ margin: 0, color: 'var(--rbl-text-body)', fontSize: 14.5, lineHeight: 1.5, maxWidth: '72ch' }}>
            Look up your property on <a href={lookup.url} target="_blank" rel="noreferrer" style={{ color: 'var(--rbl-link)', fontWeight: 600 }}>{lookup.title}</a>{' '}
            (opens the County’s site; it asks you to search by one field at a time). Copy your property’s assessed value, any Town exemptions and
            the bill’s total into the boxes below. Your paper bill or assessment notice has them too. This site never sees what you look up: the
            estimate is worked out in your browser and not saved.
          </p>
        </div>
      ) : null}

      <fieldset style={{ border: 0, padding: 0, margin: '0 0 14px' }}>
        <legend style={{ fontWeight: 700, color: 'var(--rbl-title)', fontSize: 14.5, marginBottom: 8 }}>1. What do you know about your property?</legend>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <ModeButton active={inputMode === 'assessed'} onClick={() => setInputMode('assessed')} label="Its assessed value (on my tax bill)" />
          <ModeButton active={inputMode === 'market'} onClick={() => setInputMode('market')} label="Only its market value" />
        </div>
      </fieldset>

      {inputMode === 'assessed' ? (
        <MoneyField
          id={`${id}-assessed`}
          label="2. Assessed value"
          value={assessedText}
          onChange={setAssessedText}
          hint="Printed on your tax bill or assessment notice as “assessed value” or “total assessment.” In Riverhead it is a small number, usually $20,000 to $100,000, because the Town assesses at a fraction of market value."
        >
          {medianAssessed ? (
            <button type="button" onClick={() => setAssessedText(group(medianAssessed))} style={chip}>
              Use the median one-family home: {usd(medianAssessed)}
            </button>
          ) : null}
        </MoneyField>
      ) : (
        <MoneyField
          id={`${id}-market`}
          label="2. Market value"
          value={marketText}
          onChange={setMarketText}
          hint={`Converted to an assessed value of about ${usd(effectiveAssessed)} using the Town's ${residentialAssessmentRatio}% residential assessment ratio. This is an approximation; your bill's assessed value gives an exact answer.`}
        />
      )}

      <div style={{ marginTop: 14 }}>
        <MoneyField
          id={`${id}-exempt`}
          label="3. Exemptions that lower Town taxes (optional)"
          value={exemptText}
          onChange={setExemptText}
          hint="The assessed value your bill exempts from the Town tax: veterans’, senior citizens’ or disability exemptions. Leave STAR out: it lowers school taxes only and does not change the Town portion."
        />
      </div>

      <div style={{ marginTop: 14 }}>
        <MoneyField
          id={`${id}-bill`}
          label="4. Your whole tax bill (optional)"
          value={billText}
          onChange={setBillText}
          hint="The total of your 2025–26 bill, the one that carries the 2026 Town rates. With it, the result shows how much of your bill is Town tax. The rest goes to your school district, the County, and fire, library and other districts."
        />
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid var(--rbl-border-subtle)', margin: '18px 0' }} />

      <div aria-live="polite">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ color: 'var(--rbl-title)', fontWeight: 700 }}>
            {e2027 ? `Town taxes at the ${proposalLabel} rate` : 'Estimated 2026 Town taxes'}
          </span>
          <strong style={{ fontSize: 30, color: 'var(--rbl-title)' }}>{usd(latest.total)}</strong>
        </div>
        <p style={{ margin: '6px 0 0', color: 'var(--rbl-text-body)', fontSize: 15.5, lineHeight: 1.5 }}>
          That is {change >= 0 ? 'up' : 'down'} <strong>{usd(Math.abs(change))}</strong>
          {changeBase > 0 ? ` (${((change / changeBase) * 100).toFixed(1)}%)` : ''} from {e2027 ? '2026' : '2025'}, or about{' '}
          {usd(latest.total / 12)} a month.
          {e2027 ? ' This is an illustrative estimate: it applies the proposed rate to your inputs. The rate is not final until the Town Board adopts the budget, and this is not a tax bill.' : ''}
        </p>
        {billTotal > 0 ? (
          billTotal >= e2026.total ? (
            <div style={{ marginTop: 12 }}>
              <p style={{ margin: '0 0 6px', color: 'var(--rbl-text-body)', fontSize: 15.5, lineHeight: 1.5 }}>
                Of your {usd(billTotal)} bill, about <strong>{usd(e2026.total)}</strong> ({((e2026.total / billTotal) * 100).toFixed(0)}%) is Town tax at the
                2026 rates. The other {usd(billTotal - e2026.total)} goes to your school district, the County and your special districts.
              </p>
              <div aria-hidden="true" style={{ display: 'flex', height: 14, borderRadius: 6, overflow: 'hidden', background: 'var(--rbl-track)' }}>
                <div style={{ width: `${(e2026.total / billTotal) * 100}%`, background: 'var(--rbl-series-blue)' }} />
              </div>
              <div aria-hidden="true" style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--rbl-text-muted)', marginTop: 4 }}>
                <span>Town</span><span>School, County and districts</span>
              </div>
            </div>
          ) : (
            <p role="status" style={{ margin: '12px 0 0', color: 'var(--rbl-warn-strong)', fontSize: 15, lineHeight: 1.5 }}>
              The bill total you entered is less than the Town tax estimated from your assessed value, so one of them is likely off. Check the
              assessed value and exemptions against the bill.
            </p>
          )
        ) : null}
      </div>

      <figure style={{ margin: '16px 0 0' }}>
        <figcaption style={{ fontSize: 14, fontWeight: 700, color: 'var(--rbl-text-strong)', marginBottom: 8 }}>Your Town taxes, year by year</figcaption>
        <div style={{ display: 'grid', gap: 8 }}>
          {years.map((y) => (
            <div key={y.label} style={{ display: 'grid', gridTemplateColumns: 'minmax(92px, 150px) minmax(0, 1fr) auto', gap: 10, alignItems: 'center' }}>
              <span style={{ fontSize: 13.5, color: 'var(--rbl-text-strong)', fontWeight: 600 }}>{y.label}</span>
              <div aria-hidden="true" style={{ background: 'var(--rbl-track)', borderRadius: 5, height: 12, overflow: 'hidden' }}>
                <div style={{ width: `${(y.value / max) * 100}%`, height: '100%', borderRadius: 5, background: 'proposal' in y ? 'var(--rbl-series-gold)' : 'var(--rbl-series-blue)' }} />
              </div>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--rbl-title)', minWidth: 64, textAlign: 'right' }}>{usd(y.value)}</span>
            </div>
          ))}
        </div>
      </figure>

      <div style={{ overflowX: 'auto', marginTop: 16 }}>
        <table className="rbl-stack" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14.5 }}>
          <caption style={{ textAlign: 'left', fontSize: 14, fontWeight: 700, color: 'var(--rbl-text-strong)', paddingBottom: 6 }}>By fund</caption>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--rbl-border)' }}>
              <th scope="col" style={th}>Fund</th>
              <th scope="col" style={{ ...th, textAlign: 'right' }}>2026</th>
              {e2027 ? <th scope="col" style={{ ...th, textAlign: 'right' }}>{proposalLabel.replace(' Budget', '')}</th> : null}
              {e2027 ? <th scope="col" style={{ ...th, textAlign: 'right' }}>Change</th> : null}
            </tr>
          </thead>
          <tbody>
            {funds.map((f) => (
              <tr key={f.key} style={{ borderBottom: '1px solid var(--rbl-border-subtle)' }}>
                <th scope="row" style={{ ...td, textAlign: 'left', fontWeight: 600 }}>{f.label}</th>
                <td data-label="2026" style={{ ...td, textAlign: 'right' }}>{usd(e2026[f.key as keyof typeof e2026])}</td>
                {e2027 ? <td data-label={proposalLabel} style={{ ...td, textAlign: 'right' }}>{usd(e2027[f.key as keyof typeof e2027])}</td> : null}
                {e2027 ? <td data-label="Change" style={{ ...td, textAlign: 'right' }}>{signed(e2027[f.key as keyof typeof e2027] - e2026[f.key as keyof typeof e2026])}</td> : null}
              </tr>
            ))}
            <tr>
              <th scope="row" style={{ ...td, textAlign: 'left', fontWeight: 700 }}>Town total</th>
              <td data-label="2026" style={{ ...td, textAlign: 'right', fontWeight: 700 }}>{usd(e2026.total)}</td>
              {e2027 ? <td data-label={proposalLabel} style={{ ...td, textAlign: 'right', fontWeight: 700 }}>{usd(e2027.total)}</td> : null}
              {e2027 ? <td data-label="Change" style={{ ...td, textAlign: 'right', fontWeight: 700 }}>{signed(e2027.total - e2026.total)}</td> : null}
            </tr>
          </tbody>
        </table>
      </div>

      <p style={{ color: 'var(--rbl-text-muted)', fontSize: 13.5, lineHeight: 1.5, marginTop: 14 }}>
        Town taxes only, at the Town-wide rates. County, school district, fire, library and other special-district taxes are separate
        lines on your bill and are not estimated here.
      </p>
    </div>
  )
}

const th = { padding: '7px 8px', fontSize: 13, color: 'var(--rbl-text-muted)', fontWeight: 600, textAlign: 'left' } as const
const td = { padding: '7px 8px' } as const
const chip = {
  marginTop: 8, minHeight: 32, padding: '5px 12px', borderRadius: 999, border: '1px solid var(--rbl-border)',
  background: 'var(--rbl-surface-2)', color: 'var(--rbl-link)', fontWeight: 600, fontSize: 13.5, cursor: 'pointer',
} as const
const signed = (n: number) => `${n >= 0 ? '+' : '−'}${usd(Math.abs(n))}`

function ModeButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      style={{
        flex: '1 1 200px',
        minHeight: 40,
        padding: '8px 12px',
        borderRadius: 8,
        border: active ? '1px solid var(--rbl-accent-border)' : '1px solid var(--rbl-border-subtle)',
        background: active ? 'var(--rbl-fill-accent)' : 'var(--rbl-surface)',
        color: active ? 'white' : 'var(--rbl-title)',
        fontWeight: 700,
        fontSize: 14,
        cursor: 'pointer',
      }}
    >
      {label}
    </button>
  )
}

function MoneyField({ id, label, value, onChange, hint, children }: {
  id: string; label: string; value: string; onChange: (v: string) => void; hint: string; children?: React.ReactNode
}) {
  return (
    <div>
      <label htmlFor={id} style={{ display: 'block', fontWeight: 700, color: 'var(--rbl-title)', fontSize: 14.5, marginBottom: 6 }}>{label}</label>
      <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--rbl-border)', borderRadius: 8, background: 'var(--rbl-surface)', maxWidth: 260 }}>
        <span aria-hidden="true" style={{ padding: '0 4px 0 12px', color: 'var(--rbl-text-muted)', fontWeight: 600 }}>$</span>
        <input
          id={id}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          value={value}
          onChange={(e) => { const digits = e.target.value.replace(/[^0-9]/g, ''); onChange(digits ? group(Number(digits)) : '') }}
          aria-describedby={`${id}-hint`}
          style={{ flex: 1, minWidth: 0, minHeight: 40, border: 0, background: 'transparent', color: 'var(--rbl-text-strong)', fontSize: 17, fontWeight: 600, padding: '6px 10px 6px 0' }}
        />
      </div>
      {children}
      <div id={`${id}-hint`} style={{ color: 'var(--rbl-text-muted)', fontSize: 13, lineHeight: 1.45, marginTop: 6, maxWidth: '68ch' }}>{hint}</div>
    </div>
  )
}
