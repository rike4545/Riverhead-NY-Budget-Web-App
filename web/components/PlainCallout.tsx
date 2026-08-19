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
        background: 'var(--rbl-info-bg)', border: '1px solid var(--rbl-info-border)', borderLeft: '6px solid var(--rbl-accent-border)',
        borderRadius: 14, padding: '16px 18px', marginBottom: 18,
      }}
    >
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
        <span aria-hidden style={{ fontSize: 18 }}>💡</span>
        <strong style={{ color: 'var(--rbl-title)', fontSize: 16 }}>{title}</strong>
      </div>
      <div style={{ color: 'var(--rbl-info-text)', fontSize: 15, lineHeight: 1.55 }}>{children}</div>
      {tips && tips.length > 0 && (
        <ul style={{ margin: '12px 0 0', paddingLeft: 0, listStyle: 'none', display: 'grid', gap: 8 }}>
          {tips.map((t) => (
            <li key={t.label} style={{ display: 'flex', gap: 8, alignItems: 'baseline', fontSize: 14.5, color: 'var(--rbl-info-text)', lineHeight: 1.45 }}>
              <span aria-hidden style={{ color: 'var(--rbl-accent)', fontWeight: 900 }}>›</span>
              <span><strong>{t.label}:</strong> {t.text}</span>
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
      <summary style={{ cursor: 'pointer', fontWeight: 800, color: 'var(--rbl-accent)' }}>{label}</summary>
      <dl style={{ margin: '10px 0 0', display: 'grid', gap: 8 }}>
        {items.map((i) => (
          <div key={i.term}>
            <dt style={{ fontWeight: 800, color: 'var(--rbl-title)' }}>{i.term}</dt>
            <dd style={{ margin: '2px 0 0', color: 'var(--rbl-text-body)', fontSize: 14, lineHeight: 1.45 }}>{i.plain}</dd>
          </div>
        ))}
      </dl>
    </details>
  )
}
