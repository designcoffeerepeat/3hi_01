# 3h-i.com: yellow design

The yellow (#ffd600) design for **3 Horizons Interactive (3H-i)**, a new wave digital agency in Los Angeles and New York. It lives in its own folder and builds separately from the site at the repository root. On GitHub Pages it is served at `/yellow/` (for example https://designcoffeerepeat.github.io/3hi_01/yellow/).

Built with [Astro](https://astro.build) and [Three.js](https://threejs.org), with [Lenis](https://lenis.darkroom.engineering) smooth scrolling. Pages are plain Astro components with scoped CSS; the 3D scenes are small TypeScript modules that load only when needed.

## Quick start

1. Install [Node.js](https://nodejs.org) 22.12 or newer.
2. Open the folder in VS Code and accept the recommended extensions (Astro, Prettier, EditorConfig).
3. In this `yellow/` folder, run:

   ```bash
   cd yellow
   npm install
   npm run dev
   ```

   The site opens at http://localhost:4321 with hot reload.

| Script            | What it does                       |
| ----------------- | ---------------------------------- |
| `npm run dev`     | Local dev server with hot reload   |
| `npm run build`   | Static build into `dist/`          |
| `npm run preview` | Serve the production build locally |
| `npm run format`  | Prettier over the whole project    |

## Project structure

```
astro.config.mjs           site URL and base path (BASE_PATH env var)
public/                    favicon, og-image, robots.txt, sitemap.xml
src/
  data/site.ts             copy that repeats: nav, services, clients, work, method
  layouts/Base.astro       <head>, SEO and JSON-LD
  pages/index.astro        the page, section by section
  components/
    Nav.astro              floating nav bar and mobile menu
    Logo.astro             the official logo, inlined
    Hero.astro             headline, floating service chips and the 3D "3"
    AiScan.astro           "Does AI recommend you?" scan form, orb and results
    Clients.astro          scrolling client names
    Services.astro         pinned sideways gallery of service cards
    Glyph.astro            layered service illustrations with parallax
    Horizons.astro         method section with parallax landscape
    Work.astro             selected work list
    Contact.astro          contact form
    Footer.astro
  scripts/
    motion.ts              Lenis, reveal on scroll, [data-speed] parallax
    scan.ts                scan logic (demo result or live endpoint)
    webgl.ts               WebGL feature check
    three/
      common.ts            renderer, lighting, palette from CSS, render loop
      hero.ts              extruded logo "3" and floating objects
      scan-orb.ts          point-cloud orb that reacts to the scan
  styles/global.css        colour tokens, type, buttons, reveal
```

## Colours and logo

Yellow `#ffd600` leads; black and white do the rest. All colours are CSS custom properties at the top of `src/styles/global.css`, and the Three.js scenes read the same properties at start-up.

The logo is the official file in `src/assets/logo.svg`. `Logo.astro` inlines it so the wordmark turns white on dark sections while the "3" keeps its yellow. The hero's 3D "3" is extruded from the same path (`src/assets/three-path.ts`), and so is the favicon.

## Motion

- **Parallax.** Any element with `data-speed="0.12"` (positive or negative) drifts relative to its parent as it crosses the screen. Keep values between about -0.3 and 0.3.
- **Reveal.** `data-reveal` fades an element up when it enters the screen. `style="--d:1"` staggers it.
- **3D.** The hero and the scan orb pause when off screen. Mouse movement tilts them; near objects move more than far ones.

Everything respects `prefers-reduced-motion`: smooth scroll, parallax and animation stop, and the 3D scenes render one still frame. Without WebGL, the hero keeps its gradient and the scan orb falls back to a CSS sphere.

## The AI scan

A static site cannot read another website from the browser (cross-site requests are blocked), so by default the scan shows a **demo result**. It is built from the address alone, is the same every time for the same address, and is labelled "Demo result" on the page.

To run real scans, deploy an API and set:

```
PUBLIC_SCAN_ENDPOINT=https://your-api.example.com/scan
```

The page POSTs `{ "url": "https://example.com/" }` and expects:

```json
{
  "score": 64,
  "summary": "One line shown under the score.",
  "checks": [
    { "id": "crawl", "label": "Open to AI crawlers", "score": 80, "note": "Short explanation." }
  ]
}
```

If the endpoint fails, the page falls back to the demo result. The "Get my real AI audit" button carries the scanned address into the contact form.

## Contact form

By default the form opens a pre-filled email to info@3h-i.com. To send submissions to Formspree, Basin or your own API, set `PUBLIC_FORM_ENDPOINT` (see `.env.example`). The form sends JSON with `name`, `email`, `website`, `topics` and `message`.

## Deploying

- **GitHub Pages:** every push to `main` runs `.github/workflows/deploy.yml` at the repository root, which builds this folder with `BASE_PATH=/<repo name>/yellow/` and publishes it at `/yellow/`.
- **Custom domain, Netlify, Vercel or Cloudflare Pages:** build command `npm run build`, output directory `dist`. Leave `BASE_PATH` unset to serve from the domain root.

## Credits

The feel (big tight type, bright cards, playful floating objects) was inspired by [readymag.com](https://readymag.com/). All code, copy and visuals here are original; nothing was copied from that site.

Fonts: Geist, Geist Mono and Instrument Serif (SIL Open Font License), self-hosted through Fontsource. Libraries: Astro, Three.js and Lenis (MIT).
