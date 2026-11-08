import type { ReactNode } from 'react'

// The page is a client component, so its title and description live here.
export const metadata = {
  title: 'Data quality and freshness',
  description: 'How current each dataset behind Riverhead Budget Live is, which figures are official and which are calculated, and what the site checks on every deploy.',
}

export default function DataQualityLayout({ children }: { children: ReactNode }) {
  return children
}
