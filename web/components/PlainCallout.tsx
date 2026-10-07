import type { ReactNode } from 'react'

// A friendly "In plain English" intro box for the top of a page.
export default function PlainCallout({
  title = 'In plain English',
  children,
  tips,
}: {
  title?: string
  children: ReactNode
  tips?: { label: string; text: string }[]
}) {
  return (
    <section
      style={{
        background: 'var(--rbl-info-bg)', border: '1px solid var(--rbl-info-border)',
        borderRadius: 14, padding: '18px 20px 20px', marginBottom: 20,
      }}
    >
      <h2 style={{ margin: '0 0 6px', color: 'var(--rbl-title)', fontSize: 18, fontWeight: 700, lineHeight: 1.3 }}>{title}</h2>
      <div style={{ color: 'var(--rbl-info-text)', fontSize: 16.5, lineHeight: 1.6, maxWidth: '72ch' }}>{children}</div>
      {tips && tips.length > 0 && (
        <ul style={{ margin: '12px 0 0', paddingLeft: 20, display: 'grid', gap: 6, maxWidth: '72ch' }}>
          {tips.map((t) => (
            <li key={t.label} style={{ fontSize: 15.5, color: 'var(--rbl-info-text)', lineHeight: 1.5, paddingLeft: 2 }}>
              <strong>{t.label}:</strong> {t.text}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

// A collapsible "What do these columns mean?" guide for data tables.
export function ColumnGuide({ items, label = 'What do these columns mean?' }: { items: { term: string; plain: string }[]; label?: string }) {
  return (
    <details style={{ background: 'var(--rbl-surface-2)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 12, padding: '10px 14px', marginBottom: 12 }}>
      <summary style={{ cursor: 'pointer', fontWeight: 600, color: 'var(--rbl-accent)' }}>{label}</summary>
      <dl style={{ margin: '10px 0 0', display: 'grid', gap: 8 }}>
        {items.map((i) => (
          <div key={i.term}>
            <dt style={{ fontWeight: 700, color: 'var(--rbl-title)' }}>{i.term}</dt>
            <dd style={{ margin: '2px 0 0', color: 'var(--rbl-text-body)', fontSize: 15, lineHeight: 1.5 }}>{i.plain}</dd>
          </div>
        ))}
      </dl>
    </details>
  )
}
