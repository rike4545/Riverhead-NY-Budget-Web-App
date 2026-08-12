'use client'

import { Fragment, useMemo, useState } from 'react'
import Sparkline from './Sparkline'
import InfoTip from './InfoTip'
import { ColumnGuide } from './PlainCallout'
import { useFetchJson } from './useFetchJson'
import {
  PAYROLL_RECORDS_URL, mapRawRecords, payrollYears, yearSummaries, yearSummary, unionLabel, payrollSource, payrollNote,
  type PayrollRecordRaw, type PayrollRecord,
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
  const [expanded, setExpanded] = useState<string | null>(null)

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
      if (yq) {
        const hay = `${r.name} ${r.title} ${r.department}`.toLowerCase()
        // Also match the payroll file number, with or without leading zeros.
        const fn = r.fileNumber
        const digits = yq.replace(/\D/g, '')
        const fnMatch = !!fn && !!digits && (fn === digits || fn === digits.padStart(fn.length, '0') || fn.replace(/^0+/, '') === digits.replace(/^0+/, ''))
        if (!hay.includes(yq) && !fnMatch) return false
      }
      return true
    })
    rows.sort((a, b) => {
      if (sortKey === 'name') return a.name.localeCompare(b.name)
      return (b[sortKey] as number) - (a[sortKey] as number)
    })
    return rows
  }, [payrollRecords, year, union, dept, yq, sortKey])

  const totals = useMemo(() => {
    // filtered has one row per employee PER YEAR. "Current" headcount means people
    // actually paid in the latest year on record — someone who left in 2021 shouldn't
    // count toward how many people the Town employs today. allTimeCount (distinct names
    // across every year) is kept only as context in the sub-label, not as the headline.
    const allTimeCount = new Set(filtered.map((r) => r.name)).size
    const currentCount = new Set(filtered.filter((r) => r.year === latest).map((r) => r.name)).size
    return {
      headcount: year === 'all' ? currentCount : filtered.length,
      formerCount: allTimeCount - currentCount,
      allTimeCount,
      recordCount: filtered.length,
      gross: filtered.reduce((s, r) => s + r.gross, 0),
      overtime: filtered.reduce((s, r) => s + r.overtime, 0),
    }
  }, [filtered, year, latest])

  const grossTrend = payrollYears.map((y) => yearSummary(y)?.totalGross ?? null)
  const otTrend = payrollYears.map((y) => yearSummary(y)?.totalOvertime ?? null)

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      {/* Summary cards */}
      <section style={{ ...card, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 12 }}>
        <Stat
          label={year === 'all' ? `Current Employees (${latest})` : `Employees ${year}`}
          value={totals.headcount.toLocaleString()}
          sub={year === 'all' ? `of ${totals.allTimeCount.toLocaleString()} people paid since ${payrollYears[0]}` : 'actually paid that year'}
        />
        {year === 'all' && (
          <Stat
            label={`Former Employees (before ${latest})`}
            value={totals.formerCount.toLocaleString()}
            sub={`left, retired, or otherwise stopped appearing before ${latest} · ${totals.recordCount.toLocaleString()} employee-year records total`}
          />
        )}
        <Stat label="Total Gross Pay" value={usd(totals.gross)} accent />
        <Stat label="Total Overtime" value={usd(totals.overtime)} />
        {summary && <Stat label="Average Salary" value={usd(summary.avgGross)} />}
        {summary && <Stat label="Median Salary" value={usd(summary.medianGross)} />}
        {summary?.avgTenureYears != null && <Stat label="Average Tenure" value={`${summary.avgTenureYears} yrs`} />}
        {summary?.turnover && (
          <Stat
            label={`Turnover vs ${year !== 'all' ? year - 1 : ''}`}
            value={summary.turnover.ratePct != null ? `${summary.turnover.ratePct}%` : '—'}
            sub={`${summary.turnover.separations} left · ${summary.turnover.newHires} hired`}
            amber
          />
        )}
      </section>

      {/* Multi-year trend */}
      <section style={{ ...card, display: 'flex', gap: 22, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <TrendBlock label={`Total gross pay ${payrollYears[0]}–${payrollYears[payrollYears.length - 1]}`} values={grossTrend} years={payrollYears} stroke="#4a7297" />
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
          placeholder="Search name, title, department, or file #…"
          style={{ flex: 1, minWidth: 220, padding: '10px 13px', border: '1px solid #cbd5e1', borderRadius: 9, fontSize: 15 }}
        />
      </section>

      {/* Table */}
      <section style={card}>
        <ColumnGuide items={[
          { term: 'Regular', plain: 'Base salary or wages — the normal pay, not counting overtime.' },
          { term: 'Overtime', plain: 'Extra pay for hours worked beyond the normal schedule.' },
          { term: 'Other pay', plain: 'Everything on top of base and overtime: longevity, holiday and shift differentials, stipends, retroactive pay, and leave/termination buy-outs. That last group mixes sick and vacation buy-backs with severance and health-insurance opt-out buy-backs — only the buy-backs are accrued leave. Hover the column heading, or click a row, for the breakdown.' },
          { term: 'Gross Pay', plain: 'Base pay + overtime + other pay, all added together — the total actually paid for the year.' },
          { term: 'Group', plain: 'The union or bargaining group the employee belongs to (for example PBA for police, CSEA for many town workers). Elected, appointed, management and part-time staff are not union-covered.' },
          { term: 'Titles marked “·carried”', plain: 'The Town’s payroll export only includes job titles and departments from 2022 onward. Where someone held one unchanging title across every year on record, it is carried back to their earlier years and marked — it is an inference, not something the Town reported for that year. Anyone whose title ever changed is left blank instead, so a later promotion is never written into an earlier year.' },
        ]} />
        <div style={{ color: '#475569', fontSize: 13, marginBottom: 8, lineHeight: 1.5 }}>
          <strong>Tip:</strong> click any employee row to expand a full breakdown of how their gross pay is built —
          base + overtime + each addition (longevity, holiday, stipends, buy-outs, retro) adds up to the total.
        </div>
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
                <SortTh
                  label="Regular" active={sortKey === 'regular'} onClick={() => setSortKey('regular')}
                  tip={{ heading: 'Regular (base pay)', body: 'Base salary or wages for normal scheduled hours — before overtime and before any of the additions in “Other pay.”' }}
                />
                <SortTh
                  label="Overtime" active={sortKey === 'overtime'} onClick={() => setSortKey('overtime')}
                  tip={{ heading: 'Overtime', body: 'Pay for hours worked beyond the normal schedule, at the contractual premium rate (generally 1.5× the straight-time rate).' }}
                />
                <th style={{ ...th, textAlign: 'right' }}>
                  <InfoTip label={<span style={{ fontWeight: 800, color: '#64748b' }}>Other pay</span>} heading="Other pay — what’s in it" align="right">
                    <OtherPayTip rows={filtered} />
                  </InfoTip>
                </th>
                <SortTh
                  label="Gross Pay" active={sortKey === 'gross'} onClick={() => setSortKey('gross')}
                  tip={{ heading: 'Gross Pay', body: 'Base pay + overtime + other pay — the total actually paid out for the year, before taxes and deductions. This is what the Town spent on that person, not their take-home.' }}
                />
                <th style={th} aria-label="expand" />
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, limit).map((r, i) => {
                const key = `${r.name}-${r.year}-${i}`
                const open = expanded === key
                const cols = (year === 'all' ? 6 : 5) + 4
                return (
                  <Fragment key={key}>
                    <tr onClick={() => setExpanded(open ? null : key)} style={{ borderBottom: open ? 'none' : '1px solid #f1f5f9', cursor: 'pointer', background: open ? '#f8fafc' : undefined }}>
                      {year === 'all' && <td style={{ ...td, color: '#6b7280' }}>{r.year}</td>}
                      <td style={{ ...td, fontWeight: 700, color: '#284a69' }}>
                        <button onClick={(e) => { e.stopPropagation(); setQ(r.name); setYear('all'); setLimit(100) }} style={nameBtn} title="Show this employee across all years">{r.name}</button>
                        {r.fileNumber && <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 600 }}>File #{r.fileNumber}</div>}
                      </td>
                      <td style={td}><Inferred value={r.title} inferred={r.inferredTitle} /></td>
                      <td style={td}><Inferred value={r.department} inferred={r.inferredDepartment} /></td>
                      <td style={{ ...td, color: '#475569' }}>{r.union || '—'}</td>
                      <td style={{ ...td, textAlign: 'right', color: '#64748b' }}>{usd(r.regular)}</td>
                      <td style={{ ...td, textAlign: 'right', color: r.overtime > 0 ? '#b45309' : '#6b7280', fontWeight: r.overtime > 0 ? 700 : 400 }}>{usd(r.overtime)}</td>
                      <td style={{ ...td, textAlign: 'right', color: r.other > 0 ? '#0369a1' : '#6b7280', fontWeight: r.other > 0 ? 700 : 400 }}>{usd(r.other)}</td>
                      <td style={{ ...td, textAlign: 'right', fontWeight: 800 }}>{usd(r.gross)}</td>
                      <td style={{ ...td, textAlign: 'center', color: '#4a7297', fontWeight: 800 }}>{open ? '▾' : '▸'}</td>
                    </tr>
                    {open && (
                      <tr style={{ borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
                        <td colSpan={cols} style={{ padding: '4px 14px 16px' }}>
                          <PayBreakdown record={r} />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
        {limit < filtered.length && (
          <div style={{ textAlign: 'center', marginTop: 14 }}>
            <button onClick={() => setLimit((l) => l + 200)} style={{ padding: '10px 18px', borderRadius: 10, border: '1px solid #4a7297', background: '#4a7297', color: 'white', fontWeight: 800, cursor: 'pointer' }}>
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
        Source: {payrollSource.title}. {payrollNote} Overtime is summed from the detailed overtime pay codes, and each
        gross is broken into base pay, overtime, and the additions on top (longevity, holiday &amp; shift differentials,
        stipends, buy-outs, retroactive pay, and smaller adjustments) — click any row to see the parts add up to the
        total. Department, title, and pay class are reported from 2022 onward. Verify against the official records before relying on them.
      </p>
    </div>
  )
}

const COMP_COLOR: Record<string, string> = {
  regular: '#4a7297', overtime: '#c99a2e', longevity: '#0e7490', holiday: '#7c3aed',
  stipend: '#0891b2', buyout: '#dc2626', retro: '#65a30d', misc: '#64748b',
}

function PayBreakdown({ record }: { record: PayrollRecord }) {
  const parts = record.components.filter((c) => c.amount !== 0)
  const total = record.gross || 1
  const positive = parts.filter((c) => c.amount > 0)
  return (
    <div style={{ display: 'grid', gap: 12, maxWidth: 720 }}>
      <div style={{ color: '#334155', fontSize: 13.5, fontWeight: 700 }}>
        Why {record.name}&apos;s {record.year} gross pay is {usd(record.gross)}:
      </div>
      {/* stacked bar */}
      <div style={{ display: 'flex', height: 22, borderRadius: 6, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
        {positive.map((c) => (
          <div key={c.key} title={`${c.label}: ${usd(c.amount)}`} style={{ width: `${(c.amount / total) * 100}%`, background: COMP_COLOR[c.key] || '#6b7280' }} />
        ))}
      </div>
      {/* component list */}
      <div style={{ display: 'grid', gap: 5 }}>
        {parts.map((c) => (
          <div key={c.key} style={{ display: 'grid', gridTemplateColumns: '14px 1fr auto auto', gap: 10, alignItems: 'center', fontSize: 13.5 }}>
            <span style={{ width: 11, height: 11, borderRadius: 3, background: COMP_COLOR[c.key] || '#6b7280' }} />
            <span style={{ color: '#334155', fontWeight: c.key === 'regular' ? 700 : 500 }}>{c.label}</span>
            <span style={{ color: '#6b7280', fontSize: 12, minWidth: 44, textAlign: 'right' }}>{((c.amount / total) * 100).toFixed(0)}%</span>
            <strong style={{ color: c.amount < 0 ? '#b91c1c' : '#284a69', minWidth: 92, textAlign: 'right' }}>{usd(c.amount)}</strong>
          </div>
        ))}
        <div style={{ display: 'grid', gridTemplateColumns: '14px 1fr auto auto', gap: 10, alignItems: 'center', fontSize: 14, borderTop: '2px solid #e2e8f0', paddingTop: 6, marginTop: 2 }}>
          <span />
          <span style={{ color: '#284a69', fontWeight: 900 }}>Gross pay</span>
          <span />
          <strong style={{ color: '#284a69', minWidth: 92, textAlign: 'right' }}>{usd(record.gross)}</strong>
        </div>
      </div>
      <div style={{ color: '#64748b', fontSize: 12, lineHeight: 1.5 }}>
        &quot;Other pay &amp; adjustments&quot; groups smaller additive codes (call-back, standby, comp time, night differential, etc.).
        Figures are the actual amounts paid under each code in the Town&apos;s Gross Earnings export; the parts add up to gross pay.
      </div>
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
        <strong style={{ fontSize: 18, color: '#284a69' }}>{usd(last)}</strong>
        <span style={{ marginLeft: 8, fontWeight: 800, fontSize: 13, color: pct >= 0 ? 'var(--inc)' : 'var(--dec)' }}>
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
              <div style={{ fontWeight: 700, color: '#284a69', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.name}</div>
              <div style={{ height: 6, background: '#f1f5f9', borderRadius: 6, marginTop: 3 }}>
                <div style={{ width: `${(r.value / max) * 100}%`, height: '100%', borderRadius: 6, background: amber ? '#c99a2e' : '#4a7297' }} />
              </div>
            </div>
            <strong style={{ color: amber ? '#b45309' : '#284a69' }}>{usd(r.value)}</strong>
          </button>
        ))}
      </div>
    </div>
  )
}

// Live composition of "Other pay" across whatever rows are currently filtered,
// so the tooltip describes the year/union the reader is actually looking at.
function OtherPayTip({ rows }: { rows: PayrollRecord[] }) {
  const totals: Record<string, { label: string; amount: number }> = {}
  let total = 0
  for (const r of rows) {
    for (const c of r.components) {
      if (c.key === 'regular' || c.key === 'overtime') continue
      totals[c.key] = { label: c.label, amount: (totals[c.key]?.amount ?? 0) + c.amount }
      total += c.amount
    }
  }
  const parts = Object.keys(totals)
    .map((k) => totals[k])
    .filter((p) => p.amount > 0)
    .sort((a, b) => b.amount - a.amount)

  return (
    <>
      Everything paid on top of base salary and overtime. For the rows shown, it breaks down as:
      {parts.length > 0 && (
        <span style={{ display: 'block', margin: '7px 0 0' }}>
          {parts.map((p) => (
            <span key={p.label} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, padding: '1.5px 0' }}>
              <span style={{ color: '#b9cbdc' }}>{p.label}</span>
              <span style={{ color: '#fff', fontWeight: 700, whiteSpace: 'nowrap' }}>
                {total > 0 ? `${Math.round((p.amount / total) * 100)}%` : '—'}
              </span>
            </span>
          ))}
        </span>
      )}
      <span style={{ display: 'block', marginTop: 8, paddingTop: 7, borderTop: '1px solid rgba(255,255,255,.16)', color: '#cbd9e6' }}>
        <strong style={{ color: '#fff' }}>“Leave &amp; termination buy-outs” is mixed.</strong> It holds sick and
        vacation buy-backs — the accrued leave the Town owes — together with severance and health-insurance opt-out
        buy-backs, which are not leave at all. In 2023 sick and vacation buy-backs were about 44% of that line.
      </span>
      <span style={{ display: 'block', marginTop: 6, color: '#9fb6ca' }}>
        Click any row for that person&apos;s exact line-by-line breakdown.
      </span>
    </>
  )
}

// The Town's export only carries title/department from 2022 on. Earlier years
// are carried back from the same person's other years where every observed value
// agreed — shown in italic with a dotted underline so an inference never reads
// as something the Town reported for that year.
function Inferred({ value, inferred }: { value: string; inferred: boolean }) {
  if (!value) return <>—</>
  if (!inferred) return <>{value}</>
  return (
    <span
      title="Not reported for this year — carried back from another year in which this person held this same title, unchanged."
      style={{ fontStyle: 'italic', color: '#64748b', borderBottom: '1px dotted #94a3b8', cursor: 'help' }}
    >
      {value}
      <span aria-hidden style={{ color: '#94a3b8', fontWeight: 700 }}> ·carried</span>
    </span>
  )
}

const th = { padding: '8px 9px' } as const
const td = { padding: '7px 9px' } as const
const nameBtn = { background: 'none', border: 'none', color: '#284a69', fontWeight: 700, cursor: 'pointer', padding: 0, font: 'inherit', textAlign: 'left' as const }

function SortTh({
  label, active, onClick, tip,
}: { label: string; active: boolean; onClick: () => void; tip?: { heading: string; body: React.ReactNode } }) {
  const button = (
    <button onClick={onClick} style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 800, color: active ? '#4a7297' : '#64748b', font: 'inherit' }}>
      {label}{active ? ' ▾' : ''}
    </button>
  )
  return (
    <th style={{ ...th, textAlign: 'right' }}>
      {tip ? (
        // The sort button and the tooltip trigger are siblings, not nested — a
        // button inside a button is invalid, and the tip's own click handler
        // stops propagation so opening it never triggers a re-sort.
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
          <InfoTip label={button} heading={tip.heading} align="right">{tip.body}</InfoTip>
        </span>
      ) : button}
    </th>
  )
}

function Stat({ label, value, sub, accent, amber }: { label: string; value: string; sub?: string; accent?: boolean; amber?: boolean }) {
  return (
    <div style={{ background: amber ? '#fff7ed' : accent ? '#dbeafe' : '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 12 }}>
      <div style={{ color: '#64748b', fontSize: 11.5, textTransform: 'uppercase', fontWeight: 900, letterSpacing: 0.4 }}>{label}</div>
      <strong style={{ fontSize: 19, color: amber ? '#b45309' : '#284a69' }}>{value}</strong>
      {sub && <div style={{ color: '#6b7280', fontSize: 11.5, marginTop: 2 }}>{sub}</div>}
    </div>
  )
}
