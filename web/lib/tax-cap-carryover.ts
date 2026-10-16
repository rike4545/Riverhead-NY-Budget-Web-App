// The argument that a smaller 2027 levy would "lose" tax cap carryover, and
// the State's own words on how carryover, the base of the next limit and an
// override work, for /zero-percent-2027/.
//
// Every quotation is checked against etl/data/tax-cap/carryover-sources.json,
// the text of each page as the State Comptroller (OSC) and the Department of
// Taxation and Finance publish it, by scripts/verify-zero-percent-2027.mjs.
//
// No imports, so that script loads this file directly.

/** The argument, as it was put to this site. It is not attributed: no Town record holds it. */
export const CARRYOVER_ARGUMENT =
  'because the tax cap calculation only allows a tax cap carryover into the following year of up to 1.5% of the next year’s tax cap - meaning, the Town would lose the ability to carryover a portion of the unused levy from the prior year - which is not recommended, especially with the cost of living increases are so high these days.'

export const CARRYOVER_SOURCES = {
  'osc-faq': {
    title: 'Office of the State Comptroller, Real Property Tax Cap Information – Frequently Asked Questions',
    url: 'https://www.osc.ny.gov/files/local-government/property-tax-cap/pdf/faqs.pdf',
  },
  'osc-instructions': {
    title: 'Office of the State Comptroller, Property Tax Cap Instructions',
    url: 'https://www.osc.ny.gov/files/local-government/property-tax-cap/pdf/instructions.pdf',
  },
  'osc-glossary': {
    title: 'Office of the State Comptroller, Real Property Tax Cap Information – Glossary',
    url: 'https://www.osc.ny.gov/local-government/property-tax-cap/real-property-tax-cap-information-glossary',
  },
  'osc-release-2026-08-20': {
    title: 'Office of the State Comptroller, “DiNapoli: Growing Number of Local Governments Reporting Plans to Override Property Tax Cap”, August 20, 2026',
    url: 'https://www.osc.ny.gov/press/releases/2026/08/dinapoli-growing-number-local-governments-reporting-plans-override-property-tax-cap',
  },
  'dtf-tbgf-2027': {
    title: 'Department of Taxation and Finance, Tax base growth factors for cities and towns, fiscal years starting in 2027',
    url: 'https://www.tax.ny.gov/research/property/2027-cities-towns-tbgf.htm',
  },
} as const

export type CarryoverSource = keyof typeof CARRYOVER_SOURCES

/** Each passage the page quotes, with its document and page ("page" for a web page). */
export const CARRYOVER_QUOTES = {
  definition: { doc: 'osc-glossary', page: 'page', text: 'Amount by which the tax levy for the prior fiscal year was below the tax levy limit for that year, but not more than 1.5% of that limit.' },
  lesserOf: { doc: 'osc-faq', page: '4', text: 'the amount of available carryover that the local government can include in calculating its tax levy limit for the coming fiscal year is the lesser of: A) The difference between the prior year tax levy limit (before exclusions) and the actual levy for the prior fiscal year Or B) 1.5 percent of the prior year tax levy limit (before exclusions).' },
  noneIfOver: { doc: 'osc-faq', page: '4', text: 'If a local government’s actual levy was equal to or more than the prior year’s calculated tax levy limit (before exclusions), there would be no amount available to be carried over.' },
  exclusions: { doc: 'osc-faq', page: '7', text: 'there is no carryover permitted for unused exclusions associated with growth in pension costs or tort judgments.' },
  userFees: { doc: 'osc-faq', page: '7', text: 'User fees are not taxes subject to the levy limit.' },
  base: { doc: 'osc-faq', page: '10', text: 'the total levy, including the levy for excludable expenses or the higher levy resulting from a successful override, becomes the base for the following year’s tax levy limit calculation.' },
  combined: { doc: 'osc-faq', page: '11', text: 'A county, city, town or village must enact a local law to override the tax levy limit that is based on the combined total levy for every fund and special district that falls within the municipal levy limit.' },
  example: { doc: 'osc-instructions', page: '5', text: 'While the local government did not use $120,000 of the available levy in 2012, it can only carry over up to $15,300.' },
  growthFactor: { doc: 'osc-glossary', page: 'page', text: 'Either two percent or inflation, whichever is less.' },
  override: { doc: 'osc-release-2026-08-20', page: 'page', text: 'Local governments other than school districts may override the cap if at least 60% of their governing boards vote to approve it.' },
  towns: { doc: 'osc-release-2026-08-20', page: 'page', text: 'For FYE 2026, 35.5% of villages and 28.6% of towns said they were planning to override the cap, up from 22.7% and 16.6%, respectively, in 2022.' },
  transparent: { doc: 'osc-release-2026-08-20', page: 'page', text: 'I urge local officials to communicate with the public and be transparent about their fiscal challenges and plans for addressing them.' },
} as const satisfies Record<string, { doc: CarryoverSource; page: string; text: string }>

/** The share of a year's limit that can carry into the next. */
export const CARRYOVER_CAP = 0.015

/**
 * The State's two growth factors for fiscal years starting in 2027: the
 * allowable levy growth factor, two percent this year because inflation ran
 * above it (OSC's July 15, 2026 release, on /tax-cap/), and each town's tax
 * base growth factor from the Department of Taxation and Finance.
 */
export const GROWTH_2027 = {
  allowable: 1.02,
  taxBase: { brookhaven: 1.0025, riverhead: 1.0077, southold: 1.0087 },
} as const

/** The two factors multiplied, as a percentage increase: what they allow before PILOTs, carryover and exclusions. */
export const factorsAllowPct = (taxBase: number) => (GROWTH_2027.allowable * taxBase - 1) * 100
