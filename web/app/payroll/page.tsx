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
          { label: 'Start with Employees & Pay', text: 'Search a name, title, or department to see what employees were actually paid. Click an employee name to follow that person across years.' },
          { label: 'Actual vs. authorized', text: 'Actual pay is what appeared in the payroll record. Authorized salary is the base pay the Board set; overtime, longevity, and buy-outs can make actual gross pay higher.' },
          { label: 'Analysis layers', text: 'Salaries & Raises, Overtime & Staffing, Separation Pay, and Police Pay Steps answer narrower questions after you understand the underlying payroll record.' },
        ]}
      >
        <strong>Start with the public record.</strong> This page lets you search what Riverhead employees were actually paid, then move into salary, overtime, separation-pay, and police-step analysis. The analytical views are built on the underlying payroll data rather than replacing it.
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
