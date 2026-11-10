---
name: riverhead-stale-review
description: "Use when asked if a page is outdated or needs updating."
category: content-accuracy
---
# Reviewing pages for outdated information

- Scan the built text of `web/out/**/index.html` for dates already past next to future
  tense ("will", "scheduled", "not yet"), budget-stage words ("Tentative"), and old "as of" dates.
  Then check each hit against the data; most are correct history.
- Use the newest budget stage: stageDoc(year, 'adopted') ?? 'preliminary' ?? 'tentative'.
  Say which stage a figure comes from.
- Hearings and deadlines: lib/budget-amendments-2027.ts NEXT_STEPS records what the minutes show.
- A vote that amends next year's budget is not a draw on this year's balance.
- Fix shared components (PreliminaryUpdate, TentativeReleased) rather than each page's copy,
  and watch for a box rendered twice.
- When a lib rule changes, mirror it in the verify script that recomputes the page independently.
- Record what was checked and left alone, not only what changed.
