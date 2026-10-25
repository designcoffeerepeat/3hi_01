import '@fontsource-variable/geist';
import '@fontsource-variable/geist-mono';
import '@fontsource/instrument-serif/400.css';
import '@fontsource/instrument-serif/400-italic.css';
import './styles/main.css';

import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { initSmoothScroll, initAnchors } from './js/scroll.js';
import { initTheme, heroIntro, initScrollMotion } from './js/animations.js';
import { createLoader } from './js/ui/loader.js';
import { initCursor } from './js/ui/cursor.js';
import { initMagnetic } from './js/ui/magnetic.js';
import { initTilt } from './js/ui/tilt.js';
import { initNav } from './js/ui/nav.js';
import { initClocks } from './js/ui/clocks.js';
import { initFaq } from './js/ui/faq.js';
import { initForm } from './js/ui/form.js';
import { initWorkPreview } from './js/ui/preview.js';

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;

function hasWebGL() {
  try {
    const c = document.createElement('canvas');
    return Boolean(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

/** Run a setup step without letting one failure take the whole page down. */
function safely(label, fn) {
  try {
    return fn();
  } catch (err) {
    console.warn(`[3h-i] ${label} failed`, err);
    return null;
  }
}

async function boot() {
  // Always start at the top so the intro plays and scroll animations measure cleanly.
  // A #hash in the URL is honoured once everything is set up.
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  window.scrollTo(0, 0);

  const loader = createLoader({ reduced });
  const lenis = reduced ? null : initSmoothScroll();

  initAnchors(lenis);
  initNav(lenis);
  initClocks();
  initFaq();
  initForm();
  initCursor();
  initMagnetic();
  initTilt();
  initWorkPreview();

  loader.track(document.fonts?.ready);

  // Three.js is code-split and loaded in parallel with the fonts.
  let hero = null;
  let reel = null;
  if (hasWebGL()) {
    const three = await loader.track(import('./js/three/index.js')).catch(() => null);
    if (three) {
      hero = safely('hero scene', () =>
        three.createHeroScene(document.querySelector('.hero__canvas'), { reduced })
      );
      reel = safely('reel', () =>
        three.createReel(document.querySelector('.reel__canvas'), { reduced })
      );
      if (finePointer && !reduced) {
        safely('services follower', () =>
          three.createFollower(document.querySelector('.follower'), [
            ...document.querySelectorAll('.service[data-object]'),
          ])
        );
      }
    }
  } else {
    document.documentElement.classList.add('no-webgl');
  }

  await loader.finish();

  heroIntro(hero, { reduced });
  if (!reduced) initScrollMotion({ hero, reel, lenis });
  // created after the pinned section so its pin spacing is taken into account
  initTheme();
  ScrollTrigger.refresh();

  const target =
    location.hash.length > 1 && safely('hash', () => document.querySelector(location.hash));
  if (target) {
    if (lenis) lenis.scrollTo(target, { immediate: true });
    else target.scrollIntoView();
  }
}

boot();
