'use client'

import { useEffect, useMemo, useState } from 'react'
import { clock, meetingMedia, mediaSources, videoAt } from '../lib/meeting-media'

const base = process.env.NEXT_PUBLIC_BASE_PATH || ''
const link = { color: 'var(--rbl-link)', fontWeight: 800, textDecoration: 'none' } as const

type Transcript = { model: string; generatedAt: string; durationSec: number; segments: [number, number, string][] }

/**
 * The meeting's video and transcripts, each labelled by who made it. This
 * site's own transcript loads only when it is opened.
 */
export default function MeetingMediaLinks({ slug }: { slug: string }) {
  const m = meetingMedia(slug)
  const [open, setOpen] = useState(false)
  if (!m || (!m.video && !m.transcript && !m.ours)) return null
  return (
    <div style={{ marginTop: 10, display: 'grid', gap: 6 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 14px', fontSize: 13 }}>
        {m.video && <a href={m.video} target="_blank" rel="noreferrer" style={link}>▶ Watch the meeting (Town video) ↗</a>}
        {m.transcript && (
          <a href={m.transcript} target="_blank" rel="noreferrer" style={link} title={mediaSources.transcripts.note}>
            Volunteer transcript (riverheadtranscripts.org) ↗
          </a>
        )}
        {m.ours && (
          <button onClick={() => setOpen((v) => !v)} style={{ ...link, background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: 13 }}>
            {open ? 'Hide' : 'Read'} this site&apos;s machine transcript
          </button>
        )}
      </div>
      {open && m.ours && <TranscriptViewer path={m.ours.path} video={m.video} />}
    </div>
  )
}

function TranscriptViewer({ path, video }: { path: string; video?: string }) {
  const [data, setData] = useState<Transcript | null>(null)
  const [failed, setFailed] = useState(false)
  const [q, setQ] = useState('')
  useEffect(() => {
    let alive = true
    fetch(`${base}${path}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((d: Transcript) => { if (alive) setData(d) })
      .catch(() => { if (alive) setFailed(true) })
    return () => { alive = false }
  }, [path])
  const query = q.trim().toLowerCase()
  const rows = useMemo(() => (data?.segments ?? []).filter(([, , text]) => !query || text.toLowerCase().includes(query)), [data, query])
  if (failed) return <div style={{ color: 'var(--rbl-text-muted)', fontSize: 13 }}>Could not load the transcript.</div>
  if (!data) return <div style={{ color: 'var(--rbl-text-muted)', fontSize: 13 }}>Loading the transcript…</div>
  return (
    <div style={{ border: '1px solid var(--rbl-border-subtle)', borderRadius: 12, padding: 12, background: 'var(--rbl-surface-2)' }}>
      <p style={{ margin: '0 0 8px', color: 'var(--rbl-text-muted)', fontSize: 12.5, lineHeight: 1.5 }}>
        {mediaSources.ours.note} This one: Whisper {data.model}, {Math.round(data.durationSec / 60)} minutes of the
        Town&apos;s recording. Click a time to open the video there.
      </p>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find a word in the transcript…"
        style={{ width: '100%', boxSizing: 'border-box', padding: '8px 11px', border: '1px solid var(--rbl-border-strong)', borderRadius: 9, fontSize: 14, marginBottom: 8 }} />
      <div style={{ maxHeight: 420, overflowY: 'auto', fontSize: 13.5, lineHeight: 1.55 }}>
        {rows.map(([start, , text], i) => (
          <div key={i} style={{ display: 'flex', gap: 10, padding: '2px 0' }}>
            {video ? (
              <a href={videoAt(video, start)} target="_blank" rel="noreferrer" style={{ ...link, fontWeight: 700, fontVariantNumeric: 'tabular-nums', minWidth: 58 }}>{clock(start)}</a>
            ) : <span style={{ color: 'var(--rbl-text-muted)', minWidth: 58 }}>{clock(start)}</span>}
            <span style={{ color: 'var(--rbl-text-strong)' }}>{text}</span>
          </div>
        ))}
        {rows.length === 0 && <div style={{ color: 'var(--rbl-text-muted)' }}>No line matches “{q}”.</div>}
      </div>
    </div>
  )
}
