import { sourceDocuments } from '../lib/source-documents'

const navItems = ['Overview', 'Sources', 'Financial Statements', 'Budgets', 'Debt & BANs', 'Fiscal Events', 'Workforce', 'Capital Projects', 'BudgetGuard AI']

const agents = [
  ['Source Verification Agent', 'Running'],
  ['Accounting Validation Agent', 'Waiting'],
  ['Document Reconciliation Agent', 'Pending'],
  ['Fiscal Events Agent', 'Tracking'],
]

const pipeline = [
  ['1', 'Source Acquisition', 'Complete'],
  ['2', 'Document Parsing', 'Pending'],
  ['3', 'Data Normalization', 'Pending'],
  ['4', 'Validation & Reconciliation', 'Pending'],
  ['5', 'Data Available', 'Pending'],
]

const sourceStatus = sourceDocuments.reduce((totals, doc) => {
  totals.registered += 1
  if (doc.status === 'parsed_summary') totals.parsed += 1
  return totals
}, { registered: 0, parsed: 0 })

function badge(status: string) {
  const isRegistered = status === 'registered'
  const background = isRegistered ? '#dcfce7' : '#fff7ed'
  const color = isRegistered ? '#166534' : '#c2410c'
  const border = isRegistered ? '#86efac' : '#fed7aa'
  return <span style={{ background, color, border: `1px solid ${border}`, borderRadius: 999, padding: '4px 9px', fontSize: 12, fontWeight: 800 }}>{status.replace('_', ' ')}</span>
}

export default function Page() {
  return (
    <main style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '280px 1fr', fontFamily: 'Arial, sans-serif', background: 'linear-gradient(135deg,#f8fafc,#eef6ff)', color: '#0f172a' }}>
      <aside style={{ background: 'linear-gradient(180deg,#061a32,#082846 55%,#03111f)', color: 'white', padding: 24, minHeight: '100vh' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: '#dbeafe', color: '#0f172a', display: 'grid', placeItems: 'center', fontWeight: 900 }}>RB</div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 900, lineHeight: 1 }}>Riverhead<br />Budget Live</div>
            <div style={{ fontSize: 12, color: '#bfdbfe', marginTop: 4 }}>Fiscal Intelligence Platform</div>
          </div>
        </div>

        <nav style={{ marginTop: 36, display: 'grid', gap: 8 }}>
          {navItems.map((item, index) => (
            <div key={item} style={{ padding: '13px 14px', borderRadius: 12, background: index === 0 ? 'rgba(37,99,235,.55)' : 'transparent', border: index === 0 ? '1px solid rgba(147,197,253,.35)' : '1px solid transparent', fontWeight: 700 }}>
              {item}
            </div>
          ))}
        </nav>

        <section style={{ marginTop: 38, border: '1px solid rgba(147,197,253,.35)', borderRadius: 16, padding: 16, background: 'rgba(15,23,42,.35)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <strong>BudgetGuard AI</strong>
            <span style={{ background: '#22c55e', color: '#052e16', padding: '4px 8px', borderRadius: 999, fontSize: 11, fontWeight: 900 }}>ACTIVE</span>
          </div>
          <p style={{ color: '#bfdbfe', fontSize: 14, lineHeight: 1.5 }}>Monitoring source integrity, fiscal events, and validation readiness.</p>
        </section>
      </aside>

      <section style={{ padding: 34 }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', gap: 24, alignItems: 'flex-start' }}>
          <div>
            <p style={{ textTransform: 'uppercase', letterSpacing: 3, fontSize: 13, color: '#2563eb', fontWeight: 900 }}>Riverhead Budget Live</p>
            <h1 style={{ fontSize: 42, lineHeight: 1.05, margin: '8px 0' }}>Source-backed municipal fiscal intelligence</h1>
            <p style={{ fontSize: 17, maxWidth: 840, color: '#475569', marginTop: 10 }}>
              Every number must be traceable to official Town financial documents, reports, resolutions, or public statements.
            </p>
          </div>
          <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 999, padding: '10px 14px', boxShadow: '0 12px 30px rgba(15,23,42,.06)', whiteSpace: 'nowrap' }}>🛡️ Source-first mode</div>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 14, marginTop: 24 }}>
          {[
            ['Sources registered', sourceStatus.registered, 'Official documents'],
            ['Parsed documents', sourceStatus.parsed, 'No extracted figures yet'],
            ['Data points', 0, 'Awaiting parser output'],
            ['AI findings', 0, 'No unsupported claims'],
            ['Fiscal events', 1, 'Retirement initiative']
          ].map(([label, value, note]) => (
            <article key={String(label)} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 18, padding: 18, boxShadow: '0 14px 30px rgba(15,23,42,.06)' }}>
              <div style={{ color: '#64748b', textTransform: 'uppercase', fontSize: 11, fontWeight: 900 }}>{label}</div>
              <div style={{ fontSize: 34, fontWeight: 900, marginTop: 10 }}>{value}</div>
              <div style={{ color: '#64748b', fontSize: 13 }}>{note}</div>
            </article>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.5fr) minmax(330px, .8fr)', gap: 18, marginTop: 20 }}>
          <section style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 20, padding: 22, boxShadow: '0 14px 30px rgba(15,23,42,.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ margin: 0 }}>Official Source Registry</h2>
              <span style={{ background: '#dbeafe', color: '#1e40af', borderRadius: 999, padding: '5px 10px', fontSize: 12, fontWeight: 900 }}>{sourceStatus.registered} registered</span>
            </div>
            <div style={{ display: 'grid', gap: 0 }}>
              {sourceDocuments.map((doc) => (
                <div key={doc.title} style={{ display: 'grid', gridTemplateColumns: '1fr 150px 80px 140px', gap: 12, alignItems: 'center', borderTop: '1px solid #eef2f7', padding: '15px 0' }}>
                  <div>
                    <strong>{doc.title}</strong>
                    <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>{doc.notes}</div>
                  </div>
                  <div style={{ color: '#334155', fontSize: 13, fontWeight: 700 }}>{doc.kind.replace('_', ' ')}</div>
                  <div style={{ color: '#334155', fontSize: 13, fontWeight: 700 }}>{doc.year}</div>
                  <div>{badge(doc.status)}</div>
                </div>
              ))}
            </div>
          </section>

          <aside style={{ display: 'grid', gap: 18 }}>
            <section style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 20, padding: 20, boxShadow: '0 14px 30px rgba(15,23,42,.05)' }}>
              <h2 style={{ marginTop: 0 }}>Fiscal Event Watch</h2>
              <div style={{ border: '1px solid #bbf7d0', borderRadius: 14, padding: 15, background: '#f0fdf4' }}>
                <strong>Early Retirement Initiative</strong>
                <div style={{ marginTop: 6, fontSize: 14 }}>Claimed savings: up to 3 percent beginning in 2027</div>
                <div style={{ color: '#475569', fontSize: 13, marginTop: 8 }}>Status: unvalidated pending payroll and eligibility data.</div>
              </div>
            </section>

            <section style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 20, padding: 20, boxShadow: '0 14px 30px rgba(15,23,42,.05)' }}>
              <h2 style={{ marginTop: 0 }}>Ingestion Pipeline</h2>
              {pipeline.map(([step, label, status]) => (
                <div key={step} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderTop: '1px solid #eef2f7' }}>
                  <span><strong style={{ color: '#2563eb' }}>{step}</strong> &nbsp; {label}</span>
                  <strong style={{ color: status === 'Complete' ? '#16a34a' : '#64748b' }}>{status}</strong>
                </div>
              ))}
            </section>

            <section style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 20, padding: 20, boxShadow: '0 14px 30px rgba(15,23,42,.05)' }}>
              <h2 style={{ marginTop: 0 }}>BudgetGuard AI</h2>
              {agents.map(([name, status]) => (
                <div key={name} style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #eef2f7', padding: '10px 0', gap: 12 }}>
                  <span>{name}</span>
                  <strong>{status}</strong>
                </div>
              ))}
            </section>
          </aside>
        </div>

        <section style={{ display: 'grid', gridTemplateColumns: '1.4fr repeat(4, 1fr)', gap: 14, background: 'white', border: '1px solid #dbeafe', borderRadius: 20, padding: 18, marginTop: 20, boxShadow: '0 14px 30px rgba(15,23,42,.04)' }}>
          <strong>Transparency. Accuracy. Accountability.</strong>
          <span>📄 Source cited</span>
          <span>✅ Audit traceable</span>
          <span>🔒 No estimates</span>
          <span>👥 Public first</span>
        </section>
      </section>
    </main>
  )
}
