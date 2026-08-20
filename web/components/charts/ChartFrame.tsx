import type { ReactNode } from 'react'

// Shared chrome for every chart on the site: a heading that names the series
// (so a single-series chart needs no legend box), optional lede, the plot, an
// optional legend, and the source line. Keeping this in one place is what makes
// twelve charts read as one system rather than twelve one-off drawings.
export default function ChartFrame({
  title, lede, source, legend, children,
}: {
  title: string
  lede?: string
  source?: string
  legend?: { label: string; color: string }[]
  children: ReactNode
}) {
  return (
    <figure style={{ margin: 0 }}>
      <figcaption>
        <div style={{ color: 'var(--rbl-title)', fontSize: 16, fontWeight: 800 }}>{title}</div>
        {lede && (
          <p style={{ color: 'var(--rbl-text-body)', fontSize: 13.5, lineHeight: 1.55, margin: '4px 0 0' }}>{lede}</p>
        )}
      </figcaption>

      <div style={{ marginTop: 12 }}>{children}</div>

      {legend && legend.length > 0 && (
        <ul style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 16px', listStyle: 'none', padding: 0, margin: '12px 0 0' }}>
          {legend.map((l) => (
            <li key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12.5, color: 'var(--rbl-text-body)' }}>
              <span aria-hidden style={{ width: 12, height: 12, borderRadius: 3, background: l.color, flexShrink: 0 }} />
              {l.label}
            </li>
          ))}
        </ul>
      )}

      {source && (
        <p style={{ color: 'var(--rbl-text-muted)', fontSize: 12, lineHeight: 1.5, margin: '10px 0 0' }}>{source}</p>
      )}
    </figure>
  )
}
