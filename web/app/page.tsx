import PageShell from '../components/PageShell'
import UpdateSummary from '../components/UpdateSummary'

const base = process.env.NEXT_PUBLIC_BASE_PATH || ''

const popular = [
  ['Why did my property taxes change?', '/tax-bill/'],
  ['What changed from 2025 to 2026?', '/what-changed/'],
  ['Who gets paid the most?', '/payroll/'],
  ['What could happen in 2027?', '/predict-2027/'],
]

const pathways = [
  { eyebrow: 'For residents', title: 'My Taxes', text: 'Estimate the Town portion of your bill and understand what changed.', href: '/tax-bill/', cta: 'Open tax estimator' },
  { eyebrow: 'Follow the money', title: 'Where Your Levy Goes', text: 'See how the Town levy is distributed across the funds it supports.', href: '/taxpayer-impact/', cta: 'See levy allocation' },
  { eyebrow: 'People & pay', title: 'Payroll Explorer', text: 'Search actual pay, overtime, separation payments, titles and departments.', href: '/payroll/', cta: 'Explore payroll' },
  { eyebrow: 'Big picture', title: 'Financial Health', text: 'See the Town’s current position, what moved, and what the Board controls.', href: '/analytics/', cta: 'See financial health' },
]

const deeper = [
  ['/funds/', 'Budget & funds', 'Open the adopted budget down to account-level detail.'],
  ['/meetings/', 'Town Board votes', 'Follow resolutions and voting records back to the meeting.'],
  ['/predict-2027/', '2027 outlook', 'Separate the model, tax-cap rules and policy choices.'],
  ['/sources/', 'Evidence library', 'Check the Town records, OSC guidance and source audit trail.'],
]

export default function Page() {
  return (
    <PageShell home title="Riverhead Budget Live" subtitle="A resident-first guide to Riverhead Town finances.">
      <main>
        <section style={{ padding: 'clamp(46px,8vw,88px) 0 34px', maxWidth: 960 }}>
          <div style={{ color: 'var(--rbl-badge)', fontSize: 11, fontWeight: 950, letterSpacing: 1.15, textTransform: 'uppercase' }}>Start Here · Independent civic data</div>
          <h1 style={{ fontSize: 'clamp(40px,7vw,72px)', lineHeight: .98, letterSpacing: '-.045em', color: 'var(--rbl-title)', margin: '12px 0 18px', maxWidth: 900 }}>Understand Riverhead’s money without reading the whole budget.</h1>
          <p style={{ color: 'var(--rbl-text-sub)', fontSize: 'clamp(17px,2.3vw,20px)', lineHeight: 1.55, margin: 0, maxWidth: 760 }}>Find the number, understand what it means, and follow the evidence back to the record. No account required.</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 11, alignItems: 'center', marginTop: 28 }}>
            <a href={`${base}/search/`} style={{ display: 'inline-block', background: 'var(--rbl-fill-brand)', color: 'white', fontWeight: 900, padding: '13px 19px', borderRadius: 10, textDecoration: 'none', boxShadow: '0 8px 20px rgba(15,45,72,.14)' }}>Search the records →</a>
            <a href={`${base}/tax-bill/`} style={{ display: 'inline-block', color: 'var(--rbl-title)', fontWeight: 850, padding: '12px 4px', textDecoration: 'none' }}>Start with my taxes →</a>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 16px', marginTop: 26, paddingTop: 18, borderTop: '1px solid var(--rbl-border-subtle)' }}>
            <span style={{ color: 'var(--rbl-text-muted)', fontSize: 12.5, fontWeight: 850 }}>Popular:</span>
            {popular.map(([label, href]) => <a key={href} href={`${base}${href}`} style={{ color: 'var(--rbl-link)', fontSize: 12.5, fontWeight: 750, textDecoration: 'none' }}>{label}</a>)}
          </div>
        </section>

        <UpdateSummary />

        <section aria-label="How the site works" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 0, margin: '28px 0 34px', borderTop: '1px solid var(--rbl-border-subtle)', borderBottom: '1px solid var(--rbl-border-subtle)' }}>
          <Step n="01" title="Find it" text="Search the budget, payroll, meetings and financial reports." />
          <Step n="02" title="Understand it" text="Plain-English context separates official figures from calculations and projections." />
          <Step n="03" title="Verify it" text="Important claims point back to sources, freshness and evidence." />
        </section>

        <section aria-labelledby="start-with" style={{ marginBottom: 38 }}>
          <div style={{ maxWidth: 700, marginBottom: 16 }}>
            <div style={{ color: 'var(--rbl-text-muted)', fontSize: 11, fontWeight: 900, letterSpacing: .8, textTransform: 'uppercase' }}>Choose one path</div>
            <h2 id="start-with" style={{ margin: '5px 0 7px', fontSize: 'clamp(26px,4vw,34px)', color: 'var(--rbl-title)', letterSpacing: '-.02em' }}>Start with what matters to you.</h2>
            <p style={{ color: 'var(--rbl-text-muted)', lineHeight: 1.55, margin: 0 }}>The deeper research is still here. It just does not need to be the first thing you see.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(230px,100%),1fr))', gap: 12 }}>
            {pathways.map(item => <a key={item.href} href={`${base}${item.href}`} style={{ display: 'block', textDecoration: 'none', color: 'inherit', background: 'var(--rbl-surface)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 14, padding: '19px 18px', boxShadow: '0 5px 16px rgba(31,74,105,.06)' }}>
              <div style={{ color: 'var(--rbl-accent)', fontSize: 10.5, fontWeight: 900, textTransform: 'uppercase', letterSpacing: .75 }}>{item.eyebrow}</div>
              <div style={{ fontSize: 19, fontWeight: 900, marginTop: 5, color: 'var(--rbl-title)' }}>{item.title}</div>
              <div style={{ color: 'var(--rbl-text-muted)', fontSize: 13.5, lineHeight: 1.5, marginTop: 7 }}>{item.text}</div>
              <div style={{ color: 'var(--rbl-link)', fontSize: 12.5, fontWeight: 850, marginTop: 13 }}>{item.cta} →</div>
            </a>)}
          </div>
        </section>

        <section style={{ background: 'var(--rbl-surface)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 14, padding: 'clamp(20px,3vw,28px)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 20, alignItems: 'end', flexWrap: 'wrap', marginBottom: 8 }}>
            <div><div style={{ color: 'var(--rbl-text-muted)', fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: .8 }}>Go deeper</div><h2 style={{ color: 'var(--rbl-title)', margin: '4px 0', fontSize: 24 }}>Research when you need it.</h2></div>
            <a href={`${base}/guide/`} style={{ color: 'var(--rbl-link)', fontSize: 12.5, fontWeight: 850, textDecoration: 'none' }}>Open the guide →</a>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(220px,100%),1fr))', gap: 4 }}>
            {deeper.map(([href, title, text]) => <a key={href} href={`${base}${href}`} style={{ color: 'inherit', textDecoration: 'none', padding: '14px 12px', borderRadius: 10 }}><strong style={{ color: 'var(--rbl-title)', fontSize: 14 }}>{title} →</strong><div style={{ color: 'var(--rbl-text-muted)', fontSize: 12.5, lineHeight: 1.45, marginTop: 4 }}>{text}</div></a>)}
          </div>
        </section>
        <style>{`@media(max-width:760px){section[aria-label="How the site works"]{grid-template-columns:1fr!important}section[aria-label="How the site works"]>article{border-left:0!important;border-top:1px solid var(--rbl-border-subtle)}section[aria-label="How the site works"]>article:first-child{border-top:0!important}}`}</style>
      </main>
    </PageShell>
  )
}

function Step({ n, title, text }: { n: string; title: string; text: string }) {
  return <article style={{ padding: '20px clamp(10px,2vw,22px)', borderLeft: n === '01' ? '0' : '1px solid var(--rbl-border-subtle)' }}><div style={{ color: 'var(--rbl-badge)', fontSize: 10.5, fontWeight: 950, letterSpacing: .8 }}>{n}</div><strong style={{ display: 'block', color: 'var(--rbl-title)', marginTop: 5, fontSize: 16 }}>{title}</strong><p style={{ color: 'var(--rbl-text-muted)', fontSize: 12.8, lineHeight: 1.5, margin: '5px 0 0' }}>{text}</p></article>
}
