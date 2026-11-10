import type { ReactNode } from 'react'
import { stageDoc } from '../lib/budget-stages'
import { NEXT_STEPS } from '../lib/budget-amendments-2027'

const base = process.env.NEXT_PUBLIC_BASE_PATH || ''
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
// parsed, and nothing once the Board has adopted a 2027 budget (the adopted
// figures replace both).
export default function PreliminaryUpdate({ tentative, children }: { tentative?: ReactNode; children?: ReactNode }) {
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
      style={{ border: '1px solid var(--rbl-accent)', borderRadius: 12, background: 'var(--rbl-info-bg)', padding: '12px 15px', margin: '0 0 16px', color: 'var(--rbl-text)', lineHeight: 1.5 }}
    >
      <strong>The Town’s 2027 Preliminary Budget is out.</strong>
      <p style={{ margin: '5px 0 0', color: 'var(--rbl-text-sub)', fontSize: 14 }}>
        The Board’s six amendments on October 20 turned the Supervisor’s Tentative into it. Its town-wide levy is {usd(p.levy)}, up{' '}
        {pct(p.levy, p.priorLevy)} from 2026, against {usd(t.levy)}, up {pct(t.levy, t.priorLevy)}, in the Tentative.
        {gfP != null && gfT != null && <> The General Fund levy is {usd(gfP)}, {usd(gfT - gfP)} lower.</>}
        {' '}It is still a proposal.{hearingHeld ? <> The public hearing was held on {hearingHeld},</> : ' The Board holds a public hearing on it,'} and the Board must adopt a
        budget by November 20; if it does not, the Preliminary takes effect.
      </p>
      {tentative && <p style={{ margin: '7px 0 0', color: 'var(--rbl-text-sub)', fontSize: 13.5 }}><strong>The Tentative, as filed in September:</strong> {tentative}</p>}
      {children && <p style={{ margin: '7px 0 0', color: 'var(--rbl-text-sub)', fontSize: 13.5 }}>{children}</p>}
      <p style={{ margin: '7px 0 0', fontSize: 13.5 }}>
        <a href={`${base}/budget-amendments-2027/`}>The six amendments and their sources</a>
        {' · '}<a href={`${base}/tentative-2027/`}>The Tentative against this site’s forecast</a>
        {prelim.source?.url && <> · <a href={prelim.source.url} target="_blank" rel="noreferrer">2027 Preliminary Budget (PDF)</a></>}
      </p>
    </aside>
  )
}
