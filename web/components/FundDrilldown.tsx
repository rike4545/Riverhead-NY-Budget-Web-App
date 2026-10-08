'use client'

import { useMemo, useState } from 'react'
import type { FundDetail, SubDepartment } from '../lib/subaccounts'
import type { FundYear } from '../lib/funds-2027'
import Sparkline from './Sparkline'
import { ColumnGuide } from './PlainCallout'
import { appropriationsByYear } from '../lib/budget-history'

const usd = (n: number | null | undefined) =>
  n == null ? '—' : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

const card = { background: 'var(--rbl-surface)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 16, padding: 18 } as const

const CATEGORY_COLOR: Record<string, string> = {
  'Personal Services': 'var(--rbl-series-blue)',
  'Employee Benefits': 'var(--rbl-series-indigo)',
  Contractual: 'var(--rbl-series-gold)',
  'Equipment & Capital Outlay': 'var(--rbl-series-teal)',
  'Interfund / Transfers': 'var(--rbl-series-violet)',
  Other: 'var(--rbl-series-slate)',
}

const PROPOSED_YEAR = 2027
/** "up 4.2%", "down 3.2%", in words rather than an arrow glyph. */
function changeWords(from: number, to: number): string {
  if (from === to) return 'no change'
  if (!from) return 'new'
  const pct = ((to - from) / from) * 100
  return `${to > from ? 'up' : 'down'} ${Math.abs(pct) < 0.05 ? '<0.1' : Math.abs(pct).toFixed(1)}%`
}
const changeColor = (from: number, to: number) => (to > from ? 'var(--inc)' : to < from ? 'var(--dec)' : 'var(--rbl-text-muted)')

type Props = {
  fund: FundDetail
  /** The fund's totals in the 2027 Tentative's Summary, when it is out. */
  proposed?: FundYear | null
  /** The 2027 Budget Supplement, when its lines add up to the Tentative; it gives each line's proposed figure. */
  lineSource?: { title: string; url: string } | null
}

export default function FundDrilldown({ fund, proposed = null, lineSource = null }: Props) {
  const withProposed = !!lineSource
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
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr)', gap: 16 }}>
      <section style={{ ...card, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: 12 }}>
        <Stat label="Appropriations, 2026" value={usd(fund.expenditureTotal2026)} accent />
        {proposed && (
          <Stat
            label={`Appropriations, ${PROPOSED_YEAR} proposed`}
            value={usd(proposed.appropriations)}
            note={<span style={{ color: changeColor(fund.expenditureTotal2026, proposed.appropriations), fontWeight: 600 }}>{changeWords(fund.expenditureTotal2026, proposed.appropriations)} from 2026</span>}
          />
        )}
        <Stat label="Estimated revenues, 2026" value={usd(fund.revenueTotal2026)} />
        <Stat label="Departments and lines, 2026" value={`${fund.departmentCount} and ${fund.lineItemCount}`} />
        <Stat
          label="Reconciliation"
          value={fund.reconciled ? 'Adds up to the Summary' : `Off by ${usd(Math.abs(fund.reconciliationVariance2026 ?? 0))}`}
          good={fund.reconciled}
        />
      </section>

      {history.length >= 2 && (
        <section style={{ ...card, display: 'flex', gap: 18, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between' }}>
          <div>
            <div style={{ color: 'var(--rbl-text-muted)', fontSize: 13.5, fontWeight: 700 }}>
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
          <span style={{ color: 'var(--rbl-text-body)', fontWeight: 600, fontSize: 13.5 }}>{matchCount} matching {matchCount === 1 ? 'line' : 'lines'}</span>
        )}
      </section>

      <ColumnGuide items={withProposed ? [
        { term: 'Account', plain: 'The Town’s internal code for a single spending line.' },
        { term: '2025 / 2026', plain: 'What the adopted budget set for that line in each year.' },
        { term: `${PROPOSED_YEAR} proposed`, plain: `What the ${PROPOSED_YEAR} Tentative Budget proposes for the line, from the ${PROPOSED_YEAR} Budget Supplement. The Board can change it before it adopts a budget by November 20.` },
        { term: 'Change', plain: `The dollar change from the 2026 budget to the ${PROPOSED_YEAR} proposal. The colour follows your setting for an increase.` },
        { term: 'Trend', plain: 'A small line showing the adopted amount each year from 2020 through 2026.' },
      ] : [
        { term: 'Account', plain: 'The Town’s internal code for a single spending line.' },
        { term: '2024 / 2025 / 2026', plain: 'What was budgeted for that spending line in each of those years.' },
        { term: 'Change', plain: 'The dollar change from the 2025 budget to the 2026 budget.' },
        { term: 'Trend', plain: 'A small line showing the budgeted amount each year from 2020 through 2026.' },
      ]} />

      {view === 'expenditures' ? (
        <section style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr)', gap: 12 }}>
          {filteredDepts.map((dept) => (
            <DepartmentCard key={dept.code} dept={dept} expanded={!!q} fundExp={fund.expenditureTotal2026} withProposed={withProposed} />
          ))}
          {filteredDepts.length === 0 && <Empty />}
        </section>
      ) : (
        <section style={card}>
          <h3 style={{ marginTop: 0 }}>Estimated revenues by source</h3>
          <LineTable
            withProposed={withProposed}
            rows={filteredRevenues.map((r) => ({ account: r.account, name: r.name, y2024: null, y2025: r.adopted2025, y2026: r.adopted2026, y2027: r.tentative2027, isNew: r.new2027, trend: [r.adopted2025, r.adopted2026] }))}
          />
          {filteredRevenues.length === 0 && <Empty />}
        </section>
      )}

      <p style={{ color: 'var(--rbl-text-muted)', fontSize: 13, lineHeight: 1.5 }}>
        Source: {fund.source.title}. Account-level detail extracted programmatically and reconciled to the official
        Summary page. The 2026 column is the adopted figure; the 2025 column is the prior-year adopted budget for the
        same account.{lineSource ? (
          <>
            {' '}The {PROPOSED_YEAR} column is from the{' '}
            <a href={lineSource.url} target="_blank" rel="noreferrer" style={{ color: 'var(--rbl-link)', fontWeight: 600 }}>{lineSource.title}</a>,
            whose lines add up to the {PROPOSED_YEAR} Tentative to the dollar. Lines marked new were not in the 2026 budget.
          </>
        ) : null}{' '}
        Verify against the{' '}
        <a href={fund.source.url} target="_blank" rel="noreferrer" style={{ color: 'var(--rbl-link)', fontWeight: 600 }}>
          official document
        </a>{' '}
        before relying on these numbers.
      </p>
    </div>
  )
}

function DepartmentCard({ dept, expanded, fundExp, withProposed }: { dept: SubDepartment; expanded: boolean; fundExp: number; withProposed: boolean }) {
  const pct = fundExp > 0 ? (dept.adopted2026 / fundExp) * 100 : 0
  const proposed = withProposed ? dept.tentative2027 ?? null : null
  return (
    <details open={expanded} style={card}>
      <summary style={{ cursor: 'pointer', listStyle: 'none', display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <div>
          <strong style={{ fontSize: 17, color: 'var(--rbl-title)' }}>{dept.name}</strong>{' '}
          <span style={{ color: 'var(--rbl-text-muted)', fontWeight: 600, fontSize: 13 }}>{dept.code}</span>
          <div style={{ color: 'var(--rbl-text-muted)', fontSize: 13.5 }}>
            {dept.lineItemCount} {dept.lineItemCount === 1 ? 'line' : 'lines'} · {pct.toFixed(1)}% of the fund in 2026
            {!withProposed && dept.adopted2025 > 0 && (
              <span style={{ color: changeColor(dept.adopted2025, dept.adopted2026), fontWeight: 600 }}> · {changeWords(dept.adopted2025, dept.adopted2026)} from 2025</span>
            )}
          </div>
        </div>
        <div style={{ textAlign: 'right', marginLeft: 'auto' }}>
          <strong style={{ fontSize: 18, color: 'var(--rbl-title)' }}>{usd(dept.adopted2026)}</strong> <span style={{ color: 'var(--rbl-text-muted)', fontSize: 13.5 }}>2026</span>
          {proposed != null && (
            <div style={{ fontSize: 13.5, color: 'var(--rbl-text-body)' }}>
              {usd(proposed)} {PROPOSED_YEAR} proposed{' '}
              <span style={{ color: changeColor(dept.adopted2026, proposed), fontWeight: 600 }}>({changeWords(dept.adopted2026, proposed)})</span>
            </div>
          )}
        </div>
      </summary>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '12px 0' }}>
        {dept.categoryTotals.map((c) => (
          <span key={c.category} style={{ background: 'var(--rbl-surface-3)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 999, padding: '5px 11px', fontSize: 13, fontWeight: 600 }}>
            <span style={{ display: 'inline-block', width: 9, height: 9, borderRadius: 9, background: CATEGORY_COLOR[c.category] ?? 'var(--rbl-series-slate)', marginRight: 6 }} />
            {c.category}: {usd(c.adopted2026)}
          </span>
        ))}
      </div>

      <LineTable
        withProposed={withProposed}
        rows={dept.lineItems.map((i) => ({ account: i.account, name: i.name, category: i.category, y2024: i.adopted2024, y2025: i.adopted2025, y2026: i.adopted2026, y2027: i.tentative2027, isNew: i.new2027, trend: i.history.map((h) => h.value) }))}
      />
    </details>
  )
}

type Row = { account: string; name: string; category?: string; y2024: number | null; y2025: number | null; y2026: number | null; y2027?: number | null; isNew?: boolean; trend: (number | null)[] }

function LineTable({ rows, withProposed = false }: { rows: Row[]; withProposed?: boolean }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
        <thead>
          <tr style={{ textAlign: 'left', color: 'var(--rbl-text-muted)', borderBottom: '1px solid var(--rbl-border)' }}>
            <th style={{ padding: '7px 8px' }}>Account</th>
            <th style={{ padding: '7px 8px' }}>Description</th>
            {!withProposed && <th style={{ padding: '7px 8px', textAlign: 'right' }}>2024</th>}
            <th style={{ padding: '7px 8px', textAlign: 'right' }}>2025</th>
            <th style={{ padding: '7px 8px', textAlign: 'right' }}>2026</th>
            {withProposed && <th style={{ padding: '7px 8px', textAlign: 'right' }}>{PROPOSED_YEAR} proposed</th>}
            <th style={{ padding: '7px 8px', textAlign: 'right' }}>{withProposed ? 'Change from 2026' : 'Change from 2025'}</th>
            <th style={{ padding: '7px 8px', textAlign: 'center' }} title="Adopted appropriations 2020–2026">Trend</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const change = withProposed ? (r.y2027 ?? 0) - (r.y2026 ?? 0) : (r.y2026 ?? 0) - (r.y2025 ?? 0)
            return (
              <tr key={r.account} style={{ borderBottom: '1px solid var(--rbl-border-subtle)' }}>
                <td style={{ padding: '7px 8px', fontFamily: 'monospace', fontSize: 11.5, color: 'var(--rbl-text-body)', whiteSpace: 'nowrap' }}>{r.account}</td>
                <td style={{ padding: '7px 8px' }}>{r.name}{r.isNew && <span style={{ marginLeft: 6, background: 'var(--rbl-info-bg)', color: 'var(--rbl-info-text)', fontSize: 12, fontWeight: 600, padding: '1px 7px', borderRadius: 999, whiteSpace: 'nowrap' }}>New in {PROPOSED_YEAR}</span>}</td>
                {!withProposed && <td style={{ padding: '7px 8px', textAlign: 'right', color: 'var(--rbl-text-muted)' }}>{usd(r.y2024)}</td>}
                <td style={{ padding: '7px 8px', textAlign: 'right', color: 'var(--rbl-text-muted)' }}>{usd(r.y2025)}</td>
                <td style={{ padding: '7px 8px', textAlign: 'right', fontWeight: withProposed ? 400 : 700 }}>{usd(r.y2026)}</td>
                {withProposed && <td style={{ padding: '7px 8px', textAlign: 'right', fontWeight: 700 }}>{usd(r.y2027)}</td>}
                <td style={{ padding: '7px 8px', textAlign: 'right', color: change > 0 ? 'var(--inc)' : change < 0 ? 'var(--dec)' : 'var(--rbl-text-muted)', fontWeight: 600, whiteSpace: 'nowrap' }}>
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

function Stat({ label, value, accent, good, note }: { label: string; value: string; accent?: boolean; good?: boolean; note?: React.ReactNode }) {
  return (
    <div style={{ background: accent ? 'var(--rbl-info-bg)' : 'var(--rbl-surface-2)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 12, padding: 12 }}>
      <div style={{ color: 'var(--rbl-text-muted)', fontSize: 13.5, fontWeight: 600 }}>{label}</div>
      <strong style={{ fontSize: 19, color: good ? 'var(--rbl-success-strong)' : 'var(--rbl-title)' }}>{value}</strong>
      {note && <div style={{ fontSize: 13.5, marginTop: 2 }}>{note}</div>}
    </div>
  )
}

function Toggle({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      style={{ padding: '9px 14px', borderRadius: 10, border: '1px solid', borderColor: active ? 'var(--rbl-accent-border)' : 'var(--rbl-border-strong)', background: active ? 'var(--rbl-fill-accent)' : 'var(--rbl-surface)', color: active ? 'white' : 'var(--rbl-text-strong)', fontWeight: 600, cursor: 'pointer', fontSize: 14 }}
    >
      {children}
    </button>
  )
}

function Empty() {
  return <p style={{ color: 'var(--rbl-text-muted)', padding: 12 }}>No matching line items.</p>
}
