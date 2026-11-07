// Where each committee's itemized contributions came from, by ZIP code, for
// /donation-map/. Written by etl/build_donation_map.py (the amounts, from the
// State Board of Elections' data) and etl/import_zip_areas.py (the Census
// Bureau's ZIP code areas around Riverhead). This file projects the areas to
// SVG paths, draws the Town's outline from the County's election districts,
// and hands the page plain figures. Nothing here is typed by hand but the
// amount bands.

import zipAreasJson from '../public/data/geo/riverhead-zip-areas.json'
import donationsJson from '../public/data/campaign-donations-by-zip.json'
import districtsJson from '../public/data/elections/riverhead-districts.json'
import { campaignOfficials } from './campaign-officials'

type Position = [number, number]
type Multi = { type: 'MultiPolygon'; coordinates: Position[][][] }
type ZipFeature = { properties: { zip: string; riverheadShare: number }; geometry: Multi }
type EdFeature = { geometry: { type: 'Polygon'; coordinates: Position[][] } | { type: 'MultiPolygon'; coordinates: Position[][][] } }
type DonationFile = {
  source: { label: string; url: string }
  window: [number, number]
  committees: Record<string, Record<string, Record<string, [number, number]>>>
  zips: Record<string, { place: string; state: string }>
  fetchedOn: string
}

const zipAreas = zipAreasJson as unknown as { source: { title: string; url: string }; features: ZipFeature[] }
const donations = donationsJson as unknown as DonationFile
export const donationSource = donations.source
export const donationWindow = donations.window
export const donationsFetchedOn = donations.fetchedOn
export const zipSource = zipAreas.source

// ── Projection over the ZIP areas' extent, as on the election map ──
const all = zipAreas.features.flatMap((f) => f.geometry.coordinates.flat(2))
const lons = all.map((p) => p[0]), lats = all.map((p) => p[1])
const minLon = Math.min(...lons), maxLon = Math.max(...lons), minLat = Math.min(...lats), maxLat = Math.max(...lats)
const kx = Math.cos((((minLat + maxLat) / 2) * Math.PI) / 180)
export const DMAP_W = 800
const scale = DMAP_W / ((maxLon - minLon) * kx)
export const DMAP_H = Math.round((maxLat - minLat) * scale)
const px = (p: Position) => [(p[0] - minLon) * kx * scale, (maxLat - p[1]) * scale]
const pathOf = (rings: Position[][]) => rings.map((r) => `M${r.map(px).map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join('L')}Z`).join('')

function centre(rings: Position[][][]): [number, number] {
  // The middle of the largest outer ring's box: good enough for a label.
  const ring = rings.map((p) => p[0]).sort((a, b) => b.length - a.length)[0].map(px)
  const xs = ring.map((p) => p[0]), ys = ring.map((p) => p[1])
  return [(Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...ys) + Math.max(...ys)) / 2]
}

export type ZipShape = { zip: string; place: string | null; riverheadShare: number; path: string; x: number; y: number }
export const zipShapes: ZipShape[] = zipAreas.features.map((f) => {
  const [x, y] = centre(f.geometry.coordinates)
  return { zip: f.properties.zip, place: donations.zips[f.properties.zip]?.place ?? null, riverheadShare: f.properties.riverheadShare, path: pathOf(f.geometry.coordinates.flat()), x, y }
})
/** The Town's election districts, outlined over the ZIP areas. */
export const townPaths: string[] = (districtsJson as unknown as { features: EdFeature[] }).features.map((f) =>
  pathOf(f.geometry.type === 'Polygon' ? f.geometry.coordinates : f.geometry.coordinates.flat()))
export const riverheadZips = zipShapes.filter((z) => z.riverheadShare > 0).map((z) => z.zip)

/** One committee's money by ZIP code and year: [amount, contributions]. */
export type DonationCommittee = { name: string; label: string; years: string[]; byYear: Record<string, Record<string, [number, number]>> }
export const donationCommittees: DonationCommittee[] = campaignOfficials
  .filter((o) => donations.committees[o.name])
  .map((o) => ({
    name: o.name,
    label: o.name.replace(/^Honorable /, ''),
    years: Object.keys(donations.committees[o.name]).filter((y) => Object.keys(donations.committees[o.name][y]).length > 0),
    byYear: donations.committees[o.name],
  }))
export const zipInfo = donations.zips
/** Amount bands for the map, in dollars. */
export const AMOUNT_BANDS = [1000, 5000, 25000, 100000]
