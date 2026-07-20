import PageShell from '../../components/PageShell'
import PlainCallout from '../../components/PlainCallout'
import data from '../../public/data/board-elections.json'

const card = { background: 'white', border: '1px solid #e2e8f0', borderRadius: 16, padding: 18, boxShadow: '0 14px 34px rgba(15,23,42,.05)' } as const

export const metadata = {
  title: 'How the current Town Board was elected',
  description:
    "The actual vote count that put each current Riverhead Town Board member in office, compared to the town's total population and registered voters.",
}

type Member = {
  name: string
  office: string
  party: string
  electionLabel: string
  votes: number
  result: string
}

const pct = (n: number, d: number) => `${((n / d) * 100).toFixed(1)}%`

export default function BoardElectionsPage() {
  const { population, registeredVoters } = data.denominators
  const members = data.members as Member[]

  return (
    <PageShell title={data.title} subtitle={data.intro}>
      <section style={{ ...card, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 12, marginBottom: 16 }}>
        <Stat label="Town population (2020 Census)" value={population.toLocaleString()} />
        <Stat label="Registered voters (Nov 2025)" value={registeredVoters.toLocaleString()} accent />
      </section>

      <PlainCallout title="How to read this">
        The percentages below are each winner's own vote total divided by the town population, and by the registered-voter
        roll. They are <strong>not</strong> turnout rates — they're a plain way to see how small a slice of the whole town
        actually chose the people who now control its budget. Low shares are normal for off-year local elections.
      </PlainCallout>

      <div style={{ display: 'grid', gap: 12, marginTop: 4 }}>
        {members.map((m) => (
          <section key={m.name} style={{ ...card, borderLeft: '6px solid #4a7297' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'baseline', justifyContent: 'space-between' }}>
              <div>
                <span style={{ fontSize: 18, fontWeight: 900, color: '#284a69' }}>{m.name}</span>
                <span style={{ color: '#64748b', fontWeight: 700, marginLeft: 8 }}>{m.office} · {m.party}</span>
              </div>
              <span style={{ color: '#64748b', fontSize: 13, fontWeight: 700 }}>{m.electionLabel}</span>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, margin: '12px 0' }}>
              <Figure label="Votes to win" value={m.votes.toLocaleString()} big />
              <Figure label="of town population" value={pct(m.votes, population)} />
              <Figure label="of registered voters" value={pct(m.votes, registeredVoters)} />
            </div>

            <p style={{ color: '#334155', fontSize: 14, lineHeight: 1.55, margin: 0 }}>{m.result}</p>
          </section>
        ))}
      </div>

      <p style={{ color: '#6b7280', fontSize: 12.5, lineHeight: 1.55, marginTop: 16 }}>{data.note}</p>
      <p style={{ color: '#6b7280', fontSize: 12.5, lineHeight: 1.55, marginTop: 8 }}>
        Sources: {data.sources.join(' · ')}
      </p>
    </PageShell>
  )
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <div style={{ color: '#64748b', fontSize: 12, textTransform: 'uppercase', fontWeight: 900 }}>{label}</div>
      <strong style={{ fontSize: 28, color: accent ? '#4a7297' : '#284a69' }}>{value}</strong>
    </div>
  )
}

function Figure({ label, value, big }: { label: string; value: string; big?: boolean }) {
  return (
    <div>
      <div style={{ fontSize: big ? 26 : 22, fontWeight: 900, color: big ? '#284a69' : '#4a7297' }}>{value}</div>
      <div style={{ color: '#64748b', fontSize: 12, fontWeight: 700 }}>{label}</div>
    </div>
  )
}
