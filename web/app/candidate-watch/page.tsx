import PageShell from '../../components/PageShell'
import PlainCallout from '../../components/PlainCallout'
import data from '../../public/data/candidate-watch.json'

const card = { background: 'white', border: '1px solid #e2e8f0', borderRadius: 16, padding: 18, boxShadow: '0 14px 34px rgba(15,23,42,.05)' } as const

export const metadata = {
  title: '2026 Town Campaign Candidate Watch',
  description:
    "Who's running for Riverhead Town office in the November 2026 general election, their campaign links, and their stated platforms.",
}

type Candidate = {
  name: string
  party: string
  incumbent: boolean
  active: boolean
  website: string
  socialMedia: { platform: string; url: string }[]
  background: string
  platform: string[]
  sources: string[]
}

export default function CandidateWatchPage() {
  const cal = data.electionCalendar

  return (
    <PageShell title={data.title} subtitle={data.intro}>
      <section style={{ ...card, marginBottom: 16 }}>
        <h3 style={{ marginTop: 0, color: '#284a69' }}>Election Calendar</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 10, fontSize: 14 }}>
          <CalItem label="Filing Deadline (Major Parties)" value={cal.filingDeadlineMajorParties} />
          <CalItem label="Filing Deadline (Independents)" value={cal.filingDeadlineIndependents} />
          <CalItem label="Filing Deadline (Other Parties)" value={cal.filingDeadlineOtherParties} />
          <CalItem label="Primary" value={cal.primary} />
          <CalItem label="General Election" value={cal.generalElection} />
        </div>
      </section>

      <PlainCallout title="Page Legend">
        <strong>Bold</strong> = {data.legend.bold} · <strong>*</strong> = {data.legend.asterisk}
        <div style={{ marginTop: 4 }}>{data.legend.note}</div>
      </PlainCallout>

      {(data.races as { office: string; candidates: Candidate[] }[]).map((race) => (
        <section key={race.office} style={{ marginTop: 20 }}>
          <h2 style={{ color: '#284a69' }}>{race.office}</h2>
          <div style={{ display: 'grid', gap: 12 }}>
            {race.candidates.map((c) => (
              <CandidateCard key={c.name} c={c} />
            ))}
          </div>
        </section>
      ))}

      <div style={{ background: '#fff7ed', border: '1px solid #fdba74', borderLeft: '6px solid #c2410c', borderRadius: 12, padding: '14px 16px', marginTop: 20, color: '#7c2d12', fontSize: 14.5, lineHeight: 1.6 }}>
        <strong>Why there's only one race:</strong> {data.noRaceNote}
      </div>
    </PageShell>
  )
}

function CalItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ color: '#64748b', fontSize: 12, textTransform: 'uppercase', fontWeight: 800 }}>{label}</div>
      <div style={{ color: '#284a69', fontWeight: 700 }}>{value}</div>
    </div>
  )
}

function CandidateCard({ c }: { c: Candidate }) {
  const displayName = c.active ? <strong>{c.name}</strong> : c.name
  return (
    <article style={{ ...card, borderLeft: `6px solid ${c.incumbent ? '#4a7297' : '#d8e0e7'}` }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'baseline', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 18, color: '#284a69' }}>
          {displayName}
          {c.incumbent && <span aria-label="incumbent"> *</span>}
          <span style={{ color: '#64748b', fontWeight: 700, marginLeft: 8, fontSize: 15 }}>· {c.party}</span>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <a href={c.website} target="_blank" rel="noreferrer" style={{ background: '#284a69', color: 'white', padding: '6px 12px', borderRadius: 999, fontSize: 12.5, fontWeight: 800, textDecoration: 'none' }}>
            Campaign Website
          </a>
          {c.socialMedia.map((s) => (
            <a key={s.url} href={s.url} target="_blank" rel="noreferrer" style={{ background: '#eef3f8', color: '#284a69', border: '1px solid #d8e0e7', padding: '6px 12px', borderRadius: 999, fontSize: 12.5, fontWeight: 800, textDecoration: 'none' }}>
              {s.platform}
            </a>
          ))}
        </div>
      </div>
      <p style={{ color: '#334155', fontSize: 14.5, lineHeight: 1.55, margin: '10px 0 8px' }}>{c.background}</p>
      <div style={{ color: '#44576a', fontWeight: 800, fontSize: 13, marginBottom: 4 }}>Stated platform:</div>
      <ul style={{ color: '#334155', fontSize: 14, lineHeight: 1.6, margin: 0, paddingLeft: 20 }}>
        {c.platform.map((p) => (
          <li key={p}>{p}</li>
        ))}
      </ul>
      <p style={{ color: '#6b7280', fontSize: 12.5, margin: '10px 0 0' }}>Sources: {c.sources.join(' · ')}</p>
    </article>
  )
}
