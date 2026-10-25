import { defineConfig } from 'astro/config';

// BASE_PATH lets the same build run at the domain root (www.3h-i.com)
// or under a sub-path such as GitHub Pages (/3hi_01/).
const base = process.env.BASE_PATH || '/';

export default defineConfig({
  site: process.env.SITE_URL || 'https://www.3h-i.com',
  base,
  trailingSlash: 'ignore',
  build: { inlineStylesheets: 'auto' },
  vite: {
    build: { chunkSizeWarningLimit: 800 },
  },
});
