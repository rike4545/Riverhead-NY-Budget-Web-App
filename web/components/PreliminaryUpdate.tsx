import type { ReactNode } from 'react'
import { stageDoc } from '../lib/budget-stages'
import { NEXT_STEPS } from '../lib/budget-amendments-2027'
import { RECORD } from '../lib/budget-adoption'

const base = process.env.NEXT_PUBLIC_BASE_PATH || ''
const link = { color: 'var(--rbl-link)', fontWeight: 600, textDecoration: 'none' } as const
const usd = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
const pct = (to: number, from: number) => `${((to / from - 1) * 100).toFixed(2)}%`

/** The 2027 budget hearing, once the minutes show it was held: "November 5, 2026". */
const hearingStep = NEXT_STEPS.find((s) => /public hearing/i.test(s.what))
const hearingHeld = hearingStep?.done ? hearingStep.date.split(',').slice(0, 2).join(',') : null

/** True while the 2027 Preliminary is the newest stage the Town has published. */
export const preliminaryIsLatest = () => {
  const prelim = stageDoc(2027, 'preliminary')
  const tent = stageDoc(2027, 'tentative')
  return !!(prelim?.townWide && tent?.townWide && !stageDoc(2027, 'adopted'))
}

// The 2027 budget's current stage, for every page that describes it. The
// Board's six October 20, 2026 amendments turned the Supervisor's Tentative
// into the Preliminary Budget. Once the Town prints that book, this box leads
// with it and says what changed; `tentative` carries what a page has to say
// about the Tentative as filed. It renders nothing before the Preliminary is
// parsed. Once the Board has adopted a 2027 budget it says so instead, with
// the adopted figures.
/** The Board's 2027 adoption vote, from the record of every adoption (lib/budget-adoption.ts). */
const adoption2027 = RECORD.find((r) => r.year === 2027)?.adoption ?? null
const longDate = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

/** Once the 2027 budget is adopted: what was adopted, from the Adopted Budget's own Summary page. */
function Adopted2027() {
  const a = stageDoc(2027, 'adopted')!
  const prelim = stageDoc(2027, 'preliminary')
  const w = a.townWide!
  const unchanged = prelim !== null && prelim.totals.appropriations === a.totals.appropriations && prelim.totals.levy === a.totals.levy
  return (
    <aside
      role="note"
      data-adopted-update
      style={{ border: '1px solid var(--rbl-success-border)', borderRadius: 14, background: 'var(--rbl-success-bg)', padding: '18px 22px', margin: '0 0 18px', color: 'var(--rbl-text)', lineHeight: 1.55, width: 'fit-content', maxWidth: '100%', boxSizing: 'border-box' }}
    >
      <strong style={{ display: 'block', color: 'var(--rbl-title)', fontSize: 18 }}>The 2027 budget is adopted.</strong>
      <p style={{ margin: '6px 0 0', color: 'var(--rbl-text-body)', fontSize: 16 }}>
        {adoption2027?.date
          ? <>The Town Board adopted it on {longDate(adoption2027.date)}{adoption2027.resolution ? <> (Resolution {adoption2027.resolution.replace('#', '')}, {adoption2027.vote})</> : null}</>
          : <>The Town has published its 2027 Adopted Budget</>}
        {unchanged ? ', unchanged from the Preliminary' : ''}: {usd(a.totals.appropriations)} across all funds. The town-wide levy is {usd(w.levy)}, up{' '}
        {pct(w.levy, w.priorLevy)} from 2026, and the town-wide tax rate is ${w.rate.toFixed(3)} per $1,000 of assessed value, against ${w.priorRate.toFixed(3)} in 2026.
      </p>
      <p style={{ margin: '12px 0 0', display: 'flex', flexWrap: 'wrap', gap: '6px 20px', fontSize: 15, maxWidth: 'none' }}>
        <a href={`${base}/budget-amendments-2027/`} style={link}>The six amendments that shaped it →</a>
        <a href={`${base}/budget-adoption/`} style={link}>How it compares with every budget since 2005 →</a>
        {a.source?.url && <a href={a.source.url} target="_blank" rel="noreferrer" style={link}>2027 Adopted Budget (PDF) ↗</a>}
      </p>
    </aside>
  )
}

export default function PreliminaryUpdate({ tentative, children }: { tentative?: ReactNode; children?: ReactNode }) {
  if (stageDoc(2027, 'adopted')?.townWide) return <Adopted2027 />
  if (!preliminaryIsLatest()) return null
  const prelim = stageDoc(2027, 'preliminary')!
  const tent = stageDoc(2027, 'tentative')!
  const p = prelim.townWide!
  const t = tent.townWide!
  const gfP = prelim.funds.A01?.levy
  const gfT = tent.funds.A01?.levy
  return (
    <aside
      role="note"
      data-preliminary-update
      style={{ border: '1px solid var(--rbl-info-border)', borderRadius: 14, background: 'var(--rbl-info-bg)', padding: '18px 22px', margin: '0 0 18px', color: 'var(--rbl-text)', lineHeight: 1.55, width: 'fit-content', maxWidth: '100%', boxSizing: 'border-box' }}
    >
      <strong style={{ display: 'block', color: 'var(--rbl-title)', fontSize: 18 }}>The Town’s 2027 Preliminary Budget is out.</strong>
      <p style={{ margin: '6px 0 0', color: 'var(--rbl-info-text)', fontSize: 16 }}>
        The Board’s six amendments on October 20 turned the Supervisor’s Tentative into it. Its town-wide levy is {usd(p.levy)}, up{' '}
        {pct(p.levy, p.priorLevy)} from 2026, against {usd(t.levy)}, up {pct(t.levy, t.priorLevy)}, in the Tentative.
        {gfP != null && gfT != null && <> The General Fund levy is {usd(gfP)}, {usd(gfT - gfP)} lower.</>}
        {' '}It is still a proposal.{hearingHeld ? <> The public hearing was held on {hearingHeld},</> : ' The Board holds a public hearing on it,'} and the Board must adopt a
        budget by November 20; if it does not, the Preliminary takes effect.
      </p>
      {tentative && <p style={{ margin: '10px 0 0', color: 'var(--rbl-text-sub)', fontSize: 15 }}><strong>The Tentative, as filed in September:</strong> {tentative}</p>}
      {children && <p style={{ margin: '10px 0 0', color: 'var(--rbl-text-sub)', fontSize: 15 }}>{children}</p>}
      <p style={{ margin: '12px 0 0', display: 'flex', flexWrap: 'wrap', gap: '6px 20px', fontSize: 15, maxWidth: 'none' }}>
        <a href={`${base}/budget-amendments-2027/`} style={link}>The six amendments and their sources →</a>
        <a href={`${base}/tentative-2027/`} style={link}>The Tentative against this site’s forecast →</a>
        {prelim.source?.url && <a href={prelim.source.url} target="_blank" rel="noreferrer" style={link}>2027 Preliminary Budget (PDF) ↗</a>}
      </p>
    </aside>
  )
}
