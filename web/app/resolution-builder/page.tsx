import PageShell from '../../components/PageShell'
import PlainCallout from '../../components/PlainCallout'
import ResolutionBuilder, { type AccountOption } from '../../components/ResolutionBuilder'
import current from '../../public/data/budget-supplement/current-lines.json'
import fiscalIndex from '../../public/data/meetings/fiscal-index.json'

const base = process.env.NEXT_PUBLIC_BASE_PATH || ''
const link = { color: 'var(--rbl-link)', fontWeight: 600 } as const

export const metadata = {
  title: 'Resolution builder',
  description: 'An unofficial helper for Town of Riverhead staff drafting a Town Board resolution in the Town’s own layout: WHEREAS and RESOLVED clauses, the FROM/TO budget table and the standard closing clauses, with checks, a print view and a Word download.',
}

// Every account in the 2027 Budget Supplement, so a budget table can be filled in by code or by name.
const accounts: AccountOption[] = (current.lines as { account: string; name: string }[])
  .map((l) => ({ code: l.account, name: l.name.replace(/\s*\(Budget Prep.*$/i, '').trim() }))
  .sort((a, b) => a.code.localeCompare(b.code))
// Resolutions are numbered by the year of the meeting: the year of the newest meeting on record.
const year = Number([...(fiscalIndex.meetings as string[])].sort().slice(-1)[0].slice(0, 4))

export default function ResolutionBuilderPage() {
  return (
    <PageShell
      title="Resolution builder"
      subtitle="For Town staff drafting a Town Board resolution: write what each clause says, and the builder lays it out the way the Town’s agenda packets print it, with the joining words, capitals, budget table and closing clauses in place."
    >
      <PlainCallout
        tips={[
          { label: 'Starting points', text: 'a donation, a budget transfer, an appointment and an agreement, each following an adopted 2026 resolution’s wording with blanks in square brackets.' },
          { label: 'Checks', text: 'the builder flags blanks left in brackets, a budget table that does not balance, an amount in the clauses that differs from the table, and fund balance that the Fiscal Impact Statement must not mark absorbed.' },
          { label: 'Private', text: 'everything runs in your browser. The draft is kept in this browser only, and nothing is sent anywhere.' },
        ]}
      >
        Resolutions in the 2026 agenda packets follow one layout: the number and a title in capitals, who offered and seconded it, WHEREAS
        clauses joined by “; and”, then “Now, therefore, be it” and RESOLVED clauses joined by “; and be it further”, with any budget
        adjustment as a FROM / TO table and the same two closing clauses. This builder writes that structure so you only write the
        substance. It is an aid, not the Town’s template: the Town Attorney and the Accounting Department review every resolution, and the
        Town Clerk assigns its number. Every resolution also needs a Fiscal Impact Statement; the{' '}
        <a href={`${base}/fiscal-impact-helper/`} style={link}>Fiscal impact statement helper</a> fills one in from the same accounts.
      </PlainCallout>
      <ResolutionBuilder year={year} accounts={accounts} />
    </PageShell>
  )
}
