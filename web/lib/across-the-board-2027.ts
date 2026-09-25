// Illustration: what a flat "every department cut 2.5%" directive would yield,
// computed from every line of the newest Budget Supplement (the Tentative the
// Board is considering). The honest point of this view is that an
// across-the-board percentage is blunt: most of the budget is personnel and
// mandated cost (pension, debt, insurance) that can't be trimmed by memo, so
// the realistic yield is far below "2.5% of everything."
//
// Computed, not typed in. The earlier hand-entered version grouped funds under
// the wrong names (its "Ambulance" row was the Community Preservation Fund, the
// docking facility and the business improvement district).

import { budgetYear, lines, total, usd } from './supplement'

const CUT = 0.025
const GAP = 936_727 // modeled 2027 automatic payroll-pressure gap (spending-reduction-2027.ts)

const exp = lines((l) => l.kind === 'expenditure')
const tentative = (rows: typeof exp) => total(rows, 'tentative')
const controllable = exp.filter((l) => l.control === 'controllable')

const GROUPS: { fund: string; codes: string[] }[] = [
  { fund: 'General Fund', codes: ['A01'] },
  { fund: 'Water District', codes: ['EW1'] },
  { fund: 'Riverhead Sewer District', codes: ['ES1'] },
  { fund: 'Highway Fund', codes: ['DA1'] },
  { fund: 'Refuse and Garbage District', codes: ['SR1'] },
  { fund: 'Community Preservation Fund', codes: ['CM4'] },
  { fund: 'Debt Service Fund', codes: ['V01'] },
  { fund: 'Riverhead Scavenger Waste', codes: ['ES5'] },
  { fund: 'Ambulance District', codes: ['SM1'] },
  { fund: 'Calverton Sewer District', codes: ['ES3'] },
  { fund: 'Street Lighting District', codes: ['SL1'] },
]
const named = new Set(GROUPS.flatMap((g) => g.codes))

const all = tentative(exp)
const generalFund = tentative(exp.filter((l) => l.fund === 'A01'))
const notMandated = tentative(exp.filter((l) => l.control !== 'mandated'))
const controllableTotal = tentative(controllable)
const fixedShare = 1 - controllableTotal / all
const gfCut = generalFund * CUT
const controllableCut = controllableTotal * CUT

export const acrossTheBoard2027 = {
  year: budgetYear,
  cutPercent: CUT,
  gapToClose: GAP,

  // Applying 2.5% to different bases (all funds, from the Supplement).
  bases: [
    { label: '2.5% of every expenditure line, all funds', base: all, note: 'Blunt maximum — treats salaries, pensions, and debt service as if they could be shaved 2.5% by directive. They can’t.' },
    { label: '2.5% of General Fund appropriations', base: generalFund, note: 'The usual target of a “everyone cut 2.5%” memo.' },
    { label: '2.5% of controllable + personnel (no mandated)', base: notMandated, note: 'Excludes pension, debt, insurance, payroll taxes — costs a directive can’t change.' },
    { label: '2.5% of controllable lines only', base: controllableTotal, note: 'The genuinely discretionary base — supplies, contracts, equipment, professional services.' },
  ],

  // Per fund: the Tentative and the 2.5% slice, plus the slice of just that
  // fund's controllable lines. The small funds are grouped at the end.
  byFund: [
    ...GROUPS.map((g) => ({
      fund: g.fund,
      tentative: tentative(exp.filter((l) => g.codes.includes(l.fund))),
      controllable: tentative(controllable.filter((l) => g.codes.includes(l.fund))),
    })),
    {
      fund: 'All other funds',
      tentative: tentative(exp.filter((l) => !named.has(l.fund))),
      controllable: tentative(controllable.filter((l) => !named.has(l.fund))),
    },
  ].sort((a, b) => b.tentative - a.tentative),

  takeaway:
    `A flat 2.5% General Fund cut pencils out to about ${usd(gfCut)} — ${(gfCut / GAP).toFixed(1)} times the ${usd(GAP)} payroll-pressure gap. ` +
    `But about ${Math.round(fixedShare * 100)}% of spending is personnel and mandated cost that a directive can’t touch; trim only the genuinely controllable lines and 2.5% yields about ${usd(controllableCut)}` +
    (controllableCut < GAP ? ` — short of the gap on its own.` : `, which covers the gap only if every controllable line in every fund is cut.`) +
    ` That’s why the targeted, line-item package above (which reaches the controllable over-budget lines specifically) does more than a blunt across-the-board percentage.`,
}
