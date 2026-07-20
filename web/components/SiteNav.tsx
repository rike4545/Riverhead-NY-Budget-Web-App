'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'

const base = process.env.NEXT_PUBLIC_BASE_PATH || ''

type Link = [label: string, href: string]
type Group = { label: string; links: Link[] }

// A few high-traffic pages stay one click away; everything else is grouped
// so the header reads as a handful of choices, not a wall of 21 buttons.
const PRIMARY: Link[] = [
  ['Explore the Budget', `${base}/explore/`],
  ['Search', `${base}/search/`],
]

const GROUPS: Group[] = [
  {
    label: 'Budget',
    links: [
      ['Funds Explorer', `${base}/funds/`],
      ['Budget Compare', `${base}/compare/`],
      ['General Fund', `${base}/general-fund/`],
      ['2027 Prediction', `${base}/predict-2027/`],
      ['2027 Spending Reduction', `${base}/spending-reduction-2027/`],
      ['Tax Cap', `${base}/tax-cap/`],
      ['My Tax Bill', `${base}/tax-bill/`],
      ['Reserves & Fund Balance', `${base}/reserves/`],
      ['Capital & Debt', `${base}/capital-debt/`],
      ['Community Preservation Fund', `${base}/community-preservation-fund/`],
      ['Annual Report', `${base}/annual-report/`],
      ['Community', `${base}/community/`],
    ],
  },
  {
    label: 'People & Pay',
    links: [
      ['Payroll', `${base}/payroll/`],
      ['2026 Buyout', `${base}/buyout/`],
      ['Officials & Pensions', `${base}/officials/`],
      ['Supervisors & Council History', `${base}/town-history/`],
    ],
  },
  {
    label: 'Accountability',
    links: [
      ['Town Board Votes', `${base}/meetings/`],
      ['Fiscal Impact', `${base}/fiscal-impact/`],
      ['Campaign Finance', `${base}/campaign-finance/`],
      ['Candidate Watch', `${base}/candidate-watch/`],
      ['How the Board Was Elected', `${base}/board-elections/`],
      ['Outlier Watch', `${base}/outliers/`],
    ],
  },
  {
    label: 'More',
    links: [
      ['Start Here (Guide)', `${base}/guide/`],
      ['Downloads', `${base}/downloads/`],
      ['Standards (GFOA)', `${base}/gfoa/`],
      ['Analytics', `${base}/analytics/`],
      ['Source Library', `${base}/sources/`],
      ['Scenario Lab', `${base}/scenarios/`],
    ],
  },
]

const linkStyle = {
  color: 'white', textDecoration: 'none', border: '1px solid rgba(255,255,255,.28)', borderRadius: 6,
  padding: '9px 13px', fontWeight: 800, background: 'rgba(12,43,72,.35)', fontSize: 14.5, whiteSpace: 'nowrap' as const,
}

export default function SiteNav() {
  const pathname = usePathname() || ''
  const [open, setOpen] = useState<string | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const navRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) setOpen(null)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(null)
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  // Close menus whenever the route changes (e.g. after clicking a link).
  useEffect(() => { setOpen(null); setMobileOpen(false) }, [pathname])

  const groupIsActive = (g: Group) => g.links.some(([, href]) => pathname && href.endsWith(pathname))

  return (
    // marginLeft: auto keeps this flush against the header's right edge even when the
    // header wraps to two lines (long title + narrow viewport) and this becomes the sole
    // item on its row — plain justify-content: space-between only works with 2+ items on
    // the same row, and without this the mobile panel's `right: 0` anchors to the wrong box.
    <div ref={navRef} style={{ position: 'relative', marginLeft: 'auto' }}>
      {/* Hamburger toggle, mobile only */}
      <button
        onClick={() => setMobileOpen((v) => !v)}
        aria-label="Toggle menu"
        aria-expanded={mobileOpen}
        className="nav-hamburger"
        style={{
          display: 'none', color: 'white', background: 'rgba(12,43,72,.5)', border: '1px solid rgba(255,255,255,.3)',
          borderRadius: 6, padding: '9px 14px', fontWeight: 900, fontSize: 15, cursor: 'pointer',
        }}
      >
        {mobileOpen ? '✕ Close' : '☰ Menu'}
      </button>

      <nav className="nav-links" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        {PRIMARY.map(([label, href]) => (
          <a key={href} href={href} style={{ ...linkStyle, ...(pathname && href.endsWith(pathname) ? { background: '#c99a2e', borderColor: '#c99a2e', color: '#284a69' } : {}) }}>
            {label}
          </a>
        ))}

        {GROUPS.map((g, index) => (
          <div key={g.label} className="nav-group" style={{ position: 'relative' }}>
            {/* Desktop: the panel opens on hover/keyboard-focus via CSS below — no click required
                and immune to any click-timing quirks. The click handler is a fallback for touch
                devices (no hover) and adds a 'force-open' class the CSS also honors. */}
            <button
              onClick={() => setOpen((v) => (v === g.label ? null : g.label))}
              aria-expanded={open === g.label}
              style={{
                ...linkStyle, cursor: 'pointer',
                ...(groupIsActive(g) || open === g.label ? { background: '#c99a2e', borderColor: '#c99a2e', color: '#284a69' } : {}),
              }}
            >
              {g.label} ▾
            </button>
            {/* top:100% with no gap — a gap here would be a hover "dead zone" that drops the
                menu before the mouse reaches it. The 8px breathing room moves inside as padding.
                The last group sits at the far right of the header, so anchoring its dropdown
                from the right (instead of the left, like every other group) keeps it from
                running off the edge of the viewport. */}
            <div className={`nav-dropdown${open === g.label ? ' force-open' : ''}`} style={{
              position: 'absolute', top: '100%', minWidth: 220, paddingTop: 8, zIndex: 40,
              ...(index === GROUPS.length - 1 ? { right: 0 } : { left: 0 }),
            }}>
              <div style={{
                background: 'white', border: '1px solid #d8e0e7', borderRadius: 10,
                boxShadow: '0 18px 40px rgba(15,23,42,.18)', padding: 8, display: 'grid', gap: 2,
              }}>
                {g.links.map(([label, href]) => (
                  <a key={href} href={href} style={{
                    color: pathname && href.endsWith(pathname) ? '#284a69' : '#33475a', textDecoration: 'none',
                    fontWeight: pathname && href.endsWith(pathname) ? 900 : 700, fontSize: 14, padding: '8px 10px',
                    borderRadius: 7, background: pathname && href.endsWith(pathname) ? '#fdf3da' : 'transparent',
                  }}>
                    {label}
                  </a>
                ))}
              </div>
            </div>
          </div>
        ))}
      </nav>

      {/* Mobile dropdown: primary links + every group's links, flat */}
      {mobileOpen && (
        <div className="nav-mobile-panel" style={{
          display: 'none', position: 'absolute', top: 'calc(100% + 8px)', right: 0, minWidth: 250, maxHeight: '70vh',
          overflowY: 'auto', background: 'white', border: '1px solid #d8e0e7', borderRadius: 10,
          boxShadow: '0 18px 40px rgba(15,23,42,.2)', padding: 10, zIndex: 50,
        }}>
          {PRIMARY.map(([label, href]) => (
            <a key={href} href={href} style={{ display: 'block', color: '#284a69', textDecoration: 'none', fontWeight: 900, fontSize: 14.5, padding: '9px 10px', borderRadius: 7 }}>{label}</a>
          ))}
          {GROUPS.map((g) => (
            <div key={g.label} style={{ marginTop: 8 }}>
              <div style={{ color: '#9b6b12', fontWeight: 900, fontSize: 11.5, textTransform: 'uppercase', letterSpacing: 0.5, padding: '4px 10px' }}>{g.label}</div>
              {g.links.map(([label, href]) => (
                <a key={href} href={href} style={{ display: 'block', color: '#33475a', textDecoration: 'none', fontWeight: 700, fontSize: 14, padding: '8px 10px', borderRadius: 7 }}>{label}</a>
              ))}
            </div>
          ))}
        </div>
      )}

      <style>{`
        .nav-dropdown {
          opacity: 0; visibility: hidden; pointer-events: none; transform: translateY(-4px);
          transition: opacity .12s ease, transform .12s ease;
        }
        .nav-group:hover .nav-dropdown,
        .nav-group:focus-within .nav-dropdown,
        .nav-dropdown.force-open {
          opacity: 1; visibility: visible; pointer-events: auto; transform: translateY(0);
        }
        @media (max-width: 860px) {
          .nav-links { display: none !important; }
          .nav-hamburger { display: inline-block !important; }
          .nav-mobile-panel { display: grid !important; }
        }
      `}</style>
    </div>
  )
}
