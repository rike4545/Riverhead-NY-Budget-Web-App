import PageShell from '../../components/PageShell'
import { parsedCitations, parsedSearchRecords } from '../../lib/parser-data'

const card = { background: 'white', border: '1px solid #d8e0e7', borderRadius: 12, padding: 18, boxShadow: '0 10px 24px rgba(31,95,143,.08)' } as const

export default function SearchPage() {
  const records = parsedSearchRecords.slice(0, 80)
  const citationById = new Map(parsedCitations.map((citation) => [citation.id, citation]))

  return (
    <PageShell title="Financial Search and Source Explorer" subtitle="Search parsed budget, audit, AFR, and source-document pages extracted from the Town financial record archive.">
      <section style={{ ...card, marginBottom: 18, borderTop: '5px solid #c99a2e' }}>
        <label style={{ display: 'block', color: '#12385b', fontWeight: 900, textTransform: 'uppercase', fontSize: 12 }}>Parsed Document Search</label>
        <input placeholder="Search examples: overtime, parks, sewer, fund balance, tax levy, debt service" style={{ width: '100%', marginTop: 10, padding: 14, borderRadius: 8, border: '1px solid #b8c7d3', fontSize: 16 }} />
        <p style={{ color: '#44576a' }}>Showing the latest parsed records generated from <code>search-index.json</code>. Full client-side filtering is the next enhancement.</p>
      </section>

      <section style={{ display: 'grid', gap: 12 }}>
        {records.length === 0 ? (
          <article style={card}>
            <h2>No parsed search records found yet.</h2>
            <p style={{ color: '#44576a' }}>The ingestion pipeline has not produced visible page records yet. Check the extraction report and workflow logs.</p>
          </article>
        ) : records.map((record) => {
          const citation = citationById.get(record.id)
          return (
            <article key={record.id} style={card}>
              <div style={{ color: '#9b6b12', fontWeight: 900, fontSize: 12, textTransform: 'uppercase' }}>{record.category.replaceAll('_', ' ')}</div>
              <h2 style={{ margin: '6px 0', color: '#12385b' }}>{record.document}</h2>
              <p style={{ color: '#334155' }}>{record.snippet || 'No text snippet extracted for this page.'}</p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
                <span style={{ background: '#eef3f8', color: '#12385b', border: '1px solid #d8e0e7', borderRadius: 999, padding: '6px 10px', fontWeight: 800 }}>Page {record.page}</span>
                <span style={{ background: '#fff8e6', color: '#5f430d', border: '1px solid #d8b45a', borderRadius: 999, padding: '6px 10px', fontWeight: 800 }}>Confidence: {record.confidence}</span>
                <span style={{ background: '#f7f8f5', color: '#44576a', border: '1px solid #d8e0e7', borderRadius: 999, padding: '6px 10px', fontWeight: 800 }}>{record.money_values?.length ?? 0} money values</span>
              </div>
              {citation && (
                <details style={{ marginTop: 12 }}>
                  <summary style={{ cursor: 'pointer', color: '#1f5f8f', fontWeight: 900 }}>Show source citation</summary>
                  <p style={{ color: '#44576a' }}>Document: {citation.document} • Page {citation.page} • Parsed {new Date(citation.parsed_at).toLocaleString()}</p>
                  <p style={{ color: '#44576a' }}>Hash: {citation.sha256 || 'pending'}</p>
                </details>
              )}
              <a href={record.url} target="_blank" rel="noreferrer" style={{ display: 'inline-block', marginTop: 12, color: '#1f5f8f', fontWeight: 900 }}>Open source document</a>
            </article>
          )
        })}
      </section>
    </PageShell>
  )
}
