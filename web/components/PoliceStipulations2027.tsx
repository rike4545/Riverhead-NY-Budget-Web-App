import { triborough } from '../lib/labor-contracts-2027'
import { realRaiseExamples } from '../lib/pba-step-schedule'
import { adopted, BODYCAM_2027, FIS_ANSWER, IMPLIED_RAISE, MEETING, officerLadderIncrease2027, PBA, rowChanges, SOA, YEARS, type Row } from '../lib/police-stipulations-2027'

const usd = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(n)
const round = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
const th = { textAlign: 'right', padding: '7px 8px', borderBottom: '1px solid var(--rbl-border)', color: 'var(--rbl-text-strong)', fontWeight: 700 } as const
const td = { textAlign: 'right', padding: '7px 8px', borderBottom: '1px solid var(--rbl-border-subtle)', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' } as const
const link = { color: 'var(--rbl-link)', fontWeight: 600 } as const

// Officers by 2026 step, in ladder order, from the roster the site infers from
// the 2025-to-2026 authorized salaries (lib/pba-step-schedule.ts).
const LADDER_2026 = ['Academy', '1st Year Officer', '2nd Year Officer', '3rd Year Officer', '4th Year Officer', '5th Year Officer', '6th Year Officer (top step)']
const counts = LADDER_2026.map((step) => realRaiseExamples.filter((r) => r.toStep === step).reduce((n, r) => n + r.officerCount, 0))
export const ladderIncrease = officerLadderIncrease2027(counts)

function Schedule({ caption, rows, first = 'Step or rank' }: { caption: string; rows: Row[]; first?: string }) {
  return (
    <div data-scroll-region style={{ overflowX: 'auto', margin: '10px 0' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, minWidth: 620 }}>
        <caption style={{ textAlign: 'left', fontWeight: 700, color: 'var(--rbl-title)', padding: '0 0 6px' }}>{caption}</caption>
        <thead>
          <tr>
            <th scope="col" style={{ ...th, textAlign: 'left' }}>{first}</th>
            {YEARS.map((y) => <th key={y} scope="col" style={th}>{y === 2026 ? '2026 (current)' : y}</th>)}
            <th scope="col" style={th}>Change 2026–2030</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.title}>
              <th scope="row" style={{ ...td, textAlign: 'left', fontWeight: 600, whiteSpace: 'normal' }}>{r.title}</th>
              {r.rates.map((v, i) => <td key={i} style={td}>{usd(v)}</td>)}
              <td style={td}>+{(rowChanges(r).fourYears * 100).toFixed(1)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function PoliceStipulations2027() {
  const status = adopted === null ? 'Proposed, not yet voted on' : adopted ? 'Approved by the Town Board' : 'Not approved by the Town Board'
  return (
    <section data-police-stipulations aria-labelledby="police-stipulations" style={{ border: '1px solid var(--rbl-warn-border)', background: 'var(--rbl-warn-bg)', borderRadius: 14, padding: '16px 18px', margin: '14px 0' }}>
      <h3 id="police-stipulations" style={{ margin: '0 0 6px', color: 'var(--rbl-title)', fontSize: 17 }}>Police contracts for 2027 to 2030: {status.toLowerCase()}</h3>
      <p style={{ margin: '0 0 8px' }}>
        Items {PBA.item} and {SOA.item} on the Town Board’s <a href={MEETING.agendaUrl} style={link}>{MEETING.date} agenda</a> ask it to approve
        stipulations with the Police Benevolent Association and the Superior Officers Association. The{' '}
        <a href={MEETING.packetUrl} style={link}>agenda packet</a> attaches each one’s salary and night-differential schedules (pages{' '}
        {PBA.packetPages.nightDiff}–{PBA.packetPages.salary} and {SOA.packetPages.nightDiff}–{SOA.packetPages.salary}) but not the
        stipulations themselves, so their other terms are not public. Every step rises {(IMPLIED_RAISE * 100).toFixed(2)}% a year, this
        site’s reading of the schedules, and 2027 salaries add {round(BODYCAM_2027)} for the body-camera agreement, which the schedules say
        is the last such increase. A top-step officer would go from {round(PBA.officers[6].rates[0])} in 2026 to {round(PBA.officers[6].rates[4])} in 2030.
      </p>
      <Schedule caption="Police officers and detectives (PBA, Appendix B)" rows={[...PBA.officers, ...PBA.detectives]} />
      <Schedule caption="Superior officers (SOA, Appendix B)" rows={SOA.ranks} />
      <Schedule caption="Night differential, yearly amounts (PBA and SOA, Appendix A; K-9 is PBA only)" rows={PBA.nightDiff} first="Schedule worked" />
      <p style={{ margin: '8px 0 0' }}>
        <strong>What it might cost in 2027.</strong> On the Police Officer ladder alone, the higher 2027 rates come to about{' '}
        {round(ladderIncrease.cost)} for the {ladderIncrease.officers} officers this site counts, on top of the about{' '}
        {round(triborough.stepCost2027)} of step raises owed with or without a new contract. That is this site’s estimate, not a Town figure. It
        leaves out detectives, superior officers, night differential, overtime and pension costs, which all rise with pay, and seven PBA
        members have since retired under the incentive, so the real figure will differ.
      </p>
      <p style={{ margin: '8px 0 0' }}>
        <strong>A likely concern.</strong> Both resolutions’ Fiscal Impact Statements answer section D, “{FIS_ANSWER}”, and leave the cost
        sections blank (packet pages {PBA.packetPages.fiscalImpact} and {SOA.packetPages.fiscalImpact}). A four-year raise for the largest department in the
        General Fund has a cost; residents may want to ask the Board for it before the vote.
      </p>
    </section>
  )
}
