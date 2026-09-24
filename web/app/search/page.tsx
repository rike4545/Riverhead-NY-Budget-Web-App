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
          { label: 'Try a name or a place', text: 'an employee ("Hegermiller"), a Board member ("Kern"), or a place ("Island Water Park"). A misspelling finds the closest name.' },
          { label: 'Try a topic', text: '"reserves", "tax cap" or "buyout". The page on this site that explains it comes first, then the records.' },
          { label: 'Try a meeting date', text: '"September 15" lists what the Board took up that day.' },
          { label: 'Filter by kind', text: 'use the colored chips to narrow results to budget lines, payroll, votes, and so on. Document results open the official PDF.' },
        ]}
      >
        This page searches <strong>everything on the site at once</strong> — the structured data we&apos;ve extracted and
        the underlying official documents.
      </PlainCallout>
      <UnifiedSearch />
    </PageShell>
  )
}
