import { allOperatingFunds2026, fundBalanceUseSummary } from './all-funds'
import { dollars, townWideComparison2026 } from './financial-data'

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
    status: 'partial',
    description: 'Search across funds, departments, appropriations, revenues, reserves, debt references, payroll references, source documents, and extracted monetary values. The platform is evolving toward full line-item search directly from budgets, AFRs, audits, and supporting financial records.',
    sourceBasis: '2026 adopted budget extracted fund data plus parsed financial-report JSON pipeline.',
    nextStep: 'Bind the resident-facing search experience directly to generated parser datasets and live extracted document records.',
  },
  {
    name: 'Resident-Focused AI Explanations',
    status: 'active',
    description: 'Financial records are translated into resident-friendly explanations that help explain what changed, why it matters, potential fiscal risks, reserve impacts, and emerging budget pressures.',
    sourceBasis: 'Narrative intelligence, pressure indicators, retirement-risk analysis, reserve analysis, and source registry.',
    nextStep: 'Add page-level citations and extraction confidence scoring for every generated explanation.',
  },
  {
    name: 'Cross-Document Financial Reconciliation',
    status: 'needs_parsed_data',
    description: 'The reconciliation engine is designed to compare adopted budgets, tentative budgets, AFR actuals, audited financial statements, and supplements to identify inconsistencies, reserve shifts, and structural gaps.',
    sourceBasis: '2024 audit, 2025 AFR, 2026 adopted budget, and historical archive parser outputs.',
    nextStep: 'Normalize AFR and audit schedules into comparable cross-year datasets.',
  },
  {
    name: 'Multi-Year Fiscal Trend Analysis',
    status: 'partial',
    description: 'Historical trend views are being prepared for tax levy growth, appropriations, revenues, expenditures, reserve usage, debt exposure, and fund-balance movement.',
    sourceBasis: 'Financial reports archive covering 2022 through 2026.',
    nextStep: 'Populate normalized year-by-year line-item trend tables from parser outputs.',
  },
  {
    name: 'Automated Fiscal Indicators',
    status: 'active',
    description: 'Resident-facing indicators currently track levy dependency, reserve usage, fund-balance reliance, budget composition, stabilization assumptions, and emerging fiscal pressure areas.',
    sourceBasis: '2026 adopted budget summary and 2024 audited fund balances.',
    nextStep: 'Integrate 2025 AFR actuals and future audit schedules for stronger budget-vs-actual KPIs.',
  },
  {
    name: 'Department and Operational Comparisons',
    status: 'partial',
    description: 'The platform is expanding toward department-level intelligence including operational spending comparisons, staffing trends, payroll exposure, overtime pressure, equipment spending, and contractual expense growth.',
    sourceBasis: 'All 2026 operating funds and fund-balance schedules.',
    nextStep: 'Extract department/account rows and operational categories from full budget and AFR PDFs.',
  },
  {
    name: 'Reserve and Fund Balance Monitoring',
    status: 'active',
    description: 'Tracks appropriated fund-balance usage, reserve positioning, stabilization assumptions, projected reserve dependency, and potential structural imbalance indicators.',
    sourceBasis: '2026 adopted budget fund-balance schedule.',
    nextStep: 'Reconcile reserve balances against 2025 AFR and future audited statements.',
  },
  {
    name: 'Tax Levy and Stabilization Modeling',
    status: 'active',
    description: 'Models levy pressure, reserve-supported stabilization strategies, fund-level levy dependency, and long-term sustainability considerations.',
    sourceBasis: '2026 adopted budget levy fields and surplus stabilization scenario data.',
    nextStep: 'Add assessed-valuation and tax-base analytics for more localized taxpayer modeling.',
  },
  {
    name: 'Debt and Capital Financing Analytics',
    status: 'needs_parsed_data',
    description: 'Future analytics will track debt-service growth, BAN exposure, principal and interest schedules, and long-term capital-financing dependency.',
    sourceBasis: 'Debt Service Fund plus audit and AFR debt schedules once parsed.',
    nextStep: 'Extract debt schedules and capital-financing tables from audits and AFRs.',
  },
  {
    name: 'Payroll and Overtime Intelligence',
    status: 'needs_parsed_data',
    description: 'Future labor analytics will track salary trends, overtime growth, benefits exposure, workforce concentration, retirement pressure, and department-level labor dependency.',
    sourceBasis: 'Budget department/account lines and future payroll/overtime public records if integrated.',
    nextStep: 'Extract payroll, overtime, and benefit accounts from department-level budget pages.',
  },
  {
    name: 'Source-Backed AI Summaries',
    status: 'partial',
    description: 'AI-generated explanations are being designed to connect directly back to source documents, extracted text, page references, reconciliation status, and confidence indicators.',
    sourceBasis: 'Source registry, financial-report archive, generated parser datasets, and citation scaffolding.',
    nextStep: 'Wire page-level citations and extraction traceability directly into the UI.',
  },
]

export const automatedKpis = [
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
    label: 'Appropriated fund balance used',
    value: dollars(fundBalanceUseSummary.totalAppropriatedFundBalanceInSummary),
    explanation: 'This reflects reserve and fund-balance use in the adopted budget summary and should not be interpreted as recurring operating revenue.',
  },
  {
    label: 'Operating funds indexed',
    value: String(allOperatingFunds2026.length),
    explanation: 'Every currently extracted 2026 operating fund is represented for fund-level comparison and future department drilldowns.',
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
