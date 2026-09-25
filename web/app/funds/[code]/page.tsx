import PageShell from '../../../components/PageShell'
import FundDrilldown from '../../../components/FundDrilldown'
import PlainCallout from '../../../components/PlainCallout'
import { allFundCodes, getFundDetail } from '../../../lib/subaccounts'
import { allOperatingFunds2026 } from '../../../lib/all-funds'
import { afrGroupForBudgetFund } from '../../../lib/afr'
import { AUDITED_GENERAL_FUND, AUDITED_OPERATIONS, AUDIT_2025, deficitHistory } from '../../../lib/audits'
import { stageDoc } from '../../../lib/budget-stages'
import { dollars } from '../../../lib/financial-data'

export function generateStaticParams() {
  return allFundCodes().map((code) => ({ code }))
}

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const fund = getFundDetail(code)
  if (!fund) return { title: 'Fund not found' }
  return {
    title: `${fund.name} (${fund.code}) — budget drilldown`,
    description: `Every department and account line item in the Town of Riverhead ${fund.name}: 2026 appropriations, revenues, and multi-year trends back to 2020.`,
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
      <a href={`${base}/funds/`} style={{ color: 'var(--rbl-accent)', fontWeight: 800, display: 'inline-block', marginBottom: 14 }}>
        ← Back to Funds Explorer
      </a>
      <PlainCallout
        tips={[
          { label: 'Departments', text: 'group the spending. Click one to expand it and see its individual spending lines.' },
          { label: 'The columns', text: 'show what was budgeted in 2024, 2025, and 2026, the change, and a mini trend line back to 2020.' },
          { label: 'Categories', text: 'Personal Services = salaries, Contractual = vendor/operating costs, Equipment = one-time purchases, Benefits = health/retirement.' },
        ]}
      >
        This is the detailed breakdown of one fund. It shows <strong>exactly what the money inside this fund is budgeted
        for</strong>, from big departments down to individual spending lines.
      </PlainCallout>
      <ActualsStrip code={fund.code} />
      <AuditedDeficitNote code={fund.code} />
      <FundContextNote code={fund.code} />
      <FundDrilldown fund={fund} />
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
    <section style={{ background: 'var(--rbl-success-bg)', border: '1px solid var(--rbl-success-border)', borderLeft: '6px solid var(--rbl-success)', borderRadius: 14, padding: '14px 18px', marginBottom: 16 }}>
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
// its balance; the budgets for both set revenues equal to spending, which keeps
// a deficit from growing but never closes one.
function AuditedDeficitNote({ code }: { code: string }) {
  const c = code.toUpperCase()
  if (c !== 'A04' && c !== 'A06') return null
  const key = c === 'A06' ? 'recreationProgram' : 'pal'
  const latest = deficitHistory[deficitHistory.length - 1]
  const first = deficitHistory[0]
  const budgets = [2024, 2025, 2026, 2027]
    .map((year) => {
      const adopted = stageDoc(year, 'adopted')
      const f = (adopted ?? stageDoc(year, 'tentative'))?.funds[c]
      return f ? { year, stage: adopted ? 'adopted' : 'Tentative', appropriations: f.appropriations, revenues: f.revenues } : null
    })
    .filter((b): b is NonNullable<typeof b> => b != null)
  const allBalanced = budgets.length > 0 && budgets.every((b) => b.revenues === b.appropriations)
  const gf = AUDITED_GENERAL_FUND[latest.year]
  return (
    <section data-audited-deficit style={{ background: 'var(--rbl-warn-bg)', border: '1px solid var(--rbl-warn-border)', borderLeft: '6px solid var(--rbl-warn)', borderRadius: 14, padding: '14px 18px', marginBottom: 16 }}>
      <strong style={{ color: 'var(--rbl-warn-strong)', fontSize: 15 }}>
        In deficit at the end of every audited year: {dollars(latest[key])} at the end of {latest.year}
      </strong>
      <p style={{ color: 'var(--rbl-warn-strong)', fontSize: 13.8, lineHeight: 1.55, margin: '8px 0 0' }}>
        The Town&apos;s auditors report this fund inside the General Fund, and each audit since {first.year} has found
        it in deficit at year-end. Each has also said the deficit would be gone the following year &ldquo;by reducing the
        expenditures and increasing the program revenues.&rdquo; Each year it grew instead.
        {allBalanced ? (
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
          .
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
    <section style={{ background: 'var(--rbl-warn-bg)', border: '1px solid var(--rbl-warn-border)', borderLeft: '6px solid var(--rbl-warn)', borderRadius: 14, padding: '14px 18px', marginBottom: 16 }}>
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
        <a href="https://riverheadlocal.com/2021/11/01/we-cant-sustain-this-riverhead-ambulance-corps-says-it-lacks-funds-needed-to-serve-residents/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--rbl-warn)', fontWeight: 800, fontSize: 12.5 }}>
          RiverheadLOCAL, Nov. 1, 2021 →
        </a>
        <a href="https://riverheadlocal.com/2023/05/01/riverhead-ambulance-will-begin-billing-for-all-transports-in-the-next-60-90-days-to-cover-the-rising-costs-of-emergency-rescue-services/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--rbl-warn)', fontWeight: 800, fontSize: 12.5 }}>
          RiverheadLOCAL, May 1, 2023 →
        </a>
        <a href="https://riverheadlocal.com/2025/01/31/riverhead-ambulance-unveils-plans-for-new-headquarters-building-on-osborn-avenue/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--rbl-warn)', fontWeight: 800, fontSize: 12.5 }}>
          RiverheadLOCAL, Jan. 31, 2025 →
        </a>
        <a href="https://riverheadlocal.com/2026/01/09/in-role-reversal-riverhead-ambulance-calls-on-community-help-us-grow/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--rbl-warn)', fontWeight: 800, fontSize: 12.5 }}>
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
      <div style={{ color: 'var(--rbl-success-strong)', fontSize: 11, textTransform: 'uppercase', fontWeight: 900, letterSpacing: 0.4 }}>{label}</div>
      <strong style={{ fontSize: 16.5, color: negative ? 'var(--rbl-danger)' : strong ? 'var(--rbl-success)' : 'var(--rbl-success-strong)' }}>{value}</strong>
    </div>
  )
}
