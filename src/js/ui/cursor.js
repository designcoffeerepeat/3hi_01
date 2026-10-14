import { gsap } from 'gsap';

const INTERACTIVE = 'a, button, summary, label, input, textarea, [data-cursor]';

/** Blend-mode dot cursor that grows over links and shows a label over [data-cursor] items. */
export function initCursor() {
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  const el = document.querySelector('.cursor');
  if (!el) return;
  const label = el.querySelector('[data-cursor-label]');
  const xTo = gsap.quickTo(el, 'x', { duration: 0.18, ease: 'power3' });
  const yTo = gsap.quickTo(el, 'y', { duration: 0.18, ease: 'power3' });

  window.addEventListener(
    'pointermove',
    (e) => {
      xTo(e.clientX);
      yTo(e.clientY);
      el.classList.add('is-visible');
    },
    { passive: true }
  );
  document.documentElement.addEventListener('pointerleave', () =>
    el.classList.remove('is-visible')
  );

  document.addEventListener('pointerover', (e) => {
    const target = e.target.closest(INTERACTIVE);
    const labelled = e.target.closest('[data-cursor]');
    el.classList.toggle('is-label', Boolean(labelled));
    el.classList.toggle('is-hover', Boolean(target) && !labelled);
    if (labelled) label.textContent = labelled.dataset.cursor;
  });
}
