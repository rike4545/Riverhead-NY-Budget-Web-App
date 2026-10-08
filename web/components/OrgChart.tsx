import titlesData from '../public/data/payroll/titles-by-year.json'
import { DEPARTMENTS, ELECTED, TOWN_DEPARTMENTS_SOURCE, fill, type FilledUnit, type OrgGroup, type PayrollDepartment } from '../lib/org-chart'

const data = titlesData as unknown as { departmentYears: number[]; source: { title: string; url: string }; departments: PayrollDepartment[] }
const YEAR = data.departmentYears[data.departmentYears.length - 1]

const card = { background: 'var(--rbl-surface)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 14, padding: 14 } as const
const muted = { color: 'var(--rbl-text-muted)', fontSize: 13.5, lineHeight: 1.5 } as const

/** A vertical line between levels of the chart. */
function Connector({ label }: { label?: string }) {
  return (
    <div aria-hidden style={{ display: 'grid', justifyItems: 'center', margin: '4px 0' }}>
      <div style={{ width: 1, height: 18, background: 'var(--rbl-border-strong)' }} />
      {label && <div style={{ ...muted, fontWeight: 600, padding: '2px 0' }}>{label}</div>}
      <div style={{ width: 1, height: 18, background: 'var(--rbl-border-strong)' }} />
    </div>
  )
}

function Unit({ u }: { u: FilledUnit }) {
  const listed = u.payroll.length > 0
  return (
    <div style={{ ...card, display: 'grid', alignContent: 'start', gap: 4 }}>
      <h4 style={{ margin: 0, fontSize: 16, color: 'var(--rbl-title)', lineHeight: 1.3 }}>{u.name}</h4>
      {u.head && <div style={{ fontSize: 13.5, color: 'var(--rbl-text-body)' }}>{u.headLabel ?? `Headed by the ${u.head}`}</div>}
      {listed ? (
        <div style={{ marginTop: 2 }}>
          <strong style={{ fontSize: 20, color: 'var(--rbl-title)' }}>{u.people.toLocaleString()}</strong>{' '}
          <span style={muted}>{u.people === 1 ? 'person' : 'people'} paid in {YEAR}{u.casual > 0 ? `, ${u.casual.toLocaleString()} of them seasonal or part-time` : ''}</span>
        </div>
      ) : (
        <div style={{ ...muted, marginTop: 2 }}>No payroll department of its own</div>
      )}
      {u.note && <p style={{ ...muted, margin: '2px 0 0' }}>{u.note}</p>}
      {u.titles.length > 0 && (
        <details style={{ marginTop: 4 }}>
          <summary style={{ cursor: 'pointer', color: 'var(--rbl-link)', fontWeight: 600, fontSize: 14 }}>
            {u.titles.length} job {u.titles.length === 1 ? 'title' : 'titles'}
          </summary>
          <ul style={{ listStyle: 'none', margin: '6px 0 0', padding: 0, display: 'grid', gap: 2 }}>
            {u.titles.map((t) => (
              <li key={t.title} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 13.5, borderTop: '1px solid var(--rbl-border-subtle)', paddingTop: 3 }}>
                <span style={{ color: 'var(--rbl-text-strong)' }}>{t.title}</span>
                <span style={{ color: 'var(--rbl-text-body)', fontVariantNumeric: 'tabular-nums' }}>{t.people}</span>
              </li>
            ))}
          </ul>
          {u.untitled > 0 && <div style={{ ...muted, marginTop: 4 }}>{u.untitled} {u.untitled === 1 ? 'person was' : 'people were'} paid with no title.</div>}
          <div style={{ ...muted, fontSize: 12.5, marginTop: 6 }}>Payroll codes: {u.payroll.join('; ')}</div>
        </details>
      )}
    </div>
  )
}

function Group({ group, units }: { group: OrgGroup; units: FilledUnit[] }) {
  const people = units.reduce((sum, u) => sum + u.people, 0)
  return (
    <section aria-labelledby={`org-${group.id}`} style={{ background: 'var(--rbl-surface-2)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 16, padding: 16 }}>
      <h3 id={`org-${group.id}`} style={{ margin: 0, fontSize: 18, color: 'var(--rbl-title)' }}>
        {group.name} <span style={{ color: 'var(--rbl-text-muted)', fontWeight: 600, fontSize: 14 }}>{people.toLocaleString()} people</span>
      </h3>
      <p style={{ ...muted, margin: '2px 0 12px' }}>{group.about}</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(230px,1fr))', gap: 10 }}>
        {units.map((u) => <Unit key={u.name} u={u} />)}
      </div>
    </section>
  )
}

export default function OrgChart() {
  const elected = ELECTED.units.map((u) => fill(u, data.departments, YEAR))
  const groups = DEPARTMENTS.map((g) => ({ group: g, units: g.units.map((u) => fill(u, data.departments, YEAR)) }))
  const all = elected.concat(...groups.map((g) => g.units))
  const people = all.reduce((sum, u) => sum + u.people, 0)
  const untitled = all.reduce((sum, u) => sum + u.untitled, 0)
  const titles = new Set(all.reduce<string[]>((list, u) => list.concat(u.titles.map((t) => t.title)), [])).size
  const departmentsWithStaff = data.departments.filter((d) => (d.counts[String(YEAR)] ?? 0) > 0).length

  return (
    <section id="organization" aria-labelledby="org-title" style={{ marginBottom: 32 }}>
      <h2 id="org-title" style={{ fontSize: 24, color: 'var(--rbl-title)', margin: '8px 0 6px' }}>How the Town is organized</h2>
      <p style={{ color: 'var(--rbl-text-body)', lineHeight: 1.6, margin: '0 0 6px' }}>
        Residents elect the Supervisor, four Council Members, the Town Clerk, the Superintendent of Highways, the Receiver of
        Taxes, the Assessors and two Town Justices. The Supervisor and the four Council Members make up the Town Board,
        which adopts the budget and oversees every other department. Below is every office and department, with every
        job title the Town paid in {YEAR} and how many people held it: <strong>{people.toLocaleString()} people</strong>,{' '}
        {(people - untitled).toLocaleString()} of them under {titles.toLocaleString()} job titles
        {untitled > 0 ? ` and ${untitled} paid with no title` : ''}.
      </p>
      <p style={{ ...muted, margin: '0 0 16px' }}>
        The Town’s report lists each person once a year, under one department and one title, so nobody is counted
        twice. A count takes in everyone paid at any point in the year, including people who joined or left partway
        through and the summer’s seasonal staff. Open a card to see its titles.
      </p>

      <div style={{ display: 'grid', justifyItems: 'center' }}>
        <div style={{ ...card, padding: '8px 16px', fontWeight: 700, color: 'var(--rbl-title)' }}>Riverhead residents, who vote</div>
      </div>
      <Connector />
      <Group group={ELECTED} units={elected} />
      <Connector label="The Town Board oversees" />
      <div style={{ display: 'grid', gap: 12 }}>
        {groups.map(({ group, units }) => <Group key={group.id} group={group} units={units} />)}
      </div>

      <p style={{ ...muted, marginTop: 14 }}>
        The Town publishes no organization chart, so this one is put together from its own records. Which offices are
        elected comes from the payroll’s department codes, which mark them. The departments and their names come from the{' '}
        <a href={TOWN_DEPARTMENTS_SOURCE.url} target="_blank" rel="noreferrer" style={{ color: 'var(--rbl-link)', fontWeight: 600 }}>Town’s list of departments</a>{' '}
        (read {TOWN_DEPARTMENTS_SOURCE.read}). The people and titles come from the{' '}
        <a href={data.source.url} target="_blank" rel="noreferrer" style={{ color: 'var(--rbl-link)', fontWeight: 600 }}>{data.source.title}</a>.
        Which of the payroll’s {departmentsWithStaff} department codes belong to which department is this site’s reading of
        their names and of the budget’s departments; each card lists its codes. A payroll code is the department the
        payroll report lists a person under, and the budget can group the same people differently: the payroll lists
        the code enforcement officers under the Town Attorney, while the budget has a Code Enforcement department. A
        head is named only where the payroll pays a title that names the role.
      </p>
    </section>
  )
}
