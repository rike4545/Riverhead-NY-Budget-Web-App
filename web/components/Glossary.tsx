import { glossaryList } from '../lib/glossary'

// A plain-English glossary of every budget/payroll term used on the site.
export default function Glossary() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 12 }}>
      {glossaryList.map((g) => (
        <div key={g.term} style={{ background: 'var(--rbl-surface-2)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 12, padding: 14 }}>
          <div style={{ fontWeight: 900, color: 'var(--rbl-title)', marginBottom: 4 }}>{g.term}</div>
          <div style={{ color: 'var(--rbl-text-body)', fontSize: 14, lineHeight: 1.5 }}>{g.plain}</div>
        </div>
      ))}
    </div>
  )
}
