import PageShell from '../../components/PageShell'
import CompareExplorer from '../../components/CompareExplorer'
import PlainCallout from '../../components/PlainCallout'
import RecordTrail from '../../components/RecordTrail'
import { budgetHistory } from '../../lib/budget-history'

export const metadata = {
  title: 'What Changed in Riverhead’s Budget? — Budget Compare',
  description:
    'See what changed in Riverhead’s adopted budget, which funds moved the most, and how spending changed across years.',
}

export default function ComparePage() {
  const years = budgetHistory.years
  const fromYear = years[years.length - 2]
  const toYear = years[years.length - 1]
  const from = budgetHistory.townTotals[String(fromYear)]?.appropriations ?? null
  const to = budgetHistory.townTotals[String(toYear)]?.appropriations ?? null
  const change = from != null && to != null ? to - from : null
  const pct = from != null && change != null ? (change / from) * 100 : null

  return (
    <PageShell
      title="What Changed in Riverhead’s Budget?"
      subtitle={`Start with the big picture, then see which funds changed the most. Compare adopted appropriations from ${years[0]} through ${years[years.length - 1]} and follow the evidence into the underlying records.`}
    >
      <section style={{ background: 'linear-gradient(135deg, var(--rbl-info-bg), var(--rbl-surface))', border: '1px solid var(--rbl-border-subtle)', borderRadius: 18, padding: 22, marginBottom: 16 }}>
        <div style={{ color: 'var(--rbl-accent)', fontSize: 11.5, fontWeight: 950, textTransform: 'uppercase', letterSpacing: 0.6 }}>The short answer</div>
        <h2 style={{ margin: '6px 0 7px', fontSize: 24, lineHeight: 1.2 }}>
          Town-wide planned spending {change != null && change >= 0 ? 'increased' : 'changed'} {change != null ? usd(change) : '—'} from {fromYear} to {toYear}.
        </h2>
        <p style={{ margin: 0, color: 'var(--rbl-text-sub)', lineHeight: 1.55 }}>
          That is {pct != null ? `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%` : '—'} overall. The important next question is <strong>where did that change happen?</strong> The comparison below ranks the funds responsible for the largest dollar and percentage moves.
        </p>
      </section>

      <PlainCallout
        tips={[
          { label: 'Appropriations', text: 'means planned spending. An appropriation increase does not automatically equal the same increase in your property-tax bill.' },
          { label: 'Start here', text: 'use “Biggest $ change” to find the largest budget movements; use “Biggest % change” to spot smaller funds with unusually large swings.' },
          { label: 'Follow the evidence', text: 'click a fund name to move from the comparison into that fund’s detailed records and multi-year history.' },
        ]}
      >
        This page turns a large budget into a simpler question: <strong>what changed, where did it change, and how much?</strong>
      </PlainCallout>

      <RecordTrail
        title="From a budget change to the bigger picture"
        intro="Use the same change as a starting point, then check taxes, payroll, funds, and borrowing before drawing a conclusion."
        items={[
          { href: '/tax-bill/', label: 'My Taxes', text: 'See the Town tax-rate change separately from planned spending.' },
          { href: '/payroll/', label: 'People & Pay', text: 'Check actual earnings, authorized salaries, raises, and overtime.' },
          { href: '/funds/', label: 'Funds & Accounts', text: 'Drill from a fund into departments and individual budget lines.' },
          { href: '/capital-debt/', label: 'Debt & Capital', text: 'Check capital financing, outstanding debt, and borrowing pressure.' },
          { href: '/votes/', label: 'Town Board Votes', text: 'Follow the civic record behind budget and policy decisions.' },
          { href: '/source-library/', label: 'Source Library', text: 'Return to the underlying official documents and source trail.' },
        ]}
      />

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 10, margin: '16px 0' }}>
        <QuickLink href="/tax-bill/" title="My Taxes" text="See the Town tax-rate change separately from spending." />
        <QuickLink href="/payroll/" title="People & Pay" text="See actual pay, authorized salaries, raises and overtime." />
        <QuickLink href="/funds/" title="Funds" text="Open fund-level details and current-year information." />
        <QuickLink href="/capital-debt/" title="Debt & Capital" text="See major capital projects and outstanding debt." />
      </section>

      <CompareExplorer />
    </PageShell>
  )
}

function QuickLink({ href, title, text }: { href: string; title: string; text: string }) {
  const base = process.env.NEXT_PUBLIC_BASE_PATH || ''
  return (
    <a href={`${base}${href}`} style={{ display: 'block', background: 'var(--rbl-surface)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 12, padding: 13, textDecoration: 'none' }}>
      <div style={{ color: 'var(--rbl-title)', fontWeight: 850, fontSize: 14 }}>{title}</div>
      <div style={{ color: 'var(--rbl-text-muted)', fontSize: 12.5, lineHeight: 1.4, marginTop: 3 }}>{text}</div>
    </a>
  )
}

function usd(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}
