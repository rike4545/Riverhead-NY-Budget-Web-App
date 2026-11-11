// Drafting a Town Board resolution in the Town's own layout, for /resolution-builder/.
//
// Every 2026 agenda packet prints a resolution the same way: "TOWN OF
// RIVERHEAD", the number line, the title in capitals, "Councilman Kern offered
// the following resolution, which was seconded by Councilwoman Merrifield",
// WHEREAS recitals joined by "; and", the turn "Now, therefore, be it",
// RESOLVED clauses joined by "; and be it further", an optional FROM / TO
// budget table, and the same two closing clauses. The builder writes the
// joining words, the capitals and the closing clauses so the person drafting
// only writes what each clause says.
//
// The standard wording is copied from the packets in etl/data/meetings/
// (*-vote-packet.txt). scripts/verify-resolution-builder.mjs checks that every
// fixed phrase below appears in them, word for word. No imports, so that script
// runs this file directly.

export type Member = { key: string; title: 'Councilman' | 'Councilwoman'; last: string; name: string }

/** The four Council Members who moved and seconded the 2026 resolutions, as the packets name them. */
export const MEMBERS: Member[] = [
  { key: 'rothwell', title: 'Councilman', last: 'Rothwell', name: 'Kenneth Rothwell' },
  { key: 'kern', title: 'Councilman', last: 'Kern', name: 'Robert Kern' },
  { key: 'merrifield', title: 'Councilwoman', last: 'Merrifield', name: 'Denise Merrifield' },
  { key: 'waski', title: 'Councilwoman', last: 'Waski', name: 'Joann Waski' },
]

export type BudgetRow = { code: string; name: string; from: number | null; to: number | null }
export type BudgetTable = { verb: 'establish' | 'ratify'; rows: BudgetRow[] }
export type Draft = {
  year: number
  number: string
  title: string
  mover: string
  seconder: string
  whereas: string[]
  resolved: string[]
  budget: BudgetTable | null
  copies: string[]
}

/** The fixed wording, quoted from the 2026 packets. */
export const PHRASES = {
  town: 'TOWN OF RIVERHEAD',
  offered: 'offered the following resolution,',
  seconded: 'which was seconded by',
  turn: 'Now, therefore, be it',
  further: 'and be it further',
  budgetEstablish: 'that the Supervisor be, and is hereby authorized to establish the following budget adjustment',
  budgetRatify: 'that the Town Board be, and is hereby authorized to ratify the following budget adjustments',
  copies: 'that the Town Clerk is hereby directed to forward a copy of this resolution to',
  closing:
    'that all Town Hall Departments may review and obtain a copy of this resolution from the electronic storage device and, if needed, a certified copy of same may be obtained from the Office of the Town Clerk.',
} as const

export const MAX_CLAUSES = 12
export const MAX_ROWS = 20

/** Account codes as the packets print them: expenditure A01-7-7310-450-000-00000 (the fifth part can be letters, as in A01-1-1345-101-NON-00000), revenue A01-2705-000-00000-J, fund balance DA1-9999-000-00000-0. */
export const ACCOUNT_CODE = /^[A-Z][A-Z0-9]{1,2}-(\d-\d{4}-\d{3}-[A-Z0-9]{3}-\d{5}|\d{4}-[A-Z0-9]{3}-\d{5}-[A-Z0-9])$/
export const isFundBalance = (code: string) => /-9999-/.test(code)

const money = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 })
export const formatMoney = money

/** Take the drafter's words and drop what the builder adds itself: a leading WHEREAS / RESOLVED / that, and trailing "; and", "and be it further" or end punctuation. */
export function cleanClause(raw: string, lead: 'WHEREAS' | 'RESOLVED'): string {
  let t = raw.replace(/\s+/g, ' ').trim()
  t = t.replace(new RegExp(`^(now,? therefore,? be it )?${lead}[,:]?\\s*`, 'i'), '')
  if (lead === 'RESOLVED') t = t.replace(/^that\s+/i, '')
  t = t.replace(/[;,]?\s*(and be it further|now,? therefore,? be it|and)\s*[.;,]?$/i, '')
  t = t.replace(/[\s.;,:]+$/, '')
  return t
}

export type Paragraph =
  | { kind: 'whereas'; text: string }
  | { kind: 'resolved'; text: string }
  | { kind: 'table'; rows: BudgetRow[]; fromTotal: number; toTotal: number; after: string }

export type Composed = { town: string; numberLine: string; title: string; offered: string; paragraphs: Paragraph[] }

const filledRows = (t: BudgetTable | null) => (t?.rows ?? []).filter((r) => r.code.trim() || r.name.trim() || r.from || r.to)
const sum = (xs: (number | null)[]) => Math.round(xs.reduce<number>((s, x) => s + (x ?? 0), 0) * 100) / 100

export function memberLine(key: string): string {
  const m = MEMBERS.find((x) => x.key === key)
  return m ? `${m.title} ${m.last}` : '[Council Member]'
}

/** The resolution in the Town's layout, joining words and closing clauses included. */
export function compose(d: Draft): Composed {
  const whereas = d.whereas.map((w) => cleanClause(w, 'WHEREAS')).filter(Boolean)
  const own = d.resolved.map((r) => cleanClause(r, 'RESOLVED')).filter(Boolean)
  const rows = filledRows(d.budget)
  const copies = d.copies.map((c) => c.trim()).filter(Boolean)

  const paragraphs: Paragraph[] = whereas.map((w, i) => ({
    kind: 'whereas' as const,
    text: `WHEREAS, ${w}${i < whereas.length - 1 ? '; and' : `. ${PHRASES.turn}`}`,
  }))

  // Every RESOLVED clause but the last ends "; and be it further". The budget
  // table sits after its clause, and the packets print "And be it further"
  // below the table rather than at the end of the clause.
  type R = { text: string; table?: BudgetRow[] }
  const resolved: R[] = own.map((t) => ({ text: `that ${t}` }))
  if (rows.length) resolved.push({ text: d.budget?.verb === 'ratify' ? PHRASES.budgetRatify : PHRASES.budgetEstablish, table: rows })
  if (copies.length) resolved.push({ text: `${PHRASES.copies} ${listJoin(copies)}` })
  resolved.push({ text: PHRASES.closing.replace(/\.$/, '') })

  resolved.forEach((r, i) => {
    const last = i === resolved.length - 1
    if (r.table) {
      paragraphs.push({ kind: 'resolved', text: `RESOLVED, ${r.text}:` })
      paragraphs.push({ kind: 'table', rows: r.table, fromTotal: sum(r.table.map((x) => x.from)), toTotal: sum(r.table.map((x) => x.to)), after: last ? '' : 'And be it further' })
    } else {
      paragraphs.push({ kind: 'resolved', text: `RESOLVED, ${r.text}${last ? '.' : `; ${PHRASES.further}`}` })
    }
  })

  const num = d.number.trim()
  return {
    town: PHRASES.town,
    numberLine: `TB Resolution ${d.year}-${num || '____'}`,
    title: d.title.trim().toUpperCase() || '[TITLE OF THE RESOLUTION]',
    offered: `${memberLine(d.mover)} ${PHRASES.offered} ${PHRASES.seconded} ${memberLine(d.seconder)}`,
    paragraphs,
  }
}

function listJoin(xs: string[]): string {
  if (xs.length <= 1) return xs.join('')
  if (xs.length === 2) return `${xs[0]} and ${xs[1]}`
  return `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`
}

export type Check = { level: 'error' | 'warning' | 'ok'; text: string }

/** Dollar amounts written in the clauses, e.g. "$1,420.00". */
export function statedAmounts(d: Draft): number[] {
  const text = [...d.whereas, ...d.resolved].join(' ')
  return Array.from(text.matchAll(/\$\s?([\d,]+(?:\.\d{1,2})?)/g)).map((m) => Number(m[1].replace(/,/g, ''))).filter((n) => n > 0)
}

export function checkDraft(d: Draft): Check[] {
  const out: Check[] = []
  const rows = filledRows(d.budget)
  const c = compose(d)
  if (!d.title.trim()) out.push({ level: 'error', text: 'Add a title. It is printed in capitals under the resolution number.' })
  if (!d.mover || !d.seconder) out.push({ level: 'error', text: 'Choose who offers the resolution and who seconds it.' })
  else if (d.mover === d.seconder) out.push({ level: 'error', text: 'The same Council Member cannot both offer and second the resolution.' })
  if (!d.resolved.some((r) => cleanClause(r, 'RESOLVED')) && !rows.length) out.push({ level: 'error', text: 'Add at least one RESOLVED clause saying what the Board decides.' })
  if (!d.whereas.some((w) => cleanClause(w, 'WHEREAS'))) out.push({ level: 'warning', text: 'There is no WHEREAS clause. Most resolutions start by saying why the Board is acting.' })

  const placeholders = [d.title, ...d.whereas, ...d.resolved, ...d.copies].join(' ').match(/\[[^\]]+\]/g)
  if (placeholders) out.push({ level: 'error', text: `Fill in the blanks still in square brackets: ${Array.from(new Set(placeholders)).slice(0, 4).join(', ')}${placeholders.length > 4 ? ' and more' : ''}.` })

  for (const r of rows) {
    const code = r.code.trim()
    if (!code) out.push({ level: 'error', text: `A budget line${r.name ? ` (${r.name})` : ''} has no account code.` })
    else if (!ACCOUNT_CODE.test(code)) out.push({ level: 'warning', text: `${code} does not look like a Town account code, such as A01-7-7310-450-000-00000 or A01-2705-000-00000-J.` })
    if (r.from && r.to) out.push({ level: 'error', text: `${code || 'A budget line'} has both a FROM and a TO amount. Each line moves money one way.` })
    if (!r.from && !r.to) out.push({ level: 'error', text: `${code || 'A budget line'} has no amount.` })
  }
  const table = c.paragraphs.find((p) => p.kind === 'table')
  if (table && table.kind === 'table') {
    if (table.fromTotal !== table.toTotal) out.push({ level: 'error', text: `The budget table does not balance: FROM totals ${money(table.fromTotal)} and TO totals ${money(table.toTotal)}.` })
    else out.push({ level: 'ok', text: `The budget table balances at ${money(table.toTotal)}.` })
    const stated = statedAmounts(d)
    if (stated.length && !stated.some((n) => Math.abs(n - table.toTotal) < 0.005)) {
      out.push({ level: 'warning', text: `The clauses name ${stated.map(money).join(', ')}, but the table moves ${money(table.toTotal)}. In 2026, Resolution 2026-765's statement named $150,000 while its adopted table moved $280,000.` })
    }
  }
  if (rows.some((r) => isFundBalance(r.code))) {
    out.push({ level: 'warning', text: 'The table draws on fund balance (a 9999 account). On the Fiscal Impact Statement, answer D "Yes" and do not initial E(a): fund balance is not in the approved budget. In 2026, 28 adopted statements were marked absorbed while drawing on it.' })
  }
  if (!d.copies.some((x) => x.trim())) out.push({ level: 'warning', text: 'No one is listed to receive a copy. Resolutions usually name the departments that act on them, such as the Financial Administrator or the Office of the Town Attorney.' })
  if (!out.some((x) => x.level === 'error')) out.push({ level: 'ok', text: 'Nothing is missing. Read the preview, then print it or copy it into the Town’s template.' })
  return out
}

/** Plain text, for pasting into an email or the Town's own template. */
export function toPlainText(d: Draft): string {
  const c = compose(d)
  const lines = [c.town, '', c.numberLine, '', c.title, '', `${memberLine(d.mover)} ${PHRASES.offered}`, `${PHRASES.seconded} ${memberLine(d.seconder)}`, '']
  for (const p of c.paragraphs) {
    if (p.kind === 'table') {
      lines.push(`${'Account'.padEnd(58)}${'FROM'.padStart(16)}${'TO'.padStart(16)}`)
      for (const r of p.rows) lines.push(`${`${r.code} – ${r.name}`.slice(0, 57).padEnd(58)}${(r.from ? money(r.from) : '').padStart(16)}${(r.to ? money(r.to) : '').padStart(16)}`)
      lines.push(`${'Total'.padEnd(58)}${money(p.fromTotal).padStart(16)}${money(p.toTotal).padStart(16)}`)
      if (p.after) lines.push(p.after)
      lines.push('')
    } else {
      lines.push(`     ${p.text}`, '')
    }
  }
  return lines.join('\n').trim() + '\n'
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** A Word-readable document (HTML saved as .doc), in Times New Roman 12 pt like the packets. */
export function toWordHtml(d: Draft): string {
  const c = compose(d)
  const para = (t: string) => `<p style="text-indent:0.5in;margin:0 0 12pt;line-height:1.5">${esc(t)}</p>`
  const body = c.paragraphs.map((p) => {
    if (p.kind !== 'table') return para(p.text)
    const tr = p.rows.map((r) => `<tr><td>${esc(r.code)} – ${esc(r.name)}</td><td align="right">${r.from ? money(r.from) : ''}</td><td align="right">${r.to ? money(r.to) : ''}</td></tr>`).join('')
    return `<table style="border-collapse:collapse;width:100%;margin:0 0 6pt;font-size:11pt" cellpadding="3"><tr><th align="left"></th><th align="right">FROM</th><th align="right">TO</th></tr>${tr}<tr><td><b>Total</b></td><td align="right"><b>${money(p.fromTotal)}</b></td><td align="right"><b>${money(p.toTotal)}</b></td></tr></table>${p.after ? `<p style="margin:0 0 12pt">${esc(p.after)}</p>` : ''}`
  }).join('\n')
  return `<html><head><meta charset="utf-8"><title>${esc(c.numberLine)}</title></head><body style="font-family:'Times New Roman',serif;font-size:12pt">
<p style="text-align:center;font-weight:bold;margin:0 0 12pt">${esc(c.town)}</p>
<p style="text-align:center;margin:0 0 12pt">${esc(c.numberLine)}</p>
<p style="text-align:center;font-weight:bold;margin:0 0 12pt">${esc(c.title)}</p>
<p style="margin:0 0 12pt">${esc(`${memberLine(d.mover)} ${PHRASES.offered}`)}<br>${esc(`${PHRASES.seconded} ${memberLine(d.seconder)}`)}</p>
${body}
<p style="margin:24pt 0 0;font-size:9pt;color:#555">Draft prepared with Riverhead Budget Live’s unofficial resolution builder. It is not a Town record; the Town Clerk assigns the number and the Town Attorney’s and Accounting Department’s review comes first.</p>
</body></html>`
}

export type Template = { id: string; label: string; source: string; draft: Omit<Draft, 'year' | 'number' | 'mover' | 'seconder'> }

/**
 * Starting points, each following an adopted 2026 resolution's wording with
 * the particulars replaced by blanks in square brackets.
 */
export const TEMPLATES: Template[] = [
  {
    id: 'blank',
    label: 'Start from a blank resolution',
    source: '',
    draft: { title: '', whereas: [''], resolved: [''], budget: null, copies: [''] },
  },
  {
    id: 'donation',
    label: 'Accept a donation',
    source: '2026-883, Accepts Anonymous Donations for The Recreation Department (October 6, 2026)',
    draft: {
      title: 'Accepts [Donation] for the [Department]',
      whereas: [
        'the Town of Riverhead [Department] received [a donation / donations] in the amount of $[amount]',
        'pursuant to Town Law, § 64(8), the Town Board is expressly authorized to accept a gift “. . . for any public use, upon such terms or conditions as may be prescribed by the grantor or donor and accepted by said town, and provide for the proper administration of the same”',
        'the Town Board finds the acceptance of these donations is in the best interest of the residents of the Town of Riverhead',
      ],
      resolved: [
        'the Town of Riverhead hereby accepts the generous [donation] of $[amount] to the Town of Riverhead [Department]',
        'the Town of Riverhead Financial Administrator hereby has the authority to place these funds into the [revenue account] for the revenue and the [expenditure account] for the expenditure',
      ],
      budget: { verb: 'establish', rows: [
        { code: 'A01-2705-000-00000-J', name: 'Gifts and Donations', from: null, to: null },
        { code: '', name: '', from: null, to: null },
      ] },
      copies: ['the Finance Department', 'the [Department]'],
    },
  },
  {
    id: 'transfer',
    label: 'Make or ratify a budget transfer',
    source: '2026-879, Ratifies Highway Department Budget Transfer for Emergency Storm Repairs (October 6, 2026)',
    draft: {
      title: '[Ratifies / Authorizes] [Department] Budget Transfer for [Purpose]',
      whereas: [
        '[what happened, or what the money is needed for]',
        'the [Department] has funds available in [its fund balance / the account named below] to cover the estimated costs of [purpose]',
      ],
      resolved: [],
      budget: { verb: 'ratify', rows: [
        { code: '', name: '', from: null, to: null },
        { code: '', name: '', from: null, to: null },
      ] },
      copies: ['the Finance Department', 'the [Department]'],
    },
  },
  {
    id: 'appointment',
    label: 'Appoint an employee',
    source: '2026-891, Appoints an Accountant (October 6, 2026)',
    draft: {
      title: 'Appoints a [Title] to the [Department]',
      whereas: [
        'due to [the reason] there is a vacancy in the [Department] for the position of [Title]',
        'the Suffolk County Department of Civil Service had certified a list for the title of [Title], List #[number], the list was duly canvased in accordance with civil service regulations, interviews were conducted, and as a result, a recommendation of a suitable candidate has been made by the Personnel Committee of [name]',
      ],
      resolved: [
        'pending the results of a successfully completed background investigation, this Town Board hereby appoints [name] to the position of [Title] effective [date] and sets [their] salary at a rate of pay as found on Group [group], Step [step] of the [CSEA Administrative] Salary Schedule which is $[amount] per annum',
      ],
      budget: null,
      copies: ['payroll'],
    },
  },
  {
    id: 'agreement',
    label: 'Authorize an agreement',
    source: '2026-908, Authorizes Professional Services Agreement Between Town of Riverhead and Intellishift (October 6, 2026)',
    draft: {
      title: 'Authorizes [Professional Services Agreement] Between Town of Riverhead and [Company] for [Service]',
      whereas: [
        '[the background, such as the earlier resolution that authorized this service and when it expires]',
        '[how the provider was chosen], and based upon same, it is recommended that the Town enter into a professional services agreement with [Company]',
      ],
      resolved: [
        'the Town Board authorizes the Supervisor to execute a professional services agreement with [Company] for [Service] in substantially the same form as the agreement attached',
      ],
      budget: null,
      copies: ['the Office of the Town Attorney'],
    },
  },
]

export function fromTemplate(t: Template, year: number): Draft {
  return {
    year,
    number: '',
    mover: '',
    seconder: '',
    title: t.draft.title,
    whereas: [...t.draft.whereas],
    resolved: [...t.draft.resolved],
    budget: t.draft.budget ? { verb: t.draft.budget.verb, rows: t.draft.budget.rows.map((r) => ({ ...r })) } : null,
    copies: [...t.draft.copies],
  }
}
