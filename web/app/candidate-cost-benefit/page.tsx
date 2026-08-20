import PageShell from '../../components/PageShell'
import PlainCallout from '../../components/PlainCallout'
import { candidates2026, supervisorRace2026 as race, synthesis, neutralView, type Plank, type Candidate } from '../../lib/candidates-2026'

const base = process.env.NEXT_PUBLIC_BASE_PATH || ''
const card = { background: 'var(--rbl-surface)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 16, padding: 20, boxShadow: '0 14px 34px var(--rbl-shadow)' } as const
const PARTY: Record<string, { color: string; tint: string }> = {
  D: { color: 'var(--rbl-info-text)', tint: 'var(--rbl-info-bg)' },
  'R/C': { color: 'var(--rbl-danger)', tint: 'var(--rbl-danger-bg)' },
}

export const metadata = {
  title: 'Candidate proposals: a cost–benefit look',
  description:
    "A neutral, even-handed cost–benefit analysis of every stated platform plank in the 2026 Riverhead Town Supervisor race — each with a benefit, a cost, and a tradeoff, grounded in the Town's own budget figures — plus a non-partisan fiscal view of the Town's repeated tax increases.",
}

export default function CandidateCostBenefitPage() {
  return (
    <PageShell
      title="Candidate proposals: cost & benefit"
      subtitle={`Every stated platform plank in the ${race.electionDate} ${race.office} race, weighed evenly — each with a benefit, a cost, and a tradeoff, tied to the Town's own numbers. Not an endorsement.`}
    >
      <PlainCallout title="How to read this">
        {race.disclaimer} {race.ballotNote}{' '}
        For each candidate&apos;s own words, see{' '}
        <a href={`${base}/candidate-watch/`} style={{ color: 'var(--rbl-accent)', fontWeight: 800 }}>Candidate Watch</a>.
      </PlainCallout>

      {candidates2026.map((c) => (
        <CandidateBlock key={c.name} c={c} />
      ))}

      {/* Synthesis */}
      <section style={{ ...card, marginTop: 16, borderLeft: '6px solid var(--rbl-fill-brand)' }}>
        <h2 style={{ margin: '0 0 8px', color: 'var(--rbl-title)', fontSize: 18 }}>Where the two platforms actually converge — and diverge</h2>
        <SubList title="What they share" items={synthesis.common} color="var(--rbl-success-strong)" />
        <SubList title="Where they differ" items={synthesis.divergence} color="#b45309" />
        <div style={{ background: 'var(--rbl-violet-bg)', border: '1px solid var(--rbl-violet-border)', borderRadius: 10, padding: '12px 14px', marginTop: 12 }}>
          <strong style={{ color: 'var(--rbl-violet-strong)' }}>The honest scorecard:</strong>{' '}
          <span style={{ color: 'var(--rbl-text-strong)', fontSize: 14.5, lineHeight: 1.6 }}>{synthesis.unnamedCost}</span>
        </div>
      </section>

      {/* Beyond the campaigns — neutral fiscal view */}
      <section style={{ ...card, marginTop: 16, borderLeft: '6px solid var(--rbl-teal)' }}>
        <h2 style={{ margin: '0 0 6px', color: 'var(--rbl-title)', fontSize: 18 }}>Beyond the campaigns: a neutral fiscal view</h2>
        <p style={{ color: 'var(--rbl-text-strong)', fontSize: 14.5, lineHeight: 1.6, margin: '0 0 12px' }}>{neutralView.intro}</p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
          {neutralView.history.map((h) => (
            <span key={h} style={{ background: 'var(--rbl-warn-bg)', color: 'var(--rbl-warn)', border: '1px solid var(--rbl-warn-border)', borderRadius: 8, padding: '6px 11px', fontSize: 12.5, fontWeight: 700 }}>{h}</span>
          ))}
        </div>

        <div style={{ display: 'grid', gap: 10 }}>
          {neutralView.principles.map((p, i) => (
            <div key={p.title} style={{ background: 'var(--rbl-surface-2)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 12, padding: '12px 14px' }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'baseline' }}>
                <span style={{ color: 'var(--rbl-teal)', fontWeight: 900, fontSize: 13 }}>{i + 1}</span>
                <strong style={{ color: 'var(--rbl-title)', fontSize: 14.5 }}>{p.title}</strong>
              </div>
              <div style={{ color: 'var(--rbl-text-body)', fontSize: 13.8, lineHeight: 1.55, marginTop: 4 }}>{p.detail}</div>
            </div>
          ))}
        </div>

        <div style={{ background: 'var(--rbl-teal-bg)', border: '1px solid var(--rbl-teal-border)', borderRadius: 10, padding: '12px 14px', marginTop: 14 }}>
          <strong style={{ color: 'var(--rbl-teal-strong)' }}>And as a resident:</strong>{' '}
          <span style={{ color: 'var(--rbl-text-strong)', fontSize: 14.5, lineHeight: 1.6 }}>{neutralView.citizen}</span>
        </div>
        <p style={{ color: 'var(--rbl-text-muted)', fontSize: 12, marginTop: 10, marginBottom: 0 }}>{neutralView.sources}</p>
      </section>
    </PageShell>
  )
}

function CandidateBlock({ c }: { c: Candidate }) {
  const p = PARTY[c.party] ?? { color: 'var(--rbl-text-strong)', tint: 'var(--rbl-track)' }
  return (
    <section style={{ ...card, marginTop: 16, borderTop: `4px solid ${p.color}` }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
        <h2 style={{ margin: 0, color: 'var(--rbl-title)', fontSize: 19 }}>{c.name}</h2>
        <span style={{ background: p.tint, color: p.color, borderRadius: 999, padding: '3px 10px', fontSize: 12, fontWeight: 800 }}>{c.partyLabel}</span>
        <span style={{ background: 'var(--rbl-surface-3)', color: 'var(--rbl-text-body)', borderRadius: 999, padding: '3px 10px', fontSize: 12, fontWeight: 700 }}>{c.incumbent ? 'Incumbent' : 'Challenger'}</span>
        {c.site && <a href={c.site} target="_blank" rel="noreferrer" style={{ color: 'var(--rbl-accent)', fontWeight: 700, fontSize: 13 }}>Campaign site ↗</a>}
      </div>
      <p style={{ color: 'var(--rbl-text-muted)', fontSize: 13.5, lineHeight: 1.55, margin: '6px 0 4px' }}>{c.background}</p>

      <div style={{ display: 'grid', gap: 12, marginTop: 10 }}>
        {c.planks.map((pl, i) => (
          <PlankCard key={i} pl={pl} n={i + 1} />
        ))}
      </div>
      <p style={{ color: 'var(--rbl-text-muted)', fontSize: 12, marginTop: 12, marginBottom: 0 }}>Platform sources: {c.sources}</p>
    </section>
  )
}

function PlankCard({ pl, n }: { pl: Plank; n: number }) {
  return (
    <div style={{ background: 'var(--rbl-surface-2)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 12, padding: '14px 16px' }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'baseline' }}>
        <span style={{ color: 'var(--rbl-text-muted)', fontWeight: 900, fontSize: 13 }}>{n}</span>
        <strong style={{ color: 'var(--rbl-text-strong)', fontSize: 15, flex: 1 }}>{pl.proposal}</strong>
      </div>
      <div style={{ display: 'grid', gap: 8, marginTop: 10 }}>
        <Line label="Benefit" color="var(--rbl-success-strong)" bg="var(--rbl-success-bg)" text={pl.benefit} />
        <Line label="Cost" color="var(--rbl-danger)" bg="#fee2e2" text={pl.cost} />
        <Line label="Tradeoff" color="#b45309" bg="#fef3c7" text={pl.tradeoff} />
      </div>
      {pl.anchor && (
        <a href={`${base}${pl.anchor.href}`} style={{ display: 'inline-block', marginTop: 10, color: 'var(--rbl-accent)', fontWeight: 700, fontSize: 13 }}>
          See the numbers: {pl.anchor.label} →
        </a>
      )}
    </div>
  )
}

function Line({ label, color, bg, text }: { label: string; color: string; bg: string; text: string }) {
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
      <span style={{ background: bg, color, borderRadius: 6, padding: '3px 9px', fontSize: 11.5, fontWeight: 800, whiteSpace: 'nowrap', minWidth: 66, textAlign: 'center' }}>{label}</span>
      <span style={{ color: 'var(--rbl-text-strong)', fontSize: 13.8, lineHeight: 1.55 }}>{text}</span>
    </div>
  )
}

function SubList({ title, items, color }: { title: string; items: string[]; color: string }) {
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ color, fontWeight: 800, fontSize: 13.5, marginBottom: 4 }}>{title}</div>
      <ul style={{ margin: 0, paddingLeft: 18, color: 'var(--rbl-text-strong)', fontSize: 14, lineHeight: 1.55, display: 'grid', gap: 4 }}>
        {items.map((it) => <li key={it}>{it}</li>)}
      </ul>
    </div>
  )
}
