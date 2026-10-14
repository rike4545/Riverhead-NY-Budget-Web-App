import TrendColors from './TrendColors'

const base = process.env.NEXT_PUBLIC_BASE_PATH || ''

export default function ExperienceFooter() {
  return (
    <footer style={{ marginTop: 48, padding: '22px 0 30px', borderTop: '1px solid var(--rbl-border-subtle)', display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', gap: 20, alignItems: 'start' }}>
      <div style={{ maxWidth: 760 }}>
        <div style={{ color: 'var(--rbl-title)', fontWeight: 700, fontSize: 15 }}>Independent. Source-first. Built for residents.</div>
        <p style={{ color: 'var(--rbl-text-muted)', fontSize: 14, lineHeight: 1.6, margin: '6px 0 0' }}>
          Riverhead Budget Live is not affiliated with the Town of Riverhead. Important figures should be checked against the linked official record. Google Analytics is used to understand aggregate site usage; no account is required to use the site.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginTop: 10 }}>
          <a href={`${base}/sources/`} style={{ color: 'var(--rbl-link)', fontWeight: 600, fontSize: 14, textDecoration: 'none' }}>Sources & methods →</a>
          <a href={`${base}/data-quality/`} style={{ color: 'var(--rbl-link)', fontWeight: 600, fontSize: 14, textDecoration: 'none' }}>Data quality →</a>
        </div>
      </div>
      <div style={{ justifySelf: 'end' }}><TrendColors /></div>
    </footer>
  )
}
