# 3h-i.com

The new marketing site for **3 Horizons Interactive (3H-i)**, a new wave digital agency in Los Angeles and New York.

Built with [Vite](https://vite.dev), [Three.js](https://threejs.org), [GSAP](https://gsap.com) (ScrollTrigger and SplitText) and [Lenis](https://lenis.darkroom.engineering) smooth scrolling. There is no framework: just semantic HTML, modern CSS and small ES modules.

## Yellow design

A separate yellow (#ffd600) design built with Astro lives in [`yellow/`](yellow/), with its own `package.json` and README. The Pages workflow builds both sites: this one at the root and the yellow one at `/yellow/`.

## Quick start (VS Code)

1. Install [Node.js](https://nodejs.org) 20 or newer.
2. Open this folder in VS Code and accept the recommended extensions (Prettier, ESLint, EditorConfig, shader syntax, GitHub Actions).
3. In the terminal:

   ```bash
   npm install
   npm run dev
   ```

   The site opens at http://localhost:5173 with hot reload.

You can also use **Terminal > Run Task > dev server**, and **Run and Debug > Debug in Chrome** (F5) once the dev server is running.

| Script            | What it does                                   |
| ----------------- | ---------------------------------------------- |
| `npm run dev`     | Local dev server with hot reload               |
| `npm run build`   | Production build into `dist/`                  |
| `npm run preview` | Serve the production build locally (port 4173) |
| `npm run lint`    | ESLint over all JavaScript                     |
| `npm run format`  | Prettier over the whole project                |

## Project structure

```
index.html                 all page content and SEO metadata (edit copy here)
public/                    static files copied as-is (favicon, robots.txt, og-image)
src/
  main.js                  boot sequence: loader, smooth scroll, UI, WebGL, animations
  styles/
    tokens.css             colours, fonts, spacing, light and dark theme variables
    base.css               reset, typography, buttons, loader, cursor, nav, menu
    sections.css           one block per page section, plus responsive rules
  js/
    animations.js          every scroll-driven animation (ScrollTrigger, SplitText)
    scroll.js              Lenis smooth scrolling and in-page anchor links
    three/
      objects.js           procedural 3D objects (balloon 3, H, i and service icons)
      materials.js         chrome, crinkled foil, balloon and iridescent materials
      hero-scene.js        floating hero constellation (parallax, scroll, hover pokes)
      follower.js          3D object that follows the cursor over the services list
      reel.js              "three horizons" fragment shader for the reel section
    ui/                    loader, cursor, magnetic buttons, tilt cards, nav, clocks,
                           FAQ accordion, contact form, work hover preview
.vscode/                   recommended extensions, settings, debug and task configs
.github/workflows/         GitHub Pages deploy on every push to main
```

## How the effects work

- **Hero objects.** Twelve objects are generated in code (no model files): balloon letters for 3, H and i, plus a glossy icon for each service. Each sits at a depth, so moving the mouse shifts near objects more than far ones (true 3D parallax). Scrolling lifts and scatters them at different speeds, and hovering one gives it a spin. Positions live in the `LANDSCAPE` and `PORTRAIT` tables at the top of `hero-scene.js`.
- **Reel.** A sticky frame grows from a small card to full screen while three planet horizons rise (`reel.js`). Drop in a real showreel later by replacing the canvas with a `<video>`.
- **Theme.** The page shifts between paper and ink as sections cross the middle of the screen. Each section declares `data-theme="light"` or `data-theme="dark"`.
- **Kinetic type.** `data-spread` headings start with letters spread apart and close up on scroll, `data-lines` headings rise line by line, `data-words` paragraphs light up word by word, and `data-reveal` elements fade up.
- **Parallax.** Any element with `data-speed="0.2"` (positive or negative) drifts relative to its section.
- **Method.** The three horizons cards scroll sideways while the section is pinned (desktop), with suns rising inside each card.

Everything respects `prefers-reduced-motion`: smooth scrolling, scrubbed animations and the loader are skipped, and the 3D scene holds still. Without WebGL the hero falls back to a CSS gradient.

## Editing content

- **Copy** lives in `index.html`, section by section, with comments marking each block.
- **Work rows** use `data-preview="Client|service label|hue"`. The hue (0 to 360) colours the hover card.
- **Services** use `data-object` to choose which 3D object follows the cursor: `cursor`, `magnifier`, `sparkle`, `bubble` or `arrow` (any key in `BUILDERS` in `objects.js` works).
- **Client ticker** is a plain list in the clients section. Swap names for SVG logos whenever they are ready.

## Contact form

By default the form opens a pre-filled email to info@3h-i.com, so it works with no backend. To post submissions to a form service (Formspree, Basin, Getform) or your own API, copy `.env.example` to `.env` and set:

```
VITE_FORM_ENDPOINT=https://formspree.io/f/your-id
```

The form sends JSON with `name`, `email`, `company`, `website`, `topics` and `message`.

## Deploying

- **GitHub Pages:** push to `main`, then in the repository go to **Settings > Pages** and set **Source** to **GitHub Actions**. The workflow in `.github/workflows/deploy.yml` lints, builds and publishes `dist/`.
- **Netlify, Vercel or Cloudflare Pages:** build command `npm run build`, output directory `dist`.

The build uses relative paths (`base: './'`), so it works on a custom domain or a sub-path.

## Open items

- Case study pages for the work list (rows are ready to become links).
- Real client logos for the ticker.
- Optional showreel video for the reel section.
- Analytics (the current site uses Google Tag Manager; add the container snippet to `index.html` if you keep it).

## Credits

Interaction patterns (object-led hero, kinetic type, sticky reel, parallax) were inspired by [noth.in](https://www.noth.in/). All code, copy and visuals in this repository are original.

Fonts: Geist and Geist Mono (SIL Open Font License), Instrument Serif (SIL Open Font License), self-hosted through Fontsource. Libraries: Three.js and Lenis (MIT), GSAP (GreenSock standard no-charge license).
