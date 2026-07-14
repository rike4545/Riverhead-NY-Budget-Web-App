// Personal property-tax bill estimator (Town portion only).
//
// Deliberately uses ASSESSED value as the primary input, not market value.
// New York towns bill property tax against the assessed value on the roll,
// not full market value, and Suffolk County towns assess residential property
// at a small fraction of market value rather than at 100% - Riverhead's
// residential assessment ratio (RAR) was 7.44% per the 2025-2026 Receiver of
// Taxes rate sheet. An earlier version of this calculator (in the iOS
// companion app) approximated a "$2.25 per $1,000 of full market value" rate
// that doesn't reconcile with the Town's own published rate table (Total
// Town Wide $71.598/$1,000 of ASSESSED value for 2026) - converting that to
// a full-value-equivalent rate via the RAR gives roughly $5.33/$1,000 of
// full value, more than double the iOS figure (now fixed there too). Ask for
// assessed value directly to sidestep that whole conversion error.

export type TaxRates = {
  generalFund: number
  highway: number
  streetLighting: number
  totalTownWide: number
}

export type TaxBillEstimate = {
  generalFund: number
  highway: number
  streetLighting: number
  total: number
}

export function estimateTaxBill(assessedValue: number, starReduction: number, rates: TaxRates): TaxBillEstimate {
  const taxable = Math.max(assessedValue - starReduction, 0) / 1000
  return {
    generalFund: taxable * rates.generalFund,
    highway: taxable * rates.highway,
    streetLighting: taxable * rates.streetLighting,
    total: taxable * rates.totalTownWide,
  }
}

export function assessedFromMarketValue(marketValue: number, residentialAssessmentRatio: number): number {
  return marketValue * (residentialAssessmentRatio / 100)
}
