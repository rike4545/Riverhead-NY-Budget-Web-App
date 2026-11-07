import PageShell from '../../components/PageShell'
import PlainCallout from '../../components/PlainCallout'
import DonationMap from '../../components/DonationMap'
import {
  AMOUNT_BANDS, DMAP_H, DMAP_W, donationCommittees, donationsFetchedOn, donationSource, donationWindow, riverheadZips, townPaths, zipInfo, zipShapes, zipSource,
} from '../../lib/donation-map'

const base = process.env.NEXT_PUBLIC_BASE_PATH || ''
const card = { background: 'var(--rbl-surface)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 16, padding: 20, marginBottom: 16 } as const
const prose = { margin: '0 0 12px', color: 'var(--rbl-text-body)', fontSize: 16.5, lineHeight: 1.6, maxWidth: '75ch' } as const
const h2 = { margin: '0 0 8px', color: 'var(--rbl-title)', fontSize: 22 } as const
const link = { color: 'var(--rbl-link)', fontWeight: 600 } as const
const usd = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
const pct = (v: number) => `${(v * 100).toFixed(0)}%`
const longDate = (iso: string) => new Date(`${iso.slice(0, 10)}T12:00:00`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

export const metadata = {
  title: 'Donation map — where Riverhead campaign money comes from',
  description: 'Where each Riverhead Town Board candidate’s and party committee’s itemized contributions came from, by ZIP code, from the State Board of Elections’ filings.',
}

/** Share of a committee's itemized money, all years, from the ZIP codes that reach into the Town. */
function localShare(c: (typeof donationCommittees)[number]) {
  let local = 0, total = 0
  for (const y of c.years) for (const [z, [amt]] of Object.entries(c.byYear[y])) {
    total += amt
    if (riverheadZips.includes(z)) local += amt
  }
  return total ? local / total : 0
}

export default function DonationMapPage() {
  const shares = donationCommittees.map((c) => ({ label: c.label, share: localShare(c) })).sort((a, b) => b.share - a.share)
  return (
    <PageShell
      title="Donation map"
      subtitle="Where each Town Board candidate's and party committee's itemized contributions came from, by ZIP code."
    >
      <PlainCallout
        tips={[
          { label: 'ZIP codes, not names', text: 'the map adds up money by the ZIP code on each filing. It does not show donors’ names or street addresses, though the filings themselves are public.' },
          { label: 'Itemized contributions', text: 'money from people, businesses and others that the committee itemized on its filings (Schedules A, B and C). Transfers from other committees, in-kind gifts and loans are left out, and so are small contributions a committee did not itemize.' },
          { label: 'ZIP codes cross town lines', text: 'Wading River (11792), Calverton (11933) and Manorville (11949) reach into Brookhaven, and Riverhead’s own 11901 takes in Flanders and Riverside across the river in Southampton, so “reach into Riverhead” includes some money from outside the Town.' },
        ]}
      >
        Of the {shares.length} committees, {shares[0].label} raised the largest share of its itemized money from ZIP codes that reach
        into Riverhead, <strong>{pct(shares[0].share)}</strong>, and {shares[shares.length - 1].label} the smallest,{' '}
        <strong>{pct(shares[shares.length - 1].share)}</strong>, all years together. Choose a committee and a year below.
      </PlainCallout>

      <section id="map" aria-labelledby="map-heading" style={card}>
        <h2 id="map-heading" style={h2}>The map</h2>
        <DonationMap
          zips={zipShapes}
          townPaths={townPaths}
          committees={donationCommittees}
          zipInfo={zipInfo}
          riverheadZips={riverheadZips}
          bands={AMOUNT_BANDS}
          width={DMAP_W}
          height={DMAP_H}
        />
      </section>

      <section id="local-share" aria-labelledby="local-share-heading" style={card}>
        <h2 id="local-share-heading" style={h2}>How much came from Riverhead ZIP codes</h2>
        <p style={prose}>Each committee&apos;s itemized money, {donationWindow[0]} to {donationWindow[1]}, from the ZIP codes that reach into the Town.</p>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, maxWidth: 640 }}>
          {shares.map((s) => (
            <li key={s.label} style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 15, color: 'var(--rbl-text-body)' }}>
                <span>{s.label}</span><span style={{ fontWeight: 600 }}>{pct(s.share)}</span>
              </div>
              <div aria-hidden="true" style={{ height: 8, borderRadius: 4, background: 'var(--rbl-surface-2)', overflow: 'hidden', marginTop: 3 }}>
                <div style={{ width: `${s.share * 100}%`, height: '100%', background: 'var(--rbl-map-seq-4)' }} />
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section id="sources" aria-labelledby="sources-heading" style={card}>
        <h2 id="sources-heading" style={h2}>Sources and method</h2>
        <ul style={prose}>
          <li>
            Contributions: <a href={donationSource.url} style={link}>{donationSource.label}</a>, {donationWindow[0]} to {donationWindow[1]},
            for the committees on the <a href={`${base}/campaign-finance/`} style={link}>Campaign finance</a> page. Each committee&apos;s total
            here equals the &ldquo;direct contributions&rdquo; on its card there. Updated {longDate(donationsFetchedOn)}; refreshed with the
            campaign-finance data by <code>etl/build_donation_map.py</code>.
          </li>
          <li>
            ZIP codes are as filed. A ZIP code entered wrongly on a filing stays as entered, and its place name is the one most often written
            beside it. Money with no ZIP code is counted on its own line.
          </li>
          <li>
            ZIP code areas: <a href={zipSource.url} style={link}>{zipSource.title}</a>. The Town&apos;s outline is the County Board of Elections&apos;
            district map, as on the <a href={`${base}/election-map/`} style={link}>Election map</a>. The map shows the ZIP codes around Riverhead;
            money from farther away is in the breakdown and the table. Bands are {AMOUNT_BANDS.map((b) => usd(b)).join(', ')}.
          </li>
        </ul>
      </section>
    </PageShell>
  )
}
