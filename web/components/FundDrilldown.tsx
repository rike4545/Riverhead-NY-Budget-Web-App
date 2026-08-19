'use client'

import { useMemo, useState } from 'react'
import type { FundDetail, SubDepartment } from '../lib/subaccounts'
import Sparkline from './Sparkline'
import { ColumnGuide } from './PlainCallout'
import { appropriationsByYear } from '../lib/budget-history'

const usd = (n: number | null | undefined) =>
  n == null ? '—' : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

const card = { background: 'var(--rbl-surface)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 16, padding: 18, boxShadow: '0 14px 34px var(--rbl-shadow)' } as const

const CATEGORY_COLOR: Record<string, string> = {
  'Personal Services': 'var(--rbl-series-blue)',
  'Employee Benefits': 'var(--rbl-series-indigo)',
  Contractual: 'var(--rbl-series-gold)',
  'Equipment & Capital Outlay': 'var(--rbl-series-teal)',
  'Interfund / Transfers': 'var(--rbl-series-violet)',
  Other: 'var(--rbl-series-slate)',
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
            <div style={{ color: 'var(--rbl-text-muted)', fontSize: 12, textTransform: 'uppercase', fontWeight: 900, letterSpacing: 0.4 }}>
              Appropriations history {history[0].year}–{history[history.length - 1].year}
            </div>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 8 }}>
              {history.map((p) => (
                <span key={p.year} style={{ fontSize: 13, color: 'var(--rbl-text-strong)', fontWeight: 700 }}>
                  <span style={{ color: 'var(--rbl-text-muted)' }}>{p.year}</span> {usd(p.value)}
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
          style={{ flex: 1, minWidth: 240, padding: '11px 14px', border: '1px solid var(--rbl-border-strong)', borderRadius: 10, fontSize: 15 }}
        />
        {matchCount != null && (
          <span style={{ color: 'var(--rbl-text-body)', fontWeight: 700, fontSize: 13 }}>{matchCount} matching line items</span>
        )}
      </section>

      <ColumnGuide items={[
        { term: 'Account', plain: 'The Town’s internal code for a single spending line.' },
        { term: '2024 / 2025 / 2026', plain: 'What was budgeted for that spending line in each of those years.' },
        { term: '25→26 Δ', plain: 'The dollar change from the 2025 budget to the 2026 budget (red = up, green = down).' },
        { term: '’20–’26', plain: 'A mini trend line showing the budgeted amount each year from 2020 through 2026.' },
      ]} />

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
            rows={filteredRevenues.map((r) => ({ account: r.account, name: r.name, y2024: null, y2025: r.adopted2025, y2026: r.adopted2026, trend: [r.adopted2025, r.adopted2026] }))}
          />
          {filteredRevenues.length === 0 && <Empty />}
        </section>
      )}

      <p style={{ color: 'var(--rbl-text-muted)', fontSize: 13, lineHeight: 1.5 }}>
        Source: {fund.source.title}. Account-level detail extracted programmatically and reconciled to the official
        Summary page. The 2026 column is the adopted figure; the 2025 column is the prior-year adopted budget for the
        same account. Verify against the{' '}
        <a href={fund.source.url} target="_blank" rel="noreferrer" style={{ color: 'var(--rbl-accent)', fontWeight: 700 }}>
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
          <span style={{ color: 'var(--rbl-text-muted)', fontWeight: 800, fontSize: 12 }}>#{dept.code}</span>{' '}
          <strong style={{ fontSize: 17 }}>{dept.name}</strong>
          <div style={{ color: 'var(--rbl-text-muted)', fontSize: 12.5 }}>
            {dept.lineItemCount} line items · {pct.toFixed(1)}% of fund
            {changePct != null && (
              <span style={{ color: dept.change >= 0 ? 'var(--inc)' : 'var(--dec)', fontWeight: 800 }}>
                {' '}· {dept.change >= 0 ? '▲' : '▼'} {Math.abs(changePct).toFixed(1)}% vs 2025
              </span>
            )}
          </div>
        </div>
        <strong style={{ fontSize: 18, color: 'var(--rbl-title)' }}>{usd(dept.adopted2026)}</strong>
      </summary>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '12px 0' }}>
        {dept.categoryTotals.map((c) => (
          <span key={c.category} style={{ background: 'var(--rbl-surface-3)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 999, padding: '5px 11px', fontSize: 12.5, fontWeight: 700 }}>
            <span style={{ display: 'inline-block', width: 9, height: 9, borderRadius: 9, background: CATEGORY_COLOR[c.category] ?? 'var(--rbl-series-slate)', marginRight: 6 }} />
            {c.category}: {usd(c.adopted2026)}
          </span>
        ))}
      </div>

      <LineTable
        rows={dept.lineItems.map((i) => ({ account: i.account, name: i.name, category: i.category, y2024: i.adopted2024, y2025: i.adopted2025, y2026: i.adopted2026, trend: i.history.map((h) => h.value) }))}
      />
    </details>
  )
}

type Row = { account: string; name: string; category?: string; y2024: number | null; y2025: number | null; y2026: number | null; trend: (number | null)[] }

function LineTable({ rows }: { rows: Row[] }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
        <thead>
          <tr style={{ textAlign: 'left', color: 'var(--rbl-text-muted)', borderBottom: '2px solid var(--rbl-border-subtle)' }}>
            <th style={{ padding: '7px 8px' }}>Account</th>
            <th style={{ padding: '7px 8px' }}>Description</th>
            <th style={{ padding: '7px 8px', textAlign: 'right' }}>2024</th>
            <th style={{ padding: '7px 8px', textAlign: 'right' }}>2025</th>
            <th style={{ padding: '7px 8px', textAlign: 'right' }}>2026</th>
            <th style={{ padding: '7px 8px', textAlign: 'right' }}>25→26 Δ</th>
            <th style={{ padding: '7px 8px', textAlign: 'center' }} title="Adopted appropriations 2020–2026">’20–’26</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const change = (r.y2026 ?? 0) - (r.y2025 ?? 0)
            return (
              <tr key={r.account} style={{ borderBottom: '1px solid var(--rbl-border-subtle)' }}>
                <td style={{ padding: '7px 8px', fontFamily: 'monospace', fontSize: 11.5, color: 'var(--rbl-text-body)', whiteSpace: 'nowrap' }}>{r.account}</td>
                <td style={{ padding: '7px 8px' }}>{r.name}</td>
                <td style={{ padding: '7px 8px', textAlign: 'right', color: 'var(--rbl-text-muted)' }}>{usd(r.y2024)}</td>
                <td style={{ padding: '7px 8px', textAlign: 'right', color: 'var(--rbl-text-muted)' }}>{usd(r.y2025)}</td>
                <td style={{ padding: '7px 8px', textAlign: 'right', fontWeight: 700 }}>{usd(r.y2026)}</td>
                <td style={{ padding: '7px 8px', textAlign: 'right', color: change > 0 ? 'var(--inc)' : change < 0 ? 'var(--dec)' : 'var(--rbl-text-muted)', fontWeight: 700 }}>
                  {change === 0 ? '—' : `${change > 0 ? '+' : '−'}${usd(Math.abs(change))}`}
                </td>
                <td style={{ padding: '4px 8px', textAlign: 'center' }}>
                  <div style={{ display: 'inline-block' }}><Sparkline values={r.trend} width={84} height={22} /></div>
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
    <div style={{ background: accent ? 'var(--rbl-info-bg)' : 'var(--rbl-surface-2)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 12, padding: 12 }}>
      <div style={{ color: 'var(--rbl-text-muted)', fontSize: 11.5, textTransform: 'uppercase', fontWeight: 900, letterSpacing: 0.4 }}>{label}</div>
      <strong style={{ fontSize: 19, color: good ? 'var(--rbl-success)' : 'var(--rbl-title)' }}>{value}</strong>
    </div>
  )
}

function Toggle({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{ padding: '9px 14px', borderRadius: 10, border: '1px solid', borderColor: active ? 'var(--rbl-accent-border)' : 'var(--rbl-border-strong)', background: active ? 'var(--rbl-fill-accent)' : 'var(--rbl-surface)', color: active ? 'white' : 'var(--rbl-text-strong)', fontWeight: 800, cursor: 'pointer', fontSize: 14 }}
    >
      {children}
    </button>
  )
}

function Empty() {
  return <p style={{ color: 'var(--rbl-text-muted)', padding: 12 }}>No matching line items.</p>
}
