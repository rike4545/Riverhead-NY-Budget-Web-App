import { Circle, CircleCheck } from 'lucide-react'
import PageShell from '../../components/PageShell'
import PlainCallout from '../../components/PlainCallout'
import { armoryAsOf, bill, discrepancies, kindLabel, law2011, loi, longDate, news, property, questions, quote, timeline, ymcaPlan } from '../../lib/armory'

const base = process.env.NEXT_PUBLIC_BASE_PATH || ''
const card = { background: 'var(--rbl-surface)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 16, padding: 20, marginBottom: 16 } as const
const prose = { margin: '0 0 12px', color: 'var(--rbl-text-body)', fontSize: 16.5, lineHeight: 1.6, maxWidth: '75ch' } as const
const h2 = { margin: '0 0 8px', color: 'var(--rbl-title)', fontSize: 22 } as const
const h3 = { margin: '0 0 6px', color: 'var(--rbl-title)', fontSize: 17 } as const
const link = { color: 'var(--rbl-link)', fontWeight: 600 } as const
const muted = { color: 'var(--rbl-text-muted)', fontSize: 14 } as const
const quoteBox = { margin: 0, paddingLeft: 12, borderLeft: '2px solid var(--rbl-border)', color: 'var(--rbl-text-body)', fontSize: 15.5, lineHeight: 1.55 } as const
const href = (url: string) => (url.startsWith('/') ? `${base}${url}` : url)

export const metadata = {
  title: 'The former armory and the YMCA',
  description: 'What the 2011 State law allows at Riverhead’s former armory on Route 58, how the bill the Legislature passed in 2026 would change it, the Town’s letter of intent with the YMCA, and what it means for taxpayers.',
}

export default function ArmoryPage() {
  const unable = quote('unable')
  const nofunding = quote('nofunding')
  const storage = quote('storage')
  const repairs = quote('repairs')
  const received = quote('received')
  const ages = quote('ages')
  const pending = bill.steps.find((s) => !s.done)
  return (
    <PageShell
      title="The former armory and the YMCA"
      subtitle={`What State law allows at ${property.address}, what the Legislature has passed to change it, and what the Town has agreed with the YMCA so far, as of ${longDate(armoryAsOf)}.`}
    >
      <PlainCallout
        tips={[
          { label: 'Home rule request', text: 'a local government’s formal request that the Legislature pass a bill that affects only it. The State Constitution requires one for most such bills, and one was filed for this bill.' },
          { label: 'Reverter', text: 'a condition that sends the land back to the State if it stops being used as the law says.' },
          { label: 'Letter of intent', text: 'a non-binding outline of a deal. Either side can walk away.' },
        ]}
      >
        The State gave the armory to the Town under a 2011 law that limits it to <strong>police, court, public safety and police-run recreation</strong>.
        In 2025 the Town Board said that <q>{unable.text}</q>. Both houses of the Legislature have now passed a bill, {bill.numbers}, that would let
        the Town <strong>lease it to the YMCA of Long Island for 99 years at $1</strong>. {pending ? <>The bill is not yet law: {pending.note.charAt(0).toLowerCase() + pending.note.slice(1)}</> : null}
      </PlainCallout>

      <section aria-labelledby="status-heading" style={card}>
        <h2 id="status-heading" style={h2}>Where the bill stands</h2>
        <ol style={{ listStyle: 'none', margin: '8px 0 12px', padding: 0, display: 'grid', gap: 10 }}>
          {bill.steps.map((s) => (
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
        <p style={prose}>{bill.earlierTry}</p>
        <p style={{ ...muted, margin: 0 }}>
          Sources: the <a href={bill.url} style={link}>Assembly’s record of A.8809 and S.8378</a> and the{' '}
          <a href={bill.senateUrl} style={link}>Senate’s page for S.8378-B</a>. Sponsors: {bill.sponsors}.
        </p>
      </section>

      <section aria-labelledby="change-heading" style={card}>
        <h2 id="change-heading" style={h2}>What the bill changes</h2>
        <p style={prose}>
          The bill rewrites one section of the 2011 law, which conveyed the land to the Town <q>{law2011.conveyance}</q>. Both versions keep the
          condition that the land goes back to the State if it stops being used as the law says.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          <div>
            <h3 style={h3}>The law now ({law2011.chapter}, signed {longDate(law2011.signed)})</h3>
            <blockquote style={quoteBox}>“{law2011.section4}”</blockquote>
            <p style={{ ...muted, margin: '6px 0 0' }}><a href={law2011.url} style={link}>The 2011 law’s text and history</a></p>
          </div>
          <div>
            <h3 style={h3}>As the bill would amend it ({bill.numbers})</h3>
            <blockquote style={quoteBox}>“{bill.section4}”</blockquote>
            <p style={{ ...muted, margin: '6px 0 0' }}>{bill.effective} The bill allows a lease, not a sale.</p>
          </div>
        </div>
      </section>

      <section aria-labelledby="ymca-heading" style={card}>
        <h2 id="ymca-heading" style={h2}>What the YMCA would offer</h2>
        <p style={prose}>
          In Resolution 2025-458 the Board said the YMCA had expressed interest in the site for <q>{ages.text}</q>.
        </p>
        <h3 style={h3}>Planned facilities</h3>
        <blockquote style={{ ...quoteBox, marginBottom: 10 }}>“{ymcaPlan.facilities}”</blockquote>
        <p style={prose}>{ymcaPlan.differs}</p>
        <h3 style={h3}>Health programs</h3>
        <p style={prose}>The letter limits the site to recreation, health and wellness, and youth and family programming, <q>{ymcaPlan.health}</q>.</p>
        <h3 style={h3}>Stotzky Park next door</h3>
        <blockquote style={{ ...quoteBox, marginBottom: 10 }}>“{ymcaPlan.park}”</blockquote>
        <p style={{ ...prose, margin: 0 }}><strong>Not yet known.</strong> {ymcaPlan.unknown}</p>
        <p style={{ ...muted, margin: '8px 0 0' }}>Sources: Resolution 2025-458 (May 21, 2025) and the letter of intent with Resolution {loi.resolution}.</p>
      </section>

      <section aria-labelledby="loi-heading" style={card}>
        <h2 id="loi-heading" style={h2}>What the Town and the YMCA have agreed so far</h2>
        <p style={prose}>
          On {longDate(loi.date)} the Board adopted Resolution {loi.resolution}, authorizing the Supervisor to sign a letter of intent toward a
          lease. The letter is in the <a href={loi.url} style={link}>agenda packet</a>, {loi.pages}. {loi.signedNote} It is not a lease, and
          no lease had come before the Board in the meeting records through November 5, 2026. Its main terms, in its own words:
        </p>
        <dl style={{ margin: 0 }}>
          {loi.terms.map((t) => (
            <div key={t.topic} style={{ borderTop: '1px solid var(--rbl-border-subtle)', padding: '10px 0', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '4px 16px' }}>
              <dt style={{ fontWeight: 700, color: 'var(--rbl-text-strong)', maxWidth: 220 }}>{t.topic}</dt>
              <dd style={{ margin: 0, color: 'var(--rbl-text-body)', fontSize: 15.5, lineHeight: 1.55, gridColumn: 'span 2' }}>“{t.quote}”</dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="money-heading" style={card}>
        <h2 id="money-heading" style={h2}>What it means for taxpayers</h2>
        <ul style={{ ...prose, paddingLeft: 20, display: 'grid', gap: 8 }}>
          <li><strong>Rent.</strong> The Town would receive $1 for the 99 years. No property tax is paid on the site now, and the letter of intent says none
            would be paid under the YMCA, a not-for-profit.</li>
          <li><strong>Building and running it.</strong> The YMCA would pay to renovate, equip, run and maintain the building. In Resolution 2025-458 the
            Board said <q>{nofunding.text}</q>. Councilman Bob Kern has put the YMCA project at $20 million to $40 million (news report below). The
            YMCA can leave if it does not raise the funding it decides it needs.</li>
          <li><strong>Cleanup.</strong> The letter says the Town is not responsible for any remediation, and that the YMCA can leave if its environmental
            tests do not satisfy it. The Town’s environmental reports on the site are not in the agenda packet.</li>
          <li><strong>Town commitments.</strong> The Town would see the YMCA’s permits and certificate of occupancy approved within 24 months of its first
            plans, seek water and sewer grants with it, and explore programs together at Stotzky Park next door.</li>
          <li><strong>Benefits for residents.</strong> In June 2025 the Town sought $25,000 a year in membership help and free classes and programs for
            residents in return for the free rent (news report below). Those terms are not in the 2026 letter of intent. Whether they reach the lease is
            open.</li>
          <li><strong>Meanwhile.</strong> Resolution 2026-797 says <q>{storage.text}</q>. The ambulance corps now uses the building while its new
            headquarters is built. Resolution 2026-842 says <q>{repairs.text}</q>. That money is Ambulance District money, paid by the district’s
            taxpayers; see <a href={`${base}/rvac-funding/`} style={link}>Ambulance funding</a>.</li>
        </ul>
        <p style={{ ...muted, margin: 0 }}>These are likely concerns for residents, drawn from the records. They are not legal findings.</p>
      </section>

      <section aria-labelledby="timeline-heading" style={card}>
        <h2 id="timeline-heading" style={h2}>Timeline</h2>
        <ol style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {timeline.map((t) => (
            <li key={t.date + t.what.slice(0, 20)} style={{ borderTop: '1px solid var(--rbl-border-subtle)', padding: '10px 0' }}>
              <div style={{ fontWeight: 700, color: 'var(--rbl-text-strong)' }}>{longDate(t.date)}</div>
              <p style={{ ...prose, margin: '2px 0 4px' }}>{t.what}</p>
              <div style={muted}>{kindLabel[t.source.kind]}: <a href={href(t.source.url)} style={link}>{t.source.title}</a></div>
            </li>
          ))}
        </ol>
        <p style={{ ...muted, margin: '8px 0 0' }}>
          The home rule requests came from the State side: Resolution 2025-569 says <q>{received.text}</q>, and the Board approved each one unanimously.
        </p>
      </section>

      <section aria-labelledby="news-heading" style={card}>
        <h2 id="news-heading" style={h2}>What the news reported</h2>
        <p style={prose}>These are news reports, not Town records. The quotes are as the outlets printed them.</p>
        <ul style={{ ...prose, paddingLeft: 20, display: 'grid', gap: 8 }}>
          {news.map((n) => (
            <li key={n.url}><a href={n.url} style={link}>{n.outlet}, {longDate(n.date)}</a>: {n.point}</li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="disagree-heading" style={card}>
        <h2 id="disagree-heading" style={h2}>Where the records disagree</h2>
        <ul style={{ ...prose, paddingLeft: 20, display: 'grid', gap: 8 }}>
          {discrepancies.map((d) => <li key={d.slice(0, 40)}>{d}</li>)}
        </ul>
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
          Town Board resolutions are quoted from their agenda packets and minutes on the Town’s CivicClerk portal. The letter of intent is a scanned
          attachment in the May 20, 2026 packet and was read from the page images. The 2011 law and the 2025–26 bill are quoted from the Assembly’s
          bill record, which also gives each step’s date. The site is {property.acres} acres ({property.acresSource.charAt(0).toLowerCase() + property.acresSource.slice(1)})
          with a building of {property.building} ({property.buildingSource}).
        </p>
        <p style={{ ...muted, margin: 0 }}>
          Also see <a href={`${base}/rvac-funding/`} style={link}>Ambulance funding</a> and the{' '}
          <a href={`${base}/comprehensive-plan/`} style={link}>Comprehensive Plan tracker</a>.
        </p>
      </section>
    </PageShell>
  )
}
