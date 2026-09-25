import { adoptedBudget2026Summary, auditedFundBalances2024, dollars, townWideComparison2026 } from './financial-data'
import { generalFundAfr } from './afr'
import { AUDIT_2025, auditedGrowth } from './audits'

const gf2025 = AUDIT_2025.generalFund
const revenueGrowth = auditedGrowth(2025, 'revenues')!.pct.toFixed(1)
const spendingGrowth = auditedGrowth(2025, 'expenditures')!.pct.toFixed(1)

export type IntelligenceInsight = {
  title: string
  status: 'watch' | 'information' | 'positive' | 'risk'
  value: string
  explanation: string
  whyItMatters: string
  source: string
}

export const narrativeInsights: IntelligenceInsight[] = [
  {
    title: 'Town-wide tax levy growth exceeded appropriation growth',
    status: 'watch',
    value: `${townWideComparison2026.taxLevyPercentChange}% levy growth`,
    explanation: `The 2026 town-wide tax levy increased by ${dollars(townWideComparison2026.taxLevyDollarChange)}, while town-wide appropriations increased by ${townWideComparison2026.percentChange}%.`,
    whyItMatters: 'When levy growth is faster than spending growth, residents may feel more pressure even if the budget increase looks moderate. It can signal changing revenue mix, fund balance choices, or taxable base dynamics.',
    source: `${townWideComparison2026.source.title} • ${townWideComparison2026.source.page}`,
  },
  {
    title: 'General Fund is the largest operating driver',
    status: 'information',
    value: dollars(adoptedBudget2026Summary.find((row) => row.fundCode === 'A01')?.appropriations2026 ?? 0),
    explanation: 'The General Fund carries the largest 2026 appropriation total among the extracted operating funds.',
    whyItMatters: 'Changes in the General Fund usually have the widest taxpayer and service impact because it supports core town operations.',
    source: '2026 Adopted Budget • Summary p. 3',
  },
  {
    title: 'Appropriated fund balance is being used in several funds',
    status: 'watch',
    value: dollars(adoptedBudget2026Summary.reduce((sum, row) => sum + row.appropriatedFundBalance2026, 0)),
    explanation: 'The extracted 2026 budget rows include appropriated fund balance as part of the financing plan.',
    whyItMatters: 'Using fund balance can reduce near-term tax pressure, but recurring reliance may weaken reserves if not matched by recurring revenues or one-time needs.',
    source: '2026 Adopted Budget • Summary p. 3',
  },
  {
    title: 'The General Fund ran a real surplus in 2025',
    status: 'positive',
    value: `${dollars(gf2025.netChange)} added`,
    explanation: `The 2025 audit shows the General Fund took in ${dollars(gf2025.revenues)} and spent ${dollars(gf2025.expenditures)}. After ${dollars(gf2025.transfersOut - gf2025.transfersIn)} of net transfers to other funds, its balance grew ${dollars(gf2025.netChange)} to ${dollars(gf2025.ending)}. Revenue grew ${revenueGrowth}% on 2024 and spending ${spendingGrowth}%.`,
    whyItMatters: `A surplus grows the Town’s savings and reduces pressure to raise taxes — but it can also mean revenues were under-forecast. The Town’s own unaudited Annual Financial Report had put the surplus at ${dollars(generalFundAfr.surplus?.['2025'] ?? 0)} and the balance at ${dollars(generalFundAfr.fundBalance?.['2025'] ?? 0)}.`,
    source: `2025 audited financial statements (accepted ${AUDIT_2025.accepted.date}, Resolution ${AUDIT_2025.accepted.resolution})`,
  },
]

export const pressureIndicators = [
  { label: 'Tax levy pressure', status: 'Watch', detail: `${townWideComparison2026.taxLevyPercentChange}% town-wide levy growth in 2026.` },
  { label: 'Reserve dependency', status: 'Watch', detail: `${dollars(adoptedBudget2026Summary.reduce((sum, row) => sum + row.appropriatedFundBalance2026, 0))} appropriated fund balance in extracted rows.` },
  { label: 'Audit clarity', status: 'Info', detail: `The 2025 audit was accepted ${AUDIT_2025.accepted.date} (Resolution ${AUDIT_2025.accepted.resolution}) but is not yet on the Financial Reports page; the site reads it from that meeting’s agenda packet.` },
  { label: 'Retirement incentive exposure', status: 'Unvalidated', detail: 'Savings claim requires payroll, eligibility, incentive, leave payout, and backfill data.' },
]

export const auditAfrClarity = [
  { label: '2026 Adopted Budget', badge: 'ADOPTED', meaning: 'Legally adopted spending plan for the upcoming year.' },
  { label: '2025 Annual Financial Report', badge: 'MANAGEMENT REPORTED', meaning: 'Annual filing with the State Comptroller; useful for actuals across every fund, but unaudited, and it classifies less of the General Fund balance as assigned than the audit does.' },
  { label: '2025 audited financial statements', badge: 'AUDITED', meaning: `Independent audit by ${AUDIT_2025.auditor}, accepted by the Town Board ${AUDIT_2025.accepted.date}; attached to that meeting’s agenda packet, not yet on the Financial Reports page.` },
  { label: '2026 Tentative / Preliminary Budgets', badge: 'TENTATIVE', meaning: 'Draft stages used for comparison, not final adopted authority.' },
]

export const fundBalanceCommentary = auditedFundBalances2024.map((fund) => ({
  fund: fund.fund,
  value: dollars(fund.totalFundBalance),
  comment: `${fund.fund} reported total fund balance of ${dollars(fund.totalFundBalance)} in the 2024 audited statements.`,
  source: `${fund.source.title} • ${fund.source.page}`,
}))
