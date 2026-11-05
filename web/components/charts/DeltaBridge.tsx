import ChartFrame from './ChartFrame'

export type BridgeStep =
  /** A running position, drawn from the starting level to where the changes so far have taken it. */
  | { kind: 'total'; label: string; value: number; note?: string }
  /** A change, drawn floating from where the last bar ended. */
  | { kind: 'change'; label: string; delta: number; note?: string }

/**
 * A bridge from one figure to another through the changes between them.
 *
 * The scale is the change only, measured from the starting level, not from
 * zero: a $62 million levy that moves by half a million would otherwise be a
 * hair on a bar 62 million long. The starting level is named in the lede and the
 * axis says so, so the baseline is never a surprise. Every bar also carries its
 * figure and a sign in words, so nothing depends on colour.
 */
export default function DeltaBridge({
  title, lede, source, baseLabel, baseValue, steps, format, signed,
}: {
  title: string
  lede?: string
  source?: string
  baseLabel: string
  baseValue: number
  steps: BridgeStep[]
  format: (n: number) => string
  /** Formats a signed change, e.g. "+$1.7M" / "-$0.6M". */
  signed: (n: number) => string
}) {
  let run = 0
  const bars = steps.map((s) => {
    if (s.kind === 'total') {
      const end = s.value - baseValue
      const b = { s, start: 0, end, label: s.label, text: `${format(s.value)} (${signed(end)} from ${baseLabel})` }
      run = end
      return b
    }
    const start = run
    run += s.delta
    return { s, start, end: run, label: s.label, text: signed(s.delta) }
  })
  const points = [0, ...bars.flatMap((b) => [b.start, b.end])]
  const lo = Math.min(...points)
  const hi = Math.max(...points)
  const span = hi - lo || 1
  const x = (v: number) => ((v - lo) / span) * 100

  return (
    <ChartFrame title={title} lede={lede} source={source}>
      <div style={{ display: 'grid', gap: 12 }}>
        {bars.map((b) => {
          const left = x(Math.min(b.start, b.end))
          const width = Math.max(1.2, Math.abs(x(b.end) - x(b.start)))
          const total = b.s.kind === 'total'
          const fill = total ? 'var(--rbl-series-blue)' : b.end >= b.start ? 'var(--rbl-warn)' : 'var(--rbl-success)'
          return (
            <div key={b.label}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '2px 12px', alignItems: 'baseline', flexWrap: 'wrap' }}>
                <span style={{ fontSize: 13.5, fontWeight: total ? 800 : 600, color: 'var(--rbl-text-strong)' }}>{b.label}</span>
                <span style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--rbl-text-strong)', textAlign: 'right' }}>{b.text}</span>
              </div>
              <div role="img" aria-label={`${b.label}: ${b.text}`} style={{ position: 'relative', height: 12, marginTop: 5, background: 'var(--rbl-track)', borderRadius: 5 }}>
                <div aria-hidden style={{ position: 'absolute', left: `${x(0)}%`, top: -3, bottom: -3, width: 1, background: 'var(--rbl-border-strong)' }} />
                <div style={{ position: 'absolute', left: `${left}%`, width: `${width}%`, top: 0, bottom: 0, background: fill, borderRadius: 5 }} />
              </div>
              {b.s.note && <div style={{ fontSize: 12, color: 'var(--rbl-text-muted)', marginTop: 4 }}>{b.s.note}</div>}
            </div>
          )
        })}
      </div>
      <p style={{ margin: '10px 0 0', fontSize: 12, color: 'var(--rbl-text-muted)' }}>
        The thin vertical line is {baseLabel}: {format(baseValue)}. Bars show change from that line, not the whole amount.
      </p>
    </ChartFrame>
  )
}
