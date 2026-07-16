'use client'

import { useMemo, useState } from 'react'
import Sparkline from './Sparkline'
import { budgetHistory } from '../lib/budget-history'

const usd = (n: number | null | undefined) =>
  n == null ? '—' : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
const pct = (n: number | null | undefined) => (n == null ? '—' : `${n > 0 ? '+' : ''}${n.toFixed(1)}%`)
const card = { background: 'white', border: '1px solid #e2e8f0', borderRadius: 16, padding: 18, boxShadow: '0 14px 34px rgba(15,23,42,.05)' } as const
const base = process.env.NEXT_PUBLIC_BASE_PATH || ''

export default function CompareExplorer() {
  const years = budgetHistory.years
  const firstYear = years[0]
  const lastYear = years[years.length - 1]

  const [fromYear, setFromYear] = useState(firstYear)
  const [toYear, setToYear] = useState(lastYear)
  const [sortKey, setSortKey] = useState<'change' | 'pct' | 'size'>('size')

  const rows = useMemo(() => {
    return budgetHistory.funds
      .map((f) => {
        const a = f.years[String(fromYear)]?.appropriations ?? null
        const b = f.years[String(toYear)]?.appropriations ?? null
        const change = a != null && b != null ? b - a : null
        const changePct = a && b != null ? ((b - a) / a) * 100 : null
        return { ...f, from: a, to: b, change, changePct, series: years.map((y) => f.years[String(y)]?.appropriations ?? null) }
      })
      .sort((x, y) => {
        if (sortKey === 'change') return (y.change ?? -Infinity) - (x.change ?? -Infinity)
        if (sortKey === 'pct') return (y.changePct ?? -Infinity) - (x.changePct ?? -Infinity)
        return (y.to ?? 0) - (x.to ?? 0)
      })
  }, [fromYear, toYear, sortKey, years])

  const townFrom = budgetHistory.townTotals[String(fromYear)]?.appropriations ?? null
  const townTo = budgetHistory.townTotals[String(toYear)]?.appropriations ?? null
  const townChangePct = townFrom && townTo ? ((townTo - townFrom) / townFrom) * 100 : null

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <section style={{ ...card, display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <label style={{ fontWeight: 800, color: '#334155' }}>
          Compare&nbsp;
          <select value={fromYear} onChange={(e) => setFromYear(Number(e.target.value))} style={selStyle}>
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          &nbsp;to&nbsp;
          <select value={toYear} onChange={(e) => setToYear(Number(e.target.value))} style={selStyle}>
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </label>
        <label style={{ fontWeight: 800, color: '#334155' }}>
          Sort by&nbsp;
          <select value={sortKey} onChange={(e) => setSortKey(e.target.value as typeof sortKey)} style={selStyle}>
            <option value="size">Largest fund</option>
            <option value="change">Biggest $ change</option>
            <option value="pct">Biggest % change</option>
          </select>
        </label>
      </section>

      <section style={{ ...card, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: 12 }}>
        <Stat label={`Town Appropriations ${fromYear}`} value={usd(townFrom)} />
        <Stat label={`Town Appropriations ${toYear}`} value={usd(townTo)} accent />
        <Stat label="Change" value={townTo != null && townFrom != null ? usd(townTo - townFrom) : '—'} />
        <Stat label="Percent Change" value={pct(townChangePct)} good={!!townChangePct && townChangePct < 0} />
      </section>

      <section style={card}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ textAlign: 'left', color: '#64748b', borderBottom: '2px solid #e2e8f0' }}>
                <th style={th}>Fund</th>
                <th style={{ ...th, textAlign: 'right' }}>{fromYear}</th>
                <th style={{ ...th, textAlign: 'right' }}>{toYear}</th>
                <th style={{ ...th, textAlign: 'right' }}>Change</th>
                <th style={{ ...th, textAlign: 'right' }}>%</th>
                <th style={{ ...th, textAlign: 'center' }}>{firstYear}–{lastYear} trend</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.code} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={td}>
                    <a href={`${base}/funds/${r.code}/`} style={{ color: '#12385b', fontWeight: 700, textDecoration: 'none' }}>
                      <span style={{ color: '#94a3b8', fontWeight: 800, fontSize: 12 }}>{r.code}</span> {r.name}
                    </a>
                  </td>
                  <td style={{ ...td, textAlign: 'right', color: '#64748b' }}>{usd(r.from)}</td>
                  <td style={{ ...td, textAlign: 'right', fontWeight: 700 }}>{usd(r.to)}</td>
                  <td style={{ ...td, textAlign: 'right', color: changeColor(r.change), fontWeight: 700 }}>{r.change == null ? '—' : usd(r.change)}</td>
                  <td style={{ ...td, textAlign: 'right', color: changeColor(r.change), fontWeight: 700 }}>{pct(r.changePct)}</td>
                  <td style={{ ...td, textAlign: 'center' }}>
                    <div style={{ display: 'inline-block' }}><Sparkline values={r.series} /></div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <p style={{ color: '#64748b', fontSize: 13, lineHeight: 1.5 }}>
        Source: {budgetHistory.source.title}. {budgetHistory.note} Appropriations reconcile to the official town total.
        Tax-levy history is intentionally omitted here because the Summary-page levy column is not column-stable across
        funds; see each <a href={`${base}/funds/`} style={{ color: '#1f5f8f', fontWeight: 700 }}>fund page</a> for current-year levy detail.
      </p>
    </div>
  )
}

const selStyle = { padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: 14, fontWeight: 700 } as const
const th = { padding: '8px 10px' } as const
const td = { padding: '8px 10px' } as const

function changeColor(n: number | null) {
  if (n == null) return '#94a3b8'
  return n > 0 ? 'var(--inc)' : n < 0 ? 'var(--dec)' : '#94a3b8'
}

function Stat({ label, value, accent, good }: { label: string; value: string; accent?: boolean; good?: boolean }) {
  return (
    <div style={{ background: accent ? '#dbeafe' : '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 12 }}>
      <div style={{ color: '#64748b', fontSize: 11.5, textTransform: 'uppercase', fontWeight: 900, letterSpacing: 0.4 }}>{label}</div>
      <strong style={{ fontSize: 19, color: good ? '#15803d' : '#12385b' }}>{value}</strong>
    </div>
  )
}
