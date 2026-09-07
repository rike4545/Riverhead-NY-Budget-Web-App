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
  const rateChange = data.rates2026.totalTownWide - data.rates2025.totalTownWide
  const rateChangePct = (rateChange / data.rates2025.totalTownWide) * 100

  return (
    <PageShell title={data.title} subtitle={data.intro}>
      <section style={{ background: 'var(--rbl-info-bg)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 16, padding: 18, marginBottom: 16 }}>
        <div style={{ color: 'var(--rbl-accent)', fontSize: 11.5, fontWeight: 950, textTransform: 'uppercase', letterSpacing: 0.5 }}>What changed</div>
        <h2 style={{ margin: '5px 0 6px', fontSize: 22 }}>The Town-wide rate rose from {data.rates2025.totalTownWide.toFixed(3)} to {data.rates2026.totalTownWide.toFixed(3)} per $1,000.</h2>
        <p style={{ margin: 0, color: 'var(--rbl-text-sub)', lineHeight: 1.5 }}>
          That is an increase of {rateChange.toFixed(3)} per $1,000, or about {rateChangePct.toFixed(1)}%. The calculator below translates that rate change into dollars for your property. Your actual total tax bill also includes county, school, fire, and library charges.
        </p>
      </section>

      <PlainCallout
        tips={[
          { label: 'Assessed value, not market value', text: "New York towns bill against the assessed value on the roll. Suffolk County towns assess at a small fraction of market value, not 100% — Riverhead's residential assessment ratio was 7.44% for the referenced 2025–2026 roll." },
          { label: 'Town portion only', text: 'County, school, fire, and library taxes are separate line items on your real bill.' },
          { label: 'Best input', text: 'If you have your current tax bill or assessment notice, use the assessed value printed there. The market-value option is only an approximation.' },
        ]}
      >
        These rates come straight from the {data.rateSource.title} ({data.rateSource.note}) — not an estimate.
      </PlainCallout>

      <TaxBillEstimator rates2026={data.rates2026} rates2025={data.rates2025} residentialAssessmentRatio={data.equalization.residentialAssessmentRatio} />

      <p style={{ color: 'var(--rbl-text-muted)', fontSize: 13, lineHeight: 1.55, marginTop: 16 }}>
        Source: <a href={data.rateSource.url} style={{ color: 'var(--rbl-accent)', fontWeight: 700 }}>{data.rateSource.title}</a>.{' '}
        {data.equalization.note}
      </p>
    </PageShell>
  )
}
