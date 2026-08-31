'use client'

import { useMemo, useState } from 'react'
import type { Outlier } from '../lib/budget-accuracy'

const card = { background: 'var(--rbl-surface)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 16, padding: 20, boxShadow: '0 14px 34px var(--rbl-shadow)' } as const
const usd = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

type Tab = 'overBudget' | 'chronicOverrun' | 'noBudget'

export default function BudgetAccuracyOutliers({
  overBudget, chronicOverrun, noBudget, recoverablePool,
}: {
  overBudget: Outlier[]
  chronicOverrun: Outlier[]
  noBudget: Outlier[]
  recoverablePool: number
}) {
  const [tab, setTab] = useState<Tab>('overBudget')
  const [q, setQ] = useState('')

  const TABS: { key: Tab; label: string; blurb: string; rows: Outlier[] }[] = [
    {
      key: 'overBudget',
      label: `Budgeted above the run-rate (${overBudget.length})`,
      blurb: `Controllable lines where the 2026 figure sits more than 30% above what the line has actually been running. Together they hold ${usd(recoverablePool)} more than recent spending supports.`,
      rows: overBudget,
    },
    {
      key: 'chronicOverrun',
      label: `Chronic overruns (${chronicOverrun.length})`,
      blurb: '2024 spending ran well past the 2025 adopted amount — the opposite problem, and a sign the baseline is set too low to be believed.',
      rows: chronicOverrun,
    },
    {
      key: 'noBudget',
      label: `Spending with no budget (${noBudget.length})`,
      blurb: 'Real money went out on lines the 2025 budget set to zero. Interfund transfers are excluded, so these are not bookkeeping moves.',
      rows: noBudget,
    },
  ]

  const active = TABS.find((t) => t.key === tab)!
  const query = q.trim().toLowerCase()
  const rows = useMemo(
    () => (query ? active.rows.filter((r) => `${r.name} ${r.account} ${r.fund}`.toLowerCase().includes(query)) : active.rows),
    [active, query]
  )

  return (
    <section style={{ ...card }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              cursor: 'pointer', borderRadius: 999, padding: '6px 13px', fontSize: 13, fontWeight: 700,
              border: `1px solid ${tab === t.key ? 'var(--rbl-title)' : 'var(--rbl-border-subtle)'}`,
              background: tab === t.key ? 'var(--rbl-title)' : 'transparent',
              color: tab === t.key ? 'var(--rbl-surface)' : 'var(--rbl-text-body)',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <p style={{ color: 'var(--rbl-text-body)', fontSize: 14.5, lineHeight: 1.6, marginTop: 0 }}>{active.blurb}</p>

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Filter by line name, account or fund…"
        style={{
          width: '100%', boxSizing: 'border-box', padding: '8px 11px', marginBottom: 12, fontSize: 14,
          borderRadius: 9, border: '1px solid var(--rbl-border-subtle)', background: 'var(--rbl-surface-2)', color: 'var(--rbl-text-strong)',
        }}
      />

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5, minWidth: 600 }}>
          <thead>
            <tr style={{ textAlign: 'left', color: 'var(--rbl-text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.4 }}>
              <th style={{ padding: '8px 10px' }}>Line</th>
              <th style={{ padding: '8px 10px', textAlign: 'right' }}>2024 actual</th>
              <th style={{ padding: '8px 10px', textAlign: 'right' }}>2025 budget</th>
              <th style={{ padding: '8px 10px', textAlign: 'right' }}>2026 tentative</th>
              <th style={{ padding: '8px 10px', textAlign: 'right' }}>Gap</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.account} style={{ borderTop: '1px solid var(--rbl-border-subtle)' }}>
                <td style={{ padding: '9px 10px' }}>
                  <strong style={{ color: 'var(--rbl-title)' }}>{r.name}</strong>
                  <div style={{ color: 'var(--rbl-text-muted)', fontSize: 11.5, marginTop: 2 }}>{r.fund} · {r.account}</div>
                </td>
                <td style={{ padding: '9px 10px', textAlign: 'right', whiteSpace: 'nowrap' }}>{usd(r.actual2024)}</td>
                <td style={{ padding: '9px 10px', textAlign: 'right', whiteSpace: 'nowrap' }}>{usd(r.budget2025)}</td>
                <td style={{ padding: '9px 10px', textAlign: 'right', whiteSpace: 'nowrap' }}>{usd(r.tentative2026)}</td>
                <td style={{ padding: '9px 10px', textAlign: 'right', fontWeight: 800, color: 'var(--rbl-title)', whiteSpace: 'nowrap' }}>{usd(r.excess)}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={5} style={{ padding: '14px 10px', color: 'var(--rbl-text-muted)' }}>No lines match that filter.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
