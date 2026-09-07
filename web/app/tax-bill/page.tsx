import PageShell from '../../components/PageShell'
import PlainCallout from '../../components/PlainCallout'
import TaxBillEstimator from '../../components/TaxBillEstimator'
import RecordTrail from '../../components/RecordTrail'
import DataStatus from '../../components/DataStatus'
import { allOperatingFunds2026 } from '../../lib/all-funds'
import data from '../../public/data/tax-bill.json'

export const metadata = {
  title: 'My tax bill — what would I actually pay?',
  description:
    "Estimate the Town's portion of your property-tax bill using Riverhead's own published 2026 rate table.",
}

export default function TaxBillPage() {
  const rateChange = data.rates2026.totalTownWide - data.rates2025.totalTownWide
  const rateChangePct = (rateChange / data.rates2025.totalTownWide) * 100
  const levyFunds = allOperatingFunds2026
    .filter((fund) => fund.taxLevy2026 > 0)
    .sort((a, b) => b.taxLevy2026 - a.taxLevy2026)
  const levyTotal = levyFunds.reduce((sum, fund) => sum + fund.taxLevy2026, 0)

  return (
    <PageShell title={data.title} subtitle={data.intro}>
      <section style={{ background: 'var(--rbl-info-bg)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 16, padding: 18, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ color: 'var(--rbl-accent)', fontSize: 11.5, fontWeight: 950, textTransform: 'uppercase', letterSpacing: 0.5 }}>What changed</div>
          <DataStatus status="calculated" text="Rate change calculated from published rates" />
        </div>
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
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <DataStatus status="official" text="Official published rate table" />
          <span>These rates come straight from the {data.rateSource.title} ({data.rateSource.note}) — not an estimate.</span>
        </span>
      </PlainCallout>

      <TaxBillEstimator rates2026={data.rates2026} rates2025={data.rates2025} residentialAssessmentRatio={data.equalization.residentialAssessmentRatio} />

      <section style={{ background: 'var(--rbl-surface)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 18, padding: 20, marginTop: 18, boxShadow: '0 14px 34px var(--rbl-shadow)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ color: 'var(--rbl-badge)', fontSize: 11, fontWeight: 950, letterSpacing: 1.1, textTransform: 'uppercase' }}>Where the Town levy goes</div>
          <DataStatus status="calculated" text="Calculated from published fund levy fields" />
        </div>
        <h2 style={{ margin: '5px 0 6px', fontSize: 22 }}>How the 2026 Town-wide property-tax levy is allocated</h2>
        <p style={{ color: 'var(--rbl-text-muted)', lineHeight: 1.55, maxWidth: 900, margin: 0 }}>
          This is a view of the <strong>tax levy</strong> by fund — not a claim that the Town spends this percentage on a particular service. Funds can also be supported by fees, grants, other revenues, or fund balance.
        </p>
        <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
          {levyFunds.map((fund) => {
            const share = levyTotal > 0 ? (fund.taxLevy2026 / levyTotal) * 100 : 0
            return (
              <a key={fund.code} href={`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/funds/${fund.code}/`} style={{ color: 'inherit', textDecoration: 'none', display: 'grid', gridTemplateColumns: 'minmax(150px,1.2fr) minmax(110px,.8fr) auto', gap: 12, alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 900, color: 'var(--rbl-title)' }}>{fund.name}</div>
                  <div style={{ color: 'var(--rbl-text-muted)', fontSize: 12 }}>{fund.code} · {fund.description}</div>
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ height: 9, background: 'var(--rbl-surface-2)', borderRadius: 999, overflow: 'hidden', border: '1px solid var(--rbl-border-subtle)' }}>
                    <div style={{ width: `${Math.max(0, Math.min(100, share))}%`, height: '100%', background: 'var(--rbl-fill-accent)', borderRadius: 999 }} />
                  </div>
                  <div style={{ marginTop: 4, fontSize: 11.5, color: 'var(--rbl-text-muted)' }}>{share.toFixed(1)}% of levy</div>
                </div>
                <strong style={{ color: 'var(--rbl-title)', whiteSpace: 'nowrap' }}>{formatDollars(fund.taxLevy2026)}</strong>
              </a>
            )
          })}
        </div>
        <div style={{ borderTop: '1px solid var(--rbl-border-subtle)', marginTop: 14, paddingTop: 12, display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', color: 'var(--rbl-text-muted)', fontSize: 13 }}>
          <span>Total tax levy represented above</span>
          <strong style={{ color: 'var(--rbl-title)' }}>{formatDollars(levyTotal)}</strong>
        </div>
      </section>

      <RecordTrail
        title="Trace your tax number into the financial record"
        intro="A tax estimate is more useful when you can follow the same number into the budget, fund records, financial-health indicators, and original sources."
        items={[
          { href: '/compare/', label: 'Budget Changes', text: 'Compare the adopted budget and see where appropriations moved.' },
          { href: '/funds/', label: 'Funds & Accounts', text: 'See the operating funds and underlying budget lines.' },
          { href: '/analytics/', label: 'Financial Health', text: 'Put levy growth alongside spending, reserves, and other indicators.' },
          { href: '/sources/', label: 'Source Library', text: 'Inspect the official records behind the tax-rate and levy figures.' },
        ]}
      />

      <p style={{ color: 'var(--rbl-text-muted)', fontSize: 13, lineHeight: 1.55, marginTop: 16 }}>
        Source: <a href={data.rateSource.url} style={{ color: 'var(--rbl-accent)', fontWeight: 700 }}>{data.rateSource.title}</a>.{' '}
        {data.equalization.note}
      </p>
    </PageShell>
  )
}

function formatDollars(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}
