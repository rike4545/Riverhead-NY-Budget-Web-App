import PageShell from '../../components/PageShell'
import PlainCallout from '../../components/PlainCallout'
import WorkforceByTitle from '../../components/WorkforceByTitle'

export const metadata = {
  title: 'Workforce by Title — headcount by job, 2022–2025',
  description:
    'How many Town of Riverhead employees hold each civil-service title, and how that headcount has changed year over year (2022–2025) — searchable and sortable, from the Town’s own Gross Earnings reports.',
}

export default function WorkforceByTitlePage() {
  return (
    <PageShell
      title="Workforce by Title"
      subtitle="How many people hold each job title — and how each title’s headcount has changed from 2022 to 2025. Search a title or sort by the biggest increases and decreases."
    >
      <PlainCallout
        tips={[
          { label: 'What a row shows', text: 'the number of distinct employees paid under that title each year, and the net change from 2022 to 2025.' },
          { label: 'Seasonal spikes', text: 'part-time and seasonal roles — lifeguards, recreation aides, beach attendants — run high because everyone paid during the summer counts for that year.' },
          { label: 'Why it starts in 2022', text: 'the Town’s gross-earnings exports only carry job titles from 2022 onward; earlier years have pay but no title.' },
        ]}
      >
        This is the staffing side of the payroll data: not what people are paid, but <strong>how many hold each job</strong>{' '}
        and whether that job is growing or shrinking. For individual pay, use the{' '}
        <a href="/payroll/" style={{ color: '#4a7297', fontWeight: 800 }}>Payroll Explorer</a>.
      </PlainCallout>

      <div style={{ marginTop: 16 }}>
        <WorkforceByTitle />
      </div>
    </PageShell>
  )
}
