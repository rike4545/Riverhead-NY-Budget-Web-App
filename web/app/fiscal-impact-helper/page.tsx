import PageShell from '../../components/PageShell'
import PlainCallout from '../../components/PlainCallout'
import FisHelper from '../../components/FisHelper'
import { buildHelperData, type SupplementLine } from '../../lib/fis-helper'
import { plainAccountName, departmentName, FUND_NAMES, isFundWide } from '../../lib/account-names'
import { meetings, CHANGES_YEAR } from '../../lib/account-changes-data'
import current from '../../public/data/budget-supplement/current-lines.json'

const base = process.env.NEXT_PUBLIC_BASE_PATH || ''
const link = { color: 'var(--rbl-link)', fontWeight: 600 } as const

export const metadata = {
  title: 'Fiscal impact statement helper',
  description: 'An unofficial, step-by-step helper for Town of Riverhead staff filling in the Fiscal Impact Statement on a Town Board resolution: pick the department, the kind of change and the accounts, check it, and print the form.',
}

type WithCreates = { meetingDate: string; resolutions: { number: string | null; vote?: { adopted: boolean | null } | null; funding?: { createsAccounts?: string[] | null } | null }[] }
/** Adopted resolutions this year whose budget tables name an account that did not exist before. */
const creating = (meetings as unknown as WithCreates[])
  .filter((m) => m.meetingDate.startsWith(`${CHANGES_YEAR}-`))
  .flatMap((m) => m.resolutions.filter((r) => r.vote?.adopted === true && (r.funding?.createsAccounts?.length ?? 0) > 0))
const card = { background: 'var(--rbl-surface)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 16, padding: 20, marginBottom: 16 } as const
const prose = { margin: '0 0 10px', color: 'var(--rbl-text-body)', fontSize: 15.5, lineHeight: 1.6, maxWidth: '75ch' } as const
const td = { padding: '6px 8px', verticalAlign: 'top' } as const

const data = buildHelperData(current.lines as unknown as SupplementLine[], meetings, { plainAccountName, departmentName, FUND_NAMES, isFundWide }, CHANGES_YEAR)

export default function FiscalImpactHelperPage() {
  return (
    <PageShell
      title="Fiscal impact statement helper"
      subtitle="For Town staff preparing a Town Board resolution: choose your department, say what the resolution does with money, pick the accounts, check the result and print the Town’s form filled in."
    >
      <PlainCallout
        tips={[
          { label: 'Section G', text: 'the part that names the accounts. Budget adjustments list the revenue or savings account under “Grant or other Revenue Source” and the spending lines under “Appropriation Transfer”, as the Town’s accounting staff fill it.' },
          { label: 'Journal entries', text: 'a resolution can carry one or several. Each one balances on its own and stays in one fund.' },
          { label: 'Private', text: 'everything runs in your browser. Nothing you type is sent or saved.' },
        ]}
      >
        Every resolution carries a Fiscal Impact Statement, but in the records this site has read most of them name no accounts, and one
        (2026-765) put a different amount in section G from the table the Board adopted. This helper lists every account in your
        department from the 2027 Budget Supplement, with what it spent and what it is budgeted, and writes sections A to G and the budget
        table the same way the Town’s accounting staff do. It is an aid, not the Town’s form: follow the Accounting Department’s
        instructions, which review every statement. For the words, see the{' '}
        <a href={`${base}/glossary/#term-appropriations`} style={link}>glossary</a> and{' '}
        <a href={`${base}/accounting-basics/`} style={link}>How the Town’s books work</a>.
      </PlainCallout>
      <FisHelper data={data} />

      <section id="new-account" data-new-account-guide aria-labelledby="new-account-heading" className="fis-noprint" style={card}>
        <h2 id="new-account-heading" style={{ margin: '0 0 8px', color: 'var(--rbl-title)', fontSize: 20 }}>How a new account (sub-account) is created</h2>
        <p style={prose}>
          A new account is created the same way money is moved: by naming it in the resolution’s budget table. In the {CHANGES_YEAR} records,{' '}
          {creating.length} adopted resolutions named an account that did not exist before, most of them for capital projects. Resolution
          2026-843, for the Wading River Duck Ponds, authorized the Supervisor “to establish the following budget adjustments”, FROM{' '}
          <code>A01-9999-000-00000-0</code> Appropriated Fund Balance TO the new line <code>H01-1-1940-435-000-12620</code> Professional Services –
          Engineering, $40,000.
        </p>
        <div data-scroll-region style={{ overflowX: 'auto', marginBottom: 10 }}>
          <table className="rbl-stack" style={{ borderCollapse: 'collapse', fontSize: 14.5, maxWidth: 640, width: '100%' }}>
            <caption style={{ textAlign: 'left', fontWeight: 700, color: 'var(--rbl-text-strong)', paddingBottom: 6 }}>The parts of H01-1-1940-435-000-12620</caption>
            <thead><tr style={{ borderBottom: '1px solid var(--rbl-border)' }}><th scope="col" style={{ ...td, textAlign: 'left' }}>Part</th><th scope="col" style={{ ...td, textAlign: 'left' }}>Here</th><th scope="col" style={{ ...td, textAlign: 'left' }}>What it means</th></tr></thead>
            <tbody>
              {[
                ['Fund', 'H01', 'The fund that pays: here the Capital Projects Fund. A01 is the General Fund, DA1 the Highway Fund.'],
                ['Function group', '1', 'The first digit of the function: 1 general government, 3 public safety, 5 transportation, 7 culture and recreation, 8 home and community services, 9 employee benefits and other costs shared by the fund.'],
                ['Function', '1940', 'The service or department, from the State Comptroller’s chart of accounts.'],
                ['Object', '435', 'What is bought: 435 is professional services, 111 overtime, 402 building repairs.'],
                ['Sub-object', '000', 'A finer split of the object, when the Town uses one.'],
                ['Sub-account or project', '12620', 'The capital project number for project lines; 00000 for ordinary lines.'],
              ].map(([part, here, what]) => (
                <tr key={part} style={{ borderBottom: '1px solid var(--rbl-border-subtle)' }}>
                  <th scope="row" style={{ ...td, textAlign: 'left' }}>{part}</th>
                  <td data-label="Here" style={td}><code>{here}</code></td>
                  <td data-label="What it means" className="rbl-stack-prose" style={td}>{what}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ol style={{ ...prose, paddingLeft: 22, display: 'grid', gap: 6 }}>
          <li>Check the account lists above first: the line may already exist in your department or elsewhere in the fund.</li>
          <li>If it does not, use “A new account, not yet in the budget” in the entry. It keeps your department’s fund and function and lets you pick the object code from the ones the Town uses, with their usual names.</li>
          <li>Name the new account in the resolution’s budget table and in section G, where the helper marks it “(new account)”.</li>
          <li>Send the draft to the Accounting Department before the resolution goes on the agenda. It assigns and creates accounts, so confirm the number with it; a new revenue account is set up the same way.</li>
        </ol>
        <p style={{ ...prose, margin: 0, fontSize: 14, color: 'var(--rbl-text-muted)' }}>
          The function groups follow the State Comptroller’s uniform chart of accounts for towns. This is a description of the Town’s practice in its own records, not
          an instruction from the Town.
        </p>
      </section>
    </PageShell>
  )
}
