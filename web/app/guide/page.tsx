import PageShell from '../../components/PageShell'
import Glossary from '../../components/Glossary'
import { budgetConcepts, OSC_TOWN_GUIDE } from '../../lib/budget-concepts'

const base = process.env.NEXT_PUBLIC_BASE_PATH || ''
const card = { background: 'var(--rbl-surface)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 16, padding: 20, boxShadow: '0 14px 34px var(--rbl-shadow)' } as const

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
      <section style={{ ...card, marginBottom: 18, background: 'var(--rbl-info-bg)', border: '1px solid var(--rbl-info-border)' }}>
        <h2 style={{ marginTop: 0, color: 'var(--rbl-title)' }}>What is this website?</h2>
        <p style={{ color: 'var(--rbl-info-text)', fontSize: 16, lineHeight: 1.6, margin: 0 }}>
          The Town of Riverhead publishes its budgets, audits, and payroll as long PDF documents that are hard to read.
          This site turns those documents into <strong>plain-English, searchable pages</strong> so you can quickly see
          where your tax dollars come from and where they go. It is an independent public-information project — not an
          official Town website. Throughout the site, any word with a <span style={{ borderBottom: '1.5px dotted var(--rbl-accent-border)' }}>dotted underline</span>
          {' '}can be tapped for a quick definition.
        </p>
      </section>

      <h2 style={{ color: 'var(--rbl-title)' }}>The tools, in plain words</h2>
      <section style={{ display: 'grid', gap: 14, marginBottom: 26 }}>
        {tools.map((t) => (
          <a key={t.href} href={t.href} style={{ ...card, textDecoration: 'none', color: 'inherit', display: 'block', borderLeft: '5px solid var(--rbl-gold-border)' }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'baseline', flexWrap: 'wrap' }}>
              <span style={{ fontSize: 22 }} aria-hidden>{t.emoji}</span>
              <h3 style={{ margin: 0, color: 'var(--rbl-title)', fontSize: 20 }}>{t.title}</h3>
            </div>
            <p style={{ color: 'var(--rbl-info-text)', fontSize: 15.5, lineHeight: 1.5, margin: '10px 0 6px' }}><strong>Answers:</strong> {t.answers}</p>
            <p style={{ color: 'var(--rbl-text-body)', fontSize: 14.5, lineHeight: 1.5, margin: 0 }}><strong>How to use it:</strong> {t.how}</p>
            <div style={{ color: 'var(--rbl-accent)', fontWeight: 800, marginTop: 12 }}>Open {t.title} →</div>
          </a>
        ))}
      </section>

      <section style={{ ...card, marginBottom: 18 }}>
        <h2 style={{ marginTop: 0, color: 'var(--rbl-title)' }}>A 30-second budget primer</h2>
        <p style={{ color: 'var(--rbl-info-text)', fontSize: 15.5, lineHeight: 1.6 }}>
          A town budget has two sides that must balance. On one side are <strong>appropriations</strong> — the money the
          Town plans to spend. On the other side is how that spending is paid for: mostly <strong>revenues</strong>
          {' '}(fees, state aid, and charges) plus the <strong>property tax levy</strong> (the amount raised from property
          taxes). When revenues and the levy still aren&apos;t enough, the Town can dip into its <strong>savings (fund
          balance)</strong>. The Town keeps money in separate <strong>funds</strong> — one for general services, others for
          things like highways, water, and sewer — and each fund has its own balanced budget.
        </p>
      </section>

      <section id="budget-process" style={{ ...card, marginBottom: 18, scrollMarginTop: 24 }}>
        <h2 style={{ marginTop: 0, color: 'var(--rbl-title)' }}>How the budget gets made</h2>
        <p style={{ color: 'var(--rbl-info-text)', fontSize: 15.5, lineHeight: 1.6 }}>
          Each fall, Riverhead&apos;s budget goes through four public stages on a calendar set by State law — these
          are deadlines, not customs, and you can see all four in this site&apos;s data:
        </p>
        <ol style={{ color: 'var(--rbl-info-text)', fontSize: 15.5, lineHeight: 1.7, paddingLeft: 22, margin: '0 0 12px' }}>
          <li><strong>Department requests</strong> — each department proposes what it needs. Estimates are due to the budget officer by <strong>September 20</strong>.</li>
          <li><strong>Tentative budget</strong> — the Supervisor (as budget officer) assembles the requests into a first full draft, filed with the Town Clerk by <strong>September 30</strong> and put before the Board by <strong>October 5</strong>.</li>
          <li><strong>Preliminary budget</strong> — the Board revises the tentative budget, publishes notice at least five days ahead, and holds the public hearing on the <strong>Thursday after the general election</strong> (adjournable, but never past November 15).</li>
          <li><strong>Adopted budget</strong> — the Board must adopt by <strong>November 20</strong>. This is the official plan the rest of this site is built on.</li>
        </ol>
        <p style={{ color: 'var(--rbl-info-text)', fontSize: 15.5, lineHeight: 1.6, margin: '0 0 12px' }}>
          One consequence is worth knowing: if the Board <em>doesn&apos;t</em> adopt a budget by November 20, the
          preliminary budget becomes the budget automatically. Letting the clock run out isn&apos;t a way to block a
          budget — it&apos;s a way to pass one without a final vote.
        </p>
        <p style={{ color: 'var(--rbl-info-text)', fontSize: 15.5, lineHeight: 1.6, margin: 0 }}>
          The budget can still change after adoption — but only by a formal Town Board vote. Those amendments (budget
          adoptions for capital projects, transfers, salary changes) appear as resolutions in the{' '}
          <a href={`${base}/meetings/`} style={{ color: 'var(--rbl-accent)', fontWeight: 800 }}>Town Board Votes</a> record, so
          you can watch the plan evolve during the year. And when the year ends, the{' '}
          <a href={`${base}/annual-report/`} style={{ color: 'var(--rbl-accent)', fontWeight: 800 }}>Annual Report</a> shows what
          actually happened compared with the plan.
        </p>
      </section>

      <h2 id="glossary" style={{ color: 'var(--rbl-title)' }}>Budget words, explained</h2>
      <p style={{ color: 'var(--rbl-text-body)', marginTop: 0 }}>Every term the site uses, in everyday language.</p>
      <Glossary />

      {/* The concepts behind the vocabulary — open only what you want. */}
      <h2 id="concepts" style={{ color: 'var(--rbl-title)', marginTop: 30, scrollMarginTop: 24 }}>Going deeper: the ideas behind the words</h2>
      <p style={{ color: 'var(--rbl-text-body)', marginTop: 0 }}>
        The glossary above defines the terms. These are the concepts underneath them — the accounting and fiscal-policy
        ideas the rest of this site leans on, with Riverhead&apos;s own numbers where they exist. Optional; open only
        what you want.
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
