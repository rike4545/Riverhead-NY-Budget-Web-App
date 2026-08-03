'use client'

import { useMemo, useState } from 'react'
import titlesData from '../public/data/payroll/titles-by-year.json'

type Wage = {
  n: number
  hrMin: number | null; hrMax: number | null
  annMin: number | null; annMax: number | null
  // Present only where the resolution prints an annual salary and leaves the
  // hourly column blank: the annual bracketed between the two CSEA workweeks.
  hrBasisLow?: number; hrBasisHigh?: number
  hrLowLabel?: string; hrHighLabel?: string
  hrDerivedMin?: number; hrDerivedMax?: number
}
type TitleRow = {
  title: string
  counts: Record<string, number>
  latest: number
  first: number
  last: number
  delta: number
  wage2026?: Wage
}

// A single authorized rate when uniform, otherwise the min–max across steps.
const hrRange = (lo: number, hi: number) =>
  lo === hi ? `$${lo.toFixed(4)}/hr` : `$${lo.toFixed(4)}–$${hi.toFixed(4)}/hr`
const yrRange = (lo: number, hi: number) =>
  lo === hi ? `$${lo.toLocaleString()}/yr` : `$${lo.toLocaleString()}–$${hi.toLocaleString()}/yr`

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
          {data.note} Counts are distinct employees paid under each title that year. The teal
          &ldquo;2026 authorized rate&rdquo; line is what the Town Board&apos;s January 2026 salary resolutions
          actually print for that title, available for {data.titles.filter((t) => t.wage2026).length} of the titles.
          Those rosters have an ANNUAL SALARY column and an HOURLY column, but the Town fills the hourly one in only
          for part-time and per-hour staff — and for the Water District, the one department that publishes both. For
          every other full-time title, <strong>no hourly rate is published</strong>, so the grey <strong>≈</strong>{' '}
          line brackets it instead: the annual over <strong>2,088</strong> hours (a 40-hour week) at the low end and
          over <strong>1,827</strong> hours (a 35-hour week) at the high end. Those are the two regular workweeks in
          the CSEA agreement, on Riverhead&apos;s 261-workday year; all 16 of the Water District&apos;s published
          hourly rates land on exactly one or the other. (The Town pays biweekly, but the rate is struck on that
          261-day year, not on 26 × 80 hours — the published rates match 2,088 and miss 2,080.) Police Officers and
          Detectives are bracketed on their own contract instead: the PBA agreement sets an eight-hour tour with a
          duty chart of 238 work days a year, or 260 during an officer&apos;s first 30 months. The rosters
          don&apos;t say which schedule each title is on, which is why the figure is a range and not a single number
          — and why it is arithmetic by this site, not a rate the Board voted on. No hourly figure at all is shown
          for elected officials, board members (paid a stipend, not a wage), or sergeants and above, who are a
          separate Superior Officers unit whose duty chart we don&apos;t hold. Source:{' '}
          <a href={data.source.url} target="_blank" rel="noreferrer" style={{ color: '#4a7297', fontWeight: 700 }}>{data.source.title} ↗</a>
        </p>
      </section>
    </div>
  )
}

// 2026 wage line under a title: hourly to 4 decimals (the real rate on that
// title's own workweek), plus annual for salaried roles. Where the resolution
// set only an annual salary, the hourly is computed here instead of quoted —
// shown in grey with a "≈" and its divisor, so it never reads as a rate the
// Board authorized.
function WageLine({ w }: { w: Wage }) {
  const authorized = w.hrMin != null && w.hrMax != null
  const parts: string[] = []
  if (authorized) parts.push(hrRange(w.hrMin!, w.hrMax!))
  if (w.annMin != null && w.annMax != null) parts.push(yrRange(w.annMin, w.annMax))
  if (parts.length === 0) return null
  return (
    <>
      <div style={{ fontWeight: 400, color: '#0f766e', fontSize: 12, marginTop: 3 }}>
        2026 authorized rate · {parts.join(' · ')}
      </div>
      {!authorized && w.hrDerivedMin != null && w.hrDerivedMax != null && (
        <div style={{ fontWeight: 400, color: '#64748b', fontSize: 12, marginTop: 2 }}>
          ≈ ${w.hrDerivedMin.toFixed(4)}/hr on {w.hrLowLabel} to ${w.hrDerivedMax.toFixed(4)}/hr on{' '}
          {w.hrHighLabel} — computed by this site, not a published rate
        </div>
      )}
    </>
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
