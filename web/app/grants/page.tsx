import PageShell from '../../components/PageShell'
import PlainCallout from '../../components/PlainCallout'
import BarRows from '../../components/charts/BarRows'
import ColumnChart from '../../components/charts/ColumnChart'
import {
  awardedTotal, awards, awardsSince, firstYear, grantSources, grantYears, kindLabel, lastYear, matchSummary, purposeTotals, singleAudits, totalReceived,
} from '../../lib/grants'

const base = process.env.NEXT_PUBLIC_BASE_PATH || ''
const card = { background: 'var(--rbl-surface)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 16, padding: 20, marginBottom: 16 } as const
const prose = { margin: '0 0 12px', color: 'var(--rbl-text-body)', fontSize: 16.5, lineHeight: 1.6, maxWidth: '75ch' } as const
const h2 = { margin: '0 0 8px', color: 'var(--rbl-title)', fontSize: 22 } as const
const link = { color: 'var(--rbl-link)', fontWeight: 600 } as const
const th = { padding: '8px 10px', fontSize: 13, color: 'var(--rbl-text-muted)', fontWeight: 600, textAlign: 'left' } as const
const td = { padding: '7px 10px', verticalAlign: 'top' } as const
const usd = (v: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v)
const big = (v: number) => (v >= 1e6 ? `$${(v / 1e6).toFixed(2)} million` : usd(v))
const longDate = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

export const metadata = {
  title: 'Grants — what Riverhead received, from whom, and the Town’s share',
  description: 'Grants and State and federal aid the Town of Riverhead received since 2018, each grant the Town Board accepted since 2025 with its award and match, and the federal awards in the Town’s single audit.',
}

export default function GrantsPage() {
  const audit = singleAudits[0]
  const stateTotal = grantYears.reduce((s, y) => s + y.state, 0)
  const federalTotal = grantYears.reduce((s, y) => s + y.federal, 0)
  const generalTotal = grantYears.reduce((s, y) => s + y.generalAid, 0)
  return (
    <PageShell
      title="Grants"
      subtitle={`What the Town received in grants and State and federal aid from ${firstYear.year} to ${lastYear.year}, and, for each grant the Town Board accepted since 2025, the award and the Town's share of the cost.`}
    >
      <PlainCallout
        tips={[
          { label: 'Award', text: 'what the grant promises. Most grants pay the Town back after it spends the money, so an award can be received over several years.' },
          { label: 'Received', text: 'the grant money the Town recorded as revenue in a year, as it reported to the State Comptroller.' },
          { label: 'Cost share (match)', text: 'the part of a project the Town or a partner must pay itself. Some grants require none; the page says so only where the resolution states it.' },
        ]}
      >
        From {firstYear.year} to {lastYear.year} the Town received <strong>{big(totalReceived)}</strong> in grants and State and federal
        aid tied to a purpose: {big(stateTotal)} from the State and {big(federalTotal)} from the federal government. It rose from{' '}
        {big(firstYear.total)} in {firstYear.year} to {big(lastYear.total)} in {lastYear.year}. That leaves out {big(generalTotal)} of mortgage
        tax and State revenue sharing, general aid every town receives.
      </PlainCallout>

      <section id="by-year" aria-labelledby="by-year-heading" style={card}>
        <h2 id="by-year-heading" style={h2}>Grant money received, by year</h2>
        <ColumnChart
          title="Grants and State and federal aid received"
          lede="Each year's State and federal aid tied to a purpose, as the Town reported it to the State Comptroller."
          columns={grantYears.map((y) => ({ label: String(y.year), value: y.total, display: big(y.total) }))}
          format={big}
          source={`${grantSources.osc.title}. Mortgage tax and State revenue sharing are left out.`}
          height={230}
        />
        <div style={{ overflowX: 'auto', marginTop: 14 }}>
          <table className="rbl-stack" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 15 }}>
            <thead><tr style={{ borderBottom: '1px solid var(--rbl-border)' }}>
              <th scope="col" style={th}>Year</th>
              <th scope="col" style={{ ...th, textAlign: 'right' }}>From the State</th>
              <th scope="col" style={{ ...th, textAlign: 'right' }}>From the federal government</th>
              <th scope="col" style={{ ...th, textAlign: 'right' }}>Total</th>
              <th scope="col" style={{ ...th, textAlign: 'right' }}>General aid, not counted</th>
            </tr></thead>
            <tbody>
              {grantYears.map((y) => (
                <tr key={y.year} style={{ borderBottom: '1px solid var(--rbl-border-subtle)' }}>
                  <th scope="row" style={{ ...td, textAlign: 'left', fontWeight: 600 }}>{y.year}</th>
                  <td data-label="From the State" style={{ ...td, textAlign: 'right' }}>{usd(y.state)}</td>
                  <td data-label="From the federal government" style={{ ...td, textAlign: 'right' }}>{usd(y.federal)}</td>
                  <td data-label="Total" style={{ ...td, textAlign: 'right', fontWeight: 700 }}>{usd(y.total)}</td>
                  <td data-label="General aid, not counted" style={{ ...td, textAlign: 'right', color: 'var(--rbl-text-muted)' }}>{usd(y.generalAid)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section id="by-purpose" aria-labelledby="by-purpose-heading" style={card}>
        <h2 id="by-purpose-heading" style={h2}>What it paid for</h2>
        <BarRows
          title={`Grant money received by purpose, ${firstYear.year}–${lastYear.year}`}
          lede="Grouped by the fund that received it and the State's revenue code."
          rows={purposeTotals.map(([k, v]) => ({ label: k, value: v, display: big(v) }))}
          format={big}
          source={`${grantSources.osc.title}.`}
        />
        <p style={{ ...prose, fontSize: 15, marginTop: 12 }}>
          The Water District line is State aid the Water District recorded in 2023 and 2024, and in 2025 a $3,575,000 federal
          congressionally directed project for a water main extension (Resolution 2026-640). Roads and highways is the State&apos;s
          highway aid: CHIPS, PAVE NY, Pave Our Potholes and Extreme Winter Recovery, which the State pays every town by formula.
        </p>
        <details style={{ marginTop: 8 }}>
          <summary style={{ cursor: 'pointer', color: 'var(--rbl-link)', fontWeight: 600, minHeight: 24 }}>Every account, year by year</summary>
          {grantYears.slice().reverse().map((y) => (
            <div key={y.year} style={{ overflowX: 'auto', marginTop: 12 }}>
              <table className="rbl-stack" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <caption style={{ textAlign: 'left', fontWeight: 700, padding: '4px 0', color: 'var(--rbl-text-strong)' }}>{y.year}</caption>
                <thead><tr style={{ borderBottom: '1px solid var(--rbl-border)' }}>
                  <th scope="col" style={th}>Account</th><th scope="col" style={th}>Purpose</th><th scope="col" style={{ ...th, textAlign: 'right' }}>Received</th>
                </tr></thead>
                <tbody>
                  {y.accounts.map((a) => (
                    <tr key={a.code} style={{ borderBottom: '1px solid var(--rbl-border-subtle)' }}>
                      <th scope="row" style={{ ...td, textAlign: 'left', fontWeight: 600 }}>{a.code} · {a.name}</th>
                      <td data-label="Purpose" style={td}>{a.purpose}</td>
                      <td data-label="Received" style={{ ...td, textAlign: 'right' }}>{usd(a.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </details>
      </section>

      <section id="awards" aria-labelledby="awards-heading" style={card}>
        <h2 id="awards-heading" style={h2}>Each grant the Town Board accepted since {new Date(`${awardsSince}T12:00:00`).getFullYear()}</h2>
        <p style={prose}>
          {awards.length} grants, State aid allocations and County funding agreements, worth {big(awardedTotal)} in all where the resolution
          states a sum. On cost share: {matchSummary.none} need no match, {matchSummary.stated.length} state one
          ({matchSummary.stated.map((a) => `${a.grant.split(' (')[0]}, ${a.match}`).join('; ')}), and {matchSummary.notStated} do not say.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <table className="rbl-stack" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14.5 }}>
            <thead><tr style={{ borderBottom: '1px solid var(--rbl-border)' }}>
              <th scope="col" style={th}>Grant</th>
              <th scope="col" style={th}>From</th>
              <th scope="col" style={{ ...th, textAlign: 'right' }}>Award</th>
              <th scope="col" style={th}>Received</th>
              <th scope="col" style={th}>Cost share</th>
            </tr></thead>
            <tbody>
              {awards.slice().reverse().map((a) => (
                <tr key={a.resolution} style={{ borderBottom: '1px solid var(--rbl-border-subtle)' }}>
                  <th scope="row" style={{ ...td, textAlign: 'left', fontWeight: 600 }}>
                    {a.grant}
                    <div style={{ fontWeight: 400, fontSize: 13, color: 'var(--rbl-text-muted)', marginTop: 2 }}>
                      {kindLabel[a.kind]} · Resolution {a.resolution}, {longDate(a.date)}
                    </div>
                  </th>
                  <td data-label="From" style={td}>{a.grantor}</td>
                  <td data-label="Award" style={{ ...td, textAlign: 'right', whiteSpace: 'nowrap' }}>
                    {a.award != null ? usd(a.award) : 'Per service'}
                    {a.awardNote ? <div style={{ fontSize: 12.5, color: 'var(--rbl-text-muted)', whiteSpace: 'normal' }}>{a.awardNote}</div> : null}
                  </td>
                  <td data-label="Received" style={td}>
                    {typeof a.received === 'number' ? usd(a.received) : a.received ?? <span style={{ color: 'var(--rbl-text-muted)' }}>Not stated</span>}
                    {a.receivedNote ? <div style={{ fontSize: 12.5, color: 'var(--rbl-text-muted)' }}>{a.receivedNote}</div> : null}
                  </td>
                  <td data-label="Cost share" style={td}>{a.match === 'not stated' ? <span style={{ color: 'var(--rbl-text-muted)' }}>Not stated</span> : a.match}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <details style={{ marginTop: 12 }}>
          <summary style={{ cursor: 'pointer', color: 'var(--rbl-link)', fontWeight: 600, minHeight: 24 }}>What each resolution says</summary>
          <ul style={{ ...prose, fontSize: 15, marginTop: 8 }}>
            {awards.map((a) => (
              <li key={a.resolution} style={{ marginBottom: 6 }}>
                <strong>{a.resolution}</strong>: &ldquo;{a.quote}&rdquo;{a.matchQuote ? <> On the match: &ldquo;{a.matchQuote}&rdquo;</> : null}
              </li>
            ))}
          </ul>
        </details>
        <p style={{ ...prose, fontSize: 15, marginTop: 12 }}>
          &ldquo;Received&rdquo; is filled in only where the resolution or the single audit says what arrived. For the rest, the Town&apos;s
          yearly totals above show what was received, but not grant by grant. The site holds every Town Board meeting since January 2025,
          so grants accepted before then are in the yearly totals but not listed here. See{' '}
          <a href={`${base}/records/`} style={link}>records the Town has not published</a> to request the earlier grant files.
        </p>
      </section>

      {audit ? (
        <section id="federal" aria-labelledby="federal-heading" style={card}>
          <h2 id="federal-heading" style={h2}>Federal awards spent in {audit.year}</h2>
          <p style={prose}>
            A town that spends enough federal money in a year must have a single audit, which lists every federal award it spent. Of
            the years since {firstYear.year}, the Federal Audit Clearinghouse holds one for Riverhead only for {audit.year}, with{' '}
            {usd(audit.total)} spent. That
            matches, to the dollar, the federal aid the Town reported to the Comptroller for {audit.year}. Most of it came through the
            State or the County rather than straight from Washington.
          </p>
          <BarRows
            title={`Federal awards spent in ${audit.year}, by program`}
            rows={Object.values(audit.awards.reduce<Record<string, { program: string; listing: string; amount: number; via: Set<string> }>>((acc, w) => {
              const k = w.listing
              acc[k] = acc[k] ?? { program: w.program, listing: w.listing, amount: 0, via: new Set() }
              acc[k].amount += w.amount
              acc[k].via.add(w.direct ? 'direct from the federal agency' : `through ${w.passThrough}`)
              return acc
            }, {})).sort((a, b) => b.amount - a.amount).map((g) => ({
              label: g.program.charAt(0) + g.program.slice(1).toLowerCase(),
              value: g.amount,
              display: usd(g.amount),
              note: `Assistance Listing ${g.listing} · ${Array.from(g.via).join('; ')}`,
            }))}
            format={usd}
            source={`${grantSources.fac.title}, report ${audit.reportId}, accepted ${longDate(audit.accepted)}.`}
          />
        </section>
      ) : null}

      <section id="sources" aria-labelledby="sources-heading" style={card}>
        <h2 id="sources-heading" style={h2}>Sources and method</h2>
        <ul style={prose}>
          <li><a href={grantSources.osc.url} style={link}>{grantSources.osc.title}</a>: every State aid (3000s) and federal aid (4000s)
            revenue account in the Town&apos;s Annual Financial Report, {firstYear.year} to {lastYear.year}. Mortgage tax (3005) and State
            revenue sharing (3001) are left out of the grant totals because every town receives them.</li>
          <li><a href={grantSources.fac.url} style={link}>{grantSources.fac.title}</a>: the Town&apos;s single audit (EIN 11-6001935). No
            other year since {firstYear.year} is on file there for the Town.</li>
          <li>Town Board resolutions in the agenda packets on the Town&apos;s CivicClerk portal, quoted in full under &ldquo;What each
            resolution says&rdquo;. Applications the Board only authorized are not listed; only awards, allocations and agreements.</li>
          <li>See also <a href={`${base}/revenue/`} style={link}>where revenue comes from</a> and{' '}
            <a href={`${base}/fiscal-impact/`} style={link}>the cost of Board decisions</a>.</li>
        </ul>
      </section>
    </PageShell>
  )
}
