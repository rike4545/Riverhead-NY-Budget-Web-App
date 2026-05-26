import { budgetChanges, capitalProjects, budgetHistory } from '../lib/mock-budget-data'
import { retirementScenarios, modelRetirementScenario } from '../lib/retirement-incentive'
import { annualDebtService, totalInterest, townSquareDebtScenario } from '../lib/debt-model'

const kpis = [
  { label: 'Total Budget', value: '$121.1M', note: 'Mock adopted budget baseline' },
  { label: 'Tax Levy', value: '$65.3M', note: 'Year over year pressure visible' },
  { label: 'Fund Balance', value: '23.4%', note: 'Above working policy target' },
  { label: 'Debt Service', value: '8.7%', note: 'Watch BAN conversion risk' },
]

const agents = [
  ['Accuracy Agent', 'Healthy'],
  ['Accounting Agent', 'Healthy'],
  ['Source Verifier', 'Needs sources'],
  ['Risk Monitor', 'Elevated'],
  ['Self Healing ETL', 'Waiting'],
]

export default function Page() {
  const latest = budgetHistory[budgetHistory.length - 1]
  const retirement = modelRetirementScenario(retirementScenarios[1])
  const annualDebt = annualDebtService(townSquareDebtScenario)
  const interest = totalInterest(townSquareDebtScenario)

  return (
    <main style={{ minHeight: '100vh', padding: 32, fontFamily: 'Arial, sans-serif', background: '#f6f8fb', color: '#111827' }}>
      <section style={{ maxWidth: 1180, margin: '0 auto' }}>
        <p style={{ textTransform: 'uppercase', letterSpacing: 2, fontSize: 12, color: '#2563eb', fontWeight: 700 }}>Riverhead Budget Live</p>
        <h1 style={{ fontSize: 48, lineHeight: 1, margin: '10px 0' }}>Living municipal fiscal intelligence</h1>
        <p style={{ fontSize: 18, maxWidth: 760, color: '#4b5563' }}>Budget analytics, fiscal event intelligence, retirement incentive modeling, and debt analysis.</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 16, marginTop: 28 }}>
          {kpis.map((item) => (
            <article key={item.label} style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 18, padding: 20 }}>
              <div style={{ fontSize: 13, color: '#6b7280' }}>{item.label}</div>
              <div style={{ fontSize: 32, fontWeight: 800, marginTop: 8 }}>{item.value}</div>
              <p style={{ fontSize: 13, color: '#6b7280' }}>{item.note}</p>
            </article>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16, marginTop: 20 }}>
          <section style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 18, padding: 20 }}>
            <h2>Early Retirement Incentive Impact</h2>
            <div>Modeled retirees: {retirement.retirees}</div>
            <div>Year one net impact: ${Math.round(retirement.yearOneNetImpact).toLocaleString()}</div>
          </section>

          <section style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 18, padding: 20 }}>
            <h2>Debt / BAN Model</h2>
            <div>Annual modeled debt service: ${Math.round(annualDebt).toLocaleString()}</div>
            <div>Total interest: ${Math.round(interest).toLocaleString()}</div>
          </section>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16, marginTop: 20 }}>
          <section style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 18, padding: 20 }}>
            <h2>Budget Change Monitor</h2>
            {budgetChanges.map((item) => (
              <div key={item.area} style={{ borderTop: '1px solid #eef2f7', padding: '10px 0' }}>
                <strong>{item.area}</strong> +{item.change}%
              </div>
            ))}
          </section>

          <section style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 18, padding: 20 }}>
            <h2>BudgetGuard AI</h2>
            {agents.map(([name, status]) => (
              <div key={name} style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #eef2f7', padding: '10px 0' }}>
                <span>{name}</span>
                <strong>{status}</strong>
              </div>
            ))}
          </section>
        </div>

        <section style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 18, padding: 20, marginTop: 20 }}>
          <h2>Capital Projects</h2>
          <p>Current fiscal year modeled total: ${latest.totalBudget.toLocaleString()}</p>
          {capitalProjects.map((project) => (
            <div key={project.name} style={{ borderTop: '1px solid #eef2f7', padding: '10px 0' }}>
              <strong>{project.name}</strong>
            </div>
          ))}
        </section>
      </section>
    </main>
  )
}
