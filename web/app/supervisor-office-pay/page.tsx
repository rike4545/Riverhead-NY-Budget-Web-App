import PageShell from '../../components/PageShell'
import PlainCallout from '../../components/PlainCallout'
import { ROLES, RIVERHEAD_SERVICE, SUPERVISOR_START_SOURCE, formatServiceDate, riverheadRoles, compare, percentFrom, peerSalary, type Peer, type RoleKey, type SalaryRecord } from '../../lib/supervisor-office-pay'
import peerData from '../../public/data/salary/peer-supervisor-offices.json'
import pep from '../../public/data/census-pep.json'
import a2023 from '../../public/data/salary/authorized-2023.json'
import a2024 from '../../public/data/salary/authorized-2024.json'
import a2025 from '../../public/data/salary/authorized-2025.json'
import a2026 from '../../public/data/salary/authorized-2026.json'

const base = process.env.NEXT_PUBLIC_BASE_PATH || ''
const card = { background: 'var(--rbl-surface)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 16, padding: 20, marginBottom: 16 } as const
const h2 = { margin: '0 0 8px', color: 'var(--rbl-title)', fontSize: 21 } as const
const prose = { margin: '0 0 10px', color: 'var(--rbl-text-body)', fontSize: 16, lineHeight: 1.6, maxWidth: '75ch' } as const
const help = { color: 'var(--rbl-text-muted)', fontSize: 14, lineHeight: 1.5 } as const
const link = { color: 'var(--rbl-link)', fontWeight: 600 } as const
const th = { textAlign: 'left', padding: '8px', borderBottom: '1px solid var(--rbl-border)', color: 'var(--rbl-text-strong)', fontWeight: 700, verticalAlign: 'bottom' } as const
const td = { padding: '8px', borderBottom: '1px solid var(--rbl-border-subtle)', color: 'var(--rbl-text-body)', verticalAlign: 'top' } as const
const money = { fontVariantNumeric: 'tabular-nums', fontWeight: 700, color: 'var(--rbl-text-strong)' } as const

const usd = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: n % 1 ? 2 : 0, minimumFractionDigits: n % 1 ? 2 : 0 }).format(n)
const usd0 = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
const listed = (xs: string[]) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`)

const peers = peerData.peers as Peer[]
const townNames = listed(peers.map((p) => p.town))

export const metadata = {
  title: 'Supervisor’s office pay compared',
  description: `The 2026 salaries of the five roles in the Riverhead Supervisor’s office, set beside the same roles in ${townNames}, from each town’s own records.`,
}

const rh = riverheadRoles(a2026.records as SalaryRecord[])
const rows = compare(rh, peers)
const population = (name: string) => (pep.towns as { name: string; estimates: Record<string, number> }[]).find((t) => t.name === name)?.estimates[String(pep.vintage)] ?? null
const rhPop = population('Riverhead town') ?? 1
const BUDGETED_SUPERVISOR_2026 = 118919
const history = ([[2023, a2023], [2024, a2024], [2025, a2025], [2026, a2026]] as const).map(([y, a]) => ({ year: y, ...riverheadRoles(a.records as SalaryRecord[]) }))
const sal = (p: Peer, role: RoleKey) => peerSalary(p, role)?.salary ?? null
/** "Southampton’s $149,773 (Riverhead 27% less)": Riverhead's difference from one peer. */
const vs = (p: Peer, role: RoleKey, mine: number) => {
  const s = sal(p, role)
  if (s === null) return null
  const d = percentFrom(mine, s)
  return `${p.town}’s ${usd0(s)} (Riverhead ${Math.abs(d).toFixed(0)}% ${d < 0 ? 'less' : 'more'})`
}
const sizeText = peers.map((p) => {
  const r = (population(p.censusName) ?? 0) / rhPop
  return r < 1 ? `${p.town} ${Math.round(r * 100)}% as many` : `${p.town} ${r.toFixed(1)} times as many`
})
const smallerPeers = peers.filter((p) => (population(p.censusName) ?? 0) < rhPop).length
const ordinal = ['smallest', 'second smallest', 'third smallest', 'fourth smallest', 'fifth smallest', 'sixth smallest', 'seventh smallest']
const countWord = (n: number) => ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'][n] ?? String(n)
const largest = Math.max(...peers.map((p) => (population(p.censusName) ?? 0) / rhPop))

export default function SupervisorOfficePayPage() {
  const sup = rh.supervisor ?? 0
  const dep = rh.deputy ?? 0
  const aide = rh.aide ?? 0
  const supAbove = peers.filter((p) => (sal(p, 'supervisor') ?? 0) > sup)
  const fullTimeDeputies = peers.filter((p) => (sal(p, 'deputy') ?? 0) >= 0.5 * (sal(p, 'supervisor') ?? Infinity))
  const stipendDeputies = peers.filter((p) => sal(p, 'deputy') !== null && !fullTimeDeputies.includes(p))
  const budgetPeers = peers.filter((p) => sal(p, 'budget') !== null)
  const smithtown = peers.find((p) => p.town === 'Smithtown')
  return (
    <PageShell
      title="Supervisor’s office pay compared"
      subtitle={`The 2026 salaries of the five roles in the Riverhead Supervisor’s office, beside the same roles in ${townNames}, from each town’s own records.`}
    >
      <PlainCallout
        tips={[
          { label: 'Five roles, four people', text: 'Riverhead’s Chief of Staff is also its Town Budget Officer, paid one salary.' },
          { label: 'Base salary', text: 'pay before benefits, longevity and overtime. The towns’ records differ in what else they list.' },
          { label: 'Counterpart', text: 'the title doing the same job in another town. Where a town has none, the table says so.' },
        ]}
      >
        Every Riverhead figure is from the Town’s 2026 salary schedule in the January 6, 2026 agenda packet. Each other town’s figures are from its own
        2026 records: an adopted budget, a salary chart or the salary resolutions of its organizational meeting, each linked below. Towns organize the
        Supervisor’s office differently, so a lower or higher salary can reflect a different job rather than different pay for the same one. For
        Riverhead’s other management salaries, see <a href={`${base}/management-compensation/`} style={link}>Management pay and benefits</a>.
      </PlainCallout>

      <section style={card} aria-labelledby="riverhead-roles">
        <h2 id="riverhead-roles" style={h2}>Riverhead’s Supervisor’s office in 2026</h2>
        <div data-scroll-region style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 15 }}>
            <thead><tr><th scope="col" style={th}>Role</th><th scope="col" style={th}>What it does</th><th scope="col" style={{ ...th, textAlign: 'right' }}>2026 salary</th></tr></thead>
            <tbody>
              {ROLES.map((r) => (
                <tr key={r.key}>
                  <th scope="row" style={{ ...td, fontWeight: 700, color: 'var(--rbl-text-strong)' }}>{r.label}<div style={{ ...help, fontWeight: 400, fontSize: 13 }}>{r.riverheadTitle}</div></th>
                  <td style={td}>{r.what}</td>
                  <td style={{ ...td, textAlign: 'right', whiteSpace: 'nowrap' }}>
                    {r.key === 'budget' ? <span style={help}>Same salary as Chief of Staff</span> : rh[r.key] === null ? '—' : <span style={money}>{usd(rh[r.key] as number)}</span>}
                    {r.key === 'supervisor' && <div style={{ ...help, fontSize: 13 }}>Reduced from {usd0(BUDGETED_SUPERVISOR_2026)} budgeted</div>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ ...help, margin: '10px 0 0' }}>
          The 2026 schedule marks the Supervisor’s salary “reduced from budgeted amount of $118,919”. Resolution 2026-60 has the Deputy Supervisor serve
          “in a full-time capacity”. Resolution 2026-59 acknowledges the Chief of Staff, who serves “under all terms and conditions previously adopted” and
          appears in the schedule as Town Budget Officer. Resolution 2026-58 appoints the Legislative Aide, listed in the schedule as Secretary, at $59,740.45.
        </p>
      </section>

      <section style={card} aria-labelledby="compared" data-supervisor-comparison>
        <h2 id="compared" style={h2}>Compared with {townNames}</h2>
        <div data-scroll-region style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14.5, minWidth: 760 }}>
            <thead>
              <tr>
                <th scope="col" style={th}>Role</th>
                <th scope="col" style={th}>Riverhead<div style={{ ...help, fontWeight: 400, fontSize: 13 }}>{rhPop.toLocaleString('en-US')} residents</div></th>
                {peers.map((p) => <th key={p.town} scope="col" style={th}>{p.town}<div style={{ ...help, fontWeight: 400, fontSize: 13 }}>{population(p.censusName)?.toLocaleString('en-US')} residents</div></th>)}
              </tr>
            </thead>
            <tbody>
              {rows.map(({ role, riverhead, cells }) => (
                <tr key={role.key}>
                  <th scope="row" style={{ ...td, fontWeight: 700, color: 'var(--rbl-text-strong)' }}>{role.label}</th>
                  <td style={td}>
                    {role.key === 'budget' ? <span style={help}>Combined with Chief of Staff</span> : riverhead === null ? '—' : <span style={money}>{usd(riverhead)}</span>}
                    {role.key !== 'budget' && RIVERHEAD_SERVICE[role.key] && <div style={{ ...help, fontSize: 13 }}>{RIVERHEAD_SERVICE[role.key]}</div>}
                  </td>
                  {cells.map((c) => (
                    <td key={c.town} style={td}>
                      {c.salary === null
                        ? <span style={help}>{c.missing}</span>
                        : <>
                            <span style={money}>{usd(c.salary)}</span>
                            <div style={{ fontSize: 13.5 }}>{c.titles.join('; ')}</div>
                            {c.serviceDate && <div style={{ ...help, fontSize: 13 }}>Service date {formatServiceDate(c.serviceDate)}</div>}
                            {!c.inOffice && <div style={{ ...help, fontSize: 13, fontWeight: 700 }}>Outside the Supervisor’s office</div>}
                            {c.notes.map((n, i) => <div key={i} style={{ ...help, fontSize: 13 }}>{n}</div>)}
                          </>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ ...help, margin: '10px 0 0' }}>
          A service date is the hire date a town’s record prints beside the salary; of the records here, only Brookhaven’s schedule
          lists them. It dates service with the town, so it can be earlier than the current title. Riverhead’s hire years are from the Hire Date column of the Town’s 2025 Gross Earnings report, and its aide’s
          start from Resolution 2026-58. No Town record on file gives the Supervisor’s start; it is from a news report,{' '}
          <a href={SUPERVISOR_START_SOURCE.url} style={link}>{SUPERVISOR_START_SOURCE.title}</a> (the Thursday was January 1, 2026). Populations are the Census Bureau’s estimates for {pep.asOf}. Sources:{' '}
          {peers.map((p, i) => <span key={p.town}>{i ? '; ' : ''}<a href={p.source.url} style={link}>{p.source.title}</a>{p.source.transcribed ? ' (a scanned page, transcribed by hand; the budget book prints its salary appendix at the tentative stage)' : ''}</span>)}.
        </p>
      </section>

      <section style={card} aria-labelledby="what-it-shows">
        <h2 id="what-it-shows" style={h2}>What the comparison shows</h2>
        <ul style={{ ...prose, paddingLeft: 20, display: 'grid', gap: 10 }}>
          <li>
            <strong>Supervisor.</strong> At {usd0(sup)}, Riverhead’s Supervisor is paid {supAbove.length === peers.length ? `less than in any of the ${peers.length} other towns` : `less than in ${supAbove.length} of the ${peers.length} other towns`}:{' '}
            {listed(peers.map((p) => vs(p, 'supervisor', sup)).filter((x): x is string => x !== null))}.
            {peers.every((p) => (sal(p, 'supervisor') ?? 0) > BUDGETED_SUPERVISOR_2026) && <> The {usd0(BUDGETED_SUPERVISOR_2026)} the budget set aside would also have been the lowest.</>}{' '}
            Riverhead is the {smallerPeers === peers.length ? 'largest' : ordinal[smallerPeers] ?? 'smallest'} of the {countWord(peers.length + 1)} by population; against its residents, {listed(sizeText)}.
          </li>
          <li>
            <strong>Deputy Supervisor.</strong> Towns use the job differently. Riverhead’s deputy serves full time at {usd0(dep)}, {Math.round((dep / sup) * 100)}% of the
            Supervisor’s salary.{' '}
            {fullTimeDeputies.length > 0 && <>{listed(fullTimeDeputies.map((p) => `${p.town} also pays a full salary (${usd0(sal(p, 'deputy') ?? 0)}, ${Math.round(((sal(p, 'deputy') ?? 0) / (sal(p, 'supervisor') ?? 1)) * 100)}% of its Supervisor’s)`))}. </>}
            {stipendDeputies.length > 0 && <>{listed(stipendDeputies.map((p) => `${p.town} pays ${usd0(sal(p, 'deputy') ?? 0)}`))} for the year, so there it is not a full-time salary{smithtown && stipendDeputies.includes(smithtown) ? '; Smithtown’s deputy is a Town Board member' : ''}.</>}
          </li>
          <li>
            <strong>Chief of Staff and Budget Officer.</strong> None of the {peers.length} other towns’ records lists a chief of staff. For budget work,
            {' '}{listed(budgetPeers.map((p) => { const r = peerSalary(p, 'budget')!; return `${p.town} has a ${r.title} (${usd0(r.salary)}, ${r.inOffice === false ? 'outside' : 'in'} the Supervisor’s office)` }))}.
            {' '}Riverhead’s combined role is paid {usd0(rh.chief ?? 0)}{budgetPeers.every((p) => (sal(p, 'budget') ?? 0) > (rh.chief ?? 0)) ? ', less than any of them' : ''}.
            {smithtown && sal(smithtown, 'budget') !== null && <> Smithtown’s Town Budget Officer has the same title as Riverhead’s, at {usd0(sal(smithtown, 'budget') ?? 0)}, though in its Comptroller’s department. The Comptrollers run whole finance departments, a larger job than Riverhead’s role.</>}
          </li>
          <li>
            <strong>Legislative Aide or Secretary.</strong> Riverhead’s {usd0(aide)} compares with {listed(peers.map((p) => { const r = peerSalary(p, 'aide'); return r ? `${p.town}’s ${r.title} at ${usd0(r.salary)}` : null }).filter((x): x is string => x !== null))}.
            {' '}Riverhead’s aide was appointed in January 2026, and pay for these posts usually rises with years of service (Southold’s resolution adds
            longevity pay to both of its secretaries), so part of any gap may be tenure rather than the job.
          </li>
        </ul>
        <p style={{ ...help, margin: 0 }}>
          This is a starting point, not a pay study. A full one would match duties, hours, tenure and benefits. Larger towns run larger offices: the
          biggest here has {largest.toFixed(1)} times Riverhead’s residents.
        </p>
      </section>

      <section style={card} aria-labelledby="history">
        <h2 id="history" style={h2}>Riverhead’s salaries for these roles since 2023</h2>
        <div data-scroll-region style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 15 }}>
            <thead>
              <tr><th scope="col" style={th}>Year</th><th scope="col" style={{ ...th, textAlign: 'right' }}>Supervisor</th><th scope="col" style={{ ...th, textAlign: 'right' }}>Deputy Supervisor</th><th scope="col" style={{ ...th, textAlign: 'right' }}>Budget Officer (and Chief of Staff)</th><th scope="col" style={{ ...th, textAlign: 'right' }}>Secretary</th></tr>
            </thead>
            <tbody>
              {history.map((h) => (
                <tr key={h.year}>
                  <th scope="row" style={{ ...td, fontWeight: 700 }}>{h.year}</th>
                  {(['supervisor', 'deputy', 'budget', 'aide'] as const).map((k) => <td key={k} style={{ ...td, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{h[k] === null ? <span style={help}>Not listed</span> : usd(h[k] as number)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ ...help, margin: '10px 0 0' }}>From the Town Board’s January salary resolutions each year. A role shows as not listed when that year’s resolution does not name it in the Supervisor’s office.</p>
      </section>

      <section style={card} aria-labelledby="not-included" data-not-included>
        <h2 id="not-included" style={h2}>Towns not included, and why</h2>
        <ul style={{ ...prose, paddingLeft: 20, margin: 0 }}>
          {peerData.notFound.map((n) => <li key={n.town}><strong>{n.town}.</strong> {n.why}</li>)}
        </ul>
      </section>
    </PageShell>
  )
}
