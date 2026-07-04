'use client'

import { useMemo, useState } from 'react'
import Sparkline from './Sparkline'
import { ColumnGuide } from './PlainCallout'
import { useFetchJson } from './useFetchJson'
import {
  PAYROLL_RECORDS_URL, mapRawRecords, payrollYears, yearSummaries, yearSummary, unionLabel, payrollSource, payrollNote,
  type PayrollRecordRaw,
} from '../lib/payroll'

const usd = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
const card = { background: 'white', border: '1px solid #e2e8f0', borderRadius: 16, padding: 18, boxShadow: '0 14px 34px rgba(15,23,42,.05)' } as const
const sel = { padding: '9px 11px', border: '1px solid #cbd5e1', borderRadius: 9, fontSize: 14, fontWeight: 700 } as const

type SortKey = 'gross' | 'overtime' | 'regular' | 'name'

export default function PayrollExplorer() {
  const latest = payrollYears[payrollYears.length - 1]
  const [year, setYear] = useState<number | 'all'>(latest)
  const [q, setQ] = useState('')
  const [union, setUnion] = useState('all')
  const [dept, setDept] = useState('all')
  const [sortKey, setSortKey] = useState<SortKey>('gross')
  const [limit, setLimit] = useState(100)

  const yq = q.trim().toLowerCase()
  const summary = year === 'all' ? undefined : yearSummary(year)

  // The full per-employee dataset is fetched at runtime, not bundled.
  const { data: rawData, error: loadError } = useFetchJson<{ records: PayrollRecordRaw[] }>(PAYROLL_RECORDS_URL)
  const payrollRecords = useMemo(() => (rawData ? mapRawRecords(rawData.records) : []), [rawData])
  const loading = !rawData && !loadError

  const unions = useMemo(() => {
    const set = new Set<string>()
    payrollRecords.forEach((r) => { if (year === 'all' || r.year === year) set.add(r.union || '') })
    return Array.from(set).sort()
  }, [payrollRecords, year])

  const departments = useMemo(() => {
    const set = new Set<string>()
    payrollRecords.forEach((r) => { if ((year === 'all' || r.year === year) && r.department) set.add(r.department) })
    return Array.from(set).sort()
  }, [payrollRecords, year])

  const filtered = useMemo(() => {
    const rows = payrollRecords.filter((r) => {
      if (year !== 'all' && r.year !== year) return false
      if (union !== 'all' && (r.union || '') !== union) return false
      if (dept !== 'all' && r.department !== dept) return false
      if (yq && !(`${r.name} ${r.title} ${r.department}`.toLowerCase().includes(yq))) return false
      return true
    })
    rows.sort((a, b) => {
      if (sortKey === 'name') return a.name.localeCompare(b.name)
      return (b[sortKey] as number) - (a[sortKey] as number)
    })
    return rows
  }, [payrollRecords, year, union, dept, yq, sortKey])

  const totals = useMemo(() => ({
    headcount: filtered.length,
    gross: filtered.reduce((s, r) => s + r.gross, 0),
    overtime: filtered.reduce((s, r) => s + r.overtime, 0),
  }), [filtered])

  const grossTrend = payrollYears.map((y) => yearSummary(y)?.totalGross ?? null)
  const otTrend = payrollYears.map((y) => yearSummary(y)?.totalOvertime ?? null)

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      {/* Summary cards */}
      <section style={{ ...card, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 12 }}>
        <Stat label={year === 'all' ? 'Records (all years)' : `Employees ${year}`} value={totals.headcount.toLocaleString()} />
        <Stat label="Total Gross Pay" value={usd(totals.gross)} accent />
        <Stat label="Total Overtime" value={usd(totals.overtime)} />
        {summary && <Stat label="Median Gross" value={usd(summary.medianGross)} />}
        {summary && <Stat label="Highest Paid" value={usd(summary.maxGross)} />}
      </section>

      {/* Multi-year trend */}
      <section style={{ ...card, display: 'flex', gap: 22, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <TrendBlock label={`Total gross pay ${payrollYears[0]}–${payrollYears[payrollYears.length - 1]}`} values={grossTrend} years={payrollYears} stroke="#1f5f8f" />
        <TrendBlock label="Total overtime" values={otTrend} years={payrollYears} stroke="#c99a2e" />
      </section>

      {/* Controls */}
      <section style={{ ...card, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <select value={String(year)} onChange={(e) => { setYear(e.target.value === 'all' ? 'all' : Number(e.target.value)); setLimit(100) }} style={sel}>
          <option value="all">All years</option>
          {[...payrollYears].reverse().map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
        <select value={union} onChange={(e) => { setUnion(e.target.value); setLimit(100) }} style={sel}>
          <option value="all">All unions / groups</option>
          {unions.map((u) => <option key={u} value={u}>{unionLabel(u)}</option>)}
        </select>
        {departments.length > 0 && (
          <select value={dept} onChange={(e) => { setDept(e.target.value); setLimit(100) }} style={sel}>
            <option value="all">All departments</option>
            {departments.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        )}
        <select value={sortKey} onChange={(e) => setSortKey(e.target.value as SortKey)} style={sel}>
          <option value="gross">Sort: Gross pay</option>
          <option value="overtime">Sort: Overtime</option>
          <option value="regular">Sort: Regular pay</option>
          <option value="name">Sort: Name (A–Z)</option>
        </select>
        <input
          value={q}
          onChange={(e) => { setQ(e.target.value); setLimit(100) }}
          placeholder="Search employee name, title, department…"
          style={{ flex: 1, minWidth: 220, padding: '10px 13px', border: '1px solid #cbd5e1', borderRadius: 9, fontSize: 15 }}
        />
      </section>

      {/* Table */}
      <section style={card}>
        <ColumnGuide items={[
          { term: 'Regular', plain: 'Base salary or wages — the normal pay, not counting overtime.' },
          { term: 'Overtime', plain: 'Extra pay for hours worked beyond the normal schedule.' },
          { term: 'Gross Pay', plain: 'Everything paid for the year added together — base pay, overtime, plus extras like stipends, longevity, and buy-outs.' },
          { term: 'Group', plain: 'The union or bargaining group the employee belongs to (for example PBA for police, CSEA for many town workers).' },
        ]} />
        <div style={{ color: '#475569', fontWeight: 700, marginBottom: 10, fontSize: 14 }}>
          {loading
            ? 'Loading employee records…'
            : loadError
              ? 'Could not load the employee records — check your connection and reload.'
              : `Showing ${Math.min(limit, filtered.length).toLocaleString()} of ${filtered.length.toLocaleString()} employees`}
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
            <thead>
              <tr style={{ textAlign: 'left', color: '#64748b', borderBottom: '2px solid #e2e8f0' }}>
                {year === 'all' && <th style={th}>Yr</th>}
                <th style={th}>Employee</th>
                <th style={th}>Title</th>
                <th style={th}>Department</th>
                <th style={th}>Group</th>
                <SortTh label="Regular" active={sortKey === 'regular'} onClick={() => setSortKey('regular')} />
                <SortTh label="Overtime" active={sortKey === 'overtime'} onClick={() => setSortKey('overtime')} />
                <SortTh label="Gross Pay" active={sortKey === 'gross'} onClick={() => setSortKey('gross')} />
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, limit).map((r, i) => (
                <tr key={`${r.name}-${r.year}-${i}`} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  {year === 'all' && <td style={{ ...td, color: '#94a3b8' }}>{r.year}</td>}
                  <td style={{ ...td, fontWeight: 700, color: '#12385b' }}>
                    <button onClick={() => { setQ(r.name); setYear('all'); setLimit(100) }} style={nameBtn} title="Show this employee across all years">{r.name}</button>
                  </td>
                  <td style={td}>{r.title || '—'}</td>
                  <td style={td}>{r.department || '—'}</td>
                  <td style={{ ...td, color: '#475569' }}>{r.union || '—'}</td>
                  <td style={{ ...td, textAlign: 'right', color: '#64748b' }}>{usd(r.regular)}</td>
                  <td style={{ ...td, textAlign: 'right', color: r.overtime > 0 ? '#b45309' : '#94a3b8', fontWeight: r.overtime > 0 ? 700 : 400 }}>{usd(r.overtime)}</td>
                  <td style={{ ...td, textAlign: 'right', fontWeight: 800 }}>{usd(r.gross)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {limit < filtered.length && (
          <div style={{ textAlign: 'center', marginTop: 14 }}>
            <button onClick={() => setLimit((l) => l + 200)} style={{ padding: '10px 18px', borderRadius: 10, border: '1px solid #1f5f8f', background: '#1f5f8f', color: 'white', fontWeight: 800, cursor: 'pointer' }}>
              Show more
            </button>
          </div>
        )}
      </section>

      {/* Leaders for a specific year */}
      {summary && (
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: 14 }}>
          <LeaderCard title={`Top Earners (${summary.year})`} rows={summary.topEarners.map((e) => ({ name: e.name, sub: e.title || e.department, value: e.gross }))} onPick={(n) => { setQ(n); setYear('all') }} />
          <LeaderCard title={`Overtime Leaders (${summary.year})`} rows={summary.overtimeLeaders.map((e) => ({ name: e.name, sub: e.title || e.department, value: e.overtime }))} onPick={(n) => { setQ(n); setYear('all') }} amber />
        </section>
      )}

      <p style={{ color: '#64748b', fontSize: 13, lineHeight: 1.5 }}>
        Source: {payrollSource.title}. {payrollNote} Overtime is summed from the detailed overtime pay codes. Department,
        title, and pay class are reported from 2022 onward. Figures are gross paid earnings and may include stipends,
        longevity, buy-outs, and retroactive pay in the gross total. Verify against the official records before relying on them.
      </p>
    </div>
  )
}

function TrendBlock({ label, values, years, stroke }: { label: string; values: (number | null)[]; years: number[]; stroke: string }) {
  const first = values.find((v) => v != null) ?? 0
  const last = [...values].reverse().find((v) => v != null) ?? 0
  const pct = first ? ((last - first) / first) * 100 : 0
  return (
    <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
      <div>
        <div style={{ color: '#64748b', fontSize: 11.5, textTransform: 'uppercase', fontWeight: 900, letterSpacing: 0.3 }}>{label}</div>
        <strong style={{ fontSize: 18, color: '#12385b' }}>{usd(last)}</strong>
        <span style={{ marginLeft: 8, fontWeight: 800, fontSize: 13, color: pct >= 0 ? '#b91c1c' : '#15803d' }}>
          {pct >= 0 ? '▲' : '▼'} {Math.abs(pct).toFixed(0)}% since {years[0]}
        </span>
      </div>
      <Sparkline values={values} width={150} height={42} stroke={stroke} fill="rgba(31,95,143,0.10)" />
    </div>
  )
}

function LeaderCard({ title, rows, onPick, amber }: { title: string; rows: { name: string; sub: string; value: number }[]; onPick: (n: string) => void; amber?: boolean }) {
  const max = Math.max(...rows.map((r) => r.value), 1)
  return (
    <div style={card}>
      <h3 style={{ marginTop: 0, marginBottom: 12 }}>{title}</h3>
      <div style={{ display: 'grid', gap: 7 }}>
        {rows.slice(0, 12).map((r, i) => (
          <button key={r.name + i} onClick={() => onPick(r.name)} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, alignItems: 'center', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', padding: '3px 0' }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 700, color: '#12385b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.name}</div>
              <div style={{ height: 6, background: '#f1f5f9', borderRadius: 6, marginTop: 3 }}>
                <div style={{ width: `${(r.value / max) * 100}%`, height: '100%', borderRadius: 6, background: amber ? '#c99a2e' : '#1f5f8f' }} />
              </div>
            </div>
            <strong style={{ color: amber ? '#b45309' : '#12385b' }}>{usd(r.value)}</strong>
          </button>
        ))}
      </div>
    </div>
  )
}

const th = { padding: '8px 9px' } as const
const td = { padding: '7px 9px' } as const
const nameBtn = { background: 'none', border: 'none', color: '#12385b', fontWeight: 700, cursor: 'pointer', padding: 0, font: 'inherit', textAlign: 'left' as const }

function SortTh({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <th style={{ ...th, textAlign: 'right' }}>
      <button onClick={onClick} style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 800, color: active ? '#1f5f8f' : '#64748b', font: 'inherit' }}>
        {label}{active ? ' ▾' : ''}
      </button>
    </th>
  )
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div style={{ background: accent ? '#dbeafe' : '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 12 }}>
      <div style={{ color: '#64748b', fontSize: 11.5, textTransform: 'uppercase', fontWeight: 900, letterSpacing: 0.4 }}>{label}</div>
      <strong style={{ fontSize: 19, color: '#12385b' }}>{value}</strong>
    </div>
  )
}
