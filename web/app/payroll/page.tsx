import PageShell from '../../components/PageShell'
import PayrollTabs from '../../components/PayrollTabs'
import PlainCallout from '../../components/PlainCallout'
import { payrollYears, unionLabels } from '../../lib/payroll'
import {
  rankTrends, flaggedRanks, costComparisons, individualRatioCheck, totalOpportunityMid,
  BENEFIT_LOAD, OT_PREMIUM, latestYear, caveats, sourceNote, finalYearOvertimeCheck,
} from '../../lib/overtime-staffing'
import {
  separationSummary, compensatedAbsences, liabilityOneYearChange, liabilityTwoYearChange,
  whyItMattersNow, caveats as separationCaveats, whatWouldSettleIt,
} from '../../lib/separation-pay'
import { BENEFIT_LOAD_BASIS, explainer as benefitExplainer, source as benefitSource } from '../../lib/benefit-load'

export const metadata = {
  title: 'Payroll Explorer — employee pay, overtime & salaries',
  description:
    'Search actual Town of Riverhead employee pay 2018–2025 (base, overtime, gross), Board-authorized salaries for 2025 and 2026, and every raise between them.',
}

export default function PayrollPage() {
  return (
    <PageShell
      title="Riverhead Payroll Explorer"
      subtitle={`A searchable, SeeThroughNY-style record of actual Town of Riverhead employee earnings ${payrollYears[0]}–${payrollYears[payrollYears.length - 1]} — base pay, overtime, and total gross pay by employee, title, department, and union.`}
    >
      <PlainCallout
        tips={[
          { label: 'Four views', text: 'use the tabs below — "Actual Pay" is what employees were really paid (2018–2025); "Authorized Salary" is the base pay the Board set for 2025; "Raises 2025→2026" shows who got a raise and by how much; "Overtime & Staffing" asks whether a police rank is being staffed by overtime instead of headcount.' },
          { label: 'Base vs. actual', text: 'authorized salary is the base rate; actual gross pay adds overtime, longevity, and buy-outs — so actual often exceeds the authorized base.' },
          { label: 'Search & sort', text: 'search a name or title and click a column heading to sort. In Actual Pay, click a name to follow that person across years.' },
        ]}
      >
        This page shows <strong>what the Town pays its people</strong> — both what employees were actually paid and what
        the Board authorized — similar to the statewide SeeThroughNY payroll database, but focused on Riverhead.
      </PlainCallout>
      <PayrollTabs
        overtime={{
          trends: rankTrends,
          flagged: flaggedRanks,
          comparisons: costComparisons,
          individual: individualRatioCheck,
          totalOpportunityMid,
          benefitLoad: BENEFIT_LOAD,
          benefitBasis: BENEFIT_LOAD_BASIS,
          benefitExplainer: benefitExplainer,
          benefitSource: benefitSource,
          otPremium: OT_PREMIUM,
          latestYear,
          caveats,
          sourceNote,
          unionLabels,
        }}
        separation={{
          summary: separationSummary,
          liability: compensatedAbsences,
          oneYearChange: liabilityOneYearChange,
          twoYearChange: liabilityTwoYearChange,
          whyItMattersNow,
          caveats: separationCaveats,
          whatWouldSettleIt,
          unionLabels,
          overtimeFinalYearRatio: finalYearOvertimeCheck.medianRatio,
        }}
      />
    </PageShell>
  )
}
