// The official Town of Riverhead documents the 2027 budget analysis and the
// Budget Supplement / spending-reduction views are built from. URLs point to the
// Town's DocumentCenter (verified against web/public/data/financial-reports).
export type BuiltFromDoc = {
  year: number
  title: string
  kind: 'budget' | 'supplement' | 'afr'
  url: string
}

export const builtFromDocuments: BuiltFromDoc[] = [
  { year: 2026, title: '2026 Adopted Budget', kind: 'budget', url: 'https://www.townofriverheadny.gov/DocumentCenter/View/2967/2026-Adopted-Budget' },
  { year: 2026, title: '2026 Preliminary Budget', kind: 'budget', url: 'https://www.townofriverheadny.gov/DocumentCenter/View/2835/2026-Preliminary-Budget-PDF' },
  { year: 2026, title: '2026 Tentative Budget', kind: 'budget', url: 'https://www.townofriverheadny.gov/DocumentCenter/View/2779/2026-Tentative-Budget-PDF' },
  { year: 2026, title: '2026 Budget Supplement', kind: 'supplement', url: 'https://www.townofriverheadny.gov/DocumentCenter/View/2780/2026-Budget-Supplement-PDF' },
  { year: 2025, title: '2025 Annual Financial Report', kind: 'afr', url: 'https://www.townofriverheadny.gov/DocumentCenter/View/3513/2025-Annual-Financial-Report' },
  { year: 2025, title: '2025 Adopted Budget', kind: 'budget', url: 'https://www.townofriverheadny.gov/DocumentCenter/View/243/2025-Adopted-Budget-PDF' },
  { year: 2025, title: '2025 Tentative Budget', kind: 'budget', url: 'https://www.townofriverheadny.gov/DocumentCenter/View/242/2025-Tentative-Budget-PDF' },
  { year: 2025, title: '2025 Budget Supplement', kind: 'supplement', url: 'https://www.townofriverheadny.gov/DocumentCenter/View/244/2025-Budget-Supplement-PDF' },
  { year: 2024, title: '2024 Adopted Budget', kind: 'budget', url: 'https://www.townofriverheadny.gov/DocumentCenter/View/245/2024-Adopted-Budget-PDF' },
  { year: 2024, title: '2024 Tentative Budget', kind: 'budget', url: 'https://www.townofriverheadny.gov/DocumentCenter/View/249/2024-Tentative-Budget-PDF' },
]
