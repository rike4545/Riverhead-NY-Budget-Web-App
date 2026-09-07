import { type Entry, type EntryType, retrieveForQuestion } from './riverheadSearchAI'

const TYPE_LABEL: Record<EntryType, string> = {
  fund: 'Fund',
  'line-item': 'Budget line',
  payroll: 'Payroll',
  salary: 'Authorized salary',
  resolution: 'Town Board vote',
  page: 'Document page',
}

const usd = (n: number) => new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
}).format(n)

export type RecordAnswer = {
  text: string
  records: Entry[]
}

function cleanContext(value: string, max = 150) {
  const oneLine = value.replace(/\s+/g, ' ').trim()
  return oneLine.length <= max ? oneLine : `${oneLine.slice(0, max - 1).trim()}…`
}

function isGenericHighestPayQuestion(question: string) {
  const q = question.toLowerCase()
  return /\b(highest|top|largest)\b/.test(q) && /\b(pay|paid|payroll|earner|earners|employee|employees)\b/.test(q)
}

function isBoardQuestion(question: string) {
  return /\b(board|vote|votes|voted|resolution|resolutions|meeting|meetings)\b/i.test(question)
}

function isDollarQuestion(question: string) {
  return /\b(how much|spend|spending|cost|costs|appropriation|appropriated|budget|levy|salary|pay|paid|payroll)\b/i.test(question)
}

function chooseRecords(question: string, entries: Entry[], limit: number): Entry[] {
  const ranked = retrieveForQuestion(entries, question, Math.max(30, limit * 3))

  // "Highest-paid employees" is one case where the indexed data itself can
  // answer deterministically without relying on relevance ranking. Do not use
  // this shortcut for named/department-specific questions because filtering the
  // entire payroll from natural language would create false precision.
  if (isGenericHighestPayQuestion(question)) {
    const payroll = entries
      .filter((e) => e.t === 'payroll' && e.v != null)
      .sort((a, b) => (b.v ?? 0) - (a.v ?? 0))
    if (payroll.length > 0) return payroll.slice(0, limit)
  }

  if (isBoardQuestion(question)) {
    const resolutions = ranked.filter((e) => e.t === 'resolution')
    if (resolutions.length > 0) return resolutions.slice(0, limit)
  }

  if (isDollarQuestion(question)) {
    const numericStructured = ranked.filter((e) => e.v != null && e.t !== 'page')
    const remainder = ranked.filter((e) => !numericStructured.includes(e))
    return [...numericStructured, ...remainder].slice(0, limit)
  }

  return ranked.slice(0, limit)
}

function introFor(question: string, records: Entry[]) {
  if (isGenericHighestPayQuestion(question) && records.every((e) => e.t === 'payroll')) {
    return 'The indexed payroll records with the highest actual pay are:'
  }
  if (isBoardQuestion(question) && records.some((e) => e.t === 'resolution')) {
    return 'The strongest matching Town Board records are:'
  }
  if (isDollarQuestion(question) && records.some((e) => e.v != null)) {
    return 'The strongest matching dollar records are below. I am not adding them together because they may represent different accounting concepts, years, or scopes:'
  }
  return 'The strongest matching indexed records are:'
}

export function answerFromRecords(question: string, entries: Entry[], limit = 8): RecordAnswer {
  const records = chooseRecords(question, entries, limit)
  if (records.length === 0) {
    return {
      text: 'I could not find enough indexed records to answer that question. Try a department, employee surname, project name, fund, account, or Town Board subject.',
      records: [],
    }
  }

  const lines = records.map((entry, i) => {
    const value = entry.v != null ? ` — ${usd(entry.v)}` : ''
    const context = cleanContext(entry.x)
    return `• ${TYPE_LABEL[entry.t]}: ${entry.n}${value}${context ? ` — ${context}` : ''} [${i + 1}]`
  })

  return {
    records,
    text: `${introFor(question, records)}\n\n${lines.join('\n')}\n\nThis is a deterministic retrieval summary: no AI model was called. Open the cited records to verify scope, year, and accounting meaning before drawing a conclusion.`,
  }
}
