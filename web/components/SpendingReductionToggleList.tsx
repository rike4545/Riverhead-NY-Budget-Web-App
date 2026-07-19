'use client'

import { useMemo, useState } from 'react'
import {
  personnelPolicyItems,
  operationalItems,
  personnelPolicyTotal,
  operationalTotal,
  fullRecurringReductionPackage,
  modeledAutomaticPayrollPressure,
  type SpendingReductionItem,
} from '../lib/spending-reduction-2027'

const usd = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
const card = { background: 'white', border: '1px solid #e2e8f0', borderRadius: 16, padding: 20, boxShadow: '0 14px 34px rgba(15,23,42,.05)' } as const

const allItems = [...personnelPolicyItems, ...operationalItems]

export default function SpendingReductionToggleList() {
  const [deselected, setDeselected] = useState<Set<string>>(new Set())

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
  const grandSelected = personnelSelected + operationalSelected

  const coverage = modeledAutomaticPayrollPressure > 0
    ? Math.min(grandSelected / modeledAutomaticPayrollPressure, 1)
    : 0

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <section style={card}>
        <div style={{ color: '#64748b', fontSize: 12.5, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 0.4 }}>
          Your selected package
        </div>
        <div style={{ fontSize: 34, fontWeight: 900, color: '#1f7a5c', lineHeight: 1.15, margin: '2px 0 6px' }}>
          {usd(grandSelected)}
        </div>
        <div style={{ color: '#64748b', fontSize: 13.5, marginBottom: 12 }}>
          out of {usd(fullRecurringReductionPackage)} available
        </div>

        <div style={{ height: 8, borderRadius: 999, background: '#e2e8f0', overflow: 'hidden', marginBottom: 6 }}>
          <div
            style={{
              height: '100%',
              width: `${coverage * 100}%`,
              background: '#1f7a5c',
              borderRadius: 999,
              transition: 'width 0.2s ease',
            }}
          />
        </div>
        <div style={{ color: '#64748b', fontSize: 12.5, marginBottom: 14 }}>
          {(coverage * 100).toFixed(0)}% of the {usd(modeledAutomaticPayrollPressure)} modeled 2027 payroll-pressure gap
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 10, marginBottom: 14 }}>
          <MetricTile label="Personnel & policy" value={personnelSelected} color="#284a69" />
          <MetricTile label="Operational growth control" value={operationalSelected} color="#b45309" />
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setDeselected(new Set())} style={buttonStyle}>
            Select all
          </button>
          <button onClick={() => setDeselected(new Set(allItems.map((i) => i.id)))} style={buttonStyle}>
            Clear all
          </button>
        </div>
      </section>

      <section style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderLeft: '6px solid #64748b', borderRadius: 12, padding: '14px 16px' }}>
        <p style={{ margin: 0, color: '#334155', fontSize: 13.8, lineHeight: 1.55 }}>
          Union wage growth ($907.9K of modeled PBA/SOA/CSEA pressure) is the single largest driver in the 2027
          model, but it&apos;s contractually locked and cannot be treated as a spending-reduction lever without a
          successor labor agreement — it stays on the pressure side of the budget, not here. Every dollar below is
          traceable to either a named formula input or an actual 2025→2026 account-level change in the Town&apos;s
          own 2026 Budget Supplement. Click any item to test a package that leaves it out.
        </p>
        <p style={{ margin: '10px 0 0', color: '#334155', fontSize: 13.8, lineHeight: 1.55 }}>
          PBA and SOA contracts both expire 12/31/2026 (CSEA is already locked through a ratified 2026-2029
          agreement). New York law routes police/fire bargaining impasses to binding arbitration rather than
          legislative resolution, and comparable Long Island police contracts have taken 1-3+ years past expiration
          to settle — so the PBA/SOA figures above will likely remain placeholder estimates through the 2027 budget
          cycle, with any successor terms applied retroactively once reached.
        </p>
      </section>

      <ItemSection
        title="Personnel &amp; Policy Savings"
        selectedAmount={personnelSelected}
        fullAmount={personnelPolicyTotal}
        items={personnelPolicyItems}
        isSelected={isSelected}
        onToggle={toggle}
        footer="Six categories: policy or formula-driven savings that would require Board or contract action to actually capture."
      />

      <ItemSection
        title="Operational Growth Controls"
        selectedAmount={operationalSelected}
        fullAmount={operationalTotal}
        items={operationalItems}
        isSelected={isSelected}
        onToggle={toggle}
        footer="Real account-level growth from the 2026 Budget Supplement, flagged for Board scrutiny before being carried forward as a permanent baseline."
      />
    </div>
  )
}

function MetricTile({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ background: `${color}14`, borderRadius: 10, padding: 10 }}>
      <div style={{ color: '#64748b', fontSize: 11.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.3 }}>{label}</div>
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
      <h2 style={{ margin: '0 0 12px', color: '#284a69', fontSize: 17 }}>
        {title} — {usd(selectedAmount)} of {usd(fullAmount)}
      </h2>
      <div style={{ display: 'grid', gap: 10 }}>
        {items.map((item) => {
          const selected = isSelected(item.id)
          return (
            <button
              key={item.id}
              onClick={() => onToggle(item.id)}
              style={{
                textAlign: 'left',
                background: selected ? '#f0fdf9' : '#f8fafc',
                border: `1px solid ${selected ? '#99f6e4' : '#e2e8f0'}`,
                borderRadius: 12,
                padding: '12px 14px',
                cursor: 'pointer',
                opacity: selected ? 1 : 0.6,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'baseline' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800, color: '#284a69', fontSize: 14.5 }}>
                  <span
                    aria-hidden
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: 4,
                      border: `2px solid ${selected ? '#1f7a5c' : '#94a3b8'}`,
                      background: selected ? '#1f7a5c' : 'transparent',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {selected && <span style={{ color: 'white', fontSize: 11, lineHeight: 1 }}>✓</span>}
                  </span>
                  {item.title}
                </span>
                <span style={{ fontWeight: 800, color: selected ? '#1f7a5c' : '#94a3b8', fontSize: 14.5, whiteSpace: 'nowrap' }}>
                  {usd(item.amount)}
                </span>
              </div>
              <div style={{ color: '#64748b', fontSize: 12.5, marginTop: 5, marginLeft: 24 }}>{item.source}</div>
              <div style={{ color: '#94a3b8', fontSize: 12.5, marginTop: 3, marginLeft: 24, fontStyle: 'italic' }}>{item.rationale}</div>
            </button>
          )
        })}
      </div>
      <p style={{ color: '#94a3b8', fontSize: 12, marginTop: 12, marginBottom: 0, lineHeight: 1.45 }}>{footer}</p>
    </section>
  )
}

const buttonStyle = {
  border: '1px solid #cbd5e1',
  background: 'white',
  color: '#334155',
  fontWeight: 700,
  fontSize: 13,
  padding: '7px 14px',
  borderRadius: 8,
  cursor: 'pointer',
} as const
