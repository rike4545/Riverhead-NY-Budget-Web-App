import PageShell from '../../components/PageShell'
import PlainCallout from '../../components/PlainCallout'
import CampaignFinance from '../../components/CampaignFinance'
import EmployeeDonorWatch from '../../components/EmployeeDonorWatch'
import { nextFilingDeadline, riverheadContributionLimits } from '../../lib/campaign-finance'
import data from '../../public/data/campaign-finance.json'

export const metadata = {
  title: "Campaign finance — who's funding the Town Board",
  description:
    "Every current and recent Town Board member's campaign committee, live from New York State's open campaign-finance disclosure data.",
}

export default function CampaignFinancePage() {
  const deadline = nextFilingDeadline()

  return (
    <PageShell title={data.title} subtitle={data.intro}>
      {deadline && deadline.label !== 'General Election Day' && (
        <div style={{
          background: '#fff7e6', border: '1px solid #f0d999', borderLeft: '6px solid #c99a2e',
          borderRadius: 12, padding: '12px 16px', marginBottom: 16, fontSize: 14, color: '#5f430d',
        }}>
          <strong>Next filing deadline: {deadline.label}</strong> — due {deadline.date} ({deadline.periodNote}).
          Every committee tracked below is required to file by this date. Source:{' '}
          <a href="https://elections.ny.gov/system/files/documents/2025/12/2026-filing-calendar-12112025-approved.secure.accessible.pdf" style={{ color: '#8a6a1f', fontWeight: 800 }}>
            NY BOE 2026 filing calendar
          </a>.
        </div>
      )}
      <PlainCallout title="Where this comes from">
        These figures come straight from New York State&apos;s open campaign-finance data (
        <a href="https://data.ny.gov" style={{ color: '#4a7297', fontWeight: 800 }}>
          data.ny.gov
        </a>
        ), covering {data.campaignFilingStartYear}–{data.campaignFilingEndYear}. The numbers shown on page load are a
        snapshot; tap the refresh button on any card section to pull the latest filings live.
      </PlainCallout>

      <CampaignFinance
        officials={data.officials}
        startYear={data.campaignFilingStartYear}
        endYear={data.campaignFilingEndYear}
      />

      <div style={{ marginTop: 18 }}>
        <EmployeeDonorWatch
          officials={data.officials}
          startYear={data.campaignFilingStartYear}
          endYear={data.campaignFilingEndYear}
        />
      </div>

      <div style={{ marginTop: 18 }}>
        <PlainCallout
          title="What NY law actually limits, for a Riverhead Town race"
          tips={[
            { label: 'Most donors', text: 'capped at the number of registered voters in the district × $0.05 (minimum $1,000) — a limit that scales with the size of the race, not a flat dollar figure.' },
            { label: 'Family donors', text: 'child, parent, grandparent, sibling, or the spouse of any of those get a higher cap — the greater of (registered voters × $0.25) or $1,250.' },
            { label: "The candidate's own money", text: "no cap at all. New York's self-funding limit only applies to candidates in the state's public campaign-financing program — local town races aren't part of it, so a candidate (or, per the cap above, their family) can put in far more than any ordinary donor could." },
          ]}
        >
          <p style={{ marginTop: 0 }}>
            This is the general shape of the law (NY Election Law § 14-114) — those formulas produce an actual dollar
            cap once you know the district&apos;s registered-voter count. For a Riverhead Town race, the Business
            Council of New York State computed that cap as of {riverheadContributionLimits.asOfYear}:
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 10, margin: '10px 0' }}>
            <LimitCard label="General election" individual={riverheadContributionLimits.general.individual} family={riverheadContributionLimits.general.family} />
            <LimitCard label="Democratic primary" individual={riverheadContributionLimits.democraticPrimary.individual} family={riverheadContributionLimits.democraticPrimary.family} />
            <LimitCard label="Republican primary" individual={riverheadContributionLimits.republicanPrimary.individual} family={riverheadContributionLimits.republicanPrimary.family} />
          </div>
          <p style={{ marginBottom: 0 }}>
            Registered-voter counts (and therefore these dollar caps) shift over time, so treat these as a concrete,
            real reference point rather than a guarantee for the current cycle — confirm the up-to-date figure with
            the Suffolk County Board of Elections&apos; own Comprehensive Limits Report before treating any specific
            donor or committee as over or under the line. Source: {riverheadContributionLimits.source}.
          </p>
        </PlainCallout>
      </div>
    </PageShell>
  )
}

function LimitCard({ label, individual, family }: { label: string; individual: number; family: number }) {
  const usd = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(n)
  return (
    <div style={{ background: 'white', border: '1px solid #f0d999', borderRadius: 10, padding: 12 }}>
      <div style={{ fontWeight: 800, color: '#5f430d', fontSize: 13 }}>{label}</div>
      <div style={{ fontSize: 13, color: '#5f430d', marginTop: 6 }}>
        Individual: <strong>{usd(individual)}</strong>
      </div>
      <div style={{ fontSize: 13, color: '#5f430d', marginTop: 2 }}>
        Family: <strong>{usd(family)}</strong>
      </div>
    </div>
  )
}
