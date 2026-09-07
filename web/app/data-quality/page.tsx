'use client'

import { useEffect, useState } from 'react'
import PageShell from '../../components/PageShell'
import DataStatus from '../../components/DataStatus'
import metaJson from '../../public/data/meta.json'

const card = { background: 'var(--rbl-surface)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 16, padding: 18, boxShadow: '0 14px 34px var(--rbl-shadow)' } as const

type Freshness = 'current' | 'delayed' | 'stale' | 'unknown'
type Policy =
  | { mode: 'date' | 'pipeline'; currentDays: number; staleDays: number }
  | { mode: 'year'; expectedLagYears: number; staleAfterLagYears: number }
type Detail = {
  label: string
  asOf: string | null
  sourceDate?: string
  status: 'official' | 'calculated' | 'projected'
  cadence: string
  records?: number | null
  format?: string
  bytes?: number
  freshness?: Freshness
  freshnessNote?: string
  freshnessPolicy?: Policy
}
type Meta = { generatedAt: string; generatedAtDisplay: string; datasets: Record<string, unknown>; datasetDetails?: Record<string, Detail> }
const meta = metaJson as unknown as Meta

const freshnessTone: Record<Freshness, string> = {
  current: 'var(--rbl-success-strong)',
  delayed: 'var(--rbl-warn)',
  stale: 'var(--rbl-danger)',
  unknown: 'var(--rbl-text-muted)',
}
const freshnessLabel: Record<Freshness, string> = { current: 'Current', delayed: 'Delayed', stale: 'Stale', unknown: 'Unknown' }

function ageDays(now: number, iso: string) {
  const parsed = Date.parse(iso)
  return Number.isFinite(parsed) ? Math.max(0, Math.floor((now - parsed) / 86_400_000)) : null
}

function liveFreshness(detail: Detail, now: number | null): { state: Freshness; note: string } {
  const fallback = detail.freshness ?? 'unknown'
  if (!now || !detail.freshnessPolicy) return { state: fallback, note: detail.freshnessNote ?? detail.cadence }
  const policy = detail.freshnessPolicy

  if (policy.mode === 'year') {
    const year = Number(detail.asOf)
    if (!Number.isFinite(year)) return { state: 'unknown', note: 'No source year is available.' }
    const lag = new Date(now).getFullYear() - year
    if (lag <= policy.expectedLagYears) return { state: 'current', note: `${year} is the expected annual release for the current cycle.` }
    if (lag <= policy.staleAfterLagYears) return { state: 'delayed', note: `Latest indexed annual release is ${year}; a newer release may now be available.` }
    return { state: 'stale', note: `Latest indexed annual release is ${year}; this dataset is more than one release cycle behind.` }
  }

  const basis = policy.mode === 'pipeline' ? meta.generatedAt : detail.sourceDate
  if (!basis) return { state: 'unknown', note: 'No parseable freshness date is available.' }
  const days = ageDays(now, basis)
  if (days == null) return { state: 'unknown', note: 'No parseable freshness date is available.' }
  if (days <= policy.currentDays) return { state: 'current', note: `${days} day${days === 1 ? '' : 's'} old — inside the expected refresh window.` }
  if (days <= policy.staleDays) return { state: 'delayed', note: `${days} days old — newer source material may be pending.` }
  return { state: 'stale', note: `${days} days old — verify against the publisher before relying on it.` }
}

export default function DataQualityPage() {
  const [now, setNow] = useState<number | null>(null)
  useEffect(() => setNow(Date.now()), [])

  const pipeline = liveFreshness({
    label: 'Pipeline', asOf: meta.generatedAtDisplay, sourceDate: meta.generatedAt.slice(0, 10), status: 'calculated', cadence: 'Weekly pipeline',
    freshnessPolicy: { mode: 'pipeline', currentDays: 7, staleDays: 14 }, freshness: 'current',
  }, now)
  const details = meta.datasetDetails ?? {}

  return (
    <PageShell title="Data Quality & Freshness" subtitle="A transparent status page for the datasets behind Riverhead Budget Live: what is official, what is calculated, how current each source is, and what the deployment checks automatically.">
      <section style={{ ...card, marginBottom: 18, borderLeft: `6px solid ${freshnessTone[pipeline.state]}` }}>
        <div style={{ color: freshnessTone[pipeline.state], fontWeight: 950, textTransform: 'uppercase', letterSpacing: .6, fontSize: 12 }}>● Pipeline status: {freshnessLabel[pipeline.state]}</div>
        <h2 style={{ margin: '6px 0 5px' }}>Last pipeline snapshot: {meta.generatedAtDisplay}</h2>
        <p style={{ margin: 0, color: 'var(--rbl-text-body)', lineHeight: 1.55 }}>{pipeline.note}</p>
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(245px,100%),1fr))', gap: 12, marginBottom: 18 }}>
        {Object.entries(details).map(([key, d]) => {
          const f = liveFreshness(d, now)
          return (
            <article key={key} style={{ ...card, borderTop: `4px solid ${freshnessTone[f.state]}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <strong style={{ color: 'var(--rbl-title)', fontSize: 16 }}>{d.label}</strong>
                <DataStatus status={d.status} />
              </div>
              <div style={{ marginTop: 10, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ color: freshnessTone[f.state], fontSize: 12.5, fontWeight: 900 }}>● {freshnessLabel[f.state]}</span>
                <span style={{ color: 'var(--rbl-text-strong)', fontSize: 13.5 }}><strong>As of:</strong> {d.asOf || 'Not available'}</span>
              </div>
              <div style={{ marginTop: 6, color: 'var(--rbl-text-body)', fontSize: 12.5, lineHeight: 1.45 }}>{f.note}</div>
              <div style={{ marginTop: 5, color: 'var(--rbl-text-muted)', fontSize: 12.5, lineHeight: 1.45 }}>{d.cadence}</div>
              {typeof d.records === 'number' && <div style={{ marginTop: 7, color: 'var(--rbl-text-muted)', fontSize: 12.5 }}>{d.records.toLocaleString()} indexed records</div>}
              {d.format && <div style={{ marginTop: 5, color: 'var(--rbl-text-muted)', fontSize: 12.5 }}>Search format: {d.format}{d.bytes ? ` · ${(d.bytes / 1_000_000).toFixed(2)} MB total shards` : ''}</div>}
            </article>
          )
        })}
      </section>

      <section style={{ ...card, marginBottom: 18 }}>
        <h2 style={{ marginTop: 0 }}>Checks enforced before deployment</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(220px,100%),1fr))', gap: 10 }}>
          <Check title="Routes" text="Navigation links must resolve to an exported page." />
          <Check title="Record floors" text="Core datasets cannot silently collapse to zero or an implausibly small record count." />
          <Check title="Search shards" text="Manifest counts and byte sizes must match the generated shard files, and the legacy monolith must stay removed." />
          <Check title="Payload guardrail" text="Unexpected search-index growth fails verification instead of silently shipping a much larger download." />
          <Check title="Dataset freshness" text="Every tracked dataset must declare a cadence, freshness policy, status, and as-of value; pipeline-owned data must be current after regeneration." />
          <Check title="ETL imports" text="Python dependencies and ETL modules are smoke-tested before the web build starts." />
          <Check title="Static build" text="TypeScript and the Next.js static export must compile successfully before merge." />
        </div>
      </section>

      <section style={card}>
        <h2 style={{ marginTop: 0 }}>How to interpret the labels</h2>
        <div style={{ display: 'grid', gap: 10 }}>
          <Legend status="official" text="Copied or parsed from a cited government record. Parsing can still introduce transcription errors, so consequential use should be checked against the source." />
          <Legend status="calculated" text="Computed by this site from cited records. The calculation should be reproducible from the linked source data." />
          <Legend status="projected" text="Forward-looking model or scenario. It is not an adopted Town budget or official forecast." />
        </div>
      </section>
    </PageShell>
  )
}

function Check({ title, text }: { title: string; text: string }) {
  return <div style={{ background: 'var(--rbl-surface-2)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 12, padding: 12 }}><strong style={{ color: 'var(--rbl-title)' }}>{title}</strong><div style={{ color: 'var(--rbl-text-muted)', fontSize: 12.5, lineHeight: 1.45, marginTop: 4 }}>{text}</div></div>
}

function Legend({ status, text }: { status: 'official' | 'calculated' | 'projected'; text: string }) {
  return <div style={{ display: 'flex', gap: 10, alignItems: 'start', flexWrap: 'wrap' }}><DataStatus status={status} /><span style={{ color: 'var(--rbl-text-body)', fontSize: 13.5, lineHeight: 1.5, flex: '1 1 420px' }}>{text}</span></div>
}
