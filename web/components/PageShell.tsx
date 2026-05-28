export default function PageShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  const base = '/rike4545-riverhead-budget-live'
  const links = [
    ['Dashboard', `${base}/`],
    ['Search', `${base}/search/`],
    ['Funds', `${base}/funds/`],
    ['Analytics', `${base}/analytics/`],
    ['Sources', `${base}/sources/`],
    ['Scenarios', `${base}/scenarios/`],
  ]

  return (
    <main style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#f8fafc,#eef6ff)', color: '#0f172a', fontFamily: 'Arial, sans-serif' }}>
      <header style={{ background: '#061a32', color: 'white', padding: '18px 28px', display: 'flex', justifyContent: 'space-between', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
        <div>
          <strong style={{ fontSize: 22 }}>Riverhead Budget Live</strong>
          <div style={{ color: '#bfdbfe', fontSize: 12 }}>Unofficial fiscal intelligence platform</div>
        </div>
        <nav style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {links.map(([label, href]) => (
            <a key={href} href={href} style={{ color: 'white', textDecoration: 'none', border: '1px solid rgba(255,255,255,.2)', borderRadius: 999, padding: '8px 12px', fontWeight: 700 }}>{label}</a>
          ))}
        </nav>
      </header>
      <section style={{ padding: 30, maxWidth: 1380, margin: '0 auto' }}>
        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 24, padding: 26, boxShadow: '0 18px 50px rgba(15,23,42,.08)', marginBottom: 18 }}>
          <div style={{ color: '#2563eb', letterSpacing: 2, textTransform: 'uppercase', fontSize: 12, fontWeight: 900 }}>Independent / unofficial</div>
          <h1 style={{ fontSize: 40, margin: '8px 0' }}>{title}</h1>
          <p style={{ color: '#475569', fontSize: 17, margin: 0 }}>{subtitle}</p>
        </div>
        {children}
      </section>
    </main>
  )
}
