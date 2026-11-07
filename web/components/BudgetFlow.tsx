import type { FlowLink, FlowNode } from '../lib/budget-flow'

// A three-column flow diagram drawn as plain SVG: revenue kinds on the left,
// funds in the middle, spending purposes on the right. Each band's thickness is
// its dollars. Every figure is also in the tables below the diagram; a band's
// own figure is in its title, read by screen readers and shown on hover.

const W = 1440
const COL_X = [390, 750, 1050]
const NODE_W = 14
const GAP = 10
const usdM = (n: number) => `$${(n / 1e6).toFixed(n >= 1e7 ? 1 : 2)}M`

export default function BudgetFlow({ nodes, links, total }: { nodes: FlowNode[]; links: FlowLink[]; total: number }) {
  const cols = [0, 1, 2].map((c) => nodes.filter((n) => n.column === c))
  const maxCount = Math.max(...cols.map((c) => c.length))
  const H = 780
  const k = (H - GAP * (maxCount - 1)) / total
  const pos = new Map<string, { x: number; y: number; h: number }>()
  for (const col of cols) {
    let y = 0
    const used = col.reduce((s, n) => s + n.value * k, 0) + GAP * (col.length - 1)
    y = (H - used) / 2
    for (const n of col) {
      const h = Math.max(1.5, n.value * k)
      pos.set(n.id, { x: COL_X[n.column], y, h })
      y += h + GAP
    }
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

  return (
    <div style={{ overflowX: 'auto' }}>
      <svg viewBox={`-4 -4 ${W + 8} ${H + 8}`} role="img" aria-label="Flow of the 2027 Preliminary budget from revenue, through the funds, to spending. The tables below give every figure." style={{ width: '100%', minWidth: 720, height: 'auto', display: 'block' }}>
        {bands.map((b) => (
          <path key={`${b.from}-${b.to}`} d={b.d} style={{ fill: b.stage === 0 ? 'var(--rbl-map-seq-3)' : 'var(--rbl-map-dem-2)', fillOpacity: 0.45, stroke: 'none' }}>
            <title>{`${label(b.from)} → ${label(b.to)}: ${usdM(b.value)}`}</title>
          </path>
        ))}
        {nodes.map((n) => {
          const p = pos.get(n.id)!
          const right = n.column === 2
          // Revenue labels sit left of their bars, fund labels left of theirs, purposes to the right.
          const tx = right ? p.x + NODE_W + 6 : p.x - 6
          return (
            <g key={n.id}>
              <rect x={p.x} y={p.y} width={NODE_W} height={p.h} rx={2} style={{ fill: 'var(--rbl-title)' }} />
              {p.h >= 9 && (
                <text x={tx} y={p.y + p.h / 2} textAnchor={right ? 'start' : 'end'} dominantBaseline="central"
                  style={{ fontSize: 13, fill: 'var(--rbl-text-strong)', stroke: 'var(--rbl-surface)', strokeWidth: 3, paintOrder: 'stroke' }}>
                  {n.label} · {usdM(n.value)}
                </text>
              )}
            </g>
          )
        })}
      </svg>
    </div>
  )
}
