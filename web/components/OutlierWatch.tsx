'use client'

import { useMemo, useState } from 'react'
import type { FundYoyChange } from '../lib/outlier-watch'

const card = { background: 'var(--rbl-surface)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 16, padding: 18, boxShadow: '0 14px 34px var(--rbl-shadow)' } as const
const usd = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
const th = { padding: '8px 10px', fontWeight: 800, fontSize: 12 } as const
const td = { padding: '8px 10px' } as const

export default function OutlierWatch({ outliers, yearTransitions }: { outliers: FundYoyChange[]; yearTransitions: string[] }) {
  const [transition, setTransition] = useState<'all' | string>('all')

  const rows = useMemo(
    () => (transition === 'all' ? outliers : outliers.filter((o) => `${o.fromYear}→${o.toYear}` === transition)),
    [outliers, transition]
  )

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <section style={{ ...card, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <button onClick={() => setTransition('all')} style={{
          padding: '8px 13px', borderRadius: 9, border: '1px solid', cursor: 'pointer', fontWeight: 800, fontSize: 13.5,
          borderColor: transition === 'all' ? 'var(--rbl-accent-border)' : 'var(--rbl-border-strong)', background: transition === 'all' ? 'var(--rbl-fill-accent)' : 'var(--rbl-surface)', color: transition === 'all' ? 'white' : 'var(--rbl-text-strong)',
        }}>All years ({outliers.length})</button>
        {yearTransitions.map((t) => {
          const count = outliers.filter((o) => `${o.fromYear}→${o.toYear}` === t).length
          return (
            <button key={t} onClick={() => setTransition(t)} disabled={count === 0} style={{
              padding: '8px 13px', borderRadius: 9, border: '1px solid', cursor: count === 0 ? 'default' : 'pointer', fontWeight: 800, fontSize: 13.5,
              borderColor: transition === t ? 'var(--rbl-accent-border)' : 'var(--rbl-border-strong)', background: transition === t ? 'var(--rbl-fill-accent)' : 'var(--rbl-surface)',
              color: transition === t ? 'white' : count === 0 ? 'var(--rbl-text-muted)' : 'var(--rbl-text-strong)',
            }}>{t} ({count})</button>
          )
        })}
      </section>

      <section style={card}>
        <div style={{ color: 'var(--rbl-text-body)', fontWeight: 700, marginBottom: 8, fontSize: 14 }}>{rows.length} flagged fund-year{rows.length === 1 ? '' : 's'}</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
            <thead>
              <tr style={{ textAlign: 'left', color: 'var(--rbl-text-muted)', borderBottom: '2px solid var(--rbl-border-subtle)' }}>
                <th style={th}>Fund</th>
                <th style={th}>Years</th>
                <th style={{ ...th, textAlign: 'right' }}>Prior</th>
                <th style={{ ...th, textAlign: 'right' }}>Current</th>
                <th style={{ ...th, textAlign: 'right' }}>Change</th>
                <th style={{ ...th, textAlign: 'right' }}>% Change</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((o) => (
                <tr key={`${o.code}-${o.fromYear}`} style={{ borderBottom: '1px solid var(--rbl-border-subtle)' }}>
                  <td style={{ ...td, fontWeight: 800, color: 'var(--rbl-title)' }}>{o.name}<div style={{ fontWeight: 600, color: 'var(--rbl-text-muted)', fontSize: 11.5 }}>{o.code}</div></td>
                  <td style={td}>{o.fromYear} → {o.toYear}</td>
                  <td style={{ ...td, textAlign: 'right' }}>{usd(o.prior)}</td>
                  <td style={{ ...td, textAlign: 'right' }}>{usd(o.current)}</td>
                  <td style={{ ...td, textAlign: 'right', fontWeight: 800, color: o.dollarChange >= 0 ? 'var(--inc)' : 'var(--dec)' }}>
                    {o.dollarChange >= 0 ? '+' : ''}{usd(o.dollarChange)}
                  </td>
                  <td style={{ ...td, textAlign: 'right', fontWeight: 800, color: (o.pctChange ?? 0) >= 0 ? 'var(--inc)' : 'var(--dec)' }}>
                    {o.pctChange === null ? '—' : `${o.pctChange >= 0 ? '+' : ''}${o.pctChange.toFixed(1)}%`}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td style={{ ...td, color: 'var(--rbl-text-muted)' }} colSpan={6}>No flagged changes for this range.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
