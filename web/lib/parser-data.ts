// Metadata about the parsed financial-report archive (document list, counts,
// failures). Deliberately imports ONLY the small index.json — the heavyweight
// parser outputs (search-index.json ~47MB, citations.json ~11MB,
// line-item-candidates.json ~80MB) must never be imported at build time; the
// search page uses the compact fetch-on-demand index in data/search/ instead.

import extractionReport from '../public/data/financial-reports/index.json'

export type ParsedDocument = {
  title: string
  url: string
  year: number | null
  category: string
  slug: string
  json?: string | null
  page_count: number
  money_value_count: number
  sha256?: string | null
  parsed_at: string
  status?: string
}

export const parserExtractionReport = extractionReport as {
  source_index: string
  parsed_at: string
  document_count: number
  audit_document_count?: number
  failure_count: number
  page_record_count: number
  citation_count: number
  line_item_candidate_count: number
  documents: ParsedDocument[]
  failures: Array<{ title: string; url: string; error: string }>
  warning?: string
}

export const latestBudgetDocument =
  parserExtractionReport.documents.find((doc) => doc.category === 'adopted_budget' && doc.year === 2026) ??
  parserExtractionReport.documents.find((doc) => doc.category === 'adopted_budget') ??
  null

export const parserDatasetStats = {
  parsedAt: parserExtractionReport.parsed_at,
  documents: parserExtractionReport.document_count,
  audits: parserExtractionReport.audit_document_count ?? parserExtractionReport.documents.filter((doc) => doc.category === 'audit').length,
  pages: parserExtractionReport.page_record_count,
  citations: parserExtractionReport.citation_count,
  lineItems: parserExtractionReport.line_item_candidate_count,
  failures: parserExtractionReport.failure_count,
}
