'use client'

import { useState } from 'react'

const base = process.env.NEXT_PUBLIC_BASE_PATH || ''

type View = 'actual' | 'authorized' | 'raises' | 'overtime' | 'separation' | 'steps'

const views: Array<{ id: View; title: string; text: string }> = [
  { id: 'actual', title: 'What employees were actually paid', text: 'Search employee earnings, overtime and gross pay from 2018–2025.' },
  { id: 'authorized', title: 'What salaries were authorized', text: 'See the Board-set base salary alongside actual compensation.' },
  { id: 'raises', title: 'Who got a raise', text: 'Compare authorized salaries from 2025 to 2026.' },
  { id: 'overtime', title: 'Where overtime is concentrated', text: 'Look at overtime pressure and staffing patterns.' },
  { id: 'separation', title: 'What departures can cost', text: 'Explore unused leave liabilities and separation payments.' },
  { id: 'steps', title: 'How police pay steps work', text: 'See the progression built into the police pay schedule.' },
]

export default function PayrollStart() {
  const [selected, setSelected] = useState<View>('actual')

  const jump = (id: View) => {
    setSelected(id)
    requestAnimationFrame(() => document.getElementById('payroll-data')?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }

  return (
    <section style={{ marginBottom: 20 }} aria-labelledby="payroll-start-title">
      <div style={{
        background: 'linear-gradient(110deg,#102c46,var(--rbl-fill-accent))', color: 'white', borderRadius: 18,
        padding: '22px 24px', boxShadow: '0 16px 36px var(--rbl-shadow)',
      }}>
        <div style={{ fontSize: 11.5, fontWeight: 950, letterSpacing: 1, textTransform: 'uppercase', color: '#a9d4ee' }}>Start with the question</div>
        <h2 id="payroll-start-title" style={{ margin: '5px 0 7px', fontSize: 25, lineHeight: 1.2 }}>What do you want to know about Town payroll?</h2>
        <p style={{ margin: 0, color: '#d3e2ee', lineHeight: 1.55, maxWidth: 780 }}>
          There are two different numbers worth keeping straight: what the Town authorized as a base salary, and what an employee actually received. Start with the question you care about.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))', gap: 9, marginTop: 16 }}>
          {views.slice(0, 4).map((view) => (
            <button key={view.id} onClick={() => jump(view.id)} style={{
              textAlign: 'left', cursor: 'pointer', border: '1px solid rgba(255,255,255,.22)', borderRadius: 12,
              padding: '11px 13px', background: 'rgba(255,255,255,.10)', color: 'white',
            }}>
              <div style={{ fontWeight: 900, fontSize: 14 }}>{view.title} →</div>
              <div style={{ fontSize: 12.5, color: '#c8d9e7', marginTop: 4, lineHeight: 1.4 }}>{view.text}</div>
            </button>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
        {views.slice(4).map((view) => (
          <button key={view.id} onClick={() => jump(view.id)} style={{
            border: '1px solid var(--rbl-border)', borderRadius: 999, padding: '7px 12px', cursor: 'pointer',
            background: selected === view.id ? 'var(--rbl-fill-accent)' : 'var(--rbl-surface)',
            color: selected === view.id ? 'white' : 'var(--rbl-link)', fontWeight: 800, fontSize: 12.5,
          }}>{view.title} →</button>
        ))}
      </div>
    </section>
  )
}
