import SiteNav from './SiteNav'
import DisplaySettings from './DisplaySettings'
import DisclaimerBanner from './DisclaimerBanner'
import ExperienceFooter from './ExperienceFooter'

export default function PageShell({ title, subtitle, children, home = false }: { title: string; subtitle: string; children: React.ReactNode; home?: boolean }) {
  const base = process.env.NEXT_PUBLIC_BASE_PATH || ''

  return (
    <main style={{ minHeight: '100vh', background: 'var(--rbl-bg)', color: 'var(--rbl-text)', fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <header style={{ background: 'var(--rbl-fill-brand)', color: 'white', borderBottom: '1px solid rgba(255,255,255,.14)', padding: '12px clamp(14px,3vw,26px)', boxShadow: '0 6px 20px rgba(15,35,55,.10)', position: 'relative', zIndex: 20 }}>
        <div style={{ maxWidth: 1240, margin: '0 auto', display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center' }}>
          <a href={`${base}/`} style={{ color: 'white', textDecoration: 'none', display: 'flex', gap: 10, alignItems: 'center', minWidth: 0 }}>
            <span style={{ width: 36, height: 36, flex: '0 0 auto', borderRadius: 9, display: 'grid', placeItems: 'center', background: 'white', color: 'var(--rbl-logo-fg)', fontWeight: 950, fontSize: 13 }}>RB</span>
            <span style={{ minWidth: 0 }}>
              <strong style={{ display: 'block', fontSize: 16.5, lineHeight: 1.15 }}>Riverhead Budget Live</strong>
              <span className="brand-subtitle" style={{ display: 'block', color: '#d7e7f4', fontSize: 11.5, marginTop: 2 }}>Town finances, explained</span>
            </span>
          </a>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginLeft: 'auto', minWidth: 0 }}>
            <SiteNav />
            <DisplaySettings />
          </div>
        </div>
      </header>

      <section style={{ padding: '0 clamp(16px,3vw,28px)', maxWidth: 1240, margin: '0 auto' }}>
        {!home && (
          <header style={{ padding: 'clamp(28px,5vw,50px) 0 22px', borderBottom: '1px solid var(--rbl-border-subtle)', marginBottom: 26 }}>
            <div style={{ color: 'var(--rbl-badge)', letterSpacing: 1.2, textTransform: 'uppercase', fontSize: 11, fontWeight: 950 }}>Independent civic data project</div>
            <h1 style={{ fontSize: 'clamp(30px,5vw,46px)', lineHeight: 1.04, letterSpacing: '-.025em', margin: '8px 0 10px', color: 'var(--rbl-title)', maxWidth: 900, overflowWrap: 'anywhere' }}>{title}</h1>
            <p style={{ color: 'var(--rbl-text-sub)', fontSize: 'clamp(15px,2vw,17px)', lineHeight: 1.6, margin: 0, maxWidth: 900 }}>{subtitle}</p>
            <DisclaimerBanner />
          </header>
        )}
        {children}
        <ExperienceFooter />
      </section>
      <style>{`@media(max-width:640px){.brand-subtitle{display:none!important}}`}</style>
    </main>
  )
}
