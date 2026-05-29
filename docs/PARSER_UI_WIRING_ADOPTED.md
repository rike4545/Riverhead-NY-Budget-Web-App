# Parser-Backed UI Wiring Plan Adopted

Riverhead Budget Live adopts parser-generated financial-report datasets as the source of truth for document discovery, search, citations, and ingestion status.

## Required Frontend Wiring

### 1. Search Page

The Search page must use:

- `search-index.json`
- `citations.json`

Required UI outputs:

- parsed document pages
- snippets
- source links
- page numbers
- confidence badges
- money-value counts
- citation expandable details

### 2. Sources Page

The Sources page must use:

- `index.json`
- `parserExtractionReport.documents`

Required UI outputs:

- parsed budgets
- parsed AFRs
- parsed audits
- parser status
- extraction failures
- source freshness
- source-document links

### 3. Citation Overlays

Citation overlays must use:

- `citations.json`
- `parsedCitations`

Required UI outputs:

- document title
- page number
- raw/source snippet
- parsed timestamp
- confidence score
- document hash where available
- source URL

### 4. Department Explorer

Department/account exploration must use:

- `line-item-candidates.json`
- `parsedLineItemCandidates`

Required UI outputs:

- account-code candidates
- extracted raw lines
- extracted amounts
- page number
- source document
- confidence score
- operational grouping where possible

### 5. Analytics Page

The Analytics page must use:

- `parserDatasetStats`
- `parserExtractionReport`
- generated parser datasets

Required UI outputs:

- parsed document count
- parsed audit count
- parsed AFR coverage
- parsed page count
- citation count
- line-item candidate count
- ingestion failure count
- latest parser timestamp

### 6. Home Page / Main Dashboard

The homepage must include:

- latest parsed budget card
- latest parsed AFR card
- parser health/status section
- document ingestion counts
- source freshness indicators
- audit coverage status
- clear disclaimer that the project is independent and unofficial

## Implementation Standard

Static TypeScript arrays may still supplement known financial values, but they should not hide generated parser output.

Parser outputs should be visible whenever available, and missing parser output should produce a clear resident-facing status message instead of silently falling back to static content.

## Product Direction

The site should clearly show what has been ingested, what has been parsed, what is still awaiting normalization, and how each displayed figure connects back to source records.
