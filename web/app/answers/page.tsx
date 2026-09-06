import PageShell from '../../components/PageShell'
import { topics, answerCount, limits, method } from '../../lib/answers'

const base = process.env.NEXT_PUBLIC_BASE_PATH || ''
const card = { background: 'var(--rbl-surface)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 16, padding: 20, boxShadow: '0 14px 34px var(--rbl-shadow)' } as const

export const metadata = {
  title: 'What do you want to know about Riverhead’s money?',
  description:
    'Plain answers to the questions residents actually ask — why taxes went up, what the Town spends, who earns what, how much it owes, what happens next year — each with the real figure and a link to the page that proves it.',
}

export default function AnswersPage() {
  return (
    <PageShell
      title="What do you want to know?"
      subtitle={`${answerCount} questions residents actually ask, each answered with a real number and a link to the page that shows the work. Nothing here is new analysis — it is the same figures the rest of the site publishes, arranged the way you would ask for them.`}
    >
      {/* Topic jump strip. */}
      <nav aria-label="Topics" style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 18 }}>
        {topics.map((t) => (
          <a key={t.id} href={`#${t.id}`} style={{ background: 'var(--rbl-surface-2)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 999, padding: '7px 14px', color: 'var(--rbl-link)', fontWeight: 700, fontSize: 13.5, textDecoration: 'none' }}>
            <span aria-hidden="true">{t.icon}</span> {t.title}
          </a>
        ))}
        <a href="#limits" style={{ background: 'var(--rbl-warn-bg)', border: '1px solid var(--rbl-warn-border)', borderRadius: 999, padding: '7px 14px', color: 'var(--rbl-warn-strong)', fontWeight: 700, fontSize: 13.5, textDecoration: 'none' }}>
          What this site can’t answer
        </a>
      </nav>

      {topics.map((t) => (
        <section key={t.id} id={t.id} style={{ marginBottom: 26, scrollMarginTop: 16 }}>
          <h2 style={{ margin: '0 0 2px', color: 'var(--rbl-title)', fontSize: 21 }}>
            <span aria-hidden="true" style={{ marginRight: 8 }}>{t.icon}</span>{t.title}
          </h2>
          <p style={{ color: 'var(--rbl-text-muted)', fontSize: 13.8, margin: '0 0 12px' }}>{t.blurb}</p>

          <div style={{ display: 'grid', gap: 10 }}>
            {t.answers.map((a) => (
              <article key={a.q} style={{ ...card, padding: '16px 18px' }}>
                <h3 style={{ margin: '0 0 6px', color: 'var(--rbl-title)', fontSize: 16.5, lineHeight: 1.35 }}>{a.q}</h3>
                <p style={{ color: 'var(--rbl-text-strong)', fontSize: 14.8, lineHeight: 1.6, margin: '0 0 10px' }}>{a.a}</p>
                <a href={a.href} style={{ color: 'var(--rbl-link)', fontWeight: 800, fontSize: 13.8, textDecoration: 'none' }}>
                  {a.cta} →
                </a>
              </article>
            ))}
          </div>
        </section>
      ))}

      {/* The limits get their own section, not a footnote. A resident who leaves
          thinking their school tax is covered here has been misled by omission. */}
      <section id="limits" style={{ ...card, marginBottom: 20, scrollMarginTop: 16, borderLeft: '6px solid var(--rbl-warn)' }}>
        <h2 style={{ margin: '0 0 4px', color: 'var(--rbl-title)', fontSize: 20 }}>What this site can’t answer</h2>
        <p style={{ color: 'var(--rbl-text-body)', fontSize: 14.2, lineHeight: 1.6, margin: '0 0 14px', maxWidth: 760 }}>
          Just as useful as knowing what is here. These are the questions people arrive with that this site
          genuinely does not answer — with a pointer to who does, where one exists.
        </p>
        <div style={{ display: 'grid', gap: 10 }}>
          {limits.map((l) => (
            <div key={l.q} style={{ background: 'var(--rbl-surface-2)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 12, padding: '14px 16px' }}>
              <h3 style={{ margin: '0 0 5px', color: 'var(--rbl-title)', fontSize: 15.5 }}>{l.q}</h3>
              <p style={{ color: 'var(--rbl-text-body)', fontSize: 14, lineHeight: 1.6, margin: l.href ? '0 0 8px' : 0 }}>{l.a}</p>
              {l.href && (
                <a href={l.href} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--rbl-link)', fontWeight: 800, fontSize: 13.6, textDecoration: 'none' }}>
                  {l.cta}
                </a>
              )}
            </div>
          ))}
        </div>
      </section>

      <section style={{ ...card, marginBottom: 20 }}>
        <h2 style={{ margin: '0 0 6px', color: 'var(--rbl-title)', fontSize: 17 }}>{method.headline}</h2>
        <p style={{ color: 'var(--rbl-text-body)', fontSize: 14.2, lineHeight: 1.65, margin: 0, maxWidth: 820 }}>{method.body}</p>
      </section>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        <a href={`${base}/explore/`} style={{ background: 'var(--rbl-cta-bg)', color: 'var(--rbl-cta-fg)', fontWeight: 800, padding: '11px 20px', borderRadius: 10, textDecoration: 'none', fontSize: 14 }}>
          Prefer a guided walkthrough? Take the tour →
        </a>
        <a href={`${base}/search/`} style={{ background: 'var(--rbl-surface-2)', border: '1px solid var(--rbl-border-subtle)', color: 'var(--rbl-link)', fontWeight: 800, padding: '11px 20px', borderRadius: 10, textDecoration: 'none', fontSize: 14 }}>
          Looking for something specific? Search everything →
        </a>
      </div>
    </PageShell>
  )
}
