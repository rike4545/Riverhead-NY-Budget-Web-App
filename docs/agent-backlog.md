# Agent backlog

The weekly improvement agent works from this file. Each run it reads
`CLAUDE.md`, takes the first item under **Ready** that no open pull request
is already working on, does that one item, and opens a draft pull request
for the owner. It never merges. In the same pull request it moves the item
to **Done** with the date and what changed, and adds anything it found but
did not fix under **Ready** or **Needs the owner**.

To steer it, edit this file: reorder **Ready**, add or delete items, or move
one to **Needs the owner** to hold it.

## Ready

Items 1 to 13 were found on 2026-10-03 and 2026-10-04 while writing the
three practice agents and checking the fund-balance ledger. Each agent's file holds its sources and checks.

**`gfoa-practice-expert`**

1. **Structural balance is never tested.** GFOA's rule is "recurring revenues
   are greater than or equal to recurring expenditures in the adopted budget".
   The General Fund plans $1,250,000 of fund balance in the 2026 adopted
   budget and $950,000 in the 2027 Tentative. That is sound under the rule
   only if it pays for one-time spending. Show what the Budget Supplements
   and budget documents let the site show, and say what the Town would have
   to publish for the rest.
2. **The balance above the policy floor.** GFOA says amounts above a formal
   policy "may reflect a structural trend, in which case governments should
   consider a policy as to how this would be addressed". It also encourages
   "explanation of large changes in fund balance". Check that `/reserves/`
   says this beside the audited figures and the deployment options. Do it
   with item 7, the State's "reasonable amount" rule.
3. **The long-term outlook.** GFOA recommends a plan for "all key funds and
   government operations at least five years into the future".
   `/predict-2027/` looks one year ahead. Look in the Source Library for any
   multi-year plan the Town has published; don't assume there is none. Then
   add the benchmark where the site discusses the outlook.
4. **Then sweep the site with `gfoa-practice-expert`**, one group of pages a
   run, in the order of its map ("Where the site applies them now"),
   starting with fund balance.

**`osc-expert`**

6. **The Town's fiscal stress result isn't on the site.**
   `lib/budget-concepts.ts` tells residents to ask for "the Town's current OSC
   fiscal-stress score". OSC's *Fiscal Stress Monitoring System –
   Municipalities: Fiscal Year 2025 Results* (September 2026) scored 1,354
   municipalities and designated 22. Riverhead is named neither among them nor
   among the late filers in its appendix. Confirm the Town's designation and
   scores, for 2025 and earlier years, in OSC's data. Then show them where the
   site discusses fiscal health, such as `/analytics/` and `/credit-rating/`.
7. **The "reasonable amount" rule.** The Comptroller's manual (p. 24) says
   towns may carry over a "reasonable amount" of fund balance (Chapter 528 of
   the Laws of 2000), measured on unrestricted fund balance since GASB 54.
   Check whether `/reserves/` explains it beside the balance above the floor.
   Do it with item 2.
8. **OSC's audits of the Town aren't cited anywhere.**
   - *Peconic Bay Community Preservation Funds* (P7-23-25, February 23,
     2024). It found nine collections totaling $5.3 million "not deposited
     within 10 days, as required by Town Law Section 29". The Town disagreed
     with parts but "initiated corrective action".
   - *Adequacy of 2021 Budgets* (S9-21-13, June 4, 2021).
   - *Allocation of Administrative Costs* (2012M-247, March 1, 2013).

   Read each. Cite P7-23-25 on `/community-preservation-fund/`, with the
   Town's response, and decide where the other two belong. Add each to
   `web/lib/osc-guidance.ts` and to the registry in
   `web/lib/authority-audit.ts`.
9. **Name the ES7 fund in the Town's words.** Resolution 2026-473 says "the
   Riverhead Sewer Denitrification Reserve Fund Balance be used for $800,000".
   `/fund-balance-draws/` shows the fund as "Sewer District (ES7)", a
   placeholder in `web/lib/account-lookup.ts`. Use the resolution's name, and
   say it is a reserve, which is restricted fund balance.

**`accounting-expert`**

10. **Get ready for GASB 103's budget variances.** From its 2026 statements
   (fiscal years beginning after June 15, 2025), the Town must present
   "variances between original and final budget amounts" and "variances
   between final budget and actual amounts", and explain significant ones in
   notes to required supplementary information. Make sure `/budget-accuracy/`
   labels which of its figures are budget basis and which GAAP, so the
   Town's own explanations can be added when the 2026 audit is out.
11. **Trace the accrued-leave figures.** `web/lib/reserve-policy.ts` says
    accrued leave "grew from $9,773,700 to $11,608,615 during 2025". Find the
    statement and page each figure comes from, and its basis
    (government-wide, measured under GASB 101). Label them so on the site,
    and check they aren't set against fund balance.
12. **Fund-balance rows that section G leaves out.** The parser now reads
    the 9999 rows of each adopted budget table (`tableFundBalance`). It counts
    a row only in a fund whose section G names a fund-balance source, because
    the table's FROM and TO columns don't survive text extraction. Seven
    adopted tables name a 9999 account that section G doesn't, so none of
    them is counted:
    - 2026-284, 2026-285 and 2026-286 (April 7): two Highway Department dump
      trucks and a chassis with a sander, each with a row "DA1-9999-000-00000-0
      - Appropriated Fund Balance": $399,625.00, $256,395.00 and $248,270.00.
      Section G names only the equipment line, DA1-5-5130-240-000-00000.
    - 2026-767 (August 18): "ES7-9999-000-00000-0 Appropriated Fund Balance
      $650,000.00" into equipment lines in ES1, ES3 and ES5. The statement
      answers "No" and leaves section G blank. The table also moves one fund's
      balance straight into three other funds' lines with no transfer
      accounts.
    - 2026-471 (May 20): A01-9999 $7,677.64 into "A01-1001-002-00000-A
      Property Taxes-Chap 217/251", a revenue line, not an appropriation.
    - 2026-569 and 2026-577 (June 16): closeouts returning $17,972.55 and
      $1,500.00 to the Community Benefit Funds balance. These are TO rows, not
      draws.

    Decide the direction of each row from its own table: the row order, the
    explicit "From" and "To" lines on 2026-284, and FROM totals that must equal
    TO totals. Then count the draws, with tests. Counting 2026-284, 2026-285,
    2026-286 and 2026-767 would add $1,554,290 to the other-funds total on
    `/fund-balance-draws/`.
13. **Then sweep the site with `accounting-expert`**, one library a run,
    starting with the consumers of `web/lib/audits.ts`.

**Other items**

14. **Audit one meeting a run with `data-auditor`**, newest first, starting
    with September 15, 2026. Fix what it finds with packet evidence, one
    meeting per pull request.
15. **Run `silent-failure-hunter` over `etl/`**, and fix its top finding with
    a test that would have caught it.
16. **Run `comment-analyzer` over `etl/parse_fiscal_impact.py` and
    `README.md`**, and fix the stale claims it can show.
17. **2026-486's stated amount.** "S-Power agreed to pay the sum of
    $150,000.00, of which $91,165.00 remains" is labelled a cost. Check the
    packet: it may be money coming in or background.
18. **`riverhead-domain-expert`'s "canonical facts" are out of date.**
    - Its unassigned balance is the unaudited $29,671,084 (42.9%). The audit
      the Board accepted on September 1, 2026 gives $28,829,513
      (`web/lib/audits.ts`).
    - It gives the 2025 adopted General Fund as $64,895,000; the budget data
      has $64,852,829.
    - Its "~$33.4M" General Fund balance predates the audit.

    Update the facts from the data files, or replace the list with the files
    that hold them.
19. **Recheck GFOA's award criteria when its online application opens.** GFOA
    expects it in January 2027. On 2026-10-03 its criteria page and its draft
    application form (dated October 1, 2026) disagreed: the page gives
    Department Budget the same four questions as Program / Services Budget,
    while the form asks them of each department; the form names three
    categories differently ("Budget-in-Brief / Newsletter", "Budget Website /
    Dashboard", "Other / Media Campaign (social media, etc.)"); and it gives
    the 0 to 5 score "per question", where the scoring page gives it per
    category. Fetch the pages again, update
    `etl/data/policies/gfoa-budget-award.json` and `web/lib/gfoa.ts` together,
    and let `verify-gfoa-criteria.mjs` show what moved.

## Needs the owner

- **What "Identified dollars in play" counts.** Every meeting except July 7
  adds up all its amounts, including grant pass-throughs, donations and
  developer escrow: $2.9 million of May 5's $4.79 million, and all $153,200
  of July 21's. July 7 counts only amounts on resolutions read as understated
  or drawing reserves. The tile says "cost items we could price". Should
  every meeting use July 7's definition?
- **`/gfoa/`'s self-scores against GFOA's own scale.** GFOA's scoring page
  (https://www.gfoa.org/eval-process-2026) gives each category a score from 0
  to 5 (0 to 2 for completeness, 0 to 3 for quality), divides it by 5 and
  multiplies by the category's points. Nine of the site's 14 self-scores could
  not come from that: Value and Long-Term Outlook at 15 of 20, for example,
  where GFOA's steps run 12 or 16. The page now says so instead of claiming
  GFOA has no rubric. Re-score on GFOA's scale, or keep the site's own
  judgment with that caveat? If re-scoring, also reread the Department Budget
  gap note ("no accountability-for-results reporting"), which was written
  against a question GFOA's page does not ask.
- **The Town's own budget against the criteria it would have faced.** A 2026
  budget submitted on time would have been judged against GFOA's existing
  criteria, which mark 15 of their 25 "Mandatory". Should `/gfoa/` (or another
  page) read the Town's own 2026 budget book against them, as a likely
  concern for residents rather than a GFOA determination?

## Done

- 2026-10-05: The data workflows no longer fail when another run pushes first.
  Both of Parse Financial Reports' schedules matched Monday 09:00 UTC, so two
  runs started 35 seconds apart; the second run's rebase stopped on
  `web/public/data/meta.json` and its push failed. The workflow now runs one
  at a time (a concurrency group), its weekly schedule skips September to
  November, which the twice-daily one covers, and it and the meeting sync push
  through `.github/scripts/push-data.sh`. That script takes main's copy of a
  derived file that conflicts (the freshness stamp, the search index, the CSV
  downloads, the shared-data manifest), rebuilds them all on top of main, and
  fails with the file named only when two runs changed the same source data.
  `etl/test_push_data.py` replays the race and checks the schedules.
- 2026-10-04: A fund-balance line section G leaves blank no longer doubles a
  resolution's amount when the adopted table prices it. The amount was moved
  by the table's figure less section G's, with a blank counted as $0, so a
  $25,000 appropriation whose blank 9999 line the table prices at $25,000
  read $50,000. A blank line's table figure now stands beside section G's
  other figures, and the larger is the amount (`corrected_amount`, and
  `correctedAmount` in `web/lib/fund-balance-lines.ts`). No published figure
  changes: 2026-765, the one correction so far, was priced.
- 2026-10-04: `/fund-balance-draws/` no longer says appropriated fund balance
  "is recorded as a revenue line", or that a draw "credits A01-9999 and debits
  whatever is being bought". The Comptroller's *Accounting and Reporting
  Manual* (April 2024) keeps "599 Appropriated Fund Balance" as a budget
  account apart from "510 Estimated Revenues" (p. 28). Entry 3b (p. 50),
  "To record the appropriation of fund balance to increase existing or to meet
  additional appropriations", debits A599 and credits A960 Appropriations. The
  page now says so, notes that the Town's own codes give the account a
  revenue-shaped number (A01-9999), and lists the manual among its sources
  (Ready item 5, pull request #94).
- 2026-10-04: 2026-765 is counted from the budget table the Board adopted,
  everywhere.
  - Its section G charges A01-9999 $150,000. The table it adopts moves
    "A01-9999-000-00000-0 Appropriated Fund Balance $280,000". The $280,000
    had been typed into `ADOPTED_TABLE` in `web/lib/fiscal-commitments-2027.ts`,
    so only the ledger pages used it. `/fiscal-impact/`, its verdict and the
    August 18 totals still said $150,000.
  - `etl/parse_fiscal_impact.py` now records each table's 9999 rows
    (`tableFundBalance`). Where one puts a different figure on a fund's draw
    than section G, the table's figure is used (`adopted_draws`), and section
    G's is shown beside it. `ADOPTED_TABLE` is gone.
  - The build compares section G with the vote for every draw. 2026-765 is
    the only one that differs.
  - The accounts panel on `/fiscal-impact/` said the General Fund's 2026
    adopted budget "appropriated no fund balance". Its summary (p. 3) planned
    $1,250,000, and the Water District's $1,850,000. The line-item extract
    simply has no 9999 lines. The panel now gives the planned figure from
    `web/lib/all-funds.ts`.
- 2026-10-04: `/fund-balance-draws/` splits other-fund draws by fund.
  - A resolution drawing on two non-General funds had been listed under each
    with their combined amount, overstating both subtotals, and a fund named
    without an amount could look priced. Each fund now carries only its own
    lines, and votes are counted by resolution.
  - `scripts/verify-fund-balance-lines.mjs` tests the split on made-up
    multi-fund statements. It also recomputes the page's General Fund and
    other-fund totals from the source lines, so a line counted twice fails
    the build.
  - All 23 adopted draws were checked against their packets (Ready item 12).

- 2026-10-03: `/gfoa/` now says GFOA's revised criteria take effect on
  January 1, 2027 (either set during 2027, only the revised set from 2028), so
  a 2026 budget submitted on time would have been judged against the existing
  criteria. Its category names, points and primary questions now match GFOA's
  page word for word, and `web/scripts/verify-gfoa-criteria.mjs` checks them
  and every GFOA quote against the saved pages in
  `etl/data/policies/gfoa-budget-award.json`.
- 2026-10-03: July 7's hand-curated amounts corrected against the packet
  (pull request #89).
- 2026-10-03: Capital-project closeouts no longer read as "Understated".
  All 32 on June 16 (2026-566 to 2026-597) were checked against the packet:
  each returns its unspent balance, had it moved by an earlier resolution, or
  has none left, and none covers an overrun. A resolution whose RESOLVED
  clause closes a capital project, with no deficit, appropriated fund balance
  or move to another project in its text, now reads "No direct cost" when
  the Town answered "No". June 16 went from 39 understated "No" statements
  to 7 (pull request #90).
- 2026-10-03: The one-off script that first wrote July 7's file
  (`etl/parse_agenda_packet.py`) is retired: rerunning it restored amounts the
  packet contradicts, and the merge kept them. 2026-641 is now described the
  same way everywhere: the Town Square note paid from rent and the sale of 127
  East Main Street, with fund balance only from 2026-762's interim switch on
  August 4 (pull request #90).
