import PageShell from '../../components/PageShell'
import PlainCallout from '../../components/PlainCallout'
import OrgChart from '../../components/OrgChart'
import WorkforceByTitle from '../../components/WorkforceByTitle'
import WorkforceByDepartment from '../../components/WorkforceByDepartment'

const base = process.env.NEXT_PUBLIC_BASE_PATH || ''

export const metadata = {
  title: 'Workforce by Title — organization chart and headcount by job, 2022–2025',
  description:
    'How the Town of Riverhead is organized: the offices residents elect, the departments the Town Board oversees, and every job title each one paid in 2025. Then how many employees hold each civil-service title and work in each department, 2022 to 2025, from the Town’s own Gross Earnings reports.',
}

const PARTS = [
  { id: 'organization', label: 'How the Town is organized' },
  { id: 'by-title', label: 'Staff by job title' },
  { id: 'by-department', label: 'Staff by department' },
]

export default function WorkforceByTitlePage() {
  return (
    <PageShell
      title="Workforce by Title"
      subtitle="Who runs what: the offices residents elect, the departments the Town Board oversees, and every job title inside each. Then how many people hold each title and work in each department, 2022 to 2025."
    >
      <PlainCallout
        tips={[
          { label: 'What a count shows', text: 'the number of distinct employees paid under that title or in that department during the year.' },
          { label: 'Seasonal spikes', text: 'part-time and seasonal roles, such as lifeguards, recreation aides and beach attendants, run high because everyone paid during the summer counts for that year.' },
          { label: 'Why it starts in 2022', text: 'the Town’s gross-earnings exports only carry job titles from 2022 onward; earlier years have pay but no title.' },
          { label: 'Hired vs. moved', text: 'a net change hides its two sides. “Hired” and “left” mean the person was not on the Town payroll at all in the other year; “moved” means they stayed and were retitled or reassigned.' },
        ]}
      >
        This is the staffing side of the payroll data: not what people are paid, but <strong>who does which job</strong>{' '}
        and whether that job is growing or shrinking. It starts with how the Town is organized, then counts the same staff{' '}
        <strong>by job title</strong> and <strong>by department</strong>. For individual pay, use the{' '}
        <a href={`${base}/payroll/`} style={{ color: 'var(--rbl-link)', fontWeight: 600 }}>Payroll Explorer</a>.
      </PlainCallout>

      <nav aria-label="On this page" style={{ display: 'flex', flexWrap: 'wrap', gap: 8, margin: '16px 0 20px' }}>
        {PARTS.map((p) => (
          <a
            key={p.id}
            href={`#${p.id}`}
            style={{
              textDecoration: 'none', background: 'var(--rbl-surface-2)', border: '1px solid var(--rbl-border-subtle)',
              borderRadius: 999, padding: '6px 13px', color: 'var(--rbl-title)', fontSize: 14, fontWeight: 600,
            }}
          >
            {p.label}
          </a>
        ))}
      </nav>

      <OrgChart />

      <h2 id="by-title" style={{ fontSize: 22, color: 'var(--rbl-title)', marginTop: 34, marginBottom: 6 }}>
        Staff by job title
      </h2>
      <p style={{ color: 'var(--rbl-text-body)', fontSize: 14.5, lineHeight: 1.6, marginTop: 0, marginBottom: 14 }}>
        Every civil-service title the Town paid from 2022 to 2025, with how many people held it each year. Search
        for a title, or sort by the biggest increases and decreases.
      </p>
      <WorkforceByTitle />

      <h2 id="by-department" style={{ fontSize: 22, color: 'var(--rbl-title)', marginTop: 34, marginBottom: 6 }}>
        Staff by department
      </h2>
      <p style={{ color: 'var(--rbl-text-body)', fontSize: 14.5, lineHeight: 1.6, marginTop: 0, marginBottom: 14 }}>
        The same employees, counted by where they work rather than by what they are called. Open a department to
        see the titles inside it. These are the payroll&apos;s own department codes, which the{' '}
        <a href="#organization" style={{ color: 'var(--rbl-link)', fontWeight: 600 }}>organization chart</a> above
        gathers into the Town&apos;s departments. Here the Police Department arrives as its squads, COPE, Detectives,
        K-9 and Headquarters rather than as one line, so read them as cost centers. A title can appear in several
        departments at once: in 2025 a <strong>Police Officer</strong> is paid out of nine of them, and an{' '}
        <strong>Account Clerk</strong> out of ten.
      </p>
      <p style={{ color: 'var(--rbl-text-body)', fontSize: 14.5, lineHeight: 1.6, marginTop: 0, marginBottom: 14 }}>
        <strong>A net change is not a hiring figure</strong>, so each row also shows the flows underneath it. Two
        distinctions do the work. The first is <em>left</em> versus <em>moved</em>: when{' '}
        <strong>Heavy Equipment Operator</strong> fell from 15 to 6, nobody was let go and nobody was hired. Nine of
        those people were retitled, mostly to Construction Equip Operator, and kept working for the Town. A net
        column alone reads that as staff losses.
      </p>
      <p style={{ color: 'var(--rbl-text-body)', fontSize: 14.5, lineHeight: 1.6, marginTop: 0, marginBottom: 14 }}>
        The second is <strong>who counts as staff at all</strong>. Riverhead employs a large casual workforce: 199
        people in 2025 in the pay classes it marks NON-TIME, Part Time or Seasonal, at a median of about{' '}
        <strong>$3,900</strong> against roughly <strong>$79,000</strong> for regular staff. Recreation is the extreme
        case: <strong>132 people, of whom 126 are seasonal or part-time and 6 are permanent</strong>. Counting a
        lifeguard&apos;s summer as a hire and their absence next June as a departure would have shown Recreation
        hiring 123 people and losing 104, when its permanent staff saw one of each. So the arrival and departure
        figures count regular staff only, and the seasonal headcount is shown beside them instead of being folded in.
        That group is not purely seasonal: appointed board members paid a stipend file no time card either, and land
        in the same classes.
      </p>
      <p style={{ color: 'var(--rbl-text-body)', fontSize: 14.5, lineHeight: 1.6, marginTop: 0, marginBottom: 14 }}>
        Whether a post is genuinely new or is backfilling a vacancy is a further question this payroll data cannot
        settle; that would need the Town&apos;s authorized position schedule, which this site does not yet parse.
      </p>

      <WorkforceByDepartment />
    </PageShell>
  )
}
