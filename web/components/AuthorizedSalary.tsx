'use client'

import { useMemo, useState } from 'react'
import { useFetchJson, LoadingCard } from './useFetchJson'
import { authorizedSalaryUrl, actualYearFor, matchedCountFor, type AuthorizedSalary as AuthorizedSalaryData, type SalaryRecord } from '../lib/salary'

const usd = (n: number | null | undefined) =>
  n == null ? '—' : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
const card = { background: 'white', border: '1px solid #e2e8f0', borderRadius: 16, padding: 18, boxShadow: '0 14px 34px rgba(15,23,42,.05)' } as const
const sel = { padding: '9px 11px', border: '1px solid #cbd5e1', borderRadius: 9, fontSize: 14, fontWeight: 700 } as const

type SortKey = 'annual' | 'actualGross' | 'gap' | 'name'

export default function AuthorizedSalary() {
  const [year, setYear] = useState<2025 | 2026>(2025)
  const [q, setQ] = useState('')
  const [group, setGroup] = useState('all')
  const [sortKey, setSortKey] = useState<SortKey>('annual')
  const [limit, setLimit] = useState(100)
  const yq = q.trim().toLowerCase()

  // Fetched at runtime (not bundled); cached across year switches.
  const { data: fetched, error: loadError } = useFetchJson<AuthorizedSalaryData>(authorizedSalaryUrl(year))
  const data: AuthorizedSalaryData = fetched ?? {
    source: { title: '', url: '' }, year, note: '', count: 0, totalAuthorized: 0, byGroup: [], records: [],
  }
  const groups = data.byGroup
  const actualYear = actualYearFor(data)
  const matchedCount = matchedCountFor(data)

  const rows = useMemo(() => {
    const list = data.records.filter((r) => {
      if (group !== 'all' && r.group !== group) return false
      if (yq && !(`${r.name} ${r.title}`.toLowerCase().includes(yq))) return false
      return true
    })
    const gap = (r: SalaryRecord) => (r.actualGross != null ? r.actualGross - r.annual : -Infinity)
    list.sort((a, b) => {
      if (sortKey === 'name') return a.name.localeCompare(b.name)
      if (sortKey === 'gap') return gap(b) - gap(a)
      if (sortKey === 'actualGross') return (b.actualGross ?? -1) - (a.actualGross ?? -1)
      return b.annual - a.annual
    })
    return list
  }, [data, group, yq, sortKey])

  const totalAuth = useMemo(() => rows.filter((r) => !r.isStipend).reduce((s, r) => s + r.annual, 0), [rows])

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <section style={{ ...card, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ fontWeight: 800, color: '#334155' }}>Salary year:</span>
        {([2025, 2026] as const).map((y) => (
          <button key={y} onClick={() => { setYear(y); setGroup('all'); setLimit(100) }} style={{
            padding: '8px 16px', borderRadius: 9, border: '1px solid', cursor: 'pointer', fontWeight: 800, fontSize: 14,
            borderColor: year === y ? '#1f5f8f' : '#cbd5e1', background: year === y ? '#1f5f8f' : 'white', color: year === y ? 'white' : '#334155',
          }}>{y}</button>
        ))}
        <span style={{ color: '#64748b', fontSize: 13 }}>Board-authorized base salaries for {year}.</span>
      </section>

      {!fetched && !loadError && <LoadingCard label={`Loading the ${year} salary schedule…`} />}
      {loadError && <LoadingCard label="Could not load the salary data — check your connection and reload." />}

      <section style={{ ...card, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 12 }}>
        <Stat label={`Positions (${year})`} value={data.count.toLocaleString()} />
        <Stat label="Total authorized base" value={usd(data.totalAuthorized)} accent />
        <Stat label="Matched to actual pay" value={`${matchedCount} of ${data.count}`} />
        <Stat label="Actual pay year" value={actualYear ? String(actualYear) : '—'} />
      </section>

      {/* group bars */}
      <section style={card}>
        <h3 style={{ marginTop: 0, marginBottom: 10 }}>Authorized salary by group</h3>
        {(() => {
          const max = Math.max(...groups.map((g) => g.authorized), 1)
          return (
            <div style={{ display: 'grid', gap: 8 }}>
              {groups.map((g) => (
                <button key={g.group} onClick={() => setGroup(group === g.group ? 'all' : g.group)}
                  style={{ background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', padding: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5 }}>
                    <span style={{ fontWeight: group === g.group ? 900 : 700, color: '#12385b' }}>{g.group} <span style={{ color: '#94a3b8', fontWeight: 600 }}>({g.headcount})</span></span>
                    <strong>{usd(g.authorized)}</strong>
                  </div>
                  <div style={{ height: 8, background: '#f1f5f9', borderRadius: 8, marginTop: 3 }}>
                    <div style={{ width: `${(g.authorized / max) * 100}%`, height: '100%', borderRadius: 8, background: group === g.group ? '#c99a2e' : '#1f5f8f' }} />
                  </div>
                </button>
              ))}
            </div>
          )
        })()}
      </section>

      {/* controls */}
      <section style={{ ...card, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <select value={group} onChange={(e) => { setGroup(e.target.value); setLimit(100) }} style={sel}>
          <option value="all">All groups</option>
          {groups.map((g) => <option key={g.group} value={g.group}>{g.group}</option>)}
        </select>
        <select value={sortKey} onChange={(e) => setSortKey(e.target.value as SortKey)} style={sel}>
          <option value="annual">Sort: Authorized salary</option>
          <option value="actualGross">Sort: Actual pay</option>
          <option value="gap">Sort: Actual over authorized</option>
          <option value="name">Sort: Name (A–Z)</option>
        </select>
        <input value={q} onChange={(e) => { setQ(e.target.value); setLimit(100) }} placeholder="Search name or title…"
          style={{ flex: 1, minWidth: 220, padding: '10px 13px', border: '1px solid #cbd5e1', borderRadius: 9, fontSize: 15 }} />
      </section>

      {/* table */}
      <section style={card}>
        <div style={{ color: '#475569', fontWeight: 700, marginBottom: 10, fontSize: 14 }}>
          Showing {Math.min(limit, rows.length).toLocaleString()} of {rows.length.toLocaleString()} positions · authorized base in view: {usd(totalAuth)}
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
            <thead>
              <tr style={{ textAlign: 'left', color: '#64748b', borderBottom: '2px solid #e2e8f0' }}>
                <th style={th}>Employee / Position</th>
                <th style={th}>Group</th>
                <th style={{ ...th, textAlign: 'right' }}>Authorized 2025</th>
                <th style={{ ...th, textAlign: 'right' }}>Actual {actualYear ?? ''}</th>
                <th style={{ ...th, textAlign: 'right' }}>Actual − Authorized</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, limit).map((r, i) => {
                const gap = r.actualGross != null ? r.actualGross - r.annual : null
                return (
                  <tr key={`${r.name}-${r.title}-${i}`} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={td}>
                      <strong style={{ color: '#12385b' }}>{r.name}</strong>
                      <div style={{ color: '#64748b', fontSize: 12.5 }}>{r.title}{r.isStipend ? ' (stipend)' : ''}{r.grade ? ` · ${r.grade}` : ''}</div>
                    </td>
                    <td style={{ ...td, color: '#475569' }}>{r.group}</td>
                    <td style={{ ...td, textAlign: 'right', fontWeight: 700 }}>{usd(r.annual)}</td>
                    <td style={{ ...td, textAlign: 'right', color: '#475569' }}>
                      {r.actualGross != null ? usd(r.actualGross) : <span style={{ color: '#cbd5e1' }}>no match</span>}
                      {r.actualOvertime ? <div style={{ fontSize: 11.5, color: '#b45309' }}>incl. {usd(r.actualOvertime)} OT</div> : null}
                    </td>
                    <td style={{ ...td, textAlign: 'right', fontWeight: 700, color: gap == null ? '#cbd5e1' : gap >= 0 ? '#b45309' : '#15803d' }}>
                      {gap == null ? '—' : `${gap >= 0 ? '+' : '−'}${usd(Math.abs(gap))}`}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {limit < rows.length && (
          <div style={{ textAlign: 'center', marginTop: 14 }}>
            <button onClick={() => setLimit((l) => l + 200)} style={{ padding: '10px 18px', borderRadius: 10, border: '1px solid #1f5f8f', background: '#1f5f8f', color: 'white', fontWeight: 800, cursor: 'pointer' }}>Show more</button>
          </div>
        )}
      </section>

      <p style={{ color: '#64748b', fontSize: 13, lineHeight: 1.5 }}>
        Source: {data.source.title}. {data.note} &quot;Actual {actualYear}&quot; is the most recent
        year of actual gross pay available and may differ in year from the authorized figure; actual pay includes
        overtime, longevity, and buy-outs on top of base salary, which is why it often exceeds the authorized base.
        Positions with &quot;no match&quot; could not be linked to an actual-pay record (new hires or name differences).
      </p>
    </div>
  )
}

const th = { padding: '8px 9px' } as const
const td = { padding: '7px 9px' } as const

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div style={{ background: accent ? '#dbeafe' : '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 12 }}>
      <div style={{ color: '#64748b', fontSize: 11.5, textTransform: 'uppercase', fontWeight: 900, letterSpacing: 0.4 }}>{label}</div>
      <strong style={{ fontSize: 19, color: '#12385b' }}>{value}</strong>
    </div>
  )
}
