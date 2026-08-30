import PageShell from '../../components/PageShell'
import LineChart from '../../components/charts/LineChart'
import PlainCallout from '../../components/PlainCallout'
import CapitalDebtCalculator from '../../components/CapitalDebtCalculator'
import {
  debtIssueTotals, debtIssues, debtProfile, debtProfileTotals, longTermObligations,
  longTermObligationsTotal, opebLiability, sinceBalanceSheet,
  type DebtIssue,
} from '../../lib/debt-profile'

const card = { background: 'var(--rbl-surface)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 16, padding: 20, boxShadow: '0 14px 34px var(--rbl-shadow)' } as const
const usd = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

// "2023-02-21" → "Feb 21, 2023". Parsed at noon UTC so the date never slips a
// day backwards in a western timezone.
const day = (iso: string) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })

const ACTIVITY_LABEL: Record<DebtIssue['activity'], string> = {
  governmental: 'Governmental — counts against the debt limit',
  'business-type': 'Water/sewer — excluded from the debt limit by statute',
  split: 'Split between governmental and water/sewer purposes',
}

export const metadata = {
  title: 'Capital & Debt — every bond and note Riverhead owes',
  description:
    "Every general obligation bond, EFC bond, and Bond Anticipation Note the Town of Riverhead had outstanding at the close of 2025 — itemised with interest rates, issue and maturity dates, and balances — plus the full repayment schedule through 2053.",
}

export default function CapitalDebtPage() {
  const bonds = debtIssues.filter((d) => d.kind === 'bond')
  const bans = debtIssues.filter((d) => d.kind === 'ban')
  const maxOutstanding = Math.max(...debtIssues.map((d) => d.outstanding))
  const nearTermAmort = debtProfile.amortization.filter((r) => r.year <= 2039)

  return (
    <PageShell
      title="Capital & Debt"
      subtitle={`Every bond and note the Town owes, itemised — ${usd(debtIssueTotals.all)} outstanding across ${debtIssues.length} issues as of ${debtProfile.asOf} — plus the repayment schedule through 2053 and a calculator for the two ways a town finances a capital project.`}
    >
      <PlainCallout
        tips={[
          { label: 'BAN', text: 'a Bond Anticipation Note — short-term borrowing a town uses while a project is underway, later paid off or replaced with a long-term bond once the final cost is known.' },
          { label: 'Serial bond', text: 'the long-term borrowing that eventually replaces a BAN — principal repaid in installments over the bond’s term, with interest on the declining balance.' },
          { label: 'EFC bond', text: 'a bond sold through the NYS Environmental Facilities Corporation for clean-water work. They carry subsidised rates — one of Riverhead’s is interest-free.' },
          { label: 'Why the debt limit ignores water and sewer', text: 'those districts charge their own users, so State law leaves their debt out of the constitutional limit on town borrowing.' },
        ]}
      >
        As of {debtProfile.asOf}, Riverhead owed <strong>{usd(debtProfile.totalBondedDebt)}</strong> on{' '}
        <strong>{bonds.length} bonds</strong> and <strong>{usd(debtProfile.bondAnticipationNotes)}</strong> on{' '}
        <strong>{bans.length} bond anticipation notes</strong> — {usd(debtIssueTotals.all)} in all. The Town issued
        no new debt during 2025 and retired {usd(debtProfile.principalPaid2025.bonds + debtProfile.principalPaid2025.bans)}{' '}
        of principal. Every issue is listed below.
      </PlainCallout>

      <section style={{ ...card, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 12, marginBottom: 16 }}>
        <Stat label="Bonds outstanding" value={usd(debtProfile.totalBondedDebt)} sub={`${bonds.length} issues`} />
        <Stat label="Bond Anticipation Notes" value={usd(debtProfile.bondAnticipationNotes)} sub={`${bans.length} notes, both matured in 2026`} accent />
        <Stat label="Authorized, not yet issued" value={usd(debtProfile.debtLimit.bondsAuthorizedUnissued)} sub={`Board-approved, as of ${debtProfile.debtLimit.asOf}`} />
        <Stat label="Debt limit used" value={`${debtProfile.debtLimit.debtLimitExhaustedPct}%`} sub={`of ~${usd(debtProfile.debtLimit.constitutionalDebtLimit)}, as of ${debtProfile.debtLimit.asOf}`} />
        <Stat label="Credit rating" value={debtProfile.moodyRating} sub={`Moody's, ${debtProfile.moodyRatingAsOf}`} />
      </section>

      {/* The itemised list — the heart of the page. */}
      <h2 style={{ color: 'var(--rbl-title)' }}>Every bond and note, one by one</h2>
      <p style={{ color: 'var(--rbl-text-body)', fontSize: 14.5, lineHeight: 1.6, marginTop: 0, maxWidth: 900 }}>
        Balances are as of {debtProfile.asOf}, from the Town&apos;s Statement of Indebtedness. Interest rates and
        formal issue names come from the last independent audit, a year earlier — the Annual Financial Report
        doesn&apos;t print them. Sorted largest balance first.
      </p>

      <section style={{ display: 'grid', gap: 12, marginBottom: 18 }}>
        {debtIssues.map((d) => {
          const isBan = d.kind === 'ban'
          return (
            <article key={`${d.purpose}-${d.issued}`} style={{
              ...card, padding: 18,
              borderLeft: `6px solid ${isBan ? 'var(--rbl-warn-border)' : 'var(--rbl-accent-border)'}`,
            }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'baseline', flexWrap: 'wrap', marginBottom: 4 }}>
                <span style={{
                  fontSize: 10.5, fontWeight: 900, letterSpacing: 0.5, textTransform: 'uppercase',
                  padding: '2px 7px', borderRadius: 5,
                  background: isBan ? 'var(--rbl-warn-bg)' : 'var(--rbl-info-bg)',
                  color: isBan ? 'var(--rbl-warn-strong)' : 'var(--rbl-info-text)',
                  border: `1px solid ${isBan ? 'var(--rbl-warn-border)' : 'var(--rbl-info-border)'}`,
                }}>
                  {isBan ? 'Bond Anticipation Note' : 'Bond'}
                </span>
                <strong style={{ color: 'var(--rbl-title)', fontSize: 17 }}>{d.purpose}</strong>
                <span style={{ marginLeft: 'auto', color: 'var(--rbl-title)', fontSize: 21, fontWeight: 900 }}>{usd(d.outstanding)}</span>
              </div>

              {d.issueName && (
                <div style={{ color: 'var(--rbl-text-sub)', fontSize: 13.2, marginBottom: 6 }}>{d.issueName}</div>
              )}

              {/* Share-of-total bar: one glance tells you which issues dominate. */}
              <div style={{ height: 7, borderRadius: 4, background: 'var(--rbl-track)', overflow: 'hidden', margin: '8px 0 10px' }}>
                <div style={{
                  width: `${(d.outstanding / maxOutstanding) * 100}%`, height: '100%',
                  background: isBan ? 'var(--rbl-fill-warn)' : 'var(--rbl-fill-accent)',
                }} />
              </div>

              <dl style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(126px,1fr))', gap: 10, margin: 0 }}>
                <Field term="Interest rate" value={d.rate ?? 'Not disclosed'} />
                <Field term="Issued" value={day(d.issued)} />
                <Field term={isBan ? 'Matured' : 'Final maturity'} value={day(d.matures)} />
                <Field term="Paid during 2025" value={d.principalPaid2025 === 0 ? 'None' : usd(d.principalPaid2025)} />
                <Field term="Balance a year earlier" value={usd(d.beginning2025)} />
              </dl>

              <div style={{ color: 'var(--rbl-text-muted)', fontSize: 12.4, marginTop: 10 }}>
                {ACTIVITY_LABEL[d.activity]}
                {d.split && ` — ${usd(d.split.governmental)} governmental, ${usd(d.split.businessType)} water/sewer at ${debtProfile.debtLimit.asOf}.`}
              </div>

              {d.note && (
                <p style={{ color: 'var(--rbl-text-body)', fontSize: 13.4, lineHeight: 1.55, margin: '8px 0 0' }}>{d.note}</p>
              )}
            </article>
          )
        })}
      </section>

      {/* Both notes matured during 2026 — the balance sheet alone would hide that. */}
      <section style={{ ...card, marginBottom: 18, background: 'var(--rbl-warn-bg)', border: '1px solid var(--rbl-warn-border)', borderLeft: '6px solid var(--rbl-gold-border)' }}>
        <h2 style={{ marginTop: 0, marginBottom: 4, color: 'var(--rbl-note-text)', fontSize: 22 }}>What has happened since</h2>
        <p style={{ color: 'var(--rbl-note-text)', fontSize: 14.8, lineHeight: 1.6, marginTop: 0 }}>
          The balances above are a photograph taken on {debtProfile.asOf}. Both bond anticipation notes reached their
          maturity dates during 2026, and the Board has voted twice since to pay debt down — so here is what the
          Town&apos;s own record shows after the shutter closed.
        </p>
        <ol style={{ margin: 0, paddingLeft: 0, listStyle: 'none', display: 'grid', gap: 10 }}>
          {sinceBalanceSheet.events.map((e) => (
            <li key={`${e.date}-${e.what}`} style={{ background: 'var(--rbl-surface)', border: '1px solid var(--rbl-warn-border)', borderRadius: 10, padding: '11px 14px' }}>
              <div style={{ color: 'var(--rbl-badge)', fontSize: 11.5, fontWeight: 900, letterSpacing: 0.4, textTransform: 'uppercase' }}>{e.date}</div>
              <strong style={{ color: 'var(--rbl-title)', fontSize: 14.8, display: 'block', margin: '2px 0 3px' }}>{e.what}</strong>
              <div style={{ color: 'var(--rbl-text-body)', fontSize: 13.5, lineHeight: 1.55 }}>{e.why}</div>
              <div style={{ color: 'var(--rbl-text-muted)', fontSize: 12, marginTop: 4 }}>{e.source}</div>
            </li>
          ))}
        </ol>
        <p style={{ color: 'var(--rbl-note-text)', fontSize: 13.4, lineHeight: 1.6, marginBottom: 0, marginTop: 12, fontWeight: 600 }}>
          {sinceBalanceSheet.caveat}
        </p>
      </section>

      <h2 style={{ color: 'var(--rbl-title)' }}>Bonds and notes are less than a third of it</h2>
      <section style={{ ...card, marginBottom: 18 }}>
        <p style={{ color: 'var(--rbl-text-body)', fontSize: 15, lineHeight: 1.65, marginTop: 0 }}>
          Everything above this point is money the Town borrowed. It is the part that gets talked about, and at{' '}
          {usd(debtIssueTotals.all)} it is also the part the Town has been paying down. But borrowing is not the
          largest promise on the books. The Comptroller&apos;s Schedule of Non-Current Government Liabilities adds up
          everything the Town owes beyond this year, and the total is{' '}
          <strong>{usd(longTermObligationsTotal[2025])}</strong> — with retiree health insurance alone larger than all
          the bonds, notes, pension and accrued leave put together.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, minWidth: 560 }}>
            <thead>
              <tr style={{ textAlign: 'left', color: 'var(--rbl-text-muted)', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.4 }}>
                <th style={{ padding: '8px 10px' }}>What the Town owes</th>
                <th style={{ padding: '8px 10px', textAlign: 'right' }}>Dec 31, 2025</th>
                <th style={{ padding: '8px 10px', textAlign: 'right' }}>Dec 31, 2024</th>
                <th style={{ padding: '8px 10px', textAlign: 'right' }}>Dec 31, 2023</th>
              </tr>
            </thead>
            <tbody>
              {longTermObligations.map((o) => (
                <tr key={o.account} style={{ borderTop: '1px solid var(--rbl-border-subtle)' }}>
                  <td style={{ padding: '9px 10px' }}>
                    <strong style={{ color: 'var(--rbl-title)' }}>{o.label}</strong>
                    {o.note && (
                      <div style={{ color: 'var(--rbl-text-muted)', fontSize: 12.6, lineHeight: 1.5, marginTop: 3 }}>{o.note}</div>
                    )}
                  </td>
                  <td style={{ padding: '9px 10px', textAlign: 'right', fontWeight: 800, color: 'var(--rbl-title)', whiteSpace: 'nowrap' }}>{usd(o.values[2025])}</td>
                  <td style={{ padding: '9px 10px', textAlign: 'right', color: 'var(--rbl-text-muted)', whiteSpace: 'nowrap' }}>{usd(o.values[2024])}</td>
                  <td style={{ padding: '9px 10px', textAlign: 'right', color: 'var(--rbl-text-muted)', whiteSpace: 'nowrap' }}>{usd(o.values[2023])}</td>
                </tr>
              ))}
              <tr style={{ borderTop: '2px solid var(--rbl-border-subtle)' }}>
                <td style={{ padding: '10px', fontWeight: 900, color: 'var(--rbl-title)' }}>Total long-term obligations</td>
                <td style={{ padding: '10px', textAlign: 'right', fontWeight: 900, color: 'var(--rbl-title)', whiteSpace: 'nowrap' }}>{usd(longTermObligationsTotal[2025])}</td>
                <td style={{ padding: '10px', textAlign: 'right', fontWeight: 700, color: 'var(--rbl-text-muted)', whiteSpace: 'nowrap' }}>{usd(longTermObligationsTotal[2024])}</td>
                <td style={{ padding: '10px', textAlign: 'right', fontWeight: 700, color: 'var(--rbl-text-muted)', whiteSpace: 'nowrap' }}>{usd(longTermObligationsTotal[2023])}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p style={{ color: 'var(--rbl-text-muted)', fontSize: 13, lineHeight: 1.6, marginBottom: 0, marginTop: 12 }}>
          Governmental activities only — the water and sewer enterprises carry their own share, which is why the bond
          line here ({usd(longTermObligations.find((o) => o.account === '628')!.values[2025])}) is smaller than the{' '}
          {usd(debtProfile.totalBondedDebt)} of bonds itemised above. Source: {debtProfile.source.title}, Schedule W.
        </p>
      </section>

      <section style={{ ...card, marginBottom: 18, borderLeft: '6px solid var(--rbl-gold-border)' }}>
        <h3 style={{ marginTop: 0, marginBottom: 6, color: 'var(--rbl-title)', fontSize: 18 }}>
          Why the retiree-health number jumps around
        </h3>
        <p style={{ color: 'var(--rbl-text-body)', fontSize: 14.6, lineHeight: 1.65, marginTop: 0 }}>
          {opebLiability.whyItMoves}
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 10, marginTop: 12 }}>
          {opebLiability.series.map((y) => (
            <div key={y.asOf} style={{ background: 'var(--rbl-warn-bg)', border: '1px solid var(--rbl-warn-border)', borderRadius: 10, padding: '10px 12px' }}>
              <div style={{ color: 'var(--rbl-badge)', fontSize: 11.5, fontWeight: 900, letterSpacing: 0.4, textTransform: 'uppercase' }}>{y.asOf}</div>
              <div style={{ color: 'var(--rbl-title)', fontSize: 19, fontWeight: 900, marginTop: 3 }}>{usd(y.governmental)}</div>
              <div style={{ color: 'var(--rbl-text-muted)', fontSize: 12.4, lineHeight: 1.5, marginTop: 2 }}>
                {y.discountRate != null ? `Discount rate ${y.discountRate.toFixed(2)}%` : 'Discount rate not yet published'}
                {y.total != null && <> · {usd(y.total)} including water &amp; sewer</>}
              </div>
            </div>
          ))}
        </div>
      </section>

      <h2 style={{ color: 'var(--rbl-title)' }}>What&apos;s already on the books</h2>
      <LineChart
        title="Debt service per year, as currently scheduled"
        lede="Principal and interest on the bonds already issued, year by year through final maturity. The cliff after 2039 is the interest-free EFC sewer bond running on alone at $111,040 a year until 2053."
        categories={debtProfile.amortization.map((r) => String(r.year))}
        series={[
          { label: 'Principal', color: 'var(--rbl-series-blue)', values: debtProfile.amortization.map((r) => r.principal) },
          { label: 'Interest', color: 'var(--rbl-series-gold)', values: debtProfile.amortization.map((r) => r.interest) },
        ]}
        format={(n) => `$${(n / 1e6).toFixed(1)}M`}
        source={`${debtProfile.source.title} — ${debtProfile.source.detail}.`}
      />

      <section style={{ ...card, marginBottom: 18 }}>
        <p style={{ color: 'var(--rbl-text-muted)', fontSize: 13.5, marginTop: 0 }}>
          Future principal and interest on all of the Town&apos;s bonds, governmental and business-type combined. Bars
          show principal (dark) and interest (gold). Years through 2039 are shown; the flat $111,040-a-year tail
          continues to 2053 and is folded into the total.
        </p>
        <div style={{ display: 'grid', gap: 8 }}>
          {(() => {
            const maxAmort = Math.max(...nearTermAmort.map((r) => r.principal + r.interest))
            return nearTermAmort.map((r) => {
              const total = r.principal + r.interest
              return (
                <div key={r.year} style={{ display: 'grid', gridTemplateColumns: '58px 1fr auto', gap: 10, alignItems: 'center' }}>
                  <span style={{ color: 'var(--rbl-text-body)', fontWeight: 700, fontSize: 13 }}>{r.year}</span>
                  <div style={{ display: 'flex', height: 16, borderRadius: 5, overflow: 'hidden', background: 'var(--rbl-surface-3)', width: `${(total / maxAmort) * 100}%`, minWidth: 40 }}>
                    <div style={{ width: `${(r.principal / total) * 100}%`, background: 'var(--rbl-fill-accent)' }} title={`Principal: ${usd(r.principal)}`} />
                    <div style={{ width: `${(r.interest / total) * 100}%`, background: 'var(--rbl-fill-gold)' }} title={`Interest: ${usd(r.interest)}`} />
                  </div>
                  <span style={{ fontWeight: 800, color: 'var(--rbl-title)', fontSize: 13, textAlign: 'right' }}>{usd(total)}</span>
                </div>
              )
            })
          })()}
          <div style={{ display: 'grid', gridTemplateColumns: '58px 1fr auto', gap: 10, alignItems: 'center', color: 'var(--rbl-text-muted)', fontSize: 12.6 }}>
            <span style={{ fontWeight: 700 }}>2040–53</span>
            <span>fourteen equal payments of {usd(111_040)}, interest-free</span>
            <span style={{ fontWeight: 800, textAlign: 'right' }}>{usd(111_040 * 14)}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '58px 1fr auto', gap: 10, borderTop: '2px solid var(--rbl-border-subtle)', paddingTop: 8, marginTop: 2 }}>
            <span style={{ fontWeight: 900, color: 'var(--rbl-title)', fontSize: 13 }}>Total</span>
            <span style={{ color: 'var(--rbl-text-muted)', fontSize: 12.6 }}>
              {usd(debtProfileTotals.principal)} principal + {usd(debtProfileTotals.interest)} interest
            </span>
            <span style={{ fontWeight: 900, color: 'var(--rbl-title)', fontSize: 13, textAlign: 'right' }}>{usd(debtProfileTotals.principal + debtProfileTotals.interest)}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 14, marginTop: 12, fontSize: 12, color: 'var(--rbl-text-muted)' }}>
          <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 3, background: 'var(--rbl-fill-accent)', marginRight: 5 }} />Principal</span>
          <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 3, background: 'var(--rbl-fill-gold)', marginRight: 5 }} />Interest</span>
        </div>
      </section>

      <h2 style={{ color: 'var(--rbl-title)' }}>Try a hypothetical project</h2>
      <p style={{ color: 'var(--rbl-text-muted)', fontSize: 13.5, marginTop: 0, marginBottom: 12 }}>
        The rate fields below are assumptions you set — not a quoted Town borrowing rate. Nobody, including the Town,
        knows what a future bond or BAN would price at until it&apos;s actually sold; this shows the mechanics of the
        tradeoff, not a prediction.
      </p>
      <CapitalDebtCalculator />

      <section style={{ ...card, marginTop: 18 }}>
        <h3 style={{ marginTop: 0, color: 'var(--rbl-title)', fontSize: 16 }}>Where these figures come from</h3>
        <p style={{ color: 'var(--rbl-text-body)', fontSize: 13.4, lineHeight: 1.6, marginTop: 0 }}>
          Balances, issue and maturity dates, and the repayment schedule: <strong>{debtProfile.source.title}</strong>,{' '}
          {debtProfile.source.detail}. Interest rates, formal issue names, the governmental/water-sewer split, the
          authorized-but-unissued balance and the debt-limit percentage: <strong>{debtProfile.auditSource.title}</strong>,{' '}
          {debtProfile.auditSource.detail} — the newest independent audit, one year older than the balances.
        </p>
        <p style={{ color: 'var(--rbl-text-body)', fontSize: 13.4, lineHeight: 1.6 }}>
          Only governmental debt counts toward the constitutional limit; water and sewer district debt is excluded by
          statute. The Town reported {usd(debtProfile.debtLimit.debtSubjectToLimit)} subject to the limit at{' '}
          {debtProfile.debtLimit.asOf} — {debtProfile.debtLimit.debtLimitExhaustedPct}% of it. The prior audit
          reported {debtProfile.debtLimit.priorYear.debtLimitExhaustedPct}% at {debtProfile.debtLimit.priorYear.asOf},
          but the two are not comparable: the earlier figure counted bonds only, while the later one counts the two
          BANs as well. Almost none of the difference is new borrowing. The constitutional limit itself is not printed
          as a dollar figure in the 2024 audit — the ~{usd(debtProfile.debtLimit.constitutionalDebtLimit)} shown here
          is implied by dividing the debt subject to the limit by the percentage the audit reports.
        </p>
        <p style={{ color: 'var(--rbl-text-muted)', fontSize: 12.5, marginBottom: 0 }}>
          Verify against the official filings before relying on any of it. Read the source:{' '}
          <a href={debtProfile.source.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--rbl-link)', fontWeight: 700 }}>
            2025 Annual Financial Report ↗
          </a>
        </p>
      </section>
    </PageShell>
  )
}

function Field({ term, value }: { term: string; value: string }) {
  return (
    <div>
      <dt style={{ color: 'var(--rbl-text-muted)', fontSize: 10.8, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 0.4 }}>{term}</dt>
      <dd style={{ margin: '1px 0 0', color: 'var(--rbl-text-strong)', fontSize: 13.4, fontWeight: 700 }}>{value}</dd>
    </div>
  )
}

function Stat({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div>
      <div style={{ color: 'var(--rbl-text-muted)', fontSize: 12.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.3 }}>{label}</div>
      <div style={{ color: accent ? 'var(--rbl-warn)' : 'var(--rbl-title)', fontSize: 22, fontWeight: 900, lineHeight: 1.2 }}>{value}</div>
      {sub && <div style={{ color: 'var(--rbl-text-muted)', fontSize: 12.5 }}>{sub}</div>}
    </div>
  )
}
