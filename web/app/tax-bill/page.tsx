import PageShell from '../../components/PageShell'
import PlainCallout from '../../components/PlainCallout'
import TaxBillEstimator from '../../components/TaxBillEstimator'
import data from '../../public/data/tax-bill.json'

export const metadata = {
  title: 'My tax bill — what would I actually pay?',
  description:
    "Estimate the Town's portion of your property-tax bill using Riverhead's own published 2026 rate table.",
}

export default function TaxBillPage() {
  return (
    <PageShell title={data.title} subtitle={data.intro}>
      <PlainCallout
        tips={[
          { label: 'Assessed value, not market value', text: "New York towns bill against the assessed value on the roll. Suffolk County towns assess at a small fraction of market value, not 100% — Riverhead's uniform percentage was about 8.34% as of the most recent roll referenced here." },
          { label: 'Town portion only', text: 'County, school, fire, and library taxes are separate line items on your real bill.' },
        ]}
      >
        These rates come straight from the {data.rateSource.title} ({data.rateSource.note}) — not an estimate.
      </PlainCallout>

      <TaxBillEstimator rates2026={data.rates2026} rates2025={data.rates2025} residentialAssessmentRatio={data.equalization.residentialAssessmentRatio} />

      <p style={{ color: '#64748b', fontSize: 13, lineHeight: 1.55, marginTop: 16 }}>
        Source: <a href={data.rateSource.url} style={{ color: '#1f5f8f', fontWeight: 700 }}>{data.rateSource.title}</a>.{' '}
        {data.equalization.note}
      </p>
    </PageShell>
  )
}
