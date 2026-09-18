import PageShell from '../../components/PageShell'
import PlainCallout from '../../components/PlainCallout'
import WorkforceByTitle from '../../components/WorkforceByTitle'
import WorkforceByDepartment from '../../components/WorkforceByDepartment'

export const metadata = {
  title: 'Workforce by Title and Department — headcount by job, 2022–2025',
  description:
    'How many Town of Riverhead employees hold each civil-service title, how many work in each department, and which titles sit in which department — year over year (2022–2025), searchable and sortable, from the Town’s own Gross Earnings reports.',
}

export default function WorkforceByTitlePage() {
  return (
    <PageShell
      title="Workforce by Title"
      subtitle="How many people hold each job title, how many work in each department, and which titles sit inside which department — 2022 to 2025. Search either view, or sort by the biggest increases and decreases."
    >
      <PlainCallout
        tips={[
          { label: 'What a row shows', text: 'the number of distinct employees paid under that title each year, and the net change from 2022 to 2025.' },
          { label: 'Seasonal spikes', text: 'part-time and seasonal roles — lifeguards, recreation aides, beach attendants — run high because everyone paid during the summer counts for that year.' },
          { label: 'Why it starts in 2022', text: 'the Town’s gross-earnings exports only carry job titles from 2022 onward; earlier years have pay but no title.' },
        ]}
      >
        This is the staffing side of the payroll data: not what people are paid, but <strong>how many hold each job</strong>{' '}
        and whether that job is growing or shrinking. Below the titles, the same staff are counted{' '}
        <strong>by department</strong>, with the titles inside each one. For individual pay, use the{' '}
        <a href="/payroll/" style={{ color: 'var(--rbl-accent)', fontWeight: 800 }}>Payroll Explorer</a>.
      </PlainCallout>

      <div style={{ marginTop: 16 }}>
        <WorkforceByTitle />
      </div>

      <h2 id="by-department" style={{ fontSize: 22, color: 'var(--rbl-title)', marginTop: 34, marginBottom: 6 }}>
        Staff by department
      </h2>
      <p style={{ color: 'var(--rbl-text-body)', fontSize: 14.5, lineHeight: 1.6, marginTop: 0, marginBottom: 14 }}>
        The same employees, counted by where they work rather than by what they are called. Open a department to
        see the titles inside it. These are the payroll&apos;s own department codes, not an organization chart — the
        Police Department arrives as its squads, COPE, Detectives, K-9 and Headquarters rather than as one line, so
        read them as cost centers. A title can appear in several departments at once: in 2025 a{' '}
        <strong>Police Officer</strong> is paid out of nine of them, and an <strong>Account Clerk</strong> out of ten.
      </p>

      <WorkforceByDepartment />
    </PageShell>
  )
}
