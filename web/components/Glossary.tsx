import { glossaryList } from '../lib/glossary'

// A plain-English glossary of every budget/payroll term used on the site.
export default function Glossary() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 12 }}>
      {glossaryList.map((g) => (
        <div key={g.term} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 14 }}>
          <div style={{ fontWeight: 900, color: '#284a69', marginBottom: 4 }}>{g.term}</div>
          <div style={{ color: '#475569', fontSize: 14, lineHeight: 1.5 }}>{g.plain}</div>
        </div>
      ))}
    </div>
  )
}
