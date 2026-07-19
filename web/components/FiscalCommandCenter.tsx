import { automatedKpis } from '../lib/analytics-modules'
import { allOperatingFunds2026, fundBalanceUseSummary } from '../lib/all-funds'
import { narrativeInsights } from '../lib/intelligence'
import { retirementProgramAssessment, retirementRiskFactors } from '../lib/retirement-risk-analysis'
import { archiveStats, financialReportsArchive } from '../lib/financial-reports-archive'
import { dollars } from '../lib/financial-data'

const base = process.env.NEXT_PUBLIC_BASE_PATH || ''
// In-page section anchors (site navigation lives in the shared PageShell header).
const sectionAnchors = [
  ['Resident Insights', '#insights'],
  ['All Funds', '#funds'],
  ['Reserve Use', '#reserves'],
  ['Scenario Lab', '#scenario'],
  ['Retirement Risk', '#retirement'],
  ['Disclaimers', '#disclaimers'],
]

// Matches the standard card style used on every other page (see e.g. funds/page.tsx)
// so the home page reads as part of the same site.
const shell = { background: 'white', border: '1px solid #e2e8f0', borderRadius: 16, boxShadow: '0 14px 34px rgba(15,23,42,.05)' } as const
const muted = '#64748b'

const surplusScenario = {
  totalAvailable: 5000000,
  allocations: [
    { category: 'Contract and labor pressure reserve', amount: 1200000, description: 'Reserve for labor settlements and workforce cost pressure.', benefit: 'Creates a buffer for contract volatility.', caution: 'Needs public rules and reporting.' },
    { category: 'Tax stabilization fund', amount: 2000000, description: 'Reserve to smooth levy pressure.', benefit: 'Can offset levy growth if formally applied.', caution: 'One-time source unless recurring savings replace it.' },
    { category: 'Parks', amount: 750000, description: 'Parks and quality-of-life infrastructure.', benefit: 'Supports public assets.', caution: 'May create maintenance costs.' },
    { category: 'Vehicles', amount: 525000, description: 'Fleet replacement or modernization.', benefit: 'Can reduce repair and borrowing pressure.', caution: 'Should align with fleet schedule.' },
    { category: 'Software', amount: 150000, description: 'Technology and service modernization.', benefit: 'Can improve productivity.', caution: 'May create recurring subscription costs.' },
    { category: 'Training / tuition', amount: 150000, description: 'Staff development and credentials.', benefit: 'Builds internal capacity.', caution: 'Depends on retention.' },
    { category: 'Classification / compensation investments', amount: 175000, description: 'Targeted workforce investment.', benefit: 'Supports recruitment and retention.', caution: 'May create recurring costs.' },
    { category: 'Remaining balance', amount: 50000, description: 'Unallocated remainder.', benefit: 'Small contingency.', caution: 'Should have assigned purpose.' },
  ],
}

const packageTotal = surplusScenario.allocations.reduce((sum, item) => sum + item.amount, 0)
const surplusScenarioTotals = {
  packageTotal,
  remainingFromFiveMillion: surplusScenario.totalAvailable - packageTotal,
  reserveAndStabilization: 3200000,
  capitalTechnologyWorkforce: 1750000,
}
const scenarioSummary = 'This scenario allocates $4.95M of a $5M package and leaves $50K unallocated. It combines stabilization, reserves, parks, vehicles, software, training, and compensation investments.'

export default function FiscalCommandCenter() {
  const reserveUsers = allOperatingFunds2026.filter((fund) => fund.appropriatedFundBalance2026 > 0)
  const recentDocs = financialReportsArchive.slice(0, 10)

  return (
    <div id="top">
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ color: '#64748b', fontWeight: 800, fontSize: 12.5, textTransform: 'uppercase', letterSpacing: 0.5 }}>On this page:</span>
        {sectionAnchors.map(([label, href]) => (
          <a key={href} href={href} style={{ color: '#4a7297', textDecoration: 'none', border: '1px solid #cbd5e1', background: 'white', borderRadius: 999, padding: '6px 12px', fontWeight: 800, fontSize: 12.5 }}>{label}</a>
        ))}
        <span style={{ color: '#64748b', fontSize: 12.5, marginLeft: 'auto' }}>
          Source coverage: {archiveStats.indexedItems} documents across {archiveStats.yearsCovered} years
        </span>
      </div>

      <a href={`${base}/guide/`} style={{ display: 'block', textDecoration: 'none', marginTop: 18 }}>
            <div style={{ background: '#eef6ff', border: '1px solid #bcd9f5', borderLeft: '6px solid #4a7297', borderRadius: 14, padding: '14px 18px', display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <span aria-hidden style={{ fontSize: 22 }}>👋</span>
              <span style={{ color: '#1f3a52', fontSize: 15.5, lineHeight: 1.5 }}>
                <strong style={{ color: '#284a69' }}>New to town budgets?</strong> Start with our plain-English guide — it explains
                each tool and every budget word in everyday language. <strong style={{ color: '#4a7297' }}>Open the Start Here guide →</strong>
              </span>
            </div>
          </a>

          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 14, marginTop: 18 }}>
            <FeatureCard
              href={`${base}/payroll/`}
              tag="New · SeeThroughNY-style"
              title="Payroll Explorer"
              body="Search 6,000+ employee earnings records (2018–2025): base pay, overtime, and total gross by name, title, department, and union."
            />
            <FeatureCard
              href={`${base}/funds/`}
              tag="New · Account-level"
              title="Funds & Sub-Accounts"
              body="Drill every operating fund down to department, category, and individual account line items — 1,000+ lines reconciled to the dollar."
            />
            <FeatureCard
              href={`${base}/compare/`}
              tag="New · Multi-year"
              title="Budget Compare"
              body="Compare adopted appropriations across funds from 2020–2026, sorted by the biggest dollar and percent movers, with trend sparklines."
            />
            <FeatureCard
              href={`${base}/general-fund/`}
              tag="New · 20-year"
              title="General Fund History"
              body="Two decades of the principal operating fund (2005–2026): appropriations, tax levy, and revenues charted year by year — appropriations have more than doubled."
            />
            <FeatureCard
              href={`${base}/annual-report/`}
              tag="New · Actual results"
              title="2025 Annual Report"
              body="What actually happened in 2025: the General Fund ran a $5.0M surplus and savings grew to $33.4M. Budget-vs-actual, revenues and spending by category, and every fund."
            />
            <FeatureCard
              href={`${base}/meetings/`}
              tag="New · Voting record"
              title="Town Board Votes"
              body="How the Board voted, resolution by resolution — who moved, seconded, and how each member voted. Filter straight to the contested and failed votes."
            />
          </section>

          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 14, marginTop: 18 }}>
            {automatedKpis.map((kpi) => (
              <article key={kpi.label} style={{ ...shell, padding: 18 }}>
                <div style={{ color: muted, textTransform: 'uppercase', fontSize: 11, fontWeight: 950 }}>{kpi.label}</div>
                <div style={{ fontSize: 32, fontWeight: 950, marginTop: 8 }}>{kpi.value}</div>
                <p style={{ color: muted, fontSize: 13, lineHeight: 1.4 }}>{kpi.explanation}</p>
              </article>
            ))}
          </section>

          <section id="insights" style={{ ...shell, scrollMarginTop: 24, marginTop: 18, padding: 24 }}>
            <h2 style={{ margin: 0 }}>What&apos;s worth knowing</h2>
            <p style={{ color: muted }}>The handful of things that actually moved — what changed, why it matters to you, and what we&apos;re still double-checking.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 14, marginTop: 16 }}>
              {narrativeInsights.map((insight) => (
                <article key={insight.title} style={{ border: '1px solid #e2e8f0', borderRadius: 18, padding: 16, background: '#f8fafc' }}>
                  <div style={{ color: '#2563eb', fontSize: 12, fontWeight: 950, textTransform: 'uppercase' }}>{insight.status}</div>
                  <h3 style={{ margin: '8px 0' }}>{insight.title}</h3>
                  <div style={{ fontSize: 26, fontWeight: 950 }}>{insight.value}</div>
                  <p style={{ color: '#334155' }}>{insight.explanation}</p>
                  <p style={{ color: muted }}><strong>Why it matters:</strong> {insight.whyItMatters}</p>
                </article>
              ))}
            </div>
          </section>

          <section id="funds" style={{ ...shell, scrollMarginTop: 24, marginTop: 18, padding: 24 }}>
            <h2 style={{ marginTop: 0 }}>Where the money sits — every operating fund</h2>
            <p style={{ color: muted }}>A town budget isn&apos;t one pot; it&apos;s a set of separate &quot;funds,&quot; each with its own money. Here&apos;s all of them from the adopted budget. Want to go deeper? The <a href={`${base}/funds/`} style={{ color: '#4a7297', fontWeight: 800 }}>Funds &amp; Sub-Accounts explorer</a> lets you open any fund right down to the individual line items, with year-by-year trends.</p>
            <div style={{ display: 'grid', gap: 10 }}>
              {allOperatingFunds2026.map((fund) => (
                <details key={fund.code} style={{ border: '1px solid #e2e8f0', borderRadius: 16, padding: 14, background: '#f8fafc' }}>
                  <summary style={{ cursor: 'pointer', fontWeight: 950, display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                    <span>{fund.code} — {fund.name}</span>
                    <span>{dollars(fund.appropriations2026)}</span>
                  </summary>
                  <p style={{ color: '#475569' }}>{fund.description}</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: 10 }}>
                    <Mini label="Estimated revenues" value={dollars(fund.estimatedRevenues2026)} />
                    <Mini label="Fund balance used" value={dollars(fund.appropriatedFundBalance2026)} />
                    <Mini label="Tax levy" value={dollars(fund.taxLevy2026)} />
                    <Mini label="Ending balance estimate" value={fund.estimatedFundBalance123125 ? dollars(fund.estimatedFundBalance123125) : 'Pending'} />
                  </div>
                  <div style={{ color: muted, fontSize: 12, marginTop: 10 }}>Source: {fund.source}</div>
                  <a href={`${base}/funds/${fund.code}/`} style={{ display: 'inline-block', marginTop: 10, color: '#4a7297', fontWeight: 800 }}>Open {fund.code} account-level drilldown →</a>
                </details>
              ))}
            </div>
          </section>

          <section id="reserves" style={{ ...shell, scrollMarginTop: 24, marginTop: 18, padding: 24 }}>
            <h2 style={{ marginTop: 0 }}>Dipping into savings (reserve use)</h2>
            <p style={{ color: muted }}>{fundBalanceUseSummary.note}</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 14 }}>
              <Mini label="Appropriated fund balance" value={dollars(fundBalanceUseSummary.totalAppropriatedFundBalanceInSummary)} />
              <Mini label="Application shown on schedule" value={dollars(fundBalanceUseSummary.totalApplicationShownOnFundBalanceSchedule)} />
              <Mini label="Funds using balance" value={String(reserveUsers.length)} />
            </div>
            <div style={{ marginTop: 16 }}>
              {fundBalanceUseSummary.highestUseFunds.map((item) => <div key={item} style={{ padding: '9px 0', borderTop: '1px solid #e2e8f0' }}>{item}</div>)}
            </div>
          </section>

          <section id="scenario" style={{ ...shell, scrollMarginTop: 24, marginTop: 18, padding: 24 }}>
            <h2 style={{ marginTop: 0 }}>A what-if: how would you spend a $5M surplus?</h2>
            <p style={{ color: muted }}>{scenarioSummary}</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 14 }}>
              <Mini label="Package total" value={dollars(surplusScenarioTotals.packageTotal)} />
              <Mini label="Reserve + stabilization" value={dollars(surplusScenarioTotals.reserveAndStabilization)} />
              <Mini label="Investment allocations" value={dollars(surplusScenarioTotals.capitalTechnologyWorkforce)} />
              <Mini label="Remaining" value={dollars(surplusScenarioTotals.remainingFromFiveMillion)} />
            </div>
            <div style={{ display: 'grid', gap: 10, marginTop: 16 }}>
              {surplusScenario.allocations.map((item) => (
                <div key={item.category} style={{ border: '1px solid #e2e8f0', borderRadius: 14, padding: 14, background: '#f8fafc' }}>
                  <strong>{item.category}: {dollars(item.amount)}</strong>
                  <p style={{ color: '#475569' }}>{item.description}</p>
                  <p style={{ color: muted }}><strong>Benefit:</strong> {item.benefit}</p>
                  <p style={{ color: muted }}><strong>Caution:</strong> {item.caution}</p>
                </div>
              ))}
            </div>
          </section>

          <section id="retirement" style={{ ...shell, scrollMarginTop: 24, marginTop: 18, padding: 24 }}>
            <h2 style={{ marginTop: 0 }}>The retirement buyout — and what to watch</h2>
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: '12px 16px', marginBottom: 14 }}>
              <strong style={{ color: '#14532d' }}>Update — the buyout is now final.</strong>{' '}
              <span style={{ color: '#166534' }}>
                The Town has executed 2026 Voluntary Retirement Incentive agreements with all three unions (CSEA $12,500;
                PBA &amp; SOA $1,000/yr of service + sick-day payout).{' '}
                <a href={`${base}/buyout/`} style={{ color: '#15803d', fontWeight: 800 }}>See the final terms →</a>
              </span>
            </div>
            <p style={{ color: muted }}><strong>{retirementProgramAssessment.classification}:</strong> {retirementProgramAssessment.explanation}</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 14 }}>
              {retirementRiskFactors.map((risk) => (
                <article key={risk.title} style={{ border: '1px solid #e2e8f0', borderRadius: 16, padding: 14, background: '#f8fafc' }}>
                  <div style={{ color: risk.riskLevel === 'High' ? '#dc2626' : '#ca8a04', fontWeight: 950 }}>{risk.riskLevel}</div>
                  <h3>{risk.title}</h3>
                  <p>{risk.description}</p>
                  <p style={{ color: muted }}><strong>Fiscal impact:</strong> {risk.fiscalImpact}</p>
                </article>
              ))}
            </div>
          </section>

          <section style={{ ...shell, marginTop: 18, padding: 24 }}>
            <h2 style={{ marginTop: 0 }}>The documents this is built from</h2>
            {recentDocs.map((doc) => (
              <div key={`${doc.year}-${doc.title}`} style={{ display: 'grid', gridTemplateColumns: '80px 1fr 180px', gap: 12, borderTop: '1px solid #e2e8f0', padding: '10px 0' }}>
                <strong>{doc.year}</strong>
                <span>{doc.title}</span>
                <span style={{ color: '#2563eb', fontWeight: 900 }}>{doc.category.replace('_', ' ')}</span>
              </div>
            ))}
          </section>

          <section id="about" style={{ ...shell, scrollMarginTop: 24, marginTop: 18, padding: 24, borderLeft: '8px solid #4a7297' }}>
            <h2 style={{ marginTop: 0, color: '#284a69' }}>About Riverhead Budget Live</h2>
            <p>Riverhead Budget Live is an independent, non-partisan, non-profit project. Our mission is to make Riverhead a better place to live and work by promoting public-policy reforms grounded in the fiscally responsible ideals of effective and accountable government.</p>
          </section>

          <section id="how-to-use" style={{ ...shell, scrollMarginTop: 24, marginTop: 18, padding: 24, borderLeft: '8px solid #15803d' }}>
            <h2 style={{ marginTop: 0, color: '#284a69' }}>How to use this site</h2>
            <p>Use this site to share, analyze, and compare data from governmental entities throughout Riverhead. The information on this website comes from official government sources, but the author cannot guarantee data accuracy or completeness.</p>
          </section>

          <section id="disclaimers" style={{ ...shell, scrollMarginTop: 24, marginTop: 18, padding: 24, borderLeft: '8px solid #dc2626', background: '#fff7f7' }}>
            <h2 style={{ marginTop: 0, color: '#991b1b' }}>The fine print</h2>
            <p>This website is an independent public-information and fiscal-analysis project. It is not an official Town of Riverhead website and is not affiliated with, endorsed by, sponsored by, or operated by the Town of Riverhead or any Town department, political subdivision, political party or political organization or candidate.</p>
            <p>The figures are pulled automatically from public source documents, so the author cannot guarantee they are accurate or complete. A number can be misread, mislabeled, or lag behind the latest filing — a scanning glitch, a stray column, or a report that hadn&apos;t caught up yet.</p>
            <p>Nothing here is legal, financial, tax, or investment advice. The explanations, projections, classifications, and “realistic” analyses are the author&apos;s own interpretation of public records — not the Town&apos;s position and not a professional opinion.</p>
            <p>So before you rely on any figure, check it against the original official document; the source is linked on every page. And if you spot something wrong, please flag it — corrections are genuinely welcome and make this better for everyone.</p>
          </section>
    </div>
  )
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 16, padding: 14 }}>
      <div style={{ color: muted, fontSize: 12, textTransform: 'uppercase', fontWeight: 950 }}>{label}</div>
      <strong style={{ fontSize: 20 }}>{value}</strong>
    </div>
  )
}

function FeatureCard({ href, tag, title, body }: { href: string; tag: string; title: string; body: string }) {
  return (
    <a href={href} style={{ ...shell, padding: 20, textDecoration: 'none', color: 'inherit', display: 'block', borderTop: '5px solid #c99a2e' }}>
      <div style={{ color: '#2563eb', fontSize: 11, fontWeight: 950, textTransform: 'uppercase', letterSpacing: 1 }}>{tag}</div>
      <h3 style={{ margin: '8px 0 6px', fontSize: 22, color: '#284a69' }}>{title}</h3>
      <p style={{ color: muted, fontSize: 14, lineHeight: 1.5, margin: 0 }}>{body}</p>
      <div style={{ color: '#4a7297', fontWeight: 900, marginTop: 12 }}>Open →</div>
    </a>
  )
}
