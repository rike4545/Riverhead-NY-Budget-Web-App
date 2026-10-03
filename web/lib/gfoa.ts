// This site measured against GFOA's Distinguished Budget Presentation Award
// criteria: the revised set, which takes effect on January 1, 2027.
//
// WHICH CRITERIA APPLY WHEN. Checked against gfoa.org on 2026-10-03.
//
// - GFOA's "Distinguished Budget Presentation Award - Program Changes
//   (Effective 1/1/2027)" page (gfoa.org/budget-award-2026) calls the revised
//   criteria "available as an optional evaluation pathway for 2027 submissions
//   and required for all submissions beginning in 2028". Its FAQ: "Between
//   January 1, 2027 and December 31, 2027, governments may submit to either the
//   existing criteria or the new criteria. Starting January 1, 2028, all
//   governments must submit using the new criteria." The "(2026)" in the
//   criteria page's browser title, "Revised Criteria (2026)", names the
//   revision. It is not the year the criteria apply.
// - The existing criteria are the "Explanation of Criteria" PDF that the award
//   page (gfoa.org/budget-award) still links. It is headed "Budgets with a
//   Fiscal Year Beginning 1/1/25 or later" and marks 15 of its 25 criteria
//   "Mandatory". Under the existing rules a budget must reach GFOA "within 90
//   days of the date when the budget was approved/adopted"
//   (gfoa.org/budget-award-eligibility).
// - The Town's budget year is the calendar year. The Board adopted the 2026
//   budget on November 18, 2025 (RECORD in lib/budget-adoption.ts), so a 2026
//   submission was due long before January 1, 2027 and would have been judged
//   against the existing criteria. The 2027 budget could be judged against
//   either set, depending on when it is submitted: the existing set only within
//   90 days of its adoption, the revised set (from January 1, 2027) "prior to
//   the end of the fiscal period for which the budget applies". From 2028, only
//   the revised set applies.
// - Before January 2027, GFOA also takes "beta test" applications under the
//   revised criteria (gfoa.org/eligibility-2026). /gfoa/ does not mention them.
//
// WHAT THE REVISED CRITERIA CHANGE. The first change GFOA lists is "Eliminate
// mandatory criteria". Nine Content categories carry 150 points and five
// Material Type categories carry 50, for 200 possible. Applicants "who
// accumulate more than 100 total points" earn the award, and "Submission
// materials are not required for every category." GFOA "will also recognize
// applicants for outstanding presentation within each category and for
// governments achieving high overall scores." The program widens to "all
// budget communications including the budget document, websites, dashboards,
// multimedia, and other forms of communications".
//
// HOW GFOA SCORES (gfoa.org/eval-process-2026). Completeness is scored 0 to 2
// and quality 0 to 3, so "each category will be assigned a score between 0 and
// 5", and "The score will be divided by 5 and then multiplied by the total
// points possible for the category to calculate the total points earned." The
// draft application form linked from gfoa.org/eligibility-2026
// (Budget-Award-Revised-Criteria-Form, dated October 1, 2026) gives the 0 to 5
// "per question" instead.
//
// TWO HONEST LIMITS ON WHAT FOLLOWS.
//
// First, eligibility. The award is granted to governments that submit their own
// budget communications. This site is the work of a resident, not the Town, so
// it cannot apply and these scores are not GFOA scores. The criteria are used
// here as the recognized yardstick for whether budget information has been
// presented well, and the numbers below are a self-assessment — our own reading
// of our own work, which is exactly the reading most likely to be generous.
//
// Second, the per-category point values are GFOA's; the scores against them are
// ours. They were set by judgment before GFOA's scoring page was checked, and
// most are not a whole-number score out of 5 on GFOA's scale (gfoaSummary
// .offScale counts them). Whether to re-score on that scale is the owner's call
// (docs/agent-backlog.md). Treat the category verdicts as the signal and the
// arithmetic as a way of weighting them.
//
// SOURCES. Every category name, point value and primary question below is
// GFOA's, word for word from the criteria page (gfoa.org/budget-award-2026-
// criteria) as it read on 2026-10-03. The text of that page and of every other
// page cited here is saved in etl/data/policies/gfoa-budget-award.json, and
// scripts/verify-gfoa-criteria.mjs fails the build if a name, a point value, a
// question or a quote here is not in it. GFOA revises its pages: fetch them
// again before changing any of this, and save the new text with it.
//
// GFOA's own wording differs in places. Its criteria page lists the same four
// questions for Department Budget as for Program / Services Budget. Its draft
// application form words most questions at more length, asks Department
// Budget's of each department ("What services does each department
// provide?"), and names three categories differently ("Budget-in-Brief /
// Newsletter", "Budget Website / Dashboard", "Other / Media Campaign (social
// media, etc.)"). This file follows the criteria page.

export type GfoaSourceKey = 'criteria' | 'changes' | 'scoring' | 'eligibility' | 'award' | 'existing' | 'existingEligibility'

/** A GFOA page this site cites, and its saved text in etl/data/policies/gfoa-budget-award.json. */
export type GfoaSource = { title: string; url: string; excerpt: string }

export const GFOA_SOURCES: Record<GfoaSourceKey, GfoaSource> = {
  criteria: {
    title: 'Distinguished Budget Presentation Award - Revised Criteria (2026)',
    url: 'https://www.gfoa.org/budget-award-2026-criteria',
    excerpt: 'budget-award-2026-criteria',
  },
  changes: {
    title: 'Distinguished Budget Presentation Award - Program Changes (Effective 1/1/2027)',
    url: 'https://www.gfoa.org/budget-award-2026',
    excerpt: 'budget-award-2026',
  },
  scoring: {
    title: 'Budget Award: Review and Scoring Process',
    url: 'https://www.gfoa.org/eval-process-2026',
    excerpt: 'eval-process-2026',
  },
  eligibility: {
    title: 'Eligibility and Application Submission',
    url: 'https://www.gfoa.org/eligibility-2026',
    excerpt: 'eligibility-2026',
  },
  award: {
    title: 'Distinguished Budget Presentation Award Program',
    url: 'https://www.gfoa.org/budget-award',
    excerpt: 'budget-award',
  },
  existing: {
    title: 'Explanation of Criteria: Budgets with a Fiscal Year Beginning 1/1/25 or later',
    url: 'https://gfoa-craftcms.files.svdcdn.com/production/prismic/ZttcJBoQrfVKlzlA_Budget-Criteria-Explanation.pdf?dm=1758139221',
    excerpt: 'budget-criteria-explanation',
  },
  existingEligibility: {
    title: 'Budget Award Eligibility',
    url: 'https://www.gfoa.org/budget-award-eligibility',
    excerpt: 'budget-award-eligibility',
  },
}

/** The day the revised criteria were checked against gfoa.org. */
export const GFOA_CHECKED = '2026-10-03'

/** When the revised criteria apply, in GFOA's dates (GFOA_QUOTES.eitherSet). */
export const REVISED_CRITERIA = {
  /** From this day a government may choose either set. */
  optionalFrom: '2027-01-01',
  /** From this day every submission uses the revised set. */
  requiredFrom: '2028-01-01',
}

/** The criteria a budget submitted before 2027 was judged against, counted in GFOA's PDF. */
export const EXISTING_CRITERIA = {
  criteria: 25,
  mandatory: 15,
  /** Days after adoption a budget had to reach GFOA (GFOA_QUOTES.within90). */
  windowDays: 90,
}

/** A phrase quoted from one of GFOA_SOURCES. The verify script checks it is in that page's saved text. */
export type GfoaQuote = { source: GfoaSourceKey; text: string }
const quote = (source: GfoaSourceKey, text: string): GfoaQuote => ({ source, text })

/** Every GFOA award phrase the site quotes, in one place so each is checked once. */
export const GFOA_QUOTES = {
  eitherSet: quote('changes', 'Between January 1, 2027 and December 31, 2027, governments may submit to either the existing criteria or the new criteria. Starting January 1, 2028, all governments must submit using the new criteria.'),
  noMandatory: quote('changes', 'Eliminate mandatory criteria'),
  scope: quote('changes', 'all budget communications including the budget document, websites, dashboards, multimedia, and other forms of communications'),
  whoMayApply: quote('eligibility', 'that prepare and adopt a budget'),
  threshold: quote('criteria', 'applicants who accumulate more than 100 total points will be recognized'),
  notEveryCategory: quote('criteria', 'Submission materials are not required for every category.'),
  contentQuestions: quote('criteria', 'questions that a public stakeholder would have about the budget'),
  materialFocus: quote('criteria', 'organization, layout, and ability to meet generally accepted accessibility standards'),
  categoryScore: quote('scoring', 'each category will be assigned a score between 0 and 5'),
  scaled: quote('scoring', 'The score will be divided by 5 and then multiplied by the total points possible for the category to calculate the total points earned.'),
  existingHeading: quote('existing', 'Budgets with a Fiscal Year Beginning 1/1/25 or later'),
  within90: quote('existingEligibility', 'within 90 days of the date when the budget was approved/adopted'),
  /** Quoted on /programs/ (lib/programs.ts). */
  programGoals: quote('criteria', 'What are the goals?'),
}

const base = process.env.NEXT_PUBLIC_BASE_PATH || ''

export type GfoaStatus = 'strong' | 'partial' | 'gap'

export type GfoaCategory = {
  kind: 'content' | 'material'
  /** GFOA's name for the category, as its criteria page prints it. */
  name: string
  points: number
  /** GFOA's primary questions for the category, word for word and in order. */
  questions: string[]
  /** A note on GFOA's own wording, where a reader needs one. */
  questionNote?: string
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
    questions: [
      'What are the major challenges facing the organization and/or the community?',
      'How does this budget address those challenges?',
      'Are results expected to improve within the budget period?',
    ],
    howWeAddress:
      'The pressures are documented in detail: the 2027 tax-cap gap, the retirement buyout, five years of cap overrides, the OPEB liability, and the community housing fund the Town declined. Candidate platforms and Board voting records show where the disagreements are.',
    status: 'partial', selfScore: 12,
    link: `${base}/spending-reduction-2027/`, linkLabel: '2027 pressures',
    gapNote:
      'The challenges are well covered; the priorities are not. The Town publishes no strategic goals in a form anyone can extract, so this site cannot report what it has not adopted — and says so rather than substituting its own.',
  },
  {
    kind: 'content', name: 'Value', points: 20,
    questions: [
      'What is the public getting from the government?',
      'How much does the government cost?',
    ],
    howWeAddress:
      'Cost is answered per resident and per household, town-wide and for each of the seven services, with Census household counts and median income as the denominators. Road spending per maintained mile against the other nine Suffolk towns, the credit rating against peer towns, and reserve levels against peer policy add outside comparison.',
    status: 'strong', selfScore: 15,
    link: `${base}/programs/`, linkLabel: 'Cost per resident and household',
    gapNote:
      'The cost half of the question is fully answered. The other half — what residents actually get, measured in response times, permits, tonnage or participation — is still descriptive rather than measured, because the Town publishes no performance data.',
  },
  {
    kind: 'content', name: 'Long-Term Outlook', points: 20,
    questions: [
      'How do current budget decisions impact the long-term fiscal outlook for the government?',
      'How does the current budget impact reserve levels?',
      'Are any expenses deferred to future budgets (operating or capital)?',
      'Does the budget create any long-term spending obligations?',
      'What were trends from prior years and their impact on the future outlook?',
    ],
    howWeAddress:
      'A 2027 projection built from signed contract terms, the cap gap it implies, a debt schedule running to 2053, the unfunded OPEB liability, and twenty years of General Fund history behind it all.',
    status: 'strong', selfScore: 15,
    link: `${base}/predict-2027/`, linkLabel: '2027 outlook',
    gapNote: 'No multi-year forecast beyond 2027, and the Town publishes no long-range financial plan to check against.',
  },
  {
    kind: 'content', name: 'Revenue Budget', points: 20,
    questions: [
      'How much revenue is anticipated?',
      'Where does revenue come from?',
      'How much control or discretion does the government have over revenue?',
      'How is the revenue burden distributed among the community?',
    ],
    howWeAddress:
      'The levy and its growth against the cap, twenty years of revenue history, the CPF transfer tax, a personal tax-bill estimator built on the real assessment ratio, and the tax base the levy is spread across.',
    status: 'strong', selfScore: 17,
    link: `${base}/tax-cap/`, linkLabel: 'Levy and the cap',
  },
  {
    kind: 'content', name: 'Personnel Budget', points: 15,
    questions: [
      'How many total staff are budgeted?',
      'How have personnel costs changed from the prior year?',
      'What are the major drivers impacting personnel costs?',
    ],
    howWeAddress:
      'Actual pay by employee and year, authorized salary schedules, raises, overtime against staffing levels, union step schedules, separation pay, and the retirement incentive — the deepest area on the site.',
    status: 'strong', selfScore: 14,
    link: `${base}/payroll/`, linkLabel: 'Payroll explorer',
  },
  {
    kind: 'content', name: 'Department Budget', points: 15,
    questions: [
      'What are the major programs or services?',
      'What are the costs?',
      'What are the goals?',
      'How much revenue does each generate?',
    ],
    questionNote: 'GFOA’s criteria page lists the same questions here as under Program / Services Budget.',
    howWeAddress:
      'Every operating fund drills to department and then to individual account line items, reconciled to the Town’s own published summary.',
    status: 'strong', selfScore: 13,
    link: `${base}/funds/`, linkLabel: 'Funds and departments',
    gapNote:
      'Written narrative now exists for each of the seven service functions, and every department is listed under the one it belongs to — but there is still no prose for each of the 176 individual departments, and no accountability-for-results reporting, because the Town publishes none.',
  },
  {
    kind: 'content', name: 'Program / Services Budget', points: 15,
    questions: [
      'What are the major programs or services?',
      'What are the costs?',
      'What are the goals?',
      'How much revenue does each generate?',
    ],
    howWeAddress:
      'The whole budget regrouped into the seven services New York’s Uniform System of Accounts says the Town performs, with the full cost of each — including the pension and health insurance of the staff who deliver it — the fee revenue it earns back, its cost-recovery rate, and its net cost per resident and per household. The classification is the State’s and the revenue tagging is the Town’s own, so this is a regrouping rather than an invention.',
    status: 'strong', selfScore: 11,
    link: `${base}/programs/`, linkLabel: 'Program budget',
    gapNote:
      'Three of GFOA’s four questions are now answered — the programs, their full cost, and whether they earn revenue. The fourth is not: service-level goals require performance measures the Town does not publish, so no amount of rearranging the budget will produce them.',
  },
  {
    kind: 'content', name: 'Capital Budget', points: 15,
    questions: [
      'How is capital spending defined?',
      'What is the level of capital spending?',
      'How are projects prioritized?',
      'How is the capital budget funded?',
      'What are the major projects?',
    ],
    howWeAddress:
      'The financing side is covered well: outstanding bonds and notes, the amortization schedule, debt limit headroom, the credit rating, and a bond-versus-note calculator.',
    status: 'partial', selfScore: 8,
    link: `${base}/capital-debt/`, linkLabel: 'Capital and debt',
    gapNote: 'There is no project-level capital plan here — what is being built, when, and at what cost — because the Town publishes no extractable capital improvement plan.',
  },
  {
    kind: 'content', name: 'Budget Process', points: 10,
    questions: [
      'How is the budget developed?',
      'Who is involved?',
      'How are community priorities considered?',
      'When are decisions made?',
      'When can the public participate?',
    ],
    howWeAddress:
      'The statutory calendar, the tax-cap override mechanics, every Board vote on record with who voted how, fiscal-impact reads on resolutions, and a plain-English guide to the vocabulary. The Board’s own rules of procedure are laid out too — the two public-comment windows, the five-minute limit on resolutions, and the fact that a public hearing carries no time limit at all.',
    status: 'strong', selfScore: 10,
    link: `${base}/meetings/`, linkLabel: 'Board votes',
  },

  // ---------------------------------------------------------- material type
  {
    kind: 'material', name: 'Budget Document', points: 10,
    questions: [
      'Is the document well-organized?',
      'Does it communicate key messages?',
      'Does it use graphics effectively?',
    ],
    howWeAddress:
      'Not applicable. The budget document is the Town’s to publish; this site reads it rather than replacing it, and links to the source PDFs.',
    status: 'gap', selfScore: 0,
    link: `${base}/sources/`, linkLabel: 'Source library',
  },
  {
    kind: 'material', name: 'Budget in Brief / Newsletter', points: 10,
    questions: [
      'Does the budget in brief provide a concise overview?',
      'Is it free from unnecessary information?',
      'Was it distributed?',
      'Is it attractive?',
    ],
    howWeAddress:
      'The guided tour is exactly this — an eleven-stop walkthrough from "what is a budget" to the raw data — backed by a dashboard that leads with plain-English figures and a glossary.',
    status: 'strong', selfScore: 7,
    link: `${base}/explore/`, linkLabel: 'The guided tour',
    gapNote: 'No printable or mailable version, which is what "newsletter" implies for a resident without reliable internet.',
  },
  {
    kind: 'material', name: 'Budget Website', points: 10,
    questions: [
      'Is the budget website easy to access?',
      'Is it interactive?',
      'Is it updated?',
    ],
    howWeAddress:
      'This is the whole site: grouped navigation, on-page anchors, a search index across line items and documents, and charts that carry text labels and tooltips rather than relying on colour. Audited for heading order, landmarks, labeled controls and contrast.',
    status: 'strong', selfScore: 9,
    link: `${base}/`, linkLabel: 'Dashboard',
  },
  {
    kind: 'material', name: 'Videos', points: 10,
    questions: [
      'Does the budget video highlight major budget messages?',
      'Does it explain key concepts?',
      'Does it reflect community priorities?',
    ],
    howWeAddress: 'None. Nothing on this site is video, narrated, or captioned.',
    status: 'gap', selfScore: 0,
    gapNote: 'A short walkthrough of the tour would be the cheapest ten points available here, and would reach readers who will not read a page of numbers.',
  },
  {
    kind: 'material', name: 'Others', points: 10,
    questions: [
      'What other tools were used?',
      'How is success measured?',
    ],
    howWeAddress:
      'Every dataset downloadable as CSV or JSON, a full-text search across budget lines and source documents, a source library of the underlying filings, and a companion iOS app.',
    status: 'partial', selfScore: 6,
    link: `${base}/downloads/`, linkLabel: 'Downloads',
  },
]

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0)
const content = gfoaCategories.filter((c) => c.kind === 'content')
const material = gfoaCategories.filter((c) => c.kind === 'material')

/**
 * Could GFOA's scale give this score? GFOA scores a category 0 to 5, divides
 * by 5 and multiplies by the category's points (GFOA_QUOTES.scaled), so its
 * points are always a whole number of fifths of the category's total.
 */
export const onGfoaScale = (c: GfoaCategory) => Number.isInteger((c.selfScore * 5) / c.points)

export const gfoaSummary = {
  contentPossible: sum(content.map((c) => c.points)),   // 150
  materialPossible: sum(material.map((c) => c.points)), // 50
  totalPossible: sum(gfoaCategories.map((c) => c.points)), // 200
  contentScore: sum(content.map((c) => c.selfScore)),
  materialScore: sum(material.map((c) => c.selfScore)),
  totalScore: sum(gfoaCategories.map((c) => c.selfScore)),
  /** GFOA gives the award for more than this many points (GFOA_QUOTES.threshold). */
  threshold: 100,
  strong: gfoaCategories.filter((c) => c.status === 'strong').length,
  partial: gfoaCategories.filter((c) => c.status === 'partial').length,
  gap: gfoaCategories.filter((c) => c.status === 'gap').length,
  total: gfoaCategories.length,
  /** Self-scores that no whole-number score out of 5 on GFOA's scale could give. */
  offScale: gfoaCategories.filter((c) => !onGfoaScale(c)).length,
}
