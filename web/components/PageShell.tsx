import TrendColors from './TrendColors'
import SiteNav from './SiteNav'
import DisplaySettings from './DisplaySettings'
import DisclaimerBanner from './DisclaimerBanner'

export default function PageShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  const base = process.env.NEXT_PUBLIC_BASE_PATH || ''

  return (
    <main style={{ minHeight: '100vh', background: 'var(--rbl-bg)', color: 'var(--rbl-text)', fontFamily: 'Inter, Arial, sans-serif' }}>
      <header style={{ background: 'linear-gradient(135deg,var(--rbl-header-a),var(--rbl-header-b) 62%,var(--rbl-header-a))', color: 'white', borderBottom: '5px solid var(--rbl-gold)', padding: '18px 28px', display: 'flex', justifyContent: 'space-between', gap: 20, alignItems: 'center', flexWrap: 'wrap', boxShadow: '0 14px 34px var(--rbl-shadow)', position: 'relative' }}>
        <a href={`${base}/`} style={{ color: 'white', textDecoration: 'none', display: 'flex', gap: 12, alignItems: 'center' }}>
          <span style={{ width: 48, height: 48, borderRadius: 8, display: 'grid', placeItems: 'center', background: 'var(--rbl-logo-bg)', color: 'var(--rbl-logo-fg)', border: '2px solid var(--rbl-gold)', fontWeight: 950 }}>RB</span>
          <span>
            <strong style={{ fontSize: 22 }}>Riverhead Budget Live</strong>
            <div style={{ color: '#d7e7f4', fontSize: 12 }}>Following the Town&apos;s money, in plain English</div>
          </span>
        </a>
        {/* marginLeft: auto mirrors the trick SiteNav uses internally — keeps this
            flush against the header's right edge even when the header wraps to two
            lines and this becomes the sole item on its row. */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginLeft: 'auto' }}>
          <SiteNav />
          <DisplaySettings />
        </div>
      </header>
      <section style={{ padding: 30, maxWidth: 1380, margin: '0 auto' }}>
        <div style={{ background: 'var(--rbl-surface)', borderTop: '6px solid var(--rbl-page-accent)', borderRight: '1px solid var(--rbl-border)', borderBottom: '1px solid var(--rbl-border)', borderLeft: '1px solid var(--rbl-border)', borderRadius: 12, padding: 28, boxShadow: '0 14px 34px var(--rbl-shadow)', marginBottom: 18 }}>
          <div style={{ color: 'var(--rbl-badge)', letterSpacing: 2, textTransform: 'uppercase', fontSize: 12, fontWeight: 950 }}>A resident-built project · not the Town&apos;s official site</div>
          <h1 style={{ fontSize: 42, lineHeight: 1.05, margin: '8px 0', color: 'var(--rbl-title)' }}>{title}</h1>
          <p style={{ color: 'var(--rbl-text-sub)', fontSize: 17, lineHeight: 1.55, margin: 0, maxWidth: 980 }}>{subtitle}</p>
          <DisclaimerBanner />
          <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
            <TrendColors />
          </div>
        </div>
        {children}
      </section>
    </main>
  )
}
