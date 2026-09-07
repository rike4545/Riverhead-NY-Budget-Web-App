import PageShell from '../components/PageShell'
import FiscalCommandCenter from '../components/FiscalCommandCenter'

const base = process.env.NEXT_PUBLIC_BASE_PATH || ''

const questions = [
  ['Why did my property taxes change?', '/tax-bill/'],
  ['Where does my Town levy go?', '/taxpayer-impact/'],
  ['Where does the Town spend money?', '/answers/#spending'],
  ['Who gets paid the most?', '/payroll/'],
  ['How much does Riverhead owe?', '/capital-debt/'],
  ['What changed from 2025 to 2026?', '/what-changed/'],
  ['What could happen in 2027?', '/predict-2027/'],
]

const pathways = [
  { eyebrow: 'For residents', title: 'My Taxes', text: 'Estimate the Town portion of your bill and see how the tax rate changed.', href: '/tax-bill/', cta: 'Open tax estimator' },
  { eyebrow: 'Follow the money', title: 'Where Your Levy Goes', text: 'See how the Town levy is allocated across the operating funds that it supports.', href: '/taxpayer-impact/', cta: 'See levy allocation' },
  { eyebrow: 'People & pay', title: 'Payroll Explorer', text: 'See actual pay, authorized salaries, overtime, separation payments and workforce patterns.', href: '/payroll/', cta: 'Explore payroll' },
  { eyebrow: 'Financial health', title: 'Financial Health', text: 'See the Town’s reserves, debt, budget pressure and forward-looking indicators in one place.', href: '/analytics/', cta: 'See financial health' },
]

export default function Page() {
  return (
    <PageShell title="Riverhead Budget Live" subtitle="A resident-first guide to Riverhead Town finances — what the Town collects, what it spends, who it pays, what it owes, and what changed.">
      <main>
        <section style={{ background: 'linear-gradient(115deg,#0b2238 0%,#143b5d 58%,#245a82 100%)', color: 'white', borderRadius: 22, padding: '34px clamp(22px,5vw,48px)', marginBottom: 18, boxShadow: '0 18px 45px rgba(7,25,42,.18)', overflow: 'hidden', position: 'relative' }}>
          <div style={{ position: 'relative', zIndex: 1, maxWidth: 900 }}>
            <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: 1.1, textTransform: 'uppercase', color: '#a9d7f5' }}>Start here</div>
            <h1 style={{ fontSize: 'clamp(30px,5vw,48px)', lineHeight: 1.05, letterSpacing: -1.2, margin: '8px 0 12px', maxWidth: 760 }}>What do you want to know about Riverhead’s money?</h1>
            <p style={{ color: '#d7e6f2', fontSize: 16.5, lineHeight: 1.6, margin: 0, maxWidth: 760 }}>Ask the question you actually have. Get the number, understand what it means, and follow the evidence back to the Town’s records.</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9, marginTop: 22 }}>
              {questions.map(([label, href]) => <a key={href} href={`${base}${href}`} style={{ color: 'white', textDecoration: 'none', fontWeight: 750, fontSize: 13.5, padding: '9px 13px', borderRadius: 999, background: 'rgba(255,255,255,.10)', border: '1px solid rgba(255,255,255,.22)' }}>{label}</a>)}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 16, marginTop: 24 }}>
              <a href={`${base}/answers/`} style={{ background: 'white', color: '#102f49', fontWeight: 900, padding: '12px 19px', borderRadius: 10, textDecoration: 'none' }}>Browse resident answers →</a>
              <a href={`${base}/search/`} style={{ color: '#b8ddf5', fontWeight: 800, textDecoration: 'none' }}>Search the records →</a>
            </div>
          </div>
          <div aria-hidden="true" style={{ position: 'absolute', width: 280, height: 280, borderRadius: '50%', border: '1px solid rgba(255,255,255,.08)', right: -95, top: -110 }} />
          <div aria-hidden="true" style={{ position: 'absolute', width: 190, height: 190, borderRadius: '50%', border: '1px solid rgba(255,255,255,.07)', right: -40, top: -65 }} />
        </section>
        <section aria-label="Choose a starting point" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(235px,1fr))', gap: 12, marginBottom: 24 }}>
          {pathways.map(item => <a key={item.href} href={`${base}${item.href}`} style={{ display: 'block', textDecoration: 'none', color: 'inherit', background: 'var(--rbl-surface)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 16, padding: '18px 18px 17px', boxShadow: '0 8px 22px var(--rbl-shadow)' }}>
            <div style={{ color: 'var(--rbl-accent)', fontSize: 11.5, fontWeight: 900, textTransform: 'uppercase', letterSpacing: .75 }}>{item.eyebrow}</div>
            <div style={{ fontSize: 20, fontWeight: 900, marginTop: 4 }}>{item.title}</div>
            <div style={{ color: 'var(--rbl-text-muted)', fontSize: 13.5, lineHeight: 1.5, marginTop: 7 }}>{item.text}</div>
            <div style={{ color: 'var(--rbl-accent)', fontSize: 13, fontWeight: 850, marginTop: 12 }}>{item.cta} →</div>
          </a>)}
        </section>
        <section style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 10, margin: '4px 0 14px' }}>
          <div><div style={{ color: 'var(--rbl-text-muted)', fontSize: 11.5, fontWeight: 900, letterSpacing: .8, textTransform: 'uppercase' }}>Go deeper</div><h2 style={{ margin: '3px 0 0', fontSize: 23 }}>The full financial picture</h2></div>
          <div style={{ color: 'var(--rbl-text-muted)', fontSize: 13, maxWidth: 540, lineHeight: 1.45 }}>The research dashboard below brings together the underlying budget, funds, reserves, scenarios and long-term financial indicators.</div>
        </section>
        <FiscalCommandCenter />
      </main>
    </PageShell>
  )
}
