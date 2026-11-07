// Town-wide totals from the 2026 tentative and final assessment rolls, for
// /assessment/. Written by etl/build_assessment_roll.py, which adds up every
// parcel record by property class and checks the sums against the roll's own
// section totals. Totals only: no owner, address or single parcel's value.

import rollJson from '../public/data/assessment-roll-2026.json'

type Bucket = { parcels: number; assessedTotal: number; marketValue: number }
export type ClassRow = Bucket & { code: string; name: string }
type Section = { name: string; parcels: number; assessedTotal: number }
type Grand = { sections: Record<string, Section>; parcels: number; assessedLand: number; assessedTotal: number; taxableCounty: number; taxableTown: number; taxableSchool: number; starTaxable: number }
type ExemptionGroup = { name: string; codes: number; parcels: number; town: number; school: number }
type Roll = {
  title: string; url: string; uniformPercent: number | null; valuationDate: string | null; taxableStatusDate: string | null
  grandTotals: Grand; byClass: ClassRow[]; residential: ClassRow[]
  schoolDistricts?: { code: string; name: string; parcels: number; assessedTotal: number }[]
  exemptions?: { total: { parcels: number; county: number; town: number; school: number }; groups: ExemptionGroup[] }
}
type Data = {
  assessorPage: string; note: string; tentative: Roll; final: Roll
  oneFamilyHomes: { count: number; median: number; lowerQuartile: number; upperQuartile: number; bands: { from: number; to: number | null; homes: number }[] }
}

const data = rollJson as unknown as Data
export const assessorPage = data.assessorPage
export const tentative = data.tentative
export const final = data.final
export const homes = data.oneFamilyHomes
/** Riverhead assesses at a small fraction of market value: 7.73% for the 2026 rolls. */
export const uniformPercent = (final.uniformPercent ?? 0) / 100
export const marketOf = (assessed: number) => assessed / uniformPercent

export const exemptions = final.exemptions!
export const schoolDistricts = final.schoolDistricts!

/** How each property class moved between the tentative roll (May) and the final roll (September). */
export const classChanges = final.byClass.map((f) => {
  const t = tentative.byClass.find((x) => x.code === f.code)!
  return { code: f.code, name: f.name, assessed: f.assessedTotal - t.assessedTotal, parcels: f.parcels - t.parcels }
})

/** The taxable part of the final roll's assessed value, and what is exempt, for the Town tax. */
export const townTaxable = final.grandTotals.taxableTown
export const whollyExempt = final.grandTotals.sections['8']?.assessedTotal ?? 0
