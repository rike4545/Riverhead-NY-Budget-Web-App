// This site measured against the GFOA Distinguished Budget Presentation Award
// criteria as revised for the 2026 program year.
//
// What changed in 2026: mandatory criteria were eliminated in favour of a
// points scale. Nine Content categories carry 150 points between them and five
// Material Type categories carry 50, for 200 possible; more than 100 earns the
// award, and GFOA additionally recognises outstanding presentation within a
// category. An applicant may submit materials against any subset of categories
// — there is no requirement to cover them all. Content criteria are framed as
// questions a member of the public would ask about the budget; Material Type
// criteria are about the tools used to communicate it, their organisation and
// layout, and whether they meet generally accepted accessibility standards.
//
// TWO HONEST LIMITS ON WHAT FOLLOWS.
//
// First, eligibility. The award is granted to governments that submit their own
// budget communications. This site is the work of a resident, not the Town, so
// it cannot apply and these scores are not GFOA scores. The criteria are used
// here as the recognised yardstick for whether budget information has been
// presented well, and the numbers below are a self-assessment — our own reading
// of our own work, which is exactly the reading most likely to be generous.
//
// Second, the per-category point values are GFOA's; the scores against them are
// ours. GFOA publishes what each category is worth, not a rubric for awarding
// partial credit within it, so "12 of 20" means we judged the coverage roughly
// three-fifths of the way to complete. Treat the category verdicts as the
// signal and the arithmetic as a way of weighting them.

// Criteria and point values: GFOA, "Distinguished Budget Presentation Award —
// Revised Criteria (2026)", gfoa.org/budget-award-2026-criteria, and the
// criteria sheet at gfoa-craftcms.files.svdcdn.com (Budget-Award-Criteria-NEW,
// updated 8/1/2025). Both were unreachable from the environment that compiled
// this file; the category list and points below were transcribed from that
// published criteria text rather than fetched.

export const gfoaSource = {
  title: 'GFOA Distinguished Budget Presentation Award — Revised Criteria (2026)',
  url: 'https://www.gfoa.org/budget-award-2026-criteria',
  criteriaSheet: 'https://www.gfoa.org/budget-award-2026',
}

const base = process.env.NEXT_PUBLIC_BASE_PATH || ''

export type GfoaStatus = 'strong' | 'partial' | 'gap'

export type GfoaCategory = {
  kind: 'content' | 'material'
  name: string
  points: number
  /** The question a member of the public is asking, in GFOA's framing. */
  question: string
  howWeAddress: string
  status: GfoaStatus
  selfScore: number
  link?: string
  linkLabel?: string
  gapNote?: string
}

export const gfoaCategories: GfoaCategory[] = [
  // ---------------------------------------------------------------- content
  {
    kind: 'content', name: 'Community Priorities and Organizational Challenges / Opportunities', points: 20,
    question: 'What are the major challenges facing the organization and the community, how does this budget address them, and are results expected to improve within the budget period?',
    howWeAddress:
      'The pressures are documented in detail: the 2027 tax-cap gap, the retirement buyout, five years of cap overrides, the OPEB liability, and the community housing fund the Town declined. Candidate platforms and Board voting records show where the disagreements are.',
    status: 'partial', selfScore: 12,
    link: `${base}/spending-reduction-2027/`, linkLabel: '2027 pressures',
    gapNote:
      'The challenges are well covered; the priorities are not. The Town publishes no strategic goals in a form anyone can extract, so this site cannot report what it has not adopted — and says so rather than substituting its own.',
  },
  {
    kind: 'content', name: 'Value', points: 20,
    question: 'What is the public getting from the government, and how much does the government cost — per person, per household, for specific services?',
    howWeAddress:
      'Cost is answered on every axis GFOA asks for: per resident and per household, town-wide and for each of the seven services, with Census household counts and median income as the denominators. Road spending per maintained mile against the other nine Suffolk towns, the credit rating against peer towns, and reserve levels against peer policy add outside comparison.',
    status: 'strong', selfScore: 15,
    link: `${base}/programs/`, linkLabel: 'Cost per resident and household',
    gapNote:
      'The cost half of the question is fully answered. The other half — what residents actually get, measured in response times, permits, tonnage or participation — is still descriptive rather than measured, because the Town publishes no performance data.',
  },
  {
    kind: 'content', name: 'Long-Term Outlook', points: 20,
    question: 'How do current budget decisions affect the long-term outlook, reserve levels, deferred costs, and future obligations?',
    howWeAddress:
      'A 2027 projection built from signed contract terms, the cap gap it implies, a debt schedule running to 2053, the unfunded OPEB liability, and twenty years of General Fund history behind it all.',
    status: 'strong', selfScore: 15,
    link: `${base}/predict-2027/`, linkLabel: '2027 outlook',
    gapNote: 'No multi-year forecast beyond 2027, and the Town publishes no long-range financial plan to check against.',
  },
  {
    kind: 'content', name: 'Revenue Budget', points: 20,
    question: 'How much revenue is anticipated, how diverse and controllable is it, what is restricted, and how is the burden distributed across the community?',
    howWeAddress:
      'The levy and its growth against the cap, twenty years of revenue history, the CPF transfer tax, a personal tax-bill estimator built on the real assessment ratio, and the tax base the levy is spread across.',
    status: 'strong', selfScore: 17,
    link: `${base}/tax-cap/`, linkLabel: 'Levy and the cap',
  },
  {
    kind: 'content', name: 'Personnel Budget', points: 15,
    question: 'How many staff are budgeted, how did personnel costs change, where did staffing rise or fall, and what is driving the cost?',
    howWeAddress:
      'Actual pay by employee and year, authorized salary schedules, raises, overtime against staffing levels, union step schedules, separation pay, and the retirement incentive — the deepest area on the site.',
    status: 'strong', selfScore: 14,
    link: `${base}/payroll/`, linkLabel: 'Payroll explorer',
  },
  {
    kind: 'content', name: 'Department Budget', points: 15,
    question: 'What services does each department provide, what do they cost, and how is the department held accountable for results?',
    howWeAddress:
      'Every operating fund drills to department and then to individual account line items, reconciled to the Town’s own published summary.',
    status: 'strong', selfScore: 13,
    link: `${base}/funds/`, linkLabel: 'Funds and departments',
    gapNote:
      'Written narrative now exists for each of the seven service functions, and every department is listed under the one it belongs to — but there is still no prose for each of the 176 individual departments, and no accountability-for-results reporting, because the Town publishes none.',
  },
  {
    kind: 'content', name: 'Program Budget', points: 15,
    question: 'What are the major programs and services, what does each cost, what are their service-level goals, and do they generate revenue?',
    howWeAddress:
      'The whole budget regrouped into the seven services New York’s Uniform System of Accounts says the Town performs, with the full cost of each — including the pension and health insurance of the staff who deliver it — the fee revenue it earns back, its cost-recovery rate, and its net cost per resident and per household. The classification is the State’s and the revenue tagging is the Town’s own, so this is a regrouping rather than an invention.',
    status: 'strong', selfScore: 11,
    link: `${base}/programs/`, linkLabel: 'Program budget',
    gapNote:
      'Three of GFOA’s four questions are now answered — the programs, their full cost, and whether they earn revenue. The fourth is not: service-level goals require performance measures the Town does not publish, so no amount of rearranging the budget will produce them.',
  },
  {
    kind: 'content', name: 'Capital Budget', points: 15,
    question: 'How is capital spending defined and prioritized, how is it funded, and what are the major projects?',
    howWeAddress:
      'The financing side is covered well: outstanding bonds and notes, the amortization schedule, debt limit headroom, the credit rating, and a bond-versus-note calculator.',
    status: 'partial', selfScore: 8,
    link: `${base}/capital-debt/`, linkLabel: 'Capital and debt',
    gapNote: 'There is no project-level capital plan here — what is being built, when, and at what cost — because the Town publishes no extractable capital improvement plan.',
  },
  {
    kind: 'content', name: 'Budget Process', points: 10,
    question: 'How is the budget developed, who is involved, how are community priorities considered, and when can the public engage?',
    howWeAddress:
      'The statutory calendar, the tax-cap override mechanics, every Board vote on record with who voted how, fiscal-impact reads on resolutions, and a plain-English guide to the vocabulary. The Board’s own rules of procedure are laid out too — the two public-comment windows, the five-minute limit on resolutions, and the fact that a public hearing carries no time limit at all.',
    status: 'strong', selfScore: 10,
    link: `${base}/meetings/`, linkLabel: 'Board votes',
  },

  // ---------------------------------------------------------- material type
  {
    kind: 'material', name: 'Budget Document', points: 10,
    question: 'Is the budget document findable, organized, clearly messaged, well illustrated, and accessibility-compliant?',
    howWeAddress:
      'Not applicable. The budget document is the Town’s to publish; this site reads it rather than replacing it, and links to the source PDFs.',
    status: 'gap', selfScore: 0,
    link: `${base}/sources/`, linkLabel: 'Source library',
  },
  {
    kind: 'material', name: 'Budget-In-Brief / Newsletter', points: 10,
    question: 'Is it actually brief, free of non-budget material, distributed to residents, and attractively designed?',
    howWeAddress:
      'The guided tour is exactly this — an eleven-stop walkthrough from "what is a budget" to the raw data — backed by a dashboard that leads with plain-English figures and a glossary.',
    status: 'strong', selfScore: 7,
    link: `${base}/explore/`, linkLabel: 'The guided tour',
    gapNote: 'No printable or mailable version, which is what "newsletter" implies for a resident without reliable internet.',
  },
  {
    kind: 'material', name: 'Budget Website or Dashboard', points: 10,
    question: 'Is the budget site easy to reach, interactive with drill-down, accessible on mobile and to disabled users, and updated more than once a year?',
    howWeAddress:
      'This is the whole site: grouped navigation, on-page anchors, a search index across line items and documents, and charts that carry text labels and tooltips rather than relying on colour. Audited for heading order, landmarks, labelled controls and contrast.',
    status: 'strong', selfScore: 9,
    link: `${base}/`, linkLabel: 'Dashboard',
  },
  {
    kind: 'material', name: 'Videos', points: 10,
    question: 'Do videos carry the major budget messages and explain key terms for a general audience?',
    howWeAddress: 'None. Nothing on this site is video, narrated, or captioned.',
    status: 'gap', selfScore: 0,
    gapNote: 'A short walkthrough of the tour would be the cheapest ten points available here, and would reach readers who will not read a page of numbers.',
  },
  {
    kind: 'material', name: 'Others', points: 10,
    question: 'What other tools reach people the main document will not?',
    howWeAddress:
      'Every dataset downloadable as CSV or JSON, a full-text search across budget lines and source documents, a source library of the underlying filings, and a companion iOS app.',
    status: 'partial', selfScore: 6,
    link: `${base}/downloads/`, linkLabel: 'Downloads',
  },
]

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0)
const content = gfoaCategories.filter((c) => c.kind === 'content')
const material = gfoaCategories.filter((c) => c.kind === 'material')

export const gfoaSummary = {
  contentPossible: sum(content.map((c) => c.points)),   // 150
  materialPossible: sum(material.map((c) => c.points)), // 50
  totalPossible: sum(gfoaCategories.map((c) => c.points)), // 200
  contentScore: sum(content.map((c) => c.selfScore)),
  materialScore: sum(material.map((c) => c.selfScore)),
  totalScore: sum(gfoaCategories.map((c) => c.selfScore)),
  /** GFOA's threshold for the award. */
  threshold: 100,
  strong: gfoaCategories.filter((c) => c.status === 'strong').length,
  partial: gfoaCategories.filter((c) => c.status === 'partial').length,
  gap: gfoaCategories.filter((c) => c.status === 'gap').length,
  total: gfoaCategories.length,
}
