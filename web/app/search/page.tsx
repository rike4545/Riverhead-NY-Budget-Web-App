import PageShell from '../../components/PageShell'
import PlainCallout from '../../components/PlainCallout'
import UnifiedSearch from '../../components/UnifiedSearch'

export const metadata = {
  title: 'Search Everything — budgets, payroll, salaries & votes',
  description:
    'Search Town of Riverhead budget line items, employee payroll, authorized salaries, Town Board votes, funds, and 12,000+ pages of financial documents.',
}

export default function SearchPage() {
  return (
    <PageShell
      title="Search Everything"
      subtitle="One search box for the whole site: budget line items, employee pay, Board-authorized salaries, Town Board votes, operating funds, and 12,000+ pages of official financial documents."
    >
      <PlainCallout
        tips={[
          { label: 'Try a name', text: 'an employee ("Hegermiller"), a topic ("overtime", "paving"), or a place ("Island Water Park").' },
          { label: 'Filter by kind', text: 'use the colored chips to narrow results to just budget lines, payroll, votes, and so on.' },
          { label: 'Click a result', text: 'structured results open the matching page on this site; document results open the official PDF.' },
        ]}
      >
        This page searches <strong>everything on the site at once</strong> — the structured data we&apos;ve extracted and
        the underlying official documents.
      </PlainCallout>
      <UnifiedSearch />
    </PageShell>
  )
}
