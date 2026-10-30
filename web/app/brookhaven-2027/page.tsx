import type { CSSProperties, ReactNode } from 'react'
import PageShell from '../../components/PageShell'
import PlainCallout from '../../components/PlainCallout'
import {
  BROOKHAVEN_2026_ADOPTED, BROOKHAVEN_BOOK, BROOKHAVEN_FUND_BALANCES, BROOKHAVEN_LEVY, BROOKHAVEN_QUOTES, BROOKHAVEN_SALARIES,
  BROOKHAVEN_SOURCE, BROOKHAVEN_STATED,
} from '../../lib/brookhaven-2027'
import { brookhaven, growth, perResident, population, riverhead, riverheadPolice } from '../../lib/brookhaven-compare'
import { AUDIT_2025 } from '../../lib/audits'
import { lineSource } from '../../lib/funds-2027'
import { districtHoldings, generalFundResults, savings } from '../../lib/savings-used'
import { TENTATIVE_FUND_BALANCES_2027 as TFB } from '../../lib/tentative-fund-balances'

export const metadata = {
  title: 'Brookhaven’s 2027 Tentative beside Riverhead’s',
  description:
    'The Town of Brookhaven’s 2027 Tentative Operating Budget set beside Riverhead’s 2027 Tentative: how each balances, how fast each grows, what each tells residents, and what Riverhead could borrow.',
}

const base = process.env.NEXT_PUBLIC_BASE_PATH || ''
const usd = (n: number) => `${n < 0 ? '−' : ''}$${Math.round(Math.abs(n)).toLocaleString('en-US')}`
const pct = (n: number, d = 1) => `${n.toFixed(d)}%`
const signedPct = (n: number, d = 1) => `${n >= 0 ? 'up' : 'down'} ${Math.abs(n).toFixed(d)}%`
const NUMBER_WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine']
const count = (n: number) => NUMBER_WORDS[n] ?? String(n)
const words = (items: string[]) => (items.length < 3 ? items.join(' and ') : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`)
const lower = (s: string) => s.charAt(0).toLowerCase() + s.slice(1)
const times = (n: number) => (n === 2 ? 'twice' : `${count(n)} times`)
/** "11–13" for consecutive pages, "11, 14" otherwise. */
const pageList = (pages: number[]) => (pages.length > 1 && pages[pages.length - 1] - pages[0] === pages.length - 1 ? `${pages[0]}–${pages[pages.length - 1]}` : pages.join(', '))

const SECTIONS = [
  ['glance', 'At a glance'],
  ['residents', 'Per resident'],
  ['takeaways', 'What Riverhead residents can take from it'],
  ['improve', 'How Riverhead’s budget could be improved'],
  ['differ', 'Where the two towns differ'],
  ['method', 'How this page was made'],
  ['sources', 'Sources'],
] as const

export default function BrookhavenComparisonPage() {
  const bh = brookhaven
  const rh = riverhead
  const fb = BROOKHAVEN_FUND_BALANCES
  const funds = fb.major.length + fb.special.length
  const bhPage = (p: number | string) => `Brookhaven PDF ${String(p).includes('–') ? 'pp.' : 'p.'} ${p}`
  const quote = (k: keyof typeof BROOKHAVEN_QUOTES) => BROOKHAVEN_QUOTES[k].text
  const sewer = districtHoldings?.funds.find((f) => f.key === 'sewer')
  const leaning = savings ? [...savings.rows].sort((a, b) => b.sharePct - a.sharePct) : []
  const gfFirst = generalFundResults[0]
  const brookhavenWaterSewer = fb.special.filter((r) => r.group === 'Sewer districts' || r.code === 'SWSB')
  const ratio = rh ? bh.spending / rh.spending : null

  if (!rh) {
    return (
      <PageShell title="Brookhaven’s 2027 Tentative beside Riverhead’s" subtitle="Riverhead’s 2027 Tentative is not in this site’s records yet, so there is nothing to set beside Brookhaven’s.">
        <P>This page returns when Riverhead’s Tentative Summary has been read.</P>
      </PageShell>
    )
  }

  return (
    <PageShell
      title="Brookhaven’s 2027 Tentative beside Riverhead’s"
      subtitle={`The Town of Brookhaven’s 2027 Tentative Operating Budget, dated ${BROOKHAVEN_SOURCE.dated}, set beside Riverhead’s: how each balances, how fast each grows, what each tells residents, and what Riverhead could borrow.`}
    >
      <PlainCallout
        tips={[
          { label: 'Two proposals', text: 'both are Tentative budgets, each Supervisor’s proposal. Each Town Board can change its own before it adopts a budget by November 20.' },
          { label: 'Savings', text: '“appropriated fund balance”: money left from earlier years that a budget counts as income. The Funds Explorer shows how Riverhead’s funds use it.' },
          { label: 'Read from a scan', text: 'Brookhaven’s copy has no text layer, so its figures were read from the page images and checked by adding up its own tables.' },
        ]}
      >
        Brookhaven, Suffolk’s largest town, proposes to spend {usd(bh.spending)} in 2027
        {ratio !== null && <>, about {count(Math.round(ratio))} times Riverhead’s {usd(rh.spending)}</>}. The biggest difference is not size.
        Brookhaven’s Tentative balances every fund but one sewer district without dipping into savings, and its Supervisor puts the
        levy increase at {pct(BROOKHAVEN_STATED.levyAdjustmentPct, 2)}. Riverhead’s uses {usd(rh.savingsUsed)} of savings, most of it in
        the water and sewer districts, and its town-wide levy rises {pct(growth.riverheadMainLevy ?? 0, 2)}, the limit its Supervisor states.
        {perResident && <> Per resident, Riverhead’s town government spends about {count(Math.round(perResident.riverhead.spending / perResident.brookhaven.spending))} times what Brookhaven’s does, mostly because it runs its own police, water and sewer services.</>}
      </PlainCallout>

      <div className="tcl-layout">
        <nav aria-label="On this page" className="tcl-contents">
          <div style={{ fontWeight: 700, color: 'var(--rbl-title)', fontSize: 15, marginBottom: 6 }}>On this page</div>
          <ol style={{ margin: 0, paddingLeft: 18, display: 'grid', gap: 4 }}>
            {SECTIONS.map(([id, label]) => <li key={id} style={{ fontSize: 15, lineHeight: 1.4 }}><a href={`#${id}`} style={{ color: 'var(--rbl-link)', textDecoration: 'none' }}>{label}</a></li>)}
          </ol>
        </nav>

        <article className="tcl-article">
          <Section id="glance" title="At a glance">
            <Table
              caption={`The two 2027 Tentative budgets. Brookhaven: PDF pp. 2–4, ${BROOKHAVEN_SALARIES.page}, ${BROOKHAVEN_LEVY.page} and ${fb.pages.join('–')}. Riverhead: the Tentative’s PDF pp. 8–${rh.salaries.pdfPage} and ${rh.refuse.page}, and its audit.`}
              head={['Measure', 'Brookhaven', 'Riverhead']}
              rows={[
                ['Dated', BROOKHAVEN_SOURCE.dated, rh.letter?.dated ?? '—'],
                ['Spending, all funds', usd(bh.spending), usd(rh.spending)],
                [
                  'General, highway and lighting funds',
                  `${usd(bh.main.to)}, ${signedPct(growth.brookhavenMain)} from 2026`,
                  `${usd(rh.main.to)}, ${signedPct(growth.riverheadMain ?? 0)} from 2026`,
                ],
                [
                  'Property tax on those funds',
                  `${usd(bh.main.levy)}; the Supervisor puts the increase at ${pct(BROOKHAVEN_STATED.levyAdjustmentPct, 2)}`,
                  `${usd(rh.main.levyTo)}, ${signedPct(growth.riverheadMainLevy ?? 0, 2)}`,
                ],
                [
                  'Savings used to balance',
                  `${usd(bh.savingsUsed)}, in one sewer district: ${pct(bh.savingsShare, 2)} of spending`,
                  `${usd(rh.savingsUsed)}, in ${count(rh.savingsFunds)} funds: ${pct(rh.savingsShare)} of spending`,
                ],
                [
                  'General Fund savings against a year’s spending',
                  `${pct(bh.general.cushionShare)}: ${usd(bh.general.cushion)} expected at the end of 2026`,
                  `${pct(rh.general.cushionShare)}: ${usd(rh.general.cushion)} ${rh.general.cushionAudited ? 'audited' : 'reported'} at the end of 2025`,
                ],
                ['Credit rating', 'AAA from S&P and Aaa from Moody’s, as the Supervisor reports', `${rh.rating.rating} from Moody’s, as reported in ${rh.rating.affirmedDate.replace(/^(\w+) \d+, /, '$1 ')}`],
                ['The State Comptroller’s fiscal stress score', '0.0, as the Supervisor reports', 'Not on this site yet'],
                [
                  'Garbage collection',
                  `A user fee: $${BROOKHAVEN_STATED.refuseFee.toFixed(2)} for a typical single-family home, up ${pct(BROOKHAVEN_STATED.refuseAdjustmentPct)}`,
                  `A district tax: ${usd(rh.refuse.tentative2027)} for the district, ${signedPct(growth.riverheadRefuse ?? 0)}; no figure per home`,
                ],
                ['Ambulance district taxes', `Down ${pct(BROOKHAVEN_STATED.ambulanceCutPct, 2)} across nine districts`, `${usd(rh.ambulance.to)} in the one district, ${signedPct(growth.riverheadAmbulance ?? 0, 2)}`],
                ['Supervisor’s salary', usd(BROOKHAVEN_SALARIES.supervisor), `${usd(rh.salaries.supervisor[2027])} proposed; the Supervisor took $110,000 in 2026`],
                ['Council member’s salary', `${usd(BROOKHAVEN_SALARIES.councilMember)}, ${count(BROOKHAVEN_SALARIES.councilSeats)} members`, `${usd(rh.salaries.councilMember[2027])}, ${count(rh.salaries.councilSeats)} members`],
              ]}
            />
            <P>
              Southold, Riverhead’s other neighbour, has its 2027 Tentative set beside Riverhead’s too, with Brookhaven alongside:{' '}
              <a href={`${base}/southold-2027/`} style={link}>Southold beside Riverhead</a>.
            </P>
            <P>
              Each total is the document’s own. Riverhead’s counts the Debt Service, Workers’ Compensation and Risk Retention funds, which
              the other funds pay into, so some dollars appear twice; Brookhaven’s table does not say how much of its total passes between
              funds.
            </P>
            <P>
              Brookhaven’s rating and stress score are its Supervisor’s statements: “{quote('ratings')}” and “{quote('stress')}” Riverhead’s
              rating is as RiverheadLOCAL reported it in February 2024 (<a href={`${base}/credit-rating/`} style={link}>Credit Rating</a>).
            </P>
          </Section>

          {perResident && riverheadPolice && population.brookhaven && population.riverhead && (
            <Section id="residents" title="Per resident">
              <Table
                caption={`Each town’s 2027 Tentative divided by its residents on ${population.asOf}, the Census Bureau’s estimates from one release.`}
                head={['Measure', 'Brookhaven', 'Riverhead']}
                rows={[
                  [`Residents, ${population.asOf}`, population.brookhaven.toLocaleString('en-US'), population.riverhead.toLocaleString('en-US')],
                  ['Spending, all funds, per resident', usd(perResident.brookhaven.spending), usd(perResident.riverhead.spending)],
                  ['Property tax for the general, highway and lighting funds, per resident', usd(perResident.brookhaven.levy), usd(perResident.riverhead.levy)],
                ]}
              />
              <P>
                Per resident, Riverhead’s town government spends about {count(Math.round(perResident.riverhead.spending / perResident.brookhaven.spending))} times
                what Brookhaven’s does. The two governments do not do the same things:
              </P>
              <ul style={{ margin: '0 0 14px', paddingLeft: 22, display: 'grid', gap: 8, maxWidth: '72ch' }}>
                <Li>
                  <strong>Police.</strong> Riverhead pays for a police department: {usd(riverheadPolice.department)} in the 2027 Tentative, and{' '}
                  {usd(riverheadPolice.benefits)} more in sworn officers’ pensions, health insurance and Social Security,{' '}
                  {usd(riverheadPolice.total)} in all, or {usd(perResident.riverhead.police)} a resident. Brookhaven’s police are the Suffolk
                  County Police Department, outside its town budget.
                </Li>
                <Li>
                  <strong>Water and sewer.</strong> Riverhead runs a water district and three sewer funds, {usd(rh.waterSewerSpending)} or{' '}
                  {usd(perResident.riverhead.waterSewer)} a resident. Brookhaven’s town budget has two small sewer districts and one water district.
                </Li>
              </ul>
              <P>
                Leave those out, and the three funds the others pay into, and Riverhead’s spending comes to {usd(perResident.riverhead.rest)}:
                about {usd(perResident.riverhead.restPerResident)} a resident, still about{' '}
                {times(Math.round(perResident.riverhead.restPerResident / perResident.brookhaven.spending))} Brookhaven’s{' '}
                {usd(perResident.brookhaven.spending)}. This page does not say why the rest differs. Residents of Brookhaven’s villages also
                get some services from their villages, which neither town budget counts, and a per-resident figure is not a tax bill:
                businesses pay part of each levy.
              </P>
              <P>
                Sources: <a href={population.source.url} style={link}>{population.source.title}</a>; Riverhead’s police lines from the{' '}
                <a href={riverheadPolice.source.url} style={link}>{riverheadPolice.source.title}</a>, pp. {pageList(riverheadPolice.pages.department)} (the
                department) and pp. {pageList(riverheadPolice.pages.benefits)} (sworn officers’ benefits).
              </P>
            </Section>
          )}

          <Section id="takeaways" title="What Riverhead residents can take from it">
            <H3>Brookhaven balances without savings. Riverhead does not.</H3>
            <P>
              Brookhaven’s fund-balance table ({bhPage(fb.pages.join('–'))}) shows savings used in only one of its {funds} funds and districts:{' '}
              {bh.drawn.map((d) => `${d.name}, ${usd(d.amount)} of its ${usd(d.spending)} budget`).join('; ')}. Its Supervisor writes:
              “{quote('balanced')}”
            </P>
            <P>
              Riverhead’s Tentative uses {usd(rh.savingsUsed)} of savings in {count(rh.savingsFunds)} funds. Most of it, {usd(rh.waterSewerSavings)},
              is in the water and sewer districts, which Brookhaven does not run on anything like that scale. The General Fund uses{' '}
              {usd(rh.generalFundSavings)}. <a href={`${base}/funds/#savings`} style={link}>How each Riverhead fund uses its savings</a>.
            </P>

            <H3>Riverhead’s main funds grow about twice as fast</H3>
            <P>
              Brookhaven’s general, highway and lighting funds go from {usd(bh.main.from)} in its 2026 Adopted Budget to {usd(bh.main.to)},{' '}
              {signedPct(growth.brookhavenMain)}. Its town-wide General Fund barely moves: {usd(bh.general.from)} to {usd(bh.general.to)}.
              Riverhead’s town-wide funds go from {usd(rh.main.from)} to {usd(rh.main.to)}, {signedPct(growth.riverheadMain ?? 0)}, and its
              General Fund {signedPct(growth.riverheadGeneral ?? 0)}. Part of the gap is what each General Fund pays for: Riverhead’s pays
              for a town police department. Brookhaven has none of its own; the Suffolk County Police Department serves it, and that cost
              is not in Brookhaven’s town budget.
            </P>

            <H3>Riverhead’s levy rises to its limit. Brookhaven’s Supervisor puts the town’s rise lower.</H3>
            <P>
              {rh.letter?.taxCap && <>Riverhead’s Supervisor writes: “{rh.letter.taxCap}” </>}
              The town-wide levy rises from {usd(rh.main.levyFrom)} to {usd(rh.main.levyTo)}, {signedPct(growth.riverheadMainLevy ?? 0, 2)}.
              Brookhaven’s Supervisor writes: “{quote('levyCap')}” Suffolk’s supervisors asked Albany in October to change how the cap
              works; <a href={`${base}/tax-cap-letter/`} style={link}>the supervisors’ tax-cap letter, checked</a>.
            </P>

            <H3>Both hold large General Fund cushions</H3>
            <P>
              Brookhaven expects its town-wide General Fund to end 2026 with {usd(bh.general.cushion)} unappropriated, {pct(bh.general.cushionShare)} of
              its 2027 spending, and plans to use none of it. Riverhead’s General Fund ended 2025 with {usd(rh.general.cushion)} unassigned,{' '}
              {pct(rh.general.cushionShare)} of its 2026 budget, {rh.general.cushionAudited ? 'by its audit' : 'by its annual financial report'}.
              The two measures are close but not the same: Brookhaven’s is its budget’s own estimate, Riverhead’s is audited, a year
              earlier. A cushion that size does not have to be spent to balance a budget.{' '}
              {gfFirst && <>Riverhead’s audits show its General Fund ending 2024 and 2025 with more savings than it began, even with draws planned in both budgets.</>}{' '}
              <a href={`${base}/reserves/`} style={link}>Reserves</a>.
            </P>

            <H3>Brookhaven’s budget book tells residents more</H3>
            <P>
              Each of Brookhaven’s {BROOKHAVEN_BOOK.missionStatementPages.length} departments and offices opens with a mission statement, and
              most list the past year’s accomplishments and their goals for 2027. Schedules of positions list each division’s job titles
              with their counts in the 2026 Adopted and 2027 Tentative budgets, and the change. Its fund-balance table shows every fund’s
              and district’s balance before and after
              2027. And its message tells residents the town’s share of their tax bill: “{quote('taxShare')}”
            </P>
            <P>
              Riverhead’s Tentative has a two-page letter, fund descriptions, a Summary, a Fund Balances page, elected officials’ salaries,
              its line items and an exemption report. Its text has no mission statements or position lists, and its Fund Balances page
              stops at an estimate for the end of 2026.
            </P>

            <H3>Garbage: a price per home, or a district total</H3>
            <P>
              Brookhaven’s message: “{quote('refuseFee')}” and “{quote('refuseAmount')}” Riverhead pays for garbage collection through its
              Refuse and Garbage District, raised entirely by property taxes: {usd(rh.refuse.tentative2027)} proposed for 2027, up{' '}
              {usd(rh.refuse.tentative2027 - rh.refuse.adopted2026)} ({pct(growth.riverheadRefuse ?? 0)}). Its budget does not say what that
              comes to for a typical home.
            </P>

            <H3>Ambulance taxes fall in Brookhaven and rise in Riverhead</H3>
            <P>
              Brookhaven’s message: “{quote('ambulance')}.” Riverhead’s Ambulance District levy goes from {usd(rh.ambulance.from)} to{' '}
              {usd(rh.ambulance.to)}, {signedPct(growth.riverheadAmbulance ?? 0, 2)}.
            </P>
          </Section>

          <Section id="improve" title="How Riverhead’s budget could be improved">
            <P>
              Ideas a resident could put to the Town Board, drawn from what Brookhaven’s budget does. They are suggestions, not findings
              that Riverhead has done anything wrong. Several match what the Government Finance Officers Association asks of a budget
              document (<a href={`${base}/gfoa/`} style={link}>Standards</a>).
            </P>
            <ol style={{ margin: '0 0 14px', paddingLeft: 22, display: 'grid', gap: 10, maxWidth: '72ch' }}>
              <Idea title="Balance the General Fund without savings.">
                {gfFirst && <>Its planned draw has fallen from {usd(gfFirst.planned)} for {gfFirst.year} to {usd(rh.generalFundSavings)} proposed for 2027. </>}
                Brookhaven’s budget takes the last step. Savings are one-time money, best kept for one-time costs.
              </Idea>
              {leaning.length >= 2 && sewer && (
                <Idea title="Set a plan for the sewer funds.">
                  Savings would pay {pct(leaning[0].sharePct)} of the {leaning[0].name}’s 2027 spending and {pct(leaning[1].sharePct)} of the{' '}
                  {leaning[1].name}’s. The sewer funds’ audited unrestricted net position was {sewer.unrestricted < 0 ? `a deficit of ${usd(-sewer.unrestricted)}` : usd(sewer.unrestricted)} at the end of 2025.
                  A schedule of rates and draws over several years would show residents how the gap closes.
                </Idea>
              )}
              <Idea title="Print a fund-balance table that looks ahead.">
                Brookhaven’s shows each fund’s balance, the savings the budget uses and the balance expected after it. Riverhead’s stops at
                the end of 2026, subtracts a column labelled “{TFB.applicationLabel}”, and prints the water and sewer funds’ net position,
                mostly pipes and plants, as their fund balance.
              </Idea>
              <Idea title="Open each department with its purpose and results.">
                A mission, last year’s accomplishments and next year’s goals, as Brookhaven’s departments have.
              </Idea>
              <Idea title="List positions by department.">
                This year’s and next year’s count for each title, so a new or cut position shows in the budget itself.
              </Idea>
              <Idea title="Show what garbage collection costs a home.">
                Brookhaven prints a price for a typical single-family home. Riverhead prints only the district’s total.
              </Idea>
              <Idea title="Tell residents the Town’s share of their tax bill.">
                Brookhaven’s message gives its share, about {pct(BROOKHAVEN_STATED.taxSharePct, 2)} outside villages.
              </Idea>
              <Idea title="Consider local limits on the tax rate and on debt.">
                Brookhaven’s message lists among its highlights that it “{lower(quote('caps'))}”.
              </Idea>
              <Idea title="Publish the Supervisor’s letter as text.">
                Riverhead’s 2025, 2026 and 2027 letters are scanned images: a screen reader cannot read them and a search cannot find them.
              </Idea>
            </ol>
          </Section>

          <Section id="differ" title="Where the two towns differ">
            <ul style={{ margin: '0 0 14px', paddingLeft: 22, display: 'grid', gap: 8, maxWidth: '72ch' }}>
              <Li>
                <strong>Size.</strong> Brookhaven spends about {ratio !== null ? count(Math.round(ratio)) : '—'} times what Riverhead does
                {population.brookhaven && population.riverhead && <> and has about {Math.round(population.brookhaven / population.riverhead)} times its residents ({population.brookhaven.toLocaleString('en-US')} against {population.riverhead.toLocaleString('en-US')})</>}.
                It also has incorporated villages, whose residents pay some of its taxes and not others.
              </Li>
              <Li>
                <strong>Police.</strong> Riverhead’s General Fund pays for a town police department. Brookhaven has no town police
                department: the Suffolk County Police Department serves it, outside the town budget. The Town’s own Department of Public
                Safety covers {words([...BROOKHAVEN_BOOK.publicSafetyPlain])} (table of contents, {bhPage(BROOKHAVEN_BOOK.publicSafetyContentsPage)}).
              </Li>
              <Li>
                <strong>Water and sewer.</strong> Riverhead runs a water district and three sewer funds, {usd(rh.waterSewerSpending)} of its
                2027 spending. Brookhaven’s budget has {count(brookhavenWaterSewer.length)} sewer and water districts,{' '}
                {usd(brookhavenWaterSewer.reduce((s, r) => s + r.expenditures, 0))} together. Most of Riverhead’s savings use has no
                counterpart in Brookhaven’s budget.
              </Li>
              <Li>
                <strong>Measures.</strong> Brookhaven’s balances are its budget’s estimates of “unappropriated, unreserved” fund balance;
                Riverhead’s General Fund figure is audited unassigned balance. Page 18 of Brookhaven’s table still carries the previous
                year’s 2025 and 2026 headings; its rows and totals continue page 17’s.
              </Li>
              <Li>
                <strong>Totals.</strong> Brookhaven’s levy summary ({bhPage(BROOKHAVEN_LEVY.page)}) totals {usd(BROOKHAVEN_LEVY.allTotal.appropriations)}.
                Its line for other special districts and the airport includes the {usd(bh.levyDoubleCount)} street-lighting district a second
                time, so this page uses the fund-balance table’s {usd(bh.spending)}.
              </Li>
              <Li>
                <strong>Stage.</strong> Both are proposals. Either Town Board may change its budget before it adopts one.
              </Li>
            </ul>
          </Section>

          <Section id="method" title="How this page was made">
            <P>
              Brookhaven’s Tentative came to this site as a {BROOKHAVEN_SOURCE.pages}-page scan with no text. Each page was read with OCR,
              upright and turned a quarter-turn each way for the sideways tables, and every figure and quotation on this page was then read
              from the page image. Each table’s rows add to its printed totals (the balance columns to within a dollar or two, as the
              scan rounds to the dollar), and the levy summary agrees with the fund-balance table fund by fund. A check runs on every
              build of this site and fails if any of that stops being true. The OCR text is kept in the site’s repository beside the scan.
            </P>
            <P>
              Riverhead’s figures come from the records this site already checks: the Tentative’s Summary and pages, the 2027 Budget
              Supplement and the audited statements.
            </P>
          </Section>

          <Section id="sources" title="Sources">
            <ul style={{ margin: 0, paddingLeft: 22, display: 'grid', gap: 6, maxWidth: '72ch', fontSize: 15.5, lineHeight: 1.5 }}>
              <li>
                <a href={BROOKHAVEN_SOURCE.repoUrl} style={link}>{BROOKHAVEN_SOURCE.title}</a>, dated {BROOKHAVEN_SOURCE.dated}, signed by{' '}
                {BROOKHAVEN_SOURCE.signedBy}: the copy this site read. The Town posts its budgets on its{' '}
                <a href={BROOKHAVEN_SOURCE.townPage} style={link}>Finance page</a>.
              </li>
              <li><a href={BROOKHAVEN_2026_ADOPTED.url} style={link}>{BROOKHAVEN_2026_ADOPTED.title}</a>, PDF p. {BROOKHAVEN_2026_ADOPTED.page}</li>
              <li>
                <a href={TFB.source.url} style={link}>Town of Riverhead, {TFB.source.title}</a>: the Supervisor’s letter (pp. 2–3), the Summary
                (p. 8), Fund Balances (p. {TFB.source.pdfPage}), Salaries of Elected Officials (p. {rh.salaries.pdfPage}) and the refuse district (p. {rh.refuse.page})
              </li>
              {lineSource && <li><a href={lineSource.url} style={link}>Town of Riverhead, {lineSource.title}</a></li>}
              <li><a href={AUDIT_2025.source.url} style={link}>{AUDIT_2025.source.title}</a></li>
              <li>
                This site’s <a href={`${base}/funds/#savings`} style={link}>Funds Explorer</a>,{' '}
                <a href={`${base}/reserves/`} style={link}>Reserves</a> and <a href={`${base}/credit-rating/`} style={link}>Credit Rating</a> pages
              </li>
            </ul>
          </Section>
        </article>
      </div>
    </PageShell>
  )
}

const link: CSSProperties = { color: 'var(--rbl-link)', fontWeight: 600 }

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} style={{ scrollMarginTop: 20, paddingTop: 8, marginBottom: 36 }}>
      <h2 style={{ fontSize: 'clamp(24px,3vw,29px)', fontWeight: 700, color: 'var(--rbl-title)', letterSpacing: '-.01em', margin: '0 0 14px', paddingBottom: 10, borderBottom: '1px solid var(--rbl-border-subtle)' }}>{title}</h2>
      {children}
    </section>
  )
}

function H3({ children }: { children: ReactNode }) {
  return <h3 style={{ fontSize: 19, fontWeight: 700, color: 'var(--rbl-title)', margin: '26px 0 6px' }}>{children}</h3>
}

function P({ children }: { children: ReactNode }) {
  return <p style={{ fontSize: 17, lineHeight: 1.65, color: 'var(--rbl-text-strong)', margin: '0 0 14px', maxWidth: '72ch' }}>{children}</p>
}

function Li({ children }: { children: ReactNode }) {
  return <li style={{ fontSize: 16.5, lineHeight: 1.6, color: 'var(--rbl-text-strong)' }}>{children}</li>
}

function Idea({ title, children }: { title: string; children: ReactNode }) {
  return (
    <li style={{ fontSize: 16.5, lineHeight: 1.6, color: 'var(--rbl-text-strong)' }}>
      <strong>{title}</strong> {children}
    </li>
  )
}

function Table({ caption, head, rows }: { caption: string; head: string[]; rows: string[][] }) {
  return (
    <figure className="tcl-table" tabIndex={0} aria-label={`Scrollable table: ${caption}`} style={{ margin: '6px 0 18px', background: 'var(--rbl-surface)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 12, overflowX: 'auto' }}>
      <table className="rbl-stack" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 15.5 }}>
        <caption style={{ padding: '12px 14px 4px', color: 'var(--rbl-text-muted)', fontSize: 14.5, lineHeight: 1.45, textAlign: 'left' }}>{caption}</caption>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--rbl-border)' }}>
            {head.map((h) => <th key={h} scope="col" style={{ textAlign: 'left', padding: '8px 14px', color: 'var(--rbl-text-muted)', fontWeight: 600, fontSize: 14 }}>{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, ri) => (
            <tr key={ri} style={{ borderTop: ri ? '1px solid var(--rbl-border-subtle)' : undefined }}>
              {r.map((c, i) => <td key={i} data-label={head[i]} style={{ padding: '9px 14px', textAlign: 'left', verticalAlign: 'top', lineHeight: 1.5, color: 'var(--rbl-text-strong)', fontWeight: i === 0 ? 600 : 400 }}>{c}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  )
}
