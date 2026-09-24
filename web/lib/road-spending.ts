// Road spending per maintained mile, Riverhead against the nine other Suffolk
// County towns.
//
// The comparison is only defensible because both halves come from one source
// each, applied identically to every town:
//   • Spending — the Comptroller's Financial Data for Local Governments. Every
//     town files the same annual report on the same chart of accounts, so
//     "Highways" means the same thing in Riverhead as in Brookhaven. Anything
//     assembled from ten separately-formatted town budget PDFs would not have
//     that property.
//   • Mileage — NYSDOT's Highway Mileage series, using locally maintained
//     centerline miles. State and county roads inside a town are maintained by
//     those governments, so counting them would penalise towns that happen to
//     have a state highway running through them.

import data from '../public/data/road-spending.json'

export type TownRoadSpending = {
  town: string
  highways: number
  miles: number
  perMile: number
}

export const roadSpending = data
export const towns = data.towns as TownRoadSpending[]

export const RIVERHEAD = 'Riverhead'

const median = (xs: number[]) => {
  const s = xs.slice().sort((a, b) => a - b)
  const m = Math.floor(s.length / 2)
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}

export const riverhead = towns.filter((t) => t.town === RIVERHEAD)[0]
export const medianPerMile = median(towns.map((t) => t.perMile))
export const maxPerMile = Math.max.apply(null, towns.map((t) => t.perMile))

/** Riverhead's rank, 1 = highest spending per mile. */
export const riverheadRank = towns
  .slice()
  .sort((a, b) => b.perMile - a.perMile)
  .findIndex((t) => t.town === RIVERHEAD) + 1

export const shareOfMedian = riverhead.perMile / medianPerMile

/** What a year at the county median would cost Riverhead, over what it spends. */
export const gapToMedianAnnual = Math.round((medianPerMile - riverhead.perMile) * riverhead.miles)

export const riverheadMixTotal = data.riverheadMix.reduce((s, m) => s + m.amount, 0)

/** Personal services' share of Riverhead's highway spending. */
export const wagesShare = (data.riverheadMix.find((m) => m.object === 'Personal Services')?.amount ?? 0) / riverheadMixTotal

export function ordinal(n: number): string {
  const teen = n % 100 >= 11 && n % 100 <= 13
  const suffix: Record<number, string> = { 1: 'st', 2: 'nd', 3: 'rd' }
  return `${n}${teen ? 'th' : suffix[n % 10] ?? 'th'}`
}

/** "the lowest of the 10", "the highest of the 10", or "9th of the 10". The rank moves with each year's data. */
export const riverheadRankPhrase =
  riverheadRank === towns.length ? `the lowest of the ${towns.length}`
    : riverheadRank === 1 ? `the highest of the ${towns.length}`
      : `${ordinal(riverheadRank)} of the ${towns.length}`

export const headline =
  `Riverhead spends about $${Math.round(riverhead.perMile).toLocaleString()} a year per mile of road it maintains — ` +
  `${riverheadRankPhrase} Suffolk towns, and roughly ${Math.round((1 - shareOfMedian) * 100)}% below the county median.`
