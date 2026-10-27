import PageShell from '../../components/PageShell'
import PlainCallout from '../../components/PlainCallout'

const base = process.env.NEXT_PUBLIC_BASE_PATH || ''
const card = { background: 'var(--rbl-surface)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 16, padding: 20 } as const
const th = { padding: '9px 10px', textAlign: 'left' as const, color: 'var(--rbl-text-muted)', fontSize: 13, fontWeight: 750, borderBottom: '1px solid var(--rbl-border-subtle)' }
const td = { padding: '9px 10px', verticalAlign: 'top' as const, borderBottom: '1px solid var(--rbl-border-subtle)' }
const usd = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
const pct = (n: number, d: number) => `${(n / d * 100).toFixed(1)}%`
const sourceLink = { color: 'var(--rbl-accent)', fontWeight: 700 }

const revenue = [
  { name: 'Property taxes', account: 'SM1-1001-001-00000-A', amount: 1_704_224, note: 'The district’s main tax-supported revenue.' },
  { name: 'LIPA PILOT', account: 'SM1-1081-100-00000-B', amount: 43_300, note: 'Payment in lieu of taxes.' },
  { name: 'Ambulance charges — medical billing', account: 'SM1-1640-000-00000-4', amount: 640_000, note: 'Budget estimate, not proof of collections.' },
  { name: 'Interest and earnings', account: 'SM1-2401-000-00000-G', amount: 1_300, note: 'Budget estimate.' },
]
const operating = [
  { name: 'RVAC service contract', account: 'SM1-4-4540-436-203-00000', amount: 1_274_924, note: 'Adopted starting amount, before the two adjustments below.' },
  { name: 'Vehicles / equipment', account: 'SM1-4-4540-280-000-00000', amount: 85_000, note: 'Vehicle and equipment appropriation.' },
  { name: 'Building maintenance', account: 'SM1-4-4540-402-000-00000', amount: 25_000, note: 'Repairs and maintenance — buildings.' },
  { name: 'Vehicle repairs', account: 'SM1-4-4540-405-000-00000', amount: 45_000, note: 'Repairs and maintenance — vehicles.' },
  { name: 'Fuel', account: 'SM1-4-4540-426-000-00000', amount: 35_000, note: 'Gasoline and diesel.' },
  { name: 'Office rent', account: 'SM1-4-4540-462-100-00000', amount: 6_900, note: 'Rents and leases — office.' },
  { name: 'Telephone', account: 'SM1-4-4540-471-000-00000', amount: 6_000, note: 'Utilities.' },
  { name: 'Electricity', account: 'SM1-4-4540-472-000-00000', amount: 25_000, note: 'Utilities.' },
  { name: 'Heating fuel / oil', account: 'SM1-4-4540-473-000-00000', amount: 10_000, note: 'Utilities.' },
  { name: 'Water', account: 'SM1-4-4540-474-000-00000', amount: 2_000, note: 'Utilities.' },
  { name: 'Administrative charges', account: 'SM1-4-4540-495-000-00000', amount: 164_400, note: 'Administrative charges allocated to the district.' },
]
const baseTotal = revenue.reduce((s, r) => s + r.amount, 0)
const operatingTotal = operating.reduce((s, r) => s + r.amount, 0)
const revisedContract = 1_274_924 + 100_000 + 99_322
const revisedTotal = baseTotal + 80_000

export const metadata = {
  title: 'Riverhead Volunteer Ambulance Corps — funding explained',
  description: 'A source-linked account of Riverhead Ambulance District funding: the 2026 adopted budget, property taxes and billing revenue, RVAC contract appropriations, fund-balance use, and the Town Board adjustments.',
}

export default function RvacFundingPage() {
  return (
    <PageShell
      title="Riverhead Volunteer Ambulance Corps: where the funding comes from"
      subtitle="A line-by-line look at the Town’s Ambulance District budget, the contract with RVAC, and the 2026 adjustments that corrected the original appropriation."
    >
      <PlainCallout
        tips={[
          { label: 'RVAC', text: 'Riverhead Volunteer Ambulance Corps, the service provider paid under contract.' },
          { label: 'Ambulance District', text: 'A separate Town fund (SM1), not the Town General Fund. Its revenues and reserves are not interchangeable with General Fund money.' },
          { label: 'Budget vs. cash', text: 'An appropriation is permission to spend, and a revenue estimate is a plan. Neither proves how much was ultimately collected or paid.' },
          { label: 'Fund balance', text: 'Accumulated surplus from earlier years. Using it can fund a one-time shortfall, but it is not recurring revenue.' },
        ]}
      >
        The key distinction: <strong>RVAC’s contract is one line inside a much larger Ambulance District budget.</strong> The adopted 2026 budget set that line at {usd(1_274_924)}. Two Town Board adjustments added {usd(199_322)} to it, taking the contract appropriation to <strong>{usd(revisedContract)}</strong>. Of the added amount, {usd(80_000)} came from Ambulance District fund balance; the rest was shifted from other district budget lines. These are budget authorizations, not a claim that this exact amount has already been paid.
      </PlainCallout>

      <section style={{ ...card, marginBottom: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 12 }}>
        <Stat label="2026 adopted fund budget" value={usd(baseTotal)} note="Before the in-year adjustments" />
        <Stat label="Revised fund budget" value={usd(revisedTotal)} note="Adds net $80,000 of fund-balance financing" />
        <Stat label="RVAC contract line" value={usd(revisedContract)} note="After Resolutions 2026-156 and 2026-470" />
        <Stat label="Fund-balance draw for correction" value={usd(80_000)} note="Explicitly listed in Resolution 2026-470" />
      </section>

      <section style={{ ...card, marginBottom: 16 }}>
        <h2 style={{ marginTop: 0, color: 'var(--rbl-title)' }}>1. How the 2026 Ambulance District was funded</h2>
        <p style={{ color: 'var(--rbl-text-body)', lineHeight: 1.6, fontSize: 14.5 }}>
          The adopted budget balanced {usd(baseTotal)} in planned revenues with {usd(baseTotal)} in planned expenditures. Property taxes are the largest revenue source; ambulance billing is the second-largest. The billing figure is an estimate in the budget, not audited collection data.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
            <thead><tr><th style={th}>Revenue source</th><th style={th}>Account</th><th style={{ ...th, textAlign: 'right' }}>2026 adopted</th><th style={{ ...th, textAlign: 'right' }}>Share</th><th style={th}>What it means</th></tr></thead>
            <tbody>
              {revenue.map(r => <tr key={r.account}><td style={{ ...td, fontWeight: 750 }}>{r.name}</td><td style={{ ...td, whiteSpace: 'nowrap', fontSize: 12 }}>{r.account}</td><td style={{ ...td, textAlign: 'right', whiteSpace: 'nowrap' }}>{usd(r.amount)}</td><td style={{ ...td, textAlign: 'right', whiteSpace: 'nowrap' }}>{pct(r.amount, baseTotal)}</td><td style={td}>{r.note}</td></tr>)}
              <tr style={{ background: 'var(--rbl-surface-2)', fontWeight: 850 }}><td style={td} colSpan={2}>Total adopted revenue</td><td style={{ ...td, textAlign: 'right' }}>{usd(baseTotal)}</td><td style={{ ...td, textAlign: 'right' }}>100.0%</td><td style={td}>Balanced to the adopted fund budget.</td></tr>
            </tbody>
          </table>
        </div>
        <p style={{ color: 'var(--rbl-text-muted)', fontSize: 12.5, lineHeight: 1.55, marginBottom: 0 }}>
          The 2025 budget used a separate “Ambulance Charges — Full Billing” line of {usd(2_710_749)} and only {usd(100_000)} for medical billing. In the 2026 adopted budget, the full-billing line is zeroed and the medical-billing estimate is {usd(640_000)}. That is a change in budget presentation and forecast; it does not by itself establish actual collections or a change in patient billing practices.
        </p>
      </section>

      <section style={{ ...card, marginBottom: 16 }}>
        <h2 style={{ marginTop: 0, color: 'var(--rbl-title)' }}>2. Where the adopted budget planned to spend the money</h2>
        <p style={{ color: 'var(--rbl-text-body)', lineHeight: 1.6, fontSize: 14.5 }}>
          The contract is not the entire budget. Alongside ambulance operations, the district budgeted a transfer to General Fund debt service, a reserve contribution, and insurance. Those items serve different purposes and should not be described as payments to RVAC.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
            <thead><tr><th style={th}>Budget line</th><th style={th}>Account</th><th style={{ ...th, textAlign: 'right' }}>2026 adopted</th><th style={th}>Explanation</th></tr></thead>
            <tbody>
              {operating.map(r => <tr key={r.account}><td style={{ ...td, fontWeight: 750 }}>{r.name}</td><td style={{ ...td, whiteSpace: 'nowrap', fontSize: 12 }}>{r.account}</td><td style={{ ...td, textAlign: 'right', whiteSpace: 'nowrap' }}>{usd(r.amount)}</td><td style={td}>{r.note}</td></tr>)}
              <tr style={{ background: 'var(--rbl-surface-2)', fontWeight: 850 }}><td style={td}>Ambulance operations subtotal</td><td style={td}></td><td style={{ ...td, textAlign: 'right' }}>{usd(operatingTotal)}</td><td style={td}>Includes the original RVAC contract line.</td></tr>
              <tr><td style={{ ...td, fontWeight: 750 }}>Transfer to General Fund debt service</td><td style={{ ...td, fontSize: 12, whiteSpace: 'nowrap' }}>SM1-9-9901-900-V01-00000</td><td style={{ ...td, textAlign: 'right', whiteSpace: 'nowrap' }}>{usd(450_000)}</td><td style={td}>An interfund transfer, not an RVAC contract payment.</td></tr>
              <tr><td style={{ ...td, fontWeight: 750 }}>RVAC &amp; Improvements Reserve contribution</td><td style={{ ...td, fontSize: 12, whiteSpace: 'nowrap' }}>SM1-9-9990-000-000-00000</td><td style={{ ...td, textAlign: 'right', whiteSpace: 'nowrap' }}>{usd(190_000)}</td><td style={td}>Money budgeted to be set aside, not an operating expense paid to RVAC.</td></tr>
              <tr><td style={{ ...td, fontWeight: 750 }}>Insurance</td><td style={{ ...td, fontSize: 12, whiteSpace: 'nowrap' }}>SM1-1-1910</td><td style={{ ...td, textAlign: 'right', whiteSpace: 'nowrap' }}>{usd(69_600)}</td><td style={td}>General liability insurance premiums and claim payments.</td></tr>
              <tr style={{ background: 'var(--rbl-surface-2)', fontWeight: 850 }}><td style={td} colSpan={2}>Total adopted expenditures</td><td style={{ ...td, textAlign: 'right' }}>{usd(baseTotal)}</td><td style={td}>Matches planned revenue.</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <section style={{ ...card, marginBottom: 16, borderColor: 'var(--rbl-border-strong)' }}>
        <h2 style={{ marginTop: 0, color: 'var(--rbl-title)' }}>3. The two 2026 corrections to RVAC’s contract line</h2>
        <div style={{ display: 'grid', gap: 14 }}>
          <div style={{ border: '1px solid var(--rbl-border-subtle)', borderRadius: 12, padding: 15 }}>
            <div style={{ color: 'var(--rbl-text-muted)', fontSize: 12, fontWeight: 800 }}>FEBRUARY 18, 2026 · RESOLUTION 2026-156</div>
            <h3 style={{ color: 'var(--rbl-title)', margin: '5px 0 8px' }}>Move $100,000 from other ambulance lines to RVAC</h3>
            <p style={{ color: 'var(--rbl-text-body)', lineHeight: 1.6, fontSize: 14, margin: '0 0 10px' }}>
              The resolution described inaccuracies in several expenditure lines in the adopted budget. It moved existing appropriations into the RVAC professional-services account; it did not add $100,000 to the total district budget.
            </p>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead><tr><th style={th}>Source line reduced</th><th style={{ ...th, textAlign: 'right' }}>Moved to RVAC</th></tr></thead>
                <tbody>
                  <tr><td style={td}>Vehicles / equipment</td><td style={{ ...td, textAlign: 'right' }}>{usd(20_000)}</td></tr>
                  <tr><td style={td}>Other professional services</td><td style={{ ...td, textAlign: 'right' }}>{usd(30_000)}</td></tr>
                  <tr><td style={td}>Equipment rent / lease</td><td style={{ ...td, textAlign: 'right' }}>{usd(50_000)}</td></tr>
                  <tr style={{ fontWeight: 850 }}><td style={td}>Total reallocated</td><td style={{ ...td, textAlign: 'right' }}>{usd(100_000)}</td></tr>
                </tbody>
              </table>
            </div>
            <p style={{ color: 'var(--rbl-text-muted)', fontSize: 12.5, marginBottom: 0 }}>Adopted unanimously. The minutes record Supervisor Halpin and all four council members voting yes.</p>
          </div>
          <div style={{ border: '1px solid var(--rbl-border-subtle)', borderRadius: 12, padding: 15 }}>
            <div style={{ color: 'var(--rbl-text-muted)', fontSize: 12, fontWeight: 800 }}>MAY 20, 2026 · RESOLUTION 2026-470</div>
            <h3 style={{ color: 'var(--rbl-title)', margin: '5px 0 8px' }}>Add $99,322 to RVAC’s line, including $80,000 from fund balance</h3>
            <p style={{ color: 'var(--rbl-text-body)', lineHeight: 1.6, fontSize: 14, margin: '0 0 10px' }}>
              This resolution added $99,322 to the contract line. It reduced the vehicle line by $19,322 and charged $80,000 to the district’s “Appropriated Fund Balance” account. Because the vehicle reduction offsets part of the addition, the net increase to the fund budget is $80,000—not $99,322.
            </p>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead><tr><th style={th}>Funding / offset</th><th style={{ ...th, textAlign: 'right' }}>Amount</th><th style={th}>Effect</th></tr></thead>
                <tbody>
                  <tr><td style={td}>Reduce vehicles / equipment</td><td style={{ ...td, textAlign: 'right' }}>{usd(19_322)}</td><td style={td}>Reallocated from another district line.</td></tr>
                  <tr><td style={td}>Appropriated Ambulance District fund balance</td><td style={{ ...td, textAlign: 'right' }}>{usd(80_000)}</td><td style={td}>One-time accumulated savings, no new recurring revenue.</td></tr>
                  <tr style={{ fontWeight: 850 }}><td style={td}>Total added to RVAC contract</td><td style={{ ...td, textAlign: 'right' }}>{usd(99_322)}</td><td style={td}>Net district budget increase: {usd(80_000)}.</td></tr>
                </tbody>
              </table>
            </div>
            <p style={{ color: 'var(--rbl-text-muted)', fontSize: 12.5, marginBottom: 0 }}>Adopted unanimously by the four members present; Councilman Robert Kern was absent. Supervisor Halpin voted yes.</p>
          </div>
        </div>
        <div style={{ background: 'var(--rbl-surface-2)', borderRadius: 12, padding: 15, marginTop: 14 }}>
          <h3 style={{ margin: '0 0 6px', color: 'var(--rbl-title)' }}>What changed after both resolutions?</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
              <tbody>
                <tr><td style={td}>Original 2026 RVAC contract appropriation</td><td style={{ ...td, textAlign: 'right', whiteSpace: 'nowrap' }}>{usd(1_274_924)}</td></tr>
                <tr><td style={td}>February reallocation</td><td style={{ ...td, textAlign: 'right', whiteSpace: 'nowrap' }}>+{usd(100_000)}</td></tr>
                <tr><td style={td}>May contract adjustment</td><td style={{ ...td, textAlign: 'right', whiteSpace: 'nowrap' }}>+{usd(99_322)}</td></tr>
                <tr style={{ fontWeight: 900 }}><td style={td}>Revised RVAC contract appropriation</td><td style={{ ...td, textAlign: 'right', whiteSpace: 'nowrap' }}>{usd(revisedContract)}</td></tr>
              </tbody>
            </table>
          </div>
          <p style={{ color: 'var(--rbl-text-body)', lineHeight: 1.6, fontSize: 13.5, marginBottom: 0 }}>
            Compared with the 2025 adopted RVAC line of {usd(1_347_300)}, the revised 2026 appropriation is {usd(revisedContract - 1_347_300)} higher ({pct(revisedContract - 1_347_300, 1_347_300)}). That comparison is between budget authorizations, not audited cash payments.
          </p>
        </div>
      </section>

      <section style={{ ...card, marginBottom: 16 }}>
        <h2 style={{ marginTop: 0, color: 'var(--rbl-title)' }}>4. Contract history: the adopted RVAC line</h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
            <thead><tr><th style={th}>Budget year</th><th style={{ ...th, textAlign: 'right' }}>Adopted RVAC line</th><th style={th}>Reading</th></tr></thead>
            <tbody>
              {[
                [2020, 1_165_000], [2021, 1_231_700], [2022, 1_244_100], [2023, 1_280_279], [2024, 1_308_189], [2025, 1_347_300], [2026, 1_274_924],
              ].map(([year, amount]) => <tr key={year}><td style={td}>{year}</td><td style={{ ...td, textAlign: 'right', whiteSpace: 'nowrap' }}>{usd(amount)}</td><td style={td}>{year === 2026 ? 'Before the two adjustments above.' : 'Adopted budget line; not actual cash paid.'}</td></tr>)}
              <tr style={{ background: 'var(--rbl-surface-2)', fontWeight: 900 }}><td style={td}>2026 after adjustments</td><td style={{ ...td, textAlign: 'right', whiteSpace: 'nowrap' }}>{usd(revisedContract)}</td><td style={td}>Calculated from Resolutions 2026-156 and 2026-470.</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <section style={{ ...card, marginBottom: 16 }}>
        <h2 style={{ marginTop: 0, color: 'var(--rbl-title)' }}>5. What this record does—and does not—prove</h2>
        <ul style={{ color: 'var(--rbl-text-body)', lineHeight: 1.65, paddingLeft: 20, fontSize: 14 }}>
          <li>The 2026 adopted budget planned {usd(1_274_924)} for the RVAC contract; the two resolutions raise the authorized line to {usd(revisedContract)}.</li>
          <li>The first correction reallocated $100,000 within the existing district budget. The second added $99,322 to RVAC but was funded by a $19,322 reduction elsewhere and $80,000 from district fund balance.</li>
          <li>The Ambulance District is separate from the General Fund. These resolutions do not show a $450,000 General Fund shortfall; they document a specific correction to the district’s RVAC contract line.</li>
          <li>The 2026 budget also contains {usd(450_000)} for a transfer to General Fund debt service and {usd(190_000)} for the RVAC &amp; Improvements Reserve. Neither line is itself the RVAC service-contract payment.</li>
          <li>The available budget and resolutions do not establish the final amount paid to RVAC, actual medical-billing collections, the current reserve balance after all transactions, or whether further adjustments occurred after the records reviewed. Those require year-end ledger / audited actuals and the full contract-payment ledger.</li>
        </ul>
      </section>

      <section style={{ ...card, marginBottom: 16 }}>
        <h2 style={{ marginTop: 0, color: 'var(--rbl-title)' }}>Sources and related views</h2>
        <ul style={{ color: 'var(--rbl-text-body)', lineHeight: 1.8, paddingLeft: 20, fontSize: 14 }}>
          <li><a href="https://www.townofriverheadny.gov/DocumentCenter/View/2967/2026-Adopted-Budget" target="_blank" rel="noreferrer" style={sourceLink}>Town of Riverhead — 2026 Adopted Budget</a> (fund SM1 and the account lines above).</li>
          <li><a href="https://www.townofriverheadny.gov/129/Agendas-Minutes" target="_blank" rel="noreferrer" style={sourceLink}>Town Board agendas and minutes</a>: Resolution 2026-156 (February 18, 2026), Resolution 2026-470 (May 20, 2026), Resolution 2025-944 (adoption of the 2026 budget), and the RVAC agreement Resolution 2023-932.</li>
          <li><a href="https://rike4545.github.io/Riverhead-NY-Budget-Web-App/supervisor-promises/" style={sourceLink}>The Supervisor’s promises and the record</a> — the $450,000 shortfall claim and the evidence for the RVAC budget correction.</li>
          <li><a href={`${base}/funds/SM1/`} style={sourceLink}>Ambulance District fund drilldown</a> — account-level adopted budget data.</li>
          <li><a href={`${base}/fund-balance-draws/`} style={sourceLink}>Where the surplus went</a> — fund-balance use across Town resolutions.</li>
          <li><a href={`${base}/records/`} style={sourceLink}>Records to request</a> — use this if you want to pursue the contract, invoices, actual billing receipts, and year-end ledger.</li>
        </ul>
        <p style={{ color: 'var(--rbl-text-muted)', fontSize: 12.5, lineHeight: 1.55, marginBottom: 0 }}>
          Method: amounts marked “adopted” are from the Town’s 2026 budget. Revised figures are arithmetic from the cited resolutions. The page distinguishes planned revenues, spending authority, transfers, and reserve contributions; it does not treat them as interchangeable cash flows.
        </p>
      </section>
    </PageShell>
  )
}

function Stat({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div style={{ border: '1px solid var(--rbl-border-subtle)', borderRadius: 12, padding: 15, minWidth: 0 }}>
      <div style={{ color: 'var(--rbl-text-muted)', fontSize: 12.5, fontWeight: 750, lineHeight: 1.4 }}>{label}</div>
      <div style={{ color: 'var(--rbl-title)', fontSize: 25, fontWeight: 900, lineHeight: 1.2, margin: '5px 0' }}>{value}</div>
      <div style={{ color: 'var(--rbl-text-body)', fontSize: 12.5, lineHeight: 1.5 }}>{note}</div>
    </div>
  )
}
