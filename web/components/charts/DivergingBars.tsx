import ChartFrame from './ChartFrame'

export type DivergingRow = { label: string; value: number; display: string; note?: string }

/**
 * Bars that run left or right from a centre line, for a margin between two
 * sides. The side each bar leans to is also written in the figure ("Halpin +60"),
 * so a reader who cannot tell the two colours apart loses nothing.
 */
export default function DivergingBars({
  title, lede, source, rows, positive, negative,
}: {
  title: string
  lede?: string
  source?: string
  rows: DivergingRow[]
  positive: { label: string; color: string }
  negative: { label: string; color: string }
}) {
  const max = Math.max(...rows.map((r) => Math.abs(r.value)), 1)
  return (
    <ChartFrame title={title} lede={lede} source={source} legend={[positive, negative]}>
      <div style={{ display: 'grid', gap: 6 }}>
        {rows.map((r) => {
          const w = (Math.abs(r.value) / max) * 50
          const pos = r.value >= 0
          return (
            <div key={r.label} style={{ display: 'grid', gridTemplateColumns: '38px minmax(0,1fr) 92px', gap: 8, alignItems: 'center' }}>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--rbl-text-strong)' }}>{r.label}</span>
              <div role="img" aria-label={`${r.label}: ${r.display}`} style={{ position: 'relative', height: 14, background: 'var(--rbl-track)', borderRadius: 4 }}>
                <div aria-hidden style={{ position: 'absolute', left: '50%', top: -2, bottom: -2, width: 1, background: 'var(--rbl-border-strong)' }} />
                <div style={{ position: 'absolute', top: 0, bottom: 0, left: pos ? '50%' : `${50 - w}%`, width: `${Math.max(w, 0.8)}%`, background: pos ? positive.color : negative.color, borderRadius: 4 }} />
              </div>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--rbl-text-strong)', textAlign: 'right', whiteSpace: 'nowrap' }}>{r.display}</span>
            </div>
          )
        })}
      </div>
    </ChartFrame>
  )
}
