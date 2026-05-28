# Adopted Website Modules

Riverhead Budget Live adopts the following modules as the next required website phase.

## 1. `/scenarios`

Create a dedicated public route for fiscal scenario modeling.

Required scenario types:

- surplus allocation scenarios
- tax stabilization scenarios
- reserve allocation scenarios
- workforce/retirement incentive risk scenarios
- debt and capital financing scenarios
- operating investment scenarios

Each scenario should clearly show:

- assumption set
- fiscal effect
- taxpayer-impact caveat
- operational upside
- risk areas
- source and confidence status

## 2. Real Charts

Replace decorative or text-only summaries with meaningful charts.

Required chart families:

- levy trend charts
- fund balance trend charts
- reserve-use charts
- debt trajectory charts
- expenditure composition charts
- payroll/overtime charts
- year-over-year delta charts
- water/sewer fund charts

Charts must be tied to source-backed data and clearly labeled as audited, adopted, estimated, parsed, or modeled.

## 3. Live Parsed Line-Item Search

The `/search` page must eventually read from the parser outputs:

- `search-index.json`
- `line-item-candidates.json`
- `citations.json`

Required search capabilities:

- keyword search
- fund filtering
- department filtering
- account code search
- amount search
- source-document filtering
- confidence filtering
- show-source expansion

## 4. Department Explorer

Create a richer department intelligence experience.

Required capabilities:

- individual department pages or expandable cards
- fund mapping
- account lines
- payroll profile
- overtime exposure
- operating cost drivers
- staffing indicators
- cross-year comparisons
- source-backed narrative explanations

## 5. AI Citation Overlays

AI-generated explanations must show source traceability.

Required citation elements:

- document title
- page number
- raw text snippet
- parsed timestamp
- confidence status
- source URL
- document hash where available

## 6. Reconciliation Engine

Create a source-backed reconciliation layer comparing:

- adopted budget
- tentative/preliminary budget
- AFR actuals
- audited statements
- supplements/amendments

Required outputs:

- budget vs actual comparisons
- AFR vs audit comparisons
- discrepancy warnings
- variance explanations
- confidence scoring
- reconciliation notes

## 7. Payroll and Overtime Analytics

Create labor-pressure intelligence based on parsed account lines.

Required indicators:

- salary growth
- overtime growth
- department labor share
- benefits cost pressure
- pension/retirement exposure
- workers compensation exposure
- retirement incentive risk
- staffing substitution risk

## 8. Account-Level Drilldowns

Every fund and department should eventually drill down into account-level rows.

Required fields:

- fund
- department
- account code
- account title
- account type
- amount
- fiscal year
- document source
- page citation
- extraction confidence
- reconciliation status

## Implementation Rule

No module should imply a figure is official unless it has been verified against the source document and clearly labeled.

Every public-facing financial figure should eventually include:

1. source document
2. page reference
3. status label
4. confidence level
5. explanation of whether it is adopted, audited, AFR-reported, parsed, estimated, or modeled

## Product Direction

These modules move Riverhead Budget Live from a readable dashboard into a resident-facing fiscal intelligence platform with source transparency, explainability, and real analytical value.
