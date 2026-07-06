// Mapping of this site against the GFOA Distinguished Budget Presentation
// Award criteria (gfoa.org/budget-award — 25 criteria across four roles).
// The award itself applies to a government's budget document — the Town's,
// not ours — but its criteria are the recognized standard for presenting
// budget information, so we hold the site to every criterion that can apply
// to an independent presentation, and we're explicit about what's met,
// partial, or missing.

const base = '/rike4545-riverhead-budget-live'

export type GfoaStatus = 'met' | 'partial' | 'gap'

export type GfoaCriterion = {
  code: string
  title: string
  mandatory: boolean
  requires: string
  howWeAddress: string
  status: GfoaStatus
  link?: string
  linkLabel?: string
  gapNote?: string
}

export type GfoaCategory = {
  key: string
  name: string
  plain: string
  criteria: GfoaCriterion[]
}

export const gfoaCategories: GfoaCategory[] = [
  {
    key: 'communication',
    name: 'As a Communication Device',
    plain: 'Can an average reader actually find, read, and understand the information?',
    criteria: [
      {
        code: 'C1', title: 'Table of Contents', mandatory: true,
        requires: 'A comprehensive table of contents that makes information easy to find.',
        howWeAddress: 'Persistent navigation on every page, a Start Here guide that maps every tool, on-page section anchors, and a full sitemap.',
        status: 'met', link: `${base}/guide/`, linkLabel: 'Start Here guide',
      },
      {
        code: 'C2', title: 'Budget Overview', mandatory: true,
        requires: 'An overview of significant budgetary items and trends (a "budget in brief").',
        howWeAddress: 'The dashboard leads with plain-English KPIs and insights (levy growth, surplus, reserve use), and the Annual Report page gives the plan-vs-actual story in brief.',
        status: 'met', link: `${base}/`, linkLabel: 'Dashboard',
      },
      {
        code: 'C3', title: 'Statistical / Supplemental Section', mandatory: false,
        requires: 'Statistical and supplemental data about the organization, its community, and population.',
        howWeAddress: 'Deep fiscal statistics exist (20-year General Fund history, payroll statistics, per-fund histories), but community context — population, tax base, demographics — is not yet presented.',
        status: 'partial', link: `${base}/general-fund/`, linkLabel: 'General Fund history',
        gapNote: 'Add community/tax-base statistics (population, assessed valuation, largest taxpayers).',
      },
      {
        code: 'C4', title: 'Glossary', mandatory: false,
        requires: 'A glossary defining terminology a lay reader would not know.',
        howWeAddress: 'A full plain-English glossary on the Start Here page, plus tappable definitions on jargon terms and "what do these columns mean?" guides on data tables.',
        status: 'met', link: `${base}/guide/#glossary`, linkLabel: 'Glossary',
      },
      {
        code: 'C5', title: 'Charts and Graphs', mandatory: false,
        requires: 'Charts and graphs highlighting financial information, with narrative interpretation where needed.',
        howWeAddress: 'Twenty-year trend charts, per-line sparklines, category bars, and vote visualizations — each paired with a written explanation of what it shows.',
        status: 'met', link: `${base}/compare/`, linkLabel: 'Budget Compare',
      },
      {
        code: 'C6', title: 'Understandability and Usability', mandatory: false,
        requires: 'Formatting oriented to the average reader: attractive, consistent, understandable.',
        howWeAddress: 'Every tool opens with an "In plain English" intro; consistent design across all pages; per-page titles; mobile-friendly layout; the entire site is written for readers with no finance background.',
        status: 'met', link: `${base}/guide/`, linkLabel: 'Start Here guide',
      },
    ],
  },
  {
    key: 'policy',
    name: 'As a Policy Document',
    plain: 'Does it explain what the government is trying to achieve and the rules it follows?',
    criteria: [
      {
        code: 'P1', title: 'Strategic Goals and Strategies', mandatory: true,
        requires: 'A coherent statement of organization-wide strategic goals addressing long-term concerns.',
        howWeAddress: 'The Town has not published machine-readable strategic goals; nothing to extract yet.',
        status: 'gap',
        gapNote: 'Extract and present strategic goals if the Town publishes them in a budget message or plan.',
      },
      {
        code: 'P2', title: 'Priorities and Issues', mandatory: true,
        requires: 'A budget message articulating priorities, issues, and significant changes for the year.',
        howWeAddress: 'Resident Insights on the dashboard and the Annual Report narrative explain what changed and why it matters — an independent stand-in for a transmittal letter, not the Town’s own message.',
        status: 'partial', link: `${base}/annual-report/`, linkLabel: '2025 Annual Report',
        gapNote: 'Extract the Supervisor’s budget message from the adopted budget when one is included.',
      },
      {
        code: 'P3', title: 'Financial Policies', mandatory: true,
        requires: 'Entity-wide long-term financial policies, including the definition of a balanced budget.',
        howWeAddress: 'Reserve-use and fund-balance context is explained where it appears, but the Town’s formal financial policies are not yet extracted and presented.',
        status: 'partial',
        gapNote: 'Extract the Town’s fund-balance and reserve policies into a dedicated policies section.',
      },
      {
        code: 'P4', title: 'Budget Process', mandatory: true,
        requires: 'A description of how the budget is prepared, reviewed, adopted, and amended.',
        howWeAddress: 'The Start Here guide explains the tentative → preliminary → adopted process in plain English, and post-adoption amendments are visible as Town Board resolutions in the voting record.',
        status: 'met', link: `${base}/guide/#budget-process`, linkLabel: 'How the budget gets made',
      },
    ],
  },
  {
    key: 'financial',
    name: 'As a Financial Plan',
    plain: 'Does it show all the money — where it comes from, where it goes, and what remains?',
    criteria: [
      {
        code: 'F1', title: 'Fund Descriptions and Fund Structure', mandatory: false,
        requires: 'Describe all appropriated funds and the fund structure.',
        howWeAddress: 'All 19 operating funds are described in plain English with their codes, purposes, and financing mix.',
        status: 'met', link: `${base}/funds/`, linkLabel: 'Funds Explorer',
      },
      {
        code: 'F2', title: 'Basis of Budgeting', mandatory: false,
        requires: 'Explain the basis of budgeting (cash, modified accrual, or other) for all funds.',
        howWeAddress: 'The Town’s budget documents do not state a basis of budgeting for us to extract; we do not assert one.',
        status: 'gap',
        gapNote: 'Present the basis of budgeting if stated in future Town documents.',
      },
      {
        code: 'F3', title: 'Consolidated Financial Schedule', mandatory: true,
        requires: 'A consolidated summary of revenues, expenditures, and other sources/uses.',
        howWeAddress: 'Town-wide totals with a category rollup of every account line, plus each fund’s revenues by source — reconciled to the dollar against the official Summary page.',
        status: 'met', link: `${base}/funds/`, linkLabel: 'Funds Explorer',
      },
      {
        code: 'F4', title: 'Three-Year Consolidated and Fund Schedules', mandatory: false,
        requires: 'Revenues and expenditures for prior actual, current, and proposed years, consolidated and by fund.',
        howWeAddress: 'Every budget line carries 2024–2026 adopted figures (and a trend back to 2020); the Annual Report shows three years of actuals (2023–2025) for every fund.',
        status: 'met', link: `${base}/annual-report/`, linkLabel: 'Annual Report',
      },
      {
        code: 'F5', title: 'Fund Balance', mandatory: true,
        requires: 'Projected changes in fund balance for appropriated funds, with definitions.',
        howWeAddress: 'Fund-balance use appears on every fund page; the Annual Report breaks the General Fund’s $33.4M balance into classifications with plain-English definitions; the glossary defines the terms.',
        status: 'met', link: `${base}/annual-report/`, linkLabel: 'Fund balance breakdown',
      },
      {
        code: 'F6', title: 'Revenues', mandatory: true,
        requires: 'Describe major revenue sources, estimate assumptions, and trends.',
        howWeAddress: 'Revenue line items for every fund, actual revenue categories with three-year trends, and 20 years of General Fund revenue history — but the Town’s estimating assumptions are not published for extraction.',
        status: 'partial', link: `${base}/general-fund/`, linkLabel: 'Revenue trends',
        gapNote: 'Present revenue assumptions if the Town publishes them.',
      },
      {
        code: 'F7', title: 'Long-Range Operating Financial Plans', mandatory: false,
        requires: 'Long-range financial plans extending at least two years beyond the budget year.',
        howWeAddress: 'The Town does not publish a long-range operating plan; the Scenario Lab explores assumptions but is not a plan.',
        status: 'gap',
        gapNote: 'Present multi-year projections if the Town adopts a long-range plan.',
      },
      {
        code: 'F8', title: 'Capital Program', mandatory: true,
        requires: 'Budgeted capital expenditures and their impact on operations.',
        howWeAddress: 'Capital-project budget adoptions are trackable in the Town Board voting record, and capital-fund actuals appear in the Annual Report — but there is no consolidated capital schedule yet.',
        status: 'partial', link: `${base}/meetings/`, linkLabel: 'Capital resolutions',
        gapNote: 'Build a consolidated capital-projects view from budget-adoption resolutions and the capital fund.',
      },
      {
        code: 'F9', title: 'Debt', mandatory: true,
        requires: 'Current debt obligations, legal debt limits, and effects on operations.',
        howWeAddress: 'Debt Service Fund appropriations and actual debt-service spending are shown; principal/interest schedules, BAN exposure, and debt limits are not yet extracted.',
        status: 'partial', link: `${base}/funds/V01/`, linkLabel: 'Debt Service Fund',
        gapNote: 'Extract debt schedules and legal-limit calculations from the audit and AFR.',
      },
    ],
  },
  {
    key: 'operations',
    name: 'As an Operations Guide',
    plain: 'Does it show who does the work — departments, people, and what they aim to accomplish?',
    criteria: [
      {
        code: 'O1', title: 'Organization Chart', mandatory: true,
        requires: 'A legible organization chart for the entire entity.',
        howWeAddress: 'Not yet presented; the department structure exists in our data and could be rendered as a chart.',
        status: 'gap',
        gapNote: 'Render an organization view from the fund → department structure.',
      },
      {
        code: 'O2', title: 'Department / Fund Relationship', mandatory: false,
        requires: 'Show the relationship between departments and funds.',
        howWeAddress: 'The Funds Explorer maps exactly this: every fund drills into its departments, and every department shows its fund.',
        status: 'met', link: `${base}/funds/`, linkLabel: 'Fund drilldowns',
      },
      {
        code: 'O3', title: 'Position Summary Schedule', mandatory: true,
        requires: 'Position counts for prior, current, and budgeted years, entity-wide.',
        howWeAddress: 'Authorized positions with salaries for 2025 and 2026 (by department and group) and actual headcounts 2018–2023 exist — but not yet as a single position-count table across years.',
        status: 'partial', link: `${base}/payroll/`, linkLabel: 'Payroll Explorer',
        gapNote: 'Publish a consolidated headcount-by-department table across years.',
      },
      {
        code: 'O4', title: 'Departmental Descriptions', mandatory: true,
        requires: 'Descriptions of each department or program.',
        howWeAddress: 'Departments are clearly presented with their spending detail and categories; narrative descriptions of what each department does are not yet written.',
        status: 'partial', link: `${base}/funds/A01/`, linkLabel: 'Department drilldowns',
        gapNote: 'Add one-line plain-English descriptions per department.',
      },
      {
        code: 'O5', title: 'Departmental Goals and Objectives', mandatory: false,
        requires: 'Department goals linked to the entity’s strategic goals.',
        howWeAddress: 'The Town does not publish departmental goals in its budget documents.',
        status: 'gap',
        gapNote: 'Present departmental goals if the Town publishes them.',
      },
      {
        code: 'O6', title: 'Performance Measures', mandatory: true,
        requires: 'Objective measures of progress for departments and programs.',
        howWeAddress: 'The Town does not publish performance measures; the closest available signals (spending vs. plan, overtime trends) are shown but are not outcome measures.',
        status: 'gap',
        gapNote: 'Present performance data if the Town adopts measures.',
      },
    ],
  },
]

export const gfoaSummary = (() => {
  const all = gfoaCategories.flatMap((c) => c.criteria)
  return {
    total: all.length,
    met: all.filter((c) => c.status === 'met').length,
    partial: all.filter((c) => c.status === 'partial').length,
    gap: all.filter((c) => c.status === 'gap').length,
  }
})()
