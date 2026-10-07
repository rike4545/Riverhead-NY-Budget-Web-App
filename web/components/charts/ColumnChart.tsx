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
  // Zero baseline, always: a column chart that starts anywhere else misstates
  // every ratio the reader takes from the bar heights. When a series dips below
  // zero the axis extends downward instead of clamping the decline to nothing.
  const rawTop = Math.max(...columns.map((c) => c.value), threshold?.value ?? 0)
  const rawBottom = Math.min(...columns.map((c) => c.value), 0)
  const top = yMax ?? rawTop * 1.14
  const bottom = rawBottom < 0 ? rawBottom * 1.14 : 0
  const span = top - bottom || 1

  // Drawn twice, like LineChart: the desktop drawing, and when the chart is
  // narrower than 560px (a container query in site.css) a phone drawing 360
  // units wide whose type renders near its stated size. There the threshold's
  // label moves under the plot, where it cannot collide with a bar.
  const wide: Layout = { W: 720, H: height, padT: 26, padB: 44, padL: 4, padR: 62, valueSize: 12, catSize: 12, thresholdLabel: true }
  const narrow: Layout = { W: 360, H: Math.round(height * 1.1), padT: 24, padB: 38, padL: 2, padR: 2, valueSize: 12, catSize: 12, thresholdLabel: false }

  function draw(L: Layout) {
    const plotH = L.H - L.padT - L.padB
    const bandW = (L.W - L.padL - L.padR) / columns.length
    const barW = Math.min(bandW * 0.62, 74)
    const y = (v: number) => L.padT + plotH - ((v - bottom) / span) * plotH
    const zeroY = y(0)
    // A label wider than its column would run into the next one: shrink it to fit.
    const fit = (text: string, size: number) => Math.min(size, (bandW - 4) / (text.length * 0.56))

    return (
      <>
        {/* zero line — the baseline every bar is measured from */}
        <line x1={L.padL} y1={zeroY} x2={L.W - L.padR + 2} y2={zeroY}
              style={{ stroke: 'var(--rbl-border-strong)' }} strokeWidth={1} />

        {threshold && (
          <g>
            <line x1={L.padL} y1={y(threshold.value)} x2={L.W - L.padR} y2={y(threshold.value)}
                  style={{ stroke: 'var(--rbl-danger)' }} strokeWidth={1.5} strokeDasharray="5 4" />
            {/* label lives in the right gutter, clear of every bar */}
            {L.thresholdLabel && (
              <text x={L.W - L.padR + 8} y={y(threshold.value) + 4} textAnchor="start" fontSize={11.5} fontWeight={800}
                    style={{ fill: 'var(--rbl-danger)' }}>
                {threshold.label}
              </text>
            )}
          </g>
        )}

        {columns.map((c, i) => {
          const cx = L.padL + i * bandW + bandW / 2
          const neg = c.value < 0
          const h = Math.max(1, Math.abs(y(c.value) - zeroY))
          const barY = neg ? zeroY : zeroY - h
          const value = c.display ?? format(c.value)
          return (
            <g key={c.label}>
              <title>{`${c.label}: ${value}`}</title>
              <rect x={cx - barW / 2} y={barY} width={barW} height={h} rx={4}
                    style={{ fill: c.color ?? 'var(--rbl-series-blue)' }} />
              <text x={cx} y={neg ? zeroY - 6 : barY - 7} textAnchor="middle" fontSize={fit(value, L.valueSize)}
                    fontWeight={c.emphasis ? 800 : 700}
                    style={{ fill: c.emphasis ? 'var(--rbl-danger)' : 'var(--rbl-text-strong)' }}>
                {value}
              </text>
              <text x={cx} y={L.padT + plotH + 20} textAnchor="middle" fontSize={fit(c.label, L.catSize)}
                    style={{ fill: 'var(--rbl-text-muted)' }}>
                {c.label}
              </text>
            </g>
          )
        })}
      </>
    )
  }

  return (
    <ChartFrame title={title} lede={lede} source={source} legend={legend}>
      {/* Height follows the width up to the drawing's own height, so a narrower
          column gets a shorter chart instead of an empty band under it. */}
      <svg className="rbl-chart-wide" viewBox={`0 0 ${wide.W} ${wide.H}`} width="100%" height={wide.H} role="img" aria-label={title}
           style={{ overflow: 'visible', width: '100%', height: 'auto', maxHeight: wide.H }}>
        {draw(wide)}
      </svg>
      <div className="rbl-chart-narrow">
        <svg viewBox={`0 0 ${narrow.W} ${narrow.H}`} width="100%" height={narrow.H} role="img" aria-label={title}
             style={{ display: 'block', overflow: 'visible', width: '100%', height: 'auto' }}>
          {draw(narrow)}
        </svg>
        {threshold && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, fontSize: 13, fontWeight: 700, color: 'var(--rbl-danger)' }}>
            <svg width="22" height="6" aria-hidden="true"><line x1="0" y1="3" x2="22" y2="3" style={{ stroke: 'var(--rbl-danger)' }} strokeWidth={1.5} strokeDasharray="5 4" /></svg>
            {threshold.label}
          </div>
        )}
      </div>
    </ChartFrame>
  )
}

type Layout = {
  W: number
  H: number
  padT: number
  padB: number
  padL: number
  padR: number
  valueSize: number
  catSize: number
  /** Print the threshold's label in the right gutter. */
  thresholdLabel: boolean
}
