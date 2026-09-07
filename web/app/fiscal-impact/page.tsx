import fs from 'fs'
import path from 'path'
import PageShell from '../../components/PageShell'
import PlainCallout from '../../components/PlainCallout'
import FiscalImpactMeetings, { type FiscalMeeting } from '../../components/FiscalImpactMeetings'

const base = process.env.NEXT_PUBLIC_BASE_PATH || ''
const card = { background: 'var(--rbl-surface)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 16, padding: 20, boxShadow: '0 14px 34px var(--rbl-shadow)' } as const

export const metadata = {
  title: 'Fiscal Impact, corrected — Town Board resolutions',
  description:
    "Compare Riverhead's fiscal-impact statements with a realistic financial read, while keeping fiscal treatment separate from final adoption and member vote evidence.",
}

// Read every generated/curated <date>-fiscal.json at build time, newest first.
function loadMeetings(): FiscalMeeting[] {
  const dir = path.join(process.cwd(), 'public', 'data', 'meetings')
  let dates: string[] = []
  try {
    dates = JSON.parse(fs.readFileSync(path.join(dir, 'fiscal-index.json'), 'utf8')).meetings as string[]
  } catch {
    dates = []
  }
  const meetings: FiscalMeeting[] = []
  for (const d of dates) {
    try {
      meetings.push(JSON.parse(fs.readFileSync(path.join(dir, `${d}-fiscal.json`), 'utf8')))
    } catch {
      // skip a missing file rather than fail the build
    }
  }
  return meetings.sort((a, b) => (a.meetingDate < b.meetingDate ? 1 : -1))
}

export default function FiscalImpactPage() {
  const meetings = loadMeetings()
  const meetingCount = meetings.length
  const totalMarkedNo = meetings.reduce((n, m) => n + m.summary.markedNo, 0)
  const totalUnderstatedNo = meetings.reduce((n, m) => n + m.summary.understatedMarkedNo, 0)
  const totalReserveDraw = meetings.reduce(
    (n, m) => n + m.resolutions.filter((r) => r.realistic.flag === 'reserve-draw').length,
    0
  )

  return (
    <PageShell
      title="Fiscal impact, corrected"
      subtitle="Read the Town’s fiscal-impact statement next to a realistic financial interpretation — while separately checking whether the resolution was adopted, how members voted, and whether an official adopted-resolution document is available."
    >
      <PlainCallout
        tips={[
          { label: 'What the form is', text: 'a one-page checklist the Town attaches to each resolution: does it have a fiscal impact (yes/no), can it be “absorbed” by the current budget, and what’s the funding source.' },
          { label: 'What it does not prove', text: 'a fiscal-impact form is not proof that the resolution was finally adopted or that every member voted a particular way. The meeting record and any separately published adopted-resolution document answer those questions.' },
          { label: 'Why correct it', text: 'the checkbox answer is frequently “no” or “absorbed” even when the resolution commits real dollars — a new salary, a union settlement, a capital purchase, a fee change.' },
          { label: 'How we read it', text: 'the Town’s own Yes/No answer sits next to a plain-English realistic read keyed on the resolution’s category. Dollar figures are shown only where they can be tied to a source without guessing.' },
        ]}
      >
        Across <strong>{meetingCount}</strong> Town Board meetings in 2026, the Town marked{' '}
        <strong>{totalMarkedNo.toLocaleString()}</strong> resolutions as having <strong>no fiscal impact</strong> —
        and on a realistic read, at least <strong>{totalUnderstatedNo.toLocaleString()}</strong> of those plainly
        commit or change money. A second group is easy to miss: <strong>{totalReserveDraw.toLocaleString()}</strong>{' '}
        resolutions the Town did mark as having an impact, but called <strong>absorbed by the existing budget</strong>,
        actually draw on reserves, fund balance or borrowing.
      </PlainCallout>

      {meetingCount === 0 ? (
        <section style={{ ...card }}>
          <p style={{ color: 'var(--rbl-text-muted)', margin: 0 }}>No fiscal-impact data has been generated yet. Run the agenda-packet parser to populate this page.</p>
        </section>
      ) : (
        <FiscalImpactMeetings meetings={meetings} />
      )}

      <section style={{ ...card, margin: '18px 0', background: 'var(--rbl-info-bg)', border: '1px solid var(--rbl-info-border)' }}>
        <h3 style={{ marginTop: 0, color: 'var(--rbl-title)' }}>Why this matters for the budget</h3>
        <p style={{ color: 'var(--rbl-info-text)', fontSize: 15, lineHeight: 1.6, margin: 0 }}>
          The items that follow the Town into future budgets are the <strong>recurring</strong> ones the form tends to
          wave through: new full-time and part-time hires, seasonal payroll, and union stipulations (CSEA, PBA, SOA),
          whose wage terms compound with each future budget. Those recurring commitments — not the one-time purchases —
          are what a resident should track against next year’s tax levy. See how they interact with the{' '}
          <a href={`${base}/buyout/`} style={{ color: 'var(--rbl-accent)', fontWeight: 800 }}>2026 retirement buyout</a> and the{' '}
          <a href={`${base}/meetings/`} style={{ color: 'var(--rbl-accent)', fontWeight: 800 }}>full meeting decision record</a>.
        </p>
      </section>
    </PageShell>
  )
}