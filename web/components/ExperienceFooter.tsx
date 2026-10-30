import TrendColors from './TrendColors'

const base = process.env.NEXT_PUBLIC_BASE_PATH || ''

export default function ExperienceFooter() {
  return (
    <footer style={{ marginTop: 48, padding: '22px 0 30px', borderTop: '1px solid var(--rbl-border-subtle)', display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', gap: 20, alignItems: 'start' }}>
      <div style={{ maxWidth: 760 }}>
        <div style={{ color: 'var(--rbl-title)', fontWeight: 700, fontSize: 15 }}>Independent public-records guide for Riverhead residents.</div>
        <p style={{ color: 'var(--rbl-text-muted)', fontSize: 14, lineHeight: 1.6, margin: '6px 0 0' }}>
          Riverhead Budget Live is an independent project. It is not run, approved, or endorsed by the Town of Riverhead. The site organizes public information and provides analysis; it is not a substitute for the Town’s official records. Check the linked source documents before relying on an important figure. Basic, aggregated site-usage statistics are collected through Google Analytics. You do not need an account to use this site.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginTop: 10 }}>
          <a href={`${base}/sources/`} style={{ color: 'var(--rbl-link)', fontWeight: 600, fontSize: 14, textDecoration: 'none', display: 'inline-block', padding: '2px 0' }}>Where the information comes from →</a>
          <a href={`${base}/data-quality/`} style={{ color: 'var(--rbl-link)', fontWeight: 600, fontSize: 14, textDecoration: 'none', display: 'inline-block', padding: '2px 0' }}>When the information was updated →</a>
        </div>
      </div>
      <div style={{ justifySelf: 'end' }}><TrendColors /></div>
    </footer>
  )
}
