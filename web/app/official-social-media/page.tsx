import PageShell from '../../components/PageShell'
import PlainCallout from '../../components/PlainCallout'
import {
  blockingVsDeleting, disclaimer, elements, harassmentNote, individualAccounts,
  labelRule, ruling, sources, townAccounts, whatToDo,
} from '../../lib/official-social-media'

const base = process.env.NEXT_PUBLIC_BASE_PATH || ''
const card = { background: 'var(--rbl-surface)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 16, padding: 20, boxShadow: '0 14px 34px var(--rbl-shadow)' } as const

export const metadata = {
  title: 'Personal vs. official social media — when a block becomes a First Amendment problem',
  description:
    "The Supreme Court's 2024 test in Lindke v. Freed for when a public official's social media account counts as government speech, what it means for Riverhead's Town accounts and its Board members' own pages, and what a resident who has been blocked can do.",
}

function Quote({ children }: { children: string }) {
  return (
    <blockquote style={{
      margin: '8px 0 0', padding: '10px 14px', borderLeft: '4px solid var(--rbl-accent-border)',
      background: 'var(--rbl-surface-2)', borderRadius: '0 8px 8px 0',
      color: 'var(--rbl-text-strong)', fontSize: 13.8, lineHeight: 1.6, fontStyle: 'italic',
    }}>
      “{children}”
    </blockquote>
  )
}

export default function OfficialSocialMediaPage() {
  return (
    <PageShell
      title="Personal vs. official social media"
      subtitle="A public official's social media account can be their own, or it can be the government speaking. The Supreme Court settled how to tell the difference in 2024 — and the answer decides whether blocking a resident is a private choice or a First Amendment violation."
    >
      <PlainCallout
        title="Why this sits on a budget site"
        tips={[
          { label: 'The test is post by post', text: 'not account by account. The same page can carry official posts and personal ones.' },
          { label: 'A label does most of the work', text: 'an account marked personal gets a strong presumption; one carrying the office does not.' },
          { label: 'Blocking is blunter than deleting', text: 'it shuts someone out of everything, which is what creates the exposure.' },
        ]}
      >
        A great deal of what the Town decides gets announced, explained and argued over on social media before it
        ever reaches an agenda. A resident who is blocked loses access to that. This page explains the test the
        Supreme Court set out — and it makes <strong>no claim that any Riverhead official has blocked anyone</strong>.
        Nobody has audited that, and saying otherwise would need evidence this site does not have.
      </PlainCallout>

      {/* The ruling. */}
      <section style={{ ...card, marginBottom: 18, borderLeft: '6px solid var(--rbl-accent-border)' }}>
        <div style={{ color: 'var(--rbl-badge)', fontSize: 11.5, fontWeight: 900, letterSpacing: 0.5, textTransform: 'uppercase' }}>
          {ruling.court} · {ruling.decided}
        </div>
        <h2 style={{ margin: '4px 0 2px', color: 'var(--rbl-title)', fontSize: 25 }}>{ruling.case}</h2>
        <div style={{ color: 'var(--rbl-text-muted)', fontSize: 13, marginBottom: 10 }}>{ruling.citation} · {ruling.vote}</div>
        <p style={{ color: 'var(--rbl-text-body)', fontSize: 14.5, lineHeight: 1.6, marginTop: 0 }}>{ruling.facts}</p>
        <div style={{ background: 'var(--rbl-info-bg)', border: '1px solid var(--rbl-info-border)', borderRadius: 10, padding: '12px 14px' }}>
          <strong style={{ color: 'var(--rbl-info-text)', fontSize: 14 }}>The holding</strong>
          <p style={{ color: 'var(--rbl-info-text)', fontSize: 14.2, lineHeight: 1.6, margin: '4px 0 0' }}>{ruling.holding}</p>
        </div>
        <p style={{ color: 'var(--rbl-text-muted)', fontSize: 12.6, marginTop: 10, marginBottom: 0 }}>
          Widely-cited earlier cases — the Second Circuit&apos;s Trump ruling, the 2019 Ocasio-Cortez settlement — were
          decided under a different framework. <strong>Lindke replaced it.</strong> Anything describing the 2019
          approach as current law is out of date.
        </p>
      </section>

      {/* The two elements. */}
      <h2 style={{ color: 'var(--rbl-title)' }}>Both halves have to be true</h2>
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(310px,1fr))', gap: 14, marginBottom: 18 }}>
        {elements.map((e) => (
          <div key={e.n} style={{ ...card }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'baseline' }}>
              <span aria-hidden style={{ color: 'var(--rbl-accent)', fontWeight: 950, fontSize: 22 }}>{e.n}</span>
              <strong style={{ color: 'var(--rbl-title)', fontSize: 16.5 }}>{e.title}</strong>
            </div>
            <p style={{ color: 'var(--rbl-text-body)', fontSize: 14, lineHeight: 1.6, margin: '6px 0 0' }}>{e.body}</p>
            {e.quote && <Quote>{e.quote}</Quote>}
          </div>
        ))}
      </section>

      {/* Labels. */}
      <section style={{ ...card, marginBottom: 18 }}>
        <h2 style={{ marginTop: 0, marginBottom: 4, color: 'var(--rbl-title)', fontSize: 22 }}>{labelRule.headline}</h2>
        <p style={{ color: 'var(--rbl-text-body)', fontSize: 14.5, lineHeight: 1.6, marginTop: 0 }}>{labelRule.body}</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(290px,1fr))', gap: 12 }}>
          <div style={{ background: 'var(--rbl-success-bg)', border: '1px solid var(--rbl-success-border)', borderRadius: 10, padding: '11px 13px' }}>
            <strong style={{ color: 'var(--rbl-success-strong)', fontSize: 13.6 }}>Marked personal → presumed personal</strong>
            <div style={{ color: 'var(--rbl-success-strong)', fontSize: 13, lineHeight: 1.55, marginTop: 4, fontStyle: 'italic' }}>“{labelRule.personalQuote}”</div>
          </div>
          <div style={{ background: 'var(--rbl-info-bg)', border: '1px solid var(--rbl-info-border)', borderRadius: 10, padding: '11px 13px' }}>
            <strong style={{ color: 'var(--rbl-info-text)', fontSize: 13.6 }}>Carries the office → speaks for government</strong>
            <div style={{ color: 'var(--rbl-info-text)', fontSize: 13, lineHeight: 1.55, marginTop: 4, fontStyle: 'italic' }}>“{labelRule.officialQuote}”</div>
          </div>
        </div>
        <div style={{ background: 'var(--rbl-warn-bg)', border: '1px solid var(--rbl-warn-border)', borderRadius: 10, padding: '11px 13px', marginTop: 12 }}>
          <strong style={{ color: 'var(--rbl-warn-strong)', fontSize: 13.6 }}>Neither one → the risky middle</strong>
          <div style={{ color: 'var(--rbl-warn-strong)', fontSize: 13, lineHeight: 1.55, marginTop: 4, fontStyle: 'italic' }}>“{labelRule.mixedQuote}”</div>
        </div>
      </section>

      {/* Blocking vs deleting. */}
      <section style={{ ...card, marginBottom: 18, borderLeft: '6px solid var(--rbl-gold-border)' }}>
        <h2 style={{ marginTop: 0, marginBottom: 4, color: 'var(--rbl-title)', fontSize: 22 }}>{blockingVsDeleting.headline}</h2>
        <p style={{ color: 'var(--rbl-text-body)', fontSize: 14.5, lineHeight: 1.6, marginTop: 0 }}>{blockingVsDeleting.body}</p>
        <Quote>{blockingVsDeleting.quote}</Quote>
        <p style={{ color: 'var(--rbl-text-muted)', fontSize: 13, lineHeight: 1.55, marginTop: 10, marginBottom: 0 }}>{blockingVsDeleting.footnote}</p>
      </section>

      {/* Riverhead's accounts. */}
      <h2 style={{ color: 'var(--rbl-title)' }}>How this lands in Riverhead</h2>
      <section style={{ ...card, marginBottom: 14 }}>
        <h3 style={{ marginTop: 0, marginBottom: 4, color: 'var(--rbl-title)', fontSize: 17 }}>The Town&apos;s own accounts — the easy case</h3>
        <p style={{ color: 'var(--rbl-text-body)', fontSize: 14.2, lineHeight: 1.6, marginTop: 0 }}>{townAccounts.note}</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))', gap: 10 }}>
          {townAccounts.accounts.map((a) => (
            <a key={a.url} href={a.url} target="_blank" rel="noopener noreferrer"
               style={{ background: 'var(--rbl-surface-2)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 10, padding: '11px 13px', textDecoration: 'none', display: 'block' }}>
              <div style={{ color: 'var(--rbl-text-muted)', fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 0.4 }}>{a.platform}</div>
              <div style={{ color: 'var(--rbl-link)', fontWeight: 700, fontSize: 13.4, wordBreak: 'break-all' }}>{a.handle} ↗</div>
            </a>
          ))}
        </div>
        <p style={{ color: 'var(--rbl-text-muted)', fontSize: 12.4, marginTop: 10, marginBottom: 0 }}>
          Read from the Town&apos;s homepage: <a href={townAccounts.source} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--rbl-link)' }}>{townAccounts.source}</a>
        </p>
      </section>

      <section style={{ ...card, marginBottom: 18 }}>
        <h3 style={{ marginTop: 0, marginBottom: 4, color: 'var(--rbl-title)', fontSize: 17 }}>{individualAccounts.headline}</h3>
        <p style={{ color: 'var(--rbl-text-body)', fontSize: 14.2, lineHeight: 1.6, marginTop: 0 }}>{individualAccounts.body}</p>
        <div style={{ display: 'grid', gap: 10 }}>
          {individualAccounts.examples.map((ex) => (
            <div key={ex.who} style={{ background: 'var(--rbl-surface-2)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 10, padding: '12px 14px' }}>
              <strong style={{ color: 'var(--rbl-title)', fontSize: 15 }}>{ex.who}</strong>
              <div style={{ color: 'var(--rbl-text-body)', fontSize: 13.8, lineHeight: 1.55, marginTop: 3 }}>{ex.what}</div>
              {ex.url && (
                <a href={ex.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--rbl-link)', fontWeight: 700, fontSize: 12.8, display: 'inline-block', marginTop: 5, wordBreak: 'break-all' }}>
                  {ex.url} ↗
                </a>
              )}
              <div style={{ color: 'var(--rbl-text-muted)', fontSize: 12.8, lineHeight: 1.55, marginTop: 5 }}>{ex.note}</div>
            </div>
          ))}
        </div>
        <div style={{ background: 'var(--rbl-danger-bg)', border: '1px solid var(--rbl-danger-border)', borderRadius: 10, padding: '12px 14px', marginTop: 12 }}>
          <strong style={{ color: 'var(--rbl-danger-strong)' }}>What this page does not know:</strong>{' '}
          <span style={{ color: 'var(--rbl-danger-strong)', fontSize: 14, lineHeight: 1.55 }}>{individualAccounts.caveat}</span>
        </div>
      </section>

      {/* What a resident can do. */}
      <section style={{ ...card, marginBottom: 18, borderLeft: '6px solid var(--rbl-teal)' }}>
        <h2 style={{ marginTop: 0, marginBottom: 8, color: 'var(--rbl-title)', fontSize: 22 }}>If you think you were blocked for what you said</h2>
        <ol style={{ margin: 0, paddingLeft: 0, listStyle: 'none', display: 'grid', gap: 8 }}>
          {whatToDo.map((w, i) => (
            <li key={w} style={{ display: 'flex', gap: 10, alignItems: 'baseline', color: 'var(--rbl-text-body)', fontSize: 14.2, lineHeight: 1.6 }}>
              <span aria-hidden style={{ color: 'var(--rbl-teal-strong)', fontWeight: 900, minWidth: 16 }}>{i + 1}</span>
              <span>{w}</span>
            </li>
          ))}
        </ol>
        <div style={{ background: 'var(--rbl-surface-2)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 10, padding: '11px 13px', marginTop: 12 }}>
          <span style={{ color: 'var(--rbl-text-body)', fontSize: 13.8, lineHeight: 1.6 }}>{harassmentNote}</span>
        </div>
        <p style={{ color: 'var(--rbl-text-muted)', fontSize: 13, marginTop: 10, marginBottom: 0 }}>
          The Board&apos;s rules for public comment are on the{' '}
          <a href={`${base}/meetings/`} style={{ color: 'var(--rbl-link)', fontWeight: 700 }}>Town Board Votes</a> page.
        </p>
      </section>

      {/* Sources. */}
      <section style={{ ...card }}>
        <h3 style={{ marginTop: 0, color: 'var(--rbl-title)' }}>Where this comes from</h3>
        <ul style={{ margin: 0, paddingLeft: 18, display: 'grid', gap: 9 }}>
          {sources.map((s) => (
            <li key={s.url} style={{ color: 'var(--rbl-text-body)', fontSize: 13.8, lineHeight: 1.5 }}>
              <a href={s.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--rbl-link)', fontWeight: 700 }}>{s.title}</a>
              <div style={{ color: 'var(--rbl-text-muted)', fontSize: 12.4, wordBreak: 'break-all' }}>{s.url}</div>
              <div style={{ color: 'var(--rbl-text-muted)', fontSize: 12.6 }}>{s.covers}</div>
            </li>
          ))}
        </ul>
        <p style={{ color: 'var(--rbl-text-muted)', fontSize: 12.8, lineHeight: 1.55, marginTop: 14, marginBottom: 0 }}>{disclaimer}</p>
      </section>
    </PageShell>
  )
}
