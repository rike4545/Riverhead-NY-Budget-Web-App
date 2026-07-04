'use client'

import { useEffect, useRef, useState } from 'react'

// Fetch a static JSON file once on mount (or when the URL changes), with a
// module-level cache so tab switches don't re-download. Used to keep large
// datasets out of the client JS bundle on this static site.
const cache = new Map<string, unknown>()

export function useFetchJson<T>(url: string): { data: T | null; error: boolean } {
  const [data, setData] = useState<T | null>(() => (cache.get(url) as T) ?? null)
  const [error, setError] = useState(false)
  const current = useRef(url)

  useEffect(() => {
    current.current = url
    if (cache.has(url)) {
      setData(cache.get(url) as T)
      setError(false)
      return
    }
    setData(null)
    setError(false)
    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status))
        return r.json()
      })
      .then((d) => {
        cache.set(url, d)
        if (current.current === url) setData(d as T)
      })
      .catch(() => {
        if (current.current === url) setError(true)
      })
  }, [url])

  return { data, error }
}

export function LoadingCard({ label = 'Loading data…' }: { label?: string }) {
  return (
    <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 16, padding: 28, textAlign: 'center', color: '#64748b', fontWeight: 700 }}>
      {label}
    </div>
  )
}
