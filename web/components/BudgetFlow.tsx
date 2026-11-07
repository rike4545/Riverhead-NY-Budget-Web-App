import type { FlowLink, FlowNode } from '../lib/budget-flow'

// A three-column flow diagram drawn as plain SVG: revenue kinds on the left,
// funds in the middle, spending purposes on the right. Each band's thickness is
// its dollars. Every figure is also in the tables below the diagram; a band's
// own figure is in its title, read by screen readers and shown on hover.
//
// Drawn twice, like the column chart: the diagram, and when the chart is
// narrower than 560px (a container query in site.css) three lists of bars, one
// per column, whose labels a phone can read.

const W = 1440
const COL_X = [380, 820, 1060]
const NODE_W = 14
const GAP = 12
const FONT = 15
const LABEL_GAP = FONT + 9
const LABEL_ROOM = 40
const usdM = (n: number) => `$${(n / 1e6).toFixed(n >= 1e7 ? 1 : 2)}M`

const LINE = FONT + 3
/** Outer columns put a long label's dollar figure on a second line, so the label stays inside the drawing. */
const twoLines = (column: number, text: string) => column !== 1 && text.length > 30

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

export default function BudgetFlow({ nodes, links, total }: { nodes: FlowNode[]; links: FlowLink[]; total: number }) {
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
    return { ...l, d, stage: l.from.startsWith('rev:') ? 0 : 1 }
  })
  const label = (id: string) => nodes.find((n) => n.id === id)?.label ?? id
  const heads = ['Where it comes from', 'The fund it goes into', 'What it pays for']

  return (
    <div className="rbl-chart">
      <div className="rbl-chart-wide">
        <svg viewBox={`-4 -4 ${W + 8} ${H + 8 + LABEL_ROOM}`} role="img" aria-label="Flow of the 2027 Preliminary budget from revenue, through the funds, to spending. The tables below give every figure." style={{ width: '100%', height: 'auto', display: 'block' }}>
          {bands.map((b) => (
            <path key={`${b.from}-${b.to}`} d={b.d} style={{ fill: b.stage === 0 ? 'var(--rbl-map-seq-3)' : 'var(--rbl-map-dem-2)', fillOpacity: 0.45, stroke: 'none' }}>
              <title>{`${label(b.from)} → ${label(b.to)}: ${usdM(b.value)}`}</title>
            </path>
          ))}
          {nodes.map((n) => {
            const p = pos.get(n.id)!
            const right = n.column === 2
            // Revenue and fund labels sit left of their bars, purposes to the right. A label nudged off its bar's centre keeps a leader line to it.
            const tx = right ? p.x + NODE_W + 8 : p.x - 8
            const moved = Math.abs(p.ly - (p.y + p.h / 2)) > 2
            return (
              <g key={n.id}>
                <rect x={p.x} y={p.y} width={NODE_W} height={p.h} rx={2} style={{ fill: 'var(--rbl-title)' }} />
                {moved ? (
                  <line x1={right ? p.x + NODE_W : p.x} y1={p.y + p.h / 2} x2={right ? tx - 2 : tx + 2} y2={p.ly}
                    style={{ stroke: 'var(--rbl-text-muted)', strokeWidth: 1 }} />
                ) : null}
                <text x={tx} y={p.ly} textAnchor={right ? 'start' : 'end'} dominantBaseline="central"
                  style={{ fontSize: FONT, fill: 'var(--rbl-text-strong)', stroke: 'var(--rbl-surface)', strokeWidth: 3.5, paintOrder: 'stroke' }}>
                  {twoLines(n.column, `${n.label} · ${usdM(n.value)}`) ? (
                    <>
                      <tspan x={tx} dy={-LINE / 2}>{n.label}</tspan>
                      <tspan x={tx} dy={LINE} style={{ fontWeight: 700 }}>{usdM(n.value)}</tspan>
                    </>
                  ) : <>{n.label} · {usdM(n.value)}</>}
                </text>
              </g>
            )
          })}
        </svg>
      </div>
      <div className="rbl-chart-narrow">
        {cols.map((col, c) => {
          const max = Math.max(...col.map((n) => n.value))
          return (
            <div key={c} style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--rbl-title)', marginBottom: 8 }}>{c + 1}. {heads[c]}</div>
              <div style={{ display: 'grid', gap: 8 }}>
                {col.map((n) => (
                  <div key={n.id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 14, color: 'var(--rbl-text-strong)' }}>
                      <span style={{ fontWeight: 600 }}>{n.label}</span>
                      <span style={{ fontWeight: 700, whiteSpace: 'nowrap' }}>{usdM(n.value)}</span>
                    </div>
                    <div aria-hidden="true" style={{ background: 'var(--rbl-track)', borderRadius: 4, height: 8, marginTop: 3 }}>
                      <div style={{ width: `${Math.max(1, (n.value / max) * 100)}%`, height: '100%', borderRadius: 4, background: c === 0 ? 'var(--rbl-map-seq-3)' : c === 1 ? 'var(--rbl-title)' : 'var(--rbl-map-dem-2)' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
