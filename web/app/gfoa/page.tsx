import PageShell from '../../components/PageShell'
import PlainCallout from '../../components/PlainCallout'
import { RECORD } from '../../lib/budget-adoption'
import {
  EXISTING_CRITERIA, GFOA_CHECKED, GFOA_QUOTES as Q, GFOA_SOURCES as SRC, REVISED_CRITERIA,
  gfoaCategories, gfoaSummary, type GfoaCategory,
} from '../../lib/gfoa'

const card = { background: 'var(--rbl-surface)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 16, padding: 20, boxShadow: '0 14px 34px var(--rbl-shadow)' } as const
const body = { color: 'var(--rbl-text-body)', fontSize: 14.5, lineHeight: 1.6 } as const
const link = { color: 'var(--rbl-accent)', fontWeight: 700 } as const

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const day = (iso: string) => { const [y, m, d] = iso.split('-').map(Number); return `${MONTHS[m - 1]} ${d}, ${y}` }

/** The date the Board adopted the 2026 budget, from its minutes (lib/budget-adoption.ts). */
const adopted2026 = RECORD.find((r) => r.year === 2026)?.adoption.date ?? null

export const metadata = {
  title: 'Standards — this site against the GFOA budget-presentation criteria',
  description:
    `How this site scores against GFOA's revised Distinguished Budget Presentation Award criteria, which take effect ${day(REVISED_CRITERIA.optionalFrom)}: nine content categories worth 150 points, five material-type categories worth 50, and an honest account of where the coverage runs out.`,
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
      subtitle={`GFOA's revised Distinguished Budget Presentation Award criteria, which take effect ${day(REVISED_CRITERIA.optionalFrom)}: nine content categories worth 150 points and five material-type categories worth 50. On this site's own reading it scores ${gfoaSummary.totalScore} of ${gfoaSummary.totalPossible}. GFOA gives the award for more than ${gfoaSummary.threshold}. Read the two caveats before the number.`}
    >
      <PlainCallout
        tips={[
          { label: 'What GFOA is', text: 'the Government Finance Officers Association. Its Distinguished Budget Presentation Award is the recognized standard for how a government should present a budget.' },
          { label: 'What the revision changes', text: 'mandatory criteria give way to a 200-point scale, the content criteria become questions a member of the public would ask, and the award takes in every kind of budget communication, from websites and dashboards to videos, not just the budget document.' },
          { label: 'Why bother', text: 'the criteria are a checklist for whether budget information has been presented honestly and completely — including the parts this site gets wrong.' },
        ]}
      >
        This page is a public scorecard of this site against the{' '}
        <strong>national standard for budget presentation</strong> — written to be useful where it falls short.
      </PlainCallout>

      <section data-gfoa-criteria-timing style={{ ...card, marginBottom: 18 }}>
        <h2 style={{ marginTop: 0, color: 'var(--rbl-title)', fontSize: 19 }}>Which criteria apply, and when</h2>
        <p style={body}>
          The criteria on this page are GFOA&apos;s revised set. They take effect on {day(REVISED_CRITERIA.optionalFrom)}.
          In GFOA&apos;s words: &ldquo;{Q.eitherSet.text}&rdquo;
        </p>
        <p style={body}>
          The existing criteria are the ones GFOA&apos;s{' '}
          <a href={SRC.award.url} target="_blank" rel="noreferrer" style={link}>award page</a> still links. They are written
          for &ldquo;{Q.existingHeading.text}&rdquo;, and they mark {EXISTING_CRITERIA.mandatory} of
          their {EXISTING_CRITERIA.criteria} criteria &ldquo;Mandatory&rdquo;. The revised set drops that: the first change
          GFOA lists is &ldquo;{Q.noMandatory.text}&rdquo;, and its criteria page says &ldquo;{Q.notEveryCategory.text}&rdquo;
          A category left empty scores nothing but does not disqualify.
        </p>
        {adopted2026 && (
          <p style={body}>
            <strong>What that means for the Town.</strong> The Town&apos;s budget year is the calendar year. Under the
            existing rules a budget must reach GFOA &ldquo;{Q.within90.text}&rdquo;, and the Board adopted the 2026 budget
            on {day(adopted2026)}. So a 2026 budget submitted on time would have been judged against the existing
            criteria, not the ones on this page. The 2027 budget could be judged against either set, depending on when
            it is submitted.
          </p>
        )}
        <p style={{ ...body, marginBottom: 0 }}>
          This page uses the revised set because every submission will be judged against it from{' '}
          {day(REVISED_CRITERIA.requiredFrom)}, and because it scores a budget website, which is what this site is.
        </p>
      </section>

      <section style={{ ...card, marginBottom: 18, borderLeft: '8px solid var(--rbl-gold-border)', background: 'var(--rbl-warn-bg)' }}>
        <h3 style={{ marginTop: 0, color: 'var(--rbl-title)', fontSize: 17 }}>Two things to know before reading the score</h3>
        <p style={body}>
          <strong>This site cannot win this award.</strong> Only governments may apply: under the revised rules, state
          and local governments and their sub-units &ldquo;{Q.whoMayApply.text}&rdquo;. The revised criteria take
          in &ldquo;{Q.scope.text}&rdquo;, but the applicant still has to be the government. These criteria are used here
          as a yardstick, not as an application.
        </p>
        <p style={{ ...body, marginBottom: 0 }}>
          <strong>The points are GFOA&apos;s; the scores are this site&apos;s own.</strong> GFOA&apos;s reviewers score
          completeness from 0 to 2 and quality from 0 to 3, so &ldquo;{Q.categoryScore.text}&rdquo;. Then &ldquo;{Q.scaled.text}&rdquo;
          This site set its scores by its own judgment, not on that scale, and {gfoaSummary.offScale} of
          the {gfoaSummary.total} could not come from a whole-number score out of 5. It is a self-assessment — the reading
          most likely to flatter itself — so the verdicts and the named gaps matter more than the arithmetic.
        </p>
      </section>

      <section style={{ ...card, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 12, marginBottom: 18 }}>
        <Stat label="Self-assessed total" value={`${gfoaSummary.totalScore} / ${gfoaSummary.totalPossible}`} accent />
        <Stat label="GFOA award: more than" value={`${gfoaSummary.threshold} points`} />
        <Stat label="Content" value={`${gfoaSummary.contentScore} / ${gfoaSummary.contentPossible}`} />
        <Stat label="Material type" value={`${gfoaSummary.materialScore} / ${gfoaSummary.materialPossible}`} />
        <Stat label="Categories not covered" value={String(gfoaSummary.gap)} color="var(--rbl-danger-strong)" />
      </section>

      {([
        ['content', `Content — ${gfoaSummary.contentPossible} points`, <>What a member of the public wants to know. GFOA words each category as &ldquo;{Q.contentQuestions.text}&rdquo;. The questions under each heading are GFOA&apos;s, word for word.</>],
        ['material', `Material type — ${gfoaSummary.materialPossible} points`, <>The tools used to communicate it. GFOA looks at their &ldquo;{Q.materialFocus.text}&rdquo;.</>],
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
        Category names, questions and point values from GFOA&apos;s{' '}
        <a href={SRC.criteria.url} target="_blank" rel="noreferrer" style={link}>{SRC.criteria.title}</a>. When they
        apply: <a href={SRC.changes.url} target="_blank" rel="noreferrer" style={link}>{SRC.changes.title}</a> and{' '}
        <a href={SRC.eligibility.url} target="_blank" rel="noreferrer" style={link}>{SRC.eligibility.title}</a>. How
        GFOA scores: <a href={SRC.scoring.url} target="_blank" rel="noreferrer" style={link}>{SRC.scoring.title}</a>. The
        existing criteria: <a href={SRC.existing.url} target="_blank" rel="noreferrer" style={link}>{SRC.existing.title}</a> and{' '}
        <a href={SRC.existingEligibility.url} target="_blank" rel="noreferrer" style={link}>{SRC.existingEligibility.title}</a>.
        All checked against gfoa.org on {day(GFOA_CHECKED)}. The scores against them are this site&apos;s own — an
        independent self-assessment, not a GFOA review.
      </p>
    </PageShell>
  )
}

function CategoryRow({ c }: { c: GfoaCategory }) {
  const s = STATUS_META[c.status]
  const pct = Math.round((c.selfScore / c.points) * 100)
  return (
    <article data-gfoa-category={c.name} data-gfoa-points={c.points} style={{ ...card, padding: 16, borderLeft: `5px solid ${s.fg}` }}>
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
      <p data-gfoa-questions style={{ color: 'var(--rbl-text-muted)', fontSize: 13.5, margin: '0 0 5px', lineHeight: 1.5 }}>
        <strong>GFOA asks:</strong> {c.questions.join(' ')}
        {c.questionNote && <> <em>({c.questionNote})</em></>}
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
