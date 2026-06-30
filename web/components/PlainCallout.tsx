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
        background: '#eef6ff', border: '1px solid #bcd9f5', borderLeft: '6px solid #1f5f8f',
        borderRadius: 14, padding: '16px 18px', marginBottom: 18,
      }}
    >
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
        <span aria-hidden style={{ fontSize: 18 }}>💡</span>
        <strong style={{ color: '#12385b', fontSize: 16 }}>{title}</strong>
      </div>
      <div style={{ color: '#1f3a52', fontSize: 15, lineHeight: 1.55 }}>{children}</div>
      {tips && tips.length > 0 && (
        <ul style={{ margin: '12px 0 0', paddingLeft: 0, listStyle: 'none', display: 'grid', gap: 8 }}>
          {tips.map((t) => (
            <li key={t.label} style={{ display: 'flex', gap: 8, alignItems: 'baseline', fontSize: 14.5, color: '#1f3a52', lineHeight: 1.45 }}>
              <span aria-hidden style={{ color: '#1f5f8f', fontWeight: 900 }}>›</span>
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
    <details style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '10px 14px', marginBottom: 12 }}>
      <summary style={{ cursor: 'pointer', fontWeight: 800, color: '#1f5f8f' }}>{label}</summary>
      <dl style={{ margin: '10px 0 0', display: 'grid', gap: 8 }}>
        {items.map((i) => (
          <div key={i.term}>
            <dt style={{ fontWeight: 800, color: '#12385b' }}>{i.term}</dt>
            <dd style={{ margin: '2px 0 0', color: '#475569', fontSize: 14, lineHeight: 1.45 }}>{i.plain}</dd>
          </div>
        ))}
      </dl>
    </details>
  )
}
