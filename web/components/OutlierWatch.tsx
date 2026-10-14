'use client'

import { useMemo, useState } from 'react'
import type { FundYoyChange } from '../lib/outlier-watch'

const card = { background: 'var(--rbl-surface)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 16, padding: 18 } as const
const usd = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
const signed = (n: number) => `${n >= 0 ? '+' : '−'}${usd(Math.abs(n))}`
const signedPct = (n: number) => `${n >= 0 ? '+' : '−'}${Math.abs(n).toFixed(1)}%`
const th = { padding: '8px 10px', fontWeight: 600, fontSize: 13.5 } as const
const td = { padding: '9px 10px', verticalAlign: 'top' } as const
const spaced = (key: string) => key.replace('→', ' → ')

export default function OutlierWatch({ outliers, transitions }: { outliers: FundYoyChange[]; transitions: { key: string; proposed: boolean }[] }) {
  const [transition, setTransition] = useState<'all' | string>('all')

  const rows = useMemo(
    () => (transition === 'all' ? outliers : outliers.filter((o) => o.transition === transition)),
    [outliers, transition]
  )

  const chip = (active: boolean, enabled: boolean) => ({
    padding: '8px 13px', borderRadius: 9, border: '1px solid', cursor: enabled ? 'pointer' : 'default', fontWeight: 600, fontSize: 14,
    borderColor: active ? 'var(--rbl-accent-border)' : 'var(--rbl-border-strong)',
    background: active ? 'var(--rbl-fill-accent)' : 'var(--rbl-surface)',
    color: active ? 'white' : enabled ? 'var(--rbl-text-strong)' : 'var(--rbl-text-muted)',
  })

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr)', gap: 12 }}>
      <div role="group" aria-label="Show flags for" style={{ ...card, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <button type="button" aria-pressed={transition === 'all'} onClick={() => setTransition('all')} style={chip(transition === 'all', true)}>
          All years ({outliers.length})
        </button>
        {transitions.map((t) => {
          const count = outliers.filter((o) => o.transition === t.key).length
          return (
            <button key={t.key} type="button" aria-pressed={transition === t.key} onClick={() => setTransition(t.key)} disabled={count === 0} style={chip(transition === t.key, count > 0)}>
              {spaced(t.key)} ({count})
            </button>
          )
        })}
      </div>

      <section style={card}>
        <div role="region" tabIndex={0} aria-labelledby="outlier-caption" style={{ overflowX: 'auto' }}>
          <table className="rbl-stack" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 15 }}>
            <caption id="outlier-caption" style={{ textAlign: 'left', color: 'var(--rbl-text-body)', fontWeight: 600, fontSize: 15, padding: '0 0 8px' }}>
              {rows.length} flagged {rows.length === 1 ? 'change' : 'changes'}, largest first
            </caption>
            <thead>
              <tr style={{ textAlign: 'left', color: 'var(--rbl-text-muted)', borderBottom: '1px solid var(--rbl-border)' }}>
                <th scope="col" style={th}>Fund</th>
                <th scope="col" style={th}>Budgets compared</th>
                <th scope="col" style={{ ...th, textAlign: 'right' }}>From</th>
                <th scope="col" style={{ ...th, textAlign: 'right' }}>To</th>
                <th scope="col" style={{ ...th, textAlign: 'right' }}>Change</th>
                <th scope="col" style={{ ...th, textAlign: 'right' }}>% change</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((o) => (
                <tr key={`${o.code}-${o.transition}`} style={{ borderBottom: '1px solid var(--rbl-border-subtle)' }}>
                  <td style={{ ...td, fontWeight: 700, color: 'var(--rbl-title)' }}>
                    {o.name}
                    <span style={{ display: 'block', fontWeight: 400, color: 'var(--rbl-text-muted)', fontSize: 13 }}>{o.code}</span>
                  </td>
                  <td data-label="Budgets compared" style={td}>{spaced(o.transition)}</td>
                  <td data-label="From" style={{ ...td, textAlign: 'right' }}>{usd(o.prior)}</td>
                  <td data-label="To" style={{ ...td, textAlign: 'right' }}>{usd(o.current)}</td>
                  <td data-label="Change" style={{ ...td, textAlign: 'right', fontWeight: 700, color: o.dollarChange >= 0 ? 'var(--inc)' : 'var(--dec)' }}>
                    {signed(o.dollarChange)}
                  </td>
                  <td data-label="% change" style={{ ...td, textAlign: 'right', fontWeight: 700, color: (o.pctChange ?? 0) >= 0 ? 'var(--inc)' : 'var(--dec)' }}>
                    {o.pctChange === null ? '—' : signedPct(o.pctChange)}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td style={{ ...td, color: 'var(--rbl-text-muted)' }} colSpan={6}>No flagged changes for these budgets.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
