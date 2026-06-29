'use client'

import { useMemo, useState } from 'react'
import type { FundDetail, SubDepartment } from '../lib/subaccounts'
import Sparkline from './Sparkline'
import { appropriationsByYear } from '../lib/budget-history'

const usd = (n: number | null | undefined) =>
  n == null ? '—' : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

const card = { background: 'white', border: '1px solid #e2e8f0', borderRadius: 16, padding: 18, boxShadow: '0 14px 34px rgba(15,23,42,.05)' } as const

const CATEGORY_COLOR: Record<string, string> = {
  'Personal Services': '#1f5f8f',
  'Employee Benefits': '#2563eb',
  Contractual: '#c99a2e',
  'Equipment & Capital Outlay': '#0f766e',
  'Interfund / Transfers': '#7c3aed',
  Other: '#64748b',
}

export default function FundDrilldown({ fund }: { fund: FundDetail }) {
  const [query, setQuery] = useState('')
  const [view, setView] = useState<'expenditures' | 'revenues'>('expenditures')
  const q = query.trim().toLowerCase()

  const filteredDepts = useMemo(() => {
    if (!q) return fund.departments
    return fund.departments
      .map((d) => ({
        ...d,
        lineItems: d.lineItems.filter(
          (i) => i.name.toLowerCase().includes(q) || i.account.toLowerCase().includes(q),
        ),
      }))
      .filter((d) => d.lineItems.length > 0 || d.name.toLowerCase().includes(q))
  }, [fund.departments, q])

  const filteredRevenues = useMemo(() => {
    if (!q) return fund.revenues
    return fund.revenues.filter(
      (i) => i.name.toLowerCase().includes(q) || i.account.toLowerCase().includes(q),
    )
  }, [fund.revenues, q])

  const matchCount = q
    ? view === 'expenditures'
      ? filteredDepts.reduce((s, d) => s + d.lineItems.length, 0)
      : filteredRevenues.length
    : null

  const history = appropriationsByYear(fund.code).filter((p) => p.value != null)

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <section style={{ ...card, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: 12 }}>
        <Stat label="2026 Appropriations" value={usd(fund.expenditureTotal2026)} accent />
        <Stat label="2026 Est. Revenues" value={usd(fund.revenueTotal2026)} />
        <Stat label="Departments / Functions" value={String(fund.departmentCount)} />
        <Stat label="Account Line Items" value={String(fund.lineItemCount)} />
        <Stat
          label="Reconciliation"
          value={fund.reconciled ? '✓ Ties to summary' : `Δ ${usd(fund.reconciliationVariance2026)}`}
          good={fund.reconciled}
        />
      </section>

      {history.length >= 2 && (
        <section style={{ ...card, display: 'flex', gap: 18, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between' }}>
          <div>
            <div style={{ color: '#64748b', fontSize: 12, textTransform: 'uppercase', fontWeight: 900, letterSpacing: 0.4 }}>
              Appropriations history {history[0].year}–{history[history.length - 1].year}
            </div>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 8 }}>
              {history.map((p) => (
                <span key={p.year} style={{ fontSize: 13, color: '#334155', fontWeight: 700 }}>
                  <span style={{ color: '#94a3b8' }}>{p.year}</span> {usd(p.value)}
                </span>
              ))}
            </div>
          </div>
          <Sparkline values={history.map((p) => p.value)} width={200} height={48} />
        </section>
      )}

      <section style={{ ...card, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <Toggle active={view === 'expenditures'} onClick={() => setView('expenditures')}>
            Expenditures ({fund.departments.length})
          </Toggle>
          <Toggle active={view === 'revenues'} onClick={() => setView('revenues')}>
            Revenues ({fund.revenues.length})
          </Toggle>
        </div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search account number or line description…"
          style={{ flex: 1, minWidth: 240, padding: '11px 14px', border: '1px solid #cbd5e1', borderRadius: 10, fontSize: 15 }}
        />
        {matchCount != null && (
          <span style={{ color: '#475569', fontWeight: 700, fontSize: 13 }}>{matchCount} matching line items</span>
        )}
      </section>

      {view === 'expenditures' ? (
        <section style={{ display: 'grid', gap: 12 }}>
          {filteredDepts.map((dept) => (
            <DepartmentCard key={dept.code} dept={dept} expanded={!!q} fundExp={fund.expenditureTotal2026} />
          ))}
          {filteredDepts.length === 0 && <Empty />}
        </section>
      ) : (
        <section style={card}>
          <h3 style={{ marginTop: 0 }}>Estimated Revenues by Source</h3>
          <LineTable
            rows={filteredRevenues.map((r) => ({ account: r.account, name: r.name, y2024: null, y2025: r.adopted2025, y2026: r.adopted2026 }))}
          />
          {filteredRevenues.length === 0 && <Empty />}
        </section>
      )}

      <p style={{ color: '#64748b', fontSize: 13, lineHeight: 1.5 }}>
        Source: {fund.source.title}. Account-level detail extracted programmatically and reconciled to the official
        Summary page. The 2026 column is the adopted figure; the 2025 column is the prior-year adopted budget for the
        same account. Verify against the{' '}
        <a href={fund.source.url} target="_blank" rel="noreferrer" style={{ color: '#1f5f8f', fontWeight: 700 }}>
          official document
        </a>{' '}
        before relying on these numbers.
      </p>
    </div>
  )
}

function DepartmentCard({ dept, expanded, fundExp }: { dept: SubDepartment; expanded: boolean; fundExp: number }) {
  const pct = fundExp > 0 ? (dept.adopted2026 / fundExp) * 100 : 0
  const changePct = dept.adopted2025 > 0 ? (dept.change / dept.adopted2025) * 100 : null
  return (
    <details open={expanded} style={card}>
      <summary style={{ cursor: 'pointer', listStyle: 'none', display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <div>
          <span style={{ color: '#94a3b8', fontWeight: 800, fontSize: 12 }}>#{dept.code}</span>{' '}
          <strong style={{ fontSize: 17 }}>{dept.name}</strong>
          <div style={{ color: '#64748b', fontSize: 12.5 }}>
            {dept.lineItemCount} line items · {pct.toFixed(1)}% of fund
            {changePct != null && (
              <span style={{ color: dept.change >= 0 ? '#b91c1c' : '#15803d', fontWeight: 800 }}>
                {' '}· {dept.change >= 0 ? '▲' : '▼'} {Math.abs(changePct).toFixed(1)}% vs 2025
              </span>
            )}
          </div>
        </div>
        <strong style={{ fontSize: 18, color: '#12385b' }}>{usd(dept.adopted2026)}</strong>
      </summary>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '12px 0' }}>
        {dept.categoryTotals.map((c) => (
          <span key={c.category} style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 999, padding: '5px 11px', fontSize: 12.5, fontWeight: 700 }}>
            <span style={{ display: 'inline-block', width: 9, height: 9, borderRadius: 9, background: CATEGORY_COLOR[c.category] ?? '#64748b', marginRight: 6 }} />
            {c.category}: {usd(c.adopted2026)}
          </span>
        ))}
      </div>

      <LineTable
        rows={dept.lineItems.map((i) => ({ account: i.account, name: i.name, category: i.category, y2024: i.adopted2024, y2025: i.adopted2025, y2026: i.adopted2026 }))}
      />
    </details>
  )
}

type Row = { account: string; name: string; category?: string; y2024: number | null; y2025: number | null; y2026: number | null }

function LineTable({ rows }: { rows: Row[] }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
        <thead>
          <tr style={{ textAlign: 'left', color: '#64748b', borderBottom: '2px solid #e2e8f0' }}>
            <th style={{ padding: '7px 8px' }}>Account</th>
            <th style={{ padding: '7px 8px' }}>Description</th>
            <th style={{ padding: '7px 8px', textAlign: 'right' }}>2024</th>
            <th style={{ padding: '7px 8px', textAlign: 'right' }}>2025</th>
            <th style={{ padding: '7px 8px', textAlign: 'right' }}>2026</th>
            <th style={{ padding: '7px 8px', textAlign: 'right' }}>25→26 Δ</th>
            <th style={{ padding: '7px 8px', textAlign: 'center' }}>Trend</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const change = (r.y2026 ?? 0) - (r.y2025 ?? 0)
            return (
              <tr key={r.account} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '7px 8px', fontFamily: 'monospace', fontSize: 11.5, color: '#475569', whiteSpace: 'nowrap' }}>{r.account}</td>
                <td style={{ padding: '7px 8px' }}>{r.name}</td>
                <td style={{ padding: '7px 8px', textAlign: 'right', color: '#94a3b8' }}>{usd(r.y2024)}</td>
                <td style={{ padding: '7px 8px', textAlign: 'right', color: '#64748b' }}>{usd(r.y2025)}</td>
                <td style={{ padding: '7px 8px', textAlign: 'right', fontWeight: 700 }}>{usd(r.y2026)}</td>
                <td style={{ padding: '7px 8px', textAlign: 'right', color: change > 0 ? '#b91c1c' : change < 0 ? '#15803d' : '#94a3b8', fontWeight: 700 }}>
                  {change === 0 ? '—' : `${change > 0 ? '+' : '−'}${usd(Math.abs(change))}`}
                </td>
                <td style={{ padding: '4px 8px', textAlign: 'center' }}>
                  <div style={{ display: 'inline-block' }}><Sparkline values={[r.y2024, r.y2025, r.y2026]} width={72} height={22} /></div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function Stat({ label, value, accent, good }: { label: string; value: string; accent?: boolean; good?: boolean }) {
  return (
    <div style={{ background: accent ? '#dbeafe' : '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 12 }}>
      <div style={{ color: '#64748b', fontSize: 11.5, textTransform: 'uppercase', fontWeight: 900, letterSpacing: 0.4 }}>{label}</div>
      <strong style={{ fontSize: 19, color: good ? '#15803d' : '#12385b' }}>{value}</strong>
    </div>
  )
}

function Toggle({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{ padding: '9px 14px', borderRadius: 10, border: '1px solid', borderColor: active ? '#1f5f8f' : '#cbd5e1', background: active ? '#1f5f8f' : 'white', color: active ? 'white' : '#334155', fontWeight: 800, cursor: 'pointer', fontSize: 14 }}
    >
      {children}
    </button>
  )
}

function Empty() {
  return <p style={{ color: '#64748b', padding: 12 }}>No matching line items.</p>
}
