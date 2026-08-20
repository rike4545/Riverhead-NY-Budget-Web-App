import PageShell from '../../components/PageShell'
import { parserDatasetStats, parserExtractionReport } from '../../lib/parser-data'
import { analyticsModules } from '../../lib/analytics-modules'

const card = { background: 'var(--rbl-surface)', border: '1px solid var(--rbl-border)', borderRadius: 12, padding: 20, boxShadow: '0 10px 24px var(--rbl-shadow)' } as const

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
    <PageShell title="The paper trail" subtitle="Every official document this site is built from — budgets, audits, and annual reports — with how fresh each one is and an honest note on anything that didn't parse cleanly.">
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 12, marginBottom: 18 }}>
        <Metric label="Documents parsed" value={String(parserDatasetStats.documents)} />
        <Metric label="Audits parsed" value={String(parserDatasetStats.audits)} />
        <Metric label="Pages indexed" value={String(parserDatasetStats.pages)} />
        <Metric label="Parser failures" value={String(parserDatasetStats.failures)} />
      </section>

      <section style={{ ...card, marginBottom: 18, borderTop: '5px solid var(--rbl-gold-border)' }}>
        <h2 style={{ marginTop: 0, color: 'var(--rbl-title)' }}>Extraction Freshness</h2>
        <p style={{ color: 'var(--rbl-text-body)' }}>Last parser run: {new Date(parserExtractionReport.parsed_at).toLocaleString()}</p>
        <p style={{ color: 'var(--rbl-text-body)' }}>Source index: <a href={parserExtractionReport.source_index} target="_blank" rel="noreferrer" style={{ color: 'var(--rbl-accent)', fontWeight: 900 }}>Town financial reports page</a></p>
        {parserExtractionReport.warning && <p style={{ color: 'var(--rbl-badge)', fontWeight: 800 }}>{parserExtractionReport.warning}</p>}
      </section>

      <section style={{ ...card, marginBottom: 18 }}>
        <h2 style={{ marginTop: 0, color: 'var(--rbl-title)' }}>What updates itself, behind the scenes</h2>
        <p style={{ color: 'var(--rbl-text-body)' }}>A status list of this site&apos;s own tools and pipelines, for anyone curious how the automation works.</p>
        <div style={{ display: 'grid', gap: 10 }}>
          {analyticsModules.map((module) => (
            <div key={module.name} style={{ display: 'grid', gridTemplateColumns: '240px 130px 1fr', gap: 14, borderTop: '1px solid var(--rbl-border)', padding: '12px 0' }}>
              <strong>{module.name}</strong>
              <span style={{ fontWeight: 950, color: module.status === 'active' ? 'var(--rbl-success)' : module.status === 'partial' ? 'var(--rbl-warn)' : 'var(--rbl-text-muted)' }}>{module.status}</span>
              <span style={{ color: 'var(--rbl-text-body)' }}>{module.description}</span>
            </div>
          ))}
        </div>
      </section>

      {parserExtractionReport.failures.length > 0 && (
        <section style={{ ...card, marginBottom: 18, borderTop: '5px solid #9b2c2c' }}>
          <h2 style={{ marginTop: 0, color: 'var(--rbl-danger-strong)' }}>Extraction Warnings</h2>
          {parserExtractionReport.failures.slice(0, 8).map((failure, index) => (
            <p key={`${failure.title}-${index}`} style={{ color: 'var(--rbl-text-body)' }}><strong>{failure.title}:</strong> {failure.error}</p>
          ))}
        </section>
      )}

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
              <span style={{ background: '#f7f8f5', color: 'var(--rbl-text-body)', border: '1px solid var(--rbl-border)', borderRadius: 999, padding: '8px 12px', fontWeight: 800 }}>{report.money_value_count} money values</span>
            </div>

            <p style={{ color: 'var(--rbl-text-body)', fontSize: 13 }}>Parsed: {new Date(report.parsed_at).toLocaleString()} • Hash: {report.sha256 || 'pending'}</p>
            <a href={report.url} target="_blank" rel="noreferrer" style={{ display: 'inline-block', marginTop: 8, textDecoration: 'none', background: 'var(--rbl-fill-brand)', color: 'white', padding: '12px 18px', borderRadius: 8, fontWeight: 900 }}>
              Open source document
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
