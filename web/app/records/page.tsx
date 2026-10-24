import PageShell from '../../components/PageShell'
import RecordsRequestBuilder from '../../components/RecordsRequestBuilder'
import { DEADLINE_DAYS, LAW, RECORD_REQUESTS, TOWN_FOIL } from '../../lib/records-requests'

const base = process.env.NEXT_PUBLIC_BASE_PATH || ''
const card = { background: 'var(--rbl-surface)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 16, padding: 20 } as const
const link = { color: 'var(--rbl-link)', fontWeight: 600 } as const
const p = { margin: '0 0 12px', color: 'var(--rbl-text-strong)', fontSize: 15.5, lineHeight: 1.6, maxWidth: '72ch' } as const
const h2 = { margin: '0 0 10px', fontSize: 20, color: 'var(--rbl-title)' } as const

export const metadata = {
  title: 'Records to request — Freedom of Information Law requests to the Town of Riverhead',
  description:
    'Records this site looked for and did not find published, each with a ready Freedom of Information Law request to the Town of Riverhead, how to send it, and a calculator for the legal deadlines.',
}

export default function RecordsPage() {
  return (
    <PageShell
      title="Records to request"
      subtitle="Some of what residents need to follow the Town’s money is not published. Here are the records this site looked for and did not find, with a ready request for each under the Freedom of Information Law, and the deadlines the Town has to meet."
    >
      <section style={card}>
        <h2 style={h2}>The records</h2>
        <div style={{ display: 'grid', gap: 16 }}>
          {RECORD_REQUESTS.map((r) => (
            <article key={r.id} style={{ borderTop: '1px solid var(--rbl-border-subtle)', paddingTop: 14 }}>
              <h3 style={{ margin: '0 0 6px', fontSize: 17, color: 'var(--rbl-title)' }}>{r.title}</h3>
              <p style={p}>{r.why}</p>
              <p style={{ ...p, color: 'var(--rbl-text-body)', fontSize: 14.5 }}>
                <strong>The request asks for:</strong> {r.describe}
              </p>
              <p style={{ ...p, margin: 0, fontSize: 14 }}>
                {r.sources.map((s, i) => <span key={s.url}>{i > 0 && ' · '}<a href={s.url} style={link}>{s.label}</a></span>)}
                {r.page && <> · <a href={`${base}${r.page.href}`} style={link}>{r.page.label} on this site</a></>}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section style={{ ...card, marginTop: 16 }}>
        <h2 style={h2}>Build your request</h2>
        <p style={p}>
          The letter is put together on this page. Nothing you type is saved or sent anywhere: copy it, or download it, and send it yourself.
        </p>
        <RecordsRequestBuilder />
      </section>

      <section style={{ ...card, marginTop: 16 }}>
        <h2 style={h2}>How to send it</h2>
        <p style={p}>
          Under the Town’s <a href={TOWN_FOIL.policy.url} style={link}>public access policy</a>, requests go in writing to the {TOWN_FOIL.submitTo}. The policy says “{TOWN_FOIL.online}”, reached through {TOWN_FOIL.onlineWhere} at{' '}
          <a href={TOWN_FOIL.homepage} style={link}>townofriverheadny.gov</a>. The Clerk logs each request and sends it to the department that holds the records.
          State law also requires an agency that has email to “{LAW.email.quote}” ({LAW.email.cite}).
        </p>
        <p style={p}>
          There is no fee to search for or inspect records. Paper copies are {TOWN_FOIL.copyFee}; electronic copies of electronic records usually cost nothing.
          Keep a dated copy of what you send.
        </p>
      </section>

      <section style={{ ...card, marginTop: 16 }}>
        <h2 style={h2}>The deadlines</h2>
        <ul style={{ margin: 0, paddingLeft: 20, display: 'grid', gap: 8, fontSize: 15.5, lineHeight: 1.6, color: 'var(--rbl-text-strong)', maxWidth: '72ch' }}>
          <li>
            <strong>{DEADLINE_DAYS.respond} business days</strong> for the Town to provide the records, deny them in writing, or acknowledge the request with a date:
            “{LAW.respond.quote}” (<a href={LAW.respond.url} style={link}>{LAW.respond.cite}</a>).
          </li>
          <li>
            <strong>{DEADLINE_DAYS.outer} business days</strong> after acknowledging it, as a rule, to grant or deny it: “{LAW.outer.quote}”. More time needs a written reason and a date certain.
          </li>
          <li>
            <strong>No answer counts as a denial.</strong> “{LAW.deemedDenial.quote}” ({LAW.deemedDenial.cite}).
          </li>
          <li>
            <strong>{DEADLINE_DAYS.appealCalendar} days</strong> to appeal a denial: “{LAW.appeal.quote}” ({LAW.appeal.cite}). In Riverhead, appeals go to {TOWN_FOIL.appealsTo}.
          </li>
          <li>
            <strong>{DEADLINE_DAYS.appealDecision} business days</strong> for the Town to decide the appeal: the agency “{LAW.appealDecision.quote}” ({LAW.appealDecision.cite}).
            The Town’s 2023 policy still says “{TOWN_FOIL.appealPolicyText}”. That looks out of date against the statute, which the Town follows; it is a question for the Town Attorney, not a legal finding.
          </li>
        </ul>
        <p style={{ ...p, marginTop: 12, fontSize: 14, color: 'var(--rbl-text-muted)' }}>
          Business days skip weekends and the State’s public holidays (<a href={LAW.holidays.url} style={link}>{LAW.holidays.cite}</a>).
        </p>
      </section>

      <section style={{ ...card, marginTop: 16 }}>
        <h2 style={h2}>Tips</h2>
        <ul style={{ margin: 0, paddingLeft: 20, display: 'grid', gap: 6, fontSize: 15, lineHeight: 1.55, color: 'var(--rbl-text-strong)', maxWidth: '72ch' }}>
          <li>Ask for records that exist, not for answers or new analysis. Name the document, the office and the dates.</li>
          <li>You don’t have to say why you want them.</li>
          <li>Ask for electronic copies by email.</li>
          <li>If the Town says no record exists, you may ask it to certify that it searched and could not find one.</li>
          <li>
            The State’s <a href="https://opengovernment.ny.gov/" style={link}>Committee on Open Government</a> publishes advisory opinions you can cite in an appeal. The{' '}
            <a href="https://nyopengov.org/foil-toolkit/" style={link}>New York Coalition for Open Government’s FOIL toolkit</a> has more guidance and templates.
          </li>
        </ul>
        <p style={{ ...p, marginTop: 12, marginBottom: 0, fontSize: 14, color: 'var(--rbl-text-muted)' }}>
          This page is general information from an unofficial resident project, not legal advice. If a record turns up, the site would be glad to publish it: see{' '}
          <a href={`${base}/sources/`} style={link}>the source library</a>.
        </p>
      </section>
    </PageShell>
  )
}
