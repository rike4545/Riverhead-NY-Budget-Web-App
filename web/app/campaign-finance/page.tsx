import PageShell from '../../components/PageShell'
import PlainCallout from '../../components/PlainCallout'
import CampaignFinance from '../../components/CampaignFinance'
import EmployeeDonorWatch from '../../components/EmployeeDonorWatch'
import UnofficialElectionResult from '../../components/UnofficialElectionResult'
import { nextFilingDeadline, riverheadContributionLimits } from '../../lib/campaign-finance'
import CampaignSummaryTable from '../../components/CampaignSummaryTable'
import { campaignFacts, campaignOfficials, totalsSource } from '../../lib/campaign-officials'
import general2026 from '../../public/data/campaign-finance-2026-general.json'

export const metadata = {
  title: "Campaign finance — who's funding the Town Board",
  description:
    "Explore Riverhead Town Board campaign committees, contribution patterns, employee-donor matches, and New York contribution limits.",
}

const sectionLinkStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '13px 15px',
  border: '1px solid var(--rbl-border-subtle)',
  borderRadius: 12,
  background: 'var(--rbl-surface)',
  color: 'var(--rbl-title)',
  textDecoration: 'none',
  fontWeight: 800,
  fontSize: 14,
  minHeight: 48,
} as const

export default function CampaignFinancePage() {
  const deadline = nextFilingDeadline()

  return (
    <PageShell title={campaignFacts.title} subtitle={campaignFacts.intro}>
      <div style={{
        display: 'flex', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap',
        padding: '14px 16px', marginBottom: 16, borderRadius: 14,
        background: 'var(--rbl-info-bg)', border: '1px solid var(--rbl-info-border)',
      }}>
        <div style={{ flex: '1 1 260px' }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--rbl-accent)' }}>
            Public disclosure records
          </div>
          <div style={{ color: 'var(--rbl-title)', fontWeight: 800, fontSize: 16, marginTop: 3 }}>
            Follow the money, then inspect the underlying filings
          </div>
          <p style={{ margin: '5px 0 0', color: 'var(--rbl-text-body)', fontSize: 13, lineHeight: 1.55 }}>
            This independent project organizes New York State campaign-finance records for current and recent Riverhead officials.
            Snapshot figures are not the same as a complete audit; use the refresh controls to check the latest available filings.
          </p>
        </div>
        <div style={{ flex: '0 1 230px', fontSize: 12, color: 'var(--rbl-text-muted)', lineHeight: 1.55 }}>
          <strong style={{ color: 'var(--rbl-title)' }}>Coverage</strong><br />
          {campaignFacts.startYear}–{campaignFacts.endYear} · NY Open Data
          <br />
          <a href="https://data.ny.gov" style={{ color: 'var(--rbl-accent)', fontWeight: 800 }}>Open data source ↗</a>
        </div>
      </div>

      {deadline && deadline.label !== 'General Election Day' && (
        <div style={{
          background: 'var(--rbl-warn-bg)', border: '1px solid var(--rbl-gold-border)',
          borderRadius: 12, padding: '12px 16px', marginBottom: 16, fontSize: 14, color: 'var(--rbl-warn-strong)',
        }}>
          <strong>Next filing deadline: {deadline.label}</strong> — due {deadline.date} ({deadline.periodNote}).
          Filing obligations vary by committee and filing status; consult the official calendar for the applicable requirement. Source:{' '}
          <a href="https://elections.ny.gov/system/files/documents/2025/12/2026-filing-calendar-12112025-approved.secure.accessible.pdf" style={{ color: 'var(--rbl-warn)', fontWeight: 800 }}>
            NY BOE 2026 filing calendar ↗
          </a>.
        </div>
      )}

      <nav aria-label="Campaign finance page sections" style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(205px, 1fr))', gap: 10, marginBottom: 24,
      }}>
        <a href="#at-a-glance" style={sectionLinkStyle}><span aria-hidden="true">01</span><span>Every committee at a glance</span></a>
        <a href="#candidate-records" style={sectionLinkStyle}><span aria-hidden="true">02</span><span>Candidate & committee records</span></a>
        <a href="#general-2026-reports" style={sectionLinkStyle}><span aria-hidden="true">02a</span><span>2026 General reports (32-Day, 11-Day)</span></a>
        <a href="#employee-donors" style={sectionLinkStyle}><span aria-hidden="true">03</span><span>Town employee donor matches</span></a>
        <a href="#contribution-limits" style={sectionLinkStyle}><span aria-hidden="true">04</span><span>Contribution limits</span></a>
        <a href="#reading-schedules" style={sectionLinkStyle}><span aria-hidden="true">05</span><span>Reading a filing</span></a>
        <a href="#data-notes" style={sectionLinkStyle}><span aria-hidden="true">i</span><span>Sources & interpretation</span></a>
      </nav>

      <UnofficialElectionResult />

      <CampaignSummaryTable officials={campaignOfficials} startYear={campaignFacts.startYear} endYear={campaignFacts.endYear} source={totalsSource} />

      <section id="candidate-records" style={{ scrollMarginTop: 20 }}>
        <div style={{ marginBottom: 12 }}>
          <h2 style={{ margin: 0, color: 'var(--rbl-title)', fontSize: 22 }}>Candidate & committee records</h2>
          <p style={{ margin: '5px 0 0', color: 'var(--rbl-text-muted)', fontSize: 14, lineHeight: 1.55 }}>
            Start with the individual records. Refresh pulls current data where available; committee history and candidate history may not align one-to-one.
          </p>
        </div>
        <CampaignFinance
          officials={campaignOfficials}
          startYear={campaignFacts.startYear}
          endYear={campaignFacts.endYear}
          generalReports={general2026}
        />
      </section>

      <section id="employee-donors" style={{ marginTop: 28, scrollMarginTop: 20 }}>
        <div style={{ marginBottom: 12 }}>
          <h2 style={{ margin: 0, color: 'var(--rbl-title)', fontSize: 22 }}>Town employee donor matches</h2>
          <p style={{ margin: '5px 0 0', color: 'var(--rbl-text-muted)', fontSize: 14, lineHeight: 1.55 }}>
            A separate name-matching tool compares employee payroll records with disclosed individual donors. A name match is a lead for review, not proof of identity, influence, or wrongdoing.
          </p>
        </div>
        <EmployeeDonorWatch
          officials={campaignOfficials}
          startYear={campaignFacts.startYear}
          endYear={campaignFacts.endYear}
        />
      </section>

      <section id="contribution-limits" style={{ marginTop: 28, scrollMarginTop: 20 }}>
        <h2 style={{ margin: '0 0 12px', color: 'var(--rbl-title)', fontSize: 22 }}>What contribution limits apply?</h2>
        <PlainCallout
          title="Riverhead Town races in 2026, from the County's own index"
          tips={[
            { label: 'Most individual donors', text: 'The ordinary limit is generally based on registered voters in the district × $0.05, subject to a $1,000 minimum.' },
            { label: 'Qualifying family donors', text: 'Certain close family members may be subject to a separate higher limit based on registered voters × $0.25, subject to a $1,250 minimum.' },
            { label: "Candidate's own money", text: "A candidate's personal contributions are generally not subject to the ordinary contribution cap for local town races. Different rules can apply under the State public campaign-financing program." },
          ]}
        >
          <p style={{ marginTop: 0 }}>
            New York Election Law § 14-114 sets rules that depend on the race, donor relationship, and applicable election cycle.
            The Suffolk County Board of Elections sets each town&apos;s limits every year from its voter counts. Its {riverheadContributionLimits.asOfYear} index gives these for the Town of Riverhead:
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 10, margin: '10px 0' }}>
            <LimitCard label="General election" individual={riverheadContributionLimits.general.individual} family={riverheadContributionLimits.general.family} />
            <LimitCard label="Democratic primary" individual={riverheadContributionLimits.democraticPrimary.individual} family={riverheadContributionLimits.democraticPrimary.family} />
            <LimitCard label="Republican primary" individual={riverheadContributionLimits.republicanPrimary.individual} family={riverheadContributionLimits.republicanPrimary.family} />
          </div>
          <p style={{ marginBottom: 0 }}>
            A limit is per donor and per election, and some donors (a candidate&apos;s own money, family members) follow different
            rules. Before reading a gift as over the limit, check the filing itself: whether it is one gift or several, for
            the primary or the general, and from whom.
            Source: <a href={riverheadContributionLimits.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--rbl-link)', fontWeight: 600 }}>{riverheadContributionLimits.source}</a>.
          </p>
        </PlainCallout>
      </section>

      <section id="reading-schedules" aria-labelledby="reading-schedules-heading" style={{ marginTop: 28, scrollMarginTop: 20 }}>
        <h2 id="reading-schedules-heading" style={{ margin: '0 0 8px', color: 'var(--rbl-title)', fontSize: 22 }}>Money, in-kind and LLC gifts: how a filing shows them</h2>
        <p style={{ margin: '0 0 12px', color: 'var(--rbl-text-body)', fontSize: 15.5, lineHeight: 1.6, maxWidth: '72ch' }}>
          A committee lists every contribution on a lettered schedule. The letter tells you what kind of gift it was and who gave
          it, so it is the first thing to check when a donor and a filing seem to tell different stories. The schedule names
          below are the State Board of Elections&apos; own, as the open data prints them.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 12 }}>
          {SCHEDULES.map((s) => (
            <div key={s.letter} style={{ background: 'var(--rbl-surface)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 12, padding: 14 }}>
              <div style={{ color: 'var(--rbl-title)', fontWeight: 700, fontSize: 15.5 }}>Schedule {s.letter}</div>
              <div style={{ color: 'var(--rbl-text-muted)', fontSize: 13.5, margin: '2px 0 6px' }}>&ldquo;{s.name}&rdquo;</div>
              <p style={{ margin: 0, color: 'var(--rbl-text-body)', fontSize: 14.5, lineHeight: 1.55 }}>{s.text}</p>
            </div>
          ))}
        </div>
        <div style={{ height: 14 }} aria-hidden="true" />
        <PlainCallout
          title="When a donor's account and the filing differ"
          tips={[
            { label: 'Check the letter and the payment', text: 'a gift filed on Schedule A, B or C with a check number was reported as money. A discount or donated work should be on Schedule D, valued at what it was worth.' },
            { label: 'Ask the treasurer', text: "the committee, not the donor, files the report. If it is wrong, the committee's treasurer can file an amended report, and the open data marks amended reports." },
            { label: 'Not a finding', text: 'a mismatch is usually a bookkeeping error, and the State Board of Elections, not this site, decides whether a filing breaks the rules.' },
          ]}
        >
          <p style={{ margin: 0 }}>
            A donor may describe a gift one way while the committee reported it another way: a discount filed as a check, or a
            personal gift filed as a business&apos;s. Neither is proof of wrongdoing, but the public record should match what happened.
          </p>
        </PlainCallout>
      </section>

      <section id="data-notes" style={{ marginTop: 24, scrollMarginTop: 20 }}>
        <details style={{ border: '1px solid var(--rbl-border-subtle)', borderRadius: 12, background: 'var(--rbl-surface)', padding: '13px 16px' }}>
          <summary style={{ cursor: 'pointer', color: 'var(--rbl-title)', fontWeight: 800 }}>
            Sources, coverage & how to read this page
          </summary>
          <div style={{ color: 'var(--rbl-text-body)', fontSize: 13, lineHeight: 1.65, marginTop: 10 }}>
            <p>
              The page uses New York State&apos;s open campaign-finance data from data.ny.gov, with a local snapshot for initial display and live refresh controls for updated records. Coverage shown here is {campaignFacts.startYear}–{campaignFacts.endYear}.
            </p>
            <ul>
              <li>Candidate registrations and committee/filer records are separate records and may have different statuses.</li>
              <li>Where historical committees are combined, the page notes the scope so a committee total is not mistaken for a single election total.</li>
              <li>Missing activity in a snapshot does not necessarily mean no contribution occurred; check live data and source filings.</li>
              <li>Employee-donor matches rely on names and can produce false positives or miss name variations. They are not findings of misconduct.</li>
              <li>Contribution-limit figures are dated references. Current compliance requires the current limits and complete filing context.</li>
            </ul>
          </div>
        </details>
      </section>
    </PageShell>
  )
}

/** The contribution schedules, named as data.ny.gov's campaign finance dataset (e9ss-239a) prints them. */
const SCHEDULES = [
  { letter: 'A', name: 'Monetary Contributions Received From Ind. & Part.', text: 'Money from a person or a partnership: cash, check, card or an online payment.' },
  { letter: 'B', name: 'Monetary Contributions Received From Corporation', text: "Money from a corporation's own funds. A business owner's personal gift belongs on Schedule A instead." },
  { letter: 'C', name: 'Monetary Contributions Received From All Other', text: 'Money from anyone else, such as a limited liability company (LLC), a union or a political committee.' },
  { letter: 'D', name: 'In-Kind (Non-Monetary) Contributions Received', text: "Goods or services given to the campaign instead of money, such as printing, food or work, recorded at what they were worth. A discount the business does not give everyone generally counts too, at the amount taken off. In-kind gifts count toward the same limits as money." },
  { letter: 'O', name: 'LLCs/Partnership/Subcontractor', text: "Who stands behind a gift from an LLC or partnership: the filing splits the amount among its members, so the same gift appears here as well as on Schedule C." },
]

function LimitCard({ label, individual, family }: { label: string; individual: number; family: number }) {
  const usd = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(n)
  return (
    <div style={{ background: 'var(--rbl-surface)', border: '1px solid var(--rbl-gold-border)', borderRadius: 10, padding: 12 }}>
      <div style={{ fontWeight: 800, color: 'var(--rbl-warn-strong)', fontSize: 13 }}>{label}</div>
      <div style={{ fontSize: 13, color: 'var(--rbl-warn-strong)', marginTop: 6 }}>
        Individual: <strong>{usd(individual)}</strong>
      </div>
      <div style={{ fontSize: 13, color: 'var(--rbl-warn-strong)', marginTop: 2 }}>
        Family: <strong>{usd(family)}</strong>
      </div>
    </div>
  )
}
