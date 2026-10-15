// Riverhead's residents, for every page that divides by them.
//
// The estimate is the Census Bureau's latest, from its Population Estimates
// (census-pep.json, written by scripts/fetch-population.mjs), so a new vintage
// reaches every page at once. The 2020 Census count is the one in
// community.json: table P1 of the 2020 redistricting data, which does not
// change.

import community from '../public/data/community.json'
import pep from '../public/data/census-pep.json'

type Town = { name: string; estimates: Record<string, number> }

const town = (pep.towns as Town[]).find((t) => t.name === 'Riverhead town')
const estimate = town?.estimates[String(pep.vintage)]
if (!estimate) throw new Error(`census-pep.json has no ${pep.vintage} estimate for Riverhead town`)

export const riverheadPopulation = {
  /** Residents on the date below, in the Census Bureau's latest estimates. */
  estimate,
  /** "July 1, 2025" for the 2025 vintage. */
  asOf: pep.asOf,
  vintage: pep.vintage,
  source: pep.source,
  /** The 2020 Census count, April 1, 2020. */
  census2020: community.population.census2020,
  census2020Source: community.population.source,
}
