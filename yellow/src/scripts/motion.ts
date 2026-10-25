import Lenis from 'lenis';

/**
 * Site-wide motion: smooth scrolling, reveal-on-scroll and subtle parallax.
 * Everything here switches off when the visitor prefers reduced motion.
 */
const still = matchMedia('(prefers-reduced-motion: reduce)').matches;

export const lenis = still ? null : new Lenis({ lerp: 0.1, anchors: { offset: -20 } });

export function scrollToEl(el: Element, offset = -90) {
  if (lenis) lenis.scrollTo(el as HTMLElement, { offset });
  else el.scrollIntoView({ block: 'start' });
}

// --- reveal ---------------------------------------------------------------
const io = new IntersectionObserver(
  (entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      e.target.classList.add('is-in');
      io.unobserve(e.target);
    }
  },
  { rootMargin: '0px 0px -10% 0px' }
);
document.querySelectorAll('[data-reveal]').forEach((el) => io.observe(el));

// --- parallax ---------------------------------------------------------------
// data-speed="0.2" drifts an element by 20% of its distance from the
// viewport centre. Keep values small (about -0.3 to 0.3) for a subtle feel.
const layers = [...document.querySelectorAll<HTMLElement>('[data-speed]')].map((el) => ({
  el,
  speed: parseFloat(el.dataset.speed || '0'),
}));

let velocity = 0;
function frame(time: number) {
  lenis?.raf(time);
  if (!still) {
    const vh = innerHeight;
    for (const { el, speed } of layers) {
      const r = el.parentElement!.getBoundingClientRect();
      if (r.bottom < -vh || r.top > vh * 2) continue;
      const offset = (r.top + r.height / 2 - vh / 2) * speed;
      el.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0)`;
    }
    // Scroll velocity, eased, exposed as a CSS variable for playful skews.
    const v = lenis ? lenis.velocity : 0;
    velocity += (v - velocity) * 0.1;
    document.documentElement.style.setProperty('--velocity', velocity.toFixed(3));
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
