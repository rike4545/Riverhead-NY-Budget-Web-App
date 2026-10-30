import stages from '../public/data/history/budget-stages.json'
import supplement from '../public/data/budget-supplement/current-lines.json'
import { amendmentEffect } from '../lib/budget-amendments-effect'
import { AMENDMENTS } from '../lib/budget-amendments-2027'

type StageIndex = {
  years: Record<string, {
    tentative?: { source?: { title: string; url: string } }
    preliminary?: { source?: { title: string; url: string } }
    adopted?: unknown
  }>
}
type SupplementIndex = {
  supplementYear?: number
  columns?: { tentative?: number; preliminary?: number; adopted?: number }
  source?: { title?: string; url?: string }
}

const stageIndex = stages as unknown as StageIndex
const lineIndex = supplement as unknown as SupplementIndex
const latestAdoptedYear = Math.max(
  ...Object.entries(stageIndex.years)
    .filter(([, year]) => year.adopted)
    .map(([year]) => Number(year)),
)
const latestProposalYear = latestAdoptedYear + 1
const preliminary = stageIndex.years[String(latestProposalYear)]?.preliminary
const linesMatchPreliminary =
  preliminary !== undefined &&
  lineIndex.supplementYear === latestProposalYear &&
  lineIndex.columns?.preliminary === latestProposalYear

const usd = (value: number | null | undefined) =>
  value == null
    ? '—'
    : new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
      }).format(value)

/**
 * On line-level views, make the stage gap visible and show the arithmetic
 * overlay for the six adopted 2027 amendments until a verified Preliminary
 * line-level Supplement is available. The overlay is calculated from the
 * published resolutions; it is not represented as an official Town table.
 */
export default function ProposalLineStageNotice({ showAmendmentOverlay = false }: { showAmendmentOverlay?: boolean }) {
  if (linesMatchPreliminary || !amendmentEffect) return null

  const stageSource = preliminary?.source
  const lineSource = lineIndex.source
  const affectedAccounts = amendmentEffect.accounts
    .filter((row) => row.before !== null && row.after !== null)
    .sort((a, b) => a.account.localeCompare(b.account))

  return (
    <aside
      role="note"
      style={{
        border: '1px solid var(--rbl-accent)',
        borderRadius: 12,
        background: 'var(--rbl-info-bg)',
        padding: '12px 15px',
        margin: '0 0 16px',
        color: 'var(--rbl-text)',
        lineHeight: 1.5,
      }}
    >
      <strong>2027 Preliminary Budget: six amendments adopted; line-level figures are not yet reconciled.</strong>
      <p style={{ margin: '5px 0 0', color: 'var(--rbl-text-sub)', fontSize: 13.5 }}>
        The Town Board adopted six amendments on October 20, 2026. The Supplement available here still carries the 2027 Tentative column, so line-level comparisons remain based on the published Supplement. {showAmendmentOverlay ? 'The table below separately applies each adopted resolution’s net change to the Tentative account figure.' : 'The Budget Accuracy page separately calculates the net change for each affected account.'} These are this site’s calculations from the resolutions, not an official Town-published Preliminary line table. Do not treat unlisted accounts as changed.
      </p>
      <p style={{ margin: '7px 0 0', fontSize: 13 }}>
        <a href="/Riverhead-NY-Budget-Web-App/budget-amendments-2027/" target="_blank" rel="noreferrer">Read the six amendments and their sources</a>
        {lineSource?.url && <> · <a href={lineSource.url} target="_blank" rel="noreferrer">2027 Budget Supplement</a></>}
        {stageSource?.url && <> · <a href={stageSource.url} target="_blank" rel="noreferrer">Preliminary Budget source</a></>}
      </p>

      {showAmendmentOverlay && <>
      <h2 style={{ margin: '14px 0 5px', color: 'var(--rbl-title)', fontSize: 16 }}>
        Accounts changed by the six amendments
      </h2>
      <p style={{ margin: '0 0 9px', color: 'var(--rbl-text-sub)', fontSize: 12.5 }}>
        Tentative figure + net resolution change = calculated amended figure. Amounts are rounded to whole dollars for display.
      </p>
      <div tabIndex={0} role="region" aria-label="Calculated amendment account comparison table" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', minWidth: 720, borderCollapse: 'collapse', fontSize: 12.5 }}>
          <thead>
            <tr style={{ textAlign: 'left', color: 'var(--rbl-text-muted)', borderBottom: '1px solid var(--rbl-border-subtle)' }}>
              <th style={{ padding: '7px 8px' }}>Account / line</th>
              <th style={{ padding: '7px 8px', textAlign: 'right' }}>2027 Tentative</th>
              <th style={{ padding: '7px 8px', textAlign: 'right' }}>Net change</th>
              <th style={{ padding: '7px 8px', textAlign: 'right' }}>Calculated Preliminary</th>
              <th style={{ padding: '7px 8px' }}>Resolution</th>
            </tr>
          </thead>
          <tbody>
            {affectedAccounts.map((row) => (
              <tr key={row.account} style={{ borderBottom: '1px solid var(--rbl-border-subtle)' }}>
                <td style={{ padding: '7px 8px' }}>
                  <strong style={{ color: 'var(--rbl-title)' }}>{row.supplementName ?? row.name}</strong>
                  <div style={{ color: 'var(--rbl-text-muted)', fontSize: 11 }}>{row.account}</div>
                </td>
                <td style={{ padding: '7px 8px', textAlign: 'right', whiteSpace: 'nowrap' }}>{usd(row.before)}</td>
                <td style={{ padding: '7px 8px', textAlign: 'right', whiteSpace: 'nowrap', color: row.change < 0 ? 'var(--rbl-danger)' : 'var(--rbl-text-body)' }}>
                  {row.change > 0 ? '+' : ''}{usd(row.change)}
                </td>
                <td style={{ padding: '7px 8px', textAlign: 'right', whiteSpace: 'nowrap', fontWeight: 700 }}>{usd(row.after)}</td>
                <td style={{ padding: '7px 8px', whiteSpace: 'nowrap' }}>
                  {row.amendments.map((n) => {
                    const amendment = AMENDMENTS.find((item) => item.n === n)
                    return amendment ? `#${n}` : ''
                  }).filter(Boolean).join(', ')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p style={{ margin: '9px 0 0', color: 'var(--rbl-text-sub)', fontSize: 12.5 }}>
        These calculated amounts are only the lines explicitly changed in Resolutions 2026-935 through 2026-940. They do not replace the Town’s full Preliminary Budget or imply that every other Tentative line has been independently confirmed.
      </p>
      </>}
    </aside>
  )
}
