import PageShell from '../../../components/PageShell'
import ProposalLineStageNotice from '../../../components/ProposalLineStageNotice'
import FundDrilldown from '../../../components/FundDrilldown'
import PlainCallout from '../../../components/PlainCallout'
import { allFundCodes, getFundDetail } from '../../../lib/subaccounts'
import { allOperatingFunds2026 } from '../../../lib/all-funds'
import { afrGroupForBudgetFund } from '../../../lib/afr'
import { AUDITED_GENERAL_FUND, AUDITED_OPERATIONS, AUDIT_2025, deficitHistory } from '../../../lib/audits'
import { stageDoc } from '../../../lib/budget-stages'
import { dollars } from '../../../lib/financial-data'
import { fundYears, lineSource, PROPOSAL_LABEL, proposedOf, supplementAdoptedYear, supplementLines, supplementPriorAdoptedYear, TENTATIVE_YEAR, withTentative } from '../../../lib/funds-2027'
import { isSetAside } from '../../../lib/savings-rules'
import { SNOW, snowOvertime, highwayPayrollOvertime, type SupplementLine } from '../../../lib/snow-overtime'
import { OT_SOURCE, PAL_UNIFORMS, palUniforms } from '../../../lib/overtime-by-department'
import lineHistory from '../../../public/data/budget-supplement/line-history.json'
import payrollRecords from '../../../public/data/payroll/records.json'

export function generateStaticParams() {
  return allFundCodes().map((code) => ({ code }))
}

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const fund = getFundDetail(code)
  if (!fund) return { title: 'Fund not found' }
  return {
    title: `${fund.name} (${fund.code}) — budget drilldown`,
    description: `Every department and account line item in the Town of Riverhead ${fund.name}: 2026 appropriations and revenues, what the ${TENTATIVE_YEAR} ${PROPOSAL_LABEL} Budget proposes for each line, and trends back to 2020.`,
  }
}

export default async function FundDetailPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const fund = getFundDetail(code)
  const meta = allOperatingFunds2026.find((f) => f.code.toUpperCase() === code.toUpperCase())
  const base = process.env.NEXT_PUBLIC_BASE_PATH || ''

  if (!fund) {
    return (
      <PageShell title="Fund not found" subtitle="No account-level detail is available for this fund code.">
        <a href={`${base}/funds/`} style={{ color: 'var(--rbl-accent)', fontWeight: 800 }}>← Back to Funds Explorer</a>
      </PageShell>
    )
  }

  return (
    <PageShell
      title={`${fund.name} (${fund.code})`}
      subtitle={meta?.description ?? `Account-level appropriations and revenues for the ${fund.name}.`}
    >
      <ProposalLineStageNotice />
      <a href={`${base}/funds/`} style={{ color: 'var(--rbl-accent)', fontWeight: 800, display: 'inline-block', marginBottom: 14 }}>
        ← Back to Funds Explorer
      </a>
      <PlainCallout
        tips={[
          { label: 'Departments', text: 'group the spending. Click one to expand it and see its individual spending lines.' },
          { label: 'The columns', text: lineSource ? `show what was budgeted in 2025 and 2026, what the ${TENTATIVE_YEAR} ${PROPOSAL_LABEL} proposes, the change from 2026, and a trend line back to 2020. The Tentative is the Supervisor’s proposal and the Preliminary adds the Board’s changes; the Board can change either before it adopts a budget by November 20.` : 'show what was budgeted in 2024, 2025, and 2026, the change, and a mini trend line back to 2020.' },
          { label: 'Categories', text: 'Personal Services = salaries, Contractual = vendor/operating costs, Equipment = one-time purchases, Benefits = health/retirement.' },
        ]}
      >
        This is the detailed breakdown of one fund. It shows <strong>exactly what the money inside this fund is budgeted
        for</strong>, from big departments down to individual spending lines.
      </PlainCallout>
      <ActualsStrip code={fund.code} />
      <AuditedDeficitNote code={fund.code} />
      <FundContextNote code={fund.code} />
      <SnowOvertimeNote code={fund.code} />
      <PalUniformsNote code={fund.code} />
      <FundDrilldown fund={withTentative(fund)} proposed={fundYears(fund.code).proposal} lineSource={lineSource} />
    </PageShell>
  )
}

// What ACTUALLY happened in 2025 for this fund's AFR group — the reality check
// next to the budget plan below it. For the General Fund group the figures are
// the independent audit's, with the Town's unaudited report beside them; for
// every other fund they are the Annual Financial Report's.
function ActualsStrip({ code }: { code: string }) {
  const group = afrGroupForBudgetFund(code)
  if (!group) return null
  const { fund, shared } = group
  const audited = fund.code === 'A' ? AUDITED_OPERATIONS[2025] : undefined
  const afr = { rev: fund.revenues?.['2025'], exp: fund.expenditures?.['2025'], surplus: fund.surplus?.['2025'], fb: fund.fundBalance?.['2025'] }
  const rev = audited ? audited.revenues + audited.transfersIn : afr.rev
  const exp = audited ? audited.expenditures + audited.transfersOut : afr.exp
  const surplus = audited ? audited.netChange : afr.surplus
  const fb = audited ? audited.ending : afr.fb
  if (rev == null && exp == null) return null

  return (
    <section style={{ background: 'var(--rbl-success-bg)', border: '1px solid var(--rbl-success-border)', borderColor: 'var(--rbl-success-border)', borderRadius: 14, padding: '14px 18px', marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'baseline' }}>
        <strong style={{ color: 'var(--rbl-success-strong)', fontSize: 15 }}>
          What actually happened in 2025 {shared ? `(${fund.name} group)` : ''}
        </strong>
        <a href={`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/annual-report/`} style={{ color: 'var(--rbl-success)', fontWeight: 800, fontSize: 13.5, textDecoration: 'none' }}>
          Full 2025 Annual Report →
        </a>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 10, marginTop: 10 }}>
        <ActualStat label="Money in" value={rev != null ? dollars(rev) : '—'} />
        <ActualStat label="Money out" value={exp != null ? dollars(exp) : '—'} />
        <ActualStat label={surplus != null && surplus < 0 ? 'Deficit' : 'Surplus'} value={surplus != null ? dollars(Math.abs(surplus)) : '—'} strong={surplus != null} negative={surplus != null && surplus < 0} />
        <ActualStat label="Year-end savings" value={fb != null ? dollars(fb) : 'n/a (net position)'} />
      </div>
      {shared && (
        <p style={{ color: 'var(--rbl-success-strong)', fontSize: 12.5, margin: '8px 0 0', lineHeight: 1.4 }}>
          {audited ? 'The audit and the Annual Financial Report both report' : 'The Annual Financial Report reports'} actuals
          for the combined {fund.name} group, which includes this fund and its sibling funds — so these figures cover the
          whole group, not this budget fund alone.
        </p>
      )}
      {audited && (
        <p style={{ color: 'var(--rbl-success-strong)', fontSize: 12.5, margin: '6px 0 0', lineHeight: 1.4 }}>
          Audited, from the 2025 financial statements the Town Board accepted on {AUDIT_2025.accepted.date}; money in and
          out include transfers between funds. The Town&apos;s own unaudited Annual Financial Report has{' '}
          {dollars(afr.rev ?? 0)} in, {dollars(afr.exp ?? 0)} out, a {dollars(afr.surplus ?? 0)} surplus and{' '}
          {dollars(afr.fb ?? 0)} at year-end.
        </p>
      )}
    </section>
  )
}

// The Recreation Program Fund and the PAL fund end every audited year in
// deficit, and every audit has said the deficit would be gone the next year.
// Both are reported inside the General Fund, so the deficits are netted out of
// its balance. The budgets for both set revenues equal to spending, which by
// itself keeps a deficit from growing but never closes one. A "Fund Balance
// Contribution" line changes that: it is counted as spending but kept in the
// fund's savings, so a budget that carries one plans to shrink the deficit by
// that much. The Budget Supplement prints it for three budgets.
function AuditedDeficitNote({ code }: { code: string }) {
  const c = code.toUpperCase()
  if (c !== 'A04' && c !== 'A06') return null
  const key = c === 'A06' ? 'recreationProgram' : 'pal'
  const latest = deficitHistory[deficitHistory.length - 1]
  const first = deficitHistory[0]
  const budgets = [2024, 2025, 2026, 2027]
    .map((year) => {
      const adopted = stageDoc(year, 'adopted')
      const proposal = stageDoc(year, 'preliminary') ?? stageDoc(year, 'tentative')
      const f = (adopted ?? proposal)?.funds[c]
      return f ? { year, stage: adopted ? 'adopted' : stageDoc(year, 'preliminary') ? 'Preliminary' : 'Tentative', appropriations: f.appropriations, revenues: f.revenues } : null
    })
    .filter((b): b is NonNullable<typeof b> => b != null)
  const allBalanced = budgets.length > 0 && budgets.every((b) => b.revenues === b.appropriations)
  const gf = AUDITED_GENERAL_FUND[latest.year]
  const setAside = supplementLines.find((l) => l.fund === c && isSetAside(l))
  const setAsideBy = setAside
    ? [
        { year: supplementPriorAdoptedYear, label: `${supplementPriorAdoptedYear} budget`, amount: setAside.priorAdopted },
        { year: supplementAdoptedYear, label: `${supplementAdoptedYear} budget`, amount: setAside.adopted },
        { year: TENTATIVE_YEAR, label: `${TENTATIVE_YEAR} ${PROPOSAL_LABEL}`, amount: proposedOf(setAside) },
      ].filter((y): y is { year: number; label: string; amount: number } => y.amount != null)
    : []
  const firstSetAside = setAsideBy.findIndex((y) => y.amount > 0)
  const before = firstSetAside > 0 ? setAsideBy.slice(0, firstSetAside) : []
  const planned = firstSetAside >= 0 ? setAsideBy.slice(firstSetAside) : []
  const pace = planned.length ? planned[planned.length - 1].amount : 0
  return (
    <section data-audited-deficit style={{ background: 'var(--rbl-warn-bg)', border: '1px solid var(--rbl-warn-border)', borderColor: 'var(--rbl-warn-border)', borderRadius: 14, padding: '14px 18px', marginBottom: 16 }}>
      <strong style={{ color: 'var(--rbl-warn-strong)', fontSize: 15 }}>
        In deficit at the end of every audited year: {dollars(latest[key])} at the end of {latest.year}
      </strong>
      <p style={{ color: 'var(--rbl-warn-strong)', fontSize: 13.8, lineHeight: 1.55, margin: '8px 0 0' }}>
        The Town&apos;s auditors report this fund inside the General Fund, and each audit since {first.year} has found
        it in deficit at year-end. Each has also said the deficit would be gone the following year &ldquo;by reducing the
        expenditures and increasing the program revenues.&rdquo; Each year it grew instead.
        {setAside && planned.length > 0 ? (
          <>
            {before.map((y) => ` The ${y.label} set nothing aside to close it.`).join('')}{' '}
            The {planned[0].label} {planned[0].year === TENTATIVE_YEAR ? 'would set' : 'set'} aside {dollars(planned[0].amount)} in a
            line called &ldquo;{setAside.name}&rdquo;, which is counted as spending but kept in the fund&apos;s savings
            {planned.slice(1).map((y) => `, and the ${y.label} ${y.year === TENTATIVE_YEAR ? 'proposes' : 'set aside'} ${dollars(y.amount)}`).join('')}{' '}
            (Budget Supplement{' '}
            {lineSource ? <a href={`${lineSource.url}#page=${setAside.page}`} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit' }}>p. {setAside.page}</a> : `p. ${setAside.page}`}).
            If the rest of the fund came in on budget, the deficit would shrink by about that much a year. At{' '}
            {dollars(pace)} a year, {dollars(latest[key])} would take about {Math.round(latest[key] / pace)} years to close.
          </>
        ) : allBalanced ? (
          <>
            {' '}No budget has planned for it to close: every one since {budgets[0].year} sets this fund&apos;s
            revenues exactly equal to its spending, which at best keeps the deficit from growing. Closing it would take a
            year that brings in {dollars(latest[key])} more than it spends; the{' '}
            {budgets[budgets.length - 1].year} {budgets[budgets.length - 1].stage} does not plan one either.
          </>
        ) : null}{' '}
        Because the fund is reported inside the General Fund, the deficit is already netted out of that fund&apos;s{' '}
        {dollars(gf.total)} balance.
      </p>
      <div style={{ overflowX: 'auto', marginTop: 10 }}>
        <table className="rbl-stack" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.8 }}>
          <thead>
            <tr style={{ textAlign: 'left', color: 'var(--rbl-warn-strong)', borderBottom: '1px solid var(--rbl-warn-border)' }}>
              <th style={rvacTh}>Year-end</th>
              <th style={{ ...rvacTh, textAlign: 'right' }}>Deficit</th>
              <th style={rvacTh}>The audit expected it gone in</th>
              <th style={rvacTh}>Source</th>
            </tr>
          </thead>
          <tbody>
            {deficitHistory.map((d) => (
              <tr key={d.year} style={{ borderBottom: '1px solid var(--rbl-warn-border)' }}>
                <td style={rvacTd}>{d.year}</td>
                <td data-label="Deficit" style={{ ...rvacTd, textAlign: 'right', fontWeight: 700 }}>{dollars(d[key])}</td>
                <td data-label="Expected gone in" style={rvacTd}>{d.expectedGoneBy}</td>
                <td data-label="Source" style={rvacTd}>
                  <a href={d.source.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--rbl-link)' }}>
                    {d.year} audit, {d.year === 2025 ? 'packet ' : ''}p. {d.page}
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {budgets.length > 0 && (
        <p style={{ color: 'var(--rbl-warn-strong)', fontSize: 12.5, margin: '8px 0 0', lineHeight: 1.45 }}>
          Budgeted revenues and spending:{' '}
          {budgets.map((b, i) => (
            <span key={b.year}>
              {i > 0 ? '; ' : ''}
              {b.year} {b.stage} {b.revenues == null ? "n/a" : dollars(b.revenues)} and {dollars(b.appropriations)}
            </span>
          ))}
          .{planned.length > 0 ? ' Spending includes the amounts set aside.' : ''}
        </p>
      )}
    </section>
  )
}

// Fund-specific background context that doesn't show up in the line-item numbers themselves —
// added case by case as sourced reporting explains what's actually driving a fund.
function FundContextNote({ code }: { code: string }) {
  if (code.toUpperCase() !== 'SM1') return null
  return (
    <section style={{ background: 'var(--rbl-warn-bg)', border: '1px solid var(--rbl-warn-border)', borderColor: 'var(--rbl-warn-border)', borderRadius: 14, padding: '14px 18px', marginBottom: 16 }}>
      <strong style={{ color: 'var(--rbl-warn-strong)', fontSize: 15 }}>Why this fund is under pressure</strong>
      <p style={{ color: 'var(--rbl-warn-strong)', fontSize: 13.8, lineHeight: 1.55, margin: '8px 0 0' }}>
        The Riverhead Volunteer Ambulance Corps (RVAC) is a private nonprofit that serves this district under
        contract with the Town — it doesn&apos;t run the district itself. In 2021 RVAC said its roughly $1.2 million
        town contract couldn&apos;t cover adequate staffing and asked for $1.78 million for 2022; the Town offered a
        1% increase. Call volume has kept climbing since — over 4,000/year in 2021, about 5,500 by early 2025, nearly
        6,000 in 2025. Since 2023, RVAC has billed insurance for every transport (not just crash calls) to raise money
        without relying only on the tax levy above. RVAC is now separately raising money — through its own donations
        and billing revenue, not this fund&apos;s tax levy — for a new headquarters: estimated at $6-7 million when
        unveiled in January 2025, cited near $9 million by January 2026 as costs rose, with about $6.4 million raised
        by then.
      </p>

      <p style={{ color: 'var(--rbl-warn-strong)', fontSize: 13.8, lineHeight: 1.55, margin: '10px 0 0' }}>
        RVAC&apos;s own IRS Form 990 filings — separate from this Town fund — show that donation-driven revenue
        growth: total revenue rose from $1.54 million (FY2022) to $2.23 million (FY2024), and net assets more than
        doubled over the same span. But the insurance-billing ramp-up has been slower than the Town projected: the
        2023 district budget projected $2.06 million in medical billing revenue once RVAC billed every transport,
        while RVAC&apos;s own program-service revenue (mostly billing) was only about $255,000 in FY2023 and
        $829,734 in FY2024 — still well short of that projection two years in.
      </p>
      <div style={{ overflowX: 'auto', marginTop: 10 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
          <thead>
            <tr style={{ textAlign: 'left', color: 'var(--rbl-warn-strong)', borderBottom: '1px solid var(--rbl-warn-border)' }}>
              <th style={rvacTh}></th>
              <th style={{ ...rvacTh, textAlign: 'right' }}>FY2022</th>
              <th style={{ ...rvacTh, textAlign: 'right' }}>FY2023</th>
              <th style={{ ...rvacTh, textAlign: 'right' }}>FY2024</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid var(--rbl-warn-border)' }}>
              <td style={{ ...rvacTd, fontWeight: 700 }}>Total revenue</td>
              <td style={{ ...rvacTd, textAlign: 'right' }}>$1,540,107</td>
              <td style={{ ...rvacTd, textAlign: 'right' }}>$1,627,206</td>
              <td style={{ ...rvacTd, textAlign: 'right', fontWeight: 700 }}>$2,229,291</td>
            </tr>
            <tr style={{ borderBottom: '1px solid var(--rbl-warn-border)' }}>
              <td style={rvacTd}>Total expenses</td>
              <td style={{ ...rvacTd, textAlign: 'right' }}>$1,463,302</td>
              <td style={{ ...rvacTd, textAlign: 'right' }}>$1,562,248</td>
              <td style={{ ...rvacTd, textAlign: 'right' }}>$1,719,329</td>
            </tr>
            <tr>
              <td style={rvacTd}>Net assets (year-end)</td>
              <td style={{ ...rvacTd, textAlign: 'right' }}>$1,679,395</td>
              <td style={{ ...rvacTd, textAlign: 'right' }}>$1,758,353</td>
              <td style={{ ...rvacTd, textAlign: 'right' }}>$2,221,380</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 14px', marginTop: 10 }}>
        <a href="https://riverheadlocal.com/2021/11/01/we-cant-sustain-this-riverhead-ambulance-corps-says-it-lacks-funds-needed-to-serve-residents/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--rbl-warn)', fontWeight: 800, fontSize: 12.5, display: 'inline-block', padding: '3px 0' }}>
          RiverheadLOCAL, Nov. 1, 2021 →
        </a>
        <a href="https://riverheadlocal.com/2023/05/01/riverhead-ambulance-will-begin-billing-for-all-transports-in-the-next-60-90-days-to-cover-the-rising-costs-of-emergency-rescue-services/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--rbl-warn)', fontWeight: 800, fontSize: 12.5, display: 'inline-block', padding: '3px 0' }}>
          RiverheadLOCAL, May 1, 2023 →
        </a>
        <a href="https://riverheadlocal.com/2025/01/31/riverhead-ambulance-unveils-plans-for-new-headquarters-building-on-osborn-avenue/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--rbl-warn)', fontWeight: 800, fontSize: 12.5, display: 'inline-block', padding: '3px 0' }}>
          RiverheadLOCAL, Jan. 31, 2025 →
        </a>
        <a href="https://riverheadlocal.com/2026/01/09/in-role-reversal-riverhead-ambulance-calls-on-community-help-us-grow/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--rbl-warn)', fontWeight: 800, fontSize: 12.5, display: 'inline-block', padding: '3px 0' }}>
          RiverheadLOCAL, Jan. 9, 2026 →
        </a>
        <a href="https://projects.propublica.org/nonprofits/organizations/113396823" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--rbl-warn)', fontWeight: 800, fontSize: 12.5 }}>
          ProPublica Nonprofit Explorer, RVAC Form 990s →
        </a>
      </div>
    </section>
  )
}

const rvacTh = { padding: '5px 8px' } as const
const rvacTd = { padding: '5px 8px', color: 'var(--rbl-warn-strong)' } as const

function ActualStat({ label, value, strong, negative }: { label: string; value: string; strong?: boolean; negative?: boolean }) {
  return (
    <div style={{ background: 'var(--rbl-surface)', border: '1px solid #d1fae5', borderRadius: 10, padding: '9px 12px' }}>
      <div style={{ color: 'var(--rbl-success-strong)', fontSize: 13, fontWeight: 700 }}>{label}</div>
      <strong style={{ fontSize: 16.5, color: negative ? 'var(--rbl-danger)' : strong ? 'var(--rbl-success)' : 'var(--rbl-success-strong)' }}>{value}</strong>
    </div>
  )
}

// Snow-plowing overtime, on the Highway Fund's page only. lib/snow-overtime.ts
// explains the two overtime lines; scripts/verify-snow-overtime.mjs checks the
// figures against the Supplement and the built page.
function SnowOvertimeNote({ code }: { code: string }) {
  if (code.toUpperCase() !== 'DA1') return null
  const accounts = (lineHistory as unknown as { accounts: SupplementLine[] }).accounts
  const find = (a: string) => accounts.find((l) => l.account === a)
  const snowOt = find(SNOW.snowOt)
  const repairOt = find(SNOW.repairOt)
  const supplies = find(SNOW.snowContractual)
  if (!snowOt || !repairOt || !supplies) return null
  const s = snowOvertime(snowOt, repairOt, supplies)
  const payroll = highwayPayrollOvertime((payrollRecords as unknown as { records: { y: number; d: string; o: number | null }[] }).records)
  const payrollLast = payroll[s.repair.lastActualYear]
  const th = { padding: '6px 8px', textAlign: 'right' as const, fontSize: 13, color: 'var(--rbl-text-muted)' }
  const td = { padding: '6px 8px', textAlign: 'right' as const, whiteSpace: 'nowrap' as const }
  const link = { color: 'var(--rbl-link)', fontWeight: 600 } as const
  const rows = s.snow.rows.filter((r) => r.year >= s.snow.lastActualYear - 6)
  const repairBy = Object.fromEntries(s.repair.rows.map((r) => [r.year, r]))
  const t = SNOW.transfers2026[0]
  const base = process.env.NEXT_PUBLIC_BASE_PATH || ''
  return (
    <section id="snow-overtime" data-snow-overtime aria-labelledby="snow-overtime-heading" style={{ background: 'var(--rbl-surface)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 16, padding: 20, marginBottom: 16, scrollMarginTop: 16 }}>
      <h2 id="snow-overtime-heading" style={{ margin: '0 0 8px', color: 'var(--rbl-title)', fontSize: 21 }}>Snow-plowing overtime</h2>
      <p style={{ margin: '0 0 10px', color: 'var(--rbl-text-body)', fontSize: 15.5, lineHeight: 1.6, maxWidth: '75ch' }}>
        The Highway Fund budgets overtime on two lines. The snow-removal overtime line spent{' '}
        <strong>{dollars(s.snowSpentFiveYears)}</strong> in the five years to {s.snow.lastActualYear} against{' '}
        {dollars(s.snowBudgetedFiveYears)} budgeted, nothing at all in {s.snowUnspentYears.join(' and ')}, and{' '}
        {dollars(s.snow.ytdThisYear ?? 0)} through {SNOW.ytdThrough}, {s.snow.thisYear}. The general repair overtime line, budgeted at{' '}
        {dollars(s.repairLast.adopted)}, spent <strong>{dollars(s.repairLast.actual)}</strong> in {s.repairLast.year} and{' '}
        {dollars(s.repair.ytdThisYear ?? 0)} by {SNOW.ytdThrough}, {s.repair.thisYear}. That pattern suggests plowing overtime is
        charged to the repair line; the budget does not say. The {s.snow.thisYear + 1} Preliminary keeps both lines as they were:{' '}
        {dollars(s.snow.proposed ?? 0)} for snow overtime and {dollars(s.repair.proposed ?? 0)} for repair overtime.
      </p>
      <div data-scroll-region style={{ overflowX: 'auto' }}>
        <table className="rbl-stack" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14.5, maxWidth: 640 }}>
          <caption style={{ textAlign: 'left', fontWeight: 700, color: 'var(--rbl-text-strong)', paddingBottom: 6 }}>Highway overtime: budgeted and spent</caption>
          <thead><tr style={{ borderBottom: '1px solid var(--rbl-border)' }}>
            <th scope="col" style={{ ...th, textAlign: 'left' }}>Year</th>
            <th scope="col" style={th}>Snow OT budget</th>
            <th scope="col" style={th}>Snow OT spent</th>
            <th scope="col" style={th}>Repair OT budget</th>
            <th scope="col" style={th}>Repair OT spent</th>
          </tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.year} data-snow-row={r.year} style={{ borderBottom: '1px solid var(--rbl-border-subtle)' }}>
                <th scope="row" style={{ ...td, textAlign: 'left' }}>{r.year}</th>
                <td data-label="Snow OT budget" style={td}>{dollars(r.adopted)}</td>
                <td data-label="Snow OT spent" style={td}>{dollars(r.actual)}</td>
                <td data-label="Repair OT budget" style={td}>{repairBy[r.year] ? dollars(repairBy[r.year].adopted) : 'n/a'}</td>
                <td data-label="Repair OT spent" style={td}>{repairBy[r.year] ? dollars(repairBy[r.year].actual) : 'n/a'}</td>
              </tr>
            ))}
            <tr style={{ borderBottom: '1px solid var(--rbl-border-subtle)' }}>
              <th scope="row" style={{ ...td, textAlign: 'left' }}>{s.snow.thisYear}, to {SNOW.ytdThrough}</th>
              <td data-label="Snow OT budget" style={td}>{dollars(s.snow.adoptedThisYear ?? 0)}</td>
              <td data-label="Snow OT spent" style={td}>{dollars(s.snow.ytdThisYear ?? 0)}</td>
              <td data-label="Repair OT budget" style={td}>{dollars(s.repair.adoptedThisYear ?? 0)}</td>
              <td data-label="Repair OT spent" style={td}>{dollars(s.repair.ytdThisYear ?? 0)}</td>
            </tr>
            <tr>
              <th scope="row" style={{ ...td, textAlign: 'left' }}>{s.snow.thisYear + 1} Preliminary</th>
              <td data-label="Snow OT budget" style={td}>{dollars(s.snow.proposed ?? 0)}</td>
              <td data-label="Snow OT spent" style={td}>not yet</td>
              <td data-label="Repair OT budget" style={td}>{dollars(s.repair.proposed ?? 0)}</td>
              <td data-label="Repair OT spent" style={td}>not yet</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p style={{ margin: '12px 0 10px', color: 'var(--rbl-text-body)', fontSize: 15.5, lineHeight: 1.6, maxWidth: '75ch' }}>
        <strong>Salt and outside contractors</strong> are a separate snow line. Its {s.supplies.thisYear} budget of{' '}
        {dollars(s.supplies.adoptedThisYear ?? 0)} grew to {dollars(s.suppliesThisYear)} when the Board added {dollars(t.amount)} on{' '}
        {t.date} (Resolution {t.number}, “{t.title}”), and {dollars(s.supplies.ytdThisYear ?? 0)} was spent by {SNOW.ytdThrough}. The{' '}
        {s.supplies.thisYear + 1} Tentative raised it to {dollars(s.supplies.tentative ?? 0)}; the Board’s {SNOW.amendment2027.label} moved{' '}
        {dollars(SNOW.amendment2027.amount)} of that to Highway pay, leaving {dollars(s.supplies.proposed ?? 0)} in the Preliminary (
        <a href={`${base}/budget-amendments-2027/`} style={link}>the amendments</a>).
      </p>
      {payrollLast != null && (
        <p style={{ margin: '0 0 10px', color: 'var(--rbl-text-body)', fontSize: 15.5, lineHeight: 1.6, maxWidth: '75ch' }}>
          The Town’s payroll export shows {dollars(Math.round(payrollLast))} of overtime paid to Highway Department staff in{' '}
          {s.repair.lastActualYear}, less than the {dollars(s.repairLast.actual)} the budget books to repair overtime that year. Payroll
          is sorted by the employee’s department and the budget by account, and overtime worked by staff listed under another
          department would be missed; this site has not reconciled the two.
        </p>
      )}
      <p style={{ margin: '0 0 4px', color: 'var(--rbl-text-strong)', fontWeight: 700 }}>Questions residents may want to ask</p>
      <ul style={{ margin: '0 0 10px', paddingLeft: 20, color: 'var(--rbl-text-body)', fontSize: 15, lineHeight: 1.6, maxWidth: '75ch' }}>
        <li>Is snow-plowing overtime charged to the repair overtime line? If so, the {s.snow.thisYear + 1} budget again puts{' '}
          {dollars(s.snow.proposed ?? 0)} where it has not been spent and {dollars(s.repair.proposed ?? 0)} where it has.</li>
        <li>How much of the {dollars(s.repairLast.actual)} of repair overtime in {s.repairLast.year} was for plowing?</li>
        <li>What would a winter like {s.repairLast.year}’s cost in overtime, salt and contractors under the {s.snow.thisYear + 1} budget?</li>
      </ul>
      <p style={{ margin: 0, color: 'var(--rbl-text-muted)', fontSize: 13.5, lineHeight: 1.55 }}>
        Source: <a href={SNOW.source.url} style={link}>{SNOW.source.title}</a>, {s.repair.page === s.snow.page ? `page ${s.snow.page}` : `pages ${s.repair.page} and ${s.snow.page}`} (lines {SNOW.snowOt}, {SNOW.repairOt} and{' '}
        {SNOW.snowContractual}); spending “to {SNOW.ytdThrough}” is the Supplement’s year-to-date column. Resolution {t.number} and{' '}
        {SNOW.amendment2027.label} (Resolution {SNOW.amendment2027.number}) are from the Town Board’s fiscal impact statements; payroll
        from the Town’s Gross Earnings reports. These are likely questions, not findings.
      </p>
    </section>
  )
}

// The Police Athletic League's uniform line runs well over its budget every
// year, in a fund the audits have found in deficit (lib/overtime-by-department.ts).
function PalUniformsNote({ code }: { code: string }) {
  if (code.toUpperCase() !== 'A04') return null
  const line = (lineHistory as unknown as { accounts: SupplementLine[] }).accounts.find((l) => l.account === PAL_UNIFORMS)
  if (!line) return null
  const u = palUniforms(line)
  const link = { color: 'var(--rbl-link)', fontWeight: 600 } as const
  const td = { padding: '6px 8px', textAlign: 'right' as const, whiteSpace: 'nowrap' as const }
  return (
    <section id="pal-uniforms" data-pal-uniforms aria-labelledby="pal-uniforms-heading" style={{ background: 'var(--rbl-surface)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 16, padding: 20, marginBottom: 16, scrollMarginTop: 16 }}>
      <h2 id="pal-uniforms-heading" style={{ margin: '0 0 8px', color: 'var(--rbl-title)', fontSize: 21 }}>Uniforms</h2>
      <p style={{ margin: '0 0 10px', color: 'var(--rbl-text-body)', fontSize: 15.5, lineHeight: 1.6, maxWidth: '75ch' }}>
        The league’s uniform line spent more than its budget in <strong>{u.yearsOver} of the last {u.rows.length} years</strong>. By{' '}
        {OT_SOURCE.ytdThrough}, {u.thisYear} it had spent {dollars(u.ytdNow)} of {dollars(u.budgetNow)}, and the {u.thisYear + 1} Preliminary keeps{' '}
        {dollars(u.proposed)}. The Town describes this fund as separating the donations that support the league, and the audits have found it in deficit, so a line that
        regularly runs over its budget is part of that question.
      </p>
      <div data-scroll-region style={{ overflowX: 'auto' }}>
        <table className="rbl-stack" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14.5, maxWidth: 420 }}>
          <caption style={{ textAlign: 'left', fontWeight: 700, color: 'var(--rbl-text-strong)', paddingBottom: 6 }}>PAL uniforms: budgeted and spent</caption>
          <thead><tr style={{ borderBottom: '1px solid var(--rbl-border)' }}>
            <th scope="col" style={{ ...td, textAlign: 'left', fontSize: 13, color: 'var(--rbl-text-muted)' }}>Year</th>
            <th scope="col" style={{ ...td, fontSize: 13, color: 'var(--rbl-text-muted)' }}>Budget</th>
            <th scope="col" style={{ ...td, fontSize: 13, color: 'var(--rbl-text-muted)' }}>Spent</th>
          </tr></thead>
          <tbody>
            {u.rows.map((r) => (
              <tr key={r.year} data-pal-row={r.year} style={{ borderBottom: '1px solid var(--rbl-border-subtle)' }}>
                <th scope="row" style={{ ...td, textAlign: 'left' }}>{r.year}</th>
                <td data-label="Budget" style={td}>{dollars(r.budget)}</td>
                <td data-label="Spent" style={{ ...td, fontWeight: r.spent > r.budget ? 700 : 400 }}>{dollars(r.spent)}</td>
              </tr>
            ))}
            <tr style={{ borderBottom: '1px solid var(--rbl-border-subtle)' }}>
              <th scope="row" style={{ ...td, textAlign: 'left' }}>{u.thisYear}, to {OT_SOURCE.ytdThrough}</th>
              <td data-label="Budget" style={td}>{dollars(u.budgetNow)}</td>
              <td data-label="Spent" style={td}>{dollars(u.ytdNow)}</td>
            </tr>
            <tr>
              <th scope="row" style={{ ...td, textAlign: 'left' }}>{u.thisYear + 1} Preliminary</th>
              <td data-label="Budget" style={td}>{dollars(u.proposed)}</td>
              <td data-label="Spent" style={td}>not yet</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p style={{ margin: '10px 0 0', color: 'var(--rbl-text-muted)', fontSize: 13.5, lineHeight: 1.55 }}>
        Source: <a href={OT_SOURCE.url} style={link}>{OT_SOURCE.title}</a>, page {u.page}, line {PAL_UNIFORMS}, with the Supplements before it.
        Whether donations given for uniforms covered the difference is not in the budget; ask the Town.
      </p>
    </section>
  )
}
