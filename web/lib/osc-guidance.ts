export type OscGuidanceSource = {
  id: string
  topic: string
  title: string
  kind: 'web' | 'pdf'
  published?: string
  url: string
  authority: string
  summary: string
  usedBy: { label: string; href: string }[]
}

export type RelatedAccountingReference = {
  id: string
  title: string
  url: string
  authority: string
  scope: string
  whyListed: string
}

const base = process.env.NEXT_PUBLIC_BASE_PATH || ''

export const oscGuidanceSources: OscGuidanceSource[] = [
  {
    id: 'property-tax-cap',
    topic: 'Property tax cap',
    title: 'Real Property Tax Cap and Tax Cap Compliance',
    kind: 'web',
    url: 'https://www.osc.ny.gov/local-government/property-tax-cap',
    authority: 'NYS Office of the State Comptroller — Local Government and School Accountability',
    summary:
      'OSC’s primary tax-cap portal: filing access, local-government guidance, inflation and allowable levy growth factors, glossary material, retirement-exclusion guidance, training and compliance information. The cap applies to levy growth; the final allowable levy is determined by the statutory formula rather than a simple flat 2% multiplier.',
    usedBy: [
      { label: 'Tax Cap', href: `${base}/tax-cap/` },
      { label: '2027 Prediction', href: `${base}/predict-2027/` },
    ],
  },
  {
    id: 'budget-process',
    topic: 'Budget preparation',
    title: 'Understanding the Budget Process',
    kind: 'pdf',
    url: 'https://www.osc.ny.gov/files/local-government/publications/pdf/understanding-the-budget-process.pdf',
    authority: 'NYS Office of the State Comptroller — Local Government Management Guide',
    summary:
      'OSC’s budget-management guide explains the annual process and the information a budget officer should consider, including current-year results, prior reports, debt commitments, contracts, economic conditions, aid, collective bargaining agreements, capital plans, legislation, inflation, interest rates and tax/debt limits.',
    usedBy: [
      { label: '2027 Prediction', href: `${base}/predict-2027/` },
      { label: 'Financial Health', href: `${base}/analytics/` },
      { label: 'Budget Overview', href: `${base}/funds/` },
    ],
  },
  {
    id: 'gasb-101',
    topic: 'Workforce liabilities',
    title: 'Accounting and Financial Reporting for Compensated Absences — GASB Statement 101',
    kind: 'pdf',
    url: 'https://www.osc.ny.gov/files/local-government/publications/pdf/gasb101-compensated-absences-accounting-bulletin.pdf',
    authority: 'NYS Office of the State Comptroller — Accounting Bulletin',
    summary:
      'Explains when earned leave must be recognized as a liability, how salary-related payments can enter the measurement, what is excluded from compensated-absence accounting, and how the liability is measured under GASB 101. This is the accounting framework behind the site’s separation-pay and accrued-leave discussion.',
    usedBy: [
      { label: 'Payroll & Separation Pay', href: `${base}/payroll/` },
      { label: 'Capital & Debt', href: `${base}/capital-debt/` },
    ],
  },
  {
    id: 'piggybacking',
    topic: 'Procurement',
    title: '“Piggybacking” on Certain Other Governmental Contracts — Exception to Competitive Bidding',
    kind: 'pdf',
    url: 'https://www.osc.ny.gov/files/local-government/publications/pdf/piggybacking-law.pdf',
    authority: 'NYS Office of the State Comptroller — Legal / Procurement Guidance',
    summary:
      'Explains the General Municipal Law §103 conditions for using certain other governmental contracts. OSC emphasizes public solicitation, a process that protects bid integrity, common specifications and an award consistent with lowest-responsible-bidder or objective best-value principles; a negotiated-only process does not satisfy that standard.',
    usedBy: [
      { label: 'Fiscal Impact', href: `${base}/fiscal-impact/` },
      { label: 'Board Votes', href: `${base}/meetings/` },
    ],
  },
  {
    id: 'ambulance-billing',
    topic: 'Ambulance / EMS',
    title: 'Ambulance and EMS Billing under General Municipal Law §209-b',
    kind: 'pdf',
    published: 'April 2024',
    url: 'https://www.osc.ny.gov/files/local-government/publications/pdf/ambulance-and-ems-billing.pdf',
    authority: 'NYS Office of the State Comptroller — Accounting Bulletin',
    summary:
      'Describes the amended authority for municipalities and fire districts to charge for certain emergency and ambulance services, including collection arrangements, written-contract requirements and restrictions on direct billing of uninsured recipients by fire departments or fire companies.',
    usedBy: [
      { label: 'Ambulance District', href: `${base}/funds/SM1/` },
      { label: 'Board Votes', href: `${base}/meetings/?q=ambulance` },
    ],
  },
  {
    id: 'arm',
    topic: 'Accounting framework',
    title: 'Accounting and Reporting Manual for Counties, Cities, Towns and Villages',
    kind: 'pdf',
    url: 'https://www.osc.ny.gov/files/local-government/publications/pdf/arm.pdf',
    authority: 'NYS Office of the State Comptroller — Accounting and Reporting Manual',
    summary:
      'The core OSC accounting manual for New York local governments. It defines fund and account structures, revenue and expenditure classifications, financial-reporting treatment and fund-balance concepts, including the statutory “reasonable amount” framework for unrestricted fund balance.',
    usedBy: [
      { label: 'Budget Overview', href: `${base}/funds/` },
      { label: 'Annual Report', href: `${base}/annual-report/` },
      { label: 'Reserves & Fund Balance', href: `${base}/reserves/` },
    ],
  },
  {
    id: 'cannabis-revenue',
    topic: 'Revenue accounting',
    title: 'Adult-Use Cannabis Sales — Local Tax Revenue Accounting',
    kind: 'pdf',
    published: 'April 2023',
    url: 'https://www.osc.ny.gov/files/local-government/publications/pdf/adult-use-cannabis-accounting-bulletin.pdf',
    authority: 'NYS Office of the State Comptroller — Accounting Bulletin',
    summary:
      'Explains accounting for the 4% local excise tax on adult-use cannabis sales. OSC states that the county retains 25% of the local-tax proceeds and distributes the remaining 75% to the city, town and/or village where the retail dispensary is located; local governments use revenue account A1116 for these receipts.',
    usedBy: [
      { label: 'Board Votes — Cannabis', href: `${base}/meetings/?q=cannabis` },
      { label: 'Search All Records', href: `${base}/search/` },
    ],
  },
  {
    id: 'gasb-87',
    topic: 'Leases',
    title: 'Accounting and Financial Reporting for Leases — GASB Statement 87',
    kind: 'pdf',
    url: 'https://www.osc.ny.gov/files/local-government/publications/pdf/accounting-and-financial-reporting-for-leases-required-by-gasb-87.pdf',
    authority: 'NYS Office of the State Comptroller — Accounting Bulletin',
    summary:
      'Explains GASB 87 lease accounting, including recognition and measurement of lease liabilities and lease assets, present-value treatment and circumstances requiring remeasurement. It provides the accounting framework for evaluating municipal lease obligations alongside cash payments and debt-like commitments.',
    usedBy: [
      { label: 'Town Square', href: `${base}/town-square/` },
      { label: 'Capital & Debt', href: `${base}/capital-debt/` },
    ],
  },
]

export const relatedAccountingReferences: RelatedAccountingReference[] = [
  {
    id: 'fasb-asc',
    title: 'FASB Accounting Standards Codification (ASC)',
    url: 'https://asc.fasb.org/Home',
    authority: 'Financial Accounting Standards Board',
    scope: 'Authoritative U.S. GAAP recognized by FASB for nongovernmental entities.',
    whyListed:
      'Useful when a Riverhead transaction also involves a private company, nonprofit or other nongovernmental counterparty. It is not the primary accounting authority for the Town of Riverhead itself: state and local governmental financial reporting follows GASB authoritative GAAP, with New York local-government implementation and reporting guidance supplied by OSC.',
  },
]
