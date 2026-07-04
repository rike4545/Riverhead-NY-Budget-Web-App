'use client'

import { useMemo, useState } from 'react'
import { useFetchJson, LoadingCard } from './useFetchJson'
import { SALARY_COMPARISON_URL, type SalaryComparison, type RaiseRecord } from '../lib/salary'

const usd = (n: number | null | undefined) =>
  n == null ? '—' : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
const card = { background: 'white', border: '1px solid #e2e8f0', borderRadius: 16, padding: 18, boxShadow: '0 14px 34px rgba(15,23,42,.05)' } as const
const sel = { padding: '9px 11px', border: '1px solid #cbd5e1', borderRadius: 9, fontSize: 14, fontWeight: 700 } as const

type SortKey = 'raise' | 'raisePct' | 'annual2026' | 'name'

const EMPTY_SUMMARY = {
  count2026: 0, matched: 0, raised: 0, promotions: 0,
  totalRaise: 0, avgRaise: 0, medianRaisePct: null, topRaises: [],
}

export default function SalaryRaises() {
  // Fetched at runtime (not bundled).
  const { data: comparison, error: loadError } = useFetchJson<SalaryComparison>(SALARY_COMPARISON_URL)
  const summary = comparison?.summary ?? EMPTY_SUMMARY
  const records = useMemo(() => comparison?.records ?? [], [comparison])
  const [q, setQ] = useState('')
  const [only, setOnly] = useState<'all' | 'raised' | 'promotions'>('raised')
  const [sortKey, setSortKey] = useState<SortKey>('raise')
  const [limit, setLimit] = useState(60)
  const yq = q.trim().toLowerCase()

  const rows = useMemo(() => {
    const list = records.filter((r) => {
      if (only === 'raised' && !(r.comparable && (r.raise ?? 0) > 1)) return false
      if (only === 'promotions' && !r.promoted) return false
      if (yq && !(`${r.name} ${r.title2026}`.toLowerCase().includes(yq))) return false
      return true
    })
    list.sort((a, b) => {
      if (sortKey === 'name') return a.name.localeCompare(b.name)
      if (sortKey === 'annual2026') return b.annual2026 - a.annual2026
      if (sortKey === 'raisePct') return (b.raisePct ?? -999) - (a.raisePct ?? -999)
      return (b.raise ?? -1e9) - (a.raise ?? -1e9)
    })
    return list
  }, [records, only, yq, sortKey])

  if (!comparison && !loadError) return <LoadingCard label="Loading the raise comparison…" />
  if (loadError) return <LoadingCard label="Could not load the raise data — check your connection and reload." />

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <section style={{ ...card, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 12 }}>
        <Stat label="Got a raise" value={`${summary.raised}`} sub={`of ${summary.matched} matched`} />
        <Stat label="Typical raise" value={summary.medianRaisePct != null ? `${summary.medianRaisePct}%` : '—'} sub="median" accent />
        <Stat label="Average raise" value={usd(summary.avgRaise)} />
        <Stat label="Total of raises" value={usd(summary.totalRaise)} />
        <Stat label="Promotions" value={`${summary.promotions}`} sub="title changed" />
      </section>

      {/* Biggest raises highlight */}
      <section style={card}>
        <h3 style={{ marginTop: 0 }}>Biggest changes, 2025 → 2026</h3>
        <div style={{ display: 'grid', gap: 8 }}>
          {summary.topRaises.slice(0, 10).map((r) => {
            const max = summary.topRaises[0].raise || 1
            return (
              <div key={r.name}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 13.5 }}>
                  <span style={{ color: '#12385b', fontWeight: 700 }}>
                    {r.name} <span style={{ color: '#94a3b8', fontWeight: 600 }}>· {r.title2026}</span>
                    {r.promoted && <span style={{ marginLeft: 6, background: '#ede9fe', color: '#6d28d9', fontSize: 11, fontWeight: 800, padding: '1px 7px', borderRadius: 999 }}>promotion</span>}
                  </span>
                  <strong style={{ whiteSpace: 'nowrap' }}>{usd(r.annual2025)} → {usd(r.annual2026)} <span style={{ color: '#b45309' }}>(+{usd(r.raise)})</span></strong>
                </div>
                <div style={{ height: 7, background: '#f1f5f9', borderRadius: 7, marginTop: 3 }}>
                  <div style={{ width: `${(r.raise / max) * 100}%`, height: '100%', borderRadius: 7, background: r.promoted ? '#7c3aed' : '#c99a2e' }} />
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Controls */}
      <section style={{ ...card, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {(['raised', 'promotions', 'all'] as const).map((f) => (
            <button key={f} onClick={() => { setOnly(f); setLimit(60) }} style={{
              padding: '8px 13px', borderRadius: 9, border: '1px solid', cursor: 'pointer', fontWeight: 800, fontSize: 13.5,
              borderColor: only === f ? '#1f5f8f' : '#cbd5e1', background: only === f ? '#1f5f8f' : 'white', color: only === f ? 'white' : '#334155',
            }}>{f === 'raised' ? `Raises (${summary.raised})` : f === 'promotions' ? `Promotions (${summary.promotions})` : `All 2026 (${summary.count2026})`}</button>
          ))}
        </div>
        <select value={sortKey} onChange={(e) => setSortKey(e.target.value as SortKey)} style={sel}>
          <option value="raise">Sort: Raise $</option>
          <option value="raisePct">Sort: Raise %</option>
          <option value="annual2026">Sort: 2026 salary</option>
          <option value="name">Sort: Name (A–Z)</option>
        </select>
        <input value={q} onChange={(e) => { setQ(e.target.value); setLimit(60) }} placeholder="Search name or title…"
          style={{ flex: 1, minWidth: 200, padding: '10px 13px', border: '1px solid #cbd5e1', borderRadius: 9, fontSize: 15 }} />
      </section>

      {/* Table */}
      <section style={card}>
        <div style={{ color: '#475569', fontWeight: 700, marginBottom: 10, fontSize: 14 }}>Showing {Math.min(limit, rows.length)} of {rows.length}</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
            <thead>
              <tr style={{ textAlign: 'left', color: '#64748b', borderBottom: '2px solid #e2e8f0' }}>
                <th style={th}>Employee / Position</th>
                <th style={{ ...th, textAlign: 'right' }}>2025</th>
                <th style={{ ...th, textAlign: 'right' }}>2026</th>
                <th style={{ ...th, textAlign: 'right' }}>Raise</th>
                <th style={{ ...th, textAlign: 'right' }}>%</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, limit).map((r, i) => (
                <tr key={`${r.name}-${i}`} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={td}>
                    <strong style={{ color: '#12385b' }}>{r.name}</strong>
                    {r.promoted && <span style={{ marginLeft: 6, background: '#ede9fe', color: '#6d28d9', fontSize: 11, fontWeight: 800, padding: '1px 7px', borderRadius: 999 }}>promotion</span>}
                    <div style={{ color: '#64748b', fontSize: 12.5 }}>
                      {r.title2026}{r.promoted && r.title2025 ? ` (was ${r.title2025})` : ''} · {r.group}
                    </div>
                  </td>
                  <td style={{ ...td, textAlign: 'right', color: '#64748b' }}>{r.comparable ? usd(r.annual2025) : <span style={{ color: '#cbd5e1' }}>n/a</span>}</td>
                  <td style={{ ...td, textAlign: 'right', fontWeight: 700 }}>{usd(r.annual2026)}</td>
                  <td style={{ ...td, textAlign: 'right', fontWeight: 700, color: !r.comparable ? '#cbd5e1' : (r.raise ?? 0) > 0 ? '#b45309' : (r.raise ?? 0) < 0 ? '#15803d' : '#94a3b8' }}>
                    {!r.comparable || r.raise == null ? '—' : `${r.raise >= 0 ? '+' : '−'}${usd(Math.abs(r.raise))}`}
                  </td>
                  <td style={{ ...td, textAlign: 'right', color: !r.comparable ? '#cbd5e1' : '#334155', fontWeight: 700 }}>
                    {!r.comparable || r.raisePct == null ? '—' : `${r.raisePct > 0 ? '+' : ''}${r.raisePct}%`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {limit < rows.length && (
          <div style={{ textAlign: 'center', marginTop: 14 }}>
            <button onClick={() => setLimit((l) => l + 100)} style={{ padding: '10px 18px', borderRadius: 10, border: '1px solid #1f5f8f', background: '#1f5f8f', color: 'white', fontWeight: 800, cursor: 'pointer' }}>Show more</button>
          </div>
        )}
      </section>

      <p style={{ color: '#64748b', fontSize: 13, lineHeight: 1.5 }}>
        Source: {comparison?.source.title ?? 'Town Board salary resolutions'}. {comparison?.note ?? ''} A raise here is the change in Board-authorized
        base salary; it excludes overtime and stipends. People who were part-time or hourly in 2025 show &quot;n/a&quot; for
        the 2025 salary because there was no comparable full-time figure.
      </p>
    </div>
  )
}

const th = { padding: '8px 9px' } as const
const td = { padding: '7px 9px' } as const

function Stat({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div style={{ background: accent ? '#dcfce7' : '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 12 }}>
      <div style={{ color: '#64748b', fontSize: 11.5, textTransform: 'uppercase', fontWeight: 900, letterSpacing: 0.4 }}>{label}</div>
      <strong style={{ fontSize: 19, color: '#12385b' }}>{value}</strong>
      {sub && <div style={{ color: '#64748b', fontSize: 12, marginTop: 1 }}>{sub}</div>}
    </div>
  )
}
