import fs from 'fs'
import path from 'path'
import PageShell from '../../components/PageShell'
import PlainCallout from '../../components/PlainCallout'
import FiscalImpactMeetings, { type FiscalMeeting } from '../../components/FiscalImpactMeetings'
import { statementContradictions, type StatementMeeting, type Contradiction } from '../../lib/statement-contradictions'

const base = process.env.NEXT_PUBLIC_BASE_PATH || ''
const card = { background: 'var(--rbl-surface)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 16, padding: 20 } as const

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
  const year = Number((meetings[0]?.meetingDate ?? '2026').slice(0, 4))
  const contra = statementContradictions(meetings as unknown as StatementMeeting[], year)
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
          { label: 'How we read it', text: 'the Town’s own Yes/No answer sits next to a plain-English realistic read keyed on the resolution’s category. Where the Town’s account codes or the resolution’s own words say more, they decide instead: closing a finished project commits no new money. Dollar figures are shown only where they can be tied to a source without guessing.' },
          { label: 'What the resolution states', text: 'under each title, every dollar figure in the resolution’s own text, quoted as printed and labelled: a cost, a fee paid to the Town, money coming in, the size of a grant program applied to, a budget-table line, borrowing, a developer’s security, or background. Insurance an applicant must carry is left out. Only a figure that reads as the Town paying out counts as a stated cost. Where the statement names less than the resolution’s own budget table moves, both figures are shown.' },
        ]}
      >
        Across <strong>{meetingCount}</strong> Town Board meetings in 2026, the Town marked{' '}
        <strong>{totalMarkedNo.toLocaleString()}</strong> resolutions as having <strong>no fiscal impact</strong> —
        and on a realistic read, at least <strong>{totalUnderstatedNo.toLocaleString()}</strong> of those plainly
        commit or change money. A second group is easy to miss: <strong>{totalReserveDraw.toLocaleString()}</strong>{' '}
        resolutions the Town did mark as having an impact, but called <strong>absorbed by the existing budget</strong>,
        actually draw on reserves, fund balance or borrowing.
      </PlainCallout>

      {contra.adopted > 0 && <ContradictionsSection c={contra} year={year} />}

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
const longDate = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
const shortDate = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

function ContradictionList({ items, label }: { items: Contradiction[]; label: string }) {
  return (
    <details style={{ marginTop: 6 }}>
      <summary style={{ cursor: 'pointer', fontWeight: 700, color: 'var(--rbl-link)', minHeight: 24 }}>{label}</summary>
      <ul style={{ margin: '8px 0 0', paddingLeft: 20, display: 'grid', gap: 6, fontSize: 14.5, lineHeight: 1.5, color: 'var(--rbl-text-body)' }}>
        {items.map((c) => (
          <li key={c.number}>
            <a href={`${base}/meetings/?meeting=${c.date}`} style={{ color: 'var(--rbl-link)', fontWeight: 700 }}>{c.number}</a>{' '}
            <span style={{ color: 'var(--rbl-text-muted)' }}>({shortDate(c.date)})</span> {c.title}
            <div style={{ color: 'var(--rbl-text-muted)', fontSize: 13.5 }}>{c.detail}</div>
          </li>
        ))}
      </ul>
    </details>
  )
}

function ContradictionsSection({ c, year }: { c: ReturnType<typeof statementContradictions>; year: number }) {
  const th = { textAlign: 'left', padding: '8px', borderBottom: '1px solid var(--rbl-border)', color: 'var(--rbl-text-strong)', fontWeight: 700 } as const
  const td = { padding: '8px', borderBottom: '1px solid var(--rbl-border-subtle)', color: 'var(--rbl-text-body)', verticalAlign: 'top' } as const
  const n = (k: 'charge' | 'revenue' | 'fund-balance') => c.noImpactFunded.filter((x) => x.noImpactKind === k).length
  return (
    <section id="contradictions" aria-labelledby="contradictions-heading" data-statement-contradictions style={{ ...card, margin: '18px 0' }}>
      <h2 id="contradictions-heading" style={{ margin: '0 0 8px', color: 'var(--rbl-title)', fontSize: 22 }}>Statements that contradict themselves</h2>
      <p style={{ margin: '0 0 10px', color: 'var(--rbl-text-body)', fontSize: 16, lineHeight: 1.6, maxWidth: '78ch' }}>
        The reads below are judgements. These are not. Of the <strong>{c.adopted.toLocaleString('en-US')}</strong> resolutions the Board adopted at{' '}
        {c.meetings} meetings from {c.first ? longDate(c.first) : ''} to {c.last ? longDate(c.last) : ''}, <strong>{c.all.length}</strong> carry a fiscal
        impact statement whose own answers disagree with its own section G, or whose section G disagrees with the budget table the Board adopted.
      </p>
      <div data-scroll-region style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 15 }}>
          <thead><tr><th scope="col" style={th}>What the statement says, and what contradicts it</th><th scope="col" style={{ ...th, textAlign: 'right' }}>Statements</th></tr></thead>
          <tbody>
            <tr>
              <td style={td}>
                <strong>Section G and the adopted budget table disagree.</strong> The statement names a smaller amount than the table the Board voted on.
                <ContradictionList items={c.tableMismatch} label={`Show the ${c.tableMismatch.length === 1 ? 'resolution' : `${c.tableMismatch.length} resolutions`}`} />
              </td>
              <td style={{ ...td, textAlign: 'right', fontWeight: 800, fontSize: 18 }}>{c.tableMismatch.length}</td>
            </tr>
            <tr>
              <td style={td}>
                <strong>Marked “absorbed by the approved budget”, yet drawing on fund balance.</strong> E(a) is initialed, saying the cost fits within
                “existing resources set forth in approved Town Annual Budget”, while section G appropriates fund balance, money that is not in the approved budget.
                <ContradictionList items={c.absorbedFundBalance} label={`Show the ${c.absorbedFundBalance.length} resolutions`} />
              </td>
              <td style={{ ...td, textAlign: 'right', fontWeight: 800, fontSize: 18 }}>{c.absorbedFundBalance.length}</td>
            </tr>
            <tr>
              <td style={td}>
                <strong>Marked “no fiscal impact”, yet naming money in section G.</strong> {n('charge')} name an account to be charged (mostly the salary
                line for a new hire), {n('revenue')} a revenue account the money will come into, and {n('fund-balance')} a draw on fund balance.
                <ContradictionList items={c.noImpactFunded} label={`Show the ${c.noImpactFunded.length} resolutions`} />
              </td>
              <td style={{ ...td, textAlign: 'right', fontWeight: 800, fontSize: 18 }}>{c.noImpactFunded.length}</td>
            </tr>
            <tr>
              <th scope="row" style={{ ...td, fontWeight: 800, textAlign: 'left' }}>Statements with at least one contradiction, each counted once</th>
              <td style={{ ...td, textAlign: 'right', fontWeight: 800, fontSize: 18 }}>{c.all.length}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p style={{ margin: '10px 0 0', color: 'var(--rbl-text-muted)', fontSize: 14, lineHeight: 1.5 }}>
        Counted from the statements as parsed from the {year} agenda packets; a statement the parser misread may be missed, so this is a floor, not a
        full audit. These are likely errors on the form, not findings that any money was misspent. The{' '}
        <a href={`${base}/fiscal-impact-helper/`} style={{ color: 'var(--rbl-link)', fontWeight: 700 }}>fiscal impact statement helper</a> prevents all three:
        it writes section G and the budget table from the same entries, and does not let a statement be marked absorbed or “no impact” while it names
        fund balance or an account.
      </p>
    </section>
  )
}
