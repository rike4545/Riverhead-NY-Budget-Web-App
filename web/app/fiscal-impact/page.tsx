import PageShell from '../../components/PageShell'
import PlainCallout from '../../components/PlainCallout'
import FiscalImpactTable, { type FiscalResolution } from '../../components/FiscalImpactTable'
import fiscal from '../../public/data/meetings/2026-07-07-fiscal.json'

const base = '/Riverhead-NY-Budget-Web-App'
const card = { background: 'white', border: '1px solid #e2e8f0', borderRadius: 16, padding: 20, boxShadow: '0 14px 34px rgba(15,23,42,.05)' } as const
const usd = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

export const metadata = {
  title: 'Fiscal Impact, corrected — Town Board resolutions',
  description:
    "Riverhead attaches a 'Fiscal Impact Statement' to every resolution. Many are marked 'no fiscal impact' or 'absorbed' on items that plainly move money. This is a resolution-by-resolution corrected read of the July 7, 2026 meeting.",
}

export default function FiscalImpactPage() {
  const s = fiscal.summary
  const resolutions = fiscal.resolutions as FiscalResolution[]
  const corrections = resolutions.filter((r) => r.realistic.flag === 'understated' && r.townFiscalImpact === 'No')
  const lu = s.largestUnderstatedMarkedNo as [number, string, string] | null

  return (
    <PageShell
      title="Fiscal impact, corrected"
      subtitle="Every Riverhead resolution carries a Town “Fiscal Impact Statement.” Often it’s marked “no fiscal impact” or “absorbed by the existing budget” on items that plainly move money. Here is a resolution-by-resolution corrected read of the July 7, 2026 Town Board meeting."
    >
      <PlainCallout
        tips={[
          { label: 'What the form is', text: 'a one-page checklist the Town attaches to each resolution: does it have a fiscal impact (yes/no), can it be “absorbed” by the current budget, and what’s the funding source.' },
          { label: 'Why correct it', text: 'the checkbox answer is frequently “no” or “absorbed” even when the resolution commits real dollars — a new salary, a union settlement, a capital purchase, a fee change.' },
          { label: 'How we read it', text: 'we show the Town’s own answer next to a plain-English realistic read, with the dollar figure transcribed from the resolution when the packet states one.' },
        ]}
      >
        This turns the Town’s own paperwork into something a resident can actually judge: of the{' '}
        <strong>{s.total} resolutions</strong> on July 7, the Town marked <strong>{s.markedNo}</strong> as having
        {' '}<strong>no fiscal impact</strong> — yet at least <strong>{corrections.length}</strong> of those move money.
      </PlainCallout>

      <section style={{ ...card, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 12, marginBottom: 16 }}>
        <Stat label="Resolutions" value={String(s.total)} sub="on the July 7 agenda" />
        <Stat label="Marked “no fiscal impact”" value={String(s.markedNo)} sub={`of ${s.total}`} />
        <Stat label="…that actually move money" value={String(corrections.length)} sub="the corrections" accent />
        <Stat label="Identified dollars in play" value={usd(s.identifiedDollarsAtStake)} sub="cost items we could price" />
      </section>

      {lu && (
        <section style={{ ...card, marginBottom: 18, borderLeft: '6px solid #dc2626' }}>
          <h3 style={{ marginTop: 0 }}>The clearest example</h3>
          <p style={{ color: '#334155', fontSize: 15, lineHeight: 1.6, margin: 0 }}>
            Resolution <strong>{lu[1]}</strong> — “{lu[2].replace(/\s+Budget Adjustment.*/, '')}” — closes out a water
            capital project at a cost of <strong style={{ color: '#b91c1c' }}>{usd(lu[0])}</strong>. Its Fiscal Impact
            Statement is checked <strong>“No.”</strong> A quarter-million-dollar capital action is exactly the kind of
            item a fiscal-impact statement exists to flag. Several others follow the same pattern: two{' '}
            <strong>union stipulations</strong>, a new <strong>full-time court clerk</strong>, recurring{' '}
            <strong>maintenance-mechanic</strong> salaries, and two <strong>fee changes</strong> — all marked
            “no impact.”
          </p>
        </section>
      )}

      <h2 style={{ color: '#12385b' }}>The corrections</h2>
      <section style={{ ...card, marginBottom: 18 }}>
        <p style={{ color: '#64748b', fontSize: 13.5, marginTop: 0 }}>
          Resolutions the Town marked <strong>“no fiscal impact”</strong> that, on a realistic read, commit or change
          real money. Amounts are transcribed from the resolution text; “—” means the packet states the figure only in
          a backup schedule.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
            <thead>
              <tr style={{ textAlign: 'left', color: '#64748b', borderBottom: '2px solid #e2e8f0' }}>
                <th style={th}>Res #</th>
                <th style={th}>What it does</th>
                <th style={{ ...th, textAlign: 'right' }}>Amount</th>
                <th style={th}>Why it has an impact</th>
              </tr>
            </thead>
            <tbody>
              {corrections.map((r) => (
                <tr key={r.number} style={{ borderBottom: '1px solid #f1f5f9', verticalAlign: 'top' }}>
                  <td style={{ ...td, fontWeight: 800, color: '#12385b', whiteSpace: 'nowrap' }}>{r.number}</td>
                  <td style={{ ...td, color: '#334155', lineHeight: 1.4 }}>{r.title}</td>
                  <td style={{ ...td, textAlign: 'right', fontWeight: 800, color: '#b91c1c', whiteSpace: 'nowrap' }}>{r.amount ? usd(r.amount) : '—'}</td>
                  <td style={{ ...td, color: '#64748b', lineHeight: 1.4, maxWidth: 380 }}>{r.note || r.realistic.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <h2 style={{ color: '#12385b' }}>Every resolution, judged</h2>
      <p style={{ color: '#475569', fontSize: 14.5, lineHeight: 1.55, maxWidth: 900 }}>
        All {s.total} July 7 resolutions with the Town’s stated fiscal impact next to a realistic read. Filter to the
        corrections, or to the items that carry a dollar figure. Not every “no impact” is wrong — publishing a legal
        notice, appointing a volunteer to a committee, or releasing a developer’s own escrow genuinely costs the Town
        nothing, and those are labeled <em>No direct cost</em>.
      </p>
      <FiscalImpactTable resolutions={resolutions} />

      <section style={{ ...card, margin: '18px 0', background: '#eef6ff', border: '1px solid #bcd9f5' }}>
        <h3 style={{ marginTop: 0, color: '#12385b' }}>What this means for the 2027 budget</h3>
        <p style={{ color: '#1f3a52', fontSize: 15, lineHeight: 1.6, margin: 0 }}>
          Most one-time items here (a truck, a boat-launch repair, a well closure) hit 2026. The pieces that follow the
          Town into <strong>2027</strong> are the <strong>recurring</strong> ones the form tends to wave through: new
          full-time and part-time hires, the seasonal payroll, and the three <strong>union stipulations</strong> (CSEA,
          PBA, SOA), whose wage terms compound with each future budget. Those recurring commitments — not the one-time
          purchases — are what a resident should track against next year’s tax levy. See how they interact with the{' '}
          <a href={`${base}/buyout/`} style={{ color: '#1f5f8f', fontWeight: 800 }}>2026 retirement buyout</a> and the
          {' '}<a href={`${base}/meetings/`} style={{ color: '#1f5f8f', fontWeight: 800 }}>full voting record</a>.
        </p>
      </section>

      <p style={{ color: '#64748b', fontSize: 13, lineHeight: 1.5 }}>
        Source: {fiscal.source.title}. {fiscal.method} All {s.total} resolutions were adopted 5–0 except the one tabled
        item; see the <a href={`${base}/meetings/`} style={{ color: '#1f5f8f', fontWeight: 700 }}>Town Board Votes</a>{' '}
        record. This is an independent read, not the Town’s official position — verify against the agenda packet.
      </p>
    </PageShell>
  )
}

const th = { padding: '8px 10px' } as const
const td = { padding: '8px 10px' } as const

function Stat({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div style={{ background: accent ? '#fee2e2' : '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 12 }}>
      <div style={{ color: '#64748b', fontSize: 11.5, textTransform: 'uppercase', fontWeight: 900, letterSpacing: 0.4 }}>{label}</div>
      <strong style={{ fontSize: 22, color: accent ? '#991b1b' : '#12385b' }}>{value}</strong>
      {sub && <div style={{ color: '#64748b', fontSize: 12.5, marginTop: 2 }}>{sub}</div>}
    </div>
  )
}
