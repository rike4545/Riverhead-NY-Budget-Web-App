import PageShell from '../../components/PageShell'
import PlainCallout from '../../components/PlainCallout'
import CapitalDebtCalculator from '../../components/CapitalDebtCalculator'
import { debtProfile, debtProfileTotals } from '../../lib/debt-profile'

const card = { background: 'white', border: '1px solid #e2e8f0', borderRadius: 16, padding: 20, boxShadow: '0 14px 34px rgba(15,23,42,.05)' } as const
const usd = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

export const metadata = {
  title: 'Capital & Debt — how Riverhead borrows, and what it owes',
  description:
    "Riverhead's actual outstanding debt from its most recent financial report, plus a calculator comparing the two ways a town finances a capital project: issue a bond immediately, or borrow short-term with a Bond Anticipation Note (BAN) first.",
}

export default function CapitalDebtPage() {
  const maxAmort = Math.max(...debtProfile.amortization.map((r) => r.principal + r.interest))

  return (
    <PageShell
      title="Capital & Debt"
      subtitle="What Riverhead actually owes, from its most recent financial report — plus a calculator for the two ways a town finances a capital project: bond immediately, or borrow short-term with a Bond Anticipation Note first."
    >
      <PlainCallout
        tips={[
          { label: 'BAN', text: 'a Bond Anticipation Note — short-term borrowing a town uses while a project is underway, later paid off or replaced with a long-term bond once the final cost is known.' },
          { label: 'Serial bond', text: 'the long-term borrowing that eventually replaces a BAN — principal repaid in equal installments over the bond’s term, with interest on the declining balance.' },
          { label: 'Why not always bond now', text: 'issuing a 20-year bond for a project that isn’t finished yet means paying interest on money that may sit unspent, and locks in a rate before the final price tag is known.' },
        ]}
      >
        As of {debtProfile.asOf}, Riverhead had <strong>{usd(debtProfile.totalBondedDebt)}</strong> in bonded debt
        outstanding and <strong>{usd(debtProfile.bondAnticipationNotes)}</strong> in Bond Anticipation Notes — plus{' '}
        <strong>{usd(debtProfile.debtLimit.bondsAuthorizedUnissued)}</strong> the Board had authorized but not yet
        issued as long-term bonds as of {debtProfile.debtLimit.asOf}, which is exactly the kind of balance a BAN
        typically carries in the interim.
      </PlainCallout>

      <section style={{ ...card, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 12, marginBottom: 16 }}>
        <Stat label="Total bonded debt" value={usd(debtProfile.totalBondedDebt)} sub="excl. BANs, all activities" />
        <Stat label="Bond Anticipation Notes" value={usd(debtProfile.bondAnticipationNotes)} sub="all activities" accent />
        <Stat label="Authorized, not yet issued" value={usd(debtProfile.debtLimit.bondsAuthorizedUnissued)} sub={`Board-approved, as of ${debtProfile.debtLimit.asOf}`} />
        <Stat label="Debt limit used" value={`${debtProfile.debtLimit.debtLimitExhaustedPct}%`} sub={`of ${usd(debtProfile.debtLimit.constitutionalDebtLimit)} limit, as of ${debtProfile.debtLimit.asOf}`} />
        <Stat label="Credit rating" value={debtProfile.moodyRating} sub={`Moody's, ${debtProfile.moodyRatingAsOf}`} />
      </section>

      <h2 style={{ color: '#284a69' }}>What's already on the books</h2>
      <section style={{ ...card, marginBottom: 18 }}>
        <p style={{ color: '#64748b', fontSize: 13.5, marginTop: 0 }}>
          Future principal and interest on all of the Town's bonds (governmental and business-type activities
          combined), from the 2024 Annual Financial Report's Bond Repayment schedule. Bars show principal (dark) and
          interest (gold) for each period.
        </p>
        <div style={{ display: 'grid', gap: 10 }}>
          {debtProfile.amortization.map((r) => {
            const total = r.principal + r.interest
            return (
              <div key={r.period} style={{ display: 'grid', gridTemplateColumns: '90px 1fr auto', gap: 10, alignItems: 'center' }}>
                <span style={{ color: '#475569', fontWeight: 700, fontSize: 13 }}>{r.period}</span>
                <div style={{ display: 'flex', height: 18, borderRadius: 5, overflow: 'hidden', background: '#f1f5f9', width: `${(total / maxAmort) * 100}%`, minWidth: 40 }}>
                  <div style={{ width: `${(r.principal / total) * 100}%`, background: '#4a7297' }} title={`Principal: ${usd(r.principal)}`} />
                  <div style={{ width: `${(r.interest / total) * 100}%`, background: '#c99a2e' }} title={`Interest: ${usd(r.interest)}`} />
                </div>
                <span style={{ fontWeight: 800, color: '#284a69', fontSize: 13, textAlign: 'right' }}>{usd(total)}</span>
              </div>
            )
          })}
          <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr auto', gap: 10, borderTop: '2px solid #e2e8f0', paddingTop: 8, marginTop: 2 }}>
            <span style={{ fontWeight: 900, color: '#284a69', fontSize: 13 }}>Total</span>
            <span />
            <span style={{ fontWeight: 900, color: '#284a69', fontSize: 13, textAlign: 'right' }}>{usd(debtProfileTotals.principal + debtProfileTotals.interest)}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 14, marginTop: 12, fontSize: 12, color: '#64748b' }}>
          <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 3, background: '#4a7297', marginRight: 5 }} />Principal</span>
          <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 3, background: '#c99a2e', marginRight: 5 }} />Interest</span>
        </div>
      </section>

      <h2 style={{ color: '#284a69' }}>Try a hypothetical project</h2>
      <p style={{ color: '#64748b', fontSize: 13.5, marginTop: 0, marginBottom: 12 }}>
        The rate fields below are assumptions you set — not a quoted Town borrowing rate. Nobody, including the Town,
        knows what a future bond or BAN would price at until it's actually sold; this shows the mechanics of the
        tradeoff, not a prediction.
      </p>
      <CapitalDebtCalculator />

      <p style={{ color: '#6b7280', fontSize: 12.5, marginTop: 16 }}>
        Total debt and amortization figures: {debtProfile.source.title}, {debtProfile.source.detail}. Debt-limit
        figures (authorized-unissued, constitutional limit, and % exhausted) are from the last independent audit —
        {' '}{debtProfile.debtLimit.source.title}, {debtProfile.debtLimit.source.detail} — since Annual Financial
        Report Updates filed since then don't carry that disclosure. Only the governmental-activities portion of
        bonded debt ({usd(debtProfile.debtLimit.debtSubjectToLimit)}, as of {debtProfile.debtLimit.asOf}) counts
        toward the constitutional debt limit — water and sewer district debt is excluded by statute. Verify against
        the official filings before relying on it.
      </p>
    </PageShell>
  )
}

function Stat({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div>
      <div style={{ color: '#64748b', fontSize: 12.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.3 }}>{label}</div>
      <div style={{ color: accent ? '#b45309' : '#284a69', fontSize: 22, fontWeight: 900, lineHeight: 1.2 }}>{value}</div>
      {sub && <div style={{ color: '#6b7280', fontSize: 12.5 }}>{sub}</div>}
    </div>
  )
}
