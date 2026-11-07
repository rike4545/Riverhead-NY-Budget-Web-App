// Riverhead's preserved farmland, for /preserved-land/. Written by
// etl/build_preserved_land.py from Suffolk County's GIS layer of farmland
// whose development rights have been bought or restricted. Drawn on the same
// projection as the election map, over the County's election districts, so
// the Town's outline is the Board of Elections' own.

import farmJson from '../public/data/geo/riverhead-preserved-farmland.json'
import { districts, MAP_H, MAP_W, METRES_PER_UNIT, project } from './election-map'

type Ring = [number, number][]
type Farm = { properties: { holder: string; classification: string | null; acres: number; year: number | null; hamlet: string | null }; geometry: { coordinates: Ring[] } }
const farms = farmJson as unknown as { source: { title: string; url: string }; layerUpdated: string | null; fetchedOn: string; features: Farm[] }

export const farmSource = farms.source
export const farmLayerUpdated = farms.layerUpdated
export const farmFetchedOn = farms.fetchedOn
export { MAP_W, MAP_H }

export type FarmShape = { id: number; holder: string; classification: string | null; acres: number; year: number | null; hamlet: string | null; path: string }
export const farmShapes: FarmShape[] = farms.features.map((f, id) => ({
  id,
  ...f.properties,
  path: f.geometry.coordinates.map((r) => `M${r.map((p) => project(p)).map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join('L')}Z`).join(''),
}))
export const townPaths = districts.map((d) => d.path)

/** Who holds the rights, in the order the legend lists them. */
export const HOLDERS = ['Town', 'County and Town', 'County', 'State', 'Other'] as const
export const holderAcres = HOLDERS.map((h) => ({ holder: h, acres: farmShapes.filter((f) => f.holder === h).reduce((s, f) => s + f.acres, 0), parcels: farmShapes.filter((f) => f.holder === h).length }))
export const totalAcres = farmShapes.reduce((s, f) => s + f.acres, 0)
/** Acres by the decade a parcel's sale closed; parcels with no recorded date apart. */
export const decades = (() => {
  const out = new Map<string, number>()
  for (const f of farmShapes) {
    const k = f.year ? `${Math.floor(f.year / 10) * 10}s` : 'No date recorded'
    out.set(k, (out.get(k) ?? 0) + f.acres)
  }
  return Array.from(out.entries()).sort((a, b) => (a[0] === 'No date recorded' ? 1 : b[0] === 'No date recorded' ? -1 : a[0].localeCompare(b[0]))).map(([label, acres]) => ({ label, acres }))
})()
export const undatedParcels = farmShapes.filter((f) => !f.year).length

/** The Town's area as the County's election districts draw it, in acres (shoelace over the projected outlines). */
export const townAcres = (() => {
  let area = 0
  for (const d of districts) {
    for (const ring of d.path.split('Z').filter(Boolean)) {
      const pts = ring.replace(/^M/, '').split('L').map((p) => p.split(',').map(Number))
      for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) area += pts[j][0] * pts[i][1] - pts[i][0] * pts[j][1]
    }
  }
  return (Math.abs(area / 2) * METRES_PER_UNIT ** 2) / 4046.86
})()
