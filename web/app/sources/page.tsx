import PageShell from '../../components/PageShell'
import { parserDatasetStats, parserExtractionReport } from '../../lib/parser-data'
import { analyticsModules } from '../../lib/analytics-modules'
import { oscGuidanceSources } from '../../lib/osc-guidance'

const card = { background: 'var(--rbl-surface)', border: '1px solid var(--rbl-border)', borderRadius: 12, padding: 20, boxShadow: '0 10px 24px var(--rbl-shadow)' } as const
const pill = { borderRadius: 999, padding: '5px 10px', fontSize: 11.5, fontWeight: 900 } as const

function readableCategory(category: string) {
  return category.replaceAll('_', ' ')
}

function statusFor(doc: { page_count: number; money_value_count: number; status?: string }) {
  if (doc.status) return doc.status.replaceAll('_', ' ')
  if (doc.page_count > 0) return 'parsed'
  return 'pending parser output'
}

export default function SourcesPage() {
  const docs = parserExtractionReport.documents

  return (
    <PageShell
      title="The paper trail"
      subtitle="Riverhead source records plus the New York State Comptroller guidance used to interpret them — with clear separation between what the Town reported, what OSC requires, and what this site calculates."
    >
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(190px,100%),1fr))', gap: 12, marginBottom: 18 }}>
        <Metric label="Riverhead documents parsed" value={String(parserDatasetStats.documents)} />
        <Metric label="Audits parsed" value={String(parserDatasetStats.audits)} />
        <Metric label="Pages indexed" value={String(parserDatasetStats.pages)} />
        <Metric label="OSC authority sources" value={String(oscGuidanceSources.length)} />
      </section>

      <section id="osc-guidance" style={{ ...card, marginBottom: 18, borderTop: '5px solid var(--rbl-info-border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'start' }}>
          <div style={{ maxWidth: 820 }}>
            <div style={{ color: 'var(--rbl-info-text)', fontSize: 11.5, fontWeight: 950, textTransform: 'uppercase', letterSpacing: .65 }}>Primary authority · New York State</div>
            <h2 style={{ margin: '5px 0 7px', color: 'var(--rbl-title)' }}>OSC guidance used to interpret Riverhead’s records</h2>
            <p style={{ margin: 0, color: 'var(--rbl-text-body)', lineHeight: 1.6 }}>
              These publications are not Riverhead data. They are the State Comptroller&apos;s rules, accounting guidance and local-government management references used to decide how a Riverhead number should be classified or interpreted. A source can therefore support the <em>method</em> without proving a Riverhead-specific fact.
            </p>
          </div>
          <span style={{ ...pill, background: 'var(--rbl-info-bg)', color: 'var(--rbl-info-text)', border: '1px solid var(--rbl-info-border)' }}>Official OSC guidance</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(300px,100%),1fr))', gap: 12, marginTop: 16 }}>
          {oscGuidanceSources.map((source) => (
            <article key={source.id} style={{ background: 'var(--rbl-surface-2)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 12, padding: 14, display: 'grid', alignContent: 'start', gap: 9 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ ...pill, background: 'var(--rbl-surface)', color: 'var(--rbl-badge)', border: '1px solid var(--rbl-border)' }}>{source.topic}</span>
                <span style={{ color: 'var(--rbl-text-muted)', fontSize: 11.5, fontWeight: 800 }}>{source.kind === 'pdf' ? 'PDF' : 'Web guidance'}{source.published ? ` · ${source.published}` : ''}</span>
              </div>
              <h3 style={{ margin: 0, color: 'var(--rbl-title)', fontSize: 16, lineHeight: 1.35 }}>{source.title}</h3>
              <div style={{ color: 'var(--rbl-text-muted)', fontSize: 12.2, lineHeight: 1.45 }}>{source.authority}</div>
              <p style={{ margin: 0, color: 'var(--rbl-text-body)', fontSize: 13.4, lineHeight: 1.55 }}>{source.summary}</p>
              <div style={{ marginTop: 2 }}>
                <div style={{ color: 'var(--rbl-text-muted)', fontSize: 10.8, fontWeight: 950, textTransform: 'uppercase', letterSpacing: .45, marginBottom: 6 }}>Used by this site</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {source.usedBy.map((link) => (
                    <a key={`${source.id}-${link.href}-${link.label}`} href={link.href} style={{ ...pill, textDecoration: 'none', background: 'var(--rbl-surface)', color: 'var(--rbl-link)', border: '1px solid var(--rbl-border)' }}>{link.label} →</a>
                  ))}
                </div>
              </div>
              <a href={source.url} target="_blank" rel="noreferrer" style={{ marginTop: 3, textDecoration: 'none', color: 'var(--rbl-link)', fontWeight: 900, fontSize: 13.2 }}>
                Open OSC source ↗
              </a>
            </article>
          ))}
        </div>
      </section>

      <section style={{ ...card, marginBottom: 18, borderLeft: '5px solid var(--rbl-gold-border)' }}>
        <h2 style={{ marginTop: 0, color: 'var(--rbl-title)' }}>How to read the source hierarchy</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(220px,100%),1fr))', gap: 10 }}>
          <SourceLevel label="1 · Riverhead record" text="Adopted budgets, AFRs, audits, minutes, payroll files and other Town records establish what Riverhead reported, adopted, paid or voted on." />
          <SourceLevel label="2 · OSC authority" text="State Comptroller guidance establishes the statewide accounting, tax-cap, budget, procurement and reporting framework used to interpret those records." />
          <SourceLevel label="3 · Site calculation" text="Comparisons, projections and scenario outputs are this site’s calculations. They should be reproducible from the cited Riverhead records and the stated methodology." />
        </div>
      </section>

      <section style={{ ...card, marginBottom: 18, borderTop: '5px solid var(--rbl-gold-border)' }}>
        <h2 style={{ marginTop: 0, color: 'var(--rbl-title)' }}>Riverhead extraction freshness</h2>
        <p style={{ color: 'var(--rbl-text-body)' }}>Last parser run: {new Date(parserExtractionReport.parsed_at).toLocaleString()}</p>
        <p style={{ color: 'var(--rbl-text-body)' }}>Source index: <a href={parserExtractionReport.source_index} target="_blank" rel="noreferrer" style={{ color: 'var(--rbl-accent)', fontWeight: 900 }}>Town financial reports page</a></p>
        {parserExtractionReport.warning && <p style={{ color: 'var(--rbl-badge)', fontWeight: 800 }}>{parserExtractionReport.warning}</p>}
      </section>

      <section style={{ ...card, marginBottom: 18 }}>
        <h2 style={{ marginTop: 0, color: 'var(--rbl-title)' }}>What updates itself, behind the scenes</h2>
        <p style={{ color: 'var(--rbl-text-body)' }}>A status list of this site&apos;s own tools and pipelines, for anyone curious how the automation works.</p>
        <div style={{ display: 'grid', gap: 10 }}>
          {analyticsModules.map((module) => (
            <div key={module.name} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(180px,100%),1fr))', gap: 10, borderTop: '1px solid var(--rbl-border)', padding: '12px 0' }}>
              <strong>{module.name}</strong>
              <span style={{ fontWeight: 950, color: module.status === 'active' ? 'var(--rbl-success)' : module.status === 'partial' ? 'var(--rbl-warn)' : 'var(--rbl-text-muted)' }}>{module.status}</span>
              <span style={{ color: 'var(--rbl-text-body)', gridColumn: 'span 2' }}>{module.description}</span>
            </div>
          ))}
        </div>
      </section>

      {parserExtractionReport.failures.length > 0 && (
        <section style={{ ...card, marginBottom: 18, borderTop: '5px solid var(--rbl-danger)' }}>
          <h2 style={{ marginTop: 0, color: 'var(--rbl-danger-strong)' }}>Extraction warnings</h2>
          {parserExtractionReport.failures.slice(0, 8).map((failure, index) => (
            <p key={`${failure.title}-${index}`} style={{ color: 'var(--rbl-text-body)' }}><strong>{failure.title}:</strong> {failure.error}</p>
          ))}
        </section>
      )}

      <h2 style={{ color: 'var(--rbl-title)', margin: '26px 0 10px' }}>Riverhead records in the parser archive</h2>
      <section style={{ display: 'grid', gap: 14 }}>
        {docs.length === 0 ? (
          <article style={card}>
            <h2>No parsed source documents found yet.</h2>
            <p style={{ color: 'var(--rbl-text-body)' }}>The parser has not produced document records yet. The workflow should run the safe ingestion step and commit generated JSON.</p>
          </article>
        ) : docs.map((report) => (
          <article key={`${report.slug}-${report.parsed_at}`} style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <div>
                <div style={{ color: 'var(--rbl-badge)', fontWeight: 900, textTransform: 'uppercase', fontSize: 12 }}>{readableCategory(report.category)}</div>
                <h2 style={{ margin: '6px 0', color: 'var(--rbl-title)' }}>{report.title}</h2>
                <p style={{ color: 'var(--rbl-text-body)' }}>Parsed source document record generated from the financial-report ingestion pipeline.</p>
              </div>
              <div style={{ background: 'var(--rbl-surface-2)', color: 'var(--rbl-title)', borderRadius: 8, padding: '10px 14px', fontWeight: 900, height: 'fit-content' }}>{report.year ?? 'Year pending'}</div>
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 12 }}>
              <span style={{ background: 'var(--rbl-surface-2)', color: 'var(--rbl-title)', border: '1px solid var(--rbl-border)', borderRadius: 999, padding: '8px 12px', fontWeight: 800 }}>{statusFor(report)}</span>
              <span style={{ background: 'var(--rbl-warn-bg)', color: 'var(--rbl-warn-strong)', border: '1px solid var(--rbl-warn-border)', borderRadius: 999, padding: '8px 12px', fontWeight: 800 }}>{report.page_count} pages</span>
              <span style={{ background: 'var(--rbl-surface-2)', color: 'var(--rbl-text-body)', border: '1px solid var(--rbl-border)', borderRadius: 999, padding: '8px 12px', fontWeight: 800 }}>{report.money_value_count} money values</span>
            </div>

            <p style={{ color: 'var(--rbl-text-body)', fontSize: 13 }}>Parsed: {new Date(report.parsed_at).toLocaleString()} • Hash: {report.sha256 || 'pending'}</p>
            <a href={report.url} target="_blank" rel="noreferrer" style={{ display: 'inline-block', marginTop: 8, textDecoration: 'none', background: 'var(--rbl-fill-brand)', color: 'white', padding: '12px 18px', borderRadius: 8, fontWeight: 900 }}>
              Open Riverhead source
            </a>
          </article>
        ))}
      </section>
    </PageShell>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div style={card}>
      <div style={{ color: 'var(--rbl-text-body)', fontSize: 12, textTransform: 'uppercase', fontWeight: 900 }}>{label}</div>
      <strong style={{ fontSize: 28, color: 'var(--rbl-title)' }}>{value}</strong>
    </div>
  )
}

function SourceLevel({ label, text }: { label: string; text: string }) {
  return (
    <div style={{ background: 'var(--rbl-surface-2)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 10, padding: 12 }}>
      <strong style={{ color: 'var(--rbl-title)', fontSize: 13.5 }}>{label}</strong>
      <div style={{ color: 'var(--rbl-text-body)', fontSize: 12.8, lineHeight: 1.5, marginTop: 4 }}>{text}</div>
    </div>
  )
}
