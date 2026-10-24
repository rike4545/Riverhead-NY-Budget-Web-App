// /records/ lists records the site could not find published, builds a Freedom
// of Information Law letter in the browser, and counts the legal deadlines.
// This checks lib/records-requests.ts and the built page:
//   - the State holidays and the business-day arithmetic, against dates worked
//     out by hand from General Construction Law §24;
//   - the letter carries every record chosen, the custom text, and the
//     five-day rule, and falls back to placeholders when fields are blank;
//   - the built page shows every record, every statute quotation, the Town's
//     policy quotation, and the line saying nothing typed is sent anywhere.

import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  DEADLINE_DAYS, LAW, RECORD_REQUESTS, TOWN_FOIL, addBusinessDays, addCalendarDays, buildLetter, isBusinessDay, nyHolidays,
} from '../lib/records-requests.ts'

const fail = (message) => { console.error(`RECORDS VERIFY FAILED: ${message}`); process.exitCode = 1 }
const eq = (got, want, what) => { if (got !== want) fail(`${what}: got ${got}, expected ${want}`) }

// Holidays, worked out by hand for 2026 and for a year with Sunday holidays (2022).
const h2026 = nyHolidays(2026)
for (const [date, name] of [
  ['2026-01-01', 'New Year’s Day'], ['2026-01-19', 'Martin Luther King, Jr. Day'], ['2026-02-12', 'Lincoln’s Birthday'],
  ['2026-02-16', 'Washington’s Birthday'], ['2026-05-25', 'Memorial Day'], ['2026-06-19', 'Juneteenth'],
  ['2026-07-04', 'Independence Day'], ['2026-09-07', 'Labor Day'], ['2026-10-12', 'Columbus Day'],
  ['2026-11-03', 'General Election Day'], ['2026-11-11', 'Veterans’ Day'], ['2026-11-26', 'Thanksgiving Day'],
  ['2026-12-25', 'Christmas Day'],
]) eq(h2026.get(date), name, `2026 holiday on ${date}`)
eq(h2026.size, 13, '2026 holiday count')
eq(nyHolidays(2022).get('2022-12-26'), 'Christmas Day', 'Christmas 2022, a Sunday, observed Monday')
eq(nyHolidays(2022).get('2022-06-20'), 'Juneteenth', 'Juneteenth 2022, a Sunday, observed Monday')
eq(nyHolidays(2027).get('2027-11-02'), 'General Election Day', '2027 Election Day')

eq(isBusinessDay('2026-10-23'), true, 'Friday, October 23, 2026')
eq(isBusinessDay('2026-10-24'), false, 'Saturday, October 24, 2026')
eq(isBusinessDay('2026-11-03'), false, 'Election Day 2026')

// Business days exclude the start day, weekends and holidays.
eq(addBusinessDays('2026-10-23', 5), '2026-10-30', 'five business days from Friday, October 23')
eq(addBusinessDays('2026-10-30', 5), '2026-11-09', 'five business days across Election Day')
eq(addBusinessDays('2026-11-20', 5), '2026-11-30', 'five business days across Thanksgiving')
eq(addBusinessDays('2026-12-21', 20), '2027-01-21', 'twenty business days across Christmas, New Year and MLK Day')
eq(addCalendarDays('2026-10-23', 30), '2026-11-22', 'thirty calendar days from October 23')
eq(addCalendarDays('2026-12-15', 30), '2027-01-14', 'thirty calendar days across the year end')

eq(DEADLINE_DAYS.respond, 5, 'the response deadline')
eq(DEADLINE_DAYS.outer, 20, 'the outer deadline')
eq(DEADLINE_DAYS.appealCalendar, 30, 'the appeal window')
eq(DEADLINE_DAYS.appealDecision, 10, 'the appeal decision deadline')

// The letter.
const ids = new Set()
for (const r of RECORD_REQUESTS) {
  if (ids.has(r.id)) fail(`duplicate record id ${r.id}`)
  ids.add(r.id)
  if (!r.sources.length) fail(`${r.id} has no source`)
  for (const s of r.sources) if (!s.url.startsWith('https://')) fail(`${r.id}: source ${s.url} is not https`)
}
const custom = 'All emails between two named offices in March 2026.'
const full = buildLetter(RECORD_REQUESTS, custom, { name: 'A Resident', email: 'resident@example.org', address: '1 Main Street', date: 'Friday, October 23, 2026' })
RECORD_REQUESTS.forEach((r, i) => { if (!full.includes(`${i + 1}. ${r.describe}`)) fail(`the letter does not list ${r.id} as item ${i + 1}`) })
if (!full.includes(`${RECORD_REQUESTS.length + 1}. ${custom}`)) fail('the letter does not list the custom record last')
for (const text of ['Records Access Officer', '4 West Second Street', 'Public Officers Law §89(3)(a)', 'five business days', 'A Resident', 'resident@example.org', '1 Main Street', 'Friday, October 23, 2026']) {
  if (!full.includes(text)) fail(`the letter is missing “${text}”`)
}
if (!TOWN_FOIL.submitTo.includes('4 West Second Street')) fail('the Town’s address in TOWN_FOIL no longer matches the letter')
const blank = buildLetter([RECORD_REQUESTS[0]], '   ', { name: '', email: '', address: '', date: '' })
for (const text of ['[Date]', '[Your name]', '[Email address]']) if (!blank.includes(text)) fail(`a blank letter is missing the placeholder ${text}`)
if (/\n2\. /.test(blank)) fail('whitespace-only custom text became a numbered item')

// The built page.
const built = join(process.cwd(), 'out', 'records', 'index.html')
if (!existsSync(built)) fail('out/records/index.html is missing; run the build first')
else {
  const decode = (s) => s.replace(/<!-- -->/g, '').replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&amp;/g, '&')
  const html = decode(readFileSync(built, 'utf8'))
  const must = [
    'Nothing you type is saved or sent anywhere',
    'not legal advice',
    TOWN_FOIL.online, TOWN_FOIL.appealPolicyText, TOWN_FOIL.copyFee, TOWN_FOIL.policy.url,
    ...Object.values(LAW).flatMap((l) => ('quote' in l ? [l.quote, l.cite] : [l.cite])),
    ...RECORD_REQUESTS.flatMap((r) => [r.title, r.describe]),
  ]
  for (const text of must) if (!html.includes(text)) fail(`the built page is missing “${text.slice(0, 80)}”`)
}

if (!process.exitCode) console.log(`records: ${RECORD_REQUESTS.length} requests, holidays, deadlines and the letter check out`)
