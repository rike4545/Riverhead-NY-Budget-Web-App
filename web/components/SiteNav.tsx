'use client'
import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { ChevronDown } from 'lucide-react'

const base = process.env.NEXT_PUBLIC_BASE_PATH || ''
type Link = [label: string, href: string]
type Group = { label: string; links: Link[] }

const PRIMARY: Link[] = [
  ['2027 Budget', `${base}/tentative-2027/`],
  ['My Taxes', `${base}/tax-bill/`],
  ['Payroll', `${base}/payroll/`],
  ['Board Votes', `${base}/meetings/`],
  ['Search', `${base}/search/`],
]

const GROUPS: Group[] = [
  { label: 'Explore', links: [
    ['Where Your Levy Goes', `${base}/taxpayer-impact/`], ['What Changed', `${base}/what-changed/`], ['Financial Health', `${base}/analytics/`],
    ['Budget Overview', `${base}/funds/`], ['Program Budget', `${base}/programs/`], ['Budget Compare', `${base}/compare/`],
    ['General Fund', `${base}/general-fund/`], ['Where Revenue Comes From', `${base}/revenue/`], ['Annual Report', `${base}/annual-report/`], ['Tax Cap', `${base}/tax-cap/`],
    ['Reserves & Fund Balance', `${base}/reserves/`], ['Where the Surplus Went', `${base}/fund-balance-draws/`], ['Ambulance Funding (RVAC)', `${base}/rvac-funding/`], ['Budget Changes, Live', `${base}/budget-changes/`], ['Capital & Debt', `${base}/capital-debt/`], ['Town Square', `${base}/town-square/`],
    ['Road Spending', `${base}/road-spending/`], ['Community Preservation Fund', `${base}/community-preservation-fund/`],
    ['Community Housing Plan', `${base}/housing-plan/`], ['Community', `${base}/community/`],
  ] },
  { label: 'Government', links: [
    ['Resident Answers', `${base}/answers/`], ['Organization Chart', `${base}/workforce-by-title/#organization`], ['Workforce by Title', `${base}/workforce-by-title/`], ['Officials & Pensions', `${base}/officials/`], ['Management Pay', `${base}/management-compensation/`], ['Fringe Benefits', `${base}/fringe-benefits/`],
    ['2026 Buyout', `${base}/buyout/`], ['Police Spending & Crime', `${base}/police-crime/`], ['School Resource Officers', `${base}/school-resource-officers/`], ['Supervisors & Council History', `${base}/town-history/`], ['Board Elections', `${base}/board-elections/`],
    ['Campaign Finance', `${base}/campaign-finance/`], ['Candidate Watch', `${base}/candidate-watch/`], ['Candidate Proposals', `${base}/candidate-cost-benefit/`],
    ['Supervisor’s Promises', `${base}/supervisor-promises/`], ['Open Meetings Law', `${base}/open-meetings/`],
  ] },
  { label: 'Research', links: [
    ['Start Here', `${base}/guide/`], ['2027 Tentative Budget', `${base}/tentative-2027/`], ['2027 Prediction', `${base}/predict-2027/`], ['2027 Budget Amendments', `${base}/budget-amendments-2027/`], ['Tax-Cap Letter, Checked', `${base}/tax-cap-letter/`], ['Brookhaven’s 2027 Tentative', `${base}/brookhaven-2027/`], ['Southold’s 2027 Tentative', `${base}/southold-2027/`], ['How Budgets Get Adopted', `${base}/budget-adoption/`], ['Scenario Lab', `${base}/scenarios/`],
    ['2027 Spending Reduction', `${base}/spending-reduction-2027/`], ['Zero or 1% for 2027', `${base}/zero-percent-2027/`],
    ['Credit Rating', `${base}/credit-rating/`], ['Outlier Watch', `${base}/outliers/`], ['Budget Accuracy', `${base}/budget-accuracy/`], ['Fiscal Impact', `${base}/fiscal-impact/`], ['Contracts & Bids', `${base}/contracts/`],
  ] },
  { label: 'Evidence', links: [
    ['Source Library', `${base}/sources/`], ['Records to Request', `${base}/records/`], ['Downloads', `${base}/downloads/`], ['Data Quality & Freshness', `${base}/data-quality/`],
    ['Standards (GFOA)', `${base}/gfoa/`], ['Election Law Case', `${base}/election-law-case/`],
    ['Officials on Social Media', `${base}/official-social-media/`], ['Know Your Rights (ICE)', `${base}/know-your-rights/`],
  ] },
]

const linkStyle = { color: 'white', textDecoration: 'none', border: '1px solid transparent', borderRadius: 8, padding: '7px 9px', fontWeight: 650, background: 'transparent', fontSize: 14, whiteSpace: 'nowrap' as const, display: 'inline-flex', alignItems: 'center', gap: 3 }

export default function SiteNav() {
  const pathname = usePathname() || ''
  const [open, setOpen] = useState<string | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const navRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onMouseDown(e: MouseEvent) { if (navRef.current && !navRef.current.contains(e.target as Node)) setOpen(null) }
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') { setOpen(null); setMobileOpen(false) } }
    document.addEventListener('mousedown', onMouseDown); document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onMouseDown); document.removeEventListener('keydown', onKey) }
  }, [])
  useEffect(() => { setOpen(null); setMobileOpen(false) }, [pathname])

  const normalize = (p: string) => (p.endsWith('/') ? p : `${p}/`)
  const routeOf = (href: string) => normalize(base && href.startsWith(base) ? href.slice(base.length) || '/' : href)
  const isActive = (href: string) => !!pathname && routeOf(href) === normalize(pathname)
  const groupIsActive = (g: Group) => g.links.some(([, href]) => isActive(href))

  return (
    <div ref={navRef} className="nav-root" style={{ position: 'relative', marginLeft: 'auto' }}>
      <button onClick={() => setMobileOpen(v => !v)} aria-label={mobileOpen ? 'Close site navigation' : 'Open site navigation'} aria-controls="site-mobile-navigation" aria-expanded={mobileOpen} className="nav-hamburger rbl-on-dark" style={{ display: 'none', color: 'white', background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.20)', borderRadius: 8, padding: '8px 12px', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>{mobileOpen ? 'Close' : 'Menu'}</button>
      <nav className="nav-links" aria-label="Primary navigation" style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
        {PRIMARY.map(([label, href]) => <a key={href} href={href} className="rbl-on-dark" aria-current={isActive(href) ? 'page' : undefined} style={{ ...linkStyle, ...(isActive(href) ? { background: 'rgba(255,255,255,.14)', borderColor: 'rgba(255,255,255,.16)' } : {}) }}>{label}</a>)}
        {GROUPS.map((g, index) => <div key={g.label} className="nav-group" style={{ position: 'relative' }}>
          <button onClick={() => setOpen(v => v === g.label ? null : g.label)} aria-controls={`nav-dropdown-${g.label.toLowerCase()}`} aria-expanded={open === g.label} className="rbl-on-dark" style={{ ...linkStyle, cursor: 'pointer', ...(groupIsActive(g) || open === g.label ? { background: 'rgba(255,255,255,.14)', borderColor: 'rgba(255,255,255,.16)' } : {}) }}>{g.label}<ChevronDown aria-hidden="true" size={15} strokeWidth={2.25} style={{ opacity: .8, transition: 'transform .15s ease', transform: open === g.label ? 'rotate(180deg)' : 'none' }} /></button>
          <div id={`nav-dropdown-${g.label.toLowerCase()}`} className={`nav-dropdown${open === g.label ? ' force-open' : ''}`} style={{ position: 'absolute', top: '100%', minWidth: 250, maxWidth: 320, paddingTop: 9, zIndex: 40, ...(index >= GROUPS.length - 2 ? { right: 0 } : { left: 0 }) }}>
            <div style={{ background: 'var(--rbl-surface)', border: '1px solid var(--rbl-border)', borderRadius: 12, boxShadow: '0 18px 44px rgba(15,35,55,.16)', padding: 7, display: 'grid', gap: 1, maxHeight: '72vh', overflowY: 'auto' }}>
              {g.links.map(([label, href]) => { const active = isActive(href); return <a key={href} href={href} className="nav-dropdown-link" aria-current={active ? 'page' : undefined} style={{ color: 'var(--rbl-text-strong)', textDecoration: 'none', fontWeight: active ? 700 : 500, fontSize: 15, padding: '8px 10px', borderRadius: 8, background: active ? 'var(--rbl-info-bg)' : 'transparent', display: 'block' }}>{label}</a> })}
            </div>
          </div>
        </div>)}
      </nav>
      {mobileOpen && <div id="site-mobile-navigation" className="nav-mobile-panel" aria-label="Site navigation" style={{ display: 'none', position: 'absolute', top: 'calc(100% + 8px)', right: 0, maxHeight: '78vh', overflowY: 'auto', background: 'var(--rbl-surface)', border: '1px solid var(--rbl-border)', borderRadius: 14, boxShadow: '0 18px 44px rgba(15,35,55,.18)', padding: 10, zIndex: 50 }}>
        <div style={{ color: 'var(--rbl-text-muted)', fontWeight: 750, fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase', padding: '7px 10px' }}>Quick access</div>
        <div className="nav-mobile-quick">
          {PRIMARY.map(([label, href]) => <a key={href} href={href} aria-current={isActive(href) ? 'page' : undefined} style={{ display: 'block', color: 'var(--rbl-title)', textDecoration: 'none', fontWeight: 750, fontSize: 15, padding: '10px', borderRadius: 9, background: isActive(href) ? 'var(--rbl-info-bg)' : 'var(--rbl-surface-2)' }}>{label}</a>)}
        </div>
        {GROUPS.map(g => <details key={g.label} className="nav-mobile-group" defaultOpen={groupIsActive(g)}>
          <summary>{g.label}<ChevronDown aria-hidden="true" size={16} /></summary>
          <div className="nav-mobile-group-links">{g.links.map(([label, href]) => <a key={href} href={href} aria-current={isActive(href) ? 'page' : undefined} style={{ background: isActive(href) ? 'var(--rbl-info-bg)' : 'transparent', fontWeight: isActive(href) ? 750 : 500 }}>{label}</a>)}</div>
        </details>)}
      </div>}
    </div>
  )
}
