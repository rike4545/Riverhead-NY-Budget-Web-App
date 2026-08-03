'use client'

import { useMemo, useState } from 'react'
import titlesData from '../public/data/payroll/titles-by-year.json'

type Wage = { n: number; hrAvg: number | null; hrMed: number | null; annAvg: number | null; annMed: number | null }
type TitleRow = {
  title: string
  counts: Record<string, number>
  latest: number
  first: number
  last: number
  delta: number
  wage2026?: Wage
}

const hr = (n: number) => `$${n.toFixed(4)}/hr`
const yr = (n: number) => `$${Math.round(n).toLocaleString()}/yr`

const data = titlesData as { years: number[]; note: string; source: { title: string; url: string }; titles: TitleRow[] }
const years = data.years
const latestYear = years[years.length - 1]

const card = { background: 'white', border: '1px solid #e2e8f0', borderRadius: 16, padding: 20, boxShadow: '0 14px 34px rgba(15,23,42,.05)' } as const
const th = { padding: '8px 10px', textAlign: 'right' as const, whiteSpace: 'nowrap' as const }
const td = { padding: '7px 10px', textAlign: 'right' as const }

type SortKey = 'latest' | 'delta' | 'gain' | 'name'

export default function WorkforceByTitle() {
  const [q, setQ] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('latest')

  const rows = useMemo(() => {
    const query = q.trim().toLowerCase()
    const r = data.titles.filter((t) => !query || t.title.toLowerCase().includes(query))
    const s = [...r]
    if (sortKey === 'name') s.sort((a, b) => a.title.localeCompare(b.title))
    else if (sortKey === 'delta') s.sort((a, b) => a.delta - b.delta) // most shrunk first
    else if (sortKey === 'gain') s.sort((a, b) => b.delta - a.delta) // most grown first
    else s.sort((a, b) => b.latest - a.latest || a.title.localeCompare(b.title))
    return s
  }, [q, sortKey])

  const totalLatest = useMemo(() => data.titles.reduce((s, t) => s + t.latest, 0), [])
  const maxLatest = useMemo(() => Math.max(...data.titles.map((t) => t.latest), 1), [])

  return (
    <div>
      <section style={{ ...card, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 12, marginBottom: 16 }}>
        <Stat label={`Distinct titles (${latestYear})`} value={String(data.titles.filter((t) => t.latest > 0).length)} />
        <Stat label={`Employees titled (${latestYear})`} value={totalLatest.toLocaleString()} accent />
        <Stat label="Years covered" value={`${years[0]}–${latestYear}`} />
        <Stat label="Biggest gain" value={topDelta(data.titles, 'gain')} sub="net positions added" green />
      </section>

      <section style={{ ...card }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search a title (e.g. Police Officer, Lifeguard)…"
            style={{ flex: 1, minWidth: 220, padding: '10px 13px', border: '1px solid #cbd5e1', borderRadius: 9, fontSize: 15 }}
          />
          <select value={sortKey} onChange={(e) => setSortKey(e.target.value as SortKey)} style={{ padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: 9, fontSize: 14 }}>
            <option value="latest">Sort: Most in {latestYear}</option>
            <option value="gain">Sort: Biggest increase</option>
            <option value="delta">Sort: Biggest decrease</option>
            <option value="name">Sort: Title (A–Z)</option>
          </select>
        </div>

        <div style={{ color: '#475569', fontWeight: 700, marginBottom: 8, fontSize: 14 }}>
          Showing {rows.length.toLocaleString()} of {data.titles.length.toLocaleString()} titles
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
            <thead>
              <tr style={{ color: '#64748b', borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ padding: '8px 10px', textAlign: 'left' }}>Title</th>
                {years.map((y) => <th key={y} style={th}>{y}</th>)}
                <th style={th}>Change<br /><span style={{ fontWeight: 400, fontSize: 11 }}>{years[0]}→{latestYear}</span></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((t) => (
                <tr key={t.title} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '7px 10px', color: '#284a69', fontWeight: 700 }}>
                    {t.title}
                    <Spark counts={t.counts} max={maxLatest} />
                    {t.wage2026 && <WageLine w={t.wage2026} />}
                  </td>
                  {years.map((y) => {
                    const v = t.counts[String(y)] ?? 0
                    return <td key={y} style={{ ...td, color: v ? '#1e293b' : '#cbd5e1', fontWeight: y === latestYear ? 800 : 400 }}>{v || '—'}</td>
                  })}
                  <td style={{ ...td, fontWeight: 800, whiteSpace: 'nowrap', color: t.delta > 0 ? '#15803d' : t.delta < 0 ? '#b91c1c' : '#6b7280' }}>
                    {t.delta > 0 ? '▲ +' : t.delta < 0 ? '▼ ' : '– '}{t.delta !== 0 ? Math.abs(t.delta) : ''}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p style={{ color: '#6b7280', fontSize: 12, marginTop: 12, marginBottom: 0, lineHeight: 1.5 }}>
          {data.note} Counts are distinct employees paid under each title that year. Where shown, the teal
          &ldquo;2026 authorized&rdquo; line is the average and median hourly rate (on that title&apos;s own workweek)
          from the Board&apos;s 2026 salary schedule, with annual for salaried roles — available for {' '}
          {data.titles.filter((t) => t.wage2026).length} of the titles. Source:{' '}
          <a href={data.source.url} target="_blank" rel="noreferrer" style={{ color: '#4a7297', fontWeight: 700 }}>{data.source.title} ↗</a>
        </p>
      </section>
    </div>
  )
}

// 2026 authorized wage line under a title: hourly to 4 decimals (the real rate
// on that title's own workweek), plus annual for salaried roles.
function WageLine({ w }: { w: Wage }) {
  const parts: string[] = []
  if (w.hrAvg != null) parts.push(`avg ${hr(w.hrAvg)}`)
  if (w.hrMed != null) parts.push(`median ${hr(w.hrMed)}`)
  if (w.annAvg != null) parts.push(`~${yr(w.annAvg)}`)
  if (parts.length === 0) return null
  return (
    <div style={{ fontWeight: 400, color: '#0f766e', fontSize: 12, marginTop: 3 }}>
      2026 authorized · {parts.join(' · ')}
    </div>
  )
}

// Compact per-year bar under each title.
function Spark({ counts, max }: { counts: Record<string, number>; max: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 16, marginTop: 3 }}>
      {years.map((y) => {
        const v = counts[String(y)] ?? 0
        const h = Math.max(2, Math.round((v / max) * 16))
        return <div key={y} title={`${y}: ${v}`} style={{ width: 6, height: h, background: y === latestYear ? '#4a7297' : '#cbd5e1', borderRadius: 1 }} />
      })}
    </div>
  )
}

function topDelta(titles: TitleRow[], dir: 'gain' | 'loss') {
  const sorted = [...titles].sort((a, b) => dir === 'gain' ? b.delta - a.delta : a.delta - b.delta)
  const t = sorted[0]
  if (!t) return '—'
  return `${t.delta > 0 ? '+' : ''}${t.delta} ${t.title}`
}

function Stat({ label, value, sub, accent, green }: { label: string; value: string; sub?: string; accent?: boolean; green?: boolean }) {
  return (
    <div style={{ background: green ? '#dcfce7' : accent ? '#dbeafe' : '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 12 }}>
      <div style={{ color: '#64748b', fontSize: 11.5, textTransform: 'uppercase', fontWeight: 900, letterSpacing: 0.4 }}>{label}</div>
      <strong style={{ fontSize: 18, color: green ? '#166534' : accent ? '#1e40af' : '#284a69', display: 'block', marginTop: 2, lineHeight: 1.2 }}>{value}</strong>
      {sub && <div style={{ color: '#6b7280', fontSize: 12, marginTop: 2 }}>{sub}</div>}
    </div>
  )
}
