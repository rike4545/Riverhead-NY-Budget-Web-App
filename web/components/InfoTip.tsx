'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

// A hover/focus/tap definition popover for table headers and inline labels.
//
// Positioned with `position: fixed` off the trigger's bounding rect rather than
// absolutely inside the trigger. Table headers here live inside an
// `overflow-x: auto` wrapper, and a scroll container clips absolutely
// positioned descendants on BOTH axes — an absolute popover under a header
// would be cut off. Fixed positioning escapes the container entirely.
//
// Opens on mouse enter and on keyboard focus, toggles on click so touch
// devices (which get no hover) can still reach it, and closes on Escape,
// scroll, or pointer-away.
//
// Rendered via a portal straight to <body> rather than inline: dark mode
// (layout.tsx) applies a CSS filter to a wrapper below <body>, which creates a
// new containing block for `position: fixed` descendants — without the portal,
// `top`/`left` (taken from getBoundingClientRect, viewport-relative) would end
// up positioned against that wrapper's much taller box instead of the viewport.

const WIDTH = 320

export default function InfoTip({
  label,
  heading,
  children,
  align = 'left',
}: {
  label: React.ReactNode
  heading: string
  children: React.ReactNode
  /** Which edge of the trigger the popover lines up with. */
  align?: 'left' | 'right'
}) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  const place = useCallback(() => {
    const el = triggerRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const margin = 8
    let left = align === 'right' ? r.right - WIDTH : r.left
    // Keep it on screen on narrow viewports.
    left = Math.max(margin, Math.min(left, window.innerWidth - WIDTH - margin))
    setPos({ top: r.bottom + 6, left })
  }, [align])

  const show = useCallback(() => { place(); setOpen(true) }, [place])
  const hide = useCallback(() => setOpen(false), [])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    // A fixed popover doesn't follow the page, so close it rather than let it
    // drift away from the header it belongs to.
    const onScroll = () => setOpen(false)
    document.addEventListener('keydown', onKey)
    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', onScroll)
    return () => {
      document.removeEventListener('keydown', onKey)
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', onScroll)
    }
  }, [open])

  return (
    <span
      style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 3 }}
      onMouseEnter={show}
      onMouseLeave={hide}
    >
      {label}
      <button
        ref={triggerRef}
        type="button"
        aria-label={`What counts as ${heading}?`}
        aria-expanded={open}
        onClick={(e) => { e.stopPropagation(); open ? hide() : show() }}
        onFocus={show}
        onBlur={hide}
        style={{
          background: 'none', border: 'none', padding: 0, margin: 0, cursor: 'help',
          color: '#4a7297', fontWeight: 900, fontSize: '0.92em', lineHeight: 1,
          display: 'inline-flex', alignItems: 'center',
        }}
      >
        <span
          aria-hidden
          style={{
            display: 'inline-grid', placeItems: 'center', width: 14, height: 14, borderRadius: 999,
            border: '1.2px solid currentColor', fontSize: 9.5, fontWeight: 900, lineHeight: 1,
          }}
        >
          ?
        </span>
      </button>

      {open && pos && typeof document !== 'undefined' && createPortal(
        <span
          role="tooltip"
          style={{
            position: 'fixed', top: pos.top, left: pos.left, width: WIDTH, zIndex: 60,
            background: '#0f2740', color: '#e6eef6', padding: '11px 13px', borderRadius: 10,
            boxShadow: '0 18px 44px rgba(15,23,42,.36)', fontSize: 13, fontWeight: 400,
            lineHeight: 1.5, textAlign: 'left', textTransform: 'none', letterSpacing: 0,
            whiteSpace: 'normal', pointerEvents: 'none',
            // Matches the page's own text-zoom level (see DisplaySettings.tsx) — this
            // node sits outside the zoomed wrapper, so it wouldn't otherwise scale with it.
            zoom: document.documentElement.getAttribute('data-zoom') === '130' ? 1.3
              : document.documentElement.getAttribute('data-zoom') === '115' ? 1.15 : 1,
          }}
        >
          <strong style={{ display: 'block', color: '#fff', marginBottom: 5, fontSize: 13.5 }}>{heading}</strong>
          {children}
        </span>,
        document.body,
      )}
    </span>
  )
}
