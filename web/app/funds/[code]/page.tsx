import PageShell from '../../../components/PageShell'
import FundDrilldown from '../../../components/FundDrilldown'
import PlainCallout from '../../../components/PlainCallout'
import { allFundCodes, getFundDetail } from '../../../lib/subaccounts'
import { allOperatingFunds2026 } from '../../../lib/all-funds'
import { afrGroupForBudgetFund } from '../../../lib/afr'
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
  const base = '/rike4545-riverhead-budget-live'

  if (!fund) {
    return (
      <PageShell title="Fund not found" subtitle="No account-level detail is available for this fund code.">
        <a href={`${base}/funds/`} style={{ color: '#1f5f8f', fontWeight: 800 }}>← Back to Funds Explorer</a>
      </PageShell>
    )
  }

  return (
    <PageShell
      title={`${fund.name} (${fund.code})`}
      subtitle={meta?.description ?? `Account-level appropriations and revenues for the ${fund.name}.`}
    >
      <a href={`${base}/funds/`} style={{ color: '#1f5f8f', fontWeight: 800, display: 'inline-block', marginBottom: 14 }}>
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
      <FundContextNote code={fund.code} />
      <FundDrilldown fund={fund} />
    </PageShell>
  )
}

// What ACTUALLY happened in 2025 for this fund's AFR group — the reality check
// next to the budget plan below it.
function ActualsStrip({ code }: { code: string }) {
  const group = afrGroupForBudgetFund(code)
  if (!group) return null
  const { fund, shared } = group
  const rev = fund.revenues?.['2025']
  const exp = fund.expenditures?.['2025']
  const surplus = fund.surplus?.['2025']
  const fb = fund.fundBalance?.['2025']
  if (rev == null && exp == null) return null

  return (
    <section style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderLeft: '6px solid #15803d', borderRadius: 14, padding: '14px 18px', marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'baseline' }}>
        <strong style={{ color: '#14532d', fontSize: 15 }}>
          What actually happened in 2025 {shared ? `(${fund.name} group)` : ''}
        </strong>
        <a href="/rike4545-riverhead-budget-live/annual-report/" style={{ color: '#15803d', fontWeight: 800, fontSize: 13.5, textDecoration: 'none' }}>
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
        <p style={{ color: '#166534', fontSize: 12.5, margin: '8px 0 0', lineHeight: 1.4 }}>
          The Annual Financial Report reports actuals for the combined {fund.name} group, which includes this fund and
          its sibling funds — so these figures cover the whole group, not this budget fund alone.
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
    <section style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderLeft: '6px solid #c2410c', borderRadius: 14, padding: '14px 18px', marginBottom: 16 }}>
      <strong style={{ color: '#9a3412', fontSize: 15 }}>Why this fund is under pressure</strong>
      <p style={{ color: '#7c2d12', fontSize: 13.8, lineHeight: 1.55, margin: '8px 0 0' }}>
        The Riverhead Volunteer Ambulance Corps (which runs this district) has grown from about 1,200 calls a year in
        1989 to nearly 6,000 in 2025 — over 300% growth on the same 1988-89 headquarters. It&apos;s building a new
        16,600-square-foot facility, funded through community donations (about $6.4 million raised toward a roughly
        $9 million estimate) rather than the tax levy above. A billing program expanded to all calls in 2023 is meant
        to generate insurance revenue to cover that debt service without adding to taxes. Staffing is 150 people, 110
        of them volunteers.
      </p>
      <a
        href="https://riverheadlocal.com/2026/01/09/in-role-reversal-riverhead-ambulance-calls-on-community-help-us-grow/"
        target="_blank"
        rel="noopener noreferrer"
        style={{ color: '#c2410c', fontWeight: 800, fontSize: 12.5, display: 'inline-block', marginTop: 8 }}
      >
        RiverheadLOCAL, Jan. 9, 2026 →
      </a>
    </section>
  )
}

function ActualStat({ label, value, strong, negative }: { label: string; value: string; strong?: boolean; negative?: boolean }) {
  return (
    <div style={{ background: 'white', border: '1px solid #d1fae5', borderRadius: 10, padding: '9px 12px' }}>
      <div style={{ color: '#166534', fontSize: 11, textTransform: 'uppercase', fontWeight: 900, letterSpacing: 0.4 }}>{label}</div>
      <strong style={{ fontSize: 16.5, color: negative ? '#b91c1c' : strong ? '#15803d' : '#14532d' }}>{value}</strong>
    </div>
  )
}
