# Budget-stage route and data dependency audit

This inventory covers routes whose figures, labels, forecasts, or conclusions may be affected when a new Tentative, Preliminary, or Adopted budget is published. The automated verifier checks route presence and expected data dependencies; it does not replace numerical reconciliation or visual review.

## Classes

- **stage-sensitive** — latest published stage must be used or clearly named; compare Preliminary before Tentative when both exist.
- **transition-specific** — preserve the amendment record while reconciling the later official document.
- **historical-plus-current** — retain the original historical/actual record and distinguish it from proposals.
- **indirect** — current budget assumptions may affect ratios, affordability, or combined dashboards.
- **historical** — preserve source-year labels; update only where a current authorized comparison is shown.

## Route inventory

| Route | Class | Required semantic check |
|---|---|---|
| /analytics/ | Indirect | Cross-topic summaries use current source data and show years/bases. |
| /explore/ | Indirect | Program, payroll, debt, and prediction figures are not presented as one undifferentiated stage. |
| /annual-report/ | Historical + current | Audited actuals remain historical; current proposal comparisons are clearly separated. |
| /credit-rating/ | Indirect | Reserve and appropriation denominators are identified by year. |
| /payroll/ | Stage-sensitive | Proposed salary/personal-service lines and amendments match the current budget stage; actual payroll remains actual. |
| /fringe-benefits/ | Indirect | Benefit-load assumptions have clear provenance and are not confused with adopted appropriations. |
| /management-compensation/ | Historical + current | Salary history is distinct from authorized or proposed salaries. |
| /workforce-by-title/ | Historical | Personnel data is dated; any budgeted salary values name their fiscal year/stage. |
| /scenarios/ | Stage-sensitive | Scenarios name their baseline and are not presented as official amounts. |
| /town-square/ | Indirect | Reserve/affordability claims identify the baseline year and assumptions. |
| /buyout/ | Stage-sensitive | Historical buyout model remains distinct from current proposed appropriations. |
| /tax-cap/ | Stage-sensitive | Tax-cap assumptions and proposed levy have explicit source and stage labels. |
| /capital-debt/ | Stage-sensitive | Debt-line sums reconcile to the current Supplement; historical amortization schedule remains dated. |
| /compare/ | Stage-sensitive | Preliminary supersedes Tentative as the latest proposal when published. |
| /what-changed/ | Stage-sensitive | Headlines and comparison sentences use the latest stage. |
| /general-fund/ | Stage-sensitive | General Fund proposal totals and labels follow the latest stage. |
| /funds/ and /funds/[code]/ | Stage-sensitive | Town-wide and individual-fund figures agree; account lines reconcile to the Summary. |
| /programs/ | Stage-sensitive | Program rollups identify their source stage and reconcile to underlying lines. |
| /revenue/ | Stage-sensitive | Revenue estimates and line history are refreshed from the latest available Supplement. |
| /budget-accuracy/ | Historical + current | Actual, adopted, and proposed columns are not conflated; outlier year is correct. |
| /outliers/ | Stage-sensitive | Outlier analysis uses refreshed lines and a clearly identified baseline. |
| /budget-amendments-2027/ | Transition-specific | The six October 20 amendments remain an historical record and reconcile to the Preliminary/Adopted document where applicable. |
| /budget-changes/ | Historical + current | Resolutions and draws stay assigned to the right fiscal-year baseline. |
| /fund-balance-draws/ | Historical + current | Approved commitments/draws are distinguished from an actual current balance. |
| /reserves/ | Indirect | Ratios, targets and comparisons state their denominator year. |
| /predict-2027/ | Stage-sensitive | Original forecast, revised estimate, latest proposal and eventual adopted result remain separate. |
| /taxpayer-impact/ | Stage-sensitive | Household/taxpayer claims reconcile to current levy and rate assumptions. |
| /tax-bill/ | Stage-sensitive | Calculator rate is explicitly dated and sourced. |
| /zero-percent-2027/ | Stage-sensitive | Zero-levy scenario recalculates from current inputs and remains labeled a scenario. |
| /spending-reduction-2027/ | Stage-sensitive | Estimated savings are distinguished from adopted cuts and official amendments. |

## Other views to review when their specific inputs change

- **/community-preservation-fund/** — only if relevant CPF revenue, debt, or project assumptions change.
- **/road-spending/** — only if road spending, highway fund appropriations, or comparison years change.
- **/contracts/**, **/payroll/** and meeting/records pages — update from their own new records; do not rewrite historical facts just because a budget stage changes.
- **/downloads/**, **/sources/**, **/search/** and **/data-quality/** — verify newly published documents, refreshed datasets, and source descriptions are discoverable.
- **/capital-debt/**, **/town-square/** and **/credit-rating/** — retain dated debt schedules and historical resolutions, even if current budget assumptions change.

## Release gate

Before treating a new stage as current:
1. Parse the official document and preserve its URL/title/date.
2. Reconcile fund Summary totals, town-wide levy, and relevant line-level data.
3. Confirm the stage selector prefers Preliminary to Tentative and Adopted to either proposal.
4. Run focused route verifiers and this dependency audit.
5. Inspect rendered headings, explanatory text, and calculations for stale year/stage wording.
6. Check search, sources, downloads, and data-quality reporting.
