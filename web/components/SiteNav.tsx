'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'

const base = process.env.NEXT_PUBLIC_BASE_PATH || ''

type Link = [label: string, href: string]
type Group = { label: string; links: Link[] }

// Keep the header focused on resident questions. The deeper research tools remain
// available, but they no longer compete with the core tasks of understanding taxes,
// spending, government, financial health, and evidence.
const PRIMARY: Link[] = [
  ['Ask', `${base}/answers/`],
  ['My Taxes', `${base}/tax-bill/`],
  ['Search', `${base}/search/`],
]

const GROUPS: Group[] = [
  {
    label: 'Money',
    links: [
      ['Budget Overview', `${base}/funds/`],
      ['Program Budget', `${base}/programs/`],
      ['Budget Compare', `${base}/compare/`],
      ['General Fund', `${base}/general-fund/`],
      ['Annual Report', `${base}/annual-report/`],
      ['Tax Cap', `${base}/tax-cap/`],
      ['Reserves & Fund Balance', `${base}/reserves/`],
      ['Capital & Debt', `${base}/capital-debt/`],
      ['Town Square', `${base}/town-square/`],
      ['Road Spending', `${base}/road-spending/`],
      ['Community Preservation Fund', `${base}/community-preservation-fund/`],
      ['Community Housing Plan', `${base}/housing-plan/`],
      ['Community', `${base}/community/`],
    ],
  },
  {
    label: 'People & Government',
    links: [
      ['Payroll', `${base}/payroll/`],
      ['Workforce by Title', `${base}/workforce-by-title/`],
      ['Officials & Pensions', `${base}/officials/`],
      ['2026 Buyout', `${base}/buyout/`],
      ['Town Board Votes', `${base}/meetings/`],
      ['Supervisors & Council History', `${base}/town-history/`],
      ['Board Elections', `${base}/board-elections/`],
    ],
  },
  {
    label: 'Financial Health',
    links: [
      ['Financial Health', `${base}/analytics/`],
      ['2027 Prediction', `${base}/predict-2027/`],
      ['2027 Spending Reduction', `${base}/spending-reduction-2027/`],
      ['A Zero-Percent Year', `${base}/zero-percent-2027/`],
      ['Scenario Lab', `${base}/scenarios/`],
      ['Credit Rating', `${base}/credit-rating/`],
      ['Outlier Watch', `${base}/outliers/`],
      ['Budget Accuracy', `${base}/budget-accuracy/`],
      ['Fiscal Impact', `${base}/fiscal-impact/`],
    ],
  },
  {
    label: 'Evidence & Civic',
    links: [
      ['Source Library', `${base}/sources/`],
      ['Downloads', `${base}/downloads/`],
      ['Standards (GFOA)', `${base}/gfoa/`],
      ['Campaign Finance', `${base}/campaign-finance/`],
      ['Candidate Watch', `${base}/candidate-watch/`],
      ['Candidate Proposals: Cost & Benefit', `${base}/candidate-cost-benefit/`],
      ['Election Law Case', `${base}/election-law-case/`],
      ['Officials on Social Media', `${base}/official-social-media/`],
      ['Know Your Rights (ICE)', `${base}/know-your-rights/`],
      ['Start Here (Guide)', `${base}/guide/`],
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
    function onMouseDown(e: MouseEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) setOpen(null)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(null)
    }
    document.addEventListener('mousedown', onMouseDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  useEffect(() => { setOpen(null); setMobileOpen(false) }, [pathname])

  const normalise = (p: string) => (p.endsWith('/') ? p : `${p}/`)
  const routeOf = (href: string) => normalise(base && href.startsWith(base) ? href.slice(base.length) || '/' : href)
  const isActive = (href: string) => !!pathname && routeOf(href) === normalise(pathname)
  const groupIsActive = (g: Group) => g.links.some(([, href]) => isActive(href))

  return (
    <div ref={navRef} className="nav-root" style={{ position: 'relative', marginLeft: 'auto' }}>
      <button
        onClick={() => setMobileOpen((v) => !v)}
        aria-label="Toggle menu"
        aria-expanded={mobileOpen}
        className="nav-hamburger"
        style={{ display: 'none', color: 'white', background: 'rgba(12,43,72,.5)', border: '1px solid rgba(255,255,255,.3)', borderRadius: 6, padding: '9px 14px', fontWeight: 900, fontSize: 15, cursor: 'pointer' }}
      >
        {mobileOpen ? '✕ Close' : '☰ Menu'}
      </button>

      <nav className="nav-links" aria-label="Main navigation" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        {PRIMARY.map(([label, href]) => (
          <a key={href} href={href} style={{ ...linkStyle, ...(isActive(href) ? { background: 'var(--rbl-fill-gold)', border: '1px solid var(--rbl-gold-border)', color: 'var(--rbl-on-gold)' } : {}) }}>
            {label}
          </a>
        ))}

        {GROUPS.map((g, index) => (
          <div key={g.label} className="nav-group" style={{ position: 'relative' }}>
            <button
              onClick={() => setOpen((v) => (v === g.label ? null : g.label))}
              aria-expanded={open === g.label}
              style={{ ...linkStyle, cursor: 'pointer', ...(groupIsActive(g) || open === g.label ? { background: 'var(--rbl-fill-gold)', border: '1px solid var(--rbl-gold-border)', color: 'var(--rbl-on-gold)' } : {}) }}
            >
              {g.label} ▾
            </button>
            <div className={`nav-dropdown${open === g.label ? ' force-open' : ''}`} style={{ position: 'absolute', top: '100%', minWidth: 245, paddingTop: 8, zIndex: 40, ...(index === GROUPS.length - 1 ? { right: 0 } : { left: 0 }) }}>
              <div style={{ background: 'var(--rbl-surface)', border: '1px solid var(--rbl-border)', borderRadius: 10, boxShadow: '0 18px 40px var(--rbl-shadow)', padding: 8, display: 'grid', gap: 2 }}>
                {g.links.map(([label, href]) => {
                  const active = isActive(href)
                  return (
                    <a key={href} href={href} className="nav-dropdown-link" style={{ color: active ? 'var(--rbl-title)' : 'var(--rbl-text-strong)', textDecoration: 'none', fontWeight: active ? 900 : 600, fontSize: 13.5, padding: '8px 10px', borderRadius: 7, background: active ? 'var(--rbl-warn-bg)' : 'transparent', borderLeft: active ? '3px solid var(--rbl-gold-border)' : '3px solid transparent', display: 'block', transition: 'background .1s' }}>
                      {label}
                    </a>
                  )
                })}
              </div>
            </div>
          </div>
        ))}
      </nav>

      {mobileOpen && (
        <div className="nav-mobile-panel" style={{ display: 'none', position: 'absolute', top: 'calc(100% + 8px)', right: 0, minWidth: 250, maxHeight: '70vh', overflowY: 'auto', background: 'var(--rbl-surface)', border: '1px solid var(--rbl-border)', borderRadius: 10, boxShadow: '0 18px 40px var(--rbl-shadow)', padding: 10, zIndex: 50 }}>
          {PRIMARY.map(([label, href]) => (
            <a key={href} href={href} style={{ display: 'block', color: 'var(--rbl-title)', textDecoration: 'none', fontWeight: 900, fontSize: 14.5, padding: '9px 10px', borderRadius: 7 }}>{label}</a>
          ))}
          {GROUPS.map((g) => (
            <div key={g.label} style={{ marginTop: 8 }}>
              <div style={{ color: 'var(--rbl-badge)', fontWeight: 900, fontSize: 11.5, textTransform: 'uppercase', letterSpacing: 0.5, padding: '4px 10px' }}>{g.label}</div>
              {g.links.map(([label, href]) => (
                <a key={href} href={href} style={{ display: 'block', color: 'var(--rbl-text-strong)', textDecoration: 'none', fontWeight: 700, fontSize: 14, padding: '8px 10px', borderRadius: 7 }}>{label}</a>
              ))}
            </div>
          ))}
        </div>
      )}

      <style>{`
        .nav-dropdown { opacity: 0; visibility: hidden; pointer-events: none; transform: translateY(-4px); transition: opacity .12s ease, transform .12s ease; }
        .nav-group:hover .nav-dropdown, .nav-group:focus-within .nav-dropdown, .nav-dropdown.force-open { opacity: 1; visibility: visible; pointer-events: auto; transform: translateY(0); }
        .nav-dropdown-link:hover { background: var(--rbl-info-bg) !important; color: var(--rbl-title) !important; }
        @media (max-width: 980px) {
          .nav-links { display: none !important; }
          .nav-hamburger { display: inline-block !important; }
          .nav-root { position: static !important; }
          .nav-mobile-panel { display: grid !important; left: 12px !important; right: 12px !important; top: calc(100% + 10px) !important; min-width: 0 !important; max-width: none !important; }
        }
      `}</style>
    </div>
  )
}
