'use client'

import { useMemo, useState } from 'react'
import { glossaryCategories, glossaryEntries, type GlossaryCategory } from '../lib/glossary'

const base = process.env.NEXT_PUBLIC_BASE_PATH || ''

const fold = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’‘]/g, "'")
const letterOf = (term: string) => {
  const c = term[0].toUpperCase()
  return /[A-Z]/.test(c) ? c : '#'
}

const chip = (on: boolean) => ({
  minHeight: 36, padding: '6px 12px', borderRadius: 999, fontSize: 14, fontWeight: 600, cursor: 'pointer',
  border: `1px solid ${on ? 'var(--rbl-cta-bg)' : 'var(--rbl-border)'}`,
  background: on ? 'var(--rbl-cta-bg)' : 'var(--rbl-surface)',
  color: on ? 'var(--rbl-cta-fg)' : 'var(--rbl-text-strong)',
}) as const

/**
 * Every term the site uses, searchable and filterable by topic, grouped A to Z.
 * Each term has its own anchor (#term-<id>) so other pages can link straight to it.
 * Without JavaScript the whole list still shows.
 */
export default function Glossary() {
  const [q, setQ] = useState('')
  const [topic, setTopic] = useState<GlossaryCategory | 'All'>('All')

  const shown = useMemo(() => {
    const needle = fold(q.trim())
    return glossaryEntries.filter((g) =>
      (topic === 'All' || g.category === topic) &&
      (!needle || fold(g.term).includes(needle) || fold(g.plain).includes(needle)))
  }, [q, topic])

  const groups = useMemo(() => {
    const m = new Map<string, typeof shown>()
    for (const g of shown) {
      const k = letterOf(g.term)
      if (!m.has(k)) m.set(k, [])
      m.get(k)!.push(g)
    }
    return Array.from(m.entries())
  }, [shown])

  const counts = useMemo(() => {
    const c: Record<string, number> = {}
    for (const g of glossaryEntries) c[g.category] = (c[g.category] ?? 0) + 1
    return c
  }, [])

  return (
    <div>
      <div style={{ display: 'grid', gap: 12, marginBottom: 16 }}>
        <label style={{ display: 'grid', gap: 4, maxWidth: 420 }}>
          <span style={{ fontWeight: 700, color: 'var(--rbl-text-strong)' }}>Find a term</span>
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="For example, levy or unassigned"
            style={{ minHeight: 44, padding: '8px 12px', fontSize: 16, borderRadius: 10, border: '1px solid var(--rbl-border)', background: 'var(--rbl-surface)', color: 'var(--rbl-text-strong)' }}
          />
        </label>
        <div role="group" aria-label="Show terms about" style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <button type="button" aria-pressed={topic === 'All'} onClick={() => setTopic('All')} style={chip(topic === 'All')}>
            All topics ({glossaryEntries.length})
          </button>
          {glossaryCategories.map((c) => (
            <button key={c} type="button" aria-pressed={topic === c} onClick={() => setTopic(c)} style={chip(topic === c)}>
              {c} ({counts[c] ?? 0})
            </button>
          ))}
        </div>
        <nav aria-label="Jump to a letter" style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {groups.map(([letter]) => (
            <a key={letter} href={`#letter-${letter}`} style={{ minWidth: 32, minHeight: 32, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, border: '1px solid var(--rbl-border-subtle)', color: 'var(--rbl-link)', fontWeight: 700, textDecoration: 'none' }}>
              {letter}
            </a>
          ))}
        </nav>
        <p aria-live="polite" style={{ margin: 0, color: 'var(--rbl-text-muted)', fontSize: 14 }}>
          {shown.length === glossaryEntries.length ? `${shown.length} terms.` : `${shown.length} of ${glossaryEntries.length} terms match.`}
          {shown.length === 0 && ' Try a shorter word, or choose All topics.'}
        </p>
      </div>

      {groups.map(([letter, items]) => (
        <section key={letter} aria-labelledby={`letter-${letter}`} style={{ marginBottom: 18 }}>
          <h2 id={`letter-${letter}`} style={{ margin: '0 0 8px', fontSize: 20, color: 'var(--rbl-title)', scrollMarginTop: 24 }}>{letter}</h2>
          <dl style={{ margin: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(300px,100%),1fr))', gap: 12 }}>
            {items.map((g) => (
              <div key={g.id} id={`term-${g.id}`} style={{ background: 'var(--rbl-surface)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 12, padding: 14, scrollMarginTop: 24 }}>
                <dt style={{ fontWeight: 700, color: 'var(--rbl-title)', fontSize: 16.5 }}>{g.term}</dt>
                <dd style={{ margin: '4px 0 0', color: 'var(--rbl-text-body)', fontSize: 15, lineHeight: 1.55 }}>
                  {g.plain}
                  <span style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 12px', marginTop: 8, fontSize: 13.5, color: 'var(--rbl-text-muted)' }}>
                    <span>{g.category}</span>
                    {g.see && (
                      <a href={`${base}${g.see.href}`} style={{ color: 'var(--rbl-link)', fontWeight: 600 }}>
                        Where it matters: {g.see.label}
                      </a>
                    )}
                  </span>
                </dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
    </div>
  )
}
