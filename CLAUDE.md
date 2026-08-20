# Riverhead Budget Live — working notes

Durable facts and conventions for this repo. Deliberately narrow: anything you
can re-derive by reading the code is left out on purpose. What's here is the
stuff that is expensive to rediscover, plus the corrections that were paid for
once already.

## What this project is

An **unofficial**, community-built civic transparency site for the Town of
Riverhead, NY. Not affiliated with, endorsed by, or operated by the Town. Every
resident-facing surface has to keep that true.

Two specialist agents exist and are usually the right first stop:
`riverhead-domain-expert` (are the numbers right and correctly framed?) and
`web-ml-expert` (anything touching search, retrieval, or the LLM layer).

## Hard constraints

- **No backend, ever.** `output: 'export'` — a static bundle on GitHub Pages.
  There is no server, so there is nowhere to hold a secret. Anything needing a
  key is bring-your-own-key, kept in the user's `localStorage`. Never add a
  shared API key; committing one publishes it.
- **Two production targets.** GitHub Pages serves from `/Riverhead-NY-Budget-Web-App`,
  Netlify from the domain root. `next.config.js` picks the basePath off the
  `NETLIFY` env var. Components build hrefs as plain strings against
  `NEXT_PUBLIC_BASE_PATH` rather than using `next/link`, so a new page that
  hardcodes a leading `/` will 404 on Pages and work fine on Netlify. Check both.
- `next.config.js` is CommonJS. Do not add `"type": "module"` to
  `web/package.json` — it breaks the build.

## Framing rules that are not negotiable

These are editorial commitments, not style preferences. Breaking one turns a
transparency tool into an accusation.

- **Town Employee Donors** and **Outlier Watch** surface *disclosure context and
  statistical flags*, never wrongdoing. A flagged item is a reason to ask a
  question at a Town Board meeting, nothing more.
- Label modeled numbers as modeled ("in the app's current model"). Never let a
  projection read as an adopted figure.
- For legal conclusions, deadlines, or compliance calls, point the reader to
  Town staff, official notices, or the audited statements.

## Accounting distinctions the data will let you get wrong

- An **appropriation** is not an expense. A **levy** is not total revenue.
- **Authorized salary** (Board-set) and **payroll** (actual pay) are different
  numbers for the same person. Never present one as the other.
- Fund balance is not one number — restricted / assigned / unassigned differ,
  and so does recurring vs. one-time money.

## Corrections already paid for — don't reintroduce

- **Tax bill math uses assessed value, not market value.** The Town's rate is
  per $1,000 of *assessed* value, with a 7.44% residential assessment ratio.
  Applying the rate to market value overstates every bill by an order of
  magnitude.
- **Payroll counts employee-*year* records, not people.** The raw table has
  ~4,444 rows for ~1,192 distinct people. Any "how many employees" figure has to
  deduplicate, and split current from former.
- Three job-title misspellings present in the Town's own source documents
  ("Superintendant", "Adminstrator", "Specialst") are corrected at the ETL layer,
  checked against Suffolk County's Civil Service title list. Fix data problems in
  `etl/`, not in the component that displays them.

## Data pipeline

A weekly GitHub Action re-runs the ETL, commits regenerated datasets to `main`,
and redeploys. Every input it needs is committed, so a run is reproducible from
a clean checkout.

The load-bearing invariant: **budget line items must reconcile to the dollar
against the official Summary page.** If a parser change breaks reconciliation,
the parser is wrong, not the Summary page.

Because data regenerates weekly, tests must assert on the *shape* of the data,
never on a specific dollar amount or record name — otherwise unrelated data
refreshes turn the build red.

## Search and the Ask AI layer

`web/lib/riverheadSearchAI.ts` holds both retrieval and the model prompt;
`UnifiedSearch.tsx` renders it. Index is ~16,800 entries in a deliberately
compact `{t,n,x,u,v}` shape because it ships to the browser on every search.

- Record text is **untrusted**. Roughly 12,600 of the entries are raw text from
  Town PDFs the project ingests but does not author, refreshed weekly.
  `groundingBlock` neutralizes bracketed digits (they would be indistinguishable
  from `[n]` citation markers) and the `<records>` delimiter before that text
  reaches the model. Anything new that feeds ingested text to a model needs the
  same treatment.
- `verifyAnswer` re-checks each answer in the browser against the records it was
  grounded on — citations that point at no record, and dollar figures that match
  no record. It is deterministic and costs no tokens. Prefer extending it over
  adding a second model call: residents pay per question with their own key.
- **Known retrieval weakness:** ranking is coverage-dominated (`matched * 8`),
  so verbose records win. Resolution titles are long prose and match more query
  terms than terse budget-line names like "Police - Personal Services", so
  multi-word questions skew toward resolutions. Extra common words in a question
  can push the specific record out entirely.
- **Retrieval cannot answer superlatives or aggregates.** "Who are the
  highest-paid employees?", "what did we spend in total on X" — the index has no
  notion of ranking or summing, so these return whatever matched the words and
  the model then answers confidently from the wrong records. Those questions
  belong on the Payroll Explorer and the fund pages, which compute them. Don't
  suggest them in `AI_EXAMPLES`.
- **Every question in `AI_EXAMPLES` and `EXAMPLES` must be eval-covered.** The
  app suggesting a question makes it the one residents actually ask. Three of
  the four `AI_EXAMPLES` once retrieved nothing relevant — no police overtime
  data exists at all (the single overtime line item is Sewer Treatment), the
  Petrocelli question missed the Petrocelli resolution even at k=24, and the
  highest-paid question returned 24 resolutions and zero payroll records. The
  four current ones are checked by `verify:retrieval`; add cases before adding
  suggestions.

## Known data problem — not yet fixed

`parse_salary_2026.py` emits ~10 authorized-salary records whose "name" is a
budget-section header, not a person: "Fund, Highway", "Sewer, Calverton",
"Projects, Capital", "District, Ambulance". All are tagged "New in 2026". They
rank highly on fund-name queries and would render on the site as employees with
authorized salaries. Fix belongs in `etl/`, not in the display component.

## Commands

Run from `web/`:

```
npm run verify:retrieval   # retrieval eval — no API key, no model call, gates deploy
npm run build              # static export
npm run verify             # post-build smoke check over out/
npm run lint
```

`verify:retrieval` imports the `.ts` source directly via Node's type stripping,
so it needs Node ≥22.18 (CI runs 24).
