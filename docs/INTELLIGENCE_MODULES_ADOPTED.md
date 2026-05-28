# Adopted Intelligence Modules

Riverhead Budget Live adopts the following modules as the next formal product and engineering phase.

## 1. Full Line-Item Search

The platform must support searching across:

- parsed PDF page text
- extracted line-item candidates
- fund names
- department names
- account codes
- account descriptions
- dollar amounts
- source documents
- citations

Required outputs:

- `search-index.json`
- `line-item-candidates.json`
- searchable UI route at `/search`

## 2. AFR Normalization

Annual Financial Reports must be converted from page text into normalized financial datasets.

Required normalized outputs:

- fund balances
- revenues
- expenditures
- transfers
- debt activity
- capital activity
- water and sewer activity
- source citations

## 3. Budget Reconciliation

The platform must compare:

- adopted budget
- tentative/preliminary budget
- annual financial report
- audited financial statements
- supplements/amendments

Required features:

- budget vs actual comparison
- AFR vs audit comparison
- year-to-year variance tracking
- discrepancy warnings
- reconciliation confidence scores

## 4. Payroll and Overtime Analytics

The platform must identify and analyze:

- salary accounts
- overtime accounts
- part-time and seasonal payroll
- benefits
- pension/retirement contributions
- workers compensation
- health insurance
- labor concentration by department

Required features:

- payroll pressure indicators
- overtime trend indicators
- department labor share
- retirement incentive exposure

## 5. Account Drilldowns

Every fund and department page should support drilldowns into:

- account code
- account title
- object/category
- prior-year comparison
- current-year amount
- trend status
- source citation
- confidence score

## 6. AI Citations

AI-generated explanations must cite:

- source document title
- page number
- raw text snippet
- extraction timestamp
- document hash
- confidence level

No AI-generated financial explanation should appear without traceability.

## 7. Operational Comparisons

The platform must compare departments and service areas by:

- appropriations
- payroll concentration
- overtime pressure
- capital/equipment needs
- contractual expense growth
- reserve dependency
- debt/service burden

## 8. Department Intelligence

Each department should eventually include:

- fund mapping
- account lines
- payroll profile
- overtime exposure
- operating cost drivers
- staffing indicators
- source-backed narrative explanations

## 9. Cross-Year Analytics

The platform must support multi-year trend views for:

- tax levy
- appropriations
- revenues
- expenditures
- fund balance
- reserves
- debt service
- payroll
- overtime
- water/sewer funds
- department cost drivers

## Implementation Standard

A figure may be promoted from parsed text into dashboard intelligence only when it includes:

1. source document
2. page reference
3. raw text or table context
4. extraction timestamp
5. confidence status
6. reconciliation status where applicable

## Product Direction

These adopted modules move Riverhead Budget Live from a public document viewer into a continuously updating municipal fiscal intelligence platform.
