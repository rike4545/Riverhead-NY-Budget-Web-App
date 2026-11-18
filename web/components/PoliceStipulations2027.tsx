import { triborough } from '../lib/labor-contracts-2027'
import { realRaiseExamples } from '../lib/pba-step-schedule'
import { CSEA_TERMS } from '../lib/raises-2027'
import { stageDoc } from '../lib/budget-stages'
import { statusPhrase, watched } from '../lib/watched-resolutions'
import { WATCH, BODYCAM_2027, BUDGET_LINES, FIS_ANSWER, IMPLIED_RAISE, MEETING, officerLadderIncrease2027, PBA, PFRS_RATE, POLICE_FORM_FIXES, raiseCostEstimate, SOA, YEARS, type Row } from '../lib/police-stipulations-2027'

// The proposed 2027-2030 police contracts, written for readers who would rather
// see dollars than percentages: a real salary followed year by year, what every
// $100 of pay becomes, and the full schedules folded away for those who want them.

const cents = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(n)
const round = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
const pct = (n: number) => `${+(n * 100).toFixed(2)}%`
const th = { textAlign: 'right', padding: '7px 8px', borderBottom: '1px solid var(--rbl-border)', color: 'var(--rbl-text-strong)', fontWeight: 700 } as const
const td = { textAlign: 'right', padding: '7px 8px', borderBottom: '1px solid var(--rbl-border-subtle)', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' } as const
const link = { color: 'var(--rbl-link)', fontWeight: 600 } as const
const h4 = { margin: '16px 0 6px', color: 'var(--rbl-title)', fontSize: 16 } as const

// Officers by 2026 step, in ladder order, from the roster the site infers from
// the 2025-to-2026 authorized salaries (lib/pba-step-schedule.ts).
const LADDER_2026 = ['Academy', '1st Year Officer', '2nd Year Officer', '3rd Year Officer', '4th Year Officer', '5th Year Officer', '6th Year Officer (top step)']
const counts = LADDER_2026.map((step) => realRaiseExamples.filter((r) => r.toStep === step).reduce((n, r) => n + r.officerCount, 0))
export const ladderIncrease = officerLadderIncrease2027(counts)
const estimate = raiseCostEstimate()
const change = (l: { adopted2026: number; budget2027: number }) => l.budget2027 / l.adopted2026 - 1

/** What $100 of 2026 pay becomes each year under the proposed police terms. The $500 is per person, so it is left out here. */
const per100Police = [2027, 2028, 2029, 2030].map((y, i) => ({ year: y, value: 100 * (1 + IMPLIED_RAISE) ** (i + 1) }))
/** The same for CSEA, percentages only; its flat dollar amounts are per person too. */
const per100Csea = CSEA_TERMS.filter((t) => t.year >= 2027).reduce<{ year: number; value: number }[]>((acc, t) => {
  const prev = acc.length ? acc[acc.length - 1].value : 100
  return [...acc, { year: t.year, value: prev * (1 + t.pct) }]
}, [])
/** One CSEA salary carried through the contract: the percentage, then the flat amount. */
const cseaPath = (y2026: number) => CSEA_TERMS.filter((t) => t.year >= 2027).reduce<{ year: number; salary: number }[]>((acc, t) => {
  const prev = acc.length ? acc[acc.length - 1].salary : y2026
  return [...acc, { year: t.year, salary: prev * (1 + t.pct) + t.flat }]
}, [])

function Schedule({ caption, rows, first = 'Step or rank' }: { caption: string; rows: Row[]; first?: string }) {
  return (
    <div data-scroll-region style={{ overflowX: 'auto', margin: '10px 0' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, minWidth: 620 }}>
        <caption style={{ textAlign: 'left', fontWeight: 700, color: 'var(--rbl-title)', padding: '0 0 6px' }}>{caption}</caption>
        <thead>
          <tr>
            <th scope="col" style={{ ...th, textAlign: 'left' }}>{first}</th>
            {YEARS.map((y) => <th key={y} scope="col" style={th}>{y === 2026 ? '2026 (now)' : y}</th>)}
            <th scope="col" style={th}>More a year by 2030</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.title}>
              <th scope="row" style={{ ...td, textAlign: 'left', fontWeight: 600, whiteSpace: 'normal' }}>{r.title}</th>
              {r.rates.map((v, i) => <td key={i} style={td}>{cents(v)}</td>)}
              <td style={td}>{round(r.rates[4] - r.rates[0])}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function PoliceStipulations2027({ cseaTypical2026 }: { cseaTypical2026?: number | null }) {
  const pba = watched(WATCH.pba)
  const soa = watched(WATCH.soa)
  // Both contracts approved: the schedules are the terms, not a proposal.
  const both = pba.status === 'adopted' && soa.status === 'adopted'
  // The 2027 budget (item IX.1), once the Town has published it as adopted.
  const budgetAdopted = stageDoc(2027, 'adopted') !== null && stageDoc(2027, 'preliminary')?.totals.appropriations === stageDoc(2027, 'adopted')?.totals.appropriations
  const sameOutcome = pba.status === soa.status
  const status = sameOutcome && pba.status === 'pending' ? 'vote not yet published' : sameOutcome ? pba.status === 'adopted' ? 'approved' : pba.status === 'tabled' ? 'tabled' : 'not approved' : 'see each union below'
  const top = PBA.officers[6].rates
  const lt = SOA.ranks[3].rates
  const p2029 = per100Police[2].value
  const p2030 = per100Police[3].value
  const c2029 = per100Csea[per100Csea.length - 1].value
  const csea = cseaTypical2026 ? cseaPath(cseaTypical2026) : null
  return (
    <section data-police-stipulations aria-labelledby="police-stipulations" style={{ border: '1px solid var(--rbl-warn-border)', background: 'var(--rbl-warn-bg)', borderRadius: 14, padding: '16px 18px', margin: '14px 0' }}>
      <h3 id="police-stipulations" style={{ margin: '0 0 6px', color: 'var(--rbl-title)', fontSize: 17 }}>Police contracts for 2027 to 2030: {status}</h3>
      <p style={{ margin: '0 0 8px' }}>
        On {MEETING.date} the Town Board was asked to approve new contracts with the two police unions, the Police Benevolent
        Association (officers and detectives) and the Superior Officers Association (sergeants and lieutenants). They are items{' '}
        {PBA.item} and {SOA.item} on the <a href={MEETING.agendaUrl} style={link}>meeting agenda</a>. The Town has published the pay
        tables from each contract, but not the rest of the contract.{' '}
        <span data-watch-status>Officers’ contract: {statusPhrase(pba)}. Superior officers’ contract: {statusPhrase(soa)}.</span>
      </p>

      <h4 style={h4}>In short</h4>
      <ul style={{ margin: 0, paddingLeft: 20, display: 'grid', gap: 6 }}>
        <li>Pay goes up by the same share every year for four years: {pct(IMPLIED_RAISE)}, or a little under 4 cents on every dollar.</li>
        <li>In 2027 everyone also gets {round(BODYCAM_2027)} more for agreeing to wear body cameras. The pay tables say this is the last such increase.</li>
        <li>
          A police officer at the top of the pay scale earns <strong>{round(top[0])}</strong> this year. That {both ? 'becomes' : 'would become'} {round(top[1])} next
          year and <strong>{round(top[4])}</strong> in 2030: {round(top[4] - top[0])} more a year.
        </li>
        <li>A lieutenant {both ? 'goes' : 'would go'} from {round(lt[0])} to {round(lt[4])}, {round(lt[4] - lt[0])} more a year.</li>
      </ul>

      <h4 style={h4}>What it might cost the Town</h4>
      <p style={{ margin: 0 }}>
        For the {ladderIncrease.officers} rank-and-file officers this site counts, the raise adds roughly{' '}
        <strong>{round(Math.round(ladderIncrease.cost / 1000) * 1000)}</strong> in 2027 alone. That is on top of about{' '}
        {round(Math.round(triborough.stepCost2027 / 1000) * 1000)} the Town owes anyway as officers move up a step with experience. This is
        this site’s estimate, not a Town figure. It does not count detectives, sergeants, lieutenants, night pay, overtime or pensions,
        which all rise with pay, and seven officers have since retired, so the real cost will differ.
      </p>

      <h4 style={h4}>How this compares with the Town’s civilian workers</h4>
      <div data-csea-comparison>
        <p style={{ margin: '0 0 8px' }}>
          Most of the Town’s non-police employees belong to the CSEA union. Their contract runs from 2026 to 2029 and was approved
          on December 16, 2025 (Resolution 2025-1001). It is not new; it is here so you can compare the two.
        </p>
        <p style={{ margin: '0 0 8px' }}>
          <strong>For every $100 of pay today</strong>, the police {both ? 'contracts pay' : 'proposal would pay'} about <strong>{round(p2029)}</strong> in 2029 and{' '}
          {round(p2030)} in 2030. The CSEA contract pays about <strong>{round(c2029)}</strong> in 2029 and then ends. CSEA members also get
          flat dollar raises on top (shown below), which matter more on smaller salaries.
        </p>
        {csea && cseaTypical2026 && (
          <p style={{ margin: '0 0 8px' }}>
            For example, a CSEA worker on the middle salary of the 2026 list, {round(cseaTypical2026)}, would reach about{' '}
            <strong>{round(csea[csea.length - 1].salary)}</strong> in 2029 under that contract: {round(csea[csea.length - 1].salary - cseaTypical2026)} more a year.
          </p>
        )}
        <table style={{ width: '100%', maxWidth: 520, borderCollapse: 'collapse', fontSize: 14, margin: '8px 0' }}>
          <caption style={{ textAlign: 'left', fontWeight: 700, color: 'var(--rbl-title)', padding: '0 0 6px' }}>The raise each year</caption>
          <thead>
            <tr>
              <th scope="col" style={{ ...th, textAlign: 'left' }}>Year</th>
              <th scope="col" style={th}>Police ({both ? 'approved' : 'proposed'})</th>
              <th scope="col" style={th}>CSEA (approved)</th>
            </tr>
          </thead>
          <tbody>
            {[2027, 2028, 2029, 2030].map((y) => {
              const t = CSEA_TERMS.find((x) => x.year === y)
              return (
                <tr key={y}>
                  <th scope="row" style={{ ...td, textAlign: 'left', fontWeight: 600 }}>{y}</th>
                  <td style={td}>{pct(IMPLIED_RAISE)}{y === 2027 ? ` and ${round(BODYCAM_2027)}` : ''}</td>
                  <td style={td}>{t ? `${pct(t.pct)}${t.flat ? ` and ${round(t.flat)}` : ''}` : 'Contract ends'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <h4 style={h4}>What the Town’s cost forms get wrong</h4>
      <p style={{ margin: '0 0 8px' }}>
        Every Board resolution comes with a Fiscal Impact Statement, a one-page form that says whether it will cost money. Both police
        forms answer “{FIS_ANSWER}” and leave every cost line blank (pages {PBA.packetPages.fiscalImpact} and{' '}
        {SOA.packetPages.fiscalImpact} of the <a href={MEETING.packetUrl} style={link}>agenda packet</a>). Read against the form’s own
        instructions, these are the corrections they need. This is a resident’s reading of the form, not an audit.
      </p>
      <table data-form-fixes className="rbl-stack" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, margin: '8px 0' }}>
        <caption style={{ textAlign: 'left', fontWeight: 700, color: 'var(--rbl-title)', padding: '0 0 6px' }}>
          Items {PBA.item} and {SOA.item}: what the forms say, and what they should say
        </caption>
        <thead>
          <tr>
            <th scope="col" style={{ ...th, textAlign: 'left' }}>Part of the form</th>
            <th scope="col" style={{ ...th, textAlign: 'left' }}>It says</th>
            <th scope="col" style={{ ...th, textAlign: 'left' }}>It should say</th>
            <th scope="col" style={{ ...th, textAlign: 'left' }}>Why</th>
          </tr>
        </thead>
        <tbody>
          {POLICE_FORM_FIXES.map((f) => (
            <tr key={f.section}>
              <td style={{ ...td, textAlign: 'left', fontWeight: 600, whiteSpace: 'normal' }}>{f.section}{f.soaOnly ? ' (superior officers’ form only)' : ''}</td>
              <td data-label="It says" className="rbl-stack-prose" style={{ ...td, textAlign: 'left', whiteSpace: 'normal' }}>{f.says}</td>
              <td data-label="It should say" className="rbl-stack-prose" style={{ ...td, textAlign: 'left', whiteSpace: 'normal' }}>{f.shouldSay}</td>
              <td data-label="Why" className="rbl-stack-prose" style={{ ...td, textAlign: 'left', whiteSpace: 'normal', color: 'var(--rbl-text-body)' }}>{f.why}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h4 style={h4}>Is the 2027 raise in the budget?</h4>
      <p style={{ margin: '0 0 8px' }}>
        It appears so. The 2027 budget the Board {budgetAdopted ? 'adopted' : 'was asked to adopt'} as item IX.1 that same night raises police overtime by{' '}
        {pct(change(BUDGET_LINES[1]))}, holiday pay by {pct(change(BUDGET_LINES[3]))} and night pay by {pct(change(BUDGET_LINES[2]))}: close to the
        contracts’ {pct(IMPLIED_RAISE)}. The police department asked for no increase in holiday or night pay, so those were added after its request.
        If the forms meant “the 2027 cost is budgeted”, the right answer is still “yes”, with box E(a) for 2027 and box E(b) for the three later
        years.
      </p>
      <p id="police-budget-lines" style={{ margin: '4px 0 6px', fontWeight: 700, color: 'var(--rbl-title)', fontSize: 14 }}>
        Police lines in the 2027 Preliminary Budget (pages 14 and 21), General Fund{budgetAdopted ? ', adopted unchanged' : ''}
      </p>
      <div data-scroll-region style={{ overflowX: 'auto' }}>
        <table data-budget-lines aria-labelledby="police-budget-lines" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, margin: '0 0 8px', minWidth: 560 }}>
          <thead>
            <tr>
              <th scope="col" style={{ ...th, textAlign: 'left' }}>Line</th>
              <th scope="col" style={th}>2026 adopted</th>
              <th scope="col" style={th}>Police request</th>
              <th scope="col" style={th}>2027 budget</th>
              <th scope="col" style={th}>Change</th>
            </tr>
          </thead>
          <tbody>
            {BUDGET_LINES.map((l) => (
              <tr key={l.account}>
                <th scope="row" style={{ ...td, textAlign: 'left', fontWeight: 600, whiteSpace: 'normal' }}>
                  {l.name}<span style={{ display: 'block', fontWeight: 400, fontSize: 12.5, color: 'var(--rbl-text-muted)' }}>{l.account}</span>
                </th>
                <td style={td}>{round(l.adopted2026)}</td>
                <td style={td}>{round(l.request2027)}</td>
                <td style={td}>{round(l.budget2027)}</td>
                <td style={td}>{pct(change(l))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p style={{ margin: '0 0 8px' }}>
        <strong>The pension bill comes later.</strong> The State bills the Town each year on pay already earned: the bill due February 1, 2027 is
        based on pay from April 2025 to March 2026. So the 2027 raise reaches the police pension bill partly in 2028 and fully from 2029, and the
        2027 pension line cannot include it. The pension line rises {pct(change(BUDGET_LINES[4]))}, less
        than the State’s own rate increase alone, and {round(BUDGET_LINES[4].request2027 - BUDGET_LINES[4].budget2027)} below what the police
        department asked for. The budget does not say why.
      </p>

      <h4 style={h4}>What a filled-in section F might show</h4>
      <p style={{ margin: 0 }}>
        This site’s rough estimate, not a Town figure. Raising 2026’s police pay, overtime, night and holiday lines ({round(estimate.base)})
        by {pct(IMPLIED_RAISE)} a year adds about <strong>{round(Math.round(estimate.years[0].pay / 10_000) * 10_000)}</strong> in 2027, rising to{' '}
        <strong>{round(Math.round(estimate.years[3].pay / 10_000) * 10_000)}</strong> in 2030: about{' '}
        <strong>{round(Math.round(estimate.pay / 100_000) * 100_000)}</strong> over the four years, plus about{' '}
        {round(Math.round(estimate.socialSecurity / 10_000) * 10_000)} in Social Security. Once the 2030 pay is fully in the State’s bill, the pension
        cost would be about {round(Math.round(estimate.pensionYearly / 10_000) * 10_000)} a year more at today’s {pct(PFRS_RATE)} rate. It assumes
        the same officers, steps and hours as 2026, and leaves out the {round(BODYCAM_2027)} added to each 2027 salary, the step increases the Town
        owes anyway, and the seven officers who retired. The real figure is the Town’s to give.
      </p>

      <details style={{ marginTop: 14 }}>
        <summary style={{ cursor: 'pointer', fontWeight: 700, color: 'var(--rbl-title)' }}>See every pay step and the night pay</summary>
        <p style={{ margin: '8px 0 0' }}>
          Copied from the agenda packet, pages {PBA.packetPages.nightDiff}–{PBA.packetPages.salary} (officers) and{' '}
          {SOA.packetPages.nightDiff}–{SOA.packetPages.salary} (superior officers).
        </p>
        <Schedule caption="Police officers and detectives" rows={[...PBA.officers, ...PBA.detectives]} />
        <Schedule caption="Sergeants and lieutenants" rows={SOA.ranks} />
        <Schedule caption="Extra yearly pay for night shifts (K-9 is officers only)" rows={PBA.nightDiff} first="Shift" />
      </details>
    </section>
  )
}
