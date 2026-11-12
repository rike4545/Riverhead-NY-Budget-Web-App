import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import PageShell from '../../components/PageShell'
import PlainCallout from '../../components/PlainCallout'
import { CDA_FUND_BALANCE_2024, NEWS, POSITIONS, RAIL_SPUR, TIMELINE, Z14 } from '../../lib/epcal'
import current from '../../public/data/budget-supplement/current-lines.json'
import prior from '../../public/data/budget-supplement/lines.json'
import fiscalIndex from '../../public/data/meetings/fiscal-index.json'

const base = process.env.NEXT_PUBLIC_BASE_PATH || ''
const card = { background: 'var(--rbl-surface)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 16, padding: 20, marginBottom: 16 } as const
const h2 = { margin: '0 0 8px', color: 'var(--rbl-title)', fontSize: 21 } as const
const prose = { margin: '0 0 10px', color: 'var(--rbl-text-body)', fontSize: 16, lineHeight: 1.6, maxWidth: '75ch' } as const
const help = { color: 'var(--rbl-text-muted)', fontSize: 14, lineHeight: 1.5 } as const
const link = { color: 'var(--rbl-link)', fontWeight: 600 } as const
const th = { textAlign: 'left', padding: '8px', borderBottom: '1px solid var(--rbl-border)', color: 'var(--rbl-text-strong)', fontWeight: 700, verticalAlign: 'bottom' } as const
const thr = { ...th, textAlign: 'right' } as const
const td = { padding: '8px', borderBottom: '1px solid var(--rbl-border-subtle)', color: 'var(--rbl-text-body)', verticalAlign: 'top' } as const
const tdr = { ...td, textAlign: 'right', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' } as const
const usd = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
const millions = (n: number) => `$${(n / 1e6).toFixed(1)} million`

type Line = { account: string; actual?: number; adopted?: number; preliminary?: number; priorActual?: number; actual2023?: number }
const cur = (a: string) => (current.lines as Line[]).find((l) => l.account === a)
const old = (a: string) => (prior.lines as Line[]).find((l) => l.account === a)

/** One row per CDA line: 2023-2025 actual, 2026 adopted, 2027 preliminary. */
const row = (a: string) => ({ y2023: old(a)?.actual2023 ?? 0, y2024: cur(a)?.priorActual ?? 0, y2025: cur(a)?.actual ?? 0, y2026: cur(a)?.adopted ?? 0, y2027: cur(a)?.preliminary ?? 0 })
const rent = row(Z14.rent)
const legal = [Z14.legal, Z14.catLegal, Z14.consultants].map(row).reduce((s, r) => ({ y2023: s.y2023 + r.y2023, y2024: s.y2024 + r.y2024, y2025: s.y2025 + r.y2025, y2026: s.y2026 + r.y2026, y2027: s.y2027 + r.y2027 }))
const years = ['y2023', 'y2024', 'y2025', 'y2026', 'y2027'] as const
const yearLabel = { y2023: '2023', y2024: '2024', y2025: '2025', y2026: '2026 budget', y2027: '2027 proposed' }

// This year's Town Board actions on EPCAL, from the meeting data.
type Res = { number: string; title: string; vote?: { adopted?: boolean } }
const actions = (fiscalIndex.meetings as string[]).flatMap((m) => {
  const d = JSON.parse(readFileSync(join(process.cwd(), 'public/data/meetings', `${m}-fiscal.json`), 'utf8')) as { resolutions: Res[] }
  return d.resolutions.filter((r) => /EPCAL|Enterprise Park at Calverton|CDA \(EPCAL\)|Community Development Agency \(CDA\)|Runway/i.test(r.title)).map((r) => ({ ...r, meeting: m }))
})
const longDate = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', timeZone: 'UTC' })
const News = ({ k }: { k: keyof typeof NEWS }) => <a href={NEWS[k].url} style={link}>{NEWS[k].title.split(':')[0]}</a>

export const metadata = {
  title: 'EPCAL',
  description: 'The Town’s land at the Enterprise Park at Calverton: where the failed sale and the lawsuit stand, what the land earns and costs now, the plans on the table, and what the record suggests weighing before the next deal.',
}

export default function EpcalPage() {
  return (
    <PageShell
      title="EPCAL: the Town’s land at Calverton"
      subtitle="Where the failed sale and the lawsuit stand, what the land earns and costs today, and what the record suggests weighing before the next deal."
    >
      <PlainCallout
        tips={[
          { label: 'EPCAL', text: 'the Enterprise Park at Calverton, the former Navy and Grumman aircraft plant, with its two runways.' },
          { label: 'CDA', text: 'the Town’s Community Development Agency, which owns and manages the land. The Town Board sits as its board.' },
          { label: 'Notice of pendency', text: 'a claim recorded against land during a lawsuit, which keeps it from being sold or leased cleanly.' },
        ]}
      >
        The Town has about 1,643 acres at Calverton that it has tried for years to sell for business use. The last attempt, a $40 million sale to
        Calverton Aviation & Technology, fell apart in 2023 and ended in a lawsuit. This page sets out where that stands, what the land brings in
        while it waits, and the choices ahead. The money figures are the Town’s own; the lawsuit and the candidates’ plans are from news reports,
        labelled as such.
      </PlainCallout>

      <section style={card} aria-labelledby="timeline">
        <h2 id="timeline" style={h2}>How the last sale ended</h2>
        <ol style={{ ...prose, paddingLeft: 20, display: 'grid', gap: 8 }}>
          {TIMELINE.map((e) => (
            <li key={e.when}><strong>{e.when}.</strong> {e.what} <span style={help}>(<News k={e.source} />)</span></li>
          ))}
        </ol>
        <p style={{ ...help, margin: 0 }}>
          These events come from news reports of the court’s rulings and the Town’s statements, not the court papers themselves. No report found
          says whether CAT won a stay from the appeals court.
        </p>
      </section>

      <section style={card} aria-labelledby="money">
        <h2 id="money" style={h2}>What the land earns and costs now</h2>
        <p style={prose}>
          The land pays no property tax while the Town owns it. Its income is rent for short uses: runway licenses for a racing school and safe-driving
          programs, and parking for the 2026 U.S. Open. The Community Development Agency’s fund shows:
        </p>
        <div data-scroll-region style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 15, minWidth: 560 }}>
            <thead><tr><th scope="col" style={th}>CDA fund</th>{years.map((y) => <th key={y} scope="col" style={thr}>{yearLabel[y]}</th>)}</tr></thead>
            <tbody>
              <tr><th scope="row" style={{ ...td, fontWeight: 600, textAlign: 'left' }}>Rent from the land</th>{years.map((y) => <td key={y} style={tdr}>{usd(rent[y])}</td>)}</tr>
              <tr><th scope="row" style={{ ...td, fontWeight: 600, textAlign: 'left' }}>Lawyers and consultants</th>{years.map((y) => <td key={y} style={tdr}>{usd(legal[y])}</td>)}</tr>
            </tbody>
          </table>
        </div>
        <p style={{ ...help, margin: '10px 0 0' }}>
          From the 2027 and 2026 Budget Supplements (fund Z14). Lawyers and consultants add three lines: legal, “CAT legal” and consultants; 2024’s
          {' '}{usd(legal.y2024)} was the year the lawsuit was being fought. The fund held about {usd(CDA_FUND_BALANCE_2024)} at the end of 2024. Rent of
          {' '}{usd(rent.y2025)} in 2025 is small next to the {millions(40000000)} the land was to sell for.
        </p>
      </section>

      <section style={card} aria-labelledby="plans">
        <h2 id="plans" style={h2}>The plans on the table</h2>
        <ul style={{ ...prose, paddingLeft: 20, display: 'grid', gap: 8 }}>
          {POSITIONS.map((p) => (
            <li key={p.who}><strong>{p.who}:</strong> {p.said} <span style={help}>({p.source.map((k, i) => <span key={k}>{i ? '; ' : ''}<News k={k} /></span>)})</span></li>
          ))}
        </ul>
        <p style={prose}>
          One piece of history weighs on the rail idea. The Town took {millions(RAIL_SPUR.federal)} in federal recovery money and paid a contractor more than
          {' '}{millions(RAIL_SPUR.contractor)} to rehabilitate the rail spur, which can serve only {RAIL_SPUR.serves} (<News k="rail" />).
        </p>
      </section>

      <section style={card} aria-labelledby="best">
        <h2 id="best" style={h2}>What the record suggests weighing</h2>
        <p style={prose}>
          What is best for EPCAL is a choice for the Town Board and residents, and reasonable people weigh jobs, taxes, open space and recreation
          differently. This is this site’s reading of the record, not a finding or the Town’s plan. The record points to a few things worth
          settling before the next deal:
        </p>
        <ol style={{ ...prose, paddingLeft: 20, display: 'grid', gap: 8 }}>
          <li><strong>Know the legal position first.</strong> Until the appeal or a stay is decided, a buyer may not be able to take clean title. Marketing can start, but a transfer is likely safer after that.</li>
          <li><strong>Check buyers’ money before signing, not after.</strong> The CAT sale ran five years before the IDA’s financial review ended it. A public request for proposals that asks for proof of financing up front would surface that sooner.</li>
          <li><strong>Consider selling or leasing in parts.</strong> The eight-lot subdivision the County approved in 2020 already divides the land. Smaller deals would not hang the whole site on one buyer.</li>
          <li><strong>Make the user pay for the infrastructure it needs.</strong> Both candidates said so for rail, and the spur shows what happens when the Town builds first.</li>
          <li><strong>Count the tax base, not only the price.</strong> Land in private hands pays property tax every year, which a one-time sale price does not show; any <a href={`${base}/ida/`} style={link}>IDA tax break</a> asked for would reduce that.</li>
          <li><strong>Keep the interim uses.</strong> The runway licenses earn money and cost little while the long-term plan is settled.</li>
        </ol>
      </section>

      <section style={card} aria-labelledby="board">
        <h2 id="board" style={h2}>The Town Board’s EPCAL actions this year</h2>
        <ul style={{ ...prose, paddingLeft: 20, display: 'grid', gap: 6 }}>
          {actions.map((a) => (
            <li key={a.number}>{longDate(a.meeting)}: Resolution {a.number}, {a.title}{a.vote?.adopted ? ' (adopted)' : ''}.</li>
          ))}
        </ul>
        <p style={{ ...help, margin: 0 }}>From the agendas and minutes on CivicClerk; see each meeting on the <a href={`${base}/meetings/`} style={link}>meetings page</a>.</p>
      </section>

      <p style={{ ...help, margin: '0 0 16px' }}>
        Sources: the Town’s 2027 and 2026 Budget Supplements (fund Z14) and 2026 Adopted Budget; Town Board resolutions; and news reports,{' '}
        {Object.values(NEWS).map((n, i) => <span key={n.url}>{i ? '; ' : ''}<a href={n.url} style={link}>{n.title}</a></span>)}.
      </p>
    </PageShell>
  )
}
