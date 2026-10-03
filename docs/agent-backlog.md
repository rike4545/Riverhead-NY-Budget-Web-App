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

1. **Capital-project closeouts read as "Understated".** All 32 closeouts on
   June 16, 2026 (2026-566 to 2026-597) are read as understated "No"
   statements. Closing a project and returning its unspent money commits
   nothing new, and those reads inflate the meeting's 39 understated
   statements and the page's 2026 headline count. Check each against its
   packet with `data-auditor`. Keep "understated" only where a closeout
   covers an overrun or draws fund balance. Fix the read rule in
   `etl/parse_fiscal_impact.py` with a test, and regenerate from freshly
   downloaded packets. July 7's 2026-634 was the same case, fixed by hand.
2. **Audit one meeting a run with `data-auditor`**, newest first, starting
   with September 15, 2026. Fix what it finds with packet evidence, one
   meeting per pull request.
3. **Run `silent-failure-hunter` over `etl/`**, and fix its top finding with
   a test that would have caught it.
4. **Run `comment-analyzer` over `etl/parse_fiscal_impact.py` and
   `README.md`**, and fix the stale claims it can show.
5. **2026-486's stated amount.** "S-Power agreed to pay the sum of
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
