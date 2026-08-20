// A program budget for Riverhead: what the Town actually does, what each of
// those things costs once you count the pension and health insurance that pay
// for the people who do it, and how much of it the service earns back at the
// door.
//
// WHY THIS IS POSSIBLE WITHOUT INVENTING A TAXONOMY. New York's Uniform System
// of Accounts already classifies every municipal dollar by function, and
// Riverhead codes to it on both sides of the ledger. An expenditure department
// carries the function in its code — 3120 is Police, 8160 is Refuse. A revenue
// line carries the same function group in the last segment of its account, so
// A01-1560-170-00000-3 (Building Inspection Fees) is Public Safety earning its
// own keep. Everything below is a regrouping of the Town's own coding, not a
// classification this site made up.
//
// THREE ADJUSTMENTS, each stated on the page rather than buried:
//
//   1. Employee benefits. $27.4M of pension, health insurance, FICA and
//      workers' comp sits in function 9, attached to no service at all. Left
//      there, every program looks cheaper than it is. We push it back onto the
//      programs whose staff earned it. The split is the Town's own, not ours:
//      accounts ending -UNI- are uniformed (sworn police) and go entirely to
//      Public Safety; -NON- accounts are spread across the programs in the same
//      fund by each one's share of Personal Services. Benefits are already
//      booked in the fund that employs the people, so the Highway Fund's health
//      insurance never leaves Transportation. lib/benefit-load.ts applies the
//      same UNI/NON reasoning to the Comptroller's filing.
//
//   2. Overhead inside single-purpose funds. Insurance and depreciation booked
//      to function 1 inside a sewer or water fund are not "general government"
//      in any sense a resident would recognise — they are the cost of running
//      that utility. In a fund that does one thing, function-1 spending follows
//      that fund's service. This moves $5.4M. The General Fund and the two
//      internal-service funds are left alone, because their overhead really is
//      town-wide.
//
//   3. Interfund transfers. $8.5M of function 9901 is one Town fund paying
//      another. Counting it would double-count real spending, so it is excluded
//      from program totals and reported separately.
//
// The result reconciles to the dollar against total adopted appropriations:
// programs + debt service + contingency + transfers = $121,110,904.

import census from '../public/data/census-acs.json'
import community from '../public/data/community.json'
import payrollSummary from '../public/data/payroll/summary.json'
import { allFundCodes, getFundDetail, type FundDetail } from './subaccounts'

export type ProgramKey = '1' | '3' | '4' | '5' | '6' | '7' | '8'

// The seven service functions. Function 9 is not a program — it is benefits,
// debt and transfers, and is redistributed or reported separately above.
const FUNCTION_NAMES: Record<ProgramKey, string> = {
  '1': 'General Government Support',
  '3': 'Public Safety',
  '4': 'Health',
  '5': 'Transportation',
  '6': 'Economic Assistance & Opportunity',
  '7': 'Culture & Recreation',
  '8': 'Home & Community Services',
}

// Funds whose function-1 spending is genuinely town-wide overhead and so is
// left in General Government (see adjustment 2 above).
const SHARED_FUNDS = new Set(['A01', 'MS1', 'MS2'])

export type ProgramDepartment = {
  fund: string
  code: string
  name: string
  amount: number
}

export type ProgramRevenue = { name: string; amount: number }

export type Program = {
  key: ProgramKey
  name: string
  /** One line a resident can read without a finance background. */
  plain: string
  /** What the Town actually does under this heading. */
  narrative: string
  /** Concrete services, drawn from the departments that carry the spending. */
  buys: string[]
  direct: number
  benefits: number
  fullCost: number
  earned: number
  net: number
  /** Share of full cost the service recovers from the people who use it. */
  recoveryPct: number
  netPerResident: number
  netPerHousehold: number
  staff: number
  departments: ProgramDepartment[]
  topRevenues: ProgramRevenue[]
}

// ---------------------------------------------------------------------------
// Payroll headcount. The Town's payroll department names are operational units
// ("Squad 4 - Police"), not account codes, so this mapping is ours — the one
// piece of classification on this page that is not the Town's own. It covers
// every one of the 65 department names in the latest payroll year.
// ---------------------------------------------------------------------------
const PAYROLL_DEPT_PROGRAM: Record<string, ProgramKey> = {
  'Accounting': '1', 'Accounting Management': '1', 'Town Attorney Clerical': '1',
  'Town Attorney Appointed': '1', 'Town Attorney Management': '1', 'Town Board Elected': '1',
  'Supervisor Clerical': '1', 'Supervisor Management': '1', 'Supervisor Elected': '1',
  'Town Clerk': '1', 'Town Clerk Elected': '1', 'Tax Collection': '1',
  'Tax Collection Elected': '1', 'Assessment': '1', 'Assessment Elected/Board': '1',
  'Information Technology': '1', 'Purchasing': '1', 'Justice Court': '1',
  'Justice Court Elected': '1', 'Court Officers': '1', 'Town Engineer': '1',
  'Town Engineer Management': '1', 'Buildings and Grounds': '1', 'Municipal Garage': '1',
  'Squad 1 - Police': '3', 'Squad 2 - Police': '3', 'Squad 3 - Police': '3',
  'Squad 4 - Police': '3', 'Squad 5 - Police': '3', 'Headquarters': '3', 'Detectives': '3',
  'COPE Comm Oriented Police Enforce': '3', 'PSD - Public Safet Disp': '3',
  'Traffic Control': '3', 'Police Clerical': '3', 'P/T Police': '3', 'K-9': '3',
  'Juvenile Aide Bureau / Police': '3', 'Det Attnd': '3', 'Crossing Guards': '3',
  'Fire Marshal': '3', 'Safety Inspection / Clerical': '3',
  'Safety Inspection / Inspectors': '3', 'Code Enforcement': '3', 'Harbormaster I': '3',
  'General Repairs Highway': '5', 'Highway Admin  Elected/Appointed': '5',
  'Highway Admin Clerical': '5', 'Street Lighting': '5', 'PMO - Parking Meter Officer': '5',
  'Nutrition': '6', 'Nutrition Management': '6',
  'Recreation': '7', 'Recreation Management': '7', 'Town Historian Planning Department': '7',
  'Water': '8', 'Water Management': '8', 'Sewer / Scavenger Waste': '8',
  'Sewer / Scavenger Waste Management': '8', 'Sanitation': '8',
  'Planning / Zoning / CAC/AARB': '8', 'Planning Department': '8',
  'Building / Planning Management': '8', 'Community Development Clerical': '8',
  'Community Development Management': '8',
}

type DeptRollup = { department: string; headcount: number }
const latestPayroll = payrollSummary.yearSummaries[payrollSummary.yearSummaries.length - 1]
export const payrollYear: number = latestPayroll.year

const staffByProgram: Record<string, number> = {}
export const unmappedPayrollDepartments: string[] = []
for (const row of latestPayroll.byDepartment as DeptRollup[]) {
  const key = PAYROLL_DEPT_PROGRAM[row.department]
  if (!key) { unmappedPayrollDepartments.push(row.department); continue }
  staffByProgram[key] = (staffByProgram[key] ?? 0) + row.headcount
}

// ---------------------------------------------------------------------------
// Roll the adopted 2026 budget up into programs.
// ---------------------------------------------------------------------------
const funds: FundDetail[] = allFundCodes()
  .map((c) => getFundDetail(c))
  .filter((f): f is FundDetail => !!f)

function isProgramKey(g: string): g is ProgramKey {
  return g === '1' || g === '3' || g === '4' || g === '5' || g === '6' || g === '7' || g === '8'
}

/** The service a single-purpose fund exists to deliver. */
function dominantProgram(fund: FundDetail): ProgramKey | null {
  const totals: Record<string, number> = {}
  for (const dept of fund.departments) {
    const g = String(dept.code).charAt(0)
    if (!isProgramKey(g) || g === '1') continue
    totals[g] = (totals[g] ?? 0) + (dept.adopted2026 || 0)
  }
  const best = Object.entries(totals).sort((a, b) => b[1] - a[1])[0]
  return best && isProgramKey(best[0]) ? best[0] : null
}

const direct: Record<string, number> = {}
const personalServices: Record<string, Record<string, number>> = {}
const fundDirect: Record<string, Record<string, number>> = {}
const departments: Record<string, ProgramDepartment[]> = {}
const benefitPoolByFund: Record<string, number> = {}

let uniformedBenefits = 0
let debtService = 0
let interfundTransfers = 0
let contingency = 0

for (const fund of funds) {
  const dominant = SHARED_FUNDS.has(fund.code) ? null : dominantProgram(fund)
  for (const dept of fund.departments) {
    const code = String(dept.code)
    const raw = code.charAt(0)
    const amount = dept.adopted2026 || 0

    if (raw !== '9') {
      if (!isProgramKey(raw)) continue
      // Adjustment 2: overhead inside a single-purpose fund follows its service.
      const key: ProgramKey = raw === '1' && dominant ? dominant : raw
      direct[key] = (direct[key] ?? 0) + amount
      ;(fundDirect[fund.code] ??= {})[key] = ((fundDirect[fund.code] ?? {})[key] ?? 0) + amount
      for (const ct of dept.categoryTotals) {
        if (ct.category !== 'Personal Services') continue
        ;(personalServices[fund.code] ??= {})[key] =
          ((personalServices[fund.code] ?? {})[key] ?? 0) + ct.adopted2026
      }
      if (amount > 0) {
        ;(departments[key] ??= []).push({ fund: fund.code, code, name: dept.name, amount })
      }
      continue
    }

    // Function 9 — not a service. Split it up.
    if (code.startsWith('97')) { debtService += amount; continue }
    if (code === '9901' || code === '9950') { interfundTransfers += amount; continue }
    if (code === '9990') { contingency += amount; continue }
    for (const item of dept.lineItems) {
      const value = item.adopted2026 || 0
      // Adjustment 1: the Town's own uniformed/non-uniformed split.
      if (item.account.includes('-UNI-')) uniformedBenefits += value
      else benefitPoolByFund[fund.code] = (benefitPoolByFund[fund.code] ?? 0) + value
    }
  }
}

const benefits: Record<string, number> = { '3': uniformedBenefits }
for (const [fundCode, pool] of Object.entries(benefitPoolByFund)) {
  // Spread by payroll share where there is payroll; by spending share where a
  // fund carries benefits but contracts the work out (SR1 does exactly this).
  const ps = personalServices[fundCode] ?? {}
  const basis = Object.values(ps).reduce((s, v) => s + v, 0) > 0 ? ps : (fundDirect[fundCode] ?? {})
  const total = Object.values(basis).reduce((s, v) => s + v, 0)
  if (total <= 0) continue
  for (const [key, value] of Object.entries(basis)) {
    benefits[key] = (benefits[key] ?? 0) + (pool * value) / total
  }
}

const earnedByProgram: Record<string, number> = {}
const revenuesByProgram: Record<string, ProgramRevenue[]> = {}
let townwideRevenue = 0
for (const fund of funds) {
  for (const line of fund.revenues) {
    const value = line.adopted2026 || 0
    const segments = line.account.split('-')
    const tag = segments[segments.length - 1]
    if (isProgramKey(tag)) {
      earnedByProgram[tag] = (earnedByProgram[tag] ?? 0) + value
      if (value > 0) (revenuesByProgram[tag] ??= []).push({ name: line.name, amount: value })
    } else {
      townwideRevenue += value
    }
  }
}

// ---------------------------------------------------------------------------
// Denominators.
//
// A per-household figure is NOT a tax bill. Commercial and industrial property
// carries a large share of the levy, fees carry another, and the Town's net
// cost is spread over a base far wider than households alone. Read these as
// "the size of Town government relative to the households in it" — the actual
// bill on an actual parcel is what /tax-bill/ is for.
// ---------------------------------------------------------------------------
export const population: number = community.population.estimate2024
export const households: number = census.households.estimate
export const householdsMoe: number = census.households.moe
export const medianHouseholdIncome: number = census.medianHouseholdIncome.estimate
export const censusSource = census.source
export const censusDataset = census.dataset

const NARRATIVES: Record<ProgramKey, { plain: string; narrative: string; buys: string[] }> = {
  '1': {
    plain: 'Running the Town itself — the offices, the records, the lawyers, the buildings.',
    narrative:
      'This is the machinery every other service runs on top of. It pays the Town Board and Supervisor, the Town Clerk who holds the records, the Assessor who values 20,000-odd parcels, the Tax Receiver who collects on them, the Attorney who defends the Town, the Justice Court, and the finance and purchasing staff who move the money. It also keeps Town Hall standing, heats it, insures it, and runs the IT that everything else depends on. Almost none of it can be charged to a user, which is why it recovers about three cents on the dollar.',
    buys: [
      'Town Board, Supervisor, Town Clerk and the public record',
      'Assessment and tax collection',
      'Town Attorney, Justice Court and court officers',
      'Finance, audit, purchasing and the personnel office',
      'Town Hall, the municipal garage, fuel and information technology',
      'Town-wide insurance, workers’ compensation and risk retention',
    ],
  },
  '3': {
    plain: 'Police, code enforcement, fire protection, the building inspectors and the dog control officer.',
    narrative:
      'Riverhead runs its own police department, and that single choice dominates the Town budget. Once pension and health insurance for sworn officers are counted, Public Safety is the largest thing the Town does by a wide margin — more than a third of all spending. The rest of the function is smaller but visible: the building inspectors who sign off on your permit, code enforcement, the Town’s contribution to fire protection, the Bay Constable, the Juvenile Aid Bureau and the Anti-Bias Task Force.',
    buys: [
      'A full-service police department: patrol squads, detectives, dispatch, traffic and K-9',
      'Building inspection and code enforcement',
      'Fire protection and the Fire Marshal',
      'Bay Constable and harbormaster',
      'Juvenile Aid Bureau, Youth Court and the Anti-Bias Task Force',
      'Animal control',
    ],
  },
  '4': {
    plain: 'The ambulance district, the registrar of births and deaths, and narcotics guidance.',
    narrative:
      'Small in dollars, and almost entirely the Ambulance District — a separate taxing district that pays for emergency medical response. The rest is the Registrar of Vital Statistics, who issues the birth and death certificates residents actually come to Town Hall for, and a contribution to the Narcotics Guidance Council. Roughly two-fifths of the cost comes back through ambulance billing and certificate fees.',
    buys: [
      'The Riverhead Ambulance District',
      'Birth, death and marriage records',
      'Narcotics Guidance Council',
    ],
  },
  '5': {
    plain: 'Roads, snow, streetlights and public parking.',
    narrative:
      'The Highway Fund keeps roughly 200 centerline miles of Town road passable — resurfacing, patching, drainage, brush, and the plows and sanders that come out overnight in a storm. The Street Lighting District pays the power bill and maintains the fixtures; the Public Parking District covers the downtown lots. Almost none of this is charged to users, so it is carried by the Highway Fund’s own tax levy. What the Town spends per mile is worth comparing against the other nine Suffolk towns.',
    buys: [
      'General road repairs, resurfacing and drainage',
      'Snow removal and storm response',
      'Highway machinery and the fleet behind it',
      'Street lighting town-wide',
      'Downtown public parking',
    ],
  },
  '6': {
    plain: 'Senior nutrition and home aid, plus economic development and veterans’ services.',
    narrative:
      'Mostly Programs for the Aging — the senior nutrition centre and Meals on Wheels, plus the in-home services that keep older residents out of institutional care. This is the program most dependent on money from somewhere else: state and county aid, SNAP reimbursement and donations cover a substantial share, so the Town’s own net cost is modest against what it delivers. The remainder is publicity and economic development, and a small line for veterans’ services.',
    buys: [
      'Senior nutrition centre and Meals on Wheels',
      'EISEP in-home services and residential repair for older residents',
      'Economic development and publicity, including the Business Improvement District',
      'Veterans’ services',
    ],
  },
  '7': {
    plain: 'Recreation, parks, beaches, youth and senior programs, the marina and the Town Historian.',
    narrative:
      'The most visible thing the Town does per dollar spent, and the best at paying its own way — recreation programs, beach passes, facility rentals, marina slips and parking permits together return more than half of what the function costs. It is also the Town’s largest employer by headcount, because summer recreation and beach staffing run on a large seasonal and part-time workforce, which is why staff numbers here look enormous next to the dollars.',
    buys: [
      'Recreation programs, instruction and adult leagues',
      'Parks, playgrounds and recreation centres',
      'Town beaches',
      'Youth programs, the Teen Center and youth sports',
      'Senior programs and home aid',
      'Marinas and docks',
      'Town Historian and historical properties',
    ],
  },
  '8': {
    plain: 'Water, sewer, scavenger waste, refuse collection, planning and zoning.',
    narrative:
      'This is where the Town behaves least like a government and most like a utility. Water, the two sewer districts, the scavenger waste plant and refuse collection are billed to the properties they serve, so the function earns back close to four-fifths of its cost — and the districts pay their own insurance and depreciation, which is why those show up here rather than under general government. The tax-supported remainder is the planning and zoning side: the Planning Department, the Zoning Board of Appeals, community development, environmental control and the seed clam program.',
    buys: [
      'Public water supply and distribution',
      'Two sewer districts and the scavenger waste treatment plant',
      'Refuse and garbage collection',
      'Planning Department and Zoning Board of Appeals',
      'Community Development Agency',
      'Environmental control and the seed clam program',
    ],
  },
}

const ORDER: ProgramKey[] = ['3', '8', '1', '5', '7', '4', '6']

export const programs: Program[] = ORDER.map((key) => {
  const d = direct[key] ?? 0
  const b = benefits[key] ?? 0
  const fullCost = d + b
  const earned = earnedByProgram[key] ?? 0
  const net = fullCost - earned
  const copy = NARRATIVES[key]
  return {
    key,
    name: FUNCTION_NAMES[key],
    plain: copy.plain,
    narrative: copy.narrative,
    buys: copy.buys,
    direct: d,
    benefits: b,
    fullCost,
    earned,
    net,
    recoveryPct: fullCost > 0 ? (earned / fullCost) * 100 : 0,
    netPerResident: net / population,
    netPerHousehold: net / households,
    staff: staffByProgram[key] ?? 0,
    departments: (departments[key] ?? []).sort((a, b2) => b2.amount - a.amount),
    topRevenues: (revenuesByProgram[key] ?? []).sort((a, b2) => b2.amount - a.amount).slice(0, 6),
  }
})

const sum = (pick: (p: Program) => number) => programs.reduce((s, p) => s + pick(p), 0)

export const totals = {
  direct: sum((p) => p.direct),
  benefits: sum((p) => p.benefits),
  fullCost: sum((p) => p.fullCost),
  earned: sum((p) => p.earned),
  net: sum((p) => p.net),
  staff: sum((p) => p.staff),
  debtService,
  contingency,
  interfundTransfers,
  townwideRevenue,
  /** Programs + debt + contingency. Excludes interfund transfers by design. */
  grandTotal: sum((p) => p.fullCost) + debtService + contingency,
  appropriations: funds.reduce((s, f) => s + f.expenditureTotal2026, 0),
}

export const perResident = {
  programs: totals.net / population,
  debtService: debtService / population,
  everything: (totals.net + debtService + contingency) / population,
}

export const perHousehold = {
  programs: totals.net / households,
  debtService: debtService / households,
  everything: (totals.net + debtService + contingency) / households,
  /** All-in cost per household as a share of the median household's income. */
  shareOfMedianIncome:
    ((totals.net + debtService + contingency) / households / medianHouseholdIncome) * 100,
}

/** programs + debt + contingency + transfers should equal total appropriations. */
export const reconciliation = {
  computed: totals.grandTotal + interfundTransfers,
  appropriations: totals.appropriations,
  variance: totals.grandTotal + interfundTransfers - totals.appropriations,
}

export const method = [
  {
    title: 'The programs are the State’s classification, not ours',
    body: 'New York’s Uniform System of Accounts assigns every municipal dollar to a function, and Riverhead codes to it. Department 3120 is Police because the State says 3120 is Police. The seven headings below are that system, not a grouping this site invented.',
  },
  {
    title: 'Revenue is matched to programs by the Town’s own account tag',
    body: 'The last segment of every revenue account carries the same function group as the spending side. Building Inspection Fees end in 3, so they land against Public Safety; Site Plan Fees end in 8 and land against Home & Community Services. Revenue with a letter instead — property tax, sales tax, PILOTs, mortgage tax — belongs to no single program and is reported separately.',
  },
  {
    title: 'Pension and health insurance are pushed back onto the programs that earned them',
    body: `$${(totals.benefits / 1e6).toFixed(1)}M of benefits sits in function 9, attached to no service. Accounts ending -UNI- are sworn police and go entirely to Public Safety; -NON- accounts are spread across programs in the same fund by their share of Personal Services. The uniformed/non-uniformed split is the Town's own coding.`,
  },
  {
    title: 'Utility overhead follows the utility',
    body: `Insurance and depreciation booked to function 1 inside a single-purpose fund are the cost of running that utility, not general government, so they follow the fund's service. This moves about $5.4M, mostly sewer and water depreciation. The General Fund and the two internal-service funds are left alone.`,
  },
  {
    title: 'Interfund transfers are excluded',
    body: `$${(interfundTransfers / 1e6).toFixed(1)}M of function 9901 is one Town fund paying another. Counting it as program spending would double-count real dollars, so it sits outside the program totals.`,
  },
  {
    title: 'Staff counts are the one thing we classified ourselves',
    body: `Payroll department names are operational units — "Squad 4 - Police" — rather than account codes, so mapping them to functions is our work, not the Town's. All ${latestPayroll.headcount} people in the ${payrollYear} payroll are accounted for. Headcount is bodies on the payroll, not full-time equivalents, so seasonal recreation staff count the same as a full-time clerk.`,
  },
]

method.push({
  title: 'Per-resident and per-household are scale, not a bill',
  body: `Population is the Census Bureau's ${population.toLocaleString()} estimate; households are ${households.toLocaleString()} ± ${householdsMoe} from ${censusDataset}. Dividing the Town's net cost by either one says how big Town government is relative to the people in it. It is not what you owe — commercial property carries a large share of the levy, and your actual bill depends on your assessment.`,
})

export const notCovered = {
  title: 'What this page still cannot tell you',
  body:
    'GFOA also asks what each program is trying to achieve — response times, permits issued, tons collected, program participation — and whether it hit those targets. The Town publishes no performance measures, so there is nothing to report. Cost and revenue are answered here; service-level goals are not, and no amount of rearranging the budget will produce them.',
}

export const source = {
  title: '2026 Adopted Budget, Town of Riverhead',
  detail:
    'Account-level detail for all 19 funds, extracted by etl/parse_subaccounts.py. Every fund reconciles to the dollar against the Town’s official Summary page appropriations.',
  url: 'https://www.townofriverheadny.gov/DocumentCenter/View/2967/2026-Adopted-Budget',
}
