'use client'
import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { ChevronDown, Search } from 'lucide-react'

const base = process.env.NEXT_PUBLIC_BASE_PATH || ''
type Link = [label: string, href: string]
type Group = { label: string; links: Link[] }

// Menu labels are in sentence case (DESIGN.md) and name what the reader gets,
// not the site's section. Each page appears once. Groups hold related pages so
// no menu runs past about 14 items: a resident looking for the 2027 budget, pay,
// land use or elections should find it under that word.
const PRIMARY: Link[] = [
  ['Property taxes', `${base}/tax-bill/`],
  ['Board votes', `${base}/meetings/`],
  ['Search', `${base}/search/`],
]

const GROUPS: Group[] = [
  { label: '2027 budget', links: [
    ['The 2027 budget', `${base}/tentative-2027/`], ['What changed from 2026', `${base}/what-changed/`], ['Budget amendments', `${base}/budget-amendments-2027/`],
    ['How the budget is adopted', `${base}/budget-adoption/`], ['Where the money goes (flow chart)', `${base}/budget-flow/`], ['Property-tax cap', `${base}/tax-cap/`],
    ['The tax-cap letter, checked', `${base}/tax-cap-letter/`], ['2027 forecast', `${base}/predict-2027/`], ['Ways to cut 2027 spending', `${base}/spending-reduction-2027/`],
    ['A 0% or 1% levy for 2027', `${base}/zero-percent-2027/`], ['Try your own budget', `${base}/scenarios/`], ['Brookhaven’s 2027 budget', `${base}/brookhaven-2027/`], ['Southold’s 2027 budget', `${base}/southold-2027/`],
  ] },
  { label: 'Finances', links: [
    ['Financial health', `${base}/analytics/`], ['Where your Town levy goes', `${base}/taxpayer-impact/`], ['Budget by fund', `${base}/funds/`], ['Spending by service', `${base}/programs/`],
    ['Compare budgets', `${base}/compare/`], ['General Fund', `${base}/general-fund/`], ['Revenue', `${base}/revenue/`], ['Grants', `${base}/grants/`],
    ['Savings and reserves', `${base}/reserves/`], ['How savings were used', `${base}/fund-balance-draws/`], ['Projects and borrowing', `${base}/capital-debt/`], ['Credit rating', `${base}/credit-rating/`],
    ['Annual financial report', `${base}/annual-report/`], ['Population and tax base', `${base}/community/`],
  ] },
  { label: 'Pay and staff', links: [
    ['Employee pay and overtime', `${base}/payroll/`], ['Town jobs and staffing', `${base}/workforce-by-title/`], ['Organization chart', `${base}/workforce-by-title/#organization`],
    ['Elected officials and pensions', `${base}/officials/`], ['Management pay and benefits', `${base}/management-compensation/`], ['Fringe benefits', `${base}/fringe-benefits/`], ['2026 retirement buyout', `${base}/buyout/`],
  ] },
  { label: 'Spending checks', links: [
    ['Budget vs. actual spending', `${base}/budget-accuracy/`], ['Budget changes the Board approved', `${base}/budget-changes/`], ['Cost of Board decisions', `${base}/fiscal-impact/`],
    ['Unusual spending patterns', `${base}/outliers/`], ['Contracts and bids', `${base}/contracts/`], ['Optimum cable franchise and Verizon', `${base}/cable-franchise/`], ['Legal costs', `${base}/legal-costs/`], ['Regional CPF counsel', `${base}/regional-cpf-counsel/`],
    ['Town Square project', `${base}/town-square/`], ['New Justice Court at 200 Howell', `${base}/justice-court/`], ['Road spending', `${base}/road-spending/`], ['Ambulance funding', `${base}/rvac-funding/`],
    ['Police spending and crime', `${base}/police-crime/`], ['School resource officers', `${base}/school-resource-officers/`],
  ] },
  { label: 'Land use', links: [
    ['Community Preservation Fund', `${base}/community-preservation-fund/`], ['Preserved land', `${base}/preserved-land/`], ['Transfer of development rights', `${base}/tdr/`],
    ['Comprehensive Plan tracker', `${base}/comprehensive-plan/`], ['Community Housing Plan', `${base}/housing-plan/`], ['The former armory and the YMCA', `${base}/armory/`], ['Assessment roll', `${base}/assessment/`],
  ] },
  { label: 'Elections', links: [
    ['How each member votes', `${base}/board-votes/`], ['Supervisors and Council history', `${base}/town-history/`], ['State of the Town addresses', `${base}/state-of-the-town/`],
    ['Supervisor’s promises', `${base}/supervisor-promises/`], ['Board election results', `${base}/board-elections/`], ['Election map', `${base}/election-map/`],
    ['Campaign finance', `${base}/campaign-finance/`], ['Donation map', `${base}/donation-map/`], ['2026 candidates', `${base}/candidate-watch/`], ['Candidates’ proposals, costed', `${base}/candidate-cost-benefit/`],
    ['Officials on social media', `${base}/official-social-media/`], ['Election law case', `${base}/election-law-case/`],
  ] },
  { label: 'Help', links: [
    ['Start here', `${base}/guide/`], ['Glossary of terms', `${base}/glossary/`], ['How the Town’s books work', `${base}/accounting-basics/`], ['Fiscal impact statement helper', `${base}/fiscal-impact-helper/`], ['Guided tour', `${base}/explore/`], ['Questions residents ask', `${base}/answers/`], ['How to check a figure', `${base}/evidence/`],
    ['Original documents', `${base}/sources/`], ['Records the Town has not published', `${base}/records/`], ['Downloads', `${base}/downloads/`], ['Data quality and freshness', `${base}/data-quality/`],
    ['Budget best practices (GFOA)', `${base}/gfoa/`], ['Following how the Town is governed', `${base}/governance-accountability/`], ['Open Meetings Law', `${base}/open-meetings/`], ['Know your rights (ICE)', `${base}/know-your-rights/`],
  ] },
]

const linkStyle = { color: 'white', textDecoration: 'none', border: '1px solid transparent', borderRadius: 8, padding: '7px 9px', fontWeight: 650, background: 'transparent', fontSize: 14, minHeight: 44, whiteSpace: 'nowrap' as const, display: 'inline-flex', alignItems: 'center', gap: 3 }

// The phone menu's tiles sit two to a row, so it adds a fourth: Employee pay,
// which on desktop sits first under Pay and staff. It sits after GROUPS so the
// apps' parity checks, which read PRIMARY through GROUPS, see each page once.
const QUICK: Link[] = [PRIMARY[0], ['Employee pay', `${base}/payroll/`], ...PRIMARY.slice(1)]

export default function SiteNav() {
  const pathname = usePathname() || ''
  const [open, setOpen] = useState<string | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mobileQuery, setMobileQuery] = useState('')
  const navRef = useRef<HTMLDivElement>(null)
  const mobileButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    function onMouseDown(e: MouseEvent) { if (navRef.current && !navRef.current.contains(e.target as Node)) setOpen(null) }
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') { const panel = document.getElementById('site-mobile-navigation'); const restoreFocus = !!panel?.contains(document.activeElement); setOpen(null); setMobileOpen(false); setMobileQuery(''); if (restoreFocus) mobileButtonRef.current?.focus() } }
    document.addEventListener('mousedown', onMouseDown); document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onMouseDown); document.removeEventListener('keydown', onKey) }
  }, [])
  useEffect(() => { setOpen(null); setMobileOpen(false); setMobileQuery('') }, [pathname])

  const normalize = (p: string) => (p.endsWith('/') ? p : `${p}/`)
  const routeOf = (href: string) => normalize(base && href.startsWith(base) ? href.slice(base.length) || '/' : href)
  const isActive = (href: string) => !!pathname && routeOf(href) === normalize(pathname)
  const groupIsActive = (g: Group) => g.links.some(([, href]) => isActive(href))
  // IDs are referenced by aria-controls, so derive stable, valid HTML identifiers
  // rather than embedding display labels that contain spaces or ampersands.
  const groupId = (g: Group) => `nav-dropdown-${g.label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`

  return (
    <div ref={navRef} className="nav-root" style={{ position: 'relative', marginLeft: 'auto' }}>
      <button ref={mobileButtonRef} onClick={() => setMobileOpen(v => !v)} aria-label={mobileOpen ? 'Close site navigation' : 'Open site navigation'} aria-controls="site-mobile-navigation" aria-expanded={mobileOpen} className="nav-hamburger rbl-on-dark" style={{ display: 'none', color: 'white', background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.20)', borderRadius: 8, padding: '8px 12px', fontWeight: 600, fontSize: 15, minWidth: 44, minHeight: 44, cursor: 'pointer' }}>{mobileOpen ? 'Close' : 'Menu'}</button>
      <nav className="nav-links" aria-label="Primary navigation" style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
        {PRIMARY.map(([label, href]) => <a key={href} href={href} className="rbl-on-dark" aria-current={isActive(href) ? 'page' : undefined} style={{ ...linkStyle, ...(isActive(href) ? { background: 'rgba(255,255,255,.14)', borderColor: 'rgba(255,255,255,.16)' } : {}) }}>{label}</a>)}
        {GROUPS.map((g, index) => <div key={g.label} className="nav-group" style={{ position: 'relative' }}>
          <button onClick={() => setOpen(v => v === g.label ? null : g.label)} aria-controls={groupId(g)} aria-expanded={open === g.label} className="rbl-on-dark" style={{ ...linkStyle, cursor: 'pointer', ...(groupIsActive(g) || open === g.label ? { background: 'rgba(255,255,255,.14)', borderColor: 'rgba(255,255,255,.16)' } : {}) }}>{g.label}<ChevronDown aria-hidden="true" size={15} strokeWidth={2.25} style={{ opacity: .8, transition: 'transform .15s ease', transform: open === g.label ? 'rotate(180deg)' : 'none' }} /></button>
          <div id={groupId(g)} className={`nav-dropdown${open === g.label ? ' force-open' : ''}`} style={{ position: 'absolute', top: '100%', minWidth: 250, maxWidth: 320, paddingTop: 9, zIndex: 40, ...(index >= GROUPS.length - 2 ? { right: 0 } : { left: 0 }) }}>
            <div style={{ background: 'var(--rbl-surface)', border: '1px solid var(--rbl-border)', borderRadius: 12, boxShadow: '0 18px 44px rgba(15,35,55,.16)', padding: 7, display: 'grid', gap: 1, maxHeight: '72vh', overflowY: 'auto' }}>
              {g.links.map(([label, href]) => { const active = isActive(href); return <a key={href} href={href} className="nav-dropdown-link" aria-current={active ? 'page' : undefined} style={{ color: 'var(--rbl-text-strong)', textDecoration: 'none', fontWeight: active ? 700 : 500, fontSize: 15, padding: '8px 10px', borderRadius: 8, background: active ? 'var(--rbl-info-bg)' : 'transparent', display: 'block' }}>{label}</a> })}
            </div>
          </div>
        </div>)}
      </nav>
      <nav id="site-mobile-navigation" className="nav-mobile-panel" aria-label="Site navigation" hidden={!mobileOpen} style={{ display: 'none', position: 'absolute', top: 'calc(100% + 8px)', right: 12, width: 'min(560px, calc(100vw - 24px))', maxHeight: 'min(78dvh, 720px)', overflowY: 'auto', background: 'var(--rbl-surface)', border: '1px solid var(--rbl-border)', borderRadius: 14, boxShadow: '0 18px 44px rgba(15,35,55,.18)', padding: 10, zIndex: 50 }}>
        <label htmlFor="mobile-site-search" style={{ display: 'block', color: 'var(--rbl-text-muted)', fontWeight: 750, fontSize: 13, padding: '8px 10px' }}>Find a page</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '0 11px', border: '1px solid var(--rbl-border)', borderRadius: 10, background: 'var(--rbl-surface-2)' }}>
          <Search aria-hidden="true" size={17} color="var(--rbl-text-muted)" />
          <input id="mobile-site-search" type="search" value={mobileQuery} onChange={event => setMobileQuery(event.target.value)} placeholder="Search pages…" className="nav-mobile-search-input" style={{ width: '100%', minWidth: 0, height: 44, border: 0, background: 'transparent', color: 'var(--rbl-text)', fontSize: 15 }} />
        </div>
        {!mobileQuery.trim() && <>
          <div style={{ color: 'var(--rbl-text-muted)', fontWeight: 650, fontSize: 13, padding: '13px 10px 7px' }}>Quick access</div>
          <div className="nav-mobile-quick">
            {QUICK.map(([label, href]) => <a key={href} href={href} aria-current={isActive(href) ? 'page' : undefined} style={{ display: 'block', color: 'var(--rbl-title)', textDecoration: 'none', fontWeight: 750, fontSize: 15, minHeight: 44, padding: '10px', borderRadius: 9, background: isActive(href) ? 'var(--rbl-info-bg)' : 'var(--rbl-surface-2)' }}>{label}</a>)}
          </div>
        </>}
        {GROUPS.map(g => {
          const matches = g.links.filter(([label]) => label.toLowerCase().includes(mobileQuery.trim().toLowerCase()))
          if (mobileQuery.trim() && matches.length === 0) return null
          return <details key={g.label} className="nav-mobile-group" open={mobileQuery.trim() ? true : groupIsActive(g)}>
            <summary>{g.label}<ChevronDown aria-hidden="true" size={16} /></summary>
            <div className="nav-mobile-group-links">{(mobileQuery.trim() ? matches : g.links).map(([label, href]) => <a key={href} href={href} aria-current={isActive(href) ? 'page' : undefined} style={{ background: isActive(href) ? 'var(--rbl-info-bg)' : 'transparent', fontWeight: isActive(href) ? 750 : 500 }}>{label}</a>)}</div>
          </details>
        })}
        {mobileQuery.trim() && !QUICK.some(([label]) => label.toLowerCase().includes(mobileQuery.trim().toLowerCase())) && !GROUPS.some(g => g.links.some(([label]) => label.toLowerCase().includes(mobileQuery.trim().toLowerCase()))) && <p role="status" style={{ margin: '14px 10px', color: 'var(--rbl-text-muted)', fontSize: 14 }}>No pages match “{mobileQuery.trim()}”. Try another term.</p>}
        {mobileQuery.trim() && QUICK.some(([label]) => label.toLowerCase().includes(mobileQuery.trim().toLowerCase())) && <div style={{ marginTop: 8 }} className="nav-mobile-quick">{QUICK.filter(([label]) => label.toLowerCase().includes(mobileQuery.trim().toLowerCase())).map(([label, href]) => <a key={href} href={href} aria-current={isActive(href) ? 'page' : undefined} style={{ display: 'block', color: 'var(--rbl-title)', textDecoration: 'none', fontWeight: 750, fontSize: 15, padding: '10px', borderRadius: 9, background: isActive(href) ? 'var(--rbl-info-bg)' : 'var(--rbl-surface-2)' }}>{label}</a>)}</div>}
      </nav>
    </div>
  )
}
