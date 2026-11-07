import DeltaBridge, { type BridgeStep } from '../charts/DeltaBridge'
import { stageDoc, budgetStages, TOWN_WIDE_FUNDS } from '../../lib/budget-stages'
import { money, signedMoney } from './format'

// The 2027 town-wide levy from the 2026 Adopted Budget, through the Tentative, to
// the Preliminary. Every figure is the Summary's own "Total Town Wide" levy or a
// fund's levy change between the two books. The build stops if the changes do not
// add up to the Preliminary, rather than draw a bridge that does not close.
export default function LevyBridge2027() {
  const adopted = stageDoc(2026, 'adopted')?.townWide
  const tent = stageDoc(2027, 'tentative')?.townWide
  const prelim = stageDoc(2027, 'preliminary')?.townWide
  if (!tent || !prelim) return null
  const base = adopted?.levy ?? tent.priorLevy
  if (adopted && adopted.levy !== tent.priorLevy) throw new Error('LevyBridge2027: 2026 adopted levy differs from the Tentative’s prior-year levy')
  const move = budgetStages.transitions.find((t) => t.year === 2027 && t.from === 'tentative' && t.to === 'preliminary')
  const changes = (move?.changed ?? []).filter((c) => (TOWN_WIDE_FUNDS as readonly string[]).includes(c.fund) && c.levyDelta !== 0)
  const closes = changes.reduce((n, c) => n + c.levyDelta, 0) === prelim.levy - tent.levy
  if (!closes) throw new Error('LevyBridge2027: fund levy changes do not add up to the Preliminary levy')
  const steps: BridgeStep[] = [
    { kind: 'total', label: '2027 Tentative', value: tent.levy, note: 'The Tentative Budget’s Summary.' },
    ...changes.map((c): BridgeStep => ({ kind: 'change', label: `${c.name} amendments`, delta: c.levyDelta, note: 'Oct. 20, 2026 amendments to the Preliminary.' })),
    { kind: 'total', label: '2027 Preliminary', value: prelim.levy, note: 'The Adopted Budget is not out yet; this bridge will add it.' },
  ]
  return (
    <DeltaBridge
      title="Town-wide levy: from the Tentative to the Preliminary"
      lede={`The 2026 Adopted town-wide levy was ${money(base)}. Bars show how far each 2027 stage sits from it.`}
      source="Source: Town of Riverhead 2027 Tentative and Preliminary Budget Summary pages, “Total Town Wide” levy, and each fund’s levy; changes calculated here."
      baseLabel="the 2026 Adopted levy"
      baseValue={base}
      steps={steps}
      format={money}
      signed={signedMoney}
    />
  )
}
