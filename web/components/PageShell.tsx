import SiteNav from './SiteNav'
import DisplaySettings from './DisplaySettings'
import DisclaimerBanner from './DisclaimerBanner'
import ExperienceFooter from './ExperienceFooter'

export default function PageShell({ title, subtitle, children, home = false }: { title: string; subtitle: string; children: React.ReactNode; home?: boolean }) {
  const base = process.env.NEXT_PUBLIC_BASE_PATH || ''

  return (
    <div style={{ minHeight: '100vh', background: 'var(--rbl-bg)', color: 'var(--rbl-text)' }}>
      <a href="#main" className="rbl-skip">Skip to content</a>
      <header style={{ background: 'var(--rbl-fill-brand)', color: 'white', padding: '12px clamp(14px,3vw,26px)', position: 'relative', zIndex: 20 }}>
        <div style={{ maxWidth: 1240, margin: '0 auto', display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center' }}>
          <a href={`${base}/`} className="rbl-on-dark" style={{ color: 'white', textDecoration: 'none', display: 'flex', gap: 10, alignItems: 'center', minWidth: 0, borderRadius: 8 }}>
            <span aria-hidden="true" style={{ width: 36, height: 36, flex: '0 0 auto', borderRadius: 9, display: 'grid', placeItems: 'center', background: 'white', color: 'var(--rbl-logo-fg)', fontWeight: 800, fontSize: 14 }}>RB</span>
            <span style={{ minWidth: 0 }}>
              <strong className="brand-name" style={{ display: 'block', fontSize: 17.5, fontWeight: 700, lineHeight: 1.15 }}>Riverhead Budget Live</strong>
              <span className="brand-subtitle" style={{ display: 'block', color: '#d7e7f4', fontSize: 13, marginTop: 1 }}>Town finances, explained</span>
            </span>
          </a>
          <div className="header-tools" style={{ display: 'flex', alignItems: 'center', gap: 9, marginLeft: 'auto', minWidth: 0 }}>
            <SiteNav />
            <DisplaySettings />
          </div>
        </div>
      </header>

      <div style={{ padding: '0 clamp(16px,3vw,28px)', maxWidth: 1240, margin: '0 auto' }}>
        <main id="main">
          {!home && (
            <header style={{ padding: 'clamp(30px,5vw,52px) 0 22px', borderBottom: '1px solid var(--rbl-border-subtle)', marginBottom: 28 }}>
              <h1 style={{ fontSize: 'clamp(31px,4.6vw,46px)', fontWeight: 700, lineHeight: 1.08, letterSpacing: '-.02em', margin: '0 0 12px', color: 'var(--rbl-title)', maxWidth: 900, overflowWrap: 'anywhere' }}>{title}</h1>
              <p style={{ color: 'var(--rbl-text-sub)', fontSize: 'clamp(16.5px,2vw,19px)', lineHeight: 1.55, margin: 0, maxWidth: '64ch' }}>{subtitle}</p>
              <DisclaimerBanner />
            </header>
          )}
          {children}
        </main>
        <ExperienceFooter />
      </div>
      {/* Below the full-nav breakpoint the tools are just Menu and Aa: keep them whole and let the name wrap. */}
    </div>
  )
}
