'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Pause, Play, RefreshCw } from 'lucide-react'
import type { BudgetChanges, Source } from '../lib/budget-changes'

type Change = BudgetChanges['changes'][number]
type Filter = 'all' | Source | 'not-totalled'

// The four kinds of new money stack in this order, in the series colours that
// pass the colour checks together in this order (dataviz validate_palette.js:
// adjacent pairs at least 19.3 apart for normal vision, 12.2 under colour-blind
// simulation). Money moved between lines is not new money and is not stacked.
const SERIES: { key: Source; label: string; color: string }[] = [
  { key: 'savings', label: 'From savings', color: 'var(--rbl-series-blue)' },
  { key: 'borrowed', label: 'Borrowed', color: 'var(--rbl-series-gold)' },
  { key: 'grants', label: 'Grants, aid and donations', color: 'var(--rbl-series-teal)' },
  { key: 'fees', label: 'Developer fees and other revenue', color: 'var(--rbl-series-indigo)' },
]
const MOVED = { key: 'moved' as Source, label: 'Moved from other lines or funds', color: 'var(--rbl-series-slate)' }
const colorOf = (s: Source) => (SERIES.find((x) => x.key === s) ?? MOVED).color
const labelOf = (s: Source) => (SERIES.find((x) => x.key === s) ?? MOVED).label

const card = { background: 'var(--rbl-surface)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 16, padding: 20 } as const
const dollars = (n: number) => `$${Math.round(n).toLocaleString('en-US')}`
const compact = (n: number) => {
  const m = Math.abs(n)
  if (m >= 1e6) return `$${(n / 1e6).toFixed(m >= 1e7 ? 1 : 2)}M`
  if (m >= 1e4) return `$${Math.round(n / 1e3).toLocaleString('en-US')}K`
  return dollars(n)
}
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const dayOf = (iso: string) => new Date(`${iso}T12:00:00Z`)
const shortDate = (iso: string) => { const d = dayOf(iso); return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}` }
const longDate = (iso: string) => dayOf(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' })

function useReducedMotion() {
  const [reduce, setReduce] = useState(false)
  useEffect(() => {
    const q = window.matchMedia('(prefers-reduced-motion: reduce)')
    const on = () => setReduce(q.matches)
    on()
    q.addEventListener?.('change', on)
    return () => q.removeEventListener?.('change', on)
  }, [])
  return reduce
}

/** A number that eases to each new value instead of jumping, unless motion is reduced. */
function useEased(target: number, reduce: boolean) {
  const [shown, setShown] = useState(target)
  const current = useRef(target)
  useEffect(() => {
    if (reduce) { current.current = target; setShown(target); return }
    const from = current.current
    if (from === target) return
    const start = performance.now()
    let raf = 0
    const tick = (t: number) => {
      const k = Math.min(1, (t - start) / 650)
      const v = from + (target - from) * (1 - Math.pow(1 - k, 3))
      current.current = v
      setShown(v)
      if (k < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, reduce])
  return shown
}

const changeId = (c: Change) => `${c.meetingSlug}:${c.number ?? c.title}`

export default function BudgetChangesDashboard({ initial, base }: { initial: BudgetChanges; base: string }) {
  const reduce = useReducedMotion()
  const [data, setData] = useState(initial)
  const [status, setStatus] = useState<'idle' | 'checking' | 'current' | 'updated' | 'offline'>('idle')
  const [checkedAt, setCheckedAt] = useState<Date | null>(null)
  const [fresh, setFresh] = useState<Set<string>>(new Set())
  const [filter, setFilter] = useState<Filter>('all')
  const [frame, setFrame] = useState<number | null>(null)
  const [now, setNow] = useState(() => Date.now())
  const version = useRef(initial.dataVersion)
  const known = useRef(new Set(initial.changes.map(changeId)))

  // ── Live: re-read the data whenever the site's meeting data moves ──────────
  const check = useRef<() => Promise<void>>(async () => {})
  check.current = async () => {
    setStatus('checking')
    try {
      const meta = await fetch(`${base}/data/meta.json`, { cache: 'no-store' }).then((r) => r.json())
      setCheckedAt(new Date())
      if (meta?.dataVersion && meta.dataVersion !== version.current) {
        const next = (await fetch(`${base}/data/budget-changes.json`, { cache: 'no-store' }).then((r) => r.json())) as BudgetChanges
        if (next?.dataVersion === meta.dataVersion && Array.isArray(next.changes)) {
          const arrived = new Set(next.changes.map(changeId).filter((id) => !known.current.has(id)))
          next.changes.forEach((c) => known.current.add(changeId(c)))
          version.current = next.dataVersion
          setFresh(arrived)
          setData(next)
          setStatus('updated')
          return
        }
      }
      setStatus('current')
    } catch {
      setStatus('offline')
    }
  }
  useEffect(() => {
    const run = () => { if (document.visibilityState === 'visible') void check.current() }
    run()
    const poll = window.setInterval(run, 5 * 60 * 1000)
    const clock = window.setInterval(() => setNow(Date.now()), 30 * 1000)
    document.addEventListener('visibilitychange', run)
    return () => { window.clearInterval(poll); window.clearInterval(clock); document.removeEventListener('visibilitychange', run) }
  }, [])

  // ── Replay: the year meeting by meeting ────────────────────────────────────
  const points = data.byMeeting
  useEffect(() => {
    if (frame === null) return
    if (frame >= points.length) { const t = window.setTimeout(() => setFrame(null), 900); return () => window.clearTimeout(t) }
    const t = window.setTimeout(() => setFrame(frame + 1), 450)
    return () => window.clearTimeout(t)
  }, [frame, points.length])
  const shownPoints = frame === null ? points : points.slice(0, frame)
  const through = shownPoints.length ? shownPoints[shownPoints.length - 1] : null

  const sums = useMemo(() => {
    const t: Record<Source, number> = { savings: 0, borrowed: 0, grants: 0, fees: 0, moved: 0 }
    for (const p of shownPoints) for (const k of Object.keys(t) as Source[]) t[k] += p.bySource[k]
    return t
  }, [shownPoints])
  const added = SERIES.reduce((s, x) => s + sums[x.key], 0)
  const changesShown = shownPoints.reduce((n, p) => n + p.changes, 0)

  const minutesAgo = checkedAt ? Math.max(0, Math.round((now - checkedAt.getTime()) / 60000)) : null
  const statusText =
    status === 'checking' ? 'Checking for new meeting records…'
      : status === 'offline' ? 'Could not reach the site to check for new records; showing what loaded.'
        : status === 'updated' ? 'New records arrived and the figures below were updated.'
          : checkedAt ? `Up to date. Checked ${minutesAgo === 0 ? 'just now' : `${minutesAgo} minute${minutesAgo === 1 ? '' : 's'} ago`}; checks again every 5 minutes while this page is open.`
            : 'Checks for new meeting records every 5 minutes while this page is open.'

  return (
    <div>
      <div data-live-status style={{ ...card, padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 700, color: 'var(--rbl-title)', fontSize: 14 }}>
          <RefreshCw size={16} aria-hidden className={status === 'checking' ? 'bc-spin' : undefined} />
          Live
        </span>
        <span role="status" aria-live="polite" style={{ color: 'var(--rbl-text-body)', fontSize: 14, flex: '1 1 300px' }}>
          Records through the <strong>{data.latestMeeting ? longDate(data.latestMeeting) : '—'}</strong> meeting. {statusText}
        </span>
        <button type="button" onClick={() => void check.current()} style={buttonStyle(false)}>Check now</button>
      </div>

      <section aria-labelledby="bc-added" style={{ ...card, marginBottom: 16 }}>
        <h2 id="bc-added" style={{ margin: 0, color: 'var(--rbl-text-muted)', fontSize: 14, fontWeight: 600 }}>
          Added to Town budgets by vote{frame !== null && through ? `, through ${shortDate(through.date)}` : ' this year'}
        </h2>
        <Eased value={added} reduce={reduce} format={dollars} style={{ fontSize: 44, fontWeight: 700, color: 'var(--rbl-title)', lineHeight: 1.1, display: 'block', marginTop: 2 }} />
        <p style={{ color: 'var(--rbl-text-body)', fontSize: 14.5, lineHeight: 1.55, margin: '6px 0 14px', maxWidth: '70ch' }}>
          {changesShown} budget changes at {shownPoints.filter((p) => p.changes > 0).length} of {data.counts.meetings} meetings
          {frame === null ? '' : ' so far in the replay'}. The {data.adopted.title} appropriated {compact(data.adopted.appropriations)} across its{' '}
          {data.adopted.funds} operating funds; these votes add to those budgets and to capital project budgets, which sit outside it.
        </p>
        <div role="group" aria-label="Show the changes behind a figure" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 10 }}>
          {SERIES.map((s) => (
            <Tile key={s.key} label={s.label} color={s.color} value={sums[s.key]} reduce={reduce} active={filter === s.key} onClick={() => setFilter(filter === s.key ? 'all' : s.key)}
              note={s.key === 'savings' ? `General Fund ${compact(data.savingsGeneralFund)}` : undefined} />
          ))}
          <Tile label={MOVED.label} color={MOVED.color} value={sums.moved} reduce={reduce} active={filter === 'moved'} onClick={() => setFilter(filter === 'moved' ? 'all' : 'moved')} note="not new money" />
        </div>
        <p style={{ color: 'var(--rbl-text-muted)', fontSize: 12.5, lineHeight: 1.5, margin: '10px 0 0' }}>
          Select a figure to list the votes behind it. Savings counts every draw the way{' '}
          <a href={`${base}/fund-balance-draws/`} style={{ color: 'var(--rbl-link)', fontWeight: 600 }}>Where the Surplus Went</a> does.
          The other sources count the {data.counts.totalled} changes whose account tables read plainly;{' '}
          <button type="button" onClick={() => setFilter('not-totalled')} style={{ ...linkButton }}>{data.counts.notTotalled} more are listed without a total</button>.
        </p>
      </section>

      <section aria-labelledby="bc-chart-title" style={{ ...card, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap', justifyContent: 'space-between' }}>
          <h2 id="bc-chart-title" style={{ margin: 0, color: 'var(--rbl-title)', fontSize: 20 }}>How the year’s changes added up, meeting by meeting</h2>
          {!reduce && (
            <button type="button" onClick={() => setFrame(frame === null ? 0 : null)} style={{ ...buttonStyle(false), display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              {frame === null ? <Play size={15} aria-hidden /> : <Pause size={15} aria-hidden />}
              {frame === null ? 'Replay the year' : 'Stop'}
            </button>
          )}
        </div>
        <p style={{ color: 'var(--rbl-text-body)', fontSize: 14, lineHeight: 1.5, margin: '4px 0 12px' }}>
          Running total of new money added by vote, by where it came from. Hover, or focus the chart and use the arrow keys, to read any meeting.
        </p>
        <Legend />
        <StepChart points={points} visible={shownPoints.length} version={data.dataVersion} />
        <details style={{ marginTop: 12 }}>
          <summary style={{ cursor: 'pointer', color: 'var(--rbl-link)', fontWeight: 600, fontSize: 14 }}>The numbers, meeting by meeting</summary>
          <MeetingTable points={points} />
        </details>
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(320px,100%),1fr))', gap: 16, marginBottom: 16 }}>
        <SavingsByFund changes={data.changes} />
        <section style={card}>
          <h2 style={{ margin: 0, color: 'var(--rbl-title)', fontSize: 18 }}>Where the money went</h2>
          <p style={{ color: 'var(--rbl-text-body)', fontSize: 13.5, lineHeight: 1.5, margin: '4px 0 12px' }}>
            The budget lines the {data.counts.totalled} plainly read changes pay for, as each statement lists them, money moved between lines included.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Plain label="Operating budgets" value={compact(data.destinations.operating)} note={`the ${data.adopted.funds} funds in the adopted budget`} />
            <Plain label="Capital projects and other funds" value={compact(data.destinations.capital)} note="project funds outside it" />
          </div>
        </section>
      </div>

      <Feed changes={data.changes} filter={filter} setFilter={setFilter} fresh={fresh} base={base} />
    </div>
  )
}

const buttonStyle = (on: boolean) => ({
  border: `1px solid ${on ? 'var(--rbl-accent)' : 'var(--rbl-border-strong)'}`, background: on ? 'var(--rbl-info-bg)' : 'var(--rbl-surface)',
  color: 'var(--rbl-title)', borderRadius: 8, padding: '6px 12px', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
})
const linkButton = { background: 'none', border: 'none', padding: 0, color: 'var(--rbl-link)', fontWeight: 600, cursor: 'pointer', fontSize: 'inherit', fontFamily: 'inherit', textDecoration: 'underline' } as const

function Eased({ value, reduce, format, style }: { value: number; reduce: boolean; format: (n: number) => string; style: React.CSSProperties }) {
  const shown = useEased(value, reduce)
  return <strong style={style}>{format(shown)}</strong>
}

function Tile({ label, color, value, reduce, active, onClick, note }: { label: string; color: string; value: number; reduce: boolean; active: boolean; onClick: () => void; note?: string }) {
  const shown = useEased(value, reduce)
  return (
    <button type="button" aria-pressed={active} onClick={onClick} style={{
      textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit', borderRadius: 12, padding: 12,
      display: 'flex', flexDirection: 'column', justifyContent: 'flex-start',
      background: active ? 'var(--rbl-info-bg)' : 'var(--rbl-surface-2)', border: `1px solid ${active ? 'var(--rbl-accent)' : 'var(--rbl-border-subtle)'}`,
    }}>
      <span style={{ display: 'flex', alignItems: 'flex-start', gap: 7, color: 'var(--rbl-text-muted)', fontSize: 13, fontWeight: 600 }}>
        <span aria-hidden style={{ width: 12, height: 12, borderRadius: 3, background: color, flexShrink: 0, marginTop: 3 }} />
        {label}
      </span>
      <strong style={{ display: 'block', fontSize: 21, color: 'var(--rbl-title)', fontWeight: 700, marginTop: 2 }}>{compact(shown)}</strong>
      {note && <span style={{ color: 'var(--rbl-text-muted)', fontSize: 12 }}>{note}</span>}
    </button>
  )
}

function Plain({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div style={{ background: 'var(--rbl-surface-2)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 12, padding: 12 }}>
      <div style={{ color: 'var(--rbl-text-muted)', fontSize: 13, fontWeight: 600 }}>{label}</div>
      <strong style={{ display: 'block', fontSize: 21, color: 'var(--rbl-title)', fontWeight: 700 }}>{value}</strong>
      <div style={{ color: 'var(--rbl-text-muted)', fontSize: 12 }}>{note}</div>
    </div>
  )
}

function Legend() {
  return (
    <ul style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 16px', listStyle: 'none', padding: 0, margin: '0 0 8px' }}>
      {SERIES.map((s) => (
        <li key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, color: 'var(--rbl-text-body)' }}>
          <span aria-hidden style={{ width: 12, height: 12, borderRadius: 3, background: s.color, flexShrink: 0 }} />
          {s.label}
        </li>
      ))}
    </ul>
  )
}

type Point = BudgetChanges['byMeeting'][number]

/** A stacked step chart of the running total, one step per meeting. */
function StepChart({ points, visible, version }: { points: Point[]; visible: number; version: string }) {
  const wrap = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(760)
  const [hover, setHover] = useState<number | null>(null)
  useEffect(() => {
    const el = wrap.current
    if (!el) return
    const ro = new ResizeObserver(() => setWidth(Math.max(280, Math.round(el.getBoundingClientRect().width))))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const narrow = width < 560
  const H = narrow ? 220 : 280
  const pad = { l: narrow ? 46 : 58, r: narrow ? 12 : 190, t: 10, b: 28 }
  const year = points.length ? dayOf(points[0].date).getUTCFullYear() : 2026
  const x0 = Date.UTC(year, 0, 1)
  const lastDay = points.length ? dayOf(points[points.length - 1].date).getTime() : x0
  const x1 = Math.max(lastDay + 12 * 86400000, Date.UTC(year, 9, 31))
  const xs = (t: number) => pad.l + ((t - x0) / (x1 - x0)) * (width - pad.l - pad.r)

  // Running totals per series, at each meeting.
  const cum = SERIES.map(() => [] as number[])
  const running = SERIES.map(() => 0)
  points.forEach((p) => SERIES.forEach((s, i) => { running[i] += p.bySource[s.key]; cum[i].push(running[i]) }))
  const totalAt = (j: number) => cum.reduce((s, c) => s + (c[j] ?? 0), 0)
  const max = Math.max(1, totalAt(points.length - 1))
  const step = niceStep(max / 4)
  const top = Math.ceil(max / step) * step
  const ys = (v: number) => pad.t + (1 - v / top) * (H - pad.t - pad.b)
  const shown = Math.min(visible, points.length)
  const endX = shown ? Math.min(width - pad.r, xs(dayOf(points[shown - 1].date).getTime()) + (shown === points.length ? 0 : 0)) : pad.l
  const rightX = shown === points.length ? width - pad.r : endX

  // Each band: bottom = sum of the series below it, top = bottom + this series.
  const bands = SERIES.map((s, i) => {
    const lower = (j: number) => cum.slice(0, i).reduce((t, c) => t + (j < 0 ? 0 : c[j]), 0)
    const upper = (j: number) => lower(j) + (j < 0 ? 0 : cum[i][j])
    const topPts: [number, number][] = [[pad.l, ys(upper(-1))]]
    const botPts: [number, number][] = [[pad.l, ys(lower(-1))]]
    for (let j = 0; j < shown; j++) {
      const x = xs(dayOf(points[j].date).getTime())
      topPts.push([x, ys(upper(j - 1))], [x, ys(upper(j))])
      botPts.push([x, ys(lower(j - 1))], [x, ys(lower(j))])
    }
    topPts.push([rightX, ys(upper(shown - 1))])
    botPts.push([rightX, ys(lower(shown - 1))])
    const d = `M${topPts.map((p) => p.join(',')).join('L')}L${botPts.reverse().map((p) => p.join(',')).join('L')}Z`
    const edge = `M${topPts.map((p) => p.join(',')).join('L')}`
    return { s, d, edge, mid: ys((lower(shown - 1) + upper(shown - 1)) / 2), value: cum[i][shown - 1] ?? 0 }
  })

  // Direct labels at the right end, nudged apart so none overlap.
  const labels = bands.map((b) => ({ ...b, y: b.mid })).sort((a, b) => b.y - a.y)
  for (let i = 1; i < labels.length; i++) if (labels[i - 1].y - labels[i].y < 30) labels[i].y = labels[i - 1].y - 30
  const minY = pad.t + 8
  if (labels.length && labels[labels.length - 1].y < minY) {
    const shift = minY - labels[labels.length - 1].y
    labels.forEach((l) => { l.y += shift })
  }

  const ticks = Array.from({ length: Math.round(top / step) + 1 }, (_, i) => i * step)
  const months = Array.from({ length: 12 }, (_, m) => Date.UTC(year, m, 1)).filter((t) => t <= x1)

  const pick = (clientX: number) => {
    const el = wrap.current
    if (!el || !shown) return
    const x = clientX - el.getBoundingClientRect().left
    let best = 0
    for (let j = 1; j < shown; j++) if (Math.abs(xs(dayOf(points[j].date).getTime()) - x) < Math.abs(xs(dayOf(points[best].date).getTime()) - x)) best = j
    setHover(best)
  }
  const active = hover !== null && hover < shown ? hover : null
  const hx = active !== null ? xs(dayOf(points[active].date).getTime()) : 0

  return (
    <div
      ref={wrap}
      tabIndex={0}
      role="group"
      aria-label="Running total of money added by vote, meeting by meeting"
      aria-describedby="bc-chart-summary"
      onPointerMove={(e) => pick(e.clientX)}
      onPointerDown={(e) => pick(e.clientX)}
      // A tap keeps its meeting until the next tap; a mouse lets go when it leaves.
      onPointerLeave={(e) => { if (e.pointerType === 'mouse') setHover(null) }}
      onFocus={() => setHover((h) => (h === null ? shown - 1 : h))}
      onBlur={() => setHover(null)}
      onKeyDown={(e) => {
        if (e.key === 'ArrowLeft') { e.preventDefault(); setHover((h) => Math.max(0, (h ?? shown) - 1)) }
        if (e.key === 'ArrowRight') { e.preventDefault(); setHover((h) => Math.min(shown - 1, (h ?? -1) + 1)) }
      }}
      style={{ position: 'relative', outlineOffset: 4, touchAction: 'pan-y' }}
    >
      <p id="bc-chart-summary" className="rbl-sr-only">
        {`${points.length} meetings. ${SERIES.map((s, i) => `${s.label}: ${dollars(cum[i][points.length - 1] ?? 0)}`).join('; ')}. Use the left and right arrow keys to read each meeting; the table below the chart lists every one.`}
      </p>
      {/* What the readout shows, said aloud as the arrow keys move it. */}
      <p className="rbl-sr-only" aria-live="polite">
        {active !== null ? `${longDate(points[active].date)}: ${points[active].changes === 0 ? 'no budget changes' : `${points[active].changes} budget change${points[active].changes === 1 ? '' : 's'}`}. Running totals: ${SERIES.map((s, i) => `${s.label} ${dollars(cum[i][active] ?? 0)}`).join('; ')}.` : ''}
      </p>
      <svg width={width} height={H} viewBox={`0 0 ${width} ${H}`} style={{ display: 'block', maxWidth: '100%' }} aria-hidden>
        <defs>
          <clipPath id="bc-clip"><rect key={version} className="bc-reveal" x={pad.l} y={0} width={width - pad.l - pad.r + 1} height={H} /></clipPath>
        </defs>
        {ticks.map((v) => (
          <g key={v}>
            <line x1={pad.l} x2={width - pad.r} y1={ys(v)} y2={ys(v)} stroke="var(--rbl-border-subtle)" strokeWidth={1} />
            <text x={pad.l - 8} y={ys(v) + 4} textAnchor="end" fontSize={11.5} fill="var(--rbl-text-muted)" style={{ fontVariantNumeric: 'tabular-nums' }}>{compact(v)}</text>
          </g>
        ))}
        {months.map((t) => (
          <text key={t} x={xs(t)} y={H - 8} textAnchor="start" fontSize={11.5} fill="var(--rbl-text-muted)">{MONTHS[new Date(t).getUTCMonth()]}</text>
        ))}
        <g clipPath="url(#bc-clip)">
          {bands.map((b) => <path key={b.s.key} d={b.d} fill={b.s.color} />)}
          {/* A 2px surface gap between stacked bands, instead of borders. */}
          {bands.map((b) => <path key={`${b.s.key}-edge`} d={b.edge} fill="none" stroke="var(--rbl-surface)" strokeWidth={2} />)}
        </g>
        {!narrow && shown > 0 && labels.map((l) => (
          <g key={l.s.key}>
            <text x={width - pad.r + 10} y={l.y - 2} fontSize={12} fill="var(--rbl-text-body)">{l.s.label}</text>
            <text x={width - pad.r + 10} y={l.y + 13} fontSize={12.5} fontWeight={700} fill="var(--rbl-text-strong)">{compact(l.value)}</text>
          </g>
        ))}
        {active !== null && <line x1={hx} x2={hx} y1={pad.t} y2={H - pad.b} stroke="var(--rbl-text-muted)" strokeWidth={1} />}
      </svg>
      {/* Wide: a tooltip beside the crosshair. Narrow: a readout under the chart,
          on the latest meeting until one is chosen, since the end labels are hidden. */}
      {!narrow && active !== null && (
        <Readout point={points[active]} totals={cum.map((c) => c[active])} style={{
          position: 'absolute', top: 8, left: Math.min(Math.max(8, hx + 10), width - 306), width: 296, pointerEvents: 'none', boxShadow: '0 4px 14px rgba(15,23,42,.12)',
        }} />
      )}
      {narrow && shown > 0 && (
        <Readout point={points[active ?? shown - 1]} totals={cum.map((c) => c[active ?? shown - 1])} style={{ marginTop: 8 }} />
      )}
    </div>
  )
}

function Readout({ point, totals, style }: { point: Point; totals: number[]; style: React.CSSProperties }) {
  return (
    <div style={{ background: 'var(--rbl-surface)', border: '1px solid var(--rbl-border)', borderRadius: 10, padding: '8px 10px', fontSize: 12.5, ...style }}>
      <div style={{ color: 'var(--rbl-title)', fontWeight: 700 }}>{longDate(point.date)}</div>
      <div style={{ color: 'var(--rbl-text-muted)', marginBottom: 4 }}>
        {point.changes === 0 ? 'No budget changes' : `${point.changes} budget change${point.changes === 1 ? '' : 's'}`}; running totals:
      </div>
      {SERIES.map((s, i) => (
        <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'space-between' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--rbl-text-body)' }}>
            <span aria-hidden style={{ width: 12, height: 2, background: s.color, display: 'inline-block', flexShrink: 0 }} />{s.label}
          </span>
          <strong style={{ color: 'var(--rbl-text-strong)', fontVariantNumeric: 'tabular-nums' }}>{compact(totals[i] ?? 0)}</strong>
        </div>
      ))}
    </div>
  )
}

function niceStep(raw: number) {
  const p = Math.pow(10, Math.floor(Math.log10(Math.max(raw, 1))))
  const f = raw / p
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * p
}

function MeetingTable({ points }: { points: Point[] }) {
  let running = 0
  return (
    <div role="region" aria-label="The numbers, meeting by meeting" tabIndex={0} style={{ overflowX: 'auto', marginTop: 8 }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ color: 'var(--rbl-text-muted)', borderBottom: '2px solid var(--rbl-border-subtle)' }}>
            {['Meeting', 'Changes', ...SERIES.map((s) => s.label), MOVED.label, 'Added so far'].map((h, i) => (
              <th key={h} style={{ padding: '6px 8px', textAlign: i === 0 ? 'left' : 'right', fontWeight: 600 }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {points.map((p) => {
            running += SERIES.reduce((s, x) => s + p.bySource[x.key], 0)
            return (
              <tr key={p.slug} style={{ borderTop: '1px solid var(--rbl-border-subtle)' }}>
                <th scope="row" style={{ padding: '6px 8px', textAlign: 'left', fontWeight: 600, color: 'var(--rbl-title)', whiteSpace: 'nowrap' }}>{shortDate(p.date)}</th>
                {[p.changes, ...SERIES.map((s) => p.bySource[s.key]), p.bySource.moved, running].map((v, i) => (
                  <td key={i} style={{ padding: '6px 8px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', color: v ? 'var(--rbl-text-strong)' : 'var(--rbl-text-faint)' }}>
                    {i === 0 ? v : v ? dollars(v) : '—'}
                  </td>
                ))}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function SavingsByFund({ changes }: { changes: Change[] }) {
  const byFund = new Map<string, { amount: number; votes: number; unpriced: number }>()
  for (const c of changes) for (const d of c.savings) {
    const row = byFund.get(d.fund) ?? { amount: 0, votes: 0, unpriced: 0 }
    row.amount += d.amount ?? 0
    row.votes += 1
    if (d.amount === null) row.unpriced += 1
    byFund.set(d.fund, row)
  }
  const rows = Array.from(byFund.entries()).sort((a, b) => b[1].amount - a[1].amount)
  const max = Math.max(1, ...rows.map(([, r]) => r.amount))
  return (
    <section style={card}>
      <h2 style={{ margin: 0, color: 'var(--rbl-title)', fontSize: 18 }}>Savings drawn, by fund</h2>
      <p style={{ color: 'var(--rbl-text-body)', fontSize: 13.5, lineHeight: 1.5, margin: '4px 0 12px' }}>
        Each fund’s own balance. A district’s savings belong to its ratepayers and cannot pay for General Fund services.
      </p>
      <div style={{ display: 'grid', gap: 10 }}>
        {rows.map(([fund, r]) => (
          <div key={fund}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 13.5 }}>
              <span style={{ color: 'var(--rbl-text-strong)', fontWeight: 600 }}>{fund}</span>
              <span style={{ color: 'var(--rbl-text-strong)', fontWeight: 700, whiteSpace: 'nowrap' }}>{dollars(r.amount)}</span>
            </div>
            <div style={{ background: 'var(--rbl-track)', borderRadius: 4, height: 8, marginTop: 4, overflow: 'hidden' }}>
              <div style={{ width: `${(r.amount / max) * 100}%`, height: '100%', background: 'var(--rbl-series-blue)', borderRadius: 4, transition: 'width .45s ease' }} />
            </div>
            <div style={{ color: 'var(--rbl-text-muted)', fontSize: 12, marginTop: 2 }}>
              {r.votes} vote{r.votes === 1 ? '' : 's'}{r.unpriced ? `; ${r.unpriced} name${r.unpriced === 1 ? 's' : ''} the account without an amount` : ''}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All changes' },
  ...SERIES.map((s) => ({ key: s.key as Filter, label: s.label })),
  { key: 'moved', label: MOVED.label },
  { key: 'not-totalled', label: 'Listed without a total' },
]

function Feed({ changes, filter, setFilter, fresh, base }: { changes: Change[]; filter: Filter; setFilter: (f: Filter) => void; fresh: Set<string>; base: string }) {
  const [all, setAll] = useState(false)
  const shown = changes.filter((c) =>
    filter === 'all' ? true
      : filter === 'not-totalled' ? c.notTotalled !== null
        : filter === 'savings' ? c.savings.length > 0
          : c.sources.some((s) => s.source === filter))
  const list = all ? shown : shown.slice(0, 15)
  return (
    <section aria-labelledby="bc-feed" style={card}>
      <h2 id="bc-feed" style={{ margin: 0, color: 'var(--rbl-title)', fontSize: 20 }}>Every budget change, newest first</h2>
      <p style={{ color: 'var(--rbl-text-body)', fontSize: 14, lineHeight: 1.5, margin: '4px 0 12px' }}>
        Each one links to its meeting record, where the vote, the resolution and its fiscal impact statement can be read.
      </p>
      <div role="group" aria-label="Filter the changes" style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
        {FILTERS.map((f) => (
          <button key={f.key} type="button" aria-pressed={filter === f.key} onClick={() => { setFilter(f.key); setAll(false) }} style={{ ...buttonStyle(filter === f.key), borderRadius: 999, padding: '5px 12px', fontSize: 13.5 }}>
            {f.label}
          </button>
        ))}
      </div>
      <div aria-live="polite" style={{ color: 'var(--rbl-text-muted)', fontSize: 13, marginBottom: 6 }}>{shown.length} change{shown.length === 1 ? '' : 's'}</div>
      <ol style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {list.map((c) => <ChangeItem key={changeId(c)} c={c} fresh={fresh.has(changeId(c))} base={base} />)}
      </ol>
      {shown.length > list.length && (
        <button type="button" onClick={() => setAll(true)} style={{ ...buttonStyle(false), marginTop: 10 }}>Show all {shown.length}</button>
      )}
    </section>
  )
}

function ChangeItem({ c, fresh, base }: { c: Change; fresh: boolean; base: string }) {
  const href = `${base}/meetings/?meeting=${encodeURIComponent(c.meetingSlug)}${c.number ? `&q=${encodeURIComponent(c.number)}` : ''}`
  const savings = c.savings.reduce((s, d) => s + (d.amount ?? 0), 0)
  const bySource = new Map<Source, number>()
  for (const s of c.sources) bySource.set(s.source, (bySource.get(s.source) ?? 0) + s.amount)
  return (
    <li className={fresh ? 'bc-fresh' : undefined} style={{ borderTop: '1px solid var(--rbl-border-subtle)', padding: '12px 4px' }}>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{ color: 'var(--rbl-text-muted)', fontSize: 13 }}>
          {longDate(c.meetingDate)}{c.number ? ` · Resolution ${c.number}` : ''}{fresh ? ' · new' : ''}
        </span>
        <span style={{ color: 'var(--rbl-text-muted)', fontSize: 13 }}>{c.vote}</span>
      </div>
      <a href={href} style={{ display: 'block', color: 'var(--rbl-link)', fontWeight: 600, fontSize: 15, lineHeight: 1.4, marginTop: 2 }}>{c.title}</a>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
        {c.funds.map((f) => (
          <span key={f.code} style={{ fontSize: 12, color: 'var(--rbl-text-body)', background: 'var(--rbl-surface-2)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 999, padding: '1px 8px' }}>
            {f.name === f.code ? f.code : `${f.name} (${f.code})`}{f.operating ? '' : ' · capital or other fund'}
          </span>
        ))}
      </div>
      <ul style={{ listStyle: 'none', margin: '6px 0 0', padding: 0, display: 'grid', gap: 2 }}>
        {c.savings.length > 0 && (
          <SourceRow source="savings" text={c.savings.map((d) => `${d.amount === null ? 'amount not stated' : dollars(d.amount)} from the ${d.fund}${d.fromAdoptedTable ? ' (as the adopted budget table states it)' : ''}`).join('; ')} amount={savings} />
        )}
        {Array.from(bySource.entries()).map(([s, amount]) => (
          <SourceRow key={s} source={s} text={c.sources.filter((x) => x.source === s).map((x) => x.name).join('; ')} amount={amount} />
        ))}
      </ul>
      {c.notTotalled && (
        <div style={{ marginTop: 6, background: 'var(--rbl-surface-2)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 10, padding: '8px 10px' }}>
          <div style={{ color: 'var(--rbl-text-body)', fontSize: 13 }}><strong style={{ fontWeight: 600 }}>Not in the totals.</strong> {c.notTotalled}</div>
          {c.lines.length > 0 && (
            <details style={{ marginTop: 4 }}>
              <summary style={{ cursor: 'pointer', color: 'var(--rbl-link)', fontSize: 13, fontWeight: 600 }}>Its table, as the statement lists it</summary>
              <ul style={{ listStyle: 'none', margin: '6px 0 0', padding: 0, display: 'grid', gap: 2, fontSize: 12.5 }}>
                {c.lines.map((l, i) => (
                  <li key={`${l.code}-${i}`} style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                    <span style={{ color: 'var(--rbl-text-body)' }}>{l.field}: {l.name} <span style={{ color: 'var(--rbl-text-faint)' }}>{l.code}</span></span>
                    <span style={{ color: 'var(--rbl-text-strong)', whiteSpace: 'nowrap' }}>{l.amount === null ? 'no amount' : dollars(l.amount)}</span>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}
    </li>
  )
}

function SourceRow({ source, text, amount }: { source: Source; text: string; amount: number }) {
  return (
    <li style={{ display: 'flex', gap: 8, alignItems: 'baseline', justifyContent: 'space-between', fontSize: 13 }}>
      <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 6, color: 'var(--rbl-text-body)' }}>
        <span aria-hidden style={{ width: 12, height: 2, background: colorOf(source), display: 'inline-block', transform: 'translateY(-3px)', flexShrink: 0 }} />
        <span><strong style={{ fontWeight: 600 }}>{labelOf(source)}</strong>: {text}</span>
      </span>
      <strong style={{ color: 'var(--rbl-text-strong)', whiteSpace: 'nowrap', fontWeight: 700 }}>{dollars(amount)}</strong>
    </li>
  )
}
