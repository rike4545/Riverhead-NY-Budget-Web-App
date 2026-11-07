'use client'

import { useMemo, useState } from 'react'

// An election-district map of Riverhead: pick a contest and a view, then point
// at or tap a district (or move through them with the keyboard) to read its
// votes. The table below the map carries every figure the colors show.

export type MapDistrict = { ed: string; label: string; area: string | null; path: string; x: number; y: number }
export type MapCandidate = { name: string; display: string; party: string; votes: number }
export type MapContest = {
  key: string
  name: string
  election: string
  official: boolean
  voteFor: number
  url: string
  candidates: MapCandidate[]
  total: number
  districts: Record<string, { total: number; votes: Record<string, number> }>
}
export type MapComparison = { key: string; label: string; higher: string; lower: string; explain: string; values: Record<string, number> }

type View = 'lead' | 'share' | 'votes' | 'compare'

const RAMP: Record<string, string[]> = {
  DEM: ['var(--rbl-map-dem-1)', 'var(--rbl-map-dem-2)', 'var(--rbl-map-dem-3)', 'var(--rbl-map-dem-4)'],
  REP: ['var(--rbl-map-rep-1)', 'var(--rbl-map-rep-2)', 'var(--rbl-map-rep-3)', 'var(--rbl-map-rep-4)'],
  other: ['var(--rbl-map-other-1)', 'var(--rbl-map-other-2)', 'var(--rbl-map-other-3)', 'var(--rbl-map-other-4)'],
}
const SEQ = ['var(--rbl-map-seq-1)', 'var(--rbl-map-seq-2)', 'var(--rbl-map-seq-3)', 'var(--rbl-map-seq-4)', 'var(--rbl-map-seq-5)']
const ramp = (party: string) => RAMP[party] ?? RAMP.other
const partyName = (p: string) => (p === 'DEM' ? 'Democrat' : p === 'REP' ? 'Republican' : p === 'BOTH' ? 'Both major parties' : p || 'Other')
/** Margin bins, in points of the district's votes. */
const LEAD_BINS = [5, 15, 25]
/** Change bins for a comparison, in points. */
const SHIFT_BINS = [5, 10]

const pct = (v: number, d = 1) => `${(v * 100).toFixed(d)}%`
const pts = (v: number) => `${v >= 0 ? '+' : '−'}${Math.abs(v * 100).toFixed(1)} points`
const num = (n: number) => n.toLocaleString('en-US')
const binOf = (v: number, bins: number[]) => bins.filter((b) => v * 100 >= b).length

/** Five equal steps between the lowest and highest value, for share and votes. */
function steps(values: number[]) {
  const lo = Math.min(...values), hi = Math.max(...values)
  const w = (hi - lo) / 5 || 1
  return { lo, hi, w, at: (v: number) => Math.min(4, Math.floor((v - lo) / w)) }
}

export default function ElectionMap({
  districts, contests, comparisons, width, height,
}: { districts: MapDistrict[]; contests: MapContest[]; comparisons: MapComparison[]; width: number; height: number }) {
  const [contestKey, setContestKey] = useState(contests[0].key)
  const [view, setView] = useState<View>('lead')
  const contest = contests.find((c) => c.key === contestKey) ?? contests[0]
  const named = contest.candidates.filter((c) => c.name !== 'Write-in')
  const [candidate, setCandidate] = useState(named[0].name)
  const cand = named.find((c) => c.name === candidate) ?? named[0]
  const [cmpKey, setCmpKey] = useState(comparisons[0].key)
  const cmp = comparisons.find((c) => c.key === cmpKey) ?? comparisons[0]
  const [active, setActive] = useState<string | null>(null)
  const multi = contest.voteFor > 1
  const effectiveView: View = view === 'lead' && multi ? 'share' : view

  const pickContest = (key: string) => {
    setContestKey(key)
    const next = contests.find((c) => c.key === key)!
    if (!next.candidates.some((c) => c.name === candidate)) setCandidate(next.candidates[0].name)
  }

  const shareOf = (ed: string, name: string) => {
    const d = contest.districts[ed]
    return d && d.total ? (d.votes[name] ?? 0) / d.total : 0
  }
  const leadOf = (ed: string) => {
    const d = contest.districts[ed]
    const r = named.map((c) => ({ c, v: d.votes[c.name] ?? 0 })).sort((a, b) => b.v - a.v)
    return { c: r[0].c, margin: d.total ? (r[0].v - (r[1]?.v ?? 0)) / d.total : 0, tie: r.length > 1 && r[0].v === r[1].v }
  }

  const shareSteps = useMemo(() => steps(districts.map((d) => shareOf(d.ed, cand.name))), [contestKey, cand.name]) // eslint-disable-line react-hooks/exhaustive-deps
  const voteSteps = useMemo(() => steps(districts.map((d) => contest.districts[d.ed]?.total ?? 0)), [contestKey]) // eslint-disable-line react-hooks/exhaustive-deps

  const fill = (ed: string) => {
    if (effectiveView === 'lead') {
      const l = leadOf(ed)
      return l.tie ? 'var(--rbl-map-neutral)' : ramp(l.c.party)[binOf(l.margin, LEAD_BINS)]
    }
    if (effectiveView === 'share') {
      const r = ramp(cand.party)
      const i = shareSteps.at(shareOf(ed, cand.name))
      return i === 0 ? 'var(--rbl-map-neutral)' : r[i - 1]
    }
    if (effectiveView === 'votes') return SEQ[voteSteps.at(contest.districts[ed]?.total ?? 0)]
    const v = cmp.values[ed] ?? 0
    if (Math.abs(v * 100) < 1) return 'var(--rbl-map-neutral)'
    return (v > 0 ? RAMP.DEM : RAMP.REP)[binOf(Math.abs(v), SHIFT_BINS)]
  }

  const describe = (ed: string) => {
    const d = contest.districts[ed]
    if (effectiveView === 'compare') return `${cmp.label}: ${pts(cmp.values[ed] ?? 0)}`
    if (effectiveView === 'votes') return `${num(d.total)} votes for ${contest.name}`
    if (effectiveView === 'share') return `${cand.display}: ${pct(shareOf(ed, cand.name))} of the votes`
    const l = leadOf(ed)
    return l.tie ? 'Tied' : `${l.c.display} led by ${(l.margin * 100).toFixed(1)} points`
  }

  const legend = (() => {
    if (effectiveView === 'lead') {
      const parties = named.map((c) => c.party).filter((x, i, a) => a.indexOf(x) === i)
      const labels = ['under 5 points', '5 to 15', '15 to 25', '25 or more']
      return parties.map((p) => ({ title: `${named.filter((c) => c.party === p).map((c) => c.display).join(', ')} led by`, items: ramp(p).map((color, i) => ({ color, label: labels[i] })) }))
    }
    if (effectiveView === 'share') {
      const r = ramp(cand.party)
      const s = shareSteps
      return [{ title: `${cand.display}’s share of the district’s votes`, items: [0, 1, 2, 3, 4].map((i) => ({ color: i === 0 ? 'var(--rbl-map-neutral)' : r[i - 1], label: `${pct(s.lo + i * s.w, 0)} to ${pct(s.lo + (i + 1) * s.w, 0)}` })) }]
    }
    if (effectiveView === 'votes') {
      const s = voteSteps
      return [{ title: 'Votes cast in the district for this office', items: SEQ.map((color, i) => ({ color, label: `${num(Math.round(s.lo + i * s.w))} to ${num(Math.round(s.lo + (i + 1) * s.w))}` })) }]
    }
    return [
      { title: cmp.higher, items: [{ color: RAMP.DEM[0], label: '1 to 5 points' }, { color: RAMP.DEM[1], label: '5 to 10' }, { color: RAMP.DEM[2], label: '10 or more' }] },
      { title: cmp.lower, items: [{ color: RAMP.REP[0], label: '1 to 5 points' }, { color: RAMP.REP[1], label: '5 to 10' }, { color: RAMP.REP[2], label: '10 or more' }] },
      { title: 'About the same', items: [{ color: 'var(--rbl-map-neutral)', label: 'within 1 point' }] },
    ]
  })()

  const activeEd = active ?? null
  const activeShape = districts.find((d) => d.ed === activeEd)
  const groups = contests.map((c) => c.election).filter((x, i, a) => a.indexOf(x) === i)
  const btn = (on: boolean) => ({
    minHeight: 36, padding: '6px 12px', borderRadius: 999, border: `1px solid ${on ? 'var(--rbl-link)' : 'var(--rbl-border)'}`,
    background: on ? 'var(--rbl-link)' : 'var(--rbl-surface)', color: on ? 'var(--rbl-on-series)' : 'var(--rbl-text-strong)', fontWeight: 600, fontSize: 14.5, cursor: 'pointer',
  }) as const
  const label = { display: 'block', fontSize: 13.5, fontWeight: 700, color: 'var(--rbl-text-muted)', marginBottom: 4 } as const
  const select = { minHeight: 40, padding: '6px 10px', borderRadius: 8, border: '1px solid var(--rbl-border)', background: 'var(--rbl-surface)', color: 'var(--rbl-text-strong)', fontSize: 15, width: '100%' } as const
  const field = { flex: '1 1 240px', minWidth: 0, maxWidth: 420 } as const

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'flex-end', marginBottom: 12 }}>
        <div role="group" aria-label="What the colors show" style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {([['lead', 'Who led'], ['share', 'A candidate’s share'], ['votes', 'Votes cast'], ['compare', 'Compare']] as const).map(([v, t]) => (
            <button key={v} type="button" aria-pressed={view === v} onClick={() => setView(v)} style={btn(view === v)}>{t}</button>
          ))}
        </div>
        {view !== 'compare' ? (
          <label style={field}>
            <span style={label}>Contest</span>
            <select value={contestKey} onChange={(e) => pickContest(e.target.value)} style={select}>
              {groups.map((g) => (
                <optgroup key={g} label={g}>
                  {contests.filter((c) => c.election === g).map((c) => <option key={c.key} value={c.key}>{c.name}</option>)}
                </optgroup>
              ))}
            </select>
          </label>
        ) : (
          <label style={field}>
            <span style={label}>Comparison</span>
            <select value={cmpKey} onChange={(e) => setCmpKey(e.target.value)} style={select}>
              {comparisons.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
            </select>
          </label>
        )}
        {effectiveView === 'share' && (
          <label style={field}>
            <span style={label}>Candidate</span>
            <select value={cand.name} onChange={(e) => setCandidate(e.target.value)} style={select}>
              {named.map((c) => <option key={c.name} value={c.name}>{c.display}</option>)}
            </select>
          </label>
        )}
      </div>
      {view === 'lead' && multi && (
        <p style={{ margin: '0 0 10px', color: 'var(--rbl-text-muted)', fontSize: 14.5 }}>
          Voters could choose {contest.voteFor} candidates for this office, so the map shows one candidate&apos;s share instead of a single leader.
        </p>
      )}
      <p style={{ margin: '0 0 10px', color: 'var(--rbl-text-body)', fontSize: 15 }}>
        {effectiveView === 'compare' ? cmp.explain : `${contest.election}: ${contest.name}. ${contest.official ? 'Certified results.' : 'The County’s unofficial count.'}`}
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: 16, alignItems: 'start' }}>
        <div style={{ gridColumn: 'span 2', minWidth: 0 }}>
          <svg viewBox={`-6 -6 ${width + 12} ${height + 12}`} role="group" aria-label={`Map of Riverhead's 22 election districts: ${effectiveView === 'compare' ? cmp.label : contest.name}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
            {districts.map((d) => (
              <path
                key={d.ed}
                d={d.path}
                tabIndex={0}
                role="img"
                aria-label={`District ${d.label}${d.area ? `, ${d.area}` : ''}. ${describe(d.ed)}.`}
                onMouseEnter={() => setActive(d.ed)}
                onFocus={() => setActive(d.ed)}
                onClick={() => setActive(d.ed)}
                onMouseDown={(e) => e.preventDefault()}
                style={{ fill: fill(d.ed), stroke: activeEd === d.ed ? 'var(--rbl-text-strong)' : 'var(--rbl-map-edge)', strokeWidth: activeEd === d.ed ? 3 : 1.5, cursor: 'pointer', strokeLinejoin: 'round' }}
              />
            ))}
            {activeShape && <path d={activeShape.path} style={{ fill: 'none', stroke: 'var(--rbl-text-strong)', strokeWidth: 3, pointerEvents: 'none' }} />}
            {districts.map((d) => (
              <text key={d.ed} x={d.x} y={d.y} textAnchor="middle" dominantBaseline="central" style={{ fontSize: 15, fontWeight: 700, fill: 'var(--rbl-text-strong)', stroke: 'var(--rbl-surface)', strokeWidth: 3.5, paintOrder: 'stroke', pointerEvents: 'none' }}>{d.label}</text>
            ))}
          </svg>
          <p style={{ margin: '6px 0 0', color: 'var(--rbl-text-muted)', fontSize: 13.5 }}>Point at, tap or tab to a district to read its votes. The numbers are the Board of Elections&apos; district numbers.</p>
        </div>

        <div>
          <div aria-live="polite" style={{ background: 'var(--rbl-surface-2)', borderRadius: 12, padding: 14, marginBottom: 12, minHeight: 120 }}>
            {activeEd && contest.districts[activeEd] ? (
              <DistrictPanel ed={activeEd} area={activeShape?.area ?? null} contest={contest} compare={effectiveView === 'compare' ? cmp : null} />
            ) : (
              <p style={{ margin: 0, color: 'var(--rbl-text-muted)', fontSize: 15 }}>Choose a district on the map to see its votes here.</p>
            )}
          </div>
          {legend.map((g) => (
            <div key={g.title} style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--rbl-text-strong)', marginBottom: 4 }}>{g.title}</div>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 3 }}>
                {g.items.map((it) => (
                  <li key={it.label + it.color} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: 'var(--rbl-text-body)' }}>
                    <span aria-hidden="true" style={{ width: 22, height: 14, borderRadius: 3, background: it.color, border: '1px solid var(--rbl-border)' }} />
                    {it.label}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <details style={{ marginTop: 14 }}>
        <summary style={{ cursor: 'pointer', color: 'var(--rbl-link)', fontWeight: 600, minHeight: 24 }}>
          {effectiveView === 'compare' ? `Table: ${cmp.label}, district by district` : `Table: ${contest.name}, district by district`}
        </summary>
        <div style={{ overflowX: 'auto', marginTop: 8 }}>
          {effectiveView === 'compare' ? (
            <table className="rbl-stack" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14.5 }}>
              <thead><tr style={{ borderBottom: '1px solid var(--rbl-border)' }}><th scope="col" style={th}>District</th><th scope="col" style={{ ...th, textAlign: 'right' }}>Change</th></tr></thead>
              <tbody>
                {districts.map((d) => (
                  <tr key={d.ed} style={{ borderBottom: '1px solid var(--rbl-border-subtle)' }}>
                    <th scope="row" style={{ ...td, fontWeight: 600 }}>{d.label}{d.area ? ` (${d.area})` : ''}</th>
                    <td data-label="Change" style={{ ...td, textAlign: 'right' }}>{pts(cmp.values[d.ed] ?? 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="rbl-stack" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14.5 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--rbl-border)' }}>
                  <th scope="col" style={th}>District</th>
                  {contest.candidates.map((c) => <th key={c.name} scope="col" style={{ ...th, textAlign: 'right' }}>{c.display}</th>)}
                  <th scope="col" style={{ ...th, textAlign: 'right' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {districts.map((d) => {
                  const r = contest.districts[d.ed]
                  return (
                    <tr key={d.ed} style={{ borderBottom: '1px solid var(--rbl-border-subtle)' }}>
                      <th scope="row" style={{ ...td, fontWeight: 600 }}>{d.label}{d.area ? ` (${d.area})` : ''}</th>
                      {contest.candidates.map((c) => (
                        <td key={c.name} data-label={c.display} style={{ ...td, textAlign: 'right' }}>{num(r.votes[c.name] ?? 0)} <span style={{ color: 'var(--rbl-text-muted)' }}>({pct(r.total ? (r.votes[c.name] ?? 0) / r.total : 0)})</span></td>
                      ))}
                      <td data-label="Total" style={{ ...td, textAlign: 'right', fontWeight: 600 }}>{num(r.total)}</td>
                    </tr>
                  )
                })}
                <tr style={{ borderTop: '2px solid var(--rbl-border)' }}>
                  <th scope="row" style={{ ...td, fontWeight: 700 }}>Town</th>
                  {contest.candidates.map((c) => <td key={c.name} data-label={c.display} style={{ ...td, textAlign: 'right', fontWeight: 700 }}>{num(c.votes)} <span style={{ color: 'var(--rbl-text-muted)', fontWeight: 400 }}>({pct(contest.total ? c.votes / contest.total : 0)})</span></td>)}
                  <td data-label="Total" style={{ ...td, textAlign: 'right', fontWeight: 700 }}>{num(contest.total)}</td>
                </tr>
              </tbody>
            </table>
          )}
        </div>
      </details>
    </div>
  )
}

const th = { padding: '8px 10px', textAlign: 'left', fontWeight: 600, fontSize: 13, color: 'var(--rbl-text-muted)', verticalAlign: 'bottom' } as const
const td = { padding: '7px 10px', verticalAlign: 'top', whiteSpace: 'nowrap' } as const

function DistrictPanel({ ed, area, contest, compare }: { ed: string; area: string | null; contest: MapContest; compare: MapComparison | null }) {
  const d = contest.districts[ed]
  return (
    <div>
      <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--rbl-title)' }}>District {Number(ed)}{area ? <span style={{ fontWeight: 400, color: 'var(--rbl-text-muted)' }}> · {area}</span> : null}</div>
      {compare ? (
        <p style={{ margin: '6px 0 0', fontSize: 15, color: 'var(--rbl-text-body)' }}>{compare.label}: <strong>{pts(compare.values[ed] ?? 0)}</strong></p>
      ) : (
        <ul style={{ listStyle: 'none', margin: '6px 0 0', padding: 0, display: 'grid', gap: 4 }}>
          {contest.candidates.map((c) => (
            <li key={c.name} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 15, color: 'var(--rbl-text-body)' }}>
              <span>{c.display}{c.party && c.name !== 'Write-in' ? <span style={{ color: 'var(--rbl-text-muted)' }}> ({partyName(c.party)})</span> : null}</span>
              <span style={{ whiteSpace: 'nowrap', fontWeight: 600 }}>{num(d.votes[c.name] ?? 0)} · {pct(d.total ? (d.votes[c.name] ?? 0) / d.total : 0)}</span>
            </li>
          ))}
          <li style={{ fontSize: 14, color: 'var(--rbl-text-muted)' }}>{num(d.total)} votes for this office</li>
        </ul>
      )}
    </div>
  )
}
