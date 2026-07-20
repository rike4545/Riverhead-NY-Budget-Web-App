import PageShell from '../../components/PageShell'
import PlainCallout from '../../components/PlainCallout'
import data from '../../public/data/town-history.json'

const card = { background: 'white', border: '1px solid #e2e8f0', borderRadius: 16, padding: 18, boxShadow: '0 14px 34px rgba(15,23,42,.05)' } as const

export const metadata = {
  title: 'Supervisors & Council Members, 2004–2026',
  description:
    "Who has held Riverhead's Town Supervisor seat and Town Council seats over roughly the last two decades, sourced from local news archives and election records.",
}

type Person = {
  name: string
  party: string | null
  termStart: string
  termEnd: string | null
  note: string
  sources: string[]
}

function fmt(iso: string | null): string {
  if (!iso) return 'Present'
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

export default function TownHistoryPage() {
  const supervisors = [...data.supervisors].reverse() as Person[]
  const councilMembers = [...data.councilMembers].sort((a, b) => (b.termStart > a.termStart ? 1 : -1)) as Person[]

  return (
    <PageShell title={data.title} subtitle={data.intro}>
      <div style={{ background: '#eef6ff', border: '1px solid #bcd9f5', borderLeft: '6px solid #4a7297', borderRadius: 12, padding: '14px 16px', marginBottom: 16, color: '#1f3a52', fontSize: 14.5, lineHeight: 1.6 }}>
        <strong>This isn&apos;t a complete historical record.</strong> {data.scopeNote}
      </div>

      <h2 style={{ color: '#284a69' }}>Town Supervisor</h2>
      <div style={{ display: 'grid', gap: 12, marginBottom: 24 }}>
        {supervisors.map((p) => (
          <PersonCard key={`${p.name}-${p.termStart}`} p={p} />
        ))}
      </div>

      <h2 style={{ color: '#284a69' }}>Town Council</h2>
      <PlainCallout title="Why this list looks incomplete for older years">
        The Town Board always has four council seats at once, but only the seat-holders who could be confirmed with
        a specific, sourced date are listed here — mostly from the mid-2000s onward. Current members show only their
        first-elected date; see the Council Scorecard for their current term.
      </PlainCallout>
      <div style={{ display: 'grid', gap: 12, marginTop: 12 }}>
        {councilMembers.map((p) => (
          <PersonCard key={`${p.name}-${p.termStart}`} p={p} />
        ))}
      </div>
    </PageShell>
  )
}

function PersonCard({ p }: { p: Person }) {
  const current = p.termEnd === null
  return (
    <section style={{ ...card, borderLeft: `6px solid ${current ? '#4a7297' : '#d8e0e7'}` }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'baseline', justifyContent: 'space-between' }}>
        <div>
          <span style={{ fontSize: 18, fontWeight: 900, color: '#284a69' }}>{p.name}</span>
          <span style={{ color: '#64748b', fontWeight: 700, marginLeft: 8 }}>{p.party ? `· ${p.party}` : ''}</span>
        </div>
        <span
          style={{
            background: current ? '#eff6ff' : '#f8fafc',
            color: current ? '#1e40af' : '#475569',
            border: `1px solid ${current ? '#bfdbfe' : '#e2e8f0'}`,
            fontWeight: 800,
            fontSize: 12,
            padding: '3px 11px',
            borderRadius: 999,
            whiteSpace: 'nowrap',
          }}
        >
          {fmt(p.termStart)} – {fmt(p.termEnd)}
        </span>
      </div>
      <p style={{ color: '#334155', fontSize: 14.5, lineHeight: 1.55, margin: '10px 0 6px' }}>{p.note}</p>
      <p style={{ color: '#6b7280', fontSize: 12.5, margin: 0 }}>Sources: {p.sources.join(' · ')}</p>
    </section>
  )
}
