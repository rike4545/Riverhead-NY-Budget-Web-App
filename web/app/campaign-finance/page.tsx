import PageShell from '../../components/PageShell'
import PlainCallout from '../../components/PlainCallout'
import CampaignFinance from '../../components/CampaignFinance'
import EmployeeDonorWatch from '../../components/EmployeeDonorWatch'
import { nextFilingDeadline, riverheadContributionLimits } from '../../lib/campaign-finance'
import data from '../../public/data/campaign-finance.json'

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
    <PageShell title={data.title} subtitle={data.intro}>
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
          {data.campaignFilingStartYear}–{data.campaignFilingEndYear} · NY Open Data
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
        <a href="#candidate-records" style={sectionLinkStyle}><span aria-hidden="true">01</span><span>Candidate & committee records</span></a>
        <a href="#employee-donors" style={sectionLinkStyle}><span aria-hidden="true">02</span><span>Town employee donor matches</span></a>
        <a href="#contribution-limits" style={sectionLinkStyle}><span aria-hidden="true">03</span><span>Contribution limits</span></a>
        <a href="#data-notes" style={sectionLinkStyle}><span aria-hidden="true">i</span><span>Sources & interpretation</span></a>
      </nav>

      <section id="candidate-records" style={{ scrollMarginTop: 20 }}>
        <div style={{ marginBottom: 12 }}>
          <h2 style={{ margin: 0, color: 'var(--rbl-title)', fontSize: 22 }}>Candidate & committee records</h2>
          <p style={{ margin: '5px 0 0', color: 'var(--rbl-text-muted)', fontSize: 14, lineHeight: 1.55 }}>
            Start with the individual records. Refresh pulls current data where available; committee history and candidate history may not align one-to-one.
          </p>
        </div>
        <CampaignFinance
          officials={data.officials}
          startYear={data.campaignFilingStartYear}
          endYear={data.campaignFilingEndYear}
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
          officials={data.officials}
          startYear={data.campaignFilingStartYear}
          endYear={data.campaignFilingEndYear}
        />
      </section>

      <section id="contribution-limits" style={{ marginTop: 28, scrollMarginTop: 20 }}>
        <h2 style={{ margin: '0 0 12px', color: 'var(--rbl-title)', fontSize: 22 }}>What contribution limits apply?</h2>
        <PlainCallout
          title="Riverhead Town race — reference figures, not a current compliance determination"
          tips={[
            { label: 'Most individual donors', text: 'The ordinary limit is generally based on registered voters in the district × $0.05, subject to a $1,000 minimum.' },
            { label: 'Qualifying family donors', text: 'Certain close family members may be subject to a separate higher limit based on registered voters × $0.25, subject to a $1,250 minimum.' },
            { label: "Candidate's own money", text: "A candidate's personal contributions are generally not subject to the ordinary contribution cap for local town races. Different rules can apply under the State public campaign-financing program." },
          ]}
        >
          <p style={{ marginTop: 0 }}>
            New York Election Law § 14-114 sets rules that depend on the race, donor relationship, and applicable election cycle.
            The Business Council of New York State published the following Riverhead reference figures as of {riverheadContributionLimits.asOfYear}:
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 10, margin: '10px 0' }}>
            <LimitCard label="General election" individual={riverheadContributionLimits.general.individual} family={riverheadContributionLimits.general.family} />
            <LimitCard label="Democratic primary" individual={riverheadContributionLimits.democraticPrimary.individual} family={riverheadContributionLimits.democraticPrimary.family} />
            <LimitCard label="Republican primary" individual={riverheadContributionLimits.republicanPrimary.individual} family={riverheadContributionLimits.republicanPrimary.family} />
          </div>
          <p style={{ marginBottom: 0 }}>
            Voter counts and limits can change. Do not use these historic reference amounts alone to allege a violation;
            check the current Suffolk County Board of Elections Comprehensive Limits Report and the underlying filing first.
            Source: {riverheadContributionLimits.source}.
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
              The page uses New York State&apos;s open campaign-finance data from data.ny.gov, with a local snapshot for initial display and live refresh controls for updated records. Coverage shown here is {data.campaignFilingStartYear}–{data.campaignFilingEndYear}.
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
