import ChartFrame from './ChartFrame'

export type Column = {
  label: string
  value: number
  color?: string
  /** Printed above the bar instead of the formatted value. */
  display?: string
  emphasis?: boolean
}

/**
 * Vertical columns over a category axis, with an optional threshold rule.
 *
 * SVG here rather than divs, because the threshold line has to cross the plot
 * and the value labels sit above the bars. Note every colour is set through
 * `style`, never a presentation attribute: `fill="var(--x)"` does not resolve in
 * SVG, while `style={{ fill: 'var(--x)' }}` does — which is what lets these
 * charts follow the light/dark theme.
 */
export default function ColumnChart({
  title, lede, source, columns, format, threshold, legend, height = 210, yMax,
}: {
  title: string
  lede?: string
  source?: string
  columns: Column[]
  format: (n: number) => string
  threshold?: { value: number; label: string }
  legend?: { label: string; color: string }[]
  height?: number
  yMax?: number
}) {
  const W = 720, H = height
  const padT = 26, padB = 44, padL = 4, padR = 62
  const plotH = H - padT - padB
  // Zero baseline, always: a column chart that starts anywhere else misstates
  // every ratio the reader takes from the bar heights. When a series dips below
  // zero the axis extends downward instead of clamping the decline to nothing.
  const rawTop = Math.max(...columns.map((c) => c.value), threshold?.value ?? 0)
  const rawBottom = Math.min(...columns.map((c) => c.value), 0)
  const top = yMax ?? rawTop * 1.14
  const bottom = rawBottom < 0 ? rawBottom * 1.14 : 0
  const span = top - bottom || 1
  const bandW = (W - padL - padR) / columns.length
  const barW = Math.min(bandW * 0.62, 74)
  const y = (v: number) => padT + plotH - ((v - bottom) / span) * plotH
  const zeroY = y(0)

  return (
    <ChartFrame title={title} lede={lede} source={source} legend={legend}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} role="img"
           style={{ display: 'block', overflow: 'visible' }}>
        {/* zero line — the baseline every bar is measured from */}
        <line x1={padL} y1={zeroY} x2={W - padR + 2} y2={zeroY}
              style={{ stroke: 'var(--rbl-border-strong)' }} strokeWidth={1} />

        {threshold && (
          <g>
            <line x1={padL} y1={y(threshold.value)} x2={W - padR} y2={y(threshold.value)}
                  style={{ stroke: 'var(--rbl-danger)' }} strokeWidth={1.5} strokeDasharray="5 4" />
            {/* label lives in the right gutter, clear of every bar */}
            <text x={W - padR + 8} y={y(threshold.value) + 4} textAnchor="start" fontSize={11.5} fontWeight={800}
                  style={{ fill: 'var(--rbl-danger)' }}>
              {threshold.label}
            </text>
          </g>
        )}

        {columns.map((c, i) => {
          const cx = padL + i * bandW + bandW / 2
          const neg = c.value < 0
          const h = Math.max(1, Math.abs(y(c.value) - zeroY))
          const barY = neg ? zeroY : zeroY - h
          return (
            <g key={c.label}>
              <title>{`${c.label}: ${c.display ?? format(c.value)}`}</title>
              <rect x={cx - barW / 2} y={barY} width={barW} height={h} rx={4}
                    style={{ fill: c.color ?? 'var(--rbl-series-blue)' }} />
              <text x={cx} y={neg ? zeroY - 6 : barY - 7} textAnchor="middle" fontSize={12}
                    fontWeight={c.emphasis ? 800 : 700}
                    style={{ fill: c.emphasis ? 'var(--rbl-danger)' : 'var(--rbl-text-strong)' }}>
                {c.display ?? format(c.value)}
              </text>
              <text x={cx} y={padT + plotH + 20} textAnchor="middle" fontSize={12}
                    style={{ fill: 'var(--rbl-text-muted)' }}>
                {c.label}
              </text>
            </g>
          )
        })}
      </svg>
    </ChartFrame>
  )
}
