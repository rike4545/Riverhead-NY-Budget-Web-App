'use client'

import { useMemo, useRef, useState } from 'react'
import type { FlowLink, FlowNode } from '../lib/budget-flow'

// A Sankey diagram drawn as plain SVG: revenue kinds on the left, funds in the
// middle, spending purposes on the right. Each band's thickness is its dollars.
//
// Choosing an item (from the list above the diagram, or by clicking it) lights
// its bands and lists them, in dollars and shares, under the diagram. Pointing
// at a band shows its figure. Money is not traced through a fund: a fund pools
// what comes in, so a revenue kind's bands stop at the funds it enters.
//
// When the chart is narrower than 560px (a container query in site.css) the
// diagram is replaced by the same list and breakdown, which a phone can read.
// Every figure is also in the tables below the chart.

const W = 1440
const COL_X = [380, 820, 1060]
const NODE_W = 14
const GAP = 12
const FONT = 15
const LABEL_GAP = FONT + 9
const LABEL_ROOM = 40
const HEAD = 40
const usdM = (n: number) => `$${(n / 1e6).toFixed(n >= 1e7 ? 1 : 2)}M`
const usd = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
const pct = (v: number) => (v < 0.001 ? 'under 0.1%' : `${(v * 100).toFixed(v < 0.1 ? 1 : 0)}%`)

const LINE = FONT + 3
/** Outer columns put a long label's dollar figure on a second line, so the label stays inside the drawing. */
const twoLines = (column: number, text: string) => column !== 1 && text.length > 30
const HEADS = ['Where it comes from', 'The fund it goes into', 'What it pays for']
const STAGE_FILL = ['var(--rbl-map-seq-3)', 'var(--rbl-map-dem-2)']

/** Push labels apart so none overlaps the one above, keeping each as close to its bar as it can. `hs` is each label's height. */
function spread(ys: number[], hs: number[], top: number, bottom: number): number[] {
  const out = [...ys]
  const gap = (i: number) => (hs[i - 1] + hs[i]) / 2 + (LABEL_GAP - FONT)
  for (let i = 1; i < out.length; i++) out[i] = Math.max(out[i], out[i - 1] + gap(i))
  const last = out.length - 1
  const overflow = out[last] + hs[last] / 2 - bottom
  if (overflow > 0) {
    out[last] -= overflow
    for (let i = last - 1; i >= 0; i--) out[i] = Math.min(out[i], out[i + 1] - gap(i + 1))
  }
  return out.map((y, i) => Math.max(y, top + hs[i] / 2))
}

function layout(nodes: FlowNode[], links: FlowLink[], total: number) {
  const cols = [0, 1, 2].map((c) => nodes.filter((n) => n.column === c))
  const maxCount = Math.max(...cols.map((c) => c.length))
  const H = 840
  const k = (H - GAP * (maxCount - 1)) / total
  const pos = new Map<string, { x: number; y: number; h: number; ly: number }>()
  for (const col of cols) {
    const used = col.reduce((s, n) => s + n.value * k, 0) + GAP * (col.length - 1)
    let y = (H - used) / 2
    const centres: number[] = []
    for (const n of col) {
      const h = Math.max(1.5, n.value * k)
      pos.set(n.id, { x: COL_X[n.column], y, h, ly: 0 })
      centres.push(y + h / 2)
      y += h + GAP
    }
    // Labels may run into a strip below the last bar (LABEL_ROOM), so the smallest items need not crowd together.
    const hs = col.map((n) => (twoLines(n.column, `${n.label} · ${usdM(n.value)}`) ? FONT + LINE : FONT))
    const ly = spread(centres, hs, 0, H + LABEL_ROOM)
    col.forEach((n, i) => { pos.get(n.id)!.ly = ly[i] })
  }
  // Stack each node's bands in the order of the nodes they connect to.
  const outY = new Map<string, number>(), inY = new Map<string, number>()
  const order = new Map(nodes.map((n, i) => [n.id, i]))
  const sorted = [...links].sort((a, b) => (order.get(a.from)! - order.get(b.from)!) || (order.get(a.to)! - order.get(b.to)!))
  const bands = sorted.map((l) => {
    const a = pos.get(l.from)!, b = pos.get(l.to)!
    const h = Math.max(0.6, l.value * k)
    const y0 = a.y + (outY.get(l.from) ?? 0), y1 = b.y + (inY.get(l.to) ?? 0)
    outY.set(l.from, (outY.get(l.from) ?? 0) + l.value * k)
    inY.set(l.to, (inY.get(l.to) ?? 0) + l.value * k)
    const x0 = a.x + NODE_W, x1 = b.x, mx = (x0 + x1) / 2
    const d = `M${x0},${y0} C${mx},${y0} ${mx},${y1} ${x1},${y1} L${x1},${y1 + h} C${mx},${y1 + h} ${mx},${y0 + h} ${x0},${y0 + h} Z`
    return { ...l, key: `${l.from}|${l.to}`, d, stage: l.from.startsWith('rev:') ? 0 : 1 }
  })
  return { cols, pos, bands, H }
}

type Tip = { x: number; y: number; text: string }

export default function BudgetFlow({ nodes, links, total }: { nodes: FlowNode[]; links: FlowLink[]; total: number }) {
  const { cols, pos, bands, H } = useMemo(() => layout(nodes, links, total), [nodes, links, total])
  const byId = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes])
  const [selected, setSelected] = useState<string>('')
  const [hover, setHover] = useState<string | null>(null)
  const [tip, setTip] = useState<Tip | null>(null)
  const box = useRef<HTMLDivElement>(null)

  const active = hover ?? (selected || null)
  const touches = (b: { from: string; to: string }) => !!active && (b.from === active || b.to === active)
  const linked = useMemo(() => {
    if (!active) return null
    const s = new Set<string>([active])
    for (const l of links) { if (l.from === active) s.add(l.to); if (l.to === active) s.add(l.from) }
    return s
  }, [active, links])

  const sel = selected ? byId.get(selected) : undefined
  const inflow = sel ? links.filter((l) => l.to === sel.id).sort((a, b) => b.value - a.value) : []
  const outflow = sel ? links.filter((l) => l.from === sel.id).sort((a, b) => b.value - a.value) : []

  const showTip = (e: React.MouseEvent, text: string) => {
    const r = box.current?.getBoundingClientRect()
    if (r) setTip({ x: e.clientX - r.left, y: e.clientY - r.top, text })
  }

  const breakdown = (title: string, rows: FlowLink[], side: 'from' | 'to', fill: string) => {
    if (!rows.length || !sel) return null
    const max = Math.max(...rows.map((r) => r.value))
    return (
      <div style={{ flex: '1 1 300px', minWidth: 0 }}>
        <h3 style={{ margin: '0 0 8px', fontSize: 16, color: 'var(--rbl-title)' }}>{title}</h3>
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 8 }}>
          {rows.map((r) => (
            <li key={`${r.from}|${r.to}`}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 14.5, color: 'var(--rbl-text-strong)' }}>
                <span style={{ fontWeight: 600 }}>{byId.get(r[side])?.label}</span>
                <span style={{ whiteSpace: 'nowrap' }}><strong>{usd(r.value)}</strong> <span style={{ color: 'var(--rbl-text-muted)' }}>{pct(r.value / sel.value)}</span></span>
              </div>
              <div aria-hidden="true" style={{ background: 'var(--rbl-track)', borderRadius: 4, height: 8, marginTop: 3 }}>
                <div style={{ width: `${Math.max(1, (r.value / max) * 100)}%`, height: '100%', borderRadius: 4, background: fill }} />
              </div>
            </li>
          ))}
        </ul>
      </div>
    )
  }

  const verbs: Record<number, [string, string]> = {
    0: ['', 'Goes into these funds'],
    1: ['Comes from', 'Pays for'],
    2: ['Paid from these funds', ''],
  }

  return (
    <div className="rbl-chart">
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px 12px', margin: '4px 0 12px' }}>
        <label htmlFor="flow-pick" style={{ fontWeight: 600, color: 'var(--rbl-text-strong)', fontSize: 15 }}>Follow the money for</label>
        <select id="flow-pick" value={selected} onChange={(e) => setSelected(e.target.value)}
          style={{ minHeight: 44, padding: '8px 11px', border: '1px solid var(--rbl-border-strong)', borderRadius: 9, fontSize: 15, fontWeight: 600, maxWidth: '100%', background: 'var(--rbl-surface)', color: 'var(--rbl-text)' }}>
          <option value="">The whole budget</option>
          {cols.map((col, c) => (
            <optgroup key={c} label={HEADS[c]}>
              {col.map((n) => <option key={n.id} value={n.id}>{n.label} ({usdM(n.value)})</option>)}
            </optgroup>
          ))}
        </select>
        {selected ? (
          <button type="button" onClick={() => setSelected('')}
            style={{ minHeight: 44, padding: '8px 12px', border: '1px solid var(--rbl-border-strong)', borderRadius: 9, background: 'var(--rbl-surface-2)', color: 'var(--rbl-text-strong)', fontWeight: 600, fontSize: 14.5, cursor: 'pointer' }}>
            Show the whole budget
          </button>
        ) : null}
      </div>

      <div className="rbl-chart-wide" ref={box} style={{ position: 'relative' }} onMouseLeave={() => { setHover(null); setTip(null) }}>
        <svg viewBox={`-4 ${-HEAD} ${W + 8} ${H + HEAD + 4 + LABEL_ROOM}`} role="img"
          aria-label={sel ? `Flow of the 2027 Preliminary budget with ${sel.label} highlighted. Its figures are listed below the diagram.` : 'Flow of the 2027 Preliminary budget from revenue, through the funds, to spending. The tables below give every figure.'}
          style={{ width: '100%', height: 'auto', display: 'block' }}>
          {HEADS.map((h, c) => (
            <text key={h} x={c === 0 ? COL_X[0] + NODE_W : c === 1 ? COL_X[1] + NODE_W / 2 : COL_X[2]} y={-HEAD + 16}
              textAnchor={c === 0 ? 'end' : c === 1 ? 'middle' : 'start'}
              style={{ fontSize: 16, fontWeight: 700, fill: 'var(--rbl-title)' }}>{h}</text>
          ))}
          {bands.map((b) => {
            const on = touches(b)
            return (
              <path key={b.key} d={b.d} className="rbl-flow-band"
                onMouseMove={(e) => showTip(e, `${byId.get(b.from)?.label} → ${byId.get(b.to)?.label}: ${usd(b.value)}`)}
                onMouseLeave={() => setTip(null)}
                style={{ fill: STAGE_FILL[b.stage], fillOpacity: active ? (on ? 0.85 : 0.1) : 0.45, stroke: 'none' }} />
            )
          })}
          {nodes.map((n) => {
            const p = pos.get(n.id)!
            const right = n.column === 2
            const dim = !!linked && !linked.has(n.id)
            const isActive = n.id === active
            // Revenue and fund labels sit left of their bars, purposes to the right. A label nudged off its bar's centre keeps a leader line to it.
            const tx = right ? p.x + NODE_W + 8 : p.x - 8
            const moved = Math.abs(p.ly - (p.y + p.h / 2)) > 2
            const text = `${n.label} · ${usdM(n.value)}`
            return (
              <g key={n.id} style={{ cursor: 'pointer' }}
                onMouseEnter={() => { setHover(n.id); setTip(null) }} onMouseLeave={() => setHover(null)}
                onClick={() => setSelected((s) => (s === n.id ? '' : n.id))}>
                {/* A wider strip than the bar, so the bar and its label are easy to point at. Keyboard and touch use the list above. */}
                <rect x={right ? p.x : n.column === 1 ? p.x - 200 : p.x - 300} y={Math.min(p.y, p.ly - 12)} width={n.column === 1 ? 214 : 314}
                  height={Math.max(p.h, 24, Math.abs(p.ly - (p.y + p.h / 2)) + 24)} style={{ fill: 'transparent' }} />
                {/* Only the bar fades when another item is chosen; its label stays readable in the muted text colour. */}
                <rect x={p.x} y={p.y} width={NODE_W} height={p.h} rx={2} style={{ fill: isActive ? 'var(--rbl-link)' : 'var(--rbl-title)', opacity: dim ? 0.3 : 1 }} />
                {moved ? (
                  <line x1={right ? p.x + NODE_W : p.x} y1={p.y + p.h / 2} x2={right ? tx - 2 : tx + 2} y2={p.ly}
                    style={{ stroke: 'var(--rbl-text-muted)', strokeWidth: 1, opacity: dim ? 0.4 : 1 }} />
                ) : null}
                <text x={tx} y={p.ly} textAnchor={right ? 'start' : 'end'} dominantBaseline="central"
                  style={{ fontSize: FONT, fontWeight: isActive ? 700 : 400, fill: dim ? 'var(--rbl-text-muted)' : 'var(--rbl-text-strong)', stroke: 'var(--rbl-surface)', strokeWidth: 4, paintOrder: 'stroke' }}>
                  {twoLines(n.column, text) ? (
                    <>
                      <tspan x={tx} dy={-LINE / 2}>{n.label}</tspan>
                      <tspan x={tx} dy={LINE} style={{ fontWeight: 700 }}>{usdM(n.value)}</tspan>
                    </>
                  ) : <>{text}</>}
                </text>
              </g>
            )
          })}
        </svg>
        {tip ? (
          <div role="presentation" style={{ position: 'absolute', left: Math.min(tip.x + 14, (box.current?.clientWidth ?? 600) - 260), top: tip.y + 14, maxWidth: 260, pointerEvents: 'none',
            background: 'var(--rbl-surface)', border: '1px solid var(--rbl-border)', borderRadius: 8, padding: '6px 9px', fontSize: 14, color: 'var(--rbl-text-strong)', boxShadow: '0 6px 18px rgba(15,35,55,.14)' }}>
            {tip.text}
          </div>
        ) : null}
        {!selected ? <p style={{ margin: '6px 0 0', fontSize: 14, color: 'var(--rbl-text-muted)' }}>Point at an item to light its flows, or click it to list them.</p> : null}
      </div>

      <div aria-live="polite">
        {sel ? (
          <div style={{ marginTop: 14, padding: 16, border: '1px solid var(--rbl-border-subtle)', borderRadius: 12, background: 'var(--rbl-surface-2)' }}>
            <p style={{ margin: '0 0 12px', fontSize: 16, color: 'var(--rbl-text-strong)' }}>
              <strong>{sel.label}</strong>: {usd(sel.value)}, {pct(sel.value / total)} of the {usdM(total)} budget.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px 28px' }}>
              {breakdown(verbs[sel.column][0], inflow, 'from', STAGE_FILL[0])}
              {breakdown(verbs[sel.column][1], outflow, 'to', STAGE_FILL[1])}
            </div>
            {sel.column === 0 ? <p style={{ margin: '12px 0 0', fontSize: 14, color: 'var(--rbl-text-muted)' }}>Each fund pools what comes in, so this does not say which spending a revenue pays for. Pick a fund to see both sides of it.</p> : null}
          </div>
        ) : null}
      </div>

      {!sel ? (
        <div className="rbl-chart-narrow">
          {cols.map((col, c) => {
            const max = Math.max(...col.map((n) => n.value))
            return (
              <div key={c} style={{ marginBottom: 16 }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--rbl-title)', marginBottom: 8 }}>{c + 1}. {HEADS[c]}</div>
                <div style={{ display: 'grid', gap: 8 }}>
                  {col.map((n) => (
                    <div key={n.id}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 14, color: 'var(--rbl-text-strong)' }}>
                        <span style={{ fontWeight: 600 }}>{n.label}</span>
                        <span style={{ fontWeight: 700, whiteSpace: 'nowrap' }}>{usdM(n.value)}</span>
                      </div>
                      <div aria-hidden="true" style={{ background: 'var(--rbl-track)', borderRadius: 4, height: 8, marginTop: 3 }}>
                        <div style={{ width: `${Math.max(1, (n.value / max) * 100)}%`, height: '100%', borderRadius: 4, background: c === 0 ? STAGE_FILL[0] : c === 1 ? 'var(--rbl-title)' : STAGE_FILL[1] }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
