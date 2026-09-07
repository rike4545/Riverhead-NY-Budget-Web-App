type TrailItem = { href: string; label: string; text: string }

type RecordTrailProps = {
  title?: string
  intro?: string
  items: TrailItem[]
}

export default function RecordTrail({
  title = 'Follow the record trail',
  intro = 'A number is more useful when you can trace it to the next related record.',
  items,
}: RecordTrailProps) {
  const base = process.env.NEXT_PUBLIC_BASE_PATH || ''

  return (
    <section
      aria-labelledby="record-trail-title"
      style={{
        background: 'var(--rbl-surface)',
        border: '1px solid var(--rbl-border-subtle)',
        borderRadius: 18,
        padding: 20,
        boxShadow: '0 14px 34px var(--rbl-shadow)',
      }}
    >
      <div style={{ color: 'var(--rbl-badge)', fontSize: 11, fontWeight: 950, letterSpacing: 1.1, textTransform: 'uppercase' }}>
        Evidence path
      </div>
      <h2 id="record-trail-title" style={{ margin: '5px 0 6px', fontSize: 22 }}>
        {title}
      </h2>
      <p style={{ color: 'var(--rbl-text-muted)', lineHeight: 1.55, margin: '0 0 14px', maxWidth: 900 }}>
        {intro}
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 10 }}>
        {items.map((item) => (
          <a
            key={`${item.href}:${item.label}`}
            href={`${base}${item.href}`}
            style={{
              display: 'block',
              color: 'inherit',
              textDecoration: 'none',
              background: 'var(--rbl-surface-2)',
              border: '1px solid var(--rbl-border-subtle)',
              borderRadius: 14,
              padding: 14,
            }}
          >
            <strong style={{ color: 'var(--rbl-title)' }}>{item.label} →</strong>
            <div style={{ color: 'var(--rbl-text-muted)', fontSize: 12.5, lineHeight: 1.45, marginTop: 5 }}>{item.text}</div>
          </a>
        ))}
      </div>
    </section>
  )
}
