'use client'

import { useMemo, useState } from 'react'
import { adoptedBudget2026Summary, auditedFundBalances2024, dollars, earlyRetirementFiscalEvent, townWideComparison2026 } from '../lib/financial-data'
import { archiveStats, financialReportsArchive } from '../lib/financial-reports-archive'
import { sourceDocuments } from '../lib/source-documents'

const tabs = ['Overview', '2026 Budget', '2024 Audit', 'Historical Archive', 'Fiscal Events'] as const
const categories = ['all', 'budget', 'audit', 'afr', 'cpf', 'justice_court', 'supplement'] as const

type Tab = typeof tabs[number]
type Category = typeof categories[number]

export default function InteractiveDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('Overview')
  const [year, setYear] = useState<number | 'all'>('all')
  const [category, setCategory] = useState<Category>('all')
  const [selectedSource, setSelectedSource] = useState(sourceDocuments[0]?.title ?? '')

  const years = useMemo(() => Array.from(new Set(financialReportsArchive.map((item) => item.year))).sort((a, b) => b - a), [])

  const filteredArchive = useMemo(() => {
    return financialReportsArchive.filter((item) => {
      const yearMatches = year === 'all' || item.year === year
      const categoryMatches = category === 'all' || item.category === category
      return yearMatches && categoryMatches
    })
  }, [year, category])

  const source = sourceDocuments.find((item) => item.title === selectedSource) ?? sourceDocuments[0]

  return (
    <main style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '280px 1fr', fontFamily: 'Arial, sans-serif', background: 'linear-gradient(135deg,#f8fafc,#eef6ff)', color: '#0f172a' }}>
      <aside style={{ background: 'linear-gradient(180deg,#061a32,#082846 55%,#03111f)', color: 'white', padding: 24, minHeight: '100vh' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: '#dbeafe', color: '#0f172a', display: 'grid', placeItems: 'center', fontWeight: 900 }}>RB</div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 900, lineHeight: 1 }}>Riverhead<br />Budget Live</div>
            <div style={{ fontSize: 12, color: '#bfdbfe', marginTop: 4 }}>Fiscal Intelligence Platform</div>
          </div>
        </div>

        <nav style={{ marginTop: 36, display: 'grid', gap: 8 }}>
          {tabs.map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{ textAlign: 'left', color: 'white', cursor: 'pointer', padding: '13px 14px', borderRadius: 12, background: activeTab === tab ? 'rgba(37,99,235,.65)' : 'transparent', border: activeTab === tab ? '1px solid rgba(147,197,253,.35)' : '1px solid transparent', fontWeight: 700 }}>
              {tab}
            </button>
          ))}
        </nav>

        <section style={{ marginTop: 38, border: '1px solid rgba(147,197,253,.35)', borderRadius: 16, padding: 16, background: 'rgba(15,23,42,.35)' }}>
          <strong>Historical Coverage</strong>
          <p style={{ color: '#bfdbfe', fontSize: 14, lineHeight: 1.5 }}>{archiveStats.indexedItems} indexed official records across {archiveStats.yearsCovered} years.</p>
        </section>
      </aside>

      <section style={{ padding: 34 }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', gap: 24, alignItems: 'flex-start' }}>
          <div>
            <p style={{ textTransform: 'uppercase', letterSpacing: 3, fontSize: 13, color: '#2563eb', fontWeight: 900 }}>Riverhead Budget Live</p>
            <h1 style={{ fontSize: 42, lineHeight: 1.05, margin: '8px 0' }}>{activeTab}</h1>
            <p style={{ fontSize: 17, maxWidth: 840, color: '#475569', marginTop: 10 }}>Interactive, source-backed budget and financial statement explorer for official Town of Riverhead documents.</p>
          </div>
          <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 999, padding: '10px 14px', boxShadow: '0 12px 30px rgba(15,23,42,.06)', whiteSpace: 'nowrap' }}>Source-first mode</div>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 14, marginTop: 24 }}>
          {[
            ['Archive indexed', archiveStats.indexedItems, `${archiveStats.yearsCovered} years covered`],
            ['Budget funds', adoptedBudget2026Summary.length, '2026 extracted rows'],
            ['Audit balances', auditedFundBalances2024.length, '2024 fund balances'],
            ['2026 levy growth', `${townWideComparison2026.taxLevyPercentChange}%`, 'Town-wide tax levy change'],
            ['Filtered records', filteredArchive.length, 'Current archive view']
          ].map(([label, value, note]) => (
            <article key={String(label)} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 18, padding: 18, boxShadow: '0 14px 30px rgba(15,23,42,.06)' }}>
              <div style={{ color: '#64748b', textTransform: 'uppercase', fontSize: 11, fontWeight: 900 }}>{label}</div>
              <div style={{ fontSize: 34, fontWeight: 900, marginTop: 10 }}>{value}</div>
              <div style={{ color: '#64748b', fontSize: 13 }}>{note}</div>
            </article>
          ))}
        </div>

        {activeTab === 'Overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(330px, .8fr)', gap: 18, marginTop: 20 }}>
            <Panel title="2026 Adopted Budget Snapshot">
              {adoptedBudget2026Summary.slice(0, 4).map((row) => <BudgetRow key={row.fundCode} row={row} />)}
            </Panel>
            <Panel title="Fiscal Event Watch">
              <strong>{earlyRetirementFiscalEvent.title}</strong>
              <p>{earlyRetirementFiscalEvent.sourceClaim}</p>
              <p style={{ color: '#64748b' }}>{earlyRetirementFiscalEvent.validationStatus}</p>
            </Panel>
          </div>
        )}

        {activeTab === '2026 Budget' && (
          <Panel title="2026 Adopted Budget Extracted Funds">
            {adoptedBudget2026Summary.map((row) => <BudgetRow key={row.fundCode} row={row} />)}
          </Panel>
        )}

        {activeTab === '2024 Audit' && (
          <Panel title="2024 Audited Fund Balances">
            {auditedFundBalances2024.map((fund) => (
              <div key={fund.fund} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderTop: '1px solid #eef2f7' }}>
                <span>{fund.fund}</span>
                <strong>{dollars(fund.totalFundBalance)}</strong>
              </div>
            ))}
          </Panel>
        )}

        {activeTab === 'Historical Archive' && (
          <Panel title="Official Financial Reports Archive">
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 18 }}>
              <select value={year} onChange={(event) => setYear(event.target.value === 'all' ? 'all' : Number(event.target.value))} style={selectStyle}>
                <option value="all">All years</option>
                {years.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
              <select value={category} onChange={(event) => setCategory(event.target.value as Category)} style={selectStyle}>
                {categories.map((item) => <option key={item} value={item}>{item.replace('_', ' ')}</option>)}
              </select>
            </div>
            {filteredArchive.map((item) => (
              <div key={`${item.year}-${item.title}`} style={{ display: 'grid', gridTemplateColumns: '80px 1fr 150px', gap: 12, borderTop: '1px solid #eef2f7', padding: '12px 0' }}>
                <strong>{item.year}</strong>
                <span>{item.title}</span>
                <span style={{ color: '#2563eb', fontWeight: 800 }}>{item.category.replace('_', ' ')}</span>
              </div>
            ))}
          </Panel>
        )}

        {activeTab === 'Fiscal Events' && (
          <Panel title="Early Retirement Initiative Claim Validator">
            <p><strong>Claim:</strong> {earlyRetirementFiscalEvent.sourceClaim}</p>
            <p><strong>Covered groups:</strong> {earlyRetirementFiscalEvent.coveredGroups.join(', ')}</p>
            <p><strong>Status:</strong> {earlyRetirementFiscalEvent.validationStatus}</p>
          </Panel>
        )}

        <Panel title="Source Detail Explorer">
          <select value={selectedSource} onChange={(event) => setSelectedSource(event.target.value)} style={selectStyle}>
            {sourceDocuments.map((doc) => <option key={doc.title} value={doc.title}>{doc.title}</option>)}
          </select>
          {source && <p style={{ color: '#475569' }}>{source.notes}</p>}
        </Panel>
      </section>
    </main>
  )
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return <section style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 20, padding: 22, marginTop: 20, boxShadow: '0 14px 30px rgba(15,23,42,.05)' }}><h2 style={{ marginTop: 0 }}>{title}</h2>{children}</section>
}

function BudgetRow({ row }: { row: typeof adoptedBudget2026Summary[number] }) {
  return (
    <div style={{ borderTop: '1px solid #eef2f7', padding: '14px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
        <div><strong>{row.fund}</strong><div style={{ color: '#64748b', fontSize: 13 }}>{row.fundCode}</div></div>
        <div style={{ textAlign: 'right' }}><div style={{ fontWeight: 800 }}>{dollars(row.appropriations2026)}</div><div style={{ color: '#64748b', fontSize: 12 }}>2026 appropriations</div></div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginTop: 10 }}>
        <Mini label="Estimated revenues" value={dollars(row.estimatedRevenues2026)} />
        <Mini label="Fund balance" value={dollars(row.appropriatedFundBalance2026)} />
        <Mini label="Tax levy" value={dollars(row.taxLevy2026)} />
      </div>
      <div style={{ color: '#64748b', fontSize: 11, marginTop: 8 }}>Source: {row.source.title} • {row.source.page}</div>
    </div>
  )
}

function Mini({ label, value }: { label: string; value: string }) {
  return <div style={{ background: '#f8fafc', borderRadius: 12, padding: 10 }}><div style={{ color: '#64748b', fontSize: 12 }}>{label}</div><strong>{value}</strong></div>
}

const selectStyle = { border: '1px solid #cbd5e1', borderRadius: 12, padding: '10px 12px', background: 'white', fontWeight: 700 } as const
