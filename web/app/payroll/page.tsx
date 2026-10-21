import PageShell from '../../components/PageShell'
import PayrollTabs from '../../components/PayrollTabs'
import PlainCallout from '../../components/PlainCallout'
import { payrollYears, unionLabels } from '../../lib/payroll'
import {
  rankTrends, flaggedRanks, costComparisons, individualRatioCheck, totalOpportunityMid,
  BENEFIT_LOAD, OT_PREMIUM, latestYear, caveats, sourceNote, finalYearOvertimeCheck,
} from '../../lib/overtime-staffing'
import {
  separationSummary, compensatedAbsences, liabilityOneYearChange, liabilityTwoYearChange,
  whyItMattersNow, caveats as separationCaveats, whatWouldSettleIt,
} from '../../lib/separation-pay'
import { fileNumbers } from '../../lib/file-numbers'
import personnelActions from '../../public/data/meetings/personnel-actions.json'
import authorized2026 from '../../public/data/salary/authorized-2026.json'
import payrollRecords from '../../public/data/payroll/records.json'
import { CSEA_2027, ELECTED_2027, raises2027, type Authorized, type PayrollRow } from '../../lib/raises-2027'
import { triborough, units as laborUnits } from '../../lib/labor-contracts-2027'
import { AMENDMENTS, VOTES as AMENDMENT_VOTES } from '../../lib/budget-amendments-2027'
import { BENEFIT_LOAD_BASIS, explainer as benefitExplainer, source as benefitSource } from '../../lib/benefit-load'

export const metadata = {
  title: 'Payroll Explorer — employee pay, overtime & salaries',
  description:
    'Search actual Town of Riverhead employee pay 2018–2025 (base, overtime, gross), Board-authorized salaries for 2025 and 2026, and every raise between them.',
}

export default function PayrollPage() {
  return (
    <PageShell
      title="Riverhead Payroll Explorer"
      subtitle={`A searchable, SeeThroughNY-style record of actual Town of Riverhead employee earnings ${payrollYears[0]}–${payrollYears[payrollYears.length - 1]} — base pay, overtime, and total gross pay by employee, title, department, and union.`}
    >
      <PlainCallout
        tips={[
          { label: 'Start with Employees & Pay', text: 'Search a name, title, or department to see what employees were actually paid. Click an employee name to follow that person across years.' },
          { label: 'Actual vs. authorized', text: 'Actual pay is what appeared in the payroll record. Authorized salary is the base pay the Board set; overtime, longevity, and buy-outs can make actual gross pay higher.' },
          { label: 'Analysis layers', text: 'Salaries & Raises, Overtime & Staffing, Separation Pay, and Police Pay Steps answer narrower questions after you understand the underlying payroll record.' },
        ]}
      >
        <strong>Start with the public record.</strong> This page lets you search what Riverhead employees were actually paid, then move into salary, overtime, separation-pay, and police-step analysis. The analytical views are built on the underlying payroll data rather than replacing it.
      </PlainCallout>
      <Raises2027 />
      <FileNumbers />
      <PersonnelActions />
      <UnionAgreements />
      <PayrollTabs
        overtime={{
          trends: rankTrends,
          flagged: flaggedRanks,
          comparisons: costComparisons,
          individual: individualRatioCheck,
          totalOpportunityMid,
          benefitLoad: BENEFIT_LOAD,
          benefitBasis: BENEFIT_LOAD_BASIS,
          benefitExplainer: benefitExplainer,
          benefitSource: benefitSource,
          otPremium: OT_PREMIUM,
          latestYear,
          caveats,
          sourceNote,
          unionLabels,
        }}
        separation={{
          summary: separationSummary,
          liability: compensatedAbsences,
          oneYearChange: liabilityOneYearChange,
          twoYearChange: liabilityTwoYearChange,
          whyItMattersNow,
          caveats: separationCaveats,
          whatWouldSettleIt,
          unionLabels,
          overtimeFinalYearRatio: finalYearOvertimeCheck.medianRatio,
        }}
      />
    </PageShell>
  )
}

// How the payroll file numbers on Town Board resolutions ("employee
// #GFZ000347") run, from the Town's own roster (lib/file-numbers.ts).
function FileNumbers() {
  const f = fileNumbers
  const cell = { padding: '8px 10px', verticalAlign: 'top' } as const
  return (
    <details id="file-numbers" data-file-numbers style={{ background: 'var(--rbl-surface)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 16, padding: 0, margin: '0 0 18px', overflow: 'hidden' }}>
      <summary style={{ cursor: 'pointer', padding: '15px 18px', fontWeight: 800, color: 'var(--rbl-title)', fontSize: 15.5 }}>
        How the payroll file numbers (GFZ numbers) work
      </summary>
      <div style={{ padding: '0 18px 18px', color: 'var(--rbl-text-body)', fontSize: 14, lineHeight: 1.6 }}>
        <p style={{ marginTop: 0 }}>
          The Town Board often names an employee by payroll file number instead of by name: Resolution 2026-888 (October 6, 2026), for example,
          sends “employee #GFZ000152” to a conference. {f.code} is the Town’s payroll company code, and the six digits are the person’s file number. You can
          type one into the search box below, or into site search, in any form: “GFZ {f.example.number}”, “File # {f.example.number}” or
          just “{Number(f.example.number)}”.
        </p>
        <p>
          The Town has not published how it assigns the numbers. Matching each of the {f.rosterPeople} numbers on its roster to
          the hire year in the payroll exports shows four blocks:
        </p>
        <div style={{ overflowX: 'auto' }}>
          <table className="rbl-stack" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
            <thead>
              <tr style={{ textAlign: 'left', color: 'var(--rbl-text-muted)', borderBottom: '2px solid var(--rbl-border-subtle)' }}>
                <th style={cell}>Numbers</th>
                <th style={cell}>Who has them</th>
                <th style={cell}>Hired</th>
                <th style={cell}>Order</th>
              </tr>
            </thead>
            <tbody>
              {f.blocks.map((b) => (
                <tr key={b.from} style={{ borderBottom: '1px solid var(--rbl-border-subtle)' }}>
                  <td style={{ ...cell, fontWeight: 700, color: 'var(--rbl-title)', whiteSpace: 'nowrap' }}><span>{b.from}–{b.to}</span></td>
                  <td data-label="Who has them" style={cell}><span>{b.who} ({b.people.toLocaleString()} people)</span></td>
                  <td data-label="Hired" style={{ ...cell, whiteSpace: 'nowrap' }}><span>{b.hired}</span></td>
                  <td data-label="Order" style={cell}><span>{b.order}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          So the numbering looks like it began around 2016. Everyone then working was numbered by seniority, then former
          employees still drawing pay, and since then each new hire has taken the next number. {f.example.name}, {f.example.number},
          was hired in {f.example.hired}; that year’s hires run from {f.example.yearFrom} to {f.example.yearTo}. A lower number
          means longer service only within a block: 000700 belongs to someone hired in 1973, not to someone senior to 000600.
        </p>
        <p style={{ marginBottom: 0 }}>
          Numbers stay with a person and are not reused: the {f.sharedNumbers} numbers that appear under two names each belong
          to one person whose name changed or was spelled two ways. The roster this site holds stops at {f.highestOnRoster}, people
          hired through {f.highestHireYear}, so anyone hired since then has no file number here. The Board has cited numbers as
          high as GFZ{f.latestCited.number} (Resolution {f.latestCited.resolution}, {f.latestCited.meeting}). The payroll exports
          carry no file number, so this site links each number to a person by name, and the hire years are years, not dates. One
          former employee’s hire year reads 1900 in the exports, an apparent placeholder left out of the ranges above.
        </p>
      </div>
    </details>
  )
}

type PersonnelAction = (typeof personnelActions.actions)[number]

const KIND_LABEL: Record<string, string> = {
  discipline: 'Disciplinary charges',
  suspension: 'Suspension',
  termination: 'Termination',
  grievance: 'Grievance',
  separation: 'Separation agreement',
  stipulation: 'Stipulation',
}
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const longDate = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number)
  return `${MONTH_NAMES[m - 1]} ${d}, ${y}`
}

// Personnel resolutions that name the employee only by file number, with the
// person the Town's roster gives that number to (etl/build_personnel_actions.py).
function PersonnelActions() {
  const actions = personnelActions.actions as PersonnelAction[]
  if (!actions.length) return null
  const cell = { padding: '8px 10px', verticalAlign: 'top' } as const
  const named = actions.filter((a) => a.people.length).length
  return (
    <details id="personnel-actions" data-personnel-actions style={{ background: 'var(--rbl-surface)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 16, padding: 0, margin: '0 0 18px', overflow: 'hidden' }}>
      <summary style={{ cursor: 'pointer', padding: '15px 18px', fontWeight: 800, color: 'var(--rbl-title)', fontSize: 15.5 }}>
        Personnel actions the Board took by file number ({actions.length})
      </summary>
      <div style={{ padding: '0 18px 18px', color: 'var(--rbl-text-body)', fontSize: 14, lineHeight: 1.6 }}>
        <p style={{ marginTop: 0 }}>
          These Town Board resolutions take a disciplinary, termination, separation or similar action and name the employee only by payroll
          file number. The name beside each is the one the Town’s payroll roster gives that number; {named} of the {actions.length} numbers are
          on it. The title and department are that person’s latest in the payroll exports.
        </p>
        <p>
          A resolution is an action, not a finding. Disciplinary charges are allegations until they are decided, and a stipulation or
          separation agreement does not say what it settles. The match is by number on a roster that runs through file number{' '}
          {personnelActions.rosterHighest}, so a higher number has no name here. No resolution in this site’s records names an employee by
          number in a grievance.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <table className="rbl-stack" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
            <thead>
              <tr style={{ textAlign: 'left', color: 'var(--rbl-text-muted)', borderBottom: '2px solid var(--rbl-border-subtle)' }}>
                <th style={cell}>Resolution</th>
                <th style={cell}>Action</th>
                <th style={cell}>File number</th>
                <th style={cell}>On the roster as</th>
                <th style={cell}>What the resolution says</th>
              </tr>
            </thead>
            <tbody>
              {actions.map((a) => (
                <tr key={`${a.resolution}-${a.fileNumber}`} style={{ borderBottom: '1px solid var(--rbl-border-subtle)' }}>
                  <td style={{ ...cell, fontWeight: 700, color: 'var(--rbl-title)', whiteSpace: 'nowrap' }}>
                    <span>{a.resolution}<br /><span style={{ fontWeight: 400, color: 'var(--rbl-text-muted)' }}>{longDate(a.meeting)}</span></span>
                  </td>
                  <td data-label="Action" style={cell}><span>{KIND_LABEL[a.kind] ?? a.kind}{a.result ? `, ${a.result.replace(/\s*\[.*\]/, '').toLowerCase()}` : ''}</span></td>
                  <td data-label="File number" style={{ ...cell, whiteSpace: 'nowrap' }}><span>GFZ{a.fileNumber}</span></td>
                  <td className="rbl-stack-prose" data-label="On the roster as" style={cell}>
                    <span>
                      {a.people.length
                        ? a.people.map((p, i) => (
                            <span key={p.name}>{i > 0 && ' or '}<strong>{p.name}</strong>{p.title ? `, ${p.title}` : ''}{p.department ? ` (${p.department}, ${p.year})` : ''}</span>
                          ))
                        : `Not on the roster (above ${personnelActions.rosterHighest})`}
                    </span>
                  </td>
                  <td className="rbl-stack-prose" data-label="What the resolution says" style={cell}><span>{a.quote ? `“${a.quote}”` : a.title}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </details>
  )
}

type UnionAgreement = (typeof personnelActions.unionAgreements)[number]

/** "ADOPTED [UNANIMOUS]" or "[UNANIMOUS]", as this site's meeting record prints it, in plain words. */
const resultWords = (r: string | null) => {
  if (!r) return 'no result in this site’s records'
  const adopted = /ADOPTED/i.test(r)
  const unanimous = /UNANIMOUS/i.test(r)
  return [adopted && 'adopted', unanimous && 'unanimous'].filter(Boolean).join(', ') || r.toLowerCase()
}

// Every agreement and stipulation the Board made with the Town's unions, from
// the meeting records, with the resolution's own clauses where the site has them.
function UnionAgreements() {
  const agreements = personnelActions.unionAgreements as UnionAgreement[]
  if (!agreements.length) return null
  const cell = { padding: '8px 10px', verticalAlign: 'top' } as const
  const withText = agreements.filter((a) => a.clauses.length).length
  const attached = agreements.filter((a) => a.attachment?.summary).length
  const byUnion = ['CSEA', 'Police Benevolent Association', 'Superior Officers Association'].map((u) => [u, agreements.filter((a) => a.union?.includes(u)).length] as const)
  return (
    <details id="union-agreements" data-union-agreements style={{ background: 'var(--rbl-surface)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 16, padding: 0, margin: '0 0 18px', overflow: 'hidden' }}>
      <summary style={{ cursor: 'pointer', padding: '15px 18px', fontWeight: 800, color: 'var(--rbl-title)', fontSize: 15.5 }}>
        Agreements and stipulations with the unions ({agreements.length})
      </summary>
      <div style={{ padding: '0 18px 18px', color: 'var(--rbl-text-body)', fontSize: 14, lineHeight: 1.6 }}>
        <p style={{ marginTop: 0 }}>
          A stipulation is a side agreement with a union that changes the contract’s terms for one employee or a group: a title the salary
          schedule lacks, a merit step, an insurance buyout. This site’s meeting records run in full from January 2025, and these are every
          agreement and stipulation with a union in them, the first on {longDate(agreements[agreements.length - 1].meeting)}: {byUnion.map(([u, n]) => `${n} with the ${u}`).join(', ')}.
          One covers both police unions.
        </p>
        <p>
          The clauses are the resolution’s own words, shortened where marked …, from the minutes or, where the minutes give only a
          title, from the meeting’s agenda packet; this site has the text of {withText} of the {agreements.length}. Several resolutions
          only approve “the attached” agreement, which the packet includes as a scanned image. For {attached} of them this site has read the
          scan by machine (OCR) and quotes its first clause that says what it does. OCR can misread letters and figures, so check the packet
          before relying on a detail.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <table className="rbl-stack" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
            <thead>
              <tr style={{ textAlign: 'left', color: 'var(--rbl-text-muted)', borderBottom: '2px solid var(--rbl-border-subtle)' }}>
                <th style={cell}>Resolution</th>
                <th style={cell}>Union</th>
                <th style={cell}>What it does</th>
              </tr>
            </thead>
            <tbody>
              {agreements.map((a) => (
                <tr key={a.resolution} style={{ borderBottom: '1px solid var(--rbl-border-subtle)' }}>
                  <td style={{ ...cell, fontWeight: 700, color: 'var(--rbl-title)', whiteSpace: 'nowrap' }}>
                    <span>{a.resolution}<br /><span style={{ fontWeight: 400, color: 'var(--rbl-text-muted)' }}>{longDate(a.meeting)}, {resultWords(a.result)}</span></span>
                  </td>
                  <td data-label="Union" style={cell}><span>{a.union ?? '—'}</span></td>
                  <td className="rbl-stack-prose" data-label="What it does" style={cell}>
                    <span>
                      <strong>{a.title}</strong>
                      {a.clauses.map((c) => <span key={c} style={{ display: 'block', marginTop: 4 }}>“{c}”</span>)}
                      {a.attachment?.summary && (
                        <span style={{ display: 'block', marginTop: 4 }}>
                          The attached agreement, read by machine from a scan (packet {a.attachment.pages.length > 1 ? `pp. ${a.attachment.pages[0]}–${a.attachment.pages[a.attachment.pages.length - 1]}` : `p. ${a.attachment.pages[0]}`}):{' '}
                          “{a.attachment.summary}”
                        </span>
                      )}
                      {a.sourceUrl && <span style={{ display: 'block', marginTop: 4 }}><a href={a.sourceUrl} style={{ color: 'var(--rbl-link)' }}>Agenda packet (PDF)</a></span>}
                      {a.named.length > 0 && <span style={{ display: 'block', marginTop: 4, color: 'var(--rbl-text-muted)' }}>Named in it: {a.named.join('; ')}</span>}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </details>
  )
}

const money = (n: number) => `$${Math.round(n).toLocaleString('en-US')}`
const money2 = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

// 2027 pay: what a contract or a notice already sets, and what waits for the
// Board's January salary resolution (lib/raises-2027.ts).
function Raises2027() {
  const r = raises2027(authorized2026.records as Authorized[], payrollRecords.records as PayrollRow[])
  const cell = { padding: '8px 10px', verticalAlign: 'top' } as const
  const pba = laborUnits.find((u) => u.unit === 'PBA')!
  const highway = [2, 4].map((n) => {
    const a = AMENDMENTS.find((x) => x.n === n)!
    const pay = a.lines.filter((l) => l.side === 'to' && /Personal Services|Longevity/.test(l.name)).reduce((s, l) => s + l.amount, 0)
    return { n, number: AMENDMENT_VOTES.find((v) => v.n === n)!.number, pay, why: a.whereas[0] }
  })
  return (
    <details id="raises-2027" data-raises-2027 style={{ background: 'var(--rbl-surface)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 16, padding: 0, margin: '0 0 18px', overflow: 'hidden' }}>
      <summary style={{ cursor: 'pointer', padding: '15px 18px', fontWeight: 800, color: 'var(--rbl-title)', fontSize: 15.5 }}>
        Raises 2026 → 2027: what is already set
      </summary>
      <div style={{ padding: '0 18px 18px', color: 'var(--rbl-text-body)', fontSize: 14, lineHeight: 1.6 }}>
        <p style={{ marginTop: 0 }}>
          No one’s 2027 salary is official yet: the Board sets them in its salary resolution at the January 2027 organizational meeting.
          But contracts and the budget-hearing notice already fix much of it. Of the {r.listed} salaried people on the 2026
          authorized list, outside the elected officials:
        </p>
        <div style={{ overflowX: 'auto' }}>
          <table className="rbl-stack" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
            <thead>
              <tr style={{ textAlign: 'left', color: 'var(--rbl-text-muted)', borderBottom: '2px solid var(--rbl-border-subtle)' }}>
                <th style={cell}>Who</th>
                <th style={cell}>People</th>
                <th style={cell}>2027</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid var(--rbl-border-subtle)' }}>
                <td style={{ ...cell, fontWeight: 700, color: 'var(--rbl-title)' }}><span>CSEA members</span></td>
                <td data-label="People" style={cell}><span>{r.csea.length}</span></td>
                <td data-label="2027" className="rbl-stack-prose" style={cell}>
                  <span>
                    Set by contract. The {CSEA_2027.source} raises every step of the salary schedule {(CSEA_2027.pct * 100).toFixed(1)}% and
                    then adds {money(CSEA_2027.flat)}. On their 2026 salaries that is {money(r.cseaTotal)} more in all
                    {r.cseaMedian && <>, a median of {money(r.cseaMedian.raise)} ({r.cseaMedian.pct.toFixed(1)}%)</>}
                    {r.cseaPctRange && <>, from {r.cseaPctRange[0].toFixed(1)}% on the highest salaries to {r.cseaPctRange[1].toFixed(1)}% on the lowest</>}.
                    Anyone not at the top step also moves up a step, so this is the least each one’s base should rise.
                  </span>
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--rbl-border-subtle)' }}>
                <td style={{ ...cell, fontWeight: 700, color: 'var(--rbl-title)' }}><span>Police: PBA and Superior Officers</span></td>
                <td data-label="People" style={cell}><span>{r.pba} PBA, {r.soa} SOA</span></td>
                <td data-label="2027" className="rbl-stack-prose" style={cell}>
                  <span>
                    Not set. Both contracts expire December 31, 2026, and no successor has come before the Board. Until one is signed, the
                    2026 salary schedule stands, but step movement continues under the Taylor Law’s Triborough Amendment (Civil Service Law
                    § 209-a(1)(e)). On the Police Officer ladder alone that is about {money(triborough.stepCost2027)} for the{' '}
                    {triborough.officersMoving} officers still climbing it, this site’s estimate; the {triborough.officersAtTopStep} at the top step
                    get nothing from it, and detectives and sergeants move on their own schedules. The agreement that continues is the {pba.contractTerm}.
                  </span>
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--rbl-border-subtle)' }}>
                <td style={{ ...cell, fontWeight: 700, color: 'var(--rbl-title)' }}><span>Managers, appointees and others</span></td>
                <td data-label="People" style={cell}><span>{r.others + r.unmatched}</span></td>
                <td data-label="2027" className="rbl-stack-prose" style={cell}>
                  <span>
                    Not set until the January salary resolution. This includes {r.unmatched} whose name could not be matched to a single
                    union in the {r.payrollYear} payroll export.
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          <strong>Elected officials: no raises proposed.</strong> The {ELECTED_2027.source} lists each 2027 proposed salary at its
          2026 amount: {ELECTED_2027.rows.map((e) => `${e.position} ${money(e.y2027)}`).join('; ')}. {ELECTED_2027.rows[0].note}
        </p>
        <p>
          <strong>Raises already added to the Preliminary Budget.</strong>{' '}
          {highway.map((h, i) => (
            <span key={h.n}>
              {i > 0 && ' '}Amendment #{h.n} (Resolution {h.number}) adds {money(h.pay)} of pay because “{h.why}”.
            </span>
          ))}{' '}
          The amendments name no employee.
        </p>
        <details style={{ marginTop: 10 }}>
          <summary style={{ cursor: 'pointer', fontWeight: 700, color: 'var(--rbl-title)' }}>Each CSEA member’s 2027 schedule increase ({r.csea.length})</summary>
          <p style={{ marginBottom: 6 }}>
            2026 is the Board-authorized salary; 2027 is that salary raised {(CSEA_2027.pct * 100).toFixed(1)}% plus {money(CSEA_2027.flat)}, this
            site’s arithmetic from the contract. A step move or a promotion adds to it.
          </p>
          <div style={{ overflowX: 'auto' }}>
            <table className="rbl-stack" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ textAlign: 'left', color: 'var(--rbl-text-muted)', borderBottom: '2px solid var(--rbl-border-subtle)' }}>
                  <th style={cell}>Name</th>
                  <th style={cell}>Title</th>
                  <th style={{ ...cell, textAlign: 'right' }}>2026</th>
                  <th style={{ ...cell, textAlign: 'right' }}>2027 at least</th>
                  <th style={{ ...cell, textAlign: 'right' }}>Raise</th>
                </tr>
              </thead>
              <tbody>
                {r.csea.map((c) => (
                  <tr key={`${c.name}-${c.title}`} style={{ borderBottom: '1px solid var(--rbl-border-subtle)' }}>
                    <td style={{ ...cell, fontWeight: 700, color: 'var(--rbl-title)' }}><span>{c.name}</span></td>
                    <td data-label="Title" style={cell}><span>{c.title}{c.department ? `, ${c.department}` : ''}</span></td>
                    <td data-label="2026" style={{ ...cell, textAlign: 'right' }}><span>{money2(c.y2026)}</span></td>
                    <td data-label="2027 at least" style={{ ...cell, textAlign: 'right' }}><span>{money2(c.y2027)}</span></td>
                    <td data-label="Raise" style={{ ...cell, textAlign: 'right' }}><span>{money2(c.raise)} ({c.pct.toFixed(1)}%)</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </div>
    </details>
  )
}
