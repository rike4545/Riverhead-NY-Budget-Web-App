'use client'

import { useMemo, useState } from 'react'
import {
  personnelPolicyItems,
  operationalItems,
  supplementTrimItems,
  personnelPolicyTotal,
  operationalTotal,
  supplementTrimTotal,
  fullRecurringReductionPackage,
  modeledAutomaticPayrollPressure,
  type SpendingReductionItem,
} from '../lib/spending-reduction-2027'
import { capGap2027 } from '../lib/close-the-gap-2027'

const usd = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
const card = { background: 'var(--rbl-surface)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 16, padding: 20, boxShadow: '0 14px 34px var(--rbl-shadow)' } as const

const CONFIDENCE_STYLE: Record<string, { label: string; color: string; bg: string }> = {
  firm: { label: 'FIRM', color: 'var(--rbl-success-strong)', bg: 'var(--rbl-success-border)' },
  moderate: { label: 'MODERATE', color: 'var(--rbl-warn)', bg: 'var(--rbl-warn-bg)' },
  volatile: { label: 'VOLATILE', color: 'var(--rbl-danger)', bg: 'var(--rbl-danger-bg)' },
}

const allItems = [...personnelPolicyItems, ...operationalItems, ...supplementTrimItems]
const firmLineIds = new Set(supplementTrimItems.filter((i) => i.confidence === 'firm').map((i) => i.id))

export default function SpendingReductionToggleList() {
  // Start with nothing selected. A candidate is not a recommendation merely because
  // it appears in the evidence set; the resident should choose what to test.
  const [deselected, setDeselected] = useState<Set<string>>(new Set(allItems.map((i) => i.id)))

  const isSelected = (id: string) => !deselected.has(id)

  const toggle = (id: string) => {
    setDeselected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectedTotal = (items: SpendingReductionItem[]) =>
    items.filter((i) => isSelected(i.id)).reduce((s, i) => s + i.amount, 0)

  const personnelSelected = useMemo(() => selectedTotal(personnelPolicyItems), [deselected])
  const operationalSelected = useMemo(() => selectedTotal(operationalItems), [deselected])
  const supplementSelected = useMemo(() => selectedTotal(supplementTrimItems), [deselected])
  const grandSelected = personnelSelected + operationalSelected + supplementSelected

  const proxyCoverageRaw = capGap2027.gap > 0 ? grandSelected / capGap2027.gap : 0
  const proxyCoverage = Math.min(proxyCoverageRaw, 1)
  const proxyResidual = Math.max(0, capGap2027.gap - grandSelected)
  const payrollCoverage = modeledAutomaticPayrollPressure > 0 ? grandSelected / modeledAutomaticPayrollPressure : 0

  const selectFirmLines = () => setDeselected(new Set(allItems.filter((i) => !firmLineIds.has(i.id)).map((i) => i.id)))

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <section style={card}>
        <div style={{ color: 'var(--rbl-text-muted)', fontSize: 12.5, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 0.4 }}>
          Your test package
        </div>
        <div style={{ fontSize: 34, fontWeight: 900, color: grandSelected > 0 ? 'var(--rbl-success)' : 'var(--rbl-title)', lineHeight: 1.15, margin: '2px 0 6px' }}>
          {usd(grandSelected)}
        </div>
        <div style={{ color: 'var(--rbl-text-muted)', fontSize: 13.5, marginBottom: 12 }}>
          selected from {usd(fullRecurringReductionPackage)} of identified candidates — not booked savings
        </div>

        <div style={{ height: 9, borderRadius: 999, background: 'var(--rbl-track)', overflow: 'hidden', marginBottom: 7 }}>
          <div
            style={{
              height: '100%',
              width: `${proxyCoverage * 100}%`,
              background: 'var(--rbl-success)',
              borderRadius: 999,
              transition: 'width 0.2s ease',
            }}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', color: 'var(--rbl-text-muted)', fontSize: 12.5, marginBottom: 14 }}>
          <span>{(proxyCoverageRaw * 100).toFixed(0)}% of the {usd(capGap2027.gap)} <strong>2% planning-proxy gap</strong></span>
          <span>{proxyResidual > 0 ? `${usd(proxyResidual)} residual` : 'Proxy gap covered'}</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 10, marginBottom: 14 }}>
          <MetricTile label="Personnel & policy" value={personnelSelected} color="var(--rbl-title)" />
          <MetricTile label="Operational review" value={operationalSelected} color="var(--rbl-warn)" />
          <MetricTile label="Line-item trims" value={supplementSelected} color="var(--rbl-accent)" />
        </div>

        <div style={{ background: 'var(--rbl-surface-2)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 10, padding: '10px 12px', color: 'var(--rbl-text-body)', fontSize: 12.8, lineHeight: 1.5, marginBottom: 14 }}>
          Secondary check: this selection equals <strong>{(payrollCoverage * 100).toFixed(0)}%</strong> of the {usd(modeledAutomaticPayrollPressure)} modeled automatic payroll pressure. That is a cost-driver comparison, not the legal tax-cap test.
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button type="button" onClick={selectFirmLines} style={buttonStyle}>Select firm line trims</button>
          <button type="button" onClick={() => setDeselected(new Set())} style={buttonStyle}>Select all candidates</button>
          <button type="button" onClick={() => setDeselected(new Set(allItems.map((i) => i.id)))} style={buttonStyle}>Clear</button>
        </div>
      </section>

      <section style={{ background: 'var(--rbl-surface-2)', border: '1px solid var(--rbl-border-subtle)', borderLeft: '6px solid var(--rbl-border-strong)', borderRadius: 12, padding: '14px 16px' }}>
        <p style={{ margin: 0, color: 'var(--rbl-text-strong)', fontSize: 13.8, lineHeight: 1.55 }}>
          <strong>How to read this builder:</strong> every item below is an identified budget lever or review target, not a promise that the Town can capture the entire amount. Personnel-policy items require actual Board, management, bargaining, retirement or hiring outcomes. Operational items require validation before a budget is reduced. Supplement lines marked moderate or volatile depend on project timing or prices.
        </p>
      </section>

      <ItemSection
        title="Personnel & Policy Candidates"
        selectedAmount={personnelSelected}
        fullAmount={personnelPolicyTotal}
        items={personnelPolicyItems}
        isSelected={isSelected}
        onToggle={toggle}
        footer="Policy or staffing scenarios. These amounts become savings only if the underlying action occurs and the lower spending is actually reflected in the 2027 budget."
      />

      <ItemSection
        title="Operational Review Targets"
        selectedAmount={operationalSelected}
        fullAmount={operationalTotal}
        items={operationalItems}
        isSelected={isSelected}
        onToggle={toggle}
        footer="Account-level growth from the 2026 Budget Supplement flagged for validation before being carried forward. A large increase is a question to investigate, not proof of waste."
      />

      {supplementTrimItems.length > 0 && (
        <ItemSection
          title="Line-Item Trims · 2026 Supplement"
          selectedAmount={supplementSelected}
          fullAmount={supplementTrimTotal}
          items={supplementTrimItems}
          isSelected={isSelected}
          onToggle={toggle}
          footer="Controllable, non-mandated lines budgeted above trailing actuals. FIRM = strongest run-rate case; MODERATE = timing-sensitive capital/maintenance; VOLATILE = price-driven fuel or energy. Mandated costs are excluded."
        />
      )}
    </div>
  )
}

function MetricTile({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ background: `${color}14`, borderRadius: 10, padding: 10 }}>
      <div style={{ color: 'var(--rbl-text-muted)', fontSize: 11.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.3 }}>{label}</div>
      <div style={{ color, fontSize: 18, fontWeight: 900 }}>{usd(value)}</div>
    </div>
  )
}

function ItemSection({
  title,
  selectedAmount,
  fullAmount,
  items,
  isSelected,
  onToggle,
  footer,
}: {
  title: string
  selectedAmount: number
  fullAmount: number
  items: SpendingReductionItem[]
  isSelected: (id: string) => boolean
  onToggle: (id: string) => void
  footer: string
}) {
  return (
    <section style={card}>
      <h2 style={{ margin: '0 0 12px', color: 'var(--rbl-title)', fontSize: 17 }}>
        {title} — {usd(selectedAmount)} of {usd(fullAmount)} selected
      </h2>
      <div style={{ display: 'grid', gap: 10 }}>
        {items.map((item) => {
          const selected = isSelected(item.id)
          return (
            <button
              key={item.id}
              type="button"
              aria-pressed={selected}
              onClick={() => onToggle(item.id)}
              style={{
                textAlign: 'left',
                background: selected ? 'var(--rbl-teal-bg)' : 'var(--rbl-surface-2)',
                border: `1px solid ${selected ? 'var(--rbl-teal-border)' : 'var(--rbl-border-subtle)'}`,
                borderRadius: 12,
                padding: '12px 14px',
                cursor: 'pointer',
                opacity: selected ? 1 : 0.72,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'baseline', flexWrap: 'wrap' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800, color: 'var(--rbl-title)', fontSize: 14.5, minWidth: 0 }}>
                  <span
                    aria-hidden
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: 4,
                      border: `2px solid ${selected ? 'var(--rbl-success)' : 'var(--rbl-text-muted)'}`,
                      background: selected ? 'var(--rbl-success)' : 'transparent',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {selected && <span style={{ color: 'white', fontSize: 11, lineHeight: 1 }}>✓</span>}
                  </span>
                  {item.title}
                  {item.confidence && CONFIDENCE_STYLE[item.confidence] && (
                    <span style={{
                      background: CONFIDENCE_STYLE[item.confidence].bg, color: CONFIDENCE_STYLE[item.confidence].color,
                      fontWeight: 800, fontSize: 10, letterSpacing: 0.3, padding: '2px 7px', borderRadius: 999, whiteSpace: 'nowrap',
                    }}>{CONFIDENCE_STYLE[item.confidence].label}</span>
                  )}
                </span>
                <span style={{ fontWeight: 800, color: selected ? 'var(--rbl-success)' : 'var(--rbl-text-muted)', fontSize: 14.5, whiteSpace: 'nowrap' }}>
                  {usd(item.amount)}
                </span>
              </div>
              <div style={{ color: 'var(--rbl-text-muted)', fontSize: 12.5, marginTop: 5, marginLeft: 24 }}>{item.source}</div>
              <div style={{ color: 'var(--rbl-text-muted)', fontSize: 12.5, marginTop: 3, marginLeft: 24, fontStyle: 'italic' }}>{item.rationale}</div>
            </button>
          )
        })}
      </div>
      <p style={{ color: 'var(--rbl-text-muted)', fontSize: 12, marginTop: 12, marginBottom: 0, lineHeight: 1.45 }}>{footer}</p>
    </section>
  )
}

const buttonStyle = {
  border: '1px solid var(--rbl-border-strong)',
  background: 'var(--rbl-surface)',
  color: 'var(--rbl-text-strong)',
  fontWeight: 700,
  fontSize: 13,
  padding: '8px 13px',
  borderRadius: 8,
  cursor: 'pointer',
} as const
