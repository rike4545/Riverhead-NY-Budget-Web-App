/** @type {import('next').NextConfig} */
// Netlify serves this site from a domain root, not a repo-name subpath — unlike
// GitHub Pages project sites. Netlify's build environment sets NETLIFY=true, so
// that's how we tell the two production targets apart.
const isNetlify = !!process.env.NETLIFY;
const isGitHubPagesProd = process.env.NODE_ENV === 'production' && !isNetlify;
const BASE_PATH = isGitHubPagesProd ? '/Riverhead-NY-Budget-Web-App' : '';

const nextConfig = {
  output: 'export',
  // Emit foo/index.html so trailing-slash links (used throughout the nav)
  // resolve correctly on GitHub Pages.
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  basePath: BASE_PATH,
  assetPrefix: isGitHubPagesProd ? `${BASE_PATH}/` : '',
  env: {
    // Read by every page/component's own `const base = ...` (they build hrefs
    // as plain strings, not next/link, so they can't rely on Next's automatic
    // basePath injection) and by the ETL-generated search index consumer.
    NEXT_PUBLIC_BASE_PATH: BASE_PATH,
  },
};

module.exports = nextConfig;
