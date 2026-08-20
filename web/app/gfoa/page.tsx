import PageShell from '../../components/PageShell'
import PlainCallout from '../../components/PlainCallout'
import { gfoaCategories, gfoaSummary, type GfoaCriterion } from '../../lib/gfoa'

const card = { background: 'var(--rbl-surface)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 16, padding: 20, boxShadow: '0 14px 34px var(--rbl-shadow)' } as const

export const metadata = {
  title: 'GFOA Standards Alignment — how this site measures up',
  description:
    'A criterion-by-criterion assessment of Riverhead Budget Live against the GFOA Distinguished Budget Presentation Award standards — what is met, partial, or missing.',
}

const STATUS_META = {
  met: { label: 'Met', bg: 'var(--rbl-success-bg)', fg: 'var(--rbl-success-strong)' },
  partial: { label: 'Partial', bg: 'var(--rbl-warn-bg)', fg: 'var(--rbl-warn)' },
  gap: { label: 'Not yet', bg: 'var(--rbl-danger-bg)', fg: 'var(--rbl-danger-strong)' },
} as const

export default function GfoaPage() {
  return (
    <PageShell
      title="Budget Presentation Standards"
      subtitle={`How this site measures up against the GFOA Distinguished Budget Presentation Award criteria — the national standard for presenting government budgets — assessed criterion by criterion: ${gfoaSummary.met} met, ${gfoaSummary.partial} partial, ${gfoaSummary.gap} not yet, of ${gfoaSummary.total}.`}
    >
      <PlainCallout
        tips={[
          { label: 'What GFOA is', text: 'the Government Finance Officers Association, whose Distinguished Budget Presentation Award defines how a budget should be presented: as a policy document, a financial plan, an operations guide, and a communication device.' },
          { label: 'Why it applies here', text: 'for the 2026 program year GFOA widened the award to cover all budget communications — websites and dashboards included, not just the printed budget document — so these criteria now apply to a site like this one directly, and we say plainly where we fall short.' },
          { label: 'Honest statuses', text: '"Not yet" usually means the Town has not published the underlying information (goals, performance measures, debt schedules) in a form anyone can extract.' },
        ]}
      >
        This page is our public scorecard against the <strong>national standard for budget presentation</strong> —
        including where this site doesn&apos;t measure up yet.
      </PlainCallout>

      <section style={{ ...card, marginBottom: 18, borderLeft: '8px solid var(--rbl-gold-border)', background: 'var(--rbl-warn-bg)' }}>
        <h3 style={{ marginTop: 0, color: 'var(--rbl-title)', fontSize: 17 }}>The standard changed for 2026 — read this scorecard accordingly</h3>
        <p style={{ color: 'var(--rbl-text-body)', fontSize: 14.5, lineHeight: 1.6, marginBottom: 8 }}>
          GFOA revised the award for the 2026 program year. Mandatory criteria are gone, replaced by a points
          scale — Content categories worth 150 points, Material Type categories worth 50, and more than 100 of the
          200 needed to receive the award. The content criteria are now framed as questions a member of the public
          would ask about the budget, and eligibility was widened to cover <strong>all budget communications,
          websites and dashboards included</strong>, rather than the budget document alone.
        </p>
        <p style={{ color: 'var(--rbl-text-body)', fontSize: 14.5, lineHeight: 1.6, marginBottom: 0 }}>
          The {gfoaSummary.total} criteria below are the framework GFOA used through 2025. They are still a fair
          check on whether a presentation covers the ground, and that is how this page uses them — as a coverage
          self-assessment, not as a score under the current program. Re-scoring against the itemised 2026 criteria
          is outstanding work.
        </p>
      </section>

      <section style={{ ...card, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 12, marginBottom: 18 }}>
        <Stat label="Criteria assessed" value={String(gfoaSummary.total)} />
        <Stat label="Met" value={String(gfoaSummary.met)} color="var(--rbl-success-strong)" />
        <Stat label="Partial" value={String(gfoaSummary.partial)} color="var(--rbl-warn)" />
        <Stat label="Not yet" value={String(gfoaSummary.gap)} color="var(--rbl-danger-strong)" />
      </section>

      {gfoaCategories.map((cat) => (
        <section key={cat.key} style={{ marginBottom: 22 }}>
          <h2 style={{ color: 'var(--rbl-title)', marginBottom: 2 }}>{cat.name}</h2>
          <p style={{ color: 'var(--rbl-text-body)', marginTop: 0 }}>{cat.plain}</p>
          <div style={{ display: 'grid', gap: 10 }}>
            {cat.criteria.map((c) => <CriterionRow key={c.code} c={c} />)}
          </div>
        </section>
      ))}

      <p style={{ color: 'var(--rbl-text-muted)', fontSize: 13, lineHeight: 1.5 }}>
        Criteria summarized from the GFOA Distinguished Budget Presentation Award program
        (<a href="https://www.gfoa.org/budget-award" target="_blank" rel="noreferrer" style={{ color: 'var(--rbl-accent)', fontWeight: 700 }}>gfoa.org/budget-award</a>).
        This is an independent self-assessment, not a GFOA review; the award itself is earned by governments for their
        official budget documents. &quot;Mandatory&quot; marks criteria GFOA requires for the award.
      </p>
    </PageShell>
  )
}

function CriterionRow({ c }: { c: GfoaCriterion }) {
  const s = STATUS_META[c.status]
  return (
    <article style={{ ...card, padding: 16, borderLeft: `5px solid ${s.fg}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'baseline' }}>
        <div style={{ fontWeight: 800, color: 'var(--rbl-title)' }}>
          <span style={{ color: 'var(--rbl-text-muted)', fontWeight: 900, fontSize: 12, marginRight: 8 }}>{c.code}</span>
          {c.title}
          {c.mandatory && <span style={{ marginLeft: 8, background: 'var(--rbl-info-bg)', color: 'var(--rbl-accent)', fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 999 }}>Mandatory</span>}
        </div>
        <span style={{ background: s.bg, color: s.fg, fontWeight: 800, fontSize: 12.5, padding: '4px 11px', borderRadius: 999 }}>{s.label}</span>
      </div>
      <p style={{ color: 'var(--rbl-text-muted)', fontSize: 13.5, margin: '8px 0 4px', lineHeight: 1.5 }}><strong>GFOA asks:</strong> {c.requires}</p>
      <p style={{ color: 'var(--rbl-text-strong)', fontSize: 14, margin: 0, lineHeight: 1.5 }}>
        {c.howWeAddress}{' '}
        {c.link && <a href={c.link} style={{ color: 'var(--rbl-accent)', fontWeight: 800 }}>{c.linkLabel ?? 'View'} →</a>}
      </p>
      {c.gapNote && (
        <p style={{ color: 'var(--rbl-warn)', fontSize: 13, margin: '6px 0 0', lineHeight: 1.45 }}><strong>To close the gap:</strong> {c.gapNote}</p>
      )}
    </article>
  )
}

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ background: 'var(--rbl-surface-2)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 12, padding: 12 }}>
      <div style={{ color: 'var(--rbl-text-muted)', fontSize: 11.5, textTransform: 'uppercase', fontWeight: 900, letterSpacing: 0.4 }}>{label}</div>
      <strong style={{ fontSize: 22, color: color ?? 'var(--rbl-title)' }}>{value}</strong>
    </div>
  )
}
