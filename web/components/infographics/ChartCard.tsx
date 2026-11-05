import type { ReactNode } from 'react'

// The flat card every infographic sits in, so a chart looks the same on every page.
export default function ChartCard({ children, id }: { children: ReactNode; id?: string }) {
  return (
    <section id={id} data-infographic style={{ background: 'var(--rbl-surface)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 16, padding: 20, marginBottom: 16, marginTop: 16 }}>
      {children}
    </section>
  )
}
