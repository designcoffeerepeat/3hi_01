import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/** Lenis smooth scrolling, driven by GSAP's ticker so ScrollTrigger stays in sync. */
export function initSmoothScroll() {
  const lenis = new Lenis({ lerp: 0.085, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
  return lenis;
}

/** In-page anchor links glide to their section and move focus for keyboard users. */
export function initAnchors(lenis) {
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;
    const id = link.getAttribute('href');
    if (id === '#') return;
    const target = document.querySelector(id === '#top' ? '#top' : id);
    if (!target) return;
    e.preventDefault();
    const done = () => {
      if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
      history.replaceState(null, '', id);
    };
    if (lenis) {
      lenis.scrollTo(id === '#top' ? 0 : target, {
        duration: 1.6,
        easing: (t) => 1 - Math.pow(1 - t, 4),
        onComplete: done,
      });
    } else {
      target.scrollIntoView({ behavior: 'smooth' });
      done();
    }
  });
}
