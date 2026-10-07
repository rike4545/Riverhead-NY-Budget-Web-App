'use client'

import { useMemo, useState } from 'react'
import Sparkline from './Sparkline'
import { budgetHistory, budgetColumns, proposalColumn, columnTotal, columnOperating } from '../lib/budget-history'

const usd = (n: number | null | undefined) =>
  n == null ? '—' : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
const pct = (n: number | null | undefined) => (n == null ? '—' : `${n > 0 ? '+' : ''}${n.toFixed(1)}%`)
const card = { background: 'var(--rbl-surface)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 16, padding: 18 } as const
const base = process.env.NEXT_PUBLIC_BASE_PATH || ''

export default function CompareExplorer() {
  const years = budgetHistory.years
  const firstYear = years[0]
  const lastYear = years[years.length - 1]
  const lastAdopted = budgetColumns.find((c) => c.key === String(lastYear))!

  // In budget season the question is the proposal, so it is the default comparison.
  const [fromKey, setFromKey] = useState(proposalColumn ? lastAdopted.key : String(firstYear))
  const [toKey, setToKey] = useState(proposalColumn ? proposalColumn.key : String(lastYear))
  const [sortKey, setSortKey] = useState<'change' | 'pct' | 'size'>('size')
  const from = budgetColumns.find((c) => c.key === fromKey) ?? lastAdopted
  const to = budgetColumns.find((c) => c.key === toKey) ?? lastAdopted
  const proposalShown = from.stage !== 'adopted' || to.stage !== 'adopted'

  const rows = useMemo(() => {
    return budgetHistory.funds
      .map((f) => {
        const a = from.appropriations[f.code] ?? null
        const b = to.appropriations[f.code] ?? null
        const change = a != null && b != null ? b - a : null
        const changePct = a && b != null ? ((b - a) / a) * 100 : null
        return { ...f, from: a, to: b, change, changePct, series: years.map((y) => f.years[String(y)]?.appropriations ?? null) }
      })
      .sort((x, y) => {
        if (sortKey === 'change') return (y.change ?? -Infinity) - (x.change ?? -Infinity)
        if (sortKey === 'pct') return (y.changePct ?? -Infinity) - (x.changePct ?? -Infinity)
        return (y.to ?? 0) - (x.to ?? 0)
      })
  }, [from, to, sortKey, years])

  const townFrom = columnTotal(from)
  const townTo = columnTotal(to)
  const townChangePct = townFrom ? ((townTo - townFrom) / townFrom) * 100 : null
  const opFrom = columnOperating(from)
  const opTo = columnOperating(to)

  const drivers = useMemo(() => {
    const comparable = rows.filter((r) => r.change != null && r.change !== 0)
    return {
      increases: [...comparable].filter((r) => (r.change ?? 0) > 0).sort((a, b) => (b.change ?? 0) - (a.change ?? 0)).slice(0, 3),
      decreases: [...comparable].filter((r) => (r.change ?? 0) < 0).sort((a, b) => (a.change ?? 0) - (b.change ?? 0)).slice(0, 3),
    }
  }, [rows])

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr)', gap: 16 }}>
      <section style={{ ...card, display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <label style={{ fontWeight: 600, color: 'var(--rbl-text-strong)' }}>
          Compare&nbsp;
          <select value={fromKey} onChange={(e) => setFromKey(e.target.value)} style={selStyle}>
            {budgetColumns.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
          </select>
          &nbsp;to&nbsp;
          <select value={toKey} onChange={(e) => setToKey(e.target.value)} style={selStyle}>
            {budgetColumns.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
          </select>
        </label>
        <label style={{ fontWeight: 600, color: 'var(--rbl-text-strong)' }}>
          Sort by&nbsp;
          <select value={sortKey} onChange={(e) => setSortKey(e.target.value as typeof sortKey)} style={selStyle}>
            <option value="size">Largest fund</option>
            <option value="change">Biggest $ change</option>
            <option value="pct">Biggest % change</option>
          </select>
        </label>
      </section>

      {proposalShown && proposalColumn && (
        <section style={{ background: 'var(--rbl-warn-bg)', border: '1px solid var(--rbl-warn-border)', borderRadius: 14, padding: '14px 18px', color: 'var(--rbl-note-text)', fontSize: 15.5, lineHeight: 1.55 }}>
          <strong>{proposalColumn.label} is a proposal, not a budget.</strong> It is the budget officer’s recommendation. The Town Board can change it,
          and must adopt the {proposalColumn.year} budget by November 20 (Town Law §109). Its figures come from the Summary page of the{' '}
          <a href={proposalColumn.source.url} target="_blank" rel="noreferrer" style={{ color: 'var(--rbl-link)', fontWeight: 600 }}>{proposalColumn.source.title}</a>.
        </section>
      )}

      <section style={{ ...card, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: 12 }}>
        <Stat label={`All funds, ${from.label}`} value={usd(townFrom)} />
        <Stat label={`All funds, ${to.label}`} value={usd(townTo)} accent />
        <Stat label="Change" value={usd(townTo - townFrom)} />
        <Stat label="Percent change" value={pct(townChangePct)} good={!!townChangePct && townChangePct < 0} />
      </section>

      {opFrom != null && opTo != null && from.key !== to.key && (
        <p style={{ margin: 0, color: 'var(--rbl-text-body)', fontSize: 15.5, lineHeight: 1.6 }}>
          <strong>Without the funds the others pay for</strong> (debt service, workers’ compensation and risk retention, whose only revenue is transfers
          from the other funds), appropriations go from {usd(opFrom)} to {usd(opTo)}, a change of {usd(opTo - opFrom)} ({pct(((opTo - opFrom) / opFrom) * 100)}).
          {' '}Adding those three funds counts the same dollars twice, so a fall in debt payments can look like a spending cut.
        </p>
      )}

      {from.key !== to.key && (drivers.increases.length > 0 || drivers.decreases.length > 0) && (
        <section style={card}>
          <div style={{ marginBottom: 12 }}>
            <h2 style={{ margin: '3px 0 5px', fontSize: 21 }}>The biggest fund-level increases and decreases</h2>
            <p style={{ margin: 0, color: 'var(--rbl-text-muted)', fontSize: 14.5, lineHeight: 1.5 }}>
              These are the largest changes in appropriations between the two budgets. They explain where the budget moved; they do not by themselves explain why a department changed.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(250px,100%),1fr))', gap: 12 }}>
            <DriverList title="Largest increases" rows={drivers.increases} />
            <DriverList title="Largest decreases" rows={drivers.decreases} />
          </div>
        </section>
      )}

      <section style={card}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14.5 }}>
            <thead>
              <tr style={{ textAlign: 'left', color: 'var(--rbl-text-muted)', borderBottom: '2px solid var(--rbl-border-subtle)' }}>
                <th style={th}>Fund</th>
                <th style={{ ...th, textAlign: 'right' }}>{from.label}</th>
                <th style={{ ...th, textAlign: 'right' }}>{to.label}</th>
                <th style={{ ...th, textAlign: 'right' }}>Change</th>
                <th style={{ ...th, textAlign: 'right' }}>%</th>
                <th style={{ ...th, textAlign: 'center' }}>{firstYear}–{lastYear} adopted</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.code} style={{ borderBottom: '1px solid var(--rbl-border-subtle)' }}>
                  <td style={td}>
                    <a href={`${base}/funds/${r.code}/`} style={{ color: 'var(--rbl-title)', fontWeight: 600, textDecoration: 'none' }}>
                      <span style={{ color: 'var(--rbl-text-muted)', fontWeight: 600, fontSize: 13 }}>{r.code}</span> {r.name}
                    </a>
                  </td>
                  <td style={{ ...td, textAlign: 'right', color: 'var(--rbl-text-muted)' }}>{usd(r.from)}</td>
                  <td style={{ ...td, textAlign: 'right', fontWeight: 600 }}>{usd(r.to)}</td>
                  <td style={{ ...td, textAlign: 'right', color: changeColor(r.change), fontWeight: 600 }}>{r.change == null ? '—' : usd(r.change)}</td>
                  <td style={{ ...td, textAlign: 'right', color: changeColor(r.change), fontWeight: 600 }}>{pct(r.changePct)}</td>
                  <td style={{ ...td, textAlign: 'center' }}>
                    <div style={{ display: 'inline-block' }}><Sparkline values={r.series} /></div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <p style={{ color: 'var(--rbl-text-muted)', fontSize: 14, lineHeight: 1.55 }}>
        Source: {budgetHistory.source.title}{proposalColumn ? `, and the Summary page of the ${proposalColumn.source.title}` : ''}. {budgetHistory.note} Appropriations reconcile to the official town total.
        The trend line shows adopted budgets only.
        Tax-levy history is intentionally omitted here because the Summary-page levy column is not column-stable across
        funds; see each <a href={`${base}/funds/`} style={{ color: 'var(--rbl-link)', fontWeight: 600 }}>fund page</a> for current-year levy detail.
      </p>
    </div>
  )
}

function DriverList({ title, rows }: { title: string; rows: Array<{ code: string; name: string; change: number | null }> }) {
  return (
    <div style={{ background: 'var(--rbl-surface-2)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 12, padding: 14 }}>
      <div style={{ fontWeight: 700, marginBottom: 8 }}>{title}</div>
      {rows.length === 0 ? <div style={{ color: 'var(--rbl-text-muted)', fontSize: 13 }}>None in the selected comparison.</div> : rows.map((r) => (
        <div key={r.code} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '8px 0', borderTop: '1px solid var(--rbl-border-subtle)' }}>
          <a href={`${base}/funds/${r.code}/`} style={{ color: 'var(--rbl-title)', fontWeight: 600, textDecoration: 'none', fontSize: 15 }}>
            {r.name}
          </a>
          <strong style={{ whiteSpace: 'nowrap', color: changeColor(r.change) }}>{usd(r.change)}</strong>
        </div>
      ))}
    </div>
  )
}

const selStyle = { padding: '8px 10px', border: '1px solid var(--rbl-border-strong)', borderRadius: 8, fontSize: 15, fontWeight: 600, background: 'var(--rbl-surface)', color: 'var(--rbl-text)' } as const
const th = { padding: '8px 10px' } as const
const td = { padding: '8px 10px' } as const

function changeColor(n: number | null) {
  if (n == null) return 'var(--rbl-text-muted)'
  return n > 0 ? 'var(--inc)' : n < 0 ? 'var(--dec)' : 'var(--rbl-text-muted)'
}

function Stat({ label, value, accent, good }: { label: string; value: string; accent?: boolean; good?: boolean }) {
  return (
    <div style={{ background: accent ? 'var(--rbl-info-bg)' : 'var(--rbl-surface-2)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 12, padding: 12 }}>
      <div style={{ color: 'var(--rbl-text-muted)', fontSize: 13.5, fontWeight: 700 }}>{label}</div>
      <strong style={{ fontSize: 19, color: good ? 'var(--rbl-success)' : 'var(--rbl-title)' }}>{value}</strong>
    </div>
  )
}
