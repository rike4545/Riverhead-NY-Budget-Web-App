// A program budget for Riverhead: what the Town actually does, what each of
// those things costs once you count the pension and health insurance that pay
// for the people who do it, how much of it the service earns back at the door,
// and how all of that has moved from one year's budget to the next.
//
// WHY THIS IS POSSIBLE WITHOUT INVENTING A TAXONOMY. New York's Uniform System
// of Accounts already classifies every municipal dollar by function, and
// Riverhead codes to it on both sides of the ledger. An expenditure department
// carries the function in its code — 3120 is Police, 8160 is Refuse. A revenue
// line carries the same function group in the last segment of its account, so
// A01-1560-170-00000-3 (Building Inspection Fees) is Public Safety earning its
// own keep. Everything below is a regrouping of the Town's own coding, not a
// classification this site made up. The arithmetic is in lib/program-budget.ts.
//
// FOUR ADJUSTMENTS, each stated on the page rather than buried:
//
//   1. Employee benefits. Pension, health insurance, FICA and workers' comp sit
//      in function 9, attached to no service at all. Left there, every program
//      looks cheaper than it is, so they are pushed back onto the programs whose
//      staff earned them. The split is the Town's own: accounts ending -UNI- are
//      uniformed (sworn police) and go entirely to Public Safety; -NON- accounts
//      are spread across the programs in the same fund by each one's share of
//      Personal Services. lib/benefit-load.ts applies the same UNI/NON reasoning
//      to the Comptroller's filing.
//
//   2. Overhead inside single-purpose funds. Insurance and depreciation booked
//      to function 1 inside a sewer or water fund are the cost of running that
//      utility, so in a fund that does one thing they follow its service. The
//      General Fund and the two internal-service funds are left alone.
//
//   3. Interfund transfers. Function 9901 is one Town fund paying another.
//      Counting it would double-count real spending, so it is reported apart.
//
//   4. Money set aside. Account 9990, "Fund Balance Contribution", is money a
//      fund budgets into its savings instead of spending it. It is no service,
//      so it is reported apart too. (This page used to call it contingency.)
//
// EVERY YEAR FROM THE SAME RECORD. The Town prints each adopted budget again,
// line by line, in the next year's Budget Supplement, and the Tentative Budget
// in its own. A year is shown only when those lines add up, fund by fund, to
// that year's Summary page on both the spending and the revenue side. For 2026
// the spending lines match the parsed Adopted Budget to the cent, and the
// revenue lines include nine General Fund lines the parsed Adopted Budget
// drops: $1,250,000 of appropriated fund balance and $506,300 of fees, rents
// and aid. scripts/verify-programs.mjs checks all of it.

import census from '../public/data/census-acs.json'
import community from '../public/data/community.json'
import payrollSummary from '../public/data/payroll/summary.json'
import lineHistory from '../public/data/budget-supplement/line-history.json'
import revenueHistory from '../public/data/budget-supplement/revenue-history.json'
import budgetStages from '../public/data/history/budget-stages.json'
import reports from '../public/data/financial-reports/index.json'
import { GFOA_QUOTES } from './gfoa'
import { allFundCodes, getFundDetail } from './subaccounts'
import {
  PROGRAM_NAMES, PROGRAM_ORDER, budgetYears, programBudget,
  type BudgetFigures, type BudgetStage, type HistoryAccount, type ProgramDepartment, type ProgramFigures, type ProgramKey, type StageSummary,
} from './program-budget'

export type { BudgetStage, ProgramDepartment, ProgramKey } from './program-budget'
export type ProgramRevenue = { name: string; amount: number }

export type Program = {
  key: ProgramKey
  name: string
  /** One line a resident can read without a finance background. */
  plain: string
  /** What the Town actually does under this heading, with this year's figures. */
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

const usd = (n: number) => `${n < 0 ? '−' : ''}$${Math.round(Math.abs(n)).toLocaleString('en-US')}`
const millions = (n: number) => `${n < 0 ? '−' : ''}$${(Math.abs(n) / 1e6).toFixed(1)}M`
const percent = (n: number) => `${Math.round(n)}%`

// ---------------------------------------------------------------------------
// Payroll headcount. The Town's payroll department names are operational units
// ("Squad 4 - Police"), not account codes, so this mapping is ours — the one
// piece of classification on this page that is not the Town's own. It covers
// every department name in each payroll year the page uses.
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
  // The payroll spells this code both ways.
  'Fire Marshal': '3', 'Fire Marshall': '3', 'Safety Inspection / Clerical': '3',
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

type PayrollYear = { year: number; headcount: number; byDepartment: { department: string; headcount: number }[] }
const payrollYears = payrollSummary.yearSummaries as unknown as PayrollYear[]
const latestPayroll = payrollYears[payrollYears.length - 1]
export const payrollYear: number = latestPayroll.year

const unmapped = new Set<string>()
/** Staff by program from a budget year's own payroll, or the latest one for a year the payroll has not reached. */
function staffFor(budgetYear: number) {
  const payroll = payrollYears.find((p) => p.year === Math.min(budgetYear, payrollYear)) ?? latestPayroll
  const staff: Partial<Record<ProgramKey, number>> = {}
  for (const row of payroll.byDepartment) {
    const key = PAYROLL_DEPT_PROGRAM[row.department]
    if (!key) { unmapped.add(`${payroll.year}: ${row.department}`); continue }
    staff[key] = (staff[key] ?? 0) + row.headcount
  }
  return { year: payroll.year, headcount: payroll.headcount, staff }
}

// ---------------------------------------------------------------------------
// Denominators.
//
// A per-household figure is NOT a tax bill. Commercial and industrial property
// carries a large share of the levy, fees carry another, and the Town's net
// cost is spread over a base far wider than households alone. Read these as
// "the size of Town government relative to the households in it" — the actual
// bill on an actual parcel is what /tax-bill/ is for. The same counts divide
// every year, so a per-person change is the budget's change and nothing else.
// ---------------------------------------------------------------------------
export const population: number = community.population.estimate2024
export const households: number = census.households.estimate
export const householdsMoe: number = census.households.moe
export const medianHouseholdIncome: number = census.medianHouseholdIncome.estimate
export const censusSource = census.source
export const censusDataset = census.dataset

// ---------------------------------------------------------------------------
// What each program is, in words. A narrative's figures are worked out from the
// year it describes, because a sentence that is true of one budget can be false
// of the next.
// ---------------------------------------------------------------------------
type Facts = {
  label: string
  /** "the 2026 adopted budget", or "the 2027 Tentative Budget". */
  title: string
  p: ProgramFigures
  figures: BudgetFigures
  /** The program's full cost as a share of everything budgeted that year. */
  share: number
  staff: number
  staffYear: number
  /** 1 for the program with the most people on the payroll. */
  staffRank: number
}

const ORDINAL = ['', '', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh']

const NARRATIVES: Record<ProgramKey, { plain: string; buys: string[]; narrative: (f: Facts) => string }> = {
  '1': {
    plain: 'Running the Town itself — the offices, the records, the lawyers, the buildings.',
    narrative: (f) =>
      `This is the machinery every other service runs on top of. It pays the Town Board and Supervisor, the Town Clerk who holds the records, the Assessors who value every property in Town, the Tax Receiver who collects on them, the Attorney who defends the Town, the Justice Court, and the finance and purchasing staff who move the money. It also keeps Town Hall standing, heats it, insures it, and runs the IT that everything else depends on. Almost none of it can be charged to a user, so in ${f.title} it recovers about ${Math.round(f.p.recoveryPct)} cents on the dollar.`,
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
    narrative: (f) => {
      const others = f.figures.programs.filter((x) => x.key !== '3').map((x) => x.fullCost)
      const next = Math.max(...others)
      const lead = f.p.fullCost > next * 1.25 ? 'the largest thing the Town does by a wide margin' : f.p.fullCost > next ? 'the largest thing the Town does' : 'one of the largest things the Town does'
      return `Riverhead runs its own police department, and that single choice dominates the Town budget. Once pension and health insurance for sworn officers are counted, Public Safety is ${lead}: ${percent(f.share)} of everything in ${f.title}. The rest of the function is smaller but visible: the building inspectors who sign off on your permit, code enforcement, the Town’s contribution to fire protection, the Bay Constable, the Juvenile Aid Bureau and the Anti-Bias Task Force.`
    },
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
    narrative: (f) => {
      const opening = 'Small in dollars, and almost entirely the Ambulance District — a separate taxing district that pays for emergency medical response. The rest is the Registrar of Vital Statistics, who issues the birth and death certificates residents actually come to Town Hall for, and a contribution to the Narcotics Guidance Council.'
      if (f.p.recoveryPct < 100) return `${opening} In ${f.title}, about ${percent(f.p.recoveryPct)} of the cost comes back through ambulance billing and certificate fees.`
      const reserve = f.figures.setAsideLines.filter((l) => l.fund === 'SM1').reduce((s, l) => s + l.amount, 0)
      return `${opening} In ${f.title}, ambulance billing was budgeted above the whole function’s cost${reserve > 0 ? `, and the Ambulance District budgeted ${usd(reserve)} into the reserve its budget calls “RVAC & Improvements Reserve”. This page counts money put into savings as set aside rather than spent` : ''}, so Health shows fees above its cost that year.`
    },
    buys: [
      'The Riverhead Ambulance District',
      'Birth, death and marriage records',
      'Narcotics Guidance Council',
    ],
  },
  '5': {
    plain: 'Roads, snow, streetlights and public parking.',
    narrative: () =>
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
    narrative: (f) =>
      `Mostly Programs for the Aging — the senior nutrition centre and Meals on Wheels, plus the in-home services that keep older residents out of institutional care. This is the program most dependent on money from somewhere else: state and county aid, SNAP reimbursement and donations cover ${percent(f.p.recoveryPct)} of its cost in ${f.title}, so the Town’s own net cost is modest against what it delivers. The remainder is publicity and economic development, and a small line for veterans’ services.`,
    buys: [
      'Senior nutrition centre and Meals on Wheels',
      'EISEP in-home services and residential repair for older residents',
      'Economic development and publicity, including the Business Improvement District',
      'Veterans’ services',
    ],
  },
  '7': {
    plain: 'Recreation, parks, beaches, youth and senior programs, the marina and the Town Historian.',
    narrative: (f) =>
      `The most visible thing the Town does per dollar spent, and one of the few that pays much of its own way — recreation programs, beach passes, facility rentals, marina slips and parking permits together return ${percent(f.p.recoveryPct)} of what the function costs in ${f.title}. Its staff count is large next to its dollars: ${f.staff} people were paid in ${f.staffYear}, ${f.staffRank === 1 ? 'more than any other program' : `the ${ORDINAL[f.staffRank]} most of any program`}, because summer recreation and beach staffing run on a large seasonal and part-time workforce.`,
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
    narrative: (f) =>
      `This is where the Town behaves least like a government and most like a utility. Water, the two sewer districts and the scavenger waste plant are billed to the properties they serve, so the function earns back ${percent(f.p.recoveryPct)} of its cost in ${f.title}. Refuse collection is paid for by its own district tax, which this page counts with the other taxes rather than as a fee. The districts pay their own insurance and depreciation, which is why those show up here rather than under general government. The tax-supported remainder is the planning and zoning side: the Planning Department, the Zoning Board of Appeals, community development, environmental control and the seed clam program.`,
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

// ---------------------------------------------------------------------------
// The years. Every adopted budget the Supplements reprint, and the newest
// Supplement's Tentative, shown only where the lines reconcile.
// ---------------------------------------------------------------------------
const stages = budgetStages as unknown as { years: Record<string, Partial<Record<BudgetStage, StageSummary>>> }
const spendHistory = lineHistory as unknown as { budgetYear: number; adoptedYears: number[]; accounts: HistoryAccount[] }
const revenueLines = revenueHistory as unknown as { budgetYear: number; adoptedYears: number[]; accounts: HistoryAccount[] }

type Report = { title: string; url: string; year: number; category: string; slug: string }
const reportList = (reports as unknown as { documents: Report[] }).documents
/** A year's Budget Supplement, which reprints the year before's adopted budget and proposes its own. */
function supplement(year: number): { title: string; url: string } | null {
  const docs = reportList.filter((d) => d.category === 'budget_supplement' && d.year === year)
  const doc = docs.find((d) => d.slug.endsWith('-pdf')) ?? docs[0]
  return doc ? { title: doc.title.replace(/\s*\(PDF\)$/, ''), url: doc.url } : null
}

const departmentNames: Record<string, string> = {}
for (const code of allFundCodes()) {
  const fund = getFundDetail(code)
  if (!fund) continue
  for (const dept of fund.departments) departmentNames[`${fund.code}-${dept.code}`] = dept.name
}

export type ProgramYear = {
  year: number
  stage: BudgetStage
  /** "2026", or "2027 proposed" for a Tentative Budget. */
  label: string
  /** "the 2026 adopted budget", or "the 2027 Tentative Budget". */
  title: string
  /** The Supplement the lines come from, and the budget whose Summary page they reconcile to. */
  supplement: { title: string; url: string } | null
  summary: { title: string; url: string } | null
  staffYear: number
  staffHeadcount: number
  figures: BudgetFigures
  programs: Program[]
  totals: {
    direct: number; benefits: number; fullCost: number; earned: number; net: number; staff: number
    debtService: number; setAside: number; interfundTransfers: number; townwideRevenue: number
    /** Programs + debt + money set aside. Excludes interfund transfers by design. */
    grandTotal: number
    /** Total appropriations on the Summary page, all funds. */
    appropriations: number
  }
  perResident: { programs: number; debtService: number; everything: number }
  perHousehold: { programs: number; debtService: number; everything: number; shareOfMedianIncome: number }
  /** programs + debt + set aside + transfers against the Summary's appropriations. */
  reconciliation: { computed: number; appropriations: number; variance: number }
}

export const yearsLeftOut: { year: number; stage: BudgetStage; reason: string }[] = []
export const programYears: ProgramYear[] = []

const years = budgetYears(spendHistory, revenueLines, stages.years)
for (const { year, stage, off } of years.leftOut) {
  yearsLeftOut.push({ year, stage, reason: off[0] === 'no Summary page on file' ? off[0] : `its lines do not add up to the Summary page (${off.length === 1 ? 'one total' : `${off.length} totals`} off)` })
}
for (const { year, stage, spend, revenue, summary } of years.shown) {
  const figures = programBudget(spend, revenue, departmentNames)
  const people = staffFor(year)
  const label = stage === 'tentative' ? `${year} proposed` : String(year)
  const title = stage === 'tentative' ? `the ${year} Tentative Budget` : `the ${year} adopted budget`
  const official = Object.values(summary.funds).reduce((s, f) => s + (f.appropriations ?? 0), 0)
  const byStaff = PROGRAM_ORDER.map((k) => people.staff[k] ?? 0).sort((a, b) => b - a)
  const programs = figures.programs.map((p): Program => {
    const staff = people.staff[p.key] ?? 0
    const copy = NARRATIVES[p.key]
    return {
      key: p.key,
      name: PROGRAM_NAMES[p.key],
      plain: copy.plain,
      narrative: copy.narrative({ label, title, p, figures, share: (p.fullCost / official) * 100, staff, staffYear: people.year, staffRank: byStaff.indexOf(staff) + 1 }),
      buys: copy.buys,
      direct: p.direct,
      benefits: p.benefits,
      fullCost: p.fullCost,
      earned: p.earned,
      net: p.net,
      recoveryPct: p.recoveryPct,
      netPerResident: p.net / population,
      netPerHousehold: p.net / households,
      staff,
      departments: p.departments,
      topRevenues: p.revenues.slice(0, 6).map(({ name, amount }) => ({ name, amount })),
    }
  })
  const sum = (pick: (p: Program) => number) => programs.reduce((s, p) => s + pick(p), 0)
  const net = sum((p) => p.net)
  const fullCost = sum((p) => p.fullCost)
  const everything = net + figures.debtService + figures.setAside
  programYears.push({
    year,
    stage,
    label,
    title,
    supplement: supplement(stage === 'tentative' ? year : year + 1),
    summary: summary.source ? { title: summary.source.title.replace(/\s*\(PDF\)$/, ''), url: summary.source.url } : null,
    staffYear: people.year,
    staffHeadcount: people.headcount,
    figures,
    programs,
    totals: {
      direct: sum((p) => p.direct),
      benefits: sum((p) => p.benefits),
      fullCost,
      earned: sum((p) => p.earned),
      net,
      staff: sum((p) => p.staff),
      debtService: figures.debtService,
      setAside: figures.setAside,
      interfundTransfers: figures.interfundTransfers,
      townwideRevenue: figures.townwideRevenue,
      grandTotal: fullCost + figures.debtService + figures.setAside,
      appropriations: official,
    },
    perResident: { programs: net / population, debtService: figures.debtService / population, everything: everything / population },
    perHousehold: {
      programs: net / households,
      debtService: figures.debtService / households,
      everything: everything / households,
      shareOfMedianIncome: (everything / households / medianHouseholdIncome) * 100,
    },
    reconciliation: {
      computed: fullCost + figures.debtService + figures.setAside + figures.interfundTransfers,
      appropriations: official,
      variance: fullCost + figures.debtService + figures.setAside + figures.interfundTransfers - official,
    },
  })
}

/** The budget in force: the newest adopted year. The page opens on it. */
export const currentYearIndex: number = programYears.map((y) => y.stage).lastIndexOf('adopted')
const current = programYears[currentYearIndex]
if (!current) throw new Error('lib/programs.ts: no adopted budget reconciles, so the program page has nothing to show')

export const unmappedPayrollDepartments: string[] = Array.from(unmapped)

// The budget in force, under the names the page, /explore/ and /data/programs.json have always used.
export const programs: Program[] = current.programs
export const totals = current.totals
export const perResident = current.perResident
export const perHousehold = current.perHousehold
export const reconciliation = current.reconciliation

export const source = {
  title: `${current.year} Adopted Budget, Town of Riverhead, line by line from the ${current.supplement?.title ?? `${current.year + 1} Budget Supplement`}`,
  detail:
    `Every account line of all ${Object.keys(stages.years[String(current.year)]?.adopted?.funds ?? {}).length} funds, as the Town reprints its adopted budget in the next year’s Budget Supplement (read by etl/parse_supplement_history.py). Each year shown adds up to its budget’s Summary page, fund by fund, on spending and on revenue.`,
  url: current.supplement?.url ?? current.summary?.url ?? '',
}

const shown = programYears.map((y) => y.label)
const leftOutYears = yearsLeftOut.map((y) => y.year)

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
    body: `${millions(current.figures.benefitPool)} of benefits sits in function 9 in ${current.title}, attached to no service. Accounts ending -UNI- are sworn police and go entirely to Public Safety; -NON- accounts are spread across programs in the same fund by their share of Personal Services. The uniformed/non-uniformed split is the Town’s own coding.`,
  },
  {
    title: 'Utility overhead follows the utility',
    body: `Insurance and depreciation booked to function 1 inside a single-purpose fund are the cost of running that utility, not general government, so they follow the fund’s service. This moves ${millions(current.figures.overheadMoved)} in ${current.title}, mostly sewer and water depreciation. The General Fund and the two internal-service funds are left alone.`,
  },
  {
    title: 'Interfund transfers are excluded',
    body: `${millions(current.totals.interfundTransfers)} of function 9901 in ${current.title} is one Town fund paying another. Counting it as program spending would double-count real dollars, so it sits outside the program totals.`,
  },
  {
    title: 'Money set aside is reported on its own',
    body: `Account 9990, “Fund Balance Contribution”, is money a fund budgets into its savings instead of spending it: ${usd(current.totals.setAside)} in ${current.title}. It pays for no service that year, so it sits outside the program totals. This page used to call it contingency.`,
  },
  {
    title: 'Every year comes from the same kind of record',
    body: `The Town prints each adopted budget again, line by line, in the next year’s Budget Supplement, and its Tentative Budget in that year’s own. A year is shown only when those lines add up to the budget’s Summary page for every fund, on both the spending and the revenue side: ${shown.join(', ')}.${leftOutYears.length ? ` ${leftOutYears.join(', ')} ${leftOutYears.length === 1 ? 'is' : 'are'} left out because ${leftOutYears.length === 1 ? 'its' : 'their'} lines do not add up.` : ''} A Tentative Budget is the Supervisor’s proposal, not a budget the Board has adopted.`,
  },
  {
    title: 'Staff counts are the one thing we classified ourselves',
    body: `Payroll department names are operational units — "Squad 4 - Police" — rather than account codes, so mapping them to functions is our work, not the Town’s. Each budget year uses that year’s payroll, or the latest one (${payrollYear}) for years the payroll has not reached; all ${latestPayroll.headcount} people in the ${payrollYear} payroll are accounted for. Headcount is bodies on the payroll, not full-time equivalents, so seasonal recreation staff count the same as a full-time clerk.`,
  },
  {
    title: 'Per-resident and per-household are scale, not a bill',
    body: `Population is the Census Bureau’s ${population.toLocaleString()} estimate; households are ${households.toLocaleString()} ± ${householdsMoe} from ${censusDataset}. Dividing the Town’s net cost by either one says how big Town government is relative to the people in it, and the same counts divide every year. It is not what you owe — commercial property carries a large share of the levy, and your actual bill depends on your assessment.`,
  },
]

export const notCovered = {
  title: 'What this page still cannot tell you',
  // GFOA's question is quoted from lib/gfoa.ts, where the build checks it against GFOA's page.
  body:
    `GFOA’s criteria for a program budget also ask “${GFOA_QUOTES.programGoals.text}” For a town, that would mean targets such as response times, permits issued, tons collected or program participation. The Town publishes no performance measures, so there is nothing to report. Cost and revenue are answered here; service-level goals are not, and no amount of rearranging the budget will produce them.`,
}

// ---------------------------------------------------------------------------
// The same years as series, one value per year, for the page's year switcher.
// ---------------------------------------------------------------------------
export type SeriesProgram = {
  key: ProgramKey
  name: string
  plain: string
  buys: string[]
  narrative: string[]
  direct: number[]
  benefits: number[]
  fullCost: number[]
  earned: number[]
  net: number[]
  recoveryPct: number[]
  staff: number[]
  /** Every department any year funds, with its amount in each year (0 where it had none). */
  departments: { fund: string; code: string; name: string; amounts: number[] }[]
  revenues: { name: string; amounts: number[] }[]
}

export type ProgramSeries = {
  years: { year: number; stage: BudgetStage; label: string; title: string; staffYear: number; supplement: { title: string; url: string } | null }[]
  current: number
  totals: Record<'fullCost' | 'earned' | 'net' | 'debtService' | 'setAside' | 'interfundTransfers' | 'appropriations' | 'staff', number[]>
  perResident: { programs: number[]; everything: number[] }
  perHousehold: { programs: number[]; debtService: number[]; everything: number[]; shareOfMedianIncome: number[] }
  programs: SeriesProgram[]
}

function seriesOf(key: ProgramKey): SeriesProgram {
  const each = programYears.map((y) => y.programs.find((p) => p.key === key)!)
  const departments = new Map<string, { fund: string; code: string; name: string; amounts: number[] }>()
  const revenues = new Map<string, { name: string; amounts: number[] }>()
  programYears.forEach((y, i) => {
    for (const d of each[i].departments) {
      const id = `${d.fund}-${d.code}`
      const row = departments.get(id) ?? { fund: d.fund, code: d.code, name: d.name, amounts: programYears.map(() => 0) }
      row.amounts[i] = d.amount
      row.name = d.name
      departments.set(id, row)
    }
    for (const r of y.figures.programs.find((p) => p.key === key)!.revenues) {
      const row = revenues.get(r.account) ?? { name: r.name, amounts: programYears.map(() => 0) }
      row.amounts[i] = r.amount
      row.name = r.name
      revenues.set(r.account, row)
    }
  })
  return {
    key,
    name: PROGRAM_NAMES[key],
    plain: NARRATIVES[key].plain,
    buys: NARRATIVES[key].buys,
    narrative: each.map((p) => p.narrative),
    direct: each.map((p) => p.direct),
    benefits: each.map((p) => p.benefits),
    fullCost: each.map((p) => p.fullCost),
    earned: each.map((p) => p.earned),
    net: each.map((p) => p.net),
    recoveryPct: each.map((p) => p.recoveryPct),
    staff: each.map((p) => p.staff),
    departments: Array.from(departments.values()),
    revenues: Array.from(revenues.values()),
  }
}

export const programSeries: ProgramSeries = {
  years: programYears.map((y) => ({ year: y.year, stage: y.stage, label: y.label, title: y.title, staffYear: y.staffYear, supplement: y.supplement })),
  current: currentYearIndex,
  totals: {
    fullCost: programYears.map((y) => y.totals.fullCost),
    earned: programYears.map((y) => y.totals.earned),
    net: programYears.map((y) => y.totals.net),
    debtService: programYears.map((y) => y.totals.debtService),
    setAside: programYears.map((y) => y.totals.setAside),
    interfundTransfers: programYears.map((y) => y.totals.interfundTransfers),
    appropriations: programYears.map((y) => y.totals.appropriations),
    staff: programYears.map((y) => y.totals.staff),
  },
  perResident: { programs: programYears.map((y) => y.perResident.programs), everything: programYears.map((y) => y.perResident.everything) },
  perHousehold: {
    programs: programYears.map((y) => y.perHousehold.programs),
    debtService: programYears.map((y) => y.perHousehold.debtService),
    everything: programYears.map((y) => y.perHousehold.everything),
    shareOfMedianIncome: programYears.map((y) => y.perHousehold.shareOfMedianIncome),
  },
  programs: PROGRAM_ORDER.map(seriesOf),
}
