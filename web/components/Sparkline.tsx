// Tiny dependency-free SVG sparkline. Renders on the server (static export safe).

export default function Sparkline({
  values,
  width = 120,
  height = 30,
  stroke = '#4a7297',
  fill = 'rgba(31,95,143,0.12)',
}: {
  values: (number | null)[]
  width?: number
  height?: number
  stroke?: string
  fill?: string
}) {
  const pts = values.map((v, i) => ({ v, i })).filter((p): p is { v: number; i: number } => p.v != null)
  if (pts.length < 2) return <span style={{ color: '#94a3b8', fontSize: 12 }}>—</span>

  const xs = pts.map((p) => p.i)
  const vs = pts.map((p) => p.v)
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minV = Math.min(...vs)
  const maxV = Math.max(...vs)
  const pad = 3
  const sx = (i: number) => pad + ((i - minX) / (maxX - minX || 1)) * (width - 2 * pad)
  const sy = (v: number) => height - pad - ((v - minV) / (maxV - minV || 1)) * (height - 2 * pad)

  const line = pts.map((p, k) => `${k === 0 ? 'M' : 'L'} ${sx(p.i).toFixed(1)} ${sy(p.v).toFixed(1)}`).join(' ')
  const area = `${line} L ${sx(maxX).toFixed(1)} ${height - pad} L ${sx(minX).toFixed(1)} ${height - pad} Z`
  const last = pts[pts.length - 1]
  const rising = last.v >= pts[0].v

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: 'block' }}>
      <path d={area} fill={fill} stroke="none" />
      <path d={line} fill="none" stroke={stroke} strokeWidth={1.6} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={sx(last.i)} cy={sy(last.v)} r={2.6} fill={rising ? '#b91c1c' : '#15803d'} />
    </svg>
  )
}
