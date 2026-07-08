import PageShell from '../../components/PageShell'

const card = { background: 'white', border: '1px solid #e2e8f0', borderRadius: 18, padding: 22, boxShadow: '0 14px 34px rgba(15,23,42,.05)' } as const

const scenarios = [
  {
    title: 'What if the Town had a $5M surplus to spend?',
    type: 'Using a one-time surplus',
    summary: 'Weighs the obvious choices for a windfall — holding taxes down, topping up the rainy-day fund, fixing up parks, replacing aging vehicles, or upgrading software — and what each one buys.',
    status: 'Modeled',
    confidence: 'A what-if, not a Town plan',
  },
  {
    title: 'Can the Town keep taxes flatter next year?',
    type: 'Easing the tax increase',
    summary: 'Looks at whether dipping into reserves could soften a tax hike in the short run — and why leaning on savings can catch up with you later.',
    status: 'Conceptual',
    confidence: 'Depends on Board policy choices',
  },
  {
    title: 'What does the retirement buyout do to staffing?',
    type: 'Workforce turnover',
    summary: 'Traces the ripple effects of early-retirement incentives — overtime to cover gaps, rehiring, and the promotion chains that follow a wave of departures.',
    status: 'Partial analysis',
    confidence: 'Still refining the payroll data',
  },
  {
    title: 'How much is the Town borrowing against the future?',
    type: 'Debt & big projects',
    summary: 'Examines how much room is left for debt payments, when big capital projects land, and how much all of it leans on reserves.',
    status: 'In progress',
    confidence: 'Waiting on the full debt schedule',
  },
]

export default function ScenariosPage() {
  return (
    <PageShell title="What-if scenarios" subtitle="Playing out choices the Town could make — how to use a surplus, steady the tax levy, handle workforce and debt pressure — and the trade-offs that come with each. These are illustrations for thinking, not Town policy.">
      <section style={{ display: 'grid', gap: 16 }}>
        {scenarios.map((scenario) => (
          <article key={scenario.title} style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' }}>
              <div>
                <div style={{ color: '#2563eb', fontWeight: 900, fontSize: 12, textTransform: 'uppercase' }}>{scenario.type}</div>
                <h2 style={{ margin: '6px 0' }}>{scenario.title}</h2>
                <p style={{ color: '#475569', maxWidth: 920 }}>{scenario.summary}</p>
              </div>
              <div style={{ display: 'grid', gap: 8, alignContent: 'start' }}>
                <span style={{ background: '#dbeafe', color: '#1e3a8a', borderRadius: 999, padding: '8px 12px', fontWeight: 900 }}>{scenario.status}</span>
                <span style={{ background: '#fef3c7', color: '#92400e', borderRadius: 999, padding: '8px 12px', fontWeight: 900 }}>{scenario.confidence}</span>
              </div>
            </div>

            <div style={{ marginTop: 18, borderTop: '1px solid #e2e8f0', paddingTop: 16 }}>
              <strong>Planned scenario outputs</strong>
              <ul style={{ color: '#475569', lineHeight: 1.9 }}>
                <li>assumption breakdowns</li>
                <li>fiscal impact summaries</li>
                <li>taxpayer impact indicators</li>
                <li>reserve impact projections</li>
                <li>debt and financing implications</li>
                <li>operational tradeoff analysis</li>
                <li>source-backed citations</li>
                <li>confidence scoring</li>
              </ul>
            </div>
          </article>
        ))}
      </section>
    </PageShell>
  )
}
