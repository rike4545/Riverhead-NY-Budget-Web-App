import PageShell from '../../components/PageShell'
import RecordTrail from '../../components/RecordTrail'
import DataStatus from '../../components/DataStatus'

export const metadata = {
  title: 'Evidence & Sources — how to verify the numbers',
  description: 'A plain-English guide to how Riverhead Budget Live labels, calculates, and sources its public financial information.',
}

const card = {
  background: 'var(--rbl-surface)',
  border: '1px solid var(--rbl-border-subtle)',
  borderRadius: 18,
  padding: 20,
  boxShadow: '0 14px 34px var(--rbl-shadow)',
} as const

const base = process.env.NEXT_PUBLIC_BASE_PATH || ''

export default function EvidencePage() {
  return (
    <PageShell
      title="Evidence & Sources"
      subtitle="Use this page to understand what Riverhead Budget Live is reporting, what it calculates, and where to verify the underlying record."
    >
      <section style={{ ...card, marginBottom: 18, borderLeft: '6px solid var(--rbl-page-accent)' }}>
        <div style={{ color: 'var(--rbl-badge)', fontSize: 11, fontWeight: 950, letterSpacing: 1.1, textTransform: 'uppercase' }}>Start here</div>
        <h2 style={{ margin: '5px 0 8px', fontSize: 24 }}>A number should come with a path back to the record.</h2>
        <p style={{ color: 'var(--rbl-text-body)', lineHeight: 1.65, margin: 0, maxWidth: 920 }}>
          This project combines official public records with calculations that make those records easier to understand. The label matters: a Town-reported figure, a calculation made from Town records, and a forward-looking scenario are not the same thing.
        </p>
      </section>

      <section style={{ ...card, marginBottom: 18 }}>
        <h2 style={{ marginTop: 0 }}>How to read the labels</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 12 }}>
          <EvidenceCard status="official" title="Official source" text="Reported directly in a cited Town or other official public record." />
          <EvidenceCard status="calculated" title="Calculated from source data" text="Computed by the site from cited records. The calculation is ours; the underlying records are not." />
          <EvidenceCard status="projected" title="Projection / scenario" text="Forward-looking or hypothetical. Read the assumptions before treating it as a forecast." />
        </div>
      </section>

      <RecordTrail
        title="Go from a question to the underlying record"
        intro="These are the main evidence paths across the site. Start with the subject that interests you, then move from the summary into the underlying detail."
        items={[
          { href: '/tax-bill/', label: 'My Taxes', text: 'Published tax rates, the Town-only estimator, and levy allocation by fund.' },
          { href: '/compare/', label: 'Budget Changes', text: 'Year-over-year appropriations and the funds responsible for the biggest moves.' },
          { href: '/funds/', label: 'Funds & Accounts', text: 'Fund, department, category, and account-level budget records.' },
          { href: '/payroll/', label: 'People & Pay', text: 'Actual earnings, authorized salaries, raises, and overtime.' },
          { href: '/meetings/', label: 'Board Votes', text: 'Resolution-by-resolution voting records and meeting context.' },
          { href: '/sources/', label: 'Source Library', text: 'The official documents and source trail used by the site.' },
        ]}
      />

      <section style={{ ...card, marginTop: 18 }}>
        <h2 style={{ marginTop: 0 }}>Three rules for using the site</h2>
        <div style={{ display: 'grid', gap: 10 }}>
          <Rule n="1" title="Prefer the cited record." text="When a page links to a source document, use that document to verify the underlying figure." />
          <Rule n="2" title="Separate reporting from calculation." text="A computed percentage, total, comparison, or estimate may be mathematically correct without being a number the Town itself reported." />
          <Rule n="3" title="Read the scope." text="Town taxes are not the same as the full property-tax bill; appropriations are not the same as actual spending; a scenario is not a prediction." />
        </div>
        <a href={`${base}/sources/`} style={{ display: 'inline-block', marginTop: 16, color: 'var(--rbl-link)', fontWeight: 900, textDecoration: 'none' }}>Open the Source Library →</a>
      </section>
    </PageShell>
  )
}

function EvidenceCard({ status, title, text }: { status: 'official' | 'calculated' | 'projected'; title: string; text: string }) {
  return (
    <article style={{ background: 'var(--rbl-surface-2)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 14, padding: 15 }}>
      <DataStatus status={status} text={title} />
      <p style={{ color: 'var(--rbl-text-body)', lineHeight: 1.5, marginBottom: 0 }}>{text}</p>
    </article>
  )
}

function Rule({ n, title, text }: { n: string; title: string; text: string }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '34px 1fr', gap: 12, alignItems: 'start', borderTop: '1px solid var(--rbl-border-subtle)', paddingTop: 12 }}>
      <span style={{ width: 32, height: 32, borderRadius: '50%', display: 'grid', placeItems: 'center', background: 'var(--rbl-fill-accent)', color: 'white', fontWeight: 950 }}>{n}</span>
      <div>
        <strong style={{ color: 'var(--rbl-title)' }}>{title}</strong>
        <p style={{ color: 'var(--rbl-text-muted)', margin: '4px 0 0', lineHeight: 1.5 }}>{text}</p>
      </div>
    </div>
  )
}
