import PageShell from '../../components/PageShell'
import PlainCallout from '../../components/PlainCallout'
import CampaignFinance from '../../components/CampaignFinance'
import data from '../../public/data/campaign-finance.json'

export const metadata = {
  title: "Campaign finance — who's funding the Town Board",
  description:
    "Every current and recent Town Board member's campaign committee, live from New York State's open campaign-finance disclosure data.",
}

export default function CampaignFinancePage() {
  return (
    <PageShell title={data.title} subtitle={data.intro}>
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
    </PageShell>
  )
}
