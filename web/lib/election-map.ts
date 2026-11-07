// Riverhead's 22 election districts and how each voted, for /election-map/.
// Written by etl/build_election_map.py from the Suffolk County Board of
// Elections' own sources: the County GIS's voting-precinct boundaries and the
// Board's public results site, each contest broken down by district. This file
// turns the boundaries into SVG paths and works out the figures the map shows;
// nothing here is typed by hand except the certified 2025 totals, read from
// board-elections.json, and the two comparisons offered.

import geoJson from '../public/data/elections/riverhead-districts.json'
import mapJson from '../public/data/elections/riverhead-map.json'
import boardElections from '../public/data/board-elections.json'

type Position = [number, number]
type Geometry = { type: 'Polygon'; coordinates: Position[][] } | { type: 'MultiPolygon'; coordinates: Position[][][] }
type Feature = { properties: { ed: string; name: string; area: string | null; updated: string | null }; geometry: Geometry }

export type Candidate = { name: string; party: string; lines: Record<string, number>; votes: number }
export type DistrictResult = { mapFeatureId: string | null; total: number; reporting: number | null; votes: Record<string, number> }
export type Contest = { key: string; name: string; voteFor: number; candidates: Candidate[]; total: number; districts: Record<string, DistrictResult>; url: string }
export type Election = {
  id: string; label: string; date: string; official: boolean; asOf: string | null; url: string; contests: Contest[]
  /** Set when the district counts come from a compilation rather than the Board's own results site (2024). */
  districtSource?: { title: string; url: string; checks: string; boundaryOverlap: number }
}
export type HistoryCandidate = { name: string; lines: Record<string, number>; votes: number }
export type SupervisorRace = { year: number; url: string; status: string; registered: number; votesCast: number; candidates: HistoryCandidate[] }
type MapFile = {
  source: { title: string; url: string }; boundarySource: { title: string; url: string }; finalSource: { title: string; url: string }
  elections: Election[]; supervisorHistory: SupervisorRace[]; fetchedOn: string
}

const data = mapJson as unknown as MapFile
export const elections = data.elections
export const resultsSource = data.source
export const boundarySource = data.boundarySource
export const fetchedOn = data.fetchedOn
export const finalSource = data.finalSource
export const supervisorHistory = data.supervisorHistory

const features = (geoJson as unknown as { features: Feature[] }).features

// ── Projection: equirectangular, scaled by the cosine of the town's latitude,
// which is accurate to well under a pixel across a town this size. ──
const rings = (g: Geometry): Position[][] => (g.type === 'Polygon' ? g.coordinates : g.coordinates.flat())
const all = features.flatMap((f) => rings(f.geometry).flat())
const lons = all.map((p) => p[0]), lats = all.map((p) => p[1])
const minLon = Math.min(...lons), maxLon = Math.max(...lons), minLat = Math.min(...lats), maxLat = Math.max(...lats)
const kx = Math.cos((((minLat + maxLat) / 2) * Math.PI) / 180)
export const MAP_W = 800
const scale = MAP_W / ((maxLon - minLon) * kx)
export const MAP_H = Math.round((maxLat - minLat) * scale)
const px = (p: Position): [number, number] => [(p[0] - minLon) * kx * scale, (maxLat - p[1]) * scale]

/** Area-weighted centroid of the largest ring, for the district's number. */
function labelPoint(g: Geometry): [number, number] {
  const ring = rings(g).map((r) => r.map(px)).sort((a, b) => Math.abs(area(b)) - Math.abs(area(a)))[0]
  let cx = 0, cy = 0, a = 0
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const f = ring[j][0] * ring[i][1] - ring[i][0] * ring[j][1]
    a += f; cx += (ring[j][0] + ring[i][0]) * f; cy += (ring[j][1] + ring[i][1]) * f
  }
  return a ? [cx / (3 * a), cy / (3 * a)] : ring[0]
}
function area(ring: [number, number][]) {
  let s = 0
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) s += ring[j][0] * ring[i][1] - ring[i][0] * ring[j][1]
  return s / 2
}

export type DistrictShape = { ed: string; label: string; area: string | null; path: string; x: number; y: number }
export const districts: DistrictShape[] = features.map((f) => {
  const path = rings(f.geometry).map((r) => `M${r.map(px).map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join('L')}Z`).join('')
  const [x, y] = labelPoint(f.geometry)
  return { ed: f.properties.ed, label: String(Number(f.properties.ed)), area: f.properties.area, path, x, y }
})
export const boundaryUpdated = features.map((f) => f.properties.updated).filter(Boolean).sort().pop() ?? null

// ── Figures ──
export const contestByKey = new Map(elections.flatMap((e) => e.contests.map((c) => [c.key, { ...c, election: e }] as const)))
export const share = (c: Contest, ed: string, name: string) => {
  const d = c.districts[ed]
  return d && d.total ? (d.votes[name] ?? 0) / d.total : 0
}
/** The leading candidate in a district and the margin over the next, in points of the district's votes. */
export function leader(c: Contest, ed: string) {
  const d = c.districts[ed]
  const ranked = c.candidates.filter((x) => x.name !== 'Write-in').map((x) => ({ ...x, v: d.votes[x.name] ?? 0 })).sort((a, b) => b.v - a.v)
  const [first, second] = ranked
  return { name: first.name, party: first.party, margin: d.total ? (first.v - (second?.v ?? 0)) / d.total : 0, tie: second != null && first.v === second.v }
}
export const ledCount = (c: Contest, name: string) => districts.filter((d) => !leader(c, d.ed).tie && leader(c, d.ed).name === name).length

/** Contests where one person's share in one contest is set against another's. */
export const comparisons = [
  {
    key: 'halpin-2025-2026',
    label: 'Halpin, 2025 to 2026',
    from: { contest: 'supervisor-2025', candidate: 'Jerome Halpin' },
    to: { contest: 'supervisor-2026', candidate: 'Jerome Halpin' },
    higher: 'Halpin’s share rose',
    lower: 'Halpin’s share fell',
    explain: 'Jerry Halpin’s share of the Supervisor vote in each district in 2026, minus his share in 2025.',
  },
  {
    key: 'halpin-hochul-2026',
    label: 'Halpin against Hochul, 2026',
    from: { contest: 'governor-2026', candidate: 'Kathy C Hochul AND Adrienne E Adams' },
    to: { contest: 'supervisor-2026', candidate: 'Jerome Halpin' },
    higher: 'Halpin ran ahead of Hochul',
    lower: 'Halpin ran behind Hochul',
    explain: 'Jerry Halpin’s share of the Supervisor vote in each district, minus Governor Hochul’s share of the vote for Governor on the same ballots.',
  },
  {
    key: 'halpin-harris',
    label: 'Halpin in 2026 against Harris in 2024',
    from: { contest: 'president-2024', candidate: 'Kamala D Harris AND Tim Walz' },
    to: { contest: 'supervisor-2026', candidate: 'Jerome Halpin' },
    higher: 'Halpin ran ahead of Harris',
    lower: 'Halpin ran behind Harris',
    explain: 'Jerry Halpin’s share of the 2026 Supervisor vote in each district, minus Kamala Harris’s share of the 2024 vote for President.',
  },
] as const

export const shift = (cmp: (typeof comparisons)[number], ed: string) => {
  const a = contestByKey.get(cmp.from.contest)!, b = contestByKey.get(cmp.to.contest)!
  return share(b, ed, cmp.to.candidate) - share(a, ed, cmp.from.candidate)
}

/** The Board of Elections' certified 2025 totals, from this site's election record, beside the election-night count the map uses. */
type Race = { office: string; winners: { name: string; votes: number }[]; runnersUp: { name: string; votes: number }[] }
const certified2025 = ((boardElections as unknown as { priorElections: { year: number; races: Race[] }[] }).priorElections.find((p) => p.year === 2025)?.races ?? [])
export const certified = {
  supervisor: certified2025.find((r) => r.office === 'Supervisor') ?? null,
  council: certified2025.find((r) => r.office === 'Council member') ?? null,
}

/** "Kathy C Hochul AND Adrienne E Adams" to "Kathy C Hochul and Adrienne E Adams". */
export const displayName = (n: string) => n.replace(/ AND /g, ' and ')

/** A history candidate's party, from the County's line names. */
export const historyParty = (c: HistoryCandidate) => ('Democratic' in c.lines ? 'DEM' : 'Republican' in c.lines ? 'REP' : 'Conservative' in c.lines ? 'CON' : 'other')
/** "WALTER, SEAN M" or "Walter, Sean M" to "Sean M Walter". */
export const historyName = (n: string) => {
  const [last, first] = n.split(',').map((x) => x.trim())
  const fix = (w: string) => (w === w.toUpperCase() ? w.toLowerCase().replace(/(^|[\s-])(\w)/g, (_, a, b) => a + b.toUpperCase()) : w)
  return first ? `${fix(first)} ${fix(last)}` : fix(n)
}
