'use client'

import { useMemo, useState } from 'react'
import titlesData from '../public/data/payroll/titles-by-year.json'

type DeptTitle = { title: string; counts: Record<string, number>; latest: number }
type DeptRow = {
  department: string
  counts: Record<string, number>
  latest: number
  first: number
  last: number
  delta: number
  untitled: Record<string, number>
  titles: DeptTitle[]
}

const data = titlesData as unknown as {
  departmentYears: number[]
  departmentNote: string
  source: { title: string; url: string }
  departments: DeptRow[]
}
const years = data.departmentYears
const latestYear = years[years.length - 1]
const departments = data.departments

const card = { background: 'var(--rbl-surface)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 16, padding: 20, boxShadow: '0 14px 34px var(--rbl-shadow)' } as const
const th = { padding: '8px 10px', textAlign: 'right' as const, whiteSpace: 'nowrap' as const }
const td = { padding: '7px 10px', textAlign: 'right' as const }

type SortKey = 'staff' | 'gain' | 'drop' | 'name' | 'titles'

export default function WorkforceByDepartment() {
  const [q, setQ] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('staff')
  const [open, setOpen] = useState<Record<string, boolean>>({})

  const query = q.trim().toLowerCase()

  const rows = useMemo(() => {
    const matched = departments.filter(
      (d) =>
        !query ||
        d.department.toLowerCase().includes(query) ||
        d.titles.some((t) => t.title.toLowerCase().includes(query)),
    )
    const s = [...matched]
    if (sortKey === 'name') s.sort((a, b) => a.department.localeCompare(b.department))
    else if (sortKey === 'gain') s.sort((a, b) => b.delta - a.delta)
    else if (sortKey === 'drop') s.sort((a, b) => a.delta - b.delta)
    else if (sortKey === 'titles') s.sort((a, b) => b.titles.length - a.titles.length || a.department.localeCompare(b.department))
    else s.sort((a, b) => b.latest - a.latest || a.department.localeCompare(b.department))
    return s
  }, [query, sortKey])

  // A title search is a question about where that job sits, so the matching
  // departments open themselves rather than hiding the answer behind a click.
  const expanded = (d: DeptRow) =>
    open[d.department] ?? (query.length > 0 && d.titles.some((t) => t.title.toLowerCase().includes(query)))

  const totalLatest = useMemo(() => departments.reduce((s, d) => s + d.latest, 0), [])
  const maxLatest = useMemo(() => Math.max(...departments.map((d) => d.latest), 1), [])
  const biggest = useMemo(() => [...departments].sort((a, b) => b.delta - a.delta)[0], [])
  // Departments that carried staff earlier in the window but none in the latest
  // year. They stay in the list, which is why it can run longer than the
  // latest-year count in the stats above.
  const retired = useMemo(() => departments.filter((d) => d.latest === 0).length, [])

  return (
    <div>
      <section style={{ ...card, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 12, marginBottom: 16 }}>
        <Stat label={`Departments (${latestYear})`} value={String(departments.filter((d) => d.latest > 0).length)} />
        <Stat label={`Staff placed (${latestYear})`} value={totalLatest.toLocaleString()} accent />
        <Stat label="Years reported" value={`${years[0]}–${latestYear}`} />
        <Stat label="Biggest gain" value={biggest ? `+${biggest.delta} ${biggest.department}` : '—'} sub="net staff added" green />
      </section>

      <section style={{ ...card }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search a department or a title inside one (e.g. Water, Lifeguard)…"
            style={{ flex: 1, minWidth: 220, padding: '10px 13px', border: '1px solid var(--rbl-border-strong)', borderRadius: 9, fontSize: 15 }}
          />
          <select value={sortKey} onChange={(e) => setSortKey(e.target.value as SortKey)} style={{ padding: '10px 12px', border: '1px solid var(--rbl-border-strong)', borderRadius: 9, fontSize: 14 }}>
            <option value="staff">Sort: Most staff in {latestYear}</option>
            <option value="gain">Sort: Biggest increase</option>
            <option value="drop">Sort: Biggest decrease</option>
            <option value="titles">Sort: Most titles</option>
            <option value="name">Sort: Department (A–Z)</option>
          </select>
        </div>

        {/* The list spans every department staffed in any year, so it runs one
            longer than the latest-year count in the stat above — P/T Police was
            staffed through 2024 and not in 2025. Saying the span here is
            cheaper than leaving a reader to reconcile 66 against 65. */}
        <div style={{ color: 'var(--rbl-text-body)', fontWeight: 700, marginBottom: 8, fontSize: 14 }}>
          Showing {rows.length.toLocaleString()} of {departments.length.toLocaleString()} departments
          <span style={{ fontWeight: 400, color: 'var(--rbl-text-muted)' }}>
            {' '}— every department staffed in any year {years[0]}–{latestYear}
            {retired > 0 && `, which is ${retired} more than the ${latestYear} count above`}
          </span>
          {query && ' · departments matching a title are opened'}
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
            <thead>
              <tr style={{ color: 'var(--rbl-text-muted)', borderBottom: '2px solid var(--rbl-border-subtle)' }}>
                <th style={{ padding: '8px 10px', textAlign: 'left' }}>Department</th>
                {years.map((y) => <th key={y} style={th}>{y}</th>)}
                <th style={th}>Change<br /><span style={{ fontWeight: 400, fontSize: 11 }}>{years[0]}→{latestYear}</span></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((d) => {
                const isOpen = expanded(d)
                return (
                  <FragmentRow key={d.department} d={d} isOpen={isOpen} maxLatest={maxLatest} query={query}
                    onToggle={() => setOpen((o) => ({ ...o, [d.department]: !isOpen }))} />
                )
              })}
            </tbody>
          </table>
        </div>

        <p style={{ color: 'var(--rbl-text-muted)', fontSize: 12, marginTop: 12, marginBottom: 0, lineHeight: 1.5 }}>
          {data.departmentNote} Counts are distinct employees paid in that department that year, so they add up to
          the Town&apos;s payroll headcount — {totalLatest.toLocaleString()} in {latestYear}. The titles listed under
          a department do not, for two reasons: the same title can sit in several departments, and a few people each
          year carry a department but no title at all. Where that happens the shortfall is shown on its own{' '}
          <em>no title recorded</em> line rather than left to look like an arithmetic error. Source:{' '}
          <a href={data.source.url} target="_blank" rel="noreferrer" style={{ color: 'var(--rbl-accent)', fontWeight: 700 }}>{data.source.title} ↗</a>
        </p>
      </section>
    </div>
  )
}

function FragmentRow({ d, isOpen, maxLatest, query, onToggle }: { d: DeptRow; isOpen: boolean; maxLatest: number; query: string; onToggle: () => void }) {
  const untitledLatest = years.some((y) => d.untitled[String(y)] > 0)
  return (
    <>
      <tr style={{ borderBottom: isOpen ? 'none' : '1px solid var(--rbl-border-subtle)' }}>
        <td style={{ padding: '7px 10px' }}>
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={isOpen}
            style={{ background: 'none', border: 'none', padding: 0, textAlign: 'left', cursor: 'pointer', color: 'var(--rbl-title)', fontWeight: 700, fontSize: 13.5, fontFamily: 'inherit' }}
          >
            <span style={{ color: 'var(--rbl-text-muted)', marginRight: 6, display: 'inline-block', width: 10 }}>{isOpen ? '▾' : '▸'}</span>
            {d.department}
          </button>
          <Spark counts={d.counts} max={maxLatest} />
          <div style={{ color: 'var(--rbl-text-muted)', fontSize: 12, marginTop: 3 }}>
            {d.titles.length} {d.titles.length === 1 ? 'title' : 'titles'}
            {!isOpen && d.titles.length > 0 && ` · ${d.titles.slice(0, 3).map((t) => t.title).join(', ')}${d.titles.length > 3 ? '…' : ''}`}
          </div>
        </td>
        {years.map((y) => {
          const v = d.counts[String(y)] ?? 0
          return <td key={y} style={{ ...td, color: v ? 'var(--rbl-text-strong)' : 'var(--rbl-text-faint)', fontWeight: y === latestYear ? 800 : 400 }}>{v || '—'}</td>
        })}
        <td style={{ ...td, fontWeight: 800, whiteSpace: 'nowrap', color: d.delta > 0 ? 'var(--rbl-success)' : d.delta < 0 ? 'var(--rbl-danger)' : 'var(--rbl-text-muted)' }}>
          {d.delta > 0 ? '▲ +' : d.delta < 0 ? '▼ ' : '– '}{d.delta !== 0 ? Math.abs(d.delta) : ''}
        </td>
      </tr>

      {isOpen && (
        <tr style={{ borderBottom: '1px solid var(--rbl-border-subtle)' }}>
          <td colSpan={years.length + 2} style={{ padding: '0 10px 12px 26px', background: 'var(--rbl-surface-2)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ color: 'var(--rbl-text-muted)' }}>
                  <th style={{ padding: '6px 8px', textAlign: 'left', fontWeight: 700, fontSize: 11.5, textTransform: 'uppercase', letterSpacing: 0.4 }}>
                    Titles in {d.department}
                  </th>
                  {years.map((y) => <th key={y} style={{ ...th, fontSize: 11.5 }}>{y}</th>)}
                  <th style={{ ...th, fontSize: 11.5 }} />
                </tr>
              </thead>
              <tbody>
                {d.titles.map((t) => {
                  const hit = query.length > 0 && t.title.toLowerCase().includes(query)
                  return (
                    <tr key={t.title} style={{ borderTop: '1px solid var(--rbl-border-subtle)' }}>
                      <td style={{ padding: '6px 8px', color: hit ? 'var(--rbl-accent)' : 'var(--rbl-text-strong)', fontWeight: hit ? 800 : 600 }}>{t.title}</td>
                      {years.map((y) => {
                        const v = t.counts[String(y)] ?? 0
                        return <td key={y} style={{ ...td, padding: '6px 8px', color: v ? 'var(--rbl-text-body)' : 'var(--rbl-text-faint)', fontWeight: y === latestYear ? 700 : 400 }}>{v || '—'}</td>
                      })}
                      <td style={{ ...td, padding: '6px 8px' }} />
                    </tr>
                  )
                })}
                {untitledLatest && (
                  <tr style={{ borderTop: '1px solid var(--rbl-border-subtle)' }}>
                    <td style={{ padding: '6px 8px', color: 'var(--rbl-text-muted)', fontStyle: 'italic' }}>no title recorded</td>
                    {years.map((y) => {
                      const v = d.untitled[String(y)] ?? 0
                      return <td key={y} style={{ ...td, padding: '6px 8px', color: v ? 'var(--rbl-text-muted)' : 'var(--rbl-text-faint)' }}>{v || '—'}</td>
                    })}
                    <td style={{ ...td, padding: '6px 8px' }} />
                  </tr>
                )}
              </tbody>
            </table>
          </td>
        </tr>
      )}
    </>
  )
}

// Compact per-year bar under each department, on the same scale as the table.
function Spark({ counts, max }: { counts: Record<string, number>; max: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 16, marginTop: 3 }}>
      {years.map((y) => {
        const v = counts[String(y)] ?? 0
        const h = Math.max(2, Math.round((v / max) * 16))
        return <div key={y} title={`${y}: ${v}`} style={{ width: 6, height: h, background: y === latestYear ? 'var(--rbl-fill-accent)' : 'var(--rbl-track-strong)', borderRadius: 1 }} />
      })}
    </div>
  )
}

function Stat({ label, value, sub, accent, green }: { label: string; value: string; sub?: string; accent?: boolean; green?: boolean }) {
  return (
    <div style={{ background: green ? 'var(--rbl-success-bg)' : accent ? 'var(--rbl-info-bg)' : 'var(--rbl-surface-2)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 12, padding: 12 }}>
      <div style={{ color: 'var(--rbl-text-muted)', fontSize: 11.5, textTransform: 'uppercase', fontWeight: 900, letterSpacing: 0.4 }}>{label}</div>
      <strong style={{ fontSize: 18, color: green ? 'var(--rbl-success-strong)' : accent ? 'var(--rbl-info-text)' : 'var(--rbl-title)', display: 'block', marginTop: 2, lineHeight: 1.2 }}>{value}</strong>
      {sub && <div style={{ color: 'var(--rbl-text-muted)', fontSize: 12, marginTop: 2 }}>{sub}</div>}
    </div>
  )
}
