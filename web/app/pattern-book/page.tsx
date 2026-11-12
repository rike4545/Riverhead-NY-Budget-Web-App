import PageShell from '../../components/PageShell'
import PlainCallout from '../../components/PlainCallout'
import { BOOK, COMPARE, NEWS, QUOTES, TIMELINE, type NewsKey } from '../../lib/pattern-book'

const base = process.env.NEXT_PUBLIC_BASE_PATH || ''
const card = { background: 'var(--rbl-surface)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 16, padding: 20, marginBottom: 16 } as const
const h2 = { margin: '0 0 8px', color: 'var(--rbl-title)', fontSize: 21 } as const
const prose = { margin: '0 0 10px', color: 'var(--rbl-text-body)', fontSize: 16, lineHeight: 1.6, maxWidth: '75ch' } as const
const help = { color: 'var(--rbl-text-muted)', fontSize: 14, lineHeight: 1.5 } as const
const link = { color: 'var(--rbl-link)', fontWeight: 600 } as const
const list = { ...prose, paddingLeft: 20, display: 'grid', gap: 8 } as const
const th = { textAlign: 'left', padding: '8px', borderBottom: '1px solid var(--rbl-border)', color: 'var(--rbl-text-strong)', fontWeight: 700, verticalAlign: 'bottom' } as const
const td = { padding: '8px', borderBottom: '1px solid var(--rbl-border-subtle)', color: 'var(--rbl-text-body)', verticalAlign: 'top' } as const

const News = ({ k }: { k: NewsKey }) => <a href={NEWS[k].url} style={link}>{NEWS[k].title.split(':')[0]}</a>
const Q = ({ k }: { k: keyof typeof QUOTES }) => <>“{QUOTES[k].text}” <span style={help}>(page {QUOTES[k].page})</span></>

export const metadata = {
  title: 'Pattern Book',
  description: 'The 2021 Downtown Riverhead Pattern Book: what it asks for, why it was never written into the zoning code, and why writing it in now may be a hard sell politically.',
}

export default function PatternBookPage() {
  return (
    <PageShell
      title="The downtown Pattern Book"
      subtitle="What the 2021 design guide asks for, why it was never written into the zoning code, and why doing that now may be a hard sell."
    >
      <PlainCallout
        tips={[
          { label: 'Pattern Book', text: 'a design guide for new buildings: how tall, how much of the lot, what they look like from the street.' },
          { label: 'DC-1', text: 'the Main Street zoning district downtown, where the book’s standards would apply.' },
          { label: 'Codify', text: 'write into the zoning code, so a rule binds rather than advises.' },
        ]}
      >
        In January 2021 the Town Board adopted the Pattern Book, a guide written by Urban Design Associates after public surveys and
        forums. Its main ask is shorter buildings on Main Street: four stories instead of five. The Board adopted it as advice, not law.
        Every attempt since to make it law has stalled, even though the Town’s 2024 Comprehensive Plan recommends it. The book’s standards and
        the votes are quoted from the Town’s records; what people said in debate is from news reports, labelled as such.
      </PlainCallout>

      <section style={card} aria-labelledby="asks">
        <h2 id="asks" style={h2}>What the book asks for</h2>
        <div data-scroll-region style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 15, minWidth: 480 }}>
            <thead><tr><th scope="col" style={th}>Rule on Main Street</th><th scope="col" style={th}>Zoning today</th><th scope="col" style={th}>Pattern Book</th></tr></thead>
            <tbody>{COMPARE.map((c) => <tr key={c.rule}><th scope="row" style={{ ...td, fontWeight: 600, textAlign: 'left' }}>{c.rule}</th><td style={td}>{c.now}</td><td style={td}>{c.book}</td></tr>)}</tbody>
          </table>
        </div>
        <p style={{ ...prose, marginTop: 12 }}>
          The book’s trade is height for coverage: <Q k="proposal" /> It says this <Q k="sameFloorArea" /> Its standards table sets
          a height of <Q k="height" /> and a green roof of <Q k="greenRoof" />
        </p>
        <p style={{ ...help, margin: 0 }}>From the <a href={BOOK.url} style={link}>{BOOK.title}</a> ({BOOK.author}, {BOOK.date}), pages 24, 62 and 63.</p>
      </section>

      <section style={card} aria-labelledby="history">
        <h2 id="history" style={h2}>Five years as advice</h2>
        <ol style={list}>
          {TIMELINE.map((e) => (
            <li key={e.when}><strong>{e.when}.</strong> {e.what}{' '}
              <span style={help}>({e.news ? e.news.map((k, i) => <span key={k}>{i ? '; ' : ''}<News k={k} /></span>) : e.source})</span>
            </li>
          ))}
        </ol>
        <p style={{ ...help, margin: 0 }}>
          The 2024 plan’s recommendation is tracked on the <a href={`${base}/comprehensive-plan/`} style={link}>Comprehensive Plan tracker</a>, and
          the hotel on the <a href={`${base}/town-square/`} style={link}>Town Square page</a>.
        </p>
      </section>

      <section style={card} aria-labelledby="hard-sell">
        <h2 id="hard-sell" style={h2}>Why writing it into law may not be politically astute</h2>
        <p style={prose}>
          This is this site’s reading of the record, not a finding and not advice to any official. Whether the book should become law is for
          residents and the Board. Here are the political risks the record points to:
        </p>
        <ol style={list}>
          <li><strong>The votes are not there.</strong> In July 2024 Board members said they wanted to keep five stories and treat the book as a
            guide (<News k="board2024" />). Council Members Rothwell, Kern and Merrifield, who spoke that way then, were still on the Board in 2026. A law that is
            expected to fail costs its sponsor without changing anything.</li>
          <li><strong>It would put the Town’s own projects out of step.</strong> The Board approved the five-story Peconic River Hotel 5–0 in
            August 2026 as the anchor of the Town Square project. A four-story cap written into law
            now would invite the charge that the Town held private builders to a rule its own flagship did not meet. Opponents of the
            Town Square project, which has already brought eminent-domain fights, could cite it.</li>
          <li><strong>Existing buildings would stop conforming.</strong> Council Member Merrifield said codifying it would put existing downtown
            buildings out of compliance (<News k="board2024" />). The book itself says the buildings put up in the five years before it were
            {' '}<Q k="economics" /> An owner of a nonconforming building can find rebuilding or refinancing harder.</li>
          <li><strong>It cuts against the State’s housing push, and the money tied to it.</strong> Riverhead is a certified Pro-Housing
            Community. That status won the Town just over $3.5 million from the State’s Pro-Housing Supply Fund for The Vue, a five-story,
            133-unit building on West Main Street (<News k="vue2025" />). Lowering the height limit downtown reduces how many homes it can
            hold. This site has found no rule that a height cut would cost the certification, but it would sit awkwardly in the next
            application, and the Supervisor has himself spoken of the strain of being asked to be a pro-housing community (<News k="taxcap2026" />).</li>
          <li><strong>The required parts carry costs, and organized opponents.</strong> The 40% green-roof minimum and the design rules drew
            the 2022 objections that stopped the law; two Council Members then preferred incentives to a green-roof mandate (<News k="hearing2022" />).
            The Business Advisory Committee has opposed the code twice. Builders, architects and landowners are a small group, but an
            engaged one.</li>
          <li><strong>The fifth story has a use the book does not count.</strong> Council Member Kern argued that a builder who wants a fifth
            story should be able to buy development rights to get one (<News k="board2024" />). Buying development rights is how the Town’s <a href={`${base}/tdr/`} style={link}>transfer program</a> pays to preserve farmland and open space elsewhere, so a hard cap can be framed as a loss for farmland preservation as well as for builders.</li>
        </ol>
      </section>

      <section style={card} aria-labelledby="for">
        <h2 id="for" style={h2}>The case for it, and why it will not go away</h2>
        <ul style={list}>
          <li>Residents asked for it. The 2020 survey behind the book favored limiting downtown to four stories (<News k="survey2020" />), and
            residents spoke for the law in 2022 (<News k="hearing2022" />).</li>
          <li>The Town paid about $175,000 for the study, and its own planner said that without codification it is “almost useless” (<News k="board2024" />).</li>
          <li>The Board’s own Comprehensive Plan, adopted unanimously in 2024, recommends writing it into the code. Leaving that undone is an
            opening for any challenger.</li>
          <li>The book claims its trade keeps about the same floor area per lot, which, if right, answers much of the cost objection.</li>
        </ul>
        <p style={prose}>
          A middle path is in the record too. The 2024 plan asks only that the book be <em>“required to be considered”</em> at site plan review,
          not that every standard bind. A law that requires review against the book, keeps five stories with a set-back fifth floor (which
          Board members said they would allow, per <News k="board2024" />) and turns the green roof into an incentive would carry out the plan
          while avoiding most of the fights above.
        </p>
      </section>

      <p style={{ ...help, margin: '0 0 16px' }}>
        Sources: the <a href={BOOK.url} style={link}>{BOOK.title}</a>; the 2024 Comprehensive Plan Update; Town Board minutes and resolutions
        2024-760, 2025-263, 2026-257 and 2026-746; and news reports,{' '}
        {Object.values(NEWS).map((n, i) => <span key={n.url}>{i ? '; ' : ''}<a href={n.url} style={link}>{n.title}</a></span>)}.
      </p>
    </PageShell>
  )
}
