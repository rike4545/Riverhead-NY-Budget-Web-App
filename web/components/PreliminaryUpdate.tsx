import { stageDoc } from '../lib/budget-stages'

const base = process.env.NEXT_PUBLIC_BASE_PATH || ''
const usd = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
const pct = (to: number, from: number) => `${((to / from - 1) * 100).toFixed(2)}%`

// For pages that describe the 2027 Tentative. The Board's six October 20, 2026
// amendments turned it into the Preliminary Budget; once the Town prints that
// book, this says what changed. It renders nothing before then, and nothing once
// the Board has adopted a 2027 budget (the adopted figures replace both).
export default function PreliminaryUpdate() {
  const prelim = stageDoc(2027, 'preliminary')
  const tent = stageDoc(2027, 'tentative')
  if (!prelim?.townWide || !tent?.townWide || stageDoc(2027, 'adopted')) return null
  const p = prelim.townWide
  const t = tent.townWide
  const gfP = prelim.funds.A01?.levy
  const gfT = tent.funds.A01?.levy
  return (
    <aside
      role="note"
      data-preliminary-update
      style={{ border: '1px solid var(--rbl-accent)', borderRadius: 12, background: 'var(--rbl-info-bg)', padding: '12px 15px', margin: '0 0 16px', color: 'var(--rbl-text)', lineHeight: 1.5 }}
    >
      <strong>The Board’s amendments have since turned the Tentative into the Preliminary Budget.</strong>
      <p style={{ margin: '5px 0 0', color: 'var(--rbl-text-sub)', fontSize: 13.5 }}>
        The Preliminary’s town-wide levy is {usd(p.levy)}, up {pct(p.levy, p.priorLevy)} from 2026, against {usd(t.levy)}, up {pct(t.levy, t.priorLevy)}, in the Tentative.
        {gfP != null && gfT != null && <> The General Fund levy is {usd(gfP)}, {usd(gfT - gfP)} lower.</>}
        {' '}It is still a proposal: the Board adopts a budget by November 20.
      </p>
      <p style={{ margin: '7px 0 0', fontSize: 13 }}>
        <a href={`${base}/budget-amendments-2027/`}>Read the six amendments and their sources</a>
        {prelim.source?.url && <> · <a href={prelim.source.url} target="_blank" rel="noreferrer">2027 Preliminary Budget</a></>}
      </p>
    </aside>
  )
}
