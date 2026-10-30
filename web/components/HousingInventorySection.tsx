const card = { background: 'var(--rbl-surface)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 16, padding: 20 } as const
const th = { padding: '10px 12px', fontSize: 12.5, fontWeight: 700, color: 'var(--rbl-text-body)' as const, textAlign: 'left' as const }
const td = { padding: '10px 12px', color: 'var(--rbl-text-strong)', verticalAlign: 'top' as const, lineHeight: 1.5, borderTop: '1px solid var(--rbl-border-subtle)' }

const metrics = [
  { label: 'Total housing units', value: '16,498', note: 'ACS 2020–2024 estimate' },
  { label: 'Owner-occupied', value: '79.8%', note: 'Share of occupied homes' },
  { label: 'Rental vacancy', value: '3.7%', note: 'ACS estimate; margin of error ±2.9 points' },
  { label: 'Homeowner vacancy', value: '1.0%', note: 'ACS estimate; margin of error ±0.9 points' },
  { label: 'Median owner value', value: '$486,600', note: 'Owner-reported value' },
  { label: 'Median gross rent', value: '$1,974/mo.', note: 'Includes utilities' },
  { label: 'Owner costs with mortgage', value: '$2,944/mo.', note: 'Median selected monthly costs' },
  { label: 'Rent-burdened renters', value: '39.1%', note: 'Pay at least 35% of income toward housing' },
  { label: 'Single-family detached', value: '68.7%', note: 'Share of housing units' },
  { label: 'Mobile homes', value: '14.1%', note: 'Share of housing units' },
]

const pipeline = [
  {
    project: 'Northville Commons',
    status: 'State funding award announced Oct. 27, 2026',
    units: '80 affordable apartments',
    affordability: 'Households at 50%–80% of area median income; 20 units reserved for people with disabilities',
    note: 'The $3.67 million Long Island Investment Fund award supports a roughly $56 million project with First Baptist Church and more than $7 million in infrastructure improvements. A funding award is not proof that construction is complete or that units are available.',
    source: 'https://www.governor.ny.gov/news/governor-hochul-announces-more-32-million-long-island-investment-fund-awards-support-new',
  },
  {
    project: 'Zenith Group — McDermott Avenue / East Main Street',
    status: 'Town Board preliminary site approval reported March 17, 2026',
    units: '15 apartments proposed',
    affordability: 'Six units described as affordable in the project coverage',
    note: 'The reported approval expanded a previously approved four-story project. The source describes preliminary site-plan approval; it does not establish that permits were issued, financing closed, construction started, or units were delivered.',
    source: 'https://riverheadnewsreview.timesreview.com/2026/03/132676/town-approves-zenith-groups-bid-to-expand-downtown-apartment-project/',
  },
]

function Metric({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div style={{ background: 'var(--rbl-surface-2)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 12, padding: '13px 14px', minWidth: 0 }}>
      <div style={{ color: 'var(--rbl-text-muted)', fontSize: 12.5, fontWeight: 700 }}>{label}</div>
      <div style={{ color: 'var(--rbl-title)', fontSize: 25, fontWeight: 900, lineHeight: 1.25, fontVariantNumeric: 'tabular-nums', marginTop: 3 }}>{value}</div>
      <div style={{ color: 'var(--rbl-text-muted)', fontSize: 12, lineHeight: 1.45, marginTop: 3 }}>{note}</div>
    </div>
  )
}

export default function HousingInventorySection() {
  return (
    <section aria-labelledby="housing-inventory-title" style={{ ...card, marginBottom: 16 }}>
      <p style={{ color: 'var(--rbl-accent)', fontSize: 11, fontWeight: 900, letterSpacing: '.08em', textTransform: 'uppercase', margin: '0 0 5px' }}>Supply, demand and delivery</p>
      <h2 id="housing-inventory-title" style={{ color: 'var(--rbl-title)', fontSize: 22, margin: '0 0 8px' }}>Riverhead housing inventory: what exists, what is scarce, and what is being built</h2>
      <p style={{ color: 'var(--rbl-text-body)', fontSize: 14.5, lineHeight: 1.65, margin: '0 0 14px' }}>
        The Town needs to measure more than the number of homes. Housing type, price, rent, vacancy, accessibility, household income and the status of proposed developments all affect whether a resident can actually find a suitable home.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(145px,1fr))', gap: 10 }}>
        {metrics.map((metric) => <Metric key={metric.label} {...metric} />)}
      </div>

      <div style={{ marginTop: 14, padding: '12px 14px', borderRadius: 11, background: 'var(--rbl-warn-bg)', border: '1px solid var(--rbl-warn-border)' }}>
        <strong style={{ color: 'var(--rbl-warn)', fontSize: 13.5 }}>Vacancy is not the same as available inventory.</strong>
        <p style={{ color: 'var(--rbl-text-body)', fontSize: 13.5, lineHeight: 1.55, margin: '4px 0 0' }}>
          Census vacancy estimates include units that may be seasonal, for rent, for sale, rented or sold but not yet occupied, or otherwise unavailable. They are not a live count of homes currently listed and ready to rent or buy. The vacancy-rate estimates also carry substantial margins of error.
        </p>
      </div>

      <h3 style={{ color: 'var(--rbl-title)', fontSize: 17, margin: '20px 0 7px' }}>What Riverhead’s adopted Comprehensive Plan identified</h3>
      <ul style={{ color: 'var(--rbl-text-body)', fontSize: 14, lineHeight: 1.65, paddingLeft: 20, margin: '0 0 10px' }}>
        <li>Single-family detached homes accounted for about 69% of the Town’s housing stock in the plan’s 2021 baseline.</li>
        <li>Mobile and manufactured homes accounted for about 14.2% (2,343 units) in 2021; 1,513 were age-restricted manufactured homes as of January 2024.</li>
        <li>The plan identifies overcrowding, limited housing diversity, short-term-rental enforcement challenges and a need for more senior housing options.</li>
      </ul>
      <p style={{ color: 'var(--rbl-text-muted)', fontSize: 12.5, lineHeight: 1.55, margin: 0 }}>
        These are the Comprehensive Plan’s earlier baseline figures, not a current unit-by-unit inventory. They should be refreshed before being used as present-day totals.
      </p>

      <h3 style={{ color: 'var(--rbl-title)', fontSize: 17, margin: '20px 0 7px' }}>Documented development pipeline</h3>
      <p style={{ color: 'var(--rbl-text-body)', fontSize: 13.5, lineHeight: 1.55, margin: '0 0 10px' }}>
        These are examples with publicly reported milestones, not a complete list of every application in the Town. Proposed or funded units are not counted as completed housing.
      </p>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5, minWidth: 640 }}>
          <thead><tr style={{ background: 'var(--rbl-surface-3)' }}>
            <th style={th}>Project / status</th><th style={th}>Units</th><th style={th}>Affordability and delivery caveat</th>
          </tr></thead>
          <tbody>
            {pipeline.map((item) => (
              <tr key={item.project}>
                <td style={td}>
                  <strong style={{ color: 'var(--rbl-title)' }}>{item.project}</strong>
                  <div style={{ color: 'var(--rbl-text-muted)', fontSize: 12.5, marginTop: 4 }}>{item.status}</div>
                  <a href={item.source} target="_blank" rel="noreferrer" style={{ color: 'var(--rbl-accent)', fontWeight: 700, display: 'inline-block', marginTop: 5 }}>Source</a>
                </td>
                <td style={{ ...td, fontWeight: 800, whiteSpace: 'nowrap' }}>{item.units}</td>
                <td style={td}>
                  <strong>{item.affordability}</strong>
                  <div style={{ color: 'var(--rbl-text-muted)', fontSize: 12.5, marginTop: 4 }}>{item.note}</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3 style={{ color: 'var(--rbl-title)', fontSize: 17, margin: '20px 0 7px' }}>The accountability gap: publish a live housing pipeline</h3>
      <p style={{ color: 'var(--rbl-text-body)', fontSize: 14, lineHeight: 1.6, margin: '0 0 8px' }}>
        Riverhead should publish a quarterly, address-level project register (with personal information excluded) that tracks each residential project from application through certificate of occupancy:
      </p>
      <ol style={{ color: 'var(--rbl-text-body)', fontSize: 13.5, lineHeight: 1.7, paddingLeft: 20, margin: 0 }}>
        <li>Pre-application and formal application received</li>
        <li>Planning Board / Town Board review and approvals</li>
        <li>Building permits issued and financing secured</li>
        <li>Construction started and units completed</li>
        <li>Certificates of occupancy issued and units actually leased or sold</li>
        <li>Affordable units delivered by AMI band, bedroom count, tenure and accessibility</li>
      </ol>
      <p style={{ color: 'var(--rbl-text-muted)', fontSize: 12.5, lineHeight: 1.55, margin: '12px 0 0', borderTop: '1px solid var(--rbl-border-subtle)', paddingTop: 10 }}>
        <strong>Data sources:</strong> U.S. Census Bureau, ACS 2020–2024 five-year estimates (DP04); Town of Riverhead 2024 Adopted Comprehensive Plan Update, Chapter 3; New York State announcement of the Northville Commons award (Oct. 27, 2026); Riverhead News-Review reporting on the Zenith project (Mar. 25, 2026). ACS figures are estimates, not an exact parcel count.
      </p>
      <p style={{ margin: '8px 0 0', fontSize: 12.5, lineHeight: 1.55 }}>
        <a href="https://data.census.gov/table/ACSDP5Y2024.DP04?g=060XX00US3610361984" target="_blank" rel="noreferrer" style={{ color: 'var(--rbl-accent)', fontWeight: 700 }}>Open Census DP04 data</a>
        {' · '}
        <a href="https://www.townofriverheadny.gov/448/Town-of-Riverhead-Comprehensive-Plans" target="_blank" rel="noreferrer" style={{ color: 'var(--rbl-accent)', fontWeight: 700 }}>Town’s adopted Comprehensive Plan</a>
      </p>
    </section>
  )
}
