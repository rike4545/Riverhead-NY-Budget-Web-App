'use client'

import { useMemo, useState } from 'react'
import { useFetchJson } from './useFetchJson'

const base = '/rike4545-riverhead-budget-live'
const LINES_URL = `${base}/data/budget-2027-lines.json`
const usd = (n: number | null) => n == null ? '—' : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
const card = { background: 'white', border: '1px solid #e2e8f0', borderRadius: 16, padding: 18, boxShadow: '0 14px 34px rgba(15,23,42,.05)' } as const
const sel = { padding: '9px 11px', border: '1px solid #cbd5e1', borderRadius: 9, fontSize: 14, fontWeight: 700 } as const

type Line = {
  fundCode: string; fund: string; dept: string; account: string; name: string
  category: string; v2025: number | null; v2026: number; v2027: number; delta: number; pct: number | null; rate: number
}
type Sort = 'delta' | 'v2027' | 'pct' | 'name'

export default function Budget2027Table() {
  const { data, error } = useFetchJson<{ lines: Line[] }>(LINES_URL)
  const lines = useMemo(() => data?.lines ?? [], [data])
  const [q, setQ] = useState('')
  const [fund, setFund] = useState('all')
  const [cat, setCat] = useState('all')
  const [sort, setSort] = useState<Sort>('delta')
  const [limit, setLimit] = useState(60)
  const query = q.trim().toLowerCase()

  const funds = useMemo(() => {
    const m = new Map<string, string>()
    lines.forEach((l) => m.set(l.fundCode, l.fund))
    return Array.from(m, ([code, name]) => ({ code, name })).sort((a, b) => a.name.localeCompare(b.name))
  }, [lines])
  const cats = useMemo(() => Array.from(new Set(lines.map((l) => l.category))).sort(), [lines])

  const rows = useMemo(() => {
    const r = lines.filter((l) => {
      if (fund !== 'all' && l.fundCode !== fund) return false
      if (cat !== 'all' && l.category !== cat) return false
      if (query && !(`${l.name} ${l.dept} ${l.account}`.toLowerCase().includes(query))) return false
      return true
    })
    r.sort((a, b) => {
      if (sort === 'name') return a.name.localeCompare(b.name)
      if (sort === 'delta') return Math.abs(b.delta) - Math.abs(a.delta)
      return (b[sort] as number) - (a[sort] as number)
    })
    return r
  }, [lines, fund, cat, query, sort])

  const totals = useMemo(() => ({
    v2026: rows.reduce((s, r) => s + r.v2026, 0),
    v2027: rows.reduce((s, r) => s + r.v2027, 0),
  }), [rows])

  if (error) return <section style={card}>Could not load the line-item projection — reload to try again.</section>
  if (!data) return <section style={card}>Loading the line-by-line projection…</section>

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <section style={{ ...card, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <select value={fund} onChange={(e) => { setFund(e.target.value); setLimit(60) }} style={sel}>
          <option value="all">All funds</option>
          {funds.map((f) => <option key={f.code} value={f.code}>{f.name}</option>)}
        </select>
        <select value={cat} onChange={(e) => { setCat(e.target.value); setLimit(60) }} style={sel}>
          <option value="all">All categories</option>
          {cats.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} style={sel}>
          <option value="delta">Sort: Biggest change</option>
          <option value="v2027">Sort: 2027 predicted</option>
          <option value="pct">Sort: % change</option>
          <option value="name">Sort: Name (A–Z)</option>
        </select>
        <input value={q} onChange={(e) => { setQ(e.target.value); setLimit(60) }} placeholder="Search a line item, department, or account…"
          style={{ flex: 1, minWidth: 220, padding: '10px 13px', border: '1px solid #cbd5e1', borderRadius: 9, fontSize: 15 }} />
      </section>

      <section style={card}>
        <div style={{ color: '#475569', fontWeight: 700, marginBottom: 10, fontSize: 14 }}>
          {rows.length.toLocaleString()} line items · {usd(totals.v2026)} → <span style={{ color: '#12385b' }}>{usd(totals.v2027)}</span> predicted
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ textAlign: 'left', color: '#64748b', borderBottom: '2px solid #e2e8f0' }}>
                <th style={th}>Line item</th>
                <th style={th}>Fund / Dept</th>
                <th style={th}>Category</th>
                <th style={{ ...th, textAlign: 'right' }}>2026 adopted</th>
                <th style={{ ...th, textAlign: 'right' }}>2027 predicted</th>
                <th style={{ ...th, textAlign: 'right' }}>Change</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, limit).map((r, i) => (
                <tr key={`${r.account}-${i}`} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ ...td, fontWeight: 700, color: '#12385b' }}>{r.name}</td>
                  <td style={{ ...td, color: '#64748b' }}>{r.fund} · {r.dept}</td>
                  <td style={td}><span style={{ background: '#eef2f7', color: '#475569', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999 }}>{r.category}</span></td>
                  <td style={{ ...td, textAlign: 'right', color: '#64748b' }}>{usd(r.v2026)}</td>
                  <td style={{ ...td, textAlign: 'right', fontWeight: 700 }}>{usd(r.v2027)}</td>
                  <td style={{ ...td, textAlign: 'right', fontWeight: 700, color: r.delta > 0 ? 'var(--inc)' : r.delta < 0 ? 'var(--dec)' : '#94a3b8', whiteSpace: 'nowrap' }}>
                    {r.delta >= 0 ? '+' : '−'}{usd(Math.abs(r.delta))}{r.pct != null && <span style={{ fontWeight: 500, color: '#94a3b8' }}> ({r.pct > 0 ? '+' : ''}{r.pct}%)</span>}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td style={td} colSpan={6}>No matching line items.</td></tr>}
            </tbody>
          </table>
        </div>
        {limit < rows.length && (
          <div style={{ textAlign: 'center', marginTop: 14 }}>
            <button onClick={() => setLimit((l) => l + 120)} style={{ padding: '10px 18px', borderRadius: 10, border: '1px solid #1f5f8f', background: '#1f5f8f', color: 'white', fontWeight: 800, cursor: 'pointer' }}>Show more</button>
          </div>
        )}
      </section>
    </div>
  )
}

const th = { padding: '8px 9px' } as const
const td = { padding: '7px 9px' } as const
