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

1. **Audit one meeting a run with `data-auditor`**, newest first, starting
   with September 15, 2026. Fix what it finds with packet evidence, one
   meeting per pull request.
2. **Run `silent-failure-hunter` over `etl/`**, and fix its top finding with
   a test that would have caught it.
3. **Run `comment-analyzer` over `etl/parse_fiscal_impact.py` and
   `README.md`**, and fix the stale claims it can show.
4. **2026-486's stated amount.** "S-Power agreed to pay the sum of
   $150,000.00, of which $91,165.00 remains" is labelled a cost. Check the
   packet: it may be money coming in or background.

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
  to 7.
