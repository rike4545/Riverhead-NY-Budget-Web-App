import type { CSSProperties, ReactNode } from 'react'
import PageShell from '../../components/PageShell'
import PlainCallout from '../../components/PlainCallout'
import { ADOPTED_PACKET, AMENDMENTS, VOTE_ARTICLE, ARTICLE, NEWSDAY_ARTICLE, BUDGET_2022, NEXT_STEPS, PACKET, VOTES, STAFF_APPOINTMENT, SUPERVISOR_STAFF, SUPPLEMENT_YTD_THROUGH, fundEffects, isRevenue, type Amendment } from '../../lib/budget-amendments-2027'
import { amendmentEffect, exampleHome, generalFundInterest, raisedRevenues } from '../../lib/budget-amendments-effect'
import { OUTLOOK, RECORD } from '../../lib/budget-adoption'
import { AUDIT_2025 } from '../../lib/audits'
import { RESERVE_YEAR, reserveYearAudited, unassignedFundBalance } from '../../lib/reserve-policy'
import { LETTER_2027, READ_BY_HAND } from '../../lib/tentative-letters'
import taxBill from '../../public/data/tax-bill.json'

const fx = amendmentEffect

export const metadata = {
  title: 'The amendments to the 2027 budget',
  description: fx
    ? `Six resolutions the Town Board adopted on October 20, 2026 would raise ${usd(-fx.townWide.change)} less in town-wide property taxes than the 2027 Tentative, a ${fx.townWide.pctAfter.toFixed(2)}% increase over 2026. What each one changes, line by line, and what it means for savings and a tax bill.`
    : 'Six resolutions the Town Board adopted on October 20, 2026 amend the 2027 budget.',
}

const base = process.env.NEXT_PUBLIC_BASE_PATH || ''
function usd(n: number) { return `${n < 0 ? '−' : ''}$${Math.round(Math.abs(n)).toLocaleString('en-US')}` }
const signed = (n: number) => (n === 0 ? '$0' : `${n > 0 ? '+' : '−'}$${Math.round(Math.abs(n)).toLocaleString('en-US')}`)
const NUMBER_WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine']
const count = (n: number) => NUMBER_WORDS[n] ?? String(n)
const words = (items: string[]) => (items.length < 3 ? items.join(' and ') : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`)
const pages = (ps: number[]) => (ps.length > 1 ? `pp. ${ps[0]}–${ps[ps.length - 1]}` : `p. ${ps[0]}`)
const sum = (xs: number[]) => xs.reduce((s, x) => s + x, 0)

const SECTIONS = [
  ['glance', 'At a glance'],
  ['amendments', 'The six amendments'],
  ['revenue', 'The higher revenue estimates'],
  ['savings', 'What happens to savings'],
  ['tax-bill', 'What it means for a tax bill'],
  ['status', 'Where this stands'],
  ['race', 'How it bears on the supervisor’s race'],
  ['questions', 'Questions residents may want to ask'],
  ['method', 'How this page was made'],
  ['sources', 'Sources'],
] as const

export default function BudgetAmendmentsPage() {
  if (!fx) {
    return (
      <PageShell title="The amendments to the 2027 budget" subtitle="The 2027 Tentative and its Budget Supplement are not in this site’s records, so there is nothing to set the amendments against.">
        <P>This page returns when the Tentative’s Summary and the Supplement have been read.</P>
      </PageShell>
    )
  }

  const tw = fx.townWide
  const fund = (code: string) => fx.funds.find((f) => f.fund === code)
  const account = (code: string) => fx.accounts.find((a) => a.account === code)
  const gf = fund('A01')!
  const sl = fund('SL1')!
  const hw = fund('DA1')!
  const voteOf = (n: number) => VOTES.find((v) => v.n === n) ?? null
  const halpinYes = VOTES.filter((v) => v.ayes.includes('Jerry Halpin'))
  const allNoNays = VOTES.every((v) => v.nays.length === 0)

  // Spending the six take out and put in, line by line.
  const spendingLines = AMENDMENTS.flatMap((a) => a.lines.filter((l) => !isRevenue(l.account)).map((l) => ({ n: a.n, ...l })))
  const spendingOut = sum(spendingLines.filter((l) => l.side === 'from').map((l) => l.amount))
  const spendingIn = sum(spendingLines.filter((l) => l.side === 'to').map((l) => l.amount))
  const deferredGeneral = sum(fx.deferred.lines.filter((l) => l.fund === 'A01').map((l) => l.amount))
  const deferredLighting = sum(fx.deferred.lines.filter((l) => l.fund === 'SL1').map((l) => l.amount))
  const notDeferredOut = spendingOut - fx.deferred.total
  // Pay and insurance: the personnel and benefit lines the six add to.
  const recurring = spendingLines.filter((l) => l.side === 'to')
  const recurringByAmendment = [2, 4, 6].map((n) => ({ n, amount: sum(recurring.filter((l) => l.n === n).map((l) => l.amount)) }))
  const dental = AMENDMENTS.find((a) => a.n === 6)!
  const dentalRevenue = sum(dental.lines.filter((l) => isRevenue(l.account)).map((l) => l.amount))
  const dentalFeeLine = dental.lines.find((l) => l.account.startsWith('A01-1560'))!
  const dentalInterest = sum(dental.lines.filter((l) => l.account.includes('-2401-')).map((l) => l.amount))
  const dentalHighway = dental.lines.find((l) => l.account.startsWith('DA1-5-5130'))!
  const dentalFunds = Array.from(new Set(dental.lines.filter((l) => !isRevenue(l.account)).map((l) => l.account.split('-')[0])))
  const revenueRaised = sum(raisedRevenues.map((r) => r.change))
  const fees = raisedRevenues.find((r) => r.account === 'A01-1560-170-00000-3')
  const fines = raisedRevenues.find((r) => r.account === 'A01-2610-000-00000-1')
  const gfInterest = raisedRevenues.find((r) => r.account === 'A01-2401-000-00000-G')
  const districtInterest = raisedRevenues.filter((r) => r.account.includes('-2401-') && !r.account.startsWith('A01'))
  const savingsUseIfBought = deferredGeneral + gf.fundBalance
  const snow = account('DA1-5-5142-400-000-00000')
  const snowLine = snowLineOf()
  const letter = READ_BY_HAND[2027]
  const lastYear = RECORD.find((r) => r.year === 2026)
  /** The News-Review's headline on the Tentative, from "Halpin’s Riverhead budget …". */
  const streak = /“Halpin’s Riverhead budget (would end [^”]+)”/.exec(LETTER_2027.meetingReport.title)?.[1] ?? null
  const levyAdded = sum(fx.funds.map((f) => Math.max(0, sum(AMENDMENTS.flatMap((a) => fundEffects([a]).filter((e) => e.fund === f.fund && e.levy > 0).map((e) => e.levy))))))
  const cutFromEstimates = -tw.change - fx.deferred.total + levyAdded
  const dentalTotal = sum(dental.lines.filter((l) => l.side === 'to').map((l) => l.amount))
  const dentalDistricts = dental.lines.filter((l) => l.account.includes('-2401-')).length
  const districtsBelow2025 = districtInterest.every((r) => r.after !== null && r.after < (r.collected.find((c) => c.year === 2025)?.amount ?? 0))
  const districtMaxBefore = Math.max(...districtInterest.map((r) => r.before ?? 0))

  const levyEffect = (a: Amendment) => {
    const parts: string[] = []
    for (const e of fundEffects([a])) {
      const name = fund(e.fund)?.name ?? e.fund
      if (e.levy < 0) parts.push(`lowers the ${name} levy by ${usd(-e.levy)}`)
      if (e.levy > 0) parts.push(`raises the ${name} levy by ${usd(e.levy)}`)
      if (e.fundBalance < 0) parts.push(`counts ${usd(-e.fundBalance)} less of the ${name}’s savings as income`)
    }
    return parts.length ? `It ${words(parts)}.` : 'It leaves every levy where the Tentative put it.'
  }

  return (
    <PageShell
      title="The amendments to the 2027 budget"
      subtitle={`The Town Board adopted six amendments on October 20, with no votes against. They would raise ${usd(-tw.change)} less in town-wide property taxes than the Supervisor’s Tentative. What each one changes, line by line, and what it means for savings and a tax bill.`}
    >
      <PlainCallout
        tips={[
          { label: 'Preliminary budget', text: 'the Supervisor’s Tentative as the Board changes it. The Board holds a public hearing on it, then adopts a budget by November 20.' },
          { label: 'Levy', text: 'the total the Town raises from property taxes. The town-wide levy pays for the General, Highway and Street Lighting funds.' },
          { label: 'Savings', text: '“fund balance”: money left from earlier years. A budget can count some of it as income, called appropriated fund balance.' },
        ]}
      >
        The Board adopted all six on {PACKET.meeting.date}, with no votes against, and they become part of the Preliminary Budget the
        Board will hold a hearing on. Once the budget is adopted, the six would raise {usd(tw.after)} in town-wide property taxes, {usd(-tw.change)} less than the Tentative, so the levy would rise{' '}
        {tw.pctAfter.toFixed(2)}% over 2026 instead of {tw.pctBefore.toFixed(2)}%. Of the cut, {usd(cutFromEstimates)} comes from higher estimates of
        what the Town will collect in fees, fines and interest, and {usd(fx.deferred.total)} from taking equipment out of the budget, to be bought
        from savings by separate votes during 2027. One amendment adds {usd(levyAdded)}. Three of the six add pay or insurance costs.{' '}
        {ARTICLE.outlet} reports that Council Member Ken Rothwell proposed them.
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
              caption={`The 2027 Tentative’s Summary (PDF p. 8) beside the Tentative with all six amendments. The amended figures are this site’s arithmetic from the resolutions (packet ${pages([AMENDMENTS[0].page, 598])}); the Town has not published totals for the six.`}
              head={['Measure', '2027 Tentative', 'With the six amendments']}
              rows={[
                ['Town-wide property tax levy', `${usd(tw.before)}, up ${tw.pctBefore.toFixed(2)}% from 2026’s ${usd(tw.prior)}`, `${usd(tw.after)}, up ${tw.pctAfter.toFixed(2)}%`],
                ['General Fund levy', usd(gf.before!.levy), usd(gf.after!.levy)],
                ['Highway Fund levy', usd(hw.before!.levy), `${usd(hw.after!.levy)}, unchanged`],
                ['Street Lighting District levy', usd(sl.before!.levy), `${usd(sl.after!.levy)}, ${usd(sl.prior!.levy - sl.after!.levy)} below 2026`],
                ['Spending, all funds', usd(fx.totals.appropriationsBefore), usd(fx.totals.appropriationsBefore + fx.totals.appropriationsChange)],
                ['General Fund savings counted as income', usd(gf.before!.fundBalance), usd(gf.after!.fundBalance)],
                ['Equipment to be bought later from savings', 'None', `${usd(fx.deferred.total)}, by separate votes in 2027`],
                ['Town-wide tax rate per $1,000 of assessed value', tw.rateBefore.toFixed(3), tw.rateAfter === null ? '—' : `about ${tw.rateAfter.toFixed(2)}, this site’s estimate`],
              ]}
            />
            <figure aria-labelledby="amendment-impact-title" style={{ margin: '18px 0 22px', padding: 16, border: '1px solid var(--rbl-border-subtle)', borderRadius: 14, background: 'var(--rbl-surface-2)' }}>
              <figcaption style={{ marginBottom: 14 }}>
                <h3 id="amendment-impact-title" style={{ margin: '0 0 5px', color: 'var(--rbl-title)', fontSize: 18 }}>What accounts for the lower levy?</h3>
                <p style={{ margin: 0, color: 'var(--rbl-text-muted)', fontSize: 14, lineHeight: 1.5 }}>
                  The arithmetic behind the {usd(-tw.change)} reduction from the Tentative. Positive bars reduce the amount raised from property taxes; the negative offset adds to it.
                </p>
              </figcaption>
              <div style={{ display: 'grid', gap: 13 }}>
                {[
                  { label: 'Higher revenue estimates', amount: cutFromEstimates, direction: 'reduces the levy' },
                  { label: 'Equipment moved to separate fund-balance votes', amount: fx.deferred.total, direction: 'reduces the levy' },
                  { label: 'Levy added by one amendment', amount: -levyAdded, direction: 'offsets the reduction' },
                ].map((item) => (
                  <div key={item.label} style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', gap: '5px 12px', alignItems: 'baseline' }}>
                    <strong style={{ color: 'var(--rbl-text-strong)', fontSize: 14 }}>{item.label}</strong>
                    <strong style={{ color: item.amount >= 0 ? 'var(--inc)' : 'var(--dec)', fontSize: 14, fontVariantNumeric: 'tabular-nums' }}>
                      {item.amount >= 0 ? '−' : '+'}{usd(Math.abs(item.amount))}
                    </strong>
                    <div role="img" aria-label={`${item.label}: ${item.direction}, ${usd(Math.abs(item.amount))}`} style={{ gridColumn: '1 / -1', height: 10, borderRadius: 99, background: 'var(--rbl-border-subtle)', overflow: 'hidden' }}>
                      <div style={{ width: `${(Math.abs(item.amount) / Math.max(cutFromEstimates, fx.deferred.total, levyAdded, 1)) * 100}%`, height: '100%', borderRadius: 99, background: item.amount >= 0 ? 'var(--inc)' : 'var(--dec)' }} />
                    </div>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, paddingTop: 11, borderTop: '1px solid var(--rbl-border-subtle)' }}>
                  <strong style={{ color: 'var(--rbl-title)' }}>Net reduction in the town-wide levy</strong>
                  <strong style={{ color: 'var(--rbl-title)', fontVariantNumeric: 'tabular-nums' }}>{usd(-tw.change)}</strong>
                </div>
              </div>
              <p style={{ margin: '12px 0 0', color: 'var(--rbl-text-muted)', fontSize: 12.5, lineHeight: 1.45 }}>
                Calculated from the six resolutions and the Tentative’s Summary. The Town has not published a consolidated amendment total.
              </p>
            </figure>
            <P>
              The levy would still grow, by {usd(tw.growthAfter)} over 2026 instead of the Tentative’s {usd(tw.growthBefore)}. Spending across all
              funds would fall by {usd(-fx.totals.appropriationsChange)}: the six take {usd(spendingOut)} out of equipment and snow-removal lines and
              add {usd(spendingIn)} of pay and health insurance.
            </P>
            {letter?.taxCap && (
              <P>
                The Supervisor’s letter says “{letter.taxCap}” With the six, the town-wide levy would rise less than that. The letter gives the
                limit only as a percentage, and no Town document prints its dollar amount (<a href={`${base}/tentative-2027/`} style={link}>2027 Tentative</a>).
              </P>
            )}
          </Section>

          <Section id="amendments" title="The six amendments">
            <P>
              Each resolution lists the accounts it changes in two columns, “from” and “to”. Money comes from a smaller appropriation or a
              higher revenue estimate, and goes to a larger appropriation or a smaller revenue: less property tax, or less savings used. Each
              one balances within each fund. The numbers are the Town’s; {ARTICLE.outlet} describes the same six in a different order.
            </P>
            {AMENDMENTS.map((a) => {
              const vote = voteOf(a.n)
              return (
                <div key={a.n}>
                  <H3>Amendment #{a.n}: {a.short.charAt(0).toLowerCase() + a.short.slice(1)}</H3>
                  <P>Its reason, as printed: {a.whereas.map((w, i) => <span key={i}>{i > 0 && ', and '}“{w}”</span>)}.</P>
                  <Table
                    caption={`Agenda item ${a.item}: the resolution, packet p. ${a.page}, and its fiscal impact statement, ${pages(a.statementPages)}. The Tentative figures are the 2027 Budget Supplement’s (${supplementPages(a)}).`}
                    head={['Account', 'Line, as the resolution names it', '2027 Tentative', 'Change']}
                    rows={a.lines.map((l) => {
                      const acc = account(l.account)
                      return [l.account, l.name, acc?.before == null ? '—' : usd(acc.before), signed(isRevenue(l.account) === (l.side === 'from') ? l.amount : -l.amount)]
                    })}
                  />
                  <P>
                    {levyEffect(a)} {amendmentNote(a.n)}
                    {vote && <> {vote.result} on {PACKET.meeting.date} as Resolution {vote.number}: moved by {vote.mover}, seconded by {vote.seconder}; ayes,{' '}
                      {words(vote.ayes)}; nays, {vote.nays.length ? words(vote.nays) : 'none'} (packet with results, p. {vote.votePage}).</>}
                  </P>
                </div>
              )
            })}

            <H3>By fund</H3>
            <Table
              caption="All six together, fund by fund. A fund balances when its spending changes by as much as its revenue."
              head={['Fund', 'Spending', 'Property tax', 'Savings used', 'Other revenue']}
              rows={fx.funds.map((f) => [f.name, signed(f.appropriations), signed(f.levy), signed(f.fundBalance), signed(f.otherRevenue)])}
            />
          </Section>

          <Section id="revenue" title="The higher revenue estimates">
            <P>
              Amendments #3, #5 and #6 raise {count(raisedRevenues.length)} estimates of what the Town will collect, by {usd(revenueRaised)} in all.
              A higher estimate is not cash in hand. If 2027 collections fall short of it, the difference comes out of the fund’s savings at the
              end of the year, or out of spending.
            </P>
            <Table
              caption={`What the Town collected (the Budget Supplements’ actual columns, the Town’s books before the audit), what 2026’s budget estimated, what came in through ${SUPPLEMENT_YTD_THROUGH} (the 2027 Supplement’s year-to-date column), and the 2027 estimates.`}
              head={['Line', 'Collected 2023', '2024', '2025', '2026 budget', `2026, to ${SUPPLEMENT_YTD_THROUGH.replace(/, \d{4}$/, '')}`, '2027 Tentative', 'Amended']}
              rows={raisedRevenues.map((r) => [
                `${fund(r.account.split('-')[0])?.name ?? r.account.split('-')[0]}: ${r.name}`,
                ...r.collected.map((c) => (c.amount === null ? '—' : usd(c.amount))),
                r.adopted2026 === null ? '—' : usd(r.adopted2026),
                r.firstHalf2026 === null ? '—' : usd(r.firstHalf2026),
                r.before === null ? '—' : usd(r.before),
                r.after === null ? '—' : usd(r.after),
              ])}
            />
            {generalFundInterest && gfInterest && (
              <>
                <H3>Interest</H3>
                <P>
                  The General Fund’s budgets have long estimated far less interest than it earned. Every budget from{' '}
                  {generalFundInterest.rows[0].year} to 2026 estimated {usd(Math.max(...generalFundInterest.rows.map((r) => r.estimated ?? 0), generalFundInterest.adopted2026 ?? 0))} or
                  less. The Town collected{' '}
                  {words(generalFundInterest.rows.filter((r) => r.year >= 2023).map((r) => `${usd(r.collected ?? 0)} in ${r.year}`))}, and{' '}
                  {usd(generalFundInterest.firstHalf2026 ?? 0)} in the first half of 2026. The Tentative estimates {usd(gfInterest.before ?? 0)} for 2027;
                  Amendment #3 would make it {usd(gfInterest.after ?? 0)}.
                </P>
                <P>
                  {ARTICLE.outlet} reports Rothwell’s figure: “{ARTICLE.reported.earnings}” The General Fund’s collections for{' '}
                  {generalFundInterest.threeYears.from} to {generalFundInterest.threeYears.to} add to {usd(generalFundInterest.threeYears.collected)},
                  which rounds to that. The article does not say what period he meant. Interest depends on rates and on how much cash the Town
                  holds, so it can fall even when the Town does nothing differently.
                </P>
              </>
            )}
            {fees && (
              <>
                <H3>Building inspection fees</H3>
                <P>
                  Amendments #3 and #6 together raise this estimate by {usd(fees.change)}, to {usd(fees.after ?? 0)}. The Town collected{' '}
                  {words(fees.collected.filter((c) => c.year >= 2024).map((c) => `${usd(c.amount ?? 0)} in ${c.year}`))}. In the first half of 2026 it
                  collected {usd(fees.firstHalf2026 ?? 0)}, {Math.round(((fees.firstHalf2026 ?? 0) / (fees.adopted2026 ?? 1)) * 100)}% of that year’s{' '}
                  {usd(fees.adopted2026 ?? 0)} estimate. Fees follow construction, which can slow.
                </P>
              </>
            )}
            {fines && (
              <>
                <H3>Fines and forfeited bail</H3>
                <P>
                  Amendment #3 raises this estimate by {usd(fines.change)}, to {usd(fines.after ?? 0)}. The Town collected{' '}
                  {words(fines.collected.filter((c) => c.year >= 2024).map((c) => `${usd(c.amount ?? 0)} in ${c.year}`))}, and{' '}
                  {usd(fines.firstHalf2026 ?? 0)} in the first half of 2026.
                </P>
              </>
            )}
            {districtInterest.length > 0 && (
              <>
                <H3>The districts’ interest</H3>
                <P>
                  The Tentative estimates {usd(districtMaxBefore)} or less of interest for each of the water, sewer, scavenger waste and street
                  lighting districts. The amendments raise those estimates by {usd(sum(districtInterest.map((r) => r.change)))} in all
                  {districtsBelow2025 ? ', to amounts still below what each district collected in 2025' : ''}.
                </P>
              </>
            )}
          </Section>

          <Section id="savings" title="What happens to savings">
            <P>
              Amendment #3 would count {usd(-gf.fundBalance)} less of the General Fund’s savings as income in 2027: {usd(gf.after!.fundBalance)}{' '}
              instead of {usd(gf.before!.fundBalance)}.
            </P>
            <P>
              Amendments #1 and #5 take {usd(fx.deferred.total)} of equipment out of the budget: {words(fx.deferred.lines.map((l) => `${usd(l.amount)} of ${l.name.toLowerCase().replace(/^b&g/, 'buildings and grounds')}`))}.
              Both say the purchases would instead be “funded with … fund balance via the submission of separate Town Board resolutions in
              2027.” The purchases would still be made, paid from savings by votes of their own during the year rather than through the levy.
              In {ARTICLE.outlet}’s words, “{ARTICLE.reported.financing}”
            </P>
            <P>
              {NEWSDAY_ARTICLE.outlet} describes it differently: “{NEWSDAY_ARTICLE.reported.equipment}” The equipment is still General Fund
              equipment; what changes is that the levy no longer pays for it and savings would, by separate votes. Of Amendment #6 it says,
              “{NEWSDAY_ARTICLE.reported.highwayTransfer}” There is no separate equipment fund: Amendment #6 cuts the Highway Fund’s own
              equipment line by {usd(dentalHighway.amount)} and moves it to that fund’s health insurance. On the equipment, it reports: “
              {NEWSDAY_ARTICLE.reported.annually}” If so, the same purchases would come back in later budgets.
            </P>
            <P>
              If the Board later approves all of them, the General Fund would use {usd(savingsUseIfBought)} more of its savings in 2027 than the
              Tentative planned ({usd(deferredGeneral)} of equipment against {usd(-gf.fundBalance)} less in the budget), and the Street Lighting
              District {usd(deferredLighting)} more. For scale, the General Fund’s unassigned fund balance was {usd(unassignedFundBalance)} at the end
              of {RESERVE_YEAR}{reserveYearAudited ? ', by the audit' : ''}.
            </P>
            <P>
              Paying for equipment from savings uses one-time money for a one-time cost, the rule of thumb in this site’s guide to{' '}
              <a href={`${base}/guide/#one-time-vs-recurring`} style={link}>one-time money and recurring costs</a>. Rothwell, as{' '}
              {ARTICLE.outlet} reports him: “{ARTICLE.reported.ongoing}.”
            </P>
            <P>
              Three amendments add costs that carry into later years once granted: merit increases and a promotion (#2 and #4), and money for a
              possible change in dental plans (#6), {usd(sum(recurringByAmendment.map((r) => r.amount)))} in all. They are paid for with{' '}
              {usd(recurringByAmendment[0].amount)} of levy, {usd(snow ? -snow.change : 0)} from the snow budget, {usd(dentalHighway.amount)} from Highway
              equipment and {usd(dentalRevenue)} of higher revenue estimates. An equipment cut saves money once; a raise is in every budget after.
            </P>
            <P>
              Of the {usd(spendingOut)} the six take out of spending, {usd(fx.deferred.total)} is equipment to be bought later. The other{' '}
              {usd(notDeferredOut)} ({usd(dentalHighway.amount)} of Highway equipment and {usd(snowLine.cut)} of the snow budget) is moved to pay
              and insurance, and the resolutions do not say whether those lines would be made up.
            </P>
          </Section>

          <Section id="tax-bill" title="What it means for a tax bill">
            <Table
              caption="Dollars per $1,000 of assessed value. The 2026 and Tentative rates are the Tentative Summary’s. The amended rates are this site’s estimate: each fund’s Tentative rate scaled by its change in levy, since the amendments change no assessment. The Town sets the final rates on the final roll."
              head={['Fund', '2026', '2027 Tentative', 'With the six, estimated']}
              rows={[
                ...tw.rates.map((r) => [r.name, r.prior === null ? '—' : r.prior.toFixed(3), r.before === null ? '—' : r.before.toFixed(3), r.after === null ? '—' : r.after.toFixed(3)]),
                ['Total town-wide', tw.ratePrior.toFixed(3), tw.rateBefore.toFixed(3), tw.rateAfter === null ? '—' : tw.rateAfter.toFixed(3)],
              ]}
            />
            {exampleHome && (
              <P>
                The Supervisor’s letter gives the cost of the General Fund’s increase for “property valued at {usd(exampleHome.marketValue)}”. At the{' '}
                {exampleHome.ratioYear}–{String(exampleHome.ratioYear + 1).slice(2)} residential assessment ratio of {exampleHome.ratio}%, that home is
                assessed at about {usd(exampleHome.assessed)}. Before any exemption, its town-wide tax would be about{' '}
                {usd(exampleHome.before)} under the Tentative and {usd(exampleHome.after)} with the six, about {usd(exampleHome.before - exampleHome.after)}{' '}
                a year less. In 2026 the same assessment paid {usd(exampleHome.prior)}. To use your own assessed value, try the{' '}
                <a href={`${base}/tax-bill/`} style={link}>tax bill estimator</a>.
              </P>
            )}
            {exampleHome && (
              <P>
                {NEWSDAY_ARTICLE.outlet} reports the Financial Administrator’s own figures for the same home: “{NEWSDAY_ARTICLE.reported.example}”, and
                “{NEWSDAY_ARTICLE.reported.exampleBefore}” Against 2026, this site’s estimate is about {usd(exampleHome.after - exampleHome.prior)} with
                the six and {usd(exampleHome.before - exampleHome.prior)} under the Tentative. The small difference likely comes from rounding or the
                assessment ratio used; hers are the Town’s figures.
              </P>
            )}
            {(() => {
              // Redfin's September 2026 median sale price; compare it with the Supervisor's $800,000 example.
              const medianSalePrice = 600_714
              const values = [500_000, medianSalePrice, exampleHome?.marketValue ?? 800_000]
              const assessedValue = (market: number) => market * taxBill.equalization.residentialAssessmentRatio / 100
              const taxAt = (market: number, rate: number) => assessedValue(market) / 1000 * rate
              const medianGap = ((values[2] / medianSalePrice) - 1) * 100
              return (
                <>
                  <H3>Put the $800,000 example beside Riverhead’s median sale</H3>
                  <P>
                    Redfin reports a median sale price of {usd(medianSalePrice)} for Riverhead in September 2026, based on the three months ending that month.
                    The Supervisor’s {usd(values[2])} example is about {medianGap.toFixed(1)}% above that benchmark. This comparison applies the same
                    {taxBill.equalization.residentialAssessmentRatio}% residential assessment ratio and the town-wide rates above to each illustrative value.
                  </P>
                  <Table
                    caption={`Estimated town-wide tax only, before exemptions, using the ${taxBill.equalization.asOfYear}–${String(taxBill.equalization.asOfYear + 1).slice(2)} residential assessment ratio. The median is Redfin’s September 2026 median sale price, not a median listing price or assessed value.`}
                    head={['Illustrative market value', 'Estimated assessed value', '2026', '2027 Tentative', 'With six amendments', 'Tentative increase', 'Amended increase']}
                    rows={values.map((market) => {
                      const prior = taxAt(market, tw.ratePrior)
                      const tentative = taxAt(market, tw.rateBefore)
                      const amended = taxAt(market, tw.rateAfter ?? tw.rateBefore)
                      return [
                        market === medianSalePrice ? `${usd(market)} · median sale` : usd(market),
                        usd(assessedValue(market)), usd(prior), usd(tentative), usd(amended),
                        `+${usd(tentative - prior)}`, `+${usd(amended - prior)}`,
                      ]
                    })}
                  />
                  <P>
                    At the median sale price, the Tentative would add about {usd(taxAt(medianSalePrice, tw.rateBefore) - taxAt(medianSalePrice, tw.ratePrior))}
                    a year in town-wide taxes; with the six amendments, about {usd(taxAt(medianSalePrice, tw.rateAfter ?? tw.rateBefore) - taxAt(medianSalePrice, tw.ratePrior))}.
                    The amendments reduce the estimated increase, but do not eliminate it. These are not complete property-tax bills: school, county and special-district
                    taxes are outside this comparison, and individual assessments and exemptions vary.
                  </P>
                </>
              )
            })()}

          </Section>

          <Section id="status" title="Where this stands">
            <P>
              The Board adopted all six on {PACKET.meeting.date}, as Resolutions {VOTES[0].number} to {VOTES[VOTES.length - 1].number}, with{' '}
              {allNoNays ? 'no votes against any of them' : 'votes against some'}. The Town reposted the meeting’s agenda packet with each result on{' '}
              {ADOPTED_PACKET.postedAt}, and the resolutions it shows match the draft this page was built from, account for account and word for
              word.
            </P>
            <P>
              On {count(VOTES.length - halpinYes.length)} of the six the packet lists the four council members as the ayes and no one as a nay.
              Supervisor Halpin is listed as an aye only on {words(halpinYes.map((v) => `Amendment #${v.n}`))}, the street lighting
              amendment. He voted on the other resolutions before and after them that night. The packet’s vote record has lines only for ayes and
              nays, so it does not show how he was recorded on the other {count(VOTES.length - halpinYes.length)}. {VOTE_ARTICLE.outlet} reports:
              “{VOTE_ARTICLE.reported.abstained} {VOTE_ARTICLE.reported.lighting}” The minutes, which are not out yet, will be the Town’s record.
            </P>
            <P>
              The article gives each side’s reasons. Halpin: “{VOTE_ARTICLE.reported.halpinMotive},” and “{VOTE_ARTICLE.reported.halpinRisk}.” On
              street lighting he said, “{VOTE_ARTICLE.reported.halpinLighting}.” Rothwell, on the interest estimate: “{VOTE_ARTICLE.reported.rothwellInterest}.”
              Councilwoman Merrifield: “{VOTE_ARTICLE.reported.merrifield}.”
            </P>
            <P>
              The six amend the Preliminary Budget. They do not adopt a budget, and the Board can still change it after the public hearing.
              What comes next:
            </P>
            <ul style={{ margin: '0 0 14px', paddingLeft: 22, display: 'grid', gap: 6, maxWidth: '72ch' }}>
              {NEXT_STEPS.map((step) => <Li key={step.date}><strong>{step.date}</strong>: {step.what.charAt(0).toLowerCase() + step.what.slice(1)} ({step.source})</Li>)}
            </ul>
            <P>
              {VOTE_ARTICLE.outlet} writes “{VOTE_ARTICLE.reported.hearing}” The Town’s published notice, adopted with Resolution 2026-923, sets
              the hearing for November 5 at 2:05 p.m., and the Town’s meeting calendar lists November 5. {NEWSDAY_ARTICLE.outlet} writes
              “{NEWSDAY_ARTICLE.reported.hearing}.” This page follows the Town’s notice.
            </P>
            <P>
              {NEWSDAY_ARTICLE.outlet}’s report adds: “{NEWSDAY_ARTICLE.reported.lessRevenue}” The six lower the town-wide levy by {usd(-tw.change)},
              which matches. Rothwell told it, “{NEWSDAY_ARTICLE.reported.plenty}.” Of last year’s increase he said, “{NEWSDAY_ARTICLE.reported.lastYear}.”
            </P>
            <P>
              It also reports: “{NEWSDAY_ARTICLE.reported.claim2022}” The <a href={BUDGET_2022.url} style={link}>2022 Adopted Budget</a> bears out
              the first part: the town-wide levy fell from {usd(BUDGET_2022.townWideLevy2021)} to {usd(BUDGET_2022.townWideLevy2022)}, partly because
              some of it was moved to payments in lieu of taxes. It does not show {usd(BUDGET_2022.generalFundDraw2024)} of savings used in the
              town-wide funds: the General, Highway and Street Lighting funds appropriated {usd(BUDGET_2022.townWideFundBalance)}, and the{' '}
              {usd(BUDGET_2022.allFundsFundBalance)} the budget did use was in the Community Preservation, sewer and water funds. The General Fund
              budget that planned a {usd(BUDGET_2022.generalFundDraw2024)} draw was 2024’s. Savings the Board voted to use during 2022, after the
              budget was adopted, would not appear in it.
            </P>
            <P>
              {ARTICLE.outlet} reports that Rothwell said {ARTICLE.reported.developed}. “{ARTICLE.reported.support}” Rothwell is challenging Supervisor
              Halpin in the November 3 election. The article says “{ARTICLE.reported.noResponse}”
            </P>
            <P>
              Rothwell said “{ARTICLE.reported.services}”. The resolutions cut no position or program line. They do take money from Highway
              equipment and the snow budget, as above. For how earlier Boards changed a Supervisor’s budget, especially in election years, see{' '}
              <a href={`${base}/budget-adoption/`} style={link}>how budgets get adopted</a>.
            </P>
          </Section>

          <Section id="race" title="How it bears on the supervisor’s race">
            <P>
              This is a reading of how each side could use the amendments, weighed evenly, as on this site’s{' '}
              <a href={`${base}/candidate-cost-benefit/`} style={link}>candidate cost-benefit</a> page. It is not a prediction, and the site
              supports no candidate. Supervisor Halpin, on the {OUTLOOK.partyLabel.replace(/, not enrolled in a party$/, '')} and not enrolled in a
              party, faces a Board of {count(OUTLOOK.board.length)} Republican council members, one of whom, Rothwell, is running against him.
            </P>
            <H3>For Rothwell, the challenger</H3>
            <ul style={list}>
              <Li>
                <strong>Could help.</strong> It turns his campaign’s stated top issue, lowering the cost of taxes, into six resolutions the Board
                adopted two weeks before the election, each with all four council members voting yes. It sets a{' '}
                {tw.pctAfter.toFixed(2)}% increase beside the incumbent’s {tw.pctBefore.toFixed(2)}%, and by his account “{ARTICLE.reported.services}”.
              </Li>
              <Li>
                <strong>Could hurt.</strong> {usd(cutFromEstimates)} of the {usd(-tw.change)} cut rests on higher revenue estimates and{' '}
                {usd(fx.deferred.total)} on buying equipment from savings later, which critics can call a change of financing rather than a saving:
                the article itself says so of the equipment.{lastYear?.override && lastYear.adoption.date && <> He voted for the 2026 budget, which raised
                the town-wide levy {tw.priorYearPct.toFixed(2)}% with a tax-cap override (each {lastYear.adoption.vote}, {longDate(lastYear.adoption.date)}),
                and now says “{ARTICLE.reported.lastYear}”.</>} If he wins, he would be Supervisor in 2027, the year the new estimates are tested.
              </Li>
            </ul>
            <H3>For Halpin, the incumbent</H3>
            <ul style={list}>
              <Li>
                <strong>Could help.</strong> The amendments start from his Tentative{streak && <>, which the Riverhead News-Review reported{' '}
                “{streak}”</>}, and change its levy by about{' '}
                {((-tw.change / tw.before) * 100).toFixed(0)}%. No one voted against them, and he voted for {words(halpinYes.map((v) => `Amendment #${v.n}`))}.
                He made the case for caution at the meeting, as reported: “{VOTE_ARTICLE.reported.halpinRisk}.” There is a basis for it: estimates closer to collections leave less room for error, and the deferred purchases still
                have to be paid for in 2027.
              </Li>
              <Li>
                <strong>Could hurt.</strong> A council majority amending his budget in an election season casts his proposal as higher than it needed
                to be, and {VOTE_ARTICLE.outlet} reports that he abstained on {count(VOTES.length - halpinYes.length)} of the six. He called the
                amendments politically motivated, but opponents could describe the abstentions as declining to back a lower levy.
              </Li>
            </ul>
            <H3>Does the staff’s party matter?</H3>
            <P>
              The Supervisor picks his own office staff, and the Board acknowledges them by resolution; it appoints other staff itself, down to an
              accountant (Resolution {STAFF_APPOINTMENT.number}, {STAFF_APPOINTMENT.date}). Halpin kept the senior staff of the office he took over:
              the deputy supervisor and the chief of staff, whom {SUPERVISOR_STAFF.report.outlet} titles chief of staff and budget officer. He added a
              legislative aide. He said his style is “{SUPERVISOR_STAFF.report.quote},” {SUPERVISOR_STAFF.report.outlet} reported the day before he
              took office. The Board acknowledged all three unanimously on{' '}
              {SUPERVISOR_STAFF.date} (Resolutions {SUPERVISOR_STAFF.resolutions[0].number} to {SUPERVISOR_STAFF.resolutions[SUPERVISOR_STAFF.resolutions.length - 1].number}).
            </P>
            <P>
              The site’s editor reports that the staff of the Supervisor’s office are {SUPERVISOR_STAFF.editorReportsParty}, the party of the council
              majority and of Rothwell. This site has not checked that against the Board of Elections’ enrollment records. Separately, the financial
              administrator discussed the Tentative’s figures when it was presented on September 24, as the Riverhead News-Review reported, and by
              Rothwell’s account helped shape the amendments, so the Town’s finance staff have advised both sides.
            </P>
            <P>Whether it matters shows less in the numbers than in how the advice is received. Weighed evenly:</P>
            <ul style={list}>
              <Li>
                <strong>For Halpin,</strong> keeping his predecessor’s team bought experience and continuity in his first year, and fits his standing
                outside either party. But a Supervisor whose senior aides share his opponent’s party can be second-guessed, fairly or not, when the
                council majority rewrites his budget in an election season, starting from the Tentative his own office prepared.
              </Li>
              <Li>
                <strong>For Rothwell,</strong> amendments built with the Town’s finance staff carry more weight than a campaign’s own figures. But
                critics can ask whether Town staff should be helping a candidate reshape his opponent’s budget weeks before the election, even
                though amending the budget is ordinary Board business.
              </Li>
            </ul>
            <P>
              Party is still not a test of the numbers: it says nothing about whether {usd(gfInterest?.after ?? 0)} of interest or{' '}
              {usd(fees?.after ?? 0)} of building fees is a sound estimate. Rothwell says the financial administrator was comfortable with the
              amendments and the revenue assumptions behind them, and Town accounting staff prepared the fiscal impact statements on{' '}
              {PACKET.statementsDated}. The Town has published no written forecast behind the new estimates. The surest way to take party out of
              it is to publish the assumptions, such as the interest rate and cash balance behind the interest estimate and the Building
              Department’s fee forecast, so residents can weigh the numbers rather than who supplied them.
            </P>
          </Section>

          <Section id="questions" title="Questions residents may want to ask">
            <ul style={{ margin: 0, paddingLeft: 22, display: 'grid', gap: 8, maxWidth: '72ch' }}>
              {gfInterest && <Li>What interest rate and cash balance does the {usd(gfInterest.after ?? 0)} General Fund interest estimate assume?</Li>}
              {fees && <Li>Building inspection fees came to {usd(fees.firstHalf2026 ?? 0)} in the first half of 2026. What does the Building Department expect for 2027?</Li>}
              <Li>Which purchases would come back as separate resolutions using savings, when, and for how much? Will the Board list them with the adopted budget?</Li>
              <Li>What change in CSEA dental plans is the {usd(dentalTotal)} for, and what happens to the money if the change does not happen?</Li>
              <Li>How would the Highway Department cover the {usd(dentalHighway.amount)} taken from its equipment budget and the {usd(snowLine.cut)} taken from snow removal?</Li>
              <Li>The Preliminary Budget is due out on {NEXT_STEPS[0].date.replace(/, \d{4}$/, '')}. Will it show each amendment’s effect, and the equipment to be bought later from savings?</Li>
              <Li>Will the Board keep all six when it adopts the budget after the election, and will the Supervisor vote for the adopted budget?</Li>
            </ul>
          </Section>

          <Section id="method" title="How this page was made">
            <P>
              The six resolutions and their fiscal impact statements were read from the text of the October 15 work-session packet, whose pages are marked “{PACKET.status}”, and checked
              against the page images. The votes are from the October 20 packet as the Town reposted it with results, and the check confirms that
              its six resolutions print the same accounts, amounts and reasons. A check runs on every build of this site. It confirms that each resolution balances fund by fund, that every
              account, amount and quotation appears on its packet page, and that each Tentative figure is the 2027 Budget Supplement’s.
            </P>
            <P>
              The totals, rates and tax example are this site’s arithmetic. {ARTICLE.outlet}’s article is the source for who proposed the
              amendments and why, and its figures agree with the resolutions.
            </P>
          </Section>

          <Section id="sources" title="Sources">
            <ul style={{ margin: 0, paddingLeft: 22, display: 'grid', gap: 6, maxWidth: '72ch', fontSize: 15.5, lineHeight: 1.5 }}>
              <li>
                <a href={PACKET.url} style={link}>Town of Riverhead, {PACKET.title}</a> (CivicClerk): the draft agenda for {PACKET.meeting.date}{' '}
                (pp. {PACKET.agendaPages.join('–')}) and the six resolutions with their fiscal impact statements (pp. {AMENDMENTS[0].page}–598)
              </li>
              <li>
                <a href={ADOPTED_PACKET.url} style={link}>Town of Riverhead, {ADOPTED_PACKET.title}</a> (CivicClerk): the six resolutions as adopted,
                with their votes (pp. {VOTES[0].votePage}–{VOTES[VOTES.length - 1].votePage})
              </li>
              <li>Town Board Resolution 2026-923 ({'October 6, 2026'}) and its public notice of the November 5 budget hearing, in this site’s <a href={`${base}/meetings/?meeting=2026-10-06`} style={link}>Town Board votes</a></li>
              <li><a href={VOTE_ARTICLE.url} style={link}>{VOTE_ARTICLE.outlet} ({VOTE_ARTICLE.author}), {VOTE_ARTICLE.published}: “{VOTE_ARTICLE.title}”</a></li>
              <li><a href={ARTICLE.url} style={link}>{ARTICLE.outlet}, {ARTICLE.published}: “{ARTICLE.title}”</a></li>
              <li>{NEWSDAY_ARTICLE.outlet} ({NEWSDAY_ARTICLE.author}), {NEWSDAY_ARTICLE.published}: “{NEWSDAY_ARTICLE.title}”</li>
              <li><a href={BUDGET_2022.url} style={link}>Town of Riverhead, 2022 Adopted Budget</a>: the Summary and Fund Balances, pp. 3–4</li>
              <li><a href={SUPERVISOR_STAFF.report.url} style={link}>{SUPERVISOR_STAFF.report.outlet}, {SUPERVISOR_STAFF.report.published}: “{SUPERVISOR_STAFF.report.title}”</a></li>
              <li>
                Town Board resolutions {SUPERVISOR_STAFF.resolutions.map((r) => r.number).join(', ')} ({SUPERVISOR_STAFF.date}) and{' '}
                {STAFF_APPOINTMENT.number} ({STAFF_APPOINTMENT.date}), in this site’s <a href={`${base}/meetings/?meeting=${SUPERVISOR_STAFF.meeting}`} style={link}>Town Board votes</a>
              </li>
              <li><a href={fx.summary.url} style={link}>Town of Riverhead, {fx.summary.title}</a>: the Summary, p. 8, and the Supervisor’s letter, {LETTER_2027.source.pages}</li>
              <li><a href={fx.source.url} style={link}>Town of Riverhead, {fx.source.title}</a>, and the Budget Supplements for 2025 and 2026, for each year’s collections</li>
              <li>{taxBill.equalization.source.replace(/\. Its residential.*$/, '')}: the residential assessment ratio</li>
              <li><a href="https://www.redfin.com/city/25331/NY/Riverhead/housing-market" style={link}>Redfin, Riverhead housing market</a>: September 2026 median sale price ($600,714; three-month period ending September 2026)</li>
              <li><a href={AUDIT_2025.source.url} style={link}>{AUDIT_2025.source.title}</a></li>
              <li>
                This site’s <a href={`${base}/tentative-2027/`} style={link}>2027 Tentative</a>,{' '}
                <a href={`${base}/funds/#savings`} style={link}>Funds Explorer</a> and{' '}
                <a href={`${base}/budget-adoption/`} style={link}>How Budgets Get Adopted</a> pages
              </li>
            </ul>
          </Section>
        </article>
      </div>
    </PageShell>
  )

  function supplementPages(a: Amendment) {
    const ps = Array.from(new Set(a.lines.map((l) => account(l.account)?.page).filter((p): p is number => typeof p === 'number'))).sort((x, y) => x - y)
    return ps.length ? `${ps.length > 1 ? 'pp.' : 'p.'} ${ps.join(', ')}` : 'not found'
  }

  function snowLineOf() {
    const l = AMENDMENTS.find((a) => a.n === 4)!.lines.find((x) => x.account === 'DA1-5-5142-400-000-00000')!
    return { cut: l.amount }
  }

  function amendmentNote(n: number): ReactNode {
    if (n === 1) {
      const [bg, fire, refuse] = ['A01-1-1625-240-000-00000', 'A01-3-3410-240-000-00000', 'A01-8-8160-280-000-00000'].map(account)
      return <>It would leave {usd(bg?.after ?? 0)} for buildings and grounds equipment and {usd(fire?.after ?? 0)} for fire marshal equipment. Refuse vehicles, a line new in 2027, would get {refuse?.after ? usd(refuse.after) : 'nothing'}.</>
    }
    if (n === 3) return <>The three estimates rise by {usd(sum(AMENDMENTS[2].lines.filter((l) => l.side === 'from').map((l) => l.amount)))} in all (see <a href="#revenue" style={link}>the higher revenue estimates</a>).</>
    if (n === 4 && snow) {
      const s = snowSupplement()
      return s ? <>The Tentative had raised the snow budget to {usd(s.tentative)}, from {usd(s.adopted)} in 2026; this takes {usd(-snow.change)} of it.</> : null
    }
    if (n === 5) {
      const eq = account('SL1-5-5182-240-000-00000')
      return <>Street lighting equipment would get {eq?.after ? usd(eq.after) : 'nothing'}; the Tentative proposed {usd(eq?.before ?? 0)}.</>
    }
    if (n === 6) {
      return <>The {usd(dentalTotal)} goes to health insurance lines in {count(dentalFunds.length)} funds, paid for by {usd(dentalFeeLine.amount)} more in expected building inspection fees, {usd(dentalInterest)} more in expected interest in {count(dentalDistricts)} districts and {usd(dentalHighway.amount)} less for Highway equipment.</>
    }
    return null
  }

  function snowSupplement() {
    const a = account('DA1-5-5142-400-000-00000')
    return a && a.before !== null && a.adopted !== null ? { tentative: a.before, adopted: a.adopted } : null
  }
}

const link: CSSProperties = { color: 'var(--rbl-link)', fontWeight: 600 }
const list: CSSProperties = { margin: '0 0 14px', paddingLeft: 22, display: 'grid', gap: 8, maxWidth: '72ch' }
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
/** "2025-11-18" as "November 18, 2025". */
const longDate = (iso: string) => { const [y, m, d] = iso.split('-').map(Number); return `${MONTHS[m - 1]} ${d}, ${y}` }

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

function Table({ caption, head, rows }: { caption: string; head: string[]; rows: string[][] }) {
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
              {r.map((c, i) => <td key={i} data-label={head[i]} style={{ padding: '9px 14px', textAlign: 'left', verticalAlign: 'top', lineHeight: 1.5, color: 'var(--rbl-text-strong)', fontWeight: i === 0 ? 600 : 400 }}>{c}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  )
}
