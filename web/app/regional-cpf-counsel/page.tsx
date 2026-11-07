import PageShell from '../../components/PageShell'
import PlainCallout from '../../components/PlainCallout'
import {
  bill, deadline, ima, illustrativeHours, meeting, retainer, riverheadCpf2023, riverheadCpfLatest, shareOfBill, sources, statute,
} from '../../lib/regional-cpf-counsel'

const base = process.env.NEXT_PUBLIC_BASE_PATH || ''
const card = { background: 'var(--rbl-surface)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 16, padding: 20, marginBottom: 16 } as const
const prose = { margin: '0 0 12px', color: 'var(--rbl-text-body)', fontSize: 16.5, lineHeight: 1.6, maxWidth: '75ch' } as const
const h2 = { margin: '0 0 8px', color: 'var(--rbl-title)', fontSize: 22 } as const
const h3 = { margin: '16px 0 6px', color: 'var(--rbl-title)', fontSize: 18 } as const
const link = { color: 'var(--rbl-link)', fontWeight: 600 } as const
const quote = { margin: '0 0 12px', padding: '10px 14px', background: 'var(--rbl-surface-2)', borderRadius: 10, color: 'var(--rbl-text-strong)', fontSize: 15.5, lineHeight: 1.6, maxWidth: '75ch' } as const
const cell = { padding: '8px 10px', verticalAlign: 'top' } as const
const num = { ...cell, textAlign: 'right', whiteSpace: 'nowrap' } as const
const head = { ...cell, fontWeight: 600, fontSize: 13, color: 'var(--rbl-text-muted)' } as const
const usd = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
const pct = (n: number) => `${(n * 100).toFixed(n < 0.1 ? 1 : 0)}%`
const longDate = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

export const metadata = {
  title: 'Regional CPF counsel and the home rule question',
  description:
    'The $400-an-hour regional Community Preservation Fund attorney the Town Board tabled on November 5, 2026: what the 2024 state law requires, what the contract says, what it could cost Riverhead, and why the Board says it had no choice.',
}

export default function RegionalCpfCounselPage() {
  const timeline = [
    { date: bill.senateVote.date, text: `The State Senate passes ${bill.number}, ${bill.senateVote.ayes}–${bill.senateVote.nays}. The Assembly passes it the next day.` },
    { date: bill.signed, text: `The Governor signs it as ${bill.chapter}. It takes effect ${bill.effective}, and adds subdivision 14 to Town Law § 64-e.` },
    { date: retainer.proposalDate, text: `${retainer.counsel} submits her proposal to serve as regional counsel, according to the retainer agreement.` },
    { date: deadline, text: 'The law’s deadline: 90 days after it took effect, the office of regional counsel and the advisory committee were to be in place.' },
    { date: ima.date, text: `The Town Board adopts resolution ${ima.number}, 5–0, authorizing the intermunicipal agreement “notwithstanding stated objection.”` },
    { date: retainer.date, text: `The Board tables resolution ${retainer.number}, 5–0, which would have signed the retainer with regional counsel.` },
  ]

  return (
    <PageShell
      title="Regional CPF counsel"
      subtitle="A 2024 state law requires the five East End towns to share a lawyer for their Community Preservation Funds. On November 5, 2026 Riverhead's Town Board tabled the contract. Here is what the law, the contract and the Town's own resolutions say."
    >
      <PlainCallout
        tips={[
          { label: 'The fund', text: 'the Community Preservation Fund is the 2% tax on real-estate sales in the five East End towns that pays for farmland, open space and historic preservation.' },
          { label: 'The new office', text: 'a regional counsel gives legal opinions on how the towns run their funds, and attends a new 11-member regional advisory committee.' },
          { label: 'Home rule', text: 'New York’s constitution lets the State pass a law aimed at particular local governments only if they ask for it, with some exceptions. The Town’s own resolution says this law passed without one.' },
        ]}
      >
        On November 5, 2026 the Board voted 5–0 to table resolution {retainer.number}, a retainer with {retainer.counsel} as regional
        Community Preservation Fund counsel at <strong>{usd(retainer.rate)} an hour</strong> plus expenses, split among the five towns by
        their shares of CPF revenue. Eleven months earlier the Board had approved the agreement among the towns that creates the office,
        saying a 2024 state law <strong>compelled</strong> it and had passed without a home rule message or consultation with Riverhead.
      </PlainCallout>

      <section id="law" aria-labelledby="law-heading" style={card}>
        <h2 id="law-heading" style={h2}>What the state law requires</h2>
        <p style={prose}>
          {bill.chapter}, sponsored by {bill.senateSponsor} and {bill.assemblySponsor}, rewrote parts of Town Law § 64-e, the law behind the
          fund. It changed how the fund can pay for water-quality projects and land stewardship, and added a new subdivision 14:
        </p>
        <blockquote style={quote}>&ldquo;{statute.counsel}&rdquo;</blockquote>
        <p style={prose}>It also creates a regional advisory committee to advise the town boards:</p>
        <blockquote style={quote}>&ldquo;{statute.committee}.&rdquo;</blockquote>
        <blockquote style={quote}>&ldquo;{statute.deadline}&rdquo;</blockquote>
        <p style={prose}>
          The sponsors&apos; memo lists the fiscal implications as &ldquo;{bill.memoFiscal}.&rdquo; The law does not say how the counsel is
          paid; the towns&apos; agreement does. Sources: <a href={sources.statute.url} style={link}>{sources.statute.label}</a>;{' '}
          <a href={sources.bill.url} style={link}>{sources.bill.label}</a>.
        </p>
      </section>

      <section id="timeline" aria-labelledby="timeline-heading" style={card}>
        <h2 id="timeline-heading" style={h2}>How it got here</h2>
        <ol style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {timeline.map((t) => (
            <li key={t.date} style={{ padding: '10px 0', borderTop: '1px solid var(--rbl-border-subtle)', display: 'grid', gridTemplateColumns: 'minmax(104px, 170px) 1fr', gap: 12 }}>
              <span style={{ color: 'var(--rbl-text-muted)', fontSize: 14.5, fontWeight: 600 }}>{longDate(t.date)}</span>
              <span style={{ color: 'var(--rbl-text-body)', fontSize: 15.5, lineHeight: 1.55 }}>{t.text}</span>
            </li>
          ))}
        </ol>
        <p style={{ ...prose, marginTop: 12 }}>
          Riverhead approved the agreement about eight months after the law&apos;s 90-day deadline, and the retainer it tabled would run
          for the {retainer.date.slice(0, 4)} calendar year, which had less than two months left.
        </p>
      </section>

      <section id="contract" aria-labelledby="contract-heading" style={card}>
        <h2 id="contract-heading" style={h2}>What the contract says</h2>
        <p style={prose}>From the retainer agreement attached to resolution {retainer.number}, in its own words:</p>
        <ul style={prose}>
          <li><strong>Rate:</strong> {usd(retainer.rate)} an hour, &ldquo;together with {retainer.expenses}.&rdquo;</li>
          <li><strong>Bills:</strong> &ldquo;{retainer.invoices}.&rdquo;</li>
          <li><strong>Who pays:</strong> each town &ldquo;{retainer.share}.&rdquo; &ldquo;{retainer.cap}&rdquo;</li>
          <li><strong>Term:</strong> &ldquo;{retainer.term}.&rdquo;</li>
          <li><strong>Account:</strong> &ldquo;{retainer.paidFrom}&rdquo;</li>
        </ul>
        <p style={prose}>
          The resolution&apos;s Fiscal Impact Statement, dated {longDate(retainer.fisDate)}, says the cost has a fiscal impact that can be
          absorbed by existing resources, and names no account. The agreement among the towns it refers to, and the counsel&apos;s
          proposal, were not attached to either packet this site holds. Source: <a href={sources.packet2026.url} style={link}>{sources.packet2026.label}</a>.
        </p>
      </section>

      <section id="cost" aria-labelledby="cost-heading" style={card}>
        <h2 id="cost-heading" style={h2}>What it could cost Riverhead</h2>
        <p style={prose}>
          No one has said how many hours the counsel will work, and {meeting.shares.who} said the Town had received no invoices. At the
          meeting he put Riverhead&apos;s share of regional CPF revenue at about <strong>{pct(meeting.shares.riverhead)}</strong> in{' '}
          {meeting.shares.year}, against {pct(meeting.shares.southampton)} for Southampton and {pct(meeting.shares.eastHampton)} for East
          Hampton, as RiverheadLOCAL reported. The share is recalculated each year. At that share, Riverhead&apos;s part of a bill would be:
        </p>
        <div style={{ overflowX: 'auto' }}>
          <table className="rbl-stack" style={{ width: '100%', maxWidth: 560, borderCollapse: 'collapse', fontSize: 14.5 }}>
            <caption style={{ textAlign: 'left', color: 'var(--rbl-text-muted)', fontSize: 13, padding: '0 0 6px' }}>
              Illustration only, at {usd(retainer.rate)} an hour and a {pct(meeting.shares.riverhead)} share, before expenses.
            </caption>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--rbl-border)' }}>
                <th scope="col" style={{ ...head, textAlign: 'left' }}>Hours billed</th>
                <th scope="col" style={{ ...head, textAlign: 'right' }}>All five towns</th>
                <th scope="col" style={{ ...head, textAlign: 'right' }}>Riverhead&apos;s share</th>
              </tr>
            </thead>
            <tbody>
              {illustrativeHours.map(shareOfBill).map((r) => (
                <tr key={r.hours} style={{ borderBottom: '1px solid var(--rbl-border-subtle)' }}>
                  <th scope="row" style={{ ...cell, textAlign: 'left', fontWeight: 600 }}>{r.hours} hours</th>
                  <td data-label="All five towns" style={num}>{usd(r.region)}</td>
                  <td data-label="Riverhead's share" style={num}>{usd(r.riverhead)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ ...prose, marginTop: 12 }}>
          {riverheadCpf2023 && riverheadCpf2023.transferTaxRevenue != null ? (
            <>Riverhead&apos;s own fund took in {usd(riverheadCpf2023.transferTaxRevenue)} in transfer tax in {riverheadCpf2023.year}, and{' '}
            {usd(riverheadCpfLatest.transferTaxRevenue ?? 0)} in {riverheadCpfLatest.year}, from its audited statements. </>
          ) : null}
          The dollar risk to Riverhead is small. The Board&apos;s questions were about who controls the opinions the counsel gives.{' '}
          <a href={`${base}/community-preservation-fund/`} style={link}>See Riverhead&apos;s CPF revenue and debt</a>.
        </p>
      </section>

      <section id="home-rule" aria-labelledby="home-rule-heading" style={card}>
        <h2 id="home-rule-heading" style={h2}>The home rule question</h2>
        <p style={prose}>
          Article IX of New York&apos;s constitution limits the Legislature&apos;s power over a particular local government&apos;s
          &ldquo;property, affairs or government.&rdquo; A law that applies to some towns and not others is a special law, and the
          Legislature may pass one only if the local government asks for it with a home rule request, or if the Governor certifies an emergency
          and two-thirds of each house votes for it. Municipal Home Rule Law § 40 sets out how a town board makes the request.
          Source: <a href={sources.homeRuleLaw.url} style={link}>{sources.homeRuleLaw.label}</a>.
        </p>
        <p style={prose}>Town Law § 64-e applies only to the five Peconic Bay towns. In resolution {ima.number}, the Town Board recorded that the 2024 amendment was proposed</p>
        <blockquote style={quote}>&ldquo;{ima.quotes.noHomeRule}&rdquo;</blockquote>
        <p style={prose}>and that</p>
        <blockquote style={quote}>&ldquo;{ima.quotes.noConsultation}.&rdquo;</blockquote>
        <p style={prose}>It then resolved that</p>
        <blockquote style={quote}>&ldquo;{ima.quotes.compelled}&rdquo;</blockquote>
        <p style={prose}>
          and found that &ldquo;{ima.quotes.fair}.&rdquo; Members voting aye: {ima.ayes.join(', ')}. Source:{' '}
          <a href={sources.packet2025.url} style={link}>{sources.packet2025.label}</a>.
        </p>
        <p style={prose}>
          The bill&apos;s record on the Senate&apos;s site lists no home rule request. Whether this law needed one is a legal question
          this site does not answer. Courts have upheld some laws aimed at particular places without a request, where the law serves a
          substantial state concern, and the fund itself exists under a state law that applies only to these five towns. What the record does show is that the
          Board objected in writing, approved the agreement anyway because it read the law as binding, and has not signed the counsel&apos;s
          retainer.
        </p>
      </section>

      <section id="meeting" aria-labelledby="meeting-heading" style={card}>
        <h2 id="meeting-heading" style={h2}>What was said on November 5</h2>
        <p style={prose}>As RiverheadLOCAL reported:</p>
        <blockquote style={quote}>{meeting.merrifield}</blockquote>
        <blockquote style={quote}>{meeting.rothwell}</blockquote>
        <blockquote style={quote}>{meeting.noInvoices}</blockquote>
        <p style={prose}>Residents at public comment asked:</p>
        <ul style={prose}>{meeting.publicComment.map((q) => <li key={q}>{q};</li>)}</ul>
        <p style={prose}>Source: <a href={sources.news.url} style={link}>{sources.news.label}</a>.</p>
      </section>

      <section id="questions" aria-labelledby="questions-heading" style={card}>
        <h2 id="questions-heading" style={h2}>Questions residents can ask</h2>
        <ul style={prose}>
          <li>Will the agreement among the five towns, and the counsel&apos;s January 10, 2025 proposal, be published?</li>
          <li>Which account would pay Riverhead&apos;s share, if the contract says a capital budget account and the Fiscal Impact Statement names none?</li>
          <li>Are the counsel&apos;s opinions binding on Riverhead&apos;s Town Board, or advice it can decline?</li>
          <li>Has any opinion been given yet? The law requires each one to be published on every town&apos;s website.</li>
          <li>Did the Town ask its State legislators to amend or repeal subdivision 14, and what did they say?</li>
        </ul>
        <p style={prose}>
          The Town&apos;s other legal spending is on <a href={`${base}/legal-costs/`} style={link}>Legal costs</a>.
        </p>
      </section>
    </PageShell>
  )
}
