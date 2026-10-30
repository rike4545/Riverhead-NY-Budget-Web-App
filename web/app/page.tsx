import { ArrowRight, BookOpen, FileSearch, Landmark, Scale, Wallet } from 'lucide-react'
import PageShell from '../components/PageShell'
import UpdateSummary from '../components/UpdateSummary'
import TentativeReleased from '../components/TentativeReleased'
import { released2027 } from '../lib/tentative-2027'

const base = process.env.NEXT_PUBLIC_BASE_PATH || ''

const popular = [
  ...(released2027 ? [['2027 Tentative Budget', '/tentative-2027/']] : []),
  ['Why did my property taxes change?', '/tax-bill/'],
  ['What changed in the budget?', '/what-changed/'],
  ['Who gets paid the most?', '/payroll/'],
  ['Where does the levy go?', '/taxpayer-impact/'],
  ['What could happen in 2027?', '/predict-2027/'],
]

const pathways = [
  { title: 'Understand your taxes', text: 'Estimate the Town portion of your bill and see what changed.', href: '/tax-bill/', icon: Wallet, },
  { title: 'Follow the money', text: 'Trace the Town levy through the funds and services it supports.', href: '/taxpayer-impact/', icon: Landmark, },
  { title: 'Payroll Explorer', text: 'Search actual pay, overtime, separation payments, titles and departments.', href: '/payroll/', icon: Scale, },
  { title: 'Check fiscal health', text: 'Explore reserves, financial trends, debt and the Town’s fiscal position.', href: '/analytics/', icon: BookOpen, },
]

const research = [
  { title: 'Budget & funds', text: 'Open adopted budgets down to account-level detail.', href: '/funds/' },
  { title: 'Town Board votes', text: 'Follow resolutions and voting records back to meetings.', href: '/meetings/' },
  { title: '2027 budget outlook', text: 'Separate the model, tax-cap rules and policy choices.', href: '/predict-2027/' },
  { title: 'Evidence library', text: 'Review Town records, OSC guidance and source trails.', href: '/sources/' },
]

const principles = [
  { number: '01', title: 'Find the record', text: 'Search budgets, payroll, meetings and financial reports.' },
  { number: '02', title: 'Understand the number', text: 'Plain-English explanations distinguish facts from calculations and projections.' },
  { number: '03', title: 'Verify the source', text: 'Follow important claims back to documents, dates and evidence.' },
]

export default function Page() {
  return (
    <PageShell home title="Riverhead Budget Live" subtitle="An independent, resident-first guide to Riverhead Town finances.">
      <div className="home-page">
        <section className="home-hero" aria-labelledby="home-title">
          <div className="home-hero-copy">
            <h1 id="home-title">Your town’s budget.<br /><span>Made understandable.</span></h1>
            <p className="home-intro">Follow Riverhead’s money from the budget line to the public record. Clear explanations, useful tools and evidence you can check for yourself.</p>
            <div className="home-actions">
              <a href={`${base}/search/`} className="home-primary-action"><FileSearch size={18} aria-hidden="true" /> Search the records <ArrowRight size={17} aria-hidden="true" /></a>
              <a href={`${base}/tax-bill/`} className="home-secondary-action">Start with your taxes <ArrowRight size={16} aria-hidden="true" /></a>
            </div>
            <div className="home-trust-line"><span><i /> No account required</span><span><i /> Sources linked</span><span><i /> Independent analysis</span></div>
          </div>
          <aside className="home-hero-panel" aria-label="Explore the budget">
            <div className="home-panel-top"><span>Riverhead, New York</span><span className="home-panel-mark">RB</span></div>
            <div className="home-panel-title">A clearer view of local government.</div>
            <p>Start with a question. Follow the numbers. Read the underlying documents.</p>
            <div className="home-panel-links">
              <a href={`${base}/tentative-2027/`}><span className="home-panel-icon"><Landmark size={18} /></span><span><strong>2027 budget</strong><small>{released2027 ? 'Tentative proposal and supporting detail' : 'Budget process and supporting detail'}</small></span><ArrowRight size={17} /></a>
              <a href={`${base}/budget-amendments-2027/`}><span className="home-panel-icon"><Scale size={18} /></span><span><strong>Budget amendments</strong><small>Track proposed changes and their effects</small></span><ArrowRight size={17} /></a>
              <a href={`${base}/sources/`}><span className="home-panel-icon"><BookOpen size={18} /></span><span><strong>Source library</strong><small>Go directly to records and references</small></span><ArrowRight size={17} /></a>
            </div>
            <div className="home-panel-foot">Public records <span>•</span> Plain language <span>•</span> Traceable analysis</div>
          </aside>
        </section>

        <section className="home-question-strip" aria-label="Popular questions">
          <div className="home-question-label">What are you looking for?</div>
          <div className="home-question-links">
            {popular.map(([label, href]) => <a key={href} href={`${base}${href}`}>{label}<ArrowRight size={13} aria-hidden="true" /></a>)}
          </div>
        </section>

        <TentativeReleased />
        <UpdateSummary />

        <section className="home-pathways" aria-labelledby="home-pathways-title">
          <div className="home-section-heading">
            <div><h2 id="home-pathways-title">What would you like to understand?</h2></div>
            <p>The research is deep. Getting to the right place should be simple.</p>
          </div>
          <div className="home-pathway-grid">
            {pathways.map(({ title, text, href, icon: Icon, eyebrow }) => (
              <a className="home-pathway-card" key={href} href={`${base}${href}`}>
                <div className="home-card-top"><span className="home-card-icon"><Icon size={20} aria-hidden="true" /></span><ArrowRight className="home-card-arrow" size={18} aria-hidden="true" /></div>
                <strong>{title}</strong>
                <span className="home-card-description">{text}</span>
              </a>
            ))}
          </div>
        </section>

        <section className="home-research" aria-labelledby="home-research-title">
          <div className="home-research-heading"><div><h2 id="home-research-title">The details are here when you need them.</h2></div><a href={`${base}/guide/`}>Explore the site guide <ArrowRight size={15} /></a></div>
          <div className="home-research-grid">
            {research.map((item, index) => <a href={`${base}${item.href}`} key={item.href}><span className="home-research-number">0{index + 1}</span><span><strong>{item.title}</strong><small>{item.text}</small></span><ArrowRight size={16} /></a>)}
          </div>
        </section>

        <section className="home-method" aria-label="How this site works">
          <div className="home-method-heading"><h2>Clarity is good. Evidence is essential.</h2></div>
          <div className="home-method-grid">{principles.map(item => <div key={item.number}><span>{item.number}</span><strong>{item.title}</strong><p>{item.text}</p></div>)}</div>
        </section>
      </div>
    </PageShell>
  )
}
