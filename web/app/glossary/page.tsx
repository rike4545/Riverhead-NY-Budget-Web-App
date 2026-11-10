import PageShell from '../../components/PageShell'
import PlainCallout from '../../components/PlainCallout'
import Glossary from '../../components/Glossary'
import { glossaryEntries, glossaryCategories } from '../../lib/glossary'

const base = process.env.NEXT_PUBLIC_BASE_PATH || ''
const link = { color: 'var(--rbl-link)', fontWeight: 600 } as const

export const metadata = {
  title: 'Glossary of budget and Town terms',
  description: 'Plain-English definitions of the budget, tax, accounting, debt, pay and Town Board words used on this site, with a link to the page where each one matters.',
}

export default function GlossaryPage() {
  return (
    <PageShell
      title="Glossary of budget and Town terms"
      subtitle={`${glossaryEntries.length} words used in Riverhead’s budgets, audits and Town Board meetings, each in a sentence or two of plain English.`}
    >
      <PlainCallout
        tips={[
          { label: 'Search', text: 'type part of a word. It looks in the definitions too, so “savings” finds fund balance and reserves.' },
          { label: 'Topics', text: `pick one of the ${glossaryCategories.length} topics to see only those terms.` },
          { label: 'Where it matters', text: 'most terms link to the page on this site where the figure appears.' },
        ]}
      >
        Town finance has its own vocabulary. This page explains each word the site uses, in the order you would look it up. For how the
        ideas fit together, such as why the Town keeps separate funds or why the audit and the budget can show different numbers, read{' '}
        <a href={`${base}/accounting-basics/`} style={link}>How the Town’s books work</a>.
      </PlainCallout>

      <Glossary />

      <p style={{ color: 'var(--rbl-text-muted)', fontSize: 14, lineHeight: 1.6, maxWidth: '75ch', marginTop: 20 }}>
        These definitions are a plain-English aid written for this site, not legal definitions. Where a term comes from State law or an
        accounting standard, the page it links to names the source. Underlined words with a small question mark elsewhere on the site open
        the same definitions.
      </p>
    </PageShell>
  )
}
