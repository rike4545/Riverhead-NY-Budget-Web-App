/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production';

const nextConfig = {
  output: 'export',
  // Emit foo/index.html so trailing-slash links (used throughout the nav)
  // resolve correctly on GitHub Pages.
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  basePath: isProd ? '/rike4545-riverhead-budget-live' : '',
  assetPrefix: isProd ? '/rike4545-riverhead-budget-live/' : '',
};

module.exports = nextConfig;
