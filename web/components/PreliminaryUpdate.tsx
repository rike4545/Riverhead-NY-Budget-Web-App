import type { ReactNode } from 'react'
import { stageDoc } from '../lib/budget-stages'
import { NEXT_STEPS } from '../lib/budget-amendments-2027'
import { RECORD } from '../lib/budget-adoption'
import september from '../public/data/budget-2027-prediction-september.json'

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

const signed = (n: number) => (n === 0 ? 'no change' : `${n > 0 ? '+' : '−'}${usd(Math.abs(n))}`)
const cellStyle = { padding: '6px 10px', textAlign: 'right' as const, verticalAlign: 'top' as const, whiteSpace: 'nowrap' as const }

/**
 * The three stages side by side, with 2026 for reference. Every figure is from
 * a book's own Summary page (budget-stages.json); 2026's town-wide figures are
 * the 2027 books' own prior-year columns. Each later stage shows its change
 * from the one before, and the adopted column its change from 2026.
 */
function StageTable() {
  const t = stageDoc(2027, 'tentative')
  const p = stageDoc(2027, 'preliminary')
  const a = stageDoc(2027, 'adopted')
  const prior = stageDoc(2026, 'adopted')
  if (!t?.townWide || !p?.townWide || !a?.townWide || !prior) return null
  type Doc = NonNullable<typeof a>
  const rows: { label: string; pick: (d: Doc) => number; base: number; rate?: boolean }[] = [
    { label: 'Town-wide spending (General Fund, Highway, Street Lighting)', pick: (d) => d.townWide!.appropriations, base: a.townWide.priorAppropriations },
    { label: 'Town-wide levy', pick: (d) => d.townWide!.levy, base: a.townWide.priorLevy },
    { label: 'Town-wide tax rate per $1,000 of assessed value', pick: (d) => d.townWide!.rate, base: a.townWide.priorRate, rate: true },
    { label: 'General Fund spending', pick: (d) => d.funds.A01?.appropriations ?? 0, base: prior.funds.A01?.appropriations ?? 0 },
    { label: 'General Fund savings used', pick: (d) => d.funds.A01?.fundBalance ?? 0, base: prior.funds.A01?.fundBalance ?? 0 },
    { label: 'Spending across all funds', pick: (d) => d.totals.appropriations, base: prior.totals.appropriations },
    { label: 'Levy across all funds', pick: (d) => d.totals.levy, base: prior.totals.levy },
    { label: 'Savings used across all funds', pick: (d) => d.totals.fundBalance ?? 0, base: prior.totals.fundBalance ?? 0 },
  ]
  const show = (v: number, rate?: boolean) => (rate ? `$${v.toFixed(3)}` : usd(v))
  const change = (v: number, rate?: boolean) =>
    v === 0 ? 'no change' : `${v > 0 ? '+' : '−'}${rate ? `$${Math.abs(v).toFixed(3)}` : usd(Math.abs(v))}`
  const pctOf = (v: number, base: number) => `${v - base >= 0 ? '+' : '−'}${Math.abs((v / base - 1) * 100).toFixed(2)}%`
  const sub = { color: 'var(--rbl-text-muted)', fontSize: 12.5, fontWeight: 400 } as const
  return (
    <div style={{ overflowX: 'auto', margin: '12px 0 0' }}>
      <table data-stage-table className="rbl-stack stage-table" style={{ borderCollapse: 'collapse', fontSize: 14, background: 'var(--rbl-surface)' }}>
        <caption style={{ textAlign: 'left', fontWeight: 700, color: 'var(--rbl-title)', padding: '0 0 6px', fontSize: 15 }}>
          The three stages of the 2027 budget, from each book’s Summary page
        </caption>
        <thead>
          <tr style={{ color: 'var(--rbl-text-muted)', borderBottom: '1px solid var(--rbl-border-subtle)' }}>
            <th scope="col" style={{ ...cellStyle, textAlign: 'left' }}>Figure</th>
            <th scope="col" style={cellStyle}>2026<br /><span style={{ fontWeight: 400 }}>adopted</span></th>
            <th scope="col" style={cellStyle}>2027 Tentative<br /><span style={{ fontWeight: 400 }}>the Supervisor’s</span></th>
            <th scope="col" style={cellStyle}>2027 Preliminary<br /><span style={{ fontWeight: 400 }}>after the Oct. 20 amendments</span></th>
            <th scope="col" style={cellStyle}>2027 Adopted<br /><span style={{ fontWeight: 400 }}>Nov. 17</span></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const [vt, vp, va] = [t, p, a].map((d) => r.pick(d))
            return (
              <tr key={r.label} style={{ borderBottom: '1px solid var(--rbl-border-subtle)' }}>
                <th scope="row" style={{ ...cellStyle, textAlign: 'left', whiteSpace: 'normal', fontWeight: 600, color: 'var(--rbl-text-body)' }}>{r.label}</th>
                <td data-label="2026 adopted" style={{ ...cellStyle, color: 'var(--rbl-text-sub)' }}><span>{show(r.base, r.rate)}</span></td>
                <td data-label="2027 Tentative" style={cellStyle}><span>{show(vt, r.rate)}</span></td>
                <td data-label="2027 Preliminary" style={cellStyle}><span>{show(vp, r.rate)}<span style={{ ...sub, display: 'block' }}>{change(vp - vt, r.rate)} from the Tentative</span></span></td>
                <td data-label="2027 Adopted" style={{ ...cellStyle, fontWeight: 700 }}>
                  <span>
                    {show(va, r.rate)}
                    <span style={{ ...sub, display: 'block' }}>{change(va - vp, r.rate)} from the Preliminary</span>
                    <span style={{ ...sub, display: 'block' }}>{change(va - r.base, r.rate)} ({pctOf(va, r.base)}) from 2026</span>
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

/**
 * This site's September model, kept as it was made (budget-2027-prediction-september.json).
 * A projection from recent cost trends and contract raises, not a Town figure and not what happened.
 */
function SeptemberModel() {
  const a = stageDoc(2027, 'adopted')
  if (!a) return null
  const m = september.levyEstimate
  const actualPct = ((a.totals.levy / m.levy2026 - 1) * 100).toFixed(2)
  return (
    <p data-september-model style={{ margin: '12px 0 0', color: 'var(--rbl-text-sub)', fontSize: 14.5, maxWidth: '75ch' }}>
      <strong>This site’s September prediction was a model, not a Town figure.</strong> Before the Tentative existed, it grew each 2026 budget line
      by a rate drawn from recent cost trends and contract raises, and projected a levy across all funds of {usd(m.levy2027)}, up {m.levyIncreasePct}%.
      What the Board adopted is {usd(a.totals.levy)}, up {actualPct}%: {usd(m.levy2027 - a.totals.levy)} less than the model.{' '}
      <a href={`${base}/predict-2027/`} style={link}>How the model was built →</a>
    </p>
  )
}

/** Once the 2027 budget is adopted: what was adopted, from the Adopted Budget's own Summary page. */
function Adopted2027({ note }: { note?: ReactNode }) {
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
      <StageTable />
      <SeptemberModel />
      {note && <p style={{ margin: '10px 0 0', color: 'var(--rbl-text-sub)', fontSize: 14.5, maxWidth: '75ch' }}>{note}</p>}
      <p style={{ margin: '12px 0 0', display: 'flex', flexWrap: 'wrap', gap: '6px 20px', fontSize: 15, maxWidth: 'none' }}>
        <a href={`${base}/budget-amendments-2027/`} style={link}>The six amendments that shaped it →</a>
        <a href={`${base}/tentative-2027/`} style={link}>The Tentative, fund by fund →</a>
        <a href={`${base}/budget-adoption/`} style={link}>How it compares with every budget since 2005 →</a>
        {a.source?.url && <a href={a.source.url} target="_blank" rel="noreferrer" style={link}>2027 Adopted Budget (PDF) ↗</a>}
      </p>
    </aside>
  )
}

export default function PreliminaryUpdate({ tentative, children, adoptedNote }: { tentative?: ReactNode; children?: ReactNode; adoptedNote?: ReactNode }) {
  if (stageDoc(2027, 'adopted')?.townWide) return <Adopted2027 note={adoptedNote} />
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
