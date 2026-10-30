// Zod contracts for canonical ETL outputs and the web-to-native data manifest.
// These checks validate without coercing or rewriting source data: malformed
// ETL output should stop the release, not be silently repaired in the browser.
import { z } from 'zod'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const root = process.cwd()
const failures = []
const fail = (where, message) => failures.push(`${where}: ${message}`)
const read = (path) => {
  try { return JSON.parse(readFileSync(resolve(root, path), 'utf8')) }
  catch (error) { fail(path, `cannot read valid JSON (${error.message})`); return null }
}
const safePath = z.string().min(1).refine(
  (value) => !value.split('/').includes('..') && !value.startsWith('/'),
  'must be a safe relative path',
)
const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => {
  const [year, month, day] = value.split('-').map(Number)
  const parsed = new Date(Date.UTC(year, month - 1, day))
  return parsed.getUTCFullYear() === year && parsed.getUTCMonth() === month - 1 && parsed.getUTCDate() === day
}, 'must be a real YYYY-MM-DD calendar date')
const httpsUrl = z.string().url().refine((value) => value.startsWith('https://'), 'must use HTTPS')
const sourceSchema = z.object({
  title: z.string().min(1),
  url: httpsUrl,
}).passthrough()

// Payroll: compact, shared records consumed by both native applications.
const payrollRecordSchema = z.object({
  y: z.number().int().min(2018).max(2025),
  n: z.string().min(1),
  r: z.number().finite(),
  o: z.number().finite(),
  g: z.number().finite(),
  d: z.string(),
  t: z.string(),
  c: z.string(),
  u: z.string(),
  f: z.string().regex(/^\d{6}$/).nullable().optional(),
  k: z.array(z.number().finite()).length(5).optional(),
}).passthrough()

const payrollSchema = z.object({
  source: sourceSchema,
  fields: z.record(z.string(), z.string().min(1)),
  count: z.number().int().nonnegative(),
  records: z.array(payrollRecordSchema),
  unionLabels: z.record(z.string(), z.string().min(1)),
}).passthrough().superRefine((data, ctx) => {
  if (data.count !== data.records.length) {
    ctx.addIssue({ code: 'custom', path: ['count'], message: `declares ${data.count}; records contain ${data.records.length}` })
  }
  // Only the Town's payroll file number is a reliable unique key. Older rows
  // can lack it; names alone are not safe identifiers.
  const seen = new Set()
  data.records.forEach((row, index) => {
    if (!row.f) return
    const identity = `${row.y}|${row.f}`
    if (seen.has(identity)) {
      ctx.addIssue({ code: 'custom', path: ['records', index, 'f'], message: `duplicate year/payroll-file key ${identity}` })
    }
    seen.add(identity)
  })
})

// Meeting timeline: completed and upcoming collections remain distinct and traceable.
const docketItemSchema = z.object({
  seq: z.number().int(),
  number: z.string().min(1),
  title: z.string().min(1),
}).passthrough()

const meetingSchema = z.object({
  date: dateString,
  slug: z.string().min(1),
  type: z.string().min(1),
  startDateTime: z.string().refine((value) => Number.isFinite(Date.parse(value)), 'must be a parseable date/time'),
  agendaPublished: z.boolean(),
  docket: z.array(docketItemSchema),
  hearings: z.array(z.string().min(1)),
}).passthrough().superRefine((meeting, ctx) => {
  if (meeting.slug !== meeting.date) {
    ctx.addIssue({ code: 'custom', path: ['slug'], message: 'must equal the stable YYYY-MM-DD meeting date' })
  }
})

const meetingsSchema = z.object({
  source: sourceSchema,
  scheduleSource: sourceSchema,
  generatedAt: dateString,
  officialScheduleDates: z.array(dateString),
  recent: z.array(meetingSchema),
  meetings: z.array(meetingSchema),
}).passthrough().superRefine((data, ctx) => {
  const dates = new Set()
  data.officialScheduleDates.forEach((date, index) => {
    if (dates.has(date)) ctx.addIssue({ code: 'custom', path: ['officialScheduleDates', index], message: `duplicate date ${date}` })
    dates.add(date)
  })
  const slugs = new Set()
  for (const collection of ['recent', 'meetings']) {
    data[collection].forEach((meeting, index) => {
      if (slugs.has(meeting.slug)) {
        ctx.addIssue({ code: 'custom', path: [collection, index, 'slug'], message: `duplicate meeting slug ${meeting.slug}` })
      }
      slugs.add(meeting.slug)
    })
  }
})

// Shared-data manifest: the web output is canonical; native mappings and hashes
// must be explicit so renamed or changed datasets cannot drift silently.
const consumerSchema = z.object({
  repo: z.string().min(1),
  root: safePath,
}).passthrough()

const fileMappingSchema = z.object({
  id: z.string().min(1),
  web: safePath,
  ios: safePath.nullable().optional(),
  android: safePath.nullable().optional(),
  sha256: z.string().regex(/^[a-f0-9]{64}$/),
}).passthrough().superRefine((entry, ctx) => {
  if (!entry.ios && !entry.android) {
    ctx.addIssue({ code: 'custom', message: 'must map to at least one native consumer' })
  }
})

const directoryMappingSchema = z.object({
  web: safePath,
  ios: safePath.nullable().optional(),
  android: safePath.nullable().optional(),
  pattern: z.string().min(1),
  note: z.string().optional(),
}).passthrough().superRefine((entry, ctx) => {
  if (!entry.ios && !entry.android) {
    ctx.addIssue({ code: 'custom', message: 'must map to at least one native consumer' })
  }
  if (entry.pattern.includes('/') || entry.pattern.includes('..')) {
    ctx.addIssue({ code: 'custom', path: ['pattern'], message: 'must be a filename pattern, not a path' })
  }
})

const manifestSchema = z.object({
  canonicalRoot: z.literal('web/public/data'),
  consumers: z.object({
    ios: consumerSchema,
    android: consumerSchema,
  }),
  files: z.array(fileMappingSchema).min(1),
  directories: z.array(directoryMappingSchema).min(1),
}).passthrough().superRefine((manifest, ctx) => {
  const ids = new Set()
  const paths = new Set()
  manifest.files.forEach((entry, index) => {
    if (ids.has(entry.id)) ctx.addIssue({ code: 'custom', path: ['files', index, 'id'], message: `duplicate dataset id ${entry.id}` })
    if (paths.has(entry.web)) ctx.addIssue({ code: 'custom', path: ['files', index, 'web'], message: `duplicate canonical dataset path ${entry.web}` })
    ids.add(entry.id)
    paths.add(entry.web)
  })
})

function validate(path, schema, data) {
  if (data === null) return null
  const result = schema.safeParse(data)
  if (!result.success) {
    for (const issue of result.error.issues) {
      const location = issue.path.length ? `.${issue.path.join('.')}` : ''
      fail(`${path}${location}`, issue.message)
    }
    return null
  }
  return result.data
}

const payroll = validate('public/data/payroll/records.json', payrollSchema, read('public/data/payroll/records.json'))
const meetings = validate('public/data/meetings/upcoming.json', meetingsSchema, read('public/data/meetings/upcoming.json'))
const manifest = validate('../shared-data/manifest.json', manifestSchema, read('../shared-data/manifest.json'))

if (failures.length) {
  for (const failure of failures) console.error(`DATA CONTRACT FAILED: ${failure}`)
  process.exitCode = 1
} else {
  console.log(`Zod data contracts passed: ${payroll.count.toLocaleString()} payroll records; ${meetings.recent.length} completed and ${meetings.meetings.length} upcoming meetings; ${manifest.files.length} native-shared datasets and ${manifest.directories.length} mirrored directories.`)
}
