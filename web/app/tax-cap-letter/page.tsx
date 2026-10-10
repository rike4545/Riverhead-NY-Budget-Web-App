import type { CSSProperties, ReactNode } from 'react'
import PageShell from '../../components/PageShell'
import PlainCallout from '../../components/PlainCallout'
import {
  ARTICLE, SCSA_STATEMENT, PATCH_REPORT, ASKS, HALPIN, SMYTH, OWN_TEST, RESPONSES, OTHER_TOWNS, STATE, LAW,
  TENTATIVE_2027, BENEFIT_LINES_2027, BENEFIT_LINES_PAGE, benefitGrowth2027, REFUSE_2027, COMPLETE_PROPOSAL, QUESTIONS,
} from '../../lib/tax-cap-letter'
import { tentative, adoptedPrior } from '../../lib/tentative-2027'
import { READ_BY_HAND, LETTER_2027 } from '../../lib/tentative-letters'
import { RECORD } from '../../lib/budget-adoption'
import { AUDITED_GENERAL_FUND, AUDITED_OPERATIONS } from '../../lib/audits'
import {
  openingUnassigned, unassignedCeiling, committedThisYear, openingPercentOfAppropriations, ceilingPercentOfAppropriations,
} from '../../lib/reserve-availability'
import { appropriations as gfAppropriations2026, policyMinimumPercent } from '../../lib/reserve-policy'
import { resolution984 } from '../../lib/management-compensation'

export const metadata = {
  title: 'The supervisors’ tax-cap letter, checked',
  description:
    'Suffolk town supervisors, Riverhead’s among them, asked Albany in October 2026 to loosen the property tax cap. What they asked, where their case is strong, what it leaves out, and what Riverhead’s own budgets and audits show.',
}

const base = process.env.NEXT_PUBLIC_BASE_PATH || ''
const usd = (n: number) => `${n < 0 ? '−' : ''}$${Math.round(Math.abs(n)).toLocaleString('en-US')}`
const pct = (n: number, d = 1) => `${n.toFixed(d)}%`

const SECTIONS = [
  ['asked', 'What the supervisors asked'],
  ['strong', 'Where their case is strong'],
  ['missing', 'What the letter leaves out'],
  ['rhetoric', 'Where it reads as rhetoric'],
  ['complete', 'What a complete proposal would show'],
  ['questions', 'Questions residents could ask'],
  ['limits', 'What this page does not say'],
  ['sources', 'Sources'],
] as const

export default function TaxCapLetterPage() {
  const gf = tentative?.funds.A01
  const gfPrior = adoptedPrior?.funds.A01
  const gfLevyChange = gf?.levy != null && gfPrior?.levy != null ? gf.levy - gfPrior.levy : null
  const gfRevenueChange = gf?.revenues != null && gfPrior?.revenues != null ? gf.revenues - gfPrior.revenues : null
  const townWide = tentative?.townWide ?? null
  const townWidePct = townWide ? ((townWide.levy - townWide.priorLevy) / townWide.priorLevy) * 100 : null
  const statedLimit = READ_BY_HAND[2027]?.statedLimitPct ?? null

  const benefits24 = AUDITED_OPERATIONS[2024].employeeBenefits
  const benefits25 = AUDITED_OPERATIONS[2025].employeeBenefits
  const overrides = RECORD.filter((r) => r.override && r.year >= 2023)
  const refuseChange = REFUSE_2027.tentative2027 - REFUSE_2027.adopted2026
  const results = [
    { year: 2024, planned: AUDITED_GENERAL_FUND[2023].assigned.subsequentYearsBudget, actual: AUDITED_OPERATIONS[2024].netChange },
    { year: 2025, planned: AUDITED_GENERAL_FUND[2024].assigned.subsequentYearsBudget, actual: AUDITED_OPERATIONS[2025].netChange },
  ]

  return (
    <PageShell
      title="The supervisors’ tax-cap letter, checked against Riverhead’s record"
      subtitle="On October 5, 2026, Suffolk town supervisors, Riverhead’s among them, asked Albany to rethink the property tax cap. This page sets out what they asked, where their case is strong, what it leaves out, and what Riverhead’s own budgets and audits show."
    >
      <PlainCallout
        tips={[
          { label: 'The real problem', text: `inflation for 2027 is ${pct(STATE.growthFactor.inflationPct, 2)}, but the cap’s growth factor stops at ${STATE.growthFactor.capPct}%, and Riverhead’s pension and health-insurance lines are rising faster than either.` },
          { label: 'What is missing', text: 'the letter, as reported, puts no formula or price on what it wants, and does not weigh the override towns already have, their reserves, or the costs towns set themselves.' },
          { label: 'Riverhead', text: `the Board overrode the cap unanimously for four budgets in a row, and the General Fund ended 2025 with ${usd(openingUnassigned)} of unassigned fund balance. The Supervisor says the 2027 Tentative is within its limit.` },
        ]}
      >
        Six Suffolk supervisors signed a letter asking the State to change how the property tax cap treats costs such as pensions, health insurance and garbage, and to fund the mandates it passes down. Their core complaint holds up in Riverhead’s own numbers. But the letter, as described in public, is a request for a conversation rather than a proposal, and it leaves out what a resident would need to judge it.
      </PlainCallout>

      <div className="tcl-layout">
        <nav aria-label="On this page" className="tcl-contents">
          <div style={{ fontWeight: 700, color: 'var(--rbl-title)', fontSize: 15, marginBottom: 6 }}>On this page</div>
          <ol style={{ margin: 0, paddingLeft: 18, display: 'grid', gap: 4 }}>
            {SECTIONS.map(([id, label]) => <li key={id} style={{ fontSize: 15, lineHeight: 1.4 }}><a href={`#${id}`} style={{ color: 'var(--rbl-link)', textDecoration: 'none' }}>{label}</a></li>)}
          </ol>
        </nav>

        <article className="tcl-article">
          <Section id="asked" title="What the supervisors asked">
            <P>
              At a Suffolk County Supervisors Association press conference at Brookhaven Town Hall on October 5, six of the county’s ten town supervisors signed a letter to Governor Hochul and state lawmakers. Brookhaven’s Supervisor said the other four agree with it. This site has not found the letter itself published, so this page relies on the two public accounts of it.
            </P>
            {ASKS.map((a) => <Quote key={a.text} source={a.source}>{a.text}</Quote>)}
            <P>
              Riverhead’s Supervisor, Jerry Halpin, was there. RiverheadLOCAL reported that he “{HALPIN.summary}” He said: “{HALPIN.quote}”
            </P>
          </Section>

          <Section id="strong" title="Where their case is strong">
            <H3>The cap stops at 2% even when inflation does not</H3>
            <P>
              Under {LAW.gml3c.label}, the levy’s growth factor is the lesser of 2% and inflation. It can never be more than 2%. For 2027 the State Comptroller put inflation at {pct(STATE.growthFactor.inflationPct, 2)}, and the Comptroller’s office says: “{STATE.growthFactor.consecutiveYears}.” In a year like that, a town that holds to the cap is raising less than prices rose.
            </P>
            <H3>Pension and health costs are rising faster</H3>
            <P>
              The State Comptroller, who runs the pension system, raised employers’ rates for the bills towns pay in 2027: “{STATE.pensions2026_27.quote}” The cap only excludes the part of a rate increase above two percentage points. As RiverheadLOCAL summarised the Comptroller’s list: “{STATE.pensionExclusion2027}”
            </P>
            <P>
              Riverhead’s own figures show the pressure. The audited General Fund spent {usd(benefits24)} on employee benefits in 2024 and {usd(benefits25)} in 2025, up {pct(((benefits25 - benefits24) / benefits24) * 100)} in a year. In the 2027 Tentative, the General Fund’s five pension and health-insurance lines grow by {usd(benefitGrowth2027)}
              {gfLevyChange != null && <>. The whole General Fund levy rises {usd(gfLevyChange)}. On their own, those five lines take up about the entire increase</>}.
              {gfRevenueChange != null && <> The levy is not the General Fund’s only source, though: its other revenues rise {usd(gfRevenueChange)} in the Tentative, more than the levy does.</>}
            </P>
            <Table
              caption={`General Fund pension and health-insurance lines, 2026 adopted against the 2027 Tentative (Tentative PDF p. ${BENEFIT_LINES_PAGE})`}
              head={['Line', '2026 adopted', '2027 Tentative', 'Change']}
              rows={[
                ...BENEFIT_LINES_2027.map((l) => [l.label, usd(l.adopted2026), usd(l.tentative2027), usd(l.tentative2027 - l.adopted2026)]),
                ['Total', usd(BENEFIT_LINES_2027.reduce((s, l) => s + l.adopted2026, 0)), usd(BENEFIT_LINES_2027.reduce((s, l) => s + l.tentative2027, 0)), usd(benefitGrowth2027)],
              ]}
              strongLast
            />
            <P>
              Riverhead’s own budget letters have said the same. The 2025 Tentative’s: “{READ_BY_HAND[2025].taxCap}”
            </P>
            <H3>Towns have no capital exclusion</H3>
            <P>
              Islip’s Supervisor pointed to school districts, which can leave the tax needed for eligible capital spending, including school debt, out of the cap. RiverheadLOCAL notes that towns have no comparable exclusion, even for borrowing voters approved.
            </P>
            <H3>Some costs come from Albany</H3>
            <P>
              Brookhaven’s Supervisor gave the State’s cannabis licensing as an example of work the State hands towns with no fee to pay for it. The accounts give no dollar figure for it, or for any other mandate.
            </P>
          </Section>

          <Section id="missing" title="What the letter leaves out">
            <H3>A formula, and any numbers</H3>
            <P>
              Neither account reports a replacement formula, a percentage, which costs should be excluded and by how much, or what any change would add to a tax bill. The SCSA’s own statement asks for “a constructive meeting” to “discuss potential adjustments.” Even the goal is unsettled: RiverheadLOCAL quotes Huntington’s Supervisor hoping the State will “adjust” the 2% cap; the statement printed by Long Island Life &amp; Politics and Patch has him hoping it will “abandon” it.
            </P>
            <H3>The override towns already have</H3>
            <P>
              The cap is not a hard limit. A town board can go above it by first passing a local law with at least 60% of the board’s votes: three of Riverhead’s five. Riverhead’s Board did so for each of the last four budgets, every time unanimously:
            </P>
            <Table
              caption="Riverhead’s tax-cap override local laws (Town Board minutes)"
              head={['Budget', 'Override adopted', 'Resolution', 'Vote']}
              rows={overrides.map((r) => [String(r.year), formatDate(r.override!.date), r.override!.resolution.replace('#', ''), r.override!.vote])}
            />
            <P>
              The override is a recorded vote, and a public one. A looser formula would let levies rise without it. The letter, as reported, does not say why the override is not enough. For a town, the “vote” Senator Palumbo mentions is the Town Board’s: school districts need 60% of voters, towns need 60% of the board.
            </P>
            <H3>Reserves</H3>
            <P>
              Riverhead’s General Fund ended 2025 with {usd(openingUnassigned)} of unassigned fund balance, according to its audit: {pct(openingPercentOfAppropriations)} of the {usd(gfAppropriations2026)} 2026 General Fund budget. After the {usd(committedThisYear)} the Board committed by resolution during 2026, at most {usd(unassignedCeiling)} is left, {pct(ceilingPercentOfAppropriations)}. The Town’s own policy floor is {policyMinimumPercent}%. Reserves are one-time money and cannot pay a cost that recurs every year. But they matter to how urgent the problem is, and the letter, as reported, does not mention them.
            </P>
            <H3>Results, not just budgets</H3>
            <P>
              Riverhead’s budgets have planned to dip into savings, and the audits show the opposite:
            </P>
            <Table
              caption="General Fund: savings the budget planned to use, and what happened (audited statements)"
              head={['Year', 'Budget planned to use', 'Fund balance actually changed by']}
              rows={results.map((r) => [String(r.year), usd(r.planned), `${r.actual >= 0 ? '+' : ''}${usd(r.actual)}`])}
            />
            <H3>The costs a town sets itself</H3>
            <P>
              The State sets health premiums, but each town decides how much of them its employees pay. On {formatDate(resolution984.adopted)}, Riverhead’s Board voted 5–0 (Resolution {resolution984.number}) to make the premiums fully employer-paid for four management titles that had paid 25% of them, a change the resolution says was suggested “in lieu of merit increases.” Salaries, staffing and contracts are local decisions too. Even on pensions, the Comptroller lists “{STATE.pensions2027_28.drivers}” among what drives the rates.
            </P>
            <P>
              Riverhead’s 2027 Tentative shows costs can be managed locally. The Supervisor’s letter: “{LETTER_2027.retirementIncentive.savingsQuote}”
            </P>
            <H3>The pension picture is mixed</H3>
            <P>
              For the bills towns will pay in 2028, the Comptroller lowered the civilian rate from {pct(STATE.pensions2027_28.ers.from)} to {pct(STATE.pensions2027_28.ers.to)} of payroll, while the police and fire rate rises from {pct(STATE.pensions2027_28.pfrs.from)} to {pct(STATE.pensions2027_28.pfrs.to)}. The supervisors cited the previous year’s increases.
            </P>
            <H3>Garbage, in Riverhead</H3>
            <P>
              Riverhead pays for garbage collection through its Refuse and Garbage District, and the 2027 Tentative raises all of that district’s revenue from property taxes: {usd(REFUSE_2027.adopted2026)} in 2026, {usd(REFUSE_2027.tentative2027)} proposed for 2027, up {usd(refuseChange)} ({pct((refuseChange / REFUSE_2027.adopted2026) * 100)}). Disposal costs may well rise when the Brookhaven ashfill closes, but that is not in Riverhead’s 2027 budget.
            </P>
          </Section>

          <Section id="rhetoric" title="Where it reads as rhetoric">
            <P>
              Some of what was said does not match the record. These are likely concerns for residents, not findings about anyone’s motives.
            </P>
            <Table
              caption="What was said, and what the record shows"
              head={['What was said', 'What the record shows']}
              rows={[
                [`“${SMYTH.impossible}” (Huntington’s Supervisor)`, `That is Huntington’s claim. Riverhead’s Supervisor says its 2027 Tentative is within the cap: “${READ_BY_HAND[2027].taxCap}”`],
                ['“the arbitrary 2% tax cap”', `The 2% is one factor in a formula. A town’s limit can differ from it, because the formula also adjusts for growth in the tax base and other items. Riverhead’s limit for 2027 is ${statedLimit ?? '—'}%, according to the Supervisor’s letter.${townWidePct != null ? ` The Tentative’s town-wide levy rises ${pct(townWidePct, 2)}.` : ''}`],
                ['“costs we do not control” (Islip’s Supervisor)', `Some are local choices. In December 2025 Riverhead made health premiums fully employer-paid for four management titles, and the Supervisor’s letter says the 2027 retirement incentive saves the General Fund ${usd(LETTER_2027.retirementIncentive.savings)}.`],
                ['The supervisors’ own test', `Their statement says residents should know “which expenses were locally discretionary, which were externally imposed.” Neither account shows the letter doing that for any town.`],
              ]}
            />
            <P>
              The timing also matters. The appeal was made as towns prepare their 2027 budgets, which Riverhead must adopt by November 20 (<a href={LAW.townLaw109.url} style={link}>{LAW.townLaw109.label}</a>). The Legislature assembles each January (<a href={LAW.constitution.url} style={link}>{LAW.constitution.label}</a>), so in the normal course no change could reach a 2027 tax bill. Whatever comes of the letter, this year’s budget rests on choices the Board makes now.
            </P>
          </Section>

          <Section id="complete" title="What a complete proposal would show">
            <dl style={{ margin: '0 0 8px', display: 'grid', gap: 12, maxWidth: '72ch' }}>
              {COMPLETE_PROPOSAL.map((c) => (
                <div key={c.item}>
                  <dt style={{ fontWeight: 700, color: 'var(--rbl-title)', fontSize: 17 }}>{c.item}</dt>
                  <dd style={{ margin: '2px 0 0', color: 'var(--rbl-text-body)', fontSize: 16.5, lineHeight: 1.6 }}>{c.text.charAt(0).toUpperCase() + c.text.slice(1)}</dd>
                </div>
              ))}
            </dl>
            <P>What state officials said back, as RiverheadLOCAL reported it:</P>
            {RESPONSES.map((r) => <Quote key={r.who} source={ARTICLE} who={r.who}>{r.text}</Quote>)}
          </Section>

          <Section id="questions" title="Questions residents could ask">
            <ol style={{ margin: 0, paddingLeft: 22, display: 'grid', gap: 8, maxWidth: '72ch' }}>
              {QUESTIONS.map((q) => <li key={q} style={{ fontSize: 16.5, lineHeight: 1.6, color: 'var(--rbl-text-body)' }}>{q}</li>)}
            </ol>
            <P>
              The Board’s next meeting and its public comment rules are on the <a href={`${base}/meetings/`} style={link}>Board Votes</a> and <a href={`${base}/open-meetings/`} style={link}>Open Meetings Law</a> pages. How the cap is calculated, and Riverhead’s full record against it, is on <a href={`${base}/tax-cap/`} style={link}>The tax cap</a>.
            </P>
          </Section>

          <Section id="limits" title="What this page does not say">
            <P>
              This is an independent reading of public records, not a legal or audit finding. The letter itself has not been published; its asks are quoted from the two accounts linked below, and the quotes are as those outlets reported them. The other towns’ figures are the supervisors’ own and are not checked here:
            </P>
            <ul style={{ margin: '0 0 12px', paddingLeft: 22, display: 'grid', gap: 6, maxWidth: '72ch' }}>
              {OTHER_TOWNS.map((t) => <li key={t} style={{ fontSize: 16, lineHeight: 1.55, color: 'var(--rbl-text-body)' }}>{t}</li>)}
            </ul>
            <P>
              Riverhead’s {statedLimit ?? '—'}% limit is the Supervisor’s figure; the calculation behind it is in the Town’s filing with the State Comptroller, which the budget does not print.
            </P>
          </Section>

          <Section id="sources" title="Sources">
            <ul style={{ margin: 0, paddingLeft: 22, display: 'grid', gap: 6, maxWidth: '72ch', fontSize: 15.5, lineHeight: 1.5 }}>
              <li><a href={ARTICLE.url} style={link}>{ARTICLE.outlet}, {ARTICLE.date}: “{ARTICLE.title}”</a>, by {ARTICLE.author}</li>
              <li><a href={SCSA_STATEMENT.url} style={link}>{SCSA_STATEMENT.outlet}: “{SCSA_STATEMENT.title}”</a>, printing the SCSA statement</li>
              <li><a href={PATCH_REPORT.url} style={link}>{PATCH_REPORT.outlet}: “{PATCH_REPORT.title}”</a></li>
              <li><a href={STATE.growthFactor.url} style={link}>State Comptroller, {STATE.growthFactor.date}: the 2027 levy growth factor</a></li>
              <li><a href={STATE.pensions2026_27.url} style={link}>State Comptroller, {STATE.pensions2026_27.date}: pension rates for 2026–27</a></li>
              <li><a href={STATE.pensions2027_28.url} style={link}>State Comptroller, {STATE.pensions2027_28.date}: pension rates for 2027–28</a></li>
              <li><a href={LAW.gml3c.url} style={link}>{LAW.gml3c.label}</a>, the tax cap</li>
              <li><a href={TENTATIVE_2027.url} style={link}>Town of Riverhead, {TENTATIVE_2027.title}</a>: the Supervisor’s letter (pp. 2–3), the Summary, PDF p. {BENEFIT_LINES_PAGE} (benefits) and p. {REFUSE_2027.page} (refuse district)</li>
              <li>Riverhead’s audits, override laws and Resolution {resolution984.number}: see <a href={`${base}/reserves/`} style={link}>Reserves</a>, <a href={`${base}/budget-adoption/`} style={link}>How Budgets Get Adopted</a> and <a href={`${base}/management-compensation/`} style={link}>Management Pay</a></li>
            </ul>
          </Section>
        </article>
      </div>
    </PageShell>
  )
}

const link: CSSProperties = { color: 'var(--rbl-link)', fontWeight: 600 }

function formatDate(iso: string) {
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
}

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
  return <p style={{ fontSize: 17, lineHeight: 1.65, color: 'var(--rbl-text-strong)', margin: '0 0 14px' }}>{children}</p>
}

function Quote({ children, source, who }: { children: ReactNode; source: { outlet: string; url: string }; who?: string }) {
  return (
    <figure style={{ margin: '0 0 16px', maxWidth: '72ch' }}>
      <blockquote style={{ margin: 0, padding: '2px 0 2px 16px', borderLeft: '3px solid var(--rbl-border-strong)', color: 'var(--rbl-text)', fontSize: 17, lineHeight: 1.6 }}>“{children}”</blockquote>
      <figcaption style={{ marginTop: 6, paddingLeft: 19, color: 'var(--rbl-text-muted)', fontSize: 14.5 }}>
        {who ? `${who}, in ` : ''}<a href={source.url} style={{ color: 'var(--rbl-link)' }}>{source.outlet}</a>
      </figcaption>
    </figure>
  )
}

function Table({ caption, head, rows, strongLast = false }: { caption: string; head: string[]; rows: string[][]; strongLast?: boolean }) {
  return (
    <figure className="tcl-table" style={{ margin: '6px 0 18px', background: 'var(--rbl-surface)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 12, overflowX: 'auto' }}>
      <figcaption style={{ padding: '12px 14px 4px', color: 'var(--rbl-text-muted)', fontSize: 14.5, lineHeight: 1.45 }}>{caption}</figcaption>
      <table className="rbl-stack" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 15.5 }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--rbl-border)' }}>
            {head.map((h, i) => <th key={h} scope="col" style={{ textAlign: i === 0 ? 'left' : head.length > 2 ? 'right' : 'left', padding: '8px 14px', color: 'var(--rbl-text-muted)', fontWeight: 600, fontSize: 14, whiteSpace: i === 0 ? undefined : 'nowrap' }}>{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, ri) => (
            <tr key={ri} style={{ borderTop: ri ? '1px solid var(--rbl-border-subtle)' : undefined, fontWeight: strongLast && ri === rows.length - 1 ? 700 : 400 }}>
              {r.map((c, i) => <td key={i} data-label={head[i]} style={{ padding: '9px 14px', textAlign: i === 0 ? 'left' : head.length > 2 ? 'right' : 'left', verticalAlign: 'top', lineHeight: 1.5, color: 'var(--rbl-text-strong)' }}>{c}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  )
}
