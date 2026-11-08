'use client'

import { useEffect } from 'react'

// A table wider than the screen sits in a box that scrolls sideways. Keyboard
// users can only scroll it if the box can take focus (WCAG 2.1.1), and a screen
// reader needs a name for it. This marks each box that actually scrolls, names it
// after its table's caption or the nearest heading, and undoes the mark when the
// window widens and the box no longer scrolls. Boxes a page already made
// focusable are left alone. Every scrolling box on the site sets its overflow
// inline, so only those are checked.
const MARK = 'data-rbl-scroll-region'

function nameFor(el: HTMLElement): string {
  const caption = el.querySelector('caption')?.textContent?.trim()
  if (caption) return caption
  let node: Element | null = el
  while (node && node !== document.body) {
    let prev = node.previousElementSibling
    while (prev) {
      const h = prev.matches('h1,h2,h3,h4') ? prev : prev.querySelector('h1,h2,h3,h4')
      if (h?.textContent?.trim()) return h.textContent.trim()
      prev = prev.previousElementSibling
    }
    node = node.parentElement
  }
  return 'Table'
}

function update() {
  for (const el of Array.from(document.querySelectorAll<HTMLElement>(`main [style*="overflow"], main [${MARK}]`))) {
    const marked = el.hasAttribute(MARK)
    if (!marked && el.hasAttribute('tabindex')) continue
    const style = getComputedStyle(el)
    const scrolls = (style.overflowX === 'auto' || style.overflowX === 'scroll') && el.scrollWidth > el.clientWidth + 1
    if (scrolls && !marked) {
      el.setAttribute(MARK, '')
      el.tabIndex = 0
      if (!el.hasAttribute('role')) el.setAttribute('role', 'region')
      if (!el.hasAttribute('aria-label') && !el.hasAttribute('aria-labelledby')) el.setAttribute('aria-label', `${nameFor(el)} (scrolls sideways)`)
    } else if (!scrolls && marked) {
      el.removeAttribute(MARK)
      el.removeAttribute('tabindex')
      if (el.getAttribute('role') === 'region') el.removeAttribute('role')
      if (el.getAttribute('aria-label')?.endsWith('(scrolls sideways)')) el.removeAttribute('aria-label')
    }
  }
}

export default function ScrollRegions() {
  useEffect(() => {
    let frame = 0
    const schedule = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(update) }
    schedule()
    window.addEventListener('resize', schedule)
    const observer = new MutationObserver(schedule)
    const main = document.querySelector('main')
    if (main) observer.observe(main, { childList: true, subtree: true })
    return () => { cancelAnimationFrame(frame); window.removeEventListener('resize', schedule); observer.disconnect() }
  }, [])
  return null
}
