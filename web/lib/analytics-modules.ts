import { allOperatingFunds2026, fundBalanceUseSummary } from './all-funds'
import { dollars, townWideComparison2026 } from './financial-data'
import { generalFundAfr } from './afr'
// NOTE: import the small payroll summary directly — pulling in lib/payroll.ts
// would drag the full 500KB records file into every page that shows KPIs.
import payrollSummary from '../public/data/payroll/summary.json'

export type AnalyticsModule = {
  name: string
  status: 'active' | 'needs_parsed_data' | 'partial'
  description: string
  sourceBasis: string
  nextStep: string
}

export const analyticsModules: AnalyticsModule[] = [
  {
    name: 'Searchable Financial Records',
    status: 'active',
    description: 'One unified search across budget line items, employee payroll, Board-authorized salaries, Town Board votes, operating funds, and 12,000+ parsed document pages, with live filtering by record type.',
    sourceBasis: 'Compact unified index rebuilt weekly from every structured dataset plus the parsed financial-report archive.',
    nextStep: 'Add fielded queries (year, dollar ranges) and deep links from results into pre-filtered views.',
  },
  {
    name: 'Town Board Voting Records',
    status: 'partial',
    description: 'Every recorded Town Board vote since January 2025 — 39 meetings and 1,672 resolutions with results, movers, seconders, and how each member voted — plus per-member career records listing every dissent and abstention.',
    sourceBasis: 'Official meeting minutes from the Town’s CivicClerk portal, fetched and parsed by a script a maintainer runs periodically — new meetings are not pulled in automatically as they are published.',
    nextStep: 'Extend backfill to pre-2025 meetings, tag budget-related resolutions, and get minutes ingestion running unattended.',
  },
  {
    name: 'Payroll and Overtime Intelligence',
    status: 'active',
    description: 'Actual pay for every employee 2018–2025 (base, overtime summed from detailed pay codes, gross), Board-authorized salaries for 2025 and 2026, and a raise-by-raise comparison with promotions flagged. The 2025 authorized figures now compare against same-year 2025 actual pay.',
    sourceBasis: 'Town Gross Earnings reports (2018–2025) and the Board’s annual salary resolutions.',
    nextStep: 'Add benefits-cost and retirement-pressure indicators from the payroll and budget data.',
  },
  {
    name: 'Cross-Document Financial Reconciliation',
    status: 'active',
    description: 'Extracted budget line items reconcile to the dollar against the official Summary page for all 19 funds; 2025 actual results (AFR) are compared against the adopted plan town-wide and on every fund page; 2024 audited fund balances are cross-checked.',
    sourceBasis: '2026 adopted budget, 2025 Annual Financial Report, and the 2024 audited statements.',
    nextStep: 'Reconcile against the audited 2025 basic financial statements when the Town publishes them.',
  },
  {
    name: 'Multi-Year Fiscal Trend Analysis',
    status: 'active',
    description: 'Budget Compare tracks every fund’s appropriations 2020–2026; the General Fund page charts two decades (2005–2025); each of 848 account line items carries its own seven-year trend; payroll trends span 2018–2025.',
    sourceBasis: 'Adopted budget Summary pages 2020–2026, line-item schedules 2020–2026, and General Fund history 2005–2025.',
    nextStep: 'Extend account-level history to pre-2020 budgets, which use older layouts.',
  },
  {
    name: 'Department and Operational Comparisons',
    status: 'active',
    description: 'Every fund drills down to departments with spending-category rollups (salaries, contractual, equipment, benefits) and year-over-year change; payroll is filterable by department and title from 2022 on.',
    sourceBasis: 'Account-level budget extraction and the Gross Earnings reports.',
    nextStep: 'Add department-level budget-vs-actual once AFR department detail is normalized.',
  },
  {
    name: 'Automated Fiscal Indicators',
    status: 'active',
    description: 'Resident-facing indicators track the actual 2025 General Fund surplus, levy and appropriation growth, payroll and overtime totals, reserve use, and fund-balance reliance.',
    sourceBasis: '2026 adopted budget summary, 2025 AFR actuals, 2024 audited fund balances, and payroll totals.',
    nextStep: 'Add an anomaly watchlist that flags budget lines breaking from their own history and category peers.',
  },
  {
    name: 'Reserve and Fund Balance Monitoring',
    status: 'active',
    description: 'Tracks appropriated fund-balance use in the budget and the actual year-end picture: the General Fund’s savings grew to $33.4M in 2025, broken down by how freely each classification can be spent.',
    sourceBasis: '2026 adopted budget fund-balance schedule and 2025 AFR fund-balance classifications.',
    nextStep: 'Trend reserve levels across multiple AFR years as they are filed.',
  },
  {
    name: 'Tax Levy and Stabilization Views',
    status: 'active',
    description: 'Levy history for the General Fund back to 2005, current-year levy dependency for every fund, and a reserve-supported stabilization scenario with stated assumptions.',
    sourceBasis: 'Adopted budget levy fields, General Fund history, and the surplus-allocation scenario.',
    nextStep: 'Add assessed-valuation and tax-base analytics for per-taxpayer modeling.',
  },
  {
    name: 'Debt and Capital Financing Analytics',
    status: 'partial',
    description: 'Debt Service Fund appropriations and actual debt-service spending are on the fund pages and Annual Report; dedicated schedules (principal/interest, BAN exposure) are not yet extracted.',
    sourceBasis: 'Debt Service Fund budget lines and AFR debt-service actuals; audit debt schedules once parsed.',
    nextStep: 'Extract principal-and-interest and BAN schedules from audits and AFRs.',
  },
  {
    name: 'Plain-English Explanations',
    status: 'active',
    description: 'Every tool opens with an “In plain English” intro; a Start Here guide, a full budget glossary, tappable term definitions, and column guides explain the record to readers with no finance background.',
    sourceBasis: 'Written explanations grounded in the extracted, reconciled datasets.',
    nextStep: 'Add page-level source citations with extraction confidence to each explanation.',
  },
  {
    name: 'Data Pipeline',
    status: 'partial',
    description: 'Re-parsing already-known financial-report PDFs, rebuilding search and CSV downloads, and redeploying the site run automatically on every update. Pulling in newly posted meeting minutes and folding in newly published fiscal statements (AFRs, budgets, audits) still take a maintainer manually running the fetch/parse scripts and reviewing the output.',
    sourceBasis: 'GitHub Actions running the open-source ETL against Town document sources for the automatic steps; manual script runs for new-document discovery and vote ingestion.',
    nextStep: 'Auto-discover newly posted budget, AFR, and meeting-minute documents so the whole pipeline runs unattended.',
  },
  {
    name: 'Open Data Downloads',
    status: 'active',
    description: 'Ten datasets — payroll, salaries, raises, votes, member records, line items, fund history, and actual results — free to download as CSV for spreadsheets or JSON for developers, regenerated automatically.',
    sourceBasis: 'Every structured dataset on the site.',
    nextStep: 'Add a data dictionary describing each column.',
  },
]

const latestPayrollYear = payrollSummary.yearSummaries[payrollSummary.yearSummaries.length - 1]
const gfSurplus2025 = generalFundAfr.surplus?.['2025'] ?? 0
const gfFundBalance2025 = generalFundAfr.fundBalance?.['2025'] ?? 0

export const automatedKpis = [
  {
    label: '2025 General Fund surplus (actual)',
    value: dollars(gfSurplus2025),
    explanation: `The General Fund actually took in ${dollars(gfSurplus2025)} more than it spent in 2025, growing savings to ${dollars(gfFundBalance2025)} (2025 Annual Financial Report).`,
  },
  {
    label: 'Town-wide levy growth',
    value: `${townWideComparison2026.taxLevyPercentChange}%`,
    explanation: `The town-wide levy increased by ${dollars(townWideComparison2026.taxLevyDollarChange)} from 2025 to 2026.`,
  },
  {
    label: 'Town-wide appropriation growth',
    value: `${townWideComparison2026.percentChange}%`,
    explanation: `Town-wide appropriations increased by ${dollars(townWideComparison2026.dollarChange)} from 2025 to 2026.`,
  },
  {
    label: `Actual payroll (${latestPayrollYear.year})`,
    value: dollars(latestPayrollYear.totalGross),
    explanation: `${latestPayrollYear.headcount.toLocaleString()} employees were paid ${dollars(latestPayrollYear.totalGross)} in gross pay, including ${dollars(latestPayrollYear.totalOvertime)} of overtime.`,
  },
  {
    label: 'Appropriated fund balance used',
    value: dollars(fundBalanceUseSummary.totalAppropriatedFundBalanceInSummary),
    explanation: 'Reserve and fund-balance use in the adopted budget summary — not recurring operating revenue.',
  },
  {
    label: 'Operating funds indexed',
    value: String(allOperatingFunds2026.length),
    explanation: 'Every 2026 operating fund drills down to departments and individual account line items.',
  },
]

export const comparisonDimensions = [
  'appropriations',
  'estimated revenues',
  'appropriated fund balance',
  'tax levy',
  'unaudited fund balance',
  'estimated ending fund balance',
  'document status',
]
