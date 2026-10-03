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

The `gfoa-practice-expert` items (1 to 6) come from reading GFOA's budgeting
guide and best practices against the site on 2026-10-03. The agent's file
holds the guidance and the checks.

1. **`/gfoa/`'s program year.** `web/lib/gfoa.ts` says GFOA's criteria were
   "revised for the 2026 program year", and that its sources were
   "unreachable", so the categories were transcribed. GFOA's page
   (https://www.gfoa.org/budget-award-2026-criteria) is titled "Revised
   Criteria (2026)" but sits under "Program Changes (Effective 1/1/2027)". The
   award page (https://www.gfoa.org/budget-award) still links criteria for
   "Budgets with a Fiscal Year Beginning 1/1/25 or later". Settle which set
   applies to a 2026 budget and which to 2027. Then check the categories and
   points against the page, and fix the page and comment.
2. **Structural balance is never tested.** GFOA's rule is "recurring revenues
   are greater than or equal to recurring expenditures in the adopted budget".
   The General Fund plans $1,250,000 of fund balance in the 2026 adopted
   budget and $950,000 in the 2027 Tentative. That is sound under the rule
   only if it pays for one-time spending. Show what the Budget Supplements
   and budget documents let the site show, and say what the Town would have
   to publish for the rest.
3. **"Recorded as a revenue line."** `/fund-balance-draws/` says appropriated
   fund balance "is recorded as a revenue line" in the New York chart of
   accounts. Check that against the Comptroller's chart (`web/lib/osc-guidance.ts`).
   It is a financing source, not revenue, whatever format the Town's account
   codes use.
4. **The balance above the policy floor.** GFOA says amounts above a formal
   policy "may reflect a structural trend, in which case governments should
   consider a policy as to how this would be addressed". It also encourages
   "explanation of large changes in fund balance". Check that `/reserves/`
   says this beside the audited figures and the deployment options.
5. **The long-term outlook.** GFOA recommends a plan for "all key funds and
   government operations at least five years into the future".
   `/predict-2027/` looks one year ahead. Look in the Source Library for any
   multi-year plan the Town has published; don't assume there is none. Then
   add the benchmark where the site discusses the outlook.
6. **Then sweep the site with `gfoa-practice-expert`**, one group of pages a
   run, in the order of its map ("Where the site applies them now"),
   starting with fund balance.
7. **Audit one meeting a run with `data-auditor`**, newest first, starting
   with September 15, 2026. Fix what it finds with packet evidence, one
   meeting per pull request.
8. **Run `silent-failure-hunter` over `etl/`**, and fix its top finding with
   a test that would have caught it.
9. **Run `comment-analyzer` over `etl/parse_fiscal_impact.py` and
   `README.md`**, and fix the stale claims it can show.
10. **2026-486's stated amount.** "S-Power agreed to pay the sum of
    $150,000.00, of which $91,165.00 remains" is labelled a cost. Check the
    packet: it may be money coming in or background.
11. **`riverhead-domain-expert`'s "canonical facts" are out of date.**
    - Its unassigned balance is the unaudited $29,671,084 (42.9%). The audit
      the Board accepted on September 1, 2026 gives $28,829,513
      (`web/lib/audits.ts`).
    - It gives the 2025 adopted General Fund as $64,895,000; the budget data
      has $64,852,829.
    - Its "~$33.4M" General Fund balance predates the audit.

    Update the facts from the data files, or replace the list with the files
    that hold them.

## Needs the owner

- **What "Identified dollars in play" counts.** Every meeting except July 7
  adds up all its amounts, including grant pass-throughs, donations and
  developer escrow: $2.9 million of May 5's $4.79 million, and all $153,200
  of July 21's. July 7 counts only amounts on resolutions read as understated
  or drawing reserves. The tile says "cost items we could price". Should
  every meeting use July 7's definition?

## Done

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
