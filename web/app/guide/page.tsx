import PageShell from '../../components/PageShell'
import Glossary from '../../components/Glossary'
import { budgetConcepts, OSC_TOWN_GUIDE } from '../../lib/budget-concepts'

const base = process.env.NEXT_PUBLIC_BASE_PATH || ''
const card = { background: 'var(--rbl-surface)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 16, padding: 20 } as const

const tools = [
  {
    href: `${base}/payroll/`,
    title: 'Payroll Explorer',
    answers: 'How much was each Town employee actually paid, and how much of that was overtime?',
    how: 'Type a name in the search box, or filter by year, union, or department. Click any column heading (like "Gross Pay") to sort. Click a name to follow that person across years.',
  },
  {
    href: `${base}/funds/`,
    title: 'Spending by Fund',
    answers: 'Where does the money go? Every fund broken down to departments and individual spending lines.',
    how: 'Pick a fund to open its page, then expand a department to see each spending line. Use the search box to find a specific account by name or number.',
  },
  {
    href: `${base}/compare/`,
    title: 'Compare Budgets',
    answers: 'Which parts of the budget grew the most, and by how much, over recent years?',
    how: 'Choose any two years and a way to sort (biggest dollar change, biggest percent change, or largest fund). Each row shows a mini trend line.',
  },
  {
    href: `${base}/general-fund/`,
    title: 'Main Operating Budget: 20-Year History',
    answers: 'How has the main town budget and the property-tax bill changed over the last 20 years?',
    how: 'Read the chart from left (2005) to right (today). The table below shows the exact numbers for every year, including how much the property-tax levy changed.',
  },
  {
    href: `${base}/annual-report/`,
    title: '2025 Annual Report',
    answers: 'What actually happened with the money last year, compared with the plan?',
    how: 'See whether the Town ended the year with a surplus or deficit, where the money really came from and went, and how each fund did.',
  },
  {
    href: `${base}/meetings/`,
    title: 'Town Board Votes',
    answers: 'What did the Town Board decide, and did every member agree?',
    how: 'Browse each resolution with its result and who voted how. Use the filter buttons to jump straight to the contested or failed votes.',
  },
  {
    href: `${base}/search/`,
    title: 'Search Records',
    answers: 'Where in the official documents does a specific number or topic appear?',
    how: 'Type a keyword or dollar figure to find the exact page in the Town’s budgets and financial reports.',
  },
]

export const metadata = {
  title: 'Start Here — town budgets in plain English',
  description:
    'New to municipal budgets? A plain-English guide to every tool on Riverhead Budget Live, a 30-second budget primer, and a glossary of budget terms.',
}

export default function GuidePage() {
  return (
    <PageShell
      title="Start Here"
      subtitle="New to town budgets? This page explains, in everyday language, what each part of the site does and what the budget words mean. No finance background needed."
    >
      <section style={{ ...card, marginBottom: 18, background: 'var(--rbl-info-bg)', border: '1px solid var(--rbl-info-border)' }}>
        <h2 style={{ marginTop: 0, color: 'var(--rbl-title)' }}>What is this website?</h2>
        <p style={{ color: 'var(--rbl-info-text)', fontSize: 16, lineHeight: 1.6, margin: 0 }}>
          The Town publishes budgets, audits, payroll records, and meeting documents. They contain useful information, but the details can be difficult to find in long reports. This independent site organizes those public records into <strong>searchable pages with plain-language explanations</strong>. You can follow a number back to the document it came from. This is not the Town’s official website.
        </p>
      </section>

      <h2 style={{ color: 'var(--rbl-title)' }}>The tools, in plain words</h2>
      <section style={{ display: 'grid', gap: 14, marginBottom: 26 }}>
        {tools.map((t) => (
          <a key={t.href} href={t.href} style={{ ...card, textDecoration: 'none', color: 'inherit', display: 'block' }}>
            <h3 style={{ margin: 0, color: 'var(--rbl-title)', fontSize: 21 }}>{t.title}</h3>
            <p style={{ color: 'var(--rbl-info-text)', fontSize: 15.5, lineHeight: 1.5, margin: '10px 0 6px' }}><strong>Answers:</strong> {t.answers}</p>
            <p style={{ color: 'var(--rbl-text-body)', fontSize: 14.5, lineHeight: 1.5, margin: 0 }}><strong>How to use it:</strong> {t.how}</p>
            <div style={{ color: 'var(--rbl-link)', fontWeight: 600, marginTop: 12 }}>Open {t.title} →</div>
          </a>
        ))}
      </section>

      <section style={{ ...card, marginBottom: 18 }}>
        <h2 style={{ marginTop: 0, color: 'var(--rbl-title)' }}>A 30-second budget primer</h2>
        <p style={{ color: 'var(--rbl-info-text)', fontSize: 15.5, lineHeight: 1.6 }}>
          A town budget is a plan for what the Town expects to spend and how it expects to pay for it. <strong>Appropriations</strong> are the amounts set aside for services, salaries, supplies, and projects. The money comes from <strong>revenue</strong> such as fees, state aid, and charges, plus the <strong>property-tax levy</strong>—the total amount the Town plans to collect from property owners. If those sources do not cover the plan, the Town may use <strong>fund balance</strong>, which is money saved from earlier years. The Town keeps separate <strong>funds</strong> for different purposes, such as general services, highways, water, and sewer. Each fund has its own budget.
        </p>
      </section>

      <section id="budget-process" style={{ ...card, marginBottom: 18, scrollMarginTop: 24 }}>
        <h2 style={{ marginTop: 0, color: 'var(--rbl-title)' }}>How the budget gets made</h2>
        <p style={{ color: 'var(--rbl-info-text)', fontSize: 15.5, lineHeight: 1.6 }}>
          Each fall, Riverhead follows a budget calendar set by New York State law. The names can be confusing, so here is what each stage means:
        </p>
        <ol style={{ color: 'var(--rbl-info-text)', fontSize: 15.5, lineHeight: 1.7, paddingLeft: 22, margin: '0 0 12px' }}>
          <li><strong>Department requests:</strong> Town departments submit estimates of what they think they will need. They are due to the budget officer by <strong>September 20</strong>.</li>
          <li><strong>Tentative Budget:</strong> The Supervisor, acting as budget officer, puts the requests together into the first complete proposal. It must be filed with the Town Clerk by <strong>September 30</strong> and presented to the Town Board by <strong>October 5</strong>.</li>
          <li><strong>Preliminary Budget:</strong> The Town Board reviews and can change the Tentative Budget. This is the version the Board presents at the public hearing. Notice must be published at least five days beforehand; the hearing is held on the <strong>Thursday after the general election</strong> and cannot be postponed beyond November 15.</li>
          <li><strong>Adopted Budget:</strong> The Town Board’s final budget for the year. It must be adopted by <strong>November 20</strong> and is the plan the Town uses to authorize spending.
        </ol>
        <p style={{ color: 'var(--rbl-info-text)', fontSize: 15.5, lineHeight: 1.6, margin: '0 0 12px' }}>
          Important: If the Board does not vote to adopt a budget by November 20, the Preliminary Budget takes effect automatically under State law. In other words, no final vote does not stop the budget from taking effect.
        </p>
        <p style={{ color: 'var(--rbl-info-text)', fontSize: 15.5, lineHeight: 1.6, margin: 0 }}>
          The budget can still change during the year, but changes must be approved through formal Town Board action. These changes can include transfers between accounts, added spending for projects, or salary adjustments. They appear as resolutions in the{' '}
          <a href={`${base}/meetings/`} style={{ color: 'var(--rbl-accent)', fontWeight: 800 }}>Town Board Decisions</a> record, so
          you can follow changes during the year. When the year ends, the{' '}
          <a href={`${base}/annual-report/`} style={{ color: 'var(--rbl-accent)', fontWeight: 800 }}>Annual Report</a> shows what
          actually happened compared with the plan.
        </p>
      </section>

      <h2 id="glossary" style={{ color: 'var(--rbl-title)' }}>Budget terms, in plain English</h2>
      <p style={{ color: 'var(--rbl-text-body)', marginTop: 0 }}>Short definitions of the words used in Town budgets and financial reports.</p>
      <Glossary />

      {/* The concepts behind the vocabulary — open only what you want. */}
      <h2 id="concepts" style={{ color: 'var(--rbl-title)', marginTop: 30, scrollMarginTop: 24 }}>Want more detail? Explore the ideas behind the terms</h2>
      <p style={{ color: 'var(--rbl-text-body)', marginTop: 0 }}>
        The glossary gives short definitions. These optional sections explain the bigger ideas, show how they apply to Riverhead, and suggest questions residents can ask. Open only the topics you want to explore.
      </p>

      {budgetConcepts.map((c) => (
        <details key={c.id} id={c.id} style={{ ...card, padding: 0, marginBottom: 12, overflow: 'hidden', scrollMarginTop: 24 }}>
          <summary style={{ cursor: 'pointer', listStyle: 'none', padding: '15px 18px', fontWeight: 800, color: 'var(--rbl-title)', fontSize: 15.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            <span>{c.title}</span>
            <span aria-hidden style={{ color: 'var(--rbl-text-muted)', fontSize: 13, fontWeight: 700 }}>Open ▾</span>
          </summary>
          <div style={{ padding: '0 18px 18px' }}>
            <p style={{ color: 'var(--rbl-info-text)', fontSize: 15, lineHeight: 1.6, marginTop: 0 }}>{c.plain}</p>
            {c.riverhead && (
              <div style={{ background: 'var(--rbl-teal-bg)', border: '1px solid var(--rbl-teal-border)', borderRadius: 10, padding: '12px 14px', margin: '10px 0' }}>
                <strong style={{ color: 'var(--rbl-teal)', fontSize: 13 }}>In Riverhead&apos;s numbers:</strong>{' '}
                <span style={{ color: 'var(--rbl-teal-strong)', fontSize: 14.5, lineHeight: 1.6 }}>{c.riverhead}</span>
              </div>
            )}
            <div style={{ color: 'var(--rbl-text-body)', fontSize: 14.5, lineHeight: 1.6 }}>
              <strong style={{ color: 'var(--rbl-title)' }}>Question to ask:</strong> {c.ask}
            </div>
            {c.cite && (
              <div style={{ color: 'var(--rbl-text-muted)', fontSize: 13, marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--rbl-border-subtle)' }}>
                <strong>Authority:</strong> {c.cite}
              </div>
            )}
          </div>
        </details>
      ))}

      <p style={{ color: 'var(--rbl-text-muted)', fontSize: 13.5, lineHeight: 1.6, marginTop: 16 }}>
        Statutory detail and deadlines above come from the State Comptroller&apos;s{' '}
        <a href={OSC_TOWN_GUIDE.url} target="_blank" rel="noreferrer" style={{ color: 'var(--rbl-accent)', fontWeight: 700 }}>
          {OSC_TOWN_GUIDE.label} ↗
        </a>. Riverhead is a town of the <strong>second class</strong> — Town Law §10 places every Suffolk County
        town in that class regardless of population — so the deadlines shown are the general ones, not the later
        dates that apply only to Westchester and Monroe County towns.
      </p>
    </PageShell>
  )
}
