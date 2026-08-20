import PageShell from '../../components/PageShell'
import PlainCallout from '../../components/PlainCallout'
import { electionLawCase as c } from '../../lib/election-law-case'

const card = { background: 'var(--rbl-surface)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 16, padding: 20, boxShadow: '0 14px 34px var(--rbl-shadow)' } as const
const usd = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
const usd2 = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(n)

export const metadata = {
  title: 'The even-year election law case — what Riverhead spent',
  description:
    "What the Town of Riverhead paid outside counsel — including hotel and banquet tabs — to fight New York's even-year election law before withdrawing, and how a federal judge dismissed the taxpayer-funded challenge.",
}

export default function ElectionLawCasePage() {
  const firmsTotal = c.firms.reduce((s, f) => s + f.total, 0)
  return (
    <PageShell title={c.title} subtitle={c.subtitle}>
      <PlainCallout title="The number on the record">
        Riverhead paid <strong>{usd2(c.paidDisclosed)}</strong> to outside counsel {c.paidPeriod} — its{' '}
        one-<strong>{c.jointEntities}th</strong> share of the <strong>{usd(c.jointTotal)}</strong> billed to a joint
        retainer of {c.jointEntities} Long Island governments (Brewer&apos;s blended rate: {usd(c.blendedRate)}/hour).
        That is the <em>disclosed</em> amount through 2025; the Town&apos;s full cost has not been released — and on{' '}
        {c.outcome.date} the challenge was <strong>dismissed</strong>.
      </PlainCallout>

      <section style={{ ...card, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: 12, marginBottom: 16 }}>
        <Stat label="Riverhead paid (disclosed)" value={usd(c.paidDisclosed)} sub={c.paidPeriod} accent />
        <Stat label="Firms' combined bills" value={usd(firmsTotal)} sub="Brewer + Troutman Pepper Locke" />
        <Stat label="Case outcome" value="Dismissed" sub="with prejudice, June 29, 2026" red />
      </section>

      {/* Outcome — the headline accountability fact. */}
      <section style={{ ...card, marginBottom: 16, borderLeft: '8px solid var(--rbl-danger)' }}>
        <h3 style={{ marginTop: 0, color: 'var(--rbl-warn-strong)' }}>How it ended</h3>
        <p style={{ color: 'var(--rbl-text-strong)', fontSize: 14.5, lineHeight: 1.65, margin: '0 0 10px' }}>
          {c.outcome.court} {c.outcome.ruling}
        </p>
        <blockquote style={{ margin: 0, padding: '10px 14px', background: 'var(--rbl-danger-bg)', borderLeft: '4px solid var(--rbl-danger)', borderRadius: 8, color: 'var(--rbl-warn-strong)', fontSize: 14, fontStyle: 'italic', lineHeight: 1.6 }}>
          “{c.outcome.judgeQuote}” <span style={{ fontStyle: 'normal', fontWeight: 700 }}>— Judge Gary R. Brown</span>
        </blockquote>
      </section>

      {/* Can the Town claw it back? NY legal levers. */}
      <section style={{ ...card, marginBottom: 16, borderLeft: '6px solid var(--rbl-accent-border)' }}>
        <h3 style={{ marginTop: 0, color: 'var(--rbl-title)' }}>Can the Town refuse or claw back any of it?</h3>
        <p style={{ color: 'var(--rbl-text-strong)', fontSize: 14.5, lineHeight: 1.6, margin: '0 0 10px' }}>{c.recovery.intro}</p>
        <div style={{ display: 'grid', gap: 10 }}>
          {c.recovery.levers.map((l) => (
            <div key={l.title} style={{ background: 'var(--rbl-surface-2)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 10, padding: '11px 14px' }}>
              <div style={{ fontWeight: 800, color: 'var(--rbl-title)', fontSize: 14 }}>{l.title}</div>
              <div style={{ color: 'var(--rbl-text-strong)', fontSize: 13.5, lineHeight: 1.55, marginTop: 3 }}>{l.text}</div>
            </div>
          ))}
        </div>
        <p style={{ color: 'var(--rbl-text-strong)', fontSize: 14, lineHeight: 1.6, margin: '12px 0 0', fontWeight: 600 }}>{c.recovery.bottomLine}</p>
        <p style={{ color: 'var(--rbl-text-muted)', fontSize: 12, marginTop: 8, marginBottom: 0 }}>
          Legal references:{' '}
          {c.recovery.lawSources.map((s, i) => (
            <span key={s.url}>
              <a href={s.url} target="_blank" rel="noreferrer" style={{ color: 'var(--rbl-accent)', fontWeight: 700 }}>{s.title}</a>
              {i < c.recovery.lawSources.length - 1 ? ' · ' : '.'}
            </span>
          ))}
        </p>
      </section>

      {/* Itemized travel / banquet charges. */}
      <section style={{ ...card, marginBottom: 16 }}>
        <h3 style={{ marginTop: 0, color: 'var(--rbl-title)' }}>Hotel and banquet charges billed to the case</h3>
        <div style={{ display: 'grid', gap: 12 }}>
          {c.expenses.map((e) => (
            <div key={e.venue} style={{ background: 'var(--rbl-surface-2)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 10, padding: '12px 14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'baseline', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 800, color: 'var(--rbl-title)', fontSize: 15 }}>{e.venue}</span>
                <span style={{ fontWeight: 900, color: 'var(--rbl-danger)', fontSize: 16 }}>{e.amountPrefix}{usd(e.amount)}</span>
              </div>
              <div style={{ color: 'var(--rbl-text-muted)', fontSize: 12.5, fontWeight: 700, margin: '2px 0 4px' }}>{e.when} · {e.perUnit}</div>
              <div style={{ color: 'var(--rbl-text-strong)', fontSize: 13.5, lineHeight: 1.5 }}>{e.detail}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Benchmark against public travel rules — scale, not a disallowance. */}
      <section style={{ ...card, marginBottom: 16, background: 'var(--rbl-surface-2)' }}>
        <h3 style={{ marginTop: 0, color: 'var(--rbl-title)' }}>How that compares to public travel rules</h3>
        <p style={{ color: 'var(--rbl-text-strong)', fontSize: 14, lineHeight: 1.6, margin: 0 }}>{c.travelBenchmarkNote}</p>
      </section>

      <section style={{ ...card, marginBottom: 16 }}>
        <h3 style={{ marginTop: 0, color: 'var(--rbl-title)' }}>What the case was about</h3>
        <p style={{ color: 'var(--rbl-text-strong)', fontSize: 14.5, lineHeight: 1.6, margin: 0 }}>{c.whatItWasAbout}</p>
      </section>

      <section style={{ ...card, marginBottom: 16 }}>
        <h3 style={{ marginTop: 0, color: 'var(--rbl-title)' }}>Timeline</h3>
        <div style={{ display: 'grid', gap: 12 }}>
          {c.timeline.map((t) => (
            <div key={t.date} style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: 12, alignItems: 'baseline' }}>
              <span style={{ color: 'var(--rbl-accent)', fontWeight: 800, fontSize: 13 }}>{t.date}</span>
              <span style={{ color: 'var(--rbl-text-strong)', fontSize: 14, lineHeight: 1.5 }}>{t.text}</span>
            </div>
          ))}
        </div>
      </section>

      <section style={{ ...card, marginBottom: 16, borderLeft: '6px solid var(--rbl-warn)' }}>
        <h3 style={{ marginTop: 0, color: 'var(--rbl-warn-strong)' }}>What&apos;s still unknown</h3>
        <ul style={{ color: 'var(--rbl-text-strong)', fontSize: 14, lineHeight: 1.55, margin: 0, paddingLeft: 18, display: 'grid', gap: 6 }}>
          {c.unknowns.map((u) => <li key={u}>{u}</li>)}
        </ul>
      </section>

      <section style={{ ...card, marginBottom: 16, borderLeft: '6px solid var(--rbl-accent-border)' }}>
        <h3 style={{ marginTop: 0, color: 'var(--rbl-title)' }}>Questions worth asking</h3>
        <ul style={{ color: 'var(--rbl-text-strong)', fontSize: 14, lineHeight: 1.55, margin: 0, paddingLeft: 18, display: 'grid', gap: 6 }}>
          {c.questionsToAsk.map((q) => <li key={q}>{q}</li>)}
        </ul>
      </section>

      <p style={{ color: 'var(--rbl-text-muted)', fontSize: 12.5, lineHeight: 1.6 }}>
        Sources:{' '}
        {c.sources.map((s, i) => (
          <span key={s.url}>
            <a href={s.url} target="_blank" rel="noreferrer" style={{ color: 'var(--rbl-accent)', fontWeight: 700 }}>{s.title}</a>
            {i < c.sources.length - 1 ? ' · ' : '.'}
          </span>
        ))}
      </p>
    </PageShell>
  )
}

function Stat({ label, value, sub, accent, red }: { label: string; value: string; sub: string; accent?: boolean; red?: boolean }) {
  return (
    <div style={{ background: accent ? 'var(--rbl-info-bg)' : 'var(--rbl-surface-2)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 12, padding: 12 }}>
      <div style={{ color: 'var(--rbl-text-muted)', fontSize: 11.5, textTransform: 'uppercase', fontWeight: 900, letterSpacing: 0.4 }}>{label}</div>
      <strong style={{ fontSize: 22, color: red ? 'var(--rbl-danger)' : 'var(--rbl-title)' }}>{value}</strong>
      <div style={{ color: 'var(--rbl-text-muted)', fontSize: 12, marginTop: 2 }}>{sub}</div>
    </div>
  )
}
