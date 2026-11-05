import ChartFrame from './ChartFrame'

export type PairRow = { label: string; a: number; b: number | null; note?: string }

/**
 * Two bars per row on one zero-based scale: a plan beside the result, for
 * comparing what was budgeted with what was spent. A row with no second figure
 * says so instead of drawing an empty bar.
 */
export default function PairedBars({
  title, lede, source, rows, aLabel, bLabel, format, bOverColor = 'var(--rbl-danger)',
}: {
  title: string
  lede?: string
  source?: string
  rows: PairRow[]
  aLabel: string
  bLabel: string
  format: (n: number) => string
  bOverColor?: string
}) {
  const max = Math.max(...rows.flatMap((r) => [r.a, r.b ?? 0]), 1)
  const bar = (v: number, color: string, label: string) => (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', gap: 10, alignItems: 'center' }}>
      <div role="img" aria-label={label} style={{ background: 'var(--rbl-track)', borderRadius: 5, height: 10, overflow: 'hidden' }}>
        <div style={{ width: `${(v / max) * 100}%`, height: '100%', background: color, borderRadius: 5, minWidth: v > 0 ? 2 : 0 }} />
      </div>
      <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--rbl-text-strong)', whiteSpace: 'nowrap', minWidth: 74, textAlign: 'right' }}>{format(v)}</span>
    </div>
  )
  return (
    <ChartFrame
      title={title}
      lede={lede}
      source={source}
      legend={[{ label: aLabel, color: 'var(--rbl-series-slate)' }, { label: bLabel, color: 'var(--rbl-series-blue)' }, { label: `${bLabel}, above ${aLabel.toLowerCase()}`, color: bOverColor }]}
    >
      <div style={{ display: 'grid', gap: 16 }}>
        {rows.map((r) => (
          <div key={r.label}>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--rbl-text-strong)', marginBottom: 5 }}>{r.label}</div>
            <div style={{ display: 'grid', gap: 5 }}>
              {bar(r.a, 'var(--rbl-series-slate)', `${r.label}, ${aLabel}: ${format(r.a)}`)}
              {r.b === null
                ? <span style={{ fontSize: 12.5, color: 'var(--rbl-text-muted)' }}>{bLabel}: not reported</span>
                : bar(r.b, r.b > r.a ? bOverColor : 'var(--rbl-series-blue)', `${r.label}, ${bLabel}: ${format(r.b)}`)}
            </div>
            {r.note && <div style={{ fontSize: 12, color: 'var(--rbl-text-muted)', marginTop: 4 }}>{r.note}</div>}
          </div>
        ))}
      </div>
    </ChartFrame>
  )
}
