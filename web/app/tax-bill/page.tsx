import ChartCard from '../../components/infographics/ChartCard'
import LevyDollarBar from '../../components/infographics/LevyDollarBar'
import PageShell from '../../components/PageShell'
import PlainCallout from '../../components/PlainCallout'
import TaxBillEstimator from '../../components/TaxBillEstimator'
import RecordTrail from '../../components/RecordTrail'
import DataStatus from '../../components/DataStatus'
import { allOperatingFunds2026 } from '../../lib/all-funds'
import { stageDoc } from '../../lib/budget-stages'
import data from '../../public/data/tax-bill.json'
import { homes, uniformPercent } from '../../lib/assessment'

export const metadata = {
  title: 'My tax bill — what would I actually pay?',
  description:
    "Estimate the Town's portion of your property-tax bill at the 2025 and 2026 adopted rates and the proposed 2027 rate, from the Town's own budget books.",
}

export default function TaxBillPage() {
  const rateChange = data.rates2026.totalTownWide - data.rates2025.totalTownWide
  const preliminary2027 = stageDoc(2027, 'preliminary')
  const proposal2027 = preliminary2027 ?? stageDoc(2027, 'tentative')
  const proposalFundRates = proposal2027?.townWide?.fundRates
  const proposalRates =
    proposal2027?.townWide && proposalFundRates?.A01 && proposalFundRates.DA1 && proposalFundRates.SL1
      ? {
          generalFund: proposalFundRates.A01.rate,
          highway: proposalFundRates.DA1.rate,
          streetLighting: proposalFundRates.SL1.rate,
          totalTownWide: proposal2027.townWide.rate,
        }
      : undefined
  const proposalLabel = preliminary2027 ? '2027 Preliminary Budget' : '2027 Tentative Budget'
  const rateChangePct = (rateChange / data.rates2025.totalTownWide) * 100
  const tentative2027 = stageDoc(2027, 'tentative')
  const rateRows = [
    { year: '2025', label: 'Adopted', rate: data.rates2025.totalTownWide, source: '2025 Adopted Budget, as restated in the 2026 Adopted Budget' },
    { year: '2026', label: 'Adopted', rate: data.rates2026.totalTownWide, source: data.rateSource.title },
    ...(tentative2027?.townWide ? [{ year: '2027', label: 'Tentative (September 30)', rate: tentative2027.townWide.rate, source: tentative2027.source.title }] : []),
    ...(preliminary2027?.townWide ? [{ year: '2027', label: 'Preliminary, after the October 20 amendments', rate: preliminary2027.townWide.rate, source: preliminary2027.source.title }] : []),
  ]
  const latestRate = rateRows[rateRows.length - 1]
  const latestChange = latestRate.rate - data.rates2026.totalTownWide
  // The median one-family home on the 2026 final roll, the roll the 2027 Town taxes are levied on.
  const medianAssessed = Math.round((homes.median * uniformPercent) / 100) * 100
  const levyFunds = allOperatingFunds2026
    .filter((fund) => fund.taxLevy2026 > 0)
    .sort((a, b) => b.taxLevy2026 - a.taxLevy2026)
  const levyTotal = levyFunds.reduce((sum, fund) => sum + fund.taxLevy2026, 0)

  return (
    <PageShell title={data.title} subtitle={data.intro}>
      <section aria-labelledby="rates-heading" style={{ background: 'var(--rbl-info-bg)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 16, padding: 18, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <h2 id="rates-heading" style={{ margin: 0, fontSize: 20, color: 'var(--rbl-title)' }}>The Town-wide tax rate, per $1,000 of assessed value</h2>
          <DataStatus status="official" text="Rates from the Town's budget books" />
        </div>
        <p style={{ margin: '8px 0 10px', color: 'var(--rbl-text-sub)', lineHeight: 1.55, maxWidth: '75ch' }}>
          {proposalRates ? (
            <>The {proposalLabel} sets the rate at <strong>{latestRate.rate.toFixed(3)}</strong>, {latestChange >= 0 ? 'up' : 'down'}{' '}
              {Math.abs(latestChange).toFixed(3)} ({((latestChange / data.rates2026.totalTownWide) * 100).toFixed(1)}%) from 2026. It is not final: the
              Town Board adopts the 2027 budget by November 20, and the rate is then reset on the final assessment roll, as 2026&apos;s moved
              from 71.549 to 71.598.</>
          ) : (
            <>The rate went from {data.rates2025.totalTownWide.toFixed(3)} to {data.rates2026.totalTownWide.toFixed(3)}, up {rateChange.toFixed(3)} ({rateChangePct.toFixed(1)}%).</>
          )}
        </p>
        <div style={{ overflowX: 'auto' }}>
          <table className="rbl-stack" style={{ width: '100%', maxWidth: 720, borderCollapse: 'collapse', fontSize: 15 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--rbl-border)' }}>
                <th scope="col" style={{ padding: '6px 8px', textAlign: 'left', fontSize: 13, color: 'var(--rbl-text-muted)', fontWeight: 600 }}>Budget</th>
                <th scope="col" style={{ padding: '6px 8px', textAlign: 'right', fontSize: 13, color: 'var(--rbl-text-muted)', fontWeight: 600 }}>Rate per $1,000</th>
                <th scope="col" style={{ padding: '6px 8px', textAlign: 'left', fontSize: 13, color: 'var(--rbl-text-muted)', fontWeight: 600 }}>Source</th>
              </tr>
            </thead>
            <tbody>
              {rateRows.map((r) => (
                <tr key={r.year + r.label} style={{ borderBottom: '1px solid var(--rbl-border-subtle)' }}>
                  <th scope="row" style={{ padding: '6px 8px', textAlign: 'left', fontWeight: r === latestRate ? 700 : 600 }}>{r.year} {r.label}</th>
                  <td data-label="Rate per $1,000" style={{ padding: '6px 8px', textAlign: 'right', fontWeight: r === latestRate ? 700 : 400 }}>{r.rate.toFixed(3)}</td>
                  <td data-label="Source" style={{ padding: '6px 8px', fontSize: 13.5, color: 'var(--rbl-text-muted)' }}>{r.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <PlainCallout
        tips={[
          { label: 'Assessed value, not market value', text: `Riverhead assesses property at a small fraction of market value, ${(uniformPercent * 100).toFixed(2)}% on the 2026 roll. The median one-family home is assessed at about ${formatDollars(medianAssessed)}, which stands for a market value of about ${formatDollars(homes.median)}.` },
          { label: 'Town portion only', text: 'County, school, fire and library taxes are separate lines on your bill.' },
          { label: 'STAR', text: 'STAR lowers school taxes only. It does not change the Town portion, so this calculator does not ask for it.' },
        ]}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <DataStatus status="official" text="Official published rate table" />
          <span>Enter the assessed value from your tax bill to see your Town taxes at each year&apos;s rate. The 2025 and 2026 rates are the adopted ones ({data.rateSource.note}); the 2027 rate is the latest proposal.</span>
        </span>
      </PlainCallout>

      <TaxBillEstimator rates2026={data.rates2026} rates2025={data.rates2025} rates2027Proposal={proposalRates} proposalLabel={proposalLabel} residentialAssessmentRatio={data.equalization.residentialAssessmentRatio} medianAssessed={medianAssessed} lookup={data.lookup} />

      <ChartCard>
        <LevyDollarBar />
      </ChartCard>

      <section style={{ background: 'var(--rbl-surface)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 18, padding: 20, marginTop: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ color: 'var(--rbl-badge)', fontSize: 13, fontWeight: 700 }}>Where the Town levy goes</div>
          <DataStatus status="calculated" text="Calculated from published fund levy fields" />
        </div>
        <h2 style={{ margin: '5px 0 6px', fontSize: 22 }}>How the 2026 Town-wide property-tax levy is allocated</h2>
        <p style={{ color: 'var(--rbl-text-muted)', lineHeight: 1.55, maxWidth: 900, margin: 0 }}>
          This shows how much of the Town’s total property-tax levy is assigned to each fund. It does not show each fund’s full spending or mean that this percentage of taxes goes directly to one service. Funds may also receive fees, grants, other revenue, or savings from earlier years.
        </p>
        <a
          href={`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/taxpayer-impact/`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 7,
            marginTop: 12,
            color: 'var(--rbl-accent)',
            fontWeight: 850,
            textDecoration: 'none',
          }}
        >
          See what each fund means for your Town taxes →
        </a>
        <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
          {levyFunds.map((fund) => {
            const share = levyTotal > 0 ? (fund.taxLevy2026 / levyTotal) * 100 : 0
            return (
              <a key={fund.code} href={`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/funds/${fund.code}/`} style={{ color: 'inherit', textDecoration: 'none', display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
                <div style={{ flex: '1.2 1 240px' }}>
                  <div style={{ fontWeight: 900, color: 'var(--rbl-title)' }}>{fund.name}</div>
                  <div style={{ color: 'var(--rbl-text-muted)', fontSize: 12 }}>{fund.code} · {fund.description}</div>
                </div>
                <div style={{ flex: '.8 1 160px', minWidth: 0 }}>
                  <div style={{ height: 9, background: 'var(--rbl-surface-2)', borderRadius: 999, overflow: 'hidden', border: '1px solid var(--rbl-border-subtle)' }}>
                    <div style={{ width: `${Math.max(0, Math.min(100, share))}%`, height: '100%', background: 'var(--rbl-fill-accent)', borderRadius: 999 }} />
                  </div>
                  <div style={{ marginTop: 4, fontSize: 12.5, color: 'var(--rbl-text-muted)' }}>{share.toFixed(1)}% of levy</div>
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
        {data.equalization.note} To look up your own bill, use{' '}
        <a href={data.lookup.url} style={{ color: 'var(--rbl-accent)', fontWeight: 700 }}>{data.lookup.title}</a>, run by {data.lookup.operator}, which lists the {data.lookup.contact} as its contact.
      </p>
    </PageShell>
  )
}

function formatDollars(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}
