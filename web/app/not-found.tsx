import PageShell from '../components/PageShell'

// GitHub Pages serves this for any address the site does not have. It replaces
// Next's built-in page, whose inline <style> and second <title> the W3C Nu HTML
// Checker rejects.
const base = process.env.NEXT_PUBLIC_BASE_PATH || ''

export const metadata = { title: 'Page not found' }

export default function NotFound() {
  return (
    <PageShell title="Page not found" subtitle="There is no page at this address. It may have moved, or the link may be mistyped.">
      <div style={{ background: 'var(--rbl-surface)', border: '1px solid var(--rbl-border-subtle)', borderRadius: 16, padding: 20 }}>
        <p style={{ margin: 0, color: 'var(--rbl-text-body)', fontSize: 16, lineHeight: 1.6 }}>
          <a href={`${base}/search/`} style={{ color: 'var(--rbl-link)', fontWeight: 600 }}>Search</a> finds a figure, a vote or a
          document by name. Or start again from the{' '}
          <a href={`${base}/`} style={{ color: 'var(--rbl-link)', fontWeight: 600 }}>home page</a>.
        </p>
      </div>
    </PageShell>
  )
}
