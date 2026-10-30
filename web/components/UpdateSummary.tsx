'use client'

import { useEffect, useState } from 'react'
import metaJson from '../public/data/meta.json'

const STORAGE_KEY = 'rbl-last-data-snapshot'

type Meta = {
  generatedAt: string
  generatedAtDisplay: string
  dataVersion?: string
  datasets: {
    latestMeeting?: string | null
    votes?: number
    payrollYears?: number[]
    searchEntries?: number
  }
}

const meta = metaJson as unknown as Meta

export default function UpdateSummary() {
  const [state, setState] = useState<'first' | 'same' | 'updated'>('first')

  useEffect(() => {
    try {
      const version = meta.dataVersion || meta.generatedAt
      const previous = localStorage.getItem(STORAGE_KEY)
      setState(previous && previous !== version ? 'updated' : previous === version ? 'same' : 'first')
      localStorage.setItem(STORAGE_KEY, version)
    } catch {
      setState('first')
    }
  }, [])

  const payroll = meta.datasets.payrollYears?.length ? Math.max(...meta.datasets.payrollYears) : null
  const base = process.env.NEXT_PUBLIC_BASE_PATH || ''
  const headline = state === 'updated' ? 'New data since your last visit' : state === 'same' ? 'No new data since your last visit' : 'Latest available data snapshot'

  return (
    <section aria-label="Data update summary" style={{ marginBottom: 22, padding: '12px 0', borderTop: '1px solid var(--rbl-border-subtle)', borderBottom: '1px solid var(--rbl-border-subtle)', display: 'flex', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ color: 'var(--rbl-text-muted)', fontSize: 13, fontWeight: 700 }}>{headline}</div>
        <div style={{ color: 'var(--rbl-text-strong)', fontSize: 12.8, lineHeight: 1.5, marginTop: 3 }}>
          Site data last refreshed {meta.generatedAtDisplay}
          {meta.datasets.latestMeeting ? ` · Board records through ${meta.datasets.latestMeeting}` : ''}
          {payroll ? ` · payroll through ${payroll}` : ''}
          {meta.datasets.searchEntries ? ` · ${meta.datasets.searchEntries.toLocaleString()} searchable public records` : ''}
        </div>
      </div>
      <a href={`${base}/data-quality/`} style={{ color: 'var(--rbl-link)', fontWeight: 850, fontSize: 12.5, textDecoration: 'none', whiteSpace: 'nowrap' }} title="See the update date and source status for each dataset">See data update details →</a>
    </section>
  )
}
