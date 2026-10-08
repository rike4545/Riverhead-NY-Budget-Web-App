import { limits, topics } from '../../../lib/answers'

// The Resident Answers, as data for the search page's Ask AI.
//
// Ask AI answers from records retrieved from the search index: budget lines,
// pay, votes, funds and document pages. The figures this site derives from
// those records are not in the index: the audited unassigned fund balance, the
// bonded debt, the change in the 2027 levy. lib/answers.ts already states each
// of them in a sentence, with the page that shows the work, so they are
// published here and retrieved beside the records. So are the questions the
// site does not answer, so the model can say so instead of guessing.
//
// force-static makes Next emit /data/answers.json at build time, from the same
// libraries the pages render, so an answer moves when its data does.
export const dynamic = 'force-static'

const base = process.env.NEXT_PUBLIC_BASE_PATH || ''
/** Links are stored as site paths, like the search index's, and the page adds the base path. */
const sitePath = (href: string) => (base && href.startsWith(`${base}/`) ? href.slice(base.length) : href)

export async function GET() {
  return Response.json({
    schemaVersion: 1,
    answers: topics.flatMap((t) => t.answers.map((a) => ({ topic: t.title, about: t.blurb, q: a.q, a: a.a, href: sitePath(a.href) }))),
    limits: limits.map((l) => ({ q: l.q, a: l.a, href: l.href ? sitePath(l.href) : '/answers/' })),
  })
}
