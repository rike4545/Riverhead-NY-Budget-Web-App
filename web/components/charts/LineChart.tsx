import ChartFrame from './ChartFrame'

type Layout = {
  W: number
  H: number
  padL: number
  padR: number
  padT: number
  padB: number
  tickSize: number
  catSize: number
  endSize: number
  /** About how many category labels fit. */
  maxCats: number
  dot: number
  stroke: number
  /** Least vertical space between two end labels. */
  gap: number
  /** Label the first and last category and spread the rest, rather than every nth. */
  endpoints?: boolean
  /** Widen padL and padR, if needed, to fit the longest axis and end labels. */
  fitPads?: boolean
}

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
 * labeled periods — "2019", "2031–2035" — not evenly spaced numbers. Points
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
  const ticks = Array.from({ length: yTicks + 1 }, (_, i) => bottom + step * i)

  // The chart is drawn twice from the same scale. The desktop drawing is 860
  // units wide; on a phone it would shrink to about 40%, with 4px type and the
  // y-axis's last label on top of the first year. When the chart itself is
  // narrower than 560px (a container query in site.css: a phone, or a half-width
  // column on a desktop), the phone drawing takes over: 360 units wide, so its
  // type renders near its stated size, with fewer year labels.
  const wide: Layout = { W: 860, H: height, padL: 74, padR: 74, padT: 18, padB: 42, tickSize: 11, catSize: 11.5, endSize: 11.5, maxCats: 10, dot: 3.4, stroke: 2.5, gap: 14 }
  const narrow: Layout = { W: 360, H: Math.round(height * 0.8), padL: 52, padR: 52, padT: 14, padB: 34, tickSize: 12.5, catSize: 12.5, endSize: 12.5, maxCats: 4, dot: 2.8, stroke: 2.25, gap: 17, endpoints: true, fitPads: true }

  function draw(layout: Layout) {
    // A phone drawing has no room to spare, so its margins follow its labels:
    // "$20.0M" needs more than "$80M". About 0.6em a character is generous.
    const longest = (texts: string[]) => Math.max(0, ...texts.map((t) => t.length))
    const lastValues = series.map((s2) => [...s2.values].reverse().find((v) => v != null)).filter((v): v is number => v != null)
    const L: Layout = layout.fitPads
      ? {
          ...layout,
          padL: Math.max(layout.padL, Math.ceil(longest(ticks.map(format)) * layout.tickSize * 0.6) + 14),
          padR: Math.max(layout.padR, Math.ceil(longest(lastValues.map(format)) * layout.endSize * 0.62) + 14),
        }
      : layout
    const plotW = L.W - L.padL - L.padR
    const plotH = L.H - L.padT - L.padB
    const x = (i: number) => L.padL + (categories.length === 1 ? plotW / 2 : (i / (categories.length - 1)) * plotW)
    const y = (v: number) => L.padT + plotH - ((v - bottom) / span) * plotH

    // End labels are placed once for the whole chart rather than per series, so
    // converging lines (debt principal and interest both trending to zero) get
    // pushed apart instead of printing on top of each other.
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
      const at = Math.max(e.yRaw, prev + L.gap)
      placed[e.label] = at
      prev = at
    }
    // Pushing labels apart can walk the lowest one into the category axis; if it
    // does, lift the whole group by the overflow so the spacing survives.
    const floor = L.padT + plotH - 2
    const overflow = prev - floor
    if (overflow > 0) for (const k of Object.keys(placed)) placed[k] -= overflow

    // Crowded axes get thinned labels rather than overlapping text. The desktop
    // drawing labels every nth category, aiming for about ten. The phone drawing
    // labels every category when they all fit, and otherwise the first and the
    // last with the rest spread evenly between them.
    const every = Math.max(1, Math.ceil(categories.length / L.maxCats))
    const labelW = Math.max(...categories.map((c) => c.length)) * L.catSize * 0.56 + 10
    const fitting = Math.max(2, Math.floor(plotW / labelW) + 1)
    const n = categories.length <= fitting ? categories.length : Math.min(L.maxCats, fitting, categories.length)
    const spread = new Set(n < 2 ? [0] : Array.from({ length: n }, (_, j) => Math.round((j * (categories.length - 1)) / (n - 1))))
    const labelled = (i: number) => (L.endpoints ? spread.has(i) : i % every === 0)
    // Points closer than 12 units read as a dotted line, not as points: the
    // phone drawing leaves their dots off and keeps the hover targets.
    const dots = !L.endpoints || plotW / Math.max(1, categories.length - 1) >= 12

    return (
      <>
        {/* recessive gridlines — present enough to read a value off, quiet enough to ignore */}
        {ticks.map((t) => (
          <g key={t}>
            <line x1={L.padL} y1={y(t)} x2={L.W - L.padR} y2={y(t)}
                  style={{ stroke: 'var(--rbl-border-subtle)' }} strokeWidth={1} />
            <text x={L.padL - 10} y={y(t) + 4} textAnchor="end" fontSize={L.tickSize}
                  style={{ fill: 'var(--rbl-text-muted)' }}>{format(t)}</text>
          </g>
        ))}

        {categories.map((c, i) => (
          labelled(i) ? (
            <text key={c} x={x(i)} y={L.padT + plotH + 20} textAnchor="middle" fontSize={L.catSize}
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
              <path d={d} fill="none" strokeWidth={L.stroke} strokeLinejoin="round" strokeLinecap="round"
                    style={{ stroke: s.color }} />
              {pts.map((pt) => (
                <g key={pt.i}>
                  {/* a generous invisible target so the tooltip is reachable */}
                  <circle cx={pt.cx} cy={pt.cy} r={10} style={{ fill: 'transparent' }}>
                    <title>{`${s.label} · ${categories[pt.i]}: ${format(pt.v)}`}</title>
                  </circle>
                  {dots && <circle cx={pt.cx} cy={pt.cy} r={L.dot} strokeWidth={2}
                          style={{ fill: s.color, stroke: 'var(--rbl-surface)' }} />}
                </g>
              ))}
              {/* direct end-label: identity without a trip to the legend */}
              <text x={last.cx + 10} y={(placed[s.label] ?? last.cy) + 4} fontSize={L.endSize} fontWeight={800}
                    style={{ fill: s.color }}>{format(last.v)}</text>
            </g>
          )
        })}
      </>
    )
  }

  const label = `${title}. ${series.map((s) => s.label).join(', ')} across ${categories[0]} to ${categories[categories.length - 1]}.`

  return (
    <ChartFrame
      title={title}
      lede={lede}
      source={source}
      legend={series.length > 1 ? series.map((s) => ({ label: s.label, color: s.color })) : undefined}
    >
      {/* Height follows the width up to the drawing's own height, so a narrower
          column gets a shorter chart instead of an empty band under it. */}
      <svg className="rbl-chart-wide" viewBox={`0 0 ${wide.W} ${wide.H}`} width="100%" height={wide.H} role="img" aria-label={label}
           style={{ overflow: 'visible', width: '100%', height: 'auto', maxHeight: wide.H }}>
        {draw(wide)}
      </svg>
      <svg className="rbl-chart-narrow" viewBox={`0 0 ${narrow.W} ${narrow.H}`} width="100%" height={narrow.H} role="img" aria-label={label}
           style={{ overflow: 'visible', width: '100%', height: 'auto' }}>
        {draw(narrow)}
      </svg>
    </ChartFrame>
  )
}
