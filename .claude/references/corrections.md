# Lessons from corrections

Each lesson here came from the owner, or a reviewer, correcting the work. Apply
every lesson on every run. When you are corrected again, fix the work, then add
the lesson below in the same pull request: one line saying what to do, with the
date and what went wrong. Edit an existing lesson rather than adding a near
copy.

## Apps

- Change the web data, the iOS app and the Android app together: when a
  dataset or view changes, sync it to both apps in the same piece of work.
  (2026-11-21: the 2027 budget update reached iOS before Android.)
- Write Swift that compiles in Swift 6 language mode, as the owner's Xcode
  does: a file-level function uses a `FormatStyle`
  (`value.formatted(.currency(code: "USD"))`), never a `static` formatter on a
  view. (2026-11-21: `FundDetailView.swift` failed with "Main actor-isolated
  static property 'moneyFormatter0'".)

## Data

- Match job titles across salary lists only after spelling out abbreviations
  ("Equip", "Maint", "Sr", "Asst", a trailing "Hwy"), then check each count
  against the raw records. (2026-11-21: Riverhead's 2022 "Automotive Equip
  Operator" rows were left out, so the count read 2 instead of 19.)
- When a figure counts people who qualify for a benefit, include every title
  that qualifies, department heads too. (2026-11-21: the police longevity count
  left out the Chief.)

## Merging

- When the owner says "merge", carry each pull request through to merged in the
  same turn: green CI, `draft: false`, then `merge_pull_request` with the head
  SHA, one after another. Report each result. (2026-11-21: the PRs were marked
  ready but not merged, and the owner had to say "try again".)
