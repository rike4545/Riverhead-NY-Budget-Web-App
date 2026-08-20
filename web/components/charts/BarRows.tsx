import ChartFrame from './ChartFrame'

export type BarRow = {
  label: string
  value: number
  /** Shown at the right of the bar. Defaults to the formatted value. */
  display?: string
  /** Small grey line under the label. */
  note?: string
  color?: string
  /** Draws the row in the accent color and bolds it — for "this is us". */
  highlight?: boolean
}

/**
 * Horizontal bars, one per row, on a zero baseline.
 *
 * Horizontal beats vertical whenever the categories carry real names: the label
 * sits on the same line as its bar and reads left-to-right, so nothing has to be
 * rotated or truncated. Bars are laid out with plain block elements rather than
 * SVG so they reflow on a phone without a viewBox fighting the layout.
 */
export default function BarRows({
  title, lede, source, rows, format, max, legend, barColor = 'var(--rbl-series-blue)',
}: {
  title: string
  lede?: string
  source?: string
  rows: BarRow[]
  format: (n: number) => string
  /** Override the scale maximum; defaults to the largest value present. */
  max?: number
  legend?: { label: string; color: string }[]
  barColor?: string
}) {
  const scaleMax = max ?? Math.max(...rows.map((r) => Math.abs(r.value)), 1)

  return (
    <ChartFrame title={title} lede={lede} source={source} legend={legend}>
      <div style={{ display: 'grid', gap: 12 }}>
        {rows.map((r) => {
          const pct = scaleMax === 0 ? 0 : Math.max(0, Math.abs(r.value) / scaleMax) * 100
          const fill = r.color ?? (r.highlight ? 'var(--rbl-series-gold)' : barColor)
          return (
            <div key={r.label}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
                <span style={{
                  fontSize: 13.5, color: 'var(--rbl-text-strong)',
                  fontWeight: r.highlight ? 800 : 600,
                }}>
                  {r.label}
                </span>
                <span style={{
                  fontSize: 13.5, fontWeight: 800, whiteSpace: 'nowrap',
                  color: r.highlight ? 'var(--rbl-title)' : 'var(--rbl-text-strong)',
                }}>
                  {r.display ?? format(r.value)}
                </span>
              </div>
              {/* the track doubles as the zero baseline — every bar starts at the same x */}
              <div
                style={{ background: 'var(--rbl-track)', borderRadius: 5, height: 12, overflow: 'hidden', marginTop: 5 }}
                role="img"
                aria-label={`${r.label}: ${r.display ?? format(r.value)}`}
              >
                <div style={{ width: `${pct}%`, height: '100%', background: fill, borderRadius: 5 }} />
              </div>
              {r.note && (
                <div style={{ color: 'var(--rbl-text-muted)', fontSize: 12, marginTop: 4 }}>{r.note}</div>
              )}
            </div>
          )
        })}
      </div>
    </ChartFrame>
  )
}
