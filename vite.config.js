import { defineConfig } from 'vite';

export default defineConfig({
  // Relative base so the build works on any host or sub-path (GitHub Pages, Netlify, a CDN folder).
  base: './',
  server: { port: 5173, open: true },
  preview: { port: 4173 },
  build: {
    target: 'es2020',
    // Three.js is lazy-loaded into its own chunk; it is large by nature.
    chunkSizeWarningLimit: 800,
  },
});
