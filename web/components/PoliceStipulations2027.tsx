import { triborough } from '../lib/labor-contracts-2027'
import { realRaiseExamples } from '../lib/pba-step-schedule'
import { CSEA_TERMS } from '../lib/raises-2027'
import { adopted, BODYCAM_2027, FIS_ANSWER, IMPLIED_RAISE, MEETING, officerLadderIncrease2027, PBA, SOA, YEARS, type Row } from '../lib/police-stipulations-2027'

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
  const status = adopted === null ? 'proposed, not yet voted on' : adopted ? 'approved by the Town Board' : 'not approved by the Town Board'
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
        On {MEETING.date} the Town Board is asked to approve new contracts with the two police unions, the Police Benevolent
        Association (officers and detectives) and the Superior Officers Association (sergeants and lieutenants). They are items{' '}
        {PBA.item} and {SOA.item} on the <a href={MEETING.agendaUrl} style={link}>meeting agenda</a>. The Town has published the pay
        tables from each contract, but not the rest of the contract.
      </p>

      <h4 style={h4}>In short</h4>
      <ul style={{ margin: 0, paddingLeft: 20, display: 'grid', gap: 6 }}>
        <li>Pay goes up by the same share every year for four years: {pct(IMPLIED_RAISE)}, or a little under 4 cents on every dollar.</li>
        <li>In 2027 everyone also gets {round(BODYCAM_2027)} more for agreeing to wear body cameras. The pay tables say this is the last such increase.</li>
        <li>
          A police officer at the top of the pay scale earns <strong>{round(top[0])}</strong> this year. That would become {round(top[1])} next
          year and <strong>{round(top[4])}</strong> in 2030: {round(top[4] - top[0])} more a year.
        </li>
        <li>A lieutenant would go from {round(lt[0])} to {round(lt[4])}, {round(lt[4] - lt[0])} more a year.</li>
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
          <strong>For every $100 of pay today</strong>, the police proposal would pay about <strong>{round(p2029)}</strong> in 2029 and{' '}
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
              <th scope="col" style={th}>Police (proposed)</th>
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

      <h4 style={h4}>Something to ask about</h4>
      <p style={{ margin: 0 }}>
        Every Board resolution comes with a form that asks whether it will cost money. On both of these, the form answers “
        {FIS_ANSWER}” and leaves the cost lines blank (pages {PBA.packetPages.fiscalImpact} and {SOA.packetPages.fiscalImpact} of the{' '}
        <a href={MEETING.packetUrl} style={link}>agenda packet</a>). A four-year raise for the largest department in the General Fund
        does cost money, so residents may want to ask the Board for the figure before the vote.
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
