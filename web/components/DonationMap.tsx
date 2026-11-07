'use client'

import { useState } from 'react'

// Where one committee's itemized contributions came from, by ZIP code. Pick a
// committee and a year (or every year), then point at, tap or tab to a ZIP code
// area to read it. Money from outside the area drawn is in the breakdown and
// the table, which carry every figure the colors show.

export type DonationZip = { zip: string; place: string | null; riverheadShare: number; path: string; x: number; y: number }
export type DonationCommitteeData = { name: string; label: string; years: string[]; byYear: Record<string, Record<string, [number, number]>> }

const SEQ = ['var(--rbl-map-seq-1)', 'var(--rbl-map-seq-2)', 'var(--rbl-map-seq-3)', 'var(--rbl-map-seq-4)', 'var(--rbl-map-seq-5)']
const usd = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
const pct = (v: number) => `${(v * 100).toFixed(1)}%`
const num = (n: number) => n.toLocaleString('en-US')

export default function DonationMap({
  zips, townPaths, committees, zipInfo, riverheadZips, bands, width, height,
}: {
  zips: DonationZip[]
  townPaths: string[]
  committees: DonationCommitteeData[]
  zipInfo: Record<string, { place: string; state: string }>
  riverheadZips: string[]
  bands: number[]
  width: number
  height: number
}) {
  const [name, setName] = useState(committees[0].name)
  const committee = committees.find((c) => c.name === name) ?? committees[0]
  const [period, setPeriod] = useState('all')
  const [active, setActive] = useState<string | null>(null)
  const years = period === 'all' ? committee.years : committee.years.filter((y) => y === period)

  // Money by ZIP for the chosen committee and years.
  const byZip: Record<string, [number, number]> = {}
  for (const y of years) for (const [z, [amt, n]] of Object.entries(committee.byYear[y] ?? {})) {
    const cell = (byZip[z] ??= [0, 0])
    cell[0] += amt
    cell[1] += n
  }
  const total = Object.values(byZip).reduce((s, [a]) => s + a, 0)
  const items = Object.values(byZip).reduce((s, [, n]) => s + n, 0)
  const groups = [
    { key: 'riverhead', label: 'ZIP codes that reach into Riverhead', test: (z: string) => riverheadZips.includes(z) },
    { key: 'ny', label: 'Elsewhere in New York', test: (z: string) => z !== 'unknown' && !riverheadZips.includes(z) && zipInfo[z]?.state === 'NY' },
    { key: 'other', label: 'Other states', test: (z: string) => z !== 'unknown' && !riverheadZips.includes(z) && zipInfo[z]?.state !== 'NY' },
    { key: 'none', label: 'No ZIP code filed', test: (z: string) => z === 'unknown' },
  ].map((g) => {
    const rows = Object.entries(byZip).filter(([z]) => g.test(z))
    return { ...g, amount: rows.reduce((s, [, [a]]) => s + a, 0), count: rows.reduce((s, [, [, n]]) => s + n, 0) }
  })
  const top = Object.entries(byZip).filter(([z]) => z !== 'unknown').sort((a, b) => b[1][0] - a[1][0]).slice(0, 15)
  const binOf = (amt: number) => bands.filter((b) => amt >= b).length
  const fill = (z: string) => (byZip[z]?.[0] ? SEQ[binOf(byZip[z][0])] : 'var(--rbl-map-neutral)')
  const placeOf = (z: string) => zipInfo[z] ? `${zipInfo[z].place}${zipInfo[z].state && zipInfo[z].state !== 'NY' ? `, ${zipInfo[z].state}` : ''}` : ''
  const legend = [`under ${usd(bands[0])}`, ...bands.slice(0, -1).map((b, i) => `${usd(b)} to ${usd(bands[i + 1])}`), `${usd(bands[bands.length - 1])} or more`]
  const activeShape = zips.find((z) => z.zip === active)

  const label = { display: 'block', fontSize: 13.5, fontWeight: 700, color: 'var(--rbl-text-muted)', marginBottom: 4 } as const
  const select = { minHeight: 40, padding: '6px 10px', borderRadius: 8, border: '1px solid var(--rbl-border)', background: 'var(--rbl-surface)', color: 'var(--rbl-text-strong)', fontSize: 15, width: '100%' } as const
  const field = { flex: '1 1 240px', minWidth: 0, maxWidth: 420 } as const
  const th = { padding: '8px 10px', textAlign: 'left', fontWeight: 600, fontSize: 13, color: 'var(--rbl-text-muted)' } as const
  const td = { padding: '7px 10px', verticalAlign: 'top' } as const

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'flex-end', marginBottom: 12 }}>
        <label style={field}>
          <span style={label}>Committee</span>
          <select value={name} onChange={(e) => { setName(e.target.value); setPeriod('all'); setActive(null) }} style={select}>
            {committees.map((c) => <option key={c.name} value={c.name}>{c.label}</option>)}
          </select>
        </label>
        <label style={{ ...field, maxWidth: 260 }}>
          <span style={label}>Year</span>
          <select value={period} onChange={(e) => setPeriod(e.target.value)} style={select}>
            <option value="all">Every year ({committee.years[0]}–{committee.years[committee.years.length - 1]})</option>
            {[...committee.years].reverse().map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </label>
      </div>
      <p style={{ margin: '0 0 12px', color: 'var(--rbl-text-body)', fontSize: 15.5 }}>
        {committee.label}: <strong>{usd(total)}</strong> in {num(items)} itemized contributions
        {period === 'all' ? `, ${committee.years[0]} to ${committee.years[committee.years.length - 1]}` : ` in ${period}`}.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: 16, alignItems: 'start' }}>
        <div style={{ gridColumn: 'span 2', minWidth: 0 }}>
          <svg viewBox={`-4 -4 ${width + 8} ${height + 8}`} role="group" aria-label={`Map of ZIP code areas around Riverhead: ${committee.label}'s itemized contributions`} style={{ width: '100%', height: 'auto', display: 'block' }}>
            {zips.map((z) => (
              <path
                key={z.zip}
                d={z.path}
                tabIndex={0}
                role="img"
                aria-label={`ZIP code ${z.zip}${z.place ? `, ${z.place}` : ''}: ${usd(byZip[z.zip]?.[0] ?? 0)} in ${num(byZip[z.zip]?.[1] ?? 0)} contributions.`}
                onMouseEnter={() => setActive(z.zip)}
                onFocus={() => setActive(z.zip)}
                onClick={() => setActive(z.zip)}
                onMouseDown={(e) => e.preventDefault()}
                style={{ fill: fill(z.zip), stroke: 'var(--rbl-map-edge)', strokeWidth: 1.2, cursor: 'pointer', strokeLinejoin: 'round' }}
              />
            ))}
            {townPaths.map((d, i) => <path key={i} d={d} style={{ fill: 'none', stroke: 'var(--rbl-text-strong)', strokeOpacity: 0.35, strokeWidth: 0.8, pointerEvents: 'none' }} />)}
            {activeShape && <path d={activeShape.path} style={{ fill: 'none', stroke: 'var(--rbl-text-strong)', strokeWidth: 2.5, pointerEvents: 'none' }} />}
            {zips.filter((z) => riverheadZips.includes(z.zip)).map((z) => (
              <text key={z.zip} x={z.x} y={z.y} textAnchor="middle" dominantBaseline="central" style={{ fontSize: 13, fontWeight: 700, fill: 'var(--rbl-text-strong)', stroke: 'var(--rbl-surface)', strokeWidth: 3, paintOrder: 'stroke', pointerEvents: 'none' }}>{z.zip}</text>
            ))}
          </svg>
          <p style={{ margin: '6px 0 0', color: 'var(--rbl-text-muted)', fontSize: 13.5 }}>
            Point at, tap or tab to a ZIP code area. The thin lines inside are Riverhead&apos;s election districts, which outline the Town.
          </p>
        </div>
        <div>
          <div aria-live="polite" style={{ background: 'var(--rbl-surface-2)', borderRadius: 12, padding: 14, marginBottom: 12, minHeight: 96 }}>
            {active ? (
              <>
                <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--rbl-title)' }}>{active}{placeOf(active) ? <span style={{ fontWeight: 400, color: 'var(--rbl-text-muted)' }}> · {placeOf(active)}</span> : null}</div>
                <p style={{ margin: '6px 0 0', fontSize: 15, color: 'var(--rbl-text-body)' }}>
                  <strong>{usd(byZip[active]?.[0] ?? 0)}</strong> in {num(byZip[active]?.[1] ?? 0)} contributions
                  {total ? `, ${pct((byZip[active]?.[0] ?? 0) / total)} of the total` : ''}.
                </p>
              </>
            ) : (
              <p style={{ margin: 0, color: 'var(--rbl-text-muted)', fontSize: 15 }}>Choose a ZIP code area on the map to see its total here.</p>
            )}
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--rbl-text-strong)', marginBottom: 4 }}>Itemized contributions from the ZIP code</div>
          <ul style={{ listStyle: 'none', margin: '0 0 14px', padding: 0, display: 'grid', gap: 3 }}>
            <li style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}><span aria-hidden="true" style={{ width: 22, height: 14, borderRadius: 3, background: 'var(--rbl-map-neutral)', border: '1px solid var(--rbl-border)' }} />none</li>
            {SEQ.map((c, i) => (
              <li key={c} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}><span aria-hidden="true" style={{ width: 22, height: 14, borderRadius: 3, background: c, border: '1px solid var(--rbl-border)' }} />{legend[i]}</li>
            ))}
          </ul>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--rbl-text-strong)', marginBottom: 6 }}>Where the money came from</div>
          {groups.map((g) => (
            <div key={g.key} style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 14.5, color: 'var(--rbl-text-body)' }}>
                <span>{g.label}</span>
                <span style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{usd(g.amount)} · {total ? pct(g.amount / total) : '—'}</span>
              </div>
              <div aria-hidden="true" style={{ height: 8, borderRadius: 4, background: 'var(--rbl-surface-2)', overflow: 'hidden', marginTop: 3 }}>
                <div style={{ width: `${total ? (g.amount / total) * 100 : 0}%`, height: '100%', background: 'var(--rbl-map-seq-4)' }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <details style={{ marginTop: 14 }}>
        <summary style={{ cursor: 'pointer', color: 'var(--rbl-link)', fontWeight: 600, minHeight: 24 }}>Table: the {top.length} ZIP codes that gave the most</summary>
        <div style={{ overflowX: 'auto', marginTop: 8 }}>
          <table className="rbl-stack" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14.5 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--rbl-border)' }}>
                <th scope="col" style={th}>ZIP code</th>
                <th scope="col" style={th}>Place on the filings</th>
                <th scope="col" style={{ ...th, textAlign: 'right' }}>Amount</th>
                <th scope="col" style={{ ...th, textAlign: 'right' }}>Contributions</th>
                <th scope="col" style={{ ...th, textAlign: 'right' }}>Share</th>
              </tr>
            </thead>
            <tbody>
              {top.map(([z, [amt, n]]) => (
                <tr key={z} style={{ borderBottom: '1px solid var(--rbl-border-subtle)' }}>
                  <th scope="row" style={{ ...td, fontWeight: 600, textAlign: 'left' }}>{z}</th>
                  <td data-label="Place on the filings" style={td}>{placeOf(z) || '—'}</td>
                  <td data-label="Amount" style={{ ...td, textAlign: 'right' }}>{usd(amt)}</td>
                  <td data-label="Contributions" style={{ ...td, textAlign: 'right' }}>{num(n)}</td>
                  <td data-label="Share" style={{ ...td, textAlign: 'right' }}>{total ? pct(amt / total) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  )
}
