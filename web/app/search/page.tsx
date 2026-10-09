import PageShell from '../../components/PageShell'
import PlainCallout from '../../components/PlainCallout'
import UnifiedSearch from '../../components/UnifiedSearch'

export const metadata = {
  title: 'Search Everything — budgets, payroll, salaries & votes',
  description:
    'Search Town of Riverhead budget line items, employee payroll, authorized salaries, Town Board votes, funds, and 12,000+ pages of financial documents, or ask a question and get a short answer that cites its records.',
}

export default function SearchPage() {
  return (
    <PageShell
      title="Search Everything"
      subtitle="One search box for the whole site: budget line items, employee pay, Board-authorized salaries, Town Board votes, operating funds, and 12,000+ pages of official financial documents."
    >
      {/* The search comes first: it is what the page is for. The help follows it. */}
      <UnifiedSearch />
      <PlainCallout
        title="How to search"
        tips={[
          { label: 'Try a name or a place', text: 'an employee ("Hegermiller"), a Board member ("Kern"), or a place ("Island Water Park"). A misspelling finds the closest name.' },
          { label: 'Try a topic', text: '"reserves", "tax cap" or "buyout". The page on this site that explains it comes first, then the records.' },
          { label: 'Try a meeting date', text: '"September 15" lists what the Board took up that day.' },
          { label: 'Filter by kind', text: 'the chips under the box narrow the results to budget lines, payroll, votes and so on. Document results open the official PDF. Payroll results open that person’s pay for every year, with the breakdown.' },
          { label: 'Ask a question', text: 'Ask AI answers a question written as a sentence, from the records that match it and the site’s Resident Answers, and links each figure to its record. It needs your own OpenAI key; without one it shows the records.' },
        ]}
      >
        Find records searches everything on the site at once: the figures read from the Town&apos;s records, and the official documents themselves.
      </PlainCallout>
    </PageShell>
  )
}
