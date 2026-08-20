import PageShell from '../../components/PageShell'
import PlainCallout from '../../components/PlainCallout'
import { gfoaCategories, gfoaSource, gfoaSummary, type GfoaCategory } from '../../lib/gfoa'

const card = { background: 'var(--rbl-surface)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 16, padding: 20, boxShadow: '0 14px 34px var(--rbl-shadow)' } as const

export const metadata = {
  title: 'Standards — this site against the GFOA budget-presentation criteria',
  description:
    "How this site scores against the GFOA Distinguished Budget Presentation Award criteria as revised for 2026: nine content categories worth 150 points, five material-type categories worth 50, and an honest account of where the coverage runs out.",
}

const STATUS_META: Record<string, { label: string; fg: string; bg: string }> = {
  strong: { label: 'Well covered', fg: 'var(--rbl-success-strong)', bg: 'var(--rbl-success-bg)' },
  partial: { label: 'Partly covered', fg: 'var(--rbl-warn)', bg: 'var(--rbl-warn-bg)' },
  gap: { label: 'Not covered', fg: 'var(--rbl-danger-strong)', bg: 'var(--rbl-danger-bg)' },
}

export default function GfoaPage() {
  return (
    <PageShell
      title="Measured against the national standard"
      subtitle={`GFOA's Distinguished Budget Presentation Award criteria, revised for 2026: nine content categories worth 150 points and five material-type categories worth 50. On this site's own reading it scores ${gfoaSummary.totalScore} of ${gfoaSummary.totalPossible}, against the ${gfoaSummary.threshold} points GFOA requires — but read the two caveats before the number.`}
    >
      <PlainCallout
        tips={[
          { label: 'What GFOA is', text: 'the Government Finance Officers Association. Its Distinguished Budget Presentation Award is the recognized standard for how a government should present a budget.' },
          { label: 'What changed in 2026', text: 'mandatory criteria were replaced by a 200-point scale, the content criteria became questions a member of the public would actually ask, and websites and dashboards became eligible submission material alongside the budget document.' },
          { label: 'Why bother', text: 'the criteria are a checklist for whether budget information has been presented honestly and completely — including the parts this site gets wrong.' },
        ]}
      >
        This page is a public scorecard of this site against the{' '}
        <strong>national standard for budget presentation</strong> — written to be useful where it falls short.
      </PlainCallout>

      <section style={{ ...card, marginBottom: 18, borderLeft: '8px solid var(--rbl-gold-border)', background: 'var(--rbl-warn-bg)' }}>
        <h3 style={{ marginTop: 0, color: 'var(--rbl-title)', fontSize: 17 }}>Two things to know before reading the score</h3>
        <p style={{ color: 'var(--rbl-text-body)', fontSize: 14.5, lineHeight: 1.6 }}>
          <strong>This site cannot win this award.</strong> GFOA grants it to governments that submit their own budget
          communications. The 2026 revision widened what counts as a submission — a budget website or dashboard is now
          eligible material alongside the document — but the applicant still has to be the government. These criteria
          are used here as a yardstick, not as an application.
        </p>
        <p style={{ color: 'var(--rbl-text-body)', fontSize: 14.5, lineHeight: 1.6, marginBottom: 0 }}>
          <strong>The points are GFOA&apos;s; the scores are this site&apos;s own.</strong> GFOA publishes what each
          category is worth, not a rubric for partial credit inside it, so &ldquo;12 of 20&rdquo; means the coverage was
          judged about three-fifths complete. It is a self-assessment — the reading most likely to flatter itself — so
          the verdicts and the named gaps matter more than the arithmetic.
        </p>
      </section>

      <section style={{ ...card, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 12, marginBottom: 18 }}>
        <Stat label="Self-assessed total" value={`${gfoaSummary.totalScore} / ${gfoaSummary.totalPossible}`} accent />
        <Stat label="GFOA award threshold" value={`${gfoaSummary.threshold} points`} />
        <Stat label="Content" value={`${gfoaSummary.contentScore} / ${gfoaSummary.contentPossible}`} />
        <Stat label="Material type" value={`${gfoaSummary.materialScore} / ${gfoaSummary.materialPossible}`} />
        <Stat label="Categories not covered" value={String(gfoaSummary.gap)} color="var(--rbl-danger-strong)" />
      </section>

      {([
        ['content', 'Content — 150 points', 'What a member of the public wants to know. GFOA frames each category as a question the government should answer; the question under each heading is theirs.'],
        ['material', 'Material type — 50 points', 'The tools used to communicate it: how they are organized and laid out, and whether they meet generally accepted accessibility standards.'],
      ] as const).map(([kind, heading, blurb]) => (
        <section key={kind} style={{ marginBottom: 22 }}>
          <h2 style={{ color: 'var(--rbl-title)', marginBottom: 2 }}>{heading}</h2>
          <p style={{ color: 'var(--rbl-text-body)', marginTop: 0 }}>{blurb}</p>
          <div style={{ display: 'grid', gap: 10 }}>
            {gfoaCategories.filter((c) => c.kind === kind).map((c) => <CategoryRow key={c.name} c={c} />)}
          </div>
        </section>
      ))}

      <p style={{ color: 'var(--rbl-text-muted)', fontSize: 13, lineHeight: 1.5 }}>
        Categories, questions and point values from{' '}
        <a href={gfoaSource.url} target="_blank" rel="noreferrer" style={{ color: 'var(--rbl-accent)', fontWeight: 700 }}>{gfoaSource.title}</a>.
        The scores against them are this site&apos;s own — an independent self-assessment, not a GFOA review.
      </p>
    </PageShell>
  )
}

function CategoryRow({ c }: { c: GfoaCategory }) {
  const s = STATUS_META[c.status]
  const pct = Math.round((c.selfScore / c.points) * 100)
  return (
    <article style={{ ...card, padding: 16, borderLeft: `5px solid ${s.fg}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'baseline' }}>
        <div style={{ fontWeight: 800, color: 'var(--rbl-title)' }}>{c.name}</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'baseline', flexWrap: 'wrap' }}>
          <span style={{ color: 'var(--rbl-text-strong)', fontWeight: 900, fontSize: 14, whiteSpace: 'nowrap' }}>{c.selfScore} / {c.points}</span>
          <span style={{ background: s.bg, color: s.fg, fontWeight: 800, fontSize: 12.5, padding: '4px 11px', borderRadius: 999 }}>{s.label}</span>
        </div>
      </div>
      <div style={{ background: 'var(--rbl-track)', borderRadius: 5, height: 8, overflow: 'hidden', margin: '9px 0 10px' }}
           role="img" aria-label={`${c.name}: self-assessed ${c.selfScore} of ${c.points} points`}>
        <div style={{ width: `${pct}%`, height: '100%', background: s.fg, borderRadius: 5 }} />
      </div>
      <p style={{ color: 'var(--rbl-text-muted)', fontSize: 13.5, margin: '0 0 5px', lineHeight: 1.5 }}>
        <strong>GFOA asks:</strong> {c.question}
      </p>
      <p style={{ color: 'var(--rbl-text-strong)', fontSize: 14, margin: 0, lineHeight: 1.5 }}>
        {c.howWeAddress}{' '}
        {c.link && <a href={c.link} style={{ color: 'var(--rbl-accent)', fontWeight: 800 }}>{c.linkLabel ?? 'View'} →</a>}
      </p>
      {c.gapNote && (
        <p style={{ color: 'var(--rbl-warn)', fontSize: 13, margin: '6px 0 0', lineHeight: 1.45 }}><strong>What is missing:</strong> {c.gapNote}</p>
      )}
    </article>
  )
}

function Stat({ label, value, color, accent }: { label: string; value: string; color?: string; accent?: boolean }) {
  return (
    <div style={{ background: 'var(--rbl-surface-2)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 12, padding: 12 }}>
      <div style={{ color: 'var(--rbl-text-muted)', fontSize: 11.5, textTransform: 'uppercase', fontWeight: 900, letterSpacing: 0.4 }}>{label}</div>
      <strong style={{ fontSize: accent ? 26 : 22, color: color ?? 'var(--rbl-title)' }}>{value}</strong>
    </div>
  )
}
