import {
  censusDataset,
  censusSource,
  households,
  householdsMoe,
  medianHouseholdIncome,
  method,
  notCovered,
  payrollYear,
  perHousehold,
  perResident,
  population,
  programs,
  reconciliation,
  source,
  totals,
  unmappedPayrollDepartments,
} from '../../../lib/programs'

// Static-export contract for native clients.
//
// This handler deliberately imports the same computed values used by /programs/
// instead of reimplementing any allocation logic. With output: 'export',
// force-static makes Next emit /data/programs.json as a real JSON asset at build
// time, so iOS/Android can consume exactly the same program-budget calculations.
export const dynamic = 'force-static'

export async function GET() {
  return Response.json({
    schemaVersion: 1,
    source,
    payrollYear,
    census: {
      dataset: censusDataset,
      source: censusSource,
      population,
      households,
      householdsMoe,
      medianHouseholdIncome,
    },
    programs,
    totals,
    perResident,
    perHousehold,
    reconciliation,
    method,
    notCovered,
    diagnostics: {
      unmappedPayrollDepartments,
    },
  })
}
