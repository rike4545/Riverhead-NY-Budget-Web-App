'use client'

import { useState } from 'react'
import PayrollExplorer from './PayrollExplorer'
import AuthorizedSalary from './AuthorizedSalary'
import SalaryRaises from './SalaryRaises'
import OvertimeStaffing, { type OvertimeStaffingProps } from './OvertimeStaffing'
import SeparationPay, { type SeparationPayProps } from './SeparationPay'

// `overtime` and `separation` are computed at build time by lib/overtime-staffing.ts
// and lib/separation-pay.ts (server-only — they read the full payroll record set)
// and handed down as plain data.
export default function PayrollTabs({
  overtime, separation,
}: { overtime: OvertimeStaffingProps; separation: SeparationPayProps }) {
  const [tab, setTab] = useState<'actual' | 'authorized' | 'raises' | 'overtime' | 'separation'>('actual')
  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <Tab active={tab === 'actual'} onClick={() => setTab('actual')} title="Actual Pay" sub="What employees were paid, 2018–2025" />
        <Tab active={tab === 'authorized'} onClick={() => setTab('authorized')} title="Authorized Salary" sub="What the Board set for 2025 or 2026, vs actual pay" />
        <Tab active={tab === 'raises'} onClick={() => setTab('raises')} title="Raises 2025 → 2026" sub="Who got a raise, and by how much" />
        <Tab active={tab === 'overtime'} onClick={() => setTab('overtime')} title="Overtime & Staffing" sub="Which police ranks run overtime instead of headcount" />
        <Tab active={tab === 'separation'} onClick={() => setTab('separation')} title="Separation Pay" sub="Unused leave the Town owes, and what leaving costs" />
      </div>
      {tab === 'actual' ? <PayrollExplorer />
        : tab === 'authorized' ? <AuthorizedSalary />
        : tab === 'raises' ? <SalaryRaises />
        : tab === 'overtime' ? <OvertimeStaffing {...overtime} />
        : <SeparationPay {...separation} />}
    </div>
  )
}

function Tab({ active, onClick, title, sub }: { active: boolean; onClick: () => void; title: string; sub: string }) {
  return (
    <button onClick={onClick} style={{
      flex: '1 1 260px', textAlign: 'left', cursor: 'pointer', borderRadius: 12, padding: '12px 16px',
      border: '1px solid', borderColor: active ? '#4a7297' : '#cbd5e1',
      background: active ? '#4a7297' : 'white', color: active ? 'white' : '#334155',
      boxShadow: active ? '0 10px 24px rgba(31,95,143,.22)' : 'none',
    }}>
      <div style={{ fontWeight: 900, fontSize: 16 }}>{title}</div>
      <div style={{ fontSize: 12.5, opacity: 0.85 }}>{sub}</div>
    </button>
  )
}
