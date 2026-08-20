import PageShell from '../../components/PageShell'
import PlainCallout from '../../components/PlainCallout'
import {
  disclaimer, help, nycCaveat, rights, sources, stateLaw, warrantNote,
} from '../../lib/know-your-rights'

const card = { background: 'var(--rbl-surface)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 16, padding: 20, boxShadow: '0 14px 34px var(--rbl-shadow)' } as const

export const metadata = {
  title: 'Know Your Rights — ICE, and the 2026 New York protections',
  description:
    'What your rights are if immigration agents come to your home, your workplace, or stop you in public, the six protections New York enacted in the FY27 budget, and the Long Island phone numbers that actually answer — corrected for Riverhead, not New York City.',
}

export default function KnowYourRightsPage() {
  return (
    <PageShell
      title="Know Your Rights"
      subtitle="Your rights when immigration agents come to your door, your job, or stop you on the road — plus the six protections New York wrote into the FY27 budget in May 2026, and the numbers to call from Riverhead."
    >
      <PlainCallout
        title="Why this is on a budget site"
        tips={[
          { label: 'The rights are federal', text: 'they come from the Constitution and apply the same in Riverhead as anywhere else.' },
          { label: 'The state protections are budget law', text: 'they were enacted as part of the FY27 Enacted Budget on May 28, 2026.' },
          { label: 'The phone numbers are the part people get wrong', text: 'most guides circulating online are written for New York City. Riverhead is in Suffolk County. The numbers below serve Long Island and the state.' },
        ]}
      >
        We track what the Town and the State do with money. New York&apos;s new limits on immigration enforcement
        arrived <strong>inside the state budget</strong>, so they belong here alongside everything else the budget
        did. The rest of this page is the practical part: what you can say, what you do not have to open, and who
        picks up the phone on Long Island.
      </PlainCallout>

      {/* The three settings — home, work, public. */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: 14, marginBottom: 18 }}>
        {rights.map((r) => (
          <div key={r.setting} style={{ ...card, borderLeft: '6px solid var(--rbl-accent-border)' }}>
            <h3 style={{ marginTop: 0, marginBottom: 6, color: 'var(--rbl-title)', fontSize: 18 }}>{r.setting}</h3>
            <p style={{ color: 'var(--rbl-text-strong)', fontSize: 14.5, lineHeight: 1.55, marginTop: 0, fontWeight: 600 }}>{r.lede}</p>
            <ul style={{ color: 'var(--rbl-text-body)', fontSize: 13.8, lineHeight: 1.55, margin: 0, paddingLeft: 18, display: 'grid', gap: 6 }}>
              {r.points.map((p) => <li key={p}>{p}</li>)}
            </ul>
          </div>
        ))}
      </section>

      {/* The judicial-vs-administrative warrant distinction, which is the hinge of the whole page. */}
      <section style={{ ...card, marginBottom: 18, background: 'var(--rbl-warn-bg)', border: '1px solid var(--rbl-warn-border)', borderLeft: '6px solid var(--rbl-gold-border)' }}>
        <h3 style={{ marginTop: 0, color: 'var(--rbl-note-text)' }}>{warrantNote.title}</h3>
        <p style={{ color: 'var(--rbl-note-text)', fontSize: 15, lineHeight: 1.6, margin: 0 }}>{warrantNote.body}</p>
      </section>

      {/* The six state measures. */}
      <section style={{ ...card, marginBottom: 18 }}>
        <h2 style={{ marginTop: 0, marginBottom: 4, color: 'var(--rbl-title)', fontSize: 24 }}>What New York changed in 2026</h2>
        <p style={{ color: 'var(--rbl-text-strong)', fontSize: 15, lineHeight: 1.6, marginTop: 0 }}>
          Signed <strong>{stateLaw.signed}</strong> as part of the <strong>{stateLaw.vehicle}</strong>. These are
          state protections, so they cover Riverhead — unlike the New York City local laws that most know-your-rights
          material describes.
        </p>
        <div style={{ display: 'grid', gap: 10 }}>
          {stateLaw.measures.map((m, i) => (
            <div key={m.title} style={{ background: 'var(--rbl-surface-2)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 10, padding: '12px 14px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <span aria-hidden style={{ color: 'var(--rbl-accent)', fontWeight: 950, fontSize: 15, minWidth: 18 }}>{i + 1}</span>
              <div>
                <strong style={{ color: 'var(--rbl-title)', fontSize: 15 }}>{m.title}</strong>
                <div style={{ color: 'var(--rbl-text-body)', fontSize: 13.8, lineHeight: 1.55, marginTop: 3 }}>{m.detail}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Help — the part that has to be right for Suffolk County. */}
      <section style={{ ...card, marginBottom: 18, borderLeft: '6px solid var(--rbl-teal)' }}>
        <h2 style={{ marginTop: 0, marginBottom: 4, color: 'var(--rbl-title)', fontSize: 24 }}>Who to call from Riverhead</h2>
        <p style={{ color: 'var(--rbl-text-strong)', fontSize: 15, lineHeight: 1.6, marginTop: 0 }}>
          Every number here was read off the organization&apos;s own website, and every one of them serves Suffolk
          County or the whole state.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 12 }}>
          {help.map((h) => (
            <div key={h.name} style={{ background: 'var(--rbl-surface-2)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 12, padding: 14 }}>
              <div style={{ color: 'var(--rbl-text-muted)', fontSize: 11, textTransform: 'uppercase', fontWeight: 900, letterSpacing: 0.4 }}>{h.scope}</div>
              <strong style={{ color: 'var(--rbl-title)', fontSize: 15, display: 'block', margin: '3px 0 4px' }}>{h.name}</strong>
              {h.phone && (
                <div style={{ margin: '4px 0' }}>
                  <a href={`tel:${h.phone.replace(/[^\d+]/g, '')}`} style={{ color: 'var(--rbl-teal-strong)', fontWeight: 900, fontSize: 19, textDecoration: 'none' }}>{h.phone}</a>
                </div>
              )}
              {h.hours && <div style={{ color: 'var(--rbl-text-muted)', fontSize: 12.5, lineHeight: 1.45 }}>{h.hours}</div>}
              <div style={{ color: 'var(--rbl-text-body)', fontSize: 13.5, lineHeight: 1.5, marginTop: 6 }}>{h.detail}</div>
              <a href={h.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--rbl-link)', fontWeight: 700, fontSize: 12.5, display: 'inline-block', marginTop: 6 }}>
                {new URL(h.url).hostname.replace(/^www\./, '')} ↗
              </a>
            </div>
          ))}
        </div>
        <div style={{ background: 'var(--rbl-danger-bg)', border: '1px solid var(--rbl-danger-border)', borderRadius: 10, padding: '12px 14px', marginTop: 14 }}>
          <strong style={{ color: 'var(--rbl-danger-strong)' }}>One correction worth making:</strong>{' '}
          <span style={{ color: 'var(--rbl-danger-strong)', fontSize: 14.5, lineHeight: 1.55 }}>{nycCaveat}</span>
        </div>
      </section>

      {/* Sources and the not-legal-advice line. */}
      <section style={{ ...card }}>
        <h3 style={{ marginTop: 0, color: 'var(--rbl-title)' }}>Where this comes from</h3>
        <ul style={{ margin: 0, paddingLeft: 18, display: 'grid', gap: 8 }}>
          {sources.map((s) => (
            <li key={s.url} style={{ color: 'var(--rbl-text-body)', fontSize: 13.8, lineHeight: 1.5 }}>
              <a href={s.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--rbl-link)', fontWeight: 700 }}>{s.title}</a>
              <div style={{ color: 'var(--rbl-text-muted)', fontSize: 12.5 }}>{s.covers}</div>
            </li>
          ))}
        </ul>
        <p style={{ color: 'var(--rbl-text-muted)', fontSize: 12.8, lineHeight: 1.55, marginTop: 14, marginBottom: 0 }}>{disclaimer}</p>
      </section>
    </PageShell>
  )
}
