import PageShell from '../../components/PageShell'
import Glossary from '../../components/Glossary'

const base = process.env.NEXT_PUBLIC_BASE_PATH || ''
const card = { background: 'white', border: '1px solid #e2e8f0', borderRadius: 16, padding: 20, boxShadow: '0 14px 34px rgba(15,23,42,.05)' } as const

const tools = [
  {
    href: `${base}/payroll/`,
    emoji: '💰',
    title: 'Payroll Explorer',
    answers: 'How much was each Town employee actually paid, and how much of that was overtime?',
    how: 'Type a name in the search box, or filter by year, union, or department. Click any column heading (like "Gross Pay") to sort. Click a name to follow that person across years.',
  },
  {
    href: `${base}/funds/`,
    emoji: '🏛️',
    title: 'Funds & Sub-Accounts',
    answers: 'Where does the money go? Every fund broken down to departments and individual spending lines.',
    how: 'Pick a fund to open its page, then expand a department to see each spending line. Use the search box to find a specific account by name or number.',
  },
  {
    href: `${base}/compare/`,
    emoji: '📊',
    title: 'Budget Compare',
    answers: 'Which parts of the budget grew the most, and by how much, over recent years?',
    how: 'Choose any two years and a way to sort (biggest dollar change, biggest percent change, or largest fund). Each row shows a mini trend line.',
  },
  {
    href: `${base}/general-fund/`,
    emoji: '📈',
    title: 'General Fund History',
    answers: 'How has the main town budget and the property-tax bill changed over the last 20 years?',
    how: 'Read the chart from left (2005) to right (today). The table below shows the exact numbers for every year, including how much the property-tax levy changed.',
  },
  {
    href: `${base}/annual-report/`,
    emoji: '🧾',
    title: '2025 Annual Report',
    answers: 'What actually happened with the money last year, compared with the plan?',
    how: 'See whether the Town ended the year with a surplus or deficit, where the money really came from and went, and how each fund did.',
  },
  {
    href: `${base}/meetings/`,
    emoji: '🗳️',
    title: 'Town Board Votes',
    answers: 'What did the Town Board decide, and did every member agree?',
    how: 'Browse each resolution with its result and who voted how. Use the filter buttons to jump straight to the contested or failed votes.',
  },
  {
    href: `${base}/search/`,
    emoji: '🔎',
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
      <section style={{ ...card, marginBottom: 18, background: '#eef6ff', border: '1px solid #bcd9f5' }}>
        <h2 style={{ marginTop: 0, color: '#284a69' }}>What is this website?</h2>
        <p style={{ color: '#1f3a52', fontSize: 16, lineHeight: 1.6, margin: 0 }}>
          The Town of Riverhead publishes its budgets, audits, and payroll as long PDF documents that are hard to read.
          This site turns those documents into <strong>plain-English, searchable pages</strong> so you can quickly see
          where your tax dollars come from and where they go. It is an independent public-information project — not an
          official Town website. Throughout the site, any word with a <span style={{ borderBottom: '1.5px dotted #4a7297' }}>dotted underline</span>
          {' '}can be tapped for a quick definition.
        </p>
      </section>

      <h2 style={{ color: '#284a69' }}>The tools, in plain words</h2>
      <section style={{ display: 'grid', gap: 14, marginBottom: 26 }}>
        {tools.map((t) => (
          <a key={t.href} href={t.href} style={{ ...card, textDecoration: 'none', color: 'inherit', display: 'block', borderLeft: '5px solid #c99a2e' }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'baseline', flexWrap: 'wrap' }}>
              <span style={{ fontSize: 22 }} aria-hidden>{t.emoji}</span>
              <h3 style={{ margin: 0, color: '#284a69', fontSize: 20 }}>{t.title}</h3>
            </div>
            <p style={{ color: '#1f3a52', fontSize: 15.5, lineHeight: 1.5, margin: '10px 0 6px' }}><strong>Answers:</strong> {t.answers}</p>
            <p style={{ color: '#475569', fontSize: 14.5, lineHeight: 1.5, margin: 0 }}><strong>How to use it:</strong> {t.how}</p>
            <div style={{ color: '#4a7297', fontWeight: 800, marginTop: 12 }}>Open {t.title} →</div>
          </a>
        ))}
      </section>

      <section style={{ ...card, marginBottom: 18 }}>
        <h2 style={{ marginTop: 0, color: '#284a69' }}>A 30-second budget primer</h2>
        <p style={{ color: '#1f3a52', fontSize: 15.5, lineHeight: 1.6 }}>
          A town budget has two sides that must balance. On one side are <strong>appropriations</strong> — the money the
          Town plans to spend. On the other side is how that spending is paid for: mostly <strong>revenues</strong>
          {' '}(fees, state aid, and charges) plus the <strong>property tax levy</strong> (the amount raised from property
          taxes). When revenues and the levy still aren&apos;t enough, the Town can dip into its <strong>savings (fund
          balance)</strong>. The Town keeps money in separate <strong>funds</strong> — one for general services, others for
          things like highways, water, and sewer — and each fund has its own balanced budget.
        </p>
      </section>

      <section id="budget-process" style={{ ...card, marginBottom: 18, scrollMarginTop: 24 }}>
        <h2 style={{ marginTop: 0, color: '#284a69' }}>How the budget gets made</h2>
        <p style={{ color: '#1f3a52', fontSize: 15.5, lineHeight: 1.6 }}>
          Each fall, Riverhead&apos;s budget goes through four public stages, and you can see all four in this site&apos;s data:
        </p>
        <ol style={{ color: '#1f3a52', fontSize: 15.5, lineHeight: 1.7, paddingLeft: 22, margin: '0 0 12px' }}>
          <li><strong>Department requests</strong> — each department proposes what it needs for the coming year.</li>
          <li><strong>Tentative budget</strong> — the Supervisor assembles the requests into a first full draft.</li>
          <li><strong>Preliminary budget</strong> — the Town Board revises the tentative budget and holds a public hearing where residents can comment.</li>
          <li><strong>Adopted budget</strong> — the Board votes to approve the final budget in November. This is the official plan the rest of this site is built on.</li>
        </ol>
        <p style={{ color: '#1f3a52', fontSize: 15.5, lineHeight: 1.6, margin: 0 }}>
          The budget can still change after adoption — but only by a formal Town Board vote. Those amendments (budget
          adoptions for capital projects, transfers, salary changes) appear as resolutions in the{' '}
          <a href={`${base}/meetings/`} style={{ color: '#4a7297', fontWeight: 800 }}>Town Board Votes</a> record, so
          you can watch the plan evolve during the year. And when the year ends, the{' '}
          <a href={`${base}/annual-report/`} style={{ color: '#4a7297', fontWeight: 800 }}>Annual Report</a> shows what
          actually happened compared with the plan.
        </p>
      </section>

      <h2 id="glossary" style={{ color: '#284a69' }}>Budget words, explained</h2>
      <p style={{ color: '#475569', marginTop: 0 }}>Every term the site uses, in everyday language.</p>
      <Glossary />
    </PageShell>
  )
}
