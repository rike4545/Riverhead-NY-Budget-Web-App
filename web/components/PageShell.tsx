import TrendColors from './TrendColors'
import SiteNav from './SiteNav'
import DisplaySettings from './DisplaySettings'
import DisclaimerBanner from './DisclaimerBanner'

export default function PageShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  const base = process.env.NEXT_PUBLIC_BASE_PATH || ''

  return (
    <main style={{ minHeight: '100vh', background: 'var(--rbl-bg)', color: 'var(--rbl-text)', fontFamily: 'Inter, Arial, sans-serif' }}>
      <header style={{ background: 'var(--rbl-header-a)', color: 'white', borderBottom: '3px solid var(--rbl-gold)', padding: '16px 28px', display: 'flex', justifyContent: 'space-between', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
        <a href={`${base}/`} style={{ color: 'white', textDecoration: 'none', display: 'flex', gap: 12, alignItems: 'center' }}>
          <span style={{ width: 40, height: 40, borderRadius: 9, display: 'grid', placeItems: 'center', background: 'var(--rbl-gold)', color: '#13293f', fontWeight: 950, fontSize: 15 }}>RB</span>
          <span>
            <strong style={{ fontSize: 19, letterSpacing: -0.2 }}>Riverhead Budget Live</strong>
            <div style={{ color: 'rgba(255,255,255,.62)', fontSize: 11.5, fontWeight: 500 }}>Following the Town&apos;s money, in plain English</div>
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
      <section style={{ padding: '26px 30px 30px', maxWidth: 1380, margin: '0 auto' }}>
        <div style={{ background: 'var(--rbl-surface)', borderTop: '4px solid var(--rbl-page-accent)', borderRight: '1px solid var(--rbl-border)', borderBottom: '1px solid var(--rbl-border)', borderLeft: '1px solid var(--rbl-border)', borderRadius: 12, padding: 26, boxShadow: '0 1px 3px var(--rbl-shadow)', marginBottom: 18 }}>
          <div style={{ color: 'var(--rbl-badge)', letterSpacing: 1.6, textTransform: 'uppercase', fontSize: 11.5, fontWeight: 800 }}>A resident-built project · not the Town&apos;s official site</div>
          <h1 style={{ fontSize: 38, lineHeight: 1.1, margin: '8px 0', color: 'var(--rbl-title)', letterSpacing: -0.5, fontWeight: 800 }}>{title}</h1>
          <p style={{ color: 'var(--rbl-text-sub)', fontSize: 16.5, lineHeight: 1.55, margin: 0, maxWidth: 980 }}>{subtitle}</p>
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
