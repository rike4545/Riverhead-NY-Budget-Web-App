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
        for (const key of ['r', 'o', 'g']) if (!finite(row[key])) fail(path, `${at}.${key} must be a finite amount`)
        for (const key of ['d', 't', 'c', 'u']) if (typeof row[key] !== 'string') fail(path, `${at}.${key} must be a string, including when unknown`)
        if (row.f !== undefined && (typeof row.f !== 'string' || !/^\d{6}$/.test(row.f))) fail(path, `${at}.f must preserve a six-digit payroll file number as text`)
        if (row.k !== undefined && (!Array.isArray(row.k) || row.k.length !== 5 || !row.k.every(finite))) fail(path, `${at}.k must be five finite other-pay components`)
        // Only the Town's payroll file number is a reliable unique key.
        // Older rows can lack it; names alone are not safe identifiers.
        if (row.f !== undefined) {
          const identity = `${row.y}|${row.f}`
          if (seen.has(identity)) fail(path, `duplicate year/payroll-file key ${identity}`)
          seen.add(identity)
        }
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


// Sitewide metadata: freshness and dataset counts are part of the published contract.
{
  const path = 'public/data/meta.json'
  const data = read(path)
  if (object(data)) {
    if (!text(data.generatedAt) || !Number.isFinite(Date.parse(data.generatedAt))) fail(path, 'generatedAt must be a parseable timestamp')
    if (typeof data.dataVersion !== 'string' || !/^[a-f0-9]{16}$/.test(data.dataVersion)) fail(path, 'dataVersion must be a 16-character hexadecimal release fingerprint')
    if (!object(data.datasets) || !Number.isInteger(data.datasets.searchEntries) || data.datasets.searchEntries < 1) fail(path, 'datasets must include a positive searchEntries count')
    if (!object(data.datasetDetails) || Object.keys(data.datasetDetails).length < 5) fail(path, 'datasetDetails must retain the published source/freshness inventory')
    else for (const [key, detail] of Object.entries(data.datasetDetails)) {
      if (!object(detail) || !text(detail.label) || !text(detail.status) || !text(detail.cadence) || !text(detail.freshnessNote)) fail(path, `datasetDetails.${key} is missing its label, status, cadence or freshness explanation`)
      if (!object(detail.freshnessPolicy) || !text(detail.freshnessPolicy.mode)) fail(path, `datasetDetails.${key} is missing its freshness policy`)
      if (detail.sourceDate !== undefined && !date(detail.sourceDate)) fail(path, `datasetDetails.${key}.sourceDate must be YYYY-MM-DD`)
    }
  }
}

// 2027 account-line model: catch a partial parse, duplicate account, or broken arithmetic.
{
  const path = 'public/data/budget-2027-lines.json'
  const data = read(path)
  if (object(data)) {
    if (!Array.isArray(data.lines) || data.lines.length < 500) fail(path, `lines contains ${data.lines?.length ?? 0} rows; expected at least 500`)
    else {
      const accounts = new Set()
      for (let i = 0; i < data.lines.length; i++) {
        const row = data.lines[i]
        const at = `lines[${i}]`
        if (!object(row)) { fail(path, `${at} must be an object`); continue }
        for (const key of ['fundCode', 'fund', 'dept', 'account', 'name', 'category']) if (!text(row[key])) fail(path, `${at}.${key} must be non-empty text`)
        if (text(row.account)) {
          if (accounts.has(row.account)) fail(path, `duplicate account line ${row.account}`)
          accounts.add(row.account)
        }
        for (const key of ['v2026', 'v2027', 'delta', 'rate']) if (!finite(row[key])) fail(path, `${at}.${key} must be a finite number`)
        if (row.v2025 !== null && row.v2025 !== undefined && !finite(row.v2025)) fail(path, `${at}.v2025 must be a finite amount or null when no historical line exists`)
        if (row.pct !== null && row.pct !== undefined && !finite(row.pct)) fail(path, `${at}.pct must be a finite percentage or null when the prior amount is zero`)
        if (['v2026', 'v2027', 'delta'].every((key) => finite(row[key]))) {
          if (Math.abs((row.v2027 - row.v2026) - row.delta) > 0.02) fail(path, `${at}.delta does not equal v2027 minus v2026`)
          if (finite(row.pct) && row.v2026 !== 0 && Math.abs(row.pct - (row.delta / row.v2026) * 100) > 0.11) fail(path, `${at}.pct does not agree with the rounded change from v2026 to v2027`)
          if (row.v2026 === 0 && row.pct !== null) fail(path, `${at}.pct must be null when the prior-year amount is zero`)
        }
      }
    }
  }
}

// Annual Financial Report: validate the year axis, source trail and fund-level shapes.
{
  const path = 'public/data/afr/2025.json'
  const data = read(path)
  if (object(data)) {
    if (!object(data.source) || !text(data.source.title) || !https(data.source.url)) fail(path, 'source must include a title and HTTPS URL')
    if (data.fiscalYear !== 2025 || !Array.isArray(data.years) || data.years.length !== 3 || data.years[0] !== 2025 || data.years[1] !== 2024 || data.years[2] !== 2023) fail(path, 'fiscalYear/years must describe the published 2025, 2024 and 2023 comparison')
    if (!Array.isArray(data.funds) || data.funds.length < 10) fail(path, `funds contains ${data.funds?.length ?? 0} records; expected at least 10`)
    else {
      const codes = new Set()
      for (let i = 0; i < data.funds.length; i++) {
        const fund = data.funds[i]
        const at = `funds[${i}]`
        if (!object(fund) || !text(fund.code) || !text(fund.name)) { fail(path, `${at} needs a fund code and name`); continue }
        if (codes.has(fund.code)) fail(path, `duplicate fund code ${fund.code}`)
        codes.add(fund.code)
        for (const key of ['revenues', 'expenditures', 'surplus', 'fundBalance']) {
          if (key === 'fundBalance' && fund[key] === null) continue
          if (!object(fund[key])) { fail(path, `${at}.${key} must be an object`); continue }
          for (const year of data.years ?? []) if (!finite(fund[key][String(year)])) fail(path, `${at}.${key}[${year}] must be a finite amount`)
        }
        if (Array.isArray(fund.fundBalanceClasses)) for (const row of fund.fundBalanceClasses) {
          if (!object(row) || !text(row.class) || !object(row.values)) fail(path, `${at} contains a malformed fund-balance class`)
          else for (const year of data.years ?? []) if (!finite(row.values[String(year)])) fail(path, `${at} fund-balance class ${row.class} is missing ${year}`)
        }
      }
    }
  }
}

// Tax-bill estimator inputs: prevent a blank or malformed rate table reaching the UI.
{
  const path = 'public/data/tax-bill.json'
  const data = read(path)
  if (object(data)) {
    if (!text(data.title) || !(Number.isInteger(data.asOf) || (typeof data.asOf === 'string' && /^\d{4}$/.test(data.asOf)))) fail(path, 'title and four-digit asOf year are required')
    if (!object(data.rateSource) || !text(data.rateSource.title) || !https(data.rateSource.url)) fail(path, 'rateSource must identify an HTTPS official source')
    for (const year of [2025, 2026]) {
      const rates = data[`rates${year}`]
      if (!object(rates)) { fail(path, `rates${year} must be an object`); continue }
      for (const key of ['generalFund', 'highway', 'streetLighting', 'totalTownWide']) if (!finite(rates[key]) || rates[key] < 0) fail(path, `rates${year}.${key} must be a non-negative finite rate`)
      if (['generalFund', 'highway', 'streetLighting', 'totalTownWide'].every((key) => finite(rates[key])) &&
          Math.abs(rates.generalFund + rates.highway + rates.streetLighting - rates.totalTownWide) > 0.002) {
        fail(path, `rates${year}.totalTownWide does not equal the three published component rates`)
      }
    }
    if (!object(data.equalization) || !finite(data.equalization.residentialAssessmentRatio) || data.equalization.residentialAssessmentRatio <= 0 || data.equalization.residentialAssessmentRatio > 100) fail(path, 'equalization must contain a plausible residential assessment ratio')
  }
}

// Search shards: declared counts must add up to the index total.
{
  const path = 'public/data/search/manifest.json'
  const data = read(path)
  if (object(data)) {
    if (!Number.isInteger(data.version) || data.version < 1) fail(path, 'version must be a positive integer')
    if (!object(data.shards) || Object.keys(data.shards).length < 3) fail(path, 'shards must contain the published search collections')
    else {
      let count = 0
      for (const [key, shard] of Object.entries(data.shards)) {
        if (!object(shard) || !safePath(shard.url) || !Number.isInteger(shard.count) || shard.count < 0 || !Number.isInteger(shard.bytes) || shard.bytes < 0 || typeof shard.sha256 !== 'string' || !/^[a-f0-9]{16}$/.test(shard.sha256)) {
          fail(path, `shards.${key} has an invalid URL, count, byte size or fingerprint`)
        } else count += shard.count
      }
      if (!Number.isInteger(data.total) || count !== data.total) fail(path, `total says ${data.total}; shard counts add up to ${count}`)
      const meta = read('public/data/meta.json')
      if (object(meta) && meta.datasets?.searchEntries !== data.total) fail(path, `meta searchEntries (${meta.datasets?.searchEntries}) does not match shard total (${data.total})`)
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
  console.log(`Data contracts passed: ${payroll.count.toLocaleString()} payroll records; ${meetings.recent.length} completed and ${meetings.meetings.length} upcoming meetings; ${manifest.files.length} native-shared datasets; budget lines, AFR, tax rates, search shards and freshness metadata validated.`)
}
