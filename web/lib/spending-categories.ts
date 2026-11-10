// Recurring costs by category, from the Budget Supplements, for /outliers/.
//
// Outlier Watch flags funds, and /budget-accuracy/ flags single lines. This
// puts the lines back into the kinds of cost they are (electricity, fuel,
// supplies...) and follows each category through every year the Supplements
// carry: actual spending (2018 on), each adopted budget (2019 on), spending
// through June 30 of the current year, and the next year's proposal. It says
// whether a flagged line is part of a pattern or a single event.
//
// A category is a set of object codes, the fourth part of an account number
// (A01-1-1620-472-000-00000 is Town Hall, object 472, electricity), so a line
// is counted by what the Town coded it as, not by its name.
//
// No JSON imports: the page passes the lines in, so
// scripts/verify-spending-categories.mjs runs the same arithmetic.

export const CATEGORY_SOURCE = {
  title: '2027 Budget Supplement (PDF)',
  url: 'https://www.townofriverheadny.gov/DocumentCenter/View/3929/2027-Budget-Supplement-PDF',
  ytdThrough: 'June 30',
} as const

export type CostKind = 'fixed' | 'variable' | 'semi-variable' | 'mixed' | 'catch-all'
/**
 * kind, drivers and control are budgeting terms (what makes the cost move,
 * and what the Town can change), not how the Town's books classify it: in
 * governmental accounting each line is an expenditure of its fund, by
 * function and object, under the State Comptroller's chart of accounts.
 */
export type Category = { id: string; label: string; objects: string[]; what: string; kind: CostKind; drivers: string; control: string }

export const CATEGORIES: Category[] = [
  { id: 'electricity', label: 'Electricity', objects: ['472'], what: 'Power for Town buildings, the water and sewer plants, pump stations and street lights.',
    kind: 'semi-variable', drivers: 'a monthly service charge, plus the power used, which rises with the water pumped, the sewage treated, the buildings open and the street lights lit, times the utility’s rate.',
    control: 'The rate is set by the utility and its regulators, not the Town. How much power is used is the Town’s to manage: equipment, buildings and lighting.' },
  { id: 'heating', label: 'Heating fuel and gas', objects: ['473'], what: 'Heating oil and natural gas for Town buildings and plants.',
    kind: 'semi-variable', drivers: 'mostly the weather (how cold the winter is), times the price of oil or gas, with a smaller steady base for the plants.',
    control: 'The price and the weather are outside the Town’s control; insulation, boilers and thermostats are within it.' },
  { id: 'vehicle-fuel', label: 'Vehicle gasoline and diesel', objects: ['426'], what: 'Fuel for police cars, highway trucks, ambulances and other Town vehicles.',
    kind: 'variable', drivers: 'gallons used (the size of the fleet, miles driven, storms) times the price per gallon.',
    control: 'The price is not the Town’s to set; the size of the fleet, the vehicles bought and how they are used are.' },
  { id: 'supplies', label: 'Supplies', objects: ['415', '416', '417', '418', '419', '424'], what: 'Office, program, computer and operating supplies, including the water and sewer plants’ chemicals.',
    kind: 'mixed', drivers: 'the plants’ chemicals vary with the water and sewage treated and the treatment rules; office and program supplies stay close to the same each year.',
    control: 'Largely within departments’ control, except chemicals the treatment standards require.' },
  { id: 'postage', label: 'Postage', objects: ['421'], what: 'Mailing, including tax bills and water bills.',
    kind: 'fixed', drivers: 'mostly the same mailings each year to the same property owners and water customers, so it moves mainly when postal rates rise.',
    control: 'Postal rates are set by the Postal Service; the number of mailings, and moving bills to email, are the Town’s choice.' },
  { id: 'miscellaneous', label: 'Miscellaneous', objects: ['490'], what: 'Costs the Town codes as miscellaneous, including bank fees.',
    kind: 'catch-all', drivers: 'whatever the Town codes as miscellaneous, so it has no single driver; a large entry here is a reason to ask what it was.',
    control: 'Within the Town’s control, case by case.' },
  { id: 'cleaning-allowance', label: 'Cleaning allowance', objects: ['123'], what: 'The yearly clothing-cleaning payment union contracts give employees, mostly police officers. It is pay, coded as Personal Services.',
    kind: 'fixed', drivers: 'an amount per employee set in each union contract, so the total moves with the number of eligible employees and with each new contract.',
    control: 'Not controllable during a contract; it is set when the Town negotiates the next one.' },
]

export type SupplementLine = {
  account: string
  name: string
  page: number
  actual: Record<string, number>
  adopted: Record<string, number>
  ytd: Record<string, number>
  proposed: number | null
}

export type Flag = { account: string; flag: string }

const objectOf = (account: string) => account.split('-')[3]
const sumBy = (ls: SupplementLine[], f: (l: SupplementLine) => number) => ls.reduce((s, l) => s + f(l), 0)

/** One line-year that is far out of line with its budget: at least ten times it and at least $250,000. */
const isOneOff = (actual: number, budget: number) => actual >= 250_000 && actual >= 10 * Math.max(budget, 1)

export function spendingCategories(accounts: SupplementLine[], flags: Flag[]) {
  const actualYears = Array.from(new Set(accounts.flatMap((l) => Object.keys(l.actual).map(Number)))).sort((a, b) => a - b)
  const lastActual = actualYears[actualYears.length - 1]
  const thisYear = lastActual + 1
  // Years with both a budget and an actual: the adopted budgets start a year after the actuals.
  const compared = actualYears.filter((y) => accounts.some((l) => l.adopted[y] != null))

  return CATEGORIES.map((c) => {
    const ls = accounts.filter((l) => c.objects.includes(objectOf(l.account)))
    const oneOffs = ls.flatMap((l) => compared
      .filter((y) => isOneOff(l.actual[y] ?? 0, l.adopted[y] ?? 0))
      .map((y) => ({ account: l.account, name: l.name, page: l.page, year: y, actual: l.actual[y], budget: l.adopted[y] ?? 0 })))
    const years = compared.map((y) => {
      const budget = sumBy(ls, (l) => l.adopted[y] ?? 0)
      const actual = sumBy(ls, (l) => l.actual[y] ?? 0)
      const excluded = oneOffs.filter((o) => o.year === y).reduce((s, o) => s + o.actual, 0)
      return { year: y, budget, actual, gap: actual - budget, usual: actual - excluded }
    })
    const budgetNow = sumBy(ls, (l) => l.adopted[thisYear] ?? 0)
    const ytdNow = sumBy(ls, (l) => l.ytd[thisYear] ?? 0)
    const ytdThen = sumBy(ls, (l) => l.ytd[lastActual] ?? 0)
    const lastYear = years[years.length - 1]
    // The share of last year's spending that came by June 30, applied to this
    // year's first half: an estimate, not the Town's forecast. Null when
    // nothing is spent by June 30 (a payment made later in the year).
    // Only where that share has been steady: within 15 points over the last
    // four years. Where the timing swings, a projection would mislead.
    const shares = years.slice(-4).map((y) => {
      const ytd = sumBy(ls, (l) => l.ytd[y.year] ?? 0)
      return y.usual > 0 && ytd > 0 ? ytd / y.usual : null
    })
    const steady = shares.every((x) => x !== null) && Math.max(...(shares as number[])) - Math.min(...(shares as number[])) <= 0.15
    const share = ytdThen > 0 && lastYear.usual > 0 ? ytdThen / lastYear.usual : null
    const pace = share && steady ? ytdNow / share : null
    // A range for the year from the highest and lowest recent shares, shown
    // for every category with June 30 figures, steady or not.
    const known = shares.filter((x): x is number => x !== null && x > 0)
    const range = ytdNow > 0 && known.length === shares.length && known.length > 0
      ? { low: ytdNow / Math.max(...known), high: ytdNow / Math.min(...known), minShare: Math.min(...known), maxShare: Math.max(...known) }
      : null
    const first = years[0]
    const flagged = flags.filter((f) => ls.some((l) => l.account === f.account))
    // Every account in the category with any budget or spending since the
    // first compared year, largest first, each with its own history.
    const active = ls.filter((l) => compared.some((y) => (l.actual[y] ?? 0) !== 0 || (l.adopted[y] ?? 0) !== 0) || (l.adopted[thisYear] ?? 0) !== 0 || (l.ytd[thisYear] ?? 0) !== 0 || (l.proposed ?? 0) !== 0)
    const all = [...active]
      .sort((a, b) => ((b.actual[lastActual] ?? 0) + (b.adopted[thisYear] ?? 0)) - ((a.actual[lastActual] ?? 0) + (a.adopted[thisYear] ?? 0)))
      .map((l) => {
        const withBudget = compared.filter((y) => (l.adopted[y] ?? 0) > 0)
        return {
          account: l.account, townName: l.name, page: l.page,
          actuals: actualYears.map((y) => l.actual[y] ?? null),
          last: l.actual[lastActual] ?? 0, budgetLast: l.adopted[lastActual] ?? 0,
          budgetNow: l.adopted[thisYear] ?? 0, ytdNow: l.ytd[thisYear] ?? 0, proposed: l.proposed ?? 0,
          /** Years this account had a budget, and how many of them it spent more than budgeted. */
          yearsBudgeted: withBudget.length,
          yearsOver: withBudget.filter((y) => (l.actual[y] ?? 0) > l.adopted[y]).length,
          /** Years it spent money with no budget at all. */
          yearsUnbudgeted: compared.filter((y) => (l.adopted[y] ?? 0) === 0 && (l.actual[y] ?? 0) > 0).length,
        }
      })
    const top = all.slice(0, 4)
    return {
      ...c,
      lines: ls.length,
      years,
      actualYears,
      lastActual,
      thisYear,
      budgetNow,
      ytdNow,
      ytdThen,
      ytdChange: ytdThen > 0 ? ytdNow / ytdThen - 1 : null,
      pace,
      /** The year's likely range from the recent June 30 shares; null without them. */
      range,
      /** Share of each recent year's spending that came by June 30. */
      shares,
      proposed: sumBy(ls, (l) => l.proposed ?? 0),
      yearsUnder: years.filter((y) => y.usual < y.budget).length,
      yearsOver: years.filter((y) => y.usual > y.budget).length,
      /** Usual spending (without one-off entries), first compared year to last. */
      spendGrowth: first.usual > 0 ? lastYear.usual / first.usual - 1 : null,
      budgetGrowth: first.budget > 0 ? budgetNow / first.budget - 1 : null,
      /** Average yearly gap between budget and usual spending over the last five years; positive means budgeted above spending. */
      avgCushion: years.slice(-5).reduce((s, y) => s + (y.budget - y.usual), 0) / Math.min(5, years.length),
      oneOffs,
      flagged,
      top,
      all,
      /** Accounts with no budget or spending in any year shown. */
      inactive: ls.length - active.length,
    }
  })
}

export type CategoryResult = ReturnType<typeof spendingCategories>[number]
