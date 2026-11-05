import ChartFrame from './ChartFrame'

export type StackSegment = { label: string; value: number; note?: string }

const PALETTE = [
  'var(--rbl-series-blue)', 'var(--rbl-series-gold)', 'var(--rbl-series-teal)',
  'var(--rbl-series-indigo)', 'var(--rbl-series-violet)',
]
const OTHER = 'var(--rbl-series-slate)'

/**
 * One bar split into shares of a whole, with each share named and counted in a
 * list underneath. The list is the table: a screen reader or a reader quoting a
 * figure never has to read it off a colour. Small shares are folded into one
 * "other" segment so every label that is drawn can be read.
 */
export default function StackedBar({
  title, lede, source, segments, format, keep = 5, otherLabel = 'All other',
}: {
  title: string
  lede?: string
  source?: string
  segments: StackSegment[]
  format: (n: number) => string
  /** How many of the largest shares to name before folding the rest together. */
  keep?: number
  otherLabel?: string
}) {
  const sorted = segments.filter((s) => s.value > 0).sort((a, b) => b.value - a.value)
  const head = sorted.slice(0, keep)
  const rest = sorted.slice(keep)
  const rows = rest.length > 0
    ? [...head, { label: `${otherLabel} (${rest.length})`, value: rest.reduce((n, s) => n + s.value, 0), note: rest.map((s) => s.label).join(', ') }]
    : head
  const total = rows.reduce((n, r) => n + r.value, 0) || 1
  const colour = (i: number) => (rest.length > 0 && i === rows.length - 1 ? OTHER : PALETTE[i % PALETTE.length])

  return (
    <ChartFrame title={title} lede={lede} source={source}>
      <div
        role="img"
        aria-label={`${title}: ${rows.map((r) => `${r.label} ${((r.value / total) * 100).toFixed(1)}%`).join('; ')}`}
        style={{ display: 'flex', height: 34, borderRadius: 8, overflow: 'hidden', gap: 2, background: 'var(--rbl-track)' }}
      >
        {rows.map((r, i) => (
          <div key={r.label} title={`${r.label}: ${format(r.value)}`} style={{ width: `${(r.value / total) * 100}%`, background: colour(i), minWidth: 3 }} />
        ))}
      </div>
      <ul style={{ listStyle: 'none', padding: 0, margin: '12px 0 0', display: 'grid', gap: 8 }}>
        {rows.map((r, i) => (
          <li key={r.label} style={{ display: 'grid', gridTemplateColumns: '14px minmax(0,1fr) auto', gap: '2px 10px', alignItems: 'baseline' }}>
            <span aria-hidden style={{ width: 12, height: 12, borderRadius: 3, background: colour(i), alignSelf: 'center' }} />
            <span style={{ fontSize: 13.5, color: 'var(--rbl-text-strong)', fontWeight: 600 }}>{r.label}</span>
            <span style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--rbl-text-strong)', whiteSpace: 'nowrap' }}>
              {((r.value / total) * 100).toFixed(1)}% · {format(r.value)}
            </span>
            {r.note && <span style={{ gridColumn: '2 / 4', fontSize: 12, color: 'var(--rbl-text-muted)' }}>{r.note}</span>}
          </li>
        ))}
      </ul>
    </ChartFrame>
  )
}
