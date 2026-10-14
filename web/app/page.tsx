import PageShell from '../components/PageShell'
import UpdateSummary from '../components/UpdateSummary'
import TentativeReleased from '../components/TentativeReleased'
import { released2027 } from '../lib/tentative-2027'

const base = process.env.NEXT_PUBLIC_BASE_PATH || ''

const popular = [
  ...(released2027 ? [['What does the 2027 Tentative propose?', '/tentative-2027/']] : []),
  ['Why did my property taxes change?', '/tax-bill/'],
  ['What changes in the 2027 Tentative?', '/what-changed/'],
  ['Would changing the tax cap help Riverhead?', '/tax-cap-letter/'],
  ['Who gets paid the most?', '/payroll/'],
  ['What could happen in 2027?', '/predict-2027/'],
]

const pathways = [
  { title: 'My Taxes', text: 'Estimate the Town portion of your bill and understand what changed.', href: '/tax-bill/' },
  { title: 'Where Your Levy Goes', text: 'See how the Town levy is distributed across the funds it supports.', href: '/taxpayer-impact/' },
  { title: 'Payroll Explorer', text: 'Search actual pay, overtime, separation payments, titles and departments.', href: '/payroll/' },
  { title: 'Financial Health', text: 'See the Town’s current position, what moved, and what the Board controls.', href: '/analytics/' },
]

const deeper = [
  ['/funds/', 'Budget & funds', 'Open the adopted budget down to account-level detail.'],
  ['/meetings/', 'Town Board votes', 'Follow resolutions and voting records back to the meeting.'],
  ['/predict-2027/', '2027 outlook', 'Separate the model, tax-cap rules and policy choices.'],
  ['/sources/', 'Evidence library', 'Check the Town records, OSC guidance and source audit trail.'],
]

const steps = [
  ['Find it', 'Search the budget, payroll, meetings and financial reports.'],
  ['Understand it', 'Plain-English context separates official figures from calculations and projections.'],
  ['Verify it', 'Important claims point back to sources, freshness and evidence.'],
]

export default function Page() {
  return (
    <PageShell home title="Riverhead Budget Live" subtitle="A resident-first guide to Riverhead Town finances.">
      <div>
        <section style={{ padding: 'clamp(44px,8vw,84px) 0 32px', maxWidth: 940 }}>
          <h1 style={{ fontSize: 'clamp(38px,6.4vw,66px)', fontWeight: 700, lineHeight: 1.02, letterSpacing: '-.03em', color: 'var(--rbl-title)', margin: '0 0 18px', maxWidth: 880 }}>Understand Riverhead’s money without reading the whole budget.</h1>
          <p style={{ color: 'var(--rbl-text-sub)', fontSize: 'clamp(18px,2.3vw,21px)', lineHeight: 1.5, margin: 0, maxWidth: '52ch' }}>Find the number, understand what it means, and follow the evidence back to the record. No account required.</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', marginTop: 28 }}>
            <a href={`${base}/search/`} className="rbl-cta" style={{ display: 'inline-block', background: 'var(--rbl-fill-brand)', color: 'white', fontWeight: 600, fontSize: 17, padding: '13px 20px', borderRadius: 10, textDecoration: 'none' }}>Search the records →</a>
            <a href={`${base}/tax-bill/`} style={{ display: 'inline-block', color: 'var(--rbl-title)', fontWeight: 600, fontSize: 17, padding: '12px 6px', textDecoration: 'none' }}>Start with my taxes →</a>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 18px', marginTop: 28, paddingTop: 18, borderTop: '1px solid var(--rbl-border-subtle)' }}>
            <span style={{ color: 'var(--rbl-text-muted)', fontSize: 15, fontWeight: 600 }}>Common questions:</span>
            {popular.map(([label, href]) => <a key={href} href={`${base}${href}`} style={{ color: 'var(--rbl-link)', fontSize: 15, fontWeight: 500, textDecoration: 'none' }}>{label}</a>)}
          </div>
        </section>

        <TentativeReleased />

        <UpdateSummary />

        <section aria-label="How the site works" className="rbl-steps" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', margin: '28px 0 40px', borderTop: '1px solid var(--rbl-border-subtle)', borderBottom: '1px solid var(--rbl-border-subtle)' }}>
          {steps.map(([title, text], i) => (
            <div key={title} style={{ padding: '20px clamp(12px,2vw,24px)', paddingLeft: i === 0 ? 0 : undefined, borderLeft: i === 0 ? 0 : '1px solid var(--rbl-border-subtle)' }}>
              <strong style={{ display: 'block', color: 'var(--rbl-title)', fontSize: 18 }}>{title}</strong>
              <p style={{ color: 'var(--rbl-text-muted)', fontSize: 15, lineHeight: 1.5, margin: '4px 0 0' }}>{text}</p>
            </div>
          ))}
        </section>

        <section aria-labelledby="start-with" style={{ marginBottom: 44 }}>
          <h2 id="start-with" style={{ margin: '0 0 6px', fontSize: 'clamp(26px,3.6vw,32px)', fontWeight: 700, color: 'var(--rbl-title)', letterSpacing: '-.015em' }}>Start with what matters to you</h2>
          <p style={{ color: 'var(--rbl-text-muted)', fontSize: 16.5, lineHeight: 1.55, margin: '0 0 18px' }}>The deeper research is still here. It just does not need to be the first thing you see.</p>
          <ul className="rbl-toc" style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(330px,100%),1fr))', columnGap: 36, borderTop: '1px solid var(--rbl-border-subtle)' }}>
            {pathways.map((item) => (
              <li key={item.href} style={{ borderBottom: '1px solid var(--rbl-border-subtle)' }}>
                <a href={`${base}${item.href}`} style={{ display: 'block', padding: '16px 0', textDecoration: 'none', color: 'inherit' }}>
                  <span className="rbl-toc-title" style={{ display: 'block', fontSize: 20, fontWeight: 700, color: 'var(--rbl-title)' }}>{item.title} <span aria-hidden="true" style={{ color: 'var(--rbl-link)' }}>→</span></span>
                  <span style={{ display: 'block', color: 'var(--rbl-text-muted)', fontSize: 15.5, lineHeight: 1.5, marginTop: 3 }}>{item.text}</span>
                </a>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="go-deeper" style={{ background: 'var(--rbl-surface)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 14, padding: 'clamp(20px,3vw,28px)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 20, alignItems: 'baseline', flexWrap: 'wrap', marginBottom: 8 }}>
            <h2 id="go-deeper" style={{ color: 'var(--rbl-title)', margin: 0, fontSize: 24, fontWeight: 700 }}>Research when you need it</h2>
            <a href={`${base}/guide/`} style={{ color: 'var(--rbl-link)', fontSize: 15, fontWeight: 600, textDecoration: 'none' }}>Open the guide →</a>
          </div>
          <ul className="rbl-toc" style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(220px,100%),1fr))', columnGap: 24 }}>
            {deeper.map(([href, title, text]) => (
              <li key={href}>
                <a href={`${base}${href}`} style={{ display: 'block', color: 'inherit', textDecoration: 'none', padding: '12px 0' }}>
                  <span className="rbl-toc-title" style={{ display: 'block', color: 'var(--rbl-title)', fontSize: 17, fontWeight: 700 }}>{title} →</span>
                  <span style={{ display: 'block', color: 'var(--rbl-text-muted)', fontSize: 15, lineHeight: 1.45, marginTop: 3 }}>{text}</span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </PageShell>
  )
}
