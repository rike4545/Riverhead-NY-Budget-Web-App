import stages from '../public/data/history/budget-stages.json'
import supplement from '../public/data/budget-supplement/current-lines.json'

type StageIndex = {
  years: Record<string, { tentative?: { source?: { title: string; url: string } }; preliminary?: { source?: { title: string; url: string } }; adopted?: unknown }>
}
type SupplementIndex = {
  supplementYear?: number
  columns?: { tentative?: number; preliminary?: number; adopted?: number }
  source?: { title?: string; url?: string }
}

const stageIndex = stages as unknown as StageIndex
const lineIndex = supplement as unknown as SupplementIndex
const latestProposalYear = Math.max(
  ...Object.entries(stageIndex.years)
    .filter(([, year]) => year.preliminary || year.tentative)
    .map(([year]) => Number(year)),
)
const preliminary = stageIndex.years[String(latestProposalYear)]?.preliminary
const linesMatchPreliminary =
  preliminary !== undefined &&
  lineIndex.supplementYear === latestProposalYear &&
  lineIndex.columns?.preliminary === latestProposalYear

/**
 * Warns on line-level views when the official Summary has advanced to
 * Preliminary but detailed Supplement rows are still only Tentative.
 * Never substitutes tentative line figures for an unavailable preliminary
 * line table without saying so.
 */
export default function ProposalLineStageNotice() {
  if (!preliminary || linesMatchPreliminary) return null
  const stageSource = preliminary.source
  const lineSource = lineIndex.source
  return (
    <aside
      role="note"
      style={{
        border: '1px solid var(--rbl-border-subtle)',
        borderLeft: '4px solid var(--rbl-accent)',
        borderRadius: 12,
        background: 'var(--rbl-info-bg)',
        padding: '12px 15px',
        margin: '0 0 16px',
        color: 'var(--rbl-text)',
        lineHeight: 1.5,
      }}
    >
      <strong>{latestProposalYear} Preliminary Budget published; account-level detail is not yet matched.</strong>
      <p style={{ margin: '5px 0 0', color: 'var(--rbl-text-sub)', fontSize: 13.5 }}>
        The fund Summary has advanced to the Preliminary stage, but the available line-level Supplement data has not been verified as a Preliminary column. Detailed account comparisons on this page may therefore still reflect the Tentative Budget and should not be read as the Board&apos;s final line-by-line changes.
      </p>
      <p style={{ margin: '7px 0 0', fontSize: 13 }}>
        {stageSource?.url && <a href={stageSource.url} target="_blank" rel="noreferrer">Read the Preliminary Budget</a>}
        {stageSource?.url && lineSource?.url && ' · '}
        {lineSource?.url && <a href={lineSource.url} target="_blank" rel="noreferrer">Check the available Supplement source</a>}
      </p>
    </aside>
  )
}
