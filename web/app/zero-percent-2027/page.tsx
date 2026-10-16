import type { ReactNode } from 'react'
import PageShell from '../../components/PageShell'
import PlainCallout from '../../components/PlainCallout'
import { amendmentEffect } from '../../lib/budget-amendments-effect'
import { biggestMisses, source as baSource, theMiss, totals as ba2023, whatItMeansForAFreeze } from '../../lib/budget-vs-actual-2023'
import { LETTER_2027 } from '../../lib/tentative-letters'
import {
  afterTheFact, baseGrowthPct, buildingFeesWatch, draws, exampleHome, gapOf, interest, levels, levelOf, otherEstimates, pathOf,
  policeOffset, savings, sources, suffolk, summary, townWideFunds, trajectory, trendNote, verdict, whyHarder,
} from '../../lib/zero-percent-2027'

const base = process.env.NEXT_PUBLIC_BASE_PATH || ''
function usd(n: number) { return `${n < 0 ? '−' : ''}$${Math.round(Math.abs(n)).toLocaleString('en-US')}` }
const signed = (n: number) => (Math.round(n) === 0 ? '$0' : `${n > 0 ? '+' : '−'}$${Math.round(Math.abs(n)).toLocaleString('en-US')}`)
const pct = (p: number, digits = 2) => `${p > 0 ? '+' : p < 0 ? '−' : ''}${Math.abs(p).toFixed(digits)}%`
const share = (part: number, whole: number) => `${Math.round((part / whole) * 100)}%`
const link = { color: 'var(--rbl-link)', fontWeight: 600 } as const

const one = pathOf(1)
const zero = pathOf(0)
const gf = townWideFunds.find((f) => f.code === 'A01')!
const hw = townWideFunds.find((f) => f.code === 'DA1')!
const sl = townWideFunds.find((f) => f.code === 'SL1')!
const tentative = levelOf('tentative')
const deferred = amendmentEffect?.deferred ?? { lines: [], total: 0 }
const deferredGF = deferred.lines.filter((l) => l.fund === 'A01').reduce((s, l) => s + l.amount, 0)
const interestPages = Array.from(new Set(interest.rows.map((r) => r.page))).sort((a, b) => a - b)
const otherPages = Array.from(new Set(otherEstimates.largest.map((r) => r.page))).sort((a, b) => a - b)
const pageList = (ps: number[]) => (ps.length > 1 ? `pp. ${ps.join(', ')}` : `p. ${ps[0]}`)
const NUMBER_WORDS = ['No', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten']

export const metadata = {
  title: 'Zero or 1%: what a smaller 2027 tax increase would take',
  description:
    `The 2027 Tentative raises Riverhead’s town-wide property tax levy ${summary.tentativePct.toFixed(2)}%, and six amendments before the Town Board would make it ${summary.amendedPct.toFixed(2)}%. ` +
    `A 1% increase would need ${usd(summary.oneBeyond)} more than the amendments find, and no increase ${usd(summary.zeroBeyond)} more. Where it could come from, and what each would cost.`,
}

const SECTIONS = [
  ['levels', 'Five levels for 2027'],
  ['trend', 'How the levy got here'],
  ['money', 'Where the money could come from'],
  ['paths', 'One way to reach each'],
  ['record', 'The budget keeps beating itself'],
  ['harder', 'Why a town is harder to hold flat'],
  ['verdict', 'So, could Riverhead do it?'],
  ['method', 'How this page was made'],
  ['sources', 'Sources'],
] as const

export default function ZeroPercent2027Page() {
  return (
    <PageShell
      title="Zero or 1% for 2027"
      subtitle={`The 2027 Tentative raises Riverhead’s town-wide property tax levy ${summary.tentativePct.toFixed(2)}%. This is what a 1% increase, or none at all, would take.`}
    >
      <PlainCallout
        tips={[
          { label: 'Levy', text: 'the total the Town raises from property taxes. The town-wide levy pays for the General, Highway and Street Lighting funds.' },
          { label: 'Rate', text: 'dollars of tax per $1,000 of assessed value. The tax cap limits the levy; a tax bill follows the rate.' },
          { label: 'Savings', text: '“fund balance”: money left from earlier years. A budget can count some of it as income. It is one-time money.' },
        ]}
      >
        The 2027 Tentative raises the town-wide levy by {usd(summary.tentativeRise)}, or {summary.tentativePct.toFixed(2)}%. Six amendments before
        the Town Board would cut the increase to {usd(summary.amendedRise)}, or {summary.amendedPct.toFixed(2)}%. A 1% increase would take{' '}
        <strong>{usd(summary.oneBeyond)}</strong> more than the amendments find. No increase would mean finding all{' '}
        <strong>{usd(summary.zeroBeyond)}</strong> of it. Budgeting interest at the pace the Town is collecting it covers most of the first. The second leans on savings. On the Supervisor’s{' '}
        {usd(exampleHome.marketValue)} example home, the whole distance from the Tentative to no increase is about {usd(summary.homeTentativeVsZero)} a
        year in town taxes.
      </PlainCallout>

      <div className="tcl-layout">
        <nav aria-label="On this page" className="tcl-contents">
          <div style={{ fontWeight: 700, color: 'var(--rbl-title)', fontSize: 15, marginBottom: 6 }}>On this page</div>
          <ol style={{ margin: 0, paddingLeft: 18, display: 'grid', gap: 4 }}>
            {SECTIONS.map(([id, label]) => <li key={id} style={{ fontSize: 15, lineHeight: 1.4 }}><a href={`#${id}`} style={{ color: 'var(--rbl-link)', textDecoration: 'none' }}>{label}</a></li>)}
          </ol>
        </nav>

        <article className="tcl-article">
          <Section id="levels" title="Five levels for 2027">
            <P>
              The Tentative raises each of the three town-wide funds’ levies by the same {summary.tentativePct.toFixed(2)}%. The Supervisor’s letter says
              every taxing district is within the tax cap limit of {summary.statedLimitPct}%, so a 1% or zero-percent levy would sit well inside the cap.
              The six amendments are proposals until the Board votes on them; the amendments page follows where they stand.
            </P>
            <div data-levels>
              <Table
                caption={`The town-wide levy: the General, Highway and Street Lighting funds. 2026 and the Tentative are the Summary’s figures; the other three are this site’s arithmetic. Rates are per $1,000 of assessed value. The home is the Supervisor’s ${usd(exampleHome.marketValue)} example, assessed at ${usd(exampleHome.assessed)}, rounded to the dollar and before any exemption.`}
                head={['Level', 'Town-wide levy', 'Change from 2026', 'Less than the Tentative', 'Tax rate', 'Town-wide tax on the example home']}
                rows={levels.map((l) => [
                  l.label,
                  usd(l.levy),
                  l.id === '2026' ? '—' : <>{signed(l.change)} <Nowrap>({pct(l.pct)})</Nowrap></>,
                  l.id === '2026' || l.id === 'tentative' ? '—' : usd(l.belowTentative),
                  l.rate === null ? '—' : l.printed ? l.rate.toFixed(3) : <Nowrap>about {l.rate.toFixed(2)}</Nowrap>,
                  l.homeTax === null ? '—' : <>{l.printed ? '' : 'about '}{usd(l.homeTax)}{l.id === '2026' ? '' : <> <Nowrap>({signed(l.homeChange ?? 0)})</Nowrap></>}</>,
                ])}
              />
            </div>
            <P>
              The General Fund carries {usd(gf.tentative - gf.prior)} of the Tentative’s {usd(summary.tentativeRise)} increase, Highway{' '}
              {usd(hw.tentative - hw.prior)} and Street Lighting {usd(sl.tentative - sl.prior)}. The amendments change only the General Fund and Street
              Lighting levies, and would take Street Lighting’s below 2026’s.
            </P>
            <Table
              caption="Each fund’s levy, from the Summaries and, with the amendments, from the six resolutions."
              head={['Fund', '2026', '2027 Tentative', 'With the six amendments']}
              rows={townWideFunds.map((f) => [f.name, usd(f.prior), `${usd(f.tentative)} (${signed(f.tentative - f.prior)})`, `${usd(f.amended)} (${signed(f.amended - f.prior)})`])}
            />
            <P>
              No increase would still lower the example home’s town tax a little. The levy would be spread over more assessed value: the Tentative’s
              levy rises {summary.tentativePct.toFixed(2)}% but its rate only {(tentative.ratePct ?? 0).toFixed(2)}%, a tax base about{' '}
              {baseGrowthPct.toFixed(2)}% larger. The Town sets the final rates on the final assessment roll when it adopts the budget,
              so the rates for the last three levels are estimates. The <a href={`${base}/budget-amendments-2027/`} style={link}>amendments page</a> sets
              out each of the six, and the <a href={`${base}/tentative-2027/`} style={link}>2027 Tentative page</a> the budget as proposed.
            </P>
          </Section>

          <Section id="trend" title="How the levy got here">
            <Table
              caption={`Tax rates per $1,000 of assessed value: 2025 and 2026 from the 2026 Adopted Budget’s rate table, 2027 from the Tentative’s Summary.`}
              head={['Rate', '2025', '2026', '2027 Tentative', 'Change, 2026 to 2027']}
              rows={trajectory.rateRows.map((r) => [
                r.label, r.y2025.toFixed(3), r.y2026.toFixed(3), r.y2027 === null ? '—' : r.y2027.toFixed(3), r.y2027 === null ? '—' : pct((r.y2027 / r.y2026 - 1) * 100),
              ])}
            />
            <div data-levy-history>
              <Table
                caption="The General Fund’s levy, as adopted, and the 2027 proposals. Each change is over the year before; both 2027 rows are over 2026."
                head={['Year', 'General Fund levy', 'Change']}
                rows={trajectory.levyHistory.map((r) => [r.label, usd(r.levy), r.change === null ? '—' : pct(r.change)])}
              />
            </div>
            <P><span data-trend-note>{trendNote}</span></P>
            <P muted>
              Rates and levies can move differently because the assessment roll moves too. Both are shown because the cap governs the levy and a tax
              bill follows the rate.
            </P>
          </Section>

          <Section id="money" title="Where the money could come from">
            <P>
              Four sources, and one that is already spent. Each amount is what it could add beyond the six amendments, against the{' '}
              {usd(summary.oneBeyond)} a 1% increase needs and the {usd(summary.zeroBeyond)} no increase needs.
            </P>

            <H3 id="interest">1. Interest the Town is already earning <Chip kind="recurring">Recurring, moves with rates</Chip></H3>
            <P>
              For years the Town budgeted almost nothing for interest on its deposits and collected far more. The General Fund budgeted{' '}
              {usd(interest.rows[0].budgeted2026)} for 2026, after collecting {usd(interest.rows[0].collected[2].amount)} in{' '}
              {interest.rows[0].collected[2].year}. The Tentative estimates {usd(interest.rows[0].tentative)} for 2027 and the amendments{' '}
              {usd(interest.rows[0].amended)}. By June 30, 2026 the General Fund had already collected {usd(interest.rows[0].firstHalf2026)}.
            </P>
            <div data-interest>
              <Table
                caption={`Interest and earnings in each fund: collections and the first half of 2026 from the Budget Supplements (2027 Supplement ${pageList(interestPages)}). The 2026 pace is twice the first half.`}
                head={['Fund', 'Collected 2023 / 2024 / 2025', 'By June 30, 2026', '2027 estimate with the amendments', 'At the 2026 pace', 'More than the estimate']}
                rows={[
                  ...interest.rows.map((r) => [r.fundName, r.collected.map((c) => usd(c.amount)).join(' / '), usd(r.firstHalf2026), usd(r.amended), usd(r.pace), usd(r.room)]),
                  ['All three', '', '', '', '', usd(interest.total)],
                ]}
              />
            </div>
            <P>
              In every year since 2023, each of the three funds collected at least {interest.lowestMultiple.toFixed(2)} times its first-half interest by
              December. So twice the first half of 2026 is a cautious pace, and it is below what each fund collected in each of the last three years.
              Budgeting at it would add {usd(interest.total)}: {share(interest.total, summary.oneBeyond)} of what a 1% increase needs beyond the
              amendments, and {share(interest.total, summary.zeroBeyond)} of what no increase needs.
            </P>
            <Note tone="warn" label="The catch">
              Interest follows interest rates and the Town’s cash balances. If either falls in 2027, so will this, and the shortfall would come out of
              savings at the end of the year.
            </Note>

            <H3 id="estimates">2. Other estimates below what the Town collects <Chip kind="recurring">Recurring, less dependable</Chip></H3>
            <P>
              After the amendments, {otherEstimates.rows.length} more estimates in the three funds sit below what the line brought in during each of 2023,
              2024 and 2025: {usd(otherEstimates.total)} in all. The largest:
            </P>
            <div data-other-estimates>
              <Table
                caption={`From the Budget Supplements (2027 Supplement ${pageList(otherPages)}). The room is the lowest of the three years less the 2027 estimate, with the amendments where they change it.`}
                head={['Line', 'Collected 2023 / 2024 / 2025', '2027 estimate', 'Room', 'By June 30, 2025 / 2026']}
                rows={otherEstimates.largest.map((r) => [
                  r.name,
                  r.collected.map((c) => usd(c.amount)).join(' / '),
                  `${usd(r.estimate)}${r.amended ? ', as amended' : ''}`,
                  usd(r.room),
                  `${r.firstHalf2025 === null ? '—' : usd(r.firstHalf2025)} / ${r.firstHalf2026 === null ? '—' : usd(r.firstHalf2026)}`,
                ])}
              />
            </div>
            <Note tone="warn" label="The catch">
              These are less dependable than interest. Of the {otherEstimates.rows.length}, {otherEstimates.behind} had brought in less by June 30,
              2026 than by June 30, 2025.
              {buildingFeesWatch && buildingFeesWatch.firstHalf2025 !== null && buildingFeesWatch.firstHalf2026 !== null && (
                <> Building inspection fees fell most: {usd(buildingFeesWatch.firstHalf2026)}, against {usd(buildingFeesWatch.firstHalf2025)} a year
                earlier, while the amendments raise their 2027 estimate from {usd(buildingFeesWatch.tentative)} to {usd(buildingFeesWatch.estimate)}.</>
              )}{' '}
              Raising estimates to past collections holds the levy down only if the money comes in.
            </Note>

            <H3 id="savings">3. Savings <Chip kind="one-time">One-time</Chip></H3>
            <P>
              The General Fund’s unassigned balance was {usd(savings.unassigned)} at the end of {savings.unassignedYear}, {savings.shareOfAppropriations.toFixed(1)}%
              of its 2026 budget. The Town’s policy, Resolution 918 of 2011, sets a floor of {savings.floorPct}% ({usd(savings.floor)}) and no ceiling,
              and the first use it lists for money above the floor is “to reduce the subsequent year’s property taxes.” Resolutions adopted in 2026 have
              committed {usd(savings.committed)} of the {usd(savings.aboveFloor)} above the floor, and {savings.unpriced} more adopted draws carry no
              published amount, so at most {usd(savings.ceiling)} is left.
            </P>
            <P>
              <span data-draws>
                The Tentative counts {usd(draws.tentative)} of savings as General Fund income, the amendments {usd(draws.amended)} and the 2026 budget{' '}
                {usd(draws.y2026)}. Paid from savings alone, a 1% increase would make it {usd(draws.amended + summary.oneBeyond)} and no increase{' '}
                {usd(draws.amended + summary.zeroBeyond)}.
              </span>
            </P>
            <Note tone="warn" label="The catch">
              A levy held down by savings has to be raised again, or the cost cut, the next year. The <a href={`${base}/reserves/`} style={link}>reserves page</a>{' '}
              sets out what else the same balance is meant for.
            </Note>

            <H3 id="spending">4. Spending</H3>
            <P>
              The Board could also spend less. The Supervisor’s letter says: “{LETTER_2027.staffing.quote}” It gives no cost for them, and the Supplement’s lines don’t separate them from other pay, so this page can’t price dropping any of them.
              The <a href={`${base}/spending-reduction-2027/`} style={link}>spending-reduction page</a> lists cuts priced against the 2026 budget’s lines.
              They haven’t been re-priced against the Tentative, so none is counted here.
            </P>

            <H3 id="counted">5. Already counted</H3>
            <P>
              The retirement incentive. The Supervisor’s letter says it “yielded a {usd(LETTER_2027.retirementIncentive.savings)} savings directly to the
              General Fund for 2027.” That saving is already inside the Tentative, so it can’t pay for a lower levy as well.
            </P>
          </Section>

          <Section id="paths" title="One way to reach each">
            <P>
              This is one route to each target, using the most lasting money first. It is this site’s illustration from the records above, not a
              proposal: the Town has proposed neither.
            </P>
            <div data-paths>
              <Table
                caption="Town-wide, in dollars. Interest is shared among the three funds; the savings are the General Fund’s."
                head={['Step', 'To a 1% increase', 'To no increase']}
                rows={[
                  ['Less than the Tentative', usd(one.belowTentative), usd(zero.belowTentative)],
                  ['1. The six amendments', signed(-one.amendments), signed(-zero.amendments)],
                  ['2. Interest at its 2026 pace', signed(-one.interest), signed(-zero.interest)],
                  ['3. From General Fund savings', signed(-one.fromSavings), signed(-zero.fromSavings)],
                  ['General Fund savings used in 2027', usd(one.draw), usd(zero.draw)],
                  ['Town-wide levy', usd(one.levy), usd(zero.levy)],
                ]}
              />
            </div>
            <P>
              For 1%, the savings used would still be {usd(draws.y2026 - one.draw)} less than 2026’s {usd(draws.y2026)}. For no increase, they would be{' '}
              {usd(zero.draw - draws.y2026)} more. Raising the other estimates to their three-year lows could replace {usd(zero.withOthers.fromOthers)} of
              the savings, for a draw of {usd(zero.withOthers.draw)}, but with no cushion if any of them falls short.
            </P>
            {deferred.total > 0 && (
              <P>
                The amendments also take {usd(deferred.total)} of equipment out of the budget ({usd(deferredGF)} in the General Fund,{' '}
                {usd(deferred.total - deferredGF)} in Street Lighting), to be bought from savings by separate votes during 2027. That is one-time money too,
                on top of the draws above.
              </P>
            )}
          </Section>

          <Section id="record" title="The budget keeps beating itself">
            <P>{theMiss.detail}</P>
            <Table
              caption={`The largest 2023 differences between the final budget and the result, from the ${baSource.schedule}.`}
              head={['Line', 'Final budget', 'Actual', 'Difference']}
              rows={biggestMisses.map((m) => [
                <>{m.label}<span style={{ display: 'block', color: 'var(--rbl-text-muted)', fontSize: 14.5, fontWeight: 400 }}>{m.note}</span></>,
                usd(m.final), usd(m.actual), signed(m.actual - m.final),
              ])}
            />
            <P>
              <span data-after-the-fact>
                The pattern held in the two years audited since.{' '}
                {afterTheFact.map((y, i) => (
                  <span key={y.year}>
                    {i > 0 && ' '}The {y.year} budget planned to use {y.plannedDraw === null ? 'some' : usd(y.plannedDraw)} of savings; the General Fund’s
                    balance {y.netChange >= 0 ? 'rose' : 'fell'} {usd(Math.abs(y.netChange))} instead.
                  </span>
                ))}
              </span>{' '}
              None of it held the levy down. It wasn’t known until each year was over, and it went to fund balance.
            </P>
            <Note tone="info" label="The fair reading">{whatItMeansForAFreeze.theFairReading}</Note>
            <P>
              Raising estimates and budgeting a bigger draw rest on the same pattern, so they can’t both be counted from the same dollars. Revenue
              budgeted at the start of the year doesn’t turn up again as surplus at the end. {whatItMeansForAFreeze.theQuestion}
            </P>
            <P muted>
              {baSource.schedule}, from the {baSource.title}. The Annual Financial Report filed with the State shows larger totals for the same year
              because it folds transfers between funds into revenues and expenditures; adding transfers in of {usd(ba2023.transfersIn.actual)} and out
              of {usd(Math.abs(ba2023.transfersOut.actual))} reconciles the two. The 2024 and 2025 changes are from each audit’s statement of revenues,
              expenditures and changes in fund balances.
            </P>
          </Section>

          <Section id="harder" title="Why a town is harder to hold flat">
            <H3 id="suffolk">What Suffolk pledged</H3>
            <blockquote style={{ margin: '0 0 10px', padding: '12px 16px', border: '1px solid var(--rbl-info-border)', background: 'var(--rbl-info-bg)', borderRadius: 10, color: 'var(--rbl-info-text)', fontSize: 16, lineHeight: 1.6 }}>
              {suffolk.pledge}
            </blockquote>
            <P muted>{suffolk.who}. {suffolk.dateNote}</P>
            <P>{suffolk.how} {suffolk.theCatch}</P>

            <H3 id="shares">Riverhead’s General Fund is mostly police and benefits</H3>
            <div data-shares>
              <Table
                caption={whyHarder.sourceNote}
                head={['Spending', '2027 Tentative', 'Share']}
                rows={whyHarder.shares.map((s) => [s.label, usd(s.amount), `${s.pct.toFixed(1)}%`])}
              />
            </div>
            <P>{whyHarder.detail}</P>

            <H3 id="contracts">Both police contracts are open</H3>
            <P>{whyHarder.contracts}</P>
            <P>{whyHarder.triboroughFloor}</P>

            <H3 id="police">On the police side, 2027 is treading water</H3>
            <Table
              caption="From the Town Board’s retirement resolutions and the authorized-salary listings."
              head={['Item', 'A year']}
              rows={[
                [`${NUMBER_WORDS[policeOffset.swornCount] ?? policeOffset.swornCount} sworn retirements, at the promotion-chain rate`, usd(policeOffset.savingFromRetirements)],
                ['Step movement owed anyway, Police Officer ladder only', signed(-policeOffset.triboroughStepFloor)],
                ['Net, before any contract and before the other ladders', signed(policeOffset.net)],
              ]}
            />
            <P>{policeOffset.reading}</P>
            <P muted>{policeOffset.caveat}</P>
          </Section>

          <Section id="verdict" title="So, could Riverhead do it?">
            <H3 id="verdict-one">A 1% increase</H3>
            <P><span data-verdict-one>{verdict.onePct}</span></P>
            <H3 id="verdict-zero">No increase</H3>
            <P><span data-verdict-zero>{verdict.zeroPct}</span></P>
            <Note tone="info" label="The point to take away">{verdict.theRealPoint}</Note>
          </Section>

          <Section id="method" title="How this page was made">
            <ul style={{ margin: '0 0 14px', paddingLeft: 20, display: 'grid', gap: 8, maxWidth: '72ch' }}>
              <Li>The 2026 and Tentative levies and rates are the Summaries’ “Total Town Wide” rows. The amended levy applies the six resolutions’ own lines to the 2027 Budget Supplement, which adds up to the Tentative to the dollar.</Li>
              <Li>A 1% increase is {usd(gapOf(1).levy)}, 1% over 2026’s {usd(levelOf('2026').levy)}, rounded to the dollar. No increase is 2026’s levy.</Li>
              <Li>Rates for the last three levels scale each fund’s Tentative rate by its levy, on the Tentative’s assessed values. For 1% and no increase, each fund’s levy rises by the same share, as each does in the Tentative.</Li>
              <Li>The example home is the {usd(exampleHome.marketValue)} property in the Supervisor’s letter, at the {exampleHome.ratioYear}–{String(exampleHome.ratioYear + 1).slice(2)} residential assessment ratio of {exampleHome.ratio}% on the Receiver of Taxes’ rate sheet. Only town-wide taxes are counted: school, county, fire, library and special district taxes are not.</Li>
              <Li>Interest at its 2026 pace is twice what each fund had collected by June 30, 2026, the Supplement’s year-to-date column.</Li>
              <Li>Other estimates count lines the Town still budgets, other than property taxes, savings, interest, and charges or transfers between Town funds.</Li>
              <Li>Collections are the Town’s books before the audit, as each Supplement prints them. Savings are the audited balance less the 2026 draws on the record.</Li>
            </ul>
            <P muted>
              Every figure on this page is checked against those records when the site is built (<code>scripts/verify-zero-percent-2027.mjs</code>).
              This page is unofficial. It describes likely effects for residents; it is not a forecast, an audit or legal advice.
            </P>
          </Section>

          <Section id="sources" title="Sources">
            <ul style={{ margin: 0, paddingLeft: 20, display: 'grid', gap: 10, maxWidth: '72ch' }}>
              {sources.map((s) => (
                <li key={s.url} style={{ fontSize: 16, lineHeight: 1.55, color: 'var(--rbl-text-strong)' }}>
                  <a href={s.url} style={link}>{s.title}</a>. {s.covers}
                </li>
              ))}
            </ul>
          </Section>
        </article>
      </div>
    </PageShell>
  )
}

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} style={{ scrollMarginTop: 20, paddingTop: 8, marginBottom: 36 }}>
      <h2 style={{ fontSize: 'clamp(24px,3vw,29px)', fontWeight: 700, color: 'var(--rbl-title)', letterSpacing: '-.01em', margin: '0 0 14px', paddingBottom: 10, borderBottom: '1px solid var(--rbl-border-subtle)' }}>{title}</h2>
      {children}
    </section>
  )
}

function H3({ id, children }: { id?: string; children: ReactNode }) {
  return <h3 id={id} style={{ fontSize: 19, fontWeight: 700, color: 'var(--rbl-title)', margin: '26px 0 6px', scrollMarginTop: 20 }}>{children}</h3>
}

function P({ children, muted }: { children: ReactNode; muted?: boolean }) {
  return <p style={{ fontSize: muted ? 15 : 17, lineHeight: 1.65, color: muted ? 'var(--rbl-text-muted)' : 'var(--rbl-text-strong)', margin: '0 0 14px', maxWidth: '72ch' }}>{children}</p>
}

function Nowrap({ children }: { children: ReactNode }) {
  return <span style={{ whiteSpace: 'nowrap' }}>{children}</span>
}

function Li({ children }: { children: ReactNode }) {
  return <li style={{ fontSize: 16.5, lineHeight: 1.6, color: 'var(--rbl-text-strong)' }}>{children}</li>
}

const CHIP = {
  recurring: { fg: 'var(--rbl-success-strong)', bg: 'var(--rbl-success-bg)', bd: 'var(--rbl-success-border)' },
  'one-time': { fg: 'var(--rbl-warn-strong)', bg: 'var(--rbl-warn-bg)', bd: 'var(--rbl-warn-border)' },
} as const

function Chip({ kind, children }: { kind: keyof typeof CHIP; children: ReactNode }) {
  const c = CHIP[kind]
  return (
    <span style={{ display: 'inline-block', verticalAlign: 'middle', marginLeft: 8, color: c.fg, background: c.bg, border: `1px solid ${c.bd}`, borderRadius: 999, padding: '1px 10px', fontSize: 14, fontWeight: 600 }}>
      {children}
    </span>
  )
}

const NOTE = {
  warn: { fg: 'var(--rbl-warn-strong)', bg: 'var(--rbl-warn-bg)', bd: 'var(--rbl-warn-border)' },
  info: { fg: 'var(--rbl-info-text)', bg: 'var(--rbl-info-bg)', bd: 'var(--rbl-info-border)' },
} as const

function Note({ tone, label, children }: { tone: keyof typeof NOTE; label: string; children: ReactNode }) {
  const c = NOTE[tone]
  return (
    <div style={{ background: c.bg, border: `1px solid ${c.bd}`, borderRadius: 10, padding: '12px 14px', margin: '0 0 16px', maxWidth: '72ch' }}>
      <p style={{ margin: 0, color: c.fg, fontSize: 16, lineHeight: 1.6 }}><strong>{label}:</strong> {children}</p>
    </div>
  )
}

function Table({ caption, head, rows }: { caption: string; head: string[]; rows: ReactNode[][] }) {
  return (
    <figure className="tcl-table" style={{ margin: '6px 0 18px', background: 'var(--rbl-surface)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 12, overflowX: 'auto' }}>
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
              {r.map((c, i) => <td key={i} data-label={head[i]} className={c === '' ? 'rbl-narrow-hide' : undefined} style={{ padding: '9px 14px', textAlign: 'left', verticalAlign: 'top', lineHeight: 1.5, color: 'var(--rbl-text-strong)', fontWeight: i === 0 ? 600 : 400 }}><span>{c}</span></td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  )
}
