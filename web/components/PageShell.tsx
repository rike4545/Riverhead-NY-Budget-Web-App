import meta from '../public/data/meta.json'

export default function PageShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  const base = '/rike4545-riverhead-budget-live'
  const links = [
    ['Dashboard', `${base}/`],
    ['Start Here', `${base}/guide/`],
    ['Payroll', `${base}/payroll/`],
    ['Funds Explorer', `${base}/funds/`],
    ['Budget Compare', `${base}/compare/`],
    ['General Fund', `${base}/general-fund/`],
    ['Annual Report', `${base}/annual-report/`],
    ['Town Board Votes', `${base}/meetings/`],
    ['Fiscal Impact', `${base}/fiscal-impact/`],
    ['2026 Buyout', `${base}/buyout/`],
    ['Search', `${base}/search/`],
    ['Downloads', `${base}/downloads/`],
    ['Standards', `${base}/gfoa/`],
    ['Analytics', `${base}/analytics/`],
    ['Source Library', `${base}/sources/`],
    ['Scenario Lab', `${base}/scenarios/`],
  ]

  return (
    <main style={{ minHeight: '100vh', background: 'linear-gradient(180deg,#eef3f8 0,#f7f8f5 42%,#ffffff 100%)', color: '#1f2933', fontFamily: 'Inter, Arial, sans-serif' }}>
      <header style={{ background: 'linear-gradient(135deg,#12385b,#1f5f8f 62%,#12385b)', color: 'white', borderBottom: '5px solid #c99a2e', padding: '18px 28px', display: 'flex', justifyContent: 'space-between', gap: 20, alignItems: 'center', flexWrap: 'wrap', boxShadow: '0 14px 34px rgba(18,56,91,.24)' }}>
        <a href={`${base}/`} style={{ color: 'white', textDecoration: 'none', display: 'flex', gap: 12, alignItems: 'center' }}>
          <span style={{ width: 48, height: 48, borderRadius: 8, display: 'grid', placeItems: 'center', background: '#f8f5ec', color: '#12385b', border: '2px solid #c99a2e', fontWeight: 950 }}>RB</span>
          <span>
            <strong style={{ fontSize: 22 }}>Riverhead Budget Live</strong>
            <div style={{ color: '#d7e7f4', fontSize: 12 }}>Independent municipal finance explorer</div>
          </span>
        </a>
        <nav style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {links.map(([label, href]) => (
            <a key={href} href={href} style={{ color: 'white', textDecoration: 'none', border: '1px solid rgba(255,255,255,.28)', borderRadius: 6, padding: '9px 13px', fontWeight: 800, background: 'rgba(12,43,72,.35)' }}>{label}</a>
          ))}
        </nav>
      </header>
      <section style={{ padding: 30, maxWidth: 1380, margin: '0 auto' }}>
        <div style={{ background: '#ffffff', border: '1px solid #d8e0e7', borderTop: '6px solid #1f5f8f', borderRadius: 12, padding: 28, boxShadow: '0 14px 34px rgba(31,95,143,.10)', marginBottom: 18 }}>
          <div style={{ color: '#9b6b12', letterSpacing: 2, textTransform: 'uppercase', fontSize: 12, fontWeight: 950 }}>Public fiscal intelligence / unofficial</div>
          <h1 style={{ fontSize: 42, lineHeight: 1.05, margin: '8px 0', color: '#12385b' }}>{title}</h1>
          <p style={{ color: '#44576a', fontSize: 17, lineHeight: 1.55, margin: 0, maxWidth: 980 }}>{subtitle}</p>
          <div style={{ marginTop: 18, background: '#fff8e6', border: '1px solid #d8b45a', color: '#5f430d', padding: 13, borderRadius: 8, fontSize: 14, lineHeight: 1.45 }}>
            This is an independent public-information project and is not affiliated with, endorsed by, or operated by the Town of Riverhead. Verify figures against official source documents before relying on them.
            <span style={{ display: 'block', marginTop: 6, fontSize: 12.5, color: '#8a6a1f' }}>
              Data last refreshed {meta.generatedAtDisplay} · updates automatically as the Town publishes new records.
            </span>
          </div>
        </div>
        {children}
      </section>
    </main>
  )
}
