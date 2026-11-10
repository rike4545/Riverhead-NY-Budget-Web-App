// Plain-English names for budget accounts, for residents.
//
// A Riverhead account number reads FUND-x-FUNCTION-OBJECT-...: the fund (A01
// is the General Fund), the function (3120 is Police) and the object, the
// kind of cost (472 is electricity). The Town's own line names abbreviate all
// three ("Scav Waste - Utl - Electricity"), so this maps the fund and function
// to a department and the object to what was bought. Where this site cannot
// tell what an abbreviation stands for, it keeps the Town's own words and says
// so rather than guess.

export const DEPARTMENTS: Record<string, string> = {
  'A01-1010': 'Town Board', 'A01-1110': 'Justice Court', 'A01-1220': 'Supervisor’s office', 'A01-1310': 'Accounting',
  'A01-1330': 'Tax Receiver', 'A01-1345': 'Purchasing', 'A01-1355': 'Assessor', 'A01-1410': 'Town Clerk', 'A01-1420': 'Town Attorney',
  'A01-1430': 'Personnel', 'A01-1440': 'Engineering', 'A01-1480': 'Public information', 'A01-1620': 'Town Hall',
  'A01-1623': 'Police and court building', 'A01-1625': 'Buildings and grounds', 'A01-1626': 'Calverton (former Grumman) buildings',
  'A01-1680': 'Information technology', 'A01-1690': 'Municipal garage', 'A01-1989': 'Other general government',
  'A01-3120': 'Police', 'A01-3122': 'Bay constable', 'A01-3125': 'Juvenile aid', 'A01-3126': 'Youth court', 'A01-3410': 'Fire Marshal',
  'A01-3620': 'Building inspection', 'A01-3625': 'Code enforcement', 'A01-3989': 'Anti-Bias Task Force', 'A01-4210': 'Narcotics Guidance Council', 'A01-4320': 'Mental health initiative', 'A01-5010': 'Highway administration',
  'A01-6772': 'Senior services', 'A01-7020': 'Recreation administration', 'A01-7110': 'Parks', 'A01-7140': 'Recreation center',
  'A01-7180': 'Beaches', 'A01-7310': 'Youth programs', 'A01-7315': 'Other youth programs', 'A01-7510': 'Historian',
  'A01-7520': 'Historic properties', 'A01-7989': 'Teen programs', 'A01-8020': 'Planning', 'A01-8160': 'Refuse and recycling',
  'A01-8686': 'Community development',
  'A04-3120': 'Police Athletic League', 'A04-3125': 'Police Athletic League, juvenile aid', 'A04-7311': 'Police Athletic League basketball',
  'A04-7312': 'Police Athletic League soccer', 'A04-7313': 'Police Athletic League travel soccer', 'A04-7314': 'Police Athletic League lacrosse',
  'A06-7020': 'Recreation programs, administration', 'A06-7110': 'Recreation programs, parks', 'A06-7310': 'Recreation programs, youth',
  'A06-7311': 'Recreation programs, basketball', 'A06-7315': 'Recreation programs, other youth', 'A06-7620': 'Recreation programs, adults',
  'A06-7625': 'Recreation programs, softball', 'A06-7626': 'Recreation programs, non-resident', 'A06-7627': 'Recreation programs, adaptive adult',
  'CM1-6410': 'Business Improvement District', 'CM2-7230': 'East Creek docking', 'CM4-1420': 'Community Preservation Fund, legal',
  'DA1-5110': 'Highway repairs', 'DA1-5130': 'Highway machinery', 'DA1-5140': 'Highway, miscellaneous', 'DA1-5142': 'Highway snow removal',
  'ES1-8110': 'Riverhead Sewer District, administration', 'ES1-8130': 'Riverhead Sewer District, treatment plant',
  'ES3-8130': 'Calverton Sewer District, treatment plant', 'ES5-8189': 'Scavenger waste plant',
  'EW1-8310': 'Water District, administration', 'EW1-8320': 'Water District, supply and treatment',
  'SL1-5182': 'Street lighting', 'SM1-4540': 'Ambulance District', 'SR1-8160': 'Refuse and Garbage District',
  'ST1-5650': 'Public Parking District', 'Z14-6980': 'Calverton Community Development Agency',
}

const OBJECTS: Record<string, string> = {
  '111': 'overtime', '123': 'clothing-cleaning allowance', '415': 'supplies', '416': 'office supplies', '417': 'program supplies',
  '418': 'computer supplies', '419': 'other supplies', '421': 'postage', '424': 'office supplies', '426': 'vehicle gasoline and diesel',
  '472': 'electricity', '473': 'heating', '490': 'miscellaneous',
}

/** Words in a Town line name that say more than the object code does. */
const DETAIL: [RegExp, string][] = [
  [/chlorine/i, 'chlorine and chemicals'], [/chemical/i, 'chemicals'], [/media exchange/i, 'filter media replacement'],
  [/bank fee/i, 'bank fees'], [/america 250/i, 'America 250 events'], [/station electric/i, 'pump station electricity'],
  [/first aid/i, 'first-aid supplies'], [/\blab\b/i, 'laboratory supplies'], [/plant suppl/i, 'plant supplies'], [/station fuel/i, 'pump station fuel'], [/plant fuel/i, 'plant fuel'],
  [/\bgas\b(?!oline| ?& ?diesel)/i, 'natural gas'], [/heating fuel|oil/i, 'heating oil'],
  [/non uniform ot|non-uniform/i, 'civilian overtime'], [/uniform ot|uniform overtime/i, 'sworn officers’ overtime'],
]

/** Segments of a Town line name that only restate the department or the object code. */
const GENERIC = /^(supplies|utl|utilities|fuel|electricity|electric|heat|gas|gasoline ?& ?diesel|gas ?& ?diesel|postage|miscellaneous|misc|office|program|computer|other|personal services|pers svcs.*|ot|overtime|non overtime)$/i

export function plainAccountName(account: string, townName: string): { name: string; known: boolean } {
  const [fund, , fn, obj] = account.split('-')
  const dept = DEPARTMENTS[`${fund}-${fn}`]
  const label = DETAIL.find(([re]) => re.test(townName))?.[1] ?? OBJECTS[obj] ?? 'other costs'
  // The Town's own words after the department, less what the label already says.
  const rest = townName.split(/\s+-\s*|-\s+/).slice(1).map((x) => x.trim()).filter((x) => x && !GENERIC.test(x))
  // Drop a part whose words the label already carries ("Lab Supplies" beside "laboratory supplies").
  const stems = label.toLowerCase().split(/[^a-z]+/).filter((w) => w.length > 3).map((w) => w.slice(0, 4))
  const repeats = (x: string) => x.toLowerCase().split(/[^a-z]+/).filter((w) => w.length > 2).some((w) => stems.includes(w.slice(0, 4)))
  const detail = rest.filter((x) => !repeats(x)).join(', ').replace(/&/g, 'and')
  if (!dept) return { name: `${townName} (the Town’s abbreviation)`, known: false }
  return { name: `${dept}: ${label}${detail ? ` (${detail})` : ''}`, known: true }
}

/** Just the department, for tables that already say what was bought. */
export function plainDepartment(account: string): string | null {
  const [fund, , fn] = account.split('-')
  return DEPARTMENTS[`${fund}-${fn}`] ?? null
}
