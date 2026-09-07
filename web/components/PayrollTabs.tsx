'use client'

import { useState } from 'react'
import PayrollExplorer from './PayrollExplorer'
import AuthorizedSalary from './AuthorizedSalary'
import SalaryRaises from './SalaryRaises'
import OvertimeStaffing, { type OvertimeStaffingProps } from './OvertimeStaffing'
import SeparationPay, { type SeparationPayProps } from './SeparationPay'
import PoliceStepSchedule from './PoliceStepSchedule'

export default function PayrollTabs({
  overtime, separation,
}: { overtime: OvertimeStaffingProps; separation: SeparationPayProps }) {
  const [tab, setTab] = useState<'actual' | 'authorized' | 'raises' | 'overtime' | 'separation' | 'steps'>('actual')
  const choose = (next: typeof tab) => {
    setTab(next)
    requestAnimationFrame(() => document.getElementById('payroll-data')?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <section style={{
        background: 'linear-gradient(110deg,#102c46,var(--rbl-fill-accent))', color: 'white', borderRadius: 18,
        padding: '22px 24px', boxShadow: '0 16px 36px var(--rbl-shadow)',
      }} aria-labelledby="payroll-question-title">
        <div style={{ fontSize: 11.5, fontWeight: 950, letterSpacing: 1, textTransform: 'uppercase', color: '#a9d4ee' }}>Start with the question</div>
        <h2 id="payroll-question-title" style={{ margin: '5px 0 7px', fontSize: 25, lineHeight: 1.2 }}>What do you want to know about Town payroll?</h2>
        <p style={{ margin: 0, color: '#d3e2ee', lineHeight: 1.55, maxWidth: 800 }}>
          Keep two numbers separate: <strong>authorized salary</strong> is the Board-set base rate; <strong>actual pay</strong> is what an employee received, including overtime and other compensation.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 9, marginTop: 16 }}>
          <QuestionButton active={tab === 'actual'} onClick={() => choose('actual')} title="What did employees actually earn?" text="Search 2018–2025 employee earnings." />
          <QuestionButton active={tab === 'authorized'} onClick={() => choose('authorized')} title="What salaries were authorized?" text="See Board-set base salaries." />
          <QuestionButton active={tab === 'raises'} onClick={() => choose('raises')} title="Who received a raise?" text="Compare 2025 and 2026 authorized pay." />
          <QuestionButton active={tab === 'overtime'} onClick={() => choose('overtime')} title="Where is overtime concentrated?" text="Examine overtime and staffing pressure." />
        </div>
      </section>

      <div id="payroll-data" style={{ scrollMarginTop: 18 }}>
        <div style={{ display: 'grid', gap: 8 }}>
          <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: .7, textTransform: 'uppercase', color: 'var(--rbl-text-muted)' }}>Payroll records</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Tab active={tab === 'actual'} onClick={() => setTab('actual')} title="Employees & Pay" sub="Actual earnings, 2018–2025" />
            <Tab active={tab === 'authorized'} onClick={() => setTab('authorized')} title="Authorized Salary" sub="Board-set base pay" />
            <Tab active={tab === 'raises'} onClick={() => setTab('raises')} title="Raises 2025 → 2026" sub="Who received a raise" />
          </div>
        </div>
        <div style={{ display: 'grid', gap: 8, marginTop: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: .7, textTransform: 'uppercase', color: 'var(--rbl-text-muted)' }}>Analysis</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Tab active={tab === 'overtime'} onClick={() => setTab('overtime')} title="Overtime & Staffing" sub="Overtime pressure and police staffing patterns" />
            <Tab active={tab === 'separation'} onClick={() => setTab('separation')} title="Separation Pay" sub="Unused leave liabilities and departure costs" />
            <Tab active={tab === 'steps'} onClick={() => setTab('steps')} title="Police Pay Steps" sub="How PBA step increases work" />
          </div>
        </div>
      </div>

      {tab === 'actual' ? <PayrollExplorer />
        : tab === 'authorized' ? <AuthorizedSalary />
        : tab === 'raises' ? <SalaryRaises />
        : tab === 'overtime' ? <OvertimeStaffing {...overtime} />
        : tab === 'separation' ? <SeparationPay {...separation} />
        : <PoliceStepSchedule />}
    </div>
  )
}

function QuestionButton({ active, onClick, title, text }: { active: boolean; onClick: () => void; title: string; text: string }) {
  return (
    <button onClick={onClick} style={{
      textAlign: 'left', cursor: 'pointer', border: '1px solid rgba(255,255,255,.24)', borderRadius: 12,
      padding: '11px 13px', background: active ? 'rgba(255,255,255,.18)' : 'rgba(255,255,255,.09)', color: 'white',
      boxShadow: active ? '0 8px 20px rgba(0,0,0,.12)' : 'none',
    }}>
      <div style={{ fontWeight: 900, fontSize: 14 }}>{title} →</div>
      <div style={{ fontSize: 12.5, color: '#c8d9e7', marginTop: 4, lineHeight: 1.4 }}>{text}</div>
    </button>
  )
}

function Tab({ active, onClick, title, sub }: { active: boolean; onClick: () => void; title: string; sub: string }) {
  return (
    <button onClick={onClick} style={{
      flex: '1 1 260px', textAlign: 'left', cursor: 'pointer', borderRadius: 12, padding: '12px 16px',
      border: '1px solid', borderColor: active ? 'var(--rbl-accent-border)' : 'var(--rbl-border-strong)',
      background: active ? 'var(--rbl-fill-accent)' : 'var(--rbl-surface)', color: active ? 'white' : 'var(--rbl-text-strong)',
      boxShadow: active ? '0 10px 24px rgba(31,95,143,.22)' : 'none',
    }}>
      <div style={{ fontWeight: 900, fontSize: 16 }}>{title}</div>
      <div style={{ fontSize: 12.5, opacity: 0.85 }}>{sub}</div>
    </button>
  )
}
