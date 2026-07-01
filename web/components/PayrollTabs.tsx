'use client'

import { useState } from 'react'
import PayrollExplorer from './PayrollExplorer'
import AuthorizedSalary from './AuthorizedSalary'

export default function PayrollTabs() {
  const [tab, setTab] = useState<'actual' | 'authorized'>('actual')
  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <Tab active={tab === 'actual'} onClick={() => setTab('actual')} title="Actual Pay" sub="What employees were paid, 2018–2023" />
        <Tab active={tab === 'authorized'} onClick={() => setTab('authorized')} title="Authorized Salary (2025)" sub="What the Board set — and how it compares to actual pay" />
      </div>
      {tab === 'actual' ? <PayrollExplorer /> : <AuthorizedSalary />}
    </div>
  )
}

function Tab({ active, onClick, title, sub }: { active: boolean; onClick: () => void; title: string; sub: string }) {
  return (
    <button onClick={onClick} style={{
      flex: '1 1 260px', textAlign: 'left', cursor: 'pointer', borderRadius: 12, padding: '12px 16px',
      border: '1px solid', borderColor: active ? '#1f5f8f' : '#cbd5e1',
      background: active ? '#1f5f8f' : 'white', color: active ? 'white' : '#334155',
      boxShadow: active ? '0 10px 24px rgba(31,95,143,.22)' : 'none',
    }}>
      <div style={{ fontWeight: 900, fontSize: 16 }}>{title}</div>
      <div style={{ fontSize: 12.5, opacity: 0.85 }}>{sub}</div>
    </button>
  )
}
