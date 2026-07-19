import type { ReactNode } from 'react'
import PageShell from '../../components/PageShell'
import { allOperatingFunds2026 } from '../../lib/all-funds'
import community from '../../public/data/community.json'
import payrollSummary from '../../public/data/payroll/summary.json'
import meetingsIndex from '../../public/data/meetings/index.json'
import afr2025 from '../../public/data/afr/2025.json'
import buyout from '../../public/data/buyout-analysis.json'

const base = process.env.NEXT_PUBLIC_BASE_PATH || ''
const usd0 = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
const M = (n: number) => `$${(n / 1e6).toFixed(1)}M`

export const metadata = {
  title: 'Explore the Riverhead Town Budget — a guided tour',
  description:
    'A step-by-step, plain-English walkthrough of the Town of Riverhead budget: what it is, where the money comes from, where it goes, who pays, and who decides — with the real numbers and a link to dig into each one.',
}

// Real figures pulled from the site's own datasets.
const approp = allOperatingFunds2026.reduce((s, f) => s + f.appropriations2026, 0)
const levy = allOperatingFunds2026.reduce((s, f) => s + f.taxLevy2026, 0)
const fundCount = allOperatingFunds2026.length
const pay = payrollSummary.yearSummaries[payrollSummary.yearSummaries.length - 1]
const gf = afr2025.funds.find((f) => f.code === 'A')!
const gfBalance = (gf.fundBalance?.['2025'] as number) ?? 0
const gfSurplus = (gf.surplus?.['2025'] as number) ?? 0
const votes = meetingsIndex.totals

type Stop = {
  n: number; kicker: string; title: string; body: ReactNode
  stats?: { label: string; value: string }[]; href: string; cta: string; accent?: string
}

const stops: Stop[] = [
  {
    n: 1, kicker: 'Start here', title: 'What “the budget” actually is', accent: '#4a7297',
    body: <>Once a year the Town Board writes down what it plans to spend and how it plans to pay for it, and votes it into law. That plan is the budget. For 2026 it comes to <b>{usd0(approp)}</b>, split across {fundCount} separate “funds” — buckets of money that can only be spent on certain things. New to any of this? The plain-language guide explains every term.</>,
    stats: [{ label: '2026 total plan', value: M(approp) }, { label: 'Operating funds', value: String(fundCount) }],
    href: `${base}/guide/`, cta: 'Read the plain-English guide',
  },
  {
    n: 2, kicker: 'The whole pie', title: 'It’s not one budget — it’s many funds', accent: '#4a7297',
    body: <>The General Fund pays for most day-to-day town services, but Highway, the Water District, street-lighting, sewer, and the ambulance district each get their own fund with its own taxes and spending. You can open any fund and drill all the way down to a single line item — reconciled to the dollar against the Town’s own summary.</>,
    stats: [{ label: 'Funds you can open', value: String(fundCount) }],
    href: `${base}/funds/`, cta: 'Open the funds',
  },
  {
    n: 3, kicker: 'Where it comes from', title: 'About half is your property taxes', accent: '#15803d',
    body: <>Of that {M(approp)}, roughly <b>{usd0(levy)}</b> is raised from the property-tax levy; the rest comes from state aid, fees, grants, and reserves. New York caps how much the levy can grow each year (~2%) — but for 2026 the Board voted to override that cap and raise the levy 7.74%. The story of that cap (and the years it was pierced by mistake) is worth knowing.</>,
    stats: [{ label: 'Raised from taxes', value: M(levy) }, { label: '2026 levy increase', value: '7.74%' }],
    href: `${base}/tax-cap/`, cta: 'See the tax-cap story',
  },
  {
    n: 4, kicker: 'Who pays', title: 'A few big properties carry a lot of it', accent: '#15803d',
    body: <>About <b>{community.population.census2020.toLocaleString()}</b> people live here, but the levy is spread across the assessed value of every taxable property — roughly <b>${(community.taxBase.impliedFullValuation / 1e9).toFixed(1)}B</b> of market value. A handful of big commercial ratables (Tanger Outlets, PSEG, Costco) shoulder an outsized share, and 300+ tax grievances a year quietly shift the burden around.</>,
    stats: [{ label: 'Population', value: community.population.census2020.toLocaleString() }, { label: 'Tax base (full value)', value: `$${(community.taxBase.impliedFullValuation / 1e9).toFixed(1)}B` }],
    href: `${base}/community/`, cta: 'See the tax base',
  },
  {
    n: 5, kicker: 'Where it goes', title: 'Mostly people', accent: '#b45309',
    body: <>The single biggest controllable cost in any town is its workforce. In 2025 Riverhead paid <b>{usd0(pay.totalGross)}</b> in gross wages to <b>{pay.headcount.toLocaleString()}</b> employees, including <b>{usd0(pay.totalOvertime)}</b> of overtime. You can look up any employee and now see exactly how their gross pay is built — base, overtime, and the “other” extras like longevity and stipends.</>,
    stats: [{ label: '2025 gross payroll', value: M(pay.totalGross) }, { label: 'Employees', value: pay.headcount.toLocaleString() }],
    href: `${base}/payroll/`, cta: 'Search the payroll',
  },
  {
    n: 6, kicker: 'The cushion', title: 'What the Town has in savings', accent: '#4a7297',
    body: <>A town keeps reserves (“fund balance”) for emergencies and to steady the tax rate. The General Fund ended 2025 with <b>{usd0(gfBalance)}</b> in fund balance and ran a <b>{usd0(gfSurplus)}</b> surplus for the year. How much of that cushion the Town leans on each year is one of the clearest signs of fiscal health.</>,
    stats: [{ label: 'General Fund savings', value: M(gfBalance) }, { label: '2025 surplus', value: M(gfSurplus) }],
    href: `${base}/annual-report/`, cta: 'See what actually happened',
  },
  {
    n: 7, kicker: 'Plan vs. reality', title: 'The budget is a promise — the audit is the receipt', accent: '#4a7297',
    body: <>The budget says what the Town intends to do; the year-end Annual Financial Report, filed with the State Comptroller, shows what actually happened. Comparing the two — where revenue came in high, where a department overspent — is where the real accountability lives.</>,
    href: `${base}/annual-report/`, cta: 'Compare budget vs. actual',
  },
  {
    n: 8, kicker: 'Who decides', title: 'Every dollar is a vote', accent: '#7c3aed',
    body: <>Nothing gets spent without the Town Board voting for it. We’ve logged <b>{votes.votes.toLocaleString()}</b> votes across <b>{votes.meetings}</b> meetings — most pass unanimously, but <b>{votes.contested}</b> were contested. You can see how each member voted, and read a plain-English fiscal-impact read on recent resolutions (including where the Town’s own “no fiscal impact” box was wrong).</>,
    stats: [{ label: 'Votes on record', value: votes.votes.toLocaleString() }, { label: 'Contested', value: String(votes.contested) }],
    href: `${base}/meetings/`, cta: 'See the votes',
  },
  {
    n: 9, kicker: 'On the table now', title: 'The retirement buyout & the tax override', accent: '#b45309',
    body: <>Two live issues shape the next budget: a 2026 early-retirement buyout offered to as many as <b>{buyout.eligibility.totalCount}</b> eligible employees (and what it really saves once you account for promotion chains and retiree healthcare), and the Town’s pattern of overriding the state tax cap. Both are worked through in detail.</>,
    stats: [{ label: 'Buyout-eligible', value: String(buyout.eligibility.totalCount) }],
    href: `${base}/buyout/`, cta: 'Dig into the buyout',
  },
  {
    n: 10, kicker: 'Go deeper', title: 'Search it, or take the raw data', accent: '#0f766e',
    body: <>Every number here traces back to an official document. One search box covers budget line items, payroll, salaries, votes, and thousands of pages of source PDFs — and every dataset is free to download as a spreadsheet or JSON. Nothing here is a black box.</>,
    href: `${base}/downloads/`, cta: 'Download the data',
  },
]

export default function ExplorePage() {
  return (
    <PageShell
      title="Explore the Riverhead Town Budget"
      subtitle="A short, guided tour — ten stops that take you from “what is the budget?” all the way to the raw data, in plain English. Follow it top to bottom, or jump to whatever you came for."
    >
      <div style={{ position: 'relative', display: 'grid', gap: 16 }}>
        {stops.map((s) => (
          <section key={s.n} id={`stop-${s.n}`} style={{
            scrollMarginTop: 20, background: 'white', border: '1px solid #e2e8f0', borderRadius: 16,
            padding: 20, boxShadow: '0 14px 34px rgba(15,23,42,.05)', borderLeft: `6px solid ${s.accent}`,
            display: 'grid', gridTemplateColumns: '52px 1fr', gap: 16, alignItems: 'start',
          }}>
            <div aria-hidden style={{
              width: 44, height: 44, borderRadius: '50%', background: s.accent, color: 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 20,
            }}>{s.n}</div>
            <div>
              <div style={{ color: s.accent, fontWeight: 900, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.6 }}>{s.kicker}</div>
              <h2 style={{ margin: '2px 0 8px', color: '#284a69', fontSize: 21 }}>{s.title}</h2>
              <p style={{ color: '#334155', fontSize: 15.5, lineHeight: 1.6, margin: 0 }}>{s.body}</p>
              {s.stats && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, margin: '12px 0 4px' }}>
                  {s.stats.map((st) => (
                    <div key={st.label} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '8px 14px' }}>
                      <div style={{ color: '#64748b', fontSize: 11, textTransform: 'uppercase', fontWeight: 800, letterSpacing: 0.3 }}>{st.label}</div>
                      <strong style={{ fontSize: 20, color: '#284a69' }}>{st.value}</strong>
                    </div>
                  ))}
                </div>
              )}
              <a href={s.href} style={{ display: 'inline-block', marginTop: 12, color: s.accent, fontWeight: 800, fontSize: 14.5, textDecoration: 'none' }}>{s.cta} →</a>
            </div>
          </section>
        ))}

        <section style={{ background: '#0f2942', color: 'white', borderRadius: 16, padding: '26px 24px', textAlign: 'center' }}>
          <h2 style={{ margin: '0 0 6px', fontSize: 22 }}>That’s the tour.</h2>
          <p style={{ color: '#cbd8e6', fontSize: 15.5, lineHeight: 1.6, margin: '0 auto 16px', maxWidth: 620 }}>
            You now know where Riverhead’s money comes from, where it goes, who pays, and who decides. Pick a thread and pull on it — it all traces back to official documents.
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href={`${base}/funds/`} style={{ background: '#38bdf8', color: '#08263c', fontWeight: 900, padding: '11px 20px', borderRadius: 10, textDecoration: 'none' }}>Open the budget</a>
            <a href={`${base}/search/`} style={{ background: 'transparent', color: 'white', fontWeight: 800, padding: '11px 20px', borderRadius: 10, textDecoration: 'none', border: '1px solid #46647f' }}>Search everything</a>
          </div>
        </section>
      </div>
    </PageShell>
  )
}
