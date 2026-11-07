'use client'

import { useState } from 'react'

// Riverhead's preserved farmland, parcel by parcel, over the Town's election
// districts. Color by who holds the development rights or by when the sale
// closed; point at, tap or tab to a parcel to read it.

export type Parcel = { id: number; holder: string; classification: string | null; acres: number; year: number | null; hamlet: string | null; path: string }

const HOLDER_COLOR: Record<string, string> = {
  Town: 'var(--rbl-series-blue)',
  'County and Town': 'var(--rbl-series-indigo)',
  County: 'var(--rbl-series-teal)',
  State: 'var(--rbl-series-gold)',
  Other: 'var(--rbl-series-slate)',
}
const ERAS = [
  { label: 'Before 1990', test: (y: number) => y < 1990 },
  { label: '1990s', test: (y: number) => y >= 1990 && y < 2000 },
  { label: '2000s', test: (y: number) => y >= 2000 && y < 2010 },
  { label: '2010s', test: (y: number) => y >= 2010 && y < 2020 },
  { label: '2020 on', test: (y: number) => y >= 2020 },
]
const SEQ = ['var(--rbl-map-seq-1)', 'var(--rbl-map-seq-2)', 'var(--rbl-map-seq-3)', 'var(--rbl-map-seq-4)', 'var(--rbl-map-seq-5)']
const acresFmt = (n: number) => `${n.toLocaleString('en-US', { maximumFractionDigits: n < 10 ? 1 : 0 })} acres`

export default function PreservedLandMap({ parcels, townPaths, holders, width, height }: { parcels: Parcel[]; townPaths: string[]; holders: string[]; width: number; height: number }) {
  const [view, setView] = useState<'holder' | 'era'>('holder')
  const [active, setActive] = useState<number | null>(null)
  const eraOf = (y: number | null) => (y == null ? -1 : ERAS.findIndex((e) => e.test(y)))
  const fill = (p: Parcel) => (view === 'holder' ? HOLDER_COLOR[p.holder] : eraOf(p.year) < 0 ? 'var(--rbl-map-neutral)' : SEQ[eraOf(p.year)])
  const a = parcels.find((p) => p.id === active)
  const btn = (on: boolean) => ({
    minHeight: 36, padding: '6px 12px', borderRadius: 999, border: `1px solid ${on ? 'var(--rbl-link)' : 'var(--rbl-border)'}`,
    background: on ? 'var(--rbl-link)' : 'var(--rbl-surface)', color: on ? 'var(--rbl-on-series)' : 'var(--rbl-text-strong)', fontWeight: 600, fontSize: 14.5, cursor: 'pointer',
  }) as const
  const legend = view === 'holder'
    ? holders.map((h) => ({ color: HOLDER_COLOR[h], label: h === 'Other' ? 'Other (private and not-for-profit easements, subdivision reserves)' : h }))
    : [...ERAS.map((e, i) => ({ color: SEQ[i], label: e.label })), { color: 'var(--rbl-map-neutral)', label: 'No closing date recorded' }]

  return (
    <div>
      <div role="group" aria-label="What the colors show" style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
        <button type="button" aria-pressed={view === 'holder'} onClick={() => setView('holder')} style={btn(view === 'holder')}>Who holds the rights</button>
        <button type="button" aria-pressed={view === 'era'} onClick={() => setView('era')} style={btn(view === 'era')}>When it was preserved</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: 16, alignItems: 'start' }}>
        <div style={{ gridColumn: 'span 2', minWidth: 0 }}>
          <svg viewBox={`-6 -6 ${width + 12} ${height + 12}`} role="img" aria-label={`Map of Riverhead's ${parcels.length} preserved farmland parcels. The table under the map lists each one.`} style={{ width: '100%', height: 'auto', display: 'block' }}>
            {townPaths.map((d, i) => <path key={i} d={d} style={{ fill: 'var(--rbl-surface-2)', stroke: 'var(--rbl-border)', strokeWidth: 0.8 }} />)}
            {parcels.map((p) => (
              <path
                key={p.id}
                d={p.path}
                // Parcels are too small to be keyboard or touch targets at 24px; the table under the map is the equivalent.
                onMouseEnter={() => setActive(p.id)}
                onClick={() => setActive(p.id)}
                style={{ fill: fill(p), fillRule: 'evenodd', stroke: active === p.id ? 'var(--rbl-text-strong)' : 'var(--rbl-surface)', strokeWidth: active === p.id ? 2 : 0.4, cursor: 'pointer' }}
              />
            ))}
          </svg>
          <p style={{ margin: '6px 0 0', color: 'var(--rbl-text-muted)', fontSize: 13.5 }}>
            Point at or tap a parcel, or use the table under the map. The gray background is the Town, drawn from its election districts.
          </p>
        </div>
        <div>
          <div aria-live="polite" style={{ background: 'var(--rbl-surface-2)', borderRadius: 12, padding: 14, marginBottom: 12, minHeight: 96 }}>
            {a ? (
              <>
                <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--rbl-title)' }}>{acresFmt(a.acres)}{a.hamlet ? <span style={{ fontWeight: 400, color: 'var(--rbl-text-muted)' }}> · {a.hamlet}</span> : null}</div>
                <p style={{ margin: '6px 0 0', fontSize: 15, color: 'var(--rbl-text-body)' }}>
                  Rights held by: <strong>{a.classification ?? a.holder}</strong>
                  <br />Sale closed: {a.year ?? 'not recorded in the County’s layer'}
                </p>
              </>
            ) : (
              <p style={{ margin: 0, color: 'var(--rbl-text-muted)', fontSize: 15 }}>Choose a parcel on the map to read it here.</p>
            )}
          </div>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 4 }}>
            {legend.map((l) => (
              <li key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: 'var(--rbl-text-body)' }}>
                <span aria-hidden="true" style={{ flex: '0 0 22px', height: 14, borderRadius: 3, background: l.color, border: '1px solid var(--rbl-border)' }} />{l.label}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <details style={{ marginTop: 14 }}>
        <summary style={{ cursor: 'pointer', color: 'var(--rbl-link)', fontWeight: 600, minHeight: 24 }}>Table: every parcel, largest first</summary>
        <div style={{ overflowX: 'auto', marginTop: 8 }}>
          <table className="rbl-stack" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14.5 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--rbl-border)' }}>
                {['Acres', 'Hamlet', 'Rights held by', 'Sale closed'].map((h, i) => <th key={h} scope="col" style={{ padding: '8px 10px', textAlign: i ? 'left' : 'right', fontSize: 13, color: 'var(--rbl-text-muted)', fontWeight: 600 }}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {[...parcels].sort((x, y) => y.acres - x.acres).map((p) => (
                <tr key={p.id} style={{ borderBottom: '1px solid var(--rbl-border-subtle)' }}>
                  <th scope="row" style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 600 }}>{p.acres.toLocaleString('en-US', { maximumFractionDigits: 1 })}</th>
                  <td data-label="Hamlet" style={{ padding: '6px 10px' }}>{p.hamlet ?? '—'}</td>
                  <td data-label="Rights held by" style={{ padding: '6px 10px' }}>{p.classification ?? p.holder}</td>
                  <td data-label="Sale closed" style={{ padding: '6px 10px' }}>{p.year ?? 'not recorded'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  )
}
