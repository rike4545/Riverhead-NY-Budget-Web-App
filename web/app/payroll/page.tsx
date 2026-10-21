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
import { fileNumbers } from '../../lib/file-numbers'
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
      <FileNumbers />
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

// How the payroll file numbers on Town Board resolutions ("employee
// #GFZ000347") run, from the Town's own roster (lib/file-numbers.ts).
function FileNumbers() {
  const f = fileNumbers
  const cell = { padding: '8px 10px', verticalAlign: 'top' } as const
  return (
    <details id="file-numbers" data-file-numbers style={{ background: 'var(--rbl-surface)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 16, padding: 0, margin: '0 0 18px', overflow: 'hidden' }}>
      <summary style={{ cursor: 'pointer', padding: '15px 18px', fontWeight: 800, color: 'var(--rbl-title)', fontSize: 15.5 }}>
        How the payroll file numbers (GFZ numbers) work
      </summary>
      <div style={{ padding: '0 18px 18px', color: 'var(--rbl-text-body)', fontSize: 14, lineHeight: 1.6 }}>
        <p style={{ marginTop: 0 }}>
          The Town Board often names an employee by payroll file number instead of by name: Resolution 2026-888 (October 6, 2026), for example,
          sends “employee #GFZ000152” to a conference. {f.code} is the Town’s payroll company code, and the six digits are the person’s file number. You can
          type one into the search box below, or into site search, in any form: “GFZ {f.example.number}”, “File # {f.example.number}” or
          just “{Number(f.example.number)}”.
        </p>
        <p>
          The Town has not published how it assigns the numbers. Matching each of the {f.rosterPeople} numbers on its roster to
          the hire year in the payroll exports shows four blocks:
        </p>
        <div style={{ overflowX: 'auto' }}>
          <table className="rbl-stack" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
            <thead>
              <tr style={{ textAlign: 'left', color: 'var(--rbl-text-muted)', borderBottom: '2px solid var(--rbl-border-subtle)' }}>
                <th style={cell}>Numbers</th>
                <th style={cell}>Who has them</th>
                <th style={cell}>Hired</th>
                <th style={cell}>Order</th>
              </tr>
            </thead>
            <tbody>
              {f.blocks.map((b) => (
                <tr key={b.from} style={{ borderBottom: '1px solid var(--rbl-border-subtle)' }}>
                  <td style={{ ...cell, fontWeight: 700, color: 'var(--rbl-title)', whiteSpace: 'nowrap' }}><span>{b.from}–{b.to}</span></td>
                  <td data-label="Who has them" style={cell}><span>{b.who} ({b.people.toLocaleString()} people)</span></td>
                  <td data-label="Hired" style={{ ...cell, whiteSpace: 'nowrap' }}><span>{b.hired}</span></td>
                  <td data-label="Order" style={cell}><span>{b.order}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          So the numbering looks like it began around 2016. Everyone then working was numbered by seniority, then former
          employees still drawing pay, and since then each new hire has taken the next number. {f.example.name}, {f.example.number},
          was hired in {f.example.hired}; that year’s hires run from {f.example.yearFrom} to {f.example.yearTo}. A lower number
          means longer service only within a block: 000700 belongs to someone hired in 1973, not to someone senior to 000600.
        </p>
        <p style={{ marginBottom: 0 }}>
          Numbers stay with a person and are not reused: the {f.sharedNumbers} numbers that appear under two names each belong
          to one person whose name changed or was spelled two ways. The roster this site holds stops at {f.highestOnRoster}, people
          hired through {f.highestHireYear}, so anyone hired since then has no file number here. The Board has cited numbers as
          high as GFZ{f.latestCited.number} (Resolution {f.latestCited.resolution}, {f.latestCited.meeting}). The payroll exports
          carry no file number, so this site links each number to a person by name, and the hire years are years, not dates. One
          former employee’s hire year reads 1900 in the exports, an apparent placeholder left out of the ranges above.
        </p>
      </div>
    </details>
  )
}
