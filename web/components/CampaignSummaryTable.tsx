import type { CampaignOfficial } from '../lib/campaign-finance'

// Every committee on /campaign-finance/ side by side, from the stored figures
// (lib/campaign-officials.ts), so a reader can compare them before opening a card.

const usd = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
const money = (n: number | null | undefined) => (n == null ? '—' : n > 0 ? usd(n) : '$0')
const longDate = (iso: string | null) =>
  iso ? new Date(`${iso.slice(0, 10)}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'

const cell = { padding: '8px 10px', verticalAlign: 'top' } as const
const num = { ...cell, textAlign: 'right', whiteSpace: 'nowrap' } as const
const head = { ...cell, fontWeight: 600, fontSize: 13, color: 'var(--rbl-text-muted)' } as const

export default function CampaignSummaryTable({
  officials, startYear, endYear, source,
}: {
  officials: CampaignOfficial[]
  startYear: number
  endYear: number
  source: { label: string; url: string; fetchedOn: string }
}) {
  const groups = [
    { label: 'Current Town Board', rows: officials.filter((o) => o.currentlyServing && !o.isPartyCommittee) },
    { label: 'Town party committees', rows: officials.filter((o) => o.isPartyCommittee) },
    { label: 'Former officials', rows: officials.filter((o) => !o.currentlyServing && !o.isPartyCommittee) },
  ].filter((g) => g.rows.length > 0)
  const columns = [
    `Raised, ${startYear}–${endYear}`, `Raised in ${endYear}`, 'Refunded', 'Loans received', 'Owed at latest report', 'Last contribution',
  ]

  return (
    <section id="at-a-glance" aria-labelledby="at-a-glance-heading" style={{ marginBottom: 24, scrollMarginTop: 20 }}>
      <h2 id="at-a-glance-heading" style={{ margin: '0 0 6px', color: 'var(--rbl-title)', fontSize: 22 }}>Every committee at a glance</h2>
      <p style={{ margin: '0 0 10px', color: 'var(--rbl-text-body)', fontSize: 15, lineHeight: 1.6, maxWidth: '75ch' }}>
        Itemized money each committee reported to the State. &ldquo;Raised&rdquo; is contributions plus transfers from other
        committees; money moved between one official&apos;s own committees is counted once, and in-kind gifts are left out.
        Each card below has the detail, and Refresh there pulls the latest filings.
      </p>
      <table className="rbl-stack" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14.5 }}>
        <caption style={{ textAlign: 'left', color: 'var(--rbl-text-muted)', fontSize: 13, padding: '0 0 6px' }}>
          From the <a href={source.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--rbl-link)' }}>{source.label}</a>, as of {longDate(source.fetchedOn)}.
        </caption>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--rbl-border)', textAlign: 'left' }}>
            <th scope="col" style={head}>Committee</th>
            {columns.map((c) => <th key={c} scope="col" style={{ ...head, textAlign: 'right' }}>{c}</th>)}
          </tr>
        </thead>
        {groups.map((g) => (
          <tbody key={g.label}>
            <tr>
              <th scope="colgroup" colSpan={columns.length + 1} style={{ ...cell, textAlign: 'left', color: 'var(--rbl-title)', fontSize: 14, fontWeight: 700, paddingTop: 14 }}>{g.label}</th>
            </tr>
            {g.rows.map((o) => (
              <tr key={o.name} style={{ borderBottom: '1px solid var(--rbl-border-subtle)' }}>
                <th scope="row" style={{ ...cell, textAlign: 'left', fontWeight: 600, color: 'var(--rbl-text-strong)' }}>
                  <span>
                    {o.name.replace(/^Honorable /, '')}
                    <span style={{ display: 'block', color: 'var(--rbl-text-muted)', fontSize: 12.5, fontWeight: 400 }}>{o.filerIDs.map((f) => f.committeeName).filter((n, i, a) => a.indexOf(n) === i).join(' · ')}</span>
                  </span>
                </th>
                <td data-label={columns[0]} style={{ ...num, fontWeight: 700, color: 'var(--rbl-title)' }}>{money(o.seedRaised)}</td>
                <td data-label={columns[1]} style={num}>{money(o.seedCycleRaised)}</td>
                <td data-label={columns[2]} style={num}>{money(o.seedRefunds)}</td>
                <td data-label={columns[3]} style={num}>{money(o.seedLoansReceived)}</td>
                <td data-label={columns[4]} style={num}>
                  <span>
                    {money(o.seedOwed)}
                    {o.seedOwedReport && <span style={{ display: 'block', color: 'var(--rbl-text-muted)', fontSize: 12 }}>{o.seedOwedReport}</span>}
                  </span>
                </td>
                <td data-label={columns[5]} style={num}>{longDate(o.seedLastReported)}</td>
              </tr>
            ))}
          </tbody>
        ))}
      </table>
    </section>
  )
}
