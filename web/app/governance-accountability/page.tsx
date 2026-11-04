import PageShell from '../../components/PageShell'

const base = process.env.NEXT_PUBLIC_BASE_PATH || ''
const card = { background: 'var(--rbl-surface)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 16, padding: 20 } as const
const link = { color: 'var(--rbl-accent)', fontWeight: 750 } as const
const textStyle = { color: 'var(--rbl-text-body)', fontSize: 14.5, lineHeight: 1.65 } as const

const priorities = [
  { n: '01', title: 'Fiscal stewardship', question: 'Can the Town sustain its services without relying on one-time fixes?', measure: 'Adopted budgets versus actual results; recurring revenue and expenditure growth; fund-balance use and policy compliance; debt service; multi-year forecasts.', links: [['2027 budget', '/tentative-2027/'], ['Budget amendments', '/budget-amendments-2027/'], ['Reserves', '/reserves/'], ['Capital & debt', '/capital-debt/']] },
  { n: '02', title: 'Housing and affordability', question: 'Can people who work in Riverhead afford to live here, and can existing residents remain?', measure: 'Housing inventory by type and price; income-to-housing-cost comparisons; ownership and rental opportunities; infrastructure capacity; affordability restrictions and outcomes.', links: [['Housing plan', '/housing-plan/'], ['Taxpayer impact', '/taxpayer-impact/']] },
  { n: '03', title: 'Economic development', question: 'Do development decisions create durable public value?', measure: 'Jobs created and retained; wages; assessed-value growth; public infrastructure costs; tax incentives and PILOT terms; project milestones and environmental conditions.', links: [['Town Square', '/town-square/'], ['Contracts and agreements', '/contracts/'], ['Community Preservation Fund', '/community-preservation-fund/']] },
  { n: '04', title: 'Infrastructure and resilience', question: 'Is the Town maintaining assets before failures become emergencies?', measure: 'Published capital plan; road and drainage condition; water and sewer capacity; flood-risk mitigation; project schedules, change orders and lifecycle costs.', links: [['Road spending', '/road-spending/'], ['Capital & debt', '/capital-debt/'], ['Town Square', '/town-square/']] },
  { n: '05', title: 'Public safety and emergency services', question: 'Are residents receiving reliable, coordinated emergency services?', measure: 'Response-time reporting where available; service coverage; staffing and overtime; ambulance contract costs; equipment and facility needs; interagency coordination.', links: [['RVAC funding', '/rvac-funding/'], ['Police and crime data', '/police-crime/'], ['School resource officers', '/school-resource-officers/']] },
  { n: '06', title: 'Municipal performance', question: 'Can residents get timely, consistent answers and services from Town Hall?', measure: 'Permit processing times; code-enforcement caseload and resolution; FOIL response times; online service availability; vacancies, turnover and overtime; procurement cycle times.', links: [['Workforce and payroll', '/workforce-by-title/'], ['Payroll explorer', '/payroll/'], ['Contracts', '/contracts/']] },
  { n: '07', title: 'Transparency and public accountability', question: 'Can residents trace decisions from proposal to vote, contract, payment and outcome?', measure: 'Accessible agendas and minutes; complete roll calls; contract and amendment disclosure; project status reports; audit findings and corrective actions.', links: [['Town Board votes', '/meetings/'], ['Supervisor record', '/supervisor-promises/'], ['Evidence library', '/sources/']] },
  { n: '08', title: 'Environmental stewardship', question: 'Are growth and public investment consistent with protecting water, farmland and natural resources?', measure: 'Water-quality monitoring; stormwater and wastewater capacity; open-space preservation; environmental review commitments; climate and coastal resilience projects.', links: [['Housing plan', '/housing-plan/'], ['Community Preservation Fund', '/community-preservation-fund/'], ['Sources', '/sources/']] },
]

const phases = [
  { period: 'First 30 days', heading: 'Establish the baseline', items: ['Publish a consolidated list of major projects, contracts, grants and outstanding obligations.', 'Identify the latest audited financial position and update the multi-year forecast.', 'Set public reporting owners and definitions for each performance measure.'] },
  { period: 'Days 31–60', heading: 'Set measurable targets', items: ['Publish department-level service and staffing baselines.', 'Identify infrastructure risks and projects requiring near-term decisions.', 'Publish housing and economic-development data gaps and a plan to close them.'] },
  { period: 'Days 61–90', heading: 'Publish the operating plan', items: ['Assign a responsible department and public milestone to each priority.', 'Identify one-time versus recurring funding and any outside approvals required.', 'Release a public dashboard with source documents and update dates.'] },
  { period: 'Months 4–12', heading: 'Report results and explain changes', items: ['Update progress quarterly, including missed milestones and corrective actions.', 'Compare actual spending and outcomes with adopted budgets and project plans.', 'Hold public reviews that focus on results, not only announcements.'] },
]

export const metadata = {
  title: 'Riverhead Governance & Accountability',
  description: 'A public framework for tracking Riverhead Town priorities, municipal performance, fiscal stewardship and measurable outcomes using public records.',
}

export default function GovernancePage() {
  return (
    <PageShell title="Riverhead Governance & Accountability" subtitle="A practical framework for following how Riverhead is governed: the decisions, public costs, services and results residents can verify.">
      <section style={{ ...card, marginBottom: 16, background: 'var(--rbl-info-bg)', borderColor: 'var(--rbl-info-border)' }}>
        <h2 style={{ color: 'var(--rbl-title)', marginTop: 0 }}>What this dashboard is—and is not</h2>
        <p style={{ ...textStyle, color: 'var(--rbl-info-text)', marginBottom: 8 }}>This is an independent civic-accountability framework, not a Town publication, campaign document or endorsement. It does not grade an officeholder or assume that a promise has been fulfilled. It identifies public questions, measurable indicators, available records and information that still needs to be published.</p>
        <p style={{ ...textStyle, color: 'var(--rbl-info-text)', margin: 0 }}>The Supervisor leads the Town’s executive and budget-administration work, but the Town Board is a five-member legislative body. Some outcomes require Board votes, department execution, county or state cooperation, private investment, or approvals outside the Supervisor’s control. Responsibility should be attributed accordingly.</p>
      </section>

      <section style={{ ...card, marginBottom: 16 }}>
        <h2 style={{ color: 'var(--rbl-title)', marginTop: 0 }}>How to read the scorecard</h2>
        <p style={textStyle}>Each priority below has a governing question, evidence-based measures and links to existing research on this site. A measure should be marked only when a dated source supports it. “Baseline needed” means the site has not yet established a complete, comparable series; it does not mean the Town has done nothing.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 10 }}>
          {['Documented baseline', 'Target publicly adopted', 'Progress evidenced', 'Variance explained'].map((v, i) => <div key={v} style={{ border: '1px solid var(--rbl-border-subtle)', borderRadius: 12, padding: 12 }}><strong style={{ color: 'var(--rbl-title)' }}>{String(i + 1).padStart(2, '0')} · {v}</strong><p style={{ ...textStyle, fontSize: 13, margin: '5px 0 0' }}>{['A starting value, date, definition and source are available.', 'The responsible body has published a measurable target and deadline.', 'A dated report or record shows what changed against the baseline.', 'Missed targets, cost changes and corrective actions are disclosed.'][i]}</p></div>)}
        </div>
      </section>

      <h2 style={{ color: 'var(--rbl-title)' }}>Eight areas residents can track</h2>
      <p style={{ ...textStyle, marginTop: 0 }}>These are not rankings. They are connected responsibilities that can be examined through records and measurable public outcomes.</p>
      <div style={{ display: 'grid', gap: 12, marginBottom: 18 }}>
        {priorities.map((p) => <section key={p.n} style={card}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'baseline', flexWrap: 'wrap' }}><span style={{ color: 'var(--rbl-text-muted)', fontWeight: 800 }}>{p.n}</span><h3 style={{ color: 'var(--rbl-title)', margin: 0 }}>{p.title}</h3><span style={{ marginLeft: 'auto', color: 'var(--rbl-text-muted)', fontSize: 12, fontWeight: 700 }}>BASELINE / TARGET TO BE ESTABLISHED</span></div>
          <p style={{ ...textStyle, margin: '9px 0 5px' }}><strong>Governing question:</strong> {p.question}</p>
          <p style={{ ...textStyle, margin: '5px 0 9px' }}><strong>What to measure:</strong> {p.measure}</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 14px' }}>{p.links.map(([label, href]) => <a key={href} href={`${base}${href}/`} style={link}>{label} →</a>)}</div>
        </section>)}
      </div>

      <section style={{ ...card, marginBottom: 16 }}>
        <h2 style={{ color: 'var(--rbl-title)', marginTop: 0 }}>A first-year public reporting cycle</h2>
        <p style={textStyle}>The following is a proposed accountability timetable, not a claim that the Town has adopted it. The dates should be reset to the start of the administration or budget year being evaluated.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 12 }}>
          {phases.map((p) => <div key={p.period} style={{ border: '1px solid var(--rbl-border-subtle)', borderRadius: 12, padding: 14 }}>
            <div style={{ color: 'var(--rbl-accent)', fontWeight: 800, fontSize: 12 }}>{p.period}</div><h3 style={{ color: 'var(--rbl-title)', margin: '5px 0 8px', fontSize: 17 }}>{p.heading}</h3>
            <ul style={{ ...textStyle, paddingLeft: 18, margin: 0, fontSize: 13.5 }}>{p.items.map((item) => <li key={item}>{item}</li>)}</ul>
          </div>)}
        </div>
      </section>

      <section style={{ ...card, marginBottom: 16 }}>
        <h2 style={{ color: 'var(--rbl-title)', marginTop: 0 }}>Riverhead in the national moment</h2>
        <p style={textStyle}>National political change reaches local government in two different ways: through policy, funding and legal changes that affect municipal decisions; and through the nationalization of local debate, which can make practical issues more contentious. Neither should be assumed to explain every local decision.</p>
        <ul style={textStyle}>
          <li><strong>Local polarization:</strong> A June–August 2026 CivicPulse/Carnegie survey of 1,224 local officials found 41% said polarization was negatively affecting their own communities, up from 30–31% in earlier survey waves. Among communities under 50,000 residents, the figure was 39%, up from 28%.</li>
          <li><strong>Practical issues remain central:</strong> In that survey, local officials most often identified cost of living (58%), taxes (54%) and housing (41%) as polarizing locally. These overlap with the core municipal issues tracked on this site.</li>
          <li><strong>National trends are not a local mandate:</strong> Harvard Kennedy School research published in June 2026 found sharper partisan divides on local issues that have become nationalized, while technical service questions such as parking and senior housing subsidies showed smaller partisan gaps.</li>
          <li><strong>Local-government agenda:</strong> The National League of Cities’ 2026 report identifies economic development, infrastructure and affordable housing among the leading municipal priorities, alongside budget management and public safety.</li>
        </ul>
        <p style={textStyle}>For Riverhead, the useful test is not whether local government adopts a national political identity. It is whether residents can see how larger economic, legal and funding shifts affect local taxes, housing, infrastructure and services—and whether officials explain those effects with evidence.</p>
        <div style={{ display: 'grid', gap: 6, fontSize: 13 }}>
          <a href="https://carnegie.org/article/perceptions-of-polarization-in-local-communities-are-rising-sharply-according-to-new-survey-by-civicpulse-carnegie/" style={link}>CivicPulse / Carnegie: local polarization survey, October 2026 ↗</a>
          <a href="https://www.hks.harvard.edu/faculty-research/policy-topics/politics/how-national-political-polarization-affects-communities" style={link}>Harvard Kennedy School: national polarization and local politics, June 2026 ↗</a>
          <a href="https://www.nlc.org/resource/state-of-the-cities-2026" style={link}>National League of Cities: State of the Cities 2026 ↗</a>
          <a href="https://news.gallup.com/poll/714821/confidence-federal-government-effectiveness-slides.aspx" style={link}>Gallup: confidence in government effectiveness, October 2026 ↗</a>
        </div>
        <p style={{ ...textStyle, fontSize: 12.5, color: 'var(--rbl-text-muted)', marginBottom: 0 }}>National surveys describe broader patterns; they do not measure Riverhead residents unless specifically stated. They are context, not a substitute for local evidence.</p>
      </section>

      <section style={card}>
        <h2 style={{ color: 'var(--rbl-title)', marginTop: 0 }}>The standard for every update</h2>
        <p style={textStyle}>For each indicator, publish the definition, baseline date, target, latest result, responsible body, funding source, source document and next update date. Separate adopted policy from a proposal, a reported claim from an independently verified result, and a Town Board decision from an administrative action.</p>
        <p style={{ ...textStyle, marginBottom: 0 }}>Where evidence is missing, say so plainly. Where a target is missed, explain why and what changes next. The goal is a record residents can inspect—not a political scorecard.</p>
      </section>
    </PageShell>
  )
}
