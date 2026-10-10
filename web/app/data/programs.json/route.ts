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
  programYears,
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
    // `contingency` is the name this field had before the page learned that
    // account 9990 is "Fund Balance Contribution"; kept so older clients still read it.
    totals: { ...totals, contingency: totals.setAside },
    perResident,
    perHousehold,
    reconciliation,
    method,
    notCovered,
    // Every budget the page shows, regrouped the same way. The fields above are the newest adopted year.
    years: programYears.map((y) => ({
      year: y.year,
      stage: y.stage,
      label: y.label,
      sources: { supplement: y.supplement, summary: y.summary },
      staffYear: y.staffYear,
      totals: y.totals,
      perResident: y.perResident,
      perHousehold: y.perHousehold,
      reconciliation: y.reconciliation,
      programs: y.programs.map(({ key, name, direct, benefits, fullCost, earned, net, recoveryPct, netPerResident, netPerHousehold, staff }) => ({ key, name, direct, benefits, fullCost, earned, net, recoveryPct, netPerResident, netPerHousehold, staff })),
    })),
    diagnostics: {
      unmappedPayrollDepartments,
    },
  })
}
