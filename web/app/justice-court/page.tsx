import { Circle, CircleCheck } from 'lucide-react'
import PageShell from '../../components/PageShell'
import PlainCallout from '../../components/PlainCallout'
import {
  bond, condition, courtAsOf, grants, kindLabel, longDate, meanwhile, questions, quote, recordsThrough, steps, timeline, usd,
  type CourtSource,
} from '../../lib/justice-court'

const base = process.env.NEXT_PUBLIC_BASE_PATH || ''
const card = { background: 'var(--rbl-surface)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 16, padding: 20, marginBottom: 16 } as const
const prose = { margin: '0 0 12px', color: 'var(--rbl-text-body)', fontSize: 16.5, lineHeight: 1.6, maxWidth: '75ch' } as const
const h2 = { margin: '0 0 8px', color: 'var(--rbl-title)', fontSize: 22 } as const
const h3 = { margin: '0 0 6px', color: 'var(--rbl-title)', fontSize: 18 } as const
const link = { color: 'var(--rbl-link)', fontWeight: 600 } as const
const muted = { color: 'var(--rbl-text-muted)', fontSize: 14 } as const
const quoteBox = { margin: '0 0 10px', paddingLeft: 12, borderLeft: '2px solid var(--rbl-border)', color: 'var(--rbl-text-body)', fontSize: 15.5, lineHeight: 1.55, maxWidth: '75ch' } as const
const href = (url: string) => (url.startsWith('/') ? `${base}${url}` : url)

export const metadata = {
  title: '200 Howell Avenue and the new Justice Court',
  description: 'The Town’s plan to turn the former Town Hall at 200 Howell Avenue into the Justice Court, the $6.5 million in bonds the Board authorized, what has and has not happened since, and the grant programs that could help.',
}

function Source({ s }: { s: CourtSource }) {
  return <span style={muted}>{kindLabel[s.kind]}: <a href={href(s.url)} style={link}>{s.title}</a></span>
}

export default function JusticeCourtPage() {
  const committed = quote('committed')
  const ac = quote('ac')
  const through = longDate(recordsThrough)
  const pending = steps.find((s) => !s.done)
  return (
    <PageShell
      title="200 Howell Avenue and the new Justice Court"
      subtitle={`The plan to turn the former Town Hall into the Town Justice Court: what the Board has decided, what it costs, what has not happened yet, and the grants that could help, as of ${longDate(courtAsOf)}.`}
    >
      <PlainCallout
        tips={[
          { label: 'Justice Court', text: 'the Town’s own court. It hears traffic tickets, Town Code violations, small claims, misdemeanors and the first stages of felony cases.' },
          { label: 'Bond resolution', text: 'the Board’s permission to borrow. The Town borrows only when it sells the bonds or notes.' },
          { label: 'Permissive referendum', text: 'residents may petition to put the borrowing to a public vote within a set time after it is adopted.' },
        ]}
      >
        The Justice Court shares <strong>210 Howell Avenue</strong> with the Police Department. The Board plans to renovate the former Town Hall next
        door, <strong>200 Howell Avenue</strong>, for the court, and in October 2025 it
        authorized up to <strong>{usd(bond.amount)}</strong> in bonds to do it, repaid from Town property taxes.{' '}
        {pending ? <>In the Town Board records through {through}, the next step has not happened yet: {pending.step.charAt(0).toLowerCase() + pending.step.slice(1)}.</> : null}
      </PlainCallout>

      <section aria-labelledby="status-heading" style={card}>
        <h2 id="status-heading" style={h2}>Where the project stands</h2>
        <ol style={{ listStyle: 'none', margin: '8px 0 0', padding: 0, display: 'grid', gap: 10 }}>
          {steps.map((s) => (
            <li key={s.step} style={{ display: 'grid', gridTemplateColumns: '24px 1fr', gap: 10, alignItems: 'start' }}>
              {s.done
                ? <CircleCheck size={22} aria-hidden="true" style={{ color: 'var(--rbl-success)', marginTop: 1 }} />
                : <Circle size={22} aria-hidden="true" style={{ color: 'var(--rbl-text-muted)', marginTop: 1 }} />}
              <div>
                <div style={{ fontWeight: 700, color: 'var(--rbl-text-strong)' }}>
                  {s.step}{s.date ? `: ${longDate(s.date)}` : ''}<span className="rbl-sr-only">{s.done ? ' (done)' : ' (not yet)'}</span>
                </div>
                <div style={{ ...muted, fontSize: 14.5, lineHeight: 1.5 }}>{s.note}</div>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="plan-heading" style={card}>
        <h2 id="plan-heading" style={h2}>The plan, in the Town’s words</h2>
        <p style={prose}>In Resolution 2025-458 (May 21, 2025) the Board stated that</p>
        <blockquote style={quoteBox}>“{committed.text}.”</blockquote>
        <p style={prose}>
          The same resolution said the armory was no longer needed for the court, which is why the Town is now seeking to lease the armory to
          the YMCA; see <a href={`${base}/armory/`} style={link}>The former armory and the YMCA</a>.
        </p>
      </section>

      <section aria-labelledby="bond-heading" style={card}>
        <h2 id="bond-heading" style={h2}>The {usd(bond.amount)} in borrowing</h2>
        <p style={prose}>
          Resolution {bond.resolution}, {bond.vote} on {longDate(bond.date)}, authorizes bonds <q>{bond.purpose}</q>. It sets the estimated
          maximum cost at {usd(bond.amount)}. The plan of financing is <q>{bond.repayment}</q>.
        </p>
        <ul style={{ ...prose, paddingLeft: 20, display: 'grid', gap: 6 }}>
          <li><strong>How long:</strong> the resolution gives the work a useful life of {bond.usefulLife}, which caps how long the bonds can run.</li>
          <li><strong>Public vote:</strong> <q>{bond.referendum}</q>.</li>
          <li><strong>Authorized is not borrowed:</strong> the Town borrows when it sells the bonds or notes. The{' '}
            <a href={`${base}/capital-debt/`} style={link}>Projects and borrowing</a> page tracks authorized but unissued debt.</li>
        </ul>
        <p style={{ ...muted, margin: 0 }}>Source: the <a href={bond.url} style={link}>agenda packet</a>, {bond.pages}.</p>
      </section>

      <section aria-labelledby="why-heading" style={card}>
        <h2 id="why-heading" style={h2}>Why the court needs a new home</h2>
        <p style={prose}>These are news reports, quoted as the outlet printed them.</p>
        <ul style={{ ...prose, paddingLeft: 20, display: 'grid', gap: 10 }}>
          {condition.map((c) => <li key={c.source.url}>{c.point} <Source s={c.source} /></li>)}
        </ul>
        <h3 style={{ ...h3, marginTop: 4 }}>Meanwhile, at 210 Howell Avenue</h3>
        <p style={{ ...prose, margin: 0 }}>
          Resolution {meanwhile.resolution} ({longDate(meanwhile.date)}) says <q>{ac.text}</q>. The Board moved {usd(meanwhile.amount)} from
          General Fund savings to replace them. Source: the <a href={meanwhile.url} style={link}>agenda packet</a>, {meanwhile.pages}.
        </p>
      </section>

      <section aria-labelledby="grants-heading" style={card}>
        <h2 id="grants-heading" style={h2}>Grants that could help</h2>
        <p style={prose}>
          The Division of Criminal Justice Services (DCJS) funds police, prosecutors, defenders and related programs, not court buildings. Town and
          village courts are overseen by the State court system, which runs its own grant program for them. This site found three routes; it found
          no record that the Town has applied for a grant for 200 Howell Avenue.
        </p>
        {grants.map((g) => (
          <div key={g.name} style={{ borderTop: '1px solid var(--rbl-border-subtle)', padding: '12px 0' }}>
            <h3 style={h3}>{g.name}</h3>
            <p style={{ ...muted, margin: '0 0 6px' }}>{g.agency}</p>
            <p style={{ ...prose, margin: '0 0 6px' }}>{g.fit}</p>
            <p style={{ ...prose, margin: '0 0 6px' }}>{g.townHistory}</p>
            <p style={{ ...prose, margin: '0 0 6px' }}><strong>Status:</strong> {g.status}</p>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {g.sources.map((s) => <li key={s.url}><Source s={s} /></li>)}
            </ul>
          </div>
        ))}
        <p style={{ ...muted, margin: '8px 0 0' }}>
          Grant amounts and rules change each year; these are leads for residents to ask about, not a finding that the Town qualifies.
        </p>
      </section>

      <section aria-labelledby="timeline-heading" style={card}>
        <h2 id="timeline-heading" style={h2}>Timeline</h2>
        <ol style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {timeline.map((t) => (
            <li key={t.date + t.what.slice(0, 20)} style={{ borderTop: '1px solid var(--rbl-border-subtle)', padding: '10px 0' }}>
              <div style={{ fontWeight: 700, color: 'var(--rbl-text-strong)' }}>{longDate(t.date)}</div>
              <p style={{ ...prose, margin: '2px 0 4px' }}>{t.what}</p>
              <Source s={t.source} />
            </li>
          ))}
        </ol>
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
          Town Board resolutions are quoted from their agenda packets and minutes on the Town’s CivicClerk portal; the search for later steps covers
          the meeting records through {through}. The grant programs are described from DCJS’s own pages, Judiciary Law §849-h and DASNY’s
          grant report. News reports are labelled. These are likely concerns for residents, not legal or audit findings.
        </p>
      </section>
    </PageShell>
  )
}
