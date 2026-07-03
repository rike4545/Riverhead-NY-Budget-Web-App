import type { MetadataRoute } from 'next'
import { allFundCodes } from '../lib/subaccounts'

export const dynamic = 'force-static'

const SITE = 'https://rike4545.github.io/rike4545-riverhead-budget-live'

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    '', '/guide', '/payroll', '/funds', '/compare', '/general-fund',
    '/annual-report', '/meetings', '/search', '/downloads',
    '/analytics', '/sources', '/scenarios',
    ...allFundCodes().map((code) => `/funds/${code}`),
  ]
  const now = new Date()
  return routes.map((route) => ({
    url: `${SITE}${route}/`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1 : route.startsWith('/funds/') ? 0.6 : 0.8,
  }))
}
