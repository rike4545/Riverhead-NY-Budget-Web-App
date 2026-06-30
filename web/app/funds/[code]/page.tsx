import PageShell from '../../../components/PageShell'
import FundDrilldown from '../../../components/FundDrilldown'
import PlainCallout from '../../../components/PlainCallout'
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
      <PlainCallout
        tips={[
          { label: 'Departments', text: 'group the spending. Click one to expand it and see its individual spending lines.' },
          { label: 'The columns', text: 'show what was budgeted in 2024, 2025, and 2026, the change, and a mini trend line back to 2020.' },
          { label: 'Categories', text: 'Personal Services = salaries, Contractual = vendor/operating costs, Equipment = one-time purchases, Benefits = health/retirement.' },
        ]}
      >
        This is the detailed breakdown of one fund. It shows <strong>exactly what the money inside this fund is budgeted
        for</strong>, from big departments down to individual spending lines.
      </PlainCallout>
      <FundDrilldown fund={fund} />
    </PageShell>
  )
}
