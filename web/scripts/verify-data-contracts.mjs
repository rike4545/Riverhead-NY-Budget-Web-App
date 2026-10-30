// Runtime contracts for canonical ETL outputs. These checks deliberately validate
// structure and invariants without rewriting or coercing source data: malformed
// source output should stop the release, not be silently repaired in the browser.
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const root = process.cwd()
const failures = []
const fail = (where, message) => failures.push(`${where}: ${message}`)
const read = (path) => {
  try { return JSON.parse(readFileSync(resolve(root, path), 'utf8')) }
  catch (error) { fail(path, `cannot read valid JSON (${error.message})`); return null }
}
const object = (value) => value !== null && typeof value === 'object' && !Array.isArray(value)
const text = (value) => typeof value === 'string' && value.trim().length > 0
const finite = (value) => typeof value === 'number' && Number.isFinite(value)
const date = (value) => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(`${value}T12:00:00Z`))
const https = (value) => typeof value === 'string' && value.startsWith('https://')
const safePath = (value) => text(value) && !value.split('/').includes('..') && !value.startsWith('/')

// Payroll: compact, shared records consumed by both native applications.
{
  const path = 'public/data/payroll/records.json'
  const data = read(path)
  if (object(data)) {
    if (!object(data.source) || !text(data.source.title) || !https(data.source.url)) fail(path, 'source must include a title and HTTPS URL')
    if (!object(data.fields) || !['y', 'n', 'r', 'o', 'g'].every((key) => text(data.fields[key]))) fail(path, 'field dictionary is missing required year, name, regular, overtime or gross-pay labels')
    if (!Array.isArray(data.records)) fail(path, 'records must be an array')
    else {
      if (!Number.isInteger(data.count) || data.count !== data.records.length) fail(path, `count says ${data.count}; records contain ${data.records.length}`)
      const seen = new Set()
      for (let i = 0; i < data.records.length; i++) {
        const row = data.records[i]
        const at = `records[${i}]`
        if (!object(row)) { fail(path, `${at} must be an object`); continue }
        if (!Number.isInteger(row.y) || row.y < 2018 || row.y > 2025) fail(path, `${at}.y must be a published year from 2018 through 2025`)
        if (!text(row.n)) fail(path, `${at}.n must contain an employee display name`)
        for (const key of ['r', 'o', 'g']) if (!finite(row[key]) || row[key] < 0) fail(path, `${at}.${key} must be a finite, non-negative amount`)
        for (const key of ['d', 't', 'c', 'u']) if (typeof row[key] !== 'string') fail(path, `${at}.${key} must be a string, including when unknown`)
        if (row.f !== undefined && (typeof row.f !== 'string' || !/^\d{6}$/.test(row.f))) fail(path, `${at}.f must preserve a six-digit payroll file number as text`)
        if (row.k !== undefined && (!Array.isArray(row.k) || row.k.length !== 5 || !row.k.every(finite))) fail(path, `${at}.k must be five finite other-pay components`)
        const identity = `${row.y}|${row.f ?? row.n}`
        if (seen.has(identity)) fail(path, `duplicate year/employee key ${identity}`)
        seen.add(identity)
      }
    }
    if (!object(data.unionLabels) || Object.values(data.unionLabels).some((label) => !text(label))) fail(path, 'unionLabels must map codes to non-empty labels')
  }
}

// Meeting timeline: completed and upcoming collections remain distinct and traceable.
{
  const path = 'public/data/meetings/upcoming.json'
  const data = read(path)
  if (object(data)) {
    for (const key of ['source', 'scheduleSource']) {
      if (!object(data[key]) || !text(data[key].title) || !https(data[key].url)) fail(path, `${key} must include a title and HTTPS source URL`)
    }
    if (!date(data.generatedAt)) fail(path, 'generatedAt must be a YYYY-MM-DD source-build date')
    if (!Array.isArray(data.officialScheduleDates) || data.officialScheduleDates.some((value) => !date(value))) fail(path, 'officialScheduleDates must contain valid calendar dates')
    const slugs = new Set()
    for (const collection of ['recent', 'meetings']) {
      if (!Array.isArray(data[collection])) { fail(path, `${collection} must be an array`); continue }
      for (let i = 0; i < data[collection].length; i++) {
        const meeting = data[collection][i]
        const at = `${collection}[${i}]`
        if (!object(meeting)) { fail(path, `${at} must be an object`); continue }
        if (!date(meeting.date) || meeting.slug !== meeting.date) fail(path, `${at} must use its YYYY-MM-DD date as its stable slug`)
        if (!text(meeting.type) || !text(meeting.startDateTime) || !Number.isFinite(Date.parse(meeting.startDateTime))) fail(path, `${at} needs a meeting type and parseable startDateTime`)
        if (slugs.has(meeting.slug)) fail(path, `duplicate meeting slug ${meeting.slug}`)
        slugs.add(meeting.slug)
        if (typeof meeting.agendaPublished !== 'boolean') fail(path, `${at}.agendaPublished must be boolean`)
        if (!Array.isArray(meeting.docket) || !Array.isArray(meeting.hearings)) fail(path, `${at} must contain docket and hearings arrays`)
        for (const item of meeting.docket ?? []) {
          if (!object(item) || !Number.isInteger(item.seq) || !text(item.number) || !text(item.title)) fail(path, `${at} contains a malformed docket item`)
        }
        if ((meeting.hearings ?? []).some((item) => !text(item))) fail(path, `${at}.hearings must contain non-empty text`)
      }
    }
    if (new Set(data.officialScheduleDates ?? []).size !== (data.officialScheduleDates ?? []).length) fail(path, 'officialScheduleDates contains duplicates')
  }
}

// Shared-data manifest: the web output is canonical; native mappings and hashes
// must be explicit so a renamed or changed dataset cannot drift silently.
{
  const path = '../shared-data/manifest.json'
  const data = read(path)
  if (object(data)) {
    if (data.canonicalRoot !== 'web/public/data') fail(path, 'canonicalRoot must point to web/public/data')
    for (const platform of ['ios', 'android']) {
      const consumer = data.consumers?.[platform]
      if (!object(consumer) || !text(consumer.repo) || !safePath(consumer.root)) fail(path, `consumers.${platform} needs a repository and safe destination root`)
    }
    if (!Array.isArray(data.files) || data.files.length === 0) fail(path, 'files must be a non-empty array')
    else {
      const ids = new Set()
      const paths = new Set()
      for (const entry of data.files) {
        if (!object(entry)) { fail(path, 'every files entry must be an object'); continue }
        if (!text(entry.id) || ids.has(entry.id)) fail(path, `missing or duplicate dataset id: ${entry.id}`)
        ids.add(entry.id)
        for (const key of ['web', 'ios', 'android']) if (!safePath(entry[key])) fail(path, `${entry.id ?? '(unknown)'} has an unsafe or missing ${key} path`)
        if (text(entry.web) && paths.has(entry.web)) fail(path, `duplicate canonical dataset path: ${entry.web}`)
        if (text(entry.web)) paths.add(entry.web)
        if (typeof entry.sha256 !== 'string' || !/^[a-f0-9]{64}$/.test(entry.sha256)) fail(path, `${entry.id ?? '(unknown)'} needs a 64-character SHA-256 digest`)
      }
    }
    if (!Array.isArray(data.directories)) fail(path, 'directories must be an array, even when empty')
    else for (const entry of data.directories) {
      if (!object(entry) || !['web', 'ios', 'android', 'pattern'].every((key) => text(entry[key]))) fail(path, 'each mirrored directory needs web/ios/android paths and a filename pattern')
      else for (const key of ['web', 'ios', 'android']) if (!safePath(entry[key])) fail(path, `directory mapping has an unsafe ${key} path`)
    }
  }
}

if (failures.length) {
  for (const failure of failures) console.error(`DATA CONTRACT FAILED: ${failure}`)
  process.exitCode = 1
} else {
  const payroll = read('public/data/payroll/records.json')
  const meetings = read('public/data/meetings/upcoming.json')
  const manifest = read('../shared-data/manifest.json')
  console.log(`Data contracts passed: ${payroll.count.toLocaleString()} payroll records; ${meetings.recent.length} completed and ${meetings.meetings.length} upcoming meetings; ${manifest.files.length} native-shared datasets and ${manifest.directories.length} mirrored directories.`)
}
