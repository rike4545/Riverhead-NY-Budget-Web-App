import PageShell from '../../components/PageShell'
import DataStatus from '../../components/DataStatus'
import metaJson from '../../public/data/meta.json'

const card = { background: 'var(--rbl-surface)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 16, padding: 18, boxShadow: '0 14px 34px var(--rbl-shadow)' } as const

type Detail = { label: string; asOf: string | null; status: 'official' | 'calculated' | 'projected'; cadence: string; records?: number | null; format?: string; bytes?: number }
type Meta = { generatedAt: string; generatedAtDisplay: string; datasets: Record<string, unknown>; datasetDetails?: Record<string, Detail> }
const meta = metaJson as unknown as Meta

function freshness() {
  const ageDays = Math.max(0, (Date.now() - new Date(meta.generatedAt).getTime()) / 86_400_000)
  if (ageDays < 7) return { label: 'Current', tone: 'var(--rbl-success-strong)', text: 'The pipeline snapshot is inside the normal weekly refresh window.' }
  if (ageDays < 14) return { label: 'Delayed', tone: 'var(--rbl-warn)', text: 'The refresh is overdue. Check the source-specific dates below.' }
  return { label: 'Stale', tone: 'var(--rbl-danger)', text: 'The pipeline snapshot is more than two weeks old. Verify important figures against official records.' }
}

export default function DataQualityPage() {
  const f = freshness()
  const details = meta.datasetDetails ?? {}

  return (
    <PageShell title="Data Quality & Freshness" subtitle="A transparent status page for the datasets behind Riverhead Budget Live: what is official, what is calculated, how current each source is, and what the deployment checks automatically.">
      <section style={{ ...card, marginBottom: 18, borderLeft: `6px solid ${f.tone}` }}>
        <div style={{ color: f.tone, fontWeight: 950, textTransform: 'uppercase', letterSpacing: .6, fontSize: 12 }}>● Pipeline status: {f.label}</div>
        <h2 style={{ margin: '6px 0 5px' }}>Last pipeline snapshot: {meta.generatedAtDisplay}</h2>
        <p style={{ margin: 0, color: 'var(--rbl-text-body)', lineHeight: 1.55 }}>{f.text}</p>
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(245px,1fr))', gap: 12, marginBottom: 18 }}>
        {Object.entries(details).map(([key, d]) => (
          <article key={key} style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <strong style={{ color: 'var(--rbl-title)', fontSize: 16 }}>{d.label}</strong>
              <DataStatus status={d.status} />
            </div>
            <div style={{ marginTop: 10, color: 'var(--rbl-text-strong)', fontSize: 13.5 }}><strong>As of:</strong> {d.asOf || 'Not available'}</div>
            <div style={{ marginTop: 5, color: 'var(--rbl-text-muted)', fontSize: 12.5, lineHeight: 1.45 }}>{d.cadence}</div>
            {typeof d.records === 'number' && <div style={{ marginTop: 7, color: 'var(--rbl-text-muted)', fontSize: 12.5 }}>{d.records.toLocaleString()} indexed records</div>}
            {d.format && <div style={{ marginTop: 5, color: 'var(--rbl-text-muted)', fontSize: 12.5 }}>Search format: {d.format}{d.bytes ? ` · ${(d.bytes / 1_000_000).toFixed(2)} MB total shards` : ''}</div>}
          </article>
        ))}
      </section>

      <section style={{ ...card, marginBottom: 18 }}>
        <h2 style={{ marginTop: 0 }}>Checks enforced before deployment</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 10 }}>
          <Check title="Routes" text="Navigation links must resolve to an exported page." />
          <Check title="Search shards" text="Manifest counts and byte sizes must match the generated shard files." />
          <Check title="Payload guardrail" text="Unexpected search-index growth fails verification instead of silently shipping a much larger download." />
          <Check title="Freshness metadata" text="The generated timestamp must exist and be parseable." />
          <Check title="ETL imports" text="Python dependencies, including PDF parsers, are smoke-tested in CI." />
          <Check title="Static build" text="The Next.js export and required resident-facing pages must build successfully." />
        </div>
      </section>

      <section style={card}>
        <h2 style={{ marginTop: 0 }}>How to interpret the labels</h2>
        <div style={{ display: 'grid', gap: 10 }}>
          <Legend status="official" text="Copied or parsed from a cited government record. Parsing can still introduce transcription errors, so consequential use should be checked against the source." />
          <Legend status="calculated" text="Computed by this site from cited records. The calculation should be reproducible from the linked source data." />
          <Legend status="projected" text="Forward-looking model or scenario. It is not an adopted Town budget or official forecast." />
        </div>
      </section>
    </PageShell>
  )
}

function Check({ title, text }: { title: string; text: string }) {
  return <div style={{ background: 'var(--rbl-surface-2)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 12, padding: 12 }}><strong style={{ color: 'var(--rbl-title)' }}>{title}</strong><div style={{ color: 'var(--rbl-text-muted)', fontSize: 12.5, lineHeight: 1.45, marginTop: 4 }}>{text}</div></div>
}

function Legend({ status, text }: { status: 'official' | 'calculated' | 'projected'; text: string }) {
  return <div style={{ display: 'flex', gap: 10, alignItems: 'start', flexWrap: 'wrap' }}><DataStatus status={status} /><span style={{ color: 'var(--rbl-text-body)', fontSize: 13.5, lineHeight: 1.5, flex: '1 1 420px' }}>{text}</span></div>
}
