import PageShell from '../../components/PageShell'
import PlainCallout from '../../components/PlainCallout'
import {
  cableAsOf, channels, franchise, kindLabel, law, longDate, questions, recordsSearched, revenue, revenueRows, usd, verizon, verizonNow,
  type CableSource,
} from '../../lib/cable-franchise'

const card = { background: 'var(--rbl-surface)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 16, padding: 20, marginBottom: 16 } as const
const prose = { margin: '0 0 12px', color: 'var(--rbl-text-body)', fontSize: 16.5, lineHeight: 1.6, maxWidth: '75ch' } as const
const h2 = { margin: '0 0 8px', color: 'var(--rbl-title)', fontSize: 22 } as const
const link = { color: 'var(--rbl-link)', fontWeight: 600 } as const
const muted = { color: 'var(--rbl-text-muted)', fontSize: 14 } as const

export const metadata = {
  title: 'The Optimum cable franchise and Verizon',
  description: 'Riverhead’s cable franchise with Optimum: what the 2016 renewal provides, what it brings the Town each year, when it comes up for renewal, and whether a competing provider such as Verizon could come in.',
}

function Source({ s }: { s: CableSource }) {
  return <span style={muted}>{kindLabel[s.kind]}: <a href={s.url} style={link}>{s.title}</a></span>
}

export default function CableFranchisePage() {
  const first = revenueRows[0]
  const lastActual = revenueRows.filter((r) => r.kind === 'Actual').slice(-1)[0]
  const max = Math.max(...revenueRows.map((r) => r.value))
  const change = (lastActual.value - first.value) / first.value
  return (
    <PageShell
      title="The Optimum cable franchise and Verizon"
      subtitle={`What Riverhead’s cable franchise with Optimum provides, what it brings the Town, when it is due for renewal, and whether Verizon or another provider could compete, as of ${longDate(cableAsOf)}.`}
    >
      <PlainCallout
        tips={[
          { label: 'Cable franchise', text: 'the Town’s agreement letting a cable company use Town roads and rights-of-way, in return for fees and services.' },
          { label: 'Franchise fee', text: 'a share of the company’s cable revenue paid to the Town. Federal law caps it at 5 percent.' },
          { label: 'PEG channels', text: 'public, educational and government access channels, such as the channel that airs Town Board meetings.' },
        ]}
      >
        Optimum (formerly Cablevision) serves Riverhead under a <strong>ten-year franchise</strong> the Town Board approved on{' '}
        {longDate(franchise.adopted)}. It pays the Town 5 percent of its cable revenue. The General Fund’s franchise revenue, which includes that fee, was{' '}
        <strong>{usd(lastActual.value)}</strong> in {lastActual.year}, down {Math.round(-change * 100)} percent since {first.year}. The franchise is
        not exclusive, so another provider such as Verizon could apply for its own, but nothing in the records shows one has.
      </PlainCallout>

      <section aria-labelledby="terms-heading" style={card}>
        <h2 id="terms-heading" style={h2}>What the 2016 franchise provides</h2>
        <p style={prose}>
          The Board held a public hearing on {longDate(franchise.hearing)} and adopted Resolution {franchise.resolution} on {longDate(franchise.adopted)},{' '}
          {franchise.vote}, authorizing the Supervisor to sign the renewal with {franchise.operator}. At the hearing the company said:
          <q> {franchise.term}</q>
        </p>
        <dl style={{ margin: 0 }}>
          {franchise.terms.map((t) => (
            <div key={t.topic} style={{ borderTop: '1px solid var(--rbl-border-subtle)', padding: '10px 0' }}>
              <dt style={{ fontWeight: 700, color: 'var(--rbl-text-strong)' }}>{t.topic}</dt>
              <dd style={{ margin: '2px 0 0', color: 'var(--rbl-text-body)', fontSize: 15.5, lineHeight: 1.55, maxWidth: '75ch' }}>
                “{t.quote}” <span style={muted}>({franchise.speakers[t.topic]}, hearing minutes)</span>
              </dd>
            </div>
          ))}
        </dl>
        <p style={{ ...muted, margin: '10px 0 0' }}>
          Sources: <a href={franchise.hearingUrl} style={link}>minutes of April 5, 2016</a> (hearing) and{' '}
          <a href={franchise.minutesUrl} style={link}>minutes of April 19, 2016</a> (Resolution {franchise.resolution}). The minutes are the Town’s
          transcript; the agreement itself is not attached to them.
        </p>
      </section>

      <section aria-labelledby="when-heading" style={card}>
        <h2 id="when-heading" style={h2}>When it comes up for renewal</h2>
        <p style={prose}>{franchise.endNote}</p>
        <p style={prose}>
          Federal law gives the Town two paths. In a formal renewal it can open a public proceeding in the window before the franchise ends:
        </p>
        <blockquote style={{ margin: '0 0 10px', paddingLeft: 12, borderLeft: '2px solid var(--rbl-border)', color: 'var(--rbl-text-body)', fontSize: 15.5, lineHeight: 1.55, maxWidth: '75ch' }}>
          “{law[2].quote}” <a href={law[2].url} style={link}>{law[2].cite}</a>
        </blockquote>
        <p style={prose}>
          Or the two sides can negotiate informally, as they did last time: <q>{law[3].quote}</q> (<a href={law[3].url} style={link}>{law[3].cite}</a>).
          News reports at the time said the last renewal took about three years of talks after the previous franchise expired in 2012.
        </p>
        <p style={{ ...muted, margin: 0 }}>This site found no renewal proceeding or vote on the franchise in {recordsSearched}.</p>
      </section>

      <section aria-labelledby="money-heading" style={card}>
        <h2 id="money-heading" style={h2}>What it brings the Town</h2>
        <p style={prose}>{revenue.note}</p>
        <div role="img" aria-label={revenueRows.map((r) => `${r.year} ${r.kind.toLowerCase()}: ${usd(r.value)}`).join('; ')} style={{ display: 'grid', gap: 6, margin: '6px 0 12px' }}>
          {revenueRows.map((r) => (
            <div key={r.year} style={{ display: 'grid', gridTemplateColumns: '44px minmax(0, 1fr) 88px', gap: 10, alignItems: 'center' }}>
              <span style={{ fontSize: 14, color: 'var(--rbl-text-strong)', fontWeight: 600 }}>{r.year}</span>
              <div style={{ background: 'var(--rbl-track)', borderRadius: 4, height: 14 }}>
                <div style={{ width: `${(r.value / max) * 100}%`, height: '100%', borderRadius: 4, background: r.kind === 'Actual' ? 'var(--rbl-series-blue)' : 'var(--rbl-series-gold)' }} />
              </div>
              <span style={{ fontSize: 14, textAlign: 'right', color: 'var(--rbl-text-strong)' }}>{usd(r.value)}</span>
            </div>
          ))}
        </div>
        <p style={{ ...muted, margin: '0 0 12px' }}>Blue bars are actual receipts; gold bars are the 2026 adopted and 2027 Preliminary budgets.</p>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 15, maxWidth: 520 }}>
          <caption style={{ textAlign: 'left', fontWeight: 700, color: 'var(--rbl-text-strong)', paddingBottom: 6 }}>{revenue.name} revenue, {revenue.account}</caption>
          <thead><tr style={{ borderBottom: '1px solid var(--rbl-border)' }}>
            <th scope="col" style={{ textAlign: 'left', padding: '6px 8px', fontSize: 13, color: 'var(--rbl-text-muted)' }}>Year</th>
            <th scope="col" style={{ textAlign: 'left', padding: '6px 8px', fontSize: 13, color: 'var(--rbl-text-muted)' }}>Figure</th>
            <th scope="col" style={{ textAlign: 'right', padding: '6px 8px', fontSize: 13, color: 'var(--rbl-text-muted)' }}>Amount</th>
          </tr></thead>
          <tbody>
            {revenueRows.map((r) => (
              <tr key={r.year} style={{ borderBottom: '1px solid var(--rbl-border-subtle)' }}>
                <th scope="row" style={{ textAlign: 'left', padding: '6px 8px' }}>{r.year}</th>
                <td data-label="Figure" style={{ padding: '6px 8px' }}>{r.kind}</td>
                <td data-label="Amount" style={{ padding: '6px 8px', textAlign: 'right' }}>{usd(r.value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p style={{ ...muted, margin: '10px 0 0' }}>
          Source: {revenue.source}. The fee is a share of cable revenue, so it moves with the number and price of cable subscriptions in Town.
        </p>
      </section>

      <section aria-labelledby="verizon-heading" style={card}>
        <h2 id="verizon-heading" style={h2}>Could Verizon come in?</h2>
        <p style={prose}>
          The Town can let a second company in, but it cannot make one build. Federal law says <q>{law[0].quote}</q>{' '}
          (<a href={law[0].url} style={link}>{law[0].cite}</a>). A Board member said at the 2016 hearing that the franchise is not exclusive.
        </p>
        <ul style={{ ...prose, paddingLeft: 20, display: 'grid', gap: 8 }}>
          {verizon.map((v) => <li key={v.date + v.source.url}>{v.point} <Source s={v.source} /></li>)}
        </ul>
        <p style={{ ...prose, margin: 0 }}>{verizonNow}</p>
      </section>

      <section aria-labelledby="channels-heading" style={card}>
        <h2 id="channels-heading" style={h2}>The 2025 channel move</h2>
        <p style={{ ...prose, margin: '0 0 6px' }}>{channels.point}</p>
        <Source s={channels.source} />
        <p style={{ ...prose, margin: '10px 0 0' }}>
          The 2016 franchise covered “the continuation of the airing of your two access channels,” but the minutes do not say whether it fixes their
          channel numbers. A renewal is the Town’s chance to set that.
        </p>
      </section>

      <section aria-labelledby="questions-heading" style={card}>
        <h2 id="questions-heading" style={h2}>Questions residents may want to ask</h2>
        <ul style={{ ...prose, paddingLeft: 20, display: 'grid', gap: 6 }}>
          {questions.map((q) => <li key={q}>{q}</li>)}
        </ul>
      </section>

      <section aria-labelledby="method-heading" style={card}>
        <h2 id="method-heading" style={h2}>How this was put together</h2>
        <p style={prose}>
          The 2016 terms are quoted from the Town Board’s minutes on the Town’s CivicClerk portal, which record the hearing word for word. The federal
          rules are quoted from Title 47 of the U.S. Code. The revenue figures are the Town’s, from its 2027 Budget Supplement and Preliminary
          Budget. News reports are labelled. These are likely concerns for residents, not legal findings.
        </p>
      </section>
    </PageShell>
  )
}
