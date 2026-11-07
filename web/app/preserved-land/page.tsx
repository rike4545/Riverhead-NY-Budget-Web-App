import PageShell from '../../components/PageShell'
import PlainCallout from '../../components/PlainCallout'
import PreservedLandMap from '../../components/PreservedLandMap'
import ColumnChart from '../../components/charts/ColumnChart'
import {
  decades, farmFetchedOn, farmLayerUpdated, farmShapes, farmSource, holderAcres, HOLDERS, MAP_H, MAP_W, totalAcres, townAcres, townPaths, undatedParcels,
} from '../../lib/preserved-land'
import { cpfHistory, cpfMechanics } from '../../lib/cpf'

const base = process.env.NEXT_PUBLIC_BASE_PATH || ''
const card = { background: 'var(--rbl-surface)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 16, padding: 20, marginBottom: 16 } as const
const prose = { margin: '0 0 12px', color: 'var(--rbl-text-body)', fontSize: 16.5, lineHeight: 1.6, maxWidth: '75ch' } as const
const h2 = { margin: '0 0 8px', color: 'var(--rbl-title)', fontSize: 22 } as const
const link = { color: 'var(--rbl-link)', fontWeight: 600 } as const
const acres = (n: number) => Math.round(n).toLocaleString('en-US')
const pct = (v: number) => `${Math.round(v * 100)}%`
const usd = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
const longDate = (iso: string) => new Date(`${iso.slice(0, 10)}T12:00:00`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

export const metadata = {
  title: 'Preserved land — Riverhead’s protected farmland, mapped',
  description: 'Every Riverhead farm whose development rights have been bought or restricted, from Suffolk County’s GIS: who holds the rights, how many acres, and when.',
}

export default function PreservedLandPage() {
  const town = holderAcres.find((h) => h.holder === 'Town')!
  const joint = holderAcres.find((h) => h.holder === 'County and Town')!
  const county = holderAcres.find((h) => h.holder === 'County')!
  const latestCpf = cpfHistory[cpfHistory.length - 1]
  return (
    <PageShell
      title="Preserved land"
      subtitle="Every Riverhead farm whose development rights have been bought or restricted, mapped from Suffolk County's records: who holds the rights, how many acres, and when."
    >
      <PlainCallout
        tips={[
          { label: 'Development rights', text: 'when a town, the County or the State buys a farm’s development rights, the owner keeps the land and can farm it, but it can never be built on.' },
          { label: 'Who pays', text: 'the Town buys development rights through its Community Preservation Fund, the 2% tax on real-estate sales; the County and State have their own programs.' },
          { label: 'What is not here', text: 'parks and open space the Town owns outright, which the County keeps in other layers. This page is the farmland.' },
        ]}
      >
        The County&apos;s records show <strong>{acres(totalAcres)} acres</strong> of preserved farmland in Riverhead, on {farmShapes.length}{' '}
        parcels: about {pct(totalAcres / townAcres)} of the Town&apos;s {acres(townAcres)} acres. The County holds the rights to{' '}
        {acres(county.acres)} acres, the Town to {acres(town.acres)}, and the two together to {acres(joint.acres)}.
      </PlainCallout>

      <section id="map" aria-labelledby="map-heading" style={card}>
        <h2 id="map-heading" style={h2}>The map</h2>
        <PreservedLandMap parcels={farmShapes} townPaths={townPaths} holders={[...HOLDERS]} width={MAP_W} height={MAP_H} />
      </section>

      <section id="who" aria-labelledby="who-heading" style={card}>
        <h2 id="who-heading" style={h2}>Who holds the rights</h2>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, maxWidth: 640 }}>
          {holderAcres.map((h) => (
            <li key={h.holder} style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 15, color: 'var(--rbl-text-body)' }}>
                <span>{h.holder === 'Other' ? 'Other: private and not-for-profit easements, subdivision reserves' : h.holder}</span>
                <span style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{acres(h.acres)} acres · {h.parcels} parcels</span>
              </div>
              <div aria-hidden="true" style={{ height: 8, borderRadius: 4, background: 'var(--rbl-surface-2)', overflow: 'hidden', marginTop: 3 }}>
                <div style={{ width: `${(h.acres / totalAcres) * 100}%`, height: '100%', background: 'var(--rbl-map-seq-4)' }} />
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section id="when" aria-labelledby="when-heading" style={card}>
        <h2 id="when-heading" style={h2}>When it was preserved</h2>
        <p style={prose}>
          Acres by the decade the sale closed. The County&apos;s layer has no closing date for {undatedParcels} of the {farmShapes.length} parcels,
          shown on their own.
        </p>
        <ColumnChart
          title="Preserved farmland by decade"
          lede="Acres whose development rights were sold or restricted in each decade."
          columns={decades.map((d) => ({ label: d.label.replace('No date recorded', 'No date'), value: d.acres, display: acres(d.acres) }))}
          format={(n) => acres(n)}
          source={`${farmSource.title}.`}
        />
      </section>

      <section id="sources" aria-labelledby="sources-heading" style={card}>
        <h2 id="sources-heading" style={h2}>Sources and method</h2>
        <ul style={prose}>
          <li>
            Parcels: <a href={farmSource.url} style={link}>{farmSource.title}</a>{farmLayerUpdated ? `, last updated by the County ${longDate(farmLayerUpdated)}` : ''}.
            Riverhead&apos;s are the parcels whose County tax-map number starts with the Town&apos;s district, 0600. Acres and the holder of the
            rights are the County&apos;s. Street addresses and tax-map numbers are left out. Refreshed by <code>etl/build_preserved_land.py</code>;
            data last changed {longDate(farmFetchedOn)}.
          </li>
          <li>
            The Town&apos;s area is measured from the County Board of Elections&apos; district map, as on the{' '}
            <a href={`${base}/election-map/`} style={link}>Election map</a>, so the share preserved is approximate.
          </li>
          <li>
            The Community Preservation Fund has bought {cpfMechanics.lifetimeLandPurchases != null ? usd(cpfMechanics.lifetimeLandPurchases) : 'its land'} of
            land and rights since {cpfMechanics.authorityBeganYear}, by its {latestCpf.year} financial statement. See the{' '}
            <a href={`${base}/community-preservation-fund/`} style={link}>Community Preservation Fund</a> and the{' '}
            <a href={`${base}/regional-cpf-counsel/`} style={link}>regional CPF counsel</a> pages.
          </li>
        </ul>
      </section>
    </PageShell>
  )
}
