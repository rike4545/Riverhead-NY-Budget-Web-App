import ChartFrame from './ChartFrame'

export type StatusYear = {
  year: string
  /** Key into the tones map. */
  status: string
  detail?: string
}

/**
 * One cell per year, coloured by state — a compliance record read left to right.
 *
 * Each cell carries a glyph as well as a colour, because a status that is only
 * distinguishable by hue fails for a colourblind reader and disappears entirely
 * in print or forced-colours mode.
 */
export default function StatusStrip({
  title, lede, source, years, tones,
}: {
  title: string
  lede?: string
  source?: string
  years: StatusYear[]
  tones: Record<string, { label: string; color: string; bg: string; glyph: string }>
}) {
  const used = Array.from(new Set(years.map((y) => y.status)))
  return (
    <ChartFrame
      title={title}
      lede={lede}
      source={source}
      legend={used.map((k) => ({ label: `${tones[k].glyph}  ${tones[k].label}`, color: tones[k].color }))}
    >
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${years.length}, minmax(0,1fr))`, gap: 6 }}>
        {years.map((y) => {
          const t = tones[y.status]
          return (
            <div key={y.year} title={y.detail ?? `${y.year}: ${t.label}`}
                 style={{
                   background: t.bg, border: `1px solid ${t.color}`, borderRadius: 8,
                   padding: '10px 4px', textAlign: 'center',
                 }}>
              <div aria-hidden style={{ fontSize: 15, lineHeight: 1.1, color: t.color, fontWeight: 900 }}>{t.glyph}</div>
              <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--rbl-text-strong)', marginTop: 3 }}>{y.year}</div>
              <span style={{
                position: 'absolute', width: 1, height: 1, overflow: 'hidden',
                clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap',
              }}>
                {t.label}
              </span>
            </div>
          )
        })}
      </div>
    </ChartFrame>
  )
}
