// Lightweight multi-series SVG line chart. Pure server-rendered SVG (no client
// JS), so it works in the static export. Designed for the existing visual style.

export type Series = { label: string; color: string; points: { x: number; y: number | null }[] }

const fmtUsd = (n: number) => {
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(0)}M`
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
  return `$${n}`
}

export default function LineChart({
  series,
  width = 860,
  height = 360,
  yLabel = '',
}: {
  series: Series[]
  width?: number
  height?: number
  yLabel?: string
}) {
  const padL = 64
  const padR = 18
  const padT = 18
  const padB = 40

  const allX = series.flatMap((s) => s.points.map((p) => p.x))
  const allY = series.flatMap((s) => s.points.filter((p) => p.y != null).map((p) => p.y as number))
  const minX = Math.min(...allX)
  const maxX = Math.max(...allX)
  const maxY = Math.max(...allY, 1)
  const minY = 0

  const sx = (x: number) => padL + ((x - minX) / (maxX - minX || 1)) * (width - padL - padR)
  const sy = (y: number) => height - padB - ((y - minY) / (maxY - minY || 1)) * (height - padT - padB)

  const ticks = 4
  const yTicks = Array.from({ length: ticks + 1 }, (_, i) => (maxY / ticks) * i)
  const xs = Array.from(new Set(allX)).sort((a, b) => a - b)
  // Show ~8 x labels max
  const xStep = Math.max(1, Math.ceil(xs.length / 8))
  const xLabels = xs.filter((_, i) => i % xStep === 0 || i === xs.length - 1)

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} role="img" style={{ display: 'block' }}>
      {/* gridlines + y labels */}
      {yTicks.map((t, i) => (
        <g key={i}>
          <line x1={padL} y1={sy(t)} x2={width - padR} y2={sy(t)} stroke="#e2e8f0" strokeWidth={1} />
          <text x={padL - 8} y={sy(t) + 4} textAnchor="end" fontSize={11} fill="#64748b">{fmtUsd(t)}</text>
        </g>
      ))}
      {/* x labels */}
      {xLabels.map((x) => (
        <text key={x} x={sx(x)} y={height - padB + 18} textAnchor="middle" fontSize={11} fill="#64748b">{x}</text>
      ))}
      {yLabel && <text x={16} y={padT + 2} fontSize={11} fill="#94a3b8" transform={`rotate(-90 16 ${height / 2})`}>{yLabel}</text>}

      {/* series */}
      {series.map((s) => {
        const pts = s.points.filter((p) => p.y != null) as { x: number; y: number }[]
        const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${sx(p.x).toFixed(1)} ${sy(p.y).toFixed(1)}`).join(' ')
        return (
          <g key={s.label}>
            <path d={d} fill="none" stroke={s.color} strokeWidth={2.4} strokeLinejoin="round" strokeLinecap="round" />
            {pts.map((p) => <circle key={p.x} cx={sx(p.x)} cy={sy(p.y)} r={2.6} fill={s.color} />)}
          </g>
        )
      })}
    </svg>
  )
}

export function ChartLegend({ series }: { series: { label: string; color: string }[] }) {
  return (
    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 10 }}>
      {series.map((s) => (
        <span key={s.label} style={{ fontSize: 13, fontWeight: 700, color: '#334155' }}>
          <span style={{ display: 'inline-block', width: 14, height: 4, borderRadius: 4, background: s.color, marginRight: 6, verticalAlign: 'middle' }} />
          {s.label}
        </span>
      ))}
    </div>
  )
}
