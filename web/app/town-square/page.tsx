import PageShell from '../../components/PageShell'
import PlainCallout from '../../components/PlainCallout'
import {
  acquisition, boardRecord, developmentBudget, fundBalanceImpact, openQuestions,
  project, publicMoney, scopeEvolution, sources, threeLedgers, timeline,
  voteSummary, type Milestone,
} from '../../lib/town-square'
import { appropriations, policyMinimumPercent, policyUpperPercent, unassignedFundBalance } from '../../lib/reserve-policy'

const base = process.env.NEXT_PUBLIC_BASE_PATH || ''
const card = { background: 'var(--rbl-surface)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 16, padding: 20, boxShadow: '0 14px 34px var(--rbl-shadow)' } as const
const usd = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
const pct = (n: number) => `${((n / appropriations) * 100).toFixed(1)}%`

// Government level, coloured from the validated series palette so federal, state
// and county read apart at a glance.
const LEVEL: Record<'federal' | 'state' | 'county', string> = {
  federal: 'var(--rbl-series-blue)',
  state: 'var(--rbl-series-teal)',
  county: 'var(--rbl-series-gold)',
}

const KIND: Record<Milestone['kind'], { label: string; color: string; bg: string; border: string }> = {
  property: { label: 'Property', color: 'var(--rbl-violet-strong)', bg: 'var(--rbl-violet-bg)', border: 'var(--rbl-violet-border)' },
  money: { label: 'Money', color: 'var(--rbl-warn-strong)', bg: 'var(--rbl-warn-bg)', border: 'var(--rbl-warn-border)' },
  legal: { label: 'Legal', color: 'var(--rbl-info-text)', bg: 'var(--rbl-info-bg)', border: 'var(--rbl-info-border)' },
  build: { label: 'Build', color: 'var(--rbl-teal-strong)', bg: 'var(--rbl-teal-bg)', border: 'var(--rbl-teal-border)' },
}

export const metadata = {
  title: 'Town Square — what the Town is building, and what it is spending',
  description:
    "Riverhead's Town Square project in one place: the plaza, hotel and flood work; the eminent domain taking of 111 East Main Street at $1.95 million; the bond anticipation note; and what both draws do to the General Fund balance.",
}

export default function TownSquarePage() {
  // Both draws against the audited balance. The note paydown is a ceiling, not a
  // known amount, and the page says so wherever the number appears.
  const totalDraw = fundBalanceImpact.draws.reduce((s, d) => s + d.amount, 0)
  const after = unassignedFundBalance - totalDraw
  const upperBound = appropriations * policyUpperPercent

  return (
    <PageShell
      title="Town Square"
      subtitle={`The Town's largest downtown project, gathered in one place — what is being built, how the land was assembled, and what the ${usd(acquisition.offer)} taking of 111 East Main Street and the note paydown do to the General Fund balance.`}
    >
      <PlainCallout
        tips={[
          { label: 'Eminent domain', text: 'a government taking private property for public use, which it may do — but it must pay fair value, and the owner can argue in court about what fair is.' },
          { label: 'Vesting order', text: 'the court order that transfers title. Once it and the acquisition map are filed with the county clerk, the land is the Town’s.' },
          { label: 'Fund balance', text: 'accumulated surplus from past years. Spending it is not borrowing — no interest, no repayment — but it is finite, and it is the cushion the reserve policy exists to protect.' },
        ]}
      >
        On <strong>September 1, 2026</strong> the Town Board voted unanimously to offer{' '}
        <strong>{usd(acquisition.offer)}</strong> for 111 East Main Street — the building intended for the Long
        Island Science Center — and to pay for it <strong>out of the General Fund balance</strong>. That follows a
        court vesting order on August 26 and a July vote to pay down the project&apos;s note, also from fund balance.
        Two draws on accumulated surplus for one project, which is why they are shown together below.
      </PlainCallout>

      <section style={{ ...card, marginBottom: 18 }}>
        <h2 style={{ marginTop: 0, marginBottom: 4, color: 'var(--rbl-title)', fontSize: 22 }}>What is being built</h2>
        <p style={{ color: 'var(--rbl-text-body)', fontSize: 15, lineHeight: 1.6, marginTop: 0 }}>{project.what}</p>
        <div style={{ background: 'var(--rbl-surface-2)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 10, padding: '11px 14px' }}>
          <strong style={{ color: 'var(--rbl-title)', fontSize: 13.6 }}>Where it stands</strong>
          <div style={{ color: 'var(--rbl-text-body)', fontSize: 13.8, lineHeight: 1.55, marginTop: 3 }}>{project.status}</div>
        </div>
      </section>

      {/* Three pots, not one. The Town's own cash is the smallest. */}
      <section style={{ ...card, marginBottom: 18, borderLeft: '6px solid var(--rbl-violet)' }}>
        <h2 style={{ marginTop: 0, marginBottom: 4, color: 'var(--rbl-title)', fontSize: 22 }}>Three ledgers, not one</h2>
        <p style={{ color: 'var(--rbl-text-strong)', fontSize: 15, lineHeight: 1.6, marginTop: 0 }}>{threeLedgers.lede}</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(215px,1fr))', gap: 12, marginBottom: 12 }}>
          <Ledger tone="info" label="Grants" amount={usd(publicMoney.total)} note="Federal, state and county awards. Seven of them, itemised below." />
          <Ledger tone="violet" label="Private development" amount={usd(developmentBudget.total)} note={`The vertical build, financed by ${developmentBudget.developer}.`} />
          <Ledger tone="warn" label="Town fund balance" amount={`${usd(totalDraw)} at most`} note="Land assembly — the taking and the note paydown. The Town's own money." />
        </div>

        <p style={{ color: 'var(--rbl-text-muted)', fontSize: 12.8, lineHeight: 1.6, margin: '0 0 14px' }}>{threeLedgers.note}</p>

        <h3 style={{ color: 'var(--rbl-title)', fontSize: 16, margin: '0 0 6px' }}>Where the {usd(publicMoney.total)} of public money came from</h3>
        <div style={{ display: 'grid', gap: 7, marginBottom: 10 }}>
          {publicMoney.awards.map((a) => (
            <div key={a.label}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, alignItems: 'baseline' }}>
                <span style={{ color: 'var(--rbl-text-strong)', fontSize: 13.4, fontWeight: 700 }}>{a.label}</span>
                <span style={{ color: 'var(--rbl-title)', fontWeight: 800, fontSize: 13.4, whiteSpace: 'nowrap' }}>{usd(a.amount)}</span>
              </div>
              <div style={{ height: 7, borderRadius: 4, background: 'var(--rbl-track)', overflow: 'hidden', marginTop: 3 }}>
                <div style={{ width: `${(a.amount / publicMoney.total) * 100}%`, height: '100%', background: LEVEL[a.level] }} />
              </div>
              {a.note && <div style={{ color: 'var(--rbl-text-muted)', fontSize: 12.3, lineHeight: 1.5, marginTop: 3 }}>{a.note}</div>}
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 14, fontSize: 11.5, color: 'var(--rbl-text-muted)', marginBottom: 10 }}>
          {(['federal', 'state', 'county'] as const).map((l) => (
            <span key={l}><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 3, background: LEVEL[l], marginRight: 5 }} />{l}</span>
          ))}
        </div>
        <div style={{ color: 'var(--rbl-text-muted)', fontSize: 12.4 }}>
          As itemised by the Town at the groundbreaking, {publicMoney.asOf}.
        </div>

        <div style={{ background: 'var(--rbl-surface-2)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 10, padding: '12px 14px', marginTop: 12 }}>
          <strong style={{ color: 'var(--rbl-title)', fontSize: 13.8 }}>Who pays for the {usd(developmentBudget.total)}</strong>
          <p style={{ color: 'var(--rbl-text-body)', fontSize: 13.8, lineHeight: 1.6, margin: '4px 0 10px' }}>{developmentBudget.whoPays}</p>
          <div style={{ display: 'grid', gap: 6 }}>
            {developmentBudget.sources.map((f) => (
              <div key={f.label} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, alignItems: 'center' }}>
                <div>
                  <span style={{ color: 'var(--rbl-text-strong)', fontSize: 13.2, fontWeight: 700 }}>{f.label}</span>
                  <div style={{ height: 6, borderRadius: 3, background: 'var(--rbl-track)', overflow: 'hidden', marginTop: 3 }}>
                    <div style={{ width: `${f.share}%`, height: '100%', background: f.kind === 'public' ? 'var(--rbl-fill-accent)' : 'var(--rbl-series-violet)' }} />
                  </div>
                </div>
                <span style={{ color: 'var(--rbl-title)', fontWeight: 800, fontSize: 13.2, whiteSpace: 'nowrap' }}>{usd(f.amount)} · {f.share}%</span>
              </div>
            ))}
          </div>
          <div style={{ color: 'var(--rbl-text-muted)', fontSize: 12.3, marginTop: 9 }}>Developer&apos;s budget as filed {developmentBudget.asOf}. {developmentBudget.qualification}</div>
        </div>
      </section>

      {/* The building keeps changing. */}
      <section style={{ ...card, marginBottom: 18 }}>
        <h2 style={{ marginTop: 0, marginBottom: 8, color: 'var(--rbl-title)', fontSize: 20 }}>{scopeEvolution.headline}</h2>
        <div style={{ display: 'grid', gap: 9 }}>
          {scopeEvolution.rows.map((r) => (
            <div key={r.when} style={{ background: 'var(--rbl-surface-2)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 10, padding: '11px 13px' }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'baseline', flexWrap: 'wrap' }}>
                <span style={{ color: 'var(--rbl-badge)', fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 0.4 }}>{r.when}</span>
                <strong style={{ color: 'var(--rbl-title)', fontSize: 14.6 }}>{r.what}</strong>
              </div>
              <div style={{ color: 'var(--rbl-text-body)', fontSize: 13.4, lineHeight: 1.55, marginTop: 3 }}>{r.extra}</div>
              <div style={{ color: 'var(--rbl-text-muted)', fontSize: 12, marginTop: 3 }}>{r.source}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How the Board actually voted. */}
      <section style={{ ...card, marginBottom: 18, borderLeft: '6px solid var(--rbl-danger-border)' }}>
        <h2 style={{ marginTop: 0, marginBottom: 4, color: 'var(--rbl-title)', fontSize: 22 }}>The money votes were unanimous. The taking was not.</h2>
        <p style={{ color: 'var(--rbl-text-body)', fontSize: 14.6, lineHeight: 1.6, marginTop: 0 }}>{voteSummary}</p>
        <div style={{ display: 'grid', gap: 6 }}>
          {boardRecord.map((v) => (
            <div key={v.number} style={{
              display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 10, alignItems: 'baseline',
              background: v.contested ? 'var(--rbl-warn-bg)' : 'var(--rbl-surface-2)',
              border: `1px solid ${v.contested ? 'var(--rbl-warn-border)' : 'var(--rbl-border-subtle)'}`,
              borderRadius: 9, padding: '9px 12px',
            }}>
              <span style={{ color: 'var(--rbl-text-muted)', fontSize: 11.6, fontWeight: 800, whiteSpace: 'nowrap' }}>{v.number}</span>
              <div>
                <div style={{ color: 'var(--rbl-text-strong)', fontSize: 13.4, lineHeight: 1.45 }}>{v.title}</div>
                <div style={{ color: 'var(--rbl-text-muted)', fontSize: 12 }}>{v.date}{v.dissent ? ` · ${v.dissent}` : ''}</div>
              </div>
              <span style={{
                fontSize: 11, fontWeight: 900, whiteSpace: 'nowrap',
                color: v.contested ? 'var(--rbl-warn-strong)' : 'var(--rbl-success-strong)',
              }}>{v.result}</span>
            </div>
          ))}
        </div>
      </section>

      <h2 style={{ color: 'var(--rbl-title)' }}>What it does to the fund balance</h2>
      <section style={{ ...card, marginBottom: 18, borderLeft: '6px solid var(--rbl-warn-border)' }}>
        <p style={{ color: 'var(--rbl-text-strong)', fontSize: 15, lineHeight: 1.6, marginTop: 0 }}>{fundBalanceImpact.lede}</p>

        <div style={{ display: 'grid', gap: 10, marginBottom: 14 }}>
          {fundBalanceImpact.draws.map((d) => (
            <div key={d.label} style={{ background: 'var(--rbl-surface-2)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 10, padding: '12px 14px' }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'baseline', flexWrap: 'wrap' }}>
                <strong style={{ color: 'var(--rbl-title)', fontSize: 15 }}>{d.label}</strong>
                <span style={{
                  fontSize: 10.5, fontWeight: 900, letterSpacing: 0.4, textTransform: 'uppercase', padding: '2px 7px', borderRadius: 5,
                  background: d.certainty === 'authorised' ? 'var(--rbl-success-bg)' : 'var(--rbl-warn-bg)',
                  color: d.certainty === 'authorised' ? 'var(--rbl-success-strong)' : 'var(--rbl-warn-strong)',
                  border: `1px solid ${d.certainty === 'authorised' ? 'var(--rbl-success-border)' : 'var(--rbl-warn-border)'}`,
                }}>
                  {d.certainty === 'authorised' ? 'Authorised amount' : 'Ceiling, not a known amount'}
                </span>
                <span style={{ marginLeft: 'auto', color: 'var(--rbl-title)', fontSize: 20, fontWeight: 900 }}>{usd(d.amount)}</span>
              </div>
              <div style={{ color: 'var(--rbl-text-body)', fontSize: 13.6, lineHeight: 1.55, marginTop: 4 }}>{d.note}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 12, marginBottom: 12 }}>
          <Stat label="Unassigned, 12/31/2025" value={usd(unassignedFundBalance)} sub={`${pct(unassignedFundBalance)} of appropriations`} />
          <Stat label="Both draws, at most" value={usd(totalDraw)} sub={`${((totalDraw / unassignedFundBalance) * 100).toFixed(1)}% of the balance`} amber />
          <Stat label="Left afterwards" value={usd(after)} sub={`${pct(after)} of appropriations`} />
          <Stat label="Policy range" value={`${policyMinimumPercent * 100}–${policyUpperPercent * 100}%`} sub={`upper bound is ${usd(upperBound)}`} />
        </div>

        <div style={{ background: 'var(--rbl-info-bg)', border: '1px solid var(--rbl-info-border)', borderRadius: 10, padding: '12px 14px' }}>
          <strong style={{ color: 'var(--rbl-info-text)' }}>The verdict:</strong>{' '}
          <span style={{ color: 'var(--rbl-info-text)', fontSize: 14.5, lineHeight: 1.6 }}>{fundBalanceImpact.verdict}</span>
        </div>
        <p style={{ color: 'var(--rbl-text-muted)', fontSize: 12.6, lineHeight: 1.55, marginTop: 10, marginBottom: 0 }}>{fundBalanceImpact.caveat}</p>
      </section>

      <section style={{ ...card, marginBottom: 18 }}>
        <h2 style={{ marginTop: 0, marginBottom: 4, color: 'var(--rbl-title)', fontSize: 22 }}>The taking of {acquisition.parcel}</h2>
        <dl style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 12, margin: '0 0 12px' }}>
          <Field term="Owner" value={acquisition.owner} />
          <Field term="Mortgage holders" value={acquisition.mortgageHolders} />
          <Field term="Town's offer" value={`${usd(acquisition.offer)} — ${acquisition.basis}`} />
        </dl>
        <div style={{ background: 'var(--rbl-warn-bg)', border: '1px solid var(--rbl-warn-border)', borderRadius: 10, padding: '12px 14px', marginBottom: 10 }}>
          <strong style={{ color: 'var(--rbl-warn-strong)' }}>{usd(acquisition.offer)} is a floor, not a ceiling:</strong>{' '}
          <span style={{ color: 'var(--rbl-warn-strong)', fontSize: 14.4, lineHeight: 1.6 }}>{acquisition.notFinal}</span>
        </div>
        <p style={{ color: 'var(--rbl-text-body)', fontSize: 14.2, lineHeight: 1.6, margin: 0 }}>{acquisition.whyItMatters}</p>
      </section>

      <h2 style={{ color: 'var(--rbl-title)' }}>How it got here</h2>
      <section style={{ display: 'grid', gap: 10, marginBottom: 18 }}>
        {timeline.map((m) => {
          const k = KIND[m.kind]
          return (
            <article key={`${m.date}-${m.what}`} style={{ ...card, padding: 16, borderLeft: `6px solid ${k.border}` }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'baseline', flexWrap: 'wrap' }}>
                <span style={{ color: 'var(--rbl-badge)', fontSize: 11.5, fontWeight: 900, letterSpacing: 0.4, textTransform: 'uppercase' }}>{m.date}</span>
                <span style={{ fontSize: 10.5, fontWeight: 900, letterSpacing: 0.4, textTransform: 'uppercase', padding: '2px 7px', borderRadius: 5, background: k.bg, color: k.color, border: `1px solid ${k.border}` }}>{k.label}</span>
              </div>
              <strong style={{ color: 'var(--rbl-title)', fontSize: 15.5, display: 'block', margin: '3px 0 3px' }}>{m.what}</strong>
              <div style={{ color: 'var(--rbl-text-body)', fontSize: 13.8, lineHeight: 1.6 }}>{m.detail}</div>
              <div style={{ color: 'var(--rbl-text-muted)', fontSize: 12.2, marginTop: 5 }}>Source: {m.source}</div>
            </article>
          )
        })}
      </section>

      <section style={{ ...card, marginBottom: 18, borderLeft: '6px solid var(--rbl-danger-border)' }}>
        <h2 style={{ marginTop: 0, marginBottom: 6, color: 'var(--rbl-title)', fontSize: 22 }}>What this page cannot tell you</h2>
        <ul style={{ margin: 0, paddingLeft: 18, display: 'grid', gap: 8 }}>
          {openQuestions.map((q) => (
            <li key={q} style={{ color: 'var(--rbl-text-body)', fontSize: 14.2, lineHeight: 1.6 }}>{q}</li>
          ))}
        </ul>
        <p style={{ color: 'var(--rbl-text-muted)', fontSize: 13, lineHeight: 1.55, marginTop: 12, marginBottom: 0 }}>
          These are answerable — at a Town Board meeting, or by a records request. The rules for speaking are on the{' '}
          <a href={`${base}/meetings/`} style={{ color: 'var(--rbl-link)', fontWeight: 700 }}>Town Board Votes</a> page,
          and the note itself is itemised on{' '}
          <a href={`${base}/capital-debt/`} style={{ color: 'var(--rbl-link)', fontWeight: 700 }}>Capital &amp; Debt</a>.
        </p>
      </section>

      <section style={{ ...card }}>
        <h3 style={{ marginTop: 0, color: 'var(--rbl-title)' }}>Sources</h3>
        <ul style={{ margin: 0, paddingLeft: 18, display: 'grid', gap: 9 }}>
          {sources.map((s) => (
            <li key={s.url} style={{ color: 'var(--rbl-text-body)', fontSize: 13.8, lineHeight: 1.5 }}>
              <a href={s.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--rbl-link)', fontWeight: 700 }}>{s.title}</a>
              <div style={{ color: 'var(--rbl-text-muted)', fontSize: 12.4, wordBreak: 'break-all' }}>{s.url}</div>
              <div style={{ color: 'var(--rbl-text-muted)', fontSize: 12.6 }}>{s.covers}</div>
            </li>
          ))}
        </ul>
      </section>
    </PageShell>
  )
}

function Ledger({ tone, label, amount, note }: { tone: 'info' | 'violet' | 'warn'; label: string; amount: string; note: string }) {
  const t = {
    info: { bg: 'var(--rbl-info-bg)', bd: 'var(--rbl-info-border)', fg: 'var(--rbl-info-text)' },
    violet: { bg: 'var(--rbl-violet-bg)', bd: 'var(--rbl-violet-border)', fg: 'var(--rbl-violet-strong)' },
    warn: { bg: 'var(--rbl-warn-bg)', bd: 'var(--rbl-warn-border)', fg: 'var(--rbl-warn-strong)' },
  }[tone]
  return (
    <div style={{ background: t.bg, border: `1px solid ${t.bd}`, borderRadius: 12, padding: 14 }}>
      <div style={{ color: t.fg, fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 0.4 }}>{label}</div>
      <div style={{ color: 'var(--rbl-title)', fontSize: 21, fontWeight: 900, margin: '2px 0 4px' }}>{amount}</div>
      <div style={{ color: t.fg, fontSize: 13.2, lineHeight: 1.5 }}>{note}</div>
    </div>
  )
}

function Field({ term, value }: { term: string; value: string }) {
  return (
    <div>
      <dt style={{ color: 'var(--rbl-text-muted)', fontSize: 10.8, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 0.4 }}>{term}</dt>
      <dd style={{ margin: '2px 0 0', color: 'var(--rbl-text-body)', fontSize: 13.8, lineHeight: 1.55 }}>{value}</dd>
    </div>
  )
}

function Stat({ label, value, sub, amber }: { label: string; value: string; sub?: string; amber?: boolean }) {
  return (
    <div style={{ background: 'var(--rbl-surface-2)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 12, padding: 12 }}>
      <div style={{ color: 'var(--rbl-text-muted)', fontSize: 11.5, textTransform: 'uppercase', fontWeight: 900, letterSpacing: 0.4 }}>{label}</div>
      <strong style={{ fontSize: 20, color: amber ? 'var(--rbl-warn)' : 'var(--rbl-title)' }}>{value}</strong>
      {sub && <div style={{ color: 'var(--rbl-text-muted)', fontSize: 12.4 }}>{sub}</div>}
    </div>
  )
}
