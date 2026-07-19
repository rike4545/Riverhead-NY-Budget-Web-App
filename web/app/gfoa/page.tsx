import PageShell from '../../components/PageShell'
import PlainCallout from '../../components/PlainCallout'
import { gfoaCategories, gfoaSummary, type GfoaCriterion } from '../../lib/gfoa'

const card = { background: 'white', border: '1px solid #e2e8f0', borderRadius: 16, padding: 20, boxShadow: '0 14px 34px rgba(15,23,42,.05)' } as const

export const metadata = {
  title: 'GFOA Standards Alignment — how this site measures up',
  description:
    'A criterion-by-criterion assessment of Riverhead Budget Live against the GFOA Distinguished Budget Presentation Award standards — what is met, partial, or missing.',
}

const STATUS_META = {
  met: { label: 'Met', bg: '#dcfce7', fg: '#166534' },
  partial: { label: 'Partial', bg: '#fef3c7', fg: '#92400e' },
  gap: { label: 'Not yet', bg: '#fee2e2', fg: '#991b1b' },
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
          { label: 'Why it applies here', text: 'the award rates a government’s own budget document — but its criteria are the recognized yardstick for budget presentation, so we hold this site to every criterion that can apply and say plainly where we fall short.' },
          { label: 'Honest statuses', text: '"Not yet" usually means the Town has not published the underlying information (goals, performance measures, debt schedules) in a form anyone can extract.' },
        ]}
      >
        This page is our public scorecard against the <strong>national standard for budget presentation</strong> —
        including where this site doesn&apos;t measure up yet.
      </PlainCallout>

      <section style={{ ...card, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 12, marginBottom: 18 }}>
        <Stat label="Criteria assessed" value={String(gfoaSummary.total)} />
        <Stat label="Met" value={String(gfoaSummary.met)} color="#166534" />
        <Stat label="Partial" value={String(gfoaSummary.partial)} color="#92400e" />
        <Stat label="Not yet" value={String(gfoaSummary.gap)} color="#991b1b" />
      </section>

      {gfoaCategories.map((cat) => (
        <section key={cat.key} style={{ marginBottom: 22 }}>
          <h2 style={{ color: '#284a69', marginBottom: 2 }}>{cat.name}</h2>
          <p style={{ color: '#475569', marginTop: 0 }}>{cat.plain}</p>
          <div style={{ display: 'grid', gap: 10 }}>
            {cat.criteria.map((c) => <CriterionRow key={c.code} c={c} />)}
          </div>
        </section>
      ))}

      <p style={{ color: '#64748b', fontSize: 13, lineHeight: 1.5 }}>
        Criteria summarized from the GFOA Distinguished Budget Presentation Award program
        (<a href="https://www.gfoa.org/budget-award" target="_blank" rel="noreferrer" style={{ color: '#4a7297', fontWeight: 700 }}>gfoa.org/budget-award</a>).
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
        <div style={{ fontWeight: 800, color: '#284a69' }}>
          <span style={{ color: '#6b7280', fontWeight: 900, fontSize: 12, marginRight: 8 }}>{c.code}</span>
          {c.title}
          {c.mandatory && <span style={{ marginLeft: 8, background: '#eef6ff', color: '#4a7297', fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 999 }}>Mandatory</span>}
        </div>
        <span style={{ background: s.bg, color: s.fg, fontWeight: 800, fontSize: 12.5, padding: '4px 11px', borderRadius: 999 }}>{s.label}</span>
      </div>
      <p style={{ color: '#64748b', fontSize: 13.5, margin: '8px 0 4px', lineHeight: 1.5 }}><strong>GFOA asks:</strong> {c.requires}</p>
      <p style={{ color: '#334155', fontSize: 14, margin: 0, lineHeight: 1.5 }}>
        {c.howWeAddress}{' '}
        {c.link && <a href={c.link} style={{ color: '#4a7297', fontWeight: 800 }}>{c.linkLabel ?? 'View'} →</a>}
      </p>
      {c.gapNote && (
        <p style={{ color: '#92400e', fontSize: 13, margin: '6px 0 0', lineHeight: 1.45 }}><strong>To close the gap:</strong> {c.gapNote}</p>
      )}
    </article>
  )
}

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 12 }}>
      <div style={{ color: '#64748b', fontSize: 11.5, textTransform: 'uppercase', fontWeight: 900, letterSpacing: 0.4 }}>{label}</div>
      <strong style={{ fontSize: 22, color: color ?? '#284a69' }}>{value}</strong>
    </div>
  )
}
