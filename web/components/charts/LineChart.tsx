import ChartFrame from './ChartFrame'

export type LineSeries = {
  label: string
  color: string
  /** One value per category, in the same order as `categories`. null = gap. */
  values: (number | null)[]
  /** Fill under the line. Only sensible for a single-series chart. */
  area?: boolean
}

/**
 * Multi-series line chart over an ordered category axis.
 *
 * Categories rather than a numeric x-scale, because this site's series are
 * labelled periods — "2019", "2031–2035" — not evenly spaced numbers. Points
 * are placed by index, so an irregular band sits beside a single year without
 * distorting the spacing.
 *
 * Server-rendered SVG with no client JS, which is what the static export needs.
 * Every colour goes through `style`, never a presentation attribute: var() does
 * not resolve in fill=/stroke=, so a themed chart has to set them as CSS.
 */
export default function LineChart({
  title, lede, source, categories, series, format,
  height = 300, zeroBaseline = true, yTicks = 4,
}: {
  title: string
  lede?: string
  source?: string
  categories: string[]
  series: LineSeries[]
  format: (n: number) => string
  height?: number
  /** Money series should start at zero; an indexed or rate series need not. */
  zeroBaseline?: boolean
  yTicks?: number
}) {
  const W = 860, H = height
  const padL = 74, padR = 74, padT = 18, padB = 42
  const plotW = W - padL - padR
  const plotH = H - padT - padB

  const all = series.flatMap((s) => s.values.filter((v): v is number => v != null))
  const rawMax = Math.max(...all, 1)
  const rawMin = Math.min(...all, 0)
  // Round the axis to a human step (1, 2, 2.5 or 5 x a power of ten) so the
  // gridline labels read $2.5M rather than $2.6M.
  const niceStep = (rough: number) => {
    const mag = Math.pow(10, Math.floor(Math.log10(Math.abs(rough) || 1)))
    const n = rough / mag
    return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * mag
  }
  const bottom = zeroBaseline ? Math.min(0, rawMin) : rawMin - (rawMax - rawMin) * 0.08
  const step = niceStep((rawMax * 1.05 - bottom) / yTicks)
  const top = bottom + step * yTicks
  const span = top - bottom || 1

  const x = (i: number) => padL + (categories.length === 1 ? plotW / 2 : (i / (categories.length - 1)) * plotW)
  const y = (v: number) => padT + plotH - ((v - bottom) / span) * plotH

  const ticks = Array.from({ length: yTicks + 1 }, (_, i) => bottom + step * i)

  // End labels are placed once for the whole chart rather than per series, so
  // converging lines (debt principal and interest both trending to zero) get
  // pushed apart instead of printing on top of each other.
  const MIN_GAP = 14
  const endLabels = series
    .map((s2) => {
      const lastIdx = s2.values.reduce<number>((acc, v, i) => (v == null ? acc : i), -1)
      const v = lastIdx >= 0 ? (s2.values[lastIdx] as number) : null
      return v == null ? null : { label: s2.label, color: s2.color, value: v, idx: lastIdx, yRaw: y(v) }
    })
    .filter((e): e is { label: string; color: string; value: number; idx: number; yRaw: number } => e != null)
    .sort((a, b) => a.yRaw - b.yRaw)
  const placed: Record<string, number> = {}
  let prev = -Infinity
  for (const e of endLabels) {
    const at = Math.max(e.yRaw, prev + MIN_GAP)
    placed[e.label] = at
    prev = at
  }
  // Pushing labels apart can walk the lowest one into the category axis; if it
  // does, lift the whole group by the overflow so the spacing survives.
  const floor = padT + plotH - 2
  const overflow = prev - floor
  if (overflow > 0) for (const k of Object.keys(placed)) placed[k] -= overflow
  // Crowded axes get every other label rather than overlapping text.
  const labelEvery = categories.length > 10 ? 2 : 1

  return (
    <ChartFrame
      title={title}
      lede={lede}
      source={source}
      legend={series.length > 1 ? series.map((s) => ({ label: s.label, color: s.color })) : undefined}
    >
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} role="img"
           aria-label={`${title}. ${series.map((s) => s.label).join(', ')} across ${categories[0]} to ${categories[categories.length - 1]}.`}
           style={{ display: 'block', overflow: 'visible' }}>
        {/* recessive gridlines — present enough to read a value off, quiet enough to ignore */}
        {ticks.map((t) => (
          <g key={t}>
            <line x1={padL} y1={y(t)} x2={W - padR} y2={y(t)}
                  style={{ stroke: 'var(--rbl-border-subtle)' }} strokeWidth={1} />
            <text x={padL - 10} y={y(t) + 4} textAnchor="end" fontSize={11}
                  style={{ fill: 'var(--rbl-text-muted)' }}>{format(t)}</text>
          </g>
        ))}

        {categories.map((c, i) => (
          i % labelEvery === 0 ? (
            <text key={c} x={x(i)} y={padT + plotH + 20} textAnchor="middle" fontSize={11.5}
                  style={{ fill: 'var(--rbl-text-muted)' }}>{c}</text>
          ) : null
        ))}

        {series.map((s) => {
          const pts = s.values
            .map((v, i) => (v == null ? null : { i, v, cx: x(i), cy: y(v) }))
            .filter((p): p is { i: number; v: number; cx: number; cy: number } => p != null)
          if (!pts.length) return null
          const d = pts.map((p, k) => `${k === 0 ? 'M' : 'L'} ${p.cx.toFixed(1)} ${p.cy.toFixed(1)}`).join(' ')
          const last = pts[pts.length - 1]
          return (
            <g key={s.label}>
              {s.area && (
                <path
                  d={`${d} L ${last.cx.toFixed(1)} ${y(Math.max(0, bottom)).toFixed(1)} L ${pts[0].cx.toFixed(1)} ${y(Math.max(0, bottom)).toFixed(1)} Z`}
                  style={{ fill: s.color, opacity: 0.12 }}
                />
              )}
              <path d={d} fill="none" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round"
                    style={{ stroke: s.color }} />
              {pts.map((pt) => (
                <g key={pt.i}>
                  {/* a generous invisible target so the tooltip is reachable */}
                  <circle cx={pt.cx} cy={pt.cy} r={10} style={{ fill: 'transparent' }}>
                    <title>{`${s.label} · ${categories[pt.i]}: ${format(pt.v)}`}</title>
                  </circle>
                  <circle cx={pt.cx} cy={pt.cy} r={3.4} strokeWidth={2}
                          style={{ fill: s.color, stroke: 'var(--rbl-surface)' }} />
                </g>
              ))}
              {/* direct end-label: identity without a trip to the legend */}
              <text x={last.cx + 10} y={(placed[s.label] ?? last.cy) + 4} fontSize={11.5} fontWeight={800}
                    style={{ fill: s.color }}>{format(last.v)}</text>
            </g>
          )
        })}
      </svg>
    </ChartFrame>
  )
}
