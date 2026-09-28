import PageShell from '../../components/PageShell'
import PlainCallout from '../../components/PlainCallout'
import SupplementFindings from '../../components/SupplementFindings'
import {
  YEAR, PRIOR, projection, released, tentative, adoptedPrior, fundComparison, headline, spendingSentence,
  stability, unchangedYears, requestHistory, supplement2027, limits,
} from '../../lib/tentative-2027'
import { READ_BY_HAND, LETTER_2027 } from '../../lib/tentative-letters'
import { buyout2026 } from '../../lib/buyout-2026'
import taxBill from '../../public/data/tax-bill.json'

const base = process.env.NEXT_PUBLIC_BASE_PATH || ''
const usd = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
const signed = (n: number) => `${n > 0 ? '+' : n < 0 ? '−' : ''}${usd(Math.abs(n))}`
const pctf = (n: number | null, d = 1) => (n === null ? '—' : `${n > 0 ? '+' : n < 0 ? '−' : ''}${Math.abs(n).toFixed(d)}%`)
const card = { background: 'var(--rbl-surface)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 16, padding: 20, boxShadow: '0 14px 34px var(--rbl-shadow)' } as const
const th = { padding: '8px 10px', textAlign: 'left' as const, color: 'var(--rbl-text-muted)', fontSize: 11.5, textTransform: 'uppercase' as const, fontWeight: 900, letterSpacing: 0.4 }
const td = { padding: '8px 10px', verticalAlign: 'top' as const }
const num = { ...td, textAlign: 'right' as const, whiteSpace: 'nowrap' as const }

export const metadata = {
  title: 'The 2027 Tentative Budget — our projection against the Town’s',
  description:
    'Riverhead’s 2027 Tentative Budget against this site’s independent projection, fund by fund: appropriations, tax levy, fund balance, what departments asked for, and how often a Tentative has changed before adoption.',
}

// Town Law ss.104-109, plus the Town's own notice for the presentation.
const CALENDAR: [string, string, string][] = [
  ['Sept 20', 'Department estimates due to the budget officer', 'Town Law §104'],
  ['Sept 24', 'Town Clerk presents the Tentative at a special meeting — no public comment period', 'Town notice, Sept 2026'],
  ['Sept 30', 'Deadline to file the Tentative with the Town Clerk', 'Town Law §106(2)'],
  ['Oct 5', 'Deadline to present it to the Town Board', 'Town Law §106(3)'],
  ['Nov 3', 'General election', ''],
  ['Nov 5', 'Deadline for the public hearing on the Preliminary budget', 'Town Law §108'],
  ['Nov 20', 'Deadline to adopt; if the Board does not, the Preliminary becomes the budget', 'Town Law §109'],
]

export default function Tentative2027Page() {
  const h = headline()
  const funds = fundComparison()
  return (
    <PageShell
      title={`The ${YEAR} Tentative Budget`}
      subtitle={`This site’s independent ${YEAR} projection against the Town’s own Tentative, fund by fund — and what the record says about whether a Tentative changes before it is adopted.`}
    >
      <PlainCallout
        tips={[
          { label: 'A Tentative is a proposal', text: 'it appropriates nothing. Only the budget the Board adopts by Nov 20 creates the authority to spend (Town Law §109).' },
          { label: 'Who prepares it', text: 'the budget officer — the Supervisor, or someone the Supervisor appoints to serve at the Supervisor’s pleasure (Town Law §103).' },
          { label: 'Where to be heard', text: 'the Sept 24 presentation has no public comment period. The public hearing is on the Preliminary budget, by Nov 5.' },
        ]}
      >
        {released ? (
          <>The Town’s {YEAR} Tentative has been published and is compared below with the projection this site made before it existed.</>
        ) : (
          <>
            The Town Clerk presents the {YEAR} Tentative on <strong>September 24</strong>. This page compares it with the
            projection below automatically once the Town posts the document — the site checks the Town’s Financial Reports
            page for it every 15 minutes from September 24 through October 6 and parses it as soon as it appears. Until then
            it shows the projection, and the record of how far past Tentatives moved.
          </>
        )}
      </PlainCallout>

      {!released && (
        <section style={{ ...card, marginTop: 16, marginBottom: 16, borderLeft: '5px solid var(--rbl-warn)' }}>
          <strong style={{ color: 'var(--rbl-title)' }}>Waiting for the {YEAR} Tentative.</strong>{' '}
          <span style={{ color: 'var(--rbl-text-body)' }}>
            Nothing on this page describes the {YEAR} Tentative until the Town publishes it. The comparison fills in on its
            own once the document is parsed; nothing about it is written in by hand beforehand.
          </span>
        </section>
      )}

      <section style={{ ...card, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 12, marginTop: 16, marginBottom: 16 }}>
        <Stat label={`${PRIOR} adopted, all funds`} value={usd(projection.appropriations2026)} sub={`levy ${usd(projection.levy2026)}`} />
        <Stat label={`${YEAR} projection`} value={usd(projection.appropriations2027)} sub={`${pctf(projection.appropriationsPct)} · levy ${pctf(projection.levyPct)}`} />
        {h ? (
          <Stat label={`${YEAR} Tentative, all funds`} value={usd(h.appropriations)} sub={`${pctf(h.appropriationsPct)} · levy ${pctf(h.levyPct)}`} accent />
        ) : (
          <Stat label={`${YEAR} Tentative`} value="Sept 24" sub="not yet published" muted />
        )}
        {h?.townWide ? (
          <Stat
            label="Town-wide levy"
            value={usd(h.townWide.levy)}
            sub={`${pctf(h.townWide.levyPct, 2)} · tax rate $${h.townWide.rate.toFixed(3)} per $1,000 (${pctf(h.townWide.ratePct, 2)})`}
          />
        ) : (
          <Stat
            label={`Levy against a ${projection.referencePct}% reference`}
            value={h ? signed(h.levyVsReference) : signed(projection.referenceGap)}
            sub={h ? 'Tentative levy, above (+) or below (−)' : 'the projection, above the reference'}
            warn={(h ? h.levyVsReference : projection.referenceGap) > 0}
          />
        )}
        {h && h.statedLimitPct !== null && (
          <Stat
            label="Tax cap limit, per the Supervisor"
            value={`${h.statedLimitPct}%`}
            sub={h.withinStatedLimit
              ? 'no district’s levy rises by more'
              : h.steepestDistrict ? `the ${h.steepestDistrict.name}’s levy rises ${h.steepestDistrict.pct.toFixed(2)}%` : undefined}
            warn={h.withinStatedLimit === false}
          />
        )}
      </section>

      {h && (
        <section style={{ ...card, marginBottom: 16 }}>
          <h3 style={{ marginTop: 0, color: 'var(--rbl-title)' }}>Against the projection</h3>
          <p style={{ color: 'var(--rbl-text-body)', fontSize: 14.5, lineHeight: 1.6, marginTop: 0 }}>
            The Tentative appropriates <strong>{usd(h.appropriations)}</strong>, {signed(h.appropriationsVsProjection)} against
            the projection, and levies <strong>{usd(h.levy)}</strong>, {signed(h.levyVsProjection)} against it.{' '}
            {h.generalFund && h.generalFund.fundBalance !== null && (
              <>
                The General Fund plans to use <strong>{usd(h.generalFund.fundBalance)}</strong> of fund balance
                {h.generalFund.fundBalancePrior !== null && <> against {usd(h.generalFund.fundBalancePrior)} in the {PRIOR} adopted budget</>}.
              </>
            )}
          </p>
          {h.operating && (
            <p data-spending style={{ color: 'var(--rbl-text-body)', fontSize: 14.5, lineHeight: 1.6, marginTop: 0 }}>
              {spendingSentence(h)}
              {h.debtService && h.debtService.appropriations < h.debtService.prior && (
                <> Counting that fund makes a smaller debt payment look like a spending cut, so the first figure is the one
                that says how much more the Town plans to spend.</>
              )}
            </p>
          )}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead><tr style={{ borderBottom: '2px solid var(--rbl-border-subtle)' }}>
                <th style={th}>Fund</th>
                <th style={{ ...th, textAlign: 'right' }}>{PRIOR} adopted</th>
                <th style={{ ...th, textAlign: 'right' }}>Projection</th>
                <th style={{ ...th, textAlign: 'right' }}>Tentative</th>
                <th style={{ ...th, textAlign: 'right' }}>vs projection</th>
                <th style={{ ...th, textAlign: 'right' }}>vs {PRIOR}</th>
              </tr></thead>
              <tbody>
                {funds.map((f) => (
                  <tr key={f.code} style={{ borderBottom: '1px solid var(--rbl-border-subtle)' }}>
                    <td style={td}><strong style={{ color: 'var(--rbl-title)' }}>{f.name}</strong> <span style={{ color: 'var(--rbl-text-muted)' }}>({f.code})</span></td>
                    <td style={num}>{f.adopted2026 === null ? '—' : usd(f.adopted2026)}</td>
                    <td style={num}>{f.projected === null ? '—' : usd(f.projected)}</td>
                    <td style={{ ...num, fontWeight: 800 }}>{usd(f.tentative)}</td>
                    <td style={num}>{f.vsProjection === null ? '—' : `${signed(f.vsProjection)} (${pctf(f.vsProjectionPct)})`}</td>
                    <td style={num}>{f.vsPriorPct === null ? '—' : pctf(f.vsPriorPct)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {h.fundsWithoutLevyColumn.length > 0 && (
            <p style={{ color: 'var(--rbl-text-muted)', fontSize: 12.5, marginBottom: 0 }}>
              {h.fundsWithoutLevyColumn.join(', ')} printed without a levy column and {h.fundsWithoutLevyColumn.length === 1 ? 'is' : 'are'} left out of the levy total rather than guessed.
            </p>
          )}
          <p style={{ color: 'var(--rbl-text-muted)', fontSize: 12.5, marginBottom: 0 }}>
            Source: <a href={h.source.url} style={{ color: 'var(--rbl-accent)' }}>{h.source.title}</a>, Summary page.
          </p>
        </section>
      )}

      {h && <InflationAndReserves h={h} />}

      {h && READ_BY_HAND[YEAR] && <LetterSection h={h} />}

      <section style={{ ...card, marginBottom: 16 }}>
        <h3 style={{ marginTop: 0, color: 'var(--rbl-title)' }}>Will the Tentative change before adoption?</h3>
        <p style={{ color: 'var(--rbl-text-body)', fontSize: 14.5, lineHeight: 1.6, marginTop: 0 }}>
          Rarely, on the record so far. In <strong>{unchangedYears.length} of the {stability.length}</strong> years where the Town
          published both, the adopted budget matched its Tentative at every fund: nothing moved in the Board’s review, and
          nothing moved after the public hearing. So the document presented on Sept 24 has, in practice, been very close to
          the budget the Town ends up with. The full record back to 2005, including the years the Board never voted to adopt,
          is on <a href={`${base}/budget-adoption/`} style={{ color: 'var(--rbl-accent)' }}>How Riverhead adopts its budget</a>.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead><tr style={{ borderBottom: '2px solid var(--rbl-border-subtle)' }}>
              <th style={th}>Budget year</th><th style={{ ...th, textAlign: 'right' }}>Funds changed</th>
              <th style={{ ...th, textAlign: 'right' }}>Appropriations moved</th><th style={{ ...th, textAlign: 'right' }}>Levy moved</th>
            </tr></thead>
            <tbody>
              {stability.map((s) => (
                <tr key={s.year} style={{ borderBottom: '1px solid var(--rbl-border-subtle)' }}>
                  <td style={{ ...td, fontWeight: 700 }}>{s.year}</td>
                  <td style={num}>{s.fundsChanged} of {s.fundsCompared}</td>
                  <td style={num}>{s.appropriationsDelta === 0 ? 'none' : `${signed(s.appropriationsDelta)} (${pctf(s.appropriationsPct, 2)})`}</td>
                  <td style={num}>{s.levyDelta === 0 ? 'none' : signed(s.levyDelta)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section style={{ ...card, marginBottom: 16 }}>
        <h3 style={{ marginTop: 0, color: 'var(--rbl-title)' }}>What departments asked for</h3>
        <p style={{ color: 'var(--rbl-text-body)', fontSize: 14.5, lineHeight: 1.6, marginTop: 0 }}>
          Every department submits an estimate by Sept 20; the budget officer then writes the Tentative. The Budget Supplement
          prints both side by side, and it is the only public record of that step. The net figure hides most of it: a Tentative
          can cut dozens of lines and raise others by nearly the same amount.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead><tr style={{ borderBottom: '2px solid var(--rbl-border-subtle)' }}>
              <th style={th}>Tentative</th><th style={th}>Prepared under</th>
              <th style={{ ...th, textAlign: 'right' }}>Requested</th><th style={{ ...th, textAlign: 'right' }}>Tentative</th>
              <th style={{ ...th, textAlign: 'right' }}>Net</th><th style={{ ...th, textAlign: 'right' }}>Lines cut</th><th style={{ ...th, textAlign: 'right' }}>Lines raised</th>
            </tr></thead>
            <tbody>
              {requestHistory.map((r) => (
                <tr key={r.year} style={{ borderBottom: '1px solid var(--rbl-border-subtle)' }}>
                  <td style={{ ...td, fontWeight: 700 }}>{r.year}</td>
                  <td style={td}>{r.preparedUnder ?? '—'}</td>
                  <td style={num}>{usd(r.request)}</td>
                  <td style={num}>{usd(r.tentative)}</td>
                  <td style={{ ...num, fontWeight: 800 }}>{signed(r.delta)} ({pctf(r.deltaPct, 2)})</td>
                  <td style={num}>{r.cutLines} · {usd(r.cutAmount)}</td>
                  <td style={num}>{r.raisedLines} · {usd(r.raisedAmount)}</td>
                </tr>
              ))}
              {supplement2027.state !== 'complete' && (
                <tr><td style={{ ...td, fontWeight: 700 }}>{YEAR}</td><td style={td}>Supervisor Jerry Halpin</td>
                  <td style={{ ...td, color: 'var(--rbl-text-muted)' }} colSpan={5}>
                    {supplement2027.state === 'absent'
                      ? 'Supplement not yet published.'
                      : `Supplement published but its lines do not add up to the Tentative${'gap' in supplement2027 && supplement2027.gap !== null ? ` (off by ${usd(Math.abs(supplement2027.gap))})` : ''}, so its totals are withheld rather than shown wrong.`}
                  </td></tr>
              )}
            </tbody>
          </table>
        </div>
        {requestHistory.length > 0 && (
          <details style={{ marginTop: 12 }}>
            <summary style={{ cursor: 'pointer', color: 'var(--rbl-accent)', fontWeight: 700 }}>The largest changes to requests, {requestHistory[requestHistory.length - 1].year}</summary>
            <MoveList title="Cut below the request" rows={requestHistory[requestHistory.length - 1].largestCuts} />
            <MoveList title="Raised above the request" rows={requestHistory[requestHistory.length - 1].largestRaises} />
          </details>
        )}
      </section>

      <SupplementFindings />

      <section style={{ ...card, marginBottom: 16 }}>
        <h3 style={{ marginTop: 0, color: 'var(--rbl-title)' }}>The {YEAR} calendar</h3>
        <ul style={{ margin: 0, paddingLeft: 18, color: 'var(--rbl-text-body)', fontSize: 14, lineHeight: 1.7 }}>
          {CALENDAR.map(([d, what, law]) => (
            <li key={d}><strong>{d}</strong> — {what}{law && <span style={{ color: 'var(--rbl-text-muted)' }}> ({law})</span>}</li>
          ))}
        </ul>
        <p style={{ color: 'var(--rbl-text-muted)', fontSize: 13, marginBottom: 0 }}>
          How the projection is built: <a href={`${base}/predict-2027/`} style={{ color: 'var(--rbl-accent)' }}>2027 Prediction</a>.
          Why 2% is only a reference: <a href={`${base}/tax-cap/`} style={{ color: 'var(--rbl-accent)' }}>Tax cap</a>.
          The Supervisor’s own commitments against this budget: <a href={`${base}/supervisor-promises/`} style={{ color: 'var(--rbl-accent)' }}>Promises and the record</a>.
        </p>
      </section>

      <section style={{ ...card, marginBottom: 16 }}>
        <h3 style={{ marginTop: 0, color: 'var(--rbl-title)' }}>What this page cannot tell you</h3>
        <ul style={{ color: 'var(--rbl-text-body)', fontSize: 13.8, lineHeight: 1.6, paddingLeft: 18, margin: 0 }}>
          {limits.map((l, i) => <li key={i} style={{ marginBottom: 6 }}>{l}</li>)}
        </ul>
      </section>
      {tentative && <span data-tentative-released={YEAR} hidden />}
    </PageShell>
  )
}

function Stat({ label, value, sub, accent, warn, muted }: { label: string; value: string; sub?: string; accent?: boolean; warn?: boolean; muted?: boolean }) {
  return (
    <div>
      <div style={{ color: 'var(--rbl-text-muted)', fontSize: 11.5, textTransform: 'uppercase', fontWeight: 900, letterSpacing: 0.4 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 900, lineHeight: 1.2, color: muted ? 'var(--rbl-text-muted)' : warn ? 'var(--rbl-warn-strong)' : accent ? 'var(--rbl-accent)' : 'var(--rbl-title)' }}>{value}</div>
      {sub && <div style={{ color: 'var(--rbl-text-muted)', fontSize: 12, lineHeight: 1.45 }}>{sub}</div>}
    </div>
  )
}

function MoveList({ title, rows }: { title: string; rows: { account: string; name: string; request: number; tentative: number }[] }) {
  if (!rows.length) return null
  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ fontWeight: 800, color: 'var(--rbl-title)', fontSize: 13.5, marginBottom: 4 }}>{title}</div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
        <tbody>
          {rows.map((r) => (
            <tr key={r.account} style={{ borderBottom: '1px solid var(--rbl-border-subtle)' }}>
              <td style={td}>{r.name}<div style={{ color: 'var(--rbl-text-muted)', fontSize: 11 }}>{r.account}</div></td>
              <td style={{ ...num, whiteSpace: 'normal' }}>{usd(r.request)} → {usd(r.tentative)}</td>
              <td style={{ ...num, fontWeight: 800 }}>{signed(r.tentative - r.request)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

type Headline = NonNullable<ReturnType<typeof headline>>

const cents = (n: number) => `$${n.toFixed(2)}`
const pct2 = (n: number | null) => (n === null ? '—' : `${n.toFixed(2)}%`)
const joinNames = (names: string[]) => names.length < 3 ? names.join(' and ') : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`

// The Supervisor's letter, claim by claim, beside what the budget's own Summary
// shows. The letter is a scanned image read by hand (lib/tentative-letters.ts);
// everything on the right-hand side is computed from the parsed Summary, so a
// claim that stops matching says so instead of repeating the letter.
function LetterSection({ h }: { h: Headline }) {
  const letter = READ_BY_HAND[YEAR]
  const L = LETTER_2027
  const gf = tentative?.funds.A01 ?? null
  const gfPrior = adoptedPrior?.funds.A01 ?? null
  const eq = taxBill.equalization
  const assessed = L.generalFund.exampleValue * (eq.residentialAssessmentRatio / 100)
  const perYear = (rise: number) => (assessed * rise) / 1000
  const gfRate = h.townWide?.generalFundRate ?? null
  const flat = h.districts.filter((d) => Math.abs(d.pct) < 0.005)
  const ri = L.retirementIncentive
  const noSupplement = supplement2027.state === 'absent'
  const notInSummary = `The Summary shows funds, not salary lines, so it can’t confirm this${noSupplement ? '. The Budget Supplement, which prints the lines, isn’t posted yet' : ''}.`

  const rows: { says: string; shows: string; href?: { path: string; label: string } }[] = []

  if (letter.taxCap && h.statedLimitPct !== null) {
    rows.push({
      says: letter.taxCap,
      shows: [
        h.withinStatedLimit
          ? `None of the ${h.districts.length} levies in the Summary rises by more than ${h.statedLimitPct}%. The town-wide levy rises ${pct2(h.townWide?.levyPct ?? null)} and the total with the special districts ${pct2(h.levyPct)}${flat.length ? `; the ${joinNames(flat.map((d) => d.name))} levy is unchanged` : ''}.`
          : `The ${h.steepestDistrict?.name}’s levy rises ${h.steepestDistrict?.pct.toFixed(2)}%, more than the ${h.statedLimitPct}% the letter gives.`,
        `How the Town reached ${h.statedLimitPct}% isn’t published. The State’s growth factor for ${YEAR} is ${projection.referencePct}%; the formula also adjusts for tax-base growth, PILOT payments, carryover and exclusions, and the Town files the result with the State Comptroller.`,
        'If the letter’s limit is right, the proposal as written needs no override vote. The Board would need one only to adopt a levy above it.',
      ].join(' '),
      href: { path: '/tax-cap/', label: 'How the tax cap works' },
    })
  }

  if (h.operating) {
    const matches = h.operating.appropriations === L.operating.total && h.operating.delta === L.operating.growth
    rows.push({
      says: L.operating.quote,
      shows: matches
        ? `Matches the Summary to the dollar, a rise of ${h.operating.pct?.toFixed(1)}%. It is every fund except the Debt Service, Workers’ Compensation and Risk Retention funds, which the other funds pay for. Counting those too, the total is ${usd(h.appropriations)}, ${h.appropriationsPct !== null && h.appropriationsPct < 0 ? 'down' : 'up'} ${Math.abs(h.appropriationsPct ?? 0).toFixed(1)}%.`
        : `Counted the same way, the Summary gives ${usd(h.operating.appropriations)}, ${signed(h.operating.delta)} from ${PRIOR}.`,
    })
  }

  if (gf && gfPrior) {
    const added = gf.appropriations - gfPrior.appropriations
    const perDay = gfRate ? perYear(gfRate.rate - gfRate.priorRate) / 365 : null
    const townWidePerDay = h.townWide ? perYear(h.townWide.rate - h.townWide.priorRate) / 365 : null
    rows.push({
      says: L.generalFund.quote,
      shows: [
        `General Fund appropriations rise ${usd(added)} (${pctf((added / gfPrior.appropriations) * 100)}), to ${usd(gf.appropriations)}.`,
        gfRate && perDay !== null && townWidePerDay !== null && h.townWide
          ? `At the ${eq.residentialAssessmentRatio}% residential assessment ratio on the Town’s ${eq.asOfYear}–${String(eq.asOfYear + 1).slice(2)} tax rate sheet, an ${usd(L.generalFund.exampleValue)} home is assessed at about ${usd(assessed)}. The General Fund rate rises $${(gfRate.rate - gfRate.priorRate).toFixed(3)} per $1,000, about ${usd(perYear(gfRate.rate - gfRate.priorRate))} a year or ${cents(perDay)} a day; the whole town-wide rate rises $${(h.townWide.rate - h.townWide.priorRate).toFixed(3)}, about ${usd(perYear(h.townWide.rate - h.townWide.priorRate))} a year or ${cents(townWidePerDay)} a day. The letter doesn’t say what ratio it used.`
          : '',
      ].join(' ').trim(),
    })
  }

  if (gf?.fundBalance != null && gfPrior?.fundBalance != null) {
    const drop = gfPrior.fundBalance - gf.fundBalance
    rows.push({
      says: L.fundBalance.quote,
      shows: `${drop === L.fundBalance.reduction ? 'Matches' : 'The Summary differs'}: the General Fund uses ${usd(gf.fundBalance)} of its savings (fund balance), against ${usd(gfPrior.fundBalance)} for ${PRIOR}.`,
    })
  }

  rows.push({
    says: `${ri.savingsQuote} ${ri.quote} …`,
    shows: `${notInSummary} By the letter’s own figures the saving before retiree health insurance is ${usd(ri.salariesAndPayrollTaxes + ri.retirementContributions)}: ${usd(ri.salariesAndPayrollTaxes)} in salaries and payroll taxes and ${usd(ri.retirementContributions)} in State retirement contributions. The difference, ${usd(ri.retireeHealthOffset)}, is the added retiree health insurance, the figure ${ri.atMeeting.who} gave at the September 24 meeting; she said replacements for the retirees are also budgeted for 2027 (${L.meetingReport.title.split(':')[0]}). The ${ri.csea + ri.pba + ri.soa} who took it were among ${buyout2026.actualEligible.total} eligible employees, and the Town’s July estimate of the saving was ${usd(buyout2026.estimatedSavings.low)} to ${usd(buyout2026.estimatedSavings.high)}.`,
    href: { path: '/buyout/', label: 'The retirement incentive' },
  })

  rows.push({
    says: L.staffing.quote,
    shows: `${notInSummary} As the ${L.meetingReport.title.split(':')[0]} reported the meeting, 64 of the 76 merit raises are two extra steps on the salary schedule, on top of contractual raises, and the eight new positions are a maintenance mechanic, two buildings and grounds staff, an automotive equipment operator, a building inspector, a purchasing clerk, an office assistant and a fire marshal.`,
  })

  return (
    <section data-letter style={{ ...card, marginBottom: 16 }}>
      <h3 style={{ marginTop: 0, color: 'var(--rbl-title)' }}>What the Supervisor’s letter says</h3>
      <p style={{ color: 'var(--rbl-text-body)', fontSize: 14.5, lineHeight: 1.6, marginTop: 0 }}>
        The Tentative opens with a letter from Supervisor {L.signedBy.split(',')[0]}{letter.dated ? <>, dated {letter.dated}</> : null}. Its pages
        are scanned images, so this site read them by hand; the quotes are exact. Each claim is set beside what the budget’s
        own Summary shows.
      </p>
      <blockquote style={{ margin: '0 0 14px', padding: '10px 14px', borderLeft: '4px solid var(--rbl-accent-border)', background: 'var(--rbl-surface-2)', borderRadius: 8, color: 'var(--rbl-text-strong)', fontSize: 14.5, lineHeight: 1.55 }}>
        “{L.goal}”
      </blockquote>
      <div style={{ display: 'grid', gap: 12 }}>
        {rows.map((r, i) => (
          <article key={i} style={{ border: '1px solid var(--rbl-border-subtle)', borderRadius: 12, padding: 12, minWidth: 0 }}>
            <div style={{ color: 'var(--rbl-title)', fontSize: 14, lineHeight: 1.5, fontWeight: 700 }}>“{r.says}”</div>
            <p style={{ color: 'var(--rbl-text-body)', fontSize: 13.8, lineHeight: 1.6, margin: '6px 0 0' }}>
              <span style={{ color: 'var(--rbl-text-muted)', fontWeight: 800 }}>What the budget shows: </span>{r.shows}
              {r.href && <> <a href={`${base}${r.href.path}`} style={{ color: 'var(--rbl-accent)', fontWeight: 700, whiteSpace: 'nowrap' }}>{r.href.label} →</a></>}
            </p>
          </article>
        ))}
      </div>
      <p style={{ color: 'var(--rbl-text-muted)', fontSize: 12.5, marginBottom: 0 }}>
        Source: <a href={L.source.url} style={{ color: 'var(--rbl-accent)' }}>{L.source.title}</a>, {L.source.pages} (the letter) and the Summary page.
      </p>
    </section>
  )
}



// Snapshot verified against BLS releases and the Town's 2025 AFR on Sept 28, 2026.
// Keep the observation period explicit: these are not live inflation readings.
function InflationAndReserves({ h }: { h: Headline }) {
  const tw = h.townWide
  const assigned = 1663273.34
  const unassigned = 29671084.17
  const uses = 66007499.29
  const scenarios = tw ? [
    { label: 'Tentative', levy: tw.levy },
    ...[2, 1, 0].map(rate => ({ label: rate + '% increase', levy: Math.round(tw.priorLevy * (1 + rate / 100)) })),
  ] : []
  const body = { color: 'var(--rbl-text-body)', fontSize: 14, lineHeight: 1.65 }
  return (
    <section id="inflation-and-fund-balance" aria-labelledby="inflation-heading" style={{ ...card, marginBottom: 16 }}>
      <h2 id="inflation-heading" style={{ marginTop: 0, color: 'var(--rbl-title)' }}>Inflation vs. tax levy vs. fund balance</h2>
      <p style={body}>Snapshot checked September 28, 2026. CPI measures changes in consumer prices; the inflation rate is the percentage change in that index. It provides context for household costs, but is not a municipal spending target or the Town’s legal tax-cap calculation.</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 16 }}>
        <Stat label="U.S. inflation" value="3.4%" sub="CPI-U, August 2025–August 2026; not seasonally adjusted" />
        <Stat label="NY metro inflation" value="4.3%" sub="CPI-U, August 2025–August 2026; includes Suffolk County" />
        {tw && <Stat label="Proposed town-wide levy growth" value={pctf(tw.levyPct, 2)} sub="2027 Tentative vs. 2026 adopted; a different period from CPI" />}
      </div>
      <p style={body}>U.S. CPI-U was 334.980 and the regional index was 362.328 (1982–84 = 100). The U.S. monthly increase was 0.4%, seasonally adjusted. Index levels are not inflation percentages or a comparison of living costs between places. Below-inflation levy growth alone does not establish that a budget is prudent: payroll, benefits, debt and service needs must be examined separately.</p>
      <p style={body}>Sources: <a href="https://www.bls.gov/news.release/archives/cpi_09112026.htm">BLS national August release</a> and <a href="https://www.bls.gov/regions/northeast/news-release/2026/consumerpriceindex_newyork_20260911.htm">BLS New York metro August release</a>, both September 11, 2026.</p>

      <h3 style={{ color: 'var(--rbl-title)' }}>What the reserve figures actually measure</h3>
      <p style={body}>At December 31, 2025, the General Fund balance sheet reported about $33.41 million in total fund balance. Assigned balance was {usd(assigned)} and unassigned balance was {usd(unassigned)}. Together, {usd(assigned + unassigned)} equals {((assigned + unassigned) / uses * 100).toFixed(1)}% of 2025 expenditures and other uses ({usd(uses)}). Unassigned alone equals {(unassigned / uses * 100).toFixed(1)}%. This denominator includes transfers; it is not an exact measure of regular operating expenditures.</p>
      <p style={body}>These are historical accounting balances, not a current cash surplus available for 2027. Assigned funds include $1.25 million already appropriated for 2026. The Town must reconcile 2026 results, existing appropriations, commitments and cash-flow needs before identifying any additional amount available.</p>
      {h.generalFund?.fundBalance != null && <p style={body}>The 2027 Tentative already proposes using <strong>{usd(h.generalFund.fundBalance)}</strong> of General Fund balance. Any further draw would be additional to that proposal.</p>}
      <p style={body}>Source: <a href="https://townofriverheadny.gov/DocumentCenter/View/3513/2025-Annual-Financial-Report">2025 Annual Financial Report</a>, printed pages 6–7 (balance sheet) and 22 (expenditures and other uses).</p>
      <p style={body}><a href="https://www.gfoa.org/materials/fund-balance-guidelines-for-the-general-fund">GFOA guidance</a> sets a minimum of two months of regular General Fund operating revenues or expenditures, approximately 16.7%, subject to local risks. It is a floor, not a ceiling or a finding that everything above it is excess. A reserve policy should justify the target, permitted uses and replenishment plan.</p>

      {tw && <>
        <h3 style={{ color: 'var(--rbl-title)' }}>Could the town-wide levy increase be smaller?</h3>
        <p style={body}>Freezing the levy at {usd(tw.priorLevy)} would require <strong>{usd(tw.levy - tw.priorLevy)}</strong> less levy funding than the Tentative. These scenarios hold proposed spending and all other financing constant. The difference must be met with spending reductions, supportable additional revenues, legally available fund balance, or a combination.</p>
        <div role="region" aria-label="Town-wide levy scenarios" tabIndex={0} style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <caption style={{ textAlign: 'left', marginBottom: 8 }}>Illustrative alternatives for General Fund, Highway and Street Lighting combined</caption>
            <thead><tr><th scope="col" style={th}>Scenario</th><th scope="col" style={th}>Town-wide levy</th><th scope="col" style={th}>Funding to replace vs. Tentative</th></tr></thead>
            <tbody>{scenarios.map(s => <tr key={s.label} style={{ borderTop: '1px solid var(--rbl-border-subtle)' }}>
              <th scope="row" style={{ ...td, textAlign: 'left' }}>{s.label}</th><td style={num}>{usd(s.levy)}</td><td style={num}>{signed(tw.levy - s.levy)}</td>
            </tr>)}</tbody>
          </table>
        </div>
        <p style={body}>Positive replacement amounts require other financing or cuts; negative amounts mean the scenario raises more than the Tentative. These are aggregate levy scenarios, not household tax-bill estimates. Special districts are excluded. A freeze does not guarantee every property’s bill stays flat. Each fund needs its own financing analysis; this table does not assume General Fund reserves can pay other funds’ obligations.</p>
        <p style={body}>Budget source: <a href={h.source.url}>{h.source.title}</a>, Summary page. Scenario levies equal the printed prior town-wide levy multiplied by 1 plus the chosen percentage, rounded to whole dollars.</p>
      </>}

      <h3 style={{ color: 'var(--rbl-title)' }}>Which approach is most prudent?</h3>
      <p style={body}><strong>Our assessment:</strong> recurring costs should have sustainable recurring financing. A modest levy increase is more defensible where it closes an ongoing gap. A limited reserve draw is more defensible for one-time costs or a temporary bridge with a credible exit plan. A smaller increase combined with a targeted draw merits evaluation if projected reserves remain above a justified policy target.</p>
      <p style={body}>A zero-increase budget is not automatically irresponsible, and a below-inflation increase is not automatically necessary. Before choosing, publish a fund-by-fund 2026 closing-balance forecast, the recurring operating gap, one-time 2027 costs, and a multiyear forecast under each option, including lower interest earnings after a reserve draw.</p>
      <p style={body}>Policy reference: <a href="https://www.osc.ny.gov/files/local-government/academy/pdf/developing-an-effective-fund-balance-policy-110525.pdf">New York State Comptroller: Developing an Effective Fund Balance Policy</a>. The available figures do not establish an optimal levy increase or a safe additional draw.</p>
    </section>
  )
}
