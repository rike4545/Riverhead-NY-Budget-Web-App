import PageShell from '../../components/PageShell'
import PlainCallout from '../../components/PlainCallout'
import { cpfDebt, cpfHistory, cpfMechanics, revenueSwing } from '../../lib/cpf'

const card = { background: 'white', border: '1px solid #e2e8f0', borderRadius: 16, padding: 20, boxShadow: '0 14px 34px rgba(15,23,42,.05)' } as const
const usd = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
const pct = (v: number, digits = 1) => `${(v * 100).toFixed(digits)}%`

export const metadata = {
  title: 'Peconic Bay Community Preservation Fund — is the 2% rate still enough?',
  description:
    "The CPF's 2% real-estate transfer tax revenue swung from $3.4M to $9.5M to $7.0M across three audited years — a trend explainer on what that volatility means, without taking a position on whether the rate should change.",
}

export default function CommunityPreservationFundPage() {
  const maxRevenue = Math.max(...cpfHistory.map((y) => y.transferTaxRevenue))

  return (
    <PageShell
      title="Peconic Bay Community Preservation Fund"
      subtitle="The 2% real-estate transfer tax that pays for land preservation — its revenue history, what it owes, and the real question behind talk of raising the rate."
    >
      <PlainCallout
        tips={[
          { label: 'What the CPF is', text: `a ${pct(cpfMechanics.ratePercent, 0)} tax on real-estate sales above $${(cpfMechanics.unimprovedThreshold / 1000).toFixed(0)}K (unimproved) or $${(cpfMechanics.improvedThreshold / 1000).toFixed(0)}K (improved), dedicated to farmland, open space, and historic-site preservation.` },
          { label: 'Why it swings', text: 'the tax is a cut of real-estate sale prices, so its revenue rises and falls with the housing market — not with anything the Town controls year to year.' },
          { label: 'This page', text: 'lays out the real numbers so residents can judge the volatility question themselves. It is not an argument for or against a rate increase.' },
        ]}
      >
        Since {cpfMechanics.authorityBeganYear}, the CPF has funded <strong>{usd(cpfMechanics.lifetimeLandPurchases2025)}</strong> of
        land purchases, protecting over <strong>{cpfMechanics.acresProtected.toLocaleString()}</strong> acres — but its
        transfer-tax revenue swung from <strong>{usd(revenueSwing.lowAmount)}</strong> in {revenueSwing.lowYear} to{' '}
        <strong>{usd(revenueSwing.peakAmount)}</strong> in {revenueSwing.peakYear}, then pulled back{' '}
        <strong>{pct(Math.abs(revenueSwing.peakToLatestChangePercent))}</strong> to <strong>{usd(revenueSwing.latestAmount)}</strong> in{' '}
        {revenueSwing.latestYear}.
      </PlainCallout>

      <section style={{ ...card, marginBottom: 16 }}>
        <h3 style={{ marginTop: 0, color: '#284a69' }}>Transfer-tax revenue, three audited years</h3>
        <p style={{ color: '#475569', fontSize: 14.5, marginTop: 0 }}>
          Every figure below is the transfer-tax line from that year&apos;s audited CPF financial statement — not a
          projection.
        </p>
        <div style={{ display: 'grid', gap: 14 }}>
          {cpfHistory.map((y) => (
            <div key={y.year}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                <strong>{y.year}</strong>
                <span style={{ fontWeight: 800, color: '#4a7297' }}>{usd(y.transferTaxRevenue)}</span>
              </div>
              <div style={{ background: '#e2e8f0', borderRadius: 999, height: 10, overflow: 'hidden', marginTop: 4 }}>
                <div
                  style={{
                    width: `${(y.transferTaxRevenue / maxRevenue) * 100}%`,
                    height: '100%',
                    background: '#4a7297',
                    borderRadius: 999,
                  }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, color: '#64748b', marginTop: 4 }}>
                <span>+ {usd(y.interestIncome)} interest = {usd(y.totalRevenue)} total revenue</span>
                <span>Fund balance, year end: {usd(y.fundBalanceEnd)}</span>
              </div>
            </div>
          ))}
        </div>
        <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '14px 0' }} />
        <p style={{ color: '#6b7280', fontSize: 12.5 }}>
          {revenueSwing.lowYear} to {revenueSwing.peakYear}, transfer-tax revenue rose about{' '}
          {revenueSwing.lowToPeakMultiple.toFixed(1)}x as the real-estate market ran hot; {revenueSwing.peakYear} to{' '}
          {revenueSwing.latestYear} it pulled back {pct(Math.abs(revenueSwing.peakToLatestChangePercent))} as the market
          cooled. The fund balance kept growing through all of it, because the Town has been spending less than it
          takes in most years — but the revenue line itself has no floor built in.
        </p>
      </section>

      <section style={{ ...card, marginBottom: 16 }}>
        <h3 style={{ marginTop: 0, color: '#284a69' }}>What the fund still owes</h3>
        <p style={{ color: '#475569', fontSize: 14.5, marginTop: 0 }}>
          {cpfDebt.description} The fund transfers money to the Town&apos;s debt service fund each year to pay this
          down — that transfer competes with land-purchase capacity for the same revenue.
        </p>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14.5 }}>
          <span>Outstanding, year-end 2024</span>
          <strong>{usd(cpfDebt.outstanding2024)}</strong>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14.5, marginTop: 6 }}>
          <span>Outstanding, year-end 2025</span>
          <strong style={{ color: '#16a34a' }}>{usd(cpfDebt.outstanding2025)}</strong>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#64748b', marginTop: 6 }}>
          <span>Rate</span>
          <span>{pct(cpfDebt.rateLow, 2)}–{pct(cpfDebt.rateHigh, 2)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#64748b', marginTop: 4 }}>
          <span>Matures</span>
          <span>{cpfDebt.matures}</span>
        </div>
      </section>

      <section style={{ ...card, marginBottom: 16, borderLeft: '8px solid #4a7297' }}>
        <h3 style={{ marginTop: 0, color: '#284a69' }}>Is the current rate still enough?</h3>
        <p style={{ color: '#334155', fontSize: 14.5, lineHeight: 1.65 }}>
          There is no acute crisis in these numbers: the fund balance has grown every year shown here, and the 2018
          bonds are on schedule to be paid off by {cpfDebt.matures}. The real question is about reliability, not
          solvency — the CPF&apos;s only revenue source is a fixed {pct(cpfMechanics.ratePercent, 0)} share of
          real-estate sale prices, which means every dollar of future land-preservation ambition or debt capacity
          rises and falls with a market the Town does not control. The {pct(Math.abs(revenueSwing.peakToLatestChangePercent))}{' '}
          pullback from {revenueSwing.peakYear} to {revenueSwing.latestYear} happened without any change in Town
          policy — it was purely the market cooling.
        </p>
        <p style={{ color: '#334155', fontSize: 14.5, lineHeight: 1.65 }}>
          Whether that argues for a higher rate, an expanded eligible-use list, or simply budgeting land purchases
          more conservatively in strong years to build a cushion for weak ones, is a genuine Town Board policy
          question. This page does not take a position on it — it lays out the real volatility so residents can weigh
          in with the actual numbers rather than a general impression that preservation funding is either flush or at
          risk.
        </p>
        <p style={{ color: '#6b7280', fontSize: 12.5, marginBottom: 0 }}>
          The authority to levy this tax runs through {cpfMechanics.authorityExpiresYear} (extended by referendum in{' '}
          {cpfMechanics.authorityExtendedYear}), and up to {pct(cpfMechanics.waterQualityCapPercent, 0)} of annual
          revenue may be used for water-quality projects rather than land purchases — both are facts about the
          program&apos;s current scope, not arguments either way on the rate.
        </p>
      </section>

      <p style={{ color: '#64748b', fontSize: 13, lineHeight: 1.55 }}>
        Sources: Town of Riverhead Peconic Bay Community Preservation Fund audited financial statements for the years
        ended December 31, 2019 (Cullen &amp; Danowski, LLP), December 31, 2024 (Craig, Fitzsimmons &amp; Meyer, LLP),
        and December 31, 2025 (Cullen &amp; Danowski, LLP).
      </p>
    </PageShell>
  )
}
