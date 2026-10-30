import type { CSSProperties, ReactNode } from 'react'
import PageShell from '../../components/PageShell'
import PlainCallout from '../../components/PlainCallout'
import { AUDIT_2025 } from '../../lib/audits'
import { BROOKHAVEN_SOURCE } from '../../lib/brookhaven-2027'
import { lineSource } from '../../lib/funds-2027'
import {
  SOUTHOLD_CAPITAL, SOUTHOLD_FUND_BALANCES, SOUTHOLD_LINES, SOUTHOLD_NEWS, SOUTHOLD_QUOTES, SOUTHOLD_SALARIES, SOUTHOLD_SOURCE,
  SOUTHOLD_STATED, SOUTHOLD_SUMMARY, SOUTHOLD_TAX_STATISTICS,
} from '../../lib/southold-2027'
import { estimateShare, perResident, population, riverhead, riverheadWithRefuse, southold, threeTowns } from '../../lib/southold-compare'
import { CARRYOVER_QUOTES, CARRYOVER_SOURCES, factorsAllowPct, GROWTH_2027 } from '../../lib/tax-cap-carryover'
import { LETTER_2027 } from '../../lib/tentative-letters'
import { TENTATIVE_FUND_BALANCES_2027 as TFB } from '../../lib/tentative-fund-balances'

export const metadata = {
  title: 'Southold’s 2027 Tentative beside Riverhead’s',
  description:
    'The Town of Southold’s 2027 Tentative Operating Budget set beside Riverhead’s 2027 Tentative: savings, the tax cap, police, revenue estimates, garbage, and what each budget book tells residents, with Brookhaven alongside.',
}

const base = process.env.NEXT_PUBLIC_BASE_PATH || ''
const usd = (n: number) => `${n < 0 ? '−' : ''}$${Math.round(Math.abs(n)).toLocaleString('en-US')}`
const pct = (n: number, d = 1) => `${n.toFixed(d)}%`
const signedPct = (n: number, d = 1) => `${n >= 0 ? 'up' : 'down'} ${Math.abs(n).toFixed(d)}%`
const NUMBER_WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine']
const count = (n: number) => NUMBER_WORDS[n] ?? String(n)
const pageList = (pages: readonly number[]) => (pages.length > 1 && pages[pages.length - 1] - pages[0] === pages.length - 1 ? `${pages[0]}–${pages[pages.length - 1]}` : pages.join(', '))
const quote = (k: keyof typeof SOUTHOLD_QUOTES) => SOUTHOLD_QUOTES[k].text
const shPage = (p: number | string) => `Southold PDF ${String(p).includes('–') || String(p).includes(',') ? 'pp.' : 'p.'} ${p}`

const SECTIONS = [
  ['glance', 'At a glance'],
  ['three', 'Three neighbours'],
  ['residents', 'Per resident'],
  ['takeaways', 'What Riverhead residents can take from it'],
  ['improve', 'How Riverhead’s budget could be improved'],
  ['differ', 'Where the two towns differ'],
  ['method', 'How this page was made'],
  ['sources', 'Sources'],
] as const

export default function SoutholdComparisonPage() {
  const sh = southold
  const rh = riverhead
  const ts = SOUTHOLD_TAX_STATISTICS
  const fb = SOUTHOLD_FUND_BALANCES

  if (!rh || !threeTowns) {
    return (
      <PageShell title="Southold’s 2027 Tentative beside Riverhead’s" subtitle="Riverhead’s 2027 Tentative is not in this site’s records yet, so there is nothing to set beside Southold’s.">
        <P>This page returns when Riverhead’s Tentative Summary and Budget Supplement have been read.</P>
      </PageShell>
    )
  }

  const interestShare = { southold: estimateShare(sh.estimates.interest.estimate, sh.estimates.interest.collected2025), riverhead: estimateShare(rh.estimates.interest.estimate, rh.estimates.interest.collected2025), amended: estimateShare(rh.estimates.interest.amended, rh.estimates.interest.collected2025) }
  const mortgageShare = { southold: estimateShare(sh.estimates.mortgageTax.estimate, sh.estimates.mortgageTax.collected2025), riverhead: estimateShare(rh.estimates.mortgageTax.estimate, rh.estimates.mortgageTax.collected2025) }
  const landSavings = sh.landFunds.reduce((s, r) => s + r.unexpended, 0)
  const refusePct = ((rh.refuse.tentative2027 - rh.refuse.adopted2026) / rh.refuse.adopted2026) * 100

  return (
    <PageShell
      title="Southold’s 2027 Tentative beside Riverhead’s"
      subtitle={`The Town of Southold’s 2027 Tentative Operating Budget, filed with its Town Clerk on ${SOUTHOLD_SOURCE.received}, set beside Riverhead’s: savings, the tax cap, police, revenue estimates, garbage, and what each budget book tells residents.`}
    >
      <PlainCallout
        tips={[
          { label: 'Two proposals', text: 'both are Tentative budgets, each Supervisor’s proposal. Each Town Board can change its own before it adopts a budget by November 20.' },
          { label: 'Savings', text: '“appropriated fund balance”, which Southold’s Summary calls “unexpended balance”: money left from earlier years that a budget counts as income.' },
          { label: 'Read from a scan', text: 'Southold’s copy has no text layer, so its figures were read from the page images and checked by adding up its own tables.' },
        ]}
      >
        Southold, Riverhead’s neighbour on the North Fork, also runs its own police department, and its four main funds come to{' '}
        {usd(sh.main.to)} for 2027, {signedPct(sh.main.pct)}. Like Riverhead’s, its Tentative stays within the tax cap: its property tax for
        those funds rises {pct(sh.main.levyPct, 2)}, Riverhead’s town-wide levy {pct(rh.main.levyPct, 2)}. The biggest difference is savings.
        Southold’s General Fund counts {usd(sh.general.savings)} of them as income, {pct(sh.general.savingsShare)} of its spending; Riverhead’s
        counts {usd(rh.general.savings)}, {pct(rh.general.savingsShare)}. Southold starts from a bigger cushion, and budgets its interest and
        mortgage tax closer to what it collects.
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
            <div data-glance>
              <Table
                caption={`The two 2027 Tentative budgets. Southold: PDF pp. 1–2, ${pageList(ts.pages)}, ${fb.page}, ${SOUTHOLD_SALARIES.page}, 14, 23, 27–31 and ${pageList(SOUTHOLD_CAPITAL.pages)}. Riverhead: the Tentative’s Summary, salary page and refuse district, the 2027 Budget Supplement (pp. ${pageList(rh.police.pages)} for police) and the 2025 audit.`}
                head={['Measure', 'Southold', 'Riverhead']}
                rows={[
                  ['Filed', `${SOUTHOLD_SOURCE.received}, with the Town Clerk`, rh.letter?.dated ? `Letter dated ${rh.letter.dated}` : '—'],
                  ['Main funds', `${usd(sh.main.to)}, ${signedPct(sh.main.pct)}: General (whole town and outside Greenport), Highway and Solid Waste`, `${usd(rh.main.to)}, ${signedPct(rh.main.pct)}: General, Highway and Street Lighting`],
                  ['Property tax for them', `${usd(sh.main.levyTo)}, ${signedPct(sh.main.levyPct, 2)}`, `${usd(rh.main.levyTo)}, ${signedPct(rh.main.levyPct, 2)}`],
                  ['Tax cap', `“${quote('cap')}” No limit is given`, rh.letter?.taxCap ? `“${rh.letter.taxCap}”` : '—'],
                  ['General Fund spending', `${usd(sh.general.to)}, ${signedPct(sh.general.pct)}`, `${usd(rh.general.to)}, ${signedPct(rh.general.pct)}`],
                  ['General Fund savings counted as income', `${usd(sh.general.savings)}: ${pct(sh.general.savingsShare)} of its spending`, `${usd(rh.general.savings)}: ${pct(rh.general.savingsShare)}${rh.general.amendedSavings !== null ? `; ${usd(rh.general.amendedSavings)} with the six amendments` : ''}`],
                  ['General Fund cushion', `${usd(sh.general.cushion)} expected at the end of 2026: ${pct(sh.general.cushionShare)} of 2027 spending`, `${usd(rh.general.cushion)} ${rh.general.cushionAudited ? 'audited' : 'reported'} at the end of 2025: ${pct(rh.general.cushionShare)} of the 2026 budget`],
                  ['Police department', `${usd(sh.police.to)}, ${signedPct(sh.police.pct, 2)}`, `${usd(rh.police.to)}, ${signedPct(rh.police.pct, 2)}`],
                  ['Police and fire retirement', usd(sh.police.retirement), rh.police.retirement !== null ? `${usd(rh.police.retirement)}, sworn officers` : '—'],
                  ['Garbage', `${usd(sh.solidWaste.spending)}: ${usd(sh.solidWaste.charges)} from charges and other revenue, ${usd(sh.solidWaste.tax)} from property tax`, `${usd(rh.refuse.tentative2027)}, all from property tax`],
                  ['Capital plan in the budget', `Three years: ${usd(sh.capital.y2027)} for 2027, ${usd(sh.capital.debt2027)} of it borrowed`, 'None'],
                  ['Employees', `${SOUTHOLD_STATED.fullTime} full-time and ${SOUTHOLD_STATED.partTime} part-time, as its letter says`, 'Not stated; its letter lists the positions it adds'],
                  ['Supervisor’s salary', usd(SOUTHOLD_SALARIES.supervisor), `${usd(rh.salaries.supervisor[2027])}; the Supervisor took $110,000 in 2026`],
                  ['Town Board member’s salary', `${usd(SOUTHOLD_SALARIES.boardMember)}, ${count(SOUTHOLD_SALARIES.boardSeats)} members, and ${usd(SOUTHOLD_SALARIES.fishersIslandJusticeMember)} for the Fishers Island justice, who also sits on the Board`, `${usd(rh.salaries.councilMember[2027])}, ${count(rh.salaries.councilSeats)} members`],
                ]}
              />
            </div>
            <P>
              Southold’s four main funds are the ones its Tax Statistics page sets out ({shPage(pageList(ts.pages))}). They include its solid waste
              district; Riverhead’s town-wide funds do not include its Refuse and Garbage District, so the garbage row shows both. Southold’s
              cushion is its budget’s own estimate of what will be left at the end of 2026 after its 2026 budget’s planned use; Riverhead’s is
              audited, a year earlier.
            </P>
          </Section>

          <Section id="three" title="Three neighbours">
            <P>
              With Brookhaven, whose 2027 Tentative this site <a href={`${base}/brookhaven-2027/`} style={link}>set beside Riverhead’s</a> as well,
              the three towns cover the range on savings:
            </P>
            <div data-three>
              <Table
                caption={`From each town’s 2027 Tentative. Brookhaven: ${BROOKHAVEN_SOURCE.title}. Cushions are each budget’s own measure: Brookhaven’s and Southold’s budgets’ estimates for the end of 2026, Riverhead’s audited balance at the end of 2025.`}
                head={['Measure', 'Brookhaven', 'Southold', 'Riverhead']}
                rows={[
                  [`Residents, ${population.asOf}`, population.brookhaven?.toLocaleString('en-US') ?? '—', population.southold?.toLocaleString('en-US') ?? '—', population.riverhead?.toLocaleString('en-US') ?? '—'],
                  ['Its own police department', 'No: Suffolk County police', 'Yes', 'Yes'],
                  ['General Fund savings used, share of its spending', pct(threeTowns.generalSavingsShare.brookhaven), pct(threeTowns.generalSavingsShare.southold), pct(threeTowns.generalSavingsShare.riverhead)],
                  ['General Fund cushion, share of its spending', pct(threeTowns.generalCushionShare.brookhaven), pct(threeTowns.generalCushionShare.southold), pct(threeTowns.generalCushionShare.riverhead)],
                  ['Property tax for the main funds, change', `${pct(threeTowns.brookhavenLevyPct, 2)}, as its Supervisor puts it`, pct(sh.main.levyPct, 2), pct(rh.main.levyPct, 2)],
                  ['What the State’s two growth factors allow', pct(factorsAllowPct(GROWTH_2027.taxBase.brookhaven), 2), pct(factorsAllowPct(GROWTH_2027.taxBase.southold), 2), pct(factorsAllowPct(GROWTH_2027.taxBase.riverhead), 2)],
                  ['Property tax for the main funds, per resident', perResident?.brookhaven ? usd(perResident.brookhaven.levy) : '—', perResident ? usd(perResident.southold.levy) : '—', perResident ? usd(perResident.riverhead.levy) : '—'],
                ]}
              />
            </div>
            <P>
              The growth factors are the 2% allowable levy growth factor times each town’s 2027 tax base growth factor from the{' '}
              <a href={CARRYOVER_SOURCES['dtf-tbgf-2027'].url} style={link}>Department of Taxation and Finance</a> ({GROWTH_2027.taxBase.brookhaven.toFixed(4)},{' '}
              {GROWTH_2027.taxBase.southold.toFixed(4)} and {GROWTH_2027.taxBase.riverhead.toFixed(4)}). They are not the whole limit: each town also
              adjusts for payments in lieu of taxes, any carryover and exclusions, and files the result with the State Comptroller. Riverhead’s town-wide
              levy rises by what the two factors allow, to two decimals; Southold’s and Brookhaven’s rise by less.
            </P>
            <P>
              Brookhaven balances its General Fund without savings. Riverhead uses a little. Southold uses the most, and holds the most. Each town’s
              “main funds” are its own budget’s grouping, so the per-resident tax is a rough guide: Brookhaven’s residents also pay the County police
              district, and Riverhead’s figure leaves out its refuse district.
            </P>
          </Section>

          {perResident && population.southold && population.riverhead && (
            <Section id="residents" title="Per resident">
              <div data-residents>
                <Table
                  caption={`Each town’s 2027 Tentative divided by its residents on ${population.asOf}, the Census Bureau’s estimates from one release.`}
                  head={['Measure', 'Southold', 'Riverhead']}
                  rows={[
                    [`Residents, ${population.asOf}`, population.southold.toLocaleString('en-US'), population.riverhead.toLocaleString('en-US')],
                    ['Property tax for the main funds, per resident', usd(perResident.southold.levy), `${usd(perResident.riverhead.levy)}; ${usd(perResident.riverhead.levyWithRefuse)} with the refuse district`],
                    ['Police department, per resident', `${usd(perResident.southold.police)}; ${usd(perResident.southold.policeWithCommunications)} with public safety communications`, usd(perResident.riverhead.police)],
                  ]}
                />
              </div>
              <P>
                Counting garbage in both, the two towns raise about the same property tax per resident for their main funds:{' '}
                {usd(perResident.southold.levy)} in Southold and {usd(perResident.riverhead.levyWithRefuse)} in Riverhead. Riverhead spends more on
                police per resident. Southold budgets its dispatch centre separately, as Public Safety Communications ({usd(sh.police.communications)});
                Riverhead’s Budget Supplement has no such line, so its police lines may include that work.
              </P>
              <P>
                A per-resident figure is not a tax bill. Businesses pay part of each levy, and so do owners of homes whose residents the Census
                counts elsewhere. Southold’s figure includes the Village of Greenport, whose residents pay the whole-town funds but not the
                funds outside the village.
              </P>
              <P>
                Source: <a href={population.source.url} style={link}>{population.source.title}</a>.
              </P>
            </Section>
          )}

          <Section id="takeaways" title="What Riverhead residents can take from it">
            <H3>Southold leans on savings more than Riverhead, from a bigger cushion</H3>
            <P>
              <span data-savings>
                Southold’s General Fund counts {usd(sh.general.savings)} of savings as income in 2027, the same as in 2026: {pct(sh.general.savingsShare)}{' '}
                of its {usd(sh.general.to)}. Its four main funds count {usd(sh.main.savings)}, {pct(sh.main.savingsShare)} of their spending.
                Riverhead’s General Fund counts {usd(rh.general.savings)}, {pct(rh.general.savingsShare)}, and its town-wide funds{' '}
                {pct(rh.main.savingsShare)}.
              </span>
            </P>
            <P>
              Southold can afford it for now. Its fund-balance page ({shPage(fb.page)}) expects the General Fund to end 2026 with {usd(sh.general.cushion)},{' '}
              {pct(sh.general.cushionShare)} of its 2027 spending, after the {usd(sh.general.plannedDraw2026)} its 2026 budget plans to use. Its General
              Fund took in {usd(sh.general.result2025)} more than it spent in 2025, by its fund pages’ 2025 actual columns. Riverhead’s audited
              General Fund grew {usd(rh.general.result2025)} in 2025. In both towns, a planned draw is a budget’s assumption; whether it is needed is
              known only when the year closes. <a href={`${base}/reserves/`} style={link}>Riverhead’s reserves</a>.
            </P>

            <H3>Both stay within the tax cap this year</H3>
            <P>
              Southold’s Supervisor writes of the cap: “{quote('benchmark')}” and “{quote('cap')}” Its property tax for the four funds rises{' '}
              {pct(sh.main.levyPct, 2)}. {SOUTHOLD_NEWS.outlet} reports that Southold’s 2026 budget also {SOUTHOLD_NEWS.capHistory.y2026}, after its
              2025 budget raised the levy {pct(SOUTHOLD_NEWS.capHistory.y2025.levyPct, 2)} and went above it.
            </P>
            <P>
              Riverhead’s letters tell a longer story. 2025: “{rh.capHistory.y2025}” 2026: “{rh.capHistory.y2026}” 2027: “{rh.letter?.taxCap}”
              Neither budget prints its limit in dollars, and Southold’s gives no figure at all.
            </P>

            <H3>Both run their own police, and both police budgets grow about 3.8%</H3>
            <P>
              <span data-police>
                Southold’s police department goes from {usd(sh.police.from)} in its 2026 budget to {usd(sh.police.to)}, {signedPct(sh.police.pct, 2)}{' '}
                ({shPage(SOUTHOLD_LINES.police.page)}). Riverhead’s goes from {usd(rh.police.from)} to {usd(rh.police.to)}, {signedPct(rh.police.pct, 2)}.
              </span>{' '}
              Southold’s Supervisor writes: “{quote('arpa')}” Brookhaven, by contrast, has no police department of its own.
            </P>

            <H3>Southold budgets its revenue closer to what it collects</H3>
            <P>
              <span data-estimates>
                Southold estimates its General Fund’s interest for 2027 at {usd(sh.estimates.interest.estimate)}, {pct(interestShare.southold ?? 0, 0)}{' '}
                of the {usd(sh.estimates.interest.collected2025)} it collected in 2025. Riverhead’s Tentative estimates {usd(rh.estimates.interest.estimate ?? 0)},{' '}
                {pct(interestShare.riverhead ?? 0, 0)} of its {usd(rh.estimates.interest.collected2025 ?? 0)}; the amendments would make it{' '}
                {usd(rh.estimates.interest.amended ?? 0)}, {pct(interestShare.amended ?? 0, 0)}. On mortgage tax, Southold estimates{' '}
                {usd(sh.estimates.mortgageTax.estimate)}, {pct(mortgageShare.southold ?? 0, 0)} of the {usd(sh.estimates.mortgageTax.collected2025)} it
                collected in 2025, and Riverhead {usd(rh.estimates.mortgageTax.estimate ?? 0)}, {pct(mortgageShare.riverhead ?? 0, 0)} of its{' '}
                {usd(rh.estimates.mortgageTax.collected2025 ?? 0)}.
              </span>
            </P>
            <P>
              Southold’s Supervisor gives a reason for caution: “{quote('revenue')}” Its sales tax estimate, {usd(sh.estimates.salesTax.estimate)}, is
              the same figure in every column of its page. What closer estimates would do for Riverhead’s levy is on{' '}
              <a href={`${base}/zero-percent-2027/`} style={link}>Zero or 1% for 2027</a>.
            </P>

            <H3>Garbage: charges in Southold, property tax in Riverhead</H3>
            <P>
              <span data-garbage>
                Southold’s Solid Waste Management District spends {usd(sh.solidWaste.spending)} in 2027, {signedPct(sh.solidWaste.pct, 2)}. Of that,{' '}
                {usd(sh.solidWaste.charges)} comes from charges and other revenue, the largest part of it tipping fees, {usd(sh.solidWaste.savings)} from savings and{' '}
                {usd(sh.solidWaste.tax)} from property tax, {signedPct(sh.solidWaste.taxPct, 2)}. Riverhead’s Refuse and Garbage District spends{' '}
                {usd(rh.refuse.tentative2027)}, {signedPct(refusePct, 2)}, all of it from property tax.
              </span>
            </P>

            <H3>Southold’s budget book shows more of the picture</H3>
            <P>
              Its Tax Statistics pages ({shPage(pageList(ts.pages))}) set out, for 2026 and 2027, each fund’s assessed value, spending, tax rate, levy,
              revenue and savings, with the change in each. That is where a resident can see why the tax rate rose{' '}
              {pct(ts.rates.total.pct, 2)} while the levy rose {pct(ts.levy.total.pct, 2)}: the whole town’s assessed value grew{' '}
              {pct(ts.assessedValue.wholeTown.pct, 2)}. Its three-year capital plan ({shPage(pageList(SOUTHOLD_CAPITAL.pages))}) lists each project,
              from police vehicles to a screening plant, and how it would be paid for: {usd(SOUTHOLD_CAPITAL.grandTotal[0])} in 2027,{' '}
              {usd(SOUTHOLD_CAPITAL.grandTotal[1])} in 2028 and {usd(SOUTHOLD_CAPITAL.grandTotal[2])} in 2029. And its letter says how many people
              the Town employs: “{quote('staff')}”
            </P>
            <P>
              Riverhead’s Tentative has neither page. Its table of contents lists no capital plan, and it prints the town’s total assessed value
              only in the assessor’s exemption report at the back, not beside its rates. Both towns’ letters are scanned images: Southold’s whole
              budget is a scan.
            </P>
          </Section>

          <Section id="improve" title="How Riverhead’s budget could be improved">
            <P>
              Ideas a resident could put to the Town Board, drawn from what Southold’s budget does. They are suggestions, not findings that
              Riverhead has done anything wrong. Several match what the Government Finance Officers Association asks of a budget document
              (<a href={`${base}/gfoa/`} style={link}>Standards</a>).
            </P>
            <ol style={{ margin: '0 0 14px', paddingLeft: 22, display: 'grid', gap: 10, maxWidth: '72ch' }}>
              <Idea title="Print a capital plan with the budget.">
                Southold’s lists three years of projects and says how each year is paid for, including how much is borrowed:{' '}
                {usd(sh.capital.debt2027)} of 2027’s {usd(sh.capital.y2027)}.
              </Idea>
              <Idea title="Show the assessed value behind each tax rate.">
                Southold’s Tax Statistics page puts each fund’s assessed value beside its rate and levy, so a resident can see why the rate moves
                differently from the levy. Riverhead’s rate rises {pct(rh.main.ratePct, 2)} against a levy {signedPct(rh.main.levyPct, 2)}, on a tax
                base about {pct(rh.main.basePct, 2)} larger, but its Summary doesn’t say so.
              </Idea>
              <Idea title="Say how many people the Town employs.">
                Southold’s letter does: {SOUTHOLD_STATED.fullTime} full-time and {SOUTHOLD_STATED.partTime} part-time.
              </Idea>
              <Idea title="Explain the revenue estimates against what came in.">
                Southold’s interest estimate is {pct(interestShare.southold ?? 0, 0)} of its 2025 collections; Riverhead’s Tentative’s is{' '}
                {pct(interestShare.riverhead ?? 0, 0)}. A line saying why would help residents judge the levy.
              </Idea>
              <Idea title="Ask whether some garbage costs could be charged by use.">
                Southold covers {pct((sh.solidWaste.charges / sh.solidWaste.spending) * 100, 0)} of its solid waste district from charges.
                Charging would move cost from the levy to users; it would not make it smaller. It would also move it outside the tax cap: the State
                Comptroller writes that “{CARRYOVER_QUOTES.userFees.text}”
              </Idea>
              <Idea title="Publish the Supervisor’s letter as text.">
                Riverhead’s 2025, 2026 and 2027 letters are scanned images, and Southold’s whole budget is a scan: a screen reader cannot read
                them and a search cannot find them.
              </Idea>
            </ol>
          </Section>

          <Section id="differ" title="Where the two towns differ">
            <ul style={{ margin: '0 0 14px', paddingLeft: 22, display: 'grid', gap: 8, maxWidth: '72ch' }}>
              <Li>
                <strong>Size.</strong> Southold has {population.southold?.toLocaleString('en-US') ?? '—'} residents and Riverhead{' '}
                {population.riverhead?.toLocaleString('en-US') ?? '—'}, by the Census Bureau’s estimates for {population.asOf}.
              </Li>
              <Li>
                <strong>A village.</strong> The Village of Greenport is in Southold ({shPage(SOUTHOLD_SOURCE.certificationPage)}), so Southold keeps
                General and Highway funds for the town outside the village. Riverhead’s budget has no such funds.
              </Li>
              <Li>
                <strong>Fire districts.</strong> Southold’s Summary ({shPage(SOUTHOLD_SUMMARY.page)}) lists its six fire districts’ budgets,{' '}
                {usd(SOUTHOLD_SUMMARY.fireTotal.appropriations)}, and their taxes in its {usd(SOUTHOLD_SUMMARY.grandTotal.appropriations)} grand
                total. Riverhead’s Summary lists no fire districts.
              </Li>
              <Li>
                <strong>Fishers Island.</strong> Southold’s budget carries the island’s ferry district ({usd(SOUTHOLD_SUMMARY.special.find((r) => r.code === 'SM')!.appropriations)}),
                waste management and sewer districts.
              </Li>
              <Li>
                <strong>Land and housing funds.</strong> Southold’s Community Preservation Fund ({usd(sh.landFunds[0].appropriations)}) and Community
                Housing Fund ({usd(sh.landFunds[1].appropriations)}) use {usd(landSavings)} of their own savings in 2027. They build balances from
                their own revenue and then spend them, so that is not the kind of draw this page compares. Riverhead’s Community Preservation Fund
                budget is far smaller.
              </Li>
              <Li>
                <strong>Water and sewer.</strong> Riverhead runs a water district and three sewer funds. Southold’s budget has only the Fishers
                Island sewer district, {usd(SOUTHOLD_SUMMARY.special.find((r) => r.code === 'SS2')!.appropriations)}.
              </Li>
              <Li>
                <strong>Tax rates.</strong> Southold’s total rate is {ts.rates.total.y2027.toFixed(3)} per $1,000 of assessed value and Riverhead’s
                town-wide rate {rh.main.rate.toFixed(3)}, but each town assesses property at its own fraction of market value, so the rates can’t be compared.
                Their changes can: {pct(ts.rates.total.pct, 2)} and {pct(rh.main.ratePct, 2)}.
              </Li>
              <Li>
                <strong>Stage.</strong> Both are proposals. {SOUTHOLD_NEWS.outlet} reports Southold’s public hearings on November 4. Either Town
                Board may change its budget before it adopts one.
              </Li>
            </ul>
          </Section>

          <Section id="method" title="How this page was made">
            <P>
              Southold’s Tentative came to this site as an {SOUTHOLD_SOURCE.pages}-page scan with no text, from the Town’s website. Each page was
              read with OCR, upright and turned a quarter-turn each way, and every figure and quotation on this page was then read from the page
              image. Each table’s rows add to its printed totals (the fund-balance totals to within a dollar, as the scan rounds), the Summary
              agrees with the Tax Statistics pages and the fund pages, and each quotation and line figure is checked against the OCR text of its
              page. A check runs on every build of this site and fails if any of that stops being true. The OCR text is kept in the site’s
              repository beside the scan.
            </P>
            <P>
              Riverhead’s figures come from the records this site already checks: the Tentative’s Summary and pages, the 2027 Budget Supplement and
              the audited statements.
            </P>
          </Section>

          <Section id="sources" title="Sources">
            <ul style={{ margin: 0, paddingLeft: 22, display: 'grid', gap: 6, maxWidth: '72ch', fontSize: 15.5, lineHeight: 1.5 }}>
              <li>
                <a href={SOUTHOLD_SOURCE.townUrl} style={link}>{SOUTHOLD_SOURCE.title}</a>, filed {SOUTHOLD_SOURCE.received}, with the letter of{' '}
                {SOUTHOLD_SOURCE.signedBy}. <a href={SOUTHOLD_SOURCE.repoUrl} style={link}>The copy this site read</a>.
              </li>
              <li>
                <a href={SOUTHOLD_NEWS.url} style={link}>{SOUTHOLD_NEWS.outlet}, {SOUTHOLD_NEWS.date}: “{SOUTHOLD_NEWS.title}”</a>, by {SOUTHOLD_NEWS.author}
              </li>
              <li>
                <a href={TFB.source.url} style={link}>Town of Riverhead, {TFB.source.title}</a>: the Supervisor’s letter (pp. 2–3), the Summary (p. 8),
                Salaries of Elected Officials (p. {rh.salaries.pdfPage}) and the refuse district (p. {rh.refuse.page})
              </li>
              {lineSource && <li><a href={lineSource.url} style={link}>Town of Riverhead, {lineSource.title}</a></li>}
              <li><a href={AUDIT_2025.source.url} style={link}>{AUDIT_2025.source.title}</a></li>
              <li><a href={LETTER_2027.meetingReport.url} style={link}>{LETTER_2027.meetingReport.title}</a></li>
              <li>
                This site’s <a href={`${base}/brookhaven-2027/`} style={link}>Brookhaven comparison</a>,{' '}
                <a href={`${base}/reserves/`} style={link}>Reserves</a> and <a href={`${base}/zero-percent-2027/`} style={link}>Zero or 1% for 2027</a> pages
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

function Table({ caption, head, rows }: { caption: string; head: string[]; rows: ReactNode[][] }) {
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
              {/* One element per cell: on a phone each cell is a flex row, and loose pieces would be spread apart. */}
              {r.map((c, i) => <td key={i} data-label={head[i]} style={{ padding: '9px 14px', textAlign: 'left', verticalAlign: 'top', lineHeight: 1.5, color: 'var(--rbl-text-strong)', fontWeight: i === 0 ? 600 : 400 }}><span>{c}</span></td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  )
}
