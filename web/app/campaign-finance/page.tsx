import PageShell from '../../components/PageShell'
import PlainCallout from '../../components/PlainCallout'
import CampaignFinance from '../../components/CampaignFinance'
import EmployeeDonorWatch from '../../components/EmployeeDonorWatch'
import { nextFilingDeadline } from '../../lib/campaign-finance'
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
        <a href="https://data.ny.gov" style={{ color: '#1f5f8f', fontWeight: 800 }}>
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
          title="What NY law actually limits"
          tips={[
            { label: 'Most donors', text: 'capped at the number of registered voters in the district × $0.05 — a limit that scales with the size of the race, not a flat dollar figure.' },
            { label: 'Family donors', text: 'child, parent, grandparent, sibling, or the spouse of any of those get a higher cap — the greater of (registered voters × $0.25) or $1,250.' },
            { label: "The candidate's own money", text: "no cap at all. New York's self-funding limit only applies to candidates in the state's public campaign-financing program — local town races aren't part of it, so a candidate (or, per the cap above, their family) can put in far more than any ordinary donor could." },
          ]}
        >
          Every dollar amount on this page is real. The specific legal cap for any one committee isn&apos;t shown here —
          it depends on the registered-voter count for that exact race and year, which we haven&apos;t verified for each
          committee. This is the general shape of the law (NY Election Law § 14-114), not a computed pass/fail for any
          donor or committee. Confirm specifics with the NY State or Suffolk County Board of Elections before treating
          any number as authoritative.
        </PlainCallout>
      </div>
    </PageShell>
  )
}
