'use client'

// Column sorting for the payroll tables. Click a header to sort by it; click it
// again to reverse. Numbers start high to low and text A to Z, since those are
// the questions a reader brings ("who was paid most", "find a name"). A row
// with no value sorts last in both directions, and equal rows keep their order
// by name, so re-sorting never shuffles them.

import { useCallback, useState } from 'react'
import InfoTip from './InfoTip'

export type SortDir = 'asc' | 'desc'
export type Sort<K extends string> = { key: K; dir: SortDir }
type Value = string | number | null | undefined

export function useSort<K extends string>(initial: Sort<K>, textKeys: readonly K[]) {
  const [sort, setSort] = useState<Sort<K>>(initial)
  const sortBy = useCallback(
    (key: K) => setSort((s) => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: textKeys.includes(key) ? 'asc' : 'desc' })),
    [textKeys],
  )
  return [sort, sortBy, setSort] as const
}

const missing = (v: Value) => v == null || v === '' || (typeof v === 'number' && !Number.isFinite(v))

/** One column's comparison, missing values last whichever way it runs. */
export function compareValues(a: Value, b: Value, dir: SortDir): number {
  if (missing(a) || missing(b)) return missing(a) === missing(b) ? 0 : missing(a) ? 1 : -1
  const c = typeof a === 'string' || typeof b === 'string'
    ? String(a).localeCompare(String(b), undefined, { sensitivity: 'base', numeric: true })
    : (a as number) - (b as number)
  return dir === 'asc' ? c : -c
}

const describe = (dir: SortDir, text: boolean) => (text ? (dir === 'asc' ? 'A to Z' : 'Z to A') : dir === 'asc' ? 'low to high' : 'high to low')

export function SortHeader<K extends string>({
  label, column, sort, onSort, text = false, align = 'left', tip,
}: {
  label: React.ReactNode
  column: K
  sort: Sort<K>
  onSort: (key: K) => void
  /** Text columns start A to Z; number columns start high to low. */
  text?: boolean
  align?: 'left' | 'right'
  tip?: { heading: string; body: React.ReactNode }
}) {
  const active = sort.key === column
  const next = active ? (sort.dir === 'asc' ? 'desc' : 'asc') : text ? 'asc' : 'desc'
  const button = (
    <button
      type="button"
      onClick={() => onSort(column)}
      title={`Sort ${describe(next, text)}`}
      style={{
        background: 'none', border: 'none', padding: 0, cursor: 'pointer', font: 'inherit', fontWeight: 800,
        color: active ? 'var(--rbl-accent)' : 'var(--rbl-text-muted)', display: 'inline-flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap',
      }}
    >
      {label}
      <span aria-hidden="true" style={{ fontSize: 10, opacity: active ? 1 : 0.4 }}>{active ? (sort.dir === 'asc' ? '▲' : '▼') : '↕'}</span>
    </button>
  )
  return (
    <th aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'} style={{ padding: '8px 9px', textAlign: align }}>
      {tip ? <InfoTip label={button} heading={tip.heading} align={align}>{tip.body}</InfoTip> : button}
    </th>
  )
}

/**
 * The sort dropdown, kept for phones where the headers are off to the side. It
 * offers the common sorts; after a header click it names the sort in effect.
 */
export function SortSelect<K extends string>({
  sort, presets, labels, textKeys, onChange, style,
}: {
  sort: Sort<K>
  presets: { label: string; sort: Sort<K> }[]
  labels: Record<K, string>
  textKeys: readonly K[]
  onChange: (sort: Sort<K>) => void
  style?: React.CSSProperties
}) {
  const index = presets.findIndex((p) => p.sort.key === sort.key && p.sort.dir === sort.dir)
  return (
    <select
      value={index >= 0 ? String(index) : 'current'}
      onChange={(e) => { const p = presets[Number(e.target.value)]; if (p) onChange(p.sort) }}
      aria-label="Sort the table"
      style={style}
    >
      {index < 0 && <option value="current" disabled>Sort: {labels[sort.key]}, {describe(sort.dir, textKeys.includes(sort.key))}</option>}
      {presets.map((p, i) => <option key={p.label} value={String(i)}>{p.label}</option>)}
    </select>
  )
}
