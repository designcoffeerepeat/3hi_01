import { gsap } from 'gsap';

/** 3D tilt toward the pointer for [data-tilt] cards; inner layers use translateZ for depth. */
export function initTilt() {
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  document.querySelectorAll('[data-tilt]').forEach((card) => {
    const rx = gsap.quickTo(card, 'rotationX', { duration: 0.6, ease: 'power3' });
    const ry = gsap.quickTo(card, 'rotationY', { duration: 0.6, ease: 'power3' });
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      ry(((e.clientX - r.left) / r.width - 0.5) * 18);
      rx(-((e.clientY - r.top) / r.height - 0.5) * 18);
    });
    card.addEventListener('pointerleave', () => {
      rx(0);
      ry(0);
    });
  });
}
