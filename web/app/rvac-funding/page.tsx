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
  { name: 'Property taxes', account: 'SM1-1001-001-00000-A', actual2025: 1_658_799.99, amount: 1_704_224, ytd: 1_704_224.02, note: 'The district’s main tax-supported revenue.' },
  { name: 'LIPA PILOT', account: 'SM1-1081-100-00000-B', actual2025: 43_295.85, amount: 43_300, ytd: 0, note: 'Payment in lieu of taxes.' },
  { name: 'Ambulance charges — medical billing', account: 'SM1-1640-000-00000-4', actual2025: 205_790.24, amount: 640_000, ytd: -205_790.24, note: '2025 actual and 2026 YTD are equal and opposite; the journal entry needs explanation.' },
  { name: 'Ambulance charges — full billing', account: 'SM1-1640-100-00000-4', actual2025: 0, amount: 0, ytd: 0, note: 'Separate revenue line; budgeted at $0 in 2026.' },
  { name: 'Interest and earnings', account: 'SM1-2401-000-00000-G', actual2025: 37_418.99, amount: 1_300, ytd: 15_120.64, note: 'Budget estimate.' },
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
const actual2025Total = revenue.reduce((s, r) => s + r.actual2025, 0)
const operatingTotal = operating.reduce((s, r) => s + r.amount, 0)
const revisedContract = 1_274_924 - 100_000 + 99_322
const revisedTotal = baseTotal + 80_000 + 45_000
const ytdRevenueTotal = revenue.reduce((s, r) => s + r.ytd, 0)

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
        The key distinction: <strong>RVAC’s contract is one line inside a much larger Ambulance District budget.</strong> The original adopted 2026 budget set that line at {usd(1_274_924)}. Resolution 2026-156 moved {usd(100_000)} out of the RVAC line to other Ambulance District lines; Resolution 2026-470 later added {usd(99_322)} back. The calculated line after both changes is <strong>{usd(revisedContract)}</strong>—{usd(678)} below the original adopted amount. The May addition used {usd(80_000)} of fund balance and a {usd(19_322)} reduction to the vehicle line. These are budget authorizations, not a claim that this exact amount has already been paid.
      </PlainCallout>

      <section style={{ ...card, marginBottom: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 12 }}>
        <Stat label="2026 adopted fund budget" value={usd(baseTotal)} note="Before the in-year adjustments" />
        <Stat label="Known revised fund budget" value={usd(revisedTotal)} note="Adds $80,000 for RVAC and $45,000 for Armory repairs from fund balance" />
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
            <thead><tr><th style={th}>Revenue source</th><th style={th}>Account</th><th style={{ ...th, textAlign: 'right' }}>2025 actual</th><th style={{ ...th, textAlign: 'right' }}>2026 adopted</th><th style={{ ...th, textAlign: 'right' }}>YTD to Jun. 30</th><th style={{ ...th, textAlign: 'right' }}>Budget share</th><th style={th}>What it means</th></tr></thead>
            <tbody>
              {revenue.map(r => <tr key={r.account}><td style={{ ...td, fontWeight: 750 }}>{r.name}</td><td style={{ ...td, whiteSpace: 'nowrap', fontSize: 12 }}>{r.account}</td><td style={{ ...td, textAlign: 'right', whiteSpace: 'nowrap' }}>{usd(r.actual2025)}</td><td style={{ ...td, textAlign: 'right', whiteSpace: 'nowrap' }}>{usd(r.amount)}</td><td style={{ ...td, textAlign: 'right', whiteSpace: 'nowrap', color: r.ytd < 0 ? 'var(--rbl-accent)' : undefined }}>{usd(r.ytd)}</td><td style={{ ...td, textAlign: 'right', whiteSpace: 'nowrap' }}>{pct(r.amount, baseTotal)}</td><td style={td}>{r.note}</td></tr>)}
              <tr style={{ background: 'var(--rbl-surface-2)', fontWeight: 850 }}><td style={td} colSpan={2}>Total revenue</td><td style={{ ...td, textAlign: 'right' }}>{usd(actual2025Total)}</td><td style={{ ...td, textAlign: 'right' }}>{usd(baseTotal)}</td><td style={{ ...td, textAlign: 'right' }}>{usd(ytdRevenueTotal)}</td><td style={{ ...td, textAlign: 'right' }}>100.0%</td><td style={td}>2025 actual, 2026 adopted, and YTD through June 30.</td></tr>
            </tbody>
          </table>
        </div>
        <p style={{ color: 'var(--rbl-text-muted)', fontSize: 12.5, lineHeight: 1.55, marginBottom: 0 }}>
          The Town’s 2027 Budget Supplement reports {usd(ytdRevenueTotal)} in total Ambulance District revenue through June 30, 2026. Its medical-billing line is negative {usd(205_790.24)}, exactly offsetting the {usd(205_790.24)} reported as 2025 actual medical-billing revenue. That exact reversal may reflect a reclassification or journal entry, but the supplement does not explain it. The ledger and billing-reconciliation detail are needed before drawing conclusions about collections. The 2025 budget had {usd(2_710_749)} estimated on the separate “Full Billing” line and {usd(100_000)} on medical billing, but the supplement reports $0 actual full-billing revenue for 2025 and {usd(205_790.24)} actual medical-billing revenue. The 2026 adopted budget zeroed the full-billing line and estimated {usd(640_000)} in medical billing. The identical negative 2026 YTD medical-billing amount should be reconciled to the underlying journal entries.
        </p>
      </section>

      <section style={{ ...card, marginBottom: 16 }}>
        <h2 style={{ marginTop: 0, color: 'var(--rbl-title)' }}>As of June 30, 2026: what the supplement reports</h2>
        <p style={{ color: 'var(--rbl-text-body)', fontSize: 14, lineHeight: 1.6 }}>
          The Town’s 2027 Budget Supplement lists year-to-date expenditure figures through June 30, 2026. They are an interim accounting snapshot, not the final 2026 result.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
            <thead><tr><th style={th}>Expenditure category</th><th style={{ ...th, textAlign: 'right' }}>YTD to Jun. 30</th><th style={th}>Interpretation</th></tr></thead>
            <tbody>
              <tr><td style={td}>RVAC professional-services line</td><td style={{ ...td, textAlign: 'right', whiteSpace: 'nowrap' }}>{usd(350_298)}</td><td style={td}>Reported 2026 YTD amount; not the final annual payment total.</td></tr>
              <tr><td style={td}>Ambulance function subtotal</td><td style={{ ...td, textAlign: 'right', whiteSpace: 'nowrap' }}>{usd(429_585.05)}</td><td style={td}>Includes RVAC plus vehicles, repairs, fuel, utilities and administration.</td></tr>
              <tr><td style={td}>Insurance</td><td style={{ ...td, textAlign: 'right', whiteSpace: 'nowrap' }}>{usd(66_526.84)}</td><td style={td}>Liability insurance and claim payments.</td></tr>
              <tr><td style={td}>Transfer to General Fund debt service</td><td style={{ ...td, textAlign: 'right', whiteSpace: 'nowrap' }}>{usd(0)}</td><td style={td}>No YTD amount shown in the supplement.</td></tr>
              <tr><td style={td}>RVAC &amp; Improvements Reserve contribution</td><td style={{ ...td, textAlign: 'right', whiteSpace: 'nowrap' }}>{usd(0)}</td><td style={td}>No YTD contribution shown in the supplement as of June 30.</td></tr>
            </tbody>
          </table>
        </div>
        <p style={{ color: 'var(--rbl-text-muted)', fontSize: 12.5, lineHeight: 1.55, marginBottom: 0 }}>
          The supplement’s RVAC line shows {usd(1_174_924)} in its “2026 Adopted Budget” column, while the original adopted-budget page shows {usd(1_274_924)}. The difference matches the February {usd(100_000)} reallocation described below. The May resolution then adds {usd(99_322)} back. We show both documents rather than silently treating their differently timed figures as the same thing.
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
              <tr><td style={{ ...td, fontWeight: 750 }}>RVAC &amp; Improvements Reserve contribution</td><td style={{ ...td, fontSize: 12, whiteSpace: 'nowrap' }}>SM1-9-9990-000-000-00000</td><td style={{ ...td, textAlign: 'right', whiteSpace: 'nowrap' }}>{usd(190_000)}</td><td style={td}>Money budgeted to be set aside, not an operating expense paid to RVAC. The 2025 adopted reserve contribution was {usd(2_536_549)}; the 2026 contribution was reduced to {usd(190_000)}. These annual appropriations are not the reserve’s cash balance.</td></tr>
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
            <h3 style={{ color: 'var(--rbl-title)', margin: '5px 0 8px' }}>Move $100,000 out of RVAC to other ambulance lines</h3>
            <p style={{ color: 'var(--rbl-text-body)', lineHeight: 1.6, fontSize: 14, margin: '0 0 10px' }}>
              The resolution corrected several lines that the original adopted budget had left at different amounts. The Town’s 2027 Budget Supplement’s 2026 column shows vehicles at {usd(105_000)}, other professional services at {usd(30_000)}, equipment rent at {usd(50_000)}, and RVAC at {usd(1_174_924)}—a pattern consistent with moving {usd(100_000)} out of RVAC and into those three lines. The original 2026 adopted budget instead shows vehicles at {usd(85_000)}, the other two lines at $0, and RVAC at {usd(1_274_924)}. The supplement appears to incorporate this February adjustment even though it labels the column “2026 Adopted Budget”; that difference is important to disclose.
            </p>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead><tr><th style={th}>Other district line increased</th><th style={{ ...th, textAlign: 'right' }}>Amount moved from RVAC</th></tr></thead>
                <tbody>
                  <tr><td style={td}>Vehicles / equipment</td><td style={{ ...td, textAlign: 'right' }}>{usd(20_000)}</td></tr>
                  <tr><td style={td}>Other professional services</td><td style={{ ...td, textAlign: 'right' }}>{usd(30_000)}</td></tr>
                  <tr><td style={td}>Equipment rent / lease</td><td style={{ ...td, textAlign: 'right' }}>{usd(50_000)}</td></tr>
                  <tr style={{ fontWeight: 850 }}><td style={td}>Total moved out of RVAC</td><td style={{ ...td, textAlign: 'right' }}>{usd(100_000)}</td></tr>
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
                <tr><td style={td}>February reallocation out of RVAC</td><td style={{ ...td, textAlign: 'right', whiteSpace: 'nowrap' }}>−{usd(100_000)}</td></tr>
                <tr><td style={td}>May contract adjustment</td><td style={{ ...td, textAlign: 'right', whiteSpace: 'nowrap' }}>+{usd(99_322)}</td></tr>
                <tr style={{ fontWeight: 900 }}><td style={td}>Revised RVAC contract appropriation</td><td style={{ ...td, textAlign: 'right', whiteSpace: 'nowrap' }}>{usd(revisedContract)}</td></tr>
              </tbody>
            </table>
          </div>
          <p style={{ color: 'var(--rbl-text-body)', lineHeight: 1.6, fontSize: 13.5, marginBottom: 0 }}>
            Compared with the 2025 adopted RVAC line of {usd(1_347_300)}, the calculated revised 2026 appropriation is {usd(1_347_300 - revisedContract)} lower ({pct(1_347_300 - revisedContract, 1_347_300)}). That comparison is between budget authorizations, not audited cash payments.
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
        <h2 style={{ marginTop: 0, color: 'var(--rbl-title)' }}>5. What the 2027 Tentative Budget proposes</h2>
        <p style={{ color: 'var(--rbl-text-body)', fontSize: 14, lineHeight: 1.6 }}>
          The next year’s plan is still <strong>tentative, not adopted</strong>. It proposes a larger RVAC contract line, while reducing the planned debt-service transfer and reserve contribution and lowering the medical-billing revenue estimate.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 12, margin: '14px 0' }}>
          <Stat label="2027 tentative Ambulance District budget" value={usd(2_312_093)} note="Down from the 2026 adopted plan of $2,388,824." />
          <Stat label="2027 tentative RVAC line" value={usd(1_401_731)} note={`${usd(127_485)} above the calculated post-resolution 2026 line.`} />
          <Stat label="Property-tax revenue" value={usd(1_751_693)} note={`${usd(47_469)} above the 2026 adopted estimate.`} />
          <Stat label="Medical-billing estimate" value={usd(514_000)} note={`${usd(126_000)} below the 2026 adopted estimate; not actual collections.`} />
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
            <thead><tr><th style={th}>2027 tentative line</th><th style={{ ...th, textAlign: 'right' }}>Amount</th><th style={th}>Compared with 2026 adopted plan</th></tr></thead>
            <tbody>
              <tr><td style={td}>Ambulance function, including RVAC</td><td style={{ ...td, textAlign: 'right', whiteSpace: 'nowrap' }}>{usd(1_826_231)}</td><td style={td}>Includes a tentative RVAC line of {usd(1_401_731)}.</td></tr>
              <tr><td style={td}>Insurance</td><td style={{ ...td, textAlign: 'right', whiteSpace: 'nowrap' }}>{usd(36_732)}</td><td style={td}>Down from {usd(69_600)}.</td></tr>
              <tr><td style={td}>Transfer to General Fund debt service</td><td style={{ ...td, textAlign: 'right', whiteSpace: 'nowrap' }}>{usd(324_000)}</td><td style={td}>Down from {usd(450_000)}.</td></tr>
              <tr><td style={td}>RVAC &amp; Improvements Reserve contribution</td><td style={{ ...td, textAlign: 'right', whiteSpace: 'nowrap' }}>{usd(125_130)}</td><td style={td}>Down from {usd(190_000)}; this is the budgeted contribution, not the reserve balance.</td></tr>
              <tr style={{ background: 'var(--rbl-surface-2)', fontWeight: 850 }}><td style={td}>Total tentative expenditures</td><td style={{ ...td, textAlign: 'right', whiteSpace: 'nowrap' }}>{usd(2_312_093)}</td><td style={td}>Balanced to the tentative revenue plan.</td></tr>
            </tbody>
          </table>
        </div>
        <p style={{ color: 'var(--rbl-text-muted)', fontSize: 12.5, lineHeight: 1.55, marginBottom: 0 }}>
          The Town’s 2027 Budget Supplement uses {usd(1_174_924)} as the 2026 comparison value for RVAC, apparently reflecting the February reallocation but not the May addition. The tentative 2027 line is therefore best compared with both the published supplement and the calculated post-resolution 2026 line; neither is a substitute for the final 2026 ledger.
          {' '}<a href={`${base}/tentative-2027/`} style={sourceLink}>Review the 2027 Tentative Budget analysis →</a>
        </p>
      </section>

      <section style={{ ...card, marginBottom: 16 }}>
        <h2 style={{ marginTop: 0, color: 'var(--rbl-title)' }}>6. New headquarters: donations, a Town bond, and lease payments</h2>
        <p style={{ color: 'var(--rbl-text-body)', lineHeight: 1.6, fontSize: 14.5 }}>
          The new ambulance headquarters is a separate capital project—not part of RVAC’s annual service-contract line above. The September 1, 2026 public-hearing notice put the project’s estimated maximum cost at <strong>$14.1 million</strong>. The stated financing plan was $6 million provided by RVAC from private fundraising and other available funds, with the balance—up to <strong>$8.1 million</strong>—financed through Town-issued bonds. At the hearing, the Supervisor said fundraising was then just under $6.5 million. Those are reported project-financing figures, not proof of the final construction cost, final donations received, or bonds ultimately issued.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 12, margin: '14px 0' }}>
          <Stat label="Maximum project estimate" value="$14.1 million" note="Estimated maximum cost in the public-hearing notice." />
          <Stat label="RVAC private funding" value="$6.0 million" note="Formal financing plan; later public remarks said fundraising was nearly $6.5 million." />
          <Stat label="Town bond authorization ceiling" value="$8.1 million" note="Maximum planned bond financing, not confirmation of the amount actually borrowed." />
        </div>
        <ul style={{ color: 'var(--rbl-text-body)', lineHeight: 1.65, paddingLeft: 20, fontSize: 14 }}>
          <li><strong>Ownership:</strong> the new building is to be owned by the Ambulance District and leased to RVAC.</li>
          <li><strong>Repayment plan:</strong> the public notice and hearing record say the lease agreement requires payments from RVAC to the district sufficient to cover bond debt service. The stated plan relies on ambulance-billing revenue generated by services RVAC provides.</li>
          <li><strong>Risk distinction:</strong> “planned to be paid by RVAC” is not the same as proof that the Town has no financial exposure. The bond documents, executed lease, actual billing collections, debt-service schedule and any guarantee or backstop determine who bears the risk if collections fall short.</li>
          <li><strong>Timeline:</strong> while the existing headquarters is replaced, RVAC temporarily operates from the Town-owned Armory. Resolution 2026-842 appropriated <strong>$45,000</strong> from Ambulance District fund balance for Armory building repairs. That is a separate operating-fund adjustment, not part of the $8.1 million bond ceiling.</li>
          <li><strong>Other Town facilities:</strong> 2026 resolutions also authorized temporary use of Town space for EMT instruction, medical billing / records storage and ambulance vehicle storage. The resolutions identify the uses, but do not provide a dollar value for that space or establish whether rent was charged.</li>
        </ul>
        <p style={{ color: 'var(--rbl-text-body)', fontSize: 14, lineHeight: 1.7, marginBottom: 0 }}>
          Sources: <a href="https://riverheadlocal.com/public-notice/town-of-riverhead-notice-of-public-hearing-168/" target="_blank" rel="noreferrer" style={sourceLink}>Town’s September 1 public-hearing notice (reproduced by RiverheadLOCAL)</a>; <a href="https://riverheadtranscripts.org/meetings/town-board/2026-09-01_6442.html" target="_blank" rel="noreferrer" style={sourceLink}>September 1 Town Board hearing and bond resolution</a>; <a href="https://riverheadlocal.com/2026/08/05/riverhead-approves-zoning-exemptions-for-new-rvac-headquarters/" target="_blank" rel="noreferrer" style={sourceLink}>RiverheadLOCAL’s project and lease reporting</a>; <a href="https://www.riverheadvac.com/content/newhq/default.cfm" target="_blank" rel="noreferrer" style={sourceLink}>RVAC’s headquarters fundraising page</a>; Town Board Resolution 2026-842 (September 15).
        </p>
      </section>

      <section style={{ ...card, marginBottom: 16 }}>
        <h2 style={{ marginTop: 0, color: 'var(--rbl-title)' }}>7. What this record does—and does not—prove</h2>
        <ul style={{ color: 'var(--rbl-text-body)', lineHeight: 1.65, paddingLeft: 20, fontSize: 14 }}>
          <li>The original adopted RVAC line was {usd(1_274_924)}. After the February reduction and May addition, the calculated line is {usd(revisedContract)}, just {usd(678)} below the original amount.</li>
          <li>Resolution 2026-156 moved $100,000 out of RVAC into other district lines; Resolution 2026-470 added $99,322 back, including $80,000 from fund balance. Resolution 2026-842 later added $45,000 from fund balance for temporary Armory repairs.</li>
          <li>The Ambulance District is separate from the General Fund. These resolutions do not show a $450,000 General Fund shortfall; they document a specific correction to the district’s RVAC contract line.</li>
          <li>The 2026 budget also contains {usd(450_000)} for a transfer to General Fund debt service and {usd(190_000)} for the RVAC &amp; Improvements Reserve. Neither line is itself the RVAC service-contract payment.</li>
          <li>The available budget and resolutions do not establish the final amount paid to RVAC, explain the negative YTD medical-billing figure, establish the current reserve balance after all transactions, or show whether further adjustments occurred after the records reviewed. Those require year-end ledger / audited actuals and the full contract-payment ledger.</li>
        </ul>
      </section>

      <section style={{ ...card, marginBottom: 16 }}>
        <h2 style={{ marginTop: 0, color: 'var(--rbl-title)' }}>Sources and related views</h2>
        <ul style={{ color: 'var(--rbl-text-body)', lineHeight: 1.8, paddingLeft: 20, fontSize: 14 }}>
          <li><a href="https://www.townofriverheadny.gov/DocumentCenter/View/2967/2026-Adopted-Budget" target="_blank" rel="noreferrer" style={sourceLink}>Town of Riverhead — 2026 Adopted Budget</a> (fund SM1 and the account lines above).</li>
          <li><a href={`${base}/tentative-2027/`} style={sourceLink}>2027 Budget Supplement analysis</a> — line-level 2026 actuals through June 30, 2026, including RVAC expenditures and the negative medical-billing entry.</li>
          <li><a href="https://www.townofriverheadny.gov/476/2026-Adopted-Budget" target="_blank" rel="noreferrer" style={sourceLink}>Town’s 2026 Adopted Budget line tables</a> — the original RVAC appropriation of $1,274,924 before the February adjustment.</li>
          <li><a href="https://www.townofriverheadny.gov/129/Agendas-Minutes" target="_blank" rel="noreferrer" style={sourceLink}>Town Board agendas and minutes</a>: Resolution 2026-156 (February 18, 2026), Resolution 2026-470 (May 20, 2026), Resolution 2026-842 (September 15, 2026), Resolution 2025-944 (adoption of the 2026 budget), and the RVAC agreement Resolution 2023-932.</li>
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
