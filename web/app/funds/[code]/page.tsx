import PageShell from '../../../components/PageShell'
import FundDrilldown from '../../../components/FundDrilldown'
import { allFundCodes, getFundDetail } from '../../../lib/subaccounts'
import { allOperatingFunds2026 } from '../../../lib/all-funds'

export function generateStaticParams() {
  return allFundCodes().map((code) => ({ code }))
}

export default async function FundDetailPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const fund = getFundDetail(code)
  const meta = allOperatingFunds2026.find((f) => f.code.toUpperCase() === code.toUpperCase())
  const base = '/rike4545-riverhead-budget-live'

  if (!fund) {
    return (
      <PageShell title="Fund not found" subtitle="No account-level detail is available for this fund code.">
        <a href={`${base}/funds/`} style={{ color: '#1f5f8f', fontWeight: 800 }}>← Back to Funds Explorer</a>
      </PageShell>
    )
  }

  return (
    <PageShell
      title={`${fund.name} (${fund.code})`}
      subtitle={meta?.description ?? `Account-level appropriations and revenues for the ${fund.name}.`}
    >
      <a href={`${base}/funds/`} style={{ color: '#1f5f8f', fontWeight: 800, display: 'inline-block', marginBottom: 14 }}>
        ← Back to Funds Explorer
      </a>
      <FundDrilldown fund={fund} />
    </PageShell>
  )
}
