import scheduleJson from '../public/data/meetings/upcoming.json'

type TimelineMeeting = {
  slug: string
  date: string
  startDateTime: string
  type: string
  agendaPublished: boolean
  docket: { seq: number; number: string; title: string }[]
  hearings: string[]
}

type TimelineData = {
  recent?: TimelineMeeting[]
  meetings: TimelineMeeting[]
}

type Forecast = {
  date: string
  phase: string
  confidence: 'Medium' | 'High' | 'Very high'
  why: string
  statute: string
  lawUrl: string
}

const schedule = scheduleJson as TimelineData
const meetings = [...(schedule.recent ?? []), ...schedule.meetings]
const byDate = new Map(meetings.map((m) => [m.date, m]))

const forecasts: Forecast[] = [
  {
    date: '2026-10-06',
    phase: 'Board review / preliminary-budget work',
    confidence: 'High',
    why: 'The tentative budget must be presented to the Board at a regular or special meeting by October 5. Riverhead’s next published regular meeting is October 6, so the initial presentation must occur earlier; October 6 is the first regular meeting positioned for formal review, revisions, or conversion to the preliminary budget.',
    statute: 'Town Law §106(3)–(4)',
    lawUrl: 'https://www.nysenate.gov/legislation/laws/TWN/106',
  },
  {
    date: '2026-10-20',
    phase: 'Preliminary-budget revisions / hearing setup',
    confidence: 'Medium',
    why: 'This is the last published regular meeting before the November 5 hearing deadline. It is a natural window for final preliminary-budget revisions, hearing procedure, and—only if needed—tax-cap override steps. None of those are treated as actual agenda items until the Town publishes them.',
    statute: 'Town Law §§106, 108',
    lawUrl: 'https://www.nysenate.gov/legislation/laws/TWN/108',
  },
  {
    date: '2026-11-05',
    phase: 'Preliminary-budget public hearing',
    confidence: 'Very high',
    why: 'Town Law requires the preliminary-budget hearing on or before the Thursday immediately following the general election. In 2026 that deadline is Thursday, November 5—and Riverhead has a regular Town Board meeting scheduled that exact day.',
    statute: 'Town Law §108',
    lawUrl: 'https://www.nysenate.gov/legislation/laws/TWN/108',
  },
  {
    date: '2026-11-17',
    phase: 'Final 2027 budget adoption',
    confidence: 'Very high',
    why: 'The annual budget must be adopted by November 20. November 17 is Riverhead’s final published regular Town Board meeting before that deadline, making it the strongest scheduled candidate for the adoption resolution unless the Board adopts earlier or calls a special meeting.',
    statute: 'Town Law §109(2)',
    lawUrl: 'https://www.nysenate.gov/legislation/laws/TWN/109',
  },
]

function publishedBudgetItem(m?: TimelineMeeting) {
  if (!m) return false
  const text = [...m.hearings, ...m.docket.map((d) => `${d.number} ${d.title}`)].join(' ')
  return /\bbudget\b/i.test(text)
}

function formatDate(date: string) {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString('en-US', {
    weekday: 'long', month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC',
  })
}

export default function BudgetProcessMeetingForecast() {
  return (
    <section aria-label="2027 budget process meeting forecast" style={{ margin: '22px 0 28px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'end', marginBottom: 10 }}>
        <div>
          <div style={{ color: 'var(--rbl-badge)', fontSize: 11, fontWeight: 950, letterSpacing: .8, textTransform: 'uppercase' }}>2027 budget process · forecast</div>
          <h2 style={{ margin: '3px 0 4px', color: 'var(--rbl-title)', fontSize: 23 }}>Which Town Board meetings are likely to carry the budget?</h2>
          <p style={{ margin: 0, color: 'var(--rbl-text-muted)', maxWidth: 850, fontSize: 13.5, lineHeight: 1.5 }}>
            These are predictions derived from New York Town Law deadlines and Riverhead&apos;s published meeting dates. They are intentionally separate from the official agenda-item list above. A prediction becomes an actual item only when the Town publishes it.
          </p>
        </div>
      </div>

      <div style={{ background: 'var(--rbl-warn-bg)', border: '1px solid var(--rbl-warn-border)', borderRadius: 13, padding: 13, marginBottom: 10 }}>
        <strong style={{ color: 'var(--rbl-warn-strong)' }}>Watch for an additional meeting on or before October 5.</strong>
        <div style={{ color: 'var(--rbl-text-body)', fontSize: 13, lineHeight: 1.5, marginTop: 4 }}>
          Department estimates are due September 20; the tentative budget is due to the Town Clerk by September 30; and the Clerk must present it to the Board at a regular or special meeting by October 5. Because Riverhead&apos;s next published regular meeting is October 6, the Town must either present the budget early or use another qualifying meeting before the deadline.
          {' '}<a href="https://www.nysenate.gov/legislation/laws/TWN/104" target="_blank" rel="noreferrer" style={link}>§104 ↗</a>{' '}
          <a href="https://www.nysenate.gov/legislation/laws/TWN/106" target="_blank" rel="noreferrer" style={link}>§106 ↗</a>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(260px,100%),1fr))', gap: 10 }}>
        {forecasts.map((f) => {
          const meeting = byDate.get(f.date)
          const actual = publishedBudgetItem(meeting)
          return (
            <article key={f.date} data-budget-forecast-date={f.date} style={{ background: 'var(--rbl-surface)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 14, padding: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ color: 'var(--rbl-title)', fontWeight: 900, fontSize: 13 }}>{formatDate(f.date)}</span>
                <span style={{ background: actual ? 'var(--rbl-success-bg)' : 'var(--rbl-surface-2)', color: actual ? 'var(--rbl-success-strong)' : 'var(--rbl-text-muted)', borderRadius: 999, padding: '2px 8px', fontSize: 10.5, fontWeight: 900 }}>
                  {actual ? 'PUBLISHED BUDGET ITEM' : `${f.confidence.toUpperCase()} FORECAST`}
                </span>
              </div>
              <h3 style={{ color: 'var(--rbl-title)', fontSize: 16, margin: '7px 0 5px' }}>{f.phase}</h3>
              <p style={{ color: 'var(--rbl-text-body)', fontSize: 12.8, lineHeight: 1.5, margin: 0 }}>{f.why}</p>
              <div style={{ marginTop: 8, fontSize: 11.5 }}>
                <a href={f.lawUrl} target="_blank" rel="noreferrer" style={link}>{f.statute} ↗</a>
              </div>
            </article>
          )
        })}
      </div>

      <p style={{ color: 'var(--rbl-text-muted)', fontSize: 11.5, lineHeight: 1.45, margin: '9px 0 0' }}>
        Forecast rule: statutory deadlines determine the required window; Riverhead&apos;s published regular-meeting schedule determines the most likely meeting. If the Town publishes an earlier hearing, adoption, special meeting, or budget resolution, the official item replaces the forecast.
      </p>
    </section>
  )
}

const link = { color: 'var(--rbl-link)', fontWeight: 800, textDecoration: 'none' } as const
