import PageShell from '../../components/PageShell'
import PlainCallout from '../../components/PlainCallout'
import { generalFund } from '../../lib/general-fund'
import { budgetHistory } from '../../lib/budget-history'

const base = process.env.NEXT_PUBLIC_BASE_PATH || ''
const card = { background: 'var(--rbl-surface)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 16, padding: 18 } as const

export const metadata = {
  title: 'Data Downloads — CSV, JSON & research packets',
  description: 'Download Riverhead budget, payroll, salary, voting and financial-report data as CSV, JSON or curated ZIP research packets.',
}

const datasets = [
  {
    file: 'payroll_actual_2018_2025.csv',
    title: 'Actual payroll, 2018–2025',
    rows: '5,993 rows',
    desc: 'Every employee-year: base pay, overtime, gross pay, union, and (from 2022) department and title.',
    json: `${base}/data/payroll/records.json`,
  },
  {
    file: 'authorized_salary_2026.csv',
    title: 'Board-authorized salaries, 2026',
    rows: '362 rows',
    desc: 'The base salary the Town Board set for each position in the January 2026 salary resolutions.',
    json: `${base}/data/salary/authorized-2026.json`,
  },
  {
    file: 'authorized_salary_2025.csv',
    title: 'Board-authorized salaries, 2025',
    rows: '345 rows',
    desc: 'Same, from the January 2025 salary resolutions (2025-8 through 2025-18).',
    json: `${base}/data/salary/authorized-2025.json`,
  },
  {
    file: 'salary_raises_2025_to_2026.csv',
    title: 'Raises, 2025 → 2026',
    rows: '362 rows',
    desc: 'Each position’s authorized salary in both years, the raise in dollars and percent, and whether the title changed (promotion).',
    json: `${base}/data/salary/comparison-2025-2026.json`,
  },
  {
    file: 'town_board_votes.csv',
    title: 'Town Board voting record',
    rows: '1,672 votes · 39 meetings',
    desc: 'Every resolution voted on since January 2025: the result, mover, seconder, and how each member voted.',
    json: `${base}/data/meetings/index.json`,
  },
  {
    file: 'board_member_voting_records.csv',
    title: 'Board member career records',
    rows: '6 members, by year',
    desc: 'Each member’s yes/no/abstain/absent tallies per year, aggregated from every meeting on record.',
    json: `${base}/data/meetings/members.json`,
  },
  {
    file: 'budget_line_items_2020_2026.csv',
    title: 'Budget line items, 2020–2026',
    rows: '848 rows',
    desc: 'Every account line in the 2026 adopted budget with its adopted amount in each year back to 2020.',
    json: `${base}/data/subaccounts/index.json`,
  },
  {
    file: 'fund_appropriations_2020_2026.csv',
    title: `Fund appropriations, ${budgetHistory.years[0]}–${budgetHistory.years[budgetHistory.years.length - 1]}`,
    rows: '19 funds',
    desc: 'Total adopted spending for every operating fund, each year.',
    json: `${base}/data/history/fund-appropriations.json`,
  },
  {
    // The file name stays as published; its rows follow the data.
    file: 'general_fund_2005_2025.csv',
    title: `General Fund history, ${generalFund.growth.firstYear}–${generalFund.growth.lastYear}`,
    rows: `${generalFund.rows.length} years`,
    desc: 'The main fund over two decades: appropriations, revenues, fund-balance use, and tax levy.',
    json: `${base}/data/history/general-fund.json`,
  },
  {
    file: 'afr_actual_results_2023_2025.csv',
    title: 'Actual results (AFR), 2023–2025',
    rows: '14 funds × 3 years',
    desc: 'Actual year-end revenues, spending, surplus/deficit, and ending fund balance from the Annual Financial Report.',
    json: `${base}/data/afr/2025.json`,
  },
]

const researchPackets = [
  {
    file: '2027-budget-research-packet.zip',
    title: '2027 Budget Season',
    description: 'Published budget-stage history, the separate 2027 projection, tax-cap inputs, and multi-year Supplement account data.',
    contents: '13 files · JSON, CSV, source register and SHA-256 manifest',
  },
  {
    file: 'financial-health-research-packet.zip',
    title: 'Financial Health & Reserves',
    description: '2025 AFR results, General Fund and fund history, revenue context, capital/workforce exposures, and Supplement history.',
    contents: '17 files · JSON, CSV, source register and SHA-256 manifest',
  },
  {
    file: 'town-board-decisions-research-packet.zip',
    title: 'Town Board Decisions & Votes',
    description: 'Meeting records, available fiscal-impact companions, voting records, campaign-finance context and consent-calendar data.',
    contents: 'All indexed meeting JSON files plus CSV vote exports and source register',
  },
]

export default function DownloadsPage() {
  return (
    <PageShell
      title="Data Downloads"
      subtitle="Every dataset on this site, free to download as CSV (for spreadsheets) or JSON (for developers). All figures trace back to official Town documents."
    >
      <PlainCallout
        tips={[
          { label: 'CSV', text: 'opens directly in Excel, Google Sheets, or Numbers.' },
          { label: 'JSON', text: 'the same data in the structured format this site runs on.' },
          { label: 'Attribution', text: 'data is derived from public Town of Riverhead records; verify against the official documents before publishing.' },
        ]}
      >
        Working on a story, a study, or your own analysis? Take the data with you — no scraping required.
      </PlainCallout>

      <section style={{ ...card, marginBottom: 18 }}>
        <h2 style={{ margin: '0 0 6px', color: 'var(--rbl-title)', fontSize: 21 }}>Curated research packets</h2>
        <p style={{ color: 'var(--rbl-text-body)', margin: '0 0 14px', lineHeight: 1.55 }}>
          Download a topic-specific ZIP instead of collecting files one at a time. Each packet includes a README, a SHA-256 checksum manifest,
          the release metadata, and the source-document register. The 2027 packet explicitly separates the Town's published budget stages from this site's independent projection.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(230px,100%),1fr))', gap: 10 }}>
          {researchPackets.map((packet) => (
            <article key={packet.file} style={{ background: 'var(--rbl-surface-2)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 12, padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <h3 style={{ margin: 0, color: 'var(--rbl-title)', fontSize: 16 }}>{packet.title}</h3>
              <p style={{ margin: 0, color: 'var(--rbl-text-body)', fontSize: 13.5, lineHeight: 1.5 }}>{packet.description}</p>
              <div style={{ marginTop: 'auto', color: 'var(--rbl-text-muted)', fontSize: 11.5 }}>{packet.contents}</div>
              <a href={`${base}/downloads/research-packets/${packet.file}`} download style={{ display: 'inline-flex', alignSelf: 'start', padding: '9px 13px', borderRadius: 9, background: 'var(--rbl-fill-accent)', color: 'white', fontWeight: 800, fontSize: 13, textDecoration: 'none' }}>
                Download research packet
              </a>
            </article>
          ))}
        </div>
      </section>

      <section style={{ display: 'grid', gap: 12 }}>
        {datasets.map((d) => (
          <article key={d.file} style={{ ...card, display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ minWidth: 0, flex: '1 1 380px' }}>
              <h2 style={{ margin: '0 0 4px', fontSize: 19, color: 'var(--rbl-title)' }}>{d.title}</h2>
              <p style={{ color: 'var(--rbl-text-body)', margin: 0, fontSize: 14.5, lineHeight: 1.5 }}>{d.desc}</p>
              <div style={{ color: 'var(--rbl-text-muted)', fontSize: 12.5, marginTop: 4 }}>{d.rows}</div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <a href={`${base}/downloads/${d.file}`} download style={{ padding: '10px 16px', borderRadius: 10, background: 'var(--rbl-fill-accent)', color: 'white', fontWeight: 800, textDecoration: 'none' }}>⬇ CSV</a>
              <a href={d.json} target="_blank" rel="noreferrer" style={{ padding: '10px 16px', borderRadius: 10, border: '1px solid var(--rbl-accent-border)', color: 'var(--rbl-accent)', fontWeight: 800, textDecoration: 'none' }}>JSON</a>
            </div>
          </article>
        ))}
      </section>

      <p style={{ color: 'var(--rbl-text-muted)', fontSize: 13, lineHeight: 1.5, marginTop: 16 }}>
        These files are regenerated automatically whenever the underlying data updates. The parsing code is open source in
        the <a href="https://github.com/rike4545/Riverhead-NY-Budget-Web-App" style={{ color: 'var(--rbl-accent)', fontWeight: 700 }}>GitHub repository</a>.
      </p>
    </PageShell>
  )
}
